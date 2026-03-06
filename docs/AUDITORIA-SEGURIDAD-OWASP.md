# Auditoria de Seguridad OWASP - Turnero ZS

**Fecha de auditoria**: 2026-03-06
**Auditor**: Agente de Seguridad automatizado
**Alcance**: Codigo fuente del repositorio Turnero ZS (branch `main`)
**Frameworks evaluados**: OWASP Top 10 (2021) y OWASP API Security Top 10 (2023)
**Stack**: Next.js 15.5.12, Supabase (PostgreSQL + Auth + Realtime), TypeScript, Vercel

---

## Resumen Ejecutivo

Se identificaron **23 hallazgos** en la revision del codigo fuente del proyecto Turnero ZS. De estos, **3 son criticos**, **5 de severidad alta**, **8 de severidad media**, **5 de severidad baja** y **2 informativos**.

Los hallazgos criticos se concentran en:

1. **El panel `/super-admin` no tiene verificacion de autorizacion en el middleware** -- cualquier usuario autenticado puede acceder.
2. **La funcion de cifrado usa XOR con clave hardcodeada** -- criptograficamente insegura.
3. **El rol del usuario se almacena en localStorage y se confia en el lado del cliente** para decisiones de autorizacion, sin verificacion server-side en las paginas del dashboard.

La postura general de seguridad es **moderada**: se observa buen uso de RLS en Supabase, logging de seguridad, y validacion de tokens en API routes, pero existen brechas significativas en control de acceso, especialmente en la capa de middleware y en el panel de super-admin.

| Severidad | Cantidad |
|-----------|----------|
| CRITICA   | 3        |
| ALTA      | 5        |
| MEDIA     | 8        |
| BAJA      | 5        |
| INFO      | 2        |
| **Total** | **23**   |

---

## OWASP Top 10 (2021)

### A01: Broken Access Control

#### [CRITICA] SEC-001: Panel /super-admin sin verificacion de autorizacion en middleware — CORREGIDO (commit e4696c1)

**Archivo**: `middleware.ts:89-93`

```typescript
if (currentPath.startsWith('/super-admin')) {
    // TEMPORAL: Permitir acceso sin verificación para debugging
    console.log('Middleware: Acceso a /super-admin, usuario:', user?.id)
    return response
}
```

**Descripcion**: La proteccion de la ruta `/super-admin/*` esta desactivada con un comentario "TEMPORAL para debugging". Cualquier usuario autenticado (incluso con rol `pantalla`) puede acceder al panel de super administracion completo que permite gestionar zonas, instituciones, usuarios y profesionales de todo el sistema.

**Impacto**: Un atacante con cualquier cuenta valida puede escalar privilegios a super_admin y controlar todo el sistema.

**Remediacion**: Restaurar la verificacion de rol `super_admin` en el middleware antes de permitir el acceso a `/super-admin/*`. Verificar la membresia del usuario contra la base de datos.

---

#### [CRITICA] SEC-002: Autorizacion basada en localStorage (client-side trust)

**Archivos**:
- `hooks/use-permissions.ts:19-29`
- `hooks/useInstitutionContext.ts:119-127`
- `app/institutions/select/page.tsx:177`

```typescript
// use-permissions.ts
const contextData = localStorage.getItem('institution_context')
const context = JSON.parse(contextData)
const userRole = context.user_role as UserRole
const permitted = hasPermission(userRole, route)
```

**Descripcion**: El sistema de permisos del dashboard lee el rol del usuario de `localStorage`, que es completamente manipulable por el cliente. Un usuario con rol `pantalla` puede modificar `localStorage` para establecer `user_role: "admin"` y obtener acceso a todas las paginas del dashboard incluyendo `/configuracion`, `/usuarios`, `/reportes`, etc.

El middleware de Next.js (linea 113-123) solo verifica si el usuario esta autenticado para rutas del dashboard, pero NO verifica el rol:

```typescript
if (isDashboardRoute) {
    if (!user) {
      // redirigir a login
    }
    // Usuario autenticado tiene acceso al dashboard -- SIN VERIFICACION DE ROL
    return response
}
```

