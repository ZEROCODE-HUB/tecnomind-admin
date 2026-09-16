-- 00051_eliminar_cuenta.sql
-- Eliminación de cuenta a pedido del usuario (requisito de App Store 5.1.1(v) y
-- Google Play). NO se hace delete duro: las FK son ON DELETE CASCADE y borrarían
-- todo el historial de transacciones (un fintech debe conservar esos registros).
-- En su lugar: ANONIMIZAMOS el perfil (se va la PII) y BLOQUEAMOS el login. Los
-- registros financieros quedan, desvinculados de datos personales.

alter table public.users add column if not exists deleted_at timestamptz;

create or replace function public.eliminar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'no_autenticado';
  end if;

  -- 1) Anonimizar la PII del perfil (se conservan cuentas/movimientos).
  update public.users
     set first_name = 'Cuenta',
         last_name  = 'eliminada',
         phone      = null,
         photo_url  = null,
         email      = 'deleted+' || v_uid::text || '@burxia.invalid',
         deleted_at = now()
   where id = v_uid;

  -- 2) Bloquear el login y liberar el email en auth (para re-registro futuro).
  update auth.users
     set banned_until = now() + interval '100 years',
         email = 'deleted+' || v_uid::text || '@burxia.invalid',
         raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                              || jsonb_build_object('deleted', true)
   where id = v_uid;
end;
$$;

grant execute on function public.eliminar_mi_cuenta() to authenticated;
