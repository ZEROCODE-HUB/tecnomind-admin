-- =====================================================================
-- 00065_facial_rechazo_bloquea_cuenta.sql
-- BUG DE SEGURIDAD FINANCIERA: al RECHAZAR la verificación facial desde el admin,
-- `backoffice_approve_facial` ponía facial_status='rejected' pero NO revertía
-- `verification_status='verified'` ni bloqueaba la cuenta. Resultado: una cuenta
-- con la facial rechazada seguía `active` y podía operar (depositar, retirar,
-- transferir, OTC) — todas esas RPC se habilitan con accounts.status='active'.
--
-- Esto pasaba cuando la facial ya se había aprobado (cuenta verificada/activa) y
-- luego el operador la rechazaba. `_finalize_verification_if_ready` solo ACTIVA
-- al cumplirse ambos pasos; nunca desactiva. El rechazo debe hacerlo explícito.
--
-- Fix: en el rechazo se deja verification_status en 'in_review' (ya no 'verified')
-- y se BLOQUEA la cuenta primaria. El usuario puede reintentar la facial desde la
-- app (Paso 2 "Rechazada · reintentar"); al aprobarse de nuevo,
-- _finalize_verification_if_ready re-verifica y re-activa la cuenta.
-- El resto de la función queda igual que en 00064 (sin zapsign_verified_at).
-- =====================================================================

begin;

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
    -- Rechazo: des-verifica (si estaba verificada por la facial) y BLOQUEA la
    -- cuenta para que no pueda operar hasta reintentar y aprobar la facial.
    update public.users
      set facial_status = 'rejected',
          verification_status = case when verification_status = 'verified'
                                     then 'in_review' else verification_status end,
          updated_at = now()
      where id = p_user_id;
    update public.accounts
      set status = 'blocked',
          status_reason = 'Verificación facial rechazada',
          updated_at = now()
      where user_id = p_user_id and is_primary and status = 'active';
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

commit;
