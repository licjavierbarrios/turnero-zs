-- Script para eliminar profesionales de ejemplo (María S. González y Carlos Rodríguez)
-- Fecha: 2025-10-20
--
-- IMPORTANTE: Este script eliminará TODOS los datos relacionados con estos profesionales
-- Ejecutar con precaución y verificar que son los profesionales correctos
--
-- Resumen de registros a eliminar:
-- - 2 profesionales (María S. González MP12345, Carlos Rodríguez MP12346)
-- - 7 slot_template (plantillas de horarios)
-- - 12 appointment (turnos futuros - tabla NO EN USO)
-- - 0 daily_queue (turnos del día)
-- - 0 daily_professional_assignment (asignaciones del día)
-- - 0 user_service (especialidades asignadas)

BEGIN;

-- 1. Eliminar appointments relacionados (tabla futura, NO EN USO actualmente)
DELETE FROM appointment
WHERE professional_id IN (
    '550e8400-e29b-41d4-a716-446655440301', -- María S. González
    '550e8400-e29b-41d4-a716-446655440302'  -- Carlos Rodríguez
);

-- 2. Eliminar slot_template (plantillas de horarios)
DELETE FROM slot_template
WHERE professional_id IN (
    '550e8400-e29b-41d4-a716-446655440301',
    '550e8400-e29b-41d4-a716-446655440302'
);

-- 3. Eliminar daily_queue si hubiera (turnos del día - sistema ACTIVO)
DELETE FROM daily_queue
WHERE professional_id IN (
    '550e8400-e29b-41d4-a716-446655440301',
    '550e8400-e29b-41d4-a716-446655440302'
);

-- 4. Eliminar daily_professional_assignment (asignaciones diarias)
DELETE FROM daily_professional_assignment
WHERE professional_id IN (
    '550e8400-e29b-41d4-a716-446655440301',
    '550e8400-e29b-41d4-a716-446655440302'
);

-- 5. Finalmente, eliminar los profesionales
DELETE FROM professional
WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440301',
    '550e8400-e29b-41d4-a716-446655440302'
);

-- Verificar eliminación
SELECT 'Profesionales eliminados correctamente' as resultado;

COMMIT;

-- Para verificar que todo fue eliminado:
-- SELECT COUNT(*) FROM appointment WHERE professional_id IN ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440302');
-- SELECT COUNT(*) FROM slot_template WHERE professional_id IN ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440302');
-- SELECT COUNT(*) FROM professional WHERE id IN ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440302');
