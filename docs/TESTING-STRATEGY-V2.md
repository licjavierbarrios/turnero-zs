# 🧪 Estrategia de Testing - Turnero ZS

Guía simplificada de testing para el proyecto.

---

## 📊 Estado Actual

| Módulo | Estado | Líneas | Reducción |
|--------|--------|--------|-----------|
| `/turnos` | ✅ | 661 | -47% |
| `/pacientes` | ✅ | 192 | -43% |
| `/servicios` | ✅ | 267 | -32% |
| `/consultorios` | ✅ | 288 | -18% |
| `/profesionales` | ✅ | 186 | -24% |
| `/asignaciones` | ✅ | 296 | -26% |
| **Dashboard Total** | ✅ | 1,890 | -38% |

---

## 🔄 Stack Tecnológico

```
Frontend:    Next.js 15.5.2 + React 18 + TypeScript
Backend:     Supabase (PostgreSQL + Auth + Realtime)
Testing:     Vitest + Testing Library + Playwright
Validation:  react-hook-form + zod
```

---

## 🔺 Pirámide de Testing

```
        E2E (10-12 tests)
         /            \
        /   Integ (10-15)
       /              \
      Unit+Component (40-50)
     ________________________
```

**Objetivo de cobertura:**
- `lib/`: ≥80% (funciones core)
- `hooks/`: ≥70% (lógica de estado)
- `components/`: ≥60% (presentación)
- `app/`: ≥40% (pages)

---

## 📋 Módulos a Testear (Prioridad)

### 🟢 Alta Prioridad

**1. `/turnos`** (Core del sistema)
- Unit: QueueStats calcula correctamente
- Component: PatientCard renderiza datos
- Component: AddPatientDialog valida y guarda
- Integration: Agregar/eliminar pacientes en tiempo real

**2. `/pacientes`** (Gestión de datos)
- Component: PatientForm crea/edita
- Component: PatientTableRow elimina

**3. Hooks** (Reutilizable)
- `useCrudOperation`: Create, Read, Update, Delete
- `useInstitutionContext`: Acceso a contexto

### 🟡 Media Prioridad

**4. `/servicios`, `/consultorios`, `/profesionales`**
- Component tests para formularios y tablas

**5. Utilidades** (`lib/`)
- `slotGenerator.ts`: Generación de slots
- `concurrency.ts`: Manejo de concurrencia

### 🔵 Baja Prioridad

- Pages (`app/`): Solo flujos críticos
- UI base (`components/ui/`): Responsabilidad de shadcn

---

## 🧪 Ejemplos de Tests Recomendados

### Test Unit - QueueStats
```typescript
describe('QueueStats', () => {
  it('calcula items ocultos correctamente', () => {
    render(<QueueStats totalCount={25} filteredCount={10} />)
    expect(screen.getByText('15 ocultos')).toBeInTheDocument()
  })
})
```

### Test Component - AddPatientDialog
```typescript
describe('AddPatientDialog', () => {
  it('valida campo requerido', async () => {
    const { getByText } = render(<AddPatientDialog isOpen={true} {...props} />)
    await userEvent.click(getByText('Guardar'))
    expect(screen.getByText(/requerido/i)).toBeInTheDocument()
  })
})
```

### Test Integration - CRUD
```typescript
describe('Turnos CRUD', () => {
  it('agrega paciente y aparece en lista', async () => {
    render(<TurnosPage />)
    await userEvent.click(screen.getByText('Agregar Paciente'))
    // ... llena formulario
    await userEvent.click(screen.getByText('Guardar'))
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })
})
```

### Test E2E - Flujo Crítico
```gherkin
Scenario: Administrador gestiona cola de turnos
  Given administrador está en página /turnos
  When agrega paciente "Juan Pérez" con servicio "Cardiología"
  And marca como "Llamado"
  Then paciente aparece con estado visual correcto
  And se sincroniza en tiempo real
```

---

## 📁 Estructura de Tests

```
tests/
├── unit/
│   ├── lib/
│   │   ├── slotGenerator.test.ts
│   │   └── concurrency.test.ts
│   └── hooks/
│       └── useCrudOperation.test.ts
├── component/
│   ├── turnos/
│   │   ├── PatientCard.test.tsx
│   │   ├── QueueStats.test.tsx
│   │   └── AddPatientDialog.test.tsx
│   └── ...
├── integration/
│   ├── turnos/
│   │   └── crud.test.ts
│   └── ...
├── e2e/
│   ├── turnos.spec.ts
│   └── ...
└── fixtures/
    ├── mockData.ts
    ├── mockSupabase.ts
    └── ...
```

---

## 🎯 Próximos Pasos

1. Configurar Vitest + Testing Library
2. Implementar fixtures y mocks de Supabase
3. Tests unit para `lib/` y `hooks/`
4. Tests component para módulos críticos
5. Tests E2E para flujos principales

---

**Última actualización:** Oct 2025 | **Estado:** 📋 Listo para implementar
