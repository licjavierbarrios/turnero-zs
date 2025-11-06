-- Migración: Migrar profesionales existentes
-- Descripción: Mover datos de professional a la nueva estructura
-- IMPORTANTE: Ejecutar DESPUÉS de las migraciones 001-005
-- Fecha: 2025-11-05

-- ============================================================================
-- PASO 1: Crear usuarios para profesionales existentes (si no existen)
-- ============================================================================

-- Para cada profesional sin user_id, crear un usuario en la tabla users
-- NOTA: Esto es una operación delicada que requiere:
-- 1. Verificar si ya existe usuario con el email del profesional
-- 2. Si existe, linkear al profesional
-- 3. Si no existe, crear usuario temporal (con password hash dummy o generado)

-- Opción segura: Crear usuarios solo para profesionales con email válido
-- Los profesionales sin email se deben crear manualmente vía interfaz

INSERT INTO users (email, password_hash, first_name, last_name, is_active)
SELECT 
  professional.email,
  'hash_temporal_requireschange',  -- Requiere cambio manual
  professional.first_name,
  professional.last_name,
  professional.is_active
FROM professional
WHERE professional.user_id IS NULL
  AND professional.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users 
    WHERE email = professional.email
  );

-- ============================================================================
-- PASO 2: Vincular profesionales con usuarios creados
-- ============================================================================

UPDATE professional
SET user_id = users.id
FROM users
WHERE professional.user_id IS NULL
  AND professional.email = users.email
  AND professional.email IS NOT NULL;

-- ============================================================================
-- PASO 3: Crear preferencias de consultorio para profesionales sin asignación
-- ============================================================================

-- Si existen profesionales sin user_id aún, no procesan
-- Los profesionales con user_id ahora tienen preferencia de consultorio

-- Crear preferencia vacía (sin consultorio preferente) para profesionales activos
INSERT INTO professional_room_preference (
  professional_id,
  institution_id,
  room_id,
  is_preferred,
  notes
)
SELECT 
  professional.id,
  professional.institution_id,
  NULL,  -- Sin consultorio preferente inicialmente
  false, -- No es preferencia fija
  'Migrado desde estructura anterior - sin consultorio preferente'
FROM professional
WHERE professional.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM professional_room_preference
    WHERE professional_room_preference.professional_id = professional.id
      AND professional_room_preference.institution_id = professional.institution_id
  );

-- ============================================================================
-- PASO 4: Marcar profesionales sin user_id como inactivos
-- ============================================================================

-- Los profesionales que no pudieron ser vinculados a usuarios se marcan inactivos
UPDATE professional
SET is_active = false
WHERE user_id IS NULL;

-- ============================================================================
-- VERIFICACIÓN Y LOGS
-- ============================================================================

-- Ejecutar después de migración para verificar:
-- SELECT COUNT(*) as profesionales_sin_usuario FROM professional WHERE user_id IS NULL;
-- SELECT COUNT(*) as preferencias_creadas FROM professional_room_preference;

-- ============================================================================
-- NOTAS DE MIGRACIÓN
-- ============================================================================

/*
IMPORTANTE - ANTES DE EJECUTAR:

1. Hacer BACKUP de la base de datos
2. Probar en environment de development primero
3. Verificar que no hay profesionales duplicados en tabla users

DESPUÉS DE EJECUTAR:

1. Verificar que todos los profesionales activos tengan user_id
2. Crear asignaciones de consultorios para profesionales activos
3. Si hay profesionales sin email:
   - Contactar al admin para crear usuario manualmente
   - O crear usuario vía interfaz de usuarios

PROFESIONALES SIN EMAIL:
- Quedarán con user_id = NULL
- Serán marcados como is_active = false
- Deberán ser revisados y corregidos manualmente
*/
