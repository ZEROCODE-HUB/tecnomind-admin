-- =====================================================================
-- 00041: Generalizar identificadores de cuenta (base reutilizable)
--
-- CVU/CBU son de Argentina (Clave Virtual/Bancaria Uniforme). Para que la
-- base sirva en otros países/proyectos se COLAPSAN en un único identificador
-- genérico `account_number` (toma el valor del ex-cvu; se elimina cbu).
-- `alias` se mantiene (es genérico). `document_number`/`tax_id` ya eran genéricos.
--
-- Toca: accounts, transactions, 4 vistas y 11 funciones (incl. process_transfer).
-- =====================================================================

-- 0) Trigger y vistas dependientes de cvu/cbu (se recrean después)
drop trigger if exists trigger_sync_qr_data_from_account on public.accounts;
drop view if exists public.account_balance_reconciliation cascade;
drop view if exists public.admin_transaction_list cascade;
drop view if exists public.backoffice_clients cascade;
drop view if exists public.backoffice_transactions cascade;

-- 1) Tablas: colapsar a account_number
-- `accounts.account_number` ya existía como un entero secuencial VESTIGIAL (todo
-- NULL, sin uso en funciones/vistas/código); se elimina para liberar el nombre.
alter table public.accounts drop column account_number;
alter table public.accounts rename column cvu to account_number;
alter table public.accounts drop column cbu;
alter table public.transactions rename column external_cvu to external_account_number;
alter table public.transactions drop column external_cbu;

-- índices (renombrar el del ex-cvu; el de cbu se fue con la columna)
alter index if exists accounts_cvu_key rename to accounts_account_number_key;
alter index if exists idx_accounts_cvu rename to idx_accounts_account_number;

-- 2) Generación: un solo generador genérico
drop function if exists public.generate_unique_cbu();
drop function if exists public.generate_unique_cvu();
create or replace function public.generate_unique_account_number()
 returns character varying language plpgsql
as $function$
declare v_num varchar(22); v_exists boolean;
begin
  loop
    v_num := '0000001' || lpad(floor(random() * 999999999999999)::text, 15, '0');
    select exists(select 1 from accounts where account_number = v_num) into v_exists;
    exit when not v_exists;
  end loop;
  return v_num;
end;
$function$;

-- 3) create_user_bank_account (sin cbu)
create or replace function public.create_user_bank_account(p_user_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare
  v_account_id uuid; v_account_type_id uuid; v_account_number varchar(22);
  v_alias varchar(50); v_user_document varchar; v_qr_id uuid; v_qr_hash varchar(64);
  v_qr_data text; v_result jsonb; v_account_count integer;
begin
  select count(*) into v_account_count from accounts where user_id = p_user_id;
  if v_account_count > 0 then
    raise exception 'USER_HAS_ACCOUNT: El usuario ya tiene una cuenta';
  end if;

  select document_number into v_user_document from users where id = p_user_id;
  if v_user_document is null then
    raise exception 'USER_DOCUMENT_MISSING: El usuario no tiene documento asignado';
  end if;

  select id into v_account_type_id from account_types where code = 'savings_ars' and is_active = true limit 1;
  if v_account_type_id is null then
    raise exception 'ACCOUNT_TYPE_NOT_FOUND: Tipo de cuenta no encontrado';
  end if;

  v_account_number := generate_unique_account_number();
  v_alias := public.get_alias_prefix() || '.' || replace(v_user_document, '.', '');

  insert into accounts (user_id, account_type_id, account_number, alias, balance, status, is_primary, created_at, updated_at)
  values (p_user_id, v_account_type_id, v_account_number, v_alias, 0.00, 'active', true, now(), now())
  returning id into v_account_id;

  insert into account_limits (account_id, monthly_limit, monthly_spent, daily_limit, daily_spent,
                              per_transaction_limit, current_period_start, current_period_end, updated_at)
  values (v_account_id, 800000.00, 0.00, 50000.00, 0.00, 100000.00,
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
exception when others then
  raise exception 'CREATE_ACCOUNT_FAILED: %', sqlerrm;
end;
$function$;

-- 4) generate_static_qr
create or replace function public.generate_static_qr(p_account_id uuid)
 returns uuid language plpgsql
as $function$
declare v_qr_id uuid; v_account_number varchar; v_user_name varchar; v_qr_data jsonb; v_qr_hash varchar;
begin
  select a.account_number, u.first_name || ' ' || u.last_name
  into v_account_number, v_user_name
  from accounts a join users u on a.user_id = u.id
  where a.id = p_account_id;
  if not found then raise exception 'Cuenta no encontrada'; end if;

  v_qr_data := jsonb_build_object('account_number', v_account_number, 'account_id', p_account_id,
    'holder_name', v_user_name, 'version', '1.0', 'type', 'static');
  v_qr_hash := encode(digest(v_qr_data::text, 'sha256'), 'hex');

  insert into qr_codes (account_id, qr_data, qr_hash, qr_type, is_active)
  values (p_account_id, v_qr_data::text, v_qr_hash, 'static', true)
  returning id into v_qr_id;
  return v_qr_id;
end;
$function$;

-- 5) sync_qr_data_from_account (trigger)
create or replace function public.sync_qr_data_from_account()
 returns trigger language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
