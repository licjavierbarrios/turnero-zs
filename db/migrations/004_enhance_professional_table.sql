-- Migración: Mejorar tabla professional
-- Descripción: Agregar user_id y professional_type, eliminar duplicación
-- Fecha: 2025-11-05

-- Agregar columna user_id con constraint UNIQUE
ALTER TABLE professional 
  ADD COLUMN user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE;

-- Agregar columna professional_type
ALTER TABLE professional 
  ADD COLUMN professional_type VARCHAR(100);
  -- Valores: 'medico', 'nutricionista', 'asistente_social', 'enfermero', 'tecnico_laboratorio', 'trabajador_social', 'psicólogo', 'kinesiologo', 'otro'

-- Comentarios de nuevas columnas
COMMENT ON COLUMN professional.user_id IS 
  'Referencia directa al usuario del sistema. 1:1 - Un profesional es UN usuario.';
COMMENT ON COLUMN professional.professional_type IS 
  'Tipo de profesional: medico, nutricionista, asistente_social, enfermero, tecnico_laboratorio, trabajador_social, psicólogo, kinesiologo, otro';

-- NOTA IMPORTANTE: Las columnas first_name, last_name, email seguirán existiendo 
-- temporalmente para compatibilidad hacia atrás, pero eventualmente se eliminarán.
-- Los datos reales deben venir de la tabla users a través de user_id.
