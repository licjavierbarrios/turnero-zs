# 📘 Fase 2: Plan de Refactorización - Componente `/turnos`

**Estado:** ✅ Hooks creados, pendiente extracción de componentes
**Fecha:** 2025-10-20

---

## ✅ Completado

### 1. Hooks Reutilizables Creados

#### `hooks/useOptimisticCRUD.ts` ✅
Hook genérico para operaciones CRUD con actualización optimista.

**API:**
```typescript
const {
  items,              // Estado actual de items
  setItems,           // Setter directo
  isSaving,           // Indicador de guardado
  createOptimistic,   // Crear con actualización optimista
  createManyOptimistic, // Crear múltiples items
  updateOptimistic,   // Actualizar con optimización
  deleteOptimistic,   // Eliminar con optimización
  hasOptimisticItems, // Verifica si hay items temporales
  getRealItems,       // Filtra solo items reales
  getOptimisticItems  // Filtra solo items temporales
} = useOptimisticCRUD<QueueItem>({
  tableName: 'daily_queue',
  transformFn: transformQueueItem,
  onError: (error, operation) => alert(`Error en ${operation}`)
})
```

**Características:**
- ✅ Genérico (funciona con cualquier tipo)
- ✅ Rollback automático en errores
- ✅ Soporte para crear múltiples items
- ✅ Helpers para filtrar temporales/reales
- ✅ Callback de error personalizable

#### `hooks/useSupabaseRealtime.ts` ✅
Hook para subscripción a Supabase Realtime con actualización granular.

**API Básica:**
```typescript
useSupabaseRealtime<QueueItem>({
  tableName: 'daily_queue',
  filter: `institution_id=eq.${institutionId}`,
  transformFn: transformQueueItem,
  selectQuery: `
    id, order_number, patient_name,
    service:service_id (name),
    professional:professional_id (first_name, last_name)
  `,
  onInsert: (item) => {
    setQueue(prev => [...prev.filter(p => !p.id.startsWith('temp-')), item])
  },
  onUpdate: (item) => {
    setQueue(prev => prev.map(p => p.id === item.id ? item : p))
  },
  onDelete: (id) => {
    setQueue(prev => prev.filter(p => p.id !== id))
  }
})
```

**API Simplificada:**
```typescript
// Maneja automáticamente INSERT/UPDATE/DELETE
useRealtimeSync<QueueItem>({
  tableName: 'daily_queue',
  filter: `institution_id=eq.${institutionId}`,
  transformFn: transformQueueItem,
  state: queue,
  setState: setQueue,
  selectQuery: `...`,
  // Lógica personalizada para merge
  onInsertMerge: (newItem, prevItems) => {
    const withoutTemp = prevItems.filter(p =>
      !(p.id.startsWith('temp-') && p.patient_dni === newItem.patient_dni)
    )
    return [...withoutTemp, newItem].sort((a, b) => a.order_number - b.order_number)
  }
})
```

---

## 🎯 Pendiente: Extracción de Componentes

### Componentes a Crear

#### 1. `components/turnos/AddPatientDialog.tsx`
**Líneas:** 807-933 (127 líneas)

**Props:**
```typescript
interface AddPatientDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  attentionOptions: AttentionOption[]
  onSubmit: (data: {
    patientName: string
    patientDni: string
    selectedOptions: string[]
  }) => Promise<void>
}
```

**Ventajas:**
- ✅ Reutilizable en otros contextos (ej: agenda)
- ✅ Lógica de formulario encapsulada
- ✅ Más fácil de testear

---

#### 2. `components/turnos/PatientCard.tsx`
**Líneas:** 1138-1244 (107 líneas)

**Props:**
```typescript
interface PatientCardProps {
  item: QueueItem
  isOptimistic: boolean
  callingId: string | null
  onUpdateStatus: (id: string, newStatus: QueueItem['status']) => void
}
```

**Ventajas:**
- ✅ Componente reutilizable
- ✅ Lógica de estados encapsulada
- ✅ Más fácil de mantener

---

#### 3. `components/turnos/QueueFilters.tsx`
**Líneas:** 937-1094 (158 líneas)

**Props:**
```typescript
interface QueueFiltersProps {
  // Filtros actuales
  selectedServiceFilter: string
  selectedProfessionalFilter: string
  selectedRoomFilter: string
  selectedStatusFilter: string

  // Setters
  onServiceFilterChange: (value: string) => void
  onProfessionalFilterChange: (value: string) => void
  onRoomFilterChange: (value: string) => void
  onStatusFilterChange: (value: string) => void

  // Datos para opciones
  services: Service[]
  professionals: Professional[]
  rooms: Room[]
  userServices: Service[]
  userRole: string

  // Resumen de filtros activos
  onClearFilters: () => void
}
```

