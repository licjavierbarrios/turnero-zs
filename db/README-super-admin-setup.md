# Guía de Configuración del Super Admin

## Resumen

Este documento describe cómo configurar el **Super Administrador del Sistema** en Turnero ZS. El super admin es el primer usuario del sistema y tiene acceso global para crear zonas sanitarias, instituciones y asignar administradores.

---

## Requisitos Previos

- Proyecto Supabase creado
- Acceso al Supabase Dashboard
- Acceso al SQL Editor de Supabase

---

## Pasos de Configuración

### 1️⃣ Aplicar Schema Base

**Ejecutar en SQL Editor de Supabase:**

```bash
# Ejecutar en orden:
1. db/schema.sql              # Schema completo con role_name que incluye 'super_admin'
2. db/migrations/001_add_super_admin_role.sql  # Migration (solo si ya existe un schema anterior)
```

**Verificar:**
```sql
-- Verificar que el enum tiene super_admin
SELECT enumlabel FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'role_name'
ORDER BY e.enumsortorder;

-- Debe mostrar:
-- super_admin
-- admin
-- administrativo
-- medico
-- enfermeria
-- pantalla
```

---

### 2️⃣ Crear Usuario Super Admin en Supabase Auth

**Opción A: Desde Supabase Dashboard (Recomendado)**

1. Ir a **Authentication** → **Users**
2. Click en **Add User** → **Create new user**
3. Completar:
   - **Email**: `superadmin@turnero-zs.gob.ar`
   - **Password**: Generar password seguro (anotar en lugar seguro)
   - **Auto Confirm User**: ✅ Activar (para evitar confirmación de email)
4. Click en **Create User**
5. **Anotar el UUID del usuario** (aparece en la columna UID)

**Opción B: Vía SQL**

```sql
-- Solo usar si no tienes acceso al Dashboard
-- NOTA: Reemplazar 'PASSWORD_SEGURO_AQUI' con un password real

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'superadmin@turnero-zs.gob.ar',
  crypt('PASSWORD_SEGURO_AQUI', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

---

### 3️⃣ Ejecutar Script de Configuración de Autenticación

**Ejecutar en SQL Editor:**

```sql
-- Ejecutar: db/authentication-setup.sql
-- Este script:
-- 1. Crea tablas user_profile y membership
-- 2. Crea zona e institución "Sistema" (ficticia para super admin)
-- 3. Crea perfil del super admin
-- 4. Crea membresía super_admin
-- 5. Configura RLS policies
```

**Verificar:**
```sql
-- Verificar que el super admin fue creado
SELECT
  up.first_name,
  up.last_name,
  au.email,
  m.role,
  m.is_active
FROM user_profile up
JOIN auth.users au ON au.id = up.id
JOIN membership m ON m.user_id = up.id
WHERE au.email = 'superadmin@turnero-zs.gob.ar';

-- Debe mostrar:
-- Super | Administrador | superadmin@turnero-zs.gob.ar | super_admin | true
```

---

### 4️⃣ Aplicar Políticas RLS con Super Admin

**Ejecutar en SQL Editor:**

```sql
-- Ejecutar: db/policies-super-admin.sql
-- Este script incluye todas las políticas RLS actualizadas
-- con soporte para super_admin
```

**Verificar políticas:**
```sql
-- Ver políticas de la tabla zone
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'zone';

-- Debe incluir:
-- "Only super_admin can manage zones"
-- "Users can view zones"
```

---

### 5️⃣ Primer Login del Super Admin

**En tu aplicación Next.js:**

1. Ir a `/login` (o la ruta de login de tu app)
2. Ingresar:
   - **Email**: `superadmin@turnero-zs.gob.ar`
   - **Password**: El password que generaste en el paso 2
3. Después de login exitoso:
   - **CAMBIAR EL PASSWORD** inmediatamente
   - Ir a `/super-admin/zonas` (cuando esté implementado el frontend)

---

## Verificación de Permisos

### Testear que Super Admin tiene acceso global

```sql
-- Simular sesión como super admin
-- Reemplazar 'SUPER_ADMIN_UUID' con el UUID real

SET LOCAL app.current_user_id = 'SUPER_ADMIN_UUID';

-- Test 1: Super admin puede ver todas las zonas (incluso si no hay ninguna)
SELECT * FROM zone;
-- Debe ejecutarse sin error

-- Test 2: Super admin puede crear una zona
INSERT INTO zone (name, description)
VALUES ('Zona Norte', 'Zona Sanitaria Norte')
RETURNING *;
-- Debe crear la zona exitosamente

-- Test 3: Super admin puede ver todas las instituciones
SELECT * FROM institution;
-- Debe ejecutarse sin error

-- Test 4: Super admin puede crear una institución
INSERT INTO institution (zone_id, name, type, address)
VALUES (
  (SELECT id FROM zone WHERE name = 'Zona Norte' LIMIT 1),
  'CAPS Villa María',
  'caps',
  'Calle Falsa 123'
)
RETURNING *;
-- Debe crear la institución exitosamente
```

### Testear que usuarios normales NO tienen acceso

```sql
-- Crear un usuario normal de prueba (admin de institución)
-- Este test simula que un admin intenta acceder a funciones de super_admin

