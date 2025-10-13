# IMPLEMENTACIÓN ACTUAL DEL SISTEMA DE TURNOS

## ⚠️ IMPORTANTE: SISTEMA ACTIVO vs SISTEMA FUTURO

### 🟢 SISTEMA ACTIVO (EN USO)

El sistema **ACTUALMENTE EN PRODUCCIÓN** utiliza la tabla `daily_queue` para gestión de turnos del día.

#### Tabla principal: `daily_queue`

**Razón de implementación:**
- Los administrativos necesitaban un sistema MÁS ÁGIL
- En vez de registrar pacientes en la BD primero y luego crear turnos (doble trabajo)
- Se registran pacientes directamente en la cola del día
- No requiere que los pacientes estén previamente registrados en la tabla `patient`
- Los datos se gestionan POR DÍA, no se preregistran turnos

**Estructura de datos:**
```typescript
interface DailyQueue {
  id: string
  order_number: number           // Número de orden: 001, 002, 003...
  patient_name: string           // Nombre completo del paciente
  patient_dni: string            // DNI del paciente
  service_id: string             // Servicio asignado
  institution_id: string         // Institución
  status: 'pendiente' | 'disponible' | 'llamado' | 'atendido' | 'cancelado'
  queue_date: Date               // Fecha de la cola (CURRENT_DATE)
  created_at: timestamp
  enabled_at: timestamp          // Cuando se marca como disponible
  called_at: timestamp           // Cuando se llama al paciente
  attended_at: timestamp         // Cuando se atiende
  created_by: string
  called_by: string
}
```

**Estados del flujo:**
1. `pendiente` → Recién creado, NO se muestra en pantalla (gris)
2. `disponible` → Listo para ser llamado, SE MUESTRA en pantalla (verde)
3. `llamado` → Paciente llamado, aparece en pantalla con animación (morado pulsante)
4. `atendido` → Paciente atendido, desaparece de pantalla (verde)
5. `cancelado` → Turno cancelado

**Archivos que DEBEN usar `daily_queue`:**
- ✅ `app/(public)/pantalla/[slug]/page.tsx` - Pantalla pública
- ✅ `app/(dashboard)/turnos/page.tsx` - Gestión de turnos
- ✅ `components/multi-service-display.tsx` - Display multi-servicio
- ✅ `components/layouts/list-layout.tsx` - Layout de lista
- ✅ `components/layouts/grid-layout.tsx` - Layout de grilla
- ✅ `components/layouts/carousel-layout.tsx` - Layout carrusel

### 🔴 SISTEMA FUTURO (NO IMPLEMENTADO)

La tabla `appointment` existe en la base de datos pero **NO ESTÁ EN USO ACTUALMENTE**.

#### Tabla: `appointment` (IMPLEMENTACIÓN FUTURA)

**Esta tabla se usará cuando:**
- Se implemente el sistema completo de gestión de pacientes
- Los pacientes estén registrados previamente en la tabla `patient`
- Se necesite gestión de turnos programados (no solo del día)
- Se integre con HSI u otros sistemas externos
- Se implemente el módulo de agendamiento previo

**⚠️ IMPORTANTE: Si ves código usando `appointment`, márcalo como:**
```typescript
// TODO: IMPLEMENTACIÓN FUTURA - Migrar a daily_queue
// La tabla appointment NO está en uso actualmente
// El sistema activo usa daily_queue para gestión de turnos del día
```

## 📋 CHECKLIST DE VERIFICACIÓN

Cuando trabajes en funcionalidades de turnos:

- [ ] ¿Estás usando `daily_queue`? ✅ CORRECTO
- [ ] ¿Estás usando `appointment`? ❌ INCORRECTO (es implementación futura)
- [ ] ¿El query filtra por `queue_date = CURRENT_DATE`? ✅ CORRECTO
- [ ] ¿Los estados son: pendiente/disponible/llamado/atendido? ✅ CORRECTO
- [ ] ¿Usas `patient_name` completo en lugar de first_name/last_name? ✅ CORRECTO
- [ ] ¿Muestras `order_number` como número de orden? ✅ CORRECTO

## 🔧 QUERIES DE EJEMPLO CORRECTOS

### Obtener cola del día para pantalla pública:
```sql
SELECT
  id,
  order_number,
  patient_name,
  status,
  called_at,
  queue_date,
  service:service_id (name)
FROM daily_queue
WHERE institution_id = 'xxx'
  AND queue_date = CURRENT_DATE
  AND status IN ('disponible', 'llamado', 'atendido')
ORDER BY order_number ASC
```

### Suscripción en tiempo real:
```typescript
supabase
  .channel('public-display-{institutionId}')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'daily_queue',  // ✅ CORRECTO
    filter: `institution_id=eq.{institutionId}`
  }, callback)
```

## 📅 HISTORIAL DE CONFUSIONES

- **2025-10-13**: La pantalla pública estaba consultando `appointment` en lugar de `daily_queue`
- **Causa**: Claude no tenía documentación clara de qué sistema está activo
- **Solución**: Este documento

## 🚀 ROADMAP FUTURO

Cuando se implemente `appointment`:
1. Migrar datos históricos de `daily_queue` a `appointment`
2. Mantener `daily_queue` para turnos walk-in del día
3. Usar `appointment` para turnos programados
4. Integración con HSI
5. Módulo de pacientes registrados