**Ventajas:**
- ✅ Lógica compleja de filtros aislada
- ✅ Reutilizable en otros listados
- ✅ Manejo de roles centralizado

---

#### 4. `components/turnos/StatusLegend.tsx`
**Líneas:** 1096-1111 (16 líneas)

**Props:**
```typescript
interface StatusLegendProps {
  statusConfig: typeof statusConfig
}
```

**Ventajas:**
- ✅ Componente simple y reutilizable
- ✅ Documentación visual de estados

---

#### 5. `components/turnos/QueueStats.tsx`
**Líneas:** 788-800 (13 líneas)

**Props:**
```typescript
interface QueueStatsProps {
  totalCount: number
  filteredCount: number
}
```

**Ventajas:**
- ✅ Estadísticas reutilizables
- ✅ Fácil de extender (agregar más métricas)

---

## 📁 Estructura de Archivos Propuesta

```
app/(dashboard)/turnos/
├── page.tsx                          # 🔥 SIMPLIFICADO a ~300 líneas
└── components/                       # Componentes específicos de turnos
    ├── AddPatientDialog.tsx         # Diálogo de carga
    ├── PatientCard.tsx              # Card individual de paciente
    ├── QueueFilters.tsx             # Filtros avanzados
    ├── StatusLegend.tsx             # Leyenda de colores
    └── QueueStats.tsx               # Estadísticas/badges

hooks/
├── useOptimisticCRUD.ts             # ✅ CREADO
├── useSupabaseRealtime.ts           # ✅ CREADO
└── useQueueData.ts                   # 🎯 PROPUESTO (Fase 2B)

lib/
└── turnos/
    ├── types.ts                      # Interfaces compartidas
    ├── transforms.ts                 # transformQueueItem, etc.
    └── config.ts                     # statusConfig, constantes
```

---

## 🎯 Plan de Implementación Recomendado

### Opción A: Implementación Completa (6-8 horas)
1. Extraer todos los componentes
2. Crear `useQueueData` hook
3. Refactorizar `page.tsx`
4. Mover types/transforms/config a archivos separados
5. Testing completo

**Ventajas:**
- ✅ Arquitectura profesional y escalable
- ✅ Código altamente mantenible
- ✅ Fácil de testear

**Desventajas:**
- ⏱️ Requiere más tiempo
- 🧪 Más superficie de testing

---

### Opción B: Implementación Progresiva (2-3 horas cada paso)

**Paso 1: Extraer componentes simples**
1. `StatusLegend.tsx` (10 min)
2. `QueueStats.tsx` (10 min)
3. Verificar que funciona

**Paso 2: Extraer componentes complejos**
1. `PatientCard.tsx` (30 min)
2. `AddPatientDialog.tsx` (45 min)
3. Verificar que funciona

**Paso 3: Extraer filtros**
1. `QueueFilters.tsx` (60 min)
2. Verificar que funciona

**Paso 4: Refactorizar page.tsx**
1. Usar nuevos componentes
2. Aplicar hooks `useOptimisticCRUD` y `useRealtimeSync`
3. Reducir de 1250 líneas a ~300 líneas

**Ventajas:**
- ✅ Progreso incremental
- ✅ Fácil de validar en cada paso
- ✅ Menos riesgo de romper funcionalidad

---

## 🚀 Siguiente Paso Sugerido

Dado que la Fase 1 está funcionando perfectamente, **recomiendo Opción B - Paso 1**:

1. Extraer `StatusLegend` y `QueueStats` (20 minutos)
2. Probar que todo funciona
3. Commit de progreso incremental
4. Continuar con siguiente paso solo si el usuario lo solicita

**¿Quieres que extraiga los componentes simples primero (StatusLegend + QueueStats)?**

---

## 📊 Beneficios Esperados Post-Fase 2

| Métrica | Actual | Post-Fase 2 | Mejora |
|---------|--------|-------------|--------|
| **Líneas en page.tsx** | 1250 | ~300 | 📉 **76% reducción** |
| **Componentes reutilizables** | 0 | 5 | ✅ **5 nuevos** |
| **Hooks personalizados** | 0 | 2-3 | ✅ **2-3 nuevos** |
| **Testabilidad** | Baja | Alta | 🎯 **Significativa** |
| **Mantenibilidad** | Media | Alta | ✅ **Mejorada** |
| **Duplicación de código** | Alta | Baja | ✅ **Reducida** |

---

**Estado Actual:** ✅ Fase 1 funcionando, hooks creados, listo para extracción de componentes

**Recomendación:** Implementar progresivamente (Opción B) para minimizar riesgo
