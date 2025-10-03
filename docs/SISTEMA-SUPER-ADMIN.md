# Sistema de Super Admin - Turnero ZS

**Fecha de Diseño**: 2025-10-03
**Estado**: Diseño Aprobado - Pendiente Implementación

---

## Problema Identificado

El sistema actual no tiene una jerarquía clara de permisos para la carga inicial de datos. Las entidades base (Zonas Sanitarias e Instituciones) no deberían ser gestionadas por administradores de instituciones individuales, sino por un **Super Administrador del Sistema** que tiene visión y control global.

### Situación Actual (Incorrecta)
```
❌ Todos los usuarios con rol 'admin' pueden crear zonas e instituciones
❌ No hay separación entre administración del sistema vs administración institucional
❌ Riesgo de datos inconsistentes o duplicados
❌ No hay un flujo claro de onboarding inicial
```

---

## Solución: Jerarquía de Roles con Super Admin

### Pirámide de Permisos

```
┌─────────────────────────────────────────────┐
│         SUPER ADMIN                         │
│    (Administrador del Sistema)              │
│                                             │
│  • Gestiona Zonas Sanitarias                │
│  • Gestiona Instituciones                   │
│  • Crea primer admin por institución        │
│  • Visión global del sistema                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         ADMIN                               │
│    (Administrador de Institución)           │
│                                             │
│  • Gestiona SU institución únicamente       │
│  • Crea usuarios (profesionales, admin,    │
│    enfermería, pantalla)                    │
│  • Gestiona consultorios y servicios        │
│  • Configura horarios y agendas             │
│  • Ve reportes de su institución            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         ADMINISTRATIVO                      │
│    (Personal de Mostrador)                  │
│                                             │
│  • Gestiona turnos                          │
│  • Registra y busca pacientes               │
│  • Confirma asistencias                     │
│  • NO gestiona usuarios ni configuración    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│    MÉDICO / ENFERMERÍA / PANTALLA           │
│    (Usuarios Operativos)                    │
│                                             │
│  • Médico: Atiende pacientes, llama turnos  │
│  • Enfermería: Gestión de sala de espera    │
│  • Pantalla: Solo lectura para displays     │
└─────────────────────────────────────────────┘
```

---

## Roles Redefinidos

### 1. 🔴 Super Admin (NUEVO)
**Rol en DB**: `super_admin`
**Alcance**: Todo el sistema (multi-zona, multi-institución)

#### Permisos:
- ✅ **CRUD Zonas Sanitarias** (crear, editar, eliminar, listar todas)
- ✅ **CRUD Instituciones** (crear, editar, eliminar, listar todas)
- ✅ **Crear primer usuario admin** para cada institución
- ✅ **Ver métricas globales** del sistema
- ✅ **Impersonar admin de institución** para debugging (opcional)
- ❌ **NO gestiona turnos** ni operaciones diarias de instituciones

#### Rutas exclusivas:
```
/super-admin/zonas              # Gestión de zonas
/super-admin/instituciones      # Gestión de instituciones
/super-admin/usuarios           # Ver todos los usuarios del sistema
/super-admin/metricas           # Dashboard global
```

#### Características:
- **Cantidad**: 1 super admin (puede expandirse a 2-3 para equipo de IT)
- **Creación**: Vía SQL directo en `db/authentication-setup.sql`
- **Login**: Mismo sistema de autenticación, pero con rol especial
- **UI**: Rutas separadas bajo `/super-admin/*`

---

### 2. 🟡 Admin (MODIFICADO)
**Rol en DB**: `admin`
**Alcance**: Una institución específica (definida por membresía)

