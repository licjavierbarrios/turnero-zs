-- ============================================================================
-- CREAR USUARIO SUPER ADMIN EN SUPABASE AUTH
-- ============================================================================
--
-- Este script crea un usuario en Supabase Auth y lo configura como super admin
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto Supabase → Authentication → Users
-- 2. Clic en "Add user" → "Create new user"
-- 3. Email: licjavierbarrios@hotmail.com
-- 4. Contraseña: [elige una contraseña segura]
-- 5. Marca "Auto Confirm User" para que no necesite verificar email
-- 6. Copia el UUID del usuario creado
-- 7. Ejecuta este script reemplazando el UUID abajo
--
-- ============================================================================

DO $$
DECLARE
  -- ⚠️ REEMPLAZA ESTE UUID CON EL UUID DEL USUARIO CREADO EN AUTH
  super_admin_uuid UUID := '2f717f13-99b4-4fcc-a133-427755d89836';
  super_admin_email TEXT := 'licjavierbarrios@hotmail.com';
  sistema_institution_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Verificar que el UUID no sea el de ejemplo
  IF super_admin_uuid = '2f717f13-99b4-4fcc-a133-427755d89836' THEN
    RAISE NOTICE '⚠️  ADVERTENCIA: Usando UUID de ejemplo';
    RAISE NOTICE 'Si ya creaste el usuario en Auth, reemplaza el UUID en este script';
  END IF;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Configurando usuario super admin...';
  RAISE NOTICE 'Email: %', super_admin_email;
  RAISE NOTICE 'UUID: %', super_admin_uuid;
  RAISE NOTICE '================================================';

  -- 1. Verificar que exista la institución Sistema
  IF NOT EXISTS (SELECT 1 FROM institution WHERE id = sistema_institution_id) THEN
    RAISE EXCEPTION 'La institución Sistema no existe. Ejecuta primero SETUP-SUPER-ADMIN-COMPLETO.sql';
  END IF;

  -- 2. Crear/actualizar perfil de usuario en tabla users
  INSERT INTO users (id, email, first_name, last_name, is_active)
  VALUES (
    super_admin_uuid,
    super_admin_email,
    'Super',
    'Administrador',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  RAISE NOTICE '✓ Perfil de usuario creado/actualizado';

  -- 3. Crear membership como super_admin
  INSERT INTO membership (user_id, institution_id, role, is_active)
  VALUES (
    super_admin_uuid,
    sistema_institution_id,
    'super_admin',
    true
  )
  ON CONFLICT (user_id, institution_id, role) DO UPDATE SET
    is_active = true,
    updated_at = NOW();

  RAISE NOTICE '✓ Membership super_admin creado/actualizado';

  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Usuario super admin configurado correctamente';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora puedes:';
  RAISE NOTICE '1. Ir a http://localhost:3000';
  RAISE NOTICE '2. Login con: %', super_admin_email;
  RAISE NOTICE '3. Acceder a /super-admin';
  RAISE NOTICE '';
END $$;
