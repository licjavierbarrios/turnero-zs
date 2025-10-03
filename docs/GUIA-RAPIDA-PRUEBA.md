# Guía Rápida - Probar Turnero ZS en Local

Pasos para levantar y probar el proyecto completo en tu máquina local.

## 📋 Prerequisitos

- Node.js 18.17 o superior instalado
- Cuenta de Supabase (gratuita)
- Git instalado

## 🚀 Paso 1: Configurar Supabase

### 1.1 Crear Proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Login/Registrarse
3. Click en "New Project"
4. Completar:
   - **Name**: turnero-zs-local
   - **Database Password**: (guardar en un lugar seguro)
   - **Region**: Seleccionar el más cercano
5. Click "Create new project"
6. **Esperar 2-3 minutos** mientras se crea el proyecto

### 1.2 Obtener Credenciales

1. En el dashboard de Supabase, ir a **Settings** → **API**
2. Copiar:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...` (un token largo)
3. Guardar estas credenciales

### 1.3 Ejecutar Scripts SQL

En Supabase Dashboard, ir a **SQL Editor** y ejecutar en orden:

**Script 1: Schema Base**
```sql
-- Copiar TODO el contenido de: db/schema.sql
-- Pegar aquí y ejecutar (botón RUN)
```

**Script 2: RLS Policies**
```sql
-- Copiar TODO el contenido de: db/policies.sql
-- Pegar aquí y ejecutar (botón RUN)
```

**Script 3: Setup Super Admin**
```sql
-- Copiar TODO el contenido de: db/SETUP-SUPER-ADMIN-COMPLETO.sql
-- Pegar aquí y ejecutar (botón RUN)
```

**Script 4: Funciones RLS Actualizadas**
```sql
-- Copiar TODO el contenido de: db/update-rls-functions-super-admin.sql
-- Pegar aquí y ejecutar (botón RUN)
```

### 1.4 Habilitar Email Auth

1. En Supabase Dashboard, ir a **Authentication** → **Providers**
2. Buscar **Email**
3. Verificar que esté **ENABLED** (verde)
4. Si no está habilitado, hacer click en **Email** y habilitar

### 1.5 Crear Usuario Super Admin

**En SQL Editor de Supabase:**

```sql
-- 1. Crear usuario en auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
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
  'admin@turnero.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Super Admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 2. Obtener el ID del usuario recién creado
SELECT id, email FROM auth.users WHERE email = 'admin@turnero.com';
-- Copiar el ID que aparece (algo como: 12345678-1234-1234-1234-123456789012)

