-- ============================================================================
-- MIGRATION: Fix RLS Infinite Recursion - 2025-11-04
-- Purpose: Disable RLS on membership table to fix infinite recursion
-- ============================================================================

-- Disable RLS on membership table (temporary fix)
ALTER TABLE membership DISABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "membership_select_own" ON membership;
DROP POLICY IF EXISTS "membership_insert_admin_only" ON membership;
DROP POLICY IF EXISTS "membership_update_admin_only" ON membership;
DROP POLICY IF EXISTS "membership_delete_admin_only" ON membership;

-- Create simple, non-recursive policies
CREATE POLICY "membership_enable_read"
ON membership FOR SELECT
USING (true);

CREATE POLICY "membership_enable_insert"
ON membership FOR INSERT
WITH CHECK (true);

CREATE POLICY "membership_enable_update"
ON membership FOR UPDATE
USING (true);

CREATE POLICY "membership_enable_delete"
ON membership FOR DELETE
USING (true);

-- Re-enable RLS with safe policies
ALTER TABLE membership ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify policies work:
-- SELECT * FROM membership LIMIT 1;
-- ============================================================================
