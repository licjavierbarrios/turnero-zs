-- Row Level Security Policies con Super Admin para Turnero ZS
-- Actualizado: 2025-10-03
-- Implementa jerarquía: super_admin (global) > admin (institución) > otros roles

-- Habilitar RLS en todas las tablas
ALTER TABLE zone ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution ENABLE ROW LEVEL SECURITY;
ALTER TABLE room ENABLE ROW LEVEL SECURITY;
ALTER TABLE service ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_event ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCIONES HELPER
-- ============================================================================

-- Verificar si el usuario es super_admin
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM membership
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Obtener instituciones del usuario actual
CREATE OR REPLACE FUNCTION auth.user_institutions()
RETURNS SETOF UUID AS $$
  SELECT institution_id
  FROM membership
  WHERE user_id = auth.uid()
  AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER;

-- Verificar si el usuario tiene un rol específico en una institución
CREATE OR REPLACE FUNCTION auth.has_role_in_institution(institution_uuid UUID, required_role role_name)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM membership
    WHERE user_id = auth.uid()
    AND institution_id = institution_uuid
    AND role = required_role
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Verificar si el usuario es admin de alguna institución
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM membership
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Verificar si el usuario es admin de una institución específica
CREATE OR REPLACE FUNCTION auth.is_admin_of_institution(institution_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM membership
    WHERE user_id = auth.uid()
    AND institution_id = institution_uuid
    AND role = 'admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- POLÍTICAS RLS - ZONAS
-- ============================================================================

-- Super admin puede ver todas las zonas
-- Otros usuarios ven zonas donde tienen instituciones
CREATE POLICY "Users can view zones" ON zone
  FOR SELECT USING (
    auth.is_super_admin() OR
    id IN (
      SELECT DISTINCT i.zone_id
      FROM institution i
      WHERE i.id IN (SELECT auth.user_institutions())
    )
  );

-- Solo super_admin puede crear/editar/eliminar zonas
CREATE POLICY "Only super_admin can manage zones" ON zone
  FOR ALL USING (auth.is_super_admin());

-- ============================================================================
-- POLÍTICAS RLS - INSTITUCIONES
-- ============================================================================

-- Super admin ve todas las instituciones
-- Otros usuarios solo ven sus instituciones
CREATE POLICY "Users can view institutions" ON institution
  FOR SELECT USING (
    auth.is_super_admin() OR
    id IN (SELECT auth.user_institutions())
  );

-- Solo super_admin puede crear/editar/eliminar instituciones
CREATE POLICY "Only super_admin can manage institutions" ON institution
  FOR ALL USING (auth.is_super_admin());

-- ============================================================================
-- POLÍTICAS RLS - CONSULTORIOS
-- ============================================================================

-- Ver consultorios de instituciones donde tiene acceso
CREATE POLICY "Users can view rooms in their institutions" ON room
  FOR SELECT USING (
    auth.is_super_admin() OR
    institution_id IN (SELECT auth.user_institutions())
  );

-- Admin de la institución puede gestionar consultorios
CREATE POLICY "Admins can manage rooms in their institution" ON room
  FOR ALL USING (
    auth.is_super_admin() OR
    auth.is_admin_of_institution(institution_id)
  );

-- ============================================================================
-- POLÍTICAS RLS - SERVICIOS
-- ============================================================================

-- Ver servicios de instituciones donde tiene acceso
CREATE POLICY "Users can view services in their institutions" ON service
  FOR SELECT USING (
    auth.is_super_admin() OR
    institution_id IN (SELECT auth.user_institutions())
  );

-- Admin de la institución puede gestionar servicios
CREATE POLICY "Admins can manage services in their institution" ON service
  FOR ALL USING (
    auth.is_super_admin() OR
    auth.is_admin_of_institution(institution_id)
  );

-- ============================================================================
-- POLÍTICAS RLS - PROFESIONALES
-- ============================================================================

-- Ver profesionales de instituciones donde tiene acceso
CREATE POLICY "Users can view professionals in their institutions" ON professional
  FOR SELECT USING (
    auth.is_super_admin() OR
    institution_id IN (SELECT auth.user_institutions())
  );

-- Admin de la institución puede gestionar profesionales
CREATE POLICY "Admins can manage professionals in their institution" ON professional
  FOR ALL USING (
    auth.is_super_admin() OR
    auth.is_admin_of_institution(institution_id)
  );

-- ============================================================================
-- POLÍTICAS RLS - PLANTILLAS DE HORARIOS
-- ============================================================================

-- Ver horarios de profesionales de sus instituciones
CREATE POLICY "Users can view slot templates in their institutions" ON slot_template
  FOR SELECT USING (
    auth.is_super_admin() OR
    professional_id IN (
      SELECT id FROM professional
      WHERE institution_id IN (SELECT auth.user_institutions())
    )
  );

-- Admin de la institución puede gestionar horarios
CREATE POLICY "Admins can manage slot templates in their institution" ON slot_template
  FOR ALL USING (
    auth.is_super_admin() OR
    professional_id IN (
      SELECT id FROM professional
      WHERE institution_id IN (SELECT auth.user_institutions())
      AND auth.is_admin_of_institution(institution_id)
    )
  );

-- ============================================================================
-- POLÍTICAS RLS - PACIENTES
-- ============================================================================

-- Pacientes son compartidos entre instituciones (sistema global)
-- Cualquier usuario autenticado puede ver pacientes
CREATE POLICY "Authenticated users can view patients" ON patient
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Super admin, admin y administrativo pueden gestionar pacientes
CREATE POLICY "Staff can manage patients" ON patient
  FOR ALL USING (
    auth.is_super_admin() OR
    auth.is_admin() OR
    EXISTS (
      SELECT 1 FROM membership
      WHERE user_id = auth.uid()
      AND role IN ('administrativo')
      AND is_active = true
    )
  );

-- ============================================================================
-- POLÍTICAS RLS - USUARIOS
-- ============================================================================

-- Super admin ve todos los usuarios
-- Otros solo ven usuarios de sus instituciones
CREATE POLICY "Users can view system users" ON users
  FOR SELECT USING (
    auth.is_super_admin() OR
    id IN (
      SELECT DISTINCT m.user_id
      FROM membership m
      WHERE m.institution_id IN (SELECT auth.user_institutions())
    )
  );

-- Super admin puede crear/editar cualquier usuario
-- Admin puede crear/editar usuarios de su institución (via memberships)
CREATE POLICY "Super admin can manage all users" ON users
  FOR ALL USING (auth.is_super_admin());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- ============================================================================
-- POLÍTICAS RLS - MEMBRESÍAS
-- ============================================================================

-- Super admin ve todas las membresías
-- Admin ve membresías de su institución
-- Usuarios ven sus propias membresías
CREATE POLICY "Users can view memberships" ON membership
  FOR SELECT USING (
    auth.is_super_admin() OR
    user_id = auth.uid() OR
    institution_id IN (
      SELECT institution_id FROM membership
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- Super admin puede gestionar todas las membresías
CREATE POLICY "Super admin can manage all memberships" ON membership
  FOR ALL USING (auth.is_super_admin());

-- Admin puede crear membresías en su institución
CREATE POLICY "Admins can manage memberships in their institution" ON membership
  FOR INSERT WITH CHECK (
    auth.is_admin_of_institution(institution_id)
  );

CREATE POLICY "Admins can update memberships in their institution" ON membership
  FOR UPDATE USING (
    auth.is_admin_of_institution(institution_id)
  );

CREATE POLICY "Admins can delete memberships in their institution" ON membership
  FOR DELETE USING (
    auth.is_admin_of_institution(institution_id)
  );

-- ============================================================================
-- POLÍTICAS RLS - TURNOS
-- ============================================================================

-- Ver turnos de instituciones donde tiene acceso
CREATE POLICY "Users can view appointments in their institutions" ON appointment
  FOR SELECT USING (
    auth.is_super_admin() OR
    institution_id IN (SELECT auth.user_institutions())
  );

-- Médicos solo ven sus propios turnos
CREATE POLICY "Professionals can view their own appointments" ON appointment
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM professional p
      INNER JOIN users u ON u.id = auth.uid()
      WHERE p.email = u.email
    )
  );

-- Admin y administrativo pueden gestionar turnos de su institución
CREATE POLICY "Staff can manage appointments in their institution" ON appointment
  FOR ALL USING (
    auth.is_super_admin() OR
    (
      institution_id IN (SELECT auth.user_institutions()) AND
      EXISTS (
        SELECT 1 FROM membership
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'administrativo')
        AND is_active = true
      )
    )
  );

