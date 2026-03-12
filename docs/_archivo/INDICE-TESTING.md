# 📑 Testing: Índice de Navegación

Guía rápida para encontrar documentación de testing.

---

## 🎯 Empezar (5 minutos)

| Si necesitas | Lee |
|--------------|-----|
| Primer test | `GUIA-RAPIDA-FIXTURES.md` |
| Entender plan | `TESTING-STRATEGY-V2.md` (primeras 3 secciones) |
| Ver qué se hizo | `RESUMEN-FASE-2-TURNOS.md` |
| Componentes | `COMPONENTES-ATOMIZADOS.md` |

---

## 📚 Documentos Clave

### TESTING-STRATEGY-V2.md
- **Propósito**: Estrategia general de testing
- **Contiene**: Stack tecnológico, pirámide de testing, módulos por testear
- **Usa para**: Entender el plan general, ver qué testear
- **Secciones clave**: Módulos a Testear, Ejemplos de Tests

### GUIA-RAPIDA-FIXTURES.md
- **Propósito**: Tutorial práctico de fixtures
- **Contiene**: Cómo importar, patrones de uso, ejemplos
- **Usa para**: Escribir tests rápidamente
- **Ejemplos**: Factories, Mocks, Relaciones

### COMPONENTES-ATOMIZADOS.md
- **Propósito**: Referencia de componentes creados
- **Contiene**: Lista de componentes por módulo, props, ejemplos
- **Usa para**: Entender qué componentes están disponibles
- **Módulos**: turnos, pacientes, servicios, consultorios, profesionales, asignaciones

### RESUMEN-FASE-2-TURNOS.md
- **Propósito**: Resultados de la optimización
- **Contiene**: Métricas, componentes creados, beneficios
- **Usa para**: Ver qué se logró

---

## 🧪 Tests Actuales

**Ubicación**: `/tests/`

**Fixtures**: `/tests/fixtures/`
- `zones.ts`, `institutions.ts`, `users.ts`, `patients.ts`, `professionals.ts`, `memberships.ts`, `queue.ts`

---

## 📂 Estructura

```
docs/
├── TESTING-STRATEGY-V2.md     (Plan general)
├── GUIA-RAPIDA-FIXTURES.md    (Tutorial práctico)
├── COMPONENTES-ATOMIZADOS.md  (Referencia de componentes)
└── RESUMEN-FASE-2-TURNOS.md   (Resultados de optimización)

tests/
├── fixtures/                   (Data factories y mocks)
│   ├── zones.ts
│   ├── institutions.ts
│   ├── users.ts
│   ├── patients.ts
│   ├── professionals.ts
│   ├── memberships.ts
│   └── queue.ts
├── unit/                       (Tests unitarios)
├── component/                  (Tests de componentes)
├── integration/                (Tests de integración)
└── e2e/                        (Tests end-to-end)
```

---

## ⚡ Quick Links

- **Para escribir tests**: Abre `GUIA-RAPIDA-FIXTURES.md` + `/tests/fixtures/`
- **Para entender plan**: Lee `TESTING-STRATEGY-V2.md`
- **Para ver componentes**: Revisa `COMPONENTES-ATOMIZADOS.md`
- **Para entender resultados**: Lee `RESUMEN-FASE-2-TURNOS.md`

---

**Estado:** ✅ Documentación limpia | **Última actualización:** Nov 2025
