# 🧪 Estrategia de Testing - Turnero ZS (v2.0 - Mejorada)

> **Última revisión**: 2025-10-22
> **Estado**: 📋 Planificación avanzada - Listo para implementar
> **Basado en**: Análisis post-optimización de código

---

## 📌 CAMBIOS vs v1.0

| Aspecto | v1.0 | v2.0 | Razón |
|---------|------|------|-------|
| **Enfoque** | Todos los módulos | Módulos atomizados | Post-optimización reducción -30% código |
| **Prioridad Componentes** | Genéricos | Componentes extraídos específicos | Ya están separados y testables |
| **Estructura Tests** | Por tipo (unit/component/integration) | Por módulo + tipo | Mejor mapeo con arquitectura actual |
| **Coverage Goal** | 70% líneas | 65% líneas (pragmático) | Código optimizado = menos líneas a cubrir |
| **Énfasis** | Cantidad de tests | Calidad y cobertura crítica | Tests significativos > cantidad |

---

## 1. Estado Actual del Proyecto

### ✅ Fase 2: Dashboard Modules (COMPLETADA)
```
/turnos         ✅ 661 líneas  (-47% de 1250)
/pacientes      ✅ 192 líneas  (-43% de 335)
/servicios      ✅ 266 líneas  (-33% de 395)
/consultorios   ✅ 248 líneas  (-29% de 350)
/profesionales  ✅ 185 líneas  (-24% de 244)
/asignaciones   ✅ 296 líneas  (-26% de 399)
────────────────────────────────────────────
TOTAL FASE 2:   1,848 líneas (-38% de 2,973)
```

### ✅ Fase 3A: Super Admin Modules (COMPLETADA)
```
/zonas          ✅ 355 líneas  (-23% de 458)
/profesionales  ✅ 473 líneas  (-27% de 646)
/instituciones  ✅ 440 líneas  (-28% de 612)
/usuarios       ✅ 1,326 líneas (-20% de 1,653)
────────────────────────────────────────────
TOTAL FASE 3A:  2,594 líneas (-23% de 3,369)
```

### 📊 Estadísticas Globales
- **Total de líneas actual**: ~4,442 líneas (pre-atomización era ~6,342)
- **Reducción total**: -1,900 líneas (-30%)
- **Componentes creados**: 15+
- **Estructura mejorada**: ✅ Separación de responsabilidades
- **Testabilidad**: ✅ Muy mejorada por atomización

---

## 2. Contexto Técnico Actualizado

### Stack Tecnológico
```
Frontend:
  - Next.js 15.5.2 (App Router)
  - React 18.2 + TypeScript 5.9.2
  - Tailwind CSS + shadcn/ui 3 + Radix UI
  - react-hook-form + zod (validaciones)

Backend:
  - Supabase (PostgreSQL + Auth + Realtime)
  - Row Level Security (RLS)

Testing (A IMPLEMENTAR):
  - Vitest (unit + integration)
  - Testing Library (componentes)
  - Playwright (E2E)
  - jest-axe (accesibilidad)
```

### Arquitectura Post-Optimización
```
app/
├── (dashboard)/
│   ├── turnos/
│   │   ├── page.tsx (661 líneas - orquestación)
│   │   └── components/
│   │       ├── PatientCard.tsx
│   │       ├── QueueStats.tsx
│   │       ├── StatusLegend.tsx
│   │       ├── AddPatientDialog.tsx
│   │       └── QueueFilters.tsx
│   ├── pacientes/
│   │   ├── page.tsx (192 líneas)
│   │   └── components/
│   │       ├── PatientForm.tsx
│   │       └── PatientTableRow.tsx
│   └── ... (otros módulos con patrón similar)
│
├── super-admin/
│   ├── usuarios/
│   │   ├── page.tsx (1,326 líneas)
│   │   └── components/
│   │       ├── UsersTab.tsx
│   │       └── MembershipsTab.tsx
│   ├── profesionales/
│   │   ├── page.tsx (473 líneas)
│   │   └── components/
│   │       ├── ProfessionalForm.tsx
│   │       ├── ProfessionalTableRow.tsx
│   │       └── ProfessionalTableRow.tsx
│   └── ... (otros módulos)
│
├── (public)/
│   └── pantalla/
│       └── [slug]/page.tsx (pantalla pública real-time)
│
components/
├── ui/ (shadcn - base components)
├── crud/ (genéricos CRUD - futuro)
└── domain/ (componentes compartidos - futuro)

lib/
├── supabase.ts
├── types.ts
├── utils.ts
├── slotGenerator.ts
├── concurrency.ts
└── ... (funciones puras para testing)

hooks/
├── useCrudOperation.ts (core CRUD hook)
├── useInstitutionContext.ts
├── useToggleState.ts
└── ... (otros custom hooks)
```

