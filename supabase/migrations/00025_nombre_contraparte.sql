-- =====================================================================
-- Nombre de la contraparte sin abrir la fila entera
--
-- Tercer intento sobre el mismo sintoma, y el que da con la causa de
-- fondo. 00023 arreglo el orden del COALESCE, 00024 resolvio que la
-- contraparte viaja en metadata... y la UI seguia mostrando el alias.
--
-- La razon: account_movements tiene security_invoker = true, asi que sus
-- subconsultas corren con los permisos de QUIEN CONSULTA. El subselect
-- pedia public.accounts y public.users de la contraparte, y el RLS -- con
-- razon -- no deja que un cliente lea la cuenta ni el perfil de otro. El
-- subselect devolvia NULL y caia al identificador.
--
-- No se puede resolver relajando el RLS: que un cliente pueda leer las
-- filas de otro es exactamente lo que 00010 y 00018 vinieron a cerrar.
--
-- La salida correcta es exponer SOLO el dato necesario -- el nombre del
-- titular -- a traves de una funcion SECURITY DEFINER, igual que ya hace
-- search_account_for_transfer, que devuelve holder_name antes de
-- transferir. El cliente ya conoce ese nombre: se lo mostramos al
-- confirmar la operacion. Lo que no se abre es el resto de la fila
-- (documento, email, telefono, saldo).
-- =====================================================================

create or replace function public.get_account_holder_name(p_account_id uuid)
returns varchar
  language sql stable security definer
  set search_path to 'public'
as $fn$
  select (u.first_name::text || ' ' || u.last_name::text)::varchar
  from public.accounts a
  join public.users u on u.id = a.user_id
  where a.id = p_account_id;
$fn$;

comment on function public.get_account_holder_name(uuid) is
  'Nombre del titular de una cuenta. SECURITY DEFINER a proposito: expone solo el nombre, para mostrar la contraparte de un movimiento sin abrir la fila.';

revoke all    on function public.get_account_holder_name(uuid) from public, anon;
grant execute on function public.get_account_holder_name(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- La vista ahora usa la funcion en lugar del subselect
-- ---------------------------------------------------------------------
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
         -- Egreso: la contraparte es el destino (columna o metadata).
         when t.from_account_id = a.id then coalesce(
           public.get_account_holder_name(
             coalesce(t.to_account_id, (t.metadata->>'to_account_id')::uuid)),
           t.external_holder_name,
           t.external_alias,
           t.payment_reference
         )
         -- Ingreso: la contraparte es el origen (columna o metadata).
         when t.to_account_id = a.id then coalesce(
           public.get_account_holder_name(
             coalesce(t.from_account_id, (t.metadata->>'from_account_id')::uuid)),
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
  'Movimientos por cuenta. La contraparte se resuelve con get_account_holder_name(), que expone el nombre sin abrir la fila.';

grant select on table public.account_movements to authenticated, service_role;
revoke all   on table public.account_movements from anon;
