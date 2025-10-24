-- ============================================================================
-- MIGRATION: Redesign Roles - Phase 0 NUCLEAR: Drop ALL policies, update enum
-- Date: 2025-10-24
-- Purpose: Clean slate - drop everything, update enum, recreate only necessary
-- ============================================================================

-- ============================================================================
-- Step 1: Disable RLS on all tables temporarily
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
-- Step 3: Re-enable RLS (without policies for now)
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
-- Step 4: Recreate essential RLS policies
-- ============================================================================

-- membership: Basic policies
CREATE POLICY "membership_select_own"
ON membership FOR SELECT
USING (user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

CREATE POLICY "membership_insert_admin_only"
ON membership FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

CREATE POLICY "membership_update_admin_only"
ON membership FOR UPDATE
USING (EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

CREATE POLICY "membership_delete_admin_only"
ON membership FOR DELETE
USING (EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

-- user_professional: Basic policies
CREATE POLICY "user_professional_select"
ON user_professional FOR SELECT
USING (user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

CREATE POLICY "user_professional_insert_admin"
ON user_professional FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

CREATE POLICY "user_professional_update_admin"
ON user_professional FOR UPDATE
USING (EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

CREATE POLICY "user_professional_delete_admin"
ON user_professional FOR DELETE
USING (EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

-- user_service: Basic policies
CREATE POLICY "user_service_select"
ON user_service FOR SELECT
USING (user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

CREATE POLICY "user_service_insert_admin"
ON user_service FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

CREATE POLICY "user_service_update_admin"
ON user_service FOR UPDATE
USING (EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

CREATE POLICY "user_service_delete_admin"
ON user_service FOR DELETE
USING (EXISTS (SELECT 1 FROM membership m WHERE m.user_id = auth.uid() AND m.role IN ('super_admin', 'admin')));

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
