-- =====================================================================
-- 00060: Límites de transacción configurables desde el backoffice.
--
-- Contexto: los límites (mensual/diario/por operación) viven por cuenta en
-- `account_limits` (00002), con defaults HARDCODEADOS al crear la cuenta
-- (800k/50k/100k en `create_user_bank_account`, 00012) y se validan solo en
-- `process_transfer` (transferencias). No había forma de configurarlos.
--
-- Este cambio: (a) defaults GLOBALES en app_config, (b) override POR USUARIO
-- marcado con `account_limits.is_custom`, (c) RPCs de backoffice para leer/
-- editar global y por usuario. Al cambiar el global se aplica a TODOS salvo los
-- que tengan límite personalizado. El enforcement sigue igual (solo transferir).
--
-- Mismo patrón que 00043 (verificación de dispositivo): app_config + RPCs
-- SECURITY DEFINER con has_backoffice_permission/is_admin + backoffice_audit.
-- =====================================================================

-- 1. Defaults GLOBALES (seed con los valores hoy hardcodeados). ----------
insert into public.app_config (key, value, description) values
  ('limite_transferencia_mensual',      '800000',
   'Límite mensual de transferencia por defecto (COP). Aplica a todos salvo override por usuario.'),
  ('limite_transferencia_diario',       '50000',
   'Límite diario de transferencia por defecto (COP). Aplica a todos salvo override por usuario.'),
  ('limite_transferencia_por_operacion','100000',
   'Límite por operación de transferencia por defecto (COP). Aplica a todos salvo override por usuario.')
on conflict (key) do nothing;

-- 2. Marca de override por usuario. false = sigue el global. --------------
alter table public.account_limits
  add column if not exists is_custom boolean not null default false;
comment on column public.account_limits.is_custom is
  'true = límites personalizados por backoffice (no los pisa el global). false = sigue el global. Lo mueve backoffice_set_limits_user/reset.';

-- 3. create_user_bank_account: los defaults del INSERT en account_limits
--    ahora salen de app_config (fiel a 00012; solo cambia el origen de los 3
--    montos). El resto de la función es idéntico.
create or replace function public.create_user_bank_account(p_user_id uuid) returns jsonb
  language plpgsql security definer
  set search_path to 'public', 'extensions'
as $fn$
declare
  v_account_id uuid;
  v_account_type_id uuid;
  v_cbu varchar(22);
  v_cvu varchar(22);
  v_alias varchar(50);
  v_user_document varchar;
  v_qr_id uuid;
  v_qr_hash varchar(64);
  v_qr_data text;
  v_result jsonb;
  v_account_count integer;
  v_lim_mensual numeric;
  v_lim_diario numeric;
  v_lim_operacion numeric;
begin
  select count(*) into v_account_count from accounts where user_id = p_user_id;
  if v_account_count > 0 then
    raise exception 'USER_HAS_ACCOUNT: El usuario ya tiene una cuenta bancaria';
  end if;

  select document_number into v_user_document from users where id = p_user_id;
  if v_user_document is null then
    raise exception 'USER_DOCUMENT_MISSING: El usuario no tiene documento asignado';
  end if;

  select id into v_account_type_id
  from account_types where code = 'savings_ars' and is_active = true limit 1;
  if v_account_type_id is null then
    raise exception 'ACCOUNT_TYPE_NOT_FOUND: Tipo de cuenta no encontrado';
  end if;

  v_cbu   := generate_unique_cbu();
  v_cvu   := generate_unique_cvu();
  v_alias := public.get_alias_prefix() || '.' || replace(v_user_document, '.', '');

  insert into accounts (user_id, account_type_id, cbu, cvu, alias, balance, status, is_primary, created_at, updated_at)
  values (p_user_id, v_account_type_id, v_cbu, v_cvu, v_alias, 0.00, 'active', true, now(), now())
  returning id into v_account_id;

  -- Defaults globales desde app_config (con fallback a los valores históricos).
  v_lim_mensual   := coalesce((select value::numeric from app_config where key = 'limite_transferencia_mensual'), 800000.00);
  v_lim_diario    := coalesce((select value::numeric from app_config where key = 'limite_transferencia_diario'), 50000.00);
  v_lim_operacion := coalesce((select value::numeric from app_config where key = 'limite_transferencia_por_operacion'), 100000.00);

  insert into account_limits (account_id, monthly_limit, monthly_spent, daily_limit, daily_spent,
                              per_transaction_limit, is_custom, current_period_start, current_period_end, updated_at)
  values (v_account_id, v_lim_mensual, 0.00, v_lim_diario, 0.00, v_lim_operacion, false,
          date_trunc('month', current_date)::date,
          (date_trunc('month', current_date) + interval '1 month - 1 day')::date, now());

  v_qr_data := jsonb_build_object('account_id', v_account_id, 'cvu', v_cvu, 'cbu', v_cbu,
                                  'alias', v_alias, 'type', 'static')::text;
  v_qr_hash := replace(gen_random_uuid()::text, '-', '');

  insert into qr_codes (account_id, qr_data, qr_hash, qr_type, amount, concept,
                        expires_at, max_uses, is_active, times_used, created_at, updated_at)
  values (v_account_id, v_qr_data, v_qr_hash, 'static', null, 'Pago con QR',
          null, null, true, 0, now(), now())
  returning id into v_qr_id;

  v_result := jsonb_build_object(
    'success', true, 'account_id', v_account_id, 'cbu', v_cbu, 'cvu', v_cvu,
    'alias', v_alias, 'balance', 0.00, 'qr_id', v_qr_id, 'qr_hash', v_qr_hash, 'created_at', now());

  return v_result;
