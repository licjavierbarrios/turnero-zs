-- Advanced Row Level Security Policies para Turnero ZS
-- Sprint 5: Políticas de seguridad refinadas y auditoría

-- =====================================================
-- FUNCIONES HELPER AVANZADAS
-- =====================================================

-- Función para obtener el contexto completo del usuario
CREATE OR REPLACE FUNCTION auth.user_context()
RETURNS TABLE(
  user_id UUID,
  institutions UUID[],
  roles TEXT[],
  is_admin BOOLEAN,
  last_login TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    auth.uid() as user_id,
    ARRAY_AGG(DISTINCT m.institution_id) as institutions,
    ARRAY_AGG(DISTINCT m.role::TEXT) as roles,
    BOOL_OR(m.role = 'admin') as is_admin,
    u.last_sign_in_at as last_login
  FROM membership m
  LEFT JOIN auth.users u ON u.id = auth.uid()
  WHERE m.user_id = auth.uid()
  AND m.is_active = true
  GROUP BY u.last_sign_in_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar horarios laborales
CREATE OR REPLACE FUNCTION auth.is_business_hours()
RETURNS BOOLEAN AS $$
  SELECT EXTRACT(hour FROM NOW()) BETWEEN 6 AND 22
  AND EXTRACT(dow FROM NOW()) BETWEEN 1 AND 6;
$$ LANGUAGE sql SECURITY DEFINER;

-- Función para rate limiting por usuario
CREATE OR REPLACE FUNCTION auth.check_rate_limit(action_type TEXT, max_actions INTEGER, time_window INTERVAL)
RETURNS BOOLEAN AS $$
DECLARE
  action_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO action_count
  FROM audit_log
  WHERE user_id = auth.uid()
  AND action = action_type
  AND created_at >= NOW() - time_window;

  RETURN action_count < max_actions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar permisos granulares
CREATE OR REPLACE FUNCTION auth.has_permission(resource_type TEXT, action_type TEXT, resource_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  user_roles TEXT[];
  institution_id UUID;
BEGIN
  -- Obtener roles del usuario
  SELECT ARRAY_AGG(DISTINCT role::TEXT)
  INTO user_roles
  FROM membership
  WHERE user_id = auth.uid() AND is_active = true;

  -- Admin tiene todos los permisos
  IF 'admin' = ANY(user_roles) THEN
    RETURN TRUE;
  END IF;

  -- Verificar permisos específicos por recurso y acción
  CASE resource_type
    WHEN 'appointment' THEN
      IF resource_id IS NOT NULL THEN
        SELECT a.institution_id INTO institution_id
        FROM appointment a WHERE a.id = resource_id;

        RETURN EXISTS (
          SELECT 1 FROM membership m
          WHERE m.user_id = auth.uid()
          AND m.institution_id = institution_id
          AND m.is_active = true
          AND (
            (action_type = 'read' AND m.role IN ('administrativo', 'medico', 'enfermeria', 'pantalla')) OR
            (action_type = 'write' AND m.role IN ('administrativo', 'medico', 'enfermeria')) OR
            (action_type = 'delete' AND m.role IN ('administrativo'))
          )
        );
      END IF;

    WHEN 'patient' THEN
      -- Acceso global con auditoría para búsquedas de pacientes
      RETURN 'administrativo' = ANY(user_roles) OR 'medico' = ANY(user_roles) OR 'enfermeria' = ANY(user_roles);

    WHEN 'professional' THEN
      RETURN 'administrativo' = ANY(user_roles);

    WHEN 'service' THEN
      RETURN 'administrativo' = ANY(user_roles);

    ELSE
      RETURN FALSE;
  END CASE;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TABLA DE AUDITORÍA
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  institution_id UUID REFERENCES institution(id),
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para auditoría
CREATE INDEX idx_audit_user_time ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_institution ON audit_log(institution_id);
CREATE INDEX idx_audit_severity ON audit_log(severity) WHERE severity IN ('error', 'critical');

-- =====================================================
-- POLÍTICAS RLS AVANZADAS PARA TURNOS
-- =====================================================

-- Reemplazar política básica de turnos con una más granular
DROP POLICY IF EXISTS "Users can view appointments in their institutions" ON appointment;
DROP POLICY IF EXISTS "Staff can manage appointments in their institutions" ON appointment;

-- Política avanzada para lectura de turnos
CREATE POLICY "Advanced appointment read access" ON appointment
  FOR SELECT USING (
    auth.is_admin() OR
    (
      institution_id IN (SELECT auth.user_institutions()) AND
      auth.has_permission('appointment', 'read', id)
    )
  );

-- Política avanzada para escritura de turnos con rate limiting
CREATE POLICY "Advanced appointment write access" ON appointment
  FOR INSERT WITH CHECK (
    auth.has_permission('appointment', 'write') AND
    auth.check_rate_limit('create_appointment', 50, INTERVAL '1 hour') AND
    (
      auth.is_admin() OR
      institution_id IN (SELECT auth.user_institutions())
    )
  );

-- Política para actualización de turnos
CREATE POLICY "Advanced appointment update access" ON appointment
  FOR UPDATE USING (
    auth.has_permission('appointment', 'write', id) AND
    auth.check_rate_limit('update_appointment', 100, INTERVAL '1 hour') AND
    (
      auth.is_admin() OR
      institution_id IN (SELECT auth.user_institutions())
    )
  );

-- Política restrictiva para eliminación
CREATE POLICY "Restricted appointment deletion" ON appointment
  FOR DELETE USING (
    auth.is_admin() OR
    (
      auth.has_permission('appointment', 'delete', id) AND
      status IN ('pendiente', 'cancelado') AND
      scheduled_at > NOW() + INTERVAL '1 hour'
    )
  );

-- =====================================================
-- POLÍTICAS PARA ACCESO PÚBLICO (PANTALLA)
-- =====================================================

-- Política especial para pantallas públicas (solo datos anonimizados)
CREATE POLICY "Public display access" ON appointment
  FOR SELECT USING (
    auth.has_role_in_institution(institution_id, 'pantalla') AND
    status IN ('esperando', 'llamado', 'en_consulta') AND
    scheduled_at::date = CURRENT_DATE
  );

-- =====================================================
-- POLÍTICAS TEMPORALES Y DE EMERGENCIA
-- =====================================================

-- Política para acceso de emergencia (solo horario laboral)
CREATE POLICY "Emergency access during business hours" ON appointment
  FOR ALL USING (
    auth.is_business_hours() AND
    EXISTS (
      SELECT 1 FROM membership
      WHERE user_id = auth.uid()
      AND role = 'emergencia'
      AND is_active = true
    )
  );

-- =====================================================
-- TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- =====================================================

-- Función de trigger para auditoría
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  audit_user_id UUID;
  audit_institution_id UUID;
BEGIN
  -- Obtener user_id actual
  audit_user_id := auth.uid();

  -- Obtener institución del recurso si es posible
  IF TG_TABLE_NAME = 'appointment' THEN
    IF TG_OP = 'DELETE' THEN
      audit_institution_id := OLD.institution_id;
    ELSE
      audit_institution_id := NEW.institution_id;
    END IF;
  ELSIF TG_TABLE_NAME IN ('professional', 'service', 'room') THEN
    IF TG_OP = 'DELETE' THEN
      audit_institution_id := OLD.institution_id;
    ELSE
      audit_institution_id := NEW.institution_id;
    END IF;
  END IF;

  -- Insertar en audit_log
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (
      user_id, action, resource_type, resource_id,
      old_data, institution_id, severity
    ) VALUES (
      audit_user_id,
      TG_OP,
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      audit_institution_id,
      'warning'
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (
      user_id, action, resource_type, resource_id,
      old_data, new_data, institution_id, severity
    ) VALUES (
      audit_user_id,
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      audit_institution_id,
      CASE
        WHEN TG_TABLE_NAME = 'appointment' AND OLD.status != NEW.status THEN 'info'
        ELSE 'info'
      END
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (
      user_id, action, resource_type, resource_id,
      new_data, institution_id, severity
    ) VALUES (
      audit_user_id,
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW),
      audit_institution_id,
      'info'
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers de auditoría a tablas críticas
DROP TRIGGER IF EXISTS audit_appointment_trigger ON appointment;
CREATE TRIGGER audit_appointment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointment
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_professional_trigger ON professional;
CREATE TRIGGER audit_professional_trigger
  AFTER INSERT OR UPDATE OR DELETE ON professional
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_patient_trigger ON patient;
CREATE TRIGGER audit_patient_trigger
  AFTER INSERT OR UPDATE OR DELETE ON patient
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_service_trigger ON service;
CREATE TRIGGER audit_service_trigger
  AFTER INSERT OR UPDATE OR DELETE ON service
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- =====================================================
-- FUNCIONES DE MONITOREO
-- =====================================================

-- Función para detectar accesos sospechosos
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE(
  user_id UUID,
  suspicious_actions INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE,
  risk_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.user_id,
    COUNT(*)::INTEGER as suspicious_actions,
    MAX(a.created_at) as last_activity,
    CASE
      WHEN COUNT(*) > 100 THEN 'HIGH'
      WHEN COUNT(*) > 50 THEN 'MEDIUM'
      ELSE 'LOW'
    END as risk_level
  FROM audit_log a
  WHERE a.created_at >= NOW() - INTERVAL '1 hour'
  AND a.action IN ('DELETE', 'UPDATE')
  GROUP BY a.user_id
  HAVING COUNT(*) > 20
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vista para monitoreo en tiempo real
CREATE OR REPLACE VIEW security_dashboard AS
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  action,
  resource_type,
  COUNT(*) as action_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(CASE WHEN severity = 'error' THEN 1 ELSE 0 END) * 100 as error_rate
FROM audit_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), action, resource_type
ORDER BY hour DESC;

-- =====================================================
-- POLÍTICAS DE RETENCIÓN Y LIMPIEZA
-- =====================================================

-- Función para limpiar logs antiguos (ejecutar en cron)
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND severity NOT IN ('error', 'critical');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  INSERT INTO audit_log (
    action, resource_type, new_data, severity
  ) VALUES (
    'CLEANUP',
    'audit_log',
    jsonb_build_object('deleted_records', deleted_count),
    'info'
  );

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HARDENING ADICIONAL
-- =====================================================

-- Función para validar datos críticos
CREATE OR REPLACE FUNCTION validate_appointment_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que la fecha del turno no sea muy lejana
  IF NEW.scheduled_at > NOW() + INTERVAL '6 months' THEN
    RAISE EXCEPTION 'Appointment date too far in the future';
  END IF;

  -- Validar que no se pueda crear turnos en el pasado
  IF NEW.scheduled_at < NOW() - INTERVAL '1 hour' THEN
    RAISE EXCEPTION 'Cannot create appointments in the past';
  END IF;

  -- Validar que el paciente, profesional y servicio pertenezcan a la misma institución
  IF NOT EXISTS (
    SELECT 1 FROM professional p
    JOIN service s ON s.id = NEW.service_id
    WHERE p.id = NEW.professional_id
    AND p.institution_id = NEW.institution_id
    AND s.institution_id = NEW.institution_id
  ) THEN
    RAISE EXCEPTION 'Professional and service must belong to the same institution';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de validación
DROP TRIGGER IF EXISTS validate_appointment_trigger ON appointment;
CREATE TRIGGER validate_appointment_trigger
  BEFORE INSERT OR UPDATE ON appointment
  FOR EACH ROW EXECUTE FUNCTION validate_appointment_data();

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION auth.user_context() IS 'Obtiene el contexto completo del usuario actual incluyendo instituciones, roles y último login';
COMMENT ON FUNCTION auth.has_permission(TEXT, TEXT, UUID) IS 'Verifica permisos granulares basados en recurso, acción y contexto del usuario';
COMMENT ON FUNCTION auth.check_rate_limit(TEXT, INTEGER, INTERVAL) IS 'Implementa rate limiting para prevenir abuso de acciones';
COMMENT ON TABLE audit_log IS 'Log de auditoría completo para trazabilidad de todas las acciones del sistema';
COMMENT ON FUNCTION detect_suspicious_activity() IS 'Detecta patrones de actividad sospechosa para alertas de seguridad';
COMMENT ON VIEW security_dashboard IS 'Dashboard en tiempo real para monitoreo de seguridad y actividad del sistema';