# 🔐 Documentación de Seguridad: POST /api/admin/users

## Vulnerabilidad Crítica Mitigada

**Status:** ✅ ARREGLADO

**Problema:** El endpoint `/api/admin/users` permitía crear usuarios sin validación de autenticación.

**Riesgo:** Cualquiera podría crear usuarios en el sistema, comprometiendo completamente la seguridad.

---

## Implementación de Seguridad

El endpoint ahora valida **7 pasos críticos** antes de crear un usuario:

### ✅ Paso 1: Validar Bearer Token

```typescript
const authHeader = request.headers.get('authorization')

if (!authHeader?.startsWith('Bearer ')) {
  return NextResponse.json(
    { error: 'Unauthorized: Missing or invalid Bearer token' },
    { status: 401 }
  )
}
```

**Qué hace:** Verifica que el cliente envíe un Bearer token válido.

**Ejemplo de request correcto:**
```bash
curl -X POST https://example.com/api/admin/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","first_name":"Juan","last_name":"Pérez"}'
```

---

### ✅ Paso 2: Verificar Token Válido

```typescript
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

if (error || !user) {
  return NextResponse.json(
    { error: 'Unauthorized: Invalid or expired token' },
    { status: 401 }
  )
}
```

**Qué hace:** Verifica que el token sea válido y no haya expirado.

---

### ✅ Paso 3: Verificar Rol SUPER_ADMIN

```typescript
const { data: memberships } = await supabaseAdmin
  .from('membership')
  .select('role, is_active')
  .eq('user_id', user.id)

const isSuperAdmin = memberships?.some(
  (m: any) => m.role === 'super_admin' && m.is_active === true
)

if (!isSuperAdmin) {
  return NextResponse.json(
    { error: 'Forbidden: Super admin role required' },
    { status: 403 }
  )
}
```

**Qué hace:** Verifica que el usuario autenticado tenga el rol `super_admin`.

**Resultado si no es super_admin:**
```
HTTP 403 Forbidden
{
  "error": "Forbidden: Super admin role required"
}
```

---

### ✅ Paso 4: Validar Datos del Request

```typescript
// Campos requeridos
if (!email || !password || !first_name || !last_name) {
  return NextResponse.json(
    { error: 'Missing required fields...' },
    { status: 400 }
  )
}

// Formato de email válido
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  return NextResponse.json(
    { error: 'Invalid email format' },
    { status: 400 }
  )
}

// Password mínimo 8 caracteres
if (password.length < 8) {
  return NextResponse.json(
    { error: 'Password must be at least 8 characters long' },
    { status: 400 }
  )
}
```

**Qué hace:**
- Verifica que todos los campos requeridos estén presentes
- Valida que el email tenga formato correcto
- Valida que el password tenga mínimo 8 caracteres

---

### ✅ Paso 5: Crear Usuario en Auth

```typescript
const { data: authUser, error: createAuthError } =
  await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name }
  })

if (createAuthError) {
  return NextResponse.json(
    { error: createAuthError.message },
    { status: 400 }
  )
}
```

**Qué hace:** Crea el usuario en Supabase Auth.

---

### ✅ Paso 6: Crear Registro en Tabla Users

```typescript
const { data: newUser, error: userError } = await supabaseAdmin
  .from('users')
  .insert({
    id: authUser.user.id,
    email,
    first_name,
    last_name,
    password_hash: '', // Manejado por Supabase Auth
    is_active: is_active !== false
  })
  .select()
  .single()

if (userError) {
  // Limpiar: eliminar usuario de Auth si falla users table
  await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
  return NextResponse.json(
    { error: userError.message },
    { status: 400 }
  )
}
```

**Qué hace:**
- Crea registro en tabla `users`
- Si falla, elimina el usuario de Auth para mantener consistencia

---

### ✅ Paso 7: Auditoría

```typescript
console.log(
  `[AUDIT] User ${user.id} (${user.email}) created new user:
   ${newUser.id} (${email})`
)
```

**Qué hace:** Registra quién creó qué usuario (útil para auditoría).

---

## 🔍 Logging de Seguridad

Todos los intentos fallidos se loguean automáticamente:

