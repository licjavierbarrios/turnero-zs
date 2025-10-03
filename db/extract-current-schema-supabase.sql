-- ===============================================
-- EXTRACTOR DE SCHEMA ACTUAL - TURNERO ZS
-- Compatible con Supabase SQL Editor
-- ===============================================
-- Este script extrae la estructura actual de Supabase
-- para crear un respaldo fiel del estado real
-- ===============================================

-- 1. EXTENSIONES INSTALADAS
SELECT '-- EXTENSIONES INSTALADAS:' as info;
SELECT 'CREATE EXTENSION IF NOT EXISTS "' || extname || '";' as sql_command
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_stat_statements', 'pg_trgm', 'plpgsql')
ORDER BY extname;

-- 2. TIPOS ENUM ACTUALES
SELECT '-- TIPOS ENUM ACTUALES:' as info;
SELECT
  'CREATE TYPE ' || typname || ' AS ENUM (' ||
  string_agg('''' || enumlabel || '''', ', ' ORDER BY enumsortorder) ||
  ');' as sql_command
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY typname
ORDER BY typname;

-- 3. LISTA DE TABLAS ACTUALES
SELECT '-- TABLAS EXISTENTES:' as info;
SELECT table_name as tabla_existente
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name != 'schema_migrations'
ORDER BY table_name;

-- 4. ESTRUCTURA DETALLADA POR TABLA
SELECT '-- ESTRUCTURA DETALLADA DE TABLAS:' as info;
SELECT
  table_name as tabla,
  column_name as columna,
  CASE
    WHEN data_type = 'USER-DEFINED' THEN udt_name
    WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
    WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
    WHEN data_type = 'numeric' THEN 'NUMERIC(' || numeric_precision || ',' || numeric_scale || ')'
    ELSE upper(data_type)
  END as tipo_dato,
  CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END as nullable,
  column_default as valor_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%' AND table_name != 'schema_migrations'
  )
ORDER BY table_name, ordinal_position;

-- 5. CONSTRAINTS ACTUALES
SELECT '-- CONSTRAINTS PRIMARIOS Y ÚNICOS:' as info;
SELECT
  tc.table_name as tabla,
  tc.constraint_name as constraint_nombre,
  tc.constraint_type as tipo,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columnas
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name, tc.constraint_type;

-- 6. FOREIGN KEYS
SELECT '-- FOREIGN KEYS:' as info;
SELECT
  tc.table_name as tabla_origen,
  kcu.column_name as columna_origen,
  ccu.table_name as tabla_destino,
  ccu.column_name as columna_destino,
  tc.constraint_name as constraint_nombre
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- 7. FUNCIONES ACTUALES
SELECT '-- FUNCIONES DEFINIDAS:' as info;
SELECT
  routine_name as nombre_funcion,
  routine_type as tipo,
  data_type as retorna
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 8. TRIGGERS ACTUALES
SELECT '-- TRIGGERS DEFINIDOS:' as info;
SELECT
  trigger_name as nombre_trigger,
  event_object_table as tabla,
  action_timing as cuando,
  event_manipulation as evento,
  action_statement as accion
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 9. POLÍTICAS RLS
SELECT '-- TABLAS CON RLS HABILITADO:' as info;
SELECT
  tablename as tabla,
  CASE WHEN rowsecurity THEN 'RLS HABILITADO' ELSE 'RLS DESHABILITADO' END as estado_rls
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 10. POLÍTICAS RLS ESPECÍFICAS
SELECT '-- POLÍTICAS RLS ESPECÍFICAS:' as info;
SELECT
  tablename as tabla,
  policyname as nombre_policy,
  cmd as comando,
  roles as roles_aplicables,
  qual as condicion_using,
  with_check as condicion_with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 11. ÍNDICES EXISTENTES
SELECT '-- ÍNDICES PERSONALIZADOS:' as info;
SELECT
  indexname as nombre_indice,
  tablename as tabla,
  indexdef as definicion
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'
  AND indexname NOT LIKE '%_key'
ORDER BY tablename, indexname;

-- 12. RESUMEN FINAL
SELECT '-- RESUMEN DEL SCHEMA ACTUAL:' as info;
SELECT
  'TOTAL TABLAS: ' || count(*) as estadistica
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name != 'schema_migrations';

SELECT
  'TOTAL TIPOS ENUM: ' || count(DISTINCT typname) as estadistica
FROM pg_type
WHERE typtype = 'e'
  AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT
  'TOTAL POLÍTICAS RLS: ' || count(*) as estadistica
FROM pg_policies
WHERE schemaname = 'public';

SELECT
  'TOTAL FUNCIONES: ' || count(*) as estadistica
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';

SELECT
  'TOTAL TRIGGERS: ' || count(*) as estadistica
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- FIN DEL ANÁLISIS
SELECT '-- ANÁLISIS COMPLETADO - COPIA TODOS LOS RESULTADOS' as info;