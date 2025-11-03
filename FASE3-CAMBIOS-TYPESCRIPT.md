# 📝 FASE 3: CAMBIOS EN TYPESCRIPT - Rediseño de Roles

**Fecha:** 2025-11-03
**Objetivo:** Actualizar el código TypeScript para usar los nuevos roles (profesional/servicio en lugar de medico/enfermeria)
**Dependencia:** Fases 1 y 2 de SQL completadas

---

## 📊 RESUMEN DE CAMBIOS

### Cambios en Roles:
| Antes | Después | Razón |
|-------|---------|-------|
| `medico` | `profesional` | Claridad: distinguir el rol del tipo de profesional |
| `enfermeria` | `servicio` | Claridad: distinguir el rol del tipo de servicio |

### Nuevas Tablas:
- `user_professional_assignment` → Vincula usuarios profesionales con profesionales específicos
- `user_service_assignment` → Vincula usuarios de servicio con servicios específicos

---

## 🔧 CAMBIOS ARCHIVO POR ARCHIVO

### 1. **lib/types.ts** - Actualizar tipo UserRole

**Ubicación:** Línea 23-29

**ANTES:**
```typescript
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'administrativo'
  | 'medico'
  | 'enfermeria'
  | 'pantalla';
```

**DESPUÉS:**
```typescript
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'administrativo'
  | 'profesional'    // CAMBIO: medico → profesional
  | 'servicio'       // CAMBIO: enfermeria → servicio
  | 'pantalla';
```

---

### 2. **lib/permissions.ts** - Actualizar permisos de rutas

**Ubicación:** Línea 12-21

**ANTES:**
```typescript
export const routePermissions: Record<string, UserRole[]> = {
  '/dashboard': ['admin', 'administrativo', 'medico', 'enfermeria'],
  '/turnos': ['admin', 'administrativo', 'medico', 'enfermeria'],
  '/agenda': ['admin', 'administrativo', 'medico'],
  '/asignaciones': ['admin', 'administrativo'],
  '/profesionales': ['admin'],
  '/servicios': ['admin'],
  '/reportes': ['admin', 'administrativo'],
}
```

**DESPUÉS:**
```typescript
export const routePermissions: Record<string, UserRole[]> = {
  '/dashboard': ['admin', 'administrativo', 'profesional', 'servicio'],
  '/turnos': ['admin', 'administrativo', 'profesional', 'servicio'],
  '/agenda': ['admin', 'administrativo', 'profesional'],
  '/asignaciones': ['admin', 'administrativo'],
  '/profesionales': ['admin'],
  '/servicios': ['admin'],
  '/reportes': ['admin', 'administrativo'],
}
```

---

### 3. **app/(dashboard)/layout.tsx** - Actualizar navegación

**Ubicación:** Línea 24-80 (sección de navegación)

**CAMBIOS:**
```typescript
// ANTES:
const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    roles: ['admin', 'administrativo', 'medico', 'enfermeria']  // ← CAMBIAR
  },
  {
    name: 'Turnos',
    href: '/turnos',
    icon: ClockIcon,
    roles: ['admin', 'administrativo', 'medico', 'enfermeria']  // ← CAMBIAR
  },
  {
    name: 'Agenda',
    href: '/agenda',
    icon: CalendarIcon,
    roles: ['admin', 'administrativo', 'medico']  // ← CAMBIAR
  },
  // ... más

// DESPUÉS:
const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    roles: ['admin', 'administrativo', 'profesional', 'servicio']  // ✓ ACTUALIZADO
  },
  {
    name: 'Turnos',
    href: '/turnos',
    icon: ClockIcon,
    roles: ['admin', 'administrativo', 'profesional', 'servicio']  // ✓ ACTUALIZADO
  },
  {
    name: 'Agenda',
    href: '/agenda',
    icon: CalendarIcon,
    roles: ['admin', 'administrativo', 'profesional']  // ✓ ACTUALIZADO
  },
  // ... más
]
```

---

### 4. **components/turnos/QueueFilters.tsx** - Actualizar lógica de filtrado

**Ubicación:** Línea 98-122

**CAMBIOS:**
```typescript
// ANTES:
const isAdminOrAdministrativo = userRole === 'admin' || userRole === 'administrativo'

// DESPUÉS (sin cambios en lógica, pero ahora funciona con profesional/servicio):
const isAdminOrAdministrativo = userRole === 'admin' || userRole === 'administrativo'

// Los usuarios con rol 'profesional' y 'servicio' siguen viendo solo sus asignaciones
// La lógica sigue igual porque se filtra en QueueTable por los datos de user_professional_assignment
```

**IMPORTANTE:** Este archivo NO necesita cambios en su lógica porque:
- Sigue filtrando por `isAdminOrAdministrativo`
- Los usuarios con rol `profesional` y `servicio` ven sus asignaciones porque se cargan desde `user_professional_assignment` y `user_service_assignment`

---

### 5. **hooks/useInstitutionContext.ts** - Actualizar helpers

**Ubicación:** Línea 130-137

**ANTES:**
```typescript
const isMedico = useMemo(
  () => context?.user_role === 'medico',
  [context]
)

const isEnfermeria = useMemo(
  () => context?.user_role === 'enfermeria',
  [context]
)
```