```typescript
// Intento sin token
await logAuthFailure(request, '/api/admin/users', 'Missing or invalid Bearer token')

// Intento con token inválido
await logAuthFailure(request, '/api/admin/users', 'Invalid or expired token')

// Intento sin super_admin
await logAuthFailure(
  request,
  '/api/admin/users',
  `User ${user.id} attempted to create user without super_admin role`
)
```

Además se loguean eventos en consola:
```
[SECURITY] Unauthorized attempt to create user from IP: 203.0.113.45
[SECURITY] Invalid token attempt from IP: 203.0.113.45
[SECURITY] Forbidden: User abc-123 (user@example.com) attempted unauthorized user creation from IP: 203.0.113.45
[AUDIT] User abc-123 (admin@example.com) created new user: def-456 (newuser@example.com)
```

---

## 📊 Códigos de Error

| HTTP | Significado | Causa |
|------|-------------|-------|
| **401** | Unauthorized | Sin token, token inválido o expirado |
| **403** | Forbidden | Usuario no tiene rol super_admin |
| **400** | Bad Request | Campos inválidos o faltantes |
| **500** | Internal Server Error | Error del servidor |

---

## 🧪 Ejemplos de Uso

### ✅ Request Exitoso

```bash
curl -X POST https://tu-proyecto.vercel.app/api/admin/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "first_name": "Juan",
    "last_name": "Pérez",
    "is_active": true
  }'
```

**Respuesta:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@example.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "is_active": true,
    "created_at": "2025-11-07T10:30:00Z"
  },
  "message": "Usuario creado exitosamente"
}
```

---

### ❌ Request sin Token

```bash
curl -X POST https://tu-proyecto.vercel.app/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","first_name":"Juan","last_name":"Pérez"}'
```

**Respuesta:**
```json
{
  "error": "Unauthorized: Missing or invalid Bearer token"
}
```

HTTP 401 Unauthorized

---

### ❌ Request con Token Inválido

```bash
curl -X POST https://tu-proyecto.vercel.app/api/admin/users \
  -H "Authorization: Bearer invalid_token_12345" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","first_name":"Juan","last_name":"Pérez"}'
```

**Respuesta:**
```json
{
  "error": "Unauthorized: Invalid or expired token"
}
```

HTTP 401 Unauthorized

---

### ❌ Request sin Rol Super Admin

```bash
# Token válido pero usuario tiene rol 'admin', no 'super_admin'
curl -X POST https://tu-proyecto.vercel.app/api/admin/users \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","first_name":"Juan","last_name":"Pérez"}'
```

**Respuesta:**
```json
{
  "error": "Forbidden: Super admin role required"
}
```

HTTP 403 Forbidden

---

### ❌ Password Muy Corto

```bash
curl -X POST https://tu-proyecto.vercel.app/api/admin/users \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "short",
    "first_name": "Juan",
    "last_name": "Pérez"
  }'
```

**Respuesta:**
```json
{
  "error": "Password must be at least 8 characters long"
}
```

HTTP 400 Bad Request

---

## 🔒 Checklist de Seguridad

- ✅ Requiere Bearer token (autenticación)
- ✅ Valida que el token sea válido y no haya expirado
- ✅ Verifica que el usuario sea super_admin
- ✅ Valida formato de email
- ✅ Requiere password mínimo 8 caracteres
- ✅ Loguea todos los intentos exitosos (auditoría)
- ✅ Loguea todos los intentos fallidos (seguridad)
- ✅ Limpia datos en caso de error (rollback)
- ✅ Retorna códigos HTTP apropiados
- ✅ No expone información sensible en errores

---

## 🚀 Integración en el Frontend

Ejemplo de cómo usar desde una página de admin:

```typescript
async function createNewUser(userData: {
  email: string
  password: string
  first_name: string
  last_name: string
  is_active: boolean
}) {
  // Obtener el token del usuario autenticado
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('No authenticated session')
  }

  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }

  const result = await response.json()
  return result.user
}
```

---

## 📞 Soporte

¿Tienes problemas con el endpoint?

1. Verifica que el token sea válido y no haya expirado
2. Verifica que el usuario tenga rol `super_admin` en `membership`
3. Verifica que el email tenga formato válido
4. Verifica que el password tenga mínimo 8 caracteres
5. Revisa los logs en Vercel para ver los errores detallados

---

**Última actualización:** 2025-11-07
**Status:** ✅ Implementado y Auditado
