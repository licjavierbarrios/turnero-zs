# ⚡ RESUMEN RÁPIDO - REDISEÑO DE ROLES

**Status:** ✅ LISTO PARA EJECUTAR

---

## 🎯 QUÉ CAMBIA

```
ROLES ACTUALES                  ROLES NUEVOS
medico      ────────────────→  profesional
enfermeria  ────────────────→  servicio
(otros mantienen igual)
```

---

## 📋 LOS 3 PASOS

### 1️⃣ EJECUTAR PHASE 0 EN SUPABASE
Archivo: `db/migrations/20251024_redesign_roles_phase0_drop_policies.sql`
- Dropea todas las policies
- Cambia el enum de roles
- Convierte datos automáticamente

### 2️⃣ EJECUTAR PHASE 1 EN SUPABASE
Archivo: `db/migrations/20251024_redesign_roles_phase1_create_tables.sql`
- Crea `user_professional_assignment` (quién es profesional)
- Crea `user_service_assignment` (quién es servicio)

### 3️⃣ ACTUALIZAR CÓDIGO TYPESCRIPT
Archivo: `FASE3-CAMBIOS-TYPESCRIPT.md` (guía detallada)
- `lib/types.ts` - cambiar enum
- `lib/permissions.ts` - actualizar permisos
- `app/(dashboard)/layout.tsx` - actualizar navegación
- `hooks/useInstitutionContext.ts` - actualizar helpers
- `app/super-admin/usuarios/components/MembershipsTab.tsx` - labels

---

## ⏱️ TIEMPO

Total: ~90 minutos
- SQL: 15 min
- TypeScript: 30 min
- Testing: 30 min
- Verificación: 15 min

---

## 🚨 CUIDADOS

1. **BACKUP PRIMERO** (en Supabase)
2. **ORDEN:** Phase 0 → Phase 1 → Phase 2 → TypeScript
3. **TESTING:** 6 tests manuales después (admin, profesional, servicio, pantalla, etc.)

---

## 📖 DOCUMENTOS

| Doc | Para |
|-----|------|
| `GUIA-EJECUCION-REDISENO-ROLES.md` | Paso a paso con testing |
| `FASE3-CAMBIOS-TYPESCRIPT.md` | Cambios específicos en código |
| `ESTADO-IMPLEMENTACION-ROLES-03NOV.md` | Estado completo |
| `ANALISIS-REDISENO-ROLES.md` | Análisis detallado del problema |

---

## ✅ TODO

- [ ] Backup en Supabase
- [ ] Ejecutar Phase 0
- [ ] Ejecutar Phase 1
- [ ] Ejecutar Phase 2
- [ ] Cambios TypeScript
- [ ] `npm run build` (sin errores)
- [ ] Testing manual (6 scenarios)
- [ ] Commit a git

---

**¿Listo? Lee `GUIA-EJECUCION-REDISENO-ROLES.md` y sigue los pasos.**
