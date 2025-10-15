-- ============================================================================
-- SCRIPT LISTO PARA EJECUTAR - ELIMINACIÓN DE PROFESIONALES HUÉRFANOS
-- ============================================================================
-- PASO 1: Ejecuta este bloque primero para REVISAR
-- ============================================================================

BEGIN;

CREATE TEMP TABLE professionals_to_delete AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.speciality,
  p.email,
  i.name as institution_name,
  z.name as zone_name,
  p.is_active,
  p.created_at
FROM professional p
JOIN institution i ON p.institution_id = i.id
JOIN zone z ON i.zone_id = z.id
WHERE NOT EXISTS (SELECT 1 FROM slot_template st WHERE st.professional_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM daily_professional_assignment dpa WHERE dpa.professional_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM daily_queue dq WHERE dq.professional_id = p.id);

SELECT '⚠️ ESTOS PROFESIONALES SE VAN A ELIMINAR ⚠️' as aviso;

SELECT * FROM professionals_to_delete ORDER BY institution_name, last_name;

SELECT institution_name, COUNT(*) as cantidad FROM professionals_to_delete GROUP BY institution_name;

ROLLBACK;

-- ============================================================================
-- PASO 2: Si todo está OK arriba, ejecuta este bloque para ELIMINAR
-- ============================================================================
/*
BEGIN;

WITH deleted AS (
  DELETE FROM professional
  WHERE id IN (
    SELECT p.id
    FROM professional p
    WHERE NOT EXISTS (SELECT 1 FROM slot_template st WHERE st.professional_id = p.id)
      AND NOT EXISTS (SELECT 1 FROM daily_professional_assignment dpa WHERE dpa.professional_id = p.id)
      AND NOT EXISTS (SELECT 1 FROM daily_queue dq WHERE dq.professional_id = p.id)
  )
  RETURNING id
)
SELECT '✅ Profesionales eliminados' as resultado, COUNT(*) as cantidad FROM deleted;

SELECT 'Profesionales restantes' as estado, COUNT(*) as total FROM professional;

COMMIT;
*/