**Impacto**: Escalacion horizontal y vertical de privilegios. Cualquier usuario autenticado puede acceder a todas las funciones del dashboard modificando localStorage.

**Remediacion**: Implementar verificacion de rol server-side en el middleware para rutas del dashboard. Consultar la tabla `membership` para validar que el usuario tenga el rol requerido para cada ruta.

---

#### [ALTA] SEC-003: Layout de super-admin usa usuario mock, no verifica autenticacion real — CORREGIDO (commit e4696c1)

**Archivo**: `app/super-admin/layout.tsx:44-53`

```typescript
useEffect(() => {
    // TODO: Verificar autenticación con Supabase
    // Por ahora, simulamos el usuario
    const mockUser = {
      email: 'licjavierbarrios@hotmail.com',
      name: 'Super Administrador',
      role: 'super_admin'
    }
    setUser(mockUser)
    setLoading(false)
}, [router])
```

**Descripcion**: El layout del super-admin ni siquiera intenta verificar la sesion de Supabase. Usa datos de usuario hardcodeados. Combinado con SEC-001, esto significa que no hay ninguna capa de proteccion efectiva para el panel de super-admin.

**Impacto**: Refuerza SEC-001 -- el panel de super-admin es completamente accesible sin autorizacion.

**Remediacion**: Implementar verificacion real de sesion y rol super_admin usando `supabase.auth.getUser()` y consulta a `membership`.

---

#### [ALTA] SEC-004: Middleware fail-open cuando Supabase no responde — CORREGIDO (commit e4696c1)

**Archivo**: `middleware.ts:74-81`

```typescript
try {
    const { data } = await supabase.auth.getUser()
    user = data.user
} catch {
    // Si Supabase no responde, dejamos pasar el request (fail-open)
    return response
}
```

**Descripcion**: Si Supabase Auth no responde (timeout, error de red, etc.), el middleware permite el acceso a todas las rutas sin autenticacion. Esto es un patron fail-open que viola el principio de seguridad de "denegar por defecto".

**Impacto**: Si Supabase tiene una interrupcion temporal o hay latencia de red, todas las rutas protegidas quedan expuestas.

**Remediacion**: Cambiar a fail-closed: redirigir a la pagina de login cuando la autenticacion no puede ser verificada. Agregar un mecanismo de retry con timeout corto antes de denegar.

---

#### [MEDIA] SEC-005: RLS de daily_queue no distingue roles para operaciones de escritura

**Archivo**: `db/migrations/003_create_daily_queue.sql:78-101`

```sql
CREATE POLICY "Users can insert daily_queue in their institution"
  ON daily_queue FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT institution_id FROM membership
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

**Descripcion**: Las politicas RLS de `daily_queue` permiten INSERT y UPDATE a CUALQUIER usuario con membresia activa en la institucion, sin importar su rol. Un usuario con rol `pantalla` podria insertar y modificar turnos en la cola.

**Impacto**: Usuarios con roles de solo lectura (`pantalla`) pueden modificar datos de la cola diaria.

**Remediacion**: Agregar verificacion de rol en las politicas de INSERT y UPDATE, limitando a roles `admin`, `administrativo`, `profesional` y `servicio`.

---

#### [MEDIA] SEC-006: Tabla patient accesible globalmente para cualquier usuario autenticado

**Archivo**: `db/policies.sql:167-168`

```sql
CREATE POLICY "Authenticated users can view and manage patients" ON patient
  FOR ALL USING (auth.uid() IS NOT NULL);
