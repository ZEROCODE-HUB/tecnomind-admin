-- =====================================================================
-- Verificación de dispositivo: interruptor global + override por usuario
--
-- Contexto: al entrar desde un dispositivo no reconocido, la app pedía un
-- OTP por correo. Pero el canal de correo NO está entregando (ver 00035:
-- otp_email_enabled='false', sin worker/SMTP), así que ese OTP nunca llega
-- y todo dispositivo nuevo (incluida cada instalación fresca) queda fuera.
--
-- Este cambio permite prender/apagar esa exigencia desde el backoffice, de
-- forma global o por cliente. Arranca APAGADO: exigir un código que no se
-- entrega es peor que no exigir nada.
--
-- Consistente con app_config (00035, solo legible por SECURITY DEFINER) y
-- con los setters backoffice (00026: has_backoffice_permission + audit).
-- =====================================================================

-- 1. Switch global.
insert into public.app_config (key, value, description) values
  ('device_verification_enabled', 'false',
   'Exigir verificación por OTP al entrar desde un dispositivo nuevo. Necesita canal de correo (otp_email_enabled).')
on conflict (key) do nothing;

-- 2. Override por usuario. null = seguir el global.
alter table public.users
  add column if not exists require_device_verification boolean;
comment on column public.users.require_device_verification is
  'Override de verificación de dispositivo por cliente. null = usar el global (app_config.device_verification_enabled). Lo mueve backoffice_set_device_verification_user().';

-- 3. Valor EFECTIVO para el usuario actual (la app lo consulta; no puede leer
--    app_config directamente).
create or replace function public.device_verification_requerida()
returns boolean
  language sql stable security definer
  set search_path to 'public'
as $fn$
  select coalesce(
    (select require_device_verification from public.users where id = auth.uid()),
    (select value = 'true' from public.app_config where key = 'device_verification_enabled'),
    false
  );
$fn$;
revoke all     on function public.device_verification_requerida() from public, anon;
grant  execute on function public.device_verification_requerida() to authenticated;

-- 4a. Setter global (solo admin de plataforma).
create or replace function public.backoffice_set_device_verification_global(p_enabled boolean)
returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
declare v_antes text;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar la configuración global' using errcode = '42501';
  end if;
  select value into v_antes from public.app_config where key = 'device_verification_enabled';
  insert into public.app_config (key, value, description, updated_at)
  values ('device_verification_enabled', case when p_enabled then 'true' else 'false' end,
          'Exigir verificación por OTP al entrar desde un dispositivo nuevo.', now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
  perform public.backoffice_audit('device_verification.global', 'usuarios', 'app_config', 'device_verification_enabled',
    jsonb_build_object('value', v_antes),
    jsonb_build_object('value', case when p_enabled then 'true' else 'false' end));
end;
$fn$;
revoke all     on function public.backoffice_set_device_verification_global(boolean) from public, anon;
grant  execute on function public.backoffice_set_device_verification_global(boolean) to authenticated;

-- 4b. Lectura del global para el backoffice.
create or replace function public.backoffice_get_device_verification_global()
returns boolean
  language plpgsql stable security definer
  set search_path to 'public'
as $fn$
begin
  if not (public.is_admin() or public.has_backoffice_permission('usuarios','read')) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return coalesce((select value = 'true' from public.app_config where key = 'device_verification_enabled'), false);
end;
$fn$;
revoke all     on function public.backoffice_get_device_verification_global() from public, anon;
grant  execute on function public.backoffice_get_device_verification_global() to authenticated;

-- 4c. Setter por usuario. p_value null = quitar override (seguir global).
create or replace function public.backoffice_set_device_verification_user(p_user_id uuid, p_value boolean)
returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
declare v_antes boolean;
begin
  if not public.has_backoffice_permission('usuarios','update') then
    raise exception 'Sin permiso para modificar clientes' using errcode = '42501';
  end if;
  select require_device_verification into v_antes from public.users where id = p_user_id;
  update public.users set require_device_verification = p_value, updated_at = now() where id = p_user_id;
  perform public.backoffice_audit('device_verification.user', 'usuarios', 'user', p_user_id::text,
    jsonb_build_object('require_device_verification', v_antes),
    jsonb_build_object('require_device_verification', p_value));
end;
$fn$;
revoke all     on function public.backoffice_set_device_verification_user(uuid, boolean) from public, anon;
grant  execute on function public.backoffice_set_device_verification_user(uuid, boolean) to authenticated;

-- 4d. Lectura del override por usuario para el backoffice (puede devolver null).
create or replace function public.backoffice_get_device_verification_user(p_user_id uuid)
returns boolean
  language plpgsql stable security definer
  set search_path to 'public'
as $fn$
begin
  if not (public.is_admin() or public.has_backoffice_permission('usuarios','read')) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return (select require_device_verification from public.users where id = p_user_id);
end;
$fn$;
revoke all     on function public.backoffice_get_device_verification_user(uuid) from public, anon;
grant  execute on function public.backoffice_get_device_verification_user(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Higiene: sacar la lectura pública que se le había puesto por error a
--    app_config (es tabla de interruptores; 00035 la revoca a propósito).
--    Para lo único público de verdad (el App ID de OneSignal, clave de
--    cliente) se expone una función con lista blanca.
-- ---------------------------------------------------------------------
drop policy if exists app_config_public_read on public.app_config;

create or replace function public.public_runtime_config(p_key text)
returns text
  language sql stable security definer
  set search_path to 'public'
as $fn$
  select value from public.app_config
   where key = p_key and key in ('onesignal_app_id');
$fn$;
revoke all     on function public.public_runtime_config(text) from public;
grant  execute on function public.public_runtime_config(text) to anon, authenticated;
