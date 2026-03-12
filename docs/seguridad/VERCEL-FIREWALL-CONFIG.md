# Configuración de Vercel Firewall

## Descripción General

Turnero ZS utiliza **Vercel Firewall** para proteger la aplicación contra:
1. **Abuso de rate limiting** - Evitar ataques DDoS y uso excesivo
2. **Acceso desde países no autorizados** - Restricción geográfica para Argentina

Esta documentación describe las reglas configuradas en Vercel.

---

## 📋 Reglas Configuradas

### 1️⃣ Rate Limit API

**Nombre:** Rate limit API

**Descripción:** Evita abusos en endpoints `/api/*`

**Configuración:**
- **Path:** Starts with `/api/`
- **Tipo de límite:** Fixed Windows
- **Ventana:** 60 segundos
- **Requests permitidos:** 100 por IP
- **Clave de rate limiting:** IP Address
- **Acción:** Retorna HTTP 429 (Too Many Requests)

**Endpoints afectados:**
- `GET /api/audio?file=dingdong.mp3` - Servidor de archivos de audio
- `GET /api/tts?text=...&lang=es-AR` - Text-to-Speech para displays
- `POST /api/admin/users` - Creación de usuarios (admin)
- `GET /api/user/memberships` - Obtención de membresías del usuario

**Impacto esperado:**
- Clientes que excedan 100 requests en 60 segundos recibirán 429
- Pantallas públicas deben estar preparadas para manejar 429
- Sistema de TTS debe reintentar con backoff exponencial

---

### 2️⃣ Bloquear País

**Nombre:** Bloquear País

**Descripción:** Bloquear acceso desde países que no sean Argentina

**Configuración:**
- **Header:** `X-Vercel-IP-Country`
- **Condición:** Does not equal `AR`
- **Acción:** Deny (Retorna 403 Forbidden)

**Países permitidos:**
- ✅ Argentina (AR)

**Países bloqueados:**
- ❌ Todos los demás

**Headers utilizado:**
```
X-Vercel-IP-Country: AR
```

Vercel detecta automáticamente el país del cliente usando su IP.

---

## 🔍 Verificación de Reglas

### En Vercel Dashboard:

1. Ir a tu proyecto en Vercel
2. Settings → Security (o Firewall)
3. Verificar que ambas reglas estén **Active**

### Desde el código:

Los headers están disponibles en requests:

```typescript
const country = request.headers.get('x-vercel-ip-country');
const ip = request.headers.get('x-forwarded-for');

console.log(`Request from: ${country} (${ip})`);
```

---

## 🛡️ Seguridad de Endpoints

### Análisis de Endpoints `/api/*`:

| Endpoint | Método | Autenticación | Rate Limit | Notas |
|----------|--------|----------------|-----------|-------|
| `/api/audio` | GET | ❌ Pública | ✅ 100/60s | Servidor de audios (permitido público) |
| `/api/tts` | GET | ❌ Pública | ✅ 100/60s | TTS para pantallas públicas (permitido) |
| `/api/admin/users` | POST | ⚠️ TODO | ✅ 100/60s | ⚠️ CRÍTICO: Validar sesión super_admin |
| `/api/user/memberships` | GET | ✅ Bearer Token | ✅ 100/60s | Requiere token válido |

### ⚠️ Endpoints Críticos:

**`POST /api/admin/users`** - ⚠️ REQUIERE ATENCIÓN
- Status actual: Sin validación de sesión
- TODO: Agregar validación de super_admin antes de crear usuario
- Riesgo: Cualquiera podría crear usuarios si no se valida

---

## 📊 Comportamiento Esperado

### Escenario 1: Cliente argentino, requests normales
```
Usuario desde Buenos Aires
↓
IP Country: AR ✅ Permitido
↓
100 requests / 60s: ✅ Dentro del límite
↓
✅ Acceso normal
```

### Escenario 2: Cliente del exterior
```
Usuario desde Brasil
↓
IP Country: BR ❌ Bloqueado
↓
Vercel retorna 403 Forbidden
↓
❌ Acceso denegado
```

### Escenario 3: Rate limit excedido
```
Bot/Script desde Argentina
↓
IP Country: AR ✅ Permitido
↓
150 requests / 60s: ❌ Excede límite
↓
Vercel retorna 429 Too Many Requests
↓
⏸️ Cliente debe esperar antes de reintentar
```

---

## 🔧 Manejo de Errores en el Código

### Error 429 (Rate Limit)

Los clientes deben manejar esto:

```typescript
// En componentes/frontend
try {
  const response = await fetch('/api/tts?text=...');

  if (response.status === 429) {
    // Esperar antes de reintentar
    await new Promise(r => setTimeout(r, 1000));
    // Reintentar...
  }
} catch (error) {
  // Manejar error
}
```

### Error 403 (Geo-blocked)

Los clientes desde el exterior verán 403:

```typescript
if (response.status === 403) {
  // Mostrar página de error: "Servicio no disponible en tu país"
}
```

---

## 📈 Monitoreo

### Logs disponibles:

En Vercel Dashboard → Analytics → Requests:
- Número de requests bloqueados por 429
- Número de requests bloqueados por 403
- Países desde donde se intenta acceder

### En el código:

Se loguean intentos sospechosos en:
- `lib/monitoring.ts` → Tabla `security_logs` en Supabase
- Archivos de log de Next.js

---

## ✅ Checklist de Implementación

- [x] Configurar Rate Limit en Vercel Firewall
- [x] Configurar Geo-blocking en Vercel Firewall
- [x] Documentar reglas en este archivo
- [ ] Agregar manejo de 429 en endpoints
- [ ] Agregar manejo de 403 en endpoints
- [ ] Crear páginas de error 429 y 403
- [ ] Agregar logging de security events
- [ ] Crear tests para validar comportamiento
- [ ] Documentar en README para el equipo

---

## 🚀 Próximos Pasos

1. **Validar endpoints protegidos:**
   - [ ] Asegurar que `/api/admin/users` solo sea accesible para super_admin
   - [ ] Revisar otros endpoints de admin

2. **Implementar logging:**
   - [ ] Crear tabla `security_logs` en Supabase
   - [ ] Loguear intentos de 429 y 403

3. **Mejorar UX:**
   - [ ] Crear páginas bonitas para 429 y 403
   - [ ] Agregar toast notifications en pantallas

4. **Testing:**
   - [ ] Tests de rate limit
   - [ ] Tests de geo-blocking

---

## 📚 Referencias

- [Vercel Firewall Docs](https://vercel.com/docs/security/firewall)
- [HTTP 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
- [HTTP 403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403)
- [Geolocation Headers](https://vercel.com/docs/concepts/edge-network/headers#x-vercel-ip-country)
