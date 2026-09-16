-- Campo "Llave Bre-B" (sistema de pagos instantáneos de Colombia) en los
-- métodos de pago que el usuario ve al depositar. Es texto libre; opcional.
-- Para retiros, la llave viaja dentro de funding_requests.destination (jsonb),
-- así que no hace falta columna aparte allí.

alter table public.payment_methods
  add column if not exists llave_breb text;

comment on column public.payment_methods.llave_breb is
  'Llave Bre-B (Colombia) del método de pago, mostrada al cliente al depositar.';
