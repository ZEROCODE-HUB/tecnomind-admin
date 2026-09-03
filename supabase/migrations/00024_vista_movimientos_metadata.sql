-- =====================================================================
-- account_movements: resolver la contraparte por metadata
--
-- 00023 invirtio el orden del COALESCE pero seguia mostrando el alias.
-- La razon real es como process_transfer registra una transferencia
-- interna: crea DOS transacciones separadas, no una con ambas puntas.
--
--   egreso  -> from_account_id = emisor,  to_account_id = NULL
--              metadata = {"to_account_id": "<destino>", ...}
--   ingreso -> from_account_id = NULL,    to_account_id = receptor
--              metadata = {"from_account_id": "<origen>", ...}
--
-- Con to_account_id en NULL, el subselect por la columna nunca encontraba
-- la cuenta destino. La contraparte viaja en metadata, asi que hay que
-- leerla de ahi.
--
-- Se conserva el subselect por columna primero, porque hay transacciones
-- (como los depositos) que si traen la columna cargada.
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
         -- Egreso: la contraparte es el destino, por columna o por metadata.
         when t.from_account_id = a.id then coalesce(
           (select (u.first_name::text || ' ' || u.last_name::text)
              from public.accounts ta
              join public.users u on u.id = ta.user_id
             where ta.id = coalesce(t.to_account_id, (t.metadata->>'to_account_id')::uuid))::varchar,
           t.external_holder_name,
           t.external_alias,
           t.payment_reference
         )
         -- Ingreso: la contraparte es el origen, por columna o por metadata.
         when t.to_account_id = a.id then coalesce(
           (select (u.first_name::text || ' ' || u.last_name::text)
              from public.accounts fa
              join public.users u on u.id = fa.user_id
             where fa.id = coalesce(t.from_account_id, (t.metadata->>'from_account_id')::uuid))::varchar,
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
  'Movimientos por cuenta. La contraparte se resuelve por columna o, en transferencias internas, por metadata; el identificador escrito queda como ultimo recurso.';

grant select on table public.account_movements to authenticated, service_role;
revoke all   on table public.account_movements from anon;
