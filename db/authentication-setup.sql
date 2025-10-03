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

-- 3. CREAR USUARIOS DE DEMO
-- Insertar usuarios en auth.users (esto normalmente lo hace Supabase Auth automáticamente)
-- Para demo, creamos los perfiles directamente

-- NOTA: En Supabase, primero debes crear estos usuarios desde el Auth panel:
-- juan.paredes@salud.gov.ar (password: demo123)
-- maria.lopez@salud.gov.ar (password: demo123)
-- admin@salud.gov.ar (password: admin123)

-- Después ejecutar estos inserts con los UUIDs reales de los usuarios:

-- INSERT INTO public.user_profile (id, first_name, last_name, document_number, phone) VALUES
-- ('USER_UUID_JUAN', 'Juan', 'Paredes', '12345678', '+54 9 11 1234-5678'),
-- ('USER_UUID_MARIA', 'María', 'López', '87654321', '+54 9 11 8765-4321'),
-- ('USER_UUID_ADMIN', 'Administrador', 'Sistema', '11111111', '+54 9 11 0000-0000');

-- 4. CREAR MEMBRESÍAS DE DEMO
-- Estas se crearán después de tener los UUIDs reales de usuarios e instituciones

-- 5. POLÍTICAS RLS PARA AUTENTICACIÓN

-- Política para user_profile: usuarios solo pueden ver/editar su propio perfil
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profile
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profile
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
      AND m.is_active = true
    )
  );

-- Política para membership: usuarios pueden ver sus propias membresías
ALTER TABLE public.membership ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships" ON public.membership
  FOR SELECT USING (auth.uid() = user_id AND is_active = true);

CREATE POLICY "Admins can manage memberships" ON public.membership
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
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