-- ============================================================================
-- MIGRATION: Redesign Roles - Phase 0 v3: Update role_name enum
-- Date: 2025-10-24
-- Purpose: Drop all policies, update enum, recreate policies
-- ============================================================================

-- ============================================================================
-- Step 1: Drop ALL RLS policies that might reference role
-- ============================================================================

-- From membership table
DROP POLICY IF EXISTS "Admins can delete memberships in their institution" ON membership;
DROP POLICY IF EXISTS "Admins can manage memberships in their institution" ON membership;
DROP POLICY IF EXISTS "Admins can update memberships in their institution" ON membership;
DROP POLICY IF EXISTS "Only admins can create memberships" ON membership;
DROP POLICY IF EXISTS "Super admin can manage all memberships" ON membership;
DROP POLICY IF EXISTS "Users can view memberships in their institutions" ON membership;
DROP POLICY IF EXISTS "Users can view own memberships" ON membership;

-- From user_professional table
DROP POLICY IF EXISTS "user_professional_delete" ON user_professional;
DROP POLICY IF EXISTS "user_professional_insert" ON user_professional;
DROP POLICY IF EXISTS "user_professional_read" ON user_professional;
DROP POLICY IF EXISTS "user_professional_update" ON user_professional;

-- From user_service table
DROP POLICY IF EXISTS "Admins can delete service assignments" ON user_service;
DROP POLICY IF EXISTS "Admins can insert service assignments" ON user_service;
DROP POLICY IF EXISTS "Admins can update service assignments" ON user_service;
DROP POLICY IF EXISTS "Users can view their own service assignments" ON user_service;

-- ============================================================================
-- Step 2: Update the enum type
-- ============================================================================

CREATE TYPE role_name_v2 AS ENUM (
  'super_admin',
  'admin',
  'administrativo',
  'profesional',    -- NEW
  'servicio',       -- NEW
  'pantalla'
);

ALTER TABLE membership 
ALTER COLUMN role TYPE role_name_v2 
USING role::text::role_name_v2;

DROP TYPE role_name;

ALTER TYPE role_name_v2 RENAME TO role_name;

-- ============================================================================
-- Step 3: Recreate membership policies
-- ============================================================================

CREATE POLICY "Users can view own memberships"
ON membership
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view memberships in their institutions"
ON membership
FOR SELECT
USING (institution_id IN (
  SELECT institution_id FROM membership 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Super admin can manage all memberships"
ON membership
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role = 'super_admin'
  )
);

CREATE POLICY "Admins can manage memberships in their institution"
ON membership
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role = 'admin'
    AND m.institution_id = membership.institution_id
  )
);

CREATE POLICY "Only admins can create memberships"
ON membership
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can update memberships in their institution"
ON membership
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
    AND (m.role = 'super_admin' OR m.institution_id = membership.institution_id)
  )
);

CREATE POLICY "Admins can delete memberships in their institution"
ON membership
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
    AND (m.role = 'super_admin' OR m.institution_id = membership.institution_id)
  )
);

-- ============================================================================
-- Step 4: Recreate user_professional policies
-- ============================================================================

CREATE POLICY "user_professional_read"
ON user_professional
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "user_professional_insert"
ON user_professional
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "user_professional_update"
ON user_professional
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "user_professional_delete"
ON user_professional
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- ============================================================================
-- Step 5: Recreate user_service policies
-- ============================================================================

CREATE POLICY "Users can view their own service assignments"
ON user_service
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can insert service assignments"
ON user_service
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can update service assignments"
ON user_service
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can delete service assignments"
ON user_service
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
