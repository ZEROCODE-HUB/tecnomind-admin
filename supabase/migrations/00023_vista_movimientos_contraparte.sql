-- =====================================================================
-- account_movements: mostrar el nombre de la contraparte, no el alias
--
-- Detectado probando una transferencia en el navegador: el listado de
-- movimientos mostraba "tecnomind.28987654" en vez de "Martin Lopez".
--
-- La causa esta en el orden del COALESCE heredado:
--
--   COALESCE(t.payment_reference, t.external_holder_name, <nombre titular>)
--
-- payment_reference guarda EL IDENTIFICADOR QUE ESCRIBIO EL USUARIO (el
-- alias, CBU o CVU de destino), asi que siempre viene cargado en una
-- transferencia y gana sobre el nombre. El nombre del titular, que es lo
-- unico que el usuario reconoce, nunca se alcanzaba.
--
-- Se invierte la prioridad: primero el titular de la cuenta interna,
-- despues el titular externo informado, y el identificador queda como
-- ultimo recurso. payment_reference sigue expuesto en su propia columna
-- para quien lo necesite.
--
-- Se recrea con security_invoker = true (ver 00010): sin esa opcion la
-- vista ignora el RLS de las tablas base.
-- =====================================================================

drop view if exists public.account_movements;

create view public.account_movements
with (security_invoker = true) as
select a.id as account_id,
       a.user_id,
       t.id as transaction_id,
       t.created_at,
       t.completed_at,
       t.amount,
       t.concept,
       t.payment_method,
       t.reference_number,
       tt.category,
       tt.name as transaction_type_name,
       case
         when t.to_account_id = a.id   then 'income'::text
         when t.from_account_id = a.id then 'expense'::text
         else 'other'::text
       end as movement_type,
       case when t.to_account_id = a.id then t.amount else 0::numeric end as income_amount,
       case when t.from_account_id = a.id then t.amount else 0::numeric end as expense_amount,
       t.status,
       case
         -- Egreso: la contraparte es el destino.
         when t.from_account_id = a.id then coalesce(
           (select (u.first_name::text || ' ' || u.last_name::text)
              from public.accounts ta
              join public.users u on u.id = ta.user_id
             where ta.id = t.to_account_id)::varchar,
           t.external_holder_name,
           t.external_alias,
           t.payment_reference
         )
         -- Ingreso: la contraparte es el origen.
         when t.to_account_id = a.id then coalesce(
           (select (u.first_name::text || ' ' || u.last_name::text)
              from public.accounts fa
              join public.users u on u.id = fa.user_id
             where fa.id = t.from_account_id)::varchar,
           t.external_holder_name,
           t.external_alias,
           t.payment_reference
         )
         else null::varchar
       end as counterpart_name,
       t.payment_reference
  from public.accounts a
  left join public.transactions t
         on t.from_account_id = a.id or t.to_account_id = a.id
  left join public.transaction_types tt on tt.id = t.transaction_type_id
 where t.status::text = 'completed'::text;

comment on view public.account_movements is
  'Movimientos por cuenta. counterpart_name prioriza el nombre del titular sobre el identificador escrito.';

-- Los permisos se pierden al recrear la vista: se reponen. anon queda
-- fuera a proposito (ver 00010).
grant select on table public.account_movements to authenticated, service_role;
revoke all   on table public.account_movements from anon;
