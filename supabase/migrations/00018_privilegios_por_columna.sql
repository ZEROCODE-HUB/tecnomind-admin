-- =====================================================================
-- Escritura acotada por columna
--
-- VULNERABILIDAD HEREDADA DE MAGNATE, verificada explotando el endpoint
-- REST con un usuario comun el 2026-09-03:
--
--   PATCH /rest/v1/accounts?id=eq.<propia>  {"balance": 999999}
--     -> saldo modificado. Devolvio 999999.00.
--
--   PATCH /rest/v1/users?id=eq.<propio>     {"role": "admin",
--                                            "verification_status": "verified"}
--     -> usuario convertido en admin y KYC auto-aprobado.
--
-- La causa: las politicas "Users can update own X" evaluan QUIEN escribe
-- (auth.uid() = user_id) pero no QUE escribe. RLS trabaja a nivel de fila,
-- no de columna, asi que una vez que sos dueño de la fila podes tocar
-- cualquier campo, incluido tu propio saldo o tu propio rol.
--
-- La correccion son privilegios de columna (GRANT UPDATE (col)), que si
-- son granulares. Las politicas RLS siguen en pie y se complementan: RLS
-- decide que filas, el GRANT decide que columnas.
--
-- Todo lo que queda fuera se modifica desde funciones SECURITY DEFINER
-- (process_transfer, etc.) o con service_role, nunca desde el navegador.
-- =====================================================================

-- ---------------------------------------------------------------------
-- accounts: el titular solo cambia el alias
-- ---------------------------------------------------------------------
revoke update on public.accounts from authenticated;
grant  update (alias) on public.accounts to authenticated;

-- Y ni siquiera puede crearse cuentas a mano: las crea
-- create_user_bank_account() al dar de alta al usuario.
revoke insert on public.accounts from authenticated;
drop policy if exists "Users can insert own accounts" on public.accounts;

-- ---------------------------------------------------------------------
-- users: datos de contacto y nada mas
--
-- Quedan fuera a proposito: role, verification_status, document_*,
-- tax_id, country_code, pin_hash, web_password_hash, web_access_enabled.
-- ---------------------------------------------------------------------
revoke update on public.users from authenticated;
grant  update (first_name, last_name, phone, photo_url) on public.users to authenticated;

-- ---------------------------------------------------------------------
-- account_limits: los limites los define el operador, no el titular
-- ---------------------------------------------------------------------
revoke insert, update on public.account_limits from authenticated;
drop policy if exists "Users can insert own account limits" on public.account_limits;

-- ---------------------------------------------------------------------
-- transactions: solo por process_transfer()
--
-- Insertar transacciones a mano permitia saltear validaciones de limites
-- y de saldo que la funcion si aplica.
-- ---------------------------------------------------------------------
revoke insert on public.transactions from authenticated;
drop policy if exists "Users can insert own transactions" on public.transactions;

-- ---------------------------------------------------------------------
-- api_access: el usuario habilita/deshabilita y define IPs permitidas.
-- El hash de su clave y el rate limit no se tocan desde el cliente.
-- ---------------------------------------------------------------------
revoke update on public.api_access from authenticated;
grant  update (is_enabled, allowed_ips) on public.api_access to authenticated;
revoke insert on public.api_access from authenticated;
drop policy if exists "Users can insert own API access" on public.api_access;

-- ---------------------------------------------------------------------
-- qr_codes: los genera create_user_bank_account(); el titular solo puede
-- activarlos o desactivarlos y ponerles un monto o concepto.
-- ---------------------------------------------------------------------
revoke update on public.qr_codes from authenticated;
grant  update (is_active, amount, concept, expires_at, max_uses) on public.qr_codes to authenticated;

-- ---------------------------------------------------------------------
-- user_devices: preferencias del dispositivo, no su identidad ni sus
-- tokens de sesion.
-- ---------------------------------------------------------------------
revoke update on public.user_devices from authenticated;
grant  update (device_name, push_enabled, biometric_enabled, player_id, push_token)
  on public.user_devices to authenticated;

-- ---------------------------------------------------------------------
-- user_auth_credentials: guarda la contraseña automatica cifrada.
-- No hay motivo para tocarla desde el navegador.
-- ---------------------------------------------------------------------
revoke insert, update on public.user_auth_credentials from authenticated;
drop policy if exists "Users can insert own credentials" on public.user_auth_credentials;
drop policy if exists "Users can update own credentials" on public.user_auth_credentials;

-- ---------------------------------------------------------------------
-- support: cualquiera abre un ticket, nadie los edita salvo el operador
-- ---------------------------------------------------------------------
drop policy if exists "Allow authenticated update access" on public.support;
revoke update on public.support from authenticated;

create policy "Solo admins actualizan tickets"
  on public.support for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
