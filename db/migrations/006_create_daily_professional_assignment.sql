-- Migración 006: Tabla de Asignaciones Diarias de Profesionales a Consultorios
-- Esta tabla registra qué profesional está en qué consultorio cada día
-- Permite que los profesionales roten consultorios según la jornada

CREATE TABLE IF NOT EXISTS daily_professional_assignment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Profesional asignado
  professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE CASCADE,

  -- Consultorio asignado
  room_id UUID NOT NULL REFERENCES room(id) ON DELETE RESTRICT,

  -- Institución
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,

  -- Fecha de la asignación
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Constraint: Un profesional solo puede estar en un consultorio por día
  UNIQUE(professional_id, assignment_date),

  -- Constraint: Un consultorio puede tener múltiples profesionales en el día (turnos mañana/tarde)
  -- pero validamos que no se asigne el mismo profesional dos veces
  CHECK (professional_id IS NOT NULL AND room_id IS NOT NULL)
);

-- Índices para mejorar performance
CREATE INDEX idx_daily_prof_assignment_date ON daily_professional_assignment(assignment_date);
CREATE INDEX idx_daily_prof_assignment_institution ON daily_professional_assignment(institution_id, assignment_date);
CREATE INDEX idx_daily_prof_assignment_professional ON daily_professional_assignment(professional_id);
CREATE INDEX idx_daily_prof_assignment_room ON daily_professional_assignment(room_id);

-- Comentarios para documentación
COMMENT ON TABLE daily_professional_assignment IS 'Asignaciones diarias de profesionales a consultorios. Permite rotación flexible de consultorios.';
COMMENT ON COLUMN daily_professional_assignment.assignment_date IS 'Fecha de la asignación. Por defecto es el día actual.';
