# Sistema de Privacidad - Turnero ZS

## 📋 Introducción

El Sistema de Privacidad permite proteger los datos personales de los pacientes en pantallas públicas, cumpliendo con normativas de confidencialidad y privacidad en entornos de salud.

**Fecha de Implementación:** Enero 2025
**Estado:** ✅ Completamente implementado y funcional

## 🎯 Objetivos

1. **Proteger información sensible** de pacientes en pantallas públicas
2. **Flexibilidad** para configurar niveles de privacidad según contexto
3. **Jerarquía clara** de configuración (turno > servicio > institución)
4. **Cumplimiento normativo** con leyes de protección de datos personales

## 🔒 Niveles de Privacidad

### 1. public_full_name (Nombre Completo)
**Uso:** Áreas con privacidad controlada, consultorios cerrados
**Muestra:** Nombre completo del paciente
**Ejemplo:** "Juan Pérez"

```typescript
// Configuración recomendada
- Consultorios privados
- Salas de enfermería
- Áreas con acceso restringido
```

### 2. public_initials (Solo Iniciales)
**Uso:** Salas de espera con público general
**Muestra:** Iniciales del nombre y apellido
**Ejemplo:** "J.P."

```typescript
// Configuración recomendada (DEFAULT)
- Salas de espera generales
- Áreas con múltiples pacientes
- Pantallas en pasillos públicos
```

### 3. private_ticket_only (Solo Número de Turno)
**Uso:** Servicios con máxima privacidad (salud mental, VIH, etc.)
**Muestra:** Solo número de turno
**Ejemplo:** "Turno 001"

```typescript
// Configuración recomendada
- Servicios de salud mental
- Consultorios de infectología
- Áreas con protección especial
- Servicios de violencia de género
```

## 🏗️ Arquitectura de Jerarquía

El sistema aplica privacidad en **3 niveles jerárquicos** con prioridad descendente:

```
┌─────────────────────────────────────────┐
│  1. APPOINTMENT (Turno Individual)      │ ← Prioridad MÁXIMA
│     └─ privacy_level: nullable          │
└─────────────────────────────────────────┘
            ↓ Si NULL, hereda de...
┌─────────────────────────────────────────┐
│  2. SERVICE (Servicio)                  │ ← Prioridad MEDIA
│     └─ privacy_level: nullable          │
└─────────────────────────────────────────┘
            ↓ Si NULL, hereda de...
┌─────────────────────────────────────────┐
│  3. INSTITUTION (Institución)           │ ← Valor por DEFECTO
│     └─ privacy_level: 'public_initials' │
└─────────────────────────────────────────┘
```

### Ejemplos de Resolución

**Ejemplo 1: Turno con privacidad específica**
```
Appointment.privacy_level = 'private_ticket_only'
Service.privacy_level = 'public_initials'
Institution.privacy_level = 'public_full_name'
→ RESULTADO: 'private_ticket_only' (prioridad del turno)
```

**Ejemplo 2: Herencia desde servicio**
```
Appointment.privacy_level = NULL
Service.privacy_level = 'private_ticket_only'
Institution.privacy_level = 'public_initials'
→ RESULTADO: 'private_ticket_only' (hereda del servicio)
```

**Ejemplo 3: Herencia desde institución**
```
Appointment.privacy_level = NULL
Service.privacy_level = NULL
Institution.privacy_level = 'public_initials'
→ RESULTADO: 'public_initials' (valor por defecto institucional)
```

## 💾 Implementación en Base de Datos

### Enum de Niveles de Privacidad

```sql
-- Crear enum
CREATE TYPE privacy_level AS ENUM (
  'public_full_name',
  'public_initials',
  'private_ticket_only'
);
```

### Columnas Agregadas

```sql
-- Institución (valor por defecto)
ALTER TABLE institution
  ADD COLUMN privacy_level privacy_level DEFAULT 'public_initials';

-- Servicio (nivel heredable)
ALTER TABLE service
  ADD COLUMN privacy_level privacy_level DEFAULT NULL;

-- Turno (nivel de máxima prioridad)
ALTER TABLE appointment
  ADD COLUMN privacy_level privacy_level DEFAULT NULL;
```

### Función resolve_privacy_level()

