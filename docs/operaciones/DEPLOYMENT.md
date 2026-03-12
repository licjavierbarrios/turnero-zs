# Guía de Deployment - Turnero ZS

Esta guía detalla el proceso de deployment de Turnero ZS en diferentes ambientes.

## 📋 Requisitos Previos

- Node.js 18.17 o superior
- Cuenta de Supabase (Free tier o superior)
- Cuenta de Vercel (opcional, para deployment)
- Git instalado

## 🔧 Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone https://github.com/licjavierbarrios/turnero-zs.git
cd turnero-zs
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copiar el archivo de ejemplo:

```bash
cp .env.local.example .env.local
```

Editar `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

**⚠️ IMPORTANTE**: Nunca commitear el archivo `.env.local` al repositorio.

## 🗄️ Setup de Base de Datos

### 1. Crear Proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Guardar las credenciales (URL y anon key)

### 2. Ejecutar Scripts de Base de Datos

En el SQL Editor de Supabase, ejecutar en orden:

```sql
-- 1. Schema base
-- Ejecutar: db/schema.sql

-- 2. RLS Policies
-- Ejecutar: db/policies.sql

-- 3. Setup Super Admin
-- Ejecutar: db/SETUP-SUPER-ADMIN-COMPLETO.sql

-- 4. Funciones RLS actualizadas
-- Ejecutar: db/update-rls-functions-super-admin.sql

-- 5. Seed data (opcional, para testing)
-- Ejecutar: db/seed.sql
```

### 3. Crear Usuario Super Admin

```sql
-- En Supabase SQL Editor
-- Ejecutar: db/crear-usuario-super-admin.sql
-- Luego establecer password con: db/establecer-password-super-admin.sql
```

## 🚀 Deployment en Vercel

### Deploy Automático

1. Conectar repositorio GitHub a Vercel
2. Importar proyecto
3. Configurar variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automático

### Deploy Manual

```bash
npm run build
vercel --prod
```

## 🔒 Checklist de Seguridad

- [ ] Variables de entorno configuradas correctamente
- [ ] RLS policies habilitadas en todas las tablas
- [ ] Super admin creado y password fuerte establecido
- [ ] Verificar que `.env.local` está en `.gitignore`
- [ ] Auth de Supabase configurada (email/password habilitado)
- [ ] Dominios permitidos configurados en Supabase Auth

## 📊 Verificación Post-Deployment

### 1. Verificar Conexión a BD

```bash
npm run dev
# Abrir http://localhost:3000
# Intentar login con super admin
```

### 2. Verificar RLS Policies

```sql
-- En Supabase SQL Editor
SELECT * FROM zone; -- Debería requerir autenticación
```

### 3. Verificar Funciones

```sql
-- Verificar que las funciones RLS existen
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_name IN ('is_super_admin', 'is_admin', 'user_institutions', 'has_role_in_institution')
ORDER BY routine_schema, routine_name;
```

## 🔄 Actualización de Producción

### Deployment Continuo

Los commits a `main` despliegan automáticamente en Vercel.

### Migraciones de BD

Para agregar nuevas migraciones:

1. Crear archivo en `db/migrations/`
2. Ejecutar en Supabase SQL Editor (ambiente de producción)
3. Verificar que no hay errores
4. Documentar en CHANGELOG

## 🆘 Troubleshooting

### Error: "Could not fetch user"

**Causa**: Variables de entorno mal configuradas o Auth de Supabase no habilitado.

**Solución**:
1. Verificar `.env.local`
2. Verificar que Auth está habilitado en Supabase (Settings → Authentication → Enable Email provider)

### Error: "permission denied for table"

**Causa**: RLS policies no ejecutadas o usuario sin rol asignado.

**Solución**:
1. Ejecutar `db/policies.sql`
2. Verificar membership del usuario con `db/verificar-membership.sql`

### Error: "function does not exist"

**Causa**: Funciones RLS no creadas.

**Solución**:
Ejecutar `db/update-rls-functions-super-admin.sql`

## 📱 Configuración de Instituciones

Después del deployment, configurar las instituciones:

1. Login como super_admin
2. Ir a `/super-admin`
3. Crear zonas
4. Crear instituciones
5. Crear usuarios y asignar membresías

## 🔐 Backup y Recuperación

### Backup Manual

```bash
# Desde Supabase Dashboard
Settings → Database → Backup & Restore → Create backup
```

### Restauración

```bash
# Desde Supabase Dashboard
Settings → Database → Backup & Restore → Select backup → Restore
```

## 📈 Monitoreo

- **Supabase Dashboard**: Ver logs de BD y API
- **Vercel Analytics**: Métricas de frontend
- **Error Tracking**: Configurar Sentry (opcional)

## 🌐 Ambientes

### Desarrollo

```bash
npm run dev
```

- Base de datos: Supabase proyecto de desarrollo
- URL: http://localhost:3000

### Staging (Opcional)

- Branch: `staging`
- Auto-deploy en Vercel
- Base de datos: Supabase proyecto de staging

### Producción

- Branch: `main`
- Auto-deploy en Vercel
- Base de datos: Supabase proyecto de producción

## 📝 Notas Adicionales

- Los cambios en `db/schema.sql` requieren recrear las tablas (cuidado en producción)
- Las migraciones deben ser incrementales y backwards-compatible cuando sea posible
- Siempre testear en staging antes de producción
- Mantener backups regulares de la base de datos

## 🆘 Soporte

Para problemas de deployment:
1. Revisar logs en Vercel Dashboard
2. Revisar logs en Supabase Dashboard
3. Consultar la documentación de Next.js y Supabase
4. Abrir issue en el repositorio
