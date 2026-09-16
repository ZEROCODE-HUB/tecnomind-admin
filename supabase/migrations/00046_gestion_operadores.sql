-- =====================================================================
-- Gestión de operadores del backoffice (real)
--
-- Antes "Administración de personal" era una lista mock. Acá van los RPCs
-- reales para: listar operadores (usuarios con algún rol de backoffice),
-- asignar un rol a alguien por su correo, y quitarle un rol. Todo admin-only
-- y auditado (mismo patrón que 00026). Asignar roles de backoffice es dar
-- poder sobre el panel, así que exige is_admin().
-- =====================================================================

-- 1. Listar operadores + sus roles.
create or replace function public.backoffice_list_operators()
returns table (user_id uuid, email text, full_name text, role_names text[], role_codes text[])
  language plpgsql stable security definer
  set search_path to 'public'
as $fn$
begin
  if not (public.is_admin() or public.has_backoffice_permission('backoffice', 'read')) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return query
    select u.id,
           u.email::text,
           (u.first_name::text || ' ' || u.last_name::text),
           array_agg(r.name::text order by r.name),
           array_agg(r.code::text order by r.name)
      from public.users u
      join public.backoffice_user_roles ur on ur.user_id = u.id
      join public.backoffice_roles r on r.id = ur.role_id
     group by u.id, u.email, u.first_name, u.last_name
     order by 3;
end;
$fn$;
revoke all     on function public.backoffice_list_operators() from public, anon;
grant  execute on function public.backoffice_list_operators() to authenticated;

-- 2. Asignar un rol a un usuario (por correo). Lo convierte en operador.
create or replace function public.backoffice_assign_role(p_email text, p_role_code text)
returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
declare v_uid uuid; v_role uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede gestionar operadores' using errcode = '42501';
  end if;
  select id into v_uid from public.users where lower(email) = lower(trim(p_email));
  if v_uid is null then
    raise exception 'No existe un usuario con ese correo' using errcode = 'P0002';
  end if;
  select id into v_role from public.backoffice_roles where code = p_role_code;
  if v_role is null then
    raise exception 'Rol inválido' using errcode = '22023';
  end if;

  insert into public.backoffice_user_roles (user_id, role_id, assigned_by)
  values (v_uid, v_role, auth.uid())
  on conflict (user_id, role_id) do nothing;

  perform public.backoffice_audit('operador.asignar_rol', 'backoffice', 'user', v_uid::text,
    '{}'::jsonb, jsonb_build_object('email', p_email, 'role', p_role_code));
end;
$fn$;
revoke all     on function public.backoffice_assign_role(text, text) from public, anon;
grant  execute on function public.backoffice_assign_role(text, text) to authenticated;

-- 3. Quitar un rol a un operador. No permite auto-quitarse 'admin'
--    (evita quedar sin ningún administrador por accidente).
create or replace function public.backoffice_remove_role(p_user_id uuid, p_role_code text)
returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede gestionar operadores' using errcode = '42501';
  end if;
  if p_role_code = 'admin' and p_user_id = auth.uid() then
    raise exception 'No podés quitarte tu propio rol de administrador' using errcode = '42501';
  end if;

  delete from public.backoffice_user_roles ur
   using public.backoffice_roles r
   where ur.role_id = r.id and ur.user_id = p_user_id and r.code = p_role_code;

  perform public.backoffice_audit('operador.quitar_rol', 'backoffice', 'user', p_user_id::text,
    jsonb_build_object('role', p_role_code), '{}'::jsonb);
end;
$fn$;
revoke all     on function public.backoffice_remove_role(uuid, text) from public, anon;
grant  execute on function public.backoffice_remove_role(uuid, text) to authenticated;
