# 🚀 GUÍA COMPLETA DE EJECUCIÓN - Rediseño de Roles

**Fecha:** 2025-11-03
**Objetivo:** Guía paso a paso para ejecutar el rediseño de roles
**Tiempo Estimado:** 2-3 horas (principalmente testing)

---

## 📋 RESUMEN DE FASES

| Fase | Qué hace | Dónde | Quién |
|------|----------|----  |-------|
| **Phase 0** | Drop policies + cambiar enum | Supabase (SQL) | Tú (manual) |
| **Phase 1** | Crear tablas de asignaciones | Supabase (SQL) | Tú (manual) |
| **Phase 2** | Migrar datos (medico→profesional, enfermeria→servicio) | Supabase (SQL) | Tú (manual) |
| **Phase 3** | Cambios TypeScript | Código | Claude (con tu revisión) |

---

## ⏱️ PASO 1: PREPARACIÓN (5 min)

### 1.1 Backup de datos (IMPORTANTE)

Antes de hacer CUALQUIER cambio, haz un backup:

**En Supabase dashboard:**
1. Ve a **Database → Backups**
2. Haz clic en **Create manual backup**
3. Nombra: `pre-roles-redesign-2025-11-03`
4. Confirma que se creó ✅

### 1.2 Verificar estado actual de datos

Ejecuta esta query en Supabase para ver el estado actual:

```sql
-- Ver estado actual de usuarios y sus roles
SELECT
  u.email,
  m.role,
  COUNT(DISTINCT up.professional_id) as profesionales_asignados,
  COUNT(DISTINCT us.service_id) as servicios_asignados
FROM users u
LEFT JOIN membership m ON u.id = m.user_id
LEFT JOIN user_professional up ON u.id = up.user_id AND up.is_active = true
LEFT JOIN user_service us ON u.id = us.user_id AND us.is_active = true
WHERE m.is_active = true
GROUP BY u.id, u.email, m.role
ORDER BY u.email;
```

**Nota:** Guarda el resultado. Después de Phase 2, debería verse igual pero con roles actualizados.

---

## 🔧 PASO 2: EJECUTAR PHASE 0 - DROP POLICIES Y CAMBIAR ENUM (15 min)

### 2.1 Ubicación del script

**Archivo:** `db/migrations/20251024_redesign_roles_phase0_drop_policies.sql`

### 2.2 Cómo ejecutarlo en Supabase

1. Abre Supabase dashboard
2. Ve a **SQL Editor** (icono de interrogación o chat)
3. Haz clic en **New Query**
4. Copia TODO el contenido de `20251024_redesign_roles_phase0_drop_policies.sql`
5. Pega en el editor de Supabase
6. Haz clic en **Run** (botón azul)

**⚠️ ADVERTENCIA:** Esta es la query más destructiva. Dropea todas las policies. Pero está diseñada para no afectar los datos, solo la estructura.

### 2.3 Verificación de Phase 0

Después de ejecutar, corre esta query de verificación:

```sql
-- Verificar que el enum cambió correctamente
SELECT enum_range(NULL::role_name);
```

**Debe mostrar:**
```
(super_admin,admin,administrativo,profesional,servicio,pantalla)
```

**Si ves `medico` o `enfermeria`, algo falló. Contacta para restaurar el backup.**

### 2.4 Verificar que los datos se convirtieron

```sql
-- Ver roles después de Phase 0
SELECT DISTINCT role FROM membership ORDER BY role;
```

**Debe mostrar:**
```
admin
administrativo
pantalla
profesional
servicio
```

**NO debe mostrar `medico` ni `enfermeria`**

---

## 🏗️ PASO 3: EJECUTAR PHASE 1 - CREAR TABLAS (10 min)

### 3.1 Ubicación del script

**Archivo:** `db/migrations/20251024_redesign_roles_phase1_create_tables.sql`

### 3.2 Cómo ejecutarlo

Mismo proceso que Phase 0:
1. New Query en Supabase
2. Copiar contenido de `20251024_redesign_roles_phase1_create_tables.sql`
3. Pegar y Run

### 3.3 Verificación de Phase 1

```sql
-- Ver que las nuevas tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_professional_assignment', 'user_service_assignment')
ORDER BY table_name;
```

**Debe mostrar:**
```
user_professional_assignment
user_service_assignment
```