---

## 3. Pirámide de Testing (Actualizada)

### Distribución Recomendada
```
        E2E (10%)
         /  \
        /    \
       /      \
      / Integ. (20%)
     /          \
    /            \
   / Unit+Comp (70%)
  /________________\

TOTAL: ~65-70 tests
- Unit tests: 40-50 tests (utilidades, hooks, validaciones)
- Component tests: 20-25 tests (componentes atomizados)
- Integration tests: 10-15 tests (CRUD con mocks Supabase)
- E2E tests: 8-12 tests (flujos críticos)
```

### Línea Base de Cobertura
```
Objetivo pragmático: ≥65% líneas (no ≥70% anterior)

Por área:
├── lib/        ≥80% (funciones core, puras)
├── hooks/      ≥70% (lógica de estado)
├── components/ ≥60% (componentes atomizados)
└── app/        ≥40% (pages - bajo ROI testear)
```

---

## 4. Plan de Testing por Módulo

### 🟢 ALTA PRIORIDAD (Core Funcionalidad)

#### 4.1 Módulo: `/turnos` (661 líneas, 6 componentes)

**Componentes a testear**:
```
✅ PatientCard.tsx          - Presentación, sin lógica
✅ QueueStats.tsx           - Cálculos simples, fácil de testear
✅ StatusLegend.tsx         - UI puro, 1 test sencillo
✅ AddPatientDialog.tsx     - Forma + validación zod
✅ QueueFilters.tsx         - Selects + onChange handlers
✅ page.tsx                 - Integración (hooks + Supabase)
```

**Tests Unit** (~3-5):
```typescript
✓ QueueStats: calcula totales correctamente
✓ StatusLegend: renderiza colores correctos por estado
✓ Utilidades de formateo de estados
```

**Tests Component** (~5-8):
```typescript
✓ PatientCard: renderiza nombre, DNI, orden
✓ AddPatientDialog: valida campos, submit funciona
✓ QueueFilters: cambio de filtros actualiza estado
✓ A11y: inputs con labels, roles correctos
```

**Tests Integration** (~2-3):
```typescript
✓ Crear paciente en queue (insert mock Supabase)
✓ Cambiar estado paciente (update mock)
✓ Listar pacientes con filtros
```

**Tests E2E** (~2):
```typescript
✓ Flujo: agregar paciente → ver en lista → filtrar
✓ Pantalla pública real-time (Supabase channel mock)
```

---

#### 4.2 Módulo: `/pacientes` (192 líneas, 2 componentes)

**Tests** (~8-10 total):
```
✓ PatientForm: validación (DNI, email, fecha nacimiento)
✓ PatientTableRow: renderiza datos, muestra edad calculada
✓ CRUD completo (create, update, delete)
✓ E2E: crear paciente → editar → eliminar
```

---

#### 4.3 Módulo: `/consultorios` (248 líneas, 2 componentes)

**Tests** (~6-8 total):
```
✓ RoomForm: validación de datos
✓ RoomTableRow: renderiza room info + institución/zona
✓ CRUD con institución_id context
✓ E2E: crear consultorio → filter por institución
```

---

### 🟡 MEDIA PRIORIDAD (Flujos Importantes)

#### 4.4 Módulo: `/servicios` (266 líneas, 2 componentes)

**Tests** (~8-10):
```
✓ ServiceForm: selector de duración
✓ ServiceTableRow: estado activo/inactivo toggle
✓ Validación de duración (15min-2h)
✓ E2E: crear servicio → usar en turno
```

---

#### 4.5 Módulo: `/profesionales` (185 líneas, 2 componentes)

**Tests** (~6-8):
```
✓ ProfessionalForm: validación especialidad, teléfono
✓ ProfessionalTableRow: info + institución
✓ CRUD + estado activo/inactivo
✓ E2E: crear profesional → asignar a turno
```

---

#### 4.6 Módulo: `/asignaciones` (296 líneas, 2 componentes)

