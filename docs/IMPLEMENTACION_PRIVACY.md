# Guía de Implementación: Sistema de Privacidad y Gestión de Pantallas

## 📋 Resumen

Se ha implementado un sistema completo de privacidad multinivel y gestión de pantallas autenticadas para el sistema de turnos. Este documento describe cómo aplicar e integrar todos los cambios.

---

## ✅ Archivos Creados

### Base de Datos
- `db/migrations/013_add_privacy_system.sql` - Migración completa del sistema

### Librerías
- `lib/privacy-utils.ts` - Utilidades de privacidad (frontend)

### Componentes
- `components/PrivacyBadge.tsx` - Badge interactivo para cambio rápido
- `components/PrivacySelector.tsx` - Selector para formularios

### Actualizados
- `lib/audio-utils.ts` - Nueva función `generateTTSText()`
- `db/migrations/012_enable_anonymous_access_daily_queue.sql` - **ELIMINAR** (reemplazada por 013)

---

## 🚀 Paso 1: Aplicar Migración de Base de Datos

### Opción A: SQL Editor de Supabase (Recomendado)

1. Ir a Supabase Dashboard → SQL Editor
2. Abrir el archivo `db/migrations/013_add_privacy_system.sql`
3. Copiar y pegar todo el contenido
4. Ejecutar

### Opción B: Supabase CLI (Si tienes configurado)

```bash
# Si tienes Supabase CLI configurado
supabase db push
```

### ¿Qué hace la migración?

1. ✅ Agrega columna `default_privacy_level` a `services`
2. ✅ Agrega columna `privacy_level` a `appointments`
3. ✅ Agrega columna `privacy_level` a `daily_queue`
4. ✅ Agrega columna `default_privacy_level` a `institutions`
5. ✅ Crea tabla `display_devices` para gestión de pantallas
6. ✅ Crea funciones SQL: `resolve_privacy_level()` y `get_display_name()`
7. ✅ Crea vista `daily_queue_display` con privacidad resuelta
8. ✅ Configura servicios sensibles (psiquiatría, salud mental, etc.) con privacidad alta
9. ✅ Crea políticas RLS para `display_devices`
10. ✅ Actualiza políticas RLS de `daily_queue` para pantallas autenticadas
11. ✅ Elimina política anónima anterior
12. ✅ Crea trigger para sincronizar privacy_level

---

## 🔧 Paso 2: Integrar en Formularios Existentes

### A. Formulario de Crear Turno

Agregar el selector de privacidad al formulario de creación de turnos:

```tsx
import { PrivacySelector } from '@/components/PrivacySelector'
import { useState } from 'react'
import type { PrivacyLevel } from '@/lib/privacy-utils'

function CreateAppointmentForm() {
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // ... resto del formulario

  return (
    <form>
      {/* Campos existentes: paciente, fecha, hora, servicio, profesional, etc. */}

      {/* NUEVO: Selector de privacidad */}
      {selectedService && (
        <PrivacySelector
          value={privacyLevel}
          onChange={setPrivacyLevel}
          serviceName={selectedService.name}
          servicePrivacyLevel={selectedService.default_privacy_level || 'public_full_name'}
        />
      )}

      {/* Al enviar el formulario, incluir privacy_level */}
      <Button onClick={async () => {
        const { data, error } = await supabase
          .from('appointments')
          .insert({
            patient_id: selectedPatient.id,
            service_id: selectedService.id,
            professional_id: selectedProfessional.id,
            scheduled_at: selectedDateTime,
            privacy_level: privacyLevel, // ← NUEVO
            // ... otros campos
          })
      }}>
        Crear Turno
      </Button>
    </form>
  )
}
```

### B. Tabla de Turnos (agregar columna de privacidad)

```tsx
import { PrivacyBadge } from '@/components/PrivacyBadge'
import { supabase } from '@/lib/supabase'

function AppointmentsTable({ appointments }) {
  const handlePrivacyChange = async (appointmentId: string, newLevel: PrivacyLevel | null) => {
    const { error } = await supabase
      .from('appointments')
      .update({ privacy_level: newLevel })
      .eq('id', appointmentId)

    if (!error) {
      // Actualizar estado local o refetch
      console.log('✅ Privacidad actualizada')
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hora</TableHead>
          <TableHead>Paciente</TableHead>
          <TableHead>Servicio</TableHead>
          <TableHead>Privacidad</TableHead> {/* ← NUEVA COLUMNA */}
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => (
          <TableRow key={appointment.id}>
            <TableCell>{appointment.scheduled_at}</TableCell>
            <TableCell>{appointment.patient_name}</TableCell>
            <TableCell>{appointment.service_name}</TableCell>

            {/* ← NUEVA COLUMNA */}
            <TableCell>
              <PrivacyBadge
                level={appointment.privacy_level}
                onChange={(newLevel) => handlePrivacyChange(appointment.id, newLevel)}
              />
            </TableCell>

            <TableCell>
              <Button onClick={() => callPatient(appointment.id)}>
                Llamar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## 📺 Paso 3: Actualizar Pantalla Pública

### A. Modificar query para obtener privacy_level

```tsx
// En app/(public)/pantalla/[slug]/page.tsx