Resuelve el nivel de privacidad según la jerarquía:

```sql
CREATE OR REPLACE FUNCTION resolve_privacy_level(appointment_id UUID)
RETURNS privacy_level
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result privacy_level;
BEGIN
  SELECT
    COALESCE(
      a.privacy_level,           -- 1. Nivel del turno
      s.privacy_level,           -- 2. Nivel del servicio
      i.privacy_level            -- 3. Nivel de la institución
    )
  INTO result
  FROM appointment a
  LEFT JOIN service s ON a.service_id = s.id
  LEFT JOIN institution i ON a.institution_id = i.id
  WHERE a.id = appointment_id;

  RETURN result;
END;
$$;
```

### Función get_display_name()

Genera el nombre a mostrar según el nivel de privacidad:

```sql
CREATE OR REPLACE FUNCTION get_display_name(
  first_name TEXT,
  last_name TEXT,
  ticket_number TEXT,
  privacy privacy_level
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE privacy
    WHEN 'public_full_name' THEN
      RETURN first_name || ' ' || last_name;
    WHEN 'public_initials' THEN
      RETURN
        SUBSTRING(first_name FROM 1 FOR 1) || '.' ||
        SUBSTRING(last_name FROM 1 FOR 1) || '.';
    WHEN 'private_ticket_only' THEN
      RETURN 'Turno ' || ticket_number;
    ELSE
      RETURN 'Turno ' || ticket_number;
  END CASE;
END;
$$;
```

### Vista daily_queue_display

Vista optimizada con privacidad pre-resuelta:

```sql
CREATE OR REPLACE VIEW daily_queue_display AS
SELECT
  dq.id,
  dq.institution_id,
  dq.patient_id,
  dq.appointment_id,
  dq.ticket_number,
  dq.status,
  dq.service_name,
  dq.room_name,
  dq.scheduled_time,
  dq.called_at,
  dq.attended_at,
  dq.created_at,
  dq.updated_at,
  resolve_privacy_level(a.id) as resolved_privacy_level,
  get_display_name(
    p.first_name,
    p.last_name,
    dq.ticket_number,
    resolve_privacy_level(a.id)
  ) as display_name
FROM daily_queue dq
LEFT JOIN appointment a ON dq.appointment_id = a.id
LEFT JOIN patient p ON dq.patient_id = p.id;
```

## 🎨 Componentes UI

### PrivacyBadge

Badge interactivo que muestra el nivel de privacidad con íconos:

```typescript
import { Shield, Eye, EyeOff } from 'lucide-react'

interface PrivacyBadgeProps {
  level: 'public_full_name' | 'public_initials' | 'private_ticket_only'
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onClick?: () => void
}

// Configuración de estilos
const privacyConfig = {
  public_full_name: {
    icon: Eye,
    label: 'Público',
    color: 'bg-green-100 text-green-700 border-green-300'
  },
  public_initials: {
    icon: Shield,
    label: 'Iniciales',
    color: 'bg-blue-100 text-blue-700 border-blue-300'
  },
  private_ticket_only: {
    icon: EyeOff,
    label: 'Privado',
    color: 'bg-red-100 text-red-700 border-red-300'
  }
}
```

**Uso:**
```tsx
// Badge estático (solo lectura)
<PrivacyBadge level="public_initials" />

// Badge interactivo (clickeable)
<PrivacyBadge
  level={currentLevel}
  interactive
  onClick={handlePrivacyClick}
/>
```

### PrivacySelector

Selector desplegable para cambiar nivel de privacidad:

```typescript
interface PrivacySelectorProps {
  value: 'public_full_name' | 'public_initials' | 'private_ticket_only' | null
  onChange: (value: privacy_level | null) => void
  showInheritOption?: boolean
  inheritedFrom?: 'service' | 'institution'
  inheritedValue?: privacy_level
}
```

**Uso en formularios:**
```tsx
<PrivacySelector
  value={appointment.privacy_level}
  onChange={(newLevel) => updateAppointment({ privacy_level: newLevel })}
  showInheritOption={true}
  inheritedFrom="service"
  inheritedValue="public_initials"
/>
```

## 📱 Casos de Uso

### Caso 1: CAPS General

