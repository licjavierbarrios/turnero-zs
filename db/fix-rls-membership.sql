-- ============================================================================
-- FIX: Permitir lectura de memberships propios
-- ============================================================================
-- Problema: Los usuarios no pueden leer sus propios memberships para
-- verificar roles en el login
-- ============================================================================

-- Habilitar RLS en membership (si no está habilitado)
ALTER TABLE membership ENABLE ROW LEVEL SECURITY;

-- Eliminar política anterior si existe
DROP POLICY IF EXISTS "Users can read own memberships" ON membership;

-- Crear política para que usuarios puedan leer sus propios memberships
CREATE POLICY "Users can read own memberships"
ON membership
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Verificar que se creó
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'membership'
AND policyname = 'Users can read own memberships';
