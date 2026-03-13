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
  soundEnabled?: boolean
  volume?: number
  rate?: number
  includeServiceName?: boolean
}

interface QueueItem {
  id: string
  text: string
}

/**
 * Maneja el TTS para la pantalla pública con cola de anuncios.
 *
 * Flujo por anuncio:
 *   T=0s    → ding dong (si soundEnabled)
 *   T=3s    → TTS (primer anuncio, si enabled)
 *   T=8s    → TTS (segundo anuncio, si enabled)
 *   T=11s   → liberar cola → procesar siguiente si hay
 *
 * Si llegan dos llamados simultáneos, el segundo espera a que
 * el primero termine antes de sonar.
 */
export function PublicScreenTTS({
  callEvents,
  enabled = true,
  soundEnabled = true,
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

  // Refs que persisten entre renders sin causar re-renders
  const previousCallsRef = useRef<Set<string>>(new Set())
  const queueRef = useRef<QueueItem[]>([])
  const isProcessingRef = useRef(false)
  const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Refs siempre frescos para evitar stale closures en los setTimeout
  const speakRef = useRef(speak)
  speakRef.current = speak
  const volumeRef = useRef(volume)
  volumeRef.current = volume
  const soundEnabledRef = useRef(soundEnabled)
  soundEnabledRef.current = soundEnabled

  // processQueue via ref para poder llamarse recursivamente sin closure stale
  const processQueueRef = useRef<() => void>(() => {})

  processQueueRef.current = () => {
    if (isProcessingRef.current || queueRef.current.length === 0) return

    const next = queueRef.current.shift()!
    isProcessingRef.current = true

    // Ding dong respetando el control de sonido
    if (soundEnabledRef.current) {
      playNotificationSound(volumeRef.current)
    }

    const t1 = setTimeout(() => { if (soundEnabledRef.current) speakRef.current(next.text) }, 3000)
    const t2 = setTimeout(() => { if (soundEnabledRef.current) speakRef.current(next.text) }, 8000)
    const t3 = setTimeout(() => {
      isProcessingRef.current = false
      // Limpiar los IDs de este ciclo (ya disparados)
      timerIdsRef.current = timerIdsRef.current.filter(
        id => id !== t1 && id !== t2 && id !== t3
      )
      processQueueRef.current()
    }, 11000)

    timerIdsRef.current.push(t1, t2, t3)
  }

  // Cancelar todos los timers al desmontar
  useEffect(() => {
    return () => {
      timerIdsRef.current.forEach(clearTimeout)
      timerIdsRef.current = []
    }
  }, [])

  useEffect(() => {
    if (!supported || !enabled || callEvents.length === 0) return

    let hasNew = false

    for (const event of callEvents) {
      if (previousCallsRef.current.has(event.id)) continue

      const patient = event.appointment?.patient
      const room = event.appointment?.room
      const service = event.appointment?.service

      if (patient && room) {
        const patientName = `${patient.first_name} ${patient.last_name}`
        const roomName = room.name
        const serviceName = includeServiceName && service ? service.name : undefined
        const callText = generateCallText(patientName, roomName, serviceName)

        queueRef.current.push({ id: event.id, text: callText })
        previousCallsRef.current.add(event.id)
        hasNew = true
      }
    }

    if (hasNew) {
      processQueueRef.current()
    }

    // Evitar crecimiento indefinido del set (mantener últimos 50)
    if (previousCallsRef.current.size > 50) {
      const arr = Array.from(previousCallsRef.current)
      previousCallsRef.current = new Set(arr.slice(-50))
    }
  }, [callEvents, supported, enabled, includeServiceName])

  return null
}