-- 3. Crear membership (reemplazar USER_ID con el ID copiado)
INSERT INTO public.membership (
  user_id,
  institution_id,
  role,
  is_active
) VALUES (
  'USER_ID_AQUI',  -- Reemplazar con el ID del paso anterior
  '00000000-0000-0000-0000-000000000001',
  'super_admin',
  true
);
```

## 💻 Paso 2: Configurar Proyecto Local

### 2.1 Clonar el Repositorio (si no lo tienes)

```bash
git clone https://github.com/licjavierbarrios/turnero-zs.git
cd turnero-zs
```

### 2.2 Instalar Dependencias

```bash
npm install
```

### 2.3 Configurar Variables de Entorno

1. Copiar el archivo de ejemplo:
```bash
cp .env.local.example .env.local
```

2. Editar `.env.local` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 2.4 Levantar el Servidor

```bash
npm run dev
```

Deberías ver:
```
▲ Next.js 15.5.2
- Local:        http://localhost:3000
- Ready in 2.3s
```

## 🧪 Paso 3: Probar el Sistema

### 3.1 Login como Super Admin

1. Abrir: http://localhost:3000
2. Login con:
   - **Email**: `admin@turnero.com`
   - **Password**: `admin123`
3. Deberías ver el dashboard

### 3.2 Crear una Zona (Como Super Admin)

1. Ir a `/super-admin/zonas`
2. Click en **"Nueva Zona"**
3. Completar:
   - **Nombre**: Zona Norte
   - **Descripción**: Zona Norte de la Ciudad
4. Guardar
5. ✅ Debería aparecer en la lista

### 3.3 Crear una Institución (Como Super Admin)

1. Ir a `/super-admin/instituciones`
2. Click en **"Nueva Institución"**
3. Completar:
   - **Nombre**: CAPS San Martín
   - **Tipo**: CAPS
   - **Zona**: Seleccionar "Zona Norte"
   - **Dirección**: Av. San Martín 1234
   - **Slug**: Se genera automáticamente
4. Guardar
5. ✅ Debería aparecer en la lista

### 3.4 Crear un Usuario Admin de Institución (Como Super Admin)

**IMPORTANTE**: El super_admin NO gestiona profesionales. Primero debe crear un admin para la institución.

1. Ir a `/super-admin/usuarios`
2. En pestaña **"Usuarios"**, click **"Nuevo Usuario"**
3. Completar:
   - **Nombre**: María
   - **Apellido**: López
   - **Email**: admin.caps@turnero.com
   - **Password**: admin123
4. Guardar
5. En pestaña **"Membresías"**, click **"Nueva Membresía"**
6. Completar:
   - **Usuario**: María López
   - **Institución**: CAPS San Martín
   - **Rol**: Administrador
7. Guardar
8. ✅ Ahora María López puede gestionar CAPS San Martín

### 3.5 Login como Admin de Institución

**IMPORTANTE**: A partir de aquí, las siguientes tareas las hace el **admin de la institución**, NO el super_admin.

1. **Logout** del super_admin
2. Login con:
   - **Email**: admin.caps@turnero.com
   - **Password**: admin123
3. Seleccionar institución: **CAPS San Martín**
4. ✅ Deberías ver el dashboard de la institución

### 3.6 Crear un Profesional (Como Admin)

1. Ir a `/profesionales`
2. Click en **"Nuevo Profesional"**
3. Completar:
   - **Nombre**: Juan
   - **Apellido**: Pérez
   - **Especialidad**: Medicina General
   - **Matrícula**: 12345
   - **Institución**: CAPS San Martín (se selecciona automáticamente)
   - **Estado**: Activo
4. Guardar
5. ✅ Debería aparecer en la lista

### 3.7 Crear un Servicio (Como Admin)

1. Ir a `/servicios`
2. Click en **"Nuevo Servicio"**
3. Completar:
   - **Nombre**: Medicina General
   - **Duración**: 15 minutos
   - **Institución**: CAPS San Martín (se selecciona automáticamente)
   - **Estado**: Activo
4. Guardar
5. ✅ Debería aparecer en la lista

### 3.8 Crear un Consultorio (Como Admin)

1. Ir a `/consultorios`
2. Click en **"Nuevo Consultorio"**
3. Completar:
   - **Nombre**: Consultorio 1
   - **Institución**: CAPS San Martín (se selecciona automáticamente)
   - **Estado**: Activo
4. Guardar
5. ✅ Debería aparecer en la lista

### 3.9 Crear una Plantilla de Horarios (Como Admin)

1. Ir a `/horarios`
2. Click en **"Nueva Plantilla"**
3. Completar:
   - **Profesional**: Dr. Juan Pérez
   - **Servicio**: Medicina General
   - **Consultorio**: Consultorio 1
   - **Día**: Lunes
   - **Hora Inicio**: 08:00
   - **Hora Fin**: 12:00
4. Ver **"Turnos calculados"**: Debería mostrar **16 turnos**
5. Guardar
6. ✅ Debería aparecer en la lista

### 3.10 Crear un Paciente (Como Admin o Administrativo)

1. Ir a `/pacientes`
2. Click en **"Nuevo Paciente"**
3. Completar:
   - **Nombre**: Pedro
   - **Apellido**: González
   - **DNI**: 12345678
   - **Fecha de Nacimiento**: 01/01/1980
4. Guardar
5. ✅ Debería aparecer en la lista

### 3.11 Asignar un Turno (Como Admin o Administrativo)

1. Ir a `/turnos-disponibles`
2. Seleccionar **Fecha**: Próximo lunes
3. Deberías ver slots **verdes (disponibles)**
4. Click en **"Asignar Turno"** en un slot
5. En el diálogo:
   - Buscar: Pedro (o 12345678)
   - Seleccionar: Pedro González
   - Notas: Primera consulta
6. Click **"Asignar Turno"**
7. ✅ Confirmación: "Turno asignado correctamente"
8. El slot debería cambiar a **rojo (ocupado)**

### 3.12 Gestionar el Turno (Como Admin, Administrativo o Médico)

1. Ir a `/turnos`
2. Deberías ver el turno de **Pedro González**
3. Probar el flujo:
   - Click **"Marcar Esperando"** → Estado cambia a ESPERANDO (azul)
   - Click **"Llamar Paciente"** → Estado cambia a LLAMADO (púrpura)
   - Click **"Iniciar Consulta"** → Estado cambia a EN CONSULTA (verde)
   - Click **"Finalizar"** → Estado cambia a FINALIZADO (gris)
4. ✅ Todos los cambios deberían funcionar

### 3.13 Probar Pantalla Pública

1. Ir a `/pantalla`
2. Click en **"CAPS San Martín"**
3. La URL será: `/pantalla/caps-san-martin`
4. ✅ Debería mostrar una pantalla de llamados
5. Crear un turno y llamarlo desde `/turnos`
6. ✅ La pantalla debería actualizarse automáticamente (Realtime)

### 3.14 Ver Reportes (Como Admin)

1. Ir a `/reportes`
2. Seleccionar:
   - **Período**: Hoy
3. Deberías ver:
   - **Resumen**: Métricas generales
   - **Profesionales**: Estadísticas del Dr. Pérez
   - **Servicios**: Estadísticas de Medicina General
   - **Tendencias**: Gráficos
4. Click en **"Exportar CSV"**
5. ✅ Se descarga un archivo CSV

### 3.15 Ver Dashboard (Como Admin)

1. Ir a `/dashboard`
2. Deberías ver:
   - Turnos de hoy
   - Turnos pendientes
   - Profesionales activos
   - Últimos turnos
3. ✅ Todos los datos deberían ser reales (no hardcodeados)

## ✅ Checklist de Verificación

Marcar cada item que funcione correctamente:

**Como Super Admin:**
- [ ] Login con super_admin
- [ ] Acceso a `/super-admin`
- [ ] Crear zona en `/super-admin/zonas`
- [ ] Crear institución en `/super-admin/instituciones`
- [ ] Crear usuario en `/super-admin/usuarios`
- [ ] Asignar membresía de admin en `/super-admin/usuarios`

**Como Admin de Institución:**
- [ ] Login con admin
- [ ] Seleccionar institución
- [ ] Crear profesional en `/profesionales`
- [ ] Crear servicio en `/servicios`
- [ ] Crear consultorio en `/consultorios`
- [ ] Crear plantilla de horarios en `/horarios`
- [ ] Ver "Turnos calculados" correctamente
- [ ] Crear paciente en `/pacientes`
- [ ] Asignar turno en `/turnos-disponibles`
- [ ] Slot cambia de verde a rojo
- [ ] Gestionar flujo completo (pendiente → finalizado) en `/turnos`
- [ ] Pantalla pública muestra llamados en `/pantalla/[slug]`
- [ ] Pantalla pública se actualiza en tiempo real
- [ ] Reportes muestran datos en `/reportes`
- [ ] Exportar CSV funciona
- [ ] Dashboard muestra datos reales en `/dashboard`

## 🆘 Problemas Comunes

### "Could not fetch user"

**Causa**: Variables de entorno mal configuradas

**Solución**:
1. Verificar `.env.local`
2. Reiniciar el servidor (`Ctrl+C` y `npm run dev`)

### "permission denied for table"

**Causa**: RLS policies no ejecutadas

**Solución**:
Ejecutar `db/policies.sql` en Supabase SQL Editor

### No aparecen turnos en `/turnos-disponibles`

**Causa**: No hay plantillas de horarios

**Solución**:
1. Verificar que existe: profesional + servicio + consultorio + plantilla
2. Click en "Regenerar Turnos"

### Login falla

**Causa**: Usuario super admin no creado correctamente

**Solución**:
1. Ejecutar query para verificar:
```sql
SELECT u.email, m.role
FROM auth.users u
JOIN public.membership m ON m.user_id = u.id
WHERE u.email = 'admin@turnero.com';
```
2. Debería mostrar: `admin@turnero.com | super_admin`

## 🎯 Flujo Completo Exitoso

Si todo funciona, deberías poder:

**Como Super Admin:**
1. ✅ Login como super_admin
2. ✅ Crear zona sanitaria
3. ✅ Crear institución en esa zona
4. ✅ Crear usuario admin para la institución
5. ✅ Asignar membresía de admin al usuario

**Como Admin de Institución:**
6. ✅ Login como admin
7. ✅ Crear profesional, servicio, consultorio
8. ✅ Crear plantilla de horarios
9. ✅ Crear paciente
10. ✅ Asignar turno desde slots disponibles
11. ✅ Gestionar flujo de atención (pendiente → esperando → llamado → en consulta → finalizado)
12. ✅ Ver actualización en tiempo real en pantalla pública
13. ✅ Ver reportes con datos reales
14. ✅ Exportar datos a CSV

## 📝 Próximos Pasos

Después de probar el sistema:

1. **Crear más datos de prueba** (más profesionales, servicios, turnos)
2. **Probar con diferentes roles** (crear usuario admin, administrativo, médico)
3. **Probar escenarios complejos** (cancelaciones, ausencias, múltiples instituciones)
4. **Revisar las guías**:
   - `docs/GUIA-ADMINISTRADOR.md` - Para uso avanzado
   - `docs/GUIA-USUARIO.md` - Para personal operativo
   - `docs/DEPLOYMENT.md` - Para deployment en producción

## 🚀 Deploy a Producción

Cuando estés listo para producción:

1. Revisar `docs/CHECKLIST.md`
2. Seguir `docs/DEPLOYMENT.md`
3. Usar Vercel para hosting
4. Configurar Supabase de producción (separado de desarrollo)

---

**¿Algún problema?** Revisar:
- `docs/DEPLOYMENT.md` → Sección Troubleshooting
- `docs/GUIA-ADMINISTRADOR.md` → Problemas Comunes
