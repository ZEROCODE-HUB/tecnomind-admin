-- =====================================================================
-- 00057_kyb.sql — Vinculación KYB (persona jurídica) post-registro
--
-- Regla de negocio: el registro/login NO cambian. Tras crear la cuenta, el
-- usuario queda 'pending' y su cuenta primaria nace 'blocked' → NO puede operar
-- (todos los RPCs de operación exigen accounts.status='active'). Debe completar
-- el formulario KYB (respuestas + documentos), un operador lo revisa desde el
-- admin y al APROBAR: verification_status='verified', cuenta 'active' y se
-- notifica al usuario. Al RECHAZAR: queda 'pending' (cuenta bloqueada) con el
-- motivo, y puede reenviar.
--
-- Consistencia pedida: TODOS los usuarios pasan a 'pending' (incluidos los que
-- estaban 'verified') y sus cuentas primarias se bloquean.
-- =====================================================================

begin;

-- 1) Tablas ------------------------------------------------------------------

-- Una solicitud por usuario. Las respuestas del cuestionario van en `answers`
-- (jsonb, flexible ante cambios del formulario); se denormalizan 4 campos clave
-- para el listado del admin.
create table if not exists public.kyb_submissions (
  user_id       uuid primary key references public.users(id) on delete cascade,
  status        text not null default 'draft'
                  check (status in ('draft','submitted','approved','rejected')),
  answers       jsonb not null default '{}'::jsonb,
  razon_social  text,
  nit           text,
  tipo_servicio text,
  volumen       text,
  admin_notes   text,
  reviewed_by   uuid references public.users(id),
  submitted_at  timestamptz,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_kyb_submissions_status on public.kyb_submissions (status);

-- Documentos (14 tipos). Clave (user_id, doc_type): re-subir reemplaza. El
-- archivo vive en el bucket privado `kyb-docs` bajo <user_id>/...
create table if not exists public.kyb_documents (
  user_id      uuid not null references public.users(id) on delete cascade,
  doc_type     text not null,
  storage_path text not null,
  file_name    text,
  uploaded_at  timestamptz not null default now(),
  primary key (user_id, doc_type)
);

create or replace function public.kyb_touch_updated_at()
  returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_kyb_touch on public.kyb_submissions;
create trigger trg_kyb_touch before update on public.kyb_submissions
  for each row execute function public.kyb_touch_updated_at();

-- 2) RLS ---------------------------------------------------------------------
alter table public.kyb_submissions enable row level security;
alter table public.kyb_documents  enable row level security;
revoke all on public.kyb_submissions from anon;
revoke all on public.kyb_documents  from anon;

-- Usuario gestiona lo suyo; operador con permiso verificacion/read ve todo.
drop policy if exists kyb_sub_select on public.kyb_submissions;
create policy kyb_sub_select on public.kyb_submissions for select to authenticated
  using (user_id = auth.uid() or public.has_backoffice_permission('verificacion','read'));

drop policy if exists kyb_sub_insert on public.kyb_submissions;
create policy kyb_sub_insert on public.kyb_submissions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists kyb_sub_update on public.kyb_submissions;
create policy kyb_sub_update on public.kyb_submissions for update to authenticated
  using (user_id = auth.uid() and status in ('draft','rejected'))
  with check (user_id = auth.uid());

drop policy if exists kyb_doc_select on public.kyb_documents;
create policy kyb_doc_select on public.kyb_documents for select to authenticated
  using (user_id = auth.uid() or public.has_backoffice_permission('verificacion','read'));

drop policy if exists kyb_doc_write on public.kyb_documents;
create policy kyb_doc_write on public.kyb_documents for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update        on public.kyb_submissions to authenticated;
grant select, insert, update, delete on public.kyb_documents  to authenticated;

-- 3) Storage: bucket privado -------------------------------------------------
insert into storage.buckets (id, name, public)
values ('kyb-docs', 'kyb-docs', false)
on conflict (id) do nothing;

