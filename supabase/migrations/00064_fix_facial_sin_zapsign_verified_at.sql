-- =====================================================================
-- 00064_fix_facial_sin_zapsign_verified_at.sql
-- HOTFIX: las funciones del Paso 2 (verificación facial) referencian la columna
-- `users.zapsign_verified_at`, que NO existe en este esquema (era vestigial del
-- modelo Magnate; en Burxia el detalle de ZapSign vive en `kyc_verifications`).
-- Como el cuerpo plpgsql no se valida contra el esquema al crear la función,
-- 00061 (submit_facial_verification) y 00062 (backoffice_approve_facial) se
-- aplicaron OK pero fallaban en runtime con:
--   column "zapsign_verified_at" does not exist
-- (p. ej. al tocar "Aprobar facial" en el admin → RPC 400).
--
-- Se re-crean ambas funciones SIN esa columna. El estado queda en
-- `users.facial_status`; el timestamp/evidencia de ZapSign ya se registra en
-- `kyc_verifications`. El resto de la lógica es idéntico.
-- =====================================================================

begin;

-- Override manual del operador (admin) --------------------------------------
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
          updated_at = now()
      where id = p_user_id;
    perform public._finalize_verification_if_ready(p_user_id);
  else
    update public.users
      set facial_status = 'rejected', updated_at = now()
      where id = p_user_id;
    perform public.enqueue_notification(p_user_id, 'facial_rechazada',
      jsonb_build_object('reason', coalesce(p_notes, '')));
  end if;

  perform public.backoffice_audit(
    case when p_approve then 'approve_facial' else 'reject_facial' end,
    'verificacion', 'user', p_user_id::text, null,
    jsonb_build_object('facial_status', case when p_approve then 'approved' else 'rejected' end,
                       'notes', p_notes));
end $$;
revoke all on function public.backoffice_approve_facial(uuid, boolean, text) from public, anon;
grant execute on function public.backoffice_approve_facial(uuid, boolean, text) to authenticated;

-- Reporte del usuario tras completar la facial en la app --------------------
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
      set facial_status = 'approved', updated_at = now()
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

commit;