SET LOCAL app.current_user_id = 'UUID_DE_ADMIN_NORMAL';

-- Test 1: Admin normal NO puede crear zonas
INSERT INTO zone (name, description)
VALUES ('Zona Sur', 'Zona Sanitaria Sur');
-- Debe fallar con error de RLS

-- Test 2: Admin normal solo ve zonas relacionadas a sus instituciones
SELECT * FROM zone;
-- Solo debe ver las zonas donde tiene instituciones asignadas
```

---

## Próximos Pasos (Flujo Completo)

Una vez configurado el super admin:

### 1. Super Admin crea la estructura del sistema

```
Super Admin loguea
   ↓
Crea Zonas Sanitarias:
   - Zona Norte
   - Zona Sur
   - Zona Este
   - Zona Oeste
   ↓
Crea Instituciones por Zona:
   - CAPS Villa María (Zona Norte)
   - Hospital Seccional Norte (Zona Norte)
   - CAPS Barrio Nuevo (Zona Sur)
   - etc.
```

### 2. Super Admin crea primer admin por institución

```
Para CAPS Villa María:
   ↓
Crea usuario admin:
   - Email: admin.villamaria@salud.gob.ar
   - Nombre: Juan Pérez
   - Rol: admin
   - Institución: CAPS Villa María
```

### 3. Admin de institución configura su CAPS

```
Juan Pérez loguea
   ↓
Solo ve CAPS Villa María (RLS lo aísla)
   ↓
Crea:
   - Consultorios (Consultorio 1, 2, 3)
   - Servicios (Clínica Médica, Pediatría)
   - Profesionales (Dra. García, Dr. López)
   - Usuarios operativos (médicos, administrativos, pantalla)
```

### 4. Sistema operativo

```
- Administrativos gestionan turnos
- Médicos atienden pacientes
- Pantalla pública muestra llamados
```

---

## Troubleshooting

### Error: "No se encontró el usuario superadmin@turnero-zs.gob.ar"

**Solución**: Primero debes crear el usuario en Supabase Auth (paso 2) antes de ejecutar `authentication-setup.sql`.

---

### Error: "duplicate key value violates unique constraint"

**Solución**: El super admin ya existe. Verificar:

```sql
SELECT * FROM user_profile WHERE first_name = 'Super';
SELECT * FROM membership WHERE role = 'super_admin';
```

---

### Error: "new row violates row-level security policy"

**Solución**: Las políticas RLS están bloqueando. Verificar:

1. El usuario tiene membresía con rol `super_admin`
2. Las políticas RLS de `policies-super-admin.sql` están aplicadas
3. La función `auth.is_super_admin()` existe

```sql
-- Verificar función
SELECT proname FROM pg_proc WHERE proname = 'is_super_admin';
```

---

### No puedo logear como super admin

**Verificar:**

1. Usuario creado en `auth.users`:
   ```sql
   SELECT email, email_confirmed_at, created_at
   FROM auth.users
   WHERE email = 'superadmin@turnero-zs.gob.ar';
   ```

2. Perfil creado en `user_profile`:
   ```sql
   SELECT * FROM user_profile
   WHERE id = (SELECT id FROM auth.users WHERE email = 'superadmin@turnero-zs.gob.ar');
   ```

3. Membresía creada:
   ```sql
   SELECT * FROM membership
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'superadmin@turnero-zs.gob.ar');
   ```

---

## Seguridad

### ⚠️ Importante

1. **Cambiar password inmediatamente** después del primer login
2. **No compartir** credenciales del super admin
3. **Habilitar 2FA** cuando esté disponible en Supabase
4. **Rotar password** periódicamente (cada 90 días)
5. **Logs de auditoría**: Todas las acciones de super admin se registran

### Buenas Prácticas

- Usar super admin solo para tareas administrativas globales
- Crear admin de institución para tareas diarias
- No usar super admin para gestionar turnos o pacientes
- Mantener número mínimo de super admins (1-3)

---

## Referencias

- **Documentación completa**: `docs/SISTEMA-SUPER-ADMIN.md`
- **Schema**: `db/schema.sql`
- **Policies**: `db/policies-super-admin.sql`
- **Setup**: `db/authentication-setup.sql`
- **Migration**: `db/migrations/001_add_super_admin_role.sql`

---

## Resumen de Archivos Creados/Modificados

```
✅ db/schema.sql                              # role_name enum con super_admin
✅ db/migrations/001_add_super_admin_role.sql # Migration para agregar super_admin
✅ db/authentication-setup.sql                # Setup del primer super admin
✅ db/policies-super-admin.sql                # Políticas RLS con super_admin
✅ docs/SISTEMA-SUPER-ADMIN.md                # Documentación completa del sistema
✅ docs/README-super-admin-setup.md           # Esta guía
```

---

**Última actualización**: 2025-10-03
**Estado**: ✅ Fase 1 (Base de Datos) Completada