-- Cada usuario lee/escribe su carpeta <uid>/...; operadores leen todo.
drop policy if exists kyb_obj_user_rw on storage.objects;
create policy kyb_obj_user_rw on storage.objects for all to authenticated
  using      (bucket_id = 'kyb-docs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'kyb-docs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists kyb_obj_operator_read on storage.objects;
create policy kyb_obj_operator_read on storage.objects for select to authenticated
  using (bucket_id = 'kyb-docs' and public.has_backoffice_permission('verificacion','read'));

-- 4) RPC: enviar/actualizar la solicitud (usuario) ---------------------------
create or replace function public.submit_kyb(p_answers jsonb)
  returns void language plpgsql security definer set search_path to 'public'
as $$
begin
  insert into public.kyb_submissions as s
    (user_id, status, answers, razon_social, nit, tipo_servicio, volumen, submitted_at, updated_at)
  values (
    auth.uid(), 'submitted', coalesce(p_answers, '{}'::jsonb),
    p_answers->>'razon_social', p_answers->>'nit',
    p_answers->>'tipo_servicio', p_answers->>'volumen',
    now(), now())
  on conflict (user_id) do update set
    status        = 'submitted',
    answers       = excluded.answers,
    razon_social  = excluded.razon_social,
    nit           = excluded.nit,
    tipo_servicio = excluded.tipo_servicio,
    volumen       = excluded.volumen,
    admin_notes   = null,
    submitted_at  = now(),
    updated_at    = now()
  where s.status in ('draft','rejected','submitted');
end $$;
grant execute on function public.submit_kyb(jsonb) to authenticated;

-- 5) RPC: aprobar/rechazar (operador) ---------------------------------------
create or replace function public.backoffice_approve_kyb(
  p_user_id uuid, p_approve boolean, p_notes text default null
) returns void language plpgsql security definer set search_path to 'public'
as $$
declare v_sub public.kyb_submissions;
begin
  if not public.has_backoffice_permission('verificacion','update') then
    raise exception 'FORBIDDEN: Sin permiso para resolver verificaciones' using errcode = '42501';
  end if;

  select * into v_sub from public.kyb_submissions where user_id = p_user_id for update;
  if not found then
    raise exception 'NOT_FOUND: El usuario no tiene solicitud KYB';
  end if;

  if p_approve then
    update public.kyb_submissions
      set status='approved', admin_notes=p_notes, reviewed_by=auth.uid(),
          reviewed_at=now(), updated_at=now()
      where user_id = p_user_id;
    update public.users
      set verification_status='verified', updated_at=now()
      where id = p_user_id;
    update public.accounts
      set status='active', updated_at=now()
      where user_id = p_user_id and is_primary and status <> 'active';
    perform enqueue_notification(p_user_id, 'kyc_approved',
      jsonb_build_object('notes', p_notes));
  else
    update public.kyb_submissions
      set status='rejected', admin_notes=p_notes, reviewed_by=auth.uid(),
          reviewed_at=now(), updated_at=now()
      where user_id = p_user_id;
    -- se mantiene 'pending' (cuenta bloqueada); el usuario puede reenviar.
    perform enqueue_notification(p_user_id, 'kyc_rejected',
      jsonb_build_object('reason', p_notes));
  end if;
end $$;
grant execute on function public.backoffice_approve_kyb(uuid, boolean, text) to authenticated;

-- 6) Plantillas de notificación ---------------------------------------------
insert into public.notification_types
  (code, name, description, priority, template_title, template_message, default_enabled, email_template_html)
