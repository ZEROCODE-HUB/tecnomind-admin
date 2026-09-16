-- 00056_notif_inmediata.sql
-- Reduce la latencia de las notificaciones. Antes enqueue_notification encolaba y
-- luego hacía un net.http_post a un "notification-worker" en OTRO project ref
-- (mzxhyjgbbabnughknrxc, ajeno) que siempre fallaba; entonces el envío dependía
-- solo del cron (cada minuto => hasta ~60s de demora).
--
-- Ahora procesa la cola EN EL MOMENTO llamando a process_notification_jobs()
-- directamente. pg_net es asíncrono (net.http_post encola el request y vuelve),
-- así que esto no bloquea la RPC que disparó la notificación. El cron queda como
-- respaldo para cualquier mensaje que haya quedado.

create or replace function public.enqueue_notification(
  p_user_id uuid,
  p_notification_type text,
  p_data jsonb default '{}'::jsonb,
  p_related_transaction_id uuid default null::uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_message jsonb;
begin
  v_message := jsonb_build_object(
    'user_id', p_user_id,
    'notification_type', p_notification_type,
    'data', p_data,
    'related_transaction_id', p_related_transaction_id,
    'created_at', now()
  );

  perform pgmq.send(queue_name := 'notification_jobs', msg := v_message);

  -- Procesar YA (email + push). Best-effort: si algo falla, lo toma el cron.
  begin
    perform public.process_notification_jobs();
  exception when others then
    raise warning 'process_notification_jobs falló, lo tomará el cron: %', sqlerrm;
  end;
end;
$$;
