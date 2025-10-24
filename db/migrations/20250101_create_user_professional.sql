-- Migration: Create user_professional table for assigning users to specific professionals
-- Purpose: Enable proper filtering of queue items by assigned professional/service
-- Date: 2025-10-23

-- ============================================================================
-- CREATE TABLE: user_professional
-- ============================================================================
-- This table creates a many-to-many relationship between users and professionals
-- allowing a medical user (médico) to be assigned to specific professionals
-- instead of seeing all queue items

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
-- CREATE INDICES
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on user_professional table
ALTER TABLE user_professional ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super admin can read all user_professional assignments
CREATE POLICY user_professional_read_super_admin ON user_professional
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM membership
      WHERE role = 'super_admin' AND is_active = true
    )
  );

-- Policy 2: Admin of institution can read all assignments in their institution
CREATE POLICY user_professional_read_admin ON user_professional
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM membership m
      WHERE m.institution_id = user_professional.institution_id
        AND m.role IN ('admin', 'super_admin')
        AND m.is_active = true
    )
  );

-- Policy 3: Users can read their own assignments
CREATE POLICY user_professional_read_self ON user_professional
  FOR SELECT
  USING (auth.uid() = user_professional.user_id);

-- Policy 4: Only admin of institution can insert new assignments
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

-- Policy 5: Only admin of institution can update assignments
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

-- Policy 6: Only admin of institution can delete assignments
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
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE user_professional IS 'Assignment of users to specific professionals for queue filtering and role-based access control';
COMMENT ON COLUMN user_professional.user_id IS 'Reference to the user being assigned';
COMMENT ON COLUMN user_professional.professional_id IS 'Reference to the professional being assigned to';
COMMENT ON COLUMN user_professional.institution_id IS 'Reference to the institution where this assignment applies';
COMMENT ON COLUMN user_professional.professional_role IS 'The role/occupation of the user in relation to this professional (médico, enfermería, etc.)';
COMMENT ON COLUMN user_professional.is_active IS 'Whether this assignment is currently active';
COMMENT ON COLUMN user_professional.assigned_by IS 'Reference to the admin who created this assignment';
