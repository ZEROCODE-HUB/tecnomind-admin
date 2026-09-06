-- =====================================================================
-- 00036: Depósitos y retiros con aprobación del backoffice
--
-- Flujo:
--   DEPÓSITO  usuario crea solicitud (monto + método + comprobante) -> pendiente
--             admin aprueba -> transacción 'deposit' completed + reconcile (sube saldo)
--             admin rechaza -> queda rechazada (sin efecto en saldo)
--   RETIRO    usuario crea solicitud (monto + destino) -> RETENCIÓN INMEDIATA:
--             se crea la transacción 'withdrawal' completed y se reconcilia
--             (baja el saldo ya). Admin aprueba -> se confirma. Admin rechaza ->
--             la transacción pasa a 'reversed' + reconcile (devuelve el saldo).
--
-- Todo el movimiento de dinero va por RPC SECURITY DEFINER; el cliente NO puede
-- insertar/actualizar solicitudes ni tocar saldos (solo SELECT de lo propio).
-- El saldo se recalcula con reconcile_account_balance (suma de transacciones
-- 'completed'), igual que process_transfer. Aprobar/rechazar exige permiso de
-- backoffice ('movimientos','update').
--
-- Notas de entrega de notificaciones (pendientes, NO bloquean este esquema):
--   * enqueue_notification invoca un worker cuya URL apunta a OTRO proyecto
--     (mzxhyjgbbabnughknrxc); hay que corregirla al proyecto fiat.
--   * Faltan las plantillas notification_templates para deposit_*/withdrawal_*.
--   * Push (OneSignal) aún sin app id. El encolado (pgmq.send) sí funciona.
--   * Al admin se le "avisa" con la bandeja de solicitudes pendientes del
--     backoffice (consulta), no con enqueue_notification.
-- =====================================================================

-- 1) Tipo de transacción "withdrawal" (idempotente) ---------------------
insert into public.transaction_types (id, code, name, description, category, is_active, created_at)
select gen_random_uuid(), 'withdrawal', 'Retiro', 'Retiro de dinero', 'expense', true, now()
where not exists (select 1 from public.transaction_types where code = 'withdrawal');

-- 2) Métodos de pago (configurables desde el admin) ---------------------
create table if not exists public.payment_methods (
  id             uuid primary key default gen_random_uuid(),
  label          varchar(120) not null,           -- nombre visible ("Transferencia BBVA", "QR Mercado Pago")
  image_path     text,                             -- QR o foto (bucket 'documents' de Storage)
  bank_name      varchar(120),
  holder_name    varchar(200),
  account_number varchar(34),                      -- CBU/CVU o nro de cuenta
  alias          varchar(50),
  instructions   text,                             -- comentario/indicaciones para el usuario
  is_active      boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.payment_methods enable row level security;

drop policy if exists pm_select on public.payment_methods;
create policy pm_select on public.payment_methods
  for select to authenticated
  using (is_active or public.has_backoffice_permission('movimientos','read'));

drop policy if exists pm_manage on public.payment_methods;
create policy pm_manage on public.payment_methods
  for all to authenticated
  using (public.has_backoffice_permission('movimientos','update'))
  with check (public.has_backoffice_permission('movimientos','update'));

grant select, insert, update, delete on public.payment_methods to authenticated;

-- 3) Solicitudes de fondeo (depósito/retiro) ----------------------------
create table if not exists public.funding_requests (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.accounts(id),
  user_id           uuid not null references public.users(id),
  kind              varchar(12) not null check (kind in ('deposit','withdrawal')),
  amount            numeric(15,2) not null check (amount > 0),
  status            varchar(12) not null default 'pending' check (status in ('pending','approved','rejected')),
  payment_method_id uuid references public.payment_methods(id),   -- depósito
  destination       jsonb,                                        -- retiro: {cbu, alias, bank, holder}
  proof_path        text,                                         -- depósito: comprobante del usuario / retiro: comprobante del admin
  user_comment      text,
  admin_comment     text,
  transaction_id    uuid references public.transactions(id),
  reviewed_by       uuid references public.users(id),
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz
);
alter table public.funding_requests enable row level security;

drop policy if exists fr_select on public.funding_requests;
create policy fr_select on public.funding_requests
  for select to authenticated
  using (user_id = auth.uid() or public.has_backoffice_permission('movimientos','read'));

-- Sin INSERT/UPDATE/DELETE directos: todo pasa por los RPC SECURITY DEFINER.
grant select on public.funding_requests to authenticated;

create index if not exists idx_funding_requests_status on public.funding_requests (status, kind, created_at desc);
create index if not exists idx_funding_requests_user   on public.funding_requests (user_id, created_at desc);

