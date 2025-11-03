-- ============================================================================
-- MIGRATION: Redesign Roles - Phase 0 IMPROVED: Drop ALL policies, then update enum
-- Date: 2025-10-24 (IMPROVED VERSION)
-- Purpose: Drop ALL policies FIRST, then change enum type, then recreate minimal policies
-- ============================================================================
--
-- IMPORTANT: This migration MUST run before attempting to change the role_name enum
-- PostgreSQL doesn't allow changing column types if policies depend on them
-- So we DROP policies first, change the enum, then recreate them
--
-- ============================================================================

-- ============================================================================
-- Step 1: DROP ALL POLICIES (in correct dependency order)
-- ============================================================================

-- Drop policies that depend on membership.role
DROP POLICY IF EXISTS "Users can view zones based on their institution membership" ON zone;
DROP POLICY IF EXISTS "Admins can manage zones" ON zone;
DROP POLICY IF EXISTS "Users can view their institutions" ON institution;
DROP POLICY IF EXISTS "Admins can manage institutions" ON institution;
DROP POLICY IF EXISTS "Users can view rooms in their institutions" ON room;
DROP POLICY IF EXISTS "Admin and administrative staff can manage rooms" ON room;
DROP POLICY IF EXISTS "Users can view services in their institutions" ON service;
DROP POLICY IF EXISTS "Admin and administrative staff can manage services" ON service;
DROP POLICY IF EXISTS "Users can view professionals in their institutions" ON professional;
DROP POLICY IF EXISTS "Admin and administrative staff can manage professionals" ON professional;
DROP POLICY IF EXISTS "Users can view slot templates in their institutions" ON slot_template;
DROP POLICY IF EXISTS "Medical staff can manage their own slot templates" ON slot_template;
DROP POLICY IF EXISTS "Authenticated users can view and manage patients" ON patient;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view their own memberships" ON membership;
DROP POLICY IF EXISTS "Admins can manage memberships" ON membership;
DROP POLICY IF EXISTS "Users can view appointments in their institutions" ON appointment;
DROP POLICY IF EXISTS "Staff can manage appointments in their institutions" ON appointment;
DROP POLICY IF EXISTS "Users can view call events in their institutions" ON call_event;
DROP POLICY IF EXISTS "Medical staff can manage call events" ON call_event;
DROP POLICY IF EXISTS "Users can view attendance events in their institutions" ON attendance_event;
DROP POLICY IF EXISTS "Staff can manage attendance events" ON attendance_event;

-- Drop any other policies that might exist from migrations
DROP POLICY IF EXISTS "membership_select_own" ON membership;
DROP POLICY IF EXISTS "membership_insert_admin_only" ON membership;
DROP POLICY IF EXISTS "membership_update_admin_only" ON membership;
DROP POLICY IF EXISTS "membership_delete_admin_only" ON membership;
DROP POLICY IF EXISTS "user_professional_select" ON user_professional;
DROP POLICY IF EXISTS "user_professional_insert_admin" ON user_professional;
DROP POLICY IF EXISTS "user_professional_update_admin" ON user_professional;
DROP POLICY IF EXISTS "user_professional_delete_admin" ON user_professional;
DROP POLICY IF EXISTS "user_service_select" ON user_service;
DROP POLICY IF EXISTS "user_service_insert_admin" ON user_service;
DROP POLICY IF EXISTS "user_service_update_admin" ON user_service;
DROP POLICY IF EXISTS "user_service_delete_admin" ON user_service;

-- Drop display and queue policies
DROP POLICY IF EXISTS "Users can view display devices in their institutions" ON display_devices;
DROP POLICY IF EXISTS "Users can manage display devices in their institutions" ON display_devices;
DROP POLICY IF EXISTS "Users can view display templates in their institutions" ON display_template;
DROP POLICY IF EXISTS "Users can manage display templates in their institutions" ON display_template;
DROP POLICY IF EXISTS "Users can view daily queue in their institutions" ON daily_queue;
DROP POLICY IF EXISTS "Users can manage daily queue in their institutions" ON daily_queue;
DROP POLICY IF EXISTS "daily_queue_select" ON daily_queue;
DROP POLICY IF EXISTS "daily_queue_insert" ON daily_queue;
DROP POLICY IF EXISTS "daily_queue_update" ON daily_queue;

