/**
 * Sistema de colores para servicios
 * Asigna colores distintivos basados en el nombre del servicio
 */

interface ServiceColorScheme {
  bg: string
  text: string
  border: string
  icon: string
}

// Mapeo de palabras clave a esquemas de colores
const serviceKeywordColors: Record<string, ServiceColorScheme> = {
  // Servicios médicos
  'medico': {
    bg: 'bg-blue-100',
    text: 'text-blue-900',
    border: 'border-blue-300',
    icon: '👨‍⚕️'
  },
  'consultorio': {
    bg: 'bg-blue-100',
    text: 'text-blue-900',
    border: 'border-blue-300',
    icon: '🩺'
  },
  'clinica': {
    bg: 'bg-blue-100',
    text: 'text-blue-900',
    border: 'border-blue-300',
    icon: '🏥'
  },

  // Enfermería
  'enfermeria': {
    bg: 'bg-teal-100',
    text: 'text-teal-900',
    border: 'border-teal-300',
    icon: '💉'
  },
  'enfermero': {
    bg: 'bg-teal-100',
    text: 'text-teal-900',
    border: 'border-teal-300',
    icon: '💉'
  },

  // Vacunación
  'vacun': {
    bg: 'bg-purple-100',
    text: 'text-purple-900',
    border: 'border-purple-300',
    icon: '💉'
  },
  'inmunizacion': {
    bg: 'bg-purple-100',
    text: 'text-purple-900',
    border: 'border-purple-300',
    icon: '💉'
  },

  // Laboratorio
  'laboratorio': {
    bg: 'bg-cyan-100',
    text: 'text-cyan-900',
    border: 'border-cyan-300',
    icon: '🧪'
  },
  'analisis': {
    bg: 'bg-cyan-100',
    text: 'text-cyan-900',
    border: 'border-cyan-300',
    icon: '🧪'
  },

  // Farmacia
  'farmacia': {
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-300',
    icon: '💊'
  },
  'medicamento': {
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-300',
    icon: '💊'
  },

  // Odontología
  'odonto': {
    bg: 'bg-green-100',
    text: 'text-green-900',
    border: 'border-green-300',
    icon: '🦷'
  },
  'dental': {
    bg: 'bg-green-100',
    text: 'text-green-900',
    border: 'border-green-300',
    icon: '🦷'
  },

  // Radiología
  'radio': {
    bg: 'bg-indigo-100',
    text: 'text-indigo-900',
    border: 'border-indigo-300',
    icon: '📸'
  },
  'imagen': {
    bg: 'bg-indigo-100',
    text: 'text-indigo-900',
    border: 'border-indigo-300',
    icon: '📸'
  },

  // Kinesiología
  'kinesio': {
    bg: 'bg-pink-100',
    text: 'text-pink-900',
    border: 'border-pink-300',
    icon: '🏃'
  },
  'fisio': {
    bg: 'bg-pink-100',
    text: 'text-pink-900',
    border: 'border-pink-300',
    icon: '🏃'
  },

  // Psicología
  'psico': {
    bg: 'bg-violet-100',
    text: 'text-violet-900',
    border: 'border-violet-300',
    icon: '🧠'
  },
  'salud mental': {
    bg: 'bg-violet-100',
    text: 'text-violet-900',
    border: 'border-violet-300',
    icon: '🧠'
  },

  // Nutrición
  'nutri': {
    bg: 'bg-lime-100',
    text: 'text-lime-900',
    border: 'border-lime-300',
    icon: '🥗'
  },
  'alimentacion': {
    bg: 'bg-lime-100',
    text: 'text-lime-900',
    border: 'border-lime-300',
    icon: '🥗'
  },

  // Trabajo Social
  'social': {
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300',
    icon: '🤝'
  },

  // Admisión / Administrativo
  'admision': {
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    border: 'border-gray-300',
    icon: '📋'
  },
  'admin': {
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    border: 'border-gray-300',
    icon: '📋'
  },
}

// Color por defecto
const defaultColor: ServiceColorScheme = {
  bg: 'bg-slate-100',
  text: 'text-slate-900',
  border: 'border-slate-300',
  icon: '🏥'
}

/**
 * Obtiene el esquema de colores para un servicio basado en su nombre
 */
export function getServiceColors(serviceName: string): ServiceColorScheme {
  const normalizedName = serviceName.toLowerCase()

  // Buscar coincidencia por palabra clave
  for (const [keyword, colors] of Object.entries(serviceKeywordColors)) {
    if (normalizedName.includes(keyword)) {
      return colors
    }
  }

  return defaultColor
}

/**
 * Obtiene una clase de color específica para un servicio
 */
export function getServiceColorClass(serviceName: string, type: 'bg' | 'text' | 'border'): string {
  const colors = getServiceColors(serviceName)
  return colors[type]
}

/**
 * Obtiene el icono para un servicio
 */
export function getServiceIcon(serviceName: string): string {
  const colors = getServiceColors(serviceName)
  return colors.icon
}
