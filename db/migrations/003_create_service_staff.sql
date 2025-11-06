-- Migración: Crear tabla service_staff
-- Descripción: Personal de servicio (administrativo, enfermería, técnicos, etc)
-- Estos usuarios NO atienden pacientes pero trabajan en la institución
-- Fecha: 2025-11-05

CREATE TABLE service_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  staff_type VARCHAR(100) NOT NULL,
  -- staff_type puede ser: 'administrativo', 'enfermeria', 'tecnico_laboratorio', 'asistente_social', etc
  department VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, institution_id)
);

-- Índices
CREATE INDEX idx_service_staff_user 
  ON service_staff(user_id);
CREATE INDEX idx_service_staff_institution 
  ON service_staff(institution_id);
CREATE INDEX idx_service_staff_staff_type 
  ON service_staff(staff_type);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_service_staff_updated_at 
  BEFORE UPDATE ON service_staff 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE service_staff IS 
  'Personal de servicio que trabaja en la institución pero no atiende pacientes. Incluye administrativo, enfermería, técnicos, etc.';
COMMENT ON COLUMN service_staff.user_id IS 
  'Referencia al usuario del sistema (1:1 - un usuario es UN tipo de staff)';
COMMENT ON COLUMN service_staff.staff_type IS 
  'Tipo de personal: administrativo, enfermeria, tecnico_laboratorio, asistente_social, etc';
COMMENT ON COLUMN service_staff.department IS 
  'Departamento donde trabaja: Admisión, Farmacia, Laboratorio, etc';