-- Médicos pueden actualizar estado de sus turnos
CREATE POLICY "Professionals can update their own appointments" ON appointment
  FOR UPDATE USING (
    professional_id IN (
      SELECT id FROM professional p
      INNER JOIN users u ON u.id = auth.uid()
      WHERE p.email = u.email
    )
  );

-- ============================================================================
-- POLÍTICAS RLS - EVENTOS DE LLAMADO
-- ============================================================================

-- Ver eventos de llamado de instituciones donde tiene acceso
CREATE POLICY "Users can view call events in their institutions" ON call_event
  FOR SELECT USING (
    auth.is_super_admin() OR
    appointment_id IN (
      SELECT id FROM appointment
      WHERE institution_id IN (SELECT auth.user_institutions())
    )
  );

-- Médicos y personal pueden crear eventos de llamado
CREATE POLICY "Staff can create call events" ON call_event
  FOR INSERT WITH CHECK (
    auth.is_super_admin() OR
    appointment_id IN (
      SELECT id FROM appointment
      WHERE institution_id IN (SELECT auth.user_institutions())
    )
  );

-- ============================================================================
-- POLÍTICAS RLS - EVENTOS DE ASISTENCIA
-- ============================================================================

-- Ver eventos de asistencia de instituciones donde tiene acceso
CREATE POLICY "Users can view attendance events in their institutions" ON attendance_event
  FOR SELECT USING (
    auth.is_super_admin() OR
    appointment_id IN (
      SELECT id FROM appointment
      WHERE institution_id IN (SELECT auth.user_institutions())
    )
  );

-- Personal puede crear eventos de asistencia
CREATE POLICY "Staff can create attendance events" ON attendance_event
  FOR INSERT WITH CHECK (
    auth.is_super_admin() OR
    appointment_id IN (
      SELECT id FROM appointment
      WHERE institution_id IN (SELECT auth.user_institutions())
    )
  );

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON FUNCTION auth.is_super_admin() IS 'Verifica si el usuario actual tiene rol super_admin (acceso global al sistema)';
COMMENT ON FUNCTION auth.user_institutions() IS 'Retorna UUIDs de instituciones donde el usuario tiene membresía activa';
COMMENT ON FUNCTION auth.has_role_in_institution(UUID, role_name) IS 'Verifica si el usuario tiene un rol específico en una institución';
COMMENT ON FUNCTION auth.is_admin() IS 'Verifica si el usuario es admin de alguna institución';
COMMENT ON FUNCTION auth.is_admin_of_institution(UUID) IS 'Verifica si el usuario es admin de una institución específica';