-- 4) RPC: crear solicitud de DEPÓSITO -----------------------------------
create or replace function public.create_deposit_request(
  p_amount numeric,
  p_payment_method_id uuid default null,
  p_proof_path text default null,
  p_comment text default null
) returns uuid
  language plpgsql security definer set search_path to 'public'
as $$
declare
  v_account_id uuid;
  v_request_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT: El monto debe ser mayor a 0';
  end if;

  select id into v_account_id
  from accounts where user_id = auth.uid() and status = 'active'
  order by created_at limit 1;
  if v_account_id is null then
    raise exception 'ACCOUNT_NOT_FOUND: No se encontró una cuenta activa';
  end if;

  if p_payment_method_id is not null
     and not exists (select 1 from payment_methods where id = p_payment_method_id and is_active) then
    raise exception 'PAYMENT_METHOD_INVALID: Método de pago inválido';
  end if;

  insert into funding_requests (account_id, user_id, kind, amount, status,
                                payment_method_id, proof_path, user_comment)
  values (v_account_id, auth.uid(), 'deposit', p_amount, 'pending',
          p_payment_method_id, p_proof_path, p_comment)
  returning id into v_request_id;

  return v_request_id;
end;
$$;

-- 5) RPC: crear solicitud de RETIRO (retención inmediata) ---------------
create or replace function public.create_withdrawal_request(
  p_amount numeric,
  p_destination jsonb default '{}'::jsonb,
  p_comment text default null
) returns uuid
  language plpgsql security definer set search_path to 'public'
as $$
declare
  v_account_id uuid;
  v_balance numeric;
  v_type_id uuid;
  v_tx_id uuid;
  v_request_id uuid;
  v_ref varchar;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT: El monto debe ser mayor a 0';
  end if;

  select id, balance into v_account_id, v_balance
  from accounts where user_id = auth.uid() and status = 'active'
  order by created_at limit 1
  for update;
  if v_account_id is null then
    raise exception 'ACCOUNT_NOT_FOUND: No se encontró una cuenta activa';
  end if;
  if v_balance < p_amount then
    raise exception 'INSUFFICIENT_BALANCE: Saldo insuficiente. Disponible: %, Requerido: %', v_balance, p_amount;
  end if;

  select id into v_type_id from transaction_types where code = 'withdrawal';
  if v_type_id is null then
    raise exception 'TYPE_NOT_FOUND: Falta el tipo de transacción withdrawal';
  end if;

  v_ref := 'WTH-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text,1,8));

  -- Retención inmediata: transacción 'completed' (baja el saldo al reconciliar).
  insert into transactions (transaction_type_id, from_account_id, amount, currency, concept,
                            status, net_amount, reference_number, metadata, created_at, completed_at)
  values (v_type_id, v_account_id, p_amount, 'ARS', coalesce(nullif(p_comment,''), 'Retiro'),
          'completed', p_amount, v_ref,
          jsonb_build_object('funding','withdrawal','review','pending'), now(), now())
  returning id into v_tx_id;

  perform reconcile_account_balance(v_account_id);

  insert into funding_requests (account_id, user_id, kind, amount, status,
                                destination, user_comment, transaction_id)
  values (v_account_id, auth.uid(), 'withdrawal', p_amount, 'pending',
          coalesce(p_destination,'{}'::jsonb), p_comment, v_tx_id)
  returning id into v_request_id;

  return v_request_id;
end;
$$;

-- 6) RPC backoffice: aprobar DEPÓSITO -----------------------------------
create or replace function public.approve_deposit_request(
  p_request_id uuid, p_admin_comment text default null
) returns void
  language plpgsql security definer set search_path to 'public'
as $$
declare
  r public.funding_requests;
  v_type_id uuid;
  v_tx_id uuid;
  v_ref varchar;
begin
  if not public.has_backoffice_permission('movimientos','update') then
    raise exception 'FORBIDDEN: Sin permiso para resolver solicitudes';
  end if;

  select * into r from funding_requests where id = p_request_id for update;
  if not found or r.kind <> 'deposit' or r.status <> 'pending' then
    raise exception 'INVALID_STATE: Solicitud inexistente o no pendiente';
  end if;

  select id into v_type_id from transaction_types where code = 'deposit';
  v_ref := 'DEP-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text,1,8));

  insert into transactions (transaction_type_id, to_account_id, amount, currency, concept,
                            status, net_amount, reference_number, processed_by, metadata, created_at, completed_at)
  values (v_type_id, r.account_id, r.amount, 'ARS', 'Depósito',
          'completed', r.amount, v_ref, auth.uid()::text,
          jsonb_build_object('funding','deposit','request_id', r.id), now(), now())
  returning id into v_tx_id;

  perform reconcile_account_balance(r.account_id);

  update funding_requests
    set status='approved', admin_comment=p_admin_comment, transaction_id=v_tx_id,
        reviewed_by=auth.uid(), resolved_at=now()
  where id = r.id;

  perform enqueue_notification(r.user_id, 'deposit_approved',
    jsonb_build_object('amount', r.amount, 'reference_number', v_ref, 'comment', p_admin_comment), v_tx_id);