begin
  update public.qr_codes
  set qr_data = jsonb_build_object(
        'account_number', new.account_number, 'alias', new.alias,
        'type', (qr_data::jsonb)->>'type', 'account_id', new.id::text)::text,
      qr_hash = encode(digest(jsonb_build_object(
            'account_number', new.account_number, 'alias', new.alias,
            'type', (qr_data::jsonb)->>'type', 'account_id', new.id::text)::text, 'sha256'), 'hex')
  where account_id = new.id and is_active = true;
  return new;
end;
$function$;

create trigger trigger_sync_qr_data_from_account
  after update on public.accounts for each row
  when (old.alias::text is distinct from new.alias::text
        or old.account_number::text is distinct from new.account_number::text)
  execute function public.sync_qr_data_from_account();

-- 6) search_account_for_transfer (alias o account_number)
create or replace function public.search_account_for_transfer(p_identifier character varying)
 returns TABLE(account_id uuid, holder_name character varying, alias character varying, is_external boolean)
 language plpgsql security definer
as $function$
begin
  return query
  select a.id, cast((u.first_name || ' ' || u.last_name) as varchar), a.alias, false
  from accounts a join users u on a.user_id = u.id
  where a.status = 'active'
    and (lower(a.alias) = lower(p_identifier) or a.account_number = p_identifier)
  limit 1;

  if not found and p_identifier ~ '^\d{22}$' then
    return query select null::uuid, cast('Cuenta Externa' as varchar), null::varchar, true;
  end if;
end;
$function$;

-- 7) process_transfer (busca por alias o account_number; externo -> external_account_number)
create or replace function public.process_transfer(p_from_account_id uuid, p_to_identifier character varying, p_amount numeric, p_concept character varying DEFAULT ''::character varying, p_payment_method character varying DEFAULT 'account_number'::character varying, p_device_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet)
 returns jsonb language plpgsql security definer
as $function$
declare
  v_transaction_id uuid; v_to_account_id uuid; v_from_balance decimal;
  v_monthly_limit decimal; v_monthly_spent decimal; v_daily_limit decimal; v_daily_spent decimal;
  v_per_transaction_limit decimal; v_from_status varchar; v_to_status varchar;
  v_transfer_out_type_id uuid; v_transfer_in_type_id uuid; v_external_holder varchar;
  v_is_external boolean := false; v_commission decimal := 0.00; v_net_amount decimal;
  v_reference_number varchar; v_result jsonb; v_user_id uuid;
