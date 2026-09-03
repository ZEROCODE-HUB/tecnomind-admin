-- =====================================================================
-- El backoffice contra datos reales: clientes, verificacion y
-- cumplimiento
--
-- Hasta aca el admin leia de un store en memoria. Para conectarlo hacen
-- falta tres cosas que la base heredada no tiene:
--
--   1. Que un operador que NO es admin pueda leer los datos. Las
--      politicas heredadas (00008) abren users, accounts y transactions
--      solo con is_admin(); el rol Cumplimiento, que existe justamente
--      para revisar clientes, no podia leer ni un nombre. Se agregan
--      politicas paralelas basadas en has_backoffice_permission().
--
--   2. Que pueda ESCRIBIR sin romper 00018. Ahi se revoco UPDATE sobre
--      users y accounts para todo authenticated -- y un operador tambien
--      es authenticated. Relajar ese revoke reabriria el agujero de
--      Magnate (cualquiera editandose el rol o el saldo). Las escrituras
--      del backoffice van entonces por funciones SECURITY DEFINER que
--      verifican el permiso y dejan traza en backoffice_audit_log. El
--      GRANT por columna queda intacto.
--
--   3. Donde guardar el cumplimiento (listas restrictivas y
--      observaciones), que en Magnate no existia.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. verification_status: el CHECK heredado solo admitia tres valores
--    y la pantalla de verificacion maneja cuatro estados.
-- ---------------------------------------------------------------------
alter table public.users drop constraint if exists users_verification_status_check;
alter table public.users
  add constraint users_verification_status_check
  check (verification_status::text in ('pending','in_review','verified','rejected','suspended'));

comment on column public.users.verification_status is
  'pending | in_review | verified | rejected | suspended. Lo mueve backoffice_set_verification(), nunca el titular (ver 00018).';

-- ---------------------------------------------------------------------
-- 2. Lectura por permiso granular
--
-- No se tocan las politicas heredadas: is_admin() sigue valiendo. Estas
-- se suman (las politicas RLS se combinan con OR).
-- ---------------------------------------------------------------------
create or replace function public.puede_ver_clientes() returns boolean
  language sql stable
as $fn$
  select public.has_backoffice_permission('usuarios', 'read')
      or public.has_backoffice_permission('verificacion', 'read');
$fn$;

comment on function public.puede_ver_clientes() is
  'Lectura del padron de clientes: la tienen tanto Usuarios como Verificacion.';

drop policy if exists "Operadores con permiso ven todos los clientes" on public.users;
create policy "Operadores con permiso ven todos los clientes"
  on public.users for select to authenticated
  using (public.puede_ver_clientes());

drop policy if exists "Operadores con permiso ven todas las cuentas" on public.accounts;
create policy "Operadores con permiso ven todas las cuentas"
  on public.accounts for select to authenticated
  using (public.puede_ver_clientes());

drop policy if exists "Operadores con permiso ven los limites" on public.account_limits;
create policy "Operadores con permiso ven los limites"
  on public.account_limits for select to authenticated
  using (public.puede_ver_clientes());

drop policy if exists "Operadores con permiso ven las verificaciones" on public.kyc_verifications;
create policy "Operadores con permiso ven las verificaciones"
  on public.kyc_verifications for select to authenticated
  using (public.has_backoffice_permission('verificacion', 'read'));

drop policy if exists "Operadores con permiso ven los movimientos" on public.transactions;
create policy "Operadores con permiso ven los movimientos"
  on public.transactions for select to authenticated
  using (public.has_backoffice_permission('movimientos', 'read'));

-- ---------------------------------------------------------------------
-- 3. Cumplimiento: listas restrictivas y revision
-- ---------------------------------------------------------------------
create table if not exists public.compliance_lists (
  code        varchar(50) primary key,
  name        varchar(120) not null,
  description text,
  sort_order  integer not null default 0
);

