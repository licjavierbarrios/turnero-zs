-- Migración: Limpiar tablas no utilizadas
-- Descripción: Eliminar tabla user_professional_assignment que no se utiliza
-- Esta tabla fue reemplazada por user_professional
-- Fecha: 2025-11-05

-- ⚠️ IMPORTANTE: Esta operación es destructiva
-- Asegúrate de que no hay datos dependientes antes de ejecutar

-- Eliminar tabla user_professional_assignment (no se usa)
-- La funcionalidad está cubierta por user_professional
DROP TABLE IF EXISTS user_professional_assignment CASCADE;

-- Comentario
COMMENT ON FUNCTION public.update_updated_at_column() IS 
  'Trigger function para actualizar automáticamente la columna updated_at';
