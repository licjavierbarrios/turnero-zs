# 📘 Guía de Optimización UX: Eliminación de Loading States Globales

> **Objetivo**: Transformar componentes con actualizaciones lentas y bloqueantes en interfaces modernas con respuesta instantánea usando actualización optimista + Supabase Realtime.

---

## 📋 Índice

1. [Cuándo usar esta guía](#cuándo-usar-esta-guía)
2. [Checklist de análisis previo](#checklist-de-análisis-previo)
3. [Patrón de actualización optimista](#patrón-de-actualización-optimista)
4. [Implementación paso a paso](#implementación-paso-a-paso)
5. [Patrones de código reutilizables](#patrones-de-código-reutilizables)
6. [Casos especiales y troubleshooting](#casos-especiales-y-troubleshooting)

---

## 🎯 Cuándo usar esta guía

### ✅ Usar esta optimización si:

- [ ] El componente tiene un **loading state global** que bloquea toda la UI
- [ ] Las operaciones CRUD (Create/Update/Delete) recargan datos completos con `fetchData()`
- [ ] El usuario experimenta **1+ segundos de espera** después de una acción
- [ ] Ya existe una **subscripción a Supabase Realtime** en el componente
- [ ] El componente gestiona **listas/tablas** de datos que cambian frecuentemente

### ❌ NO usar si:

- [ ] El componente solo hace operaciones de lectura (read-only)
- [ ] No hay subscripción Realtime y no se puede agregar
- [ ] Los datos son altamente críticos y requieren confirmación del servidor antes de mostrar (ej: pagos, transacciones bancarias)
- [ ] El componente es estático o se renderiza una sola vez

---

## 📝 Checklist de Análisis Previo

### 1. Identificar el Problema

Ejecuta este análisis en el componente que quieres optimizar:

```bash
# Buscar patrones problemáticos en el componente
grep -n "setLoading\|fetchData\|useState.*loading" app/(dashboard)/[componente]/page.tsx
```

**Preguntas clave:**

- [ ] ¿Hay un único estado `loading` que bloquea todo?
- [ ] ¿`fetchData()` se llama después de crear/actualizar/eliminar?
- [ ] ¿Cuántas queries ejecuta `fetchData()`? (revisar console.log o Network tab)
- [ ] ¿Existe un canal de Supabase Realtime? (buscar `supabase.channel`)

### 2. Analizar Operaciones CRUD

Completa esta tabla para cada operación:

| Operación | Handler | Llamada a `fetchData()` | Queries ejecutadas | Tiempo estimado |
|-----------|---------|------------------------|-------------------|-----------------|
| Create    | `handleAdd...` | ✅/❌ | N queries | Xs |
| Update    | `handleUpdate...` | ✅/❌ | N queries | Xs |
| Delete    | `handleDelete...` | ✅/❌ | N queries | Xs |

**Ejemplo del análisis de `/turnos`:**

| Operación | Handler | Llamada a `fetchData()` | Queries ejecutadas | Tiempo estimado |
|-----------|---------|------------------------|-------------------|-----------------|
| Create    | `handleAddPatient` | ✅ (línea 499) | 5 queries | 1-3s |
| Update    | `updateStatus` | ✅ (línea 535) | 5 queries | 1-3s |

### 3. Validar Estructura de Datos

```typescript
// Identificar la interfaz principal del listado
interface MainDataItem {
  id: string           // ¿Tiene ID único?
  // ... otros campos
}

// Estado del listado
const [items, setItems] = useState<MainDataItem[]>([])
```

**Requisitos:**
- [ ] Cada item tiene un `id` único (string o UUID)
- [ ] La estructura es consistente (todos los items tienen los mismos campos)
- [ ] Se puede generar un ID temporal predecible (ej: `temp-${Date.now()}`)

### 4. Verificar Supabase Realtime

```typescript
// ¿Existe esta estructura?
useEffect(() => {
  const channel = supabase
    .channel(`nombre_del_canal`)
    .on('postgres_changes', {
      event: '*', // o 'INSERT', 'UPDATE', 'DELETE'
      schema: 'public',
      table: 'nombre_tabla',
      filter: `institution_id=eq.${id}`
    }, (payload) => {
      // ⚠️ ¿Qué hace aquí? ¿fetchData()? ← PROBLEMA
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

**Checklist Realtime:**
- [ ] Existe una subscripción a Realtime
- [ ] Escucha la tabla correcta
- [ ] Filtra por institución/contexto correcto
- [ ] Actualmente llama a `fetchData()` → **OPORTUNIDAD DE OPTIMIZACIÓN**

---

## 🚀 Patrón de Actualización Optimista

### Concepto Base

```
┌──────────────────────────────────────────────────┐
│  ANTES: Bloqueo total (loading global)          │
└──────────────────────────────────────────────────┘
Usuario hace clic → Loading... → Supabase insert →
fetchData() → 5 queries → Actualizar UI (1-3s)


┌──────────────────────────────────────────────────┐
│  DESPUÉS: Actualización optimista (0ms)          │
└──────────────────────────────────────────────────┘
Usuario hace clic → Actualizar UI inmediatamente (0ms) →
Background: Supabase insert → Realtime sincroniza
```

### Principios Clave

1. **Actualización inmediata del estado local** (optimista)
2. **Operación en background** (sin bloquear UI)
3. **Sincronización vía Realtime** (automática)
4. **Rollback en caso de error** (revertir cambios optimistas)

---

## 🛠️ Implementación Paso a Paso

### FASE 1: Quick Win (2-3 horas) ⚡

#### Paso 1.1: Separar Estados de Loading

**ANTES:**
```typescript
const [loading, setLoading] = useState(true)

// Bloquea TODA la UI
if (loading) {
  return <Spinner />
}
```

**DESPUÉS:**
```typescript
// Estados granulares
const [initialLoading, setInitialLoading] = useState(true)  // Solo primera carga
const [isRefreshing, setIsRefreshing] = useState(false)     // Botón refresh
const [isSaving, setIsSaving] = useState(false)             // Operaciones CRUD

// Solo bloquea en carga inicial
if (initialLoading) {
  return <Spinner />
}

// Operaciones en background no bloquean UI
```

**Actualizar `fetchData()`:**
```typescript
const fetchData = async () => {
  try {
    // ⚠️ Solo setInitialLoading(true) si es la primera carga
    if (items.length === 0) {
      setInitialLoading(true)
    } else {
      setIsRefreshing(true) // Indicador sutil
    }

    // ... queries ...

  } finally {
    setInitialLoading(false)
    setIsRefreshing(false)
  }
}
```

---

#### Paso 1.2: Implementar Actualización Optimista en CREATE

**Template genérico:**

```typescript
const handleCreate = async (formData: FormData) => {
  try {
    // ─────────────────────────────────────────────────────
    // 1️⃣ GENERAR ID TEMPORAL
    // ─────────────────────────────────────────────────────
    const tempId = `temp-${Date.now()}`

    // ─────────────────────────────────────────────────────
    // 2️⃣ CREAR OBJETO OPTIMISTA
    // ─────────────────────────────────────────────────────
    const optimisticItem: MainDataItem = {
      id: tempId,
      ...formData,
      created_at: new Date().toISOString(),
      // Campos calculables localmente
      status: 'pendiente',
      // ... resto de campos
    }

    // ─────────────────────────────────────────────────────
    // 3️⃣ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
    // ─────────────────────────────────────────────────────
    setItems(prev => [...prev, optimisticItem])

    // ✅ Cerrar diálogo/formulario INMEDIATAMENTE
    setIsDialogOpen(false)

    // ─────────────────────────────────────────────────────
    // 4️⃣ INSERCIÓN EN BACKGROUND
    // ─────────────────────────────────────────────────────
    setIsSaving(true)

    const { data, error } = await supabase
      .from('tabla')
      .insert({
        ...formData,
        institution_id: context.institution_id,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error

    // ─────────────────────────────────────────────────────
    // 5️⃣ REEMPLAZAR TEMPORAL CON REAL (opcional)
    // ─────────────────────────────────────────────────────
    // Realtime se encargará de sincronizar, pero podemos
    // reemplazar inmediatamente para evitar parpadeo
    setItems(prev => prev.map(item =>
      item.id === tempId ? { ...item, id: data.id } : item
    ))

    // ✅ NO LLAMAR fetchData() ← CLAVE

  } catch (error) {
    console.error('Error al crear:', error)

    // ─────────────────────────────────────────────────────
    // 6️⃣ ROLLBACK: REVERTIR CAMBIO OPTIMISTA
    // ─────────────────────────────────────────────────────
    setItems(prev => prev.filter(item => !item.id.startsWith('temp-')))

    // Mostrar error al usuario
    alert('Error al guardar. Por favor intente nuevamente.')
  } finally {
    setIsSaving(false)
  }
}
```

**Caso especial: Múltiples inserciones (como en `/turnos`)**

```typescript
const handleCreateMultiple = async (formData: FormData, selections: string[]) => {
  try {
    // Generar múltiples items optimistas
    const optimisticItems = selections.map((selection, index) => ({
      id: `temp-${Date.now()}-${index}`,
      ...formData,
      selection_id: selection,
      order_number: getNextOrderNumber() + index, // Calcular localmente
      status: 'pendiente'
    }))

    // Actualizar UI inmediatamente
    setItems(prev => [...prev, ...optimisticItems])
    setIsDialogOpen(false)

    // Insertar en background (un INSERT por cada item)
    setIsSaving(true)

    for (const item of optimisticItems) {
      const { error } = await supabase
        .from('tabla')
        .insert({
          // Datos reales (sin ID temporal)
        })

      if (error) throw error
    }

    // Realtime sincronizará automáticamente

  } catch (error) {
    // Rollback completo
    setItems(prev => prev.filter(item => !item.id.startsWith('temp-')))
    alert('Error al guardar pacientes')
  } finally {
    setIsSaving(false)
  }
}
```

---

#### Paso 1.3: Optimizar Callback de Realtime

**ANTES:**
```typescript
.on('postgres_changes', { /* ... */ }, (payload) => {
  console.log('Change detected:', payload)
  fetchData() // ❌ Recarga completa innecesaria
})
```

**DESPUÉS:**
```typescript
.on('postgres_changes', { /* ... */ }, (payload) => {
  console.log('Change detected:', payload)

  // ✅ Actualización granular según el evento
  if (payload.eventType === 'INSERT') {
    setItems(prev => {
      // Eliminar temporales si existen
      const withoutTemp = prev.filter(p => !p.id.startsWith('temp-'))

      // Agregar el nuevo item real
      return [...withoutTemp, transformItem(payload.new)]
    })
  }
  else if (payload.eventType === 'UPDATE') {
    setItems(prev => prev.map(item =>
      item.id === payload.new.id
        ? transformItem(payload.new)
        : item
    ))
  }
  else if (payload.eventType === 'DELETE') {
    setItems(prev => prev.filter(item => item.id !== payload.old.id))
  }
})
```

**Helper: transformItem (adaptar según tu caso)**

```typescript
// Función para transformar datos de Supabase a tu interfaz
const transformItem = (rawData: any): MainDataItem => ({
  id: rawData.id,
  // Expandir relaciones
  service_name: rawData.service?.name || 'Sin servicio',
  professional_name: rawData.professional
    ? `${rawData.professional.first_name} ${rawData.professional.last_name}`
    : null,
  // ... resto de campos
})
```

---

#### Paso 1.4: Actualizar Operaciones UPDATE

```typescript
const handleUpdate = async (id: string, updates: Partial<MainDataItem>) => {
  try {
    // ─────────────────────────────────────────────────────
    // 1️⃣ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
    // ─────────────────────────────────────────────────────
    const previousItems = items // Guardar para rollback

    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, ...updates }
        : item
    ))

    // ─────────────────────────────────────────────────────
    // 2️⃣ ACTUALIZAR EN SUPABASE (BACKGROUND)
    // ─────────────────────────────────────────────────────
    const { error } = await supabase
      .from('tabla')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    // Realtime sincronizará cualquier diferencia

  } catch (error) {
    console.error('Error al actualizar:', error)

    // ─────────────────────────────────────────────────────
    // 3️⃣ ROLLBACK
    // ─────────────────────────────────────────────────────
    setItems(previousItems)
    alert('Error al actualizar')
  }
}
```

---

#### Paso 1.5: Feedback Visual para Items Temporales

```typescript
// En el render del listado
{items.map((item) => (
  <Card
    key={item.id}
    className={`
      ${item.status === 'atendido' ? 'opacity-50' : ''}
      ${item.id.startsWith('temp-') ? 'border-blue-400 border-2' : ''}
    `}
  >
    {/* Indicador visual de guardado */}
    {item.id.startsWith('temp-') && (
      <Badge variant="outline" className="animate-pulse">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Guardando...
      </Badge>
    )}

    {/* Resto del contenido */}
  </Card>
))}
```

---

### FASE 2: Refactorización (4-6 horas) 🏗️

#### ⚠️ IMPORTANTE: Verificar Hooks Existentes Primero

**ANTES de crear cualquier hook nuevo, SIEMPRE verifica si ya existe uno similar:**

```bash
# Buscar hooks existentes en el proyecto
ls hooks/
grep -r "useOptimistic" hooks/
grep -r "useRealtime" hooks/
grep -r "useCRUD" hooks/
```

**Checklist de verificación:**
- [ ] ¿Ya existe `hooks/useOptimisticCRUD.ts` en el proyecto?
- [ ] ¿Ya existe `hooks/useSupabaseRealtime.ts` o similar?
- [ ] ¿Hay otros hooks de gestión de datos que pueda reutilizar?
- [ ] ¿Los hooks existentes cubren mi caso de uso?

**Si encuentras un hook existente:**
1. **ÚSALO** en lugar de crear uno nuevo
2. Lee su documentación/JSDoc para entender cómo usarlo
3. Si necesitas funcionalidad adicional, EXTIENDE el hook existente (no dupliques)

**Si NO existe un hook adecuado:**
1. Procede a crear el nuevo hook siguiendo los pasos de abajo
2. Asegúrate de documentarlo bien con JSDoc
3. Agrega ejemplos de uso
4. Actualiza esta guía con la ubicación del nuevo hook

---

#### Paso 2.1: Extraer Hook Personalizado `useOptimisticCRUD`

```typescript
// hooks/useOptimisticCRUD.ts
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UseOptimisticCRUDOptions<T> {
  tableName: string
  transformFn: (raw: any) => T
  generateTempId?: () => string
}

export function useOptimisticCRUD<T extends { id: string }>({
  tableName,
  transformFn,
  generateTempId = () => `temp-${Date.now()}`
}: UseOptimisticCRUDOptions<T>) {

  const [items, setItems] = useState<T[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // CREATE con actualización optimista
  const createOptimistic = useCallback(async (
    data: Omit<T, 'id'>,
    optimisticData?: Partial<T>
  ) => {
    const tempId = generateTempId()

    try {
      // 1. Crear item optimista
      const optimisticItem = {
        id: tempId,
        ...data,
        ...optimisticData
      } as T

      // 2. Actualizar UI inmediatamente
      setItems(prev => [...prev, optimisticItem])

      // 3. Insertar en Supabase
      setIsSaving(true)
      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single()

      if (error) throw error

      // 4. Reemplazar temporal con real
      setItems(prev => prev.map(item =>
        item.id === tempId ? transformFn(inserted) : item
      ))

      return { success: true, data: inserted }

    } catch (error) {
      // Rollback
      setItems(prev => prev.filter(item => item.id !== tempId))
      return { success: false, error }
    } finally {
      setIsSaving(false)
    }
  }, [tableName, transformFn, generateTempId])

  // UPDATE con actualización optimista
  const updateOptimistic = useCallback(async (
    id: string,
    updates: Partial<T>
  ) => {
    try {
      // Guardar estado previo
      const previousItems = items

      // 1. Actualizar UI inmediatamente
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ))

      // 2. Actualizar en Supabase
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)

      if (error) throw error

      return { success: true }

    } catch (error) {
      // Rollback
      setItems(previousItems)
      return { success: false, error }
    }
  }, [tableName, items])

  // DELETE con actualización optimista
  const deleteOptimistic = useCallback(async (id: string) => {
    try {
      // Guardar estado previo
      const previousItems = items

      // 1. Eliminar de UI inmediatamente
      setItems(prev => prev.filter(item => item.id !== id))

      // 2. Eliminar de Supabase
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true }

    } catch (error) {
      // Rollback
      setItems(previousItems)
      return { success: false, error }
    }
  }, [tableName, items])

  return {
    items,
    setItems,
    isSaving,
    createOptimistic,
    updateOptimistic,
    deleteOptimistic
  }
}
```

**Uso en el componente:**

```typescript
// En tu page.tsx
import { useOptimisticCRUD } from '@/hooks/useOptimisticCRUD'

const {
  items: queue,
  setItems: setQueue,
  isSaving,
  createOptimistic,
  updateOptimistic
} = useOptimisticCRUD<QueueItem>({
  tableName: 'daily_queue',
  transformFn: transformQueueItem
})

// En el handler
const handleAddPatient = async (formData) => {
  const result = await createOptimistic(
    {
      patient_name: formData.name,
      patient_dni: formData.dni,
      institution_id: context.institution_id
    },
    { status: 'pendiente' } // Datos optimistas
  )

  if (result.success) {
    setIsDialogOpen(false)
  } else {
    alert('Error al guardar')
  }
}
```

---

#### Paso 2.2: Hook para Realtime Optimizado

```typescript
// hooks/useSupabaseRealtime.ts
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UseRealtimeOptions<T> {
  tableName: string
  filter: string
  onInsert?: (item: T) => void
  onUpdate?: (item: T) => void
  onDelete?: (id: string) => void
  transformFn: (raw: any) => T
}

export function useSupabaseRealtime<T extends { id: string }>({
  tableName,
  filter,
  onInsert,
  onUpdate,
  onDelete,
  transformFn
}: UseRealtimeOptions<T>) {

  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}_realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter
        },
        (payload) => {
          console.log(`[Realtime] ${payload.eventType}:`, payload)

          if (payload.eventType === 'INSERT' && onInsert) {
            onInsert(transformFn(payload.new))
          }
          else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(transformFn(payload.new))
          }
          else if (payload.eventType === 'DELETE' && onDelete) {
            onDelete(payload.old.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableName, filter, onInsert, onUpdate, onDelete, transformFn])
}
```

**Uso:**

```typescript
useSupabaseRealtime<QueueItem>({
  tableName: 'daily_queue',
  filter: `institution_id=eq.${context.institution_id}`,
  transformFn: transformQueueItem,
  onInsert: (item) => {
    setQueue(prev => {
      // Eliminar temporales
      const withoutTemp = prev.filter(p => !p.id.startsWith('temp-'))
      return [...withoutTemp, item]
    })
  },
  onUpdate: (item) => {
    setQueue(prev => prev.map(p => p.id === item.id ? item : p))
  },
  onDelete: (id) => {
    setQueue(prev => prev.filter(p => p.id !== id))
  }
})
```

---

### FASE 3: Arquitectura Avanzada (8-12 horas) 🏛️

#### Paso 3.1: Separar Componentes

```
components/[feature]/
├── [Feature]List.tsx        # Lista principal (reemplaza el gran return)
├── [Feature]Card.tsx        # Card individual de item
├── [Feature]Filters.tsx     # Filtros
├── [Feature]Dialog.tsx      # Diálogo de creación/edición
└── [Feature]Stats.tsx       # Estadísticas/badges
```

#### Paso 3.2: Context para Estado Compartido

```typescript
// contexts/[Feature]Context.tsx
import { createContext, useContext } from 'react'

