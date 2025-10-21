/**
 * Funciones de transformación genéricas para datos de Supabase.
 *
 * Este archivo contiene funciones para transformar datos relacionales
 * obtenidos de Supabase a formatos más convenientes para la UI.
 */

/**
 * Esquema de transformación para un campo relacional
 */
export interface TransformFieldSchema {
  /**
   * Nombre del campo de destino en el objeto transformado
   */
  field: string

  /**
   * Ruta al valor en el objeto original (ej: 'institution.name')
   */
  path: string

  /**
   * Valor por defecto si no existe
   */
  default?: any

  /**
   * Función personalizada de transformación
   */
  transform?: (value: any, item: any) => any
}

/**
 * Esquema completo de transformación
 */
export interface TransformSchema {
  [key: string]: TransformFieldSchema
}

/**
 * Obtiene un valor de un objeto usando una ruta (dot notation).
 *
 * @param obj - Objeto del cual obtener el valor
 * @param path - Ruta al valor (ej: 'user.profile.name')
 * @param defaultValue - Valor por defecto si no existe
 * @returns El valor encontrado o el valor por defecto
 *
 * @example
 * ```typescript
 * const obj = { user: { profile: { name: 'Juan' } } }
 * getValueByPath(obj, 'user.profile.name') // 'Juan'
 * getValueByPath(obj, 'user.email', 'N/A') // 'N/A'
 * ```
 */
export function getValueByPath(obj: any, path: string, defaultValue: any = null): any {
  const keys = path.split('.')
  let value = obj

  for (const key of keys) {
    if (value === null || value === undefined) {
      return defaultValue
    }
    value = value[key]
  }

  return value !== undefined && value !== null ? value : defaultValue
}

/**
 * Transforma un array de datos relacionales usando un esquema de transformación.
 *
 * @param data - Array de datos a transformar
 * @param schema - Esquema de transformación
 * @returns Array de datos transformados
 *
 * @example
 * ```typescript
 * const data = [
 *   {
 *     id: '1',
 *     name: 'Servicio A',
 *     institution: { id: 'inst-1', name: 'Hospital Central' },
 *     created_by: { id: 'user-1', first_name: 'Juan', last_name: 'Pérez' }
 *   }
 * ]
 *
 * const schema: TransformSchema = {
 *   institution: {
 *     field: 'institution_name',
 *     path: 'institution.name',
 *     default: 'Sin institución'
 *   },
 *   creator: {
 *     field: 'creator_name',
 *     path: 'created_by',
 *     transform: (user) => `${user.first_name} ${user.last_name}`
 *   }
 * }
 *
 * const transformed = transformRelationalData(data, schema)
 * // [{ id: '1', name: 'Servicio A', institution_name: 'Hospital Central', creator_name: 'Juan Pérez', ... }]
 * ```
 */
export function transformRelationalData<T = any>(
  data: any[],
  schema: TransformSchema
): T[] {
  return data.map(item => {
    const transformed = { ...item }

    // Aplicar cada transformación del esquema
    Object.entries(schema).forEach(([key, config]) => {
      const { field, path, default: defaultValue, transform } = config

      // Obtener el valor usando la ruta
      const value = getValueByPath(item, path, defaultValue)

      // Aplicar transformación personalizada si existe
      if (transform) {
        transformed[field] = transform(value, item)
      } else {
        transformed[field] = value
      }
    })

    return transformed as T
  })
}

/**
 * Normaliza datos anidados aplanando estructuras relacionales.
 *
 * @param data - Array de datos a normalizar
 * @param paths - Objeto con rutas a aplanar { newKey: 'path.to.value' }
 * @returns Array de datos normalizados
 *
 * @example
 * ```typescript
 * const data = [
 *   {
 *     id: '1',
 *     patient: { name: 'Juan Pérez', dni: '12345678' },
 *     service: { name: 'Consulta General' }
 *   }
 * ]
 *
 * const normalized = normalizeNestedData(data, {
 *   patient_name: 'patient.name',
 *   patient_dni: 'patient.dni',
 *   service_name: 'service.name'
 * })
 *
 * // [{ id: '1', patient_name: 'Juan Pérez', patient_dni: '12345678', service_name: 'Consulta General', ... }]
 * ```
 */
export function normalizeNestedData<T = any>(
  data: any[],
  paths: Record<string, string>
): T[] {
  return data.map(item => {
    const normalized = { ...item }

    Object.entries(paths).forEach(([newKey, path]) => {
      normalized[newKey] = getValueByPath(item, path)
    })

    return normalized as T
  })
}

