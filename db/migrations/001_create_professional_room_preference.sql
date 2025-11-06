-- Migración: Crear tabla professional_room_preference
-- Descripción: Permite guardar la preferencia de consultorio para cada profesional
-- Fecha: 2025-11-05

CREATE TABLE professional_room_preference (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE CASCADE,
  room_id UUID REFERENCES room(id) ON DELETE SET NULL,
  is_preferred BOOLEAN DEFAULT false,
  notes TEXT,
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(professional_id, institution_id)
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_professional_room_preference_professional 
  ON professional_room_preference(professional_id);
CREATE INDEX idx_professional_room_preference_room 
  ON professional_room_preference(room_id);
CREATE INDEX idx_professional_room_preference_institution 
  ON professional_room_preference(institution_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_professional_room_preference_updated_at 
  BEFORE UPDATE ON professional_room_preference 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE professional_room_preference IS 
  'Guarda la preferencia de consultorio para cada profesional en cada institución';
COMMENT ON COLUMN professional_room_preference.is_preferred IS 
  'true: Este es mi consultorio habitual; false: Puedo usar cualquiera';
COMMENT ON COLUMN professional_room_preference.notes IS 
  'Notas sobre la preferencia, ej: "Equipos de cardiología aquí"';
