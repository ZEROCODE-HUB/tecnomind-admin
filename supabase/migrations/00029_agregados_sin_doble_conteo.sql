-- =====================================================================
-- Los agregados contaban dos veces cada transferencia interna
--
-- Detectado verificando el tablero en el navegador: con UNA transferencia
-- de $12.500 entre dos clientes, la portada mostraba "2 movimientos hoy,
-- $25.000 operados".
--
-- La causa esta en como process_transfer registra una transferencia
-- interna: crea DOS transacciones, una por lado.
--
--   transfer_out -> from = emisor,   to = NULL,     metadata.to_account_id
--   transfer_in  -> from = NULL,     to = receptor, metadata.from_account_id
--
-- Eso es correcto para la partida contable de cada cuenta -- y por eso
-- el listado de movimientos las sigue mostrando a las dos, que es lo que
-- un operador necesita para auditar. Pero para un agregado de plataforma
-- son la misma operacion: sumarlas duplica volumen y cantidad.
--
-- Ademas, una transferencia interna no es un ingreso ni un egreso PARA LA
-- PLATAFORMA: el dinero cambia de cuenta pero no entra ni sale. En el
-- grafico de flujo se neteaba solo si se contaban las dos patas, y se
-- deformaba si se contaba una. Se excluyen las dos y el grafico pasa a
-- decir lo que su titulo promete: ingresos y egresos reales.
--
-- La pata espejo se identifica sin ambiguedad: transfer_in cuyo origen
-- viaja en metadata (es decir, la contraparte es una cuenta interna).
-- Una acreditacion que viniera de afuera se registra como deposit.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Predicado unico, para que las tres funciones cuenten igual
-- ---------------------------------------------------------------------
create or replace function public.es_pata_espejo(
  p_type_id uuid, p_metadata jsonb
) returns boolean
  language sql immutable
  set search_path to 'public'
as $fn$
  select exists (
    select 1 from public.transaction_types tt
     where tt.id = p_type_id and tt.code = 'transfer_in'
  ) and coalesce(p_metadata->>'from_account_id', '') <> '';
$fn$;

comment on function public.es_pata_espejo(uuid, jsonb) is
  'True si la transaccion es la contrapartida interna de un transfer_out: se excluye de los agregados para no contar dos veces la misma operacion.';

grant execute on function public.es_pata_espejo(uuid, jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Tablero
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
    (select count(*) from public.users where role <> 'admin'),
    (select count(*) from public.users where verification_status = 'pending' and role <> 'admin'),
    (select count(*) from public.users where verification_status = 'in_review'),
    (select count(*) from public.users u
       where u.role <> 'admin'
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

-- ---------------------------------------------------------------------
-- Serie diaria: ingresos y egresos reales de la plataforma
--
-- Se agrega la columna `internas` para no perder el dato: la operatoria
-- entre cuentas propias se muestra aparte en vez de disolverse.
-- ---------------------------------------------------------------------
drop function if exists public.backoffice_daily_flow(integer);

create function public.backoffice_daily_flow(p_days integer default 30)
returns table (
  dia        date,
  ingresos   numeric,
  egresos    numeric,
  internas   numeric,
  cantidad   bigint
)
  language plpgsql stable security definer
  set search_path to 'public'
as $fn$
begin
  if not public.has_backoffice_permission('estadisticas', 'read')
     and not public.has_backoffice_permission('movimientos', 'read') then
    raise exception 'Sin permiso para ver estadisticas' using errcode = '42501';
  end if;

  p_days := least(greatest(coalesce(p_days, 30), 1), 365);

  return query
  select d.dia::date,
         -- Ingresos y egresos excluyen la operatoria interna, que no
         -- entra ni sale de la plataforma.
         coalesce(sum(case when tt.category = 'income'  and tt.code <> 'transfer_in'
                           then t.amount end), 0)::numeric,
         coalesce(sum(case when tt.category = 'expense' and tt.code <> 'transfer_out'
                           then t.amount end), 0)::numeric,
         coalesce(sum(case when tt.code = 'transfer_out' then t.amount end), 0)::numeric,
         count(t.id) filter (
           where not public.es_pata_espejo(t.transaction_type_id, t.metadata))
    from generate_series(
           date_trunc('day', now()) - ((p_days - 1) || ' days')::interval,
           date_trunc('day', now()),
           '1 day'::interval
         ) as d(dia)
    left join public.transactions t
           on t.created_at >= d.dia
          and t.created_at <  d.dia + interval '1 day'
          and t.status = 'completed'
    left join public.transaction_types tt on tt.id = t.transaction_type_id
   group by d.dia
   order by d.dia;
end;
$fn$;

comment on function public.backoffice_daily_flow(integer) is
  'Serie diaria: ingresos y egresos reales mas la operatoria interna, sin contar dos veces las transferencias.';

revoke all     on function public.backoffice_daily_flow(integer) from public, anon;
grant  execute on function public.backoffice_daily_flow(integer) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Indicadores
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
    (select count(*) from public.users
      where created_at >= v_desde and role <> 'admin'),
    (select count(*) from public.transactions t
      where t.status in ('failed','cancelled','reversed') and t.created_at >= v_desde
        and not public.es_pata_espejo(t.transaction_type_id, t.metadata));
end;
$fn$;

revoke all     on function public.backoffice_indicators(integer) from public, anon;
grant  execute on function public.backoffice_indicators(integer) to authenticated, service_role;
