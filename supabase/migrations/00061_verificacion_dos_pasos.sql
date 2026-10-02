-- =====================================================================
-- 00061_verificacion_dos_pasos.sql — Onboarding en 2 pasos
--
-- Antes: el KYB (formulario) era el único gate. Al aprobarlo,
-- backoffice_approve_kyb ponía verification_status='verified' + cuenta
-- 'active' + notificaba. La verificación facial (ZapSign) solo se registraba
-- (kyc_completions), sin cambiar estado.
--
-- Ahora la verificación es en DOS pasos y operar exige AMBOS:
--   Paso 1 (formulario)  = kyb_submissions.status
--   Paso 2 (facial)      = users.facial_status  (NUEVO)
-- verification_status='verified' + cuenta 'active' se encienden SOLO cuando
-- los dos pasos están 'approved' (helper _finalize_verification_if_ready).
-- Aprobar el formulario YA NO activa la cuenta; solo habilita el paso 2.
-- La facial se auto-aprueba con el webhook (email_completo_kyc) y además el
-- operador tiene un override manual (backoffice_approve_facial).
-- =====================================================================

begin;

-- 1) Nuevo estado del paso 2 (verificación facial) ---------------------------
alter table public.users
  add column if not exists facial_status varchar(20) not null default 'none'
    check (facial_status in ('none','submitted','approved','rejected'));

-- Los que ya estaban 'verified' (modelo viejo) no deben regresar ni ver los
-- recuadros: su facial se considera aprobada.
update public.users
   set facial_status = 'approved'
 where verification_status = 'verified' and facial_status <> 'approved';

-- 2) Helper: finaliza la verificación cuando AMBOS pasos están aprobados -----
-- Idempotente: solo actúa si falta encender 'verified'. Activa la cuenta
-- primaria y notifica (plantilla final kyc_approved).
create or replace function public._finalize_verification_if_ready(p_user_id uuid)
  returns void language plpgsql security definer set search_path to 'public'
as $$
declare
  v_kyb    text;
  v_facial text;
  v_vs     text;
begin
  select status into v_kyb from public.kyb_submissions where user_id = p_user_id;
  select facial_status, verification_status into v_facial, v_vs
    from public.users where id = p_user_id;

  if v_kyb = 'approved' and v_facial = 'approved'
     and coalesce(v_vs, '') <> 'verified' then
    update public.users
      set verification_status = 'verified', updated_at = now()
      where id = p_user_id;
    update public.accounts
      set status = 'active', updated_at = now()
      where user_id = p_user_id and is_primary and status <> 'active';
    perform public.enqueue_notification(p_user_id, 'kyc_approved', '{}'::jsonb);
  end if;
end $$;
revoke all on function public._finalize_verification_if_ready(uuid) from public, anon;

-- 3) Aprobar/rechazar el FORMULARIO (operador) -------------------------------
-- Reemplazo fiel de 00057: al aprobar ya NO verifica ni activa la cuenta;
-- deja el formulario 'approved', notifica 'kyb_aprobado' (habilita el paso 2)
-- y llama al finalizador (por si la facial ya estaba aprobada).
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
    -- NO se activa la cuenta acá: falta el paso 2 (facial).
    perform enqueue_notification(p_user_id, 'kyb_aprobado',
      jsonb_build_object('notes', p_notes));
    perform public._finalize_verification_if_ready(p_user_id);
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

-- 4) RPC: el usuario reporta que completó la facial (auto por webhook) -------
-- Consulta email_completo_kyc (lo marca el webhook de ZapSign): si está
-- confirmado → facial 'approved'; si todavía no → 'submitted'. Luego finaliza.
create or replace function public.submit_facial_verification()
  returns text language plpgsql security definer set search_path to 'public'
as $$
declare
  v_uid       uuid := auth.uid();
  v_email     text;
  v_completed boolean;
  v_new       text;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  select email into v_email from public.users where id = v_uid;
  v_completed := public.email_completo_kyc(coalesce(v_email, ''));

  if v_completed then
    v_new := 'approved';
    update public.users
      set facial_status = 'approved', zapsign_verified_at = now(), updated_at = now()
      where id = v_uid;
  else
    v_new := 'submitted';
    update public.users
      set facial_status = case when facial_status = 'approved' then 'approved' else 'submitted' end,
          updated_at = now()
      where id = v_uid;
  end if;

  perform public._finalize_verification_if_ready(v_uid);
  return v_new;
