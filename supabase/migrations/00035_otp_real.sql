-- =====================================================================
-- OTP de verdad para confirmar operaciones
--
-- Hasta acá la pantalla de confirmación de pago comparaba el código
-- contra la constante "123456" en el navegador. Es decir: cualquiera que
-- llegara a esa pantalla confirmaba la operación, y el paso daba una
-- falsa sensación de seguridad -- peor que no tenerlo, porque el usuario
-- cree que está protegido.
--
-- Acá se implementa el lado servidor completo: generación, hash,
-- expiración, límite de intentos y límite de reenvíos. Lo único que
-- queda afuera es la ENTREGA, que necesita SMTP (Resend) y todavía no
-- está configurado.
--
-- Decisión importante: mientras no haya canal de entrega, otp_solicitar()
-- devuelve enviado = false con motivo 'sin_canal'. La app NO debe aceptar
-- un código fijo en ese caso: debe decir que la verificación no está
-- disponible. Un OTP simulado es exactamente lo que veníamos a eliminar.
--
-- Para habilitarlo cuando Resend esté listo, un solo UPDATE:
--   update public.app_config set value = 'true' where key = 'otp_email_enabled';
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Configuración de la plataforma
--
-- Solo la leen funciones SECURITY DEFINER. No se abre a authenticated:
-- si el cliente pudiera leerla, sabría qué controles están apagados.
-- ---------------------------------------------------------------------
create table if not exists public.app_config (
  key         varchar(60) primary key,
  value       text        not null,
  description text,
  updated_at  timestamptz not null default now()
);

comment on table public.app_config is
  'Interruptores de plataforma. Se leen solo desde funciones SECURITY DEFINER.';

insert into public.app_config (key, value, description) values
  ('otp_email_enabled', 'false',
   'Hay un canal de correo capaz de entregar el OTP. Ponerlo en true cuando Resend esté configurado.')
on conflict (key) do nothing;

alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. email_otps: faltaba distinguir para qué es cada código
-- ---------------------------------------------------------------------
alter table public.email_otps
  add column if not exists purpose varchar(40) not null default 'generic',
  add column if not exists user_id uuid references public.users(id) on delete cascade;

create index if not exists email_otps_lookup_idx
  on public.email_otps (user_id, purpose, created_at desc);

alter table public.email_otps enable row level security;
-- Nadie lo lee desde el cliente: contiene los hashes de los códigos.
revoke all on public.email_otps from anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Solicitar un código
-- ---------------------------------------------------------------------
create or replace function public.otp_solicitar(p_proposito varchar default 'transfer')
returns table (enviado boolean, expira_en timestamptz, motivo text)
  language plpgsql volatile security definer
  -- pgcrypto (crypt, gen_salt, gen_random_bytes) vive en 'extensions',
  -- no en 'public': sin incluirlo el search_path la funcion no lo ve.
  set search_path to 'public', 'extensions'
as $fn$
declare
  v_user     uuid := auth.uid();
  v_email    varchar;
  v_codigo   text;
  v_expira   timestamptz := now() + interval '10 minutes';
  v_recientes integer;
  v_habilitado boolean;
begin
  if v_user is null then
    raise exception 'Sin sesión' using errcode = '42501';
  end if;

  select email into v_email from public.users where id = v_user;
  if v_email is null then
    raise exception 'El usuario no tiene perfil' using errcode = 'P0002';
  end if;

  -- Límite de reenvíos: 5 por hora y propósito. Evita usar el OTP como
  -- ametralladora de correos contra un tercero.
  select count(*) into v_recientes
    from public.email_otps
   where user_id = v_user
     and purpose = p_proposito
     and created_at > now() - interval '1 hour';

  if v_recientes >= 5 then
    return query select false, null::timestamptz, 'demasiados_intentos'::text;
    return;
  end if;

  select value = 'true' into v_habilitado
    from public.app_config where key = 'otp_email_enabled';

  -- Código de 6 dígitos con ceros a la izquierda, de una fuente
  -- criptográfica (random() de Postgres no lo es).
  v_codigo := lpad((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint % 1000000)::text, 6, '0');

  -- Pedir un código nuevo invalida los anteriores: si convivieran
  -- varios vigentes, cada reenvío ampliaría la superficie de ataque en
  -- vez de reducirla.
  update public.email_otps set used = true
   where user_id = v_user and purpose = p_proposito and not used;

  -- Se guarda el hash, nunca el código. Si alguien lee la tabla no puede
  -- confirmar operaciones ajenas.
  insert into public.email_otps (email, user_id, purpose, code_hash, expires_at)
  values (v_email, v_user, p_proposito, crypt(v_codigo, gen_salt('bf')), v_expira);

  if not coalesce(v_habilitado, false) then
    -- Sin canal no hay forma de que el código llegue. Se informa para
    -- que la app lo diga, en vez de pedir un código que nadie recibió.
    return query select false, v_expira, 'sin_canal'::text;
    return;
  end if;

  -- Con canal, la entrega va por la misma cola que el resto de avisos.
  perform pgmq.send('notification_jobs', jsonb_build_object(
    'type', 'otp',
    'user_id', v_user,
    'email', v_email,
    'purpose', p_proposito,
    'code', v_codigo,
    'expires_at', v_expira
  ));

  return query select true, v_expira, null::text;
