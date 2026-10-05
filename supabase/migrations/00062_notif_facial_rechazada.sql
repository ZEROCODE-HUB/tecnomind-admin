-- =====================================================================
-- 00062_notif_facial_rechazada.sql
-- Cierra un hueco de notificaciones del flujo de 2 pasos (00061): cuando el
-- operador RECHAZA manualmente la verificación facial, el usuario no se enteraba.
-- Se agrega la plantilla `facial_rechazada` (email + push) y backoffice_approve_facial
-- la encola en el rechazo. El resto de la función queda idéntico a 00061.
-- =====================================================================

begin;

insert into public.notification_types
  (code, name, description, priority, template_title, template_message, default_enabled, email_template_html)
values
  ('facial_rechazada', 'Verificación facial rechazada', 'La verificación facial fue rechazada', 1,
   '{"es":"Verificación facial rechazada","en":"Facial verification rejected"}'::jsonb,
   '{"es":"Tu verificación facial fue rechazada. Reintentala desde la app para activar tu cuenta.","en":"Your facial verification was rejected. Please retry from the app to activate your account."}'::jsonb,
   true,
   '{"es":"<div style=\"font-family:sans-serif;max-width:600px;margin:auto;padding:20px\"><h2>Verificación facial rechazada</h2><p>Hola {{first_name}},</p><p>Tu verificación facial fue rechazada. Volvé a intentarla desde la app para activar tu cuenta.</p></div>"}'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  template_title = excluded.template_title,
  template_message = excluded.template_message,
  email_template_html = excluded.email_template_html;

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
