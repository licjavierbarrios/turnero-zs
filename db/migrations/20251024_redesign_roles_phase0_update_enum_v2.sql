-- ============================================================================
-- MIGRATION: Redesign Roles - Phase 0 v2: Update role_name enum
-- Date: 2025-10-24
-- Purpose: Extend enum to include 'profesional' and 'servicio' roles
--
-- Note: We need to drop RLS policies first, then alter enum, then recreate them
-- ============================================================================

-- Step 1: Drop existing RLS policies on membership table
DROP POLICY IF EXISTS "Users can view own memberships" ON membership;
DROP POLICY IF EXISTS "Users can view institution memberships" ON membership;
DROP POLICY IF EXISTS "Admins can manage all memberships" ON membership;
DROP POLICY IF EXISTS "Users can insert membership" ON membership;
DROP POLICY IF EXISTS "Admins can update memberships" ON membership;
DROP POLICY IF EXISTS "Admins can delete memberships" ON membership;

-- Step 2: Create new enum type with all values
CREATE TYPE role_name_v2 AS ENUM (
  'super_admin',
  'admin',
  'administrativo',
  'profesional',    -- NEW
  'servicio',       -- NEW
  'pantalla'
);

-- Step 3: Alter membership table to use new enum type
ALTER TABLE membership 
ALTER COLUMN role TYPE role_name_v2 
USING role::text::role_name_v2;

-- Step 4: Drop old enum (it's no longer used)
DROP TYPE role_name;

-- Step 5: Rename new enum to original name
ALTER TYPE role_name_v2 RENAME TO role_name;

-- Step 6: Recreate RLS policies on membership table
CREATE POLICY "Users can view own memberships"
ON membership
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view institution memberships"
ON membership
FOR SELECT
USING (institution_id IN (
  SELECT institution_id FROM membership 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all memberships"
ON membership
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Users can insert membership"
ON membership
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can update memberships"
ON membership
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can delete memberships"
ON membership
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

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
