# 📋 Plan de Reutilización: Hooks y Componentes de /turnos

**Fecha:** 2025-10-20
**Estado:** 📝 Planificación
**Objetivo:** Reutilizar los patrones, hooks y componentes creados para `/turnos` en otros módulos del proyecto

---

## 🎯 Resumen Ejecutivo

Después de refactorizar exitosamente `/turnos` (reducción de 47%, de 1250 → 661 líneas), identificamos **8 componentes** en `app/(dashboard)/` que podrían beneficiarse de los mismos patrones:

### Impacto Potencial Total
- **5,287 líneas** de código en 8 componentes
- **~1,835 líneas** de código duplicado identificado
- **Reducción promedio esperada:** 37%
- **Meta post-refactor:** ~3,452 líneas

---

## 🔍 Componentes Candidatos (Análisis Detallado)

### PRIORIDAD ALTA - Impacto Máximo

#### 1. `/pacientes` ⭐⭐⭐⭐⭐
**Archivo:** `app/(dashboard)/pacientes/page.tsx`
**Líneas actuales:** 486
**Reducción esperada:** 45% → **~267 líneas**

**Patrones similares a /turnos:**
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Dialog para crear/editar con formularios
- ✅ AlertDialog para confirmación de eliminación
- ✅ Loading states globales durante fetch
- ✅ Estado local fragmentado (`formData`, `editingPatient`, `isDeleteDialogOpen`)

**Qué puede reutilizar:**
- `useOptimisticCRUD` - hook para operaciones CRUD optimistas
- Componentes reutilizables para dialogs de CRUD
- Patrón de transformación de datos (como `transformQueueItem`)
- Helpers de `lib/turnos/helpers.ts`:
  - `getInstitutionContext()`
  - `getNowISO()`
  - `isAdminOrAdministrativo()`

**Código duplicado identificado:**
```typescript
// DUPLICADO: Lectura de contexto (aparece en 6+ componentes)
const contextData = localStorage.getItem('institution_context')
if (!contextData) return
const context = JSON.parse(contextData)

// DUPLICADO: Manejo de formularios (aparece en 5+ componentes)
const [formData, setFormData] = useState({ name: '', ... })
const [editingItem, setEditingItem] = useState<Item | null>(null)
const [isDialogOpen, setIsDialogOpen] = useState(false)

// DUPLICADO: CRUD operations (aparece en 5+ componentes)
const handleSubmit = async () => {
  setLoading(true)
  if (editingItem) {
    await supabase.from('table').update(formData).eq('id', editingItem.id)
  } else {
    await supabase.from('table').insert(formData)
  }
  setLoading(false)
  await fetchData()
}
```

---

#### 2. `/servicios` ⭐⭐⭐⭐⭐
**Archivo:** `app/(dashboard)/servicios/page.tsx`
**Líneas actuales:** 603
**Reducción esperada:** 50% → **~301 líneas**

**Patrones similares a /turnos:**
- ✅ CRUD idéntico a `/pacientes`
- ✅ Filtrado y transformación de datos relacionales
- ✅ Toggle de estado (`is_active`)
- ✅ Agrupación de datos (por institución)

**Qué puede reutilizar:**
- `useOptimisticCRUD` + `useSupabaseRealtime` combinados
- `getInstitutionContext()` de helpers
- Patrón de toggle de estado
- Componentes de formularios reutilizables

**Transformación de datos duplicada:**
```typescript
// ACTUAL: Transformación manual en cada componente
const transformedServices = (data || []).map((item: any) => ({
  id: item.id,
  name: item.name,
  institution_name: item.institution?.name || 'Sin institución'
}))

// PROPUESTO: Función reutilizable
const transformedServices = transformRelationalData(data, {
  institution: { field: 'institution_name', path: 'institution.name' }
})
```

---

#### 3. `/consultorios` ⭐⭐⭐⭐⭐
**Archivo:** `app/(dashboard)/consultorios/page.tsx`
**Líneas actuales:** 543
**Reducción esperada:** 50% → **~272 líneas**

**Patrones similares a /turnos:**
- ✅ Estructura casi idéntica a `/servicios`
- ✅ Mismo flujo: localStorage → fetch → transform → display
- ✅ Agrupación por institución
- ✅ Toggle de `is_active`