exception
  when others then
    raise exception 'CREATE_ACCOUNT_FAILED: %', sqlerrm;
end;
$fn$;

-- 4a. Lectura del GLOBAL para el backoffice. -----------------------------
create or replace function public.backoffice_get_limits_global()
returns jsonb
  language plpgsql stable security definer
  set search_path to 'public'
as $fn$
begin
  if not (public.is_admin() or public.has_backoffice_permission('configuracion','read')) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'mensual',      coalesce((select value::numeric from app_config where key = 'limite_transferencia_mensual'), 800000),
    'diario',       coalesce((select value::numeric from app_config where key = 'limite_transferencia_diario'), 50000),
    'por_operacion',coalesce((select value::numeric from app_config where key = 'limite_transferencia_por_operacion'), 100000)
  );
end;
$fn$;
revoke all     on function public.backoffice_get_limits_global() from public, anon;
grant  execute on function public.backoffice_get_limits_global() to authenticated;

-- 4b. Setter GLOBAL: actualiza app_config y aplica a todos salvo custom. --
create or replace function public.backoffice_set_limits_global(
  p_mensual numeric, p_diario numeric, p_por_operacion numeric)
returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
declare v_antes jsonb;
begin
  if not (public.is_admin() or public.has_backoffice_permission('configuracion','update')) then
    raise exception 'Sin permiso para cambiar la configuración global' using errcode = '42501';
  end if;
  if p_mensual is null or p_diario is null or p_por_operacion is null
     or p_mensual < 0 or p_diario < 0 or p_por_operacion < 0 then
    raise exception 'Los límites deben ser números mayores o iguales a 0' using errcode = '22023';
  end if;

  v_antes := public.backoffice_get_limits_global();

  insert into public.app_config (key, value, description, updated_at) values
    ('limite_transferencia_mensual',       p_mensual::text,       'Límite mensual de transferencia por defecto (COP).', now()),
    ('limite_transferencia_diario',        p_diario::text,        'Límite diario de transferencia por defecto (COP).', now()),
    ('limite_transferencia_por_operacion', p_por_operacion::text, 'Límite por operación de transferencia por defecto (COP).', now())
  on conflict (key) do update set value = excluded.value, updated_at = now();

  -- Aplica a TODOS los que no tengan límite personalizado.
  update public.account_limits
     set monthly_limit = p_mensual,
         daily_limit = p_diario,
         per_transaction_limit = p_por_operacion,
         updated_at = now()
   where is_custom = false;

  perform public.backoffice_audit('limites.global', 'configuracion', 'app_config', 'limite_transferencia',
    v_antes,
    jsonb_build_object('mensual', p_mensual, 'diario', p_diario, 'por_operacion', p_por_operacion));
end;
$fn$;
revoke all     on function public.backoffice_set_limits_global(numeric, numeric, numeric) from public, anon;
grant  execute on function public.backoffice_set_limits_global(numeric, numeric, numeric) to authenticated;

-- 4c. Lectura de los límites de UN usuario. ------------------------------
create or replace function public.backoffice_get_limits_user(p_user_id uuid)
returns jsonb
  language plpgsql stable security definer
  set search_path to 'public'
