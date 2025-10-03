-- =====================================================
-- SCRIPT CONSOLIDADO: Setup Super Admin Completo
-- Turnero ZS - Sistema de Gestión de Turnos
-- =====================================================
-- IMPORTANTE: Este script asume que ya tienes el schema base aplicado
-- Ejecutar en SQL Editor de Supabase DESPUÉS de crear el usuario en Auth
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 1: Agregar rol super_admin al enum
-- =====================================================

-- Verificar si super_admin ya existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'super_admin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'role_name')
  ) THEN
    -- Agregar super_admin al enum
    ALTER TYPE role_name ADD VALUE 'super_admin' BEFORE 'admin';
    RAISE NOTICE '✓ Rol super_admin agregado al enum role_name';
  ELSE
    RAISE NOTICE '✓ Rol super_admin ya existe en el enum';
  END IF;
END $$;

-- Actualizar comentario
COMMENT ON TYPE role_name IS 'Roles del sistema: super_admin (acceso global), admin (gestión institucional), administrativo (gestión de turnos), medico, enfermeria, pantalla';

-- =====================================================
-- PASO 2: Crear Zona y Institución "Sistema" (ficticias)
-- =====================================================

DO $$
BEGIN
  -- Crear zona "Sistema"
  INSERT INTO zone (id, name, description)
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Sistema',
    'Zona virtual para administración del sistema'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

  RAISE NOTICE '✓ Zona "Sistema" creada/actualizada';

  -- Crear institución "Sistema"
  INSERT INTO institution (
    id,
    zone_id,
    name,
    type,
    address,
    slug
  )
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'Administración del Sistema',
    'caps',
    'Sistema',
    'sistema-admin'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug;

  RAISE NOTICE '✓ Institución "Sistema" creada/actualizada';
END $$;

-- =====================================================
-- PASO 4: Crear perfil y membresía del super admin
-- =====================================================

-- IMPORTANTE: Reemplazar el UUID y email con los datos reales del usuario
-- que creaste en Authentication > Users de Supabase

DO $$
DECLARE
  super_admin_uuid UUID := '2f717f13-99b4-4fcc-a133-427755d89836';  -- UUID del super admin
  v_email TEXT := 'licjavierbarrios@hotmail.com';  -- Email del super admin
