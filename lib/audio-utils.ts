// Global AudioContext instance (created after user interaction)
let globalAudioContext: AudioContext | null = null

// Precargar el audio de notificación
let notificationAudio: HTMLAudioElement | null = null

/**
 * Inicializa el AudioContext global y precarga el audio (debe llamarse después de interacción del usuario)
 */
export function initAudioContext(): void {
  if (typeof window === 'undefined') return

  // Inicializar AudioContext si no existe
  if (!globalAudioContext) {
    try {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Asegurar que el contexto esté en estado 'running'
      if (globalAudioContext.state === 'suspended') {
        globalAudioContext.resume()
      }
    } catch (error) {
      console.warn('No se pudo inicializar AudioContext:', error)
    }
  }

  // Precargar el audio de notificación
  if (!notificationAudio) {
    notificationAudio = new Audio('/sounds/dingdong.mp3')
    notificationAudio.preload = 'auto'
  }
}

/**
 * Reproduce un sonido de notificación usando el archivo dingdong.mp3
 *
 * @param volume - Volumen del sonido (0.0 a 1.0)
 */
export function playNotificationSound(volume: number = 0.5): void {
  if (typeof window === 'undefined') return

  // Si no hay audio precargado, intentar inicializar
  if (!notificationAudio) {
    initAudioContext()
  }

  // Si aún no hay audio, salir silenciosamente
  if (!notificationAudio) {
    return
  }

  try {
    // Clonar el audio para poder reproducirlo múltiples veces simultáneamente
    const audio = notificationAudio.cloneNode(true) as HTMLAudioElement
    audio.volume = Math.max(0, Math.min(1, volume)) // Asegurar que esté entre 0 y 1

    // Reproducir el audio
    audio.play().catch((error) => {
      // Silenciar errores de autoplay
      if (error.name !== 'NotAllowedError') {
        console.warn('Error reproduciendo sonido:', error)
      }
    })
  } catch (error) {
    // Silenciar errores
    if (error instanceof Error && !error.message.includes('allowed')) {
      console.warn('Error reproduciendo sonido:', error)
    }
  }
}

/**
 * Genera el texto a leer en voz para un llamado de paciente
 *
 * @param patientName - Nombre completo del paciente
 * @param roomName - Nombre del consultorio (puede estar vacío en sistema daily_queue)
 * @param serviceName - Nombre del servicio (se usa como destino principal en daily_queue)
 * @returns Texto formateado para TTS
 */
export function generateCallText(patientName: string, roomName: string, serviceName?: string): string {
  // En el sistema daily_queue, el servicio es el destino principal (ej: "ENFERMERÍA")
  // Si hay servicio, usarlo como destino en lugar del consultorio
  if (serviceName) {
    return `${patientName} a ${serviceName}`
  }

  // Fallback: Si no hay servicio pero hay room, usar consultorio
  if (roomName) {
    const cleanRoomName = roomName.replace(/^consultorio\s*/i, '').trim()
    return `${patientName}, consultorio ${cleanRoomName}`
  }

  // Si no hay ni servicio ni room, solo el nombre
  return patientName
}