```

**Descripcion**: Cualquier usuario autenticado tiene acceso completo (SELECT, INSERT, UPDATE, DELETE) a la tabla de pacientes, sin restriccion por institucion ni por rol. Esto incluye datos sensibles como DNI y nombre completo.

**Impacto**: Fuga de datos de pacientes. Cualquier usuario puede ver, modificar y eliminar registros de pacientes de cualquier institucion. En el contexto de salud argentino, esto viola la Ley 25.326 de Proteccion de Datos Personales y la Ley 26.529 de Derechos del Paciente.

**Remediacion**: Restringir acceso a pacientes por institucion usando la membresia del usuario. Agregar verificacion de rol para operaciones de escritura.

---

### A02: Cryptographic Failures

#### [CRITICA] SEC-007: Funcion de cifrado XOR con clave hardcodeada

**Archivo**: `lib/security.ts:513-525`

```typescript
encryptSensitiveData(data: string, key?: string): string {
    const encryptionKey = key || 'turnero-zs-default-key'
    let encrypted = ''
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ encryptionKey.charCodeAt(i % encryptionKey.length)
      )
    }
    return btoa(encrypted)
}
```

**Descripcion**: Se implementa "cifrado" usando XOR simple con una clave por defecto hardcodeada (`turnero-zs-default-key`). XOR no es un algoritmo de cifrado seguro; es trivialmente reversible, especialmente con clave conocida. Ademas la clave esta en el codigo fuente.

**Impacto**: Cualquier dato "cifrado" con esta funcion puede ser descifrado instantaneamente. Si se usa para proteger datos sensibles de pacientes, no ofrece proteccion real.

**Remediacion**: Eliminar esta implementacion. Si se necesita cifrado client-side, usar Web Crypto API con AES-GCM. Para datos sensibles en la base de datos, usar las extensiones de PostgreSQL (`pgcrypto`) o el cifrado at-rest de Supabase.

---

#### [ALTA] SEC-008: Generacion de tokens con Math.random() (no criptografico)

**Archivo**: `lib/security.ts:552-561`

```typescript
generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
}
```

**Descripcion**: La funcion `generateSecureToken` usa `Math.random()` que no es criptograficamente seguro. Su nombre sugiere seguridad que no provee.

**Impacto**: Los tokens generados son predecibles. Si se usan para sesiones, tokens de acceso o nonces, un atacante puede predecirlos.

**Remediacion**: Usar `crypto.getRandomValues()` (disponible en browser y en Node.js) o `crypto.randomBytes()` en server-side.

---

#### [MEDIA] SEC-009: Contrasenas generadas con patron predecible (DNI + iniciales)

**Archivo**: `app/super-admin/usuarios/page.tsx:159-164`

```typescript
function generatePassword(dni: string, lastName: string): string {
  const clean = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '')
  const c1 = clean.charAt(0).toUpperCase()
  const c2 = clean.charAt(1)?.toLowerCase() ?? ''
  return `${dni}${c1}${c2}`
}
```

**Descripcion**: Las contrasenas se generan automaticamente con el patron `{DNI}{PrimeraLetraMayuscula}{SegundaLetraMinuscula}` del apellido. Ejemplo para DNI 35123456 y apellido Perez: `35123456Pe`. Este patron es trivial de adivinar conociendo los datos publicos del empleado.

**Impacto**: Cualquier persona que conozca el DNI y apellido de un empleado puede calcular su contrasena si no fue cambiada.

**Remediacion**: Generar contrasenas aleatorias seguras. Implementar flujo de cambio de contrasena obligatorio en el primer login. Considerar envio por canal seguro (email de bienvenida con link de reset).

---

### A03: Injection

#### [BAJA] SEC-010: Proteccion contra SQL injection implementada en cliente (no en servidor)

**Archivo**: `lib/security.ts:268-277`

**Descripcion**: La deteccion de SQL injection (`detectSQLInjection`) se ejecuta en el lado del cliente como parte del hook `useSecurity()`. No hay proteccion equivalente en las API routes del servidor.

Sin embargo, el riesgo real es bajo porque Supabase usa consultas parametrizadas internamente a traves de su SDK (PostgREST), y no se encontraron llamadas a `.rpc()` o SQL crudo en el codigo de la aplicacion.

**Impacto**: Bajo. La proteccion es de defensa en profundidad pero esta mal ubicada.

**Remediacion**: Mover la validacion de input al lado del servidor (middleware o API routes). El SDK de Supabase ya previene inyeccion SQL, pero la validacion de input sigue siendo buena practica.

---

### A04: Insecure Design

#### [ALTA] SEC-011: Pantalla publica expone nombres de pacientes sin autenticacion

**Archivos**:
- `app/(public)/pantalla/[slug]/page.tsx`
- `db/migrations/003_create_daily_queue.sql`

**Descripcion**: La pantalla publica muestra `patient_name` (nombre completo) de los pacientes en la cola. Esta pagina no requiere autenticacion. La URL es publica. Ademas, la API de TTS lee el nombre en voz alta: `"Paciente: Juan Perez -> Consultorio 3"`.

En el contexto de salud, esto expone datos personales de pacientes (nombre + presencia en un centro de salud) a cualquier persona con la URL.

**Impacto**: Violacion de privacidad de datos de salud. Incumplimiento potencial de la Ley 25.326 y regulaciones de datos sensibles de salud.

**Remediacion**: Considerar mostrar solo el numero de orden y las iniciales, o un codigo anonimizado. Implementar el token de pantalla como requisito obligatorio (ya existe como feature en `/pantallas`).

---

#### [MEDIA] SEC-012: Datos de usuario almacenados en sessionStorage sin cifrar

**Archivo**: `app/page.tsx:73-74`

```typescript
sessionStorage.setItem('user_data', JSON.stringify(membershipData.user))
sessionStorage.setItem('user_institutions', JSON.stringify(membershipData.institutions))
```

**Descripcion**: Informacion de usuario, instituciones y roles se almacena en `sessionStorage` y `localStorage` en texto plano. Esto incluye IDs de usuario, emails, roles y IDs de instituciones.

**Impacto**: Cualquier extension de navegador, XSS o acceso fisico al dispositivo puede leer estos datos.

**Remediacion**: Minimizar la informacion almacenada en el cliente. No almacenar datos sensibles en localStorage/sessionStorage.

---

### A05: Security Misconfiguration

#### [ALTA] SEC-013: CORS configurado con Access-Control-Allow-Origin: * en multiples endpoints

**Archivos**:
- `app/api/tts/route.ts:76` y `:94`
- `app/api/audio/route.ts:32` y `:50`
- `app/api/detect-country/route.ts:33`

```typescript
'Access-Control-Allow-Origin': '*',
```

**Descripcion**: Tres API routes usan `Access-Control-Allow-Origin: *`, permitiendo que cualquier sitio web haga peticiones a estos endpoints.

**Impacto**: Para `/api/tts` y `/api/audio`, el riesgo es menor ya que sirven contenido multimedia sin datos sensibles. Para `/api/detect-country`, expone la IP y pais del visitante a cualquier origen.

**Remediacion**: Restringir CORS al dominio de la aplicacion. Para pantallas en Android TV que necesiten CORS abierto, considerar un origen permitido especifico o un token de autorizacion.

---

#### [MEDIA] SEC-014: Headers de seguridad HTTP no configurados en next.config.js

**Archivo**: `next.config.js`

**Descripcion**: No se configuran headers de seguridad HTTP en `next.config.js`. Los headers intentan establecerse via meta tags en `lib/security.ts`, pero los meta tags `http-equiv` son ignorados por los navegadores modernos para la mayoria de estos headers -- deben configurarse como headers HTTP reales.

Headers faltantes:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`

