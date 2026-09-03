-- =====================================================================
-- Correcciones de seguridad sobre el esquema heredado de Magnate
--
-- Todo lo de este archivo corrige agujeros REALES verificados en el
-- proyecto de Magnate el 2026-09-03: con la anon key (publicada en un
-- repo público) se leían sin autenticación las 4 vistas, incluida
-- admin_transaction_list, que expone nombre, email, teléfono y DNI de
-- ambas partes de cada transacción.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Vistas: forzar security_invoker
--
-- Causa raíz del incidente. Una vista sin security_invoker se ejecuta con
-- los permisos de su OWNER (postgres), por lo que IGNORA por completo el
-- RLS de las tablas base. Las tablas subyacentes tenían RLS correcto; las
-- vistas lo saltaban. Con security_invoker=true la vista corre con los
-- permisos de quien consulta y el RLS vuelve a aplicar.
-- ---------------------------------------------------------------------
alter view public.account_movements                set (security_invoker = true);
alter view public.admin_transaction_list           set (security_invoker = true);
alter view public.account_balance_reconciliation   set (security_invoker = true);
alter view public.notification_stats_by_user       set (security_invoker = true);

-- ---------------------------------------------------------------------
-- 2. Quitar a anon el acceso a las vistas
--
-- El dump traía GRANT ALL ... TO anon sobre las cuatro. anon es el rol de
-- cualquier visitante sin login: no tiene por qué leer movimientos ni
-- conciliaciones de saldo.
-- ---------------------------------------------------------------------
revoke all on table public.account_movements              from anon;
revoke all on table public.admin_transaction_list         from anon;
revoke all on table public.account_balance_reconciliation from anon;
revoke all on table public.notification_stats_by_user     from anon;

-- admin_transaction_list es del backoffice: authenticated tampoco debería
-- verla entera. Solo el rol admin, vía is_admin().
revoke all on table public.admin_transaction_list from authenticated;
grant select on table public.admin_transaction_list to service_role;

-- ---------------------------------------------------------------------
-- 3. support: dejaba leer nombre, email y teléfono a cualquiera
-- ---------------------------------------------------------------------
drop policy if exists "Allow public read access" on public.support;

create policy "Solo admins leen tickets de soporte"
  on public.support for select to authenticated
  using (public.is_admin());

-- Cualquiera puede ABRIR un ticket (formulario público), pero no leerlos.
create policy "Cualquiera puede crear un ticket"
  on public.support for insert to authenticated, anon
  with check (true);

-- ---------------------------------------------------------------------
-- 4. Tablas que venían sin RLS
-- ---------------------------------------------------------------------
alter table public.notification_types  enable row level security;
alter table public.worker_invocations  enable row level security;

-- notification_types es catálogo: lectura para usuarios logueados.
create policy "Catálogo de notificaciones legible"
  on public.notification_types for select to authenticated
  using (true);

-- worker_invocations es interno de los workers: nadie más lo toca.
create policy "Solo service_role gestiona worker_invocations"
  on public.worker_invocations for all to service_role
  using (true) with check (true);