**DESPUÉS:**
```typescript
const isProfessional = useMemo(
  () => context?.user_role === 'profesional',
  [context]
)

const isService = useMemo(
  () => context?.user_role === 'servicio',
  [context]
)

// Backward compatibility (deprecado, para migration lenta)
const isMedico = useMemo(
  () => context?.user_role === 'profesional',
  [context]
)

const isEnfermeria = useMemo(
  () => context?.user_role === 'servicio',
  [context]
)
```

**NOTA:** Los helpers antiguos siguen funcionando pero ahora mapean a los nuevos roles

---

### 6. **app/super-admin/usuarios/components/MembershipsTab.tsx** - Actualizar labels

**Ubicación:** Línea 49-65 (roleLabels y roleColors)

**ANTES:**
```typescript
const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  administrativo: 'Administrativo',
  medico: 'Médico',
  enfermeria: 'Enfermería',
  pantalla: 'Pantalla',
}

const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-red-100 text-red-800',
  admin: 'bg-purple-100 text-purple-800',
  administrativo: 'bg-blue-100 text-blue-800',
  medico: 'bg-green-100 text-green-800',
  enfermeria: 'bg-amber-100 text-amber-800',
  pantalla: 'bg-gray-100 text-gray-800',
}
```

**DESPUÉS:**
```typescript
const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  administrativo: 'Administrativo',
  profesional: 'Profesional',  // ← CAMBIO
  servicio: 'Servicio',         // ← CAMBIO
  pantalla: 'Pantalla',
}

const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-red-100 text-red-800',
  admin: 'bg-purple-100 text-purple-800',
  administrativo: 'bg-blue-100 text-blue-800',
  profesional: 'bg-green-100 text-green-800',  // ← CAMBIO
  servicio: 'bg-amber-100 text-amber-800',      // ← CAMBIO
  pantalla: 'bg-gray-100 text-gray-800',
}
```

---

### 7. **app/(dashboard)/usuarios/page.tsx** - Revisar si usa roles

Revisar esta página para asegurarse de que no tiene referencias hardcodeadas a 'medico' o 'enfermeria'.

---

### 8. **lib/turnos/helpers.ts** - Revisar si hay referencias

**Ubicación:** Función `getInstitutionContext()`

Verificar que no haya referencias hardcodeadas a 'medico' o 'enfermeria'.

---

### 9. **lib/supabase/helpers.ts** - Revisar funciones helper

Revisar funciones como `isAdminOrAdministrativo()` para asegurarse de que funcionan con los nuevos roles.

---

## 🔍 VERIFICACIÓN: BÚSQUEDA DE REFERENCIAS HARDCODEADAS

Después de hacer los cambios, ejecuta estas búsquedas para asegurarte de no haber dejado nada:

```bash
# Buscar referencias a 'medico' (debe haber muy pocas o ninguna)
grep -r "medico" --include="*.ts" --include="*.tsx" app/ components/ lib/ hooks/

# Buscar referencias a 'enfermeria'
grep -r "enfermeria" --include="*.ts" --include="*.tsx" app/ components/ lib/ hooks/

# Buscar 'professional_role' (debería existir solo en types.ts y algunas queries)
grep -r "professional_role" --include="*.ts" --include="*.tsx" app/ components/ lib/
```

---

## 📋 CHECKLIST DE CAMBIOS

- [ ] Actualizar `lib/types.ts` - UserRole enum
- [ ] Actualizar `lib/permissions.ts` - route permissions
- [ ] Actualizar `app/(dashboard)/layout.tsx` - navigation roles
- [ ] Actualizar `hooks/useInstitutionContext.ts` - helpers
- [ ] Actualizar `app/super-admin/usuarios/components/MembershipsTab.tsx` - labels y colors
- [ ] Revisar `app/(dashboard)/usuarios/page.tsx`
- [ ] Revisar `lib/turnos/helpers.ts`
- [ ] Revisar `lib/supabase/helpers.ts`
- [ ] Ejecutar búsquedas de referencias hardcodeadas
- [ ] Testing manual: verificar que usuarios profesional/servicio ven sus datos
- [ ] Testing manual: verificar que admins ven todos los datos

---

## ⚠️ NOTAS IMPORTANTES

### Sobre la Lógica de Filtrado:

1. **Usuarios `profesional`:**
   - Ver solo sus turnos
   - Filtro se realiza usando `user_professional_assignment`
   - NO es automático por rol, necesita la tabla de asignaciones

2. **Usuarios `servicio`:**
   - Ver solo sus turnos
   - Filtro se realiza usando `user_service_assignment`
   - NO es automático por rol, necesita la tabla de asignaciones

3. **Usuarios `admin`/`administrativo`:**
   - Ven todos los turnos de su institución (o todas si super_admin)
   - NO necesitan registros en assignment tables

### Sobre Backward Compatibility:

Los helpers `isMedico` y `isEnfermeria` en `useInstitutionContext.ts` se mantienen mapeados a los nuevos valores para facilitar la migration gradual. Si hay código que los usa, seguirá funcionando.

---

## 🎯 PRÓXIMOS PASOS

1. Ejecutar las 3 Fases de SQL en Supabase (en orden)
2. Implementar los cambios TypeScript listados arriba
3. Testing manual:
   - Login como `admin@evita.com` - debe funcionar igual
   - Login como `medico@evita.com` - ahora es `profesional`, debe ver sus asignaciones
   - Login como `enfermero@evita.com` - ahora es `servicio`, debe ver sus asignaciones
4. Verificar que no hay errores de TypeScript
5. Verificar que las RLS policies funcionan correctamente

---

*Documento preparado para la implementación de Phase 3*
