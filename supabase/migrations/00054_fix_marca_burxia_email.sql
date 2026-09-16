-- 00054_fix_marca_burxia_email.sql
-- Corrige la marca en los correos: decía "BRUXIA" y la marca correcta es "Burxia".
-- Además, en la plantilla de código (type='otp'), usa el first_name que venga en
-- el mensaje (registro pre-usuario) y cae a users solo si no viene; antes siempre
-- consultaba users y en el registro no hay usuario => saludaba "Hola ,".

create or replace function public.process_notification_jobs()
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'extensions', 'net', 'pgmq'
as $$
declare
  v_key   text;
  v_from  text;
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
  select value into v_key  from public.app_config where key = 'resend_api_key';
  select value into v_from from public.app_config where key = 'resend_from';
  if v_key is null or v_key = '' then
    return 0; -- sin key no hay nada que hacer
  end if;

  for v_msg in select * from pgmq.read('notification_jobs', 60, 20) loop
    begin
      v_type  := v_msg.message->>'type';
      v_ntype := v_msg.message->>'notification_type';

      if v_type = 'otp' then
        -- Mensaje de otp_solicitar() (verificación de dispositivo / transfer / pin)
        -- o del registro (request_presignup_otp). Email y código vienen EN el mensaje.
        v_email := v_msg.message->>'email';
        v_code  := v_msg.message->>'code';
        -- Nombre: primero del mensaje (registro pre-usuario); si no, de users.
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
        -- Mensaje de enqueue_notification() (usa template de notification_types).
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
        v_subject := public._render_template(coalesce(v_subject, 'Notificación · Burxia'), v_vars);

      else
        perform pgmq.delete('notification_jobs', v_msg.msg_id); -- forma desconocida
        continue;
      end if;

      if v_email is null or v_email = '' then
        perform pgmq.delete('notification_jobs', v_msg.msg_id);
        continue;
      end if;

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
