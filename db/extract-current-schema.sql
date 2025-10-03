-- ===============================================
-- EXTRACTOR DE SCHEMA ACTUAL - TURNERO ZS
-- ===============================================
-- Este script extrae la estructura actual de Supabase
-- para crear un respaldo fiel del estado real
-- ===============================================

\echo '==============================================='
\echo 'EXTRAYENDO SCHEMA ACTUAL DE SUPABASE'
\echo '==============================================='

-- 1. EXTENSIONES INSTALADAS
\echo ''
\echo '1. EXTENSIONES INSTALADAS:'
SELECT 'CREATE EXTENSION IF NOT EXISTS "' || extname || '";' as sql_command
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_stat_statements', 'pg_trgm', 'plpgsql')
ORDER BY extname;

-- 2. TIPOS ENUM ACTUALES
\echo ''
\echo '2. TIPOS ENUM ACTUALES:'
SELECT
  'CREATE TYPE ' || typname || ' AS ENUM (' ||
  string_agg('''' || enumlabel || '''', ', ' ORDER BY enumsortorder) ||
  ');' as sql_command
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY typname
ORDER BY typname;

-- 3. TABLAS ACTUALES (estructura completa)
\echo ''
\echo '3. TABLAS ACTUALES:'

-- Obtener CREATE TABLE statements
SELECT
  'CREATE TABLE ' || table_name || ' (' as table_start
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name != 'schema_migrations'
ORDER BY table_name;

-- Columnas de cada tabla
\echo ''
\echo '3.1 COLUMNAS POR TABLA:'
SELECT
  table_name,
  '  ' || column_name || ' ' ||
  CASE
    WHEN data_type = 'USER-DEFINED' THEN udt_name
    WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
    WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
    WHEN data_type = 'numeric' THEN 'NUMERIC(' || numeric_precision || ',' || numeric_scale || ')'
    ELSE upper(data_type)
  END ||
  CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
  CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END ||
  ',' as column_definition
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%' AND table_name != 'schema_migrations'
  )
ORDER BY table_name, ordinal_position;

-- 4. CONSTRAINTS Y FOREIGN KEYS
\echo ''
\echo '4. CONSTRAINTS ACTUALES:'
SELECT
  'ALTER TABLE ' || tc.table_name ||
  ' ADD CONSTRAINT ' || tc.constraint_name || ' ' ||
  CASE tc.constraint_type
    WHEN 'PRIMARY KEY' THEN 'PRIMARY KEY (' || string_agg(kcu.column_name, ', ') || ')'
    WHEN 'FOREIGN KEY' THEN 'FOREIGN KEY (' || string_agg(kcu.column_name, ', ') ||
                           ') REFERENCES ' || ccu.table_name || '(' || string_agg(ccu.column_name, ', ') || ')'
    WHEN 'UNIQUE' THEN 'UNIQUE (' || string_agg(kcu.column_name, ', ') || ')'
    ELSE tc.constraint_type
  END || ';' as sql_command
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type, ccu.table_name
ORDER BY tc.table_name, tc.constraint_type;

-- 5. ÍNDICES ACTUALES
\echo ''
\echo '5. ÍNDICES ACTUALES:'
SELECT
  'CREATE INDEX ' || indexname || ' ON ' || tablename ||
  ' USING ' || indexdef || ';' as sql_command
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;

-- 6. FUNCIONES ACTUALES
\echo ''
\echo '6. FUNCIONES ACTUALES:'
SELECT
  'CREATE OR REPLACE FUNCTION ' || routine_name || '() RETURNS trigger AS $$ BEGIN ' ||
  'NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;' as sql_command
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 7. TRIGGERS ACTUALES
\echo ''
\echo '7. TRIGGERS ACTUALES:'
SELECT
  'CREATE TRIGGER ' || trigger_name ||
  ' BEFORE UPDATE ON ' || event_object_table ||
  ' FOR EACH ROW EXECUTE FUNCTION ' || action_statement || ';' as sql_command
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 8. POLÍTICAS RLS ACTUALES
\echo ''
\echo '8. POLÍTICAS RLS ACTUALES:'

-- Verificar qué tablas tienen RLS habilitado
\echo '8.1 TABLAS CON RLS HABILITADO:'
SELECT
  'ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;' as sql_command
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- Políticas específicas
\echo '8.2 POLÍTICAS ESPECÍFICAS:'
SELECT
  'CREATE POLICY "' || policyname || '" ON ' || tablename ||
  ' FOR ' || cmd ||
  CASE WHEN roles IS NOT NULL THEN ' TO ' || array_to_string(roles, ', ') ELSE '' END ||
  CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
  CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END ||
  ';' as sql_command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 9. DATOS DE AUDIT/RESUMEN
\echo ''
\echo '9. RESUMEN DEL SCHEMA ACTUAL:'
SELECT 'TABLAS TOTALES: ' || count(*) as info
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
AND table_name NOT LIKE 'pg_%' AND table_name != 'schema_migrations';

SELECT 'TIPOS ENUM: ' || count(DISTINCT typname) as info
FROM pg_type
WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 'POLÍTICAS RLS: ' || count(*) as info
FROM pg_policies
WHERE schemaname = 'public';

\echo ''
\echo '==============================================='
\echo 'EXTRACCIÓN COMPLETADA'
\echo '==============================================='
\echo 'Copia todo el output a un archivo schema-current.sql'
\echo 'para tener un respaldo fiel del estado actual'
\echo '==============================================='