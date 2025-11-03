# ✅ CHECKLIST INTERACTIVO - Rediseño de Roles

**Usa este archivo para rastrear tu progreso mientras ejecutas el rediseño**

---

## 📋 FASE PREPARACIÓN (5 min)

### Antes de comenzar
- [ ] Leí **RESUMEN-RAPIDO-ROLES.md**
- [ ] Leí **GUIA-EJECUCION-REDISENO-ROLES.md** (al menos hasta Paso 2)
- [ ] Tengo acceso a Supabase Dashboard
- [ ] Tengo VS Code abierto
- [ ] Tengo una terminal con acceso a npm

### Backup
- [ ] Abierto Supabase Dashboard → Database → Backups
- [ ] Creé un backup manual con nombre: `pre-roles-redesign-2025-11-03`
- [ ] Backup completó exitosamente

### Verificación pre-rediseño
- [ ] Ejecuté la query de estado actual (GUIA paso 1.2)
- [ ] Guardé el resultado (para comparar después)
- [ ] Vi usuarios: admin@, medico@, enfermero@, pantalla@

---

## 🔧 FASE 0: DROP POLICIES + CAMBIAR ENUM (15 min)

### Preparación
- [ ] Abierto archivo: `db/migrations/20251024_redesign_roles_phase0_drop_policies.sql`
- [ ] Leí el contenido (son ~140 líneas)
- [ ] Abierto Supabase SQL Editor

### Ejecución
- [ ] Copié TODA el contenido de Phase 0
- [ ] Pegué en Supabase SQL Editor
- [ ] Hice clic en **Run**
- [ ] ✅ **Ejecutó SIN ERRORES**

### Verificación
- [ ] Ejecuté query de verificación de enum
- [ ] Veo: `(super_admin,admin,administrativo,profesional,servicio,pantalla)`
- [ ] NO veo `medico` ni `enfermeria` en el enum
- [ ] Ejecuté query de roles en membership
- [ ] Veo: admin, administrativo, pantalla, profesional, servicio
- [ ] NO veo `medico` ni `enfermeria` en roles

### Resultados Phase 0
- Enum actual: super_admin, admin, administrativo, profesional, servicio, pantalla
- Dato: medico@evita.com ahora tiene role = 'profesional'
- Dato: enfermero@evita.com ahora tiene role = 'servicio'

---

## 🏗️ FASE 1: CREAR TABLAS (10 min)

### Preparación
- [ ] Abierto archivo: `db/migrations/20251024_redesign_roles_phase1_create_tables.sql`
- [ ] Leí el contenido (son ~200 líneas)
- [ ] Abierto Supabase SQL Editor (NEW QUERY)

### Ejecución
- [ ] Copié TODA el contenido de Phase 1
- [ ] Pegué en Supabase SQL Editor
- [ ] Hice clic en **Run**
- [ ] ✅ **Ejecutó SIN ERRORES**

### Verificación
- [ ] Ejecuté query para ver que las tablas existen
- [ ] Veo: `user_professional_assignment`
- [ ] Veo: `user_service_assignment`
- [ ] Ejecuté query de estructura de columnas
- [ ] Vi todas las columnas: id, user_id, professional/service_id, institution_id, is_active, created_at, updated_at

### Resultados Phase 1
- Tabla: user_professional_assignment (con índices y RLS)
- Tabla: user_service_assignment (con índices y RLS)
- Ambas tienen policies básicas

---

## 📊 FASE 2: MIGRAR DATOS (5 min)

### Preparación
- [ ] Abierto archivo: `db/migrations/20251024_redesign_roles_phase2_migrate_data.sql`
- [ ] Leí el contenido (son ~70 líneas)
- [ ] Abierto Supabase SQL Editor (NEW QUERY)

### Ejecución
- [ ] Copié TODA el contenido de Phase 2
- [ ] Pegué en Supabase SQL Editor
- [ ] Hice clic en **Run**
- [ ] ✅ **Ejecutó SIN ERRORES**

### Verificación
- [ ] Ejecuté query de verificación de datos
- [ ] Veo: admin@evita.com → admin (sin cambios)
- [ ] Veo: medico@evita.com → profesional (cambiado)
- [ ] Veo: enfermero@evita.com → servicio (cambiado)
- [ ] Veo: pantalla@evita.com → pantalla (sin cambios)

### Resultados Phase 2
- Datos migraron: medico → profesional ✓
- Datos migraron: enfermeria → servicio ✓
- Otros roles sin cambios ✓

---

## 💻 FASE 3: CAMBIOS TYPESCRIPT (30 min)