interface FeatureContextValue {
  items: Item[]
  filters: Filters
  setFilters: (filters: Filters) => void
  createItem: (data: FormData) => Promise<void>
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

const FeatureContext = createContext<FeatureContextValue | null>(null)

export function useFeature() {
  const context = useContext(FeatureContext)
  if (!context) throw new Error('useFeature must be used within FeatureProvider')
  return context
}

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  // Toda la lógica de CRUD, filtros, Realtime

  return (
    <FeatureContext.Provider value={/* ... */}>
      {children}
    </FeatureContext.Provider>
  )
}
```

---

## 🧩 Patrones de Código Reutilizables

### Pattern 1: Calcular Campos Localmente

```typescript
// En vez de llamar a get_next_order_number en el servidor
const getNextOrderNumber = () => {
  const maxOrder = Math.max(...queue.map(q => q.order_number), 0)
  return maxOrder + 1
}

// Usar en actualización optimista
const optimisticItem = {
  order_number: getNextOrderNumber(),
  // ...
}
```

### Pattern 2: Retry Logic con Backoff

```typescript
const insertWithRetry = async (data: any, retries = 0): Promise<any> => {
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000

  try {
    const { data: inserted, error } = await supabase
      .from('tabla')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return inserted

  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise(resolve =>
        setTimeout(resolve, RETRY_DELAY * (retries + 1))
      )
      return insertWithRetry(data, retries + 1)
    }
    throw error
  }
}
```

### Pattern 3: Indicadores de Estado por Item

```typescript
// Agregar campo de metadata temporal
interface ItemWithMeta extends Item {
  _meta?: {
    isOptimistic: boolean
    isSaving: boolean
    error?: string
  }
}

