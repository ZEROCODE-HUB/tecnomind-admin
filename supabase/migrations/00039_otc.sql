-- =====================================================================
-- 00039: Mesa OTC manual (compra/venta de USDT contra saldo fiat)
--
-- Modelo (espejo de depósitos/retiros; el saldo del usuario sigue siendo
-- FIAT, la cripto se mueve POR FUERA y solo se guardan datos):
--
--   COMPRA (buy)  el usuario compra USDT con su saldo:
--     - la app deriva la cantidad de USDT; el SERVIDOR recalcula el fiat
--       (fuente de verdad) = amount_crypto * unit_rate * (1 + comisión%).
--     - RETENCIÓN INMEDIATA: transacción 'otc_buy' completed + reconcile
--       (baja el saldo ya), igual que un retiro.
--     - el usuario pega la dirección de SU wallet (para recibir los USDT).
--     - admin COMPLETA (envió los USDT a mano) o RECHAZA (revierte -> devuelve).
--
--   VENTA (sell)  el usuario vende USDT y recibe saldo:
--     - neto a acreditar = amount_crypto * unit_rate * (1 - comisión%).
--     - la app le muestra la wallet de LA EMPRESA; el usuario envía los USDT
--       y sube comprobante/hash (obligatorio). NO se toca el saldo aún.
--     - admin COMPLETA (verificó la llegada) -> transacción 'otc_sell' completed
--       + reconcile (acredita). RECHAZA -> sin efecto en saldo.
--
-- Config (una sola fila, USDT): precio de 1 USDT en fiat, comisión %, wallet
-- de la empresa, red, mín/máx. La edita el operador con permiso ('otc','update').
-- Todo el dinero va por RPC SECURITY DEFINER; el cliente solo SELECT de lo suyo.
-- =====================================================================

-- 1) Tipos de transacción OTC (idempotente) -----------------------------
insert into public.transaction_types (id, code, name, description, category, is_active, created_at)
select gen_random_uuid(), 'otc_buy', 'Compra OTC', 'Compra de cripto (OTC)', 'expense', true, now()
where not exists (select 1 from public.transaction_types where code = 'otc_buy');

insert into public.transaction_types (id, code, name, description, category, is_active, created_at)
select gen_random_uuid(), 'otc_sell', 'Venta OTC', 'Venta de cripto (OTC)', 'income', true, now()
where not exists (select 1 from public.transaction_types where code = 'otc_sell');

-- 2) Configuración OTC (por activo; arrancamos con USDT) -----------------
create table if not exists public.otc_config (
  asset_code         varchar(20) primary key,          -- 'USDT'
  label              varchar(60) not null default 'USDT',
  unit_rate          numeric(18,6) not null,           -- precio de 1 USDT en fiat
  commission_percent numeric(6,3)  not null default 0, -- % de la mesa
  company_wallet     text,                             -- wallet de la empresa (ventas)
  network            varchar(40),                      -- ej: TRC20, ERC20
  min_amount         numeric(18,6) not null default 0, -- en cripto
  max_amount         numeric(18,6),                    -- en cripto (null = sin tope)
  is_active          boolean not null default true,
  updated_by         uuid references public.users(id),
  updated_at         timestamptz not null default now()
);
alter table public.otc_config enable row level security;

drop policy if exists otc_cfg_select on public.otc_config;
create policy otc_cfg_select on public.otc_config
  for select to authenticated
  using (is_active or public.has_backoffice_permission('otc','read'));

drop policy if exists otc_cfg_manage on public.otc_config;
create policy otc_cfg_manage on public.otc_config
  for all to authenticated
  using (public.has_backoffice_permission('otc','update'))
  with check (public.has_backoffice_permission('otc','update'));

grant select, insert, update, delete on public.otc_config to authenticated;

-- Fila inicial USDT (idempotente; el operador ajusta valores reales)
insert into public.otc_config (asset_code, label, unit_rate, commission_percent, network, min_amount, is_active)
select 'USDT', 'USDT', 1000, 1.0, 'TRC20', 0, true
where not exists (select 1 from public.otc_config where asset_code = 'USDT');

