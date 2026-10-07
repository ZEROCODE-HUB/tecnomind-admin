-- =====================================================================
-- 00067_aceptacion_terminos.sql
-- Aceptación obligatoria de Términos y Condiciones.
--
-- Hasta ahora la "aceptación" en el registro era un texto pasivo, sin checkbox
-- ni persistencia. Se agrega el registro del consentimiento (fecha + versión) en
-- public.users y una RPC para que el propio usuario lo marque desde la app
-- (modal obligatorio al primer ingreso).
--
-- No se hace backfill: todos quedan con terms_accepted_at NULL y deben aceptar en
-- su próximo ingreso (requisito del cliente). Si en el futuro cambia la versión de
-- los TyC, se compara terms_version contra la versión vigente para re-pedir.
--
-- Escritura por RPC SECURITY DEFINER: el rol authenticated solo tiene GRANT UPDATE
-- sobre (first_name, last_name, phone, photo_url) desde 00018_privilegios_por_columna,
-- así que un UPDATE directo de estas columnas fallaría (42501). Mismo patrón que
-- submit_facial_verification (00064).
-- =====================================================================

begin;

alter table public.users
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version     text;

create or replace function public.accept_terms(p_version text)
  returns void language plpgsql security definer set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  update public.users
    set terms_accepted_at = now(),
        terms_version     = coalesce(p_version, ''),
        updated_at        = now()
    where id = v_uid;
end $$;
revoke all on function public.accept_terms(text) from public, anon;
grant execute on function public.accept_terms(text) to authenticated;

commit;
