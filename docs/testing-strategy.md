# Estrategia de Testing - Turnero ZS

## 1. Contexto del Proyecto

**Turnero ZS** es un sistema multi-zona de gestión de turnos y colas para centros de salud argentinos (CAPS/hospitales).

### Stack Tecnológico
- **Frontend**: Next.js 15.5.2 (App Router), React 18.2, TypeScript 5.9.2
- **UI**: Tailwind CSS 3.4.17 + shadcn/ui 3 + Radix UI
- **Forms**: react-hook-form 7.63.0 + zod 3.25.76
- **Dates**: react-day-picker 9.11.0 + date-fns 4.1.0
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Security**: Row Level Security (RLS) basado en membresías y roles

### Estructura Actual
```
turnero-zs/
├── app/                          # Next.js 15 App Router
│   ├── (dashboard)/             # Rutas protegidas del dashboard
│   │   ├── turnos/              # 🎯 Gestión de turnos (CRÍTICO)
│   │   ├── profesional/         # 🎯 Agenda profesionales
│   │   ├── pacientes/           # Gestión de pacientes
│   │   ├── servicios/           # Configuración servicios
│   │   └── ...
│   └── (public)/                # Rutas públicas
│       └── pantalla/            # 🎯 Pantallas públicas real-time (CRÍTICO)
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── layouts/                 # Layouts pantalla pública
│   └── ...
├── lib/
│   ├── supabase.ts             # 🔧 Cliente Supabase
│   ├── utils.ts                # Utilidades generales
│   ├── types.ts                # TypeScript types
│   ├── slotGenerator.ts        # Generación de slots
│   ├── concurrency.ts          # Control de concurrencia
│   └── ...
├── hooks/                       # Custom React hooks
├── db/                          # SQL schemas y policies
└── docs/                        # Documentación
```

## 2. Pirámide de Testing

### Distribución de Tests (objetivo)
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
```

### 2.1 Unit Tests (50%)
**Objetivo**: Funciones puras, utilidades, helpers

**Alcance**:
- `lib/utils.ts` - formatters (fechas, estados, instituciones)
- `lib/slotGenerator.ts` - generación de slots de turnos
- `lib/concurrency.ts` - lógica de reserva optimista
- `lib/security.ts`, `lib/audit.ts` - funciones de seguridad y auditoría
- `lib/accessibility.ts`, `lib/audio-utils.ts` - utilidades a11y y audio
- Validaciones de zod schemas (crear en `lib/validations/`)

**Herramientas**: Vitest + jsdom (cuando se necesite DOM mínimo)

**Ejemplos**:
- `formatAppointmentStatus()` devuelve string correcto
- `formatDateTime()` formatea a formato argentino (es-AR)
- `slotGenerator` genera slots de 15 min correctamente
- Validaciones zod rechaza datos inválidos

### 2.2 Component Tests (20%)
**Objetivo**: Componentes UI con interacciones y validaciones

**Alcance**:
- Componentes shadcn/ui customizados más críticos
- Formularios con react-hook-form + zod
- Componentes de cards (appointment, patient, service)
- Interacciones con react-day-picker
- Accesibilidad básica con jest-axe

**Herramientas**: Vitest + Testing Library + jsdom + jest-dom + user-event + jest-axe

**Componentes Críticos a Cubrir**:
1. **Formulario de Turno** (crear/editar):
   - Render inicial (labels, placeholders)
   - Validación zod (campos requeridos, formatos)
   - Selección de fecha con day-picker
   - Selección de horario disponible
   - Mensajes de error visualizados
   - Submit exitoso → callback/navegación mock

2. **Tabla de Turnos**:
   - Render de lista vacía y con datos
   - Filtros por fecha/estado/profesional
   - Badges de estado con colores correctos
   - Acciones (cancelar, llamar, finalizar)

3. **Componentes UI core**:
   - `Button` - variantes y estados (disabled, loading)
   - `Calendar` - navegación y selección
   - `Select` - opciones y onChange
   - `Form` - integración RHF + error display

**Patrón de Test**:
```typescript
// tests/components/AppointmentForm.spec.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should validate required fields', async () => {
  const user = userEvent.setup()
  render(<AppointmentForm onSubmit={mockFn} />)

  // Try submit without filling
  await user.click(screen.getByRole('button', { name: /crear turno/i }))

  // Check error messages
  expect(await screen.findByText(/paciente es requerido/i)).toBeInTheDocument()

  // No a11y violations
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 2.3 Integration Tests (20%)
**Objetivo**: Route handlers, Server Actions, flujos con Supabase mockeado

