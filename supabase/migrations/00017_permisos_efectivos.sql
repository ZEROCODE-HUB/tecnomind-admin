-- =====================================================================
-- Permisos efectivos del operador actual
--
-- El frontend necesita, de una sola consulta, que puede hacer quien esta
-- logueado. No se puede resolver con un embed de PostgREST porque
-- backoffice_user_roles y backoffice_role_permissions no tienen relacion
-- directa: ambas apuntan a backoffice_roles. Una funcion lo resuelve
-- mejor, y de paso agrega los permisos cuando el operador tiene varios
-- roles.
-- =====================================================================

create or replace function public.get_my_backoffice_permissions()
returns table (
  resource_code varchar,
  can_read      boolean,
  can_update    boolean,
  can_create    boolean,
  can_delete    boolean
)
  language sql stable security definer
  set search_path to 'public'
as $fn$
  -- bool_or: con varios roles basta que uno conceda la accion.
  select rp.resource_code,
         bool_or(rp.can_read)   as can_read,
         bool_or(rp.can_update) as can_update,
         bool_or(rp.can_create) as can_create,
         bool_or(rp.can_delete) as can_delete
  from public.backoffice_user_roles ur
  join public.backoffice_role_permissions rp on rp.role_id = ur.role_id
  where ur.user_id = auth.uid()
  group by rp.resource_code;
$fn$;

comment on function public.get_my_backoffice_permissions() is
  'Permisos efectivos del usuario actual, agregados sobre todos sus roles.';

revoke all     on function public.get_my_backoffice_permissions() from public, anon;
grant execute  on function public.get_my_backoffice_permissions() to authenticated;