as $fn$
declare v_row account_limits;
begin
  if not (public.is_admin() or public.has_backoffice_permission('usuarios','read')) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  select al.* into v_row
    from account_limits al
    join accounts a on a.id = al.account_id
   where a.user_id = p_user_id and a.is_primary = true
   limit 1;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'mensual',       v_row.monthly_limit,
    'diario',        v_row.daily_limit,
    'por_operacion', v_row.per_transaction_limit,
    'is_custom',     v_row.is_custom);
end;
$fn$;
revoke all     on function public.backoffice_get_limits_user(uuid) from public, anon;
grant  execute on function public.backoffice_get_limits_user(uuid) to authenticated;

-- 4d. Setter por usuario: marca is_custom=true (no lo pisa el global). ----
create or replace function public.backoffice_set_limits_user(
  p_user_id uuid, p_mensual numeric, p_diario numeric, p_por_operacion numeric)
returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
declare v_account_id uuid; v_antes jsonb;
begin
  if not public.has_backoffice_permission('usuarios','update') then
    raise exception 'Sin permiso para modificar clientes' using errcode = '42501';
  end if;
  if p_mensual is null or p_diario is null or p_por_operacion is null
     or p_mensual < 0 or p_diario < 0 or p_por_operacion < 0 then
    raise exception 'Los límites deben ser números mayores o iguales a 0' using errcode = '22023';
  end if;

  select id into v_account_id from accounts where user_id = p_user_id and is_primary = true limit 1;
  if v_account_id is null then
    raise exception 'ACCOUNT_NOT_FOUND: El usuario no tiene cuenta' using errcode = 'P0002';
  end if;

  v_antes := public.backoffice_get_limits_user(p_user_id);

  update public.account_limits
     set monthly_limit = p_mensual,
         daily_limit = p_diario,
         per_transaction_limit = p_por_operacion,
         is_custom = true,
         updated_at = now()
   where account_id = v_account_id;
  if not found then
    insert into account_limits (account_id, monthly_limit, monthly_spent, daily_limit, daily_spent,
                                per_transaction_limit, is_custom, current_period_start, current_period_end, updated_at)
    values (v_account_id, p_mensual, 0.00, p_diario, 0.00, p_por_operacion, true,
            date_trunc('month', current_date)::date,
            (date_trunc('month', current_date) + interval '1 month - 1 day')::date, now());
  end if;

  perform public.backoffice_audit('limites.user', 'usuarios', 'user', p_user_id::text,
    v_antes,
    jsonb_build_object('mensual', p_mensual, 'diario', p_diario, 'por_operacion', p_por_operacion, 'is_custom', true));
end;
$fn$;
revoke all     on function public.backoffice_set_limits_user(uuid, numeric, numeric, numeric) from public, anon;
grant  execute on function public.backoffice_set_limits_user(uuid, numeric, numeric, numeric) to authenticated;

-- 4e. Reset por usuario: vuelve al global (is_custom=false + copia global).
create or replace function public.backoffice_reset_limits_user(p_user_id uuid)
returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
declare v_account_id uuid; v_antes jsonb; v_m numeric; v_d numeric; v_o numeric;
begin
  if not public.has_backoffice_permission('usuarios','update') then
    raise exception 'Sin permiso para modificar clientes' using errcode = '42501';
  end if;
  select id into v_account_id from accounts where user_id = p_user_id and is_primary = true limit 1;
  if v_account_id is null then
    raise exception 'ACCOUNT_NOT_FOUND: El usuario no tiene cuenta' using errcode = 'P0002';
  end if;

  v_antes := public.backoffice_get_limits_user(p_user_id);
  v_m := coalesce((select value::numeric from app_config where key = 'limite_transferencia_mensual'), 800000);
  v_d := coalesce((select value::numeric from app_config where key = 'limite_transferencia_diario'), 50000);
  v_o := coalesce((select value::numeric from app_config where key = 'limite_transferencia_por_operacion'), 100000);

  update public.account_limits
     set monthly_limit = v_m, daily_limit = v_d, per_transaction_limit = v_o,
         is_custom = false, updated_at = now()
   where account_id = v_account_id;

  perform public.backoffice_audit('limites.user.reset', 'usuarios', 'user', p_user_id::text,
    v_antes,
    jsonb_build_object('mensual', v_m, 'diario', v_d, 'por_operacion', v_o, 'is_custom', false));
end;
$fn$;
revoke all     on function public.backoffice_reset_limits_user(uuid) from public, anon;
grant  execute on function public.backoffice_reset_limits_user(uuid) to authenticated;
