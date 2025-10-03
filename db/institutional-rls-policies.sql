-- =====================================================
-- POLÍTICAS RLS PARA CONTEXTO INSTITUCIONAL
-- Turnero ZS - Filtrado automático por institución
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN AUXILIAR PARA OBTENER INSTITUCIÓN ACTUAL
-- =====================================================
-- Esta función se usará en las políticas RLS para obtener
-- la institución actual del contexto del usuario

CREATE OR REPLACE FUNCTION get_current_user_institution_ids()
RETURNS UUID[]
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  institution_ids UUID[];
BEGIN
  -- Obtener todas las instituciones donde el usuario tiene membresía activa
  SELECT ARRAY_AGG(institution_id)
  INTO institution_ids
  FROM membership
  WHERE user_id = auth.uid()
    AND is_active = true;

  RETURN COALESCE(institution_ids, '{}');
END;
$$;

-- =====================================================
-- 2. POLÍTICAS PARA TABLA INSTITUTION
-- =====================================================
ALTER TABLE public.institution ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver instituciones donde tienen membresía
CREATE POLICY "Users can view their institutions" ON public.institution
  FOR SELECT USING (
    id = ANY(get_current_user_institution_ids())
  );

-- Admins pueden ver todas las instituciones
CREATE POLICY "Admins can view all institutions" ON public.institution
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
        AND m.role = 'admin'
        AND m.is_active = true
    )
  );

-- Solo admins pueden modificar instituciones
CREATE POLICY "Admins can modify institutions" ON public.institution
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
        AND m.role = 'admin'
        AND m.is_active = true
    )
  );

-- =====================================================
-- 3. POLÍTICAS PARA TABLA ROOM
-- =====================================================
ALTER TABLE public.room ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rooms in their institutions" ON public.room
  FOR SELECT USING (
    institution_id = ANY(get_current_user_institution_ids())
  );

CREATE POLICY "Users can modify rooms in their institutions" ON public.room
  FOR ALL USING (
    institution_id = ANY(get_current_user_institution_ids())
    AND EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
        AND m.institution_id = room.institution_id
        AND m.role IN ('admin', 'administrativo')
        AND m.is_active = true
    )
  );

-- =====================================================
-- 4. POLÍTICAS PARA TABLA SERVICE
-- =====================================================
ALTER TABLE public.service ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view services in their institutions" ON public.service
  FOR SELECT USING (
    institution_id = ANY(get_current_user_institution_ids())
  );

CREATE POLICY "Users can modify services in their institutions" ON public.service
  FOR ALL USING (
    institution_id = ANY(get_current_user_institution_ids())
    AND EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
        AND m.institution_id = service.institution_id
        AND m.role IN ('admin', 'administrativo')
        AND m.is_active = true
    )
  );

-- =====================================================
-- 5. POLÍTICAS PARA TABLA PROFESSIONAL
-- =====================================================
ALTER TABLE public.professional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view professionals in their institutions" ON public.professional
  FOR SELECT USING (
    institution_id = ANY(get_current_user_institution_ids())
  );

CREATE POLICY "Users can modify professionals in their institutions" ON public.professional
  FOR ALL USING (
    institution_id = ANY(get_current_user_institution_ids())
    AND EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
        AND m.institution_id = professional.institution_id
        AND m.role IN ('admin', 'administrativo')
        AND m.is_active = true
    )
  );

-- =====================================================
-- 6. POLÍTICAS PARA TABLA SLOT_TEMPLATE
-- =====================================================
ALTER TABLE public.slot_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view slot templates in their institutions" ON public.slot_template
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional p
      WHERE p.id = slot_template.professional_id
        AND p.institution_id = ANY(get_current_user_institution_ids())
    )
  );

CREATE POLICY "Users can modify slot templates in their institutions" ON public.slot_template
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM professional p
      JOIN membership m ON m.institution_id = p.institution_id
      WHERE p.id = slot_template.professional_id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin', 'administrativo', 'medico')
        AND m.is_active = true
    )
  );

-- =====================================================
-- 7. POLÍTICAS PARA TABLA PATIENT
-- =====================================================
-- Asumiendo que existe una tabla patient
-- ALTER TABLE public.patient ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view patients in their institutions" ON public.patient
--   FOR SELECT USING (
--     institution_id = ANY(get_current_user_institution_ids())
--   );

-- CREATE POLICY "Users can modify patients in their institutions" ON public.patient
--   FOR ALL USING (
--     institution_id = ANY(get_current_user_institution_ids())
--     AND EXISTS (
--       SELECT 1 FROM membership m
--       WHERE m.user_id = auth.uid()
--         AND m.institution_id = patient.institution_id
--         AND m.role IN ('admin', 'administrativo', 'medico', 'enfermeria')
--         AND m.is_active = true
--     )
--   );

