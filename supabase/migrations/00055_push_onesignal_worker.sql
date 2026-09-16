-- 00055_push_onesignal_worker.sql
-- Agrega PUSH (OneSignal) al worker de notificaciones, además del email.
--
-- Antes: process_notification_jobs() solo mandaba email (Resend). Los eventos de
-- depósito/retiro/OTC (aprobado/rechazado) llegaban por correo pero NO como push,
-- así que el usuario no se enteraba en la app.
--
-- Ahora: para los mensajes de enqueue_notification() (que traen user_id), además
-- del email se envía un push por la API de OneSignal apuntando al external_id del
-- usuario (= su id de Supabase; la app hace OneSignal.login(user_id)). El push es
-- best-effort: si falla, no rompe el email ni el procesamiento de la cola.
--
-- La REST API Key de OneSignal vive en app_config.onesignal_rest_api_key (server),
-- nunca en el binario. Formato de key nuevo (os_v2_app_...) => header "Key ...".

create or replace function public.process_notification_jobs()
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'extensions', 'net', 'pgmq'
as $$
declare
  v_key   text;
  v_from  text;
  v_os_key text;
  v_os_app text;
  v_push_body text;
  v_msg   record;
  v_email text;
  v_first text;
  v_subject text;
  v_html  text;
  v_vars  jsonb;
  v_code  text;
  v_type  text;
  v_ntype text;
  v_tpl_msg  text;
  v_tpl_html text;
  v_req   bigint;
  v_count int := 0;
begin
  select value into v_key    from public.app_config where key = 'resend_api_key';
  select value into v_from   from public.app_config where key = 'resend_from';
  select value into v_os_key from public.app_config where key = 'onesignal_rest_api_key';
  select value into v_os_app from public.app_config where key = 'onesignal_app_id';
  if v_key is null or v_key = '' then
    return 0; -- sin key de email no hay nada que hacer
  end if;

  for v_msg in select * from pgmq.read('notification_jobs', 60, 20) loop
    begin
      v_type  := v_msg.message->>'type';
      v_ntype := v_msg.message->>'notification_type';
      v_push_body := null;

      if v_type = 'otp' then
        -- OTP (verificación de dispositivo / transfer / pin / registro). Email y
        -- código vienen EN el mensaje. No se manda push para OTP.
        v_email := v_msg.message->>'email';
        v_code  := v_msg.message->>'code';
        v_first := nullif(trim(v_msg.message->>'first_name'), '');
        if v_first is null then
          select first_name into v_first from public.users where id = (v_msg.message->>'user_id')::uuid;
        end if;
        v_subject := 'Tu código de verificación · Burxia';
        v_html :=
          '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:auto;padding:28px;background:#0f172a;color:#fff;border-radius:16px">'
          || '<h1 style="margin:0 0 4px;font-size:24px">Burxia</h1>'
          || '<p style="color:#94a3b8;margin:0 0 20px">Verificación de acceso</p>'
          || '<p>Hola ' || coalesce(v_first, '') || ',</p>'
          || '<p style="color:#cbd5e1">Tu código de verificación es:</p>'
          || '<div style="font-size:44px;font-weight:800;letter-spacing:12px;margin:18px 0;color:#60a5fa;text-align:center">' || coalesce(v_code, '') || '</div>'
          || '<p style="color:#64748b;font-size:13px">Expira en 10 minutos. No lo compartas con nadie. Si no lo solicitaste, ignorá este correo.</p>'
          || '</div>';

      elsif v_ntype is not null then
        -- enqueue_notification() (depósito/retiro/OTC, etc.). Usa template.
        select email, first_name into v_email, v_first
          from public.users where id = (v_msg.message->>'user_id')::uuid;
        v_vars := coalesce(v_msg.message->'data', '{}'::jsonb)
                  || jsonb_build_object('first_name', coalesce(v_first, ''));
        select nt.template_title->>'es', nt.template_message->>'es', nt.email_template_html->>'es'
          into v_subject, v_tpl_msg, v_tpl_html
          from public.notification_types nt where nt.code = v_ntype;
        if v_tpl_html is not null then
          v_html := public._render_template(v_tpl_html, v_vars);
        else
          v_html :=
            '<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">'
            || '<h2>' || coalesce(v_subject, 'Burxia') || '</h2>'
            || '<p>Hola ' || coalesce(v_first, '') || ',</p>'
            || '<p>' || public._render_template(coalesce(v_tpl_msg, ''), v_vars) || '</p></div>';
        end if;
        v_subject   := public._render_template(coalesce(v_subject, 'Notificación · Burxia'), v_vars);
        v_push_body := public._render_template(coalesce(v_tpl_msg, ''), v_vars);

      else
        perform pgmq.delete('notification_jobs', v_msg.msg_id); -- forma desconocida
        continue;
      end if;

      if v_email is null or v_email = '' then
        perform pgmq.delete('notification_jobs', v_msg.msg_id);
        continue;
      end if;

      -- ── Email (Resend) ──
      select net.http_post(
        'https://api.resend.com/emails',
        jsonb_build_object(
          'from', coalesce(v_from, 'Burxia <onboarding@resend.dev>'),
          'to', jsonb_build_array(v_email),
          'subject', v_subject,
          'html', v_html
        ),
        '{}'::jsonb,
        jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json')
      ) into v_req;

      insert into public.notification_log (user_id, notification_type, status, sent_at, metadata)
      values (
        nullif(v_msg.message->>'user_id', '')::uuid,
        coalesce(v_ntype, 'otp:' || coalesce(v_msg.message->>'purpose', 'device')),
        'sent', now(),
        jsonb_build_object('net_request_id', v_req, 'to', v_email)
      );

      -- ── Push (OneSignal), best-effort. Solo para eventos con user_id ──
      if v_ntype is not null
         and v_os_key is not null and v_os_key <> ''
         and v_os_app is not null and v_os_app <> ''
         and nullif(v_msg.message->>'user_id', '') is not null then
        begin
          perform net.http_post(
            'https://api.onesignal.com/notifications',
            jsonb_build_object(
              'app_id', v_os_app,
              'target_channel', 'push',
              'include_aliases', jsonb_build_object('external_id', jsonb_build_array(v_msg.message->>'user_id')),
              'headings', jsonb_build_object('es', coalesce(v_subject, 'Burxia'), 'en', coalesce(v_subject, 'Burxia')),
              'contents', jsonb_build_object(
                'es', coalesce(nullif(v_push_body, ''), v_subject, 'Tenés una actualización'),
                'en', coalesce(nullif(v_push_body, ''), v_subject, 'You have an update')
              )
            ),
            '{}'::jsonb,
            jsonb_build_object('Authorization', 'Key ' || v_os_key, 'Content-Type', 'application/json')
          );
        exception when others then
          null; -- push best-effort: no romper el flujo si OneSignal falla
        end;
      end if;

      perform pgmq.delete('notification_jobs', v_msg.msg_id);
      v_count := v_count + 1;
    exception when others then
      insert into public.notification_log (user_id, notification_type, status, failed_at, failure_reason)
      values (null, coalesce(v_ntype, 'unknown'), 'failed', now(), SQLERRM);
      perform pgmq.delete('notification_jobs', v_msg.msg_id); -- evitar loop de mensaje venenoso
    end;
  end loop;

  return v_count;
end;
$$;
