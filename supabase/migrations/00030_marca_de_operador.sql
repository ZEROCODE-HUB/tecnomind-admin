-- =====================================================================
-- Distinguir operadores de clientes en el padron
--
-- Detectado en el navegador: las pantallas de Verificacion listaban a
-- admin@tecnomind.local y contador@tecnomind.local como si fueran
-- clientes a verificar.
--
-- El filtro del frontend miraba users.role = 'admin', que es el campo
-- heredado de Magnate. Pero en TecnoMind el rol del backoffice NO vive
-- ahi: vive en backoffice_user_roles (migracion 00014), y users.role
-- quedo en 'user' para los dos operadores. El filtro nunca acertaba.
--
-- La marca correcta es "tiene algun rol de backoffice asignado". No se
-- puede resolver con un EXISTS dentro de la vista, porque
-- backoffice_clients es security_invoker y la politica "Cada operador ve
-- sus propios roles" solo deja leer las filas propias: el EXISTS daria
-- falso para todos los demas. Hace falta una funcion SECURITY DEFINER
-- que responda si/no sin abrir la tabla.
-- =====================================================================

create or replace function public.es_operador_backoffice(p_user_id uuid)
returns boolean
  language sql stable security definer
  set search_path to 'public'
as $fn$
  select exists (
    select 1 from public.backoffice_user_roles ur where ur.user_id = p_user_id
  ) or exists (
    -- Se contempla tambien el rol heredado, por si quedara alguno.
    select 1 from public.users u where u.id = p_user_id and u.role = 'admin'
  );
$fn$;

comment on function public.es_operador_backoffice(uuid) is
  'True si el usuario tiene rol de backoffice. Expone solo el booleano: no abre backoffice_user_roles.';

revoke all     on function public.es_operador_backoffice(uuid) from public, anon;
grant  execute on function public.es_operador_backoffice(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- La vista incorpora la marca
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
       public.es_operador_backoffice(u.id) as is_operator,
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
  'Padron de clientes: perfil + cuenta principal + cumplimiento + ultimo KYC. is_operator distingue a los usuarios internos.';

grant select on public.backoffice_clients to authenticated, service_role;
revoke all   on public.backoffice_clients from anon;

-- ---------------------------------------------------------------------
-- Los contadores del tablero contaban con el mismo criterio equivocado
-- ---------------------------------------------------------------------
create or replace function public.backoffice_dashboard()
returns table (
  clientes_total            bigint,
  clientes_pendientes       bigint,
  clientes_en_revision      bigint,
  cumplimiento_pendiente    bigint,
  cuentas_bloqueadas        bigint,
  saldo_total               numeric,
  movimientos_hoy           bigint,
  movimientos_pendientes    bigint,
  volumen_hoy               numeric
)
  language plpgsql stable security definer
  set search_path to 'public'
as $fn$
begin
  if not (public.puede_ver_clientes() or public.has_backoffice_permission('movimientos','read')) then
    raise exception 'Sin permiso para ver el tablero' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.users u where not public.es_operador_backoffice(u.id)),
    (select count(*) from public.users u
      where u.verification_status = 'pending' and not public.es_operador_backoffice(u.id)),
    (select count(*) from public.users u
      where u.verification_status = 'in_review' and not public.es_operador_backoffice(u.id)),
    (select count(*) from public.users u
       where not public.es_operador_backoffice(u.id)
         and not exists (select 1 from public.compliance_reviews cr
                          where cr.user_id = u.id and cr.status in ('pass','fail'))),
    (select count(*) from public.accounts where status in ('blocked','suspended')),
    (select coalesce(sum(balance), 0) from public.accounts where status = 'active'),
    (select count(*) from public.transactions t
      where t.created_at >= date_trunc('day', now())
        and not public.es_pata_espejo(t.transaction_type_id, t.metadata)),
    (select count(*) from public.transactions t
      where t.status in ('pending','processing')
        and not public.es_pata_espejo(t.transaction_type_id, t.metadata)),
    (select coalesce(sum(t.amount), 0) from public.transactions t
      where t.status = 'completed'
        and t.created_at >= date_trunc('day', now())
        and not public.es_pata_espejo(t.transaction_type_id, t.metadata));
end;
$fn$;

revoke all     on function public.backoffice_dashboard() from public, anon;
grant  execute on function public.backoffice_dashboard() to authenticated, service_role;

-- Y las altas del periodo, por el mismo motivo.
create or replace function public.backoffice_indicators(p_days integer default 30)
returns table (
  operaciones          bigint,
  volumen              numeric,
  ticket_promedio      numeric,
  comisiones           numeric,
  clientes_operando    bigint,
  altas                bigint,
  operaciones_fallidas bigint
)
  language plpgsql stable security definer
  set search_path to 'public'
as $fn$
declare
  v_desde timestamptz;
begin
  if not public.has_backoffice_permission('estadisticas', 'read')
     and not public.has_backoffice_permission('movimientos', 'read') then
    raise exception 'Sin permiso para ver estadisticas' using errcode = '42501';
  end if;

  p_days  := least(greatest(coalesce(p_days, 30), 1), 365);
  v_desde := date_trunc('day', now()) - ((p_days - 1) || ' days')::interval;

  return query
  select
    (select count(*) from public.transactions t
      where t.status = 'completed' and t.created_at >= v_desde
        and not public.es_pata_espejo(t.transaction_type_id, t.metadata)),
    (select coalesce(sum(t.amount), 0) from public.transactions t
      where t.status = 'completed' and t.created_at >= v_desde
        and not public.es_pata_espejo(t.transaction_type_id, t.metadata)),
    (select coalesce(avg(t.amount), 0) from public.transactions t
      where t.status = 'completed' and t.created_at >= v_desde
        and not public.es_pata_espejo(t.transaction_type_id, t.metadata)),
    (select coalesce(sum(t.commission_amount), 0) from public.transactions t
      where t.status = 'completed' and t.created_at >= v_desde),
    (select count(distinct t.from_account_id) from public.transactions t
      where t.status = 'completed' and t.created_at >= v_desde
        and t.from_account_id is not null),
    (select count(*) from public.users u
      where u.created_at >= v_desde and not public.es_operador_backoffice(u.id)),
    (select count(*) from public.transactions t
      where t.status in ('failed','cancelled','reversed') and t.created_at >= v_desde
        and not public.es_pata_espejo(t.transaction_type_id, t.metadata));
end;
$fn$;

revoke all     on function public.backoffice_indicators(integer) from public, anon;
grant  execute on function public.backoffice_indicators(integer) to authenticated, service_role;
