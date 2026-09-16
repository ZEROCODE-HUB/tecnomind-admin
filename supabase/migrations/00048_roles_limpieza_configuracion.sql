-- =====================================================================
-- Roles al 100%: limpiar recursos muertos + cablear "Configuración"
--
-- 1) backoffice_resources tenía recursos de secciones que se eliminaron
--    (alertas, comercios, incidentes, modulos, notificaciones, registros,
--    reportes, soporte). Ensuciaban el matrix de Roles. Se borran (con sus
--    permisos). Quedan solo los reales: usuarios, movimientos, verificacion,
--    backoffice, pagos, otc, estadisticas, configuracion.
-- 2) La verificación de dispositivo (Configuración) estaba gateada solo por
--    is_admin y no por un recurso, así que no se podía asignar a un rol.
--    Se pasa a has_backoffice_permission('configuracion', ...).
-- =====================================================================

-- 1. Limpiar recursos muertos.
delete from public.backoffice_role_permissions
 where resource_code in
   ('alertas','comercios','incidentes','modulos','notificaciones','registros','reportes','soporte');

delete from public.backoffice_resources
 where code in
   ('alertas','comercios','incidentes','modulos','notificaciones','registros','reportes','soporte');

-- Dejar bien ordenados los reales en el matrix.
update public.backoffice_resources set sort_order = 1  where code = 'usuarios';
update public.backoffice_resources set sort_order = 2  where code = 'verificacion';
update public.backoffice_resources set sort_order = 3  where code = 'movimientos';
update public.backoffice_resources set sort_order = 4  where code = 'pagos';
update public.backoffice_resources set sort_order = 5  where code = 'otc';
update public.backoffice_resources set sort_order = 6  where code = 'estadisticas';
update public.backoffice_resources set sort_order = 7  where code = 'backoffice';
update public.backoffice_resources set sort_order = 8  where code = 'configuracion';

-- 2. Cablear "Configuración" al recurso (en vez de solo is_admin).
create or replace function public.backoffice_set_device_verification_global(p_enabled boolean)
returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
declare v_antes text;
begin
  if not (public.is_admin() or public.has_backoffice_permission('configuracion', 'update')) then
    raise exception 'Sin permiso para cambiar la configuración' using errcode = '42501';
  end if;
  select value into v_antes from public.app_config where key = 'device_verification_enabled';
  insert into public.app_config (key, value, description, updated_at)
  values ('device_verification_enabled', case when p_enabled then 'true' else 'false' end,
          'Exigir verificación por OTP al entrar desde un dispositivo nuevo.', now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
  perform public.backoffice_audit('device_verification.global', 'configuracion', 'app_config', 'device_verification_enabled',
    jsonb_build_object('value', v_antes),
    jsonb_build_object('value', case when p_enabled then 'true' else 'false' end));
end;
$fn$;

create or replace function public.backoffice_get_device_verification_global()
returns boolean
  language plpgsql stable security definer
  set search_path to 'public'
as $fn$
begin
  if not (public.is_admin() or public.has_backoffice_permission('configuracion', 'read')) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return coalesce((select value = 'true' from public.app_config where key = 'device_verification_enabled'), false);
end;
$fn$;