### 3.4 Verificar structure de tablas

```sql
-- Ver columnas de user_professional_assignment
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_professional_assignment'
ORDER BY ordinal_position;
```

---

## 📊 PASO 4: EJECUTAR PHASE 2 - MIGRAR DATOS (5 min)

### 4.1 Ubicación del script

**Archivo:** `db/migrations/20251024_redesign_roles_phase2_migrate_data.sql`

### 4.2 Cómo ejecutarlo

Mismo proceso:
1. New Query
2. Copiar contenido de `20251024_redesign_roles_phase2_migrate_data.sql`
3. Pegar y Run

### 4.3 Verificación de Phase 2

```sql
-- Ver que los roles se convirtieron
SELECT
  email,
  role,
  COUNT(*) as count
FROM users u
JOIN membership m ON u.id = m.user_id
WHERE m.is_active = true
GROUP BY email, role
ORDER BY email;
```

**Debe mostrar:**
```
admin@evita.com          | admin        | 1
medico@evita.com         | profesional  | 1  (NO "medico")
enfermero@evita.com      | servicio     | 1  (NO "enfermeria")
pantalla@evita.com       | pantalla     | 1
```

---

## 💻 PASO 5: CAMBIOS EN TYPESCRIPT (30 min)

### 5.1 Archivos a actualizar

Sigue la guía en **FASE3-CAMBIOS-TYPESCRIPT.md**

Los cambios principales son en estos archivos:

1. `lib/types.ts` - Actualizar UserRole enum
2. `lib/permissions.ts` - Actualizar route permissions
3. `app/(dashboard)/layout.tsx` - Actualizar navigation
4. `hooks/useInstitutionContext.ts` - Actualizar helpers
5. `app/super-admin/usuarios/components/MembershipsTab.tsx` - Labels

### 5.2 Proceso

Para cada archivo:
1. Abre en VS Code
2. Busca las líneas mencionadas en FASE3-CAMBIOS-TYPESCRIPT.md
3. Haz los cambios (reemplazar 'medico' → 'profesional', 'enfermeria' → 'servicio')
4. Guarda el archivo

### 5.3 Verificación de cambios

```bash
# Buscar que no queden referencias a 'medico' o 'enfermeria'
grep -r "medico" app/ components/ lib/ hooks/ 2>/dev/null | grep -v "professional_role" | wc -l

# Debe retornar 0 (o muy pocas si hay comentarios)
```

---

## 🧪 PASO 6: TESTING (45 min)

### 6.1 Setup para testing

1. Asegúrate de que los cambios TypeScript se compilaron sin errores:
   ```bash
   npm run build
   ```

2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abre http://localhost:3000

### 6.2 Test 1: Login como Admin

**Usuario:** `admin@evita.com`
**Contraseña:** (tu contraseña)

**Verificar:**
- [ ] Login funciona
- [ ] Dashboard carga sin errores
- [ ] Puede ver todas las instituciones
- [ ] Puede ver todas las colas
- [ ] Puede ver usuarios y membresías
- [ ] En Usuarios → role muestra "Administrador" (no "Médico")

### 6.3 Test 2: Login como Profesional (antes era Médico)

**Usuario:** `medico@evita.com`
**Contraseña:** (tu contraseña)

**Verificar:**
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Ve la navegación (Dashboard, Turnos, Agenda)
- [ ] En Turnos ve solo sus profesionales asignados
- [ ] En Agenda ve sus horarios
- [ ] NO puede acceder a /asignaciones (debe redirigir)

### 6.4 Test 3: Login como Servicio (antes era Enfermería)

**Usuario:** `enfermero@evita.com`
**Contraseña:** (tu contraseña)

**Verificar:**
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Ve la navegación (Dashboard, Turnos)
- [ ] En Turnos ve solo sus servicios asignados
- [ ] NO ve la opción de Agenda (rol profesional)
- [ ] NO puede acceder a /asignaciones

### 6.5 Test 4: Login como Pantalla

**Usuario:** `pantalla@evita.com`
**Contraseña:** (tu contraseña)

**Verificar:**
- [ ] Login funciona
- [ ] Redirige a la pantalla pública correctamente
- [ ] La pantalla muestra la cola del día

### 6.6 Test 5: Verificar RLS en Supabase

