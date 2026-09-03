-- =====================================================================
-- Roles iniciales del backoffice
--
-- Los seis roles y su matriz de permisos salen tal cual de
-- admin.administracion.usuarios.roles.tsx (rolesIniciales), para que la
-- pantalla muestre exactamente lo mismo con datos reales.
-- =====================================================================

insert into public.backoffice_roles (code, name, description, is_system) values
  ('admin',      'Admin',      'Acceso total al backoffice.',                              true),
  ('compliance', 'Compliance', 'Lectura general; edita alertas y usuarios.',               false),
  ('management', 'Management', 'Lectura general y edicion salvo configuracion.',           false),
  ('accounting', 'Accounting', 'Solo lectura de movimientos, reportes y registros.',       false),
  ('reader',     'Reader',     'Solo lectura de todo.',                                    false),
  ('user',       'User',       'Sin acceso al backoffice. Punto de partida de un alta.',   false)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- Matriz de permisos, generada a partir de las mismas reglas del diseño
-- en vez de escribir 16 recursos x 6 roles a mano.
-- ---------------------------------------------------------------------
insert into public.backoffice_role_permissions (role_id, resource_code, can_read, can_update, can_create, can_delete)
select r.id,
       res.code,
       case r.code
         when 'admin'      then true
         when 'compliance' then true
         when 'management' then true
         when 'accounting' then res.code in ('movimientos', 'reportes', 'registros')
         when 'reader'     then true
         else false
       end,
       case r.code
         when 'admin'      then true
         when 'compliance' then res.code in ('alertas', 'usuarios')
         when 'management' then res.code <> 'configuracion'
         else false
       end,
       case r.code
         when 'admin'      then true
         when 'management' then res.code in ('reportes', 'incidentes')
         else false
       end,
       case r.code
         when 'admin' then true
         else false
       end
from public.backoffice_roles r
cross join public.backoffice_resources res
on conflict (role_id, resource_code) do nothing;

-- ---------------------------------------------------------------------
-- Promueve a operador del backoffice a cualquier usuario que ya tuviera
-- users.role = 'admin'. Sin efecto en una base vacia: existe para que la
-- migracion sea correcta tambien si algun dia se corre sobre datos.
-- ---------------------------------------------------------------------
insert into public.backoffice_user_roles (user_id, role_id)
select u.id, r.id
from public.users u
cross join public.backoffice_roles r
where u.role = 'admin' and r.code = 'admin'
on conflict (user_id, role_id) do nothing;