**Qué puede reutilizar:**
- Mismo hook de CRUD genérico que servicios
- `useInstitutionContext()` (nuevo hook a crear)
- Componentes de tabla y dialog compartidos
- Transformaciones de datos relacionales

**Oportunidad:** `/servicios` y `/consultorios` son casi idénticos → crear template genérico

---

#### 4. `/usuarios` ⭐⭐⭐⭐
**Archivo:** `app/(dashboard)/usuarios/page.tsx`
**Líneas actuales:** 925
**Reducción esperada:** 40% → **~555 líneas**

**Patrones similares a /turnos:**
- ✅ CRUD DUAL (usuarios + membresías en un mismo componente)
- ✅ Estados complejos múltiples (`userFormData`, `membershipFormData`)
- ✅ Dos dialogs simultáneos
- ✅ Transformación de datos relacionales (user → institution)

**Qué puede reutilizar:**
- Crear `useMultipleCrudOperations()` - variante para manejar múltiples recursos
- `useFormState()` - para gestionar estados complejos
- `useTabs()` hook personalizado
- Componentes de dialog reutilizables

**Desafío:** Complejidad adicional por manejar dos entidades relacionadas (users + memberships)

---

### PRIORIDAD MEDIA - Beneficio Significativo

#### 5. `/horarios` ⭐⭐⭐
**Archivo:** `app/(dashboard)/horarios/page.tsx`
**Líneas actuales:** 821
**Reducción esperada:** 30% → **~575 líneas**

**Patrones similares a /turnos:**
- ✅ CRUD para slot templates
- ✅ Múltiples fetches relacionales (professionals, services, rooms, institutions)
- ✅ Transformación compleja de datos anidados

**Qué puede reutilizar:**
- Crear `useMultipleDataFetch()` - para coordinar múltiples queries
- `transformNestedData()` - versión mejorada para datos profundamente anidados
- Hook para cálculos memoizados

**Desafío:** Lógica específica de dominio (generación de slots), requiere abstracción cuidadosa

---

#### 6. `/agenda` ⭐⭐⭐
**Archivo:** `app/(dashboard)/agenda/page.tsx`
**Líneas actuales:** 894
**Reducción esperada:** 25% → **~670 líneas**

**Patrones similares a /turnos:**
- ✅ Múltiples fetches coordinados
- ✅ Uso de `useMemo` para optimizar
- ✅ Generación de vistas derivadas
- ✅ Filtrado y búsqueda avanzada

**Qué puede reutilizar:**
- `useFilteredSearch()` - hook para búsqueda con campos múltiples
- `useMemoizedTransform()` - mejorar performance
- Componentes de visualización de calendario

---

#### 7. `/reportes` ⭐⭐
**Archivo:** `app/(dashboard)/reportes/page.tsx`
**Líneas actuales:** 1015
**Reducción esperada:** 20% → **~812 líneas**

**Patrones similares a /turnos:**
- ✅ Múltiples transformaciones de datos (grouping, aggregation)
- ✅ Cálculos de métricas (averages, counts)
- ✅ Filtrado por período de tiempo

**Qué puede reutilizar:**
- `useMetricsAggregation()` hook para calcular métricas
- `useTemporalFiltering()` para rangos de fechas
- `useCSVExport()` hook para exportaciones

---

### PRIORIDAD BAJA

#### 8. `/profesional` ⭐
**Archivo:** `app/(dashboard)/profesional/page.tsx`
**Líneas actuales:** ~400
**Reducción esperada:** 15% → **~340 líneas**

**Patrones similares a /turnos:**
- ✅ Solo lectura + toggle de estado
- ✅ Fetch simple con relacionales

**Qué puede reutilizar:**
- `useReadOnlyData()` hook
- Patrón de toggle de estado compartido

---

## 🛠️ Hooks y Componentes a Crear

### A. **Hooks Genéricos**

#### 1. `hooks/useCrudOperation.ts` 🔥 CRÍTICO
**Prioridad:** ⭐⭐⭐⭐⭐
**Componentes que lo usarán:** 5+ (`/pacientes`, `/servicios`, `/consultorios`, `/usuarios`, `/horarios`)

