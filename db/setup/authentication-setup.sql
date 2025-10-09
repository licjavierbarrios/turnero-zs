-- =====================================================
-- SCRIPT DE CONFIGURACIÓN DE AUTENTICACIÓN SUPABASE
-- Turnero ZS - Sistema de Gestión de Turnos
-- =====================================================

-- 1. CREAR TABLA DE USUARIOS (si no existe)
-- Esta tabla extiende auth.users de Supabase con datos específicos del sistema
CREATE TABLE IF NOT EXISTS public.user_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  full_name VARCHAR(511) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  document_number VARCHAR(20) UNIQUE,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAR TABLA DE MEMBRESÍAS (relación usuario-institución-rol)
CREATE TABLE IF NOT EXISTS public.membership (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  role role_name NOT NULL,
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un usuario no puede tener múltiples roles activos en la misma institución
  UNIQUE(user_id, institution_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- 3. CREAR SUPER ADMIN DEL SISTEMA
-- =====================================================

-- IMPORTANTE: Este es el PRIMER USUARIO del sistema
-- Tiene acceso global para crear zonas, instituciones y asignar administradores

-- 3.1. Crear usuario Super Admin en Supabase Auth
-- Ejecutar en el panel de Supabase Auth o vía API:
-- Email: superadmin@turnero-zs.gob.ar
-- Password: (generar password seguro, cambiar en primer login)

-- 3.2. Obtener el UUID generado por Supabase Auth
-- Reemplazar 'SUPER_ADMIN_UUID_HERE' con el UUID real

-- 3.3. Crear perfil del super admin
DO $$
DECLARE
  super_admin_uuid UUID;
BEGIN
  -- Obtener el UUID del super admin desde auth.users
  -- Ajustar el email si se usó otro
  SELECT id INTO super_admin_uuid
  FROM auth.users
  WHERE email = 'superadmin@turnero-zs.gob.ar'
  LIMIT 1;

  -- Si el usuario existe, crear su perfil
  IF super_admin_uuid IS NOT NULL THEN
    INSERT INTO public.user_profile (id, first_name, last_name, document_number, phone)
    VALUES (
      super_admin_uuid,
      'Super',
      'Administrador',
      '00000000',
      '+54 9 11 0000-0000'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Crear membresía especial de super_admin
    -- NOTA: Super admin NO tiene institución específica (institution_id NULL no es permitido)
    -- Por lo tanto, creamos una institución ficticia "Sistema" solo para la membresía

    -- Crear zona "Sistema"
    INSERT INTO zone (id, name, description)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      'Sistema',
      'Zona virtual para administración del sistema'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Crear institución "Sistema"
    INSERT INTO institution (id, zone_id, name, type, address)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'Administración del Sistema',
      'caps', -- Tipo ficticio, no se usa realmente
      'Sistema'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Crear membresía de super_admin
    INSERT INTO public.membership (user_id, institution_id, role, is_active)
    VALUES (
      super_admin_uuid,
      '00000000-0000-0000-0000-000000000001',
      'super_admin',
      true
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Super Admin creado exitosamente con UUID: %', super_admin_uuid;
  ELSE
    RAISE WARNING 'No se encontró el usuario superadmin@turnero-zs.gob.ar en auth.users';
    RAISE WARNING 'Primero crea el usuario en Supabase Auth Panel con el email: superadmin@turnero-zs.gob.ar';
  END IF;
END $$;

-- =====================================================
-- 4. INSTRUCCIONES POST-SETUP
-- =====================================================

-- PASO 1: Crear usuario en Supabase Auth Panel
--   - Email: superadmin@turnero-zs.gob.ar
--   - Password: (generar seguro)
--   - Confirmar email automáticamente

-- PASO 2: Ejecutar este script completo
--   - Se creará el perfil y membresía del super admin

-- PASO 3: Iniciar sesión como super admin
--   - Cambiar password en primer login
--   - Acceder a /super-admin/zonas

-- PASO 4: Configurar el sistema
--   - Crear zonas sanitarias reales
--   - Crear instituciones (CAPS, hospitales)
--   - Asignar administradores a cada institución

-- =====================================================
-- 5. CREAR USUARIOS DE DEMO (OPCIONAL)
-- =====================================================

-- NOTA: Solo para desarrollo/testing
-- En producción, los admins de institución crearán sus propios usuarios

-- Después de crear zonas e instituciones reales, puedes crear usuarios demo:
-- juan.paredes@salud.gov.ar (admin de una institución)
-- maria.lopez@salud.gov.ar (administrativo)
-- etc.

-- INSERT INTO public.user_profile (id, first_name, last_name, document_number, phone) VALUES
-- ('USER_UUID_JUAN', 'Juan', 'Paredes', '12345678', '+54 9 11 1234-5678'),
-- ('USER_UUID_MARIA', 'María', 'López', '87654321', '+54 9 11 8765-4321');

-- INSERT INTO public.membership (user_id, institution_id, role, is_active) VALUES
-- ('USER_UUID_JUAN', 'REAL_INSTITUTION_UUID', 'admin', true),
-- ('USER_UUID_MARIA', 'REAL_INSTITUTION_UUID', 'administrativo', true);

-- =====================================================
-- 6. POLÍTICAS RLS PARA AUTENTICACIÓN
-- =====================================================

-- Política para user_profile: usuarios solo pueden ver/editar su propio perfil
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profile
  FOR UPDATE USING (auth.uid() = id);

-- Super admin puede ver todos los perfiles
CREATE POLICY "Super admin can view all profiles" ON public.user_profile
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
      AND m.role = 'super_admin'
      AND m.is_active = true
    )
  );

-- Admins pueden ver perfiles de usuarios de su institución
CREATE POLICY "Admins can view profiles in their institution" ON public.user_profile
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
      AND m.is_active = true
      AND m.institution_id IN (
        SELECT institution_id FROM membership
        WHERE user_id = id
      )
    )
  );

