-- =====================================================================
-- Alta de operadores desde el panel (sin registrarse en la app cliente)
--
-- Un operador es personal interno; no tiene sentido que se registre por la
-- app. Este RPC (admin-only) crea el usuario de auth con una contraseña
-- temporal e inserta su rol. Insertar en auth.users dispara el trigger
-- on_auth_user_created, que crea el perfil en public.users. Si el correo ya
-- existe, solo asigna el rol.
-- =====================================================================

create or replace function public.backoffice_create_operator(
  p_email     text,
  p_role_code text,
  p_nombre    text default null
)
returns table (creado boolean, temp_password text)
  language plpgsql volatile security definer
  set search_path to 'public', 'extensions', 'auth'
as $fn$
declare
  v_email    text := lower(trim(p_email));
  v_role     uuid;
  v_existing uuid;
  v_uid      uuid;
  v_pass     text;
  v_uniq     text := 'OP' || extract(epoch from clock_timestamp())::bigint::text
                        || substr(md5(random()::text), 1, 4);
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede crear operadores' using errcode = '42501';
  end if;
  if v_email = '' or position('@' in v_email) = 0 then
    raise exception 'Correo inválido' using errcode = '22023';
  end if;
  select id into v_role from public.backoffice_roles where code = p_role_code;
  if v_role is null then
    raise exception 'Rol inválido' using errcode = '22023';
  end if;

  -- ¿ya existe el usuario? -> solo asignar rol
  select id into v_existing from public.users where lower(email) = v_email;
  if v_existing is not null then
    insert into public.backoffice_user_roles (user_id, role_id, assigned_by)
    values (v_existing, v_role, auth.uid())
    on conflict (user_id, role_id) do nothing;
    perform public.backoffice_audit('operador.asignar_rol', 'backoffice', 'user', v_existing::text,
      '{}'::jsonb, jsonb_build_object('email', v_email, 'role', p_role_code));
    return query select false, null::text;
    return;
  end if;

  -- crear el usuario de auth (dispara el trigger que crea public.users)
  v_uid := gen_random_uuid();
  v_pass := substr(replace(replace(encode(gen_random_bytes(9), 'base64'), '/', 'x'), '+', 'y'), 1, 12);

  -- Los token columns van en '' (no NULL): GoTrue los lee como string y con
  -- NULL falla el login con "Database error querying schema".
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    v_email, crypt(v_pass, gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'nombres',        coalesce(nullif(trim(p_nombre), ''), split_part(v_email, '@', 1)),
      'apellidos',      '(operador)',
      'pais',           'CO',
      'tipo_documento', 'CC',
      'dni',            v_uniq,
      'cuit',           v_uniq
    ),
    '', '', '', '', '', '', '', ''
  );

  -- auth.identities.email es columna generada (de identity_data): NO se inserta.
  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_uid, v_uid::text, 'email',
    jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
    now(), now(), now()
  );

  insert into public.backoffice_user_roles (user_id, role_id, assigned_by)
  values (v_uid, v_role, auth.uid())
  on conflict (user_id, role_id) do nothing;

  perform public.backoffice_audit('operador.crear', 'backoffice', 'user', v_uid::text,
    '{}'::jsonb, jsonb_build_object('email', v_email, 'role', p_role_code));

  return query select true, v_pass;
end;
$fn$;

revoke all     on function public.backoffice_create_operator(text, text, text) from public, anon;
grant  execute on function public.backoffice_create_operator(text, text, text) to authenticated;