begin
  select user_id into v_user_id from accounts where id = p_from_account_id;
  if v_user_id != auth.uid() then
    raise exception 'UNAUTHORIZED: No tienes permisos para usar esta cuenta';
  end if;

  select id into v_transfer_out_type_id from transaction_types where code = 'transfer_out';
  select id into v_transfer_in_type_id from transaction_types where code = 'transfer_in';
  if v_transfer_out_type_id is null or v_transfer_in_type_id is null then
    raise exception 'TRANSACTION_TYPES_NOT_FOUND: Tipos de transacción no configurados';
  end if;

  select balance, status into v_from_balance, v_from_status
  from accounts where id = p_from_account_id for update;
  if not found then raise exception 'ACCOUNT_NOT_FOUND: Cuenta de origen no encontrada'; end if;
  if v_from_status != 'active' then raise exception 'ACCOUNT_NOT_ACTIVE: Cuenta de origen no está activa (%)', v_from_status; end if;
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT: El monto debe ser mayor a 0'; end if;

  -- Buscar cuenta destino (por alias o número de cuenta)
  select id, status into v_to_account_id, v_to_status
  from accounts
  where (lower(alias) = lower(p_to_identifier) or account_number = p_to_identifier)
    and status = 'active' for update;

  if not found then
    v_is_external := true; v_external_holder := 'Cuenta Externa'; v_commission := 0.00;
  else
    v_commission := 0.00;
  end if;
  v_net_amount := p_amount - v_commission;

  if p_from_account_id = v_to_account_id then
    raise exception 'SAME_ACCOUNT: No puedes transferir a tu propia cuenta';
  end if;
  if v_from_balance < p_amount then
    raise exception 'INSUFFICIENT_BALANCE: Saldo insuficiente. Disponible: %, Requerido: %', v_from_balance, p_amount;
  end if;

  select monthly_limit, monthly_spent, daily_limit, daily_spent, per_transaction_limit
  into v_monthly_limit, v_monthly_spent, v_daily_limit, v_daily_spent, v_per_transaction_limit
  from account_limits where account_id = p_from_account_id for update;
  if not found then raise exception 'LIMITS_NOT_FOUND: Límites de cuenta no configurados'; end if;
  if v_monthly_limit is not null and (v_monthly_spent + p_amount) > v_monthly_limit then
    raise exception 'MONTHLY_LIMIT_EXCEEDED: Excede el límite mensual. Límite: %, Gastado: %, Intentando: %', v_monthly_limit, v_monthly_spent, p_amount;
  end if;
  if v_daily_limit is not null and (v_daily_spent + p_amount) > v_daily_limit then
    raise exception 'DAILY_LIMIT_EXCEEDED: Excede el límite diario. Límite: %, Gastado: %, Intentando: %', v_daily_limit, v_daily_spent, p_amount;
  end if;
  if v_per_transaction_limit is not null and p_amount > v_per_transaction_limit then
    raise exception 'PER_TRANSACTION_LIMIT_EXCEEDED: Excede el límite por transacción. Límite: %, Intentando: %', v_per_transaction_limit, p_amount;
  end if;

  v_reference_number := 'TRX-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text, 1, 8));

  insert into transactions (
    transaction_type_id, from_account_id, to_account_id,
    external_account_number, external_alias, external_holder_name,
    amount, currency, concept, payment_method, payment_reference, status,
    commission_amount, net_amount, processed_by, initiated_from_device_id, initiated_from_ip,
    reference_number, processing_at, completed_at, metadata
  ) values (
    v_transfer_out_type_id, p_from_account_id, null,
    case when v_is_external and p_payment_method <> 'alias' then p_to_identifier else null end,
    case when v_is_external and p_payment_method = 'alias' then p_to_identifier else null end,
    case when v_is_external then v_external_holder else null end,
    p_amount, 'ARS', p_concept, p_payment_method, p_to_identifier, 'completed',
    v_commission, v_net_amount, 'system', p_device_id, p_ip_address,
    v_reference_number, now(), now(),
    jsonb_build_object('is_external', v_is_external, 'commission_applied', v_commission > 0, 'to_account_id', v_to_account_id)
  ) returning id into v_transaction_id;

  if not v_is_external then
    insert into transactions (
      transaction_type_id, from_account_id, to_account_id, amount, currency, concept,
      payment_method, payment_reference, status, commission_amount, net_amount, processed_by,
      initiated_from_device_id, initiated_from_ip, reference_number, processing_at, completed_at, metadata
    ) values (
      v_transfer_in_type_id, null, v_to_account_id, p_amount, 'ARS', p_concept,
      p_payment_method, p_to_identifier, 'completed', 0.00, p_amount, 'system',
      p_device_id, p_ip_address, v_reference_number || '-IN', now(), now(),
      jsonb_build_object('related_transaction_id', v_transaction_id, 'is_incoming', true, 'from_account_id', p_from_account_id)
    );
  end if;

  perform reconcile_account_balance(p_from_account_id);
  if not v_is_external then perform reconcile_account_balance(v_to_account_id); end if;

  update account_limits set monthly_spent = monthly_spent + p_amount, daily_spent = daily_spent + p_amount, updated_at = now()
  where account_id = p_from_account_id;

  select balance into v_from_balance from accounts where id = p_from_account_id;

  v_result := jsonb_build_object('success', true, 'transaction_id', v_transaction_id,
    'reference_number', v_reference_number, 'amount', p_amount, 'commission', v_commission,
    'net_amount', v_net_amount, 'new_balance', v_from_balance, 'is_external', v_is_external,
    'to_account_id', v_to_account_id, 'status', 'completed', 'timestamp', now());
  return v_result;
