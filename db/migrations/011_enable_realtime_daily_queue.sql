-- Habilitar Realtime para la tabla daily_queue
-- Esto permite que la pantalla pública reciba actualizaciones en tiempo real

-- Habilitar replicación para daily_queue
ALTER PUBLICATION supabase_realtime ADD TABLE daily_queue;

-- Verificar que se habilitó correctamente
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'daily_queue';
