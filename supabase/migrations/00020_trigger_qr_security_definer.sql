-- =====================================================================
-- sync_qr_data_from_account como SECURITY DEFINER
--
-- Es el unico trigger del esquema que no lo era: sus hermanos
-- (log_account_alias_change, update_qr_last_used, update_device_activity)
-- si lo son. La inconsistencia venia de Magnate y no se notaba porque
-- authenticated tenia UPDATE sobre todas las columnas de qr_codes.
--
-- Al acotar esos privilegios en 00018, cambiar el alias de la cuenta
-- empezo a fallar con "permission denied for table qr_codes": el trigger
-- corria con los permisos del usuario.
--
-- Un trigger de sistema debe correr con los permisos de su dueño: no es
-- una accion del usuario, es una consecuencia interna de su accion.
-- =====================================================================

create or replace function public.sync_qr_data_from_account() returns trigger
  language plpgsql security definer
  set search_path to 'public', 'extensions'
as $fn$
begin
  update public.qr_codes
  set qr_data = jsonb_build_object(
        'cbu', new.cbu,
        'cvu', new.cvu,
        'alias', new.alias,
        'type', (qr_data::jsonb)->>'type',
        'account_id', new.id::text
      )::text,
      qr_hash = encode(
        digest(
          jsonb_build_object(
            'cbu', new.cbu,
            'cvu', new.cvu,
            'alias', new.alias,
            'type', (qr_data::jsonb)->>'type',
            'account_id', new.id::text
          )::text,
          'sha256'
        ),
        'hex'
      )
  where account_id = new.id
    and is_active = true;

  return new;
end;
$fn$;
