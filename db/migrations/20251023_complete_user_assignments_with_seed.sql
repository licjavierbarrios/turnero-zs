-- ============================================================================
-- MIGRATION: Complete user assignments with professional seed data
-- Date: 2025-10-23
-- Purpose: Seed professionals (if missing) and assign users appropriately
--
-- IMPORTANT: 
-- This migration will:
-- 1. Check if professionals exist; if not, load them from seed
-- 2. Assign medico@evita.com to all medical professionals
-- 3. Assign enfermero@evita.com to nursing service via user_service
-- 4. Update membership roles as needed
--
-- ============================================================================

-- ============================================================================
-- PHASE 1: Seed professionals if they don't exist
-- ============================================================================
DO $$
BEGIN
  -- Check if professional table is empty
  IF (SELECT COUNT(*) FROM professional) = 0 THEN
    INSERT INTO professional (id, institution_id, first_name, last_name, speciality, license_number, email, phone, is_active) 
    VALUES
      -- Institution 1: 550e8400-e29b-41d4-a716-446655440012
      ('550e8400-e29b-41d4-a716-446655440311', '550e8400-e29b-41d4-a716-446655440012', 'Luis', 'Martínez', 'Clínica Médica', 'MP12347', 'luis.martinez@salud.gob.ar', '0387-4222333', true),
      ('550e8400-e29b-41d4-a716-446655440312', '550e8400-e29b-41d4-a716-446655440012', 'Patricia', 'López', 'Cardiología', 'MP12348', 'patricia.lopez@salud.gob.ar', '0387-4222334', true),
      ('550e8400-e29b-41d4-a716-446655440313', '550e8400-e29b-41d4-a716-446655440012', 'Roberto', 'Díaz', 'Ginecología', 'MP12349', 'roberto.diaz@salud.gob.ar', '0387-4222335', true),
      
      -- Institution 2: 550e8400-e29b-41d4-a716-446655440011
      ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440011', 'María', 'González', 'Medicina General', 'MP12345', 'maria.gonzalez@salud.gob.ar', '0387-4111222', true),
      ('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440011', 'Carlos', 'Rodríguez', 'Pediatría', 'MP12346', 'carlos.rodriguez@salud.gob.ar', '0387-4111223', true),
      ('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440011', 'Ana', 'Fernández', 'Enfermería', 'ENF001', 'ana.fernandez@salud.gob.ar', '0387-4111224', true);
    
    RAISE NOTICE 'Professional data seeded successfully';
  ELSE
    RAISE NOTICE 'Professional table already has data, skipping seed';
  END IF;
END $$;

-- ============================================================================
-- PHASE 2: Update membership roles
-- ============================================================================
-- Change 'medico' role to 'administrativo' (medico is now an occupation, not a role)
UPDATE membership
SET role = 'administrativo'
WHERE role = 'medico'
AND is_active = true;

-- Keep 'enfermeria' role as is (it can be both role and occupation)
-- But you can change to 'administrativo' if preferred:
-- UPDATE membership
-- SET role = 'administrativo'
-- WHERE role = 'enfermeria'
-- AND is_active = true;

-- ============================================================================
-- PHASE 3: Assign medico@evita.com to all medical professionals
-- ============================================================================
-- This user should see ONLY patients of assigned professionals
-- We'll assign them to all medical professionals (doctors, not nurses)
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
-- Filter out nurses/nursing professionals (those with speciality like 'Enfermería' or 'ENF')
AND p.speciality NOT ILIKE '%enfermería%'
AND p.speciality NOT ILIKE '%enf%'
ON CONFLICT (user_id, professional_id, institution_id) DO NOTHING;

-- ============================================================================
-- PHASE 4: Assign enfermero@evita.com to nursing service
-- ============================================================================
-- First, find nursing professionals and assign via user_professional
INSERT INTO user_professional
(user_id, professional_id, institution_id, professional_role, is_active)
SELECT
  '60a99796-1380-4385-8b65-624b38f1014f' as user_id,  -- enfermero@evita.com
  p.id as professional_id,
  p.institution_id as institution_id,
  'enfermeria' as professional_role,
  true as is_active
FROM professional p
WHERE p.is_active = true
-- Only nursing professionals
AND (p.speciality ILIKE '%enfermería%' OR p.speciality ILIKE '%enf%')
ON CONFLICT (user_id, professional_id, institution_id) DO NOTHING;

-- ============================================================================
-- PHASE 5: Verify the assignments
-- ============================================================================
-- Check medico@evita.com assignments
-- SELECT
--   'medico@evita.com' as user,
--   p.first_name || ' ' || p.last_name as professional_name,
--   p.speciality,
--   up.professional_role,
--   i.name as institution
-- FROM user_professional up
-- JOIN professional p ON up.professional_id = p.id
-- JOIN institution i ON up.institution_id = i.id
-- WHERE up.user_id = '5d800662-8dbf-463d-a0b8-28fb141f5a5e'
-- ORDER BY i.name, p.first_name;

-- Check enfermero@evita.com assignments
-- SELECT
--   'enfermero@evita.com' as user,
--   p.first_name || ' ' || p.last_name as professional_name,
--   p.speciality,
--   up.professional_role,
--   i.name as institution
-- FROM user_professional up
-- JOIN professional p ON up.professional_id = p.id
-- JOIN institution i ON up.institution_id = i.id
-- WHERE up.user_id = '60a99796-1380-4385-8b65-624b38f1014f'
-- ORDER BY i.name, p.first_name;

-- ============================================================================
-- PHASE 6: Summary
-- ============================================================================
--
-- ASSIGNMENTS CREATED:
--
-- 1. medico@evita.com (5d800662-8dbf-463d-a0b8-28fb141f5a5e)
--    ✅ Assigned to: All medical professionals (non-nursing)
--    → Luis Martínez (Clínica Médica)
--    → Patricia López (Cardiología)
--    → Roberto Díaz (Ginecología)
--    → María González (Medicina General)
--    → Carlos Rodríguez (Pediatría)
--
-- 2. enfermero@evita.com (60a99796-1380-4385-8b65-624b38f1014f)
--    ✅ Assigned to: Nursing professionals
--    → Ana Fernández (Enfermería)
--
-- 3. admin@evita.com (b8ccbc3c-0fcc-4049-9346-bf71da91ecf4)
--    ⏭️  NO ASSIGNMENT (admin sees all)
--
-- 4. pantalla@evita.com (5b1daf82-fc5c-4047-9830-fac560ae53ef)
--    ⏭️  NO ASSIGNMENT (pantalla only displays public info)
--
-- ============================================================================
-- 
-- USER VISIBILITY AFTER MIGRATION:
--
-- | User | Role | Can See |
-- |------|------|---------|
-- | medico@evita.com | administrativo + assigned professionals | ✅ Only assigned professionals' patients |
-- | enfermero@evita.com | enfermeria + assigned professionals | ✅ Only nursing professionals' patients |
-- | admin@evita.com | admin | ✅ ALL patients (no filter) |
-- | pantalla@evita.com | pantalla | ✅ PUBLIC display only |
--
-- ============================================================================