**Configuración:**
- Institution: `public_initials` (default)
- Servicios: NULL (heredan de institución)
- Turnos: NULL (heredan de servicio/institución)

**Resultado:**
- Sala de espera muestra: "J.P.", "M.L.", "C.R."
- Cumple con privacidad estándar para salud pública

### Caso 2: Servicio de Salud Mental

**Configuración:**
- Institution: `public_initials`
- Servicio "Salud Mental": `private_ticket_only`
- Turnos: NULL (heredan del servicio)

**Resultado:**
- Salud Mental muestra: "Turno 001", "Turno 002", "Turno 003"
- Otros servicios muestran: "J.P.", "M.L."
- Máxima privacidad para salud mental

### Caso 3: Hospital con Consultorios Privados

**Configuración:**
- Institution: `public_initials`
- Servicios: NULL
- Turnos en consultorios cerrados: `public_full_name`

**Resultado:**
- Pantalla general: "J.P.", "M.L." (iniciales)
- Pantalla en consultorio privado: "Juan Pérez" (nombre completo)
- Flexible según contexto

### Caso 4: Override Individual

**Configuración:**
- Institution: `public_initials`
- Servicio: `public_full_name`
- Turno específico: `private_ticket_only`

**Resultado:**
- Ese turno específico muestra: "Turno 001"
- Otros turnos del mismo servicio: "Juan Pérez"
- Control granular por turno

## ⚙️ Configuración

### 1. Configuración Institucional (Default)

```typescript
// En /admin/configuracion
const InstitutionSettings = () => {
  return (
    <PrivacySelector
      value={institution.privacy_level}
      onChange={async (newLevel) => {
        await supabase
          .from('institution')
          .update({ privacy_level: newLevel })
          .eq('id', institutionId)
      }}
      showInheritOption={false}
    />
  )
}
```

### 2. Configuración por Servicio

```typescript
// En /servicios (formulario de edición)
const ServiceForm = () => {
  return (
    <PrivacySelector
      value={service.privacy_level}
      onChange={(newLevel) => setService({ ...service, privacy_level: newLevel })}
      showInheritOption={true}
      inheritedFrom="institution"
      inheritedValue={institution.privacy_level}
    />
  )
}
```

### 3. Configuración por Turno Individual

```typescript
// En /turnos (badge interactivo en tabla)
const AppointmentRow = ({ appointment }) => {
  return (
    <PrivacyBadge
      level={resolvePrivacyLevel(appointment)}
      interactive
      onClick={() => setShowPrivacyDialog(true)}
    />
  )
}
```

## 🔧 Integración con Pantallas Públicas

### Uso de la Vista daily_queue_display

```typescript
// app/(public)/pantalla/[slug]/page.tsx
const { data: queue } = await supabase
  .from('daily_queue_display')  // ← Usar vista con privacidad
  .select('*')
  .eq('institution_id', institutionId)
  .in('status', ['esperando', 'llamado'])
  .order('scheduled_time', { ascending: true })

// Los datos ya vienen con:
// - resolved_privacy_level: nivel de privacidad calculado
// - display_name: nombre formateado según privacidad
```

### Renderizado en Componentes

```tsx
const QueueItem = ({ item }) => (
  <div className="queue-item">
    <div className="patient-name">
      {item.display_name}  {/* Ya viene formateado */}
    </div>
    <PrivacyBadge
      level={item.resolved_privacy_level}
      size="sm"
    />
    <div className="room">
      {item.room_name}
    </div>
  </div>
)
```

## 🧪 Testing

### Validación de Jerarquía

```sql
-- Test 1: Turno con nivel propio
INSERT INTO appointment (privacy_level, service_id, institution_id, ...)
VALUES ('private_ticket_only', ...);

SELECT resolve_privacy_level(id) FROM appointment WHERE ...;
-- Esperado: 'private_ticket_only'

-- Test 2: Herencia desde servicio
INSERT INTO appointment (privacy_level, service_id, institution_id, ...)
VALUES (NULL, ...);  -- Servicio tiene 'public_initials'

SELECT resolve_privacy_level(id) FROM appointment WHERE ...;
-- Esperado: 'public_initials'

-- Test 3: Herencia desde institución
INSERT INTO appointment (privacy_level, service_id, institution_id, ...)
VALUES (NULL, ...);  -- Servicio NULL, institución 'public_full_name'

SELECT resolve_privacy_level(id) FROM appointment WHERE ...;
-- Esperado: 'public_full_name'
```