**Alcance**:
- Route handlers en `app/api/` (si existen)
- Server Actions (si se implementan)
- Flujos de autenticación mock
- Operaciones CRUD con Supabase mock
- Validación de RLS policies (simulado)

**Herramientas**: Vitest + mocks de Supabase

**Escenarios**:
1. **Crear turno**:
   - Validación de datos (zod)
   - Verificación de slot disponible
   - Inserción en DB (mock)
   - Manejo de conflictos (slot tomado)
   - Auditoría de evento (mock)

2. **Cambiar estado de turno**:
   - Transiciones válidas (pendiente → esperando → llamado → en_consulta → finalizado)
   - Transiciones inválidas (error)
   - Verificación de permisos (mock de user role)

3. **Listar turnos**:
   - Filtros por fecha/estado
   - Paginación
   - Ordenamiento
   - Respuesta 200/4xx/5xx

**Mock de Supabase**:
```typescript
// tests/mocks/supabase.ts
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null })
  },
  from: (table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockData, error: null })
  })
})
```

### 2.4 E2E Tests (10%)
**Objetivo**: Flujos críticos de usuario end-to-end

**Alcance**:
1. **Smoke tests** (5%):
   - Home page renderiza
   - Navegación principal funciona
   - Assets estáticos cargan
   - No errores de console graves

2. **Flujos críticos** (5%):
   - **Crear turno completo**:
     1. Login → Dashboard
     2. Ir a "Crear turno"
     3. Seleccionar paciente (buscar o crear)
     4. Seleccionar servicio/profesional
     5. Seleccionar fecha en calendar
     6. Seleccionar horario disponible
     7. Confirmar
     8. Ver turno en lista

   - **Gestión de turno**:
     1. Login como profesional
     2. Ver lista de turnos del día
     3. Llamar a paciente
     4. Marcar "En consulta"
     5. Finalizar turno
     6. Verificar estado actualizado

   - **Pantalla pública** (real-time):
     1. Abrir pantalla pública de institución
     2. Verificar carga inicial de turnos
     3. Simular cambio de estado (desde otro tab)
     4. Verificar actualización real-time (Supabase channel)
     5. Verificar TTS funcionando (si audio habilitado)

**Herramientas**: Playwright + @axe-core/playwright

**Configuración**:
- `baseURL`: http://localhost:3000
- `webServer`: `npm run build && npm run start`
- Seed de datos mínimo (usuarios, institución, servicios)
- Variables de entorno de test

**A11y en E2E**:
```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('homepage should be accessible', async ({ page }) => {
  await page.goto('/')

  const accessibilityScanResults = await new AxeBuilder({ page })
    .exclude('.third-party-widget') // Excluir componentes externos si hay
    .analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})
```

## 3. Flujos Críticos de Negocio (Prioridad)

### 🎯 Flujo 1: Crear Turno
**Impacto**: ALTO - Core funcionalidad
**Criticidad**: CRÍTICA

**User Story**:
> Como administrativo, quiero agendar un turno para un paciente con validación de disponibilidad y confirmación visual.

**Test Coverage**:
- **Unit**: Validación de slot disponible, cálculo de fechas
- **Component**: Form con day-picker, validación zod, error messages
- **Integration**: Insert en DB, check de concurrencia
- **E2E**: Flujo completo desde login hasta confirmación

**Criterios de Aceptación**:
- ✅ Validación de campos (paciente, profesional, fecha, hora)
- ✅ Solo horarios disponibles se muestran
- ✅ Mensaje de error si slot ya está tomado
- ✅ Confirmación visual tras crear turno
- ✅ Navegación a lista de turnos tras éxito
- ✅ Accesibilidad (labels, roles, focus)

### 🎯 Flujo 2: Listar y Filtrar Turnos
**Impacto**: ALTO
**Criticidad**: ALTA

**User Story**:
> Como profesional/administrativo, quiero ver turnos del día filtrados por fecha/estado/servicio para gestionar mi agenda.

**Test Coverage**:
- **Unit**: Funciones de filtrado, ordenamiento, formateo de fechas
- **Component**: Tabla con filtros, paginación, badges de estado
- **Integration**: Query a DB con filtros, manejo de resultados vacíos
- **E2E**: Aplicar filtros y verificar resultados

**Criterios de Aceptación**:
- ✅ Lista carga en <2s (mock en test)
- ✅ Filtros funcionan (fecha, estado, profesional)
- ✅ Estados visualizados con colores correctos
- ✅ Paginación funciona (si >20 items)
- ✅ Lista vacía muestra mensaje apropiado

### 🎯 Flujo 3: Cancelar Turno
**Impacto**: MEDIO
**Criticidad**: MEDIA-ALTA