**Impacto**: La aplicacion es vulnerable a clickjacking, MIME sniffing, y carece de protecciones CSP contra XSS.

**Remediacion**: Agregar la propiedad `headers()` en `next.config.js` para configurar los headers de seguridad HTTP apropiados.

---

#### [MEDIA] SEC-015: API /api/user/memberships usa service_role_key para operaciones de lectura

**Archivo**: `app/api/user/memberships/route.ts:5-8`

```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)
```

**Descripcion**: El endpoint `/api/user/memberships` usa el `SUPABASE_SERVICE_ROLE_KEY` (que bypasea RLS) para consultar datos que podrian obtenerse con el token del usuario respetando RLS. Esto anula las politicas de seguridad a nivel de base de datos.

**Impacto**: Si hay un bug en la logica del endpoint, podria exponer datos de otros usuarios ya que RLS no protege las consultas.

**Remediacion**: Crear un cliente Supabase usando el token del usuario (no el service role key) para que RLS aplique automaticamente. Reservar el service role key solo para operaciones administrativas que legitimamente necesiten bypasear RLS.

---

### A06: Vulnerable and Outdated Components

#### [MEDIA] SEC-016: Versiones de dependencias con vulnerabilidades conocidas potenciales

**Archivo**: `package.json`

| Dependencia | Version actual | Observacion |
|---|---|---|
| `@supabase/ssr` | 0.1.0 | Version muy temprana (0.x) |
| `@supabase/supabase-js` | 2.39.0 | Multiples versiones posteriores con fixes de seguridad |
| `react` | 18.2.0 | React 18.2 es estable pero 18.3+ tiene fixes |
| `next` | 15.5.12 | Relativamente actual |

