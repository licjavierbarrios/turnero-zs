-- Migration: Add UPDATE and DELETE policies for room table
-- Description: Allows admins and administrative staff to update and delete rooms
-- Date: 2025-10-20

-- Política para permitir UPDATE en room
-- Solo admin y administrativo pueden actualizar consultorios
CREATE POLICY "Admins and administrative staff can update rooms"
ON room
FOR UPDATE
TO public
USING (
  is_admin() OR
  has_role_in_institution(institution_id, 'administrativo'::role_name)
)
WITH CHECK (
  is_admin() OR
  has_role_in_institution(institution_id, 'administrativo'::role_name)
);

-- Política para permitir DELETE en room
-- Solo admin y administrativo pueden eliminar consultorios
CREATE POLICY "Admins and administrative staff can delete rooms"
ON room
FOR DELETE
TO public
USING (
  is_admin() OR
  has_role_in_institution(institution_id, 'administrativo'::role_name)
);
