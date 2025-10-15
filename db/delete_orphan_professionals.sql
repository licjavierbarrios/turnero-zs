-- ============================================================================
-- ELIMINACIÓN PERMANENTE DE PROFESIONALES HUÉRFANOS
-- ============================================================================
-- Basado en el análisis que mostró 4 profesionales sin relaciones:
-- - 3 en Hospital Seccional Norte
-- - 1 en CAPS B° Evita
--
-- ⚠️ Este script ELIMINA datos permanentemente
-- ⚠️ Ejecutar SOLO si estás 100% seguro
-- ============================================================================

BEGIN;

-- Paso 1: Crear tabla temporal con los profesionales a eliminar
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

-- Paso 2: Mostrar qué se va a eliminar
SELECT
  '⚠️ PROFESIONALES QUE SE VAN A ELIMINAR ⚠️' as aviso,
  COUNT(*) as cantidad_total
FROM professionals_to_delete;

SELECT
  first_name,
  last_name,
  speciality,
  email,
  institution_name,
  zone_name,
  is_active,
  created_at
FROM professionals_to_delete
ORDER BY institution_name, last_name;

-- Paso 3: Resumen por institución
SELECT
  institution_name,
  zone_name,
  COUNT(*) as cantidad_a_eliminar
FROM professionals_to_delete
GROUP BY institution_name, zone_name
ORDER BY cantidad_a_eliminar DESC;

-- Paso 4: ELIMINACIÓN (descomenta las siguientes líneas para ejecutar)
-- ⚠️ ADVERTENCIA FINAL: Esto es IRREVERSIBLE
-- ⚠️ Verifica que la tabla anterior muestre exactamente lo que quieres eliminar
-- ⚠️ Si algo NO es correcto, ejecuta ROLLBACK; inmediatamente

-- DESCOMENTA LAS SIGUIENTES 2 LÍNEAS PARA CONFIRMAR LA ELIMINACIÓN:
-- DELETE FROM professional
-- WHERE id IN (SELECT id FROM professionals_to_delete);

-- Paso 5: Verificar resultado (descomenta después del DELETE)
-- SELECT
--   '✅ Profesionales eliminados exitosamente' as resultado,
--   COUNT(*) as cantidad
-- FROM professionals_to_delete;

-- Paso 6: Ver estado final (descomenta después del DELETE)
-- SELECT
--   'Profesionales restantes en la base de datos' as descripcion,
--   COUNT(*) as cantidad
-- FROM professional;

-- Paso 7: Por defecto hace ROLLBACK para seguridad
-- Cambia esto a COMMIT solo después de verificar que todo está correcto

ROLLBACK; -- ⚠️ Cambia a COMMIT; cuando estés 100% seguro

-- ============================================================================
-- INSTRUCCIONES DE USO:
-- ============================================================================
-- 1. Ejecuta el script TAL COMO ESTÁ (con ROLLBACK)
-- 2. Revisa cuidadosamente la lista de profesionales a eliminar
-- 3. Verifica que sean exactamente los 4 esperados:
--    - 3 de Hospital Seccional Norte
--    - 1 de CAPS B° Evita
-- 4. Si TODO está correcto:
--    a. Descomenta las líneas del DELETE (líneas 56-57)
--    b. Descomenta las líneas de verificación (líneas 60-71)
--    c. Cambia ROLLBACK a COMMIT (línea 76)
-- 5. Ejecuta nuevamente el script
-- 6. Verifica en /profesionales que se eliminaron correctamente
-- ============================================================================
