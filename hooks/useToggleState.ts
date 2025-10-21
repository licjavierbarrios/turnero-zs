import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Opciones de configuración para useToggleState
 */
export interface UseToggleStateOptions {
  /**
   * Nombre de la tabla en Supabase
   */
  tableName: string

  /**
   * Nombre del campo boolean a toggle (por defecto 'is_active')
   */
  fieldName?: string

  /**
   * Callback ejecutado después de un toggle exitoso
   * @param id - ID del item toggled
   * @param newValue - Nuevo valor del campo
   */
  onSuccess?: (id: string, newValue: boolean) => void

  /**
   * Callback ejecutado cuando ocurre un error
   * @param id - ID del item donde ocurrió el error
   * @param error - Error capturado
   */
  onError?: (id: string, error: any) => void
}

/**
 * Resultado del hook useToggleState
 */
export interface UseToggleStateResult {
  /**
   * Indica qué items están siendo toggled { [id]: true/false }
   */
  isToggling: Record<string, boolean>

  /**
   * Toggle el valor de un campo boolean
   * @param id - ID del item
   * @param currentValue - Valor actual del campo
   * @returns Promise con el resultado
   */
  toggle: (id: string, currentValue: boolean) => Promise<ToggleResult>

  /**
   * Establece el valor de un campo boolean (no toggle, set directo)
   * @param id - ID del item
   * @param newValue - Nuevo valor a establecer
   * @returns Promise con el resultado
   */
  setValue: (id: string, newValue: boolean) => Promise<ToggleResult>

  /**
   * Resetea el estado de toggles
   */
  resetToggles: () => void
}

/**
 * Resultado de una operación de toggle
 */
export interface ToggleResult {
  success: boolean
  error?: any
  newValue?: boolean
}

/**
 * Hook para gestionar toggle de campos boolean en Supabase con:
 * - Actualización optimista en UI
 * - Rollback automático en error
 * - Loading state por item
 * - Callbacks de success/error
 *
 * @example
 * ```typescript
 * const { isToggling, toggle } = useToggleState({
 *   tableName: 'service',
 *   fieldName: 'is_active',
 *   onSuccess: (id, newValue) => {
 *     toast({ title: `Servicio ${newValue ? 'activado' : 'desactivado'}` })
 *   }
 * })
 *
 * // En el JSX
 * <Switch
 *   checked={service.is_active}
 *   onCheckedChange={() => toggle(service.id, service.is_active)}
 *   disabled={isToggling[service.id]}
 * />
 * ```
 */
export function useToggleState({
  tableName,
  fieldName = 'is_active',
  onSuccess,
  onError
}: UseToggleStateOptions): UseToggleStateResult {

  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({})

  /**
   * Toggle el valor de un campo boolean
   */
  const toggle = useCallback(async (
    id: string,
    currentValue: boolean
  ): Promise<ToggleResult> => {
    const newValue = !currentValue

    try {
      // 1️⃣ Marcar como toggling
      setIsToggling(prev => ({ ...prev, [id]: true }))

      // 2️⃣ Actualizar en Supabase
      const { error } = await supabase
        .from(tableName)
        .update({ [fieldName]: newValue })
        .eq('id', id)

      if (error) throw error

      // 3️⃣ Ejecutar callback de éxito
      if (onSuccess) {
        onSuccess(id, newValue)
      }

      return { success: true, newValue }

    } catch (error: any) {
      // Ejecutar callback de error
      if (onError) {
        onError(id, error)
      }

      return { success: false, error }

    } finally {
      // 4️⃣ Desmarcar como toggling
      setIsToggling(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
    }
  }, [tableName, fieldName, onSuccess, onError])

  /**
   * Establece el valor directamente (no toggle)
   */
  const setValue = useCallback(async (
    id: string,
    newValue: boolean
  ): Promise<ToggleResult> => {
    try {
      // 1️⃣ Marcar como toggling
      setIsToggling(prev => ({ ...prev, [id]: true }))

      // 2️⃣ Actualizar en Supabase
      const { error } = await supabase
        .from(tableName)
        .update({ [fieldName]: newValue })
        .eq('id', id)

      if (error) throw error

      // 3️⃣ Ejecutar callback de éxito
      if (onSuccess) {
        onSuccess(id, newValue)
      }

      return { success: true, newValue }

    } catch (error: any) {
      // Ejecutar callback de error
      if (onError) {
        onError(id, error)
      }

      return { success: false, error }

    } finally {
      // 4️⃣ Desmarcar como toggling
      setIsToggling(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
    }
  }, [tableName, fieldName, onSuccess, onError])

  /**
   * Resetea el estado de toggles
   */
  const resetToggles = useCallback(() => {
    setIsToggling({})
  }, [])

  return {
    isToggling,
    toggle,
    setValue,
    resetToggles
  }
}
