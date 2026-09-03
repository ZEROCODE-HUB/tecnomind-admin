-- =====================================================================
-- Comprobar si un alias esta libre, sin abrir las cuentas ajenas
--
-- La pantalla de perfil permitia "verificar" un alias, pero la respuesta
-- estaba simulada en el cliente: un setTimeout y un Math.random(). El
-- usuario podia confirmar un alias ya tomado y el guardado -- que
-- tampoco existia -- habria fallado contra la constraint UNIQUE.
--
-- No se puede resolver leyendo accounts desde el navegador: el RLS solo
-- deja ver la cuenta propia, y relajarlo para poder consultar aliases
-- ajenos convertiria la tabla en un directorio de clientes. Se expone
-- entonces una funcion SECURITY DEFINER que responde si/no y nada mas.
--
-- El cambio en si NO necesita funcion: 00018 dejo GRANT UPDATE (alias)
-- al titular, y la base ya se encarga del resto --
-- trigger_log_alias_change registra el historial y
-- trigger_sync_qr_data_from_account actualiza el QR de la cuenta.
-- =====================================================================

create or replace function public.alias_disponible(p_alias varchar)
returns table (disponible boolean, motivo text)
  language plpgsql stable security definer
  set search_path to 'public'
as $fn$
declare
  v_alias varchar := lower(trim(p_alias));
begin
  -- Formato de alias CBU: 6 a 20 caracteres, letras sin acentos,
  -- digitos, puntos y guiones. Se valida aca ademas de en la UI porque
  -- la UI no es una defensa.
  if v_alias is null or length(v_alias) < 6 then
    return query select false, 'El alias debe tener al menos 6 caracteres.';
    return;
  end if;
  if length(v_alias) > 20 then
    return query select false, 'El alias no puede superar los 20 caracteres.';
    return;
  end if;
  if v_alias !~ '^[a-z0-9][a-z0-9.-]*[a-z0-9]$' then
    return query select false, 'Solo se permiten letras, numeros, puntos y guiones.';
    return;
  end if;
  if v_alias ~ '\.\.|--' then
    return query select false, 'No se permiten puntos ni guiones repetidos.';
    return;
  end if;

  -- Libre si nadie lo tiene, o si ya es el del propio usuario.
  if exists (
    select 1 from public.accounts a
     where lower(a.alias) = v_alias
       and a.user_id is distinct from auth.uid()
  ) then
    return query select false, 'Ese alias ya esta en uso.';
    return;
  end if;

  return query select true, null::text;
end;
$fn$;

comment on function public.alias_disponible(varchar) is
  'Responde si un alias esta libre y con el formato correcto. SECURITY DEFINER: expone un booleano, nunca las cuentas ajenas.';

revoke all     on function public.alias_disponible(varchar) from public, anon;
grant  execute on function public.alias_disponible(varchar) to authenticated;
