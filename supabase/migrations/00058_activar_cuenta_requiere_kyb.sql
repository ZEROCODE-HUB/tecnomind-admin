-- =====================================================================
-- 00058_activar_cuenta_requiere_kyb.sql
--
-- La cuenta primaria solo puede pasar a 'active' si el KYB está APROBADO
-- (users.verification_status = 'verified'). Esto evita puentear el gate desde
-- el backoffice: la activación "real" ocurre al aprobar la vinculación KYB
-- (backoffice_approve_kyb). Bloquear/suspender/cerrar una cuenta sigue siendo
-- una acción manual del operador (fraude/cumplimiento), sin restricción.
-- =====================================================================

create or replace function public.backoffice_set_account_status(
  p_user_id uuid,
  p_status  varchar,
  p_reason  text default ''
) returns void
  language plpgsql volatile security definer
  set search_path to 'public'
as $fn$
declare
  v_antes varchar;
  v_verif varchar;
begin
  if not public.has_backoffice_permission('usuarios', 'update') then
    raise exception 'Sin permiso para modificar cuentas' using errcode = '42501';
  end if;
  if p_status not in ('active','blocked','suspended','closed') then
    raise exception 'Estado de cuenta invalido: %', p_status using errcode = '22023';
  end if;

  -- Guard: activar exige verificación KYB aprobada.
  if p_status = 'active' then
    select verification_status into v_verif from public.users where id = p_user_id;
    if v_verif is distinct from 'verified' then
      raise exception 'No se puede activar la cuenta sin la verificación KYB aprobada'
        using errcode = '42501';
    end if;
  end if;

  select status into v_antes from public.accounts where user_id = p_user_id and is_primary;
  if v_antes is null then
    raise exception 'El cliente no tiene cuenta principal' using errcode = 'P0002';
  end if;

  update public.accounts
     set status = p_status, status_reason = nullif(p_reason, ''), updated_at = now()
   where user_id = p_user_id and is_primary;

  perform public.backoffice_audit('account.status', 'usuarios', 'account', p_user_id::text,
                                  jsonb_build_object('status', v_antes),
                                  jsonb_build_object('status', p_status, 'reason', p_reason));
end;
$fn$;
