-- ============================================================================
-- Migration: Sistema de Privacidad Multinivel y Gestión de Pantallas
-- ============================================================================
-- Descripción:
-- 1. Agrega sistema de privacy_level a appointment y service
-- 2. Crea tabla display_devices para gestión de pantallas autenticadas
-- 3. Funciones helper para resolución de privacidad
-- 4. Políticas RLS para acceso seguro de pantallas
-- ============================================================================

-- ============================================================================
-- PARTE 1: Sistema de Privacidad
-- ============================================================================

-- Agregar columna privacy_level a service (default del servicio)
ALTER TABLE service
ADD COLUMN IF NOT EXISTS default_privacy_level VARCHAR(50) DEFAULT 'public_full_name';

COMMENT ON COLUMN service.default_privacy_level IS
'Nivel de privacidad por defecto para turnos de este servicio.
Valores: public_full_name, public_initials, private_ticket_only';

-- Agregar columna privacy_level a appointment (override por turno)
ALTER TABLE appointment
ADD COLUMN IF NOT EXISTS privacy_level VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN appointment.privacy_level IS
'Override de privacidad para este turno específico.
NULL = usar default del servicio';

-- Agregar columna privacy_level a daily_queue (copia de appointment)
ALTER TABLE daily_queue
ADD COLUMN IF NOT EXISTS privacy_level VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN daily_queue.privacy_level IS
'Nivel de privacidad copiado del appointment original';

-- Agregar columna default_privacy_level a institution (fallback global)
ALTER TABLE institution
ADD COLUMN IF NOT EXISTS default_privacy_level VARCHAR(50) DEFAULT 'public_full_name';

COMMENT ON COLUMN institution.default_privacy_level IS
'Nivel de privacidad por defecto a nivel institución.
Usado cuando service no tiene configurado';

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_appointment_privacy_level
ON appointment(privacy_level) WHERE privacy_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_daily_queue_privacy_level
ON daily_queue(privacy_level) WHERE privacy_level IS NOT NULL;

-- ============================================================================
-- PARTE 2: Tabla de Dispositivos de Pantalla
-- ============================================================================

-- Tabla para gestionar pantallas/dispositivos autenticados
CREATE TABLE IF NOT EXISTS display_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Información del dispositivo
  name VARCHAR(255) NOT NULL, -- "Pantalla Sala Principal"
  description TEXT, -- Descripción adicional opcional
  type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'service_specific', 'kiosk')),

  -- Filtros opcionales
  service_filter UUID REFERENCES service(id) ON DELETE SET NULL, -- NULL = todos los servicios
  privacy_override VARCHAR(50), -- NULL = usar config del servicio/appointment

  -- Estado y monitoreo
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ,

  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Restricciones
  CONSTRAINT unique_user_per_institution UNIQUE(user_id, institution_id)
);

-- Índices para display_devices
CREATE INDEX idx_display_devices_institution ON display_devices(institution_id);
CREATE INDEX idx_display_devices_user ON display_devices(user_id);
CREATE INDEX idx_display_devices_active ON display_devices(is_active) WHERE is_active = true;
CREATE INDEX idx_display_devices_last_seen ON display_devices(last_seen_at);

-- Comentarios
COMMENT ON TABLE display_devices IS
'Dispositivos autenticados (pantallas/tablets) que pueden mostrar la cola pública';

COMMENT ON COLUMN display_devices.type IS
'Tipo de dispositivo: general (todas las colas), service_specific (filtrado por servicio), kiosk (autoservicio pacientes)';

COMMENT ON COLUMN display_devices.service_filter IS
'Si no es NULL, este dispositivo solo muestra turnos de este servicio específico';

COMMENT ON COLUMN display_devices.last_seen_at IS
'Última vez que el dispositivo se conectó (heartbeat cada 30 seg)';

-- ============================================================================
-- PARTE 3: Funciones Helper de Privacidad
-- ============================================================================

