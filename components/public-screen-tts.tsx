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
    service?: {
      name: string
    }
  }
}

interface PublicScreenTTSProps {
  callEvents: CallEvent[]
  enabled?: boolean
  volume?: number
  rate?: number
  includeServiceName?: boolean // Para layouts multi-servicio
}

/**
 * Componente que maneja el TTS (Text-to-Speech) para la pantalla pública
 * Detecta nuevos llamados y los anuncia por voz
 */
export function PublicScreenTTS({
  callEvents,
  enabled = true,
  volume = 1.0,
  rate = 0.9,
  includeServiceName = false
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
      const service = latestCall.appointment?.service

      if (patient && room) {
        const patientName = `${patient.first_name} ${patient.last_name}`
        const roomName = room.name
        const serviceName = includeServiceName && service ? service.name : undefined
        const callText = generateCallText(patientName, roomName, serviceName)

        // Reproducir sonido de notificación
        playNotificationSound(volume)

        // PRIMER LLAMADO: Esperar más tiempo después del dingdong
        // Dingdong dura ~2 segundos + 1 segundo de pausa = 3 segundos
        setTimeout(() => {
          speak(callText)
        }, 3000)

        // SEGUNDO LLAMADO: Esperar que termine el primero + pausa + repetir
        // Primer llamado ~3s + pausa 2s = 5 segundos después del primero
        setTimeout(() => {
          speak(callText)
        }, 8000)

        // Marcar este llamado como anunciado
        previousCallsRef.current.add(latestCall.id)
      }
    }

    // Limpiar llamados antiguos del ref (mantener solo los últimos 10)
    if (previousCallsRef.current.size > 10) {
      const callsArray = Array.from(previousCallsRef.current)
      previousCallsRef.current = new Set(callsArray.slice(-10))
    }
  }, [callEvents, speak, supported, enabled, volume, includeServiceName])

  // No renderiza nada, solo maneja el audio
  return null
}