-- 3) Órdenes OTC --------------------------------------------------------
create table if not exists public.otc_orders (
  id                 uuid primary key default gen_random_uuid(),
  account_id         uuid not null references public.accounts(id),
  user_id            uuid not null references public.users(id),
  side               varchar(4) not null check (side in ('buy','sell')),
  asset_code         varchar(20) not null default 'USDT',
  amount_crypto      numeric(18,6) not null check (amount_crypto > 0),
  unit_rate          numeric(18,6) not null,   -- bloqueada al crear
  commission_percent numeric(6,3)  not null,   -- bloqueada al crear
  commission_amount  numeric(15,2) not null,   -- fiat
  fiat_amount        numeric(15,2) not null,   -- buy: total debitado; sell: neto a acreditar
  counterparty_wallet text,                    -- buy: wallet del usuario; sell: wallet de la empresa (snapshot)
  status             varchar(12) not null default 'pending' check (status in ('pending','completed','rejected')),
  proof_path         text,                     -- venta: hash/captura del envío
  user_comment       text,
  admin_comment      text,
  transaction_id     uuid references public.transactions(id),
  reviewed_by        uuid references public.users(id),
  created_at         timestamptz not null default now(),
  resolved_at        timestamptz
);
alter table public.otc_orders enable row level security;

drop policy if exists otc_orders_select on public.otc_orders;
create policy otc_orders_select on public.otc_orders
  for select to authenticated
  using (user_id = auth.uid() or public.has_backoffice_permission('otc','read'));

grant select on public.otc_orders to authenticated;

create index if not exists idx_otc_orders_status on public.otc_orders (status, side, created_at desc);
create index if not exists idx_otc_orders_user   on public.otc_orders (user_id, created_at desc);

-- 4) RPC: crear COMPRA (retención inmediata del fiat) -------------------
create or replace function public.create_otc_buy(
  p_amount_crypto numeric,
  p_wallet text,
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

  select * into c from otc_config where asset_code = 'USDT' and is_active;
  if not found then
    raise exception 'OTC_UNAVAILABLE: La mesa OTC no está disponible';
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
          'Compra OTC ' || p_amount_crypto || ' USDT',
          'completed', v_total, v_ref,
          jsonb_build_object('otc','buy','review','pending','amount_crypto',p_amount_crypto), now(), now())
  returning id into v_tx_id;

  perform reconcile_account_balance(v_account_id);

  insert into otc_orders (account_id, user_id, side, asset_code, amount_crypto,
                          unit_rate, commission_percent, commission_amount, fiat_amount,
                          counterparty_wallet, status, user_comment, transaction_id)
  values (v_account_id, auth.uid(), 'buy', 'USDT', p_amount_crypto,
          c.unit_rate, c.commission_percent, v_comm, v_total,
          trim(p_wallet), 'pending', p_comment, v_tx_id)
  returning id into v_order_id;

  return v_order_id;
end;
$$;

-- 5) RPC: crear VENTA (sin tocar saldo; se acredita al completar) --------
create or replace function public.create_otc_sell(
  p_amount_crypto numeric,
  p_proof_path text,
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

  select * into c from otc_config where asset_code = 'USDT' and is_active;
  if not found then
    raise exception 'OTC_UNAVAILABLE: La mesa OTC no está disponible';
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
  values (v_account_id, auth.uid(), 'sell', 'USDT', p_amount_crypto,
          c.unit_rate, c.commission_percent, v_comm, v_net,
          trim(c.company_wallet), 'pending', trim(p_proof_path), p_comment)
  returning id into v_order_id;

  return v_order_id;
end;
$$;

-- 6) RPC backoffice: COMPLETAR orden ------------------------------------
create or replace function public.complete_otc_order(
  p_order_id uuid, p_admin_comment text default null
) returns void
  language plpgsql security definer set search_path to 'public'
