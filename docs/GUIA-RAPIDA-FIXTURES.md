# 🚀 Guía Rápida: Usando Fixtures en Tests

> **Tl;dr**: Importa fixtures, úsalas en tests, profit!

---

## 📦 Importar Fixtures

```typescript
// Importar todo
import * as fixtures from '@/tests/fixtures'

// O importar específicamente
import {
  createZone,
  mockZone,
  mockHospitalRegional,
  createAppointmentList
} from '@/tests/fixtures'
```

---

## 🎯 Patrones de Uso Comunes

### 1️⃣ Crear Datos Mínimos (Factory)
```typescript
// Zona básica
const zone = createZone()

// Modificar solo lo que necesitas
const customZone = createZone({
  name: 'Zona Test',
  description: 'Para testing'
})
```

### 2️⃣ Usar Mocks Predefinidos
```typescript
// Mock completamente listo para usar
const doctor = mockDoctorGeneral
const hospital = mockHospitalRegional

// Ya tiene todos los campos
console.log(doctor.first_name) // "Juan"
console.log(hospital.type)      // "hospital_regional"
```

### 3️⃣ Crear Múltiples Items
```typescript
// 5 zonas diferentes
const zones = createZoneList(5)

// 10 elementos de cola
const queueItems = createQueueItems(10)

// 3 profesionales
const professionals = createProfessionalList(3)
```

### 4️⃣ Crear Relaciones
```typescript
// Usuario con membresías en múltiples instituciones
const memberships = createMembershipsByUser(
  'user-1',
  ['inst-1', 'inst-2', 'inst-3'],
  ['admin', 'medico', 'administrativo']
)

// Institución con múltiples usuarios
const institutionMembers = createMembershipsByInstitution(
  'inst-1',
  ['user-1', 'user-2', 'user-3']
)
```

---

## 🧪 Ejemplos Prácticos por Módulo

### Turnos/Queue
```typescript
import { createQueueItems, mockQueueItemCalled } from '@/tests/fixtures'

test('queue displays items in correct order', () => {
  const queueItems = createQueueItems(5)
  render(<QueueList items={queueItems} />)

  expect(screen.getByText('1')).toBeInTheDocument() // order_number
})

test('shows professional for called item', () => {
  const item = mockQueueItemCalled
  render(<QueueItem item={item} />)

  expect(screen.getByText(item.professional_name)).toBeInTheDocument()
})
```

### Pacientes
```typescript
import { createPatientList, mockPatientYoung } from '@/tests/fixtures'

test('renders patient list', () => {
  const patients = createPatientList(3)
  render(<PatientList patients={patients} />)

  patients.forEach(p => {
    expect(screen.getByText(p.first_name)).toBeInTheDocument()
  })
})

test('pediatrician sees young patients', () => {
  const youngPatient = mockPatientYoung
  const pediatrician = mockPediatrician

  expect(youngPatient.birth_date).toContain('2010')
})
```

### Profesionales
```typescript
import { createProfessionalList, mockDoctorGeneral } from '@/tests/fixtures'

test('filters professionals by speciality', () => {
  const professionals = createProfessionalList(5)
  const doctors = professionals.filter(p => p.speciality === 'Medicina General')

  expect(doctors.length).toBeGreaterThan(0)
})

test('professional has license number', () => {
  const doc = mockDoctorGeneral
  expect(doc.license_number).toBe('MP-123456')
})
```

### Usuarios y Membresías
```typescript
import { createMembershipsByUser, mockUserAdmin } from '@/tests/fixtures'

test('user has multiple memberships', () => {
  const memberships = createMembershipsByUser('user-1', [
    'inst-1',
    'inst-2',
    'inst-3'
  ])

  expect(memberships).toHaveLength(3)
  expect(memberships[0].user_id).toBe('user-1')
})

test('admin can access all institutions', () => {
  const admin = mockUserAdmin
  const memberships = [mockMembershipAdminHospital]

  expect(admin.id).toBe(memberships[0].user_id)
})
```

### Citas/Turnos
```typescript
import { createAppointmentList, mockAppointmentFinished } from '@/tests/fixtures'

test('appointment has all required fields', () => {
  const appt = mockAppointmentFinished

  expect(appt.patient_id).toBeTruthy()
  expect(appt.professional_id).toBeTruthy()
  expect(appt.service_id).toBeTruthy()
  expect(appt.status).toBe('finalizado')
})

test('can create appointments in different time slots', () => {
  const appointments = createAppointmentList(5)
  const times = appointments.map(a => new Date(a.scheduled_at).getHours())

  expect(new Set(times).size).toBeGreaterThan(1) // Diferentes horarios
})
```

---

## 🔄 Patrones Avanzados

### Combinar Fixtures
```typescript
// Crear un escenario realista completo
const hospital = mockHospitalRegional
const doctor = mockDoctorGeneral
const patient = mockPatient1
const appointment = createAppointment({
  patient_id: patient.id,
  professional_id: doctor.id,
  institution_id: hospital.id
})

// Ahora tienes una cita con paciente, doctor e institución relacionados
```