comment on table public.compliance_lists is
  'Catalogo de listas restrictivas contra las que se chequea a un cliente.';

insert into public.compliance_lists (code, name, sort_order) values
  ('ofac', 'OFAC (SDN)',                1),
  ('onu',  'Consejo de Seguridad ONU',  2),
  ('ue',   'Union Europea',             3),
  ('uif',  'UIF (Argentina)',           4),
  ('pep',  'PEP / Funcionario publico', 5)
on conflict (code) do nothing;

create table if not exists public.compliance_reviews (
  user_id      uuid primary key references public.users(id) on delete cascade,
  status       varchar(20) not null default 'pending',
  notes        text not null default '',
  reviewed_by  uuid references public.users(id) on delete set null,
  reviewed_at  timestamptz,
  updated_at   timestamptz not null default now(),
  constraint compliance_reviews_status_check
    check (status in ('pending','in_review','pass','fail'))
);

comment on table public.compliance_reviews is
  'Estado de cumplimiento por cliente. Una fila por cliente, creada al primer chequeo.';

create table if not exists public.compliance_list_checks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  list_code  varchar(50) not null references public.compliance_lists(code),
  result     varchar(20) not null default 'pending',
  detail     text not null default '',
  checked_by uuid references public.users(id) on delete set null,
  checked_at timestamptz not null default now(),
  constraint compliance_list_checks_result_check
    check (result in ('pending','clear','match','in_review')),
  constraint compliance_list_checks_unico unique (user_id, list_code)
);

comment on table public.compliance_list_checks is
  'Resultado del cliente contra cada lista. Un upsert por (cliente, lista).';

create index if not exists compliance_list_checks_user_idx on public.compliance_list_checks (user_id);

alter table public.compliance_lists       enable row level security;
alter table public.compliance_reviews     enable row level security;
alter table public.compliance_list_checks enable row level security;

drop policy if exists "Operadores leen el catalogo de listas" on public.compliance_lists;
create policy "Operadores leen el catalogo de listas"
  on public.compliance_lists for select to authenticated using (true);

drop policy if exists "Lectura de cumplimiento con permiso" on public.compliance_reviews;
create policy "Lectura de cumplimiento con permiso"
  on public.compliance_reviews for select to authenticated
  using (public.has_backoffice_permission('verificacion', 'read'));

drop policy if exists "Lectura de chequeos con permiso" on public.compliance_list_checks;
create policy "Lectura de chequeos con permiso"
  on public.compliance_list_checks for select to authenticated
  using (public.has_backoffice_permission('verificacion', 'read'));

-- La escritura NO se abre por politica: va por las funciones de abajo,
-- que ademas auditan. Sin GRANT de INSERT/UPDATE no hay forma de tocar
-- estas tablas desde el navegador.
revoke insert, update, delete on public.compliance_reviews     from authenticated, anon;
revoke insert, update, delete on public.compliance_list_checks from authenticated, anon;
revoke all    on public.compliance_lists       from anon;
grant  select on public.compliance_lists       to authenticated;
grant  select on public.compliance_reviews     to authenticated;
grant  select on public.compliance_list_checks to authenticated;

-- ---------------------------------------------------------------------
-- 4. Auditoria: un solo lugar donde se escribe la traza
-- ---------------------------------------------------------------------
create or replace function public.backoffice_audit(
  p_action        varchar,
  p_resource_code varchar,
  p_target_type   varchar,
  p_target_id     text,
  p_before        jsonb default null,
  p_after         jsonb default null
) returns void
  language sql volatile security definer
  set search_path to 'public'
as $fn$
  insert into public.backoffice_audit_log
    (actor_id, action, resource_code, target_type, target_id, before_data, after_data)
  values (auth.uid(), p_action, p_resource_code, p_target_type, p_target_id, p_before, p_after);
$fn$;