**User Story**:
> Como administrativo, quiero cancelar un turno con confirmación para evitar cancelaciones accidentales.

**Test Coverage**:
- **Component**: Dialog de confirmación, botón de cancelar
- **Integration**: Update de estado, auditoría
- **E2E**: Cancelar desde lista y verificar badge actualizado

**Criterios de Aceptación**:
- ✅ Dialog de confirmación aparece
- ✅ Se puede cancelar la acción (cerrar dialog)
- ✅ Al confirmar, estado cambia a "cancelado"
- ✅ Se registra en audit log (mock)
- ✅ UI se actualiza inmediatamente

### 🎯 Flujo 4: Pantalla Pública Real-time (CRÍTICO)
**Impacto**: ALTO - Experiencia paciente
**Criticidad**: ALTA

**User Story**:
> Como paciente en sala de espera, quiero ver mi turno actualizado en tiempo real cuando me llamen.

**Test Coverage**:
- **Component**: Display de turno, badges de estado
- **Integration**: Supabase Realtime mock
- **E2E**: Cambio de estado real-time verificado

**Criterios de Aceptación**:
- ✅ Pantalla carga en <3s
- ✅ Turnos en espera visibles
- ✅ Cambio de estado se refleja en <2s (via Supabase channel)
- ✅ Audio TTS funciona (cuando habilitado)
- ✅ Accesible (alto contraste, tamaños grandes)

## 4. Estrategia de Mocking

### 4.1 Supabase Client
**Enfoque**: Mock completo en unit/integration, real en E2E (con seed)

```typescript
// tests/mocks/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn()
  },
  from: vi.fn((table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    // Chainable methods
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn()
  }))
}

// Factory para diferentes estados
export const createAuthenticatedMock = (user: Partial<User>) => ({
  ...mockSupabaseClient,
  auth: {
    ...mockSupabaseClient.auth,
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user } },
      error: null
    })
  }
})
```

### 4.2 Next.js Navigation
**Enfoque**: Mock de hooks de navegación

```typescript
// tests/setup.ts
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  }),
  usePathname: () => '/mock-path',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({})
}))

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  })
}))
```

### 4.3 Date/Time
**Enfoque**: Helper para congelar tiempo en tests

```typescript
// tests/utils/time.ts
import { vi } from 'vitest'

export const withFrozenTime = (date: Date, fn: () => void) => {
  const realDate = Date
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(date)
  })
  afterEach(() => {
    vi.useRealTimers()
  })
  fn()
}
```

### 4.4 Datos de Test
**Enfoque**: Fixtures reutilizables

```typescript
// tests/fixtures/appointments.ts
export const mockAppointment = {
  id: '123',
  patient_id: 'p1',
  professional_id: 'prof1',
  service_id: 's1',
  institution_id: 'i1',
  scheduled_at: '2025-10-03T10:00:00Z',
  status: 'pendiente',
  notes: 'Control de rutina'
}

export const mockPatient = {
  id: 'p1',
  first_name: 'Juan',
  last_name: 'Pérez',
  dni: '12345678',
  birth_date: '1980-05-15',
  phone: '123456789'
}
```

## 5. Matriz de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Flaky tests por timing** | ALTA | ALTO | - Usar `waitFor` de Testing Library<br>- `page.waitForSelector` con timeout largo<br>- Evitar `setTimeout` arbitrarios |
| **Supabase Realtime en tests** | MEDIA | ALTO | - Mock de channels en unit/integration<br>- E2E con subscripciones reales pero seed controlado |
| **Concurrencia de slots** | MEDIA | MEDIO | - Tests específicos de concurrency<br>- Mock de transacciones optimistas |
| **RLS policies no cubiertas** | BAJA | ALTO | - Tests de integración con diferentes roles mock<br>- Verificar respuestas 403/401 |
| **A11y no validada** | MEDIA | MEDIO | - jest-axe en componentes críticos<br>- @axe-core/playwright en E2E |
| **Cobertura insuficiente** | MEDIA | MEDIO | - Meta mínima 70%<br>- Review de reportes en CI |
| **Tests lentos (>5min)** | MEDIA | BAJO | - Paralelización en CI<br>- Optimizar seeds de E2E |

## 6. Plan de Implementación

### Sprint 0: Auditoría y Plan ✅
**Estado**: EN CURSO
**Entregable**: Este documento

### Sprint 1: Infraestructura Vitest
**Duración**: 1-2 días
**PR**: `feat/testing-vitest-setup`

