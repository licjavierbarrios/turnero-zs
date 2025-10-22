# 📑 Índice Testing - Navegación Rápida

> Encuentra exactamente lo que necesitas para testing en Turnero ZS

---

## 🎯 Empezar Rápido (5 minutos)

1. **Primer Test?** → Lee [GUIA-RAPIDA-FIXTURES.md](#guia-rapida-fixtures)
2. **Entender Arquitectura?** → Lee [TESTING-STRATEGY-V2.md](#testing-strategy-v2) Sección 1-3
3. **Ver Qué Se Hizo?** → Lee [SPRINT-1-COMPLETADO.md](#sprint-1-completado)

---

## 📚 Documentos Testing

### TESTING-STRATEGY-V2.md {#testing-strategy-v2}
**Propósito**: Estrategia completa de testing post-optimización

**Qué Contiene**:
- Cambios vs v1.0
- Estado actual del proyecto (estadísticas)
- Contexto técnico actualizado
- Testing pyramid (distribución de tests)
- Testing por módulo (componentes, líneas, tests)
- Matriz de flujos críticos
- Mocking strategies avanzadas
- Test fixtures y data factories
- **7 sprints planificados** con detalle
- Métricas y targets
- NPM commands
- Checklist pre-implementación

**Cuándo Usar**:
- Para entender el plan general
- Para ver qué tests hacer en cada sprint
- Para reference de fixtures y mocking
- Para métricas y coverage goals

**Secciones Clave**:
- Sección 5: Testing by Module (prioridades)
- Sección 9: Sprint Implementation Plan (7 sprints)
- Sección 10: Metrics & Targets (goals)

---

### SPRINT-1-COMPLETADO.md {#sprint-1-completado}
**Propósito**: Reporte detallado de Sprint 1 completado

**Qué Contiene**:
- Resumen ejecutivo
- Objetivos completados (checklist)
- Estadísticas (fixtures, tests, cobertura)
- Desglose detallado de cada fixture
- Tests implementados con descripción
- Cómo usar los fixtures (ejemplos)
- Próximos pasos (Sprint 2)
- Referencias a archivos

**Cuándo Usar**:
- Para ver qué ya existe
- Para entender qué fixtures usar
- Para ver ejemplos de tests
- Para referencia de estadísticas

**Secciones Clave**:
- Sección 3: Fixtures Creados (desglose completo)
- Sección 4: Tests Implementados (21 tests nuevos)
- Sección 5: Cómo Usar Fixtures (ejemplos prácticos)

---

### GUIA-RAPIDA-FIXTURES.md {#guia-rapida-fixtures}
**Propósito**: Tutorial práctico para usar fixtures en tests

**Qué Contiene**:
- Cómo importar fixtures
- Patrones de uso comunes (5 patrones)
- Ejemplos prácticos por módulo
- Patrones avanzados (combinar, variantes)
- Errores comunes (❌ vs ✅)
- Checklist para crear nuevo test
- Debugging fixtures
- Tabla de archivos disponibles

**Cuándo Usar**:
- Cuando vas a escribir un test
- Cuando necesitas ejemplos específicos
- Cuando no sabes cómo usar una factory
- Cuando tienes errores en fixtures

**Secciones Clave**:
- Patrones de Uso (5 ejemplos)
- Ejemplos Prácticos por Módulo
- Errores Comunes (aprender qué NO hacer)

---

### SESION-TESTING-RESUMEN.md {#sesion-testing-resumen}
**Propósito**: Resumen ejecutivo de toda la sesión de testing

**Qué Contiene**:
- Logros principales
- Tabla de artifacts creados
- Test results (38/38 passing)
- Flujo de trabajo detallado
- Decisiones técnicas y reasoning
- Readiness para Sprint 2
- Aprendizajes y best practices
- Métricas finales
- Conclusiones

**Cuándo Usar**:
- Para overview de qué se hizo
- Para entender decisiones técnicas
- Para onboarding nuevo miembro del equipo
- Para reporte executivo

**Secciones Clave**:
- Logros Principales (tabla resumen)
- Decisiones Técnicas (reasoning detrás)
- Metrics Finales (stats)

---

## 🗂️ Archivos de Fixtures

### Localización
```
tests/fixtures/
├── index.ts                    # Exportador central
├── zones.ts                    # Zonas geográficas
├── institutions.ts             # Hospitales/CAPS
├── rooms.ts                    # Consultorios
├── services.ts                 # Servicios médicos
├── professionals.ts            # Doctores
├── patients.ts                 # Pacientes
├── users.ts                    # Usuarios sistema
├── memberships.ts              # Usuario-Institución-Rol
├── appointments.ts             # Citas/Turnos
└── queue.ts                    # Cola diaria (daily_queue)
```

### Cómo Importar
```typescript
// Opción 1: Importar todo
import * as fixtures from '@/tests/fixtures'

// Opción 2: Importar específicamente
import { createZone, mockHospitalRegional } from '@/tests/fixtures'

// Opción 3: Importar de archivo específico
import { createQueueItem } from '@/tests/fixtures/queue'
```

### Fixtures Disponibles

| Entidad | Archivo | Factories | Mocks | Usar Para |
|---------|---------|-----------|-------|-----------|
| **Zones** | zones.ts | 2 | 2 | Filtros de zona, relaciones |
| **Institutions** | institutions.ts | 4 | 4 | Tests de institución, hospitales |
| **Rooms** | rooms.ts | 3 | 5 | Tests de consultorios, salas |
| **Services** | services.ts | 3 | 8 | Tests de servicios médicos |
| **Professionals** | professionals.ts | 3 | 5 | Tests de doctores, especialistas |
| **Patients** | patients.ts | 3 | 7 | Tests de pacientes, casos |
| **Users** | users.ts | 3 | 7 | Tests de acceso, permisos |
| **Memberships** | memberships.ts | 4 | 7 | Tests de roles, acceso institucional |
| **Appointments** | appointments.ts | 2 | 11 | Tests de turnos, citas |
| **Queue** | queue.ts | 2 | 7 | Tests de cola diaria, real-time |

**Total**: 110 fixtures = 30 factories + 80 mocks

---

## 🧪 Archivos de Tests

### Actuales
```
tests/
├── unit/
│   └── date-utils.spec.ts              # 8 tests ✅
├── components/
│   ├── Button.spec.tsx                 # 9 tests ✅
│   └── turnos/
│       ├── QueueStats.spec.tsx         # 10 tests ✅
│       └── StatusLegend.spec.tsx       # 11 tests ✅
├── fixtures/
│   └── [10 fixture files]
├── setup.ts                            # Global setup + mocks
├── mocks/
│   └── supabase.ts                     # Supabase mock factories
└── utils/
    └── time.ts                         # Time utilities for tests
```

**Total Actual**: 38 tests passing ✅

### Tests por Hacer (Sprint 2+)

Ver [TESTING-STRATEGY-V2.md - Section 9](#testing-strategy-v2) para sprint plan completo.

Resumen:
- **Sprint 2**: Turnos module tests (70+ tests)
- **Sprint 3**: Dashboard modules (60+ tests)
- **Sprint 4**: Integration tests (30+ tests)
- **Sprint 5**: E2E + A11y (40+ tests)
- **Sprint 6**: Super-admin (50+ tests)
- **Sprint 7**: CI/CD (docs + setup)

---

## 🚀 Comandos Útiles

### Ejecutar Tests
```bash
# Ejecutar todos los tests
npm run test

# Ejecutar en watch mode
npm run test:watch

# Ejecutar con coverage
npm run test:coverage

# Ejecutar tests específicos
npm run test -- tests/components/turnos
npm run test -- QueueStats

# Ver UI de tests
npm run test:ui
```

### Debugging
```bash
# Tests con output detallado
npm run test -- --reporter=verbose

# Tests con colores y formateo
npm run test -- --reporter=pretty

# Generar coverage report
npm run test:coverage
# Abre: coverage/index.html
```

---

## 📝 Checklist: Nuevo Test

Use esta checklist cuando cree un nuevo test:

```typescript
// ✅ 1. Importar dependencias
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// ✅ 2. Importar fixtures
import { createQueueItem } from '@/tests/fixtures'

// ✅ 3. Importar componente/función
import { QueueItem } from '@/components/turnos/QueueItem'

describe('Component Name', () => {
  // ✅ 4. Crear datos con fixtures
  test('does something', () => {
    const data = createQueueItem({ patient_name: 'Test' })

    // ✅ 5. Renderizar o ejecutar
    render(<QueueItem item={data} />)

    // ✅ 6. Assert
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

---

## 🔍 Encontrar Lo Que Necesitas

### "Quiero escribir un test de..."

| Necesito Test De | Documento | Sección |
|------------------|-----------|---------|
| **Zona** | GUIA-RAPIDA-FIXTURES | Ejemplos Prácticos |
| **Institución** | SPRINT-1-COMPLETADO | Fixtures por Entidad |
| **Paciente** | TESTING-STRATEGY-V2 | Testing by Module |
| **Usuario/Rol** | GUIA-RAPIDA-FIXTURES | Patrones Avanzados |
| **Cita/Turno** | SPRINT-1-COMPLETADO | Appointments |
| **Cola Diaria** | GUIA-RAPIDA-FIXTURES | Turnos/Queue |
| **Componente UI** | SPRINT-1-COMPLETADO | Tests Implementados |

### "Quiero entender..."

| Necesito Entender | Documento | Sección |
|-------------------|-----------|---------|
| **Fixtures totales** | SPRINT-1-COMPLETADO | Estadísticas |
| **Plan de tests** | TESTING-STRATEGY-V2 | Sprint Plan |
| **Cómo usar fixtures** | GUIA-RAPIDA-FIXTURES | Patrones de Uso |
| **Qué se hizo** | SESION-TESTING-RESUMEN | Logros |
| **Próximos pasos** | TESTING-STRATEGY-V2 | Sprint 2 |
| **Errores comunes** | GUIA-RAPIDA-FIXTURES | Errores Comunes |

### "Tengo un error en..."

| Tengo Error | Documento | Sección |
|-------------|-----------|---------|
| **Fixtures import** | GUIA-RAPIDA-FIXTURES | Importar Fixtures |
| **Test data** | GUIA-RAPIDA-FIXTURES | Errores Comunes |
| **Component render** | SPRINT-1-COMPLETADO | Tests Implementados |
| **TypeScript types** | SESION-TESTING-RESUMEN | TypeScript + Testing |
| **Supabase mock** | TESTING-STRATEGY-V2 | Mocking Strategies |

---

## 🎓 Orden de Lectura Recomendado

### Para Nuevos Miembros del Equipo
1. **SESION-TESTING-RESUMEN.md** (10 min) - Entender qué se hizo
2. **GUIA-RAPIDA-FIXTURES.md** (15 min) - Aprender a usar fixtures
3. **SPRINT-1-COMPLETADO.md** (10 min) - Ver ejemplos específicos
4. **TESTING-STRATEGY-V2.md** (20 min) - Entender plan completo

### Para Escribir Tests
1. **GUIA-RAPIDA-FIXTURES.md** - Buscar patrón relevante
2. **SPRINT-1-COMPLETADO.md** - Ver ejemplo similar
3. **TESTING-STRATEGY-V2.md** - Consultar testing guidelines

### Para Reportes/Presentaciones
1. **SESION-TESTING-RESUMEN.md** - Métricas y logros
2. **SPRINT-1-COMPLETADO.md** - Detalles técnicos
3. **TESTING-STRATEGY-V2.md** - Plan futuro

---

## 🔗 Cross References

### De TESTING-STRATEGY-V2 a Otros Docs
- Section 8 (Test Fixtures) → Ver SPRINT-1-COMPLETADO
- Section 9 (Sprint Plan) → Ver GUIA-RAPIDA-FIXTURES para examples
- Section 6 (Critical Flows) → Implementar en Sprint 2+

### De SPRINT-1-COMPLETADO a Otros Docs
- Fixtures Creados → Detalles en TESTING-STRATEGY-V2 Section 8
- Próximos Pasos → Plan en TESTING-STRATEGY-V2 Section 9
- Cómo Usar → Guía en GUIA-RAPIDA-FIXTURES

### De GUIA-RAPIDA-FIXTURES a Otros Docs
- Fixtures Disponibles → Lista en SPRINT-1-COMPLETADO
- Complete Testing Plan → Ver TESTING-STRATEGY-V2
- Session Summary → Ver SESION-TESTING-RESUMEN

---

## 📞 Preguntas Frecuentes

**P: ¿Dónde está la factory para Zona?**
R: Ver SPRINT-1-COMPLETADO.md o importa de `@/tests/fixtures/zones`

**P: ¿Cuántos tests debo escribir?**
R: Ver TESTING-STRATEGY-V2.md Section 9 para plan por sprint

**P: ¿Cómo uso overrides en fixtures?**
R: Ver GUIA-RAPIDA-FIXTURES.md - Patrones de Uso

**P: ¿Qué es mejor, factory o mock?**
R: Ver GUIA-RAPIDA-FIXTURES.md - Errores Comunes

**P: ¿Cuáles son los próximos tests?**
R: Ver TESTING-STRATEGY-V2.md - Sprint 2 Plan

**P: ¿Dónde están los tests existentes?**
R: `tests/` - Ver SPRINT-1-COMPLETADO.md - Archivos Creados

---

## 📊 Stats Rápida

- **Fixtures**: 110 (30 factories + 80 mocks)
- **Tests Actuales**: 38 (100% passing)
- **Tests Planificados**: 250+ (7 sprints)
- **Documentación**: 4 files + este índice
- **Coverage Goal**: 65% (pragmático)
- **Setup Time**: 5.4s
- **Execute Time**: 1.25s

---

## ✅ Checklist: Antes de Siguiente Sesión

- [ ] Leí GUIA-RAPIDA-FIXTURES.md
- [ ] Entiendo cómo importar fixtures
- [ ] Leí un ejemplo de test en SPRINT-1-COMPLETADO
- [ ] Ejecuté `npm run test` exitosamente
- [ ] Revisé TESTING-STRATEGY-V2 section 9
- [ ] Sé qué hacer en Sprint 2

---

**Última actualización**: 2025-10-22
**Status**: ✅ Listo para Sprint 2
**Próximo**: Testing de Turnos Module

*Para dudas o sugerencias, consulta el archivo relevante o crea issue en GitHub*