exception when others then
  raise notice 'Error en process_transfer: % - %', sqlerrm, sqlstate;
  raise exception 'TRANSFER_FAILED: %', sqlerrm;
end;
$function$;

-- 8) Funciones con cambio de firma (RETURNS TABLE) -> DROP + CREATE
drop function if exists public.get_account_info(uuid);
create or replace function public.get_account_info(p_user_id uuid DEFAULT NULL::uuid)
 returns TABLE(account_id uuid, user_id uuid, account_number character varying, alias character varying, balance numeric, status character varying, is_primary boolean, monthly_limit numeric, monthly_spent numeric, monthly_available numeric, daily_limit numeric, daily_spent numeric, qr_code_hash character varying, qr_code_data text, created_at timestamp with time zone)
 language plpgsql stable security definer
as $function$
begin
  return query
  select a.id, a.user_id, a.account_number, a.alias, a.balance, a.status, a.is_primary,
    al.monthly_limit, al.monthly_spent, al.monthly_available, al.daily_limit, al.daily_spent,
    qr.qr_hash, qr.qr_data, a.created_at
  from accounts a
  left join account_limits al on al.account_id = a.id
  left join qr_codes qr on qr.account_id = a.id and qr.qr_type = 'static' and qr.is_active = true
  where a.user_id = coalesce(p_user_id, auth.uid()) and a.status = 'active'
  limit 1;
end;
$function$;

drop function if exists public.validate_qr(character varying);
create or replace function public.validate_qr(p_qr_hash character varying)
 returns TABLE(is_valid boolean, account_id uuid, account_number character varying, holder_name character varying, account_status character varying)
 language plpgsql stable
as $function$
begin
  return query
  select true, a.id, a.account_number, (u.first_name || ' ' || u.last_name)::varchar, a.status
  from qr_codes qr join accounts a on qr.account_id = a.id join users u on a.user_id = u.id
  where qr.qr_hash = p_qr_hash and qr.is_active = true and a.status = 'active';
  if not found then
    return query select false, null::uuid, null::varchar, null::varchar, null::varchar;
  end if;
end;
$function$;

-- 9) Vistas recreadas (account_number)
create view public.account_balance_reconciliation as
 select id as account_id, user_id, account_number, alias,
    balance as balance_materialized,
    calculate_account_balance(id) as balance_calculated,
    balance - calculate_account_balance(id) as difference,
    case when abs(balance - calculate_account_balance(id)) < 0.01 then 'OK'
         when abs(balance - calculate_account_balance(id)) < 1.00 then 'WARNING'
         else 'ERROR' end as status,
    updated_at as last_balance_update,
    (select count(*) from transactions t where (t.from_account_id = a.id or t.to_account_id = a.id) and t.status::text = 'completed') as total_transactions
 from accounts a where status::text = 'active';

drop function if exists public.get_balance_inconsistencies();
create or replace function public.get_balance_inconsistencies()
 returns TABLE(account_id uuid, user_id uuid, account_number character varying, alias character varying, balance_materialized numeric, balance_calculated numeric, difference numeric, status text, total_transactions bigint)
 language plpgsql stable security definer
