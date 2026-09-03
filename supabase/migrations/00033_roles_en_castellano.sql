-- =====================================================================
-- Nombres de rol en castellano
--
-- El seed dejo los nombres en ingles (Accounting, Compliance...) y la
-- cabecera del backoffice los muestra tal cual: "Accounting" en una
-- interfaz que esta integramente en castellano.
--
-- Se traduce solo el nombre visible. El `code` NO se toca: es lo que
-- usan has_backoffice_permission() y el seed de permisos, y cambiarlo
-- romperia la autorizacion.
-- =====================================================================

update public.backoffice_roles set name = case code
  when 'admin'      then 'Administración'
  when 'compliance' then 'Cumplimiento'
  when 'accounting' then 'Contabilidad'
  when 'management' then 'Dirección'
  when 'reader'     then 'Solo lectura'
  when 'user'       then 'Operador'
  else name end
where code in ('admin','compliance','accounting','management','reader','user');