end;
$fn$;

comment on function public.otp_solicitar(varchar) is
  'Genera un OTP, guarda su hash y lo encola para envío. Devuelve enviado=false con motivo sin_canal si no hay SMTP configurado.';

-- ---------------------------------------------------------------------
-- 4. Verificar un código
-- ---------------------------------------------------------------------
create or replace function public.otp_verificar(
  p_codigo    varchar,
  p_proposito varchar default 'transfer'
)
returns table (valido boolean, motivo text)
  language plpgsql volatile security definer
  -- pgcrypto (crypt, gen_salt, gen_random_bytes) vive en 'extensions',
  -- no en 'public': sin incluirlo el search_path la funcion no lo ve.
  set search_path to 'public', 'extensions'
as $fn$
declare
  v_user uuid := auth.uid();
  v_fila public.email_otps%rowtype;
begin
  if v_user is null then
    raise exception 'Sin sesión' using errcode = '42501';
  end if;

  select * into v_fila
    from public.email_otps
   where user_id = v_user and purpose = p_proposito and not used
   order by created_at desc
   limit 1;

  if v_fila.id is null then
    return query select false, 'no_solicitado'::text;
    return;
  end if;
  if v_fila.expires_at < now() then
    return query select false, 'expirado'::text;
    return;
  end if;
  if v_fila.attempts >= 3 then
    return query select false, 'bloqueado'::text;
    return;
  end if;

  -- El intento se cuenta SIEMPRE, acierte o no: si solo se contaran los
  -- fallos, probar los 10^6 códigos seguiría siendo posible.
  update public.email_otps set attempts = attempts + 1 where id = v_fila.id;

  if v_fila.code_hash = crypt(p_codigo, v_fila.code_hash) then
    -- Un código se usa una sola vez.
    update public.email_otps set used = true where id = v_fila.id;
    return query select true, null::text;
    return;
  end if;

  return query select false, 'incorrecto'::text;
end;
$fn$;

comment on function public.otp_verificar(varchar, varchar) is
  'Verifica un OTP contra su hash. Cuenta el intento siempre y lo marca usado al acertar.';

revoke all     on function public.otp_solicitar(varchar)          from public, anon;
revoke all     on function public.otp_verificar(varchar, varchar) from public, anon;
grant  execute on function public.otp_solicitar(varchar)          to authenticated;
grant  execute on function public.otp_verificar(varchar, varchar) to authenticated;

-- ---------------------------------------------------------------------
-- 5. ¿Está disponible la verificación?
--
-- La app necesita saberlo para decidir qué mostrar, pero sin poder leer
-- app_config entera.
-- ---------------------------------------------------------------------
create or replace function public.otp_disponible()
returns boolean
  language sql stable security definer
  -- pgcrypto (crypt, gen_salt, gen_random_bytes) vive en 'extensions',
  -- no en 'public': sin incluirlo el search_path la funcion no lo ve.
  set search_path to 'public', 'extensions'
as $fn$
  select coalesce((select value = 'true' from public.app_config where key = 'otp_email_enabled'), false);
$fn$;

revoke all     on function public.otp_disponible() from public, anon;
grant  execute on function public.otp_disponible() to authenticated;