**Remediacion**: Ejecutar `npm audit` regularmente. Actualizar `@supabase/ssr` y `@supabase/supabase-js` a sus versiones mas recientes. Configurar Dependabot o Renovate para actualizaciones automaticas.

---

### A07: Identification and Authentication Failures

#### [MEDIA] SEC-017: Uso de getSession() en lugar de getUser() para autenticacion

**Archivos**:
- `app/super-admin/usuarios/page.tsx:590`
- `app/(dashboard)/usuarios/page.tsx:355`
- `app/page.tsx:54`
- `lib/security.ts:302`

```typescript
const { data: { session } } = await supabase.auth.getSession()
```

**Descripcion**: Multiples componentes usan `getSession()` para verificar la autenticacion del usuario. Segun la documentacion de Supabase, `getSession()` lee la sesion del almacenamiento local y NO la verifica con el servidor. Para autenticacion, se debe usar `getUser()` que valida el JWT contra Supabase Auth.

**Impacto**: Un atacante podria manipular la sesion en localStorage y pasar la verificacion de `getSession()`.

**Remediacion**: Reemplazar `getSession()` con `getUser()` en todos los contextos donde se necesite verificar autenticacion.

---

#### [BAJA] SEC-018: Politica de contrasenas debil en API route de creacion de usuarios

**Archivo**: `app/api/admin/users/route.ts:138-144`

```typescript
if (password.length < 8) {
  return NextResponse.json(
    { error: 'Password must be at least 8 characters long' },
    { status: 400 }
  )
}
```

**Descripcion**: La API de creacion de usuarios solo verifica que la contrasena tenga 8+ caracteres. Existe un `SecurityManager.validatePassword()` en `lib/security.ts` que requiere 12 caracteres y complejidad, pero NO se usa en la API.

**Remediacion**: Integrar la validacion de `SecurityManager.validatePassword()` en el endpoint `/api/admin/users`.

---

#### [BAJA] SEC-019: No hay proteccion contra fuerza bruta en el login

**Archivo**: `app/page.tsx:42-47`

**Descripcion**: La pagina de login no implementa rate limiting ni bloqueo de cuenta despues de intentos fallidos. El `SecurityManager.handleLoginAttempt()` existe en `lib/security.ts` pero es client-side y no se integra con el flujo de login real.

**Remediacion**: Implementar rate limiting server-side en el login. Configurar una regla especifica en Vercel Firewall mas estricta para la ruta de login.

---

### A08: Software and Data Integrity Failures

#### [BAJA] SEC-020: Endpoint TTS hace fetch a servicio externo sin validacion

**Archivo**: `app/api/tts/route.ts:35-47`

```typescript
const ttsUrl = new URL('https://translate.google.com/translate_tts')
// ...
const ttsResponse = await fetch(ttsUrl.toString(), {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
})
```

**Descripcion**: El endpoint TTS hace proxy de peticiones a Google Translate usando un User-Agent falso. Esto viola los ToS de Google, introduce una dependencia en un servicio no contractual que puede cambiar sin aviso, y el contenido devuelto no se valida.

**Remediacion**: Usar un servicio TTS oficial con API key (Google Cloud TTS, Amazon Polly, o similar). Validar el Content-Type de la respuesta.

---

### A09: Security Logging and Monitoring Failures

#### [BAJA] SEC-021: Audit logger obtiene IP del cliente via servicio externo

**Archivo**: `lib/audit.ts:241-247`

```typescript
private async getClientIP(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch { return undefined }
}
```

