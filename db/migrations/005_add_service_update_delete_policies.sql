-- Migración: Agregar políticas faltantes de UPDATE y DELETE para la tabla service
-- Fecha: 2025-10-13
-- Descripción: Los admins y administrativos necesitan poder actualizar y eliminar servicios

-- Política de actualización para servicios
CREATE POLICY "Admins and administrative staff can update services" ON service
  FOR UPDATE USING (
    is_admin() OR
    has_role_in_institution(institution_id, 'administrativo')
  )
  WITH CHECK (
    is_admin() OR
    has_role_in_institution(institution_id, 'administrativo')
  );

-- Política de eliminación para servicios
CREATE POLICY "Admins and administrative staff can delete services" ON service
  FOR DELETE USING (
    is_admin() OR
    has_role_in_institution(institution_id, 'administrativo')
  );
