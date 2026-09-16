-- 00049_otp_registro_serverside.sql
-- OTP de registro REAL del lado servidor.
--
-- Antes: el código de verificación de correo en el registro se generaba en el
-- CLIENTE (StepEmailVerification) y se comparaba en el cliente. Inseguro: el
-- código vive en el dispositivo y se puede saltear.
--
-- Ahora: el código se genera y verifica en el servidor. El cliente solo pide
-- (request_presignup_otp) y verifica (verify_presignup_otp). El código se
-- guarda HASHEADO en una tabla con RLS cerrada (solo accesible por estas RPC
-- SECURITY DEFINER), con expiración y límite de intentos.

create table if not exists public.presignup_otp (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    int not null default 0,
  consumed    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_presignup_otp_email_created
  on public.presignup_otp (email, created_at desc);

-- RLS activada SIN policies: nadie (anon/authenticated) lee o escribe directo.
-- Solo las RPC SECURITY DEFINER (que corren como owner) tocan la tabla.
alter table public.presignup_otp enable row level security;
revoke all on public.presignup_otp from anon, authenticated;

-- ── Solicitar código: genera, guarda hash y encola el email (worker -> Resend) ──
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

  -- Encola el correo con el código (mismo tipo que ya maneja el worker).
  perform public.enqueue_notification(
    null,
    'email_verification',
    jsonb_build_object(
      'email', p_email,
      'first_name', coalesce(nullif(trim(p_first_name), ''), split_part(p_email, '@', 1)),
      'otp', v_code,
      'otp_code', v_code
    ),
    null
  );
end;
$$;

-- ── Verificar código: compara hash, controla expiración e intentos ─────────────
create or replace function public.verify_presignup_otp(
  p_email text,
  p_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row  public.presignup_otp;
  v_hash text;
begin
  if p_email is null or p_code is null then
    return false;
  end if;
  p_email := lower(trim(p_email));
  p_code  := trim(p_code);

  select * into v_row
    from public.presignup_otp
   where email = p_email
     and consumed = false
     and expires_at > now()
   order by created_at desc
   limit 1;

  if not found then
    return false;
  end if;

  -- Máx 5 intentos por código.
  if v_row.attempts >= 5 then
    return false;
  end if;

  v_hash := encode(digest(p_code || ':' || p_email, 'sha256'), 'hex');

  if v_hash = v_row.code_hash then
    update public.presignup_otp set consumed = true where id = v_row.id;
    return true;
  else
    update public.presignup_otp set attempts = attempts + 1 where id = v_row.id;
    return false;
  end if;
end;
$$;

grant execute on function public.request_presignup_otp(text, text) to anon, authenticated;
grant execute on function public.verify_presignup_otp(text, text)  to anon, authenticated;
