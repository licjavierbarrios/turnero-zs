# Página 403 - Acceso Denegado

## Descripción

Página personalizada que se muestra cuando un usuario intenta acceder a una ruta para la cual no tiene permisos según su rol.

## Ubicación

`app/forbidden/page.tsx`

## Características

### 1. **Información Contextual**
La página muestra información detallada sobre por qué se denegó el acceso:

- **Rol actual del usuario**: Muestra el rol con el que está autenticado
- **Página solicitada**: Indica qué página intentó acceder
- **Roles requeridos**: Lista los roles que tienen permiso para esa página

### 2. **Navegación Inteligente**
Proporciona opciones de navegación útiles:

- **Lista de páginas permitidas**: Muestra todas las páginas a las que el usuario SÍ puede acceder con enlaces directos
- **Botón "Volver Atrás"**: Regresa a la página anterior
- **Botón "Ir al Dashboard"**: Navegación rápida al dashboard principal

### 3. **Ayuda al Usuario**
Incluye un mensaje de ayuda que explica cómo solicitar permisos adicionales contactando al administrador.

### 4. **Diseño Profesional**
- Diseño limpio y profesional con gradiente de fondo
- Iconos visuales claros (ShieldXIcon)
- Separación visual por colores:
  - **Rojo**: Información del error (acceso denegado)
  - **Verde**: Páginas permitidas (acciones disponibles)
  - **Azul**: Información de ayuda

## Integración con el Sistema de Permisos

### Hook `useRequirePermission`

El hook fue modificado para redirigir a esta página en lugar de al dashboard:

```typescript
// hooks/use-permissions.ts (líneas 34-39)
if (!permitted) {
  console.warn(`Usuario con rol ${userRole} intentó acceder a ${route} sin permiso`)
  router.push(`/forbidden?route=${encodeURIComponent(route)}`)
  return
}
```

### Parámetro de Query String

La página recibe la ruta intentada como parámetro:
- URL: `/forbidden?route=/profesionales`
- La página decodifica y muestra esta información

## Nombres Traducidos

La página incluye mapeos para mostrar nombres legibles en español:

### Roles
```typescript
const roleNames: Record<UserRole, string> = {
  admin: 'Administrador',
  administrativo: 'Administrativo',
  medico: 'Médico',
  enfermeria: 'Enfermería',
  pantalla: 'Pantalla Pública',
}
```

### Rutas
```typescript
const routeNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/turnos': 'Gestión de Turnos',
  '/agenda': 'Agenda',
  '/asignaciones': 'Asignaciones de Profesionales',
  '/profesionales': 'Gestión de Profesionales',
  '/servicios': 'Gestión de Servicios',
  '/consultorios': 'Gestión de Consultorios',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración del Sistema',
}
```

## Flujo de Usuario

### Ejemplo: Usuario con rol "Enfermería" intenta acceder a `/profesionales`

1. **Detección**: El hook `useRequirePermission` detecta que "enfermeria" no está en la lista de roles permitidos para `/profesionales`

2. **Redirección**: Redirige a `/forbidden?route=/profesionales`

3. **Página 403 muestra**:
   - ❌ **Tu rol actual**: Enfermería
   - 📄 **Página solicitada**: Gestión de Profesionales
   - 👥 **Roles requeridos**: Administrador
   - ✅ **Páginas permitidas**: Dashboard (con enlace clickeable)
   - 💡 **Ayuda**: Mensaje sobre cómo solicitar permisos

4. **Opciones del usuario**:
   - Hacer clic en "Dashboard" para ir a una página permitida
   - Hacer clic en "Volver Atrás" para regresar
   - Hacer clic en "Ir al Dashboard" (botón principal)

## Beneficios sobre la Implementación Anterior

### Antes (solo redirección)
- Usuario es redirigido al dashboard sin explicación
- No sabe por qué no puede acceder
- No sabe qué páginas puede usar
- Experiencia confusa y frustrante

### Ahora (página 403 personalizada)
- Mensaje claro sobre por qué se denegó el acceso
- Información sobre su rol y permisos
- Lista de páginas alternativas disponibles
- Guía sobre cómo solicitar más permisos
- Experiencia transparente y educativa

