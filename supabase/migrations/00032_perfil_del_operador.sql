-- =====================================================================
-- Quien soy: nombre y roles del operador que esta logueado
--
-- La cabecera del backoffice mostraba "Admin" fijo para todos. Para
-- poner el dato real hacen falta el nombre (public.users) y los roles
-- (backoffice_roles), y ninguno de los dos se puede leer directo:
--
--   * users solo se abre a si mismo o a quien tenga permiso sobre el
--     padron; un operador de Contabilidad no lo tiene.
--   * backoffice_roles exige permiso sobre 'backoffice', que tampoco
--     tiene por que tener quien solo quiere ver su propio rol.
--
-- Se resuelve con una funcion SECURITY DEFINER que devuelve UNICAMENTE
-- los datos del que llama. No recibe parametros a proposito: no hay
-- forma de preguntar por otro.
-- =====================================================================

create or replace function public.get_my_backoffice_profile()
returns table (
  user_id    uuid,
  full_name  varchar,
  email      varchar,
  role_codes text[],
  role_names text[]
)
  language sql stable security definer
  set search_path to 'public'
as $fn$
  select u.id,
         (u.first_name::text || ' ' || u.last_name::text)::varchar,
         u.email,
         coalesce(array_agg(r.code order by r.code) filter (where r.code is not null), '{}'),
         coalesce(array_agg(r.name order by r.code) filter (where r.name is not null), '{}')
    from public.users u
    left join public.backoffice_user_roles ur on ur.user_id = u.id
    left join public.backoffice_roles r on r.id = ur.role_id
   where u.id = auth.uid()
   group by u.id, u.first_name, u.last_name, u.email;
$fn$;

comment on function public.get_my_backoffice_profile() is
  'Nombre y roles del operador actual. Sin parametros: solo puede devolver los datos de quien llama.';

revoke all     on function public.get_my_backoffice_profile() from public, anon;
grant  execute on function public.get_my_backoffice_profile() to authenticated;
