-- ============================================================================
-- MIGRATION: Redesign Roles - Phase 0: Update role_name enum
-- Date: 2025-10-24
-- Purpose: Extend enum to include 'profesional' and 'servicio' roles
--
-- Note: In PostgreSQL, you can't directly modify an enum type.
-- We must create a new type and migrate the column.
-- ============================================================================

-- Step 1: Create new enum type with all values
CREATE TYPE role_name_v2 AS ENUM (
  'super_admin',
  'admin',
  'administrativo',
  'profesional',    -- NEW
  'servicio',       -- NEW
  'pantalla'
);

-- Step 2: Alter membership table to use new enum type
-- We cast the old role to the new type
ALTER TABLE membership 
ALTER COLUMN role TYPE role_name_v2 
USING role::text::role_name_v2;

-- Step 3: Drop old enum (it's no longer used)
DROP TYPE role_name;

-- Step 4: Rename new enum to original name
ALTER TYPE role_name_v2 RENAME TO role_name;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
--
-- Run this to verify the enum was updated:
--
-- SELECT enum_range(NULL::role_name);
--
-- Should show: (super_admin,admin,administrativo,profesional,servicio,pantalla)
--
-- ============================================================================