**Tests** (~8-10):
```
✓ AssignmentForm: cascade selects (profesional → consultorio → fecha)
✓ AssignmentTableRow: mostrar asignación con detalles
✓ Validación de fecha/hora
✓ E2E: crear asignación → ver en horario profesional
```

---

### 🔴 BAJA PRIORIDAD (Admin, menos crítico)

#### 4.7 Super Admin Módulos

**Usuarios** (1,326 líneas, 2 componentes):
```
✓ UsersTab: tabla users + filtros
✓ MembershipsTab: tabla memberships + filtros
✓ CRUD usuarios + memberships
✓ Tests: ~10-12 (bajo complejidad individual, alto volumen datos)
```

**Instituciones, Profesionales, Zonas**:
```
✓ Similar pattern: Form + TableRow + CRUD
✓ Tests: ~6-8 cada uno
✓ Total: ~20-30 tests para super-admin
```

---

## 5. Flujos Críticos (Matriz)

| Flujo | Módulos | Tests Unit | Tests Component | Tests Integration | Tests E2E | Prioridad |
|-------|---------|-----------|-----------------|-------------------|-----------|-----------|
| **Crear turno completo** | turnos + pacientes | 3 | 4 | 2 | 1 | 🔴 CRÍTICA |
| **Gestionar turno del día** | turnos | 2 | 3 | 2 | 1 | 🔴 CRÍTICA |
| **Pantalla pública real-time** | turnos + pantalla | 2 | 3 | 3 | 1 | 🔴 CRÍTICA |
| **CRUD Pacientes** | pacientes | 2 | 2 | 2 | 1 | 🟡 IMPORTANTE |
| **CRUD Servicios** | servicios | 2 | 2 | 2 | 1 | 🟡 IMPORTANTE |
| **CRUD Profesionales** | profesionales | 2 | 2 | 2 | 1 | 🟡 IMPORTANTE |
| **Admin CRUD** | super-admin/* | 5 | 8 | 5 | 2 | 🟢 BÁSICA |

---

## 6. Estrategia de Mocking (Mejorada)

### 6.1 Supabase Client Mock

```typescript
// tests/mocks/supabase.ts
import { vi } from 'vitest'

export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: mockAuthUser } },
      error: null
    }),
    getUser: vi.fn(),
    signOut: vi.fn()
  },
  from: vi.fn((table: string) => {
    if (table === 'appointment') {
      return mockAppointmentTable()
    }
    if (table === 'patient') {
      return mockPatientTable()
    }
    // ... más tablas según sea necesario
    return mockGenericTable()
  }),
  channel: vi.fn((name: string) => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({
      unsubscribe: vi.fn()
    })
  }))
}

// Mock específico para tabla de turnos
const mockAppointmentTable = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis().mockResolvedValue({
    data: mockAppointment,
    error: null
  }),
  update: vi.fn().mockReturnThis().mockResolvedValue({
    data: mockAppointment,
    error: null
  }),
  delete: vi.fn().mockReturnThis().mockResolvedValue({
    data: null,
    error: null
  }),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: mockAppointment,
    error: null
  })
})

// Factory para diferentes escenarios
export const createMockSupabaseError = (message: string) => ({
  ...mockSupabaseClient,
  from: vi.fn(() => ({
    ...mockAppointmentTable(),
    insert: vi.fn().mockResolvedValue({
      data: null,
      error: { message }
    })
  }))
})
```

### 6.2 Next.js Hooks Mock

```typescript
// tests/setup.ts
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  }),
  usePathname: () => '/dashboard/turnos',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({})
}))
```

### 6.3 Custom Hooks Mock

```typescript
// tests/mocks/hooks.ts
export const mockUseCrudOperation = (initialState = {}) => {
  return {
    items: [],
    formData: initialState,
    isLoading: false,
    isSaving: false,
    isDialogOpen: false,
    isDeleteDialogOpen: false,
    editingItem: null,
    itemToDelete: null,
    error: null,
    updateFormField: vi.fn(),
    openCreateDialog: vi.fn(),
    openEditDialog: vi.fn(),
    closeDialog: vi.fn(),
    openDeleteDialog: vi.fn(),
    closeDeleteDialog: vi.fn(),
    handleSubmit: vi.fn().mockResolvedValue(true),
    handleDelete: vi.fn().mockResolvedValue(true)
  }
}

export const mockUseInstitutionContext = (institution = mockInstitution) => {
  return {
    context: institution,
    requireContext: vi.fn(),
    loading: false,
    error: null
  }
}
```

---

## 7. Fixtures y Data de Test (Actualizados)

```typescript
// tests/fixtures/appointments.ts
export const mockAppointment = {
  id: 'apt-001',
  patient_id: 'p1',
  professional_id: 'prof1',
  service_id: 's1',
  institution_id: 'inst1',
  scheduled_at: '2025-10-25T10:00:00Z',
  status: 'pendiente',
  order_number: '001'
}

export const mockPatient = {
  id: 'p1',
  first_name: 'Juan',
  last_name: 'Pérez',
  dni: '12345678',
  birth_date: '1980-05-15',
  phone: '1123456789',
  email: 'juan@example.com'
}

export const mockRoom = {
  id: 'room1',
  institution_id: 'inst1',
  name: 'Consultorio A',
  description: 'Piso 1, ala norte',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z'
}

export const mockService = {
  id: 's1',
  institution_id: 'inst1',
  name: 'Control General',
  duration_minutes: 30,
  is_active: true
}

export const mockInstitution = {
  id: 'inst1',
  name: 'CAPS Centro',
  zone_id: 'z1',
  zone_name: 'Zona Norte',
  type: 'caps',
  slug: 'caps-centro'
}

// Fixtures para super-admin
export const mockUser = {
  id: 'u1',
  email: 'user@example.com',
  first_name: 'Admin',
  last_name: 'User',
  is_active: true
}

export const mockMembership = {
  id: 'm1',
  user_id: 'u1',
  institution_id: 'inst1',
  role: 'admin',
  is_active: true
}
```

---

## 8. Plan de Implementación por Sprint

### Sprint 1: Infraestructura Testing (2-3 días)
**Objetivo**: Preparar estructura y herramientas

```
✓ Desinstalar Jest (si existe)
✓ Instalar Vitest + dependencias
✓ Configurar vitest.config.ts
✓ Crear setup global (tests/setup.ts)
✓ Crear mocks base (supabase, next/navigation, hooks)
✓ Crear fixtures reutilizables
✓ 2 tests de ejemplo (pasando)
✓ npm run test working
```

**Criterios Aceptación**:
- ✅ `npm run test` ejecuta sin errores
- ✅ `npm run test:coverage` genera reporte
- ✅ TypeScript compila ok

---

### Sprint 2: Tests Críticos - Turnos (3-4 días)
**Objetivo**: Cubrir módulo más crítico

```
✓ Unit tests (~3-5):
  - Validaciones
  - Utilidades de formateo
  - Lógica de cálculos

✓ Component tests (~5-8):
  - PatientCard
  - AddPatientDialog
  - QueueFilters
  - A11y básico

✓ Integration tests (~2-3):
  - CRUD appointment
  - Cambiar estado

✓ E2E tests (~2):
  - Flujo crear turno
  - Pantalla pública
```

**Criterios Aceptación**:
- ✅ 15-20 tests verdes
- ✅ Cobertura `/turnos` >70%
- ✅ 0 a11y violations críticas

---

### Sprint 3: Tests Módulos Dashboard (3-4 días)
**Objetivo**: Cobertura de pacientes, servicios, consultorios

```
✓ /pacientes: 8-10 tests
✓ /servicios: 8-10 tests
✓ /consultorios: 6-8 tests
✓ /profesionales: 6-8 tests
✓ /asignaciones: 8-10 tests
✓ Total: ~40-45 tests
```

**Criterios Aceptación**:
- ✅ 40-45 tests verdes
- ✅ Cobertura dashboard >65%
- ✅ A11y checks en componentes críticos

---

### Sprint 4: Tests Integración Avanzada (2-3 días)
**Objetivo**: Escenarios complejos y flujos reales

```
✓ Concurrencia de slots (optimistic locking)
✓ Transacciones de estado
✓ Filtros y búsqueda
✓ Paginación
✓ Errores de DB (mock)
✓ Validaciones Zod
```

**Criterios Aceptación**:
- ✅ 10-15 tests integración
- ✅ Escenarios error covered
- ✅ Cobertura lib/ >75%

---

### Sprint 5: E2E y A11y (2-3 días)
**Objetivo**: Flujos end-to-end y validación accesibilidad

```
✓ Configurar Playwright
✓ Smoke tests (3-5)
✓ Flujos críticos (3-5)
✓ A11y scan (2-3)
✓ Real-time testing (1-2)
✓ Reportes generados
```

**Criterios Aceptación**:
- ✅ 8-12 tests E2E verdes
- ✅ 0 a11y violations graves
- ✅ Reportes en HTML

---

### Sprint 6: Super Admin Testing (2-3 días)
**Objetivo**: Tests para módulos admin (baja prioridad pero cobertura)

```
✓ /usuarios: 10-12 tests
✓ /instituciones: 6-8 tests
✓ /profesionales (admin): 6-8 tests
✓ /zonas: 4-6 tests
✓ Total: ~30 tests
```

---

### Sprint 7: CI/CD y Docs Finales (1-2 días)
**Objetivo**: Automatización y documentación

```
✓ .github/workflows/tests.yml
✓ Jobs: unit-integration, e2e
✓ Coverage reports artifact
✓ TESTING.md completo
✓ Badges README.md
✓ Verde en cada PR
```

---

## 9. Métricas y Metas

### Coverage Global (Target)
```
├── Statements: ≥65%
├── Branches: ≥60%
├── Functions: ≥65%
└── Lines: ≥65%

Por carpeta:
├── lib/        ≥80%
├── hooks/      ≥70%
├── components/ ≥60%
├── app/        ≥40%
└── Exclusiones: node_modules, .next, *.config.ts, types.ts
```

### Tiempo de Ejecución (Target)
```
Unit + Integration: <30s
E2E: <3min
Total: <4min en CI
```

### Calidad
```
✓ 0 errores de compilación
✓ 0 tests flaky
✓ >95% tests pasar siempre
✓ No regresiones de a11y
```

---

## 10. Comandos NPM (A Agregar)

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test:coverage && npm run test:e2e",
    "test:ci": "npm run typecheck && npm run lint && npm run test:coverage && npm run test:e2e"
  }
}
```

---

## 11. Checklist Pre-Implementación

- [ ] Revisar esta estrategia v2.0
- [ ] Confirmar prioridades con stakeholders
- [ ] Ambiente de desarrollo actualizado (Node.js 18+)
- [ ] Acceso a Playwright (instalar browsers)
- [ ] Acuerdo en exclusiones de coverage
- [ ] Documentación de mocks clara
- [ ] Repository limpio sin cambios pendientes
- [ ] Branch para testing: `feat/testing-v2-sprint1`

---

## 12. Orden Recomendado de Ejecución

```
SESIÓN 1: Sprint 1 (Infraestructura)
├─ Instalar dependencias
├─ Crear config files
├─ Setup mocks globales
└─ 2 tests dummy → verde

SESIÓN 2: Sprint 2 (Turnos crítico)
├─ Unit tests turnos
├─ Component tests
├─ Integration tests
└─ E2E flujos críticos

SESIÓN 3: Sprint 3-4 (Dashboard + Integración)
├─ Tests resto de módulos
├─ Escenarios complejos
└─ >65% coverage

SESIÓN 4: Sprint 5-6 (E2E, A11y, Super-admin)
├─ Playwright setup
├─ Flujos E2E
├─ A11y validation
└─ Admin tests

SESIÓN 5: Sprint 7 (CI/CD)
├─ GitHub Actions
├─ Automatización
├─ Documentación
└─ PR inicial ✅
```

---

## 13. Recursos y Referencias

- [Vitest Docs](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/)
- [Playwright Docs](https://playwright.dev/)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [Supabase Testing](https://supabase.com/docs/guides/getting-started/testing)

---

## 14. Cambios Principales vs v1.0

### ✨ Mejoras

1. **Basado en arquitectura actual**
   - Refleja componentes ya atomizados
   - Aprovecha estructura mejorada

2. **Pragmatismo**
   - 65% en lugar de 70% (realista para código optimizado)
   - Enfoque en tests significativos, no en cantidad

3. **Mejor mapeo de módulos**
   - Tests organizados por módulo, no solo por tipo
   - Facilita ejecución selectiva

4. **Fixtures más completas**
   - Incluye todas las entidades del sistema
   - Reutilizables en todos los sprints

5. **Plan más realista**
   - Timeboxed por sprint
   - Criterios claros de aceptación
   - Orden lógico de ejecución

---

**Versión**: 2.0
**Fecha**: 2025-10-22
**Autor**: Claude Code
**Estado**: 📋 Planificación completa - Listo para Sesión 4