**Descripcion**: El audit logger client-side hace una peticion a `api.ipify.org` para obtener la IP del cliente. Esto agrega latencia a cada evento de auditoria, depende de un servicio externo, y envia una peticion a un tercero por cada accion auditada.

**Remediacion**: Obtener la IP del lado del servidor (ya disponible via headers de Vercel). No depender de servicios externos para logging.

---

#### [INFO] SEC-022: SecurityManager no esta integrado en los flujos reales

**Archivos**: `lib/security.ts`, `lib/audit.ts`

**Descripcion**: Existe un `SecurityManager` completo con deteccion de amenazas, bloqueo de IPs, rate limiting, y monitoreo. Sin embargo, la mayoria de sus funciones estan deshabilitadas (tablas `security_blocks` y `security_alerts` no existen) o no se usan en los flujos reales de la aplicacion.

**Remediacion**: Decidir si se implementa completamente o se elimina. El codigo muerto de seguridad puede ser confuso para los desarrolladores.

---

### A10: Server-Side Request Forgery (SSRF)

#### [INFO] SEC-023: Endpoint TTS puede ser usado como proxy limitado

**Archivo**: `app/api/tts/route.ts:35-38`

**Descripcion**: El parametro `lang` y `text` del endpoint TTS son controlados por el usuario, pero la URL base es fija (`translate.google.com`). El riesgo SSRF es minimo porque solo el path `translate_tts` se usa con parametros controlados que Google valida.

**Impacto**: Muy bajo. No es explotable como SSRF clasico.

---

## OWASP API Security Top 10 (2023)

### API1: Broken Object Level Authorization

**Hallazgos relacionados**: SEC-002, SEC-005, SEC-006

La autorizacion a nivel de objeto depende principalmente de RLS en Supabase, correctamente implementada para la mayoria de las tablas. Sin embargo, `patient` carece de restriccion por institucion (SEC-006), y `daily_queue` no verifica roles para escritura (SEC-005).

### API2: Broken Authentication

**Hallazgos relacionados**: SEC-004, SEC-017, SEC-019

El uso de `getSession()` en lugar de `getUser()` (SEC-017) y el patron fail-open del middleware (SEC-004) debilitan la autenticacion. La falta de rate limiting en login (SEC-019) permite ataques de fuerza bruta.

### API3: Broken Object Property Level Authorization

**Severidad**: MEDIA

El endpoint `/api/admin/users` (POST) no restringe que propiedades puede establecer un admin vs un super_admin. Las inserciones de membresia post-creacion de usuario se hacen desde el cliente con el Supabase client, confiando en que RLS restrinja correctamente.

### API4: Unrestricted Resource Consumption

**Severidad**: BAJA

El endpoint `/api/tts` tiene un limite de 200 caracteres por peticion, lo cual es bueno. Sin embargo, no hay rate limiting especifico per-endpoint. La configuracion de Vercel Firewall es la unica proteccion general.

### API5: Broken Function Level Authorization

**Hallazgos relacionados**: SEC-001, SEC-002, SEC-003

Este es el hallazgo mas critico del proyecto. La ruta `/super-admin` no tiene verificacion de autorizacion (SEC-001), y las rutas del dashboard no verifican roles server-side (SEC-002).

### API6: Unrestricted Access to Sensitive Business Flows

**Hallazgos relacionados**: SEC-011

La pantalla publica (`/pantalla/[slug]`) expone datos de pacientes sin autenticacion obligatoria.

### API7: Server-Side Request Forgery

**Hallazgos relacionados**: SEC-023 — Riesgo minimo.

### API8: Security Misconfiguration

**Hallazgos relacionados**: SEC-013, SEC-014, SEC-015 — CORS abierto, headers de seguridad faltantes, uso innecesario de service_role_key.

### API9: Improper Inventory Management

**Severidad**: BAJA

Endpoints API del proyecto:

| Endpoint | Metodo | Autenticacion |
|---|---|---|
| `/api/admin/users` | POST | Bearer token (verificado) |
| `/api/user/memberships` | GET | Bearer token |
| `/api/tts` | GET | Sin autenticacion |
| `/api/audio` | GET | Sin autenticacion |
| `/api/detect-country` | GET | Sin autenticacion |

