-- Migración 007: Agregar professional_id y room_id a daily_queue
-- Permite diferenciar entre turnos de SERVICIOS (enfermería, lab) y PROFESIONALES (médicos, nutricionistas)

-- Agregar columna para profesional (opcional, solo para turnos con profesional específico)
ALTER TABLE daily_queue
ADD COLUMN professional_id UUID REFERENCES professional(id) ON DELETE SET NULL;

-- Agregar columna para consultorio (opcional, solo para turnos con profesional)
ALTER TABLE daily_queue
ADD COLUMN room_id UUID REFERENCES room(id) ON DELETE SET NULL;

-- Índices para mejorar performance en queries
CREATE INDEX idx_daily_queue_professional ON daily_queue(professional_id) WHERE professional_id IS NOT NULL;
CREATE INDEX idx_daily_queue_room ON daily_queue(room_id) WHERE room_id IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN daily_queue.professional_id IS 'Profesional asignado (NULL para servicios generales como Enfermería, Laboratorio)';
COMMENT ON COLUMN daily_queue.room_id IS 'Consultorio asignado (NULL para servicios sin consultorio específico)';

-- Nota: La combinación de campos permite dos tipos de turnos:
-- TIPO 1 - SERVICIOS: service_id presente, professional_id NULL, room_id NULL
--   Ejemplo: Enfermería, Laboratorio, Vacunación
--
-- TIPO 2 - PROFESIONALES: service_id presente (especialidad), professional_id presente, room_id presente
--   Ejemplo: Dr. García (Clínica Médica) en Consultorio 2
