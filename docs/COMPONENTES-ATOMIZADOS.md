# 📦 Registro de Componentes Atomizados

> **Documento de seguimiento centralizado de todos los componentes extraídos durante el proceso de optimización**

---

## 🎯 Estado General

| Módulo | Estado | % Completado | Líneas Reducidas |
|--------|--------|--------------|------------------|
| `/turnos` | ✅ COMPLETO | 100% | 1250 → 662 (47%) |
| `/pacientes` | ✅ COMPLETO | 100% | 335 → 192 (43%) |
| `/servicios` | ✅ COMPLETO | 100% | 395 → 267 (32%) |
| `/consultorios` | ✅ COMPLETO | 100% | 350 → 288 (18%) |
| `/profesionales` | ✅ COMPLETO | 100% | 244 → 186 (24%) |
| `/asignaciones` | ✅ COMPLETO | 100% | 399 → 296 (26%) |
| **TOTAL PROYECTO** | ✅ FASE 2 COMPLETA | **100%** | ~2973 → ~1891 (36%) |

---

## ✅ MÓDULO: `/turnos` - COMPLETADO

### Componentes Creados (5)

#### 1. ✅ StatusLegend.tsx
```
📍 Ubicación: components/turnos/StatusLegend.tsx
📏 Líneas: 31
🎯 Propósito: Mostrar leyenda de colores de estados
🔧 Props: Ninguno (accede a statusConfig directamente)
✨ Características:
   - Renderiza todos los estados de la cola
   - Usa colores configurados en lib/turnos/config.ts
   - Badge component de shadcn/ui

📝 Ejemplo de uso:
<StatusLegend />
```

---

#### 2. ✅ QueueStats.tsx
```
📍 Ubicación: components/turnos/QueueStats.tsx
📏 Líneas: 40
🎯 Propósito: Mostrar estadísticas de la cola (total vs filtrados)
🔧 Props:
   - totalCount: number (total en la cola)
   - filteredCount: number (mostrados después de filtros)
✨ Características:
   - Calcula automáticamente items ocultos
   - Usa badges para visualización limpia
   - Responsive y accesible

📝 Ejemplo de uso:
<QueueStats
  totalCount={25}
  filteredCount={10}
/>
```

---

#### 3. ✅ PatientCard.tsx
```
📍 Ubicación: components/turnos/PatientCard.tsx
📏 Líneas: ~110
🎯 Propósito: Tarjeta individual de paciente en la cola
🔧 Props:
   - item: QueueItem
   - isOptimistic: boolean
   - callingId: string | null
   - onUpdateStatus: (id: string, newStatus: QueueItem['status']) => void
✨ Características:
   - Indicador visual de "Guardando..." para items temporales
   - Número de orden grande y legible
   - Info del paciente: nombre, DNI, servicio, profesional, consultorio
   - Botones de acción para cambiar estado
   - Efecto visual cuando está siendo llamado
   - Opacidad reducida cuando está atendido

📝 Ejemplo de uso:
<PatientCard
  item={queueItem}
  isOptimistic={item.id.startsWith('temp-')}
  callingId={callingId}
  onUpdateStatus={(id, status) => updateStatus(id, status)}
/>
```

---

#### 4. ✅ AddPatientDialog.tsx
```
📍 Ubicación: components/turnos/AddPatientDialog.tsx
📏 Líneas: ~130
🎯 Propósito: Diálogo para agregar nuevos pacientes a la cola
🔧 Props:
   - isOpen: boolean
   - onOpenChange: (open: boolean) => void
   - attentionOptions: AttentionOption[]
   - onSubmit: (data) => Promise<void>
✨ Características:
   - Formulario para ingresar nombre, DNI y seleccionar servicios/profesionales
   - Multi-select para opciones de atención
   - Validación básica
   - Manejo de loading durante guardado
   - Cierre automático al éxito

📝 Ejemplo de uso:
<AddPatientDialog
  isOpen={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  attentionOptions={attentionOptions}
  onSubmit={handleAddPatient}
/>
```

---