-- Política para membership: usuarios pueden ver sus propias membresías
ALTER TABLE public.membership ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships" ON public.membership
  FOR SELECT USING (auth.uid() = user_id AND is_active = true);

-- Super admin puede gestionar todas las membresías
CREATE POLICY "Super admin can manage all memberships" ON public.membership
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
      AND m.role = 'super_admin'
      AND m.is_active = true
    )
  );

-- Admins pueden gestionar membresías de su institución
CREATE POLICY "Admins can manage memberships in their institution" ON public.membership
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
      AND m.institution_id = membership.institution_id
      AND m.is_active = true
    )
  );

-- 6. FUNCIÓN PARA OBTENER CONTEXTO INSTITUCIONAL DEL USUARIO
CREATE OR REPLACE FUNCTION get_user_institutions(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  institution_id UUID,
  institution_name VARCHAR,
  institution_type institution_type,
  zone_name VARCHAR,
  user_role role_name,
  is_active BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id as institution_id,
    i.name as institution_name,
    i.type as institution_type,
    z.name as zone_name,
    m.role as user_role,
    m.is_active
  FROM membership m
  JOIN institution i ON m.institution_id = i.id
  JOIN zone z ON i.zone_id = z.id
  WHERE m.user_id = user_uuid
    AND m.is_active = true
  ORDER BY i.name;
END;
$$;

-- 7. FUNCIÓN PARA VALIDAR ACCESO A INSTITUCIÓN
CREATE OR REPLACE FUNCTION user_has_access_to_institution(
  user_uuid UUID DEFAULT auth.uid(),
  inst_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Si no se especifica institución, retornar false
  IF inst_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar si el usuario tiene membresía activa en la institución
  RETURN EXISTS (
    SELECT 1
    FROM membership
    WHERE user_id = user_uuid
      AND institution_id = inst_id
      AND is_active = true
  );
END;
$$;

-- 8. FUNCIÓN PARA OBTENER ROL EN INSTITUCIÓN
CREATE OR REPLACE FUNCTION get_user_role_in_institution(
  user_uuid UUID DEFAULT auth.uid(),
  inst_id UUID DEFAULT NULL
)
RETURNS role_name
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_role role_name;
BEGIN
  SELECT role INTO user_role
  FROM membership
  WHERE user_id = user_uuid
    AND institution_id = inst_id
    AND is_active = true
  LIMIT 1;

  RETURN user_role;
END;
$$;

-- 9. TRIGGER PARA ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a las tablas relevantes
CREATE TRIGGER update_user_profile_updated_at
  BEFORE UPDATE ON user_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_updated_at
  BEFORE UPDATE ON membership
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_membership_user_id ON membership(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_institution_id ON membership(institution_id);
CREATE INDEX IF NOT EXISTS idx_membership_active ON membership(is_active);
CREATE INDEX IF NOT EXISTS idx_membership_user_institution ON membership(user_id, institution_id, is_active);

-- 11. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON TABLE user_profile IS 'Perfiles de usuario extendidos que complementan auth.users de Supabase';
COMMENT ON TABLE membership IS 'Membresías que definen qué usuarios pueden acceder a qué instituciones con qué roles';
COMMENT ON FUNCTION get_user_institutions IS 'Obtiene todas las instituciones a las que un usuario tiene acceso';
COMMENT ON FUNCTION user_has_access_to_institution IS 'Verifica si un usuario tiene acceso a una institución específica';
COMMENT ON FUNCTION get_user_role_in_institution IS 'Obtiene el rol de un usuario en una institución específica';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================