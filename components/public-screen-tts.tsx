'use client'

import { useEffect, useRef } from 'react'
import { useSpeech } from '@/hooks/use-speech'
import { playNotificationSound, generateCallText } from '@/lib/audio-utils'

interface CallEvent {
  id: string
  appointment_id: string
  created_at: string
  appointment?: {
    patient?: {
      first_name: string
      last_name: string
    }
    room?: {
      name: string
    }
  }
}

interface PublicScreenTTSProps {
  callEvents: CallEvent[]
  enabled?: boolean
  volume?: number
  rate?: number
}

/**
 * Componente que maneja el TTS (Text-to-Speech) para la pantalla pública
 * Detecta nuevos llamados y los anuncia por voz
 */
export function PublicScreenTTS({
  callEvents,
  enabled = true,
  volume = 1.0,
  rate = 0.9
}: PublicScreenTTSProps) {
  const { speak, supported } = useSpeech({
    lang: 'es-AR',
    rate,
    volume,
    enabled
  })

  const previousCallsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!supported || !enabled || callEvents.length === 0) return

    // Obtener el último llamado
    const latestCall = callEvents[0]

    // Verificar si es un nuevo llamado que no hemos anunciado
    if (latestCall && !previousCallsRef.current.has(latestCall.id)) {
      const patient = latestCall.appointment?.patient
      const room = latestCall.appointment?.room

      if (patient && room) {
        const patientName = `${patient.first_name} ${patient.last_name}`
        const roomName = room.name

        // Reproducir sonido de notificación
        playNotificationSound(volume)

        // Esperar un poco después del sonido antes de hablar
        setTimeout(() => {
          const callText = generateCallText(patientName, roomName)
          speak(callText)
        }, 500)

        // Marcar este llamado como anunciado
        previousCallsRef.current.add(latestCall.id)
      }
    }

    // Limpiar llamados antiguos del ref (mantener solo los últimos 10)
    if (previousCallsRef.current.size > 10) {
      const callsArray = Array.from(previousCallsRef.current)
      previousCallsRef.current = new Set(callsArray.slice(-10))
    }
  }, [callEvents, speak, supported, enabled, volume])

  // No renderiza nada, solo maneja el audio
  return null
}
