# Sistema de Autenticación y Superusuario

## Estado Actual ✅

### Implementado
- ✅ **Login básico** con usuarios demo
- ✅ **Selección de instituciones** multi-institucional
- ✅ **Contexto institucional** persistente
- ✅ **Sidebar dinámico** con información de usuario e institución
- ✅ **Logout** desde sidebar
- ✅ **Protección de rutas** - redirección automática si no autenticado
- ✅ **Dashboard funcional** con estadísticas demo
- ✅ **Agenda robusta** que maneja datos vacíos sin romperse

### Arquitectura Actual
```
/ (login) → /institutions/select → /dashboard (+ todas las rutas protegidas)
```

## Próximos Pasos 🚧

### Sprint 5.1 - Infraestructura de Superusuario

#### 1. **Limpiar Base de Datos**
- [ ] Script para resetear todas las tablas
- [ ] Mantener solo la estructura (schema + RLS)
- [ ] Documentar proceso de limpieza

#### 2. **Sistema de Roles Mejorado**
- [ ] Crear rol `superadmin` en el sistema
- [ ] Distinguir entre usuarios normales y superusuario
- [ ] Actualizar RLS para permitir acceso total al superusuario

#### 3. **Usuario Superusuario**
- [ ] Crear usuario superadmin en Supabase Auth
- [ ] Configurar acceso sin restricciones institucionales
- [ ] Panel de administración especial para superusuario

### Sprint 5.2 - Panel de Superadministración

#### 4. **Rutas de Superadmin**
```
/superadmin/
├── dashboard/          # Vista general del sistema
├── zonas/             # Gestión de zonas geográficas
├── instituciones/     # Gestión de instituciones
├── usuarios/          # Gestión de usuarios del sistema
├── memberships/       # Asignación usuarios → instituciones
└── configuracion/     # Configuración general
```

#### 5. **Gestión de Zonas**
- [ ] CRUD completo de zonas geográficas
- [ ] Validación de nombres únicos
- [ ] Vista de instituciones por zona

#### 6. **Gestión de Instituciones**
- [ ] CRUD completo de instituciones
- [ ] Asignación a zonas
- [ ] Tipos: CAPS, Hospital Seccional, Distrital, Regional
- [ ] Vista de usuarios por institución

#### 7. **Gestión de Usuarios**
- [ ] Lista de todos los usuarios del sistema
- [ ] Crear usuarios con email/password
- [ ] Activar/desactivar usuarios
- [ ] Resetear contraseñas

#### 8. **Gestión de Membresías**
- [ ] Interfaz para asignar usuarios a instituciones
- [ ] Definir roles por institución (admin, medico, enfermeria, etc.)
- [ ] Vista matricial: usuario × institución × rol
- [ ] Validaciones de permisos

### Sprint 5.3 - Flujo de Configuración Inicial

#### 9. **Onboarding del Sistema**
- [ ] Wizard de configuración inicial
- [ ] Creación de primera zona
- [ ] Creación de primera institución
- [ ] Creación de primer usuario administrativo

#### 10. **Flujo Completo**
```
1. Superusuario → Crear zonas
2. Superusuario → Crear instituciones en zonas
3. Superusuario → Crear usuarios del sistema
4. Superusuario → Asignar usuarios a instituciones con roles
5. Usuarios normales → Login y trabajo institucional
```

## Estructura de Roles 👥

### Superusuario (Sistema)
- **Email**: `superadmin@turnero-zs.com`
- **Acceso**: Todas las instituciones y datos
- **Funciones**:
  - Configuración inicial del sistema
  - Gestión de zonas e instituciones
  - Gestión de usuarios y membresías
  - Configuración general

### Administrador Institucional
- **Acceso**: Una o varias instituciones específicas
- **Funciones**:
  - Gestión completa de su(s) institución(es)
  - Configurar profesionales, servicios, horarios
  - Gestionar turnos y pacientes
  - Ver reportes de su institución

### Usuario Operativo
- **Acceso**: Una institución específica con rol limitado
- **Funciones**:
  - Según rol: médico, enfermería, administrativo
  - Operaciones del día a día
  - Sin acceso a configuración

## Implementación Técnica 🔧

### Base de Datos
```sql
-- Nueva tabla para distinguir superusuarios
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  is_superadmin boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- RLS para superusuarios
CREATE POLICY "Superadmins bypass all restrictions"
ON [table_name] FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_superadmin = true
  )
);
```

### Rutas Protegidas
```typescript
// Middleware para rutas de superadmin
function requireSuperAdmin() {
  // Verificar que el usuario tenga is_superadmin = true
  // Redirigir a dashboard normal si no es superadmin
}
```

### UI/UX
- **Indicador visual** cuando se está en modo superadmin
- **Navegación separada** para funciones de sistema vs institucionales
- **Confirmaciones** para acciones críticas (reset, eliminación)

## Validaciones y Seguridad 🔒

### Controles de Acceso
- [ ] Solo superusuarios pueden acceder a `/superadmin/*`
- [ ] Doble confirmación para operaciones destructivas
- [ ] Audit log de acciones de superusuario
- [ ] Backup automático antes de resets

### Validaciones de Negocio
- [ ] No eliminar zonas con instituciones activas
- [ ] No eliminar instituciones con usuarios asignados
- [ ] Validar email único por usuario
- [ ] Validar permisos de membresía coherentes

## Cronograma 📅

### Semana 1: Infraestructura
- Limpiar BD y crear sistema de roles mejorado
- Implementar usuario superusuario básico

### Semana 2: Panel de Administración
- Crear rutas y UI para gestión de zonas/instituciones
- Implementar CRUD de usuarios y membresías

### Semana 3: Integración y Testing
- Integrar con sistema existente
- Testing completo del flujo
- Documentación de uso

### Entregable Final
Sistema completo de gestión multi-institucional con:
- Superusuario para configuración inicial
- Usuarios operativos por institución
- Flujo completo desde setup hasta operación diaria