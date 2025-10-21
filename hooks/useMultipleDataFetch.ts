import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Configuración de una query individual
 */
export interface QueryConfig<T = any> {
  /**
   * Nombre de la tabla en Supabase
   */
  table: string

  /**
   * Campos a seleccionar (ej: 'id, name, institution(name)')
   */
  select?: string

  /**
   * Filtros a aplicar { campo: valor }
   */
  filters?: Record<string, any>

  /**
   * Ordenamiento (ej: { column: 'created_at', ascending: false })
   */
  orderBy?: {
    column: string
    ascending?: boolean
  }

  /**
   * Límite de resultados
   */
  limit?: number

  /**
   * Función para transformar cada item de la respuesta
   */
  transform?: (item: any) => T
}

/**
 * Configuración completa para useMultipleDataFetch
 */
export interface UseMultipleDataFetchOptions<T extends Record<string, any>> {
  /**
   * Objeto con las queries a ejecutar { key: QueryConfig }
   *
   * @example
   * {
   *   professionals: { table: 'professional', select: 'id, first_name, last_name' },
   *   services: { table: 'service', select: 'id, name, institution(name)' },
   *   rooms: { table: 'room', select: 'id, name' }
   * }
   */
  queries: {
    [K in keyof T]: QueryConfig<T[K] extends Array<infer U> ? U : T[K]>
  }

  /**
   * Si es true, ejecuta las queries automáticamente al montar
   * @default true
   */
  autoFetch?: boolean

  /**
   * Callback ejecutado cuando todas las queries se completan exitosamente
   */
  onSuccess?: (data: T) => void

  /**
   * Callback ejecutado cuando al menos una query falla
   */
  onError?: (errors: Partial<Record<keyof T, any>>) => void
}

/**
 * Resultado del hook useMultipleDataFetch
 */
export interface UseMultipleDataFetchResult<T extends Record<string, any>> {
  /**
   * Objeto con los datos de cada query { key: data[] }
   */
  data: T

  /**
   * Indica si alguna query está cargando
   */
  isLoading: boolean

  /**
   * Indica qué queries específicas están cargando { key: boolean }
   */
  loadingStates: Partial<Record<keyof T, boolean>>

  /**
   * Errores individuales por query { key: error }
   */
  errors: Partial<Record<keyof T, any>>

  /**
   * Indica si hay algún error
   */
  hasErrors: boolean

  /**
   * Refresca todas las queries
   */
  refetchAll: () => Promise<void>

  /**
   * Refresca una query específica
   * @param key - Clave de la query a refrescar
   */
  refetchOne: <K extends keyof T>(key: K) => Promise<void>

  /**
   * Establece manualmente los datos de una query
   * @param key - Clave de la query
   * @param data - Nuevos datos
   */
  setData: <K extends keyof T>(key: K, data: T[K]) => void
}

/**
 * Hook para coordinar múltiples queries de Supabase con:
 * - Loading state global e individual
 * - Manejo de errores individual
 * - Refetch selectivo
 * - Auto-fetch opcional
 *
 * @template T - Tipo del objeto de datos { key: Array<ItemType> }
 *
 * @example
 * ```typescript
 * const { data, isLoading, errors, refetchAll, refetchOne } = useMultipleDataFetch({
 *   queries: {
 *     professionals: {
 *       table: 'professional',
 *       select: 'id, first_name, last_name, is_active',
 *       filters: { is_active: true },
 *       orderBy: { column: 'last_name', ascending: true }
 *     },
 *     services: {
 *       table: 'service',
 *       select: 'id, name, duration_minutes, institution(name)',
 *       filters: { institution_id: contextInstitutionId }
 *     },
 *     rooms: {
 *       table: 'room',
 *       select: 'id, name, floor',
 *       transform: (item) => ({ ...item, display_name: `${item.name} - Piso ${item.floor}` })
 *     }
 *   },
 *   onSuccess: (data) => {
 *     console.log('Datos cargados:', data.professionals, data.services, data.rooms)
 *   }
 * })
 *
 * // Uso en el componente
 * if (isLoading) return <Skeleton />
 * if (errors.professionals) return <Error />
 *
 * return (
 *   <>
 *     {data.professionals.map(...)}
 *     {data.services.map(...)}
 *   </>
 * )
 * ```
 */
