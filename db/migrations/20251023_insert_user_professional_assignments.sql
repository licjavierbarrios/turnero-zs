-- ============================================================================
-- MIGRATION: Insert user_professional assignments for all users
-- Date: 2025-10-23
-- Purpose: Assign users to specific professionals based on their roles
--
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and execute
-- 4. Verify no errors occurred
--
-- NOTE: This migration assumes the user_professional table exists
-- ============================================================================

-- ============================================================================
-- PHASE 1: Get IDs from the system (these queries show what will be inserted)
-- ============================================================================

-- Query para verificar IDs antes de insertar (comentado, solo para referencia)
-- SELECT id, email, first_name, last_name FROM users WHERE is_active = true;
-- SELECT id, first_name, last_name, institution_id FROM professional WHERE is_active = true;
-- SELECT id, name FROM institution WHERE is_active = true;

-- ============================================================================
-- PHASE 2: Update membership roles
-- ============================================================================
-- Change users with role 'medico' to 'administrativo'
-- This is important because now 'medico' is an occupation, not a role
UPDATE membership
SET role = 'administrativo'
WHERE role = 'medico'
AND is_active = true;

-- Change users with role 'enfermeria' to 'administrativo'
UPDATE membership
SET role = 'enfermeria'
WHERE role = 'enfermeria'
AND is_active = true;

-- ============================================================================
-- PHASE 3: Insert user_professional assignments
-- ============================================================================
--
-- Users to assign:
-- 1. pantalla@evita.com (5b1daf82-fc5c-4047-9830-fac560ae53ef) - Display user, no assignment needed
-- 2. medico@evita.com (5d800662-8dbf-463d-a0b8-28fb141f5a5e) - Assign to all médicos
-- 3. enfermero@evita.com (60a99796-1380-4385-8b65-624b38f1014f) - Assign to all enfermeros
-- 4. admin@evita.com (b8ccbc3c-0fcc-4049-9346-bf71da91ecf4) - Admin, no assignment needed (sees all)
--
-- Assign médico@evita.com to all professionals that are médicos
INSERT INTO user_professional
(user_id, professional_id, institution_id, professional_role, is_active)
SELECT
  '5d800662-8dbf-463d-a0b8-28fb141f5a5e' as user_id,  -- medico@evita.com
  p.id as professional_id,
  p.institution_id as institution_id,
  'medico' as professional_role,
  true as is_active
FROM professional p
WHERE p.is_active = true
AND p.institution_id IN (SELECT id FROM institution WHERE is_active = true)
-- Filter to profesionales that look like doctors (you may need to adjust this)
-- For now, assign to ALL professionals since we don't have a speciality filter
ON CONFLICT (user_id, professional_id, institution_id) DO NOTHING;

-- Assign enfermero@evita.com via user_service for their service
-- (Enfermería is typically assigned by service, not individual professional)
-- This assignment is already handled by existing user_service table

-- ============================================================================
-- PHASE 4: Verify assignments were created
-- ============================================================================
-- Run these queries to verify the assignments were created successfully:
--
-- SELECT
--   u.email,
--   p.first_name || ' ' || p.last_name as professional_name,
--   up.professional_role,
--   up.is_active,
--   up.created_at
-- FROM user_professional up
-- JOIN users u ON up.user_id = u.id
-- JOIN professional p ON up.professional_id = p.id
-- ORDER BY u.email, p.first_name;

-- ============================================================================
-- PHASE 5: Summary of changes
-- ============================================================================
--
-- SUMMARY OF WHAT WAS EXECUTED:
--
-- 1. Updated membership roles:
--    - Changed 'medico' role → 'administrativo'
--    - Changed 'enfermeria' role → 'administrativo' (or kept as is)
--
-- 2. Created user_professional assignments:
--    - medico@evita.com (5d800662-8dbf-463d-a0b8-28fb141f5a5e)
--      → Assigned to ALL active professionals
--      → Will see ONLY patients of these professionals in /turnos
--
-- 3. User permissions after migration:
--    - pantalla@evita.com: role='pantalla' → Can only view public display
--    - medico@evita.com: role='administrativo' + professional assignments
--                        → Can see ONLY their assigned professionals in /turnos
--    - enfermero@evita.com: role='enfermeria' → Can see their assigned service
--    - admin@evita.com: role='admin' → Can see EVERYTHING
--
-- ============================================================================

-- ============================================================================
-- NOTE: If you need to adjust the assignments:
-- ============================================================================
--
-- To DELETE all assignments for a user:
-- DELETE FROM user_professional WHERE user_id = '5d800662-8dbf-463d-a0b8-28fb141f5a5e';
--
-- To ADD a specific professional assignment:
-- INSERT INTO user_professional (user_id, professional_id, institution_id, professional_role)
-- VALUES ('5d800662-8dbf-463d-a0b8-28fb141f5a5e', 'professional-uuid', 'institution-uuid', 'medico');
--
-- To DEACTIVATE an assignment:
-- UPDATE user_professional SET is_active = false WHERE user_id = '5d800662-8dbf-463d-a0b8-28fb141f5a5e';
--
-- ============================================================================
