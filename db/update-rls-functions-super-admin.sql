-- Actualizar funciones RLS para soportar rol super_admin
-- Este script actualiza las funciones helper de RLS para reconocer super_admin
-- IMPORTANTE: Ejecutar en el SQL Editor de Supabase

-- Función para verificar si el usuario es super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.membership
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Actualizar función is_admin para incluir super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.membership
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Actualizar función user_institutions para incluir acceso super_admin
CREATE OR REPLACE FUNCTION public.user_institutions()
RETURNS SETOF UUID AS $$
  -- Si es super_admin, retornar todas las instituciones
  SELECT CASE
    WHEN public.is_super_admin() THEN (SELECT id FROM public.institution)
    ELSE (
      SELECT institution_id
      FROM public.membership
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  END;
$$ LANGUAGE sql SECURITY DEFINER;

-- Comentarios
COMMENT ON FUNCTION public.is_super_admin() IS 'Verifica si el usuario actual tiene rol super_admin';
COMMENT ON FUNCTION public.is_admin() IS 'Verifica si el usuario actual tiene rol super_admin o admin';
COMMENT ON FUNCTION public.user_institutions() IS 'Retorna las instituciones del usuario (todas si es super_admin)';
