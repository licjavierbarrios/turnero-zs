/**
 * Helpers generales para trabajar con Supabase y el contexto institucional.
 *
 * Este archivo contiene funciones utilitarias que son reutilizables en todo el proyecto.
 */

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD).
 *
 * @returns Fecha actual en formato ISO
 *
 * @example
 * ```typescript
 * getTodayISO() // "2025-10-21"
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
 * getNowISO() // "2025-10-21T14:30:00.000Z"
 * ```
 */
export function getNowISO(): string {
  return new Date().toISOString()
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
  institution_name: string
  institution_slug: string
  institution_type: 'caps' | 'hospital_seccional' | 'hospital_distrital' | 'hospital_regional'
  user_id: string
  user_email: string
  user_role: 'admin' | 'administrativo' | 'profesional' | 'servicio' | 'pantalla'
  membership_id: string
  [key: string]: any
} | null {
  if (typeof window === 'undefined') return null // SSR safety

  const contextData = localStorage.getItem('institution_context')
  if (!contextData) return null

  try {
    return JSON.parse(contextData)
  } catch (error) {
    console.error('Error parsing institution_context:', error)
    return null
  }
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

/**
 * Verifica si un usuario tiene un rol específico.
 *
 * @param role - Rol a verificar
 * @returns true si el usuario tiene ese rol
 *
 * @example
 * ```typescript
 * if (hasRole('medico')) {
 *   // Mostrar opciones de médico
 * }
 * ```
 */
export function hasRole(role: string): boolean {
  const context = getInstitutionContext()
  if (!context) return false
  return context.user_role === role
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
 * Formatea un nombre completo desde first_name y last_name.
 *
 * @param firstName - Nombre
 * @param lastName - Apellido
 * @returns Nombre completo formateado
 *
 * @example
 * ```typescript
 * formatFullName('Juan', 'Pérez') // "Juan Pérez"
 * formatFullName('', 'Pérez') // "Pérez"
 * ```
 */
export function formatFullName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(' ')
}

/**
 * Formatea una fecha ISO a formato legible en español.
 *
 * @param isoDate - Fecha en formato ISO
 * @param includeTime - Si incluir la hora
 * @returns Fecha formateada
 *
 * @example
 * ```typescript
 * formatDate('2025-10-21') // "21/10/2025"
 * formatDate('2025-10-21T14:30:00Z', true) // "21/10/2025 14:30"
 * ```
 */
export function formatDate(isoDate: string, includeTime: boolean = false): string {
  const date = new Date(isoDate)

  if (isNaN(date.getTime())) {
    return 'Fecha inválida'
  }

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()

  const formatted = `${day}/${month}/${year}`

  if (includeTime) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${formatted} ${hours}:${minutes}`
  }

  return formatted
}

/**
 * Calcula la edad a partir de una fecha de nacimiento.
 *
 * @param birthDate - Fecha de nacimiento en formato ISO
 * @returns Edad en años
 *
 * @example
 * ```typescript
 * calculateAge('1990-05-15') // 35 (si estamos en 2025)
 * ```
 */
export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * Valida un DNI argentino.
 *
 * @param dni - DNI a validar
 * @returns true si el DNI es válido
 *
 * @example
 * ```typescript
 * validateDNI('12345678') // true
 * validateDNI('123') // false
 * validateDNI('abcdefgh') // false
 * ```
 */
export function validateDNI(dni: string): boolean {
  // DNI argentino: 7-8 dígitos numéricos
  const dniPattern = /^\d{7,8}$/
  return dniPattern.test(dni.replace(/\./g, ''))
}

/**
 * Formatea un DNI argentino con puntos.
 *
 * @param dni - DNI a formatear
 * @returns DNI formateado
 *
 * @example
 * ```typescript
 * formatDNI('12345678') // "12.345.678"
 * formatDNI('1234567') // "1.234.567"
 * ```
 */
export function formatDNI(dni: string): string {
  // Remover puntos existentes y caracteres no numéricos
  const cleaned = dni.replace(/\D/g, '')

  // Formatear con puntos
  if (cleaned.length === 7) {
    return `${cleaned.slice(0, 1)}.${cleaned.slice(1, 4)}.${cleaned.slice(4)}`
  } else if (cleaned.length === 8) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`
  }

  return cleaned
}

/**
 * Genera un slug a partir de un texto.
 *
 * @param text - Texto a convertir
 * @returns Slug normalizado
 *
 * @example
 * ```typescript
 * generateSlug('Hospital San José') // "hospital-san-jose"
 * generateSlug('CAPS Nº 123') // "caps-no-123"
 * ```
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno solo
    .trim()
}

/**
 * Trunca un texto a un largo máximo.
 *
 * @param text - Texto a truncar
 * @param maxLength - Largo máximo
 * @param suffix - Sufijo a agregar (por defecto "...")
 * @returns Texto truncado
 *
 * @example
 * ```typescript
 * truncate('Este es un texto muy largo', 10) // "Este es un..."
 * ```
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}