values
  ('kyc_approved', 'Cuenta verificada', 'La verificación KYB fue aprobada', 1,
   '{"es":"¡Tu cuenta está activa!","en":"Your account is active!"}'::jsonb,
   '{"es":"Tu verificación fue aprobada. Ya podés operar en Burxia.","en":"Your verification was approved. You can now operate on Burxia."}'::jsonb,
   true,
   '{"es":"<div style=\"font-family:sans-serif;max-width:600px;margin:auto;padding:20px\"><h2>¡Tu cuenta está activa!</h2><p>Hola {{first_name}},</p><p>Completamos la revisión de tu verificación y fue <strong>aprobada</strong>. Ya podés operar en Burxia.</p></div>"}'::jsonb),

  ('kyc_rejected', 'Verificación rechazada', 'La verificación KYB fue rechazada', 1,
   '{"es":"Revisá tu verificación","en":"Review your verification"}'::jsonb,
   '{"es":"Tu verificación necesita correcciones. Motivo: {{reason}}","en":"Your verification needs changes. Reason: {{reason}}"}'::jsonb,
   true,
   '{"es":"<div style=\"font-family:sans-serif;max-width:600px;margin:auto;padding:20px\"><h2>Revisá tu verificación</h2><p>Hola {{first_name}},</p><p>Tu verificación necesita correcciones antes de aprobarla.</p><p><strong>Motivo:</strong> {{reason}}</p><p>Ingresá a la app para corregir y reenviar.</p></div>"}'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  template_title = excluded.template_title,
  template_message = excluded.template_message,
  email_template_html = excluded.email_template_html;

-- 7) Alta: usuarios nacen 'pending' (KYB manual, sin auto-verify de ZapSign) --
create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_kyc_external_id text;
  v_kyc_url         text;
begin
  v_kyc_external_id := coalesce(
    new.raw_user_meta_data->>'zapsign_verification_id',
    new.raw_user_meta_data->>'zapsign_doc_token',
    new.raw_user_meta_data->>'zapsign_id');
  v_kyc_url := coalesce(
    new.raw_user_meta_data->>'zapsign_contract_url',
    new.raw_user_meta_data->>'zapsign_url',
    new.raw_user_meta_data->>'zapsign_signed_file');

  insert into public.users (
    id, email, first_name, last_name, phone,
    document_type, document_number, tax_id, country_code,
    pin_hash, verification_status, web_access_enabled, created_at, updated_at
  )
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'nombres',        'FALTA_NOMBRE'),
    coalesce(new.raw_user_meta_data->>'apellidos',      'FALTA_APELLIDO'),
    coalesce(new.raw_user_meta_data->>'telefono',       '0000000000'),
    coalesce(new.raw_user_meta_data->>'tipo_documento', 'CC'),
    coalesce(new.raw_user_meta_data->>'dni',            '00000000'),
    coalesce(new.raw_user_meta_data->>'cuit',           '00000000000'),
    coalesce(new.raw_user_meta_data->>'pais',           'CO'),
    coalesce(new.raw_user_meta_data->>'pin_hash',       'NO_HASH_SENT'),
    'pending',          -- SIEMPRE pending: la verificación es KYB manual.
    false, now(), now()
  );

  -- Se guarda la identidad de ZapSign si vino, pero ya NO auto-verifica.
  if v_kyc_external_id is not null or v_kyc_url is not null then
    insert into public.kyc_verifications (user_id, provider, external_id, status, document_url, payload)
    values (new.id, 'zapsign', v_kyc_external_id, 'approved', v_kyc_url,
            new.raw_user_meta_data->'zapsign_data');
  end if;

  return new;
exception when others then
  raise log 'ERROR EN TRIGGER handle_new_user: %', sqlerrm;
  raise exception 'Error creando perfil de usuario: %', sqlerrm;
end;
$function$;

-- 8) La cuenta primaria nace bloqueada si el usuario no está verificado ------
create or replace function public.kyb_block_account_if_unverified()
  returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if new.is_primary and coalesce(
       (select verification_status from public.users where id = new.user_id), 'pending'
     ) <> 'verified' then
    new.status := 'blocked';
  end if;
  return new;
end $$;

drop trigger if exists trg_kyb_block_account on public.accounts;
create trigger trg_kyb_block_account before insert on public.accounts
  for each row execute function public.kyb_block_account_if_unverified();

-- 9) Backfill: TODOS a 'pending' y sus cuentas primarias bloqueadas ----------
update public.users
   set verification_status = 'pending', updated_at = now()
 where verification_status <> 'pending';

update public.accounts
   set status = 'blocked', updated_at = now()
 where is_primary
   and status = 'active'
   and user_id in (select id from public.users where verification_status <> 'verified');

commit;
