-- =====================================================================
-- 00059: Quitar "OTC" de todo lo que ve el usuario. El cliente pidió que la
-- feature se llame "Cambio asistido" y que NO aparezca la palabra "OTC" en la
-- plataforma. Los CÓDIGOS internos (transaction_types.code = otc_buy/otc_sell,
-- nombres de RPC, columnas) NO cambian: solo el TEXTO visible.
--
-- Toca:
--   1) transaction_types.name/description de otc_buy/otc_sell (título del
--      movimiento en la app).
--   2) transactions.concept existentes ("Compra OTC ..." / "Venta OTC ..."),
--      backfill para que el historial ya no muestre "OTC".
--   3) create_otc_buy y complete_otc_order: mismas funciones (misma firma y
--      lógica), solo cambia el string del concept. De paso, la venta usa
--      o.asset_code en vez de 'USDT' hardcodeado (correcto para multi-activo).
-- =====================================================================

-- 1) Títulos de los tipos (los ve el usuario en la lista de movimientos) -----
update public.transaction_types
   set name = 'Compra', description = 'Compra en Cambio asistido'
 where code = 'otc_buy';

update public.transaction_types
   set name = 'Venta', description = 'Venta en Cambio asistido'
 where code = 'otc_sell';

-- 2) Backfill de los movimientos ya existentes (subtítulo = concept) ---------
update public.transactions
   set concept = replace(concept, 'Compra OTC ', 'Compra ')
 where concept like 'Compra OTC %';

update public.transactions
   set concept = replace(concept, 'Venta OTC ', 'Venta ')
 where concept like 'Venta OTC %';

-- 3a) COMPRA — idéntica a 00040, solo cambia el texto del concept -----------
create or replace function public.create_otc_buy(
  p_amount_crypto numeric,
  p_wallet text,
  p_asset_code text default 'USDT',
  p_comment text default null
) returns uuid
  language plpgsql security definer set search_path to 'public'
as $$
declare
  c public.otc_config;
  v_account_id uuid;
  v_balance numeric;
  v_base numeric; v_comm numeric; v_total numeric;
  v_type_id uuid; v_tx_id uuid; v_order_id uuid; v_ref varchar;
begin
  if p_amount_crypto is null or p_amount_crypto <= 0 then
    raise exception 'INVALID_AMOUNT: La cantidad debe ser mayor a 0';
  end if;
  if coalesce(trim(p_wallet),'') = '' then
    raise exception 'WALLET_REQUIRED: Falta la dirección de tu wallet';
  end if;

  select * into c from otc_config where asset_code = upper(coalesce(p_asset_code,'USDT')) and is_active;
  if not found then
    raise exception 'OTC_UNAVAILABLE: El activo no está disponible';
  end if;
  if p_amount_crypto < c.min_amount or (c.max_amount is not null and p_amount_crypto > c.max_amount) then
    raise exception 'OUT_OF_RANGE: Cantidad fuera del rango permitido';
  end if;

  v_base  := round(p_amount_crypto * c.unit_rate, 2);
  v_comm  := round(v_base * c.commission_percent / 100.0, 2);
  v_total := v_base + v_comm;

  select id, balance into v_account_id, v_balance
  from accounts where user_id = auth.uid() and status = 'active'
  order by created_at limit 1 for update;
  if v_account_id is null then
    raise exception 'ACCOUNT_NOT_FOUND: No se encontró una cuenta activa';
  end if;
  if v_balance < v_total then
    raise exception 'INSUFFICIENT_BALANCE: Saldo insuficiente. Disponible: %, Requerido: %', v_balance, v_total;
  end if;

  select id into v_type_id from transaction_types where code = 'otc_buy';
  v_ref := 'OTB-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text,1,8));

  insert into transactions (transaction_type_id, from_account_id, amount, currency, concept,
                            status, net_amount, reference_number, metadata, created_at, completed_at)
  values (v_type_id, v_account_id, v_total, 'ARS',
          'Compra ' || p_amount_crypto || ' ' || c.asset_code,
          'completed', v_total, v_ref,
          jsonb_build_object('otc','buy','review','pending','asset',c.asset_code,'amount_crypto',p_amount_crypto), now(), now())
  returning id into v_tx_id;

  perform reconcile_account_balance(v_account_id);

  insert into otc_orders (account_id, user_id, side, asset_code, amount_crypto,
                          unit_rate, commission_percent, commission_amount, fiat_amount,
                          counterparty_wallet, status, user_comment, transaction_id)
  values (v_account_id, auth.uid(), 'buy', c.asset_code, p_amount_crypto,
          c.unit_rate, c.commission_percent, v_comm, v_total,
          trim(p_wallet), 'pending', p_comment, v_tx_id)
  returning id into v_order_id;

  return v_order_id;
end;
$$;

-- 3b) COMPLETAR — idéntica a 00042, cambia el texto del concept de la venta
--     y usa o.asset_code en vez de 'USDT' hardcodeado --------------------------
create or replace function public.complete_otc_order(p_order_id uuid, p_admin_comment text default null::text, p_tx_hash text default null::text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare o public.otc_orders; v_type_id uuid; v_tx_id uuid; v_ref varchar;
begin
  if not public.has_backoffice_permission('otc','update') then
    raise exception 'FORBIDDEN: Sin permiso para resolver operaciones OTC';
  end if;

  select * into o from otc_orders where id = p_order_id for update;
  if not found or o.status <> 'pending' then
    raise exception 'INVALID_STATE: Operación inexistente o no pendiente';
  end if;

  if o.side = 'sell' then
    select id into v_type_id from transaction_types where code = 'otc_sell';
    v_ref := 'OTS-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text,1,8));
    insert into transactions (transaction_type_id, to_account_id, amount, currency, concept,
                              status, net_amount, reference_number, processed_by, metadata, created_at, completed_at)
    values (v_type_id, o.account_id, o.fiat_amount, 'ARS',
            'Venta ' || o.amount_crypto || ' ' || o.asset_code,
            'completed', o.fiat_amount, v_ref, auth.uid()::text,
            jsonb_build_object('otc','sell','order_id',o.id,'amount_crypto',o.amount_crypto), now(), now())
    returning id into v_tx_id;
    perform reconcile_account_balance(o.account_id);
  else
    v_tx_id := o.transaction_id;
    update transactions
      set processed_by = auth.uid()::text,
          metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('review','completed')
    where id = o.transaction_id;
  end if;

  update otc_orders
    set status='completed', admin_comment=p_admin_comment,
        tx_hash = coalesce(nullif(p_tx_hash,''), tx_hash),
        transaction_id=coalesce(o.transaction_id, v_tx_id),
        reviewed_by=auth.uid(), resolved_at=now()
  where id = o.id;

  perform enqueue_notification(o.user_id, 'otc_completed',
    jsonb_build_object('side', o.side, 'amount_crypto', o.amount_crypto,
                       'fiat_amount', o.fiat_amount, 'comment', p_admin_comment), v_tx_id);
end;
$function$;
