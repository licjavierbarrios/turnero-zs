-- ============================================================================
-- MIGRATION: Redesign Roles - Phase 1: Create new assignment tables
-- Date: 2025-10-24
-- Purpose: Create user_professional_assignment and user_service_assignment
--
-- This migration:
-- 1. Creates user_professional_assignment table
-- 2. Creates user_service_assignment table
-- 3. Sets up RLS policies for both
-- 4. Creates indexes for performance
-- ============================================================================

-- ============================================================================
-- TABLE 1: user_professional_assignment
-- Purpose: Link users with role='profesional' to specific professionals
-- ============================================================================

CREATE TABLE user_professional_assignment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, professional_id, institution_id)
);

-- Create trigger for updated_at
CREATE TRIGGER update_user_professional_assignment_updated_at
BEFORE UPDATE ON user_professional_assignment
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_user_professional_assignment_user_id 
ON user_professional_assignment(user_id);

CREATE INDEX idx_user_professional_assignment_professional_id 
ON user_professional_assignment(professional_id);

CREATE INDEX idx_user_professional_assignment_institution_id 
ON user_professional_assignment(institution_id);

-- Enable RLS
ALTER TABLE user_professional_assignment ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin can see all assignments
CREATE POLICY user_professional_assignment_admin_select
ON user_professional_assignment
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- RLS Policy: User can see their own assignments
CREATE POLICY user_professional_assignment_user_select
ON user_professional_assignment
FOR SELECT
USING (user_id = auth.uid());

-- RLS Policy: Only admin can insert
CREATE POLICY user_professional_assignment_admin_insert
ON user_professional_assignment
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- RLS Policy: Only admin can update
CREATE POLICY user_professional_assignment_admin_update
ON user_professional_assignment
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- RLS Policy: Only admin can delete
CREATE POLICY user_professional_assignment_admin_delete
ON user_professional_assignment
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- ============================================================================
-- TABLE 2: user_service_assignment
-- Purpose: Link users with role='servicio' to specific services
-- ============================================================================

CREATE TABLE user_service_assignment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES service(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_id, institution_id)
);

-- Create trigger for updated_at
CREATE TRIGGER update_user_service_assignment_updated_at
BEFORE UPDATE ON user_service_assignment
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_user_service_assignment_user_id 
ON user_service_assignment(user_id);

CREATE INDEX idx_user_service_assignment_service_id 
ON user_service_assignment(service_id);

CREATE INDEX idx_user_service_assignment_institution_id 
ON user_service_assignment(institution_id);

-- Enable RLS
ALTER TABLE user_service_assignment ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin can see all assignments
CREATE POLICY user_service_assignment_admin_select
ON user_service_assignment
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- RLS Policy: User can see their own assignments
CREATE POLICY user_service_assignment_user_select
ON user_service_assignment
FOR SELECT
USING (user_id = auth.uid());

-- RLS Policy: Only admin can insert
CREATE POLICY user_service_assignment_admin_insert
ON user_service_assignment
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- RLS Policy: Only admin can update
CREATE POLICY user_service_assignment_admin_update
ON user_service_assignment
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- RLS Policy: Only admin can delete
CREATE POLICY user_service_assignment_admin_delete
ON user_service_assignment
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM membership m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('super_admin', 'admin')
  )
);

-- ============================================================================
-- VERIFICATION QUERIES (run these to verify the migration worked)
-- ============================================================================
--
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name IN ('user_professional_assignment', 'user_service_assignment');
--
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name IN ('user_professional_assignment', 'user_service_assignment');
--
-- ============================================================================
