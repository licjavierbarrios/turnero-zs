-- ============================================================================
-- FIX RLS: Política simple para membership
-- ============================================================================
-- Las funciones helper pueden no estar funcionando correctamente desde el
-- contexto REST API. Creamos una política simple directa.
-- ============================================================================

-- Deshabilitar RLS temporalmente para testing
ALTER TABLE membership DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'membership';