#### Permisos:
- ✅ **CRUD Usuarios** de su institución (crear médicos, administrativos, enfermería, pantalla)
- ✅ **CRUD Consultorios** de su institución
- ✅ **CRUD Servicios** de su institución
- ✅ **CRUD Profesionales** de su institución
- ✅ **Configurar horarios** de profesionales
- ✅ **Ver reportes** de su institución
- ✅ **Gestionar pacientes** (opcional, puede delegarse)
- ❌ **NO puede ver/modificar** otras instituciones
- ❌ **NO puede crear** zonas ni instituciones

#### Rutas:
```
/dashboard/usuarios             # Solo usuarios de su institución
/dashboard/consultorios         # Solo consultorios de su institución
/dashboard/servicios            # Solo servicios de su institución
/dashboard/profesionales        # Solo profesionales de su institución
/dashboard/horarios             # Solo horarios de su institución
/dashboard/reportes             # Solo reportes de su institución
```

#### Características:
- **Cantidad**: 1+ por institución
- **Creación**: Por super admin (primero) o por otro admin de la misma institución
- **Aislamiento**: RLS garantiza que solo ve datos de su institución

---

### 3. 🟢 Administrativo (SIN CAMBIOS)
**Rol en DB**: `administrativo`
**Alcance**: Una institución específica

#### Permisos:
- ✅ **CRUD Turnos**
- ✅ **CRUD Pacientes**
- ✅ **Confirmar asistencias**
- ✅ **Buscar turnos**
- ❌ **NO gestiona usuarios** ni configuración

---

### 4-6. Médico, Enfermería, Pantalla (SIN CAMBIOS)
**Roles en DB**: `medico`, `enfermeria`, `pantalla`
**Sin modificaciones** respecto al diseño actual

---

## Flujo de Onboarding del Sistema

### Fase 1: Inicialización del Sistema (Una sola vez)

```sql
-- Ejecutar db/authentication-setup.sql
-- Crea el primer super_admin:
--   Email: superadmin@turnero-zs.gob.ar
--   Password: (generado seguro, cambiar en primer login)
```

### Fase 2: Super Admin Configura el Sistema

#### Paso 1: Super Admin se loguea
```
1. Navega a /login
2. Ingresa credenciales de super_admin
3. Es redirigido a /super-admin/zonas
```

#### Paso 2: Crea Zonas Sanitarias
```
Ejemplo:
- Zona Norte
- Zona Sur
- Zona Este
- Zona Oeste
- Zona Centro
```

#### Paso 3: Crea Instituciones por Zona
```
Ejemplo en Zona Norte:
- CAPS Villa María (tipo: caps)
- CAPS Barrio Nuevo (tipo: caps)
- Hospital Seccional Norte (tipo: hospital_seccional)
```

#### Paso 4: Crea Primer Admin por Institución
```
Para CAPS Villa María:
- Email: admin.villamaria@salud.gob.ar
- Nombre: Juan Pérez
- Rol: admin
- Institución: CAPS Villa María
```

### Fase 3: Admin de Institución Configura su CAPS/Hospital

#### Paso 1: Admin de Institución se loguea
```
1. Juan Pérez recibe email con credenciales
2. Se loguea en /login
3. Es redirigido a /dashboard (solo ve CAPS Villa María)
```

#### Paso 2: Configura Infraestructura
```
1. Crea Consultorios:
   - Consultorio 1 (Planta Baja)
   - Consultorio 2 (Planta Baja)
   - Consultorio 3 (Primer Piso)

2. Crea Servicios:
   - Clínica Médica (duración: 20 min)
   - Pediatría (duración: 30 min)
   - Enfermería (duración: 15 min)
```

#### Paso 3: Carga Profesionales
```
1. Registra profesionales:
   - Dra. María García (Clínica Médica, matrícula: 12345)
   - Dr. Carlos López (Pediatría, matrícula: 67890)
   - Enf. Ana Martínez (Enfermería, matrícula: 11111)
```

