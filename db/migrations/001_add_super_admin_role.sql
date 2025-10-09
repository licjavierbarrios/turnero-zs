-- Migration: Add super_admin role to role_name enum (VERSIÓN CORREGIDA)
-- Date: 2025-10-03
-- Description: Agrega el rol 'super_admin' al tipo enum role_name
--              Maneja dependencias existentes correctamente

BEGIN;

-- Paso 1: Agregar el nuevo valor al enum existente (PostgreSQL 9.1+)
-- Esto es más seguro que recrear el tipo
ALTER TYPE role_name ADD VALUE IF NOT EXISTS 'super_admin' BEFORE 'admin';

-- Nota: Los valores de enum se agregan al final por defecto
-- Si quieres 'super_admin' primero en el orden lógico, necesitas recrear

-- Paso 2: Actualizar comentario del tipo
COMMENT ON TYPE role_name IS 'Roles del sistema: super_admin (acceso global), admin (gestión institucional), administrativo (gestión de turnos), medico, enfermeria, pantalla';

-- Verificación
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'super_admin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'role_name')
  ) THEN
    RAISE NOTICE 'super_admin agregado exitosamente al enum role_name';
  ELSE
    RAISE EXCEPTION 'Error: super_admin no se agregó correctamente';
  END IF;
END $$;

COMMIT;
