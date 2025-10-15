-- ============================================================================
-- LIMPIEZA DE PROFESIONALES HUÉRFANOS (DATOS DE SEED/PRUEBA)
-- ============================================================================
-- ⚠️ ADVERTENCIA: Este script ELIMINA datos permanentemente
-- ⚠️ Ejecutar SOLO después de revisar el análisis y confirmar
-- ⚠️ Hacer BACKUP antes de ejecutar

-- ============================================================================
-- OPCIÓN 1: MODO SEGURO - Solo marcar como inactivos
-- ============================================================================
-- Esta opción NO elimina, solo desactiva profesionales huérfanos
-- Recomendado como primer paso

BEGIN;

UPDATE professional
SET
  is_active = false,
  updated_at = NOW()
WHERE id IN (
  SELECT p.id
  FROM professional p
  WHERE NOT EXISTS (SELECT 1 FROM slot_template st WHERE st.professional_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM daily_professional_assignment dpa WHERE dpa.professional_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM daily_queue dq WHERE dq.professional_id = p.id)
);

-- Ver cuántos se desactivaron
SELECT
  'Profesionales desactivados' as accion,
  COUNT(*) as cantidad
FROM professional
WHERE is_active = false
  AND NOT EXISTS (SELECT 1 FROM slot_template st WHERE st.professional_id = professional.id)
  AND NOT EXISTS (SELECT 1 FROM daily_professional_assignment dpa WHERE dpa.professional_id = professional.id)
  AND NOT EXISTS (SELECT 1 FROM daily_queue dq WHERE dq.professional_id = professional.id);

-- Si todo se ve bien, ejecuta:
-- COMMIT;
-- Si algo está mal, ejecuta:
-- ROLLBACK;

ROLLBACK; -- Por defecto hace rollback para que revises primero


-- ============================================================================
-- OPCIÓN 2: ELIMINACIÓN PERMANENTE - Profesionales huérfanos
-- ============================================================================
-- ⚠️ PELIGRO: Esta opción ELIMINA datos permanentemente
-- Solo ejecutar después de confirmar que son datos de prueba/seed

/*
BEGIN;

-- Guardar IDs para verificar
CREATE TEMP TABLE professionals_to_delete AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  i.name as institution_name,
  p.created_at
FROM professional p
JOIN institution i ON p.institution_id = i.id
WHERE NOT EXISTS (SELECT 1 FROM slot_template st WHERE st.professional_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM daily_professional_assignment dpa WHERE dpa.professional_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM daily_queue dq WHERE dq.professional_id = p.id);

-- Mostrar qué se va a eliminar
SELECT
  'Profesionales a eliminar' as accion,
  COUNT(*) as cantidad
FROM professionals_to_delete;

SELECT * FROM professionals_to_delete ORDER BY created_at;

-- DESCOMENTA las siguientes líneas SOLO si estás 100% seguro
-- DELETE FROM professional
-- WHERE id IN (SELECT id FROM professionals_to_delete);

-- SELECT 'Profesionales eliminados' as resultado, COUNT(*) as cantidad FROM professionals_to_delete;

-- COMMIT;

ROLLBACK; -- Por defecto hace rollback
*/


-- ============================================================================
-- OPCIÓN 3: ELIMINACIÓN SELECTIVA - Por fecha de creación
-- ============================================================================
-- Elimina solo profesionales antiguos (de seeds) sin uso

/*
BEGIN;

-- Profesionales creados hace más de 30 días sin ninguna actividad
DELETE FROM professional
WHERE id IN (
  SELECT p.id
  FROM professional p
  WHERE p.created_at < NOW() - INTERVAL '30 days'
    AND NOT EXISTS (SELECT 1 FROM slot_template st WHERE st.professional_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM daily_professional_assignment dpa WHERE dpa.professional_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM daily_queue dq WHERE dq.professional_id = p.id)
);

COMMIT;
*/


-- ============================================================================
-- VERIFICACIÓN POST-LIMPIEZA
-- ============================================================================
-- Ejecutar después de la limpieza para verificar

SELECT
  'Profesionales restantes' as descripcion,
  COUNT(*) as cantidad
FROM professional;

SELECT
  i.name as institucion,
  COUNT(p.id) as profesionales_activos
FROM professional p
JOIN institution i ON p.institution_id = i.id
WHERE p.is_active = true
GROUP BY i.name
ORDER BY profesionales_activos DESC;