// Marcar como optimista
const optimisticItem: ItemWithMeta = {
  id: tempId,
  ...data,
  _meta: { isOptimistic: true, isSaving: true }
}

// En el render
{item._meta?.isOptimistic && (
  <Badge>Guardando...</Badge>
)}
```

### Pattern 4: Manejo de Errores Unificado

```typescript
const showError = (message: string) => {
  // Usar tu sistema de notificaciones (toast, alert, etc.)
  console.error(message)
  // TODO: Integrar con sonner o react-hot-toast
}

const handleOperationError = (error: any, operation: string) => {
  console.error(`Error en ${operation}:`, error)

  if (error.code === 'PGRST116') {
    showError('No tienes permisos para realizar esta acción')
  } else if (error.message?.includes('duplicate')) {
    showError('Este registro ya existe')
  } else {
    showError(`Error al ${operation}. Por favor intenta nuevamente.`)
  }
}
```

---

## 🚨 Casos Especiales y Troubleshooting

### Caso 1: Race Conditions en Order Numbers

**Problema:** Dos usuarios agregan items al mismo tiempo, ambos calculan el mismo order_number

**Solución:**
```typescript
// Opción A: Usar timestamp como order_number temporal
const optimisticItem = {
  order_number: Date.now(), // Se reemplazará con el real vía Realtime
  // ...
}