### Preparación
- [ ] Abierto **FASE3-CAMBIOS-TYPESCRIPT.md**
- [ ] Abierto VS Code con el proyecto
- [ ] Leí la lista de 5 archivos principales a cambiar

### lib/types.ts
- [ ] Abierto archivo: `lib/types.ts`
- [ ] Encontré línea ~25: `export type UserRole`
- [ ] Cambié: `'medico'` → `'profesional'`
- [ ] Cambié: `'enfermeria'` → `'servicio'`
- [ ] Guardé archivo

### lib/permissions.ts
- [ ] Abierto archivo: `lib/permissions.ts`
- [ ] Encontré línea ~15: `routePermissions`
- [ ] Cambié TODAS las referencias en rutas:
  - [ ] `'medico'` → `'profesional'`
  - [ ] `'enfermeria'` → `'servicio'`
- [ ] Guardé archivo

### app/(dashboard)/layout.tsx
- [ ] Abierto archivo: `app/(dashboard)/layout.tsx`
- [ ] Encontré sección `navigation` (~línea 30)
- [ ] Cambié TODAS las referencias de roles:
  - [ ] Cada objeto con roles: actualicé arrays
  - [ ] `'medico'` → `'profesional'`
  - [ ] `'enfermeria'` → `'servicio'`
- [ ] Guardé archivo

### hooks/useInstitutionContext.ts
- [ ] Abierto archivo: `hooks/useInstitutionContext.ts`
- [ ] Encontré sección de helpers (~línea 130)
- [ ] Cambié helpers:
  - [ ] Renombré o añadí `isProfessional`
  - [ ] Renombré o añadí `isService`
  - [ ] Mantuve backward compatibility para `isMedico`/`isEnfermeria`
- [ ] Guardé archivo

### app/super-admin/usuarios/components/MembershipsTab.tsx
- [ ] Abierto archivo: `app/super-admin/usuarios/components/MembershipsTab.tsx`
- [ ] Encontré `roleLabels` (~línea 50)
- [ ] Cambié:
  - [ ] `'medico': 'Médico'` → `'profesional': 'Profesional'`
  - [ ] `'enfermeria': 'Enfermería'` → `'servicio': 'Servicio'`
- [ ] Encontré `roleColors` (~línea 58)
- [ ] Cambié colores correspondientes
- [ ] Guardé archivo

### Búsqueda de referencias antiguas
- [ ] Ejecuté: `grep -r "medico" app/ components/ lib/ hooks/ 2>/dev/null | wc -l`
- [ ] Resultado: 0 o muy bajo (solo comentarios permitidos)
- [ ] Ejecuté: `grep -r "enfermeria" app/ components/ lib/ hooks/ 2>/dev/null | wc -l`
- [ ] Resultado: 0 o muy bajo

### Compilación
- [ ] Ejecuté en terminal: `npm run build`
- [ ] ✅ **BUILD SIN ERRORES**
- [ ] No hay warnings de TypeScript

---

## 🧪 FASE 4: TESTING MANUAL (40 min)

### Setup de testing
- [ ] Ejecuté: `npm run dev`
- [ ] ✅ **Servidor inicia sin errores**
- [ ] Abierto http://localhost:3000
- [ ] Abierto DevTools (F12) para monitorear errores

### Test 1: Login como Admin
- [ ] Usuario: `admin@evita.com`
- [ ] ✅ Login exitoso
- [ ] ✅ Dashboard carga sin errores
- [ ] ✅ Puedo ver todas las instituciones
- [ ] ✅ Puedo ver todas las colas
- [ ] ✅ Navegación muestra opciones de admin
- [ ] ✅ NO hay errores en consola

### Test 2: Login como Profesional (medico@)
- [ ] Usuario: `medico@evita.com`
- [ ] ✅ Login exitoso
- [ ] ✅ Dashboard carga
- [ ] ✅ Veo: Dashboard, Turnos, Agenda en navegación
- [ ] ✅ Puedo abrir Turnos
- [ ] ✅ Veo solo mis profesionales asignados
- [ ] ✅ Puedo abrir Agenda
- [ ] ✅ Veo mis horarios
- [ ] ✅ NO puedo acceder a /asignaciones (redirige)
- [ ] ✅ NO hay errores en consola

### Test 3: Login como Servicio (enfermero@)
- [ ] Usuario: `enfermero@evita.com`
- [ ] ✅ Login exitoso
- [ ] ✅ Dashboard carga
- [ ] ✅ Veo: Dashboard, Turnos en navegación
- [ ] ✅ NO veo Agenda (rol profesional)
- [ ] ✅ Puedo abrir Turnos
- [ ] ✅ Veo solo mis servicios asignados
- [ ] ✅ NO puedo acceder a /asignaciones (redirige)
- [ ] ✅ NO hay errores en consola