BEGIN

  -- Crear perfil en users
  INSERT INTO public.users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    is_active
  )
  VALUES (
    super_admin_uuid,
    v_email,
    'supabase_auth_handles_this',  -- No se usa, auth.users maneja passwords
    'Super',
    'Administrador',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_active = true;

  RAISE NOTICE '✓ Perfil de super admin creado/actualizado para %', v_email;

  -- Crear membresía de super_admin
  INSERT INTO public.membership (
    user_id,
    institution_id,
    role,
    is_active
  )
  VALUES (
    super_admin_uuid,
    '00000000-0000-0000-0000-000000000001',  -- Institución "Sistema"
    'super_admin',
    true
  )
  ON CONFLICT (user_id, institution_id, role) DO UPDATE SET
    is_active = true;

  RAISE NOTICE '✓ Membresía super_admin creada/actualizada';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUPER ADMIN UUID: %', super_admin_uuid;
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PASO 5: Crear/Actualizar funciones helper RLS
-- =====================================================

-- Función: Verificar si el usuario es super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM membership
    WHERE user_id = (SELECT auth.uid())
    AND role = 'super_admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_super_admin() IS 'Verifica si el usuario actual tiene rol super_admin';

-- Función: Verificar si el usuario es admin de alguna institución
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM membership
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Función: Verificar si el usuario es admin de una institución específica
CREATE OR REPLACE FUNCTION public.is_admin_of_institution(institution_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM membership
    WHERE user_id = (SELECT auth.uid())
    AND institution_id = institution_uuid
    AND role = 'admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Función: Obtener instituciones del usuario
CREATE OR REPLACE FUNCTION public.user_institutions()
RETURNS SETOF UUID AS $$
  SELECT institution_id
  FROM membership
  WHERE user_id = (SELECT auth.uid())
  AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER;

-- Función: Verificar rol en institución
CREATE OR REPLACE FUNCTION public.has_role_in_institution(
  institution_uuid UUID,
  required_role role_name
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM membership
    WHERE user_id = (SELECT auth.uid())
    AND institution_id = institution_uuid
    AND role = required_role
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE '✓ Funciones helper RLS creadas/actualizadas';
END $$;

-- =====================================================
-- PASO 6: Actualizar políticas RLS críticas
-- =====================================================

-- Política para zonas: Solo super_admin puede gestionar
DROP POLICY IF EXISTS "Users can view zones based on their institution membership" ON zone;
DROP POLICY IF EXISTS "Admins can manage zones" ON zone;
DROP POLICY IF EXISTS "Users can view zones" ON zone;
DROP POLICY IF EXISTS "Only super_admin can manage zones" ON zone;

CREATE POLICY "Users can view zones" ON zone
  FOR SELECT USING (
    public.is_super_admin() OR
    id IN (
      SELECT DISTINCT i.zone_id
      FROM institution i
      WHERE i.id IN (SELECT public.user_institutions())
    )
  );

CREATE POLICY "Only super_admin can manage zones" ON zone
  FOR ALL USING (public.is_super_admin());

DO $$
BEGIN
  RAISE NOTICE '✓ Políticas RLS de zones actualizadas';
END $$;

-- Política para instituciones: Solo super_admin puede gestionar
DROP POLICY IF EXISTS "Users can view their institutions" ON institution;
DROP POLICY IF EXISTS "Admins can manage institutions" ON institution;
DROP POLICY IF EXISTS "Users can view institutions" ON institution;
DROP POLICY IF EXISTS "Only super_admin can manage institutions" ON institution;

CREATE POLICY "Users can view institutions" ON institution
  FOR SELECT USING (
    public.is_super_admin() OR
    id IN (SELECT public.user_institutions())
  );

CREATE POLICY "Only super_admin can manage institutions" ON institution
  FOR ALL USING (public.is_super_admin());

DO $$
BEGIN
  RAISE NOTICE '✓ Políticas RLS de institutions actualizadas';
END $$;

-- Política para users: Super admin ve todos, admin ve su institución
DROP POLICY IF EXISTS "Users can view system users" ON users;
DROP POLICY IF EXISTS "Super admin can manage all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can view system users" ON users
  FOR SELECT USING (
    public.is_super_admin() OR
    id = (SELECT auth.uid()) OR
    id IN (
      SELECT DISTINCT m.user_id
      FROM membership m
      WHERE m.institution_id IN (SELECT public.user_institutions())
    )
  );

CREATE POLICY "Super admin can manage all users" ON users
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = (SELECT auth.uid()));

DO $$
BEGIN
  RAISE NOTICE '✓ Políticas RLS de users actualizadas';
END $$;

-- Política para memberships
DROP POLICY IF EXISTS "Users can view memberships" ON membership;
DROP POLICY IF EXISTS "Super admin can manage all memberships" ON membership;
DROP POLICY IF EXISTS "Admins can manage memberships in their institution" ON membership;
DROP POLICY IF EXISTS "Users can view own memberships" ON membership;

CREATE POLICY "Users can view own memberships" ON membership
  FOR SELECT USING (
    public.is_super_admin() OR
    user_id = (SELECT auth.uid()) OR
    institution_id IN (
      SELECT institution_id FROM membership
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Super admin can manage all memberships" ON membership
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Admins can manage memberships in their institution" ON membership
  FOR INSERT WITH CHECK (
    public.is_admin_of_institution(institution_id)
  );

CREATE POLICY "Admins can update memberships in their institution" ON membership
  FOR UPDATE USING (
    public.is_admin_of_institution(institution_id)
  );

CREATE POLICY "Admins can delete memberships in their institution" ON membership
  FOR DELETE USING (
    public.is_admin_of_institution(institution_id)
  );

DO $$
BEGIN
  RAISE NOTICE '✓ Políticas RLS de memberships actualizadas';
END $$;

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

COMMIT;

-- =====================================================
-- VERIFICACIÓN POST-SETUP
-- =====================================================

-- Ver roles disponibles
SELECT '=== ROLES DISPONIBLES ===' as info;
SELECT enumlabel as role
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'role_name'
ORDER BY e.enumsortorder;

-- Verificar super admin
SELECT '=== SUPER ADMIN CONFIGURADO ===' as info;
SELECT
  u.email,
  u.first_name,
  u.last_name,
  m.role,
  i.name as institution,
  m.is_active
FROM users u
JOIN membership m ON m.user_id = u.id
JOIN institution i ON i.id = m.institution_id
WHERE m.role = 'super_admin';

-- Verificar funciones
SELECT '=== FUNCIONES HELPER CREADAS ===' as info;
SELECT proname as function_name
FROM pg_proc
WHERE proname IN (
  'is_super_admin',
  'is_admin',
  'is_admin_of_institution',
  'user_institutions',
  'has_role_in_institution'
)
ORDER BY proname;

-- =====================================================
-- INSTRUCCIONES FINALES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║           SETUP DE SUPER ADMIN COMPLETADO                      ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '1. Iniciar sesión con: superadmin@turnero-zs.gob.ar';
  RAISE NOTICE '2. Cambiar el password inmediatamente';
  RAISE NOTICE '3. Acceder a /super-admin/zonas (cuando esté implementado)';
  RAISE NOTICE '';
  RAISE NOTICE 'El super admin puede:';
  RAISE NOTICE '  ✓ Crear/editar/eliminar Zonas Sanitarias';
  RAISE NOTICE '  ✓ Crear/editar/eliminar Instituciones';
  RAISE NOTICE '  ✓ Crear administradores de institución';
  RAISE NOTICE '  ✓ Ver todos los usuarios del sistema';
  RAISE NOTICE '';
END $$;
