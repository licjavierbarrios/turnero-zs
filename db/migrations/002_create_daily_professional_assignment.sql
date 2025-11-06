-- Migración: Crear tabla daily_professional_assignment
-- Descripción: Asignación diaria de profesionales a consultorios
-- Esta tabla es CENTRAL para el flujo diario de turnero
-- Fecha: 2025-11-05

CREATE TABLE daily_professional_assignment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  assignment_notes TEXT,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar búsquedas frecuentes
CREATE INDEX idx_daily_professional_assignment_professional_date 
  ON daily_professional_assignment(professional_id, scheduled_date);
CREATE INDEX idx_daily_professional_assignment_room_date 
  ON daily_professional_assignment(room_id, scheduled_date);
CREATE INDEX idx_daily_professional_assignment_institution_date 
  ON daily_professional_assignment(institution_id, scheduled_date);
CREATE INDEX idx_daily_professional_assignment_date 
  ON daily_professional_assignment(scheduled_date);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_daily_professional_assignment_updated_at 
  BEFORE UPDATE ON daily_professional_assignment 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE daily_professional_assignment IS 
  'Asignación diaria de profesionales a consultorios. Es la fuente de verdad para saber qué profesional está en qué consultorio cada día.';
COMMENT ON COLUMN daily_professional_assignment.professional_id IS 
  'Referencia al profesional';
COMMENT ON COLUMN daily_professional_assignment.room_id IS 
  'Consultorio asignado PARA ESTE DÍA';
COMMENT ON COLUMN daily_professional_assignment.scheduled_date IS 
  'La fecha para la cual es esta asignación';
COMMENT ON COLUMN daily_professional_assignment.start_time IS 
  'Hora de inicio de atención (opcional)';
COMMENT ON COLUMN daily_professional_assignment.end_time IS 
  'Hora de fin de atención (opcional)';
COMMENT ON COLUMN daily_professional_assignment.assignment_notes IS 
  'Notas sobre la asignación, ej: "Consultorio temporal por evento ministerial"';
COMMENT ON COLUMN daily_professional_assignment.assigned_by IS 
  'Usuario que hizo la asignación (para auditoría)';
COMMENT ON COLUMN daily_professional_assignment.institution_id IS 
  'Institución para RLS y relaciones';
