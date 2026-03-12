Quiero que implementes toda la infraestructura y suites de testing para este repo turnero-zs (Next.js 15.5.2, React 18, TypeScript 5, Tailwind, Supabase, RHF, zod). El proyecto hoy no tiene tests funcionales. Trabajá por sprints con PRs atómicos, checklists y documentación.

Contexto técnico real del repo

next: 15.5.2

react/react-dom: 18.2

typescript: ^5.3

UI: Tailwind + shadcn/ui + Radix

Formularios: react-hook-form + zod

Fecha: react-day-picker y date-fns

Datos: @supabase/supabase-js (lado cliente)

En devDependencies hay Jest 30 pero no queremos Jest. Queremos Vitest para unit/integration y Playwright para E2E.

Objetivo global

Unit/Component/Integration: Vitest + Testing Library + jsdom + jest-dom + user-event + whatwg-fetch + jest-axe (para a11y a nivel componente).

E2E: Playwright + @axe-core/playwright (smoke + flujos críticos).

Cobertura: objetivo inicial ≥70% líneas; reportes html + lcov.

Supabase: mock para unit/integration; para E2E, seed/mocks simples.

DX/CI: scripts NPM; GitHub Actions para unit/integration + e2e; docs claras.

Reglas de implementación

No romper dev, build, start.

Evitar flakes: usar queries por rol/texto, esperas determinísticas.

Sin data-testid salvo necesidad.

Tests y utilidades en /tests o __tests__, pero no dentro de .next ni node_modules.

Mantener TS estricto, sin any innecesarios.

Cada sprint: PR propio, con descripción, checklist y evidencias (salida/prints de cobertura o reportes).

SPRINTS (con entregables y criterios de aceptación)
Sprint 0 — Auditoría y plan

Tareas

Detectar estructura (app/ o src/), puntos de entrada y rutas clave.

Crear docs/testing-strategy.md con:

Pirámide de tests (unit/component/integration/e2e) y alcance.

Flujos críticos a cubrir:
a) Crear turno (selección fecha/hora, validación, feedback).
b) Listar/filtrar turnos por fecha.
c) Cancelar turno (confirmación).

Qué se mockea (Supabase, next/navigation, next/headers).

Matriz de riesgos.

Listado de archivos que vas a crear en sprints siguientes.

Aceptación

PR con docs/testing-strategy.md y checklist de próximos artefactos.

Sprint 1 — Infra Unit/Component con Vitest

Tareas

Desinstalar Jest y deps relacionadas.

Instalar dev-deps:

vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom whatwg-fetch jest-axe axe-core

Crear vitest.config.ts con:

environment: "jsdom", globals: true, setupFiles: ["./tests/setup.ts"]

Cobertura V8, reporter ["text", "html", "lcov"]

include: ["**/*.{ts,tsx}"]

exclude: ["node_modules", ".next", "playwright-report", "tests/e2e/**", "**/*.d.ts"]

Crear tests/setup.ts:

@testing-library/jest-dom, whatwg-fetch

mocks de next/navigation, next/headers

factory de mock Supabase (createClient() fake: auth.getSession, from().select/insert/update etc.)

helper para congelar tiempo (exponer withFrozenTime(date, fn)).

Scripts en package.json:

"test": "vitest", "test:watch": "vitest --watch", "test:coverage": "vitest --coverage", "test:ui": "vitest --ui"

Crear dos tests de ejemplo:

tests/unit/date-utils.spec.ts (función pura con date-fns)

tests/components/Dummy.spec.tsx (render simple + aserciones jest-dom)

Aceptación

npm run test funciona; cobertura se genera en coverage/; ejemplos verdes.

Sprint 2 — Component tests UI clave (RHF + zod + day-picker)

Tareas

Crear tests para un formulario de turno real (o ejemplo representativo) que cubra:

render inicial (labels/roles correctos)

input válido/ inválido (zod), mensajes de error

interacción con react-day-picker (seleccionar fecha) y horario

envío exitoso ⇒ callback o navegación simulada

Añadir jest-axe a los tests de componentes críticos: cada render pasa por axe y falla si hay violaciones graves (excepto falsos positivos documentados).

Aceptación

3–5 tests de componentes reales, con validaciones y a11y.

Documentar accesos por rol/texto y por qué se evitan data-testid.