```typescript
export function useCrudOperation<T extends { id: string }>({
  tableName,
  initialForm,
  transformResponse,
  onSuccess,
  onError
}: UseCrudOptions<T>) {
  return {
    // Estado
    items: T[],
    formData: Partial<T>,
    editingItem: T | null,
    isDialogOpen: boolean,
    isLoading: boolean,

    // Operaciones
    create: (data: Omit<T, 'id'>) => Promise<void>,
    update: (id: string, data: Partial<T>) => Promise<void>,
    delete: (id: string) => Promise<void>,

    // UI helpers
    openDialog: () => void,
    closeDialog: () => void,
    startEdit: (item: T) => void,
    resetForm: () => void
  }
}
```

**Reducción estimada:** 150-200 líneas por componente

---

#### 2. `hooks/useInstitutionContext.ts` 🔥 CRÍTICO
**Prioridad:** ⭐⭐⭐⭐⭐
**Componentes que lo usarán:** 7+ (casi todos los componentes)

```typescript
export function useInstitutionContext() {
  return {
    context: {
      institution_id: string
      user_role: string
      user_id: string
    } | null,
    isAdmin: boolean,
    isAdministrativo: boolean,
    hasRole: (role: string) => boolean,
    requireContext: () => throws if no context
  }
}
```

**Código eliminado por componente:**
```typescript
// ❌ ANTES: 6 líneas repetidas en cada componente
const contextData = localStorage.getItem('institution_context')
if (!contextData) {
  console.error('No hay contexto institucional')
  return
}
const context = JSON.parse(contextData)

// ✅ DESPUÉS: 1 línea
const { context, requireContext } = useInstitutionContext()
requireContext() // throws if null
```

**Reducción estimada:** 6 líneas × 7 componentes = **42 líneas**

---

#### 3. `hooks/useFormState.ts`
**Prioridad:** ⭐⭐⭐⭐
**Componentes que lo usarán:** 5+ (todos los componentes con formularios)

```typescript
export function useFormState<T>(initialState: T) {
  return {
    formData: T,
    setFormData: Dispatch<SetStateAction<T>>,
    updateField: (field: keyof T, value: any) => void,
    resetForm: () => void,
    isDirty: boolean,
    errors: Record<keyof T, string>
  }
}
```

**Reducción estimada:** 20-30 líneas por componente

---

#### 4. `hooks/useMultipleDataFetch.ts`
**Prioridad:** ⭐⭐⭐
**Componentes que lo usarán:** 3+ (`/horarios`, `/agenda`, `/reportes`)

```typescript
export function useMultipleDataFetch<T extends Record<string, any>>(
  queries: QueryConfig[]
) {
  return {
    data: T,
    isLoading: boolean,
    errors: Error[],
    refetch: () => Promise<void>,
    refetchOne: (key: string) => Promise<void>
  }
}
```

**Ejemplo de uso:**
```typescript
const { data, isLoading } = useMultipleDataFetch({
  professionals: {
    table: 'professional',
    select: 'id, first_name, last_name'
  },
  services: {
    table: 'service',
    select: 'id, name'
  },
  rooms: {
    table: 'room',
    select: 'id, name'
  }
})
```

**Reducción estimada:** 50-80 líneas por componente

---

#### 5. `hooks/useToggleState.ts`
**Prioridad:** ⭐⭐⭐
**Componentes que lo usarán:** 3+ (`/servicios`, `/consultorios`, `/profesional`)

```typescript
export function useToggleState<T extends { id: string }>(
  tableName: string,
  fieldName: string = 'is_active'
) {
  return {
    toggle: (id: string, currentValue: boolean) => Promise<void>,
    isToggling: Record<string, boolean>
  }
}
```

**Reducción estimada:** 15-25 líneas por componente

---

### B. **Componentes Genéricos CRUD**

#### 1. `components/crud/CrudDialog.tsx` 🔥 CRÍTICO
**Prioridad:** ⭐⭐⭐⭐⭐

