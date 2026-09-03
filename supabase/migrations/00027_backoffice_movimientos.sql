-- =====================================================================
-- Movimientos para el backoffice
--
-- admin_transaction_list (heredada) sirve para auditar una fila suelta,
-- pero no alcanza para la pantalla de Movimientos:
--
--   * No trae el tipo de operacion, solo transaction_type_id. La UI
--     agrupa por Deposito / Retiro / Transferencia / Comision / QR.
--   * No trae el CVU ni el alias de las cuentas, que es como el operador
--     identifica una cuenta.
--   * Resuelve el destino solo por to_account_id, y en una transferencia
--     interna process_transfer deja esa columna en NULL: la contraparte
--     viaja en metadata (mismo problema que resolvio 00025 del lado del
--     cliente). El listado mostraba el destino vacio.
--
-- Se agrega una vista propia en vez de tocar la heredada, que queda como
-- estaba para no romper lo que ya la consulta.
-- =====================================================================

drop view if exists public.backoffice_transactions;

create view public.backoffice_transactions
with (security_invoker = true) as
with resuelto as (
  select t.*,
         -- En transferencias internas la contraparte esta en metadata.
         coalesce(t.from_account_id, (t.metadata->>'from_account_id')::uuid) as origen_id,
         coalesce(t.to_account_id,   (t.metadata->>'to_account_id')::uuid)   as destino_id
    from public.transactions t
)
select r.id,
       r.reference_number,
       r.created_at,
       r.completed_at,
       r.failed_at,
       r.amount,
       r.commission_amount,
       r.net_amount,
       r.currency,
       r.concept,
       r.payment_method,
       r.payment_reference,
       r.status,
       r.failure_reason,
       r.metadata,
       tt.code     as type_code,
       tt.name     as type_name,
       tt.category as type_category,
       -- Origen
       r.origen_id as from_account_id,
       fa.cvu      as from_cvu,
       fa.alias    as from_alias,
       fu.id       as from_user_id,
       case when fu.id is not null
            then (fu.first_name::text || ' ' || fu.last_name::text) end as from_user_name,
       fu.email           as from_user_email,
       fu.document_number as from_user_document,
       fu.tax_id          as from_user_tax_id,
       -- Destino: cuenta interna o, si es externo, los datos informados
       r.destino_id as to_account_id,
       coalesce(ta.cvu, r.external_cvu)     as to_cvu,
       coalesce(ta.alias, r.external_alias) as to_alias,
       tu.id        as to_user_id,
       coalesce(
         case when tu.id is not null
              then (tu.first_name::text || ' ' || tu.last_name::text) end,
         r.external_holder_name
       ) as to_user_name,
       tu.email           as to_user_email,
       tu.document_number as to_user_document,
       tu.tax_id          as to_user_tax_id
  from resuelto r
  left join public.transaction_types tt on tt.id = r.transaction_type_id
  left join public.accounts fa on fa.id = r.origen_id
  left join public.users    fu on fu.id = fa.user_id
  left join public.accounts ta on ta.id = r.destino_id
  left join public.users    tu on tu.id = ta.user_id;

comment on view public.backoffice_transactions is
  'Movimientos con tipo, cuentas y ambas contrapartes resueltas (incluida la que viaja en metadata). security_invoker: solo la ve quien tenga permiso sobre movimientos.';

grant select on public.backoffice_transactions to authenticated, service_role;
revoke all   on public.backoffice_transactions from anon;

-- ---------------------------------------------------------------------
-- Resumen para el tablero
--
-- La portada del admin necesita contadores sobre TODO el padron. Hacerlo
-- con selects contados desde el navegador serian seis roundtrips y
-- ademas cada uno filtrado por RLS. Se resuelve en una funcion, que
-- igual verifica permiso antes de contar nada.
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
    (select count(*) from public.transactions where created_at >= date_trunc('day', now())),
    (select count(*) from public.transactions where status in ('pending','processing')),
    (select coalesce(sum(amount), 0) from public.transactions
      where status = 'completed' and created_at >= date_trunc('day', now()));
end;
$fn$;

comment on function public.backoffice_dashboard() is
  'Contadores de la portada del backoffice. SECURITY DEFINER para contar sobre todo el padron, con el permiso verificado adentro.';

revoke all     on function public.backoffice_dashboard() from public, anon;
grant  execute on function public.backoffice_dashboard() to authenticated, service_role;
