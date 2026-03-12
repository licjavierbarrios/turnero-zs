# Sistema de Permisos (RBAC)

Este documento describe el sistema de control de acceso basado en roles (Role-Based Access Control - RBAC) implementado en el sistema Turnero ZS.

## Roles del Sistema

El sistema define 5 roles de usuario:

1. **admin** - Administrador del sistema
2. **administrativo** - Personal administrativo
3. **medico** - Profesionales médicos
4. **enfermeria** - Personal de enfermería
5. **pantalla** - Operadores de pantalla pública (solo acceso a pantallas)

## Matriz de Permisos por Ruta

| Ruta | admin | administrativo | medico | enfermeria | pantalla |
|------|-------|----------------|--------|------------|----------|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/turnos` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/agenda` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/profesionales` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/servicios` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/consultorios` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/reportes` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/configuracion` | ✅ | ❌ | ❌ | ❌ | ❌ |

## Descripción de Permisos por Rol

### Admin (Administrador)
**Acceso completo** a todas las funcionalidades del sistema:
- ✅ Dashboard - Vista general
- ✅ Turnos - Gestión completa de turnos
- ✅ Agenda - Programación de horarios
- ✅ Profesionales - ABM de profesionales
- ✅ Servicios - ABM de servicios médicos
- ✅ Consultorios - ABM de consultorios/salas
- ✅ Reportes - Visualización de estadísticas
- ✅ Configuración - Configuración del sistema (TTS, etc.)

### Administrativo
**Acceso operativo** para gestión diaria de turnos:
- ✅ Dashboard - Vista general
- ✅ Turnos - Gestión de turnos (llamar pacientes, cambiar estados)
- ✅ Agenda - Ver y gestionar horarios
- ✅ Reportes - Ver estadísticas de atención
- ❌ No puede crear/modificar: profesionales, servicios, consultorios
- ❌ No puede modificar configuraciones del sistema

### Médico
**Acceso limitado** para consulta de agenda:
- ✅ Dashboard - Vista general
- ✅ Agenda - Ver su propia agenda de pacientes
- ❌ No puede gestionar turnos directamente
- ❌ No puede acceder a configuraciones administrativas

### Enfermería
**Acceso mínimo** solo para vista general:
- ✅ Dashboard - Vista general de turnos del día
- ❌ No puede gestionar turnos
- ❌ No puede modificar configuraciones
- ❌ Acceso muy limitado

**Nota**: Este rol necesita revisión - probablemente necesite más permisos para gestionar llamados en su servicio específico.

### Pantalla
**Sin acceso al dashboard**:
- ❌ No tiene acceso a ninguna ruta del dashboard
- ✅ Solo puede acceder a `/pantalla/[slug]` (pantallas públicas)

## Implementación Técnica

### 1. Archivo de Configuración
**Ubicación**: `lib/permissions.ts`

Define el mapa de permisos:
```typescript
export const routePermissions: Record<string, UserRole[]> = {
  '/dashboard': ['admin', 'administrativo', 'medico', 'enfermeria'],
  '/turnos': ['admin', 'administrativo'],
  // ...
}
```

### 2. Hook de Verificación
**Ubicación**: `hooks/use-permissions.ts`

Hook personalizado para proteger rutas:
```typescript
const { hasAccess, loading } = useRequirePermission('/configuracion')
```

Automáticamente:
- Verifica permisos del usuario actual
- Redirige a `/dashboard` si no tiene acceso
- Muestra loading mientras verifica

### 3. Filtrado de Navegación
**Ubicación**: `app/(dashboard)/layout.tsx`

El menú lateral se filtra automáticamente:
```typescript
const allowedNavigation = navigation.filter(item =>
  item.roles.includes(institutionContext.user_role)
)
```

## Cómo Proteger una Página

### Paso 1: Importar el hook
```typescript
import { useRequirePermission } from '@/hooks/use-permissions'
```

### Paso 2: Usar el hook en el componente
```typescript
export default function MiPagina() {
  const { hasAccess, loading } = useRequirePermission('/mi-ruta')

  if (loading) {
    return <LoadingSpinner />
  }

  if (!hasAccess) {
    return null // El hook ya redirigió
  }

  // Resto del componente...
}
```

### Paso 3: Definir permisos en lib/permissions.ts
```typescript
export const routePermissions: Record<string, UserRole[]> = {
  // ...
  '/mi-ruta': ['admin', 'administrativo'], // Roles permitidos
}
```

## Seguridad

### Defensa en Profundidad
1. **Frontend**: Ocultar opciones del menú según rol
2. **Frontend**: Verificar permisos antes de renderizar páginas
3. **Backend**: RLS (Row Level Security) en Supabase para proteger datos

### Principio de Privilegio Mínimo
- Cada rol tiene solo los permisos estrictamente necesarios
- Rutas no definidas = acceso denegado por defecto
- Logs de intentos de acceso no autorizados

## Mejoras Futuras

1. **Permisos granulares**: En lugar de solo rutas, permisos específicos (ej: "can_edit_appointments")
2. **Permisos dinámicos**: Almacenar permisos en BD para mayor flexibilidad
3. **Auditoría**: Log completo de accesos y cambios por usuario
4. **Super Admin**: Rol especial con acceso cross-institución
5. **Permisos de servicio**: Enfermería solo puede ver/llamar pacientes de su servicio

## Testing

Para probar permisos:

1. **Como Admin**: Debe ver todas las opciones del menú
2. **Como Administrativo**: Debe ver Dashboard, Turnos, Agenda, Reportes
3. **Como Médico**: Debe ver solo Dashboard y Agenda
4. **Como Enfermería**: Debe ver solo Dashboard
5. **Acceso directo por URL**: Intentar acceder a `/configuracion` como no-admin debe redirigir

## Preguntas Frecuentes

### ¿Por qué enfermería tiene tan pocos permisos?
Este es un punto de mejora. Probablemente enfermería necesite poder:
- Llamar pacientes de su servicio específico
- Ver cola de su servicio
- Gestionar estados básicos (presente/ausente)

### ¿Cómo agrego un nuevo rol?
1. Agregar el rol al tipo `UserRole` en `lib/permissions.ts`
2. Agregar casos en `getRoleLabel()` y `getRoleColor()` en el layout
3. Definir permisos en `routePermissions`
4. Actualizar esta documentación

### ¿Qué pasa si intento acceder directamente por URL?
El hook `useRequirePermission` verificará tus permisos y te redirigirá automáticamente a `/dashboard` si no tienes acceso. Se registrará un warning en la consola.
