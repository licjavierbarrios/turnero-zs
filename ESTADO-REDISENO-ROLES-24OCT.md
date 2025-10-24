# 📋 ESTADO DEL REDISEÑO DE ROLES - 24 Octubre 2025

## 🎯 OBJETIVO
Rediseñar el sistema de roles para separar:
- **ROLES** (permisos: admin, administrativo, profesional, servicio, pantalla)
- **ASIGNACIONES** (qué profesional/servicio específico ve cada usuario)

---

## 📊 PROGRESO
- ✅ Análisis completado: `ANALISIS-REDISENO-ROLES.md`
- ✅ 3 migraciones SQL creadas (Fase 1, 2, 3)
- ❌ Ejecución bloqueada por problema de RLS policies

---

## 🔴 PROBLEMA ENCONTRADO

**Error al ejecutar `20251024_redesign_roles_phase0_nuclear_option.sql`:**

```
ERROR:  0A000: cannot alter type of a column used in a policy definition
DETAIL:  policy Users can view own memberships on table membership depends on column "role"
```

**Causa:**
- PostgreSQL NO permite cambiar el tipo de una columna si hay policies que la usan
- Intentamos deshabilitar RLS ANTES de cambiar el enum, pero las policies siguen existiendo
- Necesitamos DROPEAR las policies PRIMERO, LUEGO deshabilitar RLS, LUEGO cambiar el enum

---

## 🔧 SOLUCIÓN PARA MAÑANA

El problema es que `DISABLE ROW LEVEL SECURITY` no borra las policies, solo las desactiva.

**Orden correcto mañana:**

1. **Dropear TODAS las policies explícitamente** (antes de tocar RLS)
2. LUEGO deshabilitar RLS
3. LUEGO cambiar el enum

**Pasos exactos:**

```sql
-- 1. Dropear TODAS las policies (usa pg_policies para listarlas)
DROP POLICY IF EXISTS "nombre_policy" ON tabla_name;
-- ... repetir para todas las 100+ policies

-- 2. LUEGO cambiar el enum
ALTER TABLE membership ALTER COLUMN role TYPE role_name_v2 USING role::text::role_name_v2;

-- 3. LUEGO recrear policies
CREATE POLICY ...
```

---

## 📁 ARCHIVOS CREADOS HOY

### Análisis
- ✅ `ANALISIS-REDISENO-ROLES.md` - Análisis completo del problema y solución

### Migraciones SQL (listas pero no ejecutadas)
- ⏳ `20251024_redesign_roles_phase0_nuclear_option.sql` - Cambiar enum (FALLA ACTUALMENTE)
- ⏳ `20251024_redesign_roles_phase1_create_tables.sql` - Crear nuevas tablas
- ⏳ `20251024_redesign_roles_phase2_migrate_data.sql` - Migrar datos

### Documentación de Estado (este archivo)
- ✅ `ESTADO-REDISENO-ROLES-24OCT.md`

---

## 🚀 PRÓXIMO PASO MAÑANA

### Opción A: Hacer el trabajo correctamente (RECOMENDADO)
1. Crear script SQL que dropee TODAS las policies (usar `pg_policies`)
2. Actualizar `phase0_nuclear_option.sql` para hacer esto
3. Ejecutar las 3 fases en orden

### Opción B: Alternativa menos invasiva
1. Crear nueva columna `role_v2` en membership con el nuevo enum
2. No tocar `role` original (dejar funcionar las policies viejas)
3. Actualizar código TypeScript para usar `role_v2`
4. Deprecar `role` después

---

## 📌 NOTAS IMPORTANTES

- **Los datos son de prueba**: No importa si tenemos que borrar todo
- **El enum DEBE cambiar**: No se puede tener 'medico' y 'enfermeria' como roles
- **Las policies son el problema**: Están "pegadas" a la columna `role`
- **Supabase es complicado con RLS**: Cambiar tipos de columnas con policies es tedioso

---

## 🎯 USUARIO ACTUAL Y ASIGNACIONES

Después del rediseño, esto es lo que queremos:

```
medico@evita.com
├─ membership.role: 'profesional' (CAMBIO de 'medico')
└─ user_professional_assignment
   └─ asignado a: [profesionales reales que crees]

enfermero@evita.com
├─ membership.role: 'servicio' (CAMBIO de 'enfermeria')
└─ user_service_assignment
   └─ asignado a: [servicios reales que existen]

admin@evita.com
├─ membership.role: 'admin' (SIN CAMBIO)
└─ sin asignaciones (ve todo)

pantalla@evita.com
├─ membership.role: 'pantalla' (SIN CAMBIO)
└─ sin asignaciones
```

---

## ✅ CHECKLIST PARA MAÑANA

- [ ] Revisar `ANALISIS-REDISENO-ROLES.md` (si no lo hiciste)
- [ ] Decidir: ¿Opción A (correcta) u Opción B (menos invasiva)?
- [ ] Si Opción A: Crear script para dropear todas las policies
- [ ] Ejecutar migraciones en orden
- [ ] Verificar que los cambios funcionan
- [ ] Pasar a Fase 3 (actualizar código TypeScript)

---

## 📞 RESUMEN RÁPIDO

**¿Qué queremos?**
Separar roles (permisos) de asignaciones (datos específicos)

**¿Qué tenemos listo?**
- Análisis completo ✅
- Migraciones SQL ✅ (pero no ejecutadas)
- Plan claro ✅

**¿Qué falta?**
1. Resolver problema de policies (Mañana)
2. Ejecutar migraciones (Mañana)
3. Actualizar código TypeScript (Después)
4. Testing (Después)

**Tiempo estimado restante:**
- Mañana: 1-2 horas (resolver SQL + ejecutar)
- Día siguiente: 1 hora (TypeScript)

---

*Documentado y listo para continuar mañana.*
