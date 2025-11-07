# 🚀 Próximos Pasos - Firewall Vercel

## ✅ Lo que ya está hecho

El código de soporte completo para Vercel Firewall ya está implementado y listo para usar. Solo necesitas:

1. **Subir los cambios a Vercel**
2. **Probar que funciona correctamente**
3. **(Opcional) Crear tabla de logging en Supabase**

---

## 📋 Checklist de Próximos Pasos

### Paso 1: Revisar los cambios (5 min)

Lee la documentación que se creó:

```bash
# Guía completa del firewall
docs/VERCEL-FIREWALL-CONFIG.md

# Resumen técnico de lo que se implementó
docs/IMPLEMENTATION-SUMMARY-FIREWALL.md
```

### Paso 2: Verificar variables .env (5 min)

Revisa `.env.example` para ver qué variables se agregaron:

```env
# Rate Limiting (Vercel Firewall)
NEXT_PUBLIC_RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# Geo-Blocking (Vercel Firewall)
NEXT_PUBLIC_GEO_BLOCK_ENABLED=true
ALLOWED_COUNTRIES=AR
```

No necesitas crear variables nuevas si no quieres - las configuraciones por defecto son correctas.

### Paso 3: Git Commit (5 min)

Los cambios están listos para commitear:

```bash
git add .
git commit -m "feat: implement firewall support for rate limiting and geo-blocking

- Add header utilities to detect client country and IP
- Implement security event logging infrastructure
- Add beautiful error pages for 429 (rate limit) and 403 (geo-blocked)
- Update middleware to log all API requests with security info
- Add centralized firewall configuration
- Document Vercel Firewall setup and implementation details"
```

### Paso 4: Subir a Vercel (1 min)

Solo push normal:

```bash
git push origin main
```

### Paso 5: Probar en Vercel (10 min)

Una vez que se desplegó en Vercel:

**Test 1: Verificar que funciona desde Argentina**
- Accede a https://tu-proyecto.vercel.app desde Argentina
- Debe funcionar normalmente
- Revisa logs en Vercel Dashboard → Functions → ver logs

**Test 2: Verificar geo-blocking**
- Usa VPN desde Brasil, USA, etc
- Deberías ver página 403 con mensaje
- Vercel Dashboard → Firewall Rules → ver bloqueados

**Test 3: Verificar rate limit**
- Haz ~150 requests rápidos a `/api/tts?text=test`
- Después del request 100, deberías ver 429
- Espera 60 segundos, luego debería funcionar nuevamente

---

## 🛠️ Fixes Críticos Pendientes

### 1. **Validación de Super Admin en `/api/admin/users`** ⚠️ CRÍTICO

**Archivo:** `app/api/admin/users/route.ts`

**Problema:** No valida que el usuario sea super_admin antes de crear usuarios

**Solución:**

```typescript
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { logAuthFailure } from '@/lib/monitoring'

export async function POST(request: Request) {
  try {
    // AGREGAR ESTO:
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await logAuthFailure(request, '/api/admin/users', 'Missing token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      await logAuthFailure(request, '/api/admin/users', 'Invalid token')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verificar que sea super_admin
    const { data: memberships } = await supabaseAdmin
      .from('membership')
      .select('role')
      .eq('user_id', user.id)

    const isSuperAdmin = memberships?.some((m: any) => m.role === 'super_admin')

    if (!isSuperAdmin) {
      await logAuthFailure(request, '/api/admin/users', 'Not super_admin')
      return NextResponse.json({ error: 'Forbidden: Super admin required' }, { status: 403 })
    }

    // Resto del código existente...
  } catch (error: any) {
    // ... error handling
  }
}
```

---

## 📊 (Opcional) Crear tabla `security_logs` en Supabase

Si quieres guardar logs de eventos de seguridad en Supabase (para dashboards, auditoría, etc):

**SQL a ejecutar en Supabase Editor:**

```sql
-- Crear tabla de logs de seguridad
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  country VARCHAR(2),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para queries rápidas
CREATE INDEX idx_security_logs_created_at
  ON security_logs(created_at DESC);

CREATE INDEX idx_security_logs_event_type
  ON security_logs(event_type);

-- Enable RLS (Row Level Security)
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Solo super_admin puede ver logs
CREATE POLICY "super_admin_can_view_security_logs"
  ON security_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM membership
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );
```

Una vez creada, la tabla `security_logs` recibirá automáticamente logs si llamas a `logSecurityEvent()` desde los endpoints.

**Ejemplo de query para ver logs de última hora:**

```sql
SELECT
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT ip_address) as unique_ips
FROM security_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type
ORDER BY count DESC;
```

---

## 🔍 Archivos para Referencia

Estos archivos tienen toda la información que necesitas:

| Archivo | Propósito |
|---------|-----------|
| `docs/VERCEL-FIREWALL-CONFIG.md` | 📘 Guía completa del firewall |
| `docs/IMPLEMENTATION-SUMMARY-FIREWALL.md` | 📊 Resumen técnico |
| `lib/headers.ts` | 🛠️ Utilidades para país/IP |
| `lib/monitoring.ts` | 📝 Logging de seguridad |
| `lib/firewall-config.ts` | ⚙️ Configuración centralizada |
| `app/error/429/page.tsx` | 🎨 Página de rate limit |
| `app/error/403/page.tsx` | 🎨 Página de geo-blocked |
| `.env.example` | 📋 Variables de entorno |

---

## 📚 Lectura Recomendada

Si quieres entender mejor cómo funciona:

1. Lee `docs/VERCEL-FIREWALL-CONFIG.md` - Explica reglas de Vercel
2. Lee `lib/headers.ts` - Utilidades simples y directas
3. Lee `lib/monitoring.ts` - Cómo se loguean eventos
4. Prueba en local: modifica la IP/país en headers y ve qué pasa

---

## ✅ Resumen Final

| Ítem | Estado | Comentario |
|------|--------|-----------|
| Vercel Firewall Configurado | ✅ | Ya lo hiciste |
| Código de Soporte Implementado | ✅ | Totalmente completado |
| Documentación Creada | ✅ | Completa y detallada |
| Páginas de Error | ✅ | Listas para usar |
| Middleware Logging | ✅ | Ya activo |
| Validación Super Admin | ⚠️ | DEBE ARREGLARSE |
| Tabla security_logs | 🟡 | Opcional pero recomendado |

---

## 🎯 Próximo Paso Más Importante

**ASEGÚRATE DE ARREGLAR LA VALIDACIÓN EN `/api/admin/users`**

Sin esto, cualquiera puede crear usuarios en tu sistema. Eso es un riesgo crítico de seguridad.

---

¿Necesitas ayuda con algo de esto? Avísame y lo hacemos juntos. 🚀