#### Paso 4: Crea Usuarios Operativos
```
1. Crea cuenta para Dra. García:
   - Email: garcia@salud.gob.ar
   - Rol: medico
   - Vincula con profesional_id de Dra. García

2. Crea usuarios administrativos:
   - Email: mostrador@villamaria.gob.ar
   - Rol: administrativo

3. Crea usuario de pantalla:
   - Email: pantalla@villamaria.gob.ar
   - Rol: pantalla
```

#### Paso 5: Configura Horarios y Agenda
```
1. Define horarios de Dra. García:
   - Lunes a Viernes: 8:00 - 12:00
   - Slots cada 20 minutos

2. Sistema genera automáticamente slots disponibles
```

### Fase 4: Operación Diaria (Sistema Listo)

```
1. Administrativo (mostrador):
   - Registra pacientes nuevos
   - Asigna turnos
   - Confirma asistencias

2. Médico (consultorio):
   - Llama pacientes desde su panel
   - Atiende consultas
   - Marca turnos como finalizados

3. Pantalla Pública:
   - Muestra turnos en espera
   - Muestra llamados en tiempo real
```

---

## Decisiones de Diseño Aprobadas

### Decisión 1: Cantidad de Super Admins
**Opción Elegida**: **A - Uno solo (puede expandirse a 2-3 para equipo de IT)**

**Justificación**:
- Mayor seguridad y control
- Menos superficie de ataque
- Responsabilidad clara
- Posibilidad de expandir si crece el sistema

**Implementación**:
```sql
-- Un solo super_admin inicial en authentication-setup.sql
-- Si se necesitan más, el primer super_admin puede crearlos manualmente
```

---

### Decisión 2: Super Admin puede impersonar Admin
**Opción Elegida**: **B - Sí, puede impersonar para debugging**

**Justificación**:
- Esencial para soporte técnico
- Permite debugging sin pedir credenciales
- Útil para capacitaciones y demos
- Implementable con seguridad (logs de auditoría)

**Implementación**:
```typescript
// Super admin puede cambiar temporalmente su contexto a una institución
// Se registra en audit_log
// UI muestra banner: "Modo Impersonación: CAPS Villa María"
```

---

### Decisión 3: Creación del Super Admin
**Opción Elegida**: **A - SQL directo en `authentication-setup.sql`**

**Justificación**:
- Más seguro (no hay UI expuesta)
- Evita vulnerabilidad de "primer registro"
- Control total sobre credenciales iniciales
- Proceso documentado y reproducible

**Implementación**:
```sql
-- db/authentication-setup.sql
-- Crea usuario en auth.users
-- Crea entrada en public.users con rol super_admin
-- Genera password seguro que debe cambiarse en primer login
```

---

### Decisión 4: Rutas del Super Admin
**Opción Elegida**: **A - Rutas separadas `/super-admin/*`**

**Justificación**:
- Separación clara de responsabilidades
- Más fácil proteger con middleware
- Evita confusión en la UI
- Permite diseño optimizado para tareas de super admin

**Implementación**:
```
app/
├── (dashboard)/              # Rutas de usuarios institucionales
│   ├── turnos/
│   ├── pacientes/
│   └── ...
└── (super-admin)/            # Rutas exclusivas de super admin
    ├── zonas/
    ├── instituciones/
    ├── usuarios/             # Ver TODOS los usuarios
    └── metricas/             # Dashboard global
```

---

## Cambios Requeridos en el Código

### 1. Base de Datos

#### `db/schema.sql`
```sql
-- Modificar enum de roles
CREATE TYPE user_role AS ENUM (
  'super_admin',  -- NUEVO
  'admin',
  'administrativo',
  'medico',
  'enfermeria',
  'pantalla'
);
```

#### `db/authentication-setup.sql` (nuevo archivo o modificar existente)
```sql
-- Crear primer super_admin del sistema
-- Email: superadmin@turnero-zs.gob.ar
-- Password: (generado, debe cambiarse en primer login)
-- NO tiene membresía institucional (acceso global)
```

