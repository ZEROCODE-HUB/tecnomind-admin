-- =====================================================================
-- Trigger de alta de usuarios sobre auth.users
--
-- Vive en el schema auth, no en public, asi que no entro en la extraccion
-- inicial del backup. Sin el, crear un usuario en Supabase Auth no crea su
-- perfil en public.users, y con eso se cae toda la cadena que cuelga del
-- alta: preferencias de notificacion, cuenta bancaria, limites y QR.
-- =====================================================================

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- NOTA sobre los jobs programados
--
-- El esquema trae cuatro funciones pensadas para correr periodicamente:
--
--   reset_daily_limits()             -- limites diarios de las cuentas
--   reset_monthly_limits()           -- limites mensuales
--   create_daily_balance_snapshots() -- foto diaria de saldos
--   deactivate_expired_qr_codes()    -- baja de QR vencidos
--
-- En el backup de Magnate NO habia ningun cron.schedule() que las
-- invocara: existen, pero nadie las llama. Si eso era intencional o un
-- olvido hay que confirmarlo antes de agendarlas, porque reset_*_limits
-- modifica saldos disponibles y agendarlas a ciegas cambia el
-- comportamiento del producto.
--
-- Cuando se decida, se agenda asi (pg_cron ya esta instalado):
--
--   select cron.schedule('reset-daily-limits', '0 3 * * *',
--                        $$select public.reset_daily_limits()$$);
-- ---------------------------------------------------------------------
