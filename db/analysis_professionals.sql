-- ============================================================================
-- ANÁLISIS DE PROFESIONALES EN LA BASE DE DATOS
-- ============================================================================
-- Este script analiza los profesionales registrados y sus relaciones

-- 1. Contar profesionales totales
SELECT
  'Total profesionales' as descripcion,
  COUNT(*) as cantidad
FROM professional;

-- 2. Profesionales por institución
SELECT
  i.name as institucion,
  z.name as zona,
  COUNT(p.id) as cantidad_profesionales
FROM professional p
JOIN institution i ON p.institution_id = i.id
JOIN zone z ON i.zone_id = z.id
GROUP BY i.name, z.name
ORDER BY cantidad_profesionales DESC;

-- 3. Profesionales activos vs inactivos
SELECT
  CASE
    WHEN is_active THEN 'Activos'
    ELSE 'Inactivos'
  END as estado,
  COUNT(*) as cantidad
FROM professional
GROUP BY is_active;

-- 4. Profesionales con asignaciones de horarios
SELECT
  'Con plantillas de horarios' as descripcion,
  COUNT(DISTINCT professional_id) as cantidad
FROM slot_template;

-- 5. Profesionales con asignaciones diarias
SELECT
  'Con asignaciones diarias' as descripcion,
  COUNT(DISTINCT professional_id) as cantidad
FROM daily_professional_assignment
WHERE assignment_date >= CURRENT_DATE - INTERVAL '30 days';

-- 6. Profesionales que aparecen en la cola diaria
SELECT
  'En cola diaria (últimos 30 días)' as descripcion,
  COUNT(DISTINCT professional_id) as cantidad
FROM daily_queue
WHERE queue_date >= CURRENT_DATE - INTERVAL '30 days'
  AND professional_id IS NOT NULL;

-- 7. Profesionales SIN ninguna relación (candidatos a eliminar)
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.speciality,
  p.email,
  i.name as institucion,
  p.is_active,
  p.created_at,
  CASE
    WHEN EXISTS (SELECT 1 FROM slot_template st WHERE st.professional_id = p.id) THEN 'Sí'
    ELSE 'No'
  END as tiene_plantillas,
  CASE
    WHEN EXISTS (SELECT 1 FROM daily_professional_assignment dpa WHERE dpa.professional_id = p.id) THEN 'Sí'
    ELSE 'No'
  END as tiene_asignaciones,
  CASE
    WHEN EXISTS (SELECT 1 FROM daily_queue dq WHERE dq.professional_id = p.id) THEN 'Sí'
    ELSE 'No'
  END as en_cola
FROM professional p
JOIN institution i ON p.institution_id = i.id
WHERE NOT EXISTS (SELECT 1 FROM slot_template st WHERE st.professional_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM daily_professional_assignment dpa WHERE dpa.professional_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM daily_queue dq WHERE dq.professional_id = p.id)
ORDER BY p.created_at;

-- 8. Resumen de profesionales huérfanos por institución
SELECT
  i.name as institucion,
  z.name as zona,
  COUNT(p.id) as profesionales_huerfanos
FROM professional p
JOIN institution i ON p.institution_id = i.id
JOIN zone z ON i.zone_id = z.id
WHERE NOT EXISTS (SELECT 1 FROM slot_template st WHERE st.professional_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM daily_professional_assignment dpa WHERE dpa.professional_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM daily_queue dq WHERE dq.professional_id = p.id)
GROUP BY i.name, z.name, i.id
ORDER BY profesionales_huerfanos DESC;