// Opción B: Llamar a get_next_order_number pero NO bloquear UI
const handleAdd = async () => {
  // 1. Mostrar item con order_number temporal
  const tempItem = { id: tempId, order_number: 999, /* ... */ }
  setItems(prev => [...prev, tempItem])
  setIsDialogOpen(false) // ✅ Cerrar inmediatamente

  // 2. Obtener order_number real en background
  const { data: realOrderNumber } = await supabase.rpc('get_next_order_number', {/*...*/})

  // 3. Insertar con el número real
  await supabase.insert({ order_number: realOrderNumber, /* ... */ })

  // 4. Realtime sincronizará el número correcto
}
```

### Caso 2: Relaciones Anidadas (Joins)

**Problema:** Los items tienen relaciones (ej: `service.name`, `professional.first_name`)

**Solución:**
```typescript
// En actualización optimista, incluir datos de relaciones
const optimisticItem = {
  id: tempId,
  service_id: formData.service_id,
  // Buscar el servicio en la lista local
  service_name: services.find(s => s.id === formData.service_id)?.name || 'Cargando...',
  professional_name: null, // Será actualizado por Realtime
  // ...
}

// El callback de Realtime recibirá el objeto completo con joins
.on('postgres_changes', { /* ... */ }, (payload) => {
  // payload.new contendrá service.name, professional.first_name, etc.
  const fullItem = transformItem(payload.new)
  setItems(prev => prev.map(item =>
    item.id === tempId ? fullItem : item
  ))
})
```

### Caso 3: Validaciones del Servidor

**Problema:** El servidor puede rechazar el insert (ej: validación de DNI duplicado)

**Solución:**
```typescript
const handleAdd = async (formData) => {
  // 1. Validaciones locales ANTES de mostrar optimista
  if (!validateDNI(formData.dni)) {
    showError('DNI inválido')
    return
  }

  // 2. Mostrar optimista solo si pasa validaciones locales
  const optimisticItem = { id: tempId, ...formData }
  setItems(prev => [...prev, optimisticItem])
  setIsDialogOpen(false)

  // 3. Insert en servidor
  const { error } = await supabase.insert(formData)

  // 4. Si falla validación del servidor, rollback + mostrar error
  if (error) {
    setItems(prev => prev.filter(item => item.id !== tempId))

    if (error.message.includes('duplicate')) {
      showError('Ya existe un paciente con ese DNI en la cola')
    } else {
      showError('Error al guardar paciente')
    }
  }
}
```

### Caso 4: Ordenamiento de la Lista

**Problema:** Al agregar items optimistas, el orden puede ser incorrecto

**Solución:**
```typescript
// Definir función de ordenamiento
const sortItems = (items: Item[]) => {
  return [...items].sort((a, b) => {
    // Temporales siempre al final (o al principio según caso)
    if (a.id.startsWith('temp-') && !b.id.startsWith('temp-')) return 1
    if (!a.id.startsWith('temp-') && b.id.startsWith('temp-')) return -1

    // Ordenar por order_number
    return a.order_number - b.order_number
  })
}

