import { useState, useCallback, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Configuración de un nivel en la cascada
 */
export interface CascadeLevel<T = any> {
  /**
   * Nombre de la tabla en Supabase
   */
  table: string

  /**
   * Campos a seleccionar
   */
  select?: string

  /**
   * Nombre del campo que referencia al nivel padre (null para el primer nivel)
   */
  parentField?: string

  /**
   * Filtros adicionales estáticos { campo: valor }
   */
  filters?: Record<string, any>

  /**
   * Ordenamiento
   */
  orderBy?: {
    column: string
    ascending?: boolean
  }

  /**
   * Función para transformar los items
   */
  transform?: (item: any) => T

  /**
   * Si es true, se carga automáticamente al montar (solo para el primer nivel)
   */
  autoLoad?: boolean
}

/**
 * Opciones de configuración para useCascadeSelect
 */
export interface UseCascadeSelectOptions<T extends Record<string, any>> {
  /**
   * Configuración de cada nivel de la cascada
   *
   * @example
   * {
   *   zones: { table: 'zone', select: 'id, name', orderBy: { column: 'name' } },
   *   institutions: { table: 'institution', select: 'id, name, zone_id', parentField: 'zone_id' },
   *   services: { table: 'service', select: 'id, name, institution_id', parentField: 'institution_id' }
   * }
   */
  levels: {
    [K in keyof T]: CascadeLevel<T[K] extends Array<infer U> ? U : T[K]>
  }

  /**
   * Valores iniciales seleccionados { key: value }
   */
  initialValues?: Partial<Record<keyof T, string>>

  /**
   * Callback ejecutado cuando cambia una selección
   */
  onChange?: (selections: Partial<Record<keyof T, string>>) => void
}

/**
 * Resultado del hook useCascadeSelect
 */
export interface UseCascadeSelectResult<T extends Record<string, any>> {
  /**
   * Opciones disponibles para cada nivel { key: items[] }
   */
  options: T

  /**
   * Valores seleccionados { key: value }
   */
  selections: Partial<Record<keyof T, string>>

  /**
   * Indica qué niveles están cargando { key: boolean }
   */
  loadingStates: Partial<Record<keyof T, boolean>>

  /**
   * Errores por nivel { key: error }
   */
  errors: Partial<Record<keyof T, any>>

  /**
   * Establece la selección de un nivel
   * @param level - Nivel a actualizar
   * @param value - Valor seleccionado (o null para limpiar)
   */
  setSelection: <K extends keyof T>(level: K, value: string | null) => void

  /**
   * Resetea todas las selecciones
   */
  resetSelections: () => void

  /**
   * Resetea desde un nivel específico hacia abajo
   * @param level - Nivel desde el cual resetear
   */
  resetFromLevel: <K extends keyof T>(level: K) => void

  /**
   * Recarga las opciones de un nivel
   * @param level - Nivel a recargar
   */
  reloadLevel: <K extends keyof T>(level: K) => Promise<void>
}

/**
 * Hook para gestionar selects en cascada con:
 * - Reset automático de niveles dependientes
 * - Loading states independientes
 * - Filtrado automático basado en selección padre
 * - Transformación de datos
 *
 * @template T - Tipo del objeto de opciones { key: Array<ItemType> }
 *
 * @example
 * ```typescript
 * const {
 *   options,
 *   selections,
 *   setSelection,
 *   loadingStates
 * } = useCascadeSelect({
 *   levels: {
 *     zones: {
 *       table: 'zone',
 *       select: 'id, name',
 *       orderBy: { column: 'name', ascending: true },
 *       autoLoad: true
 *     },
 *     institutions: {
 *       table: 'institution',
 *       select: 'id, name, zone_id',
 *       parentField: 'zone_id',
 *       orderBy: { column: 'name', ascending: true }
 *     },
 *     services: {
 *       table: 'service',
 *       select: 'id, name, institution_id',
 *       parentField: 'institution_id',
 *       filters: { is_active: true }
 *     }
 *   },
 *   onChange: (selections) => {
 *     console.log('Selecciones:', selections)
 *   }
 * })
 *
 * // En el JSX
 * <Select
 *   value={selections.zones}
 *   onValueChange={(value) => setSelection('zones', value)}
 *   disabled={loadingStates.zones}
 * >
 *   {options.zones.map(zone => (
 *     <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
 *   ))}
 * </Select>
 *
 * <Select
 *   value={selections.institutions}
 *   onValueChange={(value) => setSelection('institutions', value)}
 *   disabled={!selections.zones || loadingStates.institutions}
 * >
 *   {options.institutions.map(inst => (
 *     <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
 *   ))}
 * </Select>
 * ```
 */
export function useCascadeSelect<T extends Record<string, any[]>>({
  levels,
  initialValues = {},
  onChange
}: UseCascadeSelectOptions<T>): UseCascadeSelectResult<T> {

  // Inicializar opciones con arrays vacíos
  const [options, setOptions] = useState<T>(() => {
    const initialOptions = {} as T
    Object.keys(levels).forEach(key => {
      initialOptions[key as keyof T] = [] as any
    })
    return initialOptions
  })

  const [selections, setSelections] = useState<Partial<Record<keyof T, string>>>(initialValues)
  const [loadingStates, setLoadingStates] = useState<Partial<Record<keyof T, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<keyof T, any>>>({})

  // Obtener las claves de los niveles en orden
  const levelKeys = useMemo(() => Object.keys(levels) as (keyof T)[], [levels])

  /**
   * Carga las opciones de un nivel
   */
  const loadLevel = useCallback(async <K extends keyof T>(
    level: K,
    parentValue?: string
  ): Promise<void> => {
    const levelConfig = levels[level]

    try {
      setLoadingStates(prev => ({ ...prev, [level]: true }))
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[level]
        return newErrors
      })

      // Construir query
      let query = supabase
        .from(levelConfig.table)
        .select(levelConfig.select || '*')

      // Aplicar filtro de padre si existe
      if (levelConfig.parentField && parentValue) {
        query = query.eq(levelConfig.parentField, parentValue)
      }

      // Aplicar filtros adicionales
      if (levelConfig.filters) {
        Object.entries(levelConfig.filters).forEach(([field, value]) => {
          query = query.eq(field, value)
        })
      }

      // Aplicar ordenamiento
      if (levelConfig.orderBy) {
        query = query.order(levelConfig.orderBy.column, {
          ascending: levelConfig.orderBy.ascending ?? true
        })
      }

      // Ejecutar query
      const { data, error } = await query

      if (error) throw error

      // Transformar datos si es necesario
      const transformedData = levelConfig.transform
        ? (data || []).map(levelConfig.transform)
        : (data || [])

      // Actualizar opciones
      setOptions(prev => ({
        ...prev,
        [level]: transformedData
      }))

    } catch (error: any) {
      console.error(`Error loading cascade level ${String(level)}:`, error)
      setErrors(prev => ({ ...prev, [level]: error }))
      setOptions(prev => ({ ...prev, [level]: [] as any }))
    } finally {
      setLoadingStates(prev => {
        const newState = { ...prev }
        delete newState[level]
        return newState
      })
    }
  }, [levels])

  /**
   * Establece la selección de un nivel y resetea niveles dependientes
   */
  const setSelection = useCallback(<K extends keyof T>(
    level: K,
    value: string | null
  ): void => {
    // Actualizar selección
    setSelections(prev => {
      const newSelections = { ...prev }

      if (value === null) {
        delete newSelections[level]
      } else {
        newSelections[level] = value
      }

      // Resetear niveles dependientes (los que vienen después en la cascada)
      const levelIndex = levelKeys.indexOf(level)
      for (let i = levelIndex + 1; i < levelKeys.length; i++) {
        const dependentLevel = levelKeys[i]
        delete newSelections[dependentLevel]
        setOptions(prev => ({ ...prev, [dependentLevel]: [] as any }))
      }

      // Ejecutar callback
      if (onChange) {
        onChange(newSelections)
      }

      return newSelections
    })

    // Cargar el siguiente nivel si existe y tiene valor seleccionado
    if (value) {
      const levelIndex = levelKeys.indexOf(level)
      if (levelIndex < levelKeys.length - 1) {
        const nextLevel = levelKeys[levelIndex + 1]
        loadLevel(nextLevel, value)
      }
    }
  }, [levelKeys, levels, loadLevel, onChange])

  /**
   * Resetea todas las selecciones
   */
  const resetSelections = useCallback(() => {
    setSelections({})
    setOptions(prev => {
      const resetOptions = {} as T
      Object.keys(levels).forEach(key => {
        // Mantener solo las opciones del primer nivel si tiene autoLoad
        const levelConfig = levels[key as keyof T]
        resetOptions[key as keyof T] = levelConfig.autoLoad ? prev[key as keyof T] : ([] as any)
      })
      return resetOptions
    })

    if (onChange) {
      onChange({})
    }
  }, [levels, onChange])

  /**
   * Resetea desde un nivel específico hacia abajo
   */
  const resetFromLevel = useCallback(<K extends keyof T>(level: K): void => {
    const levelIndex = levelKeys.indexOf(level)

    setSelections(prev => {
      const newSelections = { ...prev }
      for (let i = levelIndex; i < levelKeys.length; i++) {
        delete newSelections[levelKeys[i]]
      }
      return newSelections
    })

    setOptions(prev => {
      const newOptions = { ...prev }
      for (let i = levelIndex; i < levelKeys.length; i++) {
        newOptions[levelKeys[i]] = [] as any
      }
      return newOptions
    })

    if (onChange) {
      setSelections(current => {
        onChange(current)
        return current
      })
    }
  }, [levelKeys, onChange])

  /**
   * Recarga un nivel específico
   */
  const reloadLevel = useCallback(async <K extends keyof T>(level: K): Promise<void> => {
    const levelIndex = levelKeys.indexOf(level)

    if (levelIndex === 0) {
      // Primer nivel: cargar sin filtro padre
      await loadLevel(level)
    } else {
      // Niveles dependientes: cargar con filtro del padre
      const parentLevel = levelKeys[levelIndex - 1]
      const parentValue = selections[parentLevel]

      if (parentValue) {
        await loadLevel(level, parentValue)
      }
    }
  }, [levelKeys, selections, loadLevel])

  // Auto-load del primer nivel si tiene autoLoad
  useEffect(() => {
    if (levelKeys.length > 0) {
      const firstLevel = levelKeys[0]
      const firstLevelConfig = levels[firstLevel]

      if (firstLevelConfig.autoLoad) {
        loadLevel(firstLevel)
      }
    }
  }, []) // Solo al montar

  return {
    options,
    selections,
    loadingStates,
    errors,
    setSelection,
    resetSelections,
    resetFromLevel,
    reloadLevel
  }
}