end;
$$;

-- 7) RPC backoffice: rechazar DEPÓSITO ----------------------------------
create or replace function public.reject_deposit_request(
  p_request_id uuid, p_admin_comment text default null
) returns void
  language plpgsql security definer set search_path to 'public'
as $$
declare r public.funding_requests;
begin
  if not public.has_backoffice_permission('movimientos','update') then
    raise exception 'FORBIDDEN: Sin permiso para resolver solicitudes';
  end if;

  select * into r from funding_requests where id = p_request_id for update;
  if not found or r.kind <> 'deposit' or r.status <> 'pending' then
    raise exception 'INVALID_STATE: Solicitud inexistente o no pendiente';
  end if;

  update funding_requests
    set status='rejected', admin_comment=p_admin_comment, reviewed_by=auth.uid(), resolved_at=now()
  where id = r.id;

  perform enqueue_notification(r.user_id, 'deposit_rejected',
    jsonb_build_object('amount', r.amount, 'comment', p_admin_comment), null);
end;
$$;

-- 8) RPC backoffice: aprobar RETIRO (la retención ya bajó el saldo) ------
create or replace function public.approve_withdrawal_request(
  p_request_id uuid, p_admin_comment text default null, p_proof_path text default null
) returns void
  language plpgsql security definer set search_path to 'public'
as $$
declare r public.funding_requests;
begin
  if not public.has_backoffice_permission('movimientos','update') then
    raise exception 'FORBIDDEN: Sin permiso para resolver solicitudes';
  end if;

  select * into r from funding_requests where id = p_request_id for update;
  if not found or r.kind <> 'withdrawal' or r.status <> 'pending' then
    raise exception 'INVALID_STATE: Solicitud inexistente o no pendiente';
  end if;

  update transactions
    set processed_by = auth.uid()::text,
        metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('review','approved')
  where id = r.transaction_id;

  update funding_requests
    set status='approved', admin_comment=p_admin_comment,
        proof_path=coalesce(p_proof_path, proof_path), reviewed_by=auth.uid(), resolved_at=now()
  where id = r.id;

  perform enqueue_notification(r.user_id, 'withdrawal_approved',
    jsonb_build_object('amount', r.amount, 'comment', p_admin_comment), r.transaction_id);
end;
$$;

-- 9) RPC backoffice: rechazar RETIRO (revierte la retención) -------------
create or replace function public.reject_withdrawal_request(
  p_request_id uuid, p_admin_comment text default null
) returns void
  language plpgsql security definer set search_path to 'public'
as $$
declare r public.funding_requests;
begin
  if not public.has_backoffice_permission('movimientos','update') then
    raise exception 'FORBIDDEN: Sin permiso para resolver solicitudes';
  end if;

  select * into r from funding_requests where id = p_request_id for update;
  if not found or r.kind <> 'withdrawal' or r.status <> 'pending' then
    raise exception 'INVALID_STATE: Solicitud inexistente o no pendiente';
  end if;

  -- Revertir la retención: la transacción deja de contar y reconcile devuelve el saldo.
  update transactions
    set status='reversed', failure_reason=coalesce(p_admin_comment,'Retiro rechazado'),
        metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('review','rejected')
  where id = r.transaction_id;

  perform reconcile_account_balance(r.account_id);

  update funding_requests
    set status='rejected', admin_comment=p_admin_comment, reviewed_by=auth.uid(), resolved_at=now()
  where id = r.id;

  perform enqueue_notification(r.user_id, 'withdrawal_rejected',
    jsonb_build_object('amount', r.amount, 'comment', p_admin_comment), r.transaction_id);
end;
$$;

-- 10) Permisos de ejecución --------------------------------------------
grant execute on function public.create_deposit_request(numeric, uuid, text, text) to authenticated;
grant execute on function public.create_withdrawal_request(numeric, jsonb, text) to authenticated;
grant execute on function public.approve_deposit_request(uuid, text) to authenticated;
grant execute on function public.reject_deposit_request(uuid, text) to authenticated;
grant execute on function public.approve_withdrawal_request(uuid, text, text) to authenticated;
grant execute on function public.reject_withdrawal_request(uuid, text) to authenticated;
