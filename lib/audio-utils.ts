/**
 * Reproduce un sonido de notificación tipo "ding" usando Web Audio API
 *
 * @param volume - Volumen del sonido (0.0 a 1.0)
 */
export function playNotificationSound(volume: number = 0.5): void {
  if (typeof window === 'undefined') return

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Crear oscilador para el primer tono (más alto)
    const oscillator1 = audioContext.createOscillator()
    const gainNode1 = audioContext.createGain()

    oscillator1.connect(gainNode1)
    gainNode1.connect(audioContext.destination)

    // Configurar el primer tono (E6 - 1318.51 Hz)
    oscillator1.frequency.value = 1318.51
    oscillator1.type = 'sine'

    // Envelope para el primer tono
    gainNode1.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode1.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator1.start(audioContext.currentTime)
    oscillator1.stop(audioContext.currentTime + 0.3)

    // Crear oscilador para el segundo tono (más bajo) después de una pausa
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator()
      const gainNode2 = audioContext.createGain()

      oscillator2.connect(gainNode2)
      gainNode2.connect(audioContext.destination)

      // Configurar el segundo tono (C6 - 1046.50 Hz)
      oscillator2.frequency.value = 1046.50
      oscillator2.type = 'sine'

      // Envelope para el segundo tono
      const currentTime = audioContext.currentTime
      gainNode2.gain.setValueAtTime(0, currentTime)
      gainNode2.gain.linearRampToValueAtTime(volume, currentTime + 0.01)
      gainNode2.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3)

      oscillator2.start(currentTime)
      oscillator2.stop(currentTime + 0.3)
    }, 150) // Pequeña pausa entre tonos

  } catch (error) {
    console.error('Error reproduciendo sonido de notificación:', error)
  }
}

/**
 * Genera el texto a leer en voz para un llamado de paciente
 *
 * @param patientName - Nombre completo del paciente
 * @param roomName - Nombre del consultorio
 * @returns Texto formateado para TTS
 */
export function generateCallText(patientName: string, roomName: string): string {
  // Limpiar el nombre del consultorio de números al inicio
  const cleanRoomName = roomName.replace(/^consultorio\s*/i, '').trim()

  return `${patientName}, consultorio ${cleanRoomName}`
}
