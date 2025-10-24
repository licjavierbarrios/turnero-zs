-- ============================================================================
-- MIGRATION: Redesign Roles - Phase 2: Migrate existing data
-- Date: 2025-10-24
-- Purpose: Update membership roles from old model to new model
--
-- Changes:
-- 1. membership.role 'medico' → 'profesional'
-- 2. membership.role 'enfermeria' → 'servicio'
-- ============================================================================

-- ============================================================================
-- Verification BEFORE migration
-- ============================================================================
--
-- Run these to see current state:
--
-- SELECT email, role, COUNT(*) as count
-- FROM users u
-- JOIN membership m ON u.id = m.user_id
-- WHERE m.role IN ('medico', 'enfermeria', 'administrativo', 'admin')
-- GROUP BY email, role;
--
-- ============================================================================

-- ============================================================================
-- PHASE 2A: Update 'medico' role to 'profesional'
-- ============================================================================

UPDATE membership
SET role = 'profesional'
WHERE role = 'medico'
AND is_active = true;

-- Verify
-- SELECT COUNT(*) as updated_to_profesional 
-- FROM membership WHERE role = 'profesional';

-- ============================================================================
-- PHASE 2B: Update 'enfermeria' role to 'servicio'
-- ============================================================================

UPDATE membership
SET role = 'servicio'
WHERE role = 'enfermeria'
AND is_active = true;

-- Verify
-- SELECT COUNT(*) as updated_to_servicio 
-- FROM membership WHERE role = 'servicio';

-- ============================================================================
-- Verification AFTER migration
-- ============================================================================
--
-- Run these to verify migration worked:
--
-- SELECT email, role, COUNT(*) as count
-- FROM users u
-- JOIN membership m ON u.id = m.user_id
-- WHERE m.is_active = true
-- GROUP BY email, role
-- ORDER BY email;
--
-- Expected output should show:
-- - admin@evita.com with role 'admin'
-- - medico@evita.com with role 'profesional' (NOT 'medico')
-- - enfermero@evita.com with role 'servicio' (NOT 'enfermeria')
-- - pantalla@evita.com with role 'pantalla'
--
-- ============================================================================

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
--
-- Updated membership roles:
-- 1. 'medico' → 'profesional'
--    Users with this role will now be treated as professionals
--    They must have entries in user_professional_assignment
--    to see specific appointments
--
-- 2. 'enfermeria' → 'servicio'
--    Users with this role will now be treated as services
--    They must have entries in user_service_assignment
--    to see specific appointments
--
-- ============================================================================
