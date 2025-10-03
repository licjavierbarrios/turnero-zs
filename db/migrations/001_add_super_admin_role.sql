-- Migration: Add super_admin role to role_name enum
-- Date: 2025-10-03
-- Description: Agrega el rol 'super_admin' al tipo enum role_name
--              Este rol tiene acceso global al sistema para gestionar zonas e instituciones

BEGIN;

-- Paso 1: Crear nuevo enum con super_admin
CREATE TYPE role_name_new AS ENUM (
  'super_admin',
  'admin',
  'administrativo',
  'medico',
  'enfermeria',
  'pantalla'
);

-- Paso 2: Migrar la columna role en la tabla membership
ALTER TABLE membership
  ALTER COLUMN role TYPE role_name_new
  USING role::text::role_name_new;

-- Paso 3: Eliminar el tipo enum antiguo
DROP TYPE role_name;

-- Paso 4: Renombrar el nuevo tipo al nombre original
ALTER TYPE role_name_new RENAME TO role_name;

-- Paso 5: Agregar comentario
COMMENT ON TYPE role_name IS 'Roles del sistema: super_admin (acceso global), admin (gestión institucional), administrativo (gestión de turnos), medico, enfermeria, pantalla';

COMMIT;
