# 📦 Componentes Atomizados

Referencia rápida de componentes extraídos durante optimización Fase 2.

---

## 📊 Estado General

| Módulo | Componentes | Reducción | Estado |
|--------|-------------|-----------|--------|
| `/turnos` | 5 | 1250 → 662 (47%) | ✅ |
| `/pacientes` | 2 | 335 → 192 (43%) | ✅ |
| `/servicios` | 2 | 395 → 267 (32%) | ✅ |
| `/consultorios` | 2 | 350 → 288 (18%) | ✅ |
| `/profesionales` | 1 | 244 → 186 (24%) | ✅ |
| `/asignaciones` | 2 | 399 → 296 (26%) | ✅ |
| **TOTAL** | **14** | **~2973 → ~1891 (36%)** | ✅ |

---

## 🧩 Componentes por Módulo

### `/turnos` (5 componentes)

| Componente | Líneas | Propósito |
|------------|--------|----------|
| `StatusLegend` | 31 | Leyenda de colores de estados |
| `QueueStats` | 40 | Estadísticas totales vs filtradas |
| `PatientCard` | ~110 | Tarjeta individual del paciente |
| `AddPatientDialog` | ~130 | Diálogo para agregar pacientes |
| `QueueFilters` | ~160 | Panel de filtros avanzado |

**Ejemplo de uso:**
```tsx
<QueueFilters
  selectedServiceFilter={selectedService}
  onServiceFilterChange={setSelectedService}
  services={services}
  onClearFilters={() => { /* reset */ }}
/>

<PatientCard
  item={queueItem}
  isOptimistic={item.id.startsWith('temp-')}
  callingId={callingId}
  onUpdateStatus={(id, status) => updateStatus(id, status)}
/>
```

### `/pacientes` (2 componentes)

| Componente | Propósito |
|------------|----------|
| `PatientForm` | Crear/editar pacientes |
| `PatientTableRow` | Fila con acciones toggle/edit/delete |

### `/servicios` (2 componentes)

| Componente | Propósito |
|------------|----------|
| `ServiceForm` | Formulario con selector de duración |
| `ServiceTableRow` | Fila con estado y acciones |

### `/consultorios` (2 componentes)

| Componente | Propósito |
|------------|----------|
| `RoomForm` | Formulario simple |
| `RoomTableRow` | Fila con toggle y acciones CRUD |

### `/profesionales` (1 componente)

| Componente | Propósito |
|------------|----------|
| `ProfessionalTableRow` | Fila con información e ícono estado |

### `/asignaciones` (2 componentes)

| Componente | Propósito |
|------------|----------|
| `AssignmentForm` | Formulario con selects en cascada |
| `AssignmentTableRow` | Fila de asignación |

---

## 🎯 Patrones Aplicados

- **Single Responsibility**: Cada componente hace una cosa bien
- **Composición**: Componentes reutilizables en page.tsx
- **Props Tipados**: Interfaces TypeScript claras
- **Colocation**: Componentes específicos en `components/módulo/`

---

## ✨ Beneficios

| Aspecto | Mejora |
|--------|--------|
| Legibilidad | pages.tsx reducidas de 1250 → 662 líneas |
| Testabilidad | Cada componente testeble independientemente |
| Reutilización | 14 componentes disponibles para reutilizar |
| Mantenibilidad | Cambios aislados a componentes específicos |

---

**Última actualización:** Oct 2025 | **Estado:** ✅ Fase 2 Completa