#### 5. ✅ QueueFilters.tsx
```
📍 Ubicación: components/turnos/QueueFilters.tsx
📏 Líneas: ~160
🎯 Propósito: Panel avanzado de filtros para la cola
🔧 Props:
   - selectedServiceFilter: string
   - selectedProfessionalFilter: string
   - selectedRoomFilter: string
   - selectedStatusFilter: string
   - onServiceFilterChange: (value: string) => void
   - onProfessionalFilterChange: (value: string) => void
   - onRoomFilterChange: (value: string) => void
   - onStatusFilterChange: (value: string) => void
   - services: Service[]
   - professionals: Professional[]
   - rooms: Room[]
   - userServices: Service[]
   - onClearFilters: () => void
✨ Características:
   - Filtros independientes por servicio, profesional, consultorio, estado
   - Respeta roles de usuario (admin vs personal)
   - Botón para limpiar todos los filtros
   - Usa Select component de shadcn/ui
   - Dinámico según datos disponibles

📝 Ejemplo de uso:
<QueueFilters
  selectedServiceFilter={selectedServiceFilter}
  onServiceFilterChange={setSelectedServiceFilter}
  services={services}
  // ... más props
  onClearFilters={() => {
    setSelectedServiceFilter('ALL')
    // ... reset de otros filtros
  }}
/>
```

---

### Refactorización de page.tsx

```
📍 Ubicación: app/(dashboard)/turnos/page.tsx
📏 Líneas: 662 (reducido de ~1250)
🎯 Proporción: 47% de reducción ✅

ESTRUCTURA FINAL:
├── Imports (34 líneas)
│   └── Componentes: StatusLegend, QueueStats, PatientCard, AddPatientDialog, QueueFilters
│
├── Estado (27 líneas)
│   └── queue, services, professionals, rooms, filtros, loading
│
├── Effects (117 líneas)
│   ├── fetchData() - carga inicial y refresh
│   ├── Realtime subscription - sincronización en tiempo real
│   └── Aplicación de filtros
│
├── Handlers (138 líneas)
│   ├── handleAddPatient() - con actualización optimista
│   └── updateStatus() - con actualización optimista y rollback
│
└── Render (348 líneas)
    ├── Header con Stats
    ├── Dialog de carga
    ├── Filtros
    ├── Leyenda
    └── Lista de cards

VENTAJAS:
✅ page.tsx ahora es principalmente ORQUESTACIÓN
✅ Componentes son REUTILIZABLES
✅ Lógica SEPARADA de presentación
✅ MÁS LEGIBLE y MANTENIBLE
✅ TESTEABLE por partes
```

---

## ✅ MÓDULO: `/pacientes` - COMPLETADO (335 → 192 líneas, 43%)

### Componentes Creados (2)

1. **PatientForm.tsx** - Formulario para crear/editar pacientes
2. **PatientTableRow.tsx** - Fila de tabla con acciones toggle/edit/delete

---

## ✅ MÓDULO: `/servicios` - COMPLETADO (395 → 267 líneas, 32%)

### Componentes Creados (2)

1. **ServiceForm.tsx** - Formulario con selector de duración
2. **ServiceTableRow.tsx** - Fila de tabla con estado y acciones

---

## ✅ MÓDULO: `/consultorios` - COMPLETADO (350 → 288 líneas, 18%)

### Componentes Creados (2)

1. **RoomForm.tsx** - Formulario simple para consultorios
2. **RoomTableRow.tsx** - Fila con toggle de estado y acciones CRUD

---

## ✅ MÓDULO: `/profesionales` - COMPLETADO (244 → 186 líneas, 24%)

### Componentes Creados (1)

1. **ProfessionalTableRow.tsx** - Fila con información completa del profesional e icono de estado

---

## ✅ MÓDULO: `/asignaciones` - COMPLETADO (399 → 296 líneas, 26%)

### Componentes Creados (2)

1. **AssignmentForm.tsx** - Formulario con selects en cascada de profesionales y consultorios
   - Filtra profesionales no asignados
   - Indica consultorios ocupados
   - Integrado en el flujo de asignación diaria

2. **AssignmentTableRow.tsx** - Fila con información de asignación (profesional → consultorio)

---

## 📊 Resumen de Cambios

### Antes de Atomización
```typescript
// page.tsx - 1250 líneas
export default function QueuePage() {
  // Estado, effects, handlers, render TODO en un archivo
  return (
    <div>
      {/* 300+ líneas de JSX inline */}
    </div>
  )
}
```