as $function$
begin
  return query
  select r.account_id, r.user_id, r.account_number, r.alias, r.balance_materialized,
    r.balance_calculated, r.difference, r.status, r.total_transactions
  from account_balance_reconciliation r
  where r.status != 'OK' order by abs(r.difference) desc;
end;
$function$;

create view public.admin_transaction_list as
 select t.id, t.transaction_type_id, t.from_account_id, t.to_account_id,
    t.external_account_number, t.external_alias, t.external_holder_name,
    t.amount, t.currency, t.concept, t.payment_method, t.payment_reference, t.status,
    t.commission_amount, t.net_amount, t.processed_by, t.failure_reason, t.reference_number,
    t.metadata, t.initiated_from_device_id, t.initiated_from_ip, t.created_at, t.processing_at,
    t.completed_at, t.failed_at,
    fu.first_name as from_user_first_name, fu.last_name as from_user_last_name, fu.email as from_user_email,
    fu.phone as from_user_phone, fu.document_number as from_user_document,
    tu.first_name as to_user_first_name, tu.last_name as to_user_last_name, tu.email as to_user_email,
    tu.phone as to_user_phone, tu.document_number as to_user_document
 from transactions t
   left join accounts fa on t.from_account_id = fa.id
   left join users fu on fa.user_id = fu.id
   left join accounts ta on t.to_account_id = ta.id
   left join users tu on ta.user_id = tu.id;

create view public.backoffice_clients as
 select u.id, (u.first_name::text || ' ' || u.last_name::text) as full_name,
    u.first_name, u.last_name, u.email, u.phone, u.document_type, u.document_number, u.tax_id,
    u.country_code, u.verification_status, u.role, es_operador_backoffice(u.id) as is_operator, u.created_at,
    a.id as account_id, a.account_number, a.alias, a.balance,
    a.status as account_status, a.status_reason as account_status_reason,
    cr.status as compliance_status, cr.notes as compliance_notes, cr.reviewed_at as compliance_reviewed_at,
    k.score as kyc_score, k.provider as kyc_provider, k.status as kyc_status, k.verified_at as kyc_verified_at
 from users u
   left join accounts a on a.user_id = u.id and a.is_primary
   left join compliance_reviews cr on cr.user_id = u.id
   left join lateral (select kv.score, kv.provider, kv.status, kv.verified_at
       from kyc_verifications kv where kv.user_id = u.id order by kv.created_at desc limit 1) k on true;

create view public.backoffice_transactions as
 with resuelto as (
   select t.*,
     coalesce(t.from_account_id, (t.metadata ->> 'from_account_id')::uuid) as origen_id,
     coalesce(t.to_account_id, (t.metadata ->> 'to_account_id')::uuid) as destino_id
   from transactions t
 )
 select r.id, r.reference_number, r.created_at, r.completed_at, r.failed_at, r.amount,
    r.commission_amount, r.net_amount, r.currency, r.concept, r.payment_method, r.payment_reference,
    r.status, r.failure_reason, r.metadata,
    tt.code as type_code, tt.name as type_name, tt.category as type_category,
    r.origen_id as from_account_id, fa.account_number as from_account_number, fa.alias as from_alias,
    fu.id as from_user_id,
    case when fu.id is not null then (fu.first_name::text || ' ' || fu.last_name::text) else null end as from_user_name,
    fu.email as from_user_email, fu.document_number as from_user_document, fu.tax_id as from_user_tax_id,
    r.destino_id as to_account_id,
    coalesce(ta.account_number, r.external_account_number) as to_account_number,
    coalesce(ta.alias, r.external_alias) as to_alias,
    tu.id as to_user_id,
    coalesce(case when tu.id is not null then (tu.first_name::text || ' ' || tu.last_name::text) else null end, r.external_holder_name::text) as to_user_name,
    tu.email as to_user_email, tu.document_number as to_user_document, tu.tax_id as to_user_tax_id
 from resuelto r
   left join transaction_types tt on tt.id = r.transaction_type_id
   left join accounts fa on fa.id = r.origen_id
   left join users fu on fu.id = fa.user_id
   left join accounts ta on ta.id = r.destino_id
   left join users tu on tu.id = ta.user_id;

grant execute on function public.generate_unique_account_number() to authenticated;