-- Función para resolver el nivel de privacidad con jerarquía
CREATE OR REPLACE FUNCTION resolve_privacy_level(
  p_appointment_privacy VARCHAR,
  p_service_privacy VARCHAR,
  p_institution_privacy VARCHAR DEFAULT 'public_full_name'
) RETURNS VARCHAR AS $$
BEGIN
  -- Jerarquía: Appointment > Service > Institution
  RETURN COALESCE(
    p_appointment_privacy,
    p_service_privacy,
    p_institution_privacy,
    'public_full_name'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION resolve_privacy_level IS
'Resuelve el nivel de privacidad efectivo usando jerarquía: appointment > service > institution';

-- Función para generar nombre de display según privacy level
CREATE OR REPLACE FUNCTION get_display_name(
  p_first_name VARCHAR,
  p_last_name VARCHAR,
  p_privacy_level VARCHAR,
  p_ticket_number INTEGER DEFAULT NULL
) RETURNS VARCHAR AS $$
BEGIN
  CASE p_privacy_level
    WHEN 'public_full_name' THEN
      RETURN p_first_name || ' ' || p_last_name;

    WHEN 'public_initials' THEN
      RETURN SUBSTRING(p_first_name, 1, 1) || '. ' || SUBSTRING(p_last_name, 1, 1) || '.';

    WHEN 'private_ticket_only' THEN
      IF p_ticket_number IS NOT NULL THEN
        RETURN 'Turno ' || LPAD(p_ticket_number::TEXT, 3, '0');
      ELSE
        RETURN 'Turno sin número';
      END IF;

    ELSE
      RETURN p_first_name || ' ' || p_last_name;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_display_name IS
'Genera el texto a mostrar en pantalla según el nivel de privacidad';

-- ============================================================================
-- PARTE 4: Configuración Inicial de Servicios Sensibles
-- ============================================================================

-- Configurar servicios que requieren mayor privacidad por defecto
UPDATE service
SET default_privacy_level = 'private_ticket_only'
WHERE LOWER(name) LIKE '%psiquiatr%'
   OR LOWER(name) LIKE '%salud mental%'
   OR LOWER(name) LIKE '%adicciones%'
   OR LOWER(name) LIKE '%vih%'
   OR LOWER(name) LIKE '%infectolog%';

-- ============================================================================
-- PARTE 5: Políticas RLS para display_devices
-- ============================================================================

-- Habilitar RLS en display_devices
ALTER TABLE display_devices ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver solo los dispositivos de sus instituciones
CREATE POLICY "Users can view display devices of their institution"
ON display_devices FOR SELECT
USING (
  institution_id IN (
    SELECT membership.institution_id
    FROM membership
    WHERE membership.user_id = auth.uid()
    AND membership.is_active = true
  )
);

-- Admin y administrativo pueden crear dispositivos
CREATE POLICY "Admin and administrativo can create display devices"
ON display_devices FOR INSERT
WITH CHECK (
  institution_id IN (
    SELECT m.institution_id
    FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.is_active = true
    AND m.role IN ('admin', 'administrativo')
  )
);

-- Admin y administrativo pueden actualizar dispositivos
CREATE POLICY "Admin and administrativo can update display devices"
ON display_devices FOR UPDATE
USING (
  institution_id IN (
    SELECT m.institution_id
    FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.is_active = true
    AND m.role IN ('admin', 'administrativo')
  )
);

-- Admin y administrativo pueden eliminar dispositivos
CREATE POLICY "Admin and administrativo can delete display devices"
ON display_devices FOR DELETE
USING (
  institution_id IN (
    SELECT m.institution_id
    FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.is_active = true
    AND m.role IN ('admin', 'administrativo')
  )
);

-- El propio dispositivo puede actualizar su last_seen_at (heartbeat)
CREATE POLICY "Display devices can update their own heartbeat"
ON display_devices FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- PARTE 6: Actualizar Políticas RLS de daily_queue para Pantallas
-- ============================================================================

-- ELIMINAR la política anónima anterior (si existe)
DROP POLICY IF EXISTS "Anonymous users can view daily_queue for public displays" ON daily_queue;

-- NUEVA política: Usuarios autenticados con rol 'pantalla' pueden ver la cola
CREATE POLICY "Display devices can view their institution queue"
ON daily_queue FOR SELECT
TO authenticated
USING (
  -- Verificar que el usuario es un dispositivo activo
  EXISTS (
    SELECT 1
    FROM display_devices dd
    WHERE dd.user_id = auth.uid()
    AND dd.is_active = true
    AND dd.institution_id = daily_queue.institution_id
    -- Si hay filtro de servicio, aplicarlo
    AND (
      dd.service_filter IS NULL
      OR dd.service_filter = daily_queue.service_id
    )
  )
);

-- ============================================================================
-- PARTE 7: Vista Materializada para Pantallas (Opcional, para performance)
-- ============================================================================

-- Vista que ya resuelve los niveles de privacidad
-- NOTA: daily_queue tiene patient_name directamente (no hay FK a patient)
CREATE OR REPLACE VIEW daily_queue_display AS
SELECT
  dq.id,
  dq.institution_id,
  dq.service_id,
  dq.order_number,
  dq.queue_date,
  dq.status,
  dq.called_at,
  dq.patient_name,
  dq.patient_dni,

  -- Datos del servicio
  s.name as service_name,

  -- Privacy level resuelto
  resolve_privacy_level(
    dq.privacy_level,
    s.default_privacy_level,
    i.default_privacy_level
  ) as effective_privacy_level,

  -- Nombre a mostrar según privacidad
  -- NOTA: daily_queue.patient_name ya tiene el nombre completo
  -- Necesitamos parsearlo para aplicar privacidad
  CASE
    WHEN resolve_privacy_level(
      dq.privacy_level,
      s.default_privacy_level,
      i.default_privacy_level
    ) = 'public_full_name' THEN dq.patient_name

    WHEN resolve_privacy_level(
      dq.privacy_level,
      s.default_privacy_level,
      i.default_privacy_level
    ) = 'public_initials' THEN
      -- Convertir "Juan Pérez" a "J. P."
      SUBSTRING(SPLIT_PART(dq.patient_name, ' ', 1), 1, 1) || '. ' ||
      SUBSTRING(SPLIT_PART(dq.patient_name, ' ', 2), 1, 1) || '.'

    WHEN resolve_privacy_level(
      dq.privacy_level,
      s.default_privacy_level,
      i.default_privacy_level
    ) = 'private_ticket_only' THEN
      'Turno ' || LPAD(dq.order_number::TEXT, 3, '0')

    ELSE dq.patient_name
  END as display_name

FROM daily_queue dq
JOIN service s ON dq.service_id = s.id
JOIN institution i ON dq.institution_id = i.id
WHERE dq.status IN ('pendiente', 'disponible', 'llamado', 'atendido');

COMMENT ON VIEW daily_queue_display IS
'Vista que resuelve automáticamente los niveles de privacidad para mostrar en pantallas';

-- ============================================================================
-- PARTE 8: Triggers para sincronizar privacy_level
-- ============================================================================

-- ============================================================================
-- NOTA: daily_queue no tiene relación directa con appointment en el modelo actual
-- Por lo tanto, NO creamos trigger de sincronización automática
-- El privacy_level debe asignarse manualmente al crear registros en daily_queue
-- ============================================================================

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
