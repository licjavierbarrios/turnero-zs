# 🚀 Fixtures: Referencia Rápida

Guía simplificada para usar fixtures en tests.

---

## 📦 Cómo Importar

```typescript
// Importar todo
import * as fixtures from '@/tests/fixtures'

// O específico
import { createZone, mockHospitalRegional } from '@/tests/fixtures'
```

---

## 🎯 Patrones de Uso

### Factory Pattern (Crear datos)
```typescript
const zone = createZone()
const customZone = createZone({ name: 'Zona Test' })
const zones = createZoneList(5)
```

### Mock Pattern (Datos predefinidos)
```typescript
const hospital = mockHospitalRegional  // Listo para usar
const doctor = mockDoctorGeneral
const patient = mockPatient
```

### Relaciones
```typescript
// Usuario con membresías en 3 instituciones
const memberships = createMembershipsByUser(
  'user-1',
  ['inst-1', 'inst-2', 'inst-3'],
  ['admin', 'profesional', 'administrativo']
)
```

---

## 🧪 Ejemplos por Módulo

### Turnos/Queue
```typescript
import { createQueueItems } from '@/tests/fixtures'

test('cola muestra items en orden', () => {
  const items = createQueueItems(5)
  render(<QueueList items={items} />)
  expect(screen.getByText('001')).toBeInTheDocument()
})
```

### Pacientes
```typescript
import { mockPatient, createPatientList } from '@/tests/fixtures'

test('formulario crea paciente', () => {
  const patient = mockPatient
  expect(patient.first_name).toBeDefined()
})
```

### Profesionales
```typescript
import { mockDoctorGeneral, createProfessionalList } from '@/tests/fixtures'

test('lista profesionales', () => {
  const professionals = createProfessionalList(3)
  expect(professionals.length).toBe(3)
})
```

---

## 📁 Fixtures Disponibles

| Fixture | Tipo | Uso |
|---------|------|-----|
| `createZone()` | Factory | Crear zona personalizada |
| `mockZone` | Mock | Zona predefinida |
| `createPatientList()` | Factory | Múltiples pacientes |
| `mockPatient` | Mock | Paciente predefinido |
| `createQueueItems()` | Factory | Items de cola |
| `createMembershipsByUser()` | Factory | Membresías de usuario |

---

## ⚡ Tips Rápidos

- **Factories** (`create*`): Para customizar datos
- **Mocks** (`mock*`): Datos listos para usar
- **Lists** (`*List`): Múltiples items
- **By** (`*By*`): Crear relaciones

---

**Ver más:** `INDICE-TESTING.md` | **Tests:** `/tests/fixtures/`
