-- ===============================================
-- GENERADOR DE SCRIPT DE RECREACIÓN - TURNERO ZS
-- Compatible con Supabase SQL Editor
-- ===============================================
-- Este script genera el código SQL necesario para recrear
-- exactamente la estructura actual de tu base de datos
-- ===============================================

-- PASO 1: EXTENSIONES NECESARIAS
SELECT 'CREATE EXTENSION IF NOT EXISTS "' || extname || '";' as sql_to_execute
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_stat_statements', 'pg_trgm', 'plpgsql')
ORDER BY extname;

-- PASO 2: TIPOS ENUM
SELECT
  'CREATE TYPE ' || typname || ' AS ENUM (' ||
  string_agg('''' || enumlabel || '''', ', ' ORDER BY enumsortorder) ||
  ');' as sql_to_execute
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY typname
ORDER BY typname;

-- PASO 3: CREAR TABLAS CON ESTRUCTURA COMPLETA
WITH table_columns AS (
  SELECT
    t.table_name,
    string_agg(
      '  ' || c.column_name || ' ' ||
      CASE
        WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name
        WHEN c.data_type = 'character varying' THEN
          CASE WHEN c.character_maximum_length IS NOT NULL
               THEN 'VARCHAR(' || c.character_maximum_length || ')'
               ELSE 'TEXT' END
        WHEN c.data_type = 'character' THEN 'CHAR(' || c.character_maximum_length || ')'
        WHEN c.data_type = 'numeric' THEN
          CASE WHEN c.numeric_precision IS NOT NULL
               THEN 'NUMERIC(' || c.numeric_precision || ',' || COALESCE(c.numeric_scale, 0) || ')'
               ELSE 'NUMERIC' END
        WHEN c.data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
        WHEN c.data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
        ELSE UPPER(c.data_type)
      END ||
      CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
      CASE
        WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default
        ELSE ''
      END,
      ',' || E'\n'
      ORDER BY c.ordinal_position
    ) as columns_definition
  FROM information_schema.tables t
  JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name != 'schema_migrations'
  GROUP BY t.table_name
)
SELECT
  'CREATE TABLE ' || table_name || ' (' || E'\n' ||
  columns_definition || E'\n' ||
  ');' as sql_to_execute
FROM table_columns
ORDER BY table_name;

-- PASO 4: CONSTRAINTS PRIMARIOS Y ÚNICOS
SELECT
  'ALTER TABLE ' || tc.table_name ||
  ' ADD CONSTRAINT ' || tc.constraint_name || ' ' ||
  CASE tc.constraint_type
    WHEN 'PRIMARY KEY' THEN 'PRIMARY KEY (' ||
      (SELECT string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position)
       FROM information_schema.key_column_usage kcu
       WHERE kcu.constraint_name = tc.constraint_name
       AND kcu.table_schema = 'public') || ')'
    WHEN 'UNIQUE' THEN 'UNIQUE (' ||
      (SELECT string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position)
       FROM information_schema.key_column_usage kcu
       WHERE kcu.constraint_name = tc.constraint_name
       AND kcu.table_schema = 'public') || ')'
  END || ';' as sql_to_execute
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type;

-- PASO 5: FOREIGN KEYS
SELECT
  'ALTER TABLE ' || tc.table_name ||
  ' ADD CONSTRAINT ' || tc.constraint_name || ' FOREIGN KEY (' ||
  (SELECT string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position)
   FROM information_schema.key_column_usage kcu
   WHERE kcu.constraint_name = tc.constraint_name
   AND kcu.table_schema = 'public') ||
  ') REFERENCES ' ||
  (SELECT ccu.table_name
   FROM information_schema.constraint_column_usage ccu
   WHERE ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema = 'public' LIMIT 1) ||
  '(' ||
  (SELECT string_agg(ccu.column_name, ', ')
   FROM information_schema.constraint_column_usage ccu
   WHERE ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema = 'public') ||
  ');' as sql_to_execute
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- PASO 6: FUNCIONES
SELECT
  'CREATE OR REPLACE FUNCTION ' || routine_name || '() RETURNS TRIGGER AS $$ ' ||
  'BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;' as sql_to_execute
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- PASO 7: TRIGGERS
SELECT
  'CREATE TRIGGER ' || trigger_name ||
  ' BEFORE UPDATE ON ' || event_object_table ||
  ' FOR EACH ROW EXECUTE FUNCTION ' ||
  CASE WHEN action_statement LIKE 'EXECUTE FUNCTION %'
       THEN TRIM(REPLACE(action_statement, 'EXECUTE FUNCTION ', ''))
       ELSE action_statement END || ';' as sql_to_execute
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- PASO 8: HABILITAR RLS
SELECT
  'ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;' as sql_to_execute
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- PASO 9: POLÍTICAS RLS
SELECT
  'CREATE POLICY "' || policyname || '" ON ' || tablename ||
  ' FOR ' || cmd ||
  CASE WHEN roles IS NOT NULL AND array_length(roles, 1) > 0
       THEN ' TO ' || array_to_string(roles, ', ')
       ELSE '' END ||
  CASE WHEN qual IS NOT NULL
       THEN ' USING (' || qual || ')'
       ELSE '' END ||
  CASE WHEN with_check IS NOT NULL
       THEN ' WITH CHECK (' || with_check || ')'
       ELSE '' END ||
  ';' as sql_to_execute
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- PASO 10: ÍNDICES PERSONALIZADOS
SELECT
  REPLACE(indexdef, ' USING btree', '') || ';' as sql_to_execute
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'
  AND indexname NOT LIKE '%_key'
  AND indexdef NOT LIKE '%UNIQUE%'
ORDER BY tablename, indexname;