-- =====================================================
-- 8. POLÍTICAS PARA TABLA APPOINTMENT
-- =====================================================
ALTER TABLE public.appointment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointments in their institutions" ON public.appointment
  FOR SELECT USING (
    institution_id = ANY(get_current_user_institution_ids())
  );

CREATE POLICY "Users can modify appointments in their institutions" ON public.appointment
  FOR ALL USING (
    institution_id = ANY(get_current_user_institution_ids())
    AND EXISTS (
      SELECT 1 FROM membership m
      WHERE m.user_id = auth.uid()
        AND m.institution_id = appointment.institution_id
        AND m.role IN ('admin', 'administrativo', 'medico', 'enfermeria')
        AND m.is_active = true
    )
  );

-- =====================================================
-- 9. POLÍTICAS PARA TABLAS DE EVENTOS
-- =====================================================
ALTER TABLE public.call_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_event ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view call events in their institutions" ON public.call_event
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointment a
      WHERE a.id = call_event.appointment_id
        AND a.institution_id = ANY(get_current_user_institution_ids())
    )
  );

CREATE POLICY "Users can create call events in their institutions" ON public.call_event
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointment a
      JOIN membership m ON m.institution_id = a.institution_id
      WHERE a.id = call_event.appointment_id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin', 'administrativo', 'medico', 'enfermeria')
        AND m.is_active = true
    )
  );

CREATE POLICY "Users can view attendance events in their institutions" ON public.attendance_event
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointment a
      WHERE a.id = attendance_event.appointment_id
        AND a.institution_id = ANY(get_current_user_institution_ids())
    )
  );

CREATE POLICY "Users can create attendance events in their institutions" ON public.attendance_event
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointment a
      JOIN membership m ON m.institution_id = a.institution_id
      WHERE a.id = attendance_event.appointment_id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin', 'administrativo', 'medico', 'enfermeria')
        AND m.is_active = true
    )
  );

-- =====================================================
-- 10. FUNCIÓN PARA VALIDAR CONTEXTO INSTITUCIONAL
-- =====================================================
-- Esta función se puede usar en el frontend para validar
-- que las operaciones se hagan en el contexto correcto

CREATE OR REPLACE FUNCTION validate_institution_context(
  target_institution_id UUID,
  required_roles role_name[] DEFAULT ARRAY['admin', 'administrativo', 'medico', 'enfermeria']::role_name[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM membership m
    WHERE m.user_id = auth.uid()
      AND m.institution_id = target_institution_id
      AND m.role = ANY(required_roles)
      AND m.is_active = true
  );
END;
$$;

-- =====================================================
-- 11. FUNCIÓN PARA OBTENER ESTADÍSTICAS INSTITUCIONALES
-- =====================================================
CREATE OR REPLACE FUNCTION get_institution_stats(inst_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  stats JSON;
BEGIN
  -- Verificar acceso a la institución
  IF NOT user_has_access_to_institution(auth.uid(), inst_id) THEN
    RAISE EXCEPTION 'No tienes acceso a esta institución';
  END IF;

  SELECT json_build_object(
    'total_professionals', (SELECT COUNT(*) FROM professional WHERE institution_id = inst_id AND is_active = true),
    'total_rooms', (SELECT COUNT(*) FROM room WHERE institution_id = inst_id AND is_active = true),
    'total_services', (SELECT COUNT(*) FROM service WHERE institution_id = inst_id AND is_active = true),
    'appointments_today', (SELECT COUNT(*) FROM appointment WHERE institution_id = inst_id AND DATE(scheduled_at) = CURRENT_DATE),
    'pending_appointments', (SELECT COUNT(*) FROM appointment WHERE institution_id = inst_id AND status = 'pendiente'),
    'active_users', (SELECT COUNT(*) FROM membership WHERE institution_id = inst_id AND is_active = true)
  ) INTO stats;

  RETURN stats;
END;
$$;

-- =====================================================
-- 12. ÍNDICES ADICIONALES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_appointment_institution_status ON appointment(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_appointment_institution_date ON appointment(institution_id, DATE(scheduled_at));
CREATE INDEX IF NOT EXISTS idx_professional_institution_active ON professional(institution_id, is_active);
CREATE INDEX IF NOT EXISTS idx_room_institution_active ON room(institution_id, is_active);
CREATE INDEX IF NOT EXISTS idx_service_institution_active ON service(institution_id, is_active);

-- =====================================================
-- 13. COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================
COMMENT ON FUNCTION get_current_user_institution_ids IS 'Obtiene array de IDs de instituciones donde el usuario actual tiene membresía activa';
COMMENT ON FUNCTION validate_institution_context IS 'Valida que el usuario actual tenga acceso a una institución con los roles especificados';
COMMENT ON FUNCTION get_institution_stats IS 'Obtiene estadísticas de una institución (requiere acceso)';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================