### Crear Variantes de Datos
```typescript
// Para testing de casos extremos
const appointments = [
  mockAppointmentPending,           // Caso normal
  mockAppointmentFinished,          // Caso exitoso
  mockAppointmentCancelled,         // Caso cancelado
  mockAppointmentAbsent,            // Caso ausente
  mockAppointmentMinimal,           // Caso mínimo
  createAppointment({               // Caso custom
    status: 'esperando',
    notes: 'Paciente en sala'
  })
]
```

### Generar Datos Aleatorios
```typescript
// Generar N pacientes únicos
const patients = Array.from({ length: 10 }, (_, i) =>
  createPatient({
    id: `patient-${i}`,
    first_name: `Paciente${i}`,
    dni: `${String(10000000 + i)}`
  })
)
```

---

## ❌ Errores Comunes

### ❌ No Importar Correctamente
```typescript
// ❌ Incorrecto
import QueueStats from '@/tests/fixtures/queue'

// ✅ Correcto
import { createQueueItem } from '@/tests/fixtures/queue'
// o
import { createQueueItem } from '@/tests/fixtures'
```

### ❌ Olvidar que Factories Crean Nuevos Objetos
```typescript
// ❌ Problema: ambos modifican el mismo objeto
const item1 = mockQueueItemPending
const item2 = mockQueueItemPending
item1.patient_name = 'Modificado'
// item2.patient_name también cambia!

// ✅ Solución: usar factory para crear copias
const item1 = createQueueItem({ order_number: 1 })
const item2 = createQueueItem({ order_number: 2 })
// Cada uno es independiente
```

### ❌ No Usar Overrides
```typescript
// ❌ Tedioso
const appointment = createAppointment()
appointment.patient_id = 'my-patient'
appointment.professional_id = 'my-prof'
appointment.service_id = 'my-service'

// ✅ Simple
const appointment = createAppointment({
  patient_id: 'my-patient',
  professional_id: 'my-prof',
  service_id: 'my-service'
})
```

---

## 📋 Checklist: Crear Nuevo Test

```typescript
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// ✅ 1. Importar fixture
import { createQueueItem } from '@/tests/fixtures'

// ✅ 2. Importar componente
import { QueueItem } from '@/components/turnos/QueueItem'

describe('QueueItem', () => {
  // ✅ 3. Usar fixture en test
  test('displays queue item', () => {
    const item = createQueueItem({
      patient_name: 'Juan'
    })

    render(<QueueItem item={item} />)

    expect(screen.getByText('Juan')).toBeInTheDocument()
  })
})
```

---

## 🎓 Estructura de Fixtures

Cada fixture file sigue este patrón:

```typescript
// 1. Factory genérica
export const create[Entity] = (overrides?) => ({ ...defaults, ...overrides })

// 2. Factories para crear múltiples
export const create[Entity]List = (count) => [...]

// 3. Mocks completos predefinidos
export const mock[Entity][Variant] = { ...data }

// 4. Mocks especiales (funciones)
export const mock[Entity][Dynamic] = () => { ...computed }
```

---

## 🚨 Debugging Fixtures

```typescript
// Ver qué contiene un fixture
console.log(createQueueItem())
// Output:
// {
//   id: 'queue-1',
//   order_number: 1,
//   patient_name: 'Pablo González',
//   ...
// }

// Ver propiedades de mock
console.log(Object.keys(mockHospitalRegional))
// Output: ['id', 'zone_id', 'name', 'type', ...]

// Validar tipos
import type { QueueItem } from '@/lib/turnos/types'
const item: QueueItem = createQueueItem() // ✅ Type safe
```

---

## 📚 Archivos Fixture Disponibles

| File | Factories | Mocks | Uso |
|------|-----------|-------|-----|
| `zones.ts` | 2 | 2 | Zonas geográficas |
| `institutions.ts` | 4 | 4 | Hospitales/CAPS |
| `rooms.ts` | 3 | 5 | Consultorios/Salas |
| `services.ts` | 3 | 8 | Servicios médicos |
| `professionals.ts` | 3 | 5 | Doctores/Especialistas |
| `patients.ts` | 3 | 7 | Pacientes |
| `users.ts` | 3 | 7 | Usuarios sistema |
| `memberships.ts` | 4 | 7 | Relaciones usuario-institución |
| `appointments.ts` | 2 | 11 | Citas/Turnos |
| `queue.ts` | 2 | 7 | Cola diaria |

**Total**: 30 factories + 80 mocks = **110 fixtures disponibles**

---

## 🎯 Próximos Tests Sugeridos

1. **QueueManagement.spec.tsx** - Tests de lógica de cola
2. **PatientCard.spec.tsx** - Tests de tarjeta de paciente
3. **AddPatientDialog.spec.tsx** - Tests de diálogo de agregar paciente
4. **QueueFilters.spec.tsx** - Tests de filtros
5. **Integration tests** - Tests de flujos completos

Todos pueden usar los fixtures creados en Sprint 1.

---

*Última actualización: 2025-10-22*
*Para más info, ver: docs/TESTING-STRATEGY-V2.md*
