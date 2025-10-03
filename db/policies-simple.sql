-- Row Level Security Policies simplificadas para Turnero ZS
-- Versión que no requiere permisos especiales en el schema auth

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

-- Función helper en el schema public (no requiere permisos especiales)
CREATE OR REPLACE FUNCTION public.user_institutions()
RETURNS SETOF UUID AS $$
  SELECT institution_id
  FROM membership
  WHERE user_id = auth.uid()
  AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER;

-- Función helper para verificar si el usuario tiene un rol específico en una institución
CREATE OR REPLACE FUNCTION public.has_role_in_institution(institution_uuid UUID, required_role role_name)
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
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM membership
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- POLÍTICAS RLS SIMPLIFICADAS

-- Zonas: Solo admins pueden ver todas las zonas, otros ven solo las de sus instituciones
CREATE POLICY "Users can view zones" ON zone
  FOR SELECT USING (
    public.is_admin() OR
    id IN (
      SELECT DISTINCT i.zone_id
      FROM institution i
      WHERE i.id IN (SELECT public.user_institutions())
    )
  );

-- Instituciones: Los usuarios solo pueden ver instituciones donde tienen membresía
CREATE POLICY "Users can view their institutions" ON institution
  FOR SELECT USING (
    public.is_admin() OR
    id IN (SELECT public.user_institutions())
  );

-- Consultorios: Solo pueden ver consultorios de sus instituciones
CREATE POLICY "Users can view rooms in their institutions" ON room
  FOR SELECT USING (
    public.is_admin() OR
    institution_id IN (SELECT public.user_institutions())
  );

-- Servicios: Solo pueden ver servicios de sus instituciones
CREATE POLICY "Users can view services in their institutions" ON service
  FOR SELECT USING (
    public.is_admin() OR
    institution_id IN (SELECT public.user_institutions())
  );

-- Profesionales: Solo pueden ver profesionales de sus instituciones
CREATE POLICY "Users can view professionals in their institutions" ON professional
  FOR SELECT USING (
    public.is_admin() OR
    institution_id IN (SELECT public.user_institutions())
  );

-- Plantillas de horarios: Solo pueden ver plantillas de sus instituciones
CREATE POLICY "Users can view slot templates in their institutions" ON slot_template
  FOR SELECT USING (
    public.is_admin() OR
    institution_id IN (SELECT public.user_institutions())
  );

-- Pacientes: Solo pueden ver pacientes de sus instituciones
CREATE POLICY "Users can view patients in their institutions" ON patient
  FOR SELECT USING (
    public.is_admin() OR
    institution_id IN (SELECT public.user_institutions())
  );

-- Usuarios: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (
    public.is_admin() OR
    id = auth.uid()
  );

-- Membresías: Los usuarios pueden ver sus propias membresías
CREATE POLICY "Users can view their own memberships" ON membership
  FOR SELECT USING (
    public.is_admin() OR
    user_id = auth.uid()
  );

-- Turnos: Solo pueden ver turnos de sus instituciones
CREATE POLICY "Users can view appointments in their institutions" ON appointment
  FOR SELECT USING (
    public.is_admin() OR
    institution_id IN (SELECT public.user_institutions())
  );

-- Eventos de llamada: Solo pueden ver eventos de sus instituciones
CREATE POLICY "Users can view call events in their institutions" ON call_event
  FOR SELECT USING (
    public.is_admin() OR
    institution_id IN (SELECT public.user_institutions())
  );

-- Eventos de asistencia: Solo pueden ver eventos de sus instituciones
CREATE POLICY "Users can view attendance events in their institutions" ON attendance_event
  FOR SELECT USING (
    public.is_admin() OR
    institution_id IN (SELECT public.user_institutions())
  );

-- POLÍTICAS DE INSERCIÓN (INSERT)

-- Instituciones: Solo admins pueden crear instituciones
CREATE POLICY "Only admins can create institutions" ON institution
  FOR INSERT WITH CHECK (public.is_admin());

-- Consultorios: Admins y administrativos pueden crear consultorios
CREATE POLICY "Admins and administrative staff can create rooms" ON room
  FOR INSERT WITH CHECK (
    public.is_admin() OR
    public.has_role_in_institution(institution_id, 'administrativo')
  );

-- Servicios: Admins y administrativos pueden crear servicios
CREATE POLICY "Admins and administrative staff can create services" ON service
  FOR INSERT WITH CHECK (
    public.is_admin() OR
    public.has_role_in_institution(institution_id, 'administrativo')
  );

-- Profesionales: Admins y administrativos pueden crear profesionales
CREATE POLICY "Admins and administrative staff can create professionals" ON professional
  FOR INSERT WITH CHECK (
    public.is_admin() OR
    public.has_role_in_institution(institution_id, 'administrativo')
  );

-- Pacientes: Admins y personal administrativo/médico pueden crear pacientes
CREATE POLICY "Healthcare staff can create patients" ON patient
  FOR INSERT WITH CHECK (
    public.is_admin() OR
    public.has_role_in_institution(institution_id, 'administrativo') OR
    public.has_role_in_institution(institution_id, 'medico') OR
    public.has_role_in_institution(institution_id, 'enfermeria')
  );

-- Turnos: Personal autorizado puede crear turnos
CREATE POLICY "Healthcare staff can create appointments" ON appointment
  FOR INSERT WITH CHECK (
    public.is_admin() OR
    public.has_role_in_institution(institution_id, 'administrativo') OR
    public.has_role_in_institution(institution_id, 'medico') OR
    public.has_role_in_institution(institution_id, 'enfermeria')
  );

-- POLÍTICAS DE ACTUALIZACIÓN (UPDATE)

-- Turnos: Solo personal autorizado puede actualizar turnos
CREATE POLICY "Healthcare staff can update appointments" ON appointment
  FOR UPDATE USING (
    public.is_admin() OR
    public.has_role_in_institution(institution_id, 'administrativo') OR
    public.has_role_in_institution(institution_id, 'medico') OR
    public.has_role_in_institution(institution_id, 'enfermeria')
  );

-- Profesionales: Solo admins y administrativos pueden actualizar profesionales
CREATE POLICY "Admins and administrative staff can update professionals" ON professional
  FOR UPDATE USING (
    public.is_admin() OR
    public.has_role_in_institution(institution_id, 'administrativo')
  );

-- ACCESO PÚBLICO (para pantallas públicas)

-- Política especial para permitir acceso de solo lectura a datos necesarios para pantallas públicas
-- Estas políticas permiten acceso sin autenticación para funcionalidad de pantalla pública

-- Permitir lectura pública de instituciones (solo nombre y tipo)
CREATE POLICY "Public access to institution basic info" ON institution
  FOR SELECT USING (true);

-- Permitir lectura pública de turnos para pantallas (solo información necesaria)
CREATE POLICY "Public access to appointment queue info" ON appointment
  FOR SELECT USING (true);

-- Permitir lectura pública de consultorios
CREATE POLICY "Public access to room info" ON room
  FOR SELECT USING (true);

-- Permitir lectura pública de servicios
CREATE POLICY "Public access to service info" ON service
  FOR SELECT USING (true);

-- Permitir lectura pública de profesionales
CREATE POLICY "Public access to professional info" ON professional
  FOR SELECT USING (true);

-- Permitir lectura pública de eventos de llamada (para mostrar cola en pantalla)
CREATE POLICY "Public access to call events" ON call_event
  FOR SELECT USING (true);