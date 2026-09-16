-- =====================================================================
-- 00040: OTC multi-activo — el catálogo de criptos se administra desde el
-- admin (tabla otc_config, que ya es por asset_code). Se generalizan los RPC
-- de creación para recibir p_asset_code (default 'USDT' por compatibilidad).
-- El saldo del usuario sigue siendo UNA fiat; solo la lista de criptos es
-- configurable. complete/reject no cambian (cargan la orden y su asset).
-- =====================================================================

drop function if exists public.create_otc_buy(numeric, text, text);
drop function if exists public.create_otc_sell(numeric, text, text);

-- COMPRA (retención inmediata del fiat) ---------------------------------
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
          'Compra OTC ' || p_amount_crypto || ' ' || c.asset_code,
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

-- VENTA (sin tocar saldo; se acredita al completar) ---------------------
create or replace function public.create_otc_sell(
  p_amount_crypto numeric,
  p_proof_path text,
  p_asset_code text default 'USDT',
  p_comment text default null
) returns uuid
  language plpgsql security definer set search_path to 'public'
as $$
declare
  c public.otc_config;
  v_account_id uuid;
  v_base numeric; v_comm numeric; v_net numeric;
  v_order_id uuid;
begin
  if p_amount_crypto is null or p_amount_crypto <= 0 then
    raise exception 'INVALID_AMOUNT: La cantidad debe ser mayor a 0';
  end if;
  if coalesce(trim(p_proof_path),'') = '' then
    raise exception 'PROOF_REQUIRED: Falta el comprobante del envío';
  end if;

  select * into c from otc_config where asset_code = upper(coalesce(p_asset_code,'USDT')) and is_active;
  if not found then
    raise exception 'OTC_UNAVAILABLE: El activo no está disponible';
  end if;
  if coalesce(trim(c.company_wallet),'') = '' then
    raise exception 'NO_COMPANY_WALLET: La empresa no tiene wallet configurada';
  end if;
  if p_amount_crypto < c.min_amount or (c.max_amount is not null and p_amount_crypto > c.max_amount) then
    raise exception 'OUT_OF_RANGE: Cantidad fuera del rango permitido';
  end if;

  v_base := round(p_amount_crypto * c.unit_rate, 2);
  v_comm := round(v_base * c.commission_percent / 100.0, 2);
  v_net  := v_base - v_comm;

  select id into v_account_id
  from accounts where user_id = auth.uid() and status = 'active'
  order by created_at limit 1;
  if v_account_id is null then
    raise exception 'ACCOUNT_NOT_FOUND: No se encontró una cuenta activa';
  end if;

  insert into otc_orders (account_id, user_id, side, asset_code, amount_crypto,
                          unit_rate, commission_percent, commission_amount, fiat_amount,
                          counterparty_wallet, status, proof_path, user_comment)
  values (v_account_id, auth.uid(), 'sell', c.asset_code, p_amount_crypto,
          c.unit_rate, c.commission_percent, v_comm, v_net,
          trim(c.company_wallet), 'pending', trim(p_proof_path), p_comment)
  returning id into v_order_id;

  return v_order_id;
end;
$$;

grant execute on function public.create_otc_buy(numeric, text, text, text) to authenticated;
grant execute on function public.create_otc_sell(numeric, text, text, text) to authenticated;
