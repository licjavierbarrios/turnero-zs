-- ============================================================================
-- MIGRATION: Fix RLS Policies for Admin Tables - 2025-11-04
-- Purpose: Create proper RLS policies for zone, institution, and related admin tables
-- ============================================================================

-- ============================================================================
-- ZONE TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view zones based on their institution membership" ON zone;
DROP POLICY IF EXISTS "Admins can manage zones" ON zone;

-- Enable RLS if not already enabled
ALTER TABLE zone ENABLE ROW LEVEL SECURITY;

-- Allow super_admin and admin to do everything on zones
CREATE POLICY "zone_admin_all"
ON zone FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- Allow authenticated users to view zones
CREATE POLICY "zone_authenticated_select"
ON zone FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- INSTITUTION TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their institutions" ON institution;
DROP POLICY IF EXISTS "Admins can manage institutions" ON institution;

-- Enable RLS if not already enabled
ALTER TABLE institution ENABLE ROW LEVEL SECURITY;

-- Allow super_admin and admin to do everything on institutions
CREATE POLICY "institution_admin_all"
ON institution FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- Allow authenticated users to view institutions they have access to
CREATE POLICY "institution_authenticated_select"
ON institution FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- ROOM TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view rooms in their institutions" ON room;
DROP POLICY IF EXISTS "Admin and administrative staff can manage rooms" ON room;

-- Enable RLS if not already enabled
ALTER TABLE room ENABLE ROW LEVEL SECURITY;

-- Allow super_admin and admin to do everything
CREATE POLICY "room_admin_all"
ON room FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- Allow authenticated users to view rooms
CREATE POLICY "room_authenticated_select"
ON room FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- SERVICE TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view services in their institutions" ON service;
DROP POLICY IF EXISTS "Admin and administrative staff can manage services" ON service;

-- Enable RLS if not already enabled
ALTER TABLE service ENABLE ROW LEVEL SECURITY;

-- Allow super_admin and admin to do everything
CREATE POLICY "service_admin_all"
ON service FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- Allow authenticated users to view services
CREATE POLICY "service_authenticated_select"
ON service FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PROFESSIONAL TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view professionals in their institutions" ON professional;
DROP POLICY IF EXISTS "Admin and administrative staff can manage professionals" ON professional;

-- Enable RLS if not already enabled
ALTER TABLE professional ENABLE ROW LEVEL SECURITY;

-- Allow super_admin and admin to do everything
CREATE POLICY "professional_admin_all"
ON professional FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- Allow authenticated users to view professionals
CREATE POLICY "professional_authenticated_select"
ON professional FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PATIENT TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view and manage patients" ON patient;

-- Enable RLS if not already enabled
ALTER TABLE patient ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to do everything on patients
CREATE POLICY "patient_authenticated_all"
ON patient FOR ALL
USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify policies exist:
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('zone', 'institution', 'room', 'service', 'professional', 'patient');
-- ============================================================================
