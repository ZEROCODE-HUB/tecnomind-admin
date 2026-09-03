-- =====================================================================
-- Acceso del backoffice a admin_transaction_list
--
-- En 00010 se le revoco el acceso a authenticated para cerrar la fuga.
-- Fue demasiado: dejo la vista inutilizable tambien para los operadores,
-- que la necesitan para la seccion de Movimientos.
--
-- Con security_invoker = true (ya aplicado) la vista respeta el RLS de
-- transactions, donde ya existe la politica "Admins can view all
-- transactions" -> is_admin(). Devolver el SELECT a authenticated es
-- seguro: un admin ve todo, un usuario comun solo sus transacciones, y
-- anon sigue sin acceso.
-- =====================================================================

grant select on table public.admin_transaction_list to authenticated;

-- anon queda fuera, explicito para que no se cuele en un futuro grant masivo.
revoke all on table public.admin_transaction_list from anon;