revoke all on function public.backoffice_audit(varchar,varchar,varchar,text,jsonb,jsonb)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Mutadores del backoffice
--
-- Todos siguen el mismo patron: verificar permiso -> escribir -> auditar.
-- El permiso se comprueba DENTRO de la funcion porque SECURITY DEFINER
-- desactiva el RLS: si no se chequeara aca, no lo chequearia nadie.
-- ---------------------------------------------------------------------
create or replace function public.backoffice_set_verification(
  p_user_id uuid,
  p_status  varchar,
  p_notes   text default ''
) returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
declare
  v_antes varchar;
begin
  if not public.has_backoffice_permission('verificacion', 'update') then
    raise exception 'Sin permiso para modificar verificaciones' using errcode = '42501';
  end if;
  if p_status not in ('pending','in_review','verified','rejected') then
    raise exception 'Estado de verificacion invalido: %', p_status using errcode = '22023';
  end if;

  select verification_status into v_antes from public.users where id = p_user_id;
  if v_antes is null then
    raise exception 'El cliente no existe' using errcode = 'P0002';
  end if;

  update public.users set verification_status = p_status, updated_at = now()
   where id = p_user_id;

  -- Se refleja en kyc_verifications para que la revision manual quede en
  -- el mismo historial que la del proveedor.
  insert into public.kyc_verifications (user_id, provider, status, verified_at, payload)
  values (p_user_id, 'manual',
          case p_status
            when 'verified'  then 'approved'
            when 'rejected'  then 'rejected'
            when 'in_review' then 'in_review'
            else 'pending'
          end,
          case when p_status = 'verified' then now() end,
          jsonb_build_object('notes', p_notes, 'reviewed_by', auth.uid()));

  perform public.backoffice_audit('verification.update', 'verificacion', 'user', p_user_id::text,
                                  jsonb_build_object('verification_status', v_antes),
                                  jsonb_build_object('verification_status', p_status, 'notes', p_notes));
end;
$fn$;

create or replace function public.backoffice_set_account_status(
  p_user_id uuid,
  p_status  varchar,
  p_reason  text default ''
) returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
declare
  v_antes varchar;
begin
  if not public.has_backoffice_permission('usuarios', 'update') then
    raise exception 'Sin permiso para modificar cuentas' using errcode = '42501';
  end if;
  if p_status not in ('active','blocked','suspended','closed') then
    raise exception 'Estado de cuenta invalido: %', p_status using errcode = '22023';
  end if;

  select status into v_antes from public.accounts where user_id = p_user_id and is_primary;
  if v_antes is null then
    raise exception 'El cliente no tiene cuenta principal' using errcode = 'P0002';
  end if;

  update public.accounts
     set status = p_status, status_reason = nullif(p_reason, ''), updated_at = now()
   where user_id = p_user_id and is_primary;

  perform public.backoffice_audit('account.status', 'usuarios', 'account', p_user_id::text,
                                  jsonb_build_object('status', v_antes),
                                  jsonb_build_object('status', p_status, 'reason', p_reason));
end;
$fn$;

create or replace function public.backoffice_set_compliance(
  p_user_id uuid,
  p_status  varchar,
  p_notes   text default null
) returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
declare
  v_antes varchar;
begin
  if not public.has_backoffice_permission('verificacion', 'update') then
    raise exception 'Sin permiso para modificar cumplimiento' using errcode = '42501';
  end if;
  if p_status not in ('pending','in_review','pass','fail') then
    raise exception 'Estado de cumplimiento invalido: %', p_status using errcode = '22023';
  end if;

  select status into v_antes from public.compliance_reviews where user_id = p_user_id;

  insert into public.compliance_reviews (user_id, status, notes, reviewed_by, reviewed_at, updated_at)
  values (p_user_id, p_status, coalesce(p_notes, ''), auth.uid(), now(), now())
  on conflict (user_id) do update
    set status      = excluded.status,
        notes       = coalesce(p_notes, public.compliance_reviews.notes),
        reviewed_by = excluded.reviewed_by,
        reviewed_at = now(),
        updated_at  = now();

  perform public.backoffice_audit('compliance.update', 'verificacion', 'user', p_user_id::text,
                                  jsonb_build_object('status', v_antes),
                                  jsonb_build_object('status', p_status, 'notes', p_notes));