// Aplicar al actualizar estado
setItems(prev => sortItems([...prev, optimisticItem]))

// También en el callback de Realtime
.on('postgres_changes', { /* ... */ }, (payload) => {
  setItems(prev => sortItems([
    ...prev.filter(p => !p.id.startsWith('temp-')),
    transformItem(payload.new)
  ]))
})
```

### Caso 5: Múltiples Usuarios Simultáneos

**Problema:** Otro usuario crea/actualiza/elimina items mientras tengo items optimistas

**Solución:** Ya está cubierto por Realtime + IDs únicos
```typescript
// Realtime sincronizará automáticamente
// Los IDs temporales nunca colisionarán con IDs reales (UUID)
// Al recibir INSERT vía Realtime, solo agregar si no existe

.on('postgres_changes', { /* ... */ }, (payload) => {
  if (payload.eventType === 'INSERT') {
    setItems(prev => {
      // Verificar si ya existe (evita duplicados)
      if (prev.some(p => p.id === payload.new.id)) {
        return prev
      }

      // Eliminar temporales y agregar real
      const withoutTemp = prev.filter(p => !p.id.startsWith('temp-'))
      return sortItems([...withoutTemp, transformItem(payload.new)])
    })
  }
})
```

---

## ✅ Checklist Final de Implementación

### Pre-implementación
- [ ] Analicé el componente con el checklist de análisis previo
- [ ] Identifiqué todos los `fetchData()` innecesarios
- [ ] Verifiqué que existe Supabase Realtime
- [ ] Documenté el tiempo actual de respuesta (baseline)

### Durante Fase 1
- [ ] Separé `loading` en `initialLoading`, `isRefreshing`, `isSaving`
- [ ] Implementé actualización optimista en CREATE
- [ ] Implementé actualización optimista en UPDATE (si aplica)
- [ ] Optimicé callback de Realtime (eliminar `fetchData()`)
- [ ] Agregué feedback visual para items temporales
- [ ] Implementé rollback en caso de error
- [ ] Probé con errores de red (desconectar WiFi)

### Testing
- [ ] La UI se actualiza instantáneamente (0ms percibidos)
- [ ] Los items optimistas se sincronizan correctamente vía Realtime
- [ ] El rollback funciona correctamente en caso de error
- [ ] Múltiples operaciones simultáneas funcionan correctamente
- [ ] No hay duplicados ni inconsistencias
- [ ] Probé con otro usuario en otra sesión (sincronización multi-usuario)

### Post-implementación
- [ ] Documenté el tiempo de respuesta nuevo (comparar con baseline)
- [ ] Agregué comentarios en código explicando la lógica optimista
- [ ] Actualicé esta guía con aprendizajes específicos del componente

---

## 📊 Métricas de Éxito

### KPIs Técnicos
- **Tiempo de respuesta percibido**: Antes → Después
  - Objetivo: < 100ms (percibido como instantáneo)
- **Número de queries en operaciones CRUD**: Antes → Después
  - Objetivo: Reducir de N queries a 1 query
- **Bloqueos de UI**: Antes → Después
  - Objetivo: 0 bloqueos en operaciones comunes

### KPIs de UX
- **Sensación de velocidad**: Lento → Rápido
- **Frustración del usuario**: Alta → Baja
- **Modernidad de la app**: Antigua → Moderna

---

## 📚 Referencias y Recursos

### Lecturas Recomendadas
- [Optimistic UI Patterns](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [React Server Components & Optimistic Updates](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#optimistic-updates)

### Herramientas de Debugging
```bash
# Ver subscripciones de Realtime activas
# En DevTools Console:
window.supabase.getChannels()

# Ver queries de Supabase
# En Supabase Dashboard > Logs > Postgres Logs
```

### Ejemplos en el Proyecto
- `/turnos` - Implementación completa (próximamente)
- Agregar aquí otros componentes optimizados

---

## 🤝 Contribuciones

Si optimizas un nuevo componente:

1. Actualiza esta guía con aprendizajes específicos
2. Agrega el componente a "Ejemplos en el Proyecto"
3. Documenta cualquier caso especial encontrado
4. Comparte métricas before/after

---

**Última actualización:** 2025-10-20
**Autor:** Sistema de Optimización UX Turnero ZS
**Versión:** 1.0.0