Sprint 3 — Integration (route handlers / server actions)

Tareas

Tests que llamen route handlers (app/api/*/route.ts) o server actions:

escenarios 200/4xx/5xx

validación con zod

errores de BD simulados (mocks Supabase)

Extraer utilidades de mock en tests/mocks/supabase.ts reutilizables.

Aceptación

2–3 tests de integración con branch coverage razonable.

Documento corto docs/testing-integration.md con cómo correrlos y debuggear.

Sprint 4 — E2E con Playwright (+axe)

Tareas

Instalar: @playwright/test @axe-core/playwright y ejecutar npx playwright install.

Crear playwright.config.ts:

testDir: "tests/e2e"

use.baseURL = "http://localhost:3000"

webServer: command: "npm run build && npm run start", url, reuseExistingServer: !process.env.CI

Tests:

Smoke: home renderiza, navegación principal, assets cargan.

Flujos:
a) crear turno (llenar form, submit, confirmación),
b) filtrar/buscar por fecha,
c) cancelar turno (dialogo de confirmación).

Accesibilidad: axe en home y crear turno (falla si violaciones serias).

Scripts:

"test:e2e": "playwright test", "test:e2e:ui": "playwright test --ui"

Aceptación

E2E verde en local; reportes en playwright-report/.

docs/testing-e2e.md con prerequisitos y cómo mockear/semillar datos.

Sprint 5 — A11y y Performance (opcional perf)

Tareas

Reforzar jest-axe en componentes más usados (inputs, tablas/listas).

En E2E, listas de exclusión mínimas para falsos positivos; documentar por qué.

(Opcional) Lighthouse CI básico para smoke budgets (si hay tiempo).

Aceptación

Reporte de issues de a11y y fixes mínimos (labels, roles, focus, contraste).

Sprint 6 — CI/CD, Flakiness y Docs finales

Tareas

GitHub Actions:

Job unit-integration: npm ci, npm run typecheck, npm run lint, npm run test:coverage (subir lcov como artifact).

Job e2e: npm run build, playwright test (cache de playwright).

Anti-flaky:

esperar toBeVisible/toBeEnabled, evitar sleeps arbitrarios

usar getByRole/getByLabelText con nombres accesibles

TESTING.md (o actualizar README.md):

cómo correr cada suite, depurar, actualizar mocks, interpretar reportes.

metas de cobertura y qué se excluye.

Aceptación

CI verde con las dos jobs.

Documentación completa y clara.

Entregables esperados (resumen)

vitest.config.ts, tests/setup.ts, tests/mocks/*

tests unit/component/integration bajo tests/

playwright.config.ts + tests/e2e/*

scripts en package.json

docs/testing-strategy.md, docs/testing-integration.md, docs/testing-e2e.md y TESTING.md/README.md

Workflow de GitHub Actions en .github/workflows/tests.yml (o similar)

Extras

Si alguna ruta o componente aún no existe, crear stubs mínimos solo para que los tests demuestren el patrón (documentarlo).

Mantener consistencia con TypeScript y ESLint existentes.

No introducir librerías nuevas fuera de las listadas, salvo justificación en PR.

---

## 📊 ESTADO DE PROGRESO (Actualizado: 2025-10-03)

### ✅ Sprint 0 — Auditoría y Plan [COMPLETADO]

**Fecha completado**: 2025-10-03

**Entregables**:
- ✅ `docs/testing-strategy.md` - Estrategia completa de testing
- ✅ Auditoría de estructura del proyecto
- ✅ Identificación de flujos críticos
- ✅ Matriz de riesgos
- ✅ Plan detallado de 6 sprints

**Hallazgos clave**:
- Proyecto usa Next.js 15.5.2 con App Router
- Estructura: `app/`, `components/`, `lib/`, `hooks/`
- Rutas críticas: `/turnos`, `/profesional`, `/pantalla`
- No hay tests existentes (Jest instalado pero no configurado)

---

### ✅ Sprint 1 — Infra Unit/Component con Vitest [COMPLETADO]

**Fecha completado**: 2025-10-03
**Branch sugerida**: `feat/testing-vitest-setup`

#### ✅ Tareas completadas

1. **Desinstalación de Jest**
   - ✅ Removido: `jest`, `@types/jest`, `jest-environment-jsdom`
   - ✅ Confirmado: Sin conflictos con ESLint

2. **Instalación de dependencias**
   ```bash
   npm install --save-dev \
     vitest@^3.2.4 \
     @vitest/coverage-v8@^3.2.4 \
     @vitest/ui@^3.2.4 \
     @vitejs/plugin-react@^5.0.4 \
     @testing-library/react@16.3.0 \
     @testing-library/dom@^10.4.1 \
     @testing-library/user-event@14.6.1 \
     @testing-library/jest-dom@6.8.0 \
     jsdom@^27.0.0 \
     whatwg-fetch@^3.6.20 \
     jest-axe@^10.0.0 \
     axe-core@^4.10.3
   ```

3. **Archivos de configuración creados**

   **`vitest.config.ts`**:
   - Environment: jsdom
   - Globals: true
   - Setup files: `./tests/setup.ts`
   - Coverage provider: V8
   - Reporters: text, html, lcov
   - Thresholds: 70% líneas, 65% branches
   - Alias: `@/` → `.`

   **`tests/setup.ts`**:
   - ✅ Import de `@testing-library/jest-dom`
   - ✅ Import de `whatwg-fetch`
   - ✅ Mock de `next/navigation` (useRouter, usePathname, useSearchParams, useParams)
   - ✅ Mock de `next/headers` (cookies, headers)
   - ✅ Mock de `@/lib/supabase` (auth, from, channel)
   - ✅ Mock de Web Speech API (speechSynthesis, SpeechSynthesisUtterance)
   - ✅ Supresión de warnings de React en tests
   - ✅ `afterEach(() => vi.clearAllMocks())`

   **`tests/mocks/supabase.ts`**:
   - ✅ `mockUser`, `mockSession` (datos básicos)
   - ✅ `createMockSupabaseClient()` - Factory principal
   - ✅ `createAuthenticatedMock()` - Mock con usuario autenticado por rol
   - ✅ `createSuccessQueryMock()` - Mock de query exitosa
   - ✅ `createErrorQueryMock()` - Mock de error de DB
   - ✅ `createMockRealtimeChannel()` - Mock de canales Realtime
   - ✅ `simulateRealtimeUpdate()` - Helper para simular eventos real-time

   **`tests/utils/time.ts`**:
   - ✅ `withFrozenTime()` - Congela tiempo en tests
   - ✅ `advanceTime()` - Avanza timers en tests
   - ✅ `nextTick()` - Avanza al siguiente tick
   - ✅ `createArgentineDate()` - Helper para fechas AR
   - ✅ `formatTestDate()` - Formato es-AR
   - ✅ `createDateRange()` - Genera rango de fechas

4. **Scripts NPM agregados**
   ```json
   {
     "test": "vitest",
     "test:watch": "vitest --watch",
     "test:coverage": "vitest --coverage",
     "test:ui": "vitest --ui"
   }
   ```

5. **Tests de ejemplo creados**

   **`tests/unit/date-utils.spec.ts`** (8 tests):
   - ✅ formatDateTime con locale es-AR
   - ✅ formatTime solo hora
   - ✅ date-fns con locale español
   - ✅ withFrozenTime funcionando

   **`tests/components/Button.spec.tsx`** (9 tests):
   - ✅ Render básico
   - ✅ Click handler
   - ✅ Estado disabled
   - ✅ Variantes (default, destructive, outline, secondary, ghost, link)
   - ✅ Tamaños (default, sm, lg, icon)
   - ✅ asChild con Slot
   - ✅ Props customizadas

#### 📊 Resultados de ejecución

```
Test Files  2 passed (2)
Tests       17 passed (17)
Duration    13.72s
```

#### 📁 Estructura de archivos creada

```
turnero-zs/
├── vitest.config.ts              [NUEVO]
├── tests/                         [NUEVO]
│   ├── setup.ts                   [NUEVO]
│   ├── mocks/
│   │   └── supabase.ts            [NUEVO]
│   ├── utils/
│   │   └── time.ts                [NUEVO]
│   ├── unit/
│   │   └── date-utils.spec.ts     [NUEVO]
│   └── components/
│       └── Button.spec.tsx        [NUEVO]
├── package.json                   [MODIFICADO - scripts + deps]
└── docs/
    └── testing-strategy.md        [NUEVO - Sprint 0]
```

#### ✅ Criterios de aceptación verificados

- ✅ `npm run test` ejecuta sin errores
- ✅ `npm run test:coverage` genera reporte en `coverage/`
- ✅ Tests de ejemplo pasan (17/17 verde)
- ✅ TypeScript compila sin errores
- ✅ Mocks globales funcionando correctamente
- ✅ No rompe `npm run dev`, `npm run build`, `npm run start`

#### 📝 Notas de implementación

- Se agregó `@testing-library/dom` que no estaba en la lista original pero era peer dependency de `@testing-library/react`
- Los mocks de Supabase incluyen soporte para Realtime channels (crítico para pantallas públicas)
- Los mocks de Web Speech API permiten testear funcionalidad TTS sin browser real
- Se configuraron supresores de warnings para mantener output limpio

---

### 🔜 Sprint 2 — Component Tests UI Clave [PENDIENTE]

**Estado**: No iniciado
**Branch sugerida**: `feat/testing-components-ui`

#### Tareas pendientes

- [ ] Test de formulario de turno (crear/editar)
  - [ ] Render inicial (labels, placeholders)
  - [ ] Validación zod (campos requeridos, formatos)
  - [ ] Interacción con react-day-picker
  - [ ] Selección de horario disponible
  - [ ] Mensajes de error visualizados
  - [ ] Submit exitoso → callback/navegación mock
  - [ ] A11y con jest-axe
- [ ] Test de tabla de turnos
  - [ ] Render vacío y con datos
  - [ ] Filtros (fecha/estado/profesional)
  - [ ] Badges de estado con colores
  - [ ] Acciones (cancelar, llamar, finalizar)
- [ ] Test de componentes UI base
  - [ ] Calendar (navegación, selección)
  - [ ] Select (opciones, onChange)
  - [ ] Form (integración RHF + error display)
- [ ] Documentar en `docs/testing-components.md`

#### Criterios de aceptación Sprint 2

- [ ] 5-8 tests de componentes reales
- [ ] Cobertura de `components/` >60%
- [ ] Sin violaciones de a11y en componentes críticos
- [ ] Docs actualizados con patrones y ejemplos

---

### 🔜 Sprint 3 — Integration Tests [PENDIENTE]

**Estado**: No iniciado
**Branch sugerida**: `feat/testing-integration`

#### Tareas pendientes

- [ ] Tests de operaciones CRUD con Supabase mock
- [ ] Tests de validaciones zod server-side
- [ ] Crear fixtures en `tests/fixtures/`
- [ ] Documentar en `docs/testing-integration.md`

---

### 🔜 Sprint 4 — E2E con Playwright [PENDIENTE]

**Estado**: No iniciado
**Branch sugerida**: `feat/testing-e2e-playwright`

---

### 🔜 Sprint 5 — A11y y Performance [PENDIENTE]

**Estado**: No iniciado

---

### 🔜 Sprint 6 — CI/CD y Docs Finales [PENDIENTE]

**Estado**: No iniciado

---

## 🎯 Próximos Pasos Inmediatos

1. **Crear PR de Sprint 1** (feat/testing-vitest-setup):
   - Título: "feat: configurar infraestructura Vitest para testing"
   - Descripción: Infraestructura completa + 2 tests de ejemplo (17 tests pasando)
   - Checklist: Todos los ítems de Sprint 1 marcados
   - Evidencias: Adjuntar screenshot de `npm run test` exitoso

2. **Iniciar Sprint 2**: Tests de componentes UI críticos
   - Foco principal: Formulario de turnos con react-hook-form + zod + react-day-picker
   - Agregar jest-axe a todos los tests de componentes

3. **Mantener documentación actualizada**: Este archivo debe reflejar el estado real

---

## 📚 Documentos de Referencia

- `docs/testing-strategy.md` - Estrategia completa y detallada (Sprint 0)
- `docs/testing-components.md` - Patrones de component testing (pendiente Sprint 2)
- `docs/testing-integration.md` - Guía de integration testing (pendiente Sprint 3)
- `docs/testing-e2e.md` - Guía de E2E con Playwright (pendiente Sprint 4)
- `TESTING.md` o README.md - Guía rápida para desarrolladores (pendiente Sprint 6)