/**
 * Utilidades para manejo de privacidad en el sistema de turnos
 * Soporta 3 niveles de privacidad para proteger información de pacientes
 */

export type PrivacyLevel =
  | 'public_full_name'      // Juan Pérez (público)
  | 'public_initials'       // J.P. (semi-privado)
  | 'private_ticket_only'   // Turno 001 (privado)

export interface PrivacyConfig {
  appointmentPrivacy?: PrivacyLevel | null
  servicePrivacy?: PrivacyLevel
  institutionPrivacy?: PrivacyLevel
}

export interface DisplayNameOptions {
  firstName: string
  lastName: string
  privacyLevel: PrivacyLevel
  ticketNumber?: number
}

/**
 * Resuelve el nivel de privacidad efectivo usando jerarquía:
 * 1. Appointment override (más específico)
 * 2. Service default
 * 3. Institution fallback
 *
 * @param config - Configuración de privacidad en múltiples niveles
 * @returns El nivel de privacidad efectivo a aplicar
 */
export function resolvePrivacyLevel({
  appointmentPrivacy,
  servicePrivacy = 'public_full_name',
  institutionPrivacy = 'public_full_name'
}: PrivacyConfig): PrivacyLevel {
  return appointmentPrivacy
    ?? servicePrivacy
    ?? institutionPrivacy
    ?? 'public_full_name'
}

/**
 * Genera el nombre a mostrar en pantalla pública según el nivel de privacidad
 *
 * @param options - Opciones con datos del paciente y privacidad
 * @returns Texto formateado para mostrar públicamente
 */
export function getDisplayName({
  firstName,
  lastName,
  privacyLevel,
  ticketNumber
}: DisplayNameOptions): string {
  switch (privacyLevel) {
    case 'public_full_name':
      return `${firstName} ${lastName}`

    case 'public_initials':
      const firstInitial = firstName.charAt(0).toUpperCase()
      const lastInitial = lastName.charAt(0).toUpperCase()
      return `${firstInitial}. ${lastInitial}.`

    case 'private_ticket_only':
      if (ticketNumber !== undefined && ticketNumber !== null) {
        return `Turno ${String(ticketNumber).padStart(3, '0')}`
      }
      return 'Turno sin número'

    default:
      return `${firstName} ${lastName}`
  }
}

/**
 * Genera el texto para TTS (Text-to-Speech) según privacidad
 * Similar a getDisplayName pero optimizado para audio
 *
 * @param options - Opciones con datos del paciente y privacidad
 * @returns Texto optimizado para lectura por voz
 */
export function getTTSText({
  firstName,
  lastName,
  privacyLevel,
  ticketNumber
}: DisplayNameOptions): string {
  switch (privacyLevel) {
    case 'public_full_name':
      return `${firstName} ${lastName}`

    case 'public_initials':
      const firstInitial = firstName.charAt(0).toUpperCase()
      const lastInitial = lastName.charAt(0).toUpperCase()
      return `Paciente ${firstInitial} ${lastInitial}`

    case 'private_ticket_only':
      if (ticketNumber !== undefined && ticketNumber !== null) {
        return `Turno ${ticketNumber}`
      }
      return 'Turno sin número'

    default:
      return `${firstName} ${lastName}`
  }
}

/**
 * Obtiene el label descriptivo de un nivel de privacidad
 *
 * @param level - Nivel de privacidad
 * @returns Descripción legible para el usuario
 */
export function getPrivacyLabel(level: PrivacyLevel | null): string {
  if (!level) return 'Predeterminado'

  switch (level) {
    case 'public_full_name':
      return 'Nombre completo'
    case 'public_initials':
      return 'Solo iniciales'
    case 'private_ticket_only':
      return 'Solo turno'
    default:
      return 'Desconocido'
  }
}

/**
 * Obtiene el icono correspondiente a un nivel de privacidad
 *
 * @param level - Nivel de privacidad
 * @returns Emoji representativo
 */
export function getPrivacyIcon(level: PrivacyLevel | null): string {
  if (!level) return '🔹'

  switch (level) {
    case 'public_full_name':
      return '✅'
    case 'public_initials':
      return '🔒'
    case 'private_ticket_only':
      return '🔐'
    default:
      return '❓'
  }
}

/**
 * Obtiene un ejemplo de cómo se mostraría un nombre con cierto nivel de privacidad
 *
 * @param level - Nivel de privacidad
 * @returns Ejemplo de texto mostrado
 */
export function getPrivacyExample(level: PrivacyLevel | null): string {
  if (!level) return '(usar configuración del servicio)'

  switch (level) {
    case 'public_full_name':
      return 'Ej: "Juan Pérez"'
    case 'public_initials':
      return 'Ej: "J.P."'
    case 'private_ticket_only':
      return 'Ej: "Turno 001"'
    default:
      return ''
  }
}

/**
 * Obtiene la descripción completa de un nivel de privacidad
 *
 * @param level - Nivel de privacidad
 * @returns Descripción detallada
 */
export function getPrivacyDescription(level: PrivacyLevel | null): string {
  if (!level) return 'Se usará la configuración predeterminada del servicio'

  switch (level) {
    case 'public_full_name':
      return 'El nombre y apellido completo se mostrarán en la pantalla pública'
    case 'public_initials':
      return 'Solo las iniciales del nombre y apellido se mostrarán públicamente'
    case 'private_ticket_only':
      return 'Solo se mostrará el número de turno, sin datos personales'
    default:
      return ''
  }
}

/**
 * Obtiene el color variant para Badge según nivel de privacidad
 *
 * @param level - Nivel de privacidad
 * @returns Variant de shadcn/ui Badge
 */
export function getPrivacyVariant(level: PrivacyLevel | null): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!level) return 'outline'

  switch (level) {
    case 'public_full_name':
      return 'default'
    case 'public_initials':
      return 'secondary'
    case 'private_ticket_only':
      return 'destructive'
    default:
      return 'outline'
  }
}

/**
 * Verifica si un servicio típicamente requiere alta privacidad
 * Útil para sugerir defaults al crear servicios
 *
 * @param serviceName - Nombre del servicio
 * @returns true si el servicio es sensible
 */
export function isSensitiveService(serviceName: string): boolean {
  const sensitive = [
    'psiquiatr',
    'salud mental',
    'adicciones',
    'vih',
    'infectolog',
    'oncolog',
    'ets'
  ]

  const lowerName = serviceName.toLowerCase()
  return sensitive.some(keyword => lowerName.includes(keyword))
}

/**
 * Sugiere un nivel de privacidad por defecto para un servicio
 * basado en su nombre
 *
 * @param serviceName - Nombre del servicio
 * @returns Nivel de privacidad sugerido
 */
export function suggestPrivacyLevel(serviceName: string): PrivacyLevel {
  return isSensitiveService(serviceName)
    ? 'private_ticket_only'
    : 'public_full_name'
}