Corre estas queries para asegurar que RLS funciona:

```sql
-- Test 1: Verificar que admin ve su membership
SELECT id, user_id, role FROM membership LIMIT 5;

-- Test 2: Verificar que las nuevas tablas existen
SELECT COUNT(*) FROM user_professional_assignment;
SELECT COUNT(*) FROM user_service_assignment;

-- Test 3: Ver qué profesionales/servicios están asignados
SELECT
  u.email,
  COUNT(DISTINCT upa.professional_id) as profesionales
FROM users u
LEFT JOIN user_professional_assignment upa ON u.id = upa.user_id AND upa.is_active = true
GROUP BY u.email
ORDER BY u.email;
```

---

## 🎯 PASO 7: VERIFICACIÓN FINAL (15 min)

### 7.1 Checklist de Verificación

- [ ] Phase 0 ejecutó sin errores
- [ ] Phase 1 ejecutó sin errores
- [ ] Phase 2 ejecutó sin errores
- [ ] Cambios TypeScript compilaron sin errores (`npm run build`)
- [ ] Tests manuales todos pasaron
- [ ] No hay referencias a 'medico' o 'enfermeria' en código TypeScript
- [ ] RLS policies funcionan (admins ven datos, usuarios normales ven solo suyos)
- [ ] La aplicación no muestra errores en consola del navegador

### 7.2 Verificación de Rollback (por si acaso)

Si algo salió mal, tienes un backup. Para restaurar:

1. En Supabase: **Database → Backups**
2. Haz clic en el backup que creaste
3. Haz clic en **Restore**
4. Confirma

**Esto restaurará la BD a antes de los cambios.**

---

## 📊 RESULTADO ESPERADO

Después de completar todas las fases:

### Base de Datos:
- Enum `role_name` solo tiene: super_admin, admin, administrativo, profesional, servicio, pantalla
- Tablas nuevas: `user_professional_assignment`, `user_service_assignment`
- Datos migraron: medico → profesional, enfermeria → servicio

### Aplicación:
- `UserRole` enum actualizado en types.ts
- Permisos de rutas actualizado en permissions.ts
- Navegación actualizada con nuevos roles
- Helpers actualizados en hooks
- Labels y colores actualizados en componentes

### Comportamiento:
- Usuarios con rol `profesional` ven solo sus profesionales asignados
- Usuarios con rol `servicio` ven solo sus servicios asignados
- Usuarios con rol `admin`/`administrativo` ven todos los datos
- RLS policies protegen el acceso a datos

---

## 🆘 TROUBLESHOOTING

### Problema: Phase 0 falla con error de policies

**Causa:** Las policies no se dropearon correctamente

**Solución:**
1. Restaura el backup
2. En Phase 0, verifica que todas las líneas `DROP POLICY` están presentes
3. Ejecuta nuevamente

### Problema: Phase 1 falla con "table already exists"

**Causa:** Las tablas ya existen (posiblemente de un intento anterior)

**Solución:**
```sql
-- Dropear las tablas si existen
DROP TABLE IF EXISTS user_professional_assignment CASCADE;
DROP TABLE IF EXISTS user_service_assignment CASCADE;

-- Luego ejecutar Phase 1 nuevamente
```

### Problema: Login falla después de cambios

**Causa:** Posible error en TypeScript o RLS

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca errores rojos
3. Si hay error de tipo (medico no existe), verifica lib/types.ts
4. Si hay error de RLS, verifica que Phase 0 ejecutó correctamente

### Problema: Tests fallan porque usuarios no ven datos

**Causa:** RLS policies están muy restrictivas

**Solución:**
1. Verifica que Phase 0 recreó las policies
2. En Supabase, ve a **RLS** y verifica que hay policies en:
   - membership
   - users
   - institution
   - daily_queue
3. Si faltan, crea las policies manualmente (están en Phase 0)

---

## 📞 RESUMEN RÁPIDO

**Si algo sale mal:**
1. Revisa el error
2. Mira la sección Troubleshooting arriba
3. Si no encuentras solución, restaura el backup y contacta

**Si todo sale bien:**
1. Haz commit de los cambios TypeScript
2. Documenta cualquier cosa especial que tuviste que hacer
3. ¡Celebra! 🎉

---

*Guía completa lista para ejecutar*