export function useMultipleDataFetch<T extends Record<string, any[]>>({
  queries,
  autoFetch = true,
  onSuccess,
  onError
}: UseMultipleDataFetchOptions<T>): UseMultipleDataFetchResult<T> {

  // Inicializar data con arrays vacíos
  const [data, setData] = useState<T>(() => {
    const initialData = {} as T
    Object.keys(queries).forEach(key => {
      initialData[key as keyof T] = [] as any
    })
    return initialData
  })

  const [loadingStates, setLoadingStates] = useState<Partial<Record<keyof T, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<keyof T, any>>>({})

  // Loading global: true si alguna query está cargando
  const isLoading = Object.values(loadingStates).some(Boolean)

  // hasErrors: true si hay algún error
  const hasErrors = Object.keys(errors).length > 0

  /**
   * Ejecuta una query específica
   */
  const executeQuery = useCallback(async <K extends keyof T>(key: K): Promise<void> => {
    const queryConfig = queries[key]

    try {
      // Marcar como loading
      setLoadingStates(prev => ({ ...prev, [key]: true }))

      // Limpiar error previo
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })

      // Construir query
      let query = supabase
        .from(queryConfig.table)
        .select(queryConfig.select || '*')

      // Aplicar filtros
      if (queryConfig.filters) {
        Object.entries(queryConfig.filters).forEach(([field, value]) => {
          query = query.eq(field, value)
        })
      }

      // Aplicar ordenamiento
      if (queryConfig.orderBy) {
        query = query.order(queryConfig.orderBy.column, {
          ascending: queryConfig.orderBy.ascending ?? true
        })
      }

      // Aplicar límite
      if (queryConfig.limit) {
        query = query.limit(queryConfig.limit)
      }

      // Ejecutar query
      const { data: fetchedData, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Transformar datos si es necesario
      const transformedData = queryConfig.transform
        ? (fetchedData || []).map(queryConfig.transform)
        : (fetchedData || [])

      // Actualizar data
      setData(prev => ({
        ...prev,
        [key]: transformedData
      }))

    } catch (error: any) {
      console.error(`Error fetching ${String(key)}:`, error)

      // Guardar error
      setErrors(prev => ({
        ...prev,
        [key]: error
      }))

    } finally {
      // Desmarcar loading
      setLoadingStates(prev => {
        const newState = { ...prev }
        delete newState[key]
        return newState
      })
    }
  }, [queries])

  /**
   * Refresca una query específica
   */
  const refetchOne = useCallback(async <K extends keyof T>(key: K): Promise<void> => {
    await executeQuery(key)
  }, [executeQuery])

  /**
   * Refresca todas las queries
   */
  const refetchAll = useCallback(async (): Promise<void> => {
    const keys = Object.keys(queries) as (keyof T)[]

    // Ejecutar todas las queries en paralelo
    await Promise.all(
      keys.map(key => executeQuery(key))
    )

    // Verificar si hubo errores
    const currentErrors = errors
    const currentData = data

    if (Object.keys(currentErrors).length === 0) {
      // Todas las queries exitosas
      if (onSuccess) {
        onSuccess(currentData)
      }
    } else {
      // Al menos una query falló
      if (onError) {
        onError(currentErrors)
      }
    }
  }, [queries, executeQuery, errors, data, onSuccess, onError])

  /**
   * Establece manualmente los datos de una query
   */
  const setDataForKey = useCallback(<K extends keyof T>(key: K, newData: T[K]): void => {
    setData(prev => ({
      ...prev,
      [key]: newData
    }))
  }, [])

  // Auto-fetch al montar
  useEffect(() => {
    if (autoFetch) {
      refetchAll()
    }
  }, []) // Solo al montar, no incluir refetchAll para evitar loops

  return {
    data,
    isLoading,
    loadingStates,
    errors,
    hasErrors,
    refetchAll,
    refetchOne,
    setData: setDataForKey
  }
}
