-- =====================================================================
-- Activación automática con ZapSign
--
-- Regla pedida: si el cliente pasa la verificación de ZapSign, su cuenta
-- queda activa y su identidad verificada — sin aprobación manual.
--
-- Como el registro EXIGE firmar el documento de ZapSign para poder crear
-- la cuenta, "tener token/URL de ZapSign" equivale a "pasó la verificación".
-- El trigger de alta usa eso para marcar verification_status = 'verified'
-- (antes quedaba 'pending' hasta que un operador lo aprobara). La cuenta
-- ya nace 'active', así que con esto el cliente queda operativo y verificado.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_kyc_external_id text;
  v_kyc_url         text;
  v_verificacion    text;
begin
  -- Se calculan ANTES del insert para decidir el estado de verificación.
  v_kyc_external_id := coalesce(
    new.raw_user_meta_data->>'zapsign_verification_id',
    new.raw_user_meta_data->>'zapsign_doc_token',
    new.raw_user_meta_data->>'zapsign_id');

  v_kyc_url := coalesce(
    new.raw_user_meta_data->>'zapsign_contract_url',
    new.raw_user_meta_data->>'zapsign_url',
    new.raw_user_meta_data->>'zapsign_signed_file');

  -- Pasó ZapSign (hay firma) => identidad verificada. Sin ZapSign => pendiente.
  v_verificacion := case
    when v_kyc_external_id is not null or v_kyc_url is not null then 'verified'
    else 'pending'
  end;

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
    coalesce(new.raw_user_meta_data->>'tipo_documento', 'CC'),
    coalesce(new.raw_user_meta_data->>'dni',            '00000000'),
    coalesce(new.raw_user_meta_data->>'cuit',           '00000000000'),
    coalesce(new.raw_user_meta_data->>'pais',           'CO'),
    coalesce(new.raw_user_meta_data->>'pin_hash',       'NO_HASH_SENT'),
    v_verificacion,
    false,
    now(), now()
  );

  if v_kyc_external_id is not null or v_kyc_url is not null then
    insert into public.kyc_verifications (user_id, provider, external_id, status, document_url, payload)
    values (new.id, 'zapsign', v_kyc_external_id, 'approved', v_kyc_url,
            new.raw_user_meta_data->'zapsign_data');
  end if;

  return new;
exception
  when others then
    raise log 'ERROR EN TRIGGER handle_new_user: %', sqlerrm;
    raise exception 'Error creando perfil de usuario: %', sqlerrm;
end;
$function$;

-- Backfill: quien ya pasó ZapSign (tiene un registro de KYC) pero quedó
-- 'pending', se marca verificado, y su cuenta principal se asegura activa.
update public.users u
   set verification_status = 'verified', updated_at = now()
 where u.verification_status <> 'verified'
   and exists (select 1 from public.kyc_verifications k where k.user_id = u.id);

update public.accounts a
   set status = 'active', updated_at = now()
 where a.is_primary
   and a.status <> 'active'
   and exists (
     select 1 from public.users u
      where u.id = a.user_id
        and u.verification_status = 'verified'
   );
