import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UseOptimisticCRUDOptions<T> {
  tableName: string
  transformFn: (raw: any) => T
  generateTempId?: () => string
  onError?: (error: any, operation: string) => void
}

interface CRUDResult {
  success: boolean
  error?: any
  data?: any
}

/**
 * Hook para gestionar operaciones CRUD con actualización optimista.
 *
 * @template T - Tipo del item (debe tener un campo `id: string`)
 *
 * @example
 * ```typescript
 * const { items, setItems, createOptimistic, updateOptimistic } = useOptimisticCRUD<QueueItem>({
 *   tableName: 'daily_queue',
 *   transformFn: transformQueueItem,
 *   onError: (error, operation) => alert(`Error en ${operation}`)
 * })
 * ```
 */
export function useOptimisticCRUD<T extends { id: string }>({
  tableName,
  transformFn,
  generateTempId = () => `temp-${Date.now()}`,
  onError
}: UseOptimisticCRUDOptions<T>) {

  const [items, setItems] = useState<T[]>([])
  const [isSaving, setIsSaving] = useState(false)

  /**
   * Crea un item con actualización optimista.
   *
   * @param data - Datos a insertar (sin ID)
   * @param optimisticOverrides - Campos adicionales para el item optimista
   * @returns Resultado de la operación con success/error
   */
  const createOptimistic = useCallback(async (
    data: Omit<T, 'id'>,
    optimisticOverrides?: Partial<T>
  ): Promise<CRUDResult> => {
    const tempId = generateTempId()

    try {
      // 1️⃣ Crear item optimista
      const optimisticItem = {
        id: tempId,
        ...data,
        ...optimisticOverrides
      } as T

      // 2️⃣ Actualizar UI inmediatamente
      setItems(prev => [...prev, optimisticItem])

      // 3️⃣ Insertar en Supabase
      setIsSaving(true)
      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert(data as any)
        .select()
        .single()

      if (error) throw error

      // 4️⃣ Reemplazar temporal con real
      setItems(prev => prev.map(item =>
        item.id === tempId ? transformFn(inserted) : item
      ))

      return { success: true, data: inserted }

    } catch (error) {
      // Rollback: eliminar item temporal
      setItems(prev => prev.filter(item => item.id !== tempId))

      if (onError) {
        onError(error, 'create')
      }

      return { success: false, error }
    } finally {
      setIsSaving(false)
    }
  }, [tableName, transformFn, generateTempId, onError])

  /**
   * Crea múltiples items con actualización optimista.
   *
   * @param dataArray - Array de datos a insertar
   * @param optimisticOverrides - Función que retorna campos adicionales por índice
   * @returns Resultado de la operación
   */
  const createManyOptimistic = useCallback(async (
    dataArray: Omit<T, 'id'>[],
    optimisticOverrides?: (index: number) => Partial<T>
  ): Promise<CRUDResult> => {
    const tempIds: string[] = []

    try {
      // 1️⃣ Crear items optimistas
      const optimisticItems: T[] = dataArray.map((data, index) => {
        const tempId = `${generateTempId()}-${index}`
        tempIds.push(tempId)

        return {
          id: tempId,
          ...data,
          ...(optimisticOverrides ? optimisticOverrides(index) : {})
        } as T
      })

      // 2️⃣ Actualizar UI inmediatamente
      setItems(prev => [...prev, ...optimisticItems])

      // 3️⃣ Insertar en Supabase (uno por uno o en batch)
      setIsSaving(true)
      const insertedItems = []

      for (const data of dataArray) {
        const { data: inserted, error } = await supabase
          .from(tableName)
          .insert(data as any)
          .select()
          .single()

        if (error) throw error
        insertedItems.push(inserted)
      }

      // 4️⃣ Los items temporales serán reemplazados por Realtime
      // o podemos reemplazarlos manualmente aquí
      // (depende de la implementación de Realtime)

      return { success: true, data: insertedItems }

    } catch (error) {
      // Rollback: eliminar todos los items temporales
      setItems(prev => prev.filter(item => !tempIds.includes(item.id)))

      if (onError) {
        onError(error, 'createMany')
      }

      return { success: false, error }
    } finally {
      setIsSaving(false)
    }
  }, [tableName, generateTempId, onError])

  /**
   * Actualiza un item con actualización optimista.
   *
   * @param id - ID del item a actualizar
   * @param updates - Campos a actualizar
   * @returns Resultado de la operación
   */
  const updateOptimistic = useCallback(async (
    id: string,
    updates: Partial<T>
  ): Promise<CRUDResult> => {
    // Guardar estado previo para rollback
    const previousItems = items

    try {
      // 1️⃣ Actualizar UI inmediatamente
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ))

      // 2️⃣ Actualizar en Supabase
      const { error } = await supabase
        .from(tableName)
        .update(updates as any)
        .eq('id', id)

      if (error) throw error

      return { success: true }

    } catch (error) {
      // Rollback
      setItems(previousItems)

      if (onError) {
        onError(error, 'update')
      }

      return { success: false, error }
    }
  }, [tableName, items, onError])

  /**
   * Elimina un item con actualización optimista.
   *
   * @param id - ID del item a eliminar
   * @returns Resultado de la operación
   */
  const deleteOptimistic = useCallback(async (id: string): Promise<CRUDResult> => {
    // Guardar estado previo para rollback
    const previousItems = items

    try {
      // 1️⃣ Eliminar de UI inmediatamente
      setItems(prev => prev.filter(item => item.id !== id))

      // 2️⃣ Eliminar de Supabase
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true }

    } catch (error) {
      // Rollback
      setItems(previousItems)

      if (onError) {
        onError(error, 'delete')
      }

      return { success: false, error }
    }
  }, [tableName, items, onError])

  /**
   * Verifica si hay items temporales (pendientes de sincronización).
   */
  const hasOptimisticItems = useCallback(() => {
    return items.some(item => item.id.startsWith('temp-'))
  }, [items])

  /**
   * Filtra solo items reales (excluye temporales).
   */
  const getRealItems = useCallback(() => {
    return items.filter(item => !item.id.startsWith('temp-'))
  }, [items])

  /**
   * Filtra solo items temporales.
   */
  const getOptimisticItems = useCallback(() => {
    return items.filter(item => item.id.startsWith('temp-'))
  }, [items])

  return {
    items,
    setItems,
    isSaving,
    createOptimistic,
    createManyOptimistic,
    updateOptimistic,
    deleteOptimistic,
    hasOptimisticItems,
    getRealItems,
    getOptimisticItems
  }
}
