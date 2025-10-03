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