**Tareas**:
- [ ] Desinstalar Jest y dependencias
- [ ] Instalar Vitest + deps (vitest, @vitest/coverage-v8, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom, whatwg-fetch, jest-axe, axe-core)
- [ ] Crear `vitest.config.ts`
- [ ] Crear `tests/setup.ts` con mocks globales
- [ ] Crear `tests/mocks/supabase.ts`
- [ ] Crear `tests/utils/time.ts`
- [ ] Scripts en package.json
- [ ] 2 tests de ejemplo (unit + component dummy)

**Criterios de Aceptación**:
- ✅ `npm run test` ejecuta sin errores
- ✅ `npm run test:coverage` genera reporte en `coverage/`
- ✅ Tests de ejemplo pasan (verde)
- ✅ TypeScript compila sin errores

### Sprint 2: Component Tests (UI Crítica)
**Duración**: 2-3 días
**PR**: `feat/testing-components-ui`

**Tareas**:
- [ ] Test de formulario de turno (crear/editar)
  - [ ] Render inicial
  - [ ] Validación zod
  - [ ] react-day-picker interacción
  - [ ] Error messages
  - [ ] Submit exitoso
  - [ ] A11y con jest-axe
- [ ] Test de tabla de turnos
  - [ ] Render vacío y con datos
  - [ ] Filtros
  - [ ] Estados/badges
- [ ] Test de componentes UI base (Button, Calendar, Select)
- [ ] Documentar patrón de testing en `docs/testing-components.md`

**Criterios de Aceptación**:
- ✅ 5-8 tests de componentes reales
- ✅ Cobertura de `components/` >60%
- ✅ Sin violaciones de a11y en componentes críticos
- ✅ Docs actualizados

### Sprint 3: Integration Tests
**Duración**: 2-3 días
**PR**: `feat/testing-integration`

**Tareas**:
- [ ] Tests de operaciones CRUD con Supabase mock
  - [ ] Crear turno (validación + concurrencia)
  - [ ] Cambiar estado turno (transiciones)
  - [ ] Listar/filtrar turnos
- [ ] Tests de validaciones zod en server-side
- [ ] Extraer utilidades de mock en `tests/mocks/`
- [ ] Crear fixtures en `tests/fixtures/`
- [ ] Documentar en `docs/testing-integration.md`

**Criterios de Aceptación**:
- ✅ 3-5 tests de integración
- ✅ Cobertura de `lib/` >70%
- ✅ Mocks reutilizables documentados
- ✅ Branch coverage razonable

### Sprint 4: E2E con Playwright
**Duración**: 3-4 días
**PR**: `feat/testing-e2e-playwright`

**Tareas**:
- [ ] Instalar Playwright + @axe-core/playwright
- [ ] Ejecutar `npx playwright install`
- [ ] Crear `playwright.config.ts`
- [ ] Crear seed de datos mínimo para E2E
- [ ] **Smoke tests**:
  - [ ] Home page carga
  - [ ] Navegación principal
  - [ ] Sin errores de console
- [ ] **Flujos críticos**:
  - [ ] Crear turno completo
  - [ ] Gestión de turno (llamar → finalizar)
  - [ ] Pantalla pública real-time
- [ ] **A11y E2E**:
  - [ ] Home page
  - [ ] Formulario de turno
  - [ ] Pantalla pública
- [ ] Scripts en package.json
- [ ] Documentar en `docs/testing-e2e.md`

**Criterios de Aceptación**:
- ✅ `npm run test:e2e` ejecuta verde en local
- ✅ 6-10 tests E2E (smoke + críticos)
- ✅ A11y sin violaciones graves
- ✅ Reportes generados en `playwright-report/`
- ✅ Docs con prerequisitos y seeds

### Sprint 5: A11y y Performance
**Duración**: 1-2 días
**PR**: `feat/testing-a11y-improvements`

**Tareas**:
- [ ] Reforzar jest-axe en componentes más usados
  - [ ] Inputs, Forms, Buttons
  - [ ] Tablas/listas
  - [ ] Modals/Dialogs
- [ ] Documentar exclusiones de falsos positivos
- [ ] (Opcional) Lighthouse CI básico para smoke budgets
- [ ] Crear reporte de issues de a11y encontrados
- [ ] Fixes mínimos (labels, roles, focus)

**Criterios de Aceptación**:
- ✅ Tests de a11y en 80% de componentes críticos
- ✅ Documentación de exclusiones justificadas
- ✅ Reporte de issues + fixes aplicados
- ✅ (Opcional) Lighthouse CI configurado

### Sprint 6: CI/CD y Docs Finales
**Duración**: 1-2 días
**PR**: `feat/testing-ci-docs`

