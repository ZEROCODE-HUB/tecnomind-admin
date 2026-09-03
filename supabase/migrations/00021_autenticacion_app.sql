-- =====================================================================
-- Autenticacion de la app
--
-- DECISION DE DISENO (importante, leer antes de tocar esto)
--
-- La app autentica con email + PIN. Magnate resolvia eso guardando en
-- user_auth_credentials una contrasena automatica CIFRADA (reversible) y
-- ademas un pin_hash en users: dos secretos para la misma identidad, uno
-- de ellos descifrable. Es fragil y duplica la superficie de ataque.
--
-- Aca la credencial es UNA SOLA y vive donde corresponde: Supabase Auth,
-- que la guarda con bcrypt y ya trae rotacion de tokens, rate limiting
-- por IP y revocacion de sesiones. El PIN es esa contrasena.
--
-- Consecuencias asumidas:
--   * El PIN pasa de 4 a 6 digitos. Con 4 son 10.000 combinaciones, muy
--     poco para ser la unica credencial; con 6 son 1.000.000.
--   * users.pin_hash queda SIN USAR. No se replica el secreto en dos
--     lugares: una sola fuente de verdad.
--   * user_auth_credentials queda SIN USAR. No se guardan contrasenas
--     reversibles.
--
-- LIMITACION CONOCIDA: un PIN de 6 digitos sigue siendo debil frente a
-- una credencial larga. La defensa de fondo es el rate limiting por IP de
-- Supabase Auth, mas el registro de intentos de aca abajo. Si el negocio
-- necesita mas, la via correcta es una Edge Function que valide el PIN
-- server-side con bloqueo por cuenta y recien entonces emita la sesion.
-- Queda planteado, no implementado, porque cambia el flujo de producto.
-- =====================================================================

comment on column public.users.pin_hash is
  'SIN USAR desde TecnoMind. La credencial vive en auth.users (bcrypt). Se conserva por compatibilidad con el esquema heredado.';

comment on table public.user_auth_credentials is
  'SIN USAR desde TecnoMind. Guardaba contrasenas reversibles. No escribir aca.';

-- ---------------------------------------------------------------------
-- Registro de intentos de acceso
--
-- Sirve para dos cosas: auditoria (la seccion Alertas del backoffice la
-- necesita) y detectar fuerza bruta contra una cuenta concreta.
-- ---------------------------------------------------------------------
create table if not exists public.login_attempts (
  id          uuid primary key default gen_random_uuid(),
  email       varchar(255) not null,
  success     boolean      not null,
  ip_address  inet,
  user_agent  text,
  failure_reason varchar(100),
  created_at  timestamptz  not null default now()
);

create index if not exists login_attempts_email_idx   on public.login_attempts (email, created_at desc);
create index if not exists login_attempts_created_idx on public.login_attempts (created_at desc);

comment on table public.login_attempts is
  'Intentos de acceso a la app. Solo se inserta; nadie los edita ni los borra.';

alter table public.login_attempts enable row level security;

-- Solo el backoffice los lee. Un usuario no tiene por que ver esto, y
-- exponerlos permitiria enumerar cuentas existentes.
create policy "Los operadores leen los intentos de acceso"
  on public.login_attempts for select to authenticated
  using (public.has_backoffice_permission('alertas', 'read'));

-- ---------------------------------------------------------------------
-- Registrar un intento
--
-- SECURITY DEFINER porque se llama desde una sesion anonima: en un login
-- fallido todavia no hay usuario autenticado.
-- ---------------------------------------------------------------------
create or replace function public.record_login_attempt(
  p_email varchar,
  p_success boolean,
  p_failure_reason varchar default null
) returns void
  language plpgsql security definer
  set search_path to 'public'
as $fn$
begin
  insert into public.login_attempts (email, success, failure_reason)
  values (lower(trim(p_email)), p_success, p_failure_reason);
end;
$fn$;

grant execute on function public.record_login_attempt(varchar, boolean, varchar) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Estado de bloqueo de una cuenta
--
-- Devuelve si hay que frenar y cuantos intentos quedan. No revela si el
-- email existe: responde igual para cuentas inexistentes, para no
-- convertirse en un enumerador de usuarios.
-- ---------------------------------------------------------------------
create or replace function public.check_login_blocked(p_email varchar)
returns table (blocked boolean, attempts_left integer, retry_after_seconds integer)
  language plpgsql stable security definer
  set search_path to 'public'
as $fn$
declare
  v_max_attempts constant integer := 5;
  v_window       constant interval := interval '15 minutes';
  v_fallidos integer;
  v_ultimo   timestamptz;
begin
  select count(*), max(created_at)
    into v_fallidos, v_ultimo
  from public.login_attempts
  where email = lower(trim(p_email))
    and not success
    and created_at > now() - v_window;

  if v_fallidos >= v_max_attempts then
    return query select
      true,
      0,
      greatest(0, extract(epoch from (v_ultimo + v_window - now()))::integer);
  else
    return query select false, v_max_attempts - v_fallidos, 0;
  end if;
end;
$fn$;

grant execute on function public.check_login_blocked(varchar) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Disponibilidad de identificadores, para el registro
--
-- check_user_exists() ya existia pero es SECURITY DEFINER y devuelve que
-- campo esta repetido: filtrada al cliente, permite enumerar documentos y
-- CUITs de clientes reales. Esta version responde solo si se puede seguir
-- o no, sin detallar cual choca.
-- ---------------------------------------------------------------------
create or replace function public.can_register(
  p_email varchar, p_document_number varchar, p_tax_id varchar
) returns boolean
  language sql stable security definer
  set search_path to 'public'
as $fn$
  select not exists (
    select 1 from public.users
    where email = lower(trim(p_email))
       or document_number = p_document_number
       or tax_id = p_tax_id
  );
$fn$;

grant execute on function public.can_register(varchar, varchar, varchar) to anon, authenticated;

revoke execute on function public.check_user_exists(text, text, text) from anon;
