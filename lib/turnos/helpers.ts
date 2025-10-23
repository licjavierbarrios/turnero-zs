import type { QueueItem } from './types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Calcula el siguiente número de orden basado en la cola actual.
 *
 * @param queue - Array de items en la cola
 * @returns El siguiente número de orden disponible
 *
 * @example
 * ```typescript
 * const nextNumber = getNextOrderNumber([
 *   { order_number: 1, ... },
 *   { order_number: 2, ... }
 * ])
 * // nextNumber = 3
 * ```
 */
export function getNextOrderNumber(queue: QueueItem[]): number {
  if (queue.length === 0) return 1
  const maxOrder = Math.max(...queue.map(q => q.order_number), 0)
  return maxOrder + 1
}

/**
 * Genera un ID temporal único para actualizaciones optimistas.
 *
 * @param index - Índice opcional para generar múltiples IDs únicos
 * @returns ID temporal en formato `temp-{timestamp}-{index}`
 *
 * @example
 * ```typescript
 * const tempId = generateTempId(0) // "temp-1234567890-0"
 * const tempId2 = generateTempId(1) // "temp-1234567890-1"
 * ```
 */
export function generateTempId(index: number = 0): string {
  return `temp-${Date.now()}-${index}`
}

/**
 * Verifica si un ID es temporal (generado localmente).
 *
 * @param id - ID a verificar
 * @returns true si el ID es temporal, false si es del servidor
 *
 * @example
 * ```typescript
 * isTempId('temp-1234567890-0') // true
 * isTempId('550e8400-e29b-41d4-a716-446655440000') // false
 * ```
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp-')
}

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD).
 *
 * @returns Fecha actual en formato ISO
 *
 * @example
 * ```typescript
 * getTodayISO() // "2025-10-20"
 * ```
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Obtiene la fecha y hora actual en formato ISO completo.
 *
 * @returns Fecha y hora actual en formato ISO
 *
 * @example
 * ```typescript
 * getNowISO() // "2025-10-20T14:30:00.000Z"
 * ```
 */
export function getNowISO(): string {
  return new Date().toISOString()
}

/**
 * Formatea una fecha ISO a un formato legible.
 *
 * @param dateString - Fecha en formato ISO (ej: "2025-10-20T14:30:00.000Z")
 * @param formatStr - Formato deseado (ej: "HH:mm", "dd/MM/yyyy", etc.)
 * @returns Fecha formateada según el formato especificado
 *
 * @example
 * ```typescript
 * formatDate("2025-10-20T14:30:00.000Z", "HH:mm") // "14:30"
 * formatDate("2025-10-20T14:30:00.000Z", "dd/MM/yyyy") // "20/10/2025"
 * ```
 */
export function formatDate(dateString: string, formatStr: string = 'HH:mm'): string {
  try {
    const date = new Date(dateString)
    return format(date, formatStr, { locale: es })
  } catch (error) {
    console.error('Error formateando fecha:', error)
    return '--:--'
  }
}

/**
 * Obtiene el contexto institucional desde localStorage.
 *
 * @returns Contexto institucional parseado o null si no existe
 *
 * @example
 * ```typescript
 * const context = getInstitutionContext()
 * if (context) {
 *   console.log(context.institution_id)
 *   console.log(context.user_role)
 * }
 * ```
 */
export function getInstitutionContext(): {
  institution_id: string
  user_role: string
  [key: string]: any
} | null {
  const contextData = localStorage.getItem('institution_context')
  if (!contextData) return null
  return JSON.parse(contextData)
}

/**
 * Verifica si un usuario tiene permisos de administrador.
 *
 * @returns true si el usuario es admin o administrativo
 *
 * @example
 * ```typescript
 * if (isAdminOrAdministrativo()) {
 *   // Mostrar opciones de administrador
 * }
 * ```
 */
export function isAdminOrAdministrativo(): boolean {
  const context = getInstitutionContext()
  if (!context) return false
  return context.user_role === 'admin' || context.user_role === 'administrativo'
}