const fetchAppointments = async () => {
  const { data, error } = await supabase
    .from('daily_queue')
    .select(`
      *,
      patient:patients!inner(first_name, last_name),
      service:services!inner(name, default_privacy_level),
      room:rooms(name),
      institution:institutions!inner(name, default_privacy_level)
    `)
    .eq('institution_id', institution.id)
    .in('status', ['esperando', 'llamado', 'en_consulta'])
    .order('order_number', { ascending: true })

  if (data) {
    // Procesar appointments con privacidad
    const processedAppointments = data.map(item => {
      const effectivePrivacy = resolvePrivacyLevel({
        appointmentPrivacy: item.privacy_level,
        servicePrivacy: item.service.default_privacy_level,
        institutionPrivacy: item.institution.default_privacy_level
      })

      const displayName = getDisplayName({
        firstName: item.patient.first_name,
        lastName: item.patient.last_name,
        privacyLevel: effectivePrivacy,
        ticketNumber: item.order_number
      })

      return {
        ...item,
        display_name: displayName,
        effective_privacy: effectivePrivacy
      }
    })

    setAppointments(processedAppointments)
  }
}
```

### B. Usar display_name en el render

```tsx
// En el render de la pantalla pública
<div className="text-2xl font-bold">
  {appointment.display_name} {/* En lugar de first_name + last_name */}
</div>
```

### C. Actualizar TTS para usar display_name

```tsx
import { generateTTSText } from '@/lib/audio-utils'

// Al llamar paciente
const callText = generateTTSText(
  appointment.display_name,  // Ya procesado según privacidad
  appointment.room_name,
  appointment.service_name
)
speak(callText)
```

---

## 🔐 Paso 4: Crear Usuario Pantalla (Manual)

### Opción A: Supabase Auth Dashboard

1. Ir a Authentication → Users → Add User
2. Email: `pantalla_caps_norte@turnero.local`
3. Password: `[generar contraseña segura]`
4. Metadata: `{ "role": "pantalla" }`

### Opción B: SQL

```sql
-- 1. Crear usuario en auth.users
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
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'pantalla_caps_norte@turnero.local',
  crypt('CONTRASEÑA_SEGURA_AQUI', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"pantalla"}',
  '{"role":"pantalla"}',
  NOW(),
  NOW()
);

-- 2. Crear membership para la institución
INSERT INTO membership (user_id, institution_id, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'pantalla_caps_norte@turnero.local'),
  (SELECT id FROM institutions WHERE slug = 'caps-norte'),
  'pantalla',
  true
);

-- 3. Crear dispositivo de pantalla
INSERT INTO display_devices (
  institution_id,
  user_id,
  name,
  description,
  type,
  is_active
) VALUES (
  (SELECT id FROM institutions WHERE slug = 'caps-norte'),
  (SELECT id FROM auth.users WHERE email = 'pantalla_caps_norte@turnero.local'),
  'Pantalla Sala Principal',
  'TV LG en sala de espera',
  'general',
  true
);
```

---

## 🖥️ Paso 5: Página de Login para Pantallas

### Crear página de login

```tsx
// app/(public)/pantalla/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function PantallaLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Verificar que el usuario tiene un dispositivo asociado
    const { data: device } = await supabase
      .from('display_devices')
      .select('*, institution:institutions(slug)')
      .eq('user_id', data.user.id)
      .eq('is_active', true)
      .single()

    if (!device) {
      setError('Este usuario no tiene acceso a pantallas')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    // Redirigir a la pantalla de su institución
    router.push(`/pantalla/${device.institution.slug}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Acceso a Pantalla Pública
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Usuario"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Proteger ruta de pantalla

```tsx
// app/(public)/pantalla/[slug]/page.tsx

useEffect(() => {
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // No autenticado, redirigir a login
      router.push('/pantalla/login')
      return
    }

    // Verificar que tiene acceso a esta institución
    const { data: device } = await supabase
      .from('display_devices')
      .select('*, institution:institutions(slug)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!device || device.institution.slug !== slug) {
      router.push('/pantalla/login')
      return
    }

    // Actualizar heartbeat
    await supabase
      .from('display_devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', user.id)

    setIsAuthenticated(true)
  }

  checkAuth()
}, [slug])

