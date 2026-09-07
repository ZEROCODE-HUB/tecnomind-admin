-- Plantillas de notificación para depósitos/retiros (feature 00036).
-- Idempotente: si el code ya existe, actualiza los textos.

insert into public.notification_types
  (code, name, description, priority, template_title, template_message, default_enabled, email_template_html)
values
  ('deposit_approved', 'Depósito acreditado', 'El depósito del cliente fue aprobado', 2,
   '{"es":"Depósito acreditado","en":"Deposit credited"}'::jsonb,
   '{"es":"Tu depósito de {{amount_formatted}} fue acreditado a tu cuenta.","en":"Your deposit of {{amount_formatted}} was credited."}'::jsonb,
   true,
   '{"es":"<div style=\"font-family:sans-serif;max-width:600px;margin:auto;padding:20px\"><h2>Depósito acreditado</h2><p>Hola {{first_name}},</p><p>Tu depósito de <strong>{{amount_formatted}}</strong> fue acreditado a tu cuenta.</p><p>{{comment}}</p></div>"}'::jsonb),

  ('deposit_rejected', 'Depósito rechazado', 'El depósito del cliente fue rechazado', 2,
   '{"es":"Depósito rechazado","en":"Deposit rejected"}'::jsonb,
   '{"es":"Tu solicitud de depósito de {{amount_formatted}} fue rechazada.","en":"Your deposit request of {{amount_formatted}} was rejected."}'::jsonb,
   true,
   '{"es":"<div style=\"font-family:sans-serif;max-width:600px;margin:auto;padding:20px\"><h2>Depósito rechazado</h2><p>Hola {{first_name}},</p><p>Tu solicitud de depósito de <strong>{{amount_formatted}}</strong> fue rechazada.</p><p>{{comment}}</p></div>"}'::jsonb),

  ('withdrawal_approved', 'Retiro aprobado', 'El retiro del cliente fue aprobado', 2,
   '{"es":"Retiro aprobado","en":"Withdrawal approved"}'::jsonb,
   '{"es":"Tu retiro de {{amount_formatted}} fue aprobado.","en":"Your withdrawal of {{amount_formatted}} was approved."}'::jsonb,
   true,
   '{"es":"<div style=\"font-family:sans-serif;max-width:600px;margin:auto;padding:20px\"><h2>Retiro aprobado</h2><p>Hola {{first_name}},</p><p>Tu retiro de <strong>{{amount_formatted}}</strong> fue aprobado.</p><p>{{comment}}</p></div>"}'::jsonb),

  ('withdrawal_rejected', 'Retiro rechazado', 'El retiro del cliente fue rechazado y el saldo devuelto', 2,
   '{"es":"Retiro rechazado","en":"Withdrawal rejected"}'::jsonb,
   '{"es":"Tu retiro de {{amount_formatted}} fue rechazado y el saldo fue devuelto a tu cuenta.","en":"Your withdrawal of {{amount_formatted}} was rejected and the balance was refunded."}'::jsonb,
   true,
   '{"es":"<div style=\"font-family:sans-serif;max-width:600px;margin:auto;padding:20px\"><h2>Retiro rechazado</h2><p>Hola {{first_name}},</p><p>Tu retiro de <strong>{{amount_formatted}}</strong> fue rechazado y el saldo fue devuelto a tu cuenta.</p><p>{{comment}}</p></div>"}'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  template_title = excluded.template_title,
  template_message = excluded.template_message,
  email_template_html = excluded.email_template_html;
