-- =====================================================================
-- Cola de notificaciones (pgmq)
--
-- BLOQUEADOR ENCONTRADO AL PROBAR LA PRIMERA TRANSFERENCIA REAL:
--
--   TRANSFER_FAILED: relation "pgmq.q_notification_jobs" does not exist
--
-- Ninguna transferencia podia completarse. La cadena es:
--   process_transfer -> marca la transaccion como 'completed'
--     -> trigger on_transaction_completed_enqueue
--       -> trigger_enqueue_transaction_notification
--         -> enqueue_notification -> pgmq.send('notification_jobs', ...)
--
-- La cola vive en el schema pgmq, no en public, asi que quedo fuera de la
-- extraccion inicial del backup igual que el trigger de auth.users. La
-- transaccion entera se revertia, asi que no hubo saldos inconsistentes:
-- simplemente no se podia transferir.
--
-- Se crea de forma idempotente: pgmq.create() falla si la cola ya existe.
-- =====================================================================

do $$
begin
  if not exists (select 1 from pgmq.list_queues() where queue_name = 'notification_jobs') then
    perform pgmq.create('notification_jobs');
  end if;
end;
$$;

-- Los workers leen y borran mensajes a traves de read_queue_messages() y
-- delete_queue_message(), que son SECURITY DEFINER. El acceso directo al
-- schema pgmq no se abre a nadie mas.
grant usage on schema pgmq to service_role;
