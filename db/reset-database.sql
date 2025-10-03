-- ===============================================
-- SCRIPT DE LIMPIEZA COMPLETA - TURNERO ZS
-- ===============================================
-- ADVERTENCIA: Este script eliminará TODOS los datos
-- y estructuras de la base de datos
--
-- Úsalo solo cuando quieras empezar completamente de cero
-- ===============================================

-- 1. ELIMINAR TRIGGERS
DROP TRIGGER IF EXISTS update_zone_updated_at ON zone;
DROP TRIGGER IF EXISTS update_institution_updated_at ON institution;
DROP TRIGGER IF EXISTS update_room_updated_at ON room;
DROP TRIGGER IF EXISTS update_service_updated_at ON service;
DROP TRIGGER IF EXISTS update_professional_updated_at ON professional;
DROP TRIGGER IF EXISTS update_slot_template_updated_at ON slot_template;
DROP TRIGGER IF EXISTS update_patient_updated_at ON patient;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_membership_updated_at ON membership;
DROP TRIGGER IF EXISTS update_appointment_updated_at ON appointment;
DROP TRIGGER IF EXISTS update_call_event_updated_at ON call_event;
DROP TRIGGER IF EXISTS update_attendance_event_updated_at ON attendance_event;

-- 2. ELIMINAR FUNCIONES
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 3. ELIMINAR TABLAS (en orden de dependencias)
-- Primero las tablas que dependen de otras
DROP TABLE IF EXISTS attendance_event CASCADE;
DROP TABLE IF EXISTS call_event CASCADE;
DROP TABLE IF EXISTS appointment CASCADE;
DROP TABLE IF EXISTS membership CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS patient CASCADE;
DROP TABLE IF EXISTS slot_template CASCADE;
DROP TABLE IF EXISTS professional CASCADE;
DROP TABLE IF EXISTS service CASCADE;
DROP TABLE IF EXISTS room CASCADE;
DROP TABLE IF EXISTS institution CASCADE;
DROP TABLE IF EXISTS zone CASCADE;

-- 4. ELIMINAR TIPOS ENUM
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS institution_type CASCADE;
DROP TYPE IF EXISTS role_name CASCADE;

-- 5. ELIMINAR RLS POLICIES (si existen)
-- Nota: Al eliminar las tablas, las policies se eliminan automáticamente
-- pero por seguridad las listamos aquí como referencia

-- 6. VERIFICAR LIMPIEZA
-- Lista todas las tablas restantes en el schema public
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name != 'schema_migrations';

-- Lista todos los tipos enum restantes
SELECT typname
FROM pg_type
WHERE typtype = 'e'
  AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ===============================================
-- RESULTADO ESPERADO:
-- - 0 tablas del proyecto
-- - 0 tipos enum del proyecto
-- - Las extensiones uuid-ossp y pgcrypto permanecen
-- ===============================================

-- Para recrear la estructura desde cero, ejecuta después:
-- \i schema.sql
-- \i policies.sql (o el archivo de policies que prefieras)
-- \i seed.sql (opcional, para datos de prueba)