### Test 4: Login como Pantalla
- [ ] Usuario: `pantalla@evita.com`
- [ ] ✅ Login exitoso
- [ ] ✅ Redirige a pantalla pública
- [ ] ✅ Pantalla muestra la cola del día
- [ ] ✅ NO hay errores en consola

### Test 5: RLS en Supabase
- [ ] Ejecuté query: `SELECT id, user_id, role FROM membership LIMIT 5;`
- [ ] ✅ Resultado visible
- [ ] Ejecuté query: `SELECT COUNT(*) FROM user_professional_assignment;`
- [ ] ✅ Resultado: 0 o más (número de asignaciones)
- [ ] Ejecuté query: `SELECT COUNT(*) FROM user_service_assignment;`
- [ ] ✅ Resultado: 0 o más

### Test 6: Roles en BD
- [ ] Ejecuté query de estado de roles
- [ ] ✅ Veo: admin, administrativo, pantalla, profesional, servicio
- [ ] ✅ NO veo: medico, enfermeria

---

## 🎯 FASE 5: VERIFICACIÓN FINAL (10 min)

### Verificaciones de compliación
- [ ] `npm run build` pasó sin errores
- [ ] No hay warnings de TypeScript
- [ ] No hay warnings de eslint

### Verificaciones de funcionamiento
- [ ] Aplicación inicia sin errores
- [ ] 4 tests de login pasaron
- [ ] No hay errores en consola del navegador
- [ ] RLS policies funcionan (admins ven datos, usuarios normales ven solo suyos)

### Verificaciones de datos
- [ ] enum role_name tiene los 6 valores nuevos
- [ ] membership.role no tiene referencias a 'medico' o 'enfermeria'
- [ ] user_professional_assignment table existe
- [ ] user_service_assignment table existe

### Verificaciones de código
- [ ] types.ts actualizado
- [ ] permissions.ts actualizado
- [ ] layout.tsx actualizado
- [ ] useInstitutionContext.ts actualizado
- [ ] MembershipsTab.tsx actualizado

---

## 💾 FASE 6: COMMIT A GIT (2 min)

### Antes de commit
- [ ] Todos los tests pasaron
- [ ] Apliqué todos los cambios TypeScript
- [ ] NO hay errores en compilación
- [ ] Verifiqué que los cambios SQL ejecutaron correctamente

### Commit
- [ ] Ejecuté: `git status` (para ver cambios)
- [ ] Ejecuté: `git add app/ components/ lib/ hooks/` (solo cambios TypeScript)
- [ ] ✅ Creé commit con mensaje:
  ```
  feat: rediseño de roles - cambio medico→profesional, enfermeria→servicio

  - Cambio enum role_name en BD (Phase 0)
  - Nuevas tablas de asignaciones (Phase 1)
  - Migración de datos (Phase 2)
  - Actualización de tipos y permisos en TypeScript
  - Testing manual completo (6 escenarios)
  ```

- [ ] Ejecuté: `git log -1` (para verificar que commitó)
- [ ] ✅ Commit exitoso

---

## 🎉 ¡COMPLETADO!

### Resumen de logros
- [x] Rediseño de roles completado
- [x] BD actualizada
- [x] Código TypeScript actualizado
- [x] Testing completado
- [x] Commit a git

### Próximos pasos (opcionales)
- [ ] Push a rama principal (si usas ramas)
- [ ] Documentar cualquier cosa especial que tuviste que hacer
- [ ] Actualizar CHANGELOG o notas de release

### Célébra 🎊
¡Lo hiciste! El rediseño de roles está completamente implementado.

---

## 🆘 SI ALGO FALLA

### Durante Phase 0-2
- [ ] Revisa: GUIA-EJECUCION Paso 7 (TROUBLESHOOTING)
- [ ] Si es crítico: Restaura el backup

### Durante TypeScript
- [ ] Revisa: FASE3-CAMBIOS-TYPESCRIPT.md
- [ ] Verifica línea números exactos
- [ ] Busca referencias antiguas: grep -r "medico"

### Durante testing
- [ ] Abre DevTools (F12) y busca errores rojos
- [ ] Verifica que cambiaste TODOS los archivos
- [ ] Intenta npm run build nuevamente

### Fallida completamente
- [ ] Restaura backup en Supabase (GUIA Paso 7)
- [ ] Usa git para revertir cambios TypeScript
- [ ] Contacta con documentación de soporte

---

**¡Buena suerte! Todo está listo. 🚀**
