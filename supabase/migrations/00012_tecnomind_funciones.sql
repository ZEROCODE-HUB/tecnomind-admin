-- =====================================================================
-- Funciones y vistas adaptadas a los cambios de 00011
--
-- Solo se tocan las que referenciaban dni / cuit_cuil / zapsign_*, mas el
-- prefijo de alias, que decia "magnate". Las otras 51 funciones quedan
-- exactamente como estaban.
-- =====================================================================

-- ---------------------------------------------------------------------
-- check_user_exists: mismos parametros para no romper a los clientes,
-- apuntando a las columnas nuevas.
-- ---------------------------------------------------------------------
create or replace function public.check_user_exists(
  p_dni text default null, p_cuit text default null, p_email text default null
) returns jsonb
  language plpgsql security definer
  set search_path to 'public'
as $fn$
declare
  v_exists boolean := false;
  v_fields text[]  := '{}';
begin
  if p_dni is not null and p_dni <> '' then
    if exists (select 1 from public.users where document_number = p_dni) then
      v_exists := true;
      v_fields := array_append(v_fields, 'Documento');
    end if;
  end if;

  if p_cuit is not null and p_cuit <> '' then
    if exists (select 1 from public.users where tax_id = p_cuit) then
      v_exists := true;
      v_fields := array_append(v_fields, 'CUIT');
    end if;
  end if;

  if p_email is not null and p_email <> '' then
    if exists (select 1 from public.users where email = p_email) then
      v_exists := true;
      v_fields := array_append(v_fields, 'Email');
    end if;
  end if;

  return jsonb_build_object('exists', v_exists, 'fields', v_fields);
end;
$fn$;

-- ---------------------------------------------------------------------
-- create_user_bank_account: alias con prefijo de marca configurable.
--
-- El alias decia 'magnate.' + DNI. Se parametriza el prefijo en vez de
-- volver a incrustarlo, para que quede un solo lugar donde cambiarlo.
-- ---------------------------------------------------------------------
create or replace function public.get_alias_prefix() returns text
  language sql immutable
as $fn$ select 'tecnomind'::text $fn$;

comment on function public.get_alias_prefix() is
  'Prefijo de los alias de cuenta. Unico punto donde cambiarlo.';

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

  insert into account_limits (account_id, monthly_limit, monthly_spent, daily_limit, daily_spent,
                              per_transaction_limit, current_period_start, current_period_end, updated_at)
  values (v_account_id, 800000.00, 0.00, 50000.00, 0.00, 100000.00,
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

-- ---------------------------------------------------------------------
-- handle_new_user: sin columnas zapsign_*; el KYC va a kyc_verifications.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer
  set search_path to 'public'
as $fn$
declare
  v_kyc_external_id text;
  v_kyc_url         text;
begin
  insert into public.users (
    id, email, first_name, last_name, phone,
    document_type, document_number, tax_id, country_code,
    pin_hash, verification_status, web_access_enabled, created_at, updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombres',        'FALTA_NOMBRE'),
    coalesce(new.raw_user_meta_data->>'apellidos',      'FALTA_APELLIDO'),
    coalesce(new.raw_user_meta_data->>'telefono',       '0000000000'),
    coalesce(new.raw_user_meta_data->>'tipo_documento', 'DNI'),
    coalesce(new.raw_user_meta_data->>'dni',            '00000000'),
    coalesce(new.raw_user_meta_data->>'cuit',           '00000000000'),
    coalesce(new.raw_user_meta_data->>'pais',           'AR'),
    coalesce(new.raw_user_meta_data->>'pin_hash',       'NO_HASH_SENT'),
    'pending',   -- antes entraba como 'verified' sin haber verificado nada
    false,
    now(), now()
  );

  v_kyc_external_id := coalesce(
    new.raw_user_meta_data->>'zapsign_verification_id',
    new.raw_user_meta_data->>'zapsign_doc_token',
    new.raw_user_meta_data->>'zapsign_id');

  v_kyc_url := coalesce(
    new.raw_user_meta_data->>'zapsign_contract_url',
    new.raw_user_meta_data->>'zapsign_url',
    new.raw_user_meta_data->>'zapsign_signed_file');

  if v_kyc_external_id is not null or v_kyc_url is not null then
    insert into public.kyc_verifications (user_id, provider, external_id, status, document_url, payload)
    values (new.id, 'zapsign', v_kyc_external_id, 'pending', v_kyc_url,
            new.raw_user_meta_data->'zapsign_data');
  end if;

  return new;
exception
  when others then
    raise log 'ERROR EN TRIGGER handle_new_user: %', sqlerrm;
    raise exception 'Error creando perfil de usuario: %', sqlerrm;
end;
$fn$;

-- ---------------------------------------------------------------------
-- admin_transaction_list: mismas columnas de negocio, con los nombres
-- nuevos y con security_invoker desde su creacion.
-- ---------------------------------------------------------------------
drop view if exists public.admin_transaction_list;

create view public.admin_transaction_list
with (security_invoker = true) as
select t.id, t.transaction_type_id, t.from_account_id, t.to_account_id,
       t.external_cvu, t.external_cbu, t.external_alias, t.external_holder_name,
       t.amount, t.currency, t.concept, t.payment_method, t.payment_reference,
       t.status, t.commission_amount, t.net_amount, t.processed_by,
       t.failure_reason, t.reference_number, t.metadata,
       t.initiated_from_device_id, t.initiated_from_ip,
       t.created_at, t.processing_at, t.completed_at, t.failed_at,
       fu.first_name      as from_user_first_name,
       fu.last_name       as from_user_last_name,
       fu.email           as from_user_email,
       fu.phone           as from_user_phone,
       fu.document_number as from_user_document,
       tu.first_name      as to_user_first_name,
       tu.last_name       as to_user_last_name,
       tu.email           as to_user_email,
       tu.phone           as to_user_phone,
       tu.document_number as to_user_document
from public.transactions t
  left join public.accounts fa on t.from_account_id = fa.id
  left join public.users    fu on fa.user_id = fu.id
  left join public.accounts ta on t.to_account_id = ta.id
  left join public.users    tu on ta.user_id = tu.id;

revoke all  on table public.admin_transaction_list from anon, authenticated;
grant select on table public.admin_transaction_list to service_role;
