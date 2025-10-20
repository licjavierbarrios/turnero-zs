import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions<T> {
  tableName: string
  filter: string
  onInsert?: (item: T) => void
  onUpdate?: (item: T) => void
  onDelete?: (id: string) => void
  transformFn: (raw: any) => T
  enabled?: boolean
  selectQuery?: string // Query personalizado para obtener datos completos con joins
}

/**
 * Hook para suscribirse a cambios de Supabase Realtime con actualización granular.
 *
 * @template T - Tipo del item
 *
 * @example
 * ```typescript
 * useSupabaseRealtime<QueueItem>({
 *   tableName: 'daily_queue',
 *   filter: `institution_id=eq.${institutionId}`,
 *   transformFn: transformQueueItem,
 *   selectQuery: `
 *     id, order_number, patient_name,
 *     service:service_id (name),
 *     professional:professional_id (first_name, last_name)
 *   `,
 *   onInsert: (item) => {
 *     setQueue(prev => [...prev.filter(p => !p.id.startsWith('temp-')), item])
 *   },
 *   onUpdate: (item) => {
 *     setQueue(prev => prev.map(p => p.id === item.id ? item : p))
 *   },
 *   onDelete: (id) => {
 *     setQueue(prev => prev.filter(p => p.id !== id))
 *   }
 * })
 * ```
 */
export function useSupabaseRealtime<T extends { id: string }>({
  tableName,
  filter,
  onInsert,
  onUpdate,
  onDelete,
  transformFn,
  enabled = true,
  selectQuery
}: UseRealtimeOptions<T>) {

  useEffect(() => {
    if (!enabled) return

    let channel: RealtimeChannel

    const setupChannel = async () => {
      channel = supabase
        .channel(`${tableName}_realtime_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
            filter
          },
          async (payload) => {
            console.log(`[Realtime ${tableName}]`, payload.eventType, payload)

            try {
              if (payload.eventType === 'INSERT' && onInsert) {
                // Si hay selectQuery, hacer una query completa con joins
                if (selectQuery) {
                  const { data, error } = await supabase
                    .from(tableName)
                    .select(selectQuery)
                    .eq('id', payload.new.id)
                    .single()

                  if (!error && data) {
                    onInsert(transformFn(data))
                  } else if (error) {
                    console.error(`[Realtime ${tableName}] Error fetching INSERT data:`, error)
                  }
                } else {
                  // Sin selectQuery, usar datos del payload directamente
                  onInsert(transformFn(payload.new))
                }
              }
              else if (payload.eventType === 'UPDATE' && onUpdate) {
                // Para UPDATE, también necesitamos hacer query si hay joins
                if (selectQuery) {
                  const { data, error } = await supabase
                    .from(tableName)
                    .select(selectQuery)
                    .eq('id', payload.new.id)
                    .single()

                  if (!error && data) {
                    onUpdate(transformFn(data))
                  } else if (error) {
                    console.error(`[Realtime ${tableName}] Error fetching UPDATE data:`, error)
                  }
                } else {
                  onUpdate(transformFn(payload.new))
                }
              }
              else if (payload.eventType === 'DELETE' && onDelete) {
                onDelete(payload.old.id)
              }
            } catch (error) {
              console.error(`[Realtime ${tableName}] Error processing event:`, error)
            }
          }
        )
        .subscribe((status) => {
          console.log(`[Realtime ${tableName}] Subscription status:`, status)
        })
    }

    setupChannel()

    // Cleanup
    return () => {
      if (channel) {
        console.log(`[Realtime ${tableName}] Unsubscribing...`)
        supabase.removeChannel(channel)
      }
    }
  }, [tableName, filter, onInsert, onUpdate, onDelete, transformFn, enabled, selectQuery])
}

/**
 * Hook simplificado para sincronizar un estado con Realtime.
 * Maneja automáticamente INSERT, UPDATE y DELETE.
 *
 * @example
 * ```typescript
 * const [queue, setQueue] = useState<QueueItem[]>([])
 *
 * useRealtimeSync<QueueItem>({
 *   tableName: 'daily_queue',
 *   filter: `institution_id=eq.${institutionId}`,
 *   transformFn: transformQueueItem,
 *   state: queue,
 *   setState: setQueue,
 *   selectQuery: `id, ..., service:service_id (name), ...`,
 *   // Opcional: lógica personalizada para reemplazar temporales
 *   onInsertMerge: (newItem, prevItems) => {
 *     const withoutTemp = prevItems.filter(p =>
 *       !(p.id.startsWith('temp-') && p.patient_dni === newItem.patient_dni)
 *     )
 *     return [...withoutTemp, newItem].sort((a, b) => a.order_number - b.order_number)
 *   }
 * })
 * ```
 */
export function useRealtimeSync<T extends { id: string }>({
  tableName,
  filter,
  transformFn,
  state,
  setState,
  enabled = true,
  selectQuery,
  onInsertMerge,
  onUpdateMerge,
  onDeleteMerge
}: UseRealtimeOptions<T> & {
  state: T[]
  setState: React.Dispatch<React.SetStateAction<T[]>>
  onInsertMerge?: (newItem: T, prevItems: T[]) => T[]
  onUpdateMerge?: (updatedItem: T, prevItems: T[]) => T[]
  onDeleteMerge?: (deletedId: string, prevItems: T[]) => T[]
}) {

  useSupabaseRealtime<T>({
    tableName,
    filter,
    transformFn,
    enabled,
    selectQuery,
    onInsert: (item) => {
      setState(prev => {
        if (onInsertMerge) {
          return onInsertMerge(item, prev)
        }

        // Comportamiento por defecto: agregar si no existe
        if (prev.some(p => p.id === item.id)) {
          return prev
        }
        return [...prev, item]
      })
    },
    onUpdate: (item) => {
      setState(prev => {
        if (onUpdateMerge) {
          return onUpdateMerge(item, prev)
        }

        // Comportamiento por defecto: actualizar por ID
        return prev.map(p => p.id === item.id ? item : p)
      })
    },
    onDelete: (id) => {
      setState(prev => {
        if (onDeleteMerge) {
          return onDeleteMerge(id, prev)
        }

        // Comportamiento por defecto: eliminar por ID
        return prev.filter(p => p.id !== id)
      })
    }
  })
}
