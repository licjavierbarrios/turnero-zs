-- Script de verificación post-eliminación
-- Verifica que no haya datos huérfanos relacionados con profesionales eliminados
-- Fecha: 2025-10-20

-- 1. Verificar que no existan appointments huérfanos
SELECT
    'appointment' as tabla,
    COUNT(*) as registros_huerfanos
FROM appointment a
WHERE NOT EXISTS (
    SELECT 1 FROM professional p WHERE p.id = a.professional_id
);

-- 2. Verificar que no existan slot_template huérfanos
SELECT
    'slot_template' as tabla,
    COUNT(*) as registros_huerfanos
FROM slot_template st
WHERE NOT EXISTS (
    SELECT 1 FROM professional p WHERE p.id = st.professional_id
);

-- 3. Verificar que no existan daily_queue huérfanos
SELECT
    'daily_queue' as tabla,
    COUNT(*) as registros_huerfanos
FROM daily_queue dq
WHERE NOT EXISTS (
    SELECT 1 FROM professional p WHERE p.id = dq.professional_id
);

-- 4. Verificar que no existan daily_professional_assignment huérfanos
SELECT
    'daily_professional_assignment' as tabla,
    COUNT(*) as registros_huerfanos
FROM daily_professional_assignment dpa
WHERE NOT EXISTS (
    SELECT 1 FROM professional p WHERE p.id = dpa.professional_id
);

-- 5. Confirmar que los profesionales fueron eliminados
SELECT
    'professional' as tabla,
    COUNT(*) as profesionales_restantes,
    CASE
        WHEN COUNT(*) = 0 THEN '✓ Eliminados correctamente'
        ELSE '✗ Aún existen profesionales'
    END as estado
FROM professional
WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440301',
    '550e8400-e29b-41d4-a716-446655440302'
);

-- 6. Listar todos los profesionales actuales
SELECT
    p.id,
    p.first_name || ' ' || p.last_name as nombre_completo,
    p.license_number,
    p.email,
    i.name as institucion
FROM professional p
LEFT JOIN institution i ON p.institution_id = i.id
ORDER BY p.last_name, p.first_name;