end $$;
revoke all on function public.submit_facial_verification() from public, anon;
grant execute on function public.submit_facial_verification() to authenticated;

-- 5) RPC: override manual de la facial (operador) ----------------------------
create or replace function public.backoffice_approve_facial(
  p_user_id uuid, p_approve boolean, p_notes text default null
) returns void language plpgsql security definer set search_path to 'public'
as $$
begin
  if not public.has_backoffice_permission('verificacion','update') then
    raise exception 'FORBIDDEN: Sin permiso para resolver verificaciones' using errcode = '42501';
  end if;

  if p_approve then
    update public.users
      set facial_status = 'approved',
          zapsign_verified_at = coalesce(zapsign_verified_at, now()),
          updated_at = now()
      where id = p_user_id;
    perform public._finalize_verification_if_ready(p_user_id);
  else
    update public.users
      set facial_status = 'rejected', updated_at = now()
      where id = p_user_id;
  end if;

  perform public.backoffice_audit(
    case when p_approve then 'approve_facial' else 'reject_facial' end,
    'verificacion', 'user', p_user_id::text, null,
    jsonb_build_object('facial_status', case when p_approve then 'approved' else 'rejected' end,
                       'notes', p_notes));
end $$;
revoke all on function public.backoffice_approve_facial(uuid, boolean, text) from public, anon;
grant execute on function public.backoffice_approve_facial(uuid, boolean, text) to authenticated;

-- 6) Plantilla de notificación: formulario aprobado (habilita el paso 2) -----
insert into public.notification_types
  (code, name, description, priority, template_title, template_message, default_enabled, email_template_html)
values
  ('kyb_aprobado', 'Formulario aprobado', 'El formulario de vinculación fue aprobado', 1,
   '{"es":"¡Formulario aprobado!","en":"Form approved!"}'::jsonb,
   '{"es":"Tu formulario fue aprobado. Ahora completá la verificación facial para activar tu cuenta.","en":"Your form was approved. Now complete the facial verification to activate your account."}'::jsonb,
   true,
   '{"es":"<div style=\"font-family:sans-serif;max-width:600px;margin:auto;padding:20px\"><h2>¡Formulario aprobado!</h2><p>Hola {{first_name}},</p><p>Aprobamos tu formulario de vinculación. El último paso es la <strong>verificación facial</strong>: ingresá a la app y completala para activar tu cuenta y poder operar.</p></div>"}'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  template_title = excluded.template_title,
  template_message = excluded.template_message,
  email_template_html = excluded.email_template_html;

-- 7) View del admin: exponer facial_status -----------------------------------
-- Se reproduce la definición vigente (00041) agregando facial_status al final.
-- Se OMITE `with (security_invoker=...)` para preservar las opciones actuales
-- de la vista (no cambiar su comportamiento de seguridad).
create or replace view public.backoffice_clients as
 select u.id, (u.first_name::text || ' ' || u.last_name::text) as full_name,
    u.first_name, u.last_name, u.email, u.phone, u.document_type, u.document_number, u.tax_id,
    u.country_code, u.verification_status, u.role, es_operador_backoffice(u.id) as is_operator, u.created_at,
    a.id as account_id, a.account_number, a.alias, a.balance,
    a.status as account_status, a.status_reason as account_status_reason,
    cr.status as compliance_status, cr.notes as compliance_notes, cr.reviewed_at as compliance_reviewed_at,
    k.score as kyc_score, k.provider as kyc_provider, k.status as kyc_status, k.verified_at as kyc_verified_at,
    u.facial_status
 from users u
   left join accounts a on a.user_id = u.id and a.is_primary
   left join compliance_reviews cr on cr.user_id = u.id
   left join lateral (select kv.score, kv.provider, kv.status, kv.verified_at
       from kyc_verifications kv where kv.user_id = u.id order by kv.created_at desc limit 1) k on true;

commit;