Los endpoints publicos estan correctamente identificados, pero no hay documentacion formal de la API.

### API10: Unsafe Consumption of APIs

**Hallazgos relacionados**: SEC-020 — Consumo de Google Translate TTS sin contrato ni validacion de respuesta.

---

## Tabla Resumen de Hallazgos

| ID | Severidad | Categoria OWASP | Titulo | Archivo Principal |
|---|---|---|---|---|
| SEC-001 | **CRITICA** ✅ | A01 / API5 | Panel /super-admin sin autorizacion en middleware | `middleware.ts:89-93` |
| SEC-002 | **CRITICA** ✅ | A01 / API5 | Autorizacion basada en localStorage (client-side) | `hooks/use-permissions.ts:19-29` |
| SEC-007 | **CRITICA** ✅ | A02 | Cifrado XOR con clave hardcodeada | `lib/security.ts:513-525` |
| SEC-003 | **ALTA** ✅ | A01 | Layout super-admin con usuario mock | `app/super-admin/layout.tsx:44-53` |
| SEC-004 | **ALTA** ✅ | A01 / API2 | Middleware fail-open | `middleware.ts:74-81` |
| SEC-008 | **ALTA** ✅ | A02 | Token generation con Math.random() | `lib/security.ts:552-561` |
| SEC-011 | **ALTA** ✅ | A04 / API6 | Pantalla publica expone nombres de pacientes | `app/(public)/pantalla/[slug]/page.tsx` |
| SEC-013 | **ALTA** ✅ | A05 / API8 | CORS con wildcard en endpoints | `app/api/tts/route.ts:76` |
| SEC-005 | **MEDIA** ✅ | A01 / API1 | RLS de daily_queue sin verificacion de rol | `db/migrations/003_create_daily_queue.sql` |
| SEC-006 | **MEDIA** ✅ | A01 / API1 | Tabla patient accesible globalmente | `db/policies.sql:167-168` |
| SEC-009 | **MEDIA** ⏳ | A02 | Contrasenas generadas con patron predecible — bloqueado: requiere feature "cambiar contraseña" en /configuracion | `app/super-admin/usuarios/page.tsx:159-164` |
| SEC-012 | **MEDIA** | A04 | Datos en sessionStorage sin cifrar | `app/page.tsx:73-74` |
| SEC-014 | **MEDIA** | A05 / API8 | Headers HTTP de seguridad no configurados | `next.config.js` |
| SEC-015 | **MEDIA** | A05 / API8 | API memberships usa service_role_key innecesariamente | `app/api/user/memberships/route.ts:5-8` |
| SEC-016 | **MEDIA** | A06 | Dependencias potencialmente desactualizadas | `package.json` |
| SEC-017 | **MEDIA** ✅ | A07 / API2 | getSession() en lugar de getUser() | Multiples archivos |
| SEC-010 | **BAJA** | A03 | Proteccion SQLi solo en cliente | `lib/security.ts:268-277` |
| SEC-018 | **BAJA** | A07 | Politica de contrasenas debil en API | `app/api/admin/users/route.ts:138-144` |
| SEC-019 | **BAJA** | A07 / API2 | Sin rate limiting en login | `app/page.tsx` |
| SEC-020 | **BAJA** | A08 / API10 | TTS proxy a servicio externo sin validacion | `app/api/tts/route.ts:35-47` |
| SEC-021 | **BAJA** | A09 | Audit logger depende de servicio externo para IP | `lib/audit.ts:241-247` |
| SEC-022 | **INFO** | A09 | SecurityManager no integrado | `lib/security.ts` |
| SEC-023 | **INFO** | A10 / API7 | Endpoint TTS como proxy limitado | `app/api/tts/route.ts` |

---

## Hallazgos Positivos