```typescript
interface CrudDialogProps<T> {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  editingItem: T | null
  onSubmit: (data: T) => Promise<void>
  children: ReactNode // Render prop para campos del formulario
}

export function CrudDialog<T>({ ... }: CrudDialogProps<T>) {
  // Maneja boilerplate de Dialog + Form
}
```

**Uso:**
```typescript
<CrudDialog
  title="Crear Paciente"
  editingItem={editingPatient}
  onSubmit={handleSubmit}
>
  {(formData, setFormData) => (
    <>
      <Input value={formData.name} onChange={...} />
      <Input value={formData.dni} onChange={...} />
    </>
  )}
</CrudDialog>
```

---

#### 2. `components/crud/DeleteConfirmation.tsx`
**Prioridad:** ⭐⭐⭐⭐

```typescript
interface DeleteConfirmationProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  onConfirm: () => Promise<void>
}
```

---

#### 3. `components/crud/CrudTable.tsx`
**Prioridad:** ⭐⭐⭐

```typescript
interface CrudTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  actions?: {
    edit?: (item: T) => void
    delete?: (item: T) => void
    custom?: Array<{
      label: string
      icon: ReactNode
      onClick: (item: T) => void
    }>
  }
}
```

---

### C. **Funciones de Transformación Ampliadas**

#### 1. `lib/supabase/transforms.ts`
**Prioridad:** ⭐⭐⭐⭐

```typescript
// Generalizar transformaciones de datos relacionales
export function transformRelationalData<T>(
  data: any[],
  schema: TransformSchema
): T[]

// Esquema de ejemplo:
const patientSchema: TransformSchema = {
  institution: {
    field: 'institution_name',
    path: 'institution.name',
    default: 'Sin institución'
  },
  created_by: {
    field: 'creator_name',
    path: 'creator.full_name',
    transform: (user) => `${user.first_name} ${user.last_name}`
  }
}
```

---

#### 2. `lib/supabase/helpers.ts`
**Prioridad:** ⭐⭐⭐⭐

Mover helpers de `lib/turnos/helpers.ts` a ubicación más general:

```typescript
// Desde lib/turnos/helpers.ts → lib/supabase/helpers.ts
export { getInstitutionContext, getNowISO, getTodayISO }
```

---

## 📅 Plan de Implementación Propuesto

### Fase 1: Fundamentos (6-8 horas) 🔥 AHORA
**Objetivo:** Crear hooks y componentes base reutilizables

**Tareas:**
1. ✅ Crear `hooks/useCrudOperation.ts` (2 horas)
2. ✅ Crear `hooks/useInstitutionContext.ts` (30 min)
3. ✅ Crear `components/crud/CrudDialog.tsx` (1.5 horas)
4. ✅ Crear `components/crud/DeleteConfirmation.tsx` (30 min)
5. ✅ Mover `lib/turnos/helpers.ts` → `lib/supabase/helpers.ts` (15 min)
6. ✅ Crear `lib/supabase/transforms.ts` generalizado (1.5 horas)
7. ✅ Documentar APIs en `docs/` (1 hora)

**Validación:**
- Tests unitarios de hooks
- Compilación sin errores TypeScript
- Documentación completa con ejemplos

---

### Fase 2: Refactorización de Alta Prioridad (8-10 horas)
**Objetivo:** Refactorizar componentes con mayor impacto

**Orden sugerido:**
1. **`/pacientes`** (2 horas)
   - Aplicar `useCrudOperation`
   - Usar `CrudDialog` y `DeleteConfirmation`
   - Validar funcionalidad completa

2. **`/servicios`** (2 horas)
   - Mismo patrón que `/pacientes`
   - Agregar `useToggleState`

3. **`/consultorios`** (1.5 horas)
   - Casi idéntico a `/servicios`
   - Validar que template funciona para ambos

4. **`/usuarios`** (3 horas)
   - Más complejo (CRUD dual)
   - Crear `useMultipleCrudOperations` si es necesario
   - Manejar relaciones users ↔ memberships

**Validación por componente:**
- Funcionalidad preservada al 100%
- Reducción de líneas verificada
- Sin regresiones

---

### Fase 3: Refactorización de Media Prioridad (6-8 horas)
**Objetivo:** Abordar componentes con lógica más compleja

