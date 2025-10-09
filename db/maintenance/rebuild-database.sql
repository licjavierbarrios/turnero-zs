-- ===============================================
-- SCRIPT DE RECONSTRUCCIÓN COMPLETA - TURNERO ZS
-- ===============================================
-- Este script reconstruye toda la estructura de la BD
-- después de haber ejecutado reset-database.sql
-- ===============================================

-- 1. RECREAR ESTRUCTURA COMPLETA
\echo 'Recreando estructura de base de datos...'
\i schema.sql

-- 2. APLICAR POLÍTICAS RLS
\echo 'Aplicando políticas de seguridad...'
\i policies.sql

-- 3. VERIFICAR ESTRUCTURA CREADA
\echo 'Verificando estructura creada...'

-- Listar tablas creadas
SELECT 'TABLAS CREADAS:' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name != 'schema_migrations'
ORDER BY table_name;

-- Listar tipos enum creados
SELECT 'TIPOS ENUM CREADOS:' as info;
SELECT typname
FROM pg_type
WHERE typtype = 'e'
  AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY typname;

-- Listar políticas RLS activas
SELECT 'POLÍTICAS RLS ACTIVAS:' as info;
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo '==============================================='
\echo 'Base de datos reconstruida exitosamente!'
\echo '==============================================='
\echo ''
\echo 'Próximos pasos:'
\echo '1. Crear usuario superadmin en Supabase Auth'
\echo '2. Configurar perfil de superusuario'
\echo '3. Comenzar configuración inicial'
\echo '==============================================='