-- =====================================================
-- SCRIPT DE TESTING Y VERIFICACIÓN DE AUTENTICACIÓN
-- Turnero ZS - Validación del sistema de autenticación
-- =====================================================

-- =====================================================
-- 1. VERIFICACIONES BÁSICAS DE ESTRUCTURA
-- =====================================================

-- Verificar que las tablas existen
SELECT
  table_name,
  CASE WHEN table_name IN (
    'user_profile', 'membership', 'institution', 'zone',
    'professional', 'room', 'service', 'appointment'
  ) THEN '✅ Existe' ELSE '❌ Falta' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_profile', 'membership', 'institution', 'zone',
    'professional', 'room', 'service', 'appointment'
  )
ORDER BY table_name;

-- Verificar que los ENUMs existen
SELECT
  typname as enum_name,
  CASE WHEN typname IN ('role_name', 'institution_type', 'appointment_status')
    THEN '✅ Existe' ELSE '❌ Falta' END as status
FROM pg_type
WHERE typtype = 'e'
  AND typname IN ('role_name', 'institution_type', 'appointment_status');

-- Verificar que las funciones existen
SELECT
  routine_name as function_name,
  '✅ Existe' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_institutions',
    'user_has_access_to_institution',
    'get_user_role_in_institution',
    'get_current_user_institution_ids',
    'validate_institution_context',
    'get_institution_stats'
  )
ORDER BY routine_name;

-- =====================================================
-- 2. VERIFICAR POLÍTICAS RLS
-- =====================================================

-- Ver qué tablas tienen RLS habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ RLS Habilitado' ELSE '❌ RLS Deshabilitado' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profile', 'membership', 'institution',
    'professional', 'room', 'service', 'appointment',
    'call_event', 'attendance_event'
  )
ORDER BY tablename;

-- Ver políticas RLS creadas
SELECT
  tablename,
  policyname,
  cmd as command_type,
  CASE
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    WHEN cmd = '*' THEN 'ALL'
    ELSE cmd
  END as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 3. DATOS DE TESTING
-- =====================================================

-- Contar usuarios en auth.users
SELECT
  'auth.users' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN email LIKE '%salud.gov.ar' THEN 1 END) as usuarios_demo
FROM auth.users;

-- Contar perfiles de usuario
SELECT
  'user_profile' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN is_active THEN 1 END) as activos
FROM user_profile;

-- Contar membresías
SELECT
  'membership' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN is_active THEN 1 END) as activas
FROM membership;

-- Ver distribución de roles
SELECT
  role,
  COUNT(*) as cantidad_usuarios,
  COUNT(CASE WHEN is_active THEN 1 END) as activos
FROM membership
GROUP BY role
ORDER BY role;

-- =====================================================
-- 4. TESTING DE FUNCIONES (ejecutar como usuario específico)
-- =====================================================

-- NOTA: Estas consultas deben ejecutarse después de configurar
-- auth.uid() o usando SECURITY DEFINER functions

-- Test 1: Verificar función get_user_institutions
-- SELECT '=== TEST: get_user_institutions ===';
-- SELECT * FROM get_user_institutions();

-- Test 2: Verificar acceso a institución específica
-- SELECT '=== TEST: user_has_access_to_institution ===';
-- SELECT user_has_access_to_institution(auth.uid(), 'UUID_INSTITUCION_AQUI');

-- Test 3: Verificar rol en institución
-- SELECT '=== TEST: get_user_role_in_institution ===';
-- SELECT get_user_role_in_institution(auth.uid(), 'UUID_INSTITUCION_AQUI');

-- =====================================================
-- 5. CONSULTAS DE VALIDACIÓN COMPLETA
-- =====================================================

-- Ver todos los usuarios con sus instituciones y roles
SELECT
  au.email,
  up.first_name || ' ' || up.last_name as nombre_completo,
  i.name as institucion,
  i.type as tipo_institucion,
  z.name as zona,
  m.role as rol,
  m.is_active as activo
FROM auth.users au
JOIN user_profile up ON au.id = up.id
JOIN membership m ON up.id = m.user_id
JOIN institution i ON m.institution_id = i.id
JOIN zone z ON i.zone_id = z.id
WHERE m.is_active = true
ORDER BY au.email, i.name;