**Orden sugerido:**
1. **`/horarios`** (3 horas)
   - Crear `useMultipleDataFetch`
   - Mantener lógica de generación de slots

2. **`/agenda`** (2 horas)
   - Usar `useMultipleDataFetch`
   - Optimizar con `useMemoizedTransform`

3. **`/reportes`** (2 horas)
   - Crear `useMetricsAggregation`
   - Crear `useCSVExport`

---

### Fase 4: Consolidación y Mejoras (4-6 horas)
**Objetivo:** Documentación y optimizaciones finales

**Tareas:**
1. Auditoría completa de componentes refactorizados
2. Tests de integración
3. Documentación de patrones en `docs/PATRONES-REUTILIZABLES.md`
4. Performance benchmarks
5. Actualizar `CLAUDE.md` con nuevos patrones

---

## 📊 Métricas de Éxito

### Cuantitativas
| Métrica | Actual | Meta | Progreso |
|---------|--------|------|----------|
| **Líneas de código CRUD** | 5,287 | 3,452 | 0% |
| **Código duplicado** | ~1,835 | <200 | 0% |
| **Componentes refactorizados** | 1/8 | 8/8 | 12.5% |
| **Hooks creados** | 2 | 8 | 25% |
| **Componentes genéricos** | 5 | 10+ | 50% |

### Cualitativas
- [ ] Todos los componentes CRUD usan `useCrudOperation`
- [ ] Ningún componente lee directamente `localStorage.getItem('institution_context')`
- [ ] Todos los dialogs de CRUD usan componentes genéricos
- [ ] Documentación completa de patrones reutilizables
- [ ] Tests unitarios para todos los hooks

---

## 🚨 Riesgos y Mitigaciones

### Riesgo 1: Over-abstracción
**Descripción:** Crear abstracciones demasiado complejas que dificulten el entendimiento

**Mitigación:**
- Documentar cada hook con ejemplos de uso
- Priorizar simplicidad sobre generalización extrema
- Hacer code reviews antes de cada refactor

---

### Riesgo 2: Regresiones funcionales
**Descripción:** Romper funcionalidad existente durante refactorización

**Mitigación:**
- Refactorizar un componente a la vez
- Validar manualmente después de cada cambio
- Mantener git commits granulares para rollback fácil

---

### Riesgo 3: Tiempo de implementación
**Descripción:** Subestimar complejidad y extender tiempos

**Mitigación:**
- Implementar por fases
- Validar ROI después de Fase 1 antes de continuar
- Priorizar componentes de mayor impacto

---

## 📚 Referencias

### Documentos Relacionados
- [OPTIMIZACION-UX-COMPONENTES.md](./OPTIMIZACION-UX-COMPONENTES.md) - Guía de optimización UX
- [FASE-2-PASO-4-COMPLETADO.md](./FASE-2-PASO-4-COMPLETADO.md) - Refactorización de /turnos completada
- [FASE-2-PLAN-REFACTORIZACION.md](./FASE-2-PLAN-REFACTORIZACION.md) - Plan original de /turnos

### Archivos Clave Creados
- `hooks/useOptimisticCRUD.ts`
- `hooks/useSupabaseRealtime.ts`
- `lib/turnos/helpers.ts`
- `lib/turnos/transforms.ts`
- `lib/turnos/types.ts`
- `lib/turnos/config.ts`

---

## 🎯 Próximos Pasos

1. **Decidir si comenzar Fase 1** ✅
2. Crear los hooks genéricos base
3. Validar con refactorización de `/pacientes`
4. Continuar con `/servicios` y `/consultorios`

---

**Estado del documento:** 📝 Plan completo - Esperando aprobación para comenzar Fase 1

**Pregunta para el usuario:**
¿Quieres que comience con la **Fase 1** (crear los hooks y componentes genéricos base)?

Esto incluiría:
- `useCrudOperation` - elimina ~150 líneas por componente
- `useInstitutionContext` - elimina código duplicado en 7+ componentes
- `CrudDialog` y `DeleteConfirmation` - componentes base reutilizables
- Mover helpers a ubicación más general

Una vez validada la Fase 1, podríamos aplicarla a `/pacientes` como prueba de concepto.