## Casos de Uso

### 1. Acceso Directo por URL
Usuario escribe o copia una URL prohibida en el navegador:
```
https://turnero.com/configuracion
```
→ Es redirigido a `/forbidden?route=/configuracion` con toda la información

### 2. Link Compartido
Alguien comparte un link a una página administrativa con un usuario de menor nivel:
```
https://turnero.com/profesionales
```
→ Ve la página 403 explicando que necesita rol "admin"

### 3. Cambio de Rol
Usuario solía tener permisos pero su rol fue cambiado:
- Ve qué páginas aún puede usar
- Sabe exactamente qué rol necesita para recuperar acceso

## Testing Recomendado

### Prueba Manual

1. **Como Administrativo** (solo puede acceder a Dashboard, Turnos, Agenda, Reportes):
   ```
   ✅ /dashboard → Permite acceso
   ✅ /turnos → Permite acceso
   ❌ /profesionales → Muestra página 403
   ❌ /configuracion → Muestra página 403
   ```

2. **Como Médico** (solo puede acceder a Dashboard, Agenda):
   ```
   ✅ /dashboard → Permite acceso
   ✅ /agenda → Permite acceso
   ❌ /turnos → Muestra página 403 (lista: Dashboard, Agenda)
   ❌ /profesionales → Muestra página 403
   ```

3. **Como Enfermería** (solo puede acceder a Dashboard):
   ```
   ✅ /dashboard → Permite acceso
   ❌ /agenda → Muestra página 403 (lista: Dashboard)
   ❌ /turnos → Muestra página 403
   ❌ /profesionales → Muestra página 403
   ```

### Verificación de UX

- [ ] El mensaje es claro y no técnico
- [ ] Los enlaces a páginas permitidas funcionan
- [ ] El botón "Volver Atrás" funciona correctamente
- [ ] El botón "Ir al Dashboard" redirige bien
- [ ] Los colores ayudan a distinguir información vs acciones
- [ ] La página es responsive (mobile, tablet, desktop)

## Mantenimiento

### Agregar una Nueva Ruta

Cuando se agregue una nueva ruta protegida, actualizar:

1. **`lib/permissions.ts`**: Agregar ruta a `routePermissions`
2. **`app/forbidden/page.tsx`**: Agregar nombre traducido a `routeNames`

Ejemplo:
```typescript
// lib/permissions.ts
export const routePermissions: Record<string, UserRole[]> = {
  // ... existentes ...
  '/nueva-ruta': ['admin', 'administrativo'],
}

// app/forbidden/page.tsx
const routeNames: Record<string, string> = {
  // ... existentes ...
  '/nueva-ruta': 'Nueva Funcionalidad',
}
```

### Personalizar Mensajes

Para cambiar los mensajes de ayuda, editar el contenido del `Alert` azul en `app/forbidden/page.tsx`:

```typescript
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h3 className="font-semibold text-blue-900 mb-2">
    {/* Título personalizado */}
  </h3>
  <p className="text-blue-800 text-sm">
    {/* Mensaje personalizado */}
  </p>
</div>
```

## Archivos Relacionados

- `app/forbidden/page.tsx` - Página principal 403
- `hooks/use-permissions.ts` - Hook de verificación de permisos
- `lib/permissions.ts` - Sistema central de permisos RBAC
- `docs/PERMISSIONS.md` - Documentación completa del sistema RBAC

## Próximas Mejoras (Futuro)

- [ ] **Logging**: Guardar intentos de acceso no autorizados en base de datos
- [ ] **Dashboard de auditoría**: Panel para admins con estadísticas de accesos denegados
- [ ] **Solicitud de permisos**: Botón para enviar solicitud automática al admin
- [ ] **Temas**: Soporte para modo oscuro
- [ ] **Animaciones**: Transiciones suaves al cargar la página
- [ ] **i18n**: Soporte multiidioma si se expande el sistema

---

**Fecha de Implementación**: 15 de Octubre 2025
**Implementado por**: Claude Code
**Estado**: ✅ Completado y funcional
