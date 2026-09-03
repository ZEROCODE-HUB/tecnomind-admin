-- =====================================================================
-- Series para las pantallas de estadisticas
--
-- El prototipo dibujaba la evolucion con datos inventados. Agregar en el
-- navegador exigiria traerse todas las transacciones del periodo solo
-- para sumarlas; se resuelve en la base, que ademas es donde estan los
-- indices por fecha.
--
-- Las dos funciones son SECURITY DEFINER porque agregan sobre TODO el
-- padron, y verifican el permiso adentro (SECURITY DEFINER desactiva el
-- RLS: si no se chequea aca, no lo chequea nadie).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Evolucion diaria de ingresos y egresos
--
-- generate_series garantiza que los dias sin movimiento aparezcan en
-- cero en vez de desaparecer: un hueco en el eje x deforma la lectura
-- del grafico.
-- ---------------------------------------------------------------------
create or replace function public.backoffice_daily_flow(p_days integer default 30)
returns table (
  dia        date,
  ingresos   numeric,
  egresos    numeric,
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

  -- Cota defensiva: el parametro llega desde el navegador.
  p_days := least(greatest(coalesce(p_days, 30), 1), 365);

  return query
  select d.dia::date,
         coalesce(sum(case when tt.category = 'income'  then t.amount end), 0)::numeric,
         coalesce(sum(case when tt.category = 'expense' then t.amount end), 0)::numeric,
         count(t.id)
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
  'Serie diaria de ingresos y egresos completados. Incluye los dias sin movimiento en cero.';

revoke all     on function public.backoffice_daily_flow(integer) from public, anon;
grant  execute on function public.backoffice_daily_flow(integer) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Indicadores del periodo
-- ---------------------------------------------------------------------
create or replace function public.backoffice_indicators(p_days integer default 30)
returns table (
  operaciones        bigint,
  volumen            numeric,
  ticket_promedio    numeric,
  comisiones         numeric,
  clientes_operando  bigint,
  altas              bigint,
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
    (select count(*) from public.transactions
      where status = 'completed' and created_at >= v_desde),
    (select coalesce(sum(amount), 0) from public.transactions
      where status = 'completed' and created_at >= v_desde),
    (select coalesce(avg(amount), 0) from public.transactions
      where status = 'completed' and created_at >= v_desde),
    (select coalesce(sum(commission_amount), 0) from public.transactions
      where status = 'completed' and created_at >= v_desde),
    -- Cuentas distintas que originaron al menos una operacion.
    (select count(distinct from_account_id) from public.transactions
      where status = 'completed' and created_at >= v_desde and from_account_id is not null),
    (select count(*) from public.users
      where created_at >= v_desde and role <> 'admin'),
    (select count(*) from public.transactions
      where status in ('failed','cancelled','reversed') and created_at >= v_desde);
end;
$fn$;

comment on function public.backoffice_indicators(integer) is
  'Indicadores agregados del periodo para la pantalla de estadisticas.';

revoke all     on function public.backoffice_indicators(integer) from public, anon;
grant  execute on function public.backoffice_indicators(integer) to authenticated, service_role;