as $$
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
    -- Acreditar el neto en fiat al usuario.
    select id into v_type_id from transaction_types where code = 'otc_sell';
    v_ref := 'OTS-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text,1,8));
    insert into transactions (transaction_type_id, to_account_id, amount, currency, concept,
                              status, net_amount, reference_number, processed_by, metadata, created_at, completed_at)
    values (v_type_id, o.account_id, o.fiat_amount, 'ARS',
            'Venta OTC ' || o.amount_crypto || ' USDT',
            'completed', o.fiat_amount, v_ref, auth.uid()::text,
            jsonb_build_object('otc','sell','order_id',o.id,'amount_crypto',o.amount_crypto), now(), now())
    returning id into v_tx_id;
    perform reconcile_account_balance(o.account_id);
  else
    -- Compra: el fiat ya se debitó al crear; solo confirmamos.
    v_tx_id := o.transaction_id;
    update transactions
      set processed_by = auth.uid()::text,
          metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('review','completed')
    where id = o.transaction_id;
  end if;

  update otc_orders
    set status='completed', admin_comment=p_admin_comment, transaction_id=coalesce(o.transaction_id, v_tx_id),
        reviewed_by=auth.uid(), resolved_at=now()
  where id = o.id;

  perform enqueue_notification(o.user_id, 'otc_completed',
    jsonb_build_object('side', o.side, 'amount_crypto', o.amount_crypto,
                       'fiat_amount', o.fiat_amount, 'comment', p_admin_comment), v_tx_id);
end;
$$;

-- 7) RPC backoffice: RECHAZAR orden -------------------------------------
create or replace function public.reject_otc_order(
  p_order_id uuid, p_admin_comment text default null
) returns void
  language plpgsql security definer set search_path to 'public'
as $$
declare o public.otc_orders;
begin
  if not public.has_backoffice_permission('otc','update') then
    raise exception 'FORBIDDEN: Sin permiso para resolver operaciones OTC';
  end if;

  select * into o from otc_orders where id = p_order_id for update;
  if not found or o.status <> 'pending' then
    raise exception 'INVALID_STATE: Operación inexistente o no pendiente';
  end if;

  if o.side = 'buy' and o.transaction_id is not null then
    -- Revertir la retención del fiat (devuelve el saldo).
    update transactions
      set status='reversed', failure_reason=coalesce(p_admin_comment,'Compra OTC rechazada'),
          metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('review','rejected')
    where id = o.transaction_id;
    perform reconcile_account_balance(o.account_id);
  end if;

  update otc_orders
    set status='rejected', admin_comment=p_admin_comment, reviewed_by=auth.uid(), resolved_at=now()
  where id = o.id;

  perform enqueue_notification(o.user_id, 'otc_rejected',
    jsonb_build_object('side', o.side, 'amount_crypto', o.amount_crypto,
                       'fiat_amount', o.fiat_amount, 'comment', p_admin_comment), o.transaction_id);
end;
$$;

-- 8) Permisos de ejecución ----------------------------------------------
grant execute on function public.create_otc_buy(numeric, text, text) to authenticated;
grant execute on function public.create_otc_sell(numeric, text, text) to authenticated;
grant execute on function public.complete_otc_order(uuid, text) to authenticated;
grant execute on function public.reject_otc_order(uuid, text) to authenticated;

-- 9) Plantillas de notificación OTC (idempotente; entrega aún bloqueada) -
insert into public.notification_types
  (code, name, description, priority, template_title, template_message, default_enabled)
values
  ('otc_completed', 'Operación OTC completada', 'La operación OTC del cliente se completó', 2,
   '{"es":"Operación OTC completada","en":"OTC order completed"}'::jsonb,
   '{"es":"Tu operación OTC de {{amount_crypto}} USDT fue completada.","en":"Your OTC order of {{amount_crypto}} USDT was completed."}'::jsonb,
   true),
  ('otc_rejected', 'Operación OTC rechazada', 'La operación OTC del cliente fue rechazada', 2,
   '{"es":"Operación OTC rechazada","en":"OTC order rejected"}'::jsonb,
   '{"es":"Tu operación OTC de {{amount_crypto}} USDT fue rechazada.","en":"Your OTC order of {{amount_crypto}} USDT was rejected."}'::jsonb,
   true)
on conflict (code) do update set
  name = excluded.name, description = excluded.description,
  template_title = excluded.template_title, template_message = excluded.template_message;
