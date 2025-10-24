-- ============================================================================
-- MIGRATION: Create user_professional table and RLS policies
-- Date: 2025-10-23
-- Purpose: Enable proper filtering of queue items by assigned professional/service
--
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and execute
-- 4. Verify no errors occurred
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE: user_professional
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_professional (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  -- Professional role/occupation (médico, enfermería, etc.)
  professional_role VARCHAR(50) DEFAULT 'medico',
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique assignment per institution
  UNIQUE(user_id, professional_id, institution_id)
);

-- ============================================================================
-- 2. CREATE INDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_professional_user
  ON user_professional(user_id);

CREATE INDEX IF NOT EXISTS idx_user_professional_professional
  ON user_professional(professional_id);

CREATE INDEX IF NOT EXISTS idx_user_professional_institution
  ON user_professional(institution_id);

CREATE INDEX IF NOT EXISTS idx_user_professional_active
  ON user_professional(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_professional_combined
  ON user_professional(user_id, institution_id, is_active);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_professional ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE RLS POLICIES
-- ============================================================================

-- Policy 1: Admin and super_admin can read all assignments in their institution
-- Users can read their own assignments
CREATE POLICY user_professional_read ON user_professional
  FOR SELECT
  USING (
    -- Super admin and admin of institution can see all
    auth.uid() IN (
      SELECT user_id FROM membership m
      WHERE m.institution_id = user_professional.institution_id
        AND m.role IN ('admin', 'super_admin')
        AND m.is_active = true
    )
    OR
    -- Users can see their own assignments
    auth.uid() = user_professional.user_id
  );

-- Policy 2: Only admin and super_admin can insert assignments
CREATE POLICY user_professional_insert ON user_professional
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM membership m
      WHERE m.institution_id = user_professional.institution_id
        AND m.role IN ('admin', 'super_admin')
        AND m.is_active = true
    )
  );

-- Policy 3: Only admin and super_admin can update assignments
CREATE POLICY user_professional_update ON user_professional
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM membership m
      WHERE m.institution_id = user_professional.institution_id
        AND m.role IN ('admin', 'super_admin')
        AND m.is_active = true
    )
  );

-- Policy 4: Only admin and super_admin can delete assignments
CREATE POLICY user_professional_delete ON user_professional
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM membership m
      WHERE m.institution_id = user_professional.institution_id
        AND m.role IN ('admin', 'super_admin')
        AND m.is_active = true
    )
  );

-- ============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_professional IS 'Assignment of users to specific professionals for queue filtering and role-based access control';
COMMENT ON COLUMN user_professional.user_id IS 'Reference to the user being assigned';
COMMENT ON COLUMN user_professional.professional_id IS 'Reference to the professional being assigned to';
COMMENT ON COLUMN user_professional.institution_id IS 'Reference to the institution where this assignment applies';
COMMENT ON COLUMN user_professional.professional_role IS 'The role/occupation of the user in relation to this professional (médico, enfermería, etc.)';
COMMENT ON COLUMN user_professional.is_active IS 'Whether this assignment is currently active';
COMMENT ON COLUMN user_professional.assigned_by IS 'Reference to the admin who created this assignment';

-- ============================================================================
-- 6. OPTIONAL: MIGRATE EXISTING USERS (uncomment if needed)
-- ============================================================================

-- If you have users with role 'medico' and want to migrate them:
-- NOTE: This assumes you know which professionals each médico should be assigned to
--
-- UNCOMMENT AND MODIFY if you want to migrate existing médicos to administrativo role:
--
-- UPDATE membership
-- SET role = 'administrativo'
-- WHERE role = 'medico'
-- AND is_active = true;
--
-- Then manually add assignments using INSERT INTO user_professional

-- ============================================================================
-- 7. VERIFICATION QUERIES (run after migration to verify)
-- ============================================================================

-- Verify table was created:
-- SELECT * FROM information_schema.tables WHERE table_name = 'user_professional';

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_professional';

-- Verify policies exist:
-- SELECT policyname, roles, qual FROM pg_policies WHERE tablename = 'user_professional';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Next steps:
-- 1. Assign users to professionals by inserting into user_professional
--    Example:
--    INSERT INTO user_professional (user_id, professional_id, institution_id, professional_role)
--    VALUES (
--      'user-uuid-here',
--      'professional-uuid-here',
--      'institution-uuid-here',
--      'medico'
--    );
--
-- 2. Test by logging in as a user and verifying they only see their assigned professionals
--
-- 3. For enfermería users, use the existing user_service table
--
-- ============================================================================
