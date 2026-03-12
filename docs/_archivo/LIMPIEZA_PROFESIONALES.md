# Análisis y Limpieza de Profesionales

## 🔍 Problema Identificado

La página `/profesionales` muestra **muchos profesionales** cuando en realidad solo hay **4 usuarios** en Supabase, y ninguno de esos usuarios corresponde a los profesionales mostrados.

## 📊 Hallazgos

### Estructura de Datos

La tabla `professional` es **independiente** de la tabla `users` (auth.users):
- **NO tiene campo `user_id`**
- Son simplemente registros de profesionales de salud
- Pueden o no estar vinculados a usuarios del sistema

### Tipos de Profesionales en la BD

1. **Profesionales "huérfanos"** (datos de seed/prueba):
   - Creados durante el desarrollo inicial
   - Sin plantillas de horarios (`slot_template`)
   - Sin asignaciones diarias (`daily_professional_assignment`)
   - Sin turnos en cola (`daily_queue`)
   - **Candidatos a eliminación**

2. **Profesionales en uso**:
   - Tienen plantillas de horarios
   - Aparecen en asignaciones diarias
   - Tienen turnos asignados
   - **NO deben eliminarse**

## 🛠️ Scripts Creados

### 1. `db/analysis_professionals.sql`

Script de **análisis no destructivo** que muestra:
- Total de profesionales
- Profesionales por institución
- Profesionales activos vs inactivos
- Profesionales con plantillas de horarios
- Profesionales con asignaciones
- Profesionales en cola diaria
- **Lista de profesionales huérfanos** (sin ninguna relación)
- Resumen por institución

**Cómo ejecutarlo:**
```bash
# Opción 1: Desde Supabase Studio (SQL Editor)
# Copiar y pegar el contenido de db/analysis_professionals.sql

# Opción 2: Desde CLI (si tienes supabase cli configurado)
npx supabase db execute -f db/analysis_professionals.sql
```

### 2. `db/cleanup_professionals.sql`

Script de **limpieza** con 3 opciones:

#### Opción 1: MODO SEGURO (Recomendado primero)
- **NO elimina**, solo marca como `is_active = false`
- Permite recuperar si algo sale mal
- Usa transacción con ROLLBACK por defecto

```sql
-- Desactivar profesionales huérfanos
BEGIN;
UPDATE professional SET is_active = false, updated_at = NOW()
WHERE id IN (...profesionales huérfanos...);
-- Revisar cuántos se desactivaron
-- Si está bien: COMMIT;
-- Si está mal: ROLLBACK;
```

#### Opción 2: ELIMINACIÓN PERMANENTE
- ⚠️ **PELIGROSO**: Elimina permanentemente
- Solo para profesionales huérfanos (sin relaciones)
- Usa transacción con ROLLBACK por defecto
- Muestra listado antes de eliminar

```sql
BEGIN;
-- Crea tabla temporal con profesionales a eliminar
-- Muestra qué se va a eliminar
-- DELETE... (descomentado manualmente)
COMMIT;
```

#### Opción 3: ELIMINACIÓN SELECTIVA por fecha
- Elimina solo profesionales antiguos (>30 días) sin uso
- Útil para limpiar seeds de desarrollo

## 📋 Plan de Acción Recomendado

### Paso 1: Análisis
```bash
# Ejecutar script de análisis en Supabase Studio
# Revisar resultados, especialmente:
# - Cuántos profesionales huérfanos hay
# - De qué instituciones son
# - Cuándo fueron creados
```

### Paso 2: Backup (IMPORTANTE)
```bash
# Hacer backup de la tabla professional
# En Supabase Studio: Table Editor > professional > Export to CSV
```

### Paso 3: Modo Seguro (Desactivar)
```sql
-- Ejecutar OPCIÓN 1 del cleanup_professionals.sql
-- Esto solo desactiva, no elimina
-- Verificar en /profesionales que solo se muestren los activos
```

### Paso 4: Verificación
```bash
# Probar el sistema durante 1-2 días
# Verificar que no haya problemas
# Si todo funciona bien, pasar al paso 5
```

### Paso 5: Eliminación Final (Opcional)
```sql
-- Si después de 1-2 días todo funciona bien
-- Ejecutar OPCIÓN 2 del cleanup_professionals.sql
-- Esto elimina permanentemente los profesionales desactivados
```

## 🎯 Resultado Esperado

**Antes:**
- `/profesionales` muestra ~20-50 profesionales (seeds de desarrollo)
- Solo 4 son reales/en uso
- Confusión sobre cuáles son válidos

**Después:**
- `/profesionales` muestra solo los 4 profesionales reales
- Base de datos limpia y organizada
- Sin datos de prueba/seed antiguos

## ⚠️ Advertencias

1. **NUNCA ejecutar limpieza sin backup**
2. **SIEMPRE revisar el análisis primero**
3. **Empezar con modo seguro** (desactivar, no eliminar)
4. **Verificar** que no se eliminen profesionales en uso
5. **NO ejecutar en producción** sin pruebas previas

## 🔗 Relaciones de la Tabla Professional

```
professional
├── slot_template (plantillas de horarios)
├── daily_professional_assignment (asignaciones diarias)
├── daily_queue (turnos asignados)
└── institution (institución a la que pertenece)
```

Un profesional **huérfano** es el que NO tiene ninguna de estas relaciones.

## 📝 Notas Adicionales

- La tabla `professional` no tiene campo `user_id` por diseño
- Los profesionales son **datos maestros** del sistema
- Pueden existir sin estar vinculados a usuarios
- Los usuarios administrativos los gestionan desde `/profesionales`
- La relación usuario↔profesional se maneja a través de `user_service` (usuarios asignados a servicios)

## 🚀 Próximos Pasos

1. **Tú decides**: ¿Ejecutamos el análisis primero?
2. Revisamos juntos los resultados
3. Decides si quieres limpiar (y qué opción usar)
4. Yo ejecuto los scripts que elijas
