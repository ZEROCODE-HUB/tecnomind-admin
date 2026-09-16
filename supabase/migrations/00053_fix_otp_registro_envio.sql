-- 00053_fix_otp_registro_envio.sql
-- Arregla que el OTP de registro NO llegaba por correo.
--
-- Causa: request_presignup_otp encolaba con enqueue_notification(...,
-- 'email_verification', ...). El worker process_notification_jobs(), para los
-- mensajes con `notification_type`, saca el email de la tabla `users` por
-- `user_id`. Pero en el REGISTRO todavía no existe usuario (user_id = null), así
-- que v_email quedaba null y el worker DESCARTABA el mensaje sin enviarlo.
--
-- Fix: encolar el email en la forma `type='otp'`, que el worker ya sabe enviar
-- leyendo el email y el código DEL MENSAJE (no de `users`). Misma plantilla de
-- código que la verificación de dispositivo.

create or replace function public.request_presignup_otp(
  p_email text,
  p_first_name text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code   text;
  v_recent int;
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'email_invalido';
  end if;
  p_email := lower(trim(p_email));

  -- Rate limit: máx 5 solicitudes por email en 15 minutos (anti email-bombing).
  select count(*) into v_recent
    from public.presignup_otp
   where email = p_email
     and created_at > now() - interval '15 minutes';
  if v_recent >= 5 then
    raise exception 'rate_limit';
  end if;

  -- Código de 6 dígitos generado en el server.
  v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');

  -- Invalida cualquier código vigente anterior para ese email.
  update public.presignup_otp
     set consumed = true
   where email = p_email and consumed = false;

  insert into public.presignup_otp (email, code_hash, expires_at)
  values (
    p_email,
    encode(digest(v_code || ':' || p_email, 'sha256'), 'hex'),
    now() + interval '10 minutes'
  );

  -- Encola en la forma 'otp' (el worker lee email + code DEL MENSAJE). NO usar
  -- enqueue_notification aquí: esa forma saca el email de `users`, que en el
  -- registro aún no existe, y el mensaje se descarta sin enviarse.
  perform pgmq.send(
    queue_name := 'notification_jobs',
    msg := jsonb_build_object(
      'type', 'otp',
      'email', p_email,
      'code', v_code,
      'user_id', null,
      'first_name', coalesce(nullif(trim(p_first_name), ''), split_part(p_email, '@', 1)),
      'purpose', 'email_verification'
    )
  );
end;
$$;

grant execute on function public.request_presignup_otp(text, text) to anon, authenticated;