// Heartbeat cada 30 segundos
useEffect(() => {
  if (!isAuthenticated) return

  const interval = setInterval(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('display_devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', user.id)
    }
  }, 30000)

  return () => clearInterval(interval)
}, [isAuthenticated])
```

---

## 🎯 Paso 6: Configurar Servicios con Privacy

### En el formulario de crear/editar servicios

```tsx
import { PrivacySelector } from '@/components/PrivacySelector'

function ServiceForm() {
  const [defaultPrivacy, setDefaultPrivacy] = useState<PrivacyLevel>('public_full_name')

  return (
    <form>
      <Input label="Nombre del servicio" />

      {/* Selector de privacidad por defecto */}
      <div className="mt-4">
        <Label>Privacidad por defecto para turnos</Label>
        <Select
          value={defaultPrivacy}
          onValueChange={setDefaultPrivacy}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public_full_name">
              ✅ Nombre completo (recomendado para servicios generales)
            </SelectItem>
            <SelectItem value="public_initials">
              🔒 Solo iniciales
            </SelectItem>
            <SelectItem value="private_ticket_only">
              🔐 Solo turno (recomendado para Psiquiatría, Salud Mental)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={async () => {
        await supabase.from('services').insert({
          name: serviceName,
          default_privacy_level: defaultPrivacy, // ← NUEVO
          // ... otros campos
        })
      }}>
        Crear Servicio
      </Button>
    </form>
  )
}
```

---

## ✅ Checklist de Implementación

### Base de Datos
- [ ] Ejecutar migración `013_add_privacy_system.sql`
- [ ] Verificar que se creó la tabla `display_devices`
- [ ] Verificar que se agregaron columnas `privacy_level`
- [ ] Verificar funciones `resolve_privacy_level()` y `get_display_name()`

### Componentes
- [x] `PrivacyBadge.tsx` creado
- [x] `PrivacySelector.tsx` creado
- [x] `lib/privacy-utils.ts` creado

### Integraciones Pendientes
- [ ] Agregar `PrivacySelector` al formulario de crear turno
- [ ] Agregar columna de privacidad a tabla de turnos
- [ ] Actualizar pantalla pública para usar `display_name`
- [ ] Crear página de login `/pantalla/login`
- [ ] Proteger ruta `/pantalla/[slug]` con autenticación
- [ ] Agregar heartbeat a pantalla pública
- [ ] Agregar selector de privacidad a formulario de servicios

### Usuarios y Permisos
- [ ] Crear usuario pantalla para cada institución
- [ ] Crear registro en `display_devices`
- [ ] Probar login desde pantalla
- [ ] Verificar que RLS funciona correctamente

---

## 🧪 Testing

### Test 1: Crear turno con privacidad
1. Crear turno para servicio de Psiquiatría
2. Verificar que selector sugiere "Solo turno"
3. Crear turno y verificar que `privacy_level` se guarda

### Test 2: Cambio rápido de privacidad
1. En tabla de turnos, hacer click en badge
2. Cambiar privacidad
3. Verificar que se actualiza en DB

### Test 3: Pantalla pública
1. Login como usuario pantalla
2. Verificar que solo ve turnos de su institución
3. Verificar que nombres se muestran según privacidad
4. Verificar que TTS lee correctamente

### Test 4: RLS
1. Intentar acceder a `/pantalla/[slug]` sin autenticar → Redirect a login
2. Autenticar como usuario pantalla de CAPS Norte
3. Intentar acceder a pantalla de CAPS Sur → Debe fallar
4. Verificar que query de `daily_queue` solo devuelve datos permitidos

---

## 📞 Soporte

Si encuentras problemas:
1. Verificar que la migración se ejecutó correctamente
2. Verificar que las políticas RLS están activas
3. Revisar logs de Supabase para errores de permisos
4. Verificar que el usuario pantalla tiene membership activo

---

## 🎉 Resultado Final

Con esta implementación tendrás:
- ✅ Sistema de privacidad multinivel (turno, servicio, institución)
- ✅ Cambio rápido de privacidad por turno
- ✅ Pantallas autenticadas con RLS
- ✅ Gestión de dispositivos de pantalla
- ✅ Monitoreo de conexión (heartbeat)
- ✅ Protección de datos sensibles
- ✅ Cumplimiento de privacidad médica
- ✅ TTS adaptado a nivel de privacidad
