-- ===============================================
-- EXTRACTOR SIMPLE DE SCHEMA - TURNERO ZS
-- ===============================================
-- Ejecuta cada consulta por separado en Supabase
-- ===============================================

-- 1. EXTENSIONES
SELECT 'CREATE EXTENSION IF NOT EXISTS "' || extname || '";'
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- 2. TIPOS ENUM (ejecutar separadamente)
SELECT 'CREATE TYPE ' || typname || ' AS ENUM (' ||
       string_agg('''' || enumlabel || '''', ', ' ORDER BY enumsortorder) || ');'
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY typname;

-- 3. LISTAR TABLAS
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;

-- 4. ESTRUCTURA DE UNA TABLA ESPECÍFICA (cambiar 'users' por cada tabla)
SELECT
  '  ' || column_name || ' ' ||
  CASE
    WHEN data_type = 'USER-DEFINED' THEN udt_name
    WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
    WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
    ELSE UPPER(data_type)
  END ||
  CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
  CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. POLÍTICAS RLS
SELECT 'CREATE POLICY "' || policyname || '" ON ' || tablename ||
       ' FOR ' || cmd || ' USING (' || qual || ');'
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;