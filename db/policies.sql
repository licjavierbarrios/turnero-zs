-- Row Level Security Policies para Turnero ZS
-- Estas políticas implementan el control de acceso multi-tenant basado en membresía

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

-- Función helper para obtener instituciones del usuario actual
CREATE OR REPLACE FUNCTION auth.user_institutions()
RETURNS SETOF UUID AS $$
  SELECT institution_id
  FROM membership
  WHERE user_id = auth.uid()
  AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER;

-- Función helper para verificar si el usuario tiene un rol específico en una institución
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

-- Función helper para verificar si el usuario es admin
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

-- POLÍTICAS RLS

-- Zonas: Solo admins pueden ver todas las zonas
CREATE POLICY "Users can view zones based on their institution membership" ON zone
  FOR SELECT USING (
    auth.is_admin() OR
    id IN (
      SELECT DISTINCT i.zone_id
      FROM institution i
      WHERE i.id IN (SELECT auth.user_institutions())
    )
  );

CREATE POLICY "Admins can manage zones" ON zone
  FOR ALL USING (auth.is_admin());

-- Instituciones: Los usuarios solo ven instituciones donde tienen membresía
CREATE POLICY "Users can view their institutions" ON institution
  FOR SELECT USING (
    auth.is_admin() OR
    id IN (SELECT auth.user_institutions())
  );

CREATE POLICY "Admins can manage institutions" ON institution
  FOR ALL USING (auth.is_admin());

-- Consultorios: Solo para instituciones donde el usuario tiene membresía
CREATE POLICY "Users can view rooms in their institutions" ON room
  FOR SELECT USING (
    auth.is_admin() OR
    institution_id IN (SELECT auth.user_institutions())
  );

CREATE POLICY "Admin and administrative staff can manage rooms" ON room
  FOR ALL USING (
    auth.is_admin() OR
    auth.has_role_in_institution(institution_id, 'administrativo')
  );

-- Servicios: Solo para instituciones donde el usuario tiene membresía
CREATE POLICY "Users can view services in their institutions" ON service
  FOR SELECT USING (
    auth.is_admin() OR
    institution_id IN (SELECT auth.user_institutions())
  );

CREATE POLICY "Admin and administrative staff can manage services" ON service
  FOR ALL USING (
    auth.is_admin() OR
    auth.has_role_in_institution(institution_id, 'administrativo')
  );

-- Profesionales: Solo para instituciones donde el usuario tiene membresía
CREATE POLICY "Users can view professionals in their institutions" ON professional
  FOR SELECT USING (
    auth.is_admin() OR
    institution_id IN (SELECT auth.user_institutions())
  );

CREATE POLICY "Admin and administrative staff can manage professionals" ON professional
  FOR ALL USING (
    auth.is_admin() OR
    auth.has_role_in_institution(institution_id, 'administrativo')
  );

-- Plantillas de horarios: Solo para profesionales de las instituciones del usuario
CREATE POLICY "Users can view slot templates in their institutions" ON slot_template
  FOR SELECT USING (
    auth.is_admin() OR
    professional_id IN (
      SELECT p.id
      FROM professional p
      WHERE p.institution_id IN (SELECT auth.user_institutions())
    )
  );

CREATE POLICY "Medical staff can manage their own slot templates" ON slot_template
  FOR ALL USING (
    auth.is_admin() OR
    (
      auth.has_role_in_institution(
        (SELECT institution_id FROM professional WHERE id = professional_id),
        'medico'
      ) AND
      professional_id IN (
        SELECT p.id
        FROM professional p
        WHERE p.institution_id IN (SELECT auth.user_institutions())
      )
    ) OR
    auth.has_role_in_institution(
      (SELECT institution_id FROM professional WHERE id = professional_id),
      'administrativo'
    )
  );

-- Pacientes: Acceso global para facilitar búsquedas (con logs de auditoría)
CREATE POLICY "Authenticated users can view and manage patients" ON patient
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Usuarios: Solo pueden ver su propia información
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (auth.is_admin());

-- Membresías: Los usuarios pueden ver sus propias membresías
CREATE POLICY "Users can view their own memberships" ON membership
  FOR SELECT USING (
    auth.is_admin() OR
    user_id = auth.uid()
  );

CREATE POLICY "Admins can manage memberships" ON membership
  FOR ALL USING (auth.is_admin());

-- Turnos: Solo para instituciones donde el usuario tiene membresía
CREATE POLICY "Users can view appointments in their institutions" ON appointment
  FOR SELECT USING (
    auth.is_admin() OR
    institution_id IN (SELECT auth.user_institutions())
  );

CREATE POLICY "Staff can manage appointments in their institutions" ON appointment
  FOR ALL USING (
    auth.is_admin() OR
    (
      institution_id IN (SELECT auth.user_institutions()) AND
      (
        auth.has_role_in_institution(institution_id, 'administrativo') OR
        auth.has_role_in_institution(institution_id, 'medico') OR
        auth.has_role_in_institution(institution_id, 'enfermeria')
      )
    )
  );

-- Eventos de llamado: Solo para instituciones donde el usuario tiene membresía
CREATE POLICY "Users can view call events in their institutions" ON call_event
  FOR SELECT USING (
    auth.is_admin() OR
    appointment_id IN (
      SELECT a.id
      FROM appointment a
      WHERE a.institution_id IN (SELECT auth.user_institutions())
    )
  );

CREATE POLICY "Medical staff can manage call events" ON call_event
  FOR ALL USING (
    auth.is_admin() OR
    appointment_id IN (
      SELECT a.id
      FROM appointment a
      WHERE a.institution_id IN (SELECT auth.user_institutions()) AND
      (
        auth.has_role_in_institution(a.institution_id, 'medico') OR
        auth.has_role_in_institution(a.institution_id, 'enfermeria')
      )
    )
  );

-- Eventos de asistencia: Solo para instituciones donde el usuario tiene membresía
CREATE POLICY "Users can view attendance events in their institutions" ON attendance_event
  FOR SELECT USING (
    auth.is_admin() OR
    appointment_id IN (
      SELECT a.id
      FROM appointment a
      WHERE a.institution_id IN (SELECT auth.user_institutions())
    )
  );

CREATE POLICY "Staff can manage attendance events" ON attendance_event
  FOR ALL USING (
    auth.is_admin() OR
    appointment_id IN (
      SELECT a.id
      FROM appointment a
      WHERE a.institution_id IN (SELECT auth.user_institutions()) AND
      (
        auth.has_role_in_institution(a.institution_id, 'administrativo') OR
        auth.has_role_in_institution(a.institution_id, 'medico') OR
        auth.has_role_in_institution(a.institution_id, 'enfermeria')
      )
    )
  );

-- Índices adicionales para optimizar las consultas de RLS
CREATE INDEX idx_membership_user_institution ON membership(user_id, institution_id) WHERE is_active = true;
CREATE INDEX idx_membership_role ON membership(role) WHERE is_active = true;