/**
 * Agrupa un array de items por un campo específico.
 *
 * @param data - Array de datos a agrupar
 * @param groupByKey - Campo por el cual agrupar
 * @returns Objeto con grupos { [keyValue]: items[] }
 *
 * @example
 * ```typescript
 * const data = [
 *   { id: '1', institution_id: 'inst-1', name: 'Servicio A' },
 *   { id: '2', institution_id: 'inst-1', name: 'Servicio B' },
 *   { id: '3', institution_id: 'inst-2', name: 'Servicio C' }
 * ]
 *
 * const grouped = groupByField(data, 'institution_id')
 * // {
 * //   'inst-1': [{ id: '1', ... }, { id: '2', ... }],
 * //   'inst-2': [{ id: '3', ... }]
 * // }
 * ```
 */
export function groupByField<T = any>(
  data: T[],
  groupByKey: keyof T
): Record<string, T[]> {
  return data.reduce((acc, item) => {
    const key = String(item[groupByKey])
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

/**
 * Filtra items únicos de un array basándose en un campo.
 *
 * @param data - Array de datos
 * @param uniqueKey - Campo por el cual filtrar únicos
 * @returns Array de items únicos
 *
 * @example
 * ```typescript
 * const data = [
 *   { id: '1', name: 'Juan' },
 *   { id: '2', name: 'Pedro' },
 *   { id: '1', name: 'Juan' } // Duplicado
 * ]
 *
 * const unique = uniqueByField(data, 'id')
 * // [{ id: '1', name: 'Juan' }, { id: '2', name: 'Pedro' }]
 * ```
 */
export function uniqueByField<T = any>(
  data: T[],
  uniqueKey: keyof T
): T[] {
  const seen = new Set()
  return data.filter(item => {
    const key = item[uniqueKey]
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * Mapea un array a un objeto indexado por un campo.
 *
 * @param data - Array de datos
 * @param indexKey - Campo a usar como clave del objeto
 * @returns Objeto indexado { [keyValue]: item }
 *
 * @example
 * ```typescript
 * const data = [
 *   { id: '1', name: 'Juan' },
 *   { id: '2', name: 'Pedro' }
 * ]
 *
 * const indexed = arrayToIndexedObject(data, 'id')
 * // { '1': { id: '1', name: 'Juan' }, '2': { id: '2', name: 'Pedro' } }
 * ```
 */
export function arrayToIndexedObject<T = any>(
  data: T[],
  indexKey: keyof T
): Record<string, T> {
  return data.reduce((acc, item) => {
    const key = String(item[indexKey])
    acc[key] = item
    return acc
  }, {} as Record<string, T>)
}

/**
 * Ordena un array de objetos por un campo.
 *
 * @param data - Array de datos a ordenar
 * @param sortKey - Campo por el cual ordenar
 * @param order - Orden: 'asc' o 'desc'
 * @returns Array ordenado
 *
 * @example
 * ```typescript
 * const data = [
 *   { id: '1', name: 'Zebra', age: 25 },
 *   { id: '2', name: 'Alpha', age: 30 },
 *   { id: '3', name: 'Beta', age: 20 }
 * ]
 *
 * sortByField(data, 'name', 'asc')
 * // [{ name: 'Alpha', ... }, { name: 'Beta', ... }, { name: 'Zebra', ... }]
 *
 * sortByField(data, 'age', 'desc')
 * // [{ age: 30, ... }, { age: 25, ... }, { age: 20, ... }]
 * ```
 */
export function sortByField<T = any>(
  data: T[],
  sortKey: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...data].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]

    if (aVal === bVal) return 0

    const comparison = aVal < bVal ? -1 : 1
    return order === 'asc' ? comparison : -comparison
  })
}

/**
 * Filtra un array de objetos por múltiples condiciones.
 *
 * @param data - Array de datos a filtrar
 * @param filters - Objeto con filtros { campo: valor }
 * @returns Array filtrado
 *
 * @example
 * ```typescript
 * const data = [
 *   { id: '1', name: 'Juan', active: true, role: 'admin' },
 *   { id: '2', name: 'Pedro', active: false, role: 'user' },
 *   { id: '3', name: 'María', active: true, role: 'user' }
 * ]
 *
 * filterByConditions(data, { active: true, role: 'user' })
 * // [{ id: '3', name: 'María', active: true, role: 'user' }]
 * ```
 */
export function filterByConditions<T = any>(
  data: T[],
  filters: Partial<Record<keyof T, any>>
): T[] {
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      return item[key as keyof T] === value
    })
  })
}