1. **RLS habilitado en todas las tablas principales**: Las politicas de Row Level Security estan correctamente habilitadas y cubren la mayoria de las tablas criticas.
2. **API route `/api/admin/users` bien protegida**: Verificacion de Bearer token, validacion de rol, logging de auditoria, y manejo de errores adecuado.
3. **Logging de seguridad implementado**: El modulo `lib/monitoring.ts` registra eventos de seguridad en la base de datos.
4. **Geo-blocking configurado**: Restriccion por pais (Argentina) via Vercel Firewall.
5. **Archivos .env en .gitignore**: Las credenciales no se versionan en el repositorio.
6. **No se encontro uso de SQL crudo**: Todas las consultas van a traves del SDK de Supabase (PostgREST), mitigando inyeccion SQL.
7. **No se encontro `dangerouslySetInnerHTML`**: Prevencion basica de XSS en componentes React.
8. **Validacion de archivos en endpoint audio**: Solo permite `dingdong.mp3`, previniendo path traversal.

---

## Roadmap de Remediacion Priorizado

### Fase 1 - Criticos (Semana 1)

| Prioridad | ID | Accion | Esfuerzo estimado |
|---|---|---|---|
| 1 | SEC-001 | ✅ Restaurar verificacion de super_admin en middleware | 1 hora |
| 2 | SEC-003 | ✅ Implementar verificacion real de sesion en super-admin layout | 2 horas |
| 3 | SEC-002 | ✅ Agregar verificacion de rol server-side en middleware para dashboard | 4 horas |
| 4 | SEC-007 | ✅ Eliminar cifrado XOR; reemplazar con Web Crypto API si es necesario | 2 horas |

### Fase 2 - Altos (Semana 2)

| Prioridad | ID | Accion | Esfuerzo estimado |
|---|---|---|---|
| 5 | SEC-004 | ✅ Cambiar middleware a fail-closed | 1 hora |
| 6 | SEC-008 | ✅ Reemplazar Math.random() con crypto.getRandomValues() | 30 min |
| 7 | SEC-013 | ✅ Restringir CORS al dominio de la aplicacion | 1 hora |
| 8 | SEC-011 | ✅ Anonimizar nombres en pantalla publica (iniciales o codigo) | 3 horas |

### Fase 3 - Medios (Semanas 3-4)

| Prioridad | ID | Accion | Esfuerzo estimado |
|---|---|---|---|
| 9 | SEC-014 | ✅ Configurar headers de seguridad HTTP en next.config.js | 1 hora |
| 10 | SEC-017 | ✅ Reemplazar getSession() con getUser() en todos los componentes | 2 horas |
| 11 | SEC-006 | ✅ Restringir RLS de patient por institucion | 2 horas |
| 12 | SEC-005 | ✅ Agregar verificacion de rol en RLS de daily_queue | 1 hora |
| 13 | SEC-015 | Refactorizar API memberships para usar token del usuario | 2 horas |
| 14 | SEC-009 | Implementar generacion segura de contrasenas y cambio obligatorio | 3 horas |
| 15 | SEC-016 | Ejecutar npm audit y actualizar dependencias | 2 horas |

### Fase 4 - Bajos e Informativos (Mes 2)

| Prioridad | ID | Accion | Esfuerzo estimado |
|---|---|---|---|
| 16 | SEC-018 | Integrar validacion de contrasenas fuertes en API | 1 hora |
| 17 | SEC-019 | Implementar rate limiting especifico para login | 2 horas |
| 18 | SEC-020 | Migrar a servicio TTS oficial (Google Cloud TTS o Amazon Polly) | 4 horas |
| 19 | SEC-021 | Eliminar dependencia de ipify.org en audit logger | 1 hora |
| 20 | SEC-022 | Limpiar o completar SecurityManager | 4 horas |

---

## Metodologia

Esta auditoria fue realizada mediante revision estatica del codigo fuente. Se revisaron:

- 5 API routes
- 1 middleware de Next.js
- 16 paginas del dashboard
- 3 paginas publicas
- 18 paginas de super-admin
- 14 hooks personalizados
- 11 modulos de biblioteca
- 4 archivos de migracion de base de datos
- 1 archivo de politicas RLS
- Archivos de configuracion (next.config.js, package.json, .env.example, .gitignore)

No se realizaron pruebas dinamicas (penetration testing) ni se verifico la configuracion real de Supabase o Vercel en produccion.

---

*Fin del informe de auditoria - 2026-03-06*
