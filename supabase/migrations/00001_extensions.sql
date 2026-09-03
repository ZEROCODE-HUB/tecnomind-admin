-- =====================================================================
-- Extensiones
-- pgmq   -> cola de notificaciones (enqueue_notification, read_queue_messages)
-- pg_net -> HTTP saliente desde la base (net.http_post)
-- pg_cron-> jobs programados (snapshots diarios, reseteo de límites)
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists pgmq;
create extension if not exists pg_cron;
