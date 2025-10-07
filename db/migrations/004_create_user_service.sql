-- Crear tabla user_service para asignar servicios a usuarios
-- Permite que un usuario (enfermero, médico, administrativo) atienda en múltiples servicios

CREATE TABLE IF NOT EXISTS user_service (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Usuario asignado
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Servicio asignado
  service_id UUID NOT NULL REFERENCES service(id) ON DELETE CASCADE,

  -- Institución (para multi-tenancy)
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,

  -- Estado
  is_active BOOLEAN DEFAULT true,

  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Constraint: un usuario no puede estar asignado dos veces al mismo servicio en la misma institución
  UNIQUE(user_id, service_id, institution_id)
);

-- Índices para mejorar performance
CREATE INDEX idx_user_service_user ON user_service(user_id);
CREATE INDEX idx_user_service_service ON user_service(service_id);
CREATE INDEX idx_user_service_institution ON user_service(institution_id);
CREATE INDEX idx_user_service_active ON user_service(is_active);

-- RLS Policies
ALTER TABLE user_service ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propias asignaciones
CREATE POLICY "Users can view their own service assignments"
  ON user_service
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    institution_id IN (
      SELECT institution_id
      FROM membership
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('admin', 'super_admin')
    )
  );

-- Solo admins pueden insertar asignaciones
CREATE POLICY "Admins can insert service assignments"
  ON user_service
  FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT institution_id
      FROM membership
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('admin', 'super_admin')
    )
  );

-- Solo admins pueden actualizar asignaciones
CREATE POLICY "Admins can update service assignments"
  ON user_service
  FOR UPDATE
  USING (
    institution_id IN (
      SELECT institution_id
      FROM membership
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('admin', 'super_admin')
    )
  );

-- Solo admins pueden eliminar asignaciones
CREATE POLICY "Admins can delete service assignments"
  ON user_service
  FOR DELETE
  USING (
    institution_id IN (
      SELECT institution_id
      FROM membership
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('admin', 'super_admin')
    )
  );

-- Comentarios
COMMENT ON TABLE user_service IS 'Asignación de usuarios a servicios para filtrado de pacientes en la cola';
COMMENT ON COLUMN user_service.user_id IS 'Usuario asignado (enfermero, médico, administrativo)';
COMMENT ON COLUMN user_service.service_id IS 'Servicio asignado (Control de Enfermería, Medicina General, etc.)';
COMMENT ON COLUMN user_service.institution_id IS 'Institución donde se realiza la asignación';