### Después de Atomización
```typescript
// page.tsx - 662 líneas
export default function QueuePage() {
  const { /* estado */ } = useHooks() // Limpio

  return (
    <div className="space-y-6">
      {/* Header */}
      <QueueStats totalCount={queue.length} ... />

      {/* Filtros */}
      <QueueFilters ... />

      {/* Leyenda */}
      <StatusLegend />

      {/* Cards */}
      {filteredQueue.map((item) => (
        <PatientCard key={item.id} item={item} ... />
      ))}

      {/* Dialog */}
      <AddPatientDialog isOpen={isDialogOpen} ... />
    </div>
  )
}

// components/turnos/StatusLegend.tsx - 31 líneas
export function StatusLegend() { /* ... */ }

// components/turnos/QueueStats.tsx - 40 líneas
export function QueueStats(props) { /* ... */ }

// ... etc
```

---

## 🎓 Patrones Aplicados

### 1. Single Responsibility Principle
Cada componente hace **una cosa bien**:
- `StatusLegend` → solo muestra leyenda
- `QueueStats` → solo muestra estadísticas
- `PatientCard` → renderiza una tarjeta
- `AddPatientDialog` → maneja diálogo
- `QueueFilters` → maneja filtros

### 2. Composición sobre Herencia
Los componentes se **componen** en `page.tsx`:
```jsx
<QueueFilters ... />
<StatusLegend />
<PatientCard ... />
```

### 3. Props Bien Definidos
Interface tipada con TypeScript:
```typescript
interface PatientCardProps {
  item: QueueItem
  isOptimistic: boolean
  callingId: string | null
  onUpdateStatus: (id: string, newStatus: QueueItem['status']) => void
}
```

### 4. Colocation
Componentes específicos de `/turnos` en `components/turnos/`

---

## ✨ Beneficios Logrados

| Beneficio | Antes | Después |
|-----------|-------|---------|
| **Legibilidad** | 😞 Difícil seguir 1250 líneas | 😊 Clara estructura en 662 líneas |
| **Testabilidad** | 😞 Imposible testear partes | 😊 Cada componente testeble |
| **Reutilización** | 😞 Todo inline en page.tsx | 😊 5 componentes reutilizables |
| **Mantenibilidad** | 😞 Cambios afectan todo | 😊 Componentes aislados |
| **Performance** | ✅ Optimista desde el inicio | ✅ Se mantiene igual |
| **Funcionalidad** | ✅ Completa | ✅ 100% preservada |

---

## 🔗 Referencias de Componentes

### Dependencies
```
components/turnos/
  ├── StatusLegend.tsx
  │   ├── @/components/ui/card
  │   ├── @/components/ui/badge
  │   └── @/lib/turnos/config
  │
  ├── QueueStats.tsx
  │   └── @/components/ui/badge
  │
  ├── PatientCard.tsx
  │   ├── @/components/ui/card
  │   ├── @/components/ui/button
  │   ├── @/components/ui/badge
  │   ├── lucide-react (icons)
  │   └── @/lib/turnos/types
  │
  ├── AddPatientDialog.tsx
  │   ├── @/components/ui/dialog
  │   ├── @/components/ui/input
  │   ├── @/components/ui/button
  │   ├── @/components/ui/select
  │   ├── @/components/ui/checkbox
  │   └── hooks (useState, useEffect)
  │
  └── QueueFilters.tsx
      ├── @/components/ui/card
      ├── @/components/ui/select
      ├── @/components/ui/button
      ├── @/lib/turnos/types
      └── lucide-react (icons)
```

---

## 📋 Checklist de Mantenimiento

Cuando MODIFIQUES componentes, asegúrate de:

- [ ] Mantener el TypeScript tipado
- [ ] Actualizar documentación JSDoc si cambias props
- [ ] No aumentar mucho el tamaño del componente
- [ ] Si alcanza 150+ líneas, considerar extraer más
- [ ] Validar que page.tsx siga teniendo ~300-700 líneas
- [ ] Ejecutar `npm run build` después de cambios
- [ ] Verificar que funcione en navegador

---

**Versión:** 1.0
**Última actualización:** 2025-10-22
**Responsable:** Sistema de Optimización Turnero-ZS
**Estado:** ✅ FASE 2 COMPLETA en `/turnos`