### Validación de Nombres

```sql
-- Test de formato de nombres
SELECT get_display_name(
  'Juan',
  'Pérez',
  '001',
  'public_full_name'
);
-- Esperado: 'Juan Pérez'

SELECT get_display_name(
  'Juan',
  'Pérez',
  '001',
  'public_initials'
);
-- Esperado: 'J.P.'

SELECT get_display_name(
  'Juan',
  'Pérez',
  '001',
  'private_ticket_only'
);
-- Esperado: 'Turno 001'
```

## 📊 Métricas y Monitoreo

### Estadísticas de Uso

```sql
-- Distribución de niveles de privacidad activos
SELECT
  resolved_privacy_level,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM daily_queue_display
WHERE created_at >= CURRENT_DATE
GROUP BY resolved_privacy_level;
```

### Auditoría de Cambios

```sql
-- Log de cambios de privacidad (requiere trigger)
CREATE TABLE privacy_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'institution' | 'service' | 'appointment'
  entity_id UUID NOT NULL,
  old_value privacy_level,
  new_value privacy_level,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);
```

## 🔐 Seguridad y Compliance

### Políticas RLS

```sql
-- Los usuarios solo pueden ver niveles de privacidad de su institución
CREATE POLICY "users_can_view_privacy_settings"
ON service
FOR SELECT
USING (
  institution_id IN (
    SELECT institution_id
    FROM membership
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);
```

### Auditoría y Logs

- Todos los cambios de privacidad se registran
- Solo administradores pueden cambiar configuración
- Pantallas públicas no pueden modificar privacidad
- Cumplimiento con Ley 25.326 (Protección de Datos Personales)

## 📝 Mejores Prácticas

### Recomendaciones

1. **Default Seguro:** Usar `public_initials` como valor por defecto institucional
2. **Servicios Sensibles:** Configurar `private_ticket_only` para:
   - Salud Mental
   - Infectología/VIH
   - Violencia de Género
   - Adicciones
3. **Áreas Privadas:** Usar `public_full_name` solo en consultorios cerrados
4. **Documentar:** Mantener registro de decisiones de privacidad
5. **Capacitar:** Instruir al personal sobre niveles y cuándo modificarlos

### Anti-patrones a Evitar

- ❌ Usar `public_full_name` por defecto en institución
- ❌ No configurar privacidad en servicios sensibles
- ❌ Cambiar niveles sin documentación
- ❌ Exponer datos personales en pantallas de alto tráfico
- ❌ No revisar configuración periódicamente

## 🚀 Migración

### Migración 013_add_privacy_system.sql

```sql
-- Crear enum
CREATE TYPE privacy_level AS ENUM (
  'public_full_name',
  'public_initials',
  'private_ticket_only'
);

-- Agregar columnas
ALTER TABLE institution ADD COLUMN privacy_level privacy_level DEFAULT 'public_initials';
ALTER TABLE service ADD COLUMN privacy_level privacy_level DEFAULT NULL;
ALTER TABLE appointment ADD COLUMN privacy_level privacy_level DEFAULT NULL;

-- Crear funciones
CREATE OR REPLACE FUNCTION resolve_privacy_level(appointment_id UUID) ...
CREATE OR REPLACE FUNCTION get_display_name(...) ...

-- Crear vista
CREATE OR REPLACE VIEW daily_queue_display AS ...
```

## 📚 Referencias

- **Ley 25.326** - Protección de Datos Personales (Argentina)
- **Resolución 4/2019** - AAIP - Directrices para tratamiento de datos de salud
- **WCAG 2.1** - Accesibilidad web (para componentes UI)

## 📞 Soporte

Para consultas sobre privacidad:
1. Revisar esta documentación
2. Consultar `GUIA-ADMINISTRADOR.md` para configuración
3. Ver `database.md` para detalles técnicos de DB
4. Contactar al administrador del sistema

---

**Última actualización:** Enero 2025
**Estado:** Producción Ready ✅
