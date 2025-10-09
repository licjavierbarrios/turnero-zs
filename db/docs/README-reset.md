# Limpieza y Reconstrucción de Base de Datos

## ⚠️ ADVERTENCIA IMPORTANTE
**Estos scripts eliminarán TODOS los datos y estructura de la base de datos. Úsalos solo cuando quieras empezar completamente de cero.**

## 📋 Scripts Disponibles

### 1. `reset-database.sql`
**Propósito**: Limpia completamente la base de datos
- Elimina todas las tablas del proyecto
- Elimina todos los tipos enum
- Elimina todas las funciones y triggers
- Mantiene las extensiones (uuid-ossp, pgcrypto)

### 2. `rebuild-database.sql`
**Propósito**: Reconstruye la estructura completa
- Ejecuta `schema.sql`
- Ejecuta `policies.sql`
- Verifica que todo se haya creado correctamente

## 🚀 Instrucciones de Uso

### Opción A: Limpiar y Reconstruir (Recomendado)

1. **Conéctate a tu base de datos en Supabase**:
   ```bash
   # En el SQL Editor de Supabase Dashboard
   # O usando psql si tienes acceso directo
   ```

2. **Ejecuta la limpieza completa**:
   ```sql
   \i db/reset-database.sql
   ```

3. **Reconstruye la estructura**:
   ```sql
   \i db/rebuild-database.sql
   ```

### Opción B: Paso a Paso

1. **Solo limpiar**:
   ```sql
   \i db/reset-database.sql
   ```

2. **Recrear estructura manualmente**:
   ```sql
   \i db/schema.sql
   \i db/policies.sql
   ```

### Opción C: En Supabase Dashboard

1. Ve a **SQL Editor** en tu dashboard de Supabase
2. Copia y pega el contenido de `reset-database.sql`
3. Ejecuta el script
4. Copia y pega el contenido de `rebuild-database.sql`
5. Ejecuta el script

## ✅ Verificación

Después de la reconstrucción, deberías ver:

### Tablas creadas:
- appointment
- attendance_event
- call_event
- institution
- membership
- patient
- professional
- room
- service
- slot_template
- users
- zone

### Tipos enum creados:
- appointment_status
- institution_type
- role_name

### Políticas RLS:
- Una o más políticas por tabla para control de acceso

## 🔄 Estado después del reset

**✅ Lo que queda:**
- Estructura de tablas limpia
- Políticas RLS configuradas
- Extensiones PostgreSQL
- Triggers de updated_at

**❌ Lo que se elimina:**
- Todos los datos existentes
- Usuarios demo
- Instituciones de prueba
- Cualquier configuración previa

## 📝 Próximos pasos después del reset

1. **Crear usuario superadmin** en Supabase Auth
2. **Configurar perfil de superusuario** en la tabla `user_profiles`
3. **Acceder al panel de superadmin** para configuración inicial
4. **Crear zonas, instituciones y usuarios** desde cero

## 🆘 En caso de problemas

### Error: "relation does not exist"
- Es normal si la tabla ya estaba eliminada
- El script continúa sin problemas

### Error: "type does not exist"
- Es normal si el tipo enum ya estaba eliminado
- El script continúa sin problemas

### Verificar limpieza exitosa:
```sql
-- Debe retornar 0 filas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
AND table_name NOT LIKE 'pg_%' AND table_name != 'schema_migrations';
```

### Verificar reconstrucción exitosa:
```sql
-- Debe retornar 12 tablas
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
AND table_name NOT LIKE 'pg_%' AND table_name != 'schema_migrations';
```