-- Ver instituciones y cuántos usuarios tienen acceso
SELECT
  i.name as institucion,
  i.type as tipo,
  z.name as zona,
  COUNT(m.user_id) as usuarios_con_acceso,
  STRING_AGG(
    up.first_name || ' ' || up.last_name || ' (' || m.role || ')',
    ', '
  ) as usuarios
FROM institution i
JOIN zone z ON i.zone_id = z.id
LEFT JOIN membership m ON i.id = m.institution_id AND m.is_active = true
LEFT JOIN user_profile up ON m.user_id = up.id
GROUP BY i.id, i.name, i.type, z.name
ORDER BY i.name;

-- =====================================================
-- 6. TESTING DE AUTENTICACIÓN SIMULADO
-- =====================================================

-- Simular login de diferentes usuarios (solo para testing)
-- En producción, auth.uid() será manejado automáticamente por Supabase

-- Función helper para testing (SOLO PARA DESARROLLO)
CREATE OR REPLACE FUNCTION test_user_context(test_user_email TEXT)
RETURNS TABLE (
  user_email TEXT,
  institution_name TEXT,
  user_role role_name,
  can_access BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Obtener ID del usuario de testing
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = test_user_email;

  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', test_user_email;
  END IF;

  -- Retornar información del contexto
  RETURN QUERY
  SELECT
    test_user_email,
    i.name as institution_name,
    m.role as user_role,
    true as can_access
  FROM membership m
  JOIN institution i ON m.institution_id = i.id
  WHERE m.user_id = test_user_id
    AND m.is_active = true
  ORDER BY i.name;
END;
$$;

-- Tests por usuario
-- SELECT '=== TESTING USUARIO: juan.paredes@salud.gov.ar ===';
-- SELECT * FROM test_user_context('juan.paredes@salud.gov.ar');

-- SELECT '=== TESTING USUARIO: maria.lopez@salud.gov.ar ===';
-- SELECT * FROM test_user_context('maria.lopez@salud.gov.ar');

-- SELECT '=== TESTING USUARIO: admin@salud.gov.ar ===';
-- SELECT * FROM test_user_context('admin@salud.gov.ar');

-- =====================================================
-- 7. VALIDACIÓN DE INTEGRIDAD
-- =====================================================

-- Verificar que no hay membresías huérfanas
SELECT
  'Membresías huérfanas (usuario no existe)' as verificacion,
  COUNT(*) as problemas_encontrados
FROM membership m
LEFT JOIN auth.users au ON m.user_id = au.id
WHERE au.id IS NULL;

-- Verificar que no hay membresías sin institución
SELECT
  'Membresías sin institución' as verificacion,
  COUNT(*) as problemas_encontrados
FROM membership m
LEFT JOIN institution i ON m.institution_id = i.id
WHERE i.id IS NULL;

-- Verificar que todos los usuarios tienen al menos un perfil
SELECT
  'Usuarios sin perfil' as verificacion,
  COUNT(*) as problemas_encontrados
FROM auth.users au
LEFT JOIN user_profile up ON au.id = up.id
WHERE up.id IS NULL
  AND au.email LIKE '%salud.gov.ar';

-- =====================================================
-- 8. PERFORMANCE TESTING
-- =====================================================

-- Verificar índices importantes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('membership', 'appointment', 'professional')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- 9. CHECKLIST FINAL
-- =====================================================

SELECT '
=== CHECKLIST DE IMPLEMENTACIÓN ===

✅ Pasos completados en Supabase:
□ 1. Ejecutar authentication-setup.sql
□ 2. Crear usuarios en Auth Dashboard
□ 3. Ejecutar demo-users-setup.sql (con UUIDs reales)
□ 4. Ejecutar institutional-rls-policies.sql
□ 5. Ejecutar este script de testing

✅ Verificaciones a realizar:
□ 1. Verificar que RLS está habilitado en todas las tablas
□ 2. Confirmar que las funciones funcionan correctamente
□ 3. Testear login desde frontend
□ 4. Verificar filtrado por institución
□ 5. Probar cambio de institución

✅ Frontend ya implementado:
□ 1. Página de login (/)
□ 2. Selección de instituciones (/institutions/select)
□ 3. Dashboard con contexto institucional
□ 4. Botón "Cambiar de Institución" en sidebar

=== FIN DEL CHECKLIST ===
' as checklist;

-- =====================================================
-- FIN DEL SCRIPT DE TESTING
-- =====================================================