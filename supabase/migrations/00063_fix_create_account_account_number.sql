-- =====================================================================
-- 00063_fix_create_account_account_number.sql
-- HOTFIX CRÍTICO: el registro de usuarios estaba roto.
--
-- 00041 migró el esquema de cuentas de CBU/CVU (Magnate) a `account_number`
-- (dropeó `generate_unique_cbu`, renombró cvu→account_number y reescribió
-- `create_user_bank_account` acorde). Pero 00060 (límites configurables)
-- re-creó `create_user_bank_account` partiendo del CUERPO VIEJO (cbu/cvu):
-- llama a `generate_unique_cbu()`/`generate_unique_cvu()` (que ya no existen)
-- e inserta columnas `cbu`/`cvu` inexistentes, omitiendo `account_number`
-- (NOT NULL). Resultado: el trigger `trigger_auto_create_account` fallaba, el
-- trigger de signup re-lanzaba, y GoTrue devolvía "Database error saving new
-- user". Ninguna cuenta se creó desde que 00060 se aplicó.
--
-- Este fix vuelve a la lógica correcta de 00041 (account_number +
-- generate_unique_account_number + alias por prefijo+documento + QR con
-- account_number) CONSERVANDO el único cambio intencional de 00060: los
-- defaults de límites salen de app_config.
-- =====================================================================

begin;

create or replace function public.create_user_bank_account(p_user_id uuid) returns jsonb
  language plpgsql security definer
  set search_path to 'public', 'extensions'
as $fn$
declare
  v_account_id uuid;
  v_account_type_id uuid;
  v_account_number varchar(22);
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

  v_account_number := generate_unique_account_number();
  v_alias := public.get_alias_prefix() || '.' || replace(v_user_document, '.', '');

  insert into accounts (user_id, account_type_id, account_number, alias, balance, status, is_primary, created_at, updated_at)
  values (p_user_id, v_account_type_id, v_account_number, v_alias, 0.00, 'active', true, now(), now())
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

  v_qr_data := jsonb_build_object('account_id', v_account_id, 'account_number', v_account_number,
                                  'alias', v_alias, 'type', 'static')::text;
  v_qr_hash := replace(gen_random_uuid()::text, '-', '');

  insert into qr_codes (account_id, qr_data, qr_hash, qr_type, amount, concept,
                        expires_at, max_uses, is_active, times_used, created_at, updated_at)
  values (v_account_id, v_qr_data, v_qr_hash, 'static', null, 'Pago con QR',
          null, null, true, 0, now(), now())
  returning id into v_qr_id;

  v_result := jsonb_build_object(
    'success', true, 'account_id', v_account_id, 'account_number', v_account_number,
    'alias', v_alias, 'balance', 0.00, 'qr_id', v_qr_id, 'qr_hash', v_qr_hash, 'created_at', now());

  return v_result;
exception
  when others then
    raise exception 'CREATE_ACCOUNT_FAILED: %', sqlerrm;
end;
$fn$;

commit;
