-- Migración: Actualizar RLS Policies para nuevas tablas
-- Descripción: Agregar políticas de Row Level Security para las nuevas tablas
-- Fecha: 2025-11-05

-- ============================================================================
-- HABILITAR RLS EN NUEVAS TABLAS
-- ============================================================================

ALTER TABLE professional_room_preference ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_professional_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_staff ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS - PROFESSIONAL_ROOM_PREFERENCE
-- ============================================================================

-- Los usuarios pueden ver preferencias de profesionales de sus instituciones
CREATE POLICY "Users can view professional room preferences in their institutions" 
  ON professional_room_preference
  FOR SELECT USING (
    -- Super admin ve todas
    auth.uid() IN (
      SELECT user_id FROM membership 
      WHERE role = 'super_admin' AND is_active = true
    )
    OR
    -- Admin de institución ve sus profesionales
    institution_id IN (
      SELECT institution_id FROM membership
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
    OR
    -- Usuarios pueden ver sus propias preferencias (si son profesionales)
    professional_id IN (
      SELECT id FROM professional 
      WHERE user_id = auth.uid()
    )
  );

-- Admin puede crear/actualizar preferencias
CREATE POLICY "Admins can manage professional room preferences" 
  ON professional_room_preference
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM membership 
      WHERE role IN ('super_admin', 'admin') AND is_active = true
    )
  );

-- ============================================================================
-- POLÍTICAS RLS - DAILY_PROFESSIONAL_ASSIGNMENT
-- ============================================================================

-- Los usuarios pueden ver asignaciones de su institución
CREATE POLICY "Users can view daily professional assignments in their institutions" 
  ON daily_professional_assignment
  FOR SELECT USING (
    -- Super admin ve todas
    auth.uid() IN (
      SELECT user_id FROM membership 
      WHERE role = 'super_admin' AND is_active = true
    )
    OR
    -- Admin/administrativo de institución ve todas de su institución
    institution_id IN (
      SELECT institution_id FROM membership
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'administrativo')
      AND is_active = true
    )
    OR
    -- Profesionales ven sus propias asignaciones
    professional_id IN (
      SELECT id FROM professional 
      WHERE user_id = auth.uid()
    )
  );

-- Admin y administrativo pueden crear/actualizar asignaciones
CREATE POLICY "Admins and administrative staff can manage daily assignments" 
  ON daily_professional_assignment
  FOR ALL USING (
    -- Super admin
    auth.uid() IN (
      SELECT user_id FROM membership 
      WHERE role = 'super_admin' AND is_active = true
    )
    OR
    -- Admin/administrativo de la institución
    institution_id IN (
      SELECT institution_id FROM membership
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'administrativo')
      AND is_active = true
    )
  );

-- ============================================================================
-- POLÍTICAS RLS - SERVICE_STAFF
-- ============================================================================

-- Los usuarios pueden ver personal de servicio de sus instituciones
CREATE POLICY "Users can view service staff in their institutions" 
  ON service_staff
  FOR SELECT USING (
    -- Super admin ve todos
    auth.uid() IN (
      SELECT user_id FROM membership 
      WHERE role = 'super_admin' AND is_active = true
    )
    OR
    -- Admin ve su institución
    institution_id IN (
      SELECT institution_id FROM membership
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
    OR
    -- Usuarios ven sus propios datos
    user_id = auth.uid()
  );

-- Solo super admin y admin pueden crear/actualizar personal de servicio
CREATE POLICY "Admins can manage service staff" 
  ON service_staff
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM membership 
      WHERE role IN ('super_admin', 'admin') AND is_active = true
    )
  );

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Users can view professional room preferences in their institutions" 
  ON professional_room_preference IS 
  'Super admin ve todas; admin ve sus instituciones; usuarios ven sus propias preferencias';

COMMENT ON POLICY "Admins can manage professional room preferences" 
  ON professional_room_preference IS 
  'Solo super admin y admin pueden crear/actualizar preferencias';

COMMENT ON POLICY "Users can view daily professional assignments in their institutions" 
  ON daily_professional_assignment IS 
  'Super admin ve todas; admin/administrativo ve su institución; profesionales ven sus asignaciones';

COMMENT ON POLICY "Admins and administrative staff can manage daily assignments" 
  ON daily_professional_assignment IS 
  'Super admin y admin/administrativo de institución pueden crear/actualizar asignaciones diarias';

COMMENT ON POLICY "Users can view service staff in their institutions" 
  ON service_staff IS 
  'Super admin ve todos; admin ve su institución; usuarios ven sus propios datos';

COMMENT ON POLICY "Admins can manage service staff" 
  ON service_staff IS 
  'Solo super admin y admin pueden crear/actualizar personal de servicio';