-- ============================================================================
-- Step 2: DISABLE RLS temporarily (now that policies are gone)
-- ============================================================================

ALTER TABLE appointment DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_event DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_event DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE display_devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE display_template DISABLE ROW LEVEL SECURITY;
ALTER TABLE institution DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient DISABLE ROW LEVEL SECURITY;
ALTER TABLE professional DISABLE ROW LEVEL SECURITY;
ALTER TABLE room DISABLE ROW LEVEL SECURITY;
ALTER TABLE service DISABLE ROW LEVEL SECURITY;
ALTER TABLE slot_template DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_professional DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_service DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE zone DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 3: Update the enum type (NOW this should work!)
-- ============================================================================

CREATE TYPE role_name_v2 AS ENUM (
  'super_admin',
  'admin',
  'administrativo',
  'profesional',    -- NEW: replaces 'medico'
  'servicio',       -- NEW: replaces 'enfermeria'
  'pantalla'
);

-- Migrate the membership table to use the new enum
ALTER TABLE membership
ALTER COLUMN role TYPE role_name_v2
USING role::text::role_name_v2;

-- Drop the old enum and rename the new one
DROP TYPE role_name;
ALTER TYPE role_name_v2 RENAME TO role_name;

-- ============================================================================
-- Step 4: Re-enable RLS
-- ============================================================================

ALTER TABLE appointment ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE display_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE display_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional ENABLE ROW LEVEL SECURITY;
ALTER TABLE room ENABLE ROW LEVEL SECURITY;
ALTER TABLE service ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_professional ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 5: Update existing data from old roles to new roles
-- ============================================================================

-- Convert medico → profesional
UPDATE membership SET role = 'profesional' WHERE role = 'medico';

-- Convert enfermeria → servicio
UPDATE membership SET role = 'servicio' WHERE role = 'enfermeria';

-- ============================================================================
-- Step 6: Recreate essential RLS policies (minimal set for now)
-- ============================================================================

-- Membership: Basic policies
CREATE POLICY "membership_select_own"
ON membership FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "membership_insert_admin_only"
ON membership FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "membership_update_admin_only"
ON membership FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "membership_delete_admin_only"
ON membership FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- Users: Basic policies
CREATE POLICY "users_select_own"
ON users FOR SELECT
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "users_update_own"
ON users FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "users_admin_all"
ON users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- Institution: Basic policies
CREATE POLICY "institution_select"
ON institution FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  ) OR
  id IN (
    SELECT institution_id FROM membership
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "institution_admin_all"
ON institution FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- Patient: Minimal policy to allow authenticated users
CREATE POLICY "patients_authenticated"
ON patient FOR ALL
USING (auth.uid() IS NOT NULL);

-- Daily Queue: Basic policy
CREATE POLICY "daily_queue_select"
ON daily_queue FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  ) OR
  institution_id IN (
    SELECT institution_id FROM membership
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "daily_queue_insert"
ON daily_queue FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin', 'administrativo')
  ) OR
  institution_id IN (
    SELECT institution_id FROM membership
    WHERE user_id = auth.uid()
    AND role = 'administrativo'
    AND is_active = true
  )
);

CREATE POLICY "daily_queue_update"
ON daily_queue FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin', 'administrativo')
  ) OR
  institution_id IN (
    SELECT institution_id FROM membership
    WHERE user_id = auth.uid()
    AND role = 'administrativo'
    AND is_active = true
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
-- Check that data was migrated:
-- SELECT DISTINCT role FROM membership ORDER BY role;
--
-- Should show: admin, administrativo, pantalla, profesional, servicio
--
-- ============================================================================