**Tareas**:
- [ ] Crear `.github/workflows/tests.yml`
  - [ ] Job: unit-integration (typecheck + lint + test:coverage)
  - [ ] Job: e2e (build + playwright)
  - [ ] Upload de coverage como artifact
  - [ ] Cache de node_modules y playwright browsers
- [ ] Anti-flaky measures:
  - [ ] Review de esperas determinísticas
  - [ ] Queries por rol/label
  - [ ] Timeouts configurados
- [ ] Crear/actualizar `TESTING.md` o sección en README:
  - [ ] Cómo correr cada suite
  - [ ] Cómo debuggear tests
  - [ ] Cómo actualizar mocks
  - [ ] Interpretar reportes de cobertura
  - [ ] Metas y exclusiones
- [ ] Verificar CI verde

**Criterios de Aceptación**:
- ✅ CI ejecuta en cada PR
- ✅ Jobs unit-integration + e2e pasan
- ✅ Coverage report se genera y sube
- ✅ Docs completas y claras
- ✅ README.md actualizado con badges (opcional)

## 7. Metas de Cobertura

### Objetivo Inicial: ≥70% líneas
```
Overall:      ≥70% líneas, ≥65% branches
lib/          ≥80% (funciones core)
components/   ≥70% (componentes críticos)
app/          ≥50% (pages + layouts)
hooks/        ≥70%
```

### Exclusiones
```javascript
// vitest.config.ts
coverage: {
  exclude: [
    'node_modules',
    '.next',
    'playwright-report',
    'tests/e2e/**',
    '**/*.d.ts',
    '**/*.config.{ts,js}',
    '**/types.ts',
    'middleware.ts', // Complejo de mockear, covered por E2E
  ]
}
```

### Reportes
- **Formato**: text (consola), html (navegable), lcov (CI/Coverage services)
- **Ubicación**: `coverage/` (gitignored)
- **CI**: Subir lcov como artifact, opcionalmente integrar con Codecov/Coveralls

## 8. Comandos NPM

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
    "test:all": "npm run test:coverage && npm run test:e2e",
    "typecheck": "tsc --noEmit",
    "lint": "next lint"
  }
}
```

## 9. Archivos a Crear

### Sprint 1
```
vitest.config.ts
tests/setup.ts
tests/mocks/supabase.ts
tests/utils/time.ts
tests/unit/date-utils.spec.ts
tests/components/Dummy.spec.tsx
```

### Sprint 2
```
tests/components/AppointmentForm.spec.tsx
tests/components/AppointmentsTable.spec.tsx
tests/components/ui/Button.spec.tsx
tests/components/ui/Calendar.spec.tsx
tests/components/ui/Select.spec.tsx
docs/testing-components.md
```

### Sprint 3
```
tests/integration/appointments.spec.ts
tests/integration/patients.spec.ts
tests/fixtures/appointments.ts
tests/fixtures/patients.ts
tests/fixtures/professionals.ts
docs/testing-integration.md
```

### Sprint 4
```
playwright.config.ts
tests/e2e/smoke.spec.ts
tests/e2e/appointments.spec.ts
tests/e2e/public-screen.spec.ts
tests/e2e/a11y.spec.ts
tests/e2e/fixtures/seed.ts
docs/testing-e2e.md
```

### Sprint 5
```
tests/a11y/components.spec.tsx
tests/a11y/report.md
(opcional) lighthouse.config.js
```

### Sprint 6
```
.github/workflows/tests.yml
TESTING.md (o sección en README.md)
```

## 10. Consideraciones Especiales

### Supabase Realtime
- **Unit/Integration**: Mock completo de channels y subscripciones
- **E2E**: Usar subscripciones reales pero con seed controlado y timeouts largos

### Concurrencia de Slots
- Tests específicos para optimistic locking (`lib/concurrency.ts`)
- Simular conflictos con mocks de transacciones

### Multi-tenant / RLS
- Tests con diferentes roles mock (admin, administrativo, medico, enfermeria)
- Verificar respuestas 403/401 en escenarios sin permisos

### TTS (Text-to-Speech)
- Mock de Web Speech API en tests de componentes
- E2E: verificar que audio elements existen (no validar sonido real)

### Next.js 15 Specifics
- App Router: mockear `useRouter`, `usePathname`, `useSearchParams`
- Server Components: tests en modo cliente (`'use client'`) o con renderizado SSR mock

## 11. Referencias

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Docs](https://playwright.dev/)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [Supabase Testing Strategies](https://supabase.com/docs/guides/getting-started/testing)

---

**Fecha**: 2025-10-03
**Autor**: Claude Code
**Estado**: Sprint 0 - Plan completado, listo para Sprint 1
