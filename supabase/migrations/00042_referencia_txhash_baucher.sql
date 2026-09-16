-- 00042: Referencia interna legible (fecha + contador) y hash on-chain, para el
-- baucher/comprobante de operaciones OTC y de fondeo (depósitos/retiros).

create sequence if not exists public.otc_ref_seq;
create sequence if not exists public.funding_ref_seq;

alter table public.otc_orders       add column if not exists reference text;
alter table public.otc_orders       add column if not exists tx_hash   text;   -- hash del envío de cripto
alter table public.funding_requests add column if not exists reference text;

-- Referencia OTC: OTC-YYYYMMDD-000001
create or replace function public.set_otc_reference() returns trigger
language plpgsql as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'OTC-' || to_char(coalesce(new.created_at, now()), 'YYYYMMDD')
      || '-' || lpad(nextval('public.otc_ref_seq')::text, 6, '0');
  end if;
  return new;
end $$;
drop trigger if exists trg_otc_reference on public.otc_orders;
create trigger trg_otc_reference before insert on public.otc_orders
  for each row execute function public.set_otc_reference();

-- Referencia fondeo: DEP-/RET-YYYYMMDD-000001
create or replace function public.set_funding_reference() returns trigger
language plpgsql as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := (case new.kind when 'deposit' then 'DEP-' when 'withdrawal' then 'RET-' else 'TX-' end)
      || to_char(coalesce(new.created_at, now()), 'YYYYMMDD')
      || '-' || lpad(nextval('public.funding_ref_seq')::text, 6, '0');
  end if;
  return new;
end $$;
drop trigger if exists trg_funding_reference on public.funding_requests;
create trigger trg_funding_reference before insert on public.funding_requests
  for each row execute function public.set_funding_reference();

-- Backfill respetando el orden cronológico
update public.otc_orders o
  set reference = 'OTC-' || to_char(o.created_at,'YYYYMMDD') || '-' || lpad(x.rn::text,6,'0')
  from (select id, row_number() over (order by created_at) as rn from public.otc_orders where reference is null) x
  where o.id = x.id and o.reference is null;
select setval('public.otc_ref_seq', greatest((select count(*) from public.otc_orders), 1));

update public.funding_requests f
  set reference = (case f.kind when 'deposit' then 'DEP-' when 'withdrawal' then 'RET-' else 'TX-' end)
                  || to_char(f.created_at,'YYYYMMDD') || '-' || lpad(x.rn::text,6,'0')
  from (select id, row_number() over (order by created_at) as rn from public.funding_requests where reference is null) x
  where f.id = x.id and f.reference is null;
select setval('public.funding_ref_seq', greatest((select count(*) from public.funding_requests), 1));

-- complete_otc_order ahora acepta el hash on-chain (p_tx_hash). Se elimina la
-- versión de 2 args para evitar ambigüedad en PostgREST.
drop function if exists public.complete_otc_order(uuid, text);
CREATE OR REPLACE FUNCTION public.complete_otc_order(p_order_id uuid, p_admin_comment text DEFAULT NULL::text, p_tx_hash text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.otc_orders; v_type_id uuid; v_tx_id uuid; v_ref varchar;
begin
  if not public.has_backoffice_permission('otc','update') then
    raise exception 'FORBIDDEN: Sin permiso para resolver operaciones OTC';
  end if;

  select * into o from otc_orders where id = p_order_id for update;
  if not found or o.status <> 'pending' then
    raise exception 'INVALID_STATE: Operación inexistente o no pendiente';
  end if;

  if o.side = 'sell' then
    select id into v_type_id from transaction_types where code = 'otc_sell';
    v_ref := 'OTS-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text,1,8));
    insert into transactions (transaction_type_id, to_account_id, amount, currency, concept,
                              status, net_amount, reference_number, processed_by, metadata, created_at, completed_at)
    values (v_type_id, o.account_id, o.fiat_amount, 'ARS',
            'Venta OTC ' || o.amount_crypto || ' USDT',
            'completed', o.fiat_amount, v_ref, auth.uid()::text,
            jsonb_build_object('otc','sell','order_id',o.id,'amount_crypto',o.amount_crypto), now(), now())
    returning id into v_tx_id;
    perform reconcile_account_balance(o.account_id);
  else
    v_tx_id := o.transaction_id;
    update transactions
      set processed_by = auth.uid()::text,
          metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('review','completed')
    where id = o.transaction_id;
  end if;

  update otc_orders
    set status='completed', admin_comment=p_admin_comment,
        tx_hash = coalesce(nullif(p_tx_hash,''), tx_hash),
        transaction_id=coalesce(o.transaction_id, v_tx_id),
        reviewed_by=auth.uid(), resolved_at=now()
  where id = o.id;

  perform enqueue_notification(o.user_id, 'otc_completed',
    jsonb_build_object('side', o.side, 'amount_crypto', o.amount_crypto,
                       'fiat_amount', o.fiat_amount, 'comment', p_admin_comment), v_tx_id);
end;
$function$;