end;
$fn$;

create or replace function public.backoffice_set_list_check(
  p_user_id   uuid,
  p_list_code varchar,
  p_result    varchar,
  p_detail    text default ''
) returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
begin
  if not public.has_backoffice_permission('verificacion', 'update') then
    raise exception 'Sin permiso para modificar chequeos' using errcode = '42501';
  end if;
  if p_result not in ('pending','clear','match','in_review') then
    raise exception 'Resultado invalido: %', p_result using errcode = '22023';
  end if;

  insert into public.compliance_list_checks (user_id, list_code, result, detail, checked_by, checked_at)
  values (p_user_id, p_list_code, p_result, coalesce(p_detail, ''), auth.uid(), now())
  on conflict (user_id, list_code) do update
    set result     = excluded.result,
        detail     = excluded.detail,
        checked_by = excluded.checked_by,
        checked_at = now();

  perform public.backoffice_audit('compliance.list', 'verificacion', 'user', p_user_id::text,
                                  null,
                                  jsonb_build_object('list', p_list_code, 'result', p_result, 'detail', p_detail));
end;
$fn$;

grant execute on function public.backoffice_set_verification(uuid,varchar,text)       to authenticated;
grant execute on function public.backoffice_set_account_status(uuid,varchar,text)     to authenticated;
grant execute on function public.backoffice_set_compliance(uuid,varchar,text)         to authenticated;
grant execute on function public.backoffice_set_list_check(uuid,varchar,varchar,text) to authenticated;

revoke execute on function public.backoffice_set_verification(uuid,varchar,text)       from anon;
revoke execute on function public.backoffice_set_account_status(uuid,varchar,text)     from anon;
revoke execute on function public.backoffice_set_compliance(uuid,varchar,text)         from anon;
revoke execute on function public.backoffice_set_list_check(uuid,varchar,varchar,text) from anon;

-- ---------------------------------------------------------------------
-- 6. La vista que consume el backoffice
--
-- security_invoker: quien la lea ve exactamente lo que su RLS le
-- permite. Un operador sin permiso recibe cero filas, no un error.
-- ---------------------------------------------------------------------
drop view if exists public.backoffice_clients;

create view public.backoffice_clients
with (security_invoker = true) as
select u.id,
       (u.first_name::text || ' ' || u.last_name::text) as full_name,
       u.first_name,
       u.last_name,
       u.email,
       u.phone,
       u.document_type,
       u.document_number,
       u.tax_id,
       u.country_code,
       u.verification_status,
       u.role,
       u.created_at,
       a.id            as account_id,
       a.cvu,
       a.cbu,
       a.alias,
       a.balance,
       a.status        as account_status,
       a.status_reason as account_status_reason,
       cr.status       as compliance_status,
       cr.notes        as compliance_notes,
       cr.reviewed_at  as compliance_reviewed_at,
       k.score         as kyc_score,
       k.provider      as kyc_provider,
       k.status        as kyc_status,
       k.verified_at   as kyc_verified_at
  from public.users u
  left join public.accounts a
         on a.user_id = u.id and a.is_primary
  left join public.compliance_reviews cr on cr.user_id = u.id
  left join lateral (
        select kv.score, kv.provider, kv.status, kv.verified_at
          from public.kyc_verifications kv
         where kv.user_id = u.id
         order by kv.created_at desc
         limit 1
  ) k on true;

comment on view public.backoffice_clients is
  'Padron de clientes para el backoffice: perfil + cuenta principal + cumplimiento + ultimo KYC.';

grant select on public.backoffice_clients to authenticated, service_role;
revoke all   on public.backoffice_clients from anon;
