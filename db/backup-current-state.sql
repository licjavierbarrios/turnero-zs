-- ===============================================
-- BACKUP COMPLETO DEL ESTADO ACTUAL - TURNERO ZS
-- ===============================================
-- Este script debe ejecutarse en el SQL Editor de Supabase
-- para obtener un backup completo del estado actual
-- ===============================================

-- PASO 1: Guardar información de estructura
\echo 'GENERANDO BACKUP DEL ESTADO ACTUAL...'

-- Crear tabla temporal para metadata
CREATE TEMP TABLE backup_info AS
SELECT
  'schema_backup_' || to_char(now(), 'YYYY_MM_DD_HH24_MI_SS') as backup_name,
  now() as backup_timestamp,
  current_database() as database_name;

-- PASO 2: Script de estructura de tablas
\echo 'EXTRAYENDO ESTRUCTURA DE TABLAS...'

WITH table_definitions AS (
  SELECT
    t.table_name,
    string_agg(
      '  ' || c.column_name || ' ' ||
      CASE
        WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name
        WHEN c.data_type = 'character varying' THEN 'VARCHAR(' || c.character_maximum_length || ')'
        WHEN c.data_type = 'character' THEN 'CHAR(' || c.character_maximum_length || ')'
        WHEN c.data_type = 'numeric' THEN 'NUMERIC(' || c.numeric_precision || ',' || c.numeric_scale || ')'
        ELSE UPPER(c.data_type)
      END ||
      CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
      CASE
        WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default
        ELSE ''
      END,
      E',\n'
      ORDER BY c.ordinal_position
    ) as columns_def
  FROM information_schema.tables t
  JOIN information_schema.columns c ON t.table_name = c.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name != 'schema_migrations'
    AND c.table_schema = 'public'
  GROUP BY t.table_name
)
SELECT
  '-- TABLA: ' || table_name as sql_output
FROM table_definitions
UNION ALL
SELECT
  'CREATE TABLE ' || table_name || ' (' || E'\n' || columns_def || E'\n);' || E'\n'
FROM table_definitions
ORDER BY sql_output;

-- PASO 3: Constraints y relaciones
\echo 'EXTRAYENDO CONSTRAINTS...'

SELECT
  '-- CONSTRAINT: ' || tc.constraint_name || ' en ' || tc.table_name as sql_output
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
UNION ALL
SELECT
  'ALTER TABLE ' || tc.table_name ||
  ' ADD CONSTRAINT ' || tc.constraint_name || ' ' ||
  CASE tc.constraint_type
    WHEN 'PRIMARY KEY' THEN 'PRIMARY KEY (' ||
      (SELECT string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position)
       FROM information_schema.key_column_usage kcu
       WHERE kcu.constraint_name = tc.constraint_name) || ')'
    WHEN 'FOREIGN KEY' THEN 'FOREIGN KEY (' ||
      (SELECT string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position)
       FROM information_schema.key_column_usage kcu
       WHERE kcu.constraint_name = tc.constraint_name) ||
      ') REFERENCES ' ||
      (SELECT ccu.table_name FROM information_schema.constraint_column_usage ccu
       WHERE ccu.constraint_name = tc.constraint_name LIMIT 1) ||
      '(' ||
      (SELECT string_agg(ccu.column_name, ', ')
       FROM information_schema.constraint_column_usage ccu
       WHERE ccu.constraint_name = tc.constraint_name) || ')'
    WHEN 'UNIQUE' THEN 'UNIQUE (' ||
      (SELECT string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position)
       FROM information_schema.key_column_usage kcu
       WHERE kcu.constraint_name = tc.constraint_name) || ')'
  END || ';' || E'\n'
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
ORDER BY sql_output;

-- PASO 4: Tipos ENUM
\echo 'EXTRAYENDO TIPOS ENUM...'

SELECT
  '-- ENUM: ' || typname as sql_output
FROM pg_type
WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
UNION ALL
SELECT
  'CREATE TYPE ' || typname || ' AS ENUM (' ||
  string_agg('''' || enumlabel || '''', ', ' ORDER BY enumsortorder) ||
  ');' || E'\n'
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY typname
ORDER BY sql_output;

-- PASO 5: Funciones y Triggers
\echo 'EXTRAYENDO FUNCIONES Y TRIGGERS...'

SELECT
  '-- FUNCIÓN: ' || routine_name as sql_output
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
UNION ALL
SELECT
  'CREATE OR REPLACE FUNCTION ' || routine_name || '()' || E'\n' ||
  'RETURNS TRIGGER AS $$' || E'\n' ||
  'BEGIN' || E'\n' ||
  '    NEW.updated_at = NOW();' || E'\n' ||
  '    RETURN NEW;' || E'\n' ||
  'END;' || E'\n' ||
  '$$ language ''plpgsql'';' || E'\n'
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
UNION ALL
SELECT
  'CREATE TRIGGER ' || trigger_name ||
  ' BEFORE UPDATE ON ' || event_object_table ||
  ' FOR EACH ROW EXECUTE FUNCTION ' ||
  replace(action_statement, 'EXECUTE FUNCTION ', '') || ';' || E'\n'
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY sql_output;

-- PASO 6: Políticas RLS
\echo 'EXTRAYENDO POLÍTICAS RLS...'

SELECT
  '-- RLS HABILITADO EN: ' || tablename as sql_output
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT
  'ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;' || E'\n'
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT
  'CREATE POLICY "' || policyname || '" ON ' || tablename ||
  ' FOR ' || cmd ||
  CASE WHEN roles IS NOT NULL THEN ' TO ' || array_to_string(roles, ', ') ELSE '' END ||
  CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
  CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END ||
  ';' || E'\n'
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY sql_output;

-- PASO 7: Resumen final
\echo 'RESUMEN DEL BACKUP:'
SELECT
  'Backup generado: ' || backup_name as info
FROM backup_info
UNION ALL
SELECT
  'Timestamp: ' || backup_timestamp::text
FROM backup_info
UNION ALL
SELECT
  'Tablas encontradas: ' || count(*)::text
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
AND table_name NOT LIKE 'pg_%' AND table_name != 'schema_migrations'
UNION ALL
SELECT
  'Policies RLS: ' || count(*)::text
FROM pg_policies
WHERE schemaname = 'public';

\echo 'BACKUP COMPLETADO - Guarda todo el output en un archivo .sql'