#### RLS Policies
```sql
-- NUEVA: Super admin puede todo
CREATE POLICY "super_admin_all_access" ON zones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- MODIFICADA: Admin solo su institución
CREATE POLICY "admin_own_institution" ON institutions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN users u ON u.id = m.user_id
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND m.institution_id = institutions.id
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );
```

---

### 2. Frontend

#### Nuevas Rutas
```
app/
├── (super-admin)/
│   ├── layout.tsx                    # Layout con navbar especial
│   ├── zonas/
│   │   └── page.tsx                  # CRUD Zonas (solo super_admin)
│   ├── instituciones/
│   │   └── page.tsx                  # CRUD Instituciones (solo super_admin)
│   ├── usuarios/
│   │   └── page.tsx                  # Ver TODOS los usuarios
│   └── metricas/
│       └── page.tsx                  # Dashboard global del sistema
```

#### Middleware de Protección
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rutas /super-admin/* solo para super_admin
  if (path.startsWith('/super-admin')) {
    const user = await getUser();
    if (user.role !== 'super_admin') {
      return NextResponse.redirect('/dashboard');
    }
  }

  // Resto de lógica...
}
```

#### Componente de Impersonación (opcional)
```typescript
// components/ImpersonationBanner.tsx
// Muestra banner cuando super_admin está impersonando
// Permite volver al modo super_admin
```

---

### 3. Modificaciones a Rutas Existentes

#### `app/(dashboard)/zonas/page.tsx`
```typescript
// ELIMINAR o MOVER a /super-admin/zonas/page.tsx
// Los admins de institución NO deberían ver esta página
```

#### `app/(dashboard)/instituciones/page.tsx`
```typescript
// ELIMINAR o MOVER a /super-admin/instituciones/page.tsx
// Los admins de institución NO deberían ver esta página
```

#### `app/(dashboard)/usuarios/page.tsx`
```typescript
// MODIFICAR: Filtrar solo usuarios de la institución del admin
// Super admin ve esta misma página pero sin filtros (ve todos)
```

---

## Matriz de Permisos Completa

| Entidad/Acción | Super Admin | Admin | Administrativo | Médico | Enfermería | Pantalla |
|----------------|-------------|-------|----------------|--------|------------|----------|
| **Zonas** | CRUD | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Instituciones** | CRUD | Read (solo suya) | Read (solo suya) | Read (solo suya) | Read (solo suya) | Read (solo suya) |
| **Usuarios** | CRUD (todos) | CRUD (su institución) | ❌ | ❌ | ❌ | ❌ |
| **Membresías** | CRUD (todas) | CRUD (su institución) | ❌ | ❌ | ❌ | ❌ |
| **Profesionales** | Read (todos) | CRUD (su institución) | Read (su institución) | Read (su institución) | Read (su institución) | Read (su institución) |
| **Consultorios** | Read (todos) | CRUD (su institución) | Read (su institución) | Read (su institución) | Read (su institución) | Read (su institución) |
| **Servicios** | Read (todos) | CRUD (su institución) | Read (su institución) | Read (su institución) | Read (su institución) | Read (su institución) |
| **Pacientes** | Read (todos) | CRUD (su institución) | CRUD (su institución) | Read (su institución) | Read (su institución) | ❌ |
| **Turnos** | Read (todos) | Read (su institución) | CRUD (su institución) | Read/Update (suyos) | Read (su institución) | ❌ |
| **Horarios** | Read (todos) | CRUD (su institución) | Read (su institución) | Read (suyos) | Read (su institución) | ❌ |
| **Reportes** | Ver globales | Ver (su institución) | Ver (su institución) | ❌ | ❌ | ❌ |
| **Pantalla Pública** | Ver todas | Ver (su institución) | ❌ | ❌ | ❌ | Ver (su institución) |

---

## Seguridad

### Principios de Seguridad Implementados

1. **Principio de Menor Privilegio**
   - Cada rol tiene solo los permisos necesarios
   - No hay permisos "heredados" innecesarios

2. **Separación de Responsabilidades**
   - Super admin: Sistema
   - Admin: Institución
   - Operativos: Tareas diarias

3. **Defense in Depth**
   - RLS en base de datos (primera línea)
   - Middleware en Next.js (segunda línea)
   - Validaciones en UI (tercera línea)

4. **Auditoría Completa**
   - Todas las acciones de super_admin se registran
   - Impersonación crea logs especiales
   - Trazabilidad completa

### Mitigación de Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Super admin comprometido | Password fuerte + 2FA (futuro), rotación de credenciales |
| Impersonación abusiva | Logs de auditoría, timeout automático, banner visible |
| Escalada de privilegios | RLS estricto, validación en múltiples capas |
| Creación no autorizada de super_admins | Solo vía SQL directo, sin UI expuesta |
| Cross-tenant data leak | RLS por institución, tests automatizados |

---

## Testing de Seguridad

### Tests Requeridos

```typescript
// tests/security/super-admin.test.ts

describe('Super Admin Security', () => {
  test('Super admin puede crear zonas', async () => {
    // Verificar CRUD de zonas
  });

  test('Admin NO puede crear zonas', async () => {
    // Debe fallar con 403
  });

  test('Super admin puede ver todas las instituciones', async () => {
    // Verificar acceso global
  });

  test('Admin solo ve su institución', async () => {
    // RLS debe filtrar
  });

  test('Impersonación crea audit log', async () => {
    // Verificar registro en audit_log
  });

  test('Rutas /super-admin protegidas', async () => {
    // Middleware debe redirigir no-super-admins
  });
});
```

---

## Migración desde Estado Actual

### Paso 1: Backup
```bash
# Backup completo de BD antes de cambios
npm run db:backup
```

### Paso 2: Aplicar Cambios de Schema
```sql
-- Agregar rol super_admin al enum
-- Requiere recrear el tipo (ver script de migración)
```

### Paso 3: Crear Super Admin
```sql
-- Ejecutar authentication-setup.sql
-- Crear primer super_admin
```

### Paso 4: Reasignar Permisos
```sql
-- Aplicar nuevas RLS policies
-- Verificar que admins actuales solo ven su institución
```

### Paso 5: Desplegar Frontend
```bash
# Nuevas rutas /super-admin/*
# Middleware de protección
npm run build
npm run deploy
```

### Paso 6: Verificación
```bash
# Ejecutar tests de seguridad
npm run test:security

# Verificar accesos manualmente
# - Super admin puede acceder a /super-admin/zonas
# - Admin es redirigido si intenta acceder
```

---

## Roadmap de Implementación

### Fase 1: Base de Datos (Día 1)
- [x] Diseño aprobado
- [ ] Modificar schema.sql (agregar super_admin al enum)
- [ ] Crear authentication-setup.sql
- [ ] Crear/modificar RLS policies
- [ ] Aplicar migration a Supabase
- [ ] Crear primer super_admin
- [ ] Testing de RLS

### Fase 2: Backend/Middleware (Día 2)
- [ ] Crear middleware de protección /super-admin/*
- [ ] Crear hook useRole() para validaciones
- [ ] Actualizar tipos TypeScript (Role enum)

### Fase 3: Rutas Super Admin (Días 3-4)
- [ ] Crear layout /super-admin
- [ ] Mover /zonas a /super-admin/zonas
- [ ] Mover /instituciones a /super-admin/instituciones
- [ ] Crear /super-admin/usuarios (vista global)
- [ ] Crear /super-admin/metricas (dashboard global)

### Fase 4: Modificar Rutas Existentes (Día 5)
- [ ] Modificar /dashboard/usuarios (filtrar por institución)
- [ ] Agregar checks de rol en todos los CRUDs
- [ ] Actualizar navegación según rol

### Fase 5: Features Opcionales (Día 6)
- [ ] Sistema de impersonación
- [ ] Banner de impersonación
- [ ] Audit logging mejorado

### Fase 6: Testing y Documentación (Día 7)
- [ ] Tests de seguridad
- [ ] Tests E2E de flujo completo
- [ ] Documentación de usuarios
- [ ] Video tutorial de onboarding

---

## Criterios de Éxito

### Funcionales
- ✅ Super admin puede crear zonas e instituciones
- ✅ Admin solo ve su institución
- ✅ Flujo de onboarding completo funciona
- ✅ RLS impide cross-tenant access

### Seguridad
- ✅ Tests de seguridad pasan al 100%
- ✅ No hay forma de escalar privilegios
- ✅ Audit logs registran todas las acciones críticas
- ✅ Middleware bloquea accesos no autorizados

### Usabilidad
- ✅ UI clara y separada por rol
- ✅ Flujo intuitivo para super admin
- ✅ Flujo intuitivo para admin de institución
- ✅ Mensajes de error claros

---

## FAQ

### ¿Qué pasa si se pierde la contraseña del super admin?
```
Opción 1: Reset manual vía SQL directo en BD
Opción 2: Crear segundo super_admin de emergencia (backdoor documentado)
Opción 3: Sistema de recovery email (implementar en futuro)
```

### ¿Puede haber múltiples super admins?
```
Sí, el primer super_admin puede crear más super_admins si es necesario.
Recomendación: Máximo 2-3 para equipo de IT.
```

### ¿Puede un admin de institución crear zonas?
```
No. Las zonas son de alcance sistema y solo el super_admin puede gestionarlas.
```

### ¿Puede un super_admin gestionar turnos?
```
Técnicamente sí (tiene acceso a todo), pero no es su rol.
Debería impersonar a un administrativo si necesita gestionar turnos.
```

### ¿Cómo se auditan las acciones de super_admin?
```
Todas las acciones se registran en audit_log con:
- user_id del super_admin
- action (create, update, delete)
- entity (zones, institutions, users)
- timestamp
- metadata (IP, detalles del cambio)
```

---

## Apéndices

### A. Script de Migración de Enum

```sql
-- migrations/add_super_admin_role.sql

BEGIN;

-- Crear nuevo tipo con super_admin
CREATE TYPE user_role_new AS ENUM (
  'super_admin',
  'admin',
  'administrativo',
  'medico',
  'enfermeria',
  'pantalla'
);

-- Migrar columnas
ALTER TABLE users
  ALTER COLUMN role TYPE user_role_new
  USING role::text::user_role_new;

ALTER TABLE memberships
  ALTER COLUMN role TYPE user_role_new
  USING role::text::user_role_new;

-- Eliminar tipo viejo
DROP TYPE user_role;

-- Renombrar nuevo tipo
ALTER TYPE user_role_new RENAME TO user_role;

COMMIT;
```

### B. Credenciales del Primer Super Admin

```sql
-- VALORES DE EJEMPLO - CAMBIAR EN PRODUCCIÓN
Email: superadmin@turnero-zs.gob.ar
Password: (generado automáticamente, ver logs de setup)
Nombre: Super Administrador
Apellido: Sistema

-- IMPORTANTE: Cambiar password en primer login
-- IMPORTANTE: Habilitar 2FA cuando esté disponible
```

### C. Checklist de Seguridad Post-Implementación

- [ ] Password del super admin fue cambiado desde el inicial
- [ ] Solo personas autorizadas conocen credenciales de super admin
- [ ] Audit logs están funcionando
- [ ] RLS policies fueron testeadas
- [ ] Middleware de rutas está activo
- [ ] Tests de penetración básicos pasaron
- [ ] Documentación de procedimientos de emergencia creada

---

**Documento aprobado para implementación**
**Próximo paso**: Implementar Fase 1 (Base de Datos)
