-- Tabla para manejo de concurrencia en slots de turnos
-- Previene double-booking y condiciones de carrera

CREATE TABLE IF NOT EXISTS slot_locks (
  id TEXT PRIMARY KEY, -- Format: lock_{professional_id}_{service_id}_{datetime_sanitized}
  slot_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES service(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  locked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas de concurrencia
CREATE INDEX idx_slot_locks_datetime ON slot_locks(slot_datetime);
CREATE INDEX idx_slot_locks_professional ON slot_locks(professional_id);
CREATE INDEX idx_slot_locks_expires ON slot_locks(expires_at);
CREATE INDEX idx_slot_locks_locked_by ON slot_locks(locked_by);
CREATE INDEX idx_slot_locks_institution ON slot_locks(institution_id);

-- Índice compuesto para verificación rápida de conflictos
CREATE INDEX idx_slot_locks_conflict_check ON slot_locks(professional_id, service_id, slot_datetime, expires_at);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_slot_locks_updated_at
  BEFORE UPDATE ON slot_locks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS para slot_locks
ALTER TABLE slot_locks ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver y manipular sus propios locks
CREATE POLICY "Users can manage their own slot locks" ON slot_locks
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    (
      locked_by = auth.uid() OR
      auth.is_admin() OR
      institution_id IN (SELECT auth.user_institutions())
    )
  );

-- Función para limpiar locks expirados (ejecutar en cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_slot_locks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM slot_locks
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log cleanup activity
  INSERT INTO audit_log (
    action, resource_type, new_data, severity
  ) VALUES (
    'CLEANUP',
    'slot_locks',
    jsonb_build_object(
      'deleted_locks', deleted_count,
      'cleanup_time', NOW()
    ),
    'info'
  );

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vista para monitorear locks activos
CREATE OR REPLACE VIEW active_slot_locks AS
SELECT
  sl.*,
  p.first_name || ' ' || p.last_name as professional_name,
  s.name as service_name,
  i.name as institution_name,
  EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_remaining
FROM slot_locks sl
JOIN professional p ON p.id = sl.professional_id
JOIN service s ON s.id = sl.service_id
JOIN institution i ON i.id = sl.institution_id
WHERE sl.expires_at > NOW()
ORDER BY sl.expires_at ASC;

-- Función para detectar posibles condiciones de carrera
CREATE OR REPLACE FUNCTION detect_slot_conflicts()
RETURNS TABLE(
  slot_datetime TIMESTAMP WITH TIME ZONE,
  professional_id UUID,
  service_id UUID,
  conflict_type TEXT,
  details JSONB
) AS $$
BEGIN
  -- Detectar múltiples locks para el mismo slot
  RETURN QUERY
  SELECT
    sl.slot_datetime,
    sl.professional_id,
    sl.service_id,
    'multiple_locks'::TEXT as conflict_type,
    jsonb_build_object(
      'lock_count', COUNT(*),
      'lock_holders', array_agg(sl.locked_by)
    ) as details
  FROM slot_locks sl
  WHERE sl.expires_at > NOW()
  GROUP BY sl.slot_datetime, sl.professional_id, sl.service_id
  HAVING COUNT(*) > 1;

  -- Detectar appointments y locks simultáneos
  RETURN QUERY
  SELECT
    a.scheduled_at as slot_datetime,
    a.professional_id,
    a.service_id,
    'appointment_and_lock'::TEXT as conflict_type,
    jsonb_build_object(
      'appointment_id', a.id,
      'appointment_status', a.status,
      'lock_holder', sl.locked_by,
      'lock_expires', sl.expires_at
    ) as details
  FROM appointment a
  JOIN slot_locks sl ON (
    a.professional_id = sl.professional_id AND
    a.service_id = sl.service_id AND
    a.scheduled_at = sl.slot_datetime AND
    sl.expires_at > NOW()
  )
  WHERE a.status NOT IN ('cancelado', 'ausente');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para estadísticas de uso de locks
CREATE OR REPLACE FUNCTION slot_lock_statistics(days INTEGER DEFAULT 7)
RETURNS TABLE(
  date_hour TIMESTAMP WITH TIME ZONE,
  locks_created INTEGER,
  locks_released INTEGER,
  locks_expired INTEGER,
  average_hold_time INTERVAL,
  peak_concurrent_locks INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH lock_events AS (
    SELECT
      DATE_TRUNC('hour', locked_at) as hour,
      'created' as event_type,
      locked_at as event_time,
      COALESCE(updated_at, expires_at) - locked_at as hold_time
    FROM slot_locks
    WHERE locked_at >= NOW() - INTERVAL '1 day' * days

    UNION ALL

    SELECT
      DATE_TRUNC('hour', COALESCE(updated_at, expires_at)) as hour,
      CASE
        WHEN updated_at IS NOT NULL AND updated_at < expires_at THEN 'released'
        ELSE 'expired'
      END as event_type,
      COALESCE(updated_at, expires_at) as event_time,
      COALESCE(updated_at, expires_at) - locked_at as hold_time
    FROM slot_locks
    WHERE COALESCE(updated_at, expires_at) >= NOW() - INTERVAL '1 day' * days
  ),
  hourly_stats AS (
    SELECT
      hour as date_hour,
      SUM(CASE WHEN event_type = 'created' THEN 1 ELSE 0 END)::INTEGER as locks_created,
      SUM(CASE WHEN event_type = 'released' THEN 1 ELSE 0 END)::INTEGER as locks_released,
      SUM(CASE WHEN event_type = 'expired' THEN 1 ELSE 0 END)::INTEGER as locks_expired,
      AVG(hold_time) as average_hold_time
    FROM lock_events
    GROUP BY hour
  )
  SELECT
    hs.*,
    -- This is a simplified calculation; in practice, you'd need more complex logic
    -- to calculate truly concurrent locks at any point in time
    GREATEST(hs.locks_created, 1)::INTEGER as peak_concurrent_locks
  FROM hourly_stats hs
  ORDER BY hs.date_hour DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auditoría de locks críticos
CREATE OR REPLACE FUNCTION audit_slot_lock_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo auditar locks que duran más de lo normal (posible problema)
  IF TG_OP = 'INSERT' THEN
    IF NEW.expires_at - NEW.locked_at > INTERVAL '10 minutes' THEN
      INSERT INTO audit_log (
        user_id, action, resource_type, resource_id,
        new_data, institution_id, severity
      ) VALUES (
        NEW.locked_by,
        'LONG_LOCK',
        'slot_locks',
        NEW.id,
        jsonb_build_object(
          'slot_datetime', NEW.slot_datetime,
          'professional_id', NEW.professional_id,
          'service_id', NEW.service_id,
          'duration_minutes', EXTRACT(EPOCH FROM (NEW.expires_at - NEW.locked_at)) / 60
        ),
        NEW.institution_id,
        'warning'
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_slot_lock_trigger
  AFTER INSERT ON slot_locks
  FOR EACH ROW EXECUTE FUNCTION audit_slot_lock_events();

-- Comentarios para documentación
COMMENT ON TABLE slot_locks IS 'Tabla para manejo de concurrencia en reserva de slots de turnos. Previene double-booking mediante locks temporales.';
COMMENT ON COLUMN slot_locks.id IS 'ID único del lock, formato: lock_{professional_id}_{service_id}_{datetime_sanitized}';
COMMENT ON COLUMN slot_locks.expires_at IS 'Timestamp cuando expira el lock automáticamente';
COMMENT ON FUNCTION cleanup_expired_slot_locks() IS 'Función para ejecutar periódicamente y limpiar locks expirados';
COMMENT ON FUNCTION detect_slot_conflicts() IS 'Detecta posibles condiciones de carrera y conflictos en el sistema de locks';
COMMENT ON VIEW active_slot_locks IS 'Vista de todos los locks activos con información detallada para monitoreo';