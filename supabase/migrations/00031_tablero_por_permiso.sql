-- =====================================================================
-- El tablero devolvia contadores que el operador no podia consultar
--
-- Detectado probando el rol Contabilidad contra la API con su propio
-- token: no puede leer ni una fila del padron (backoffice_clients le
-- devuelve solo su propia fila), pero backoffice_dashboard() le
-- respondia "clientes_total: 3, clientes_pendientes: 2".
--
-- La causa: la funcion es SECURITY DEFINER y verificaba UN permiso al
-- entrar -- "ve clientes O ve movimientos" -- y despues contaba todo. Con
-- solo movimientos.read alcanzaba para recibir tambien los contadores de
-- clientes.
--
-- No es una fuga grave (son agregados, no datos personales), pero
-- contradice el modelo de permisos: lo que la UI oculta, la API lo
-- entregaba igual. Y una funcion SECURITY DEFINER que chequea el permiso
-- una sola vez y despues lee de todo es exactamente el patron que hay
-- que evitar.
--
-- La correccion es chequear CADA bloque contra su propio permiso y
-- devolver NULL en los que no corresponden. NULL, no cero: cero es un
-- dato ("no hay clientes pendientes") y seria mentira.
-- =====================================================================

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
declare
  v_clientes boolean := public.puede_ver_clientes();
  v_movs     boolean := public.has_backoffice_permission('movimientos', 'read');
begin
  if not (v_clientes or v_movs) then
    raise exception 'Sin permiso para ver el tablero' using errcode = '42501';
  end if;

  return query
  select
    case when v_clientes then
      (select count(*) from public.users u where not public.es_operador_backoffice(u.id)) end,
    case when v_clientes then
      (select count(*) from public.users u
        where u.verification_status = 'pending' and not public.es_operador_backoffice(u.id)) end,
    case when v_clientes then
      (select count(*) from public.users u
        where u.verification_status = 'in_review' and not public.es_operador_backoffice(u.id)) end,
    case when v_clientes then
      (select count(*) from public.users u
         where not public.es_operador_backoffice(u.id)
           and not exists (select 1 from public.compliance_reviews cr
                            where cr.user_id = u.id and cr.status in ('pass','fail'))) end,
    case when v_clientes then
      (select count(*) from public.accounts where status in ('blocked','suspended')) end,
    -- El saldo agregado es informacion de cuentas: va con el padron.
    case when v_clientes then
      (select coalesce(sum(balance), 0) from public.accounts where status = 'active') end,
    case when v_movs then
      (select count(*) from public.transactions t
        where t.created_at >= date_trunc('day', now())
          and not public.es_pata_espejo(t.transaction_type_id, t.metadata)) end,
    case when v_movs then
      (select count(*) from public.transactions t
        where t.status in ('pending','processing')
          and not public.es_pata_espejo(t.transaction_type_id, t.metadata)) end,
    case when v_movs then
      (select coalesce(sum(t.amount), 0) from public.transactions t
        where t.status = 'completed'
          and t.created_at >= date_trunc('day', now())
          and not public.es_pata_espejo(t.transaction_type_id, t.metadata)) end;
end;
$fn$;

comment on function public.backoffice_dashboard() is
  'Contadores de la portada. Cada bloque respeta su propio permiso: NULL en los que el operador no puede consultar.';

revoke all     on function public.backoffice_dashboard() from public, anon;
grant  execute on function public.backoffice_dashboard() to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Indicadores: las altas de clientes tambien son del padron
-- ---------------------------------------------------------------------
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
  v_desde    timestamptz;
  v_clientes boolean := public.puede_ver_clientes();
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
    case when v_clientes then
      (select count(*) from public.users u
        where u.created_at >= v_desde and not public.es_operador_backoffice(u.id)) end,
    (select count(*) from public.transactions t
      where t.status in ('failed','cancelled','reversed') and t.created_at >= v_desde
        and not public.es_pata_espejo(t.transaction_type_id, t.metadata));
end;
$fn$;

revoke all     on function public.backoffice_indicators(integer) from public, anon;
grant  execute on function public.backoffice_indicators(integer) to authenticated, service_role;
