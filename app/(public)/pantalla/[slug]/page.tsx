'use client'

import { useState, useEffect, useRef, use, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ClockIcon,
  UserIcon,
  MapPinIcon,
  HeartHandshakeIcon,
  VolumeXIcon,
  Volume2Icon
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PublicScreenTTS } from '@/components/public-screen-tts'
import { TTSControls } from '@/components/tts-controls'
import { TemplateSelector } from '@/components/template-selector'
import { MultiServiceDisplay } from '@/components/multi-service-display'
import { useSpeech } from '@/hooks/use-speech'
import { playNotificationSound } from '@/lib/audio-utils'

interface PublicAppointment {
  id: string
  order_number: number
  patient_name: string
  service_name: string
  status: string
  called_at?: string
  queue_date: string
}

interface Institution {
  id: string
  name: string
  type: string
  slug: string
  zone?: {
    name: string
  }
}

interface CallEvent {
  id: string
  appointment_id: string
  called_at: string
  call_number: number
}

const statusColors = {
  'pendiente': 'bg-gray-100 text-gray-800',
  'disponible': 'bg-blue-100 text-blue-800',
  'llamado': 'bg-purple-100 text-purple-800 animate-pulse',
  'atendido': 'bg-green-100 text-green-800'
}

const statusLabels = {
  'pendiente': 'Pendiente',
  'disponible': 'Disponible',
  'llamado': 'Llamado',
  'atendido': 'Atendido'
}

export default function PantallaPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [appointments, setAppointments] = useState<PublicAppointment[]>([])
  const [currentCall, setCurrentCall] = useState<PublicAppointment | null>(null)
  const [lastCallEvent, setLastCallEvent] = useState<CallEvent | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [showAudioPrompt, setShowAudioPrompt] = useState(true)

  // TTS states
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [ttsVolume, setTtsVolume] = useState(0.8)
  const [ttsRate, setTtsRate] = useState(0.9)

  // Template/Layout state
  const [currentTemplate, setCurrentTemplate] = useState<any>(null)

  // Load template from localStorage on mount
  useEffect(() => {
    const savedTemplateId = localStorage.getItem(`pantalla_template_${slug}`)
    if (savedTemplateId) {
      // Fetch template by ID
      supabase
        .from('display_template')
        .select('*')
        .eq('id', savedTemplateId)
        .single()
        .then(({ data }: { data: any }) => {
          if (data) setCurrentTemplate(data)
        })
    }
  }, [slug])

  // Handle template change
  const handleTemplateChange = (template: any) => {
    setCurrentTemplate(template)
    localStorage.setItem(`pantalla_template_${slug}`, template.id)
  }

  // Load TTS configuration from institution settings
  useEffect(() => {
    const loadTTSConfig = async () => {
      if (!institution?.id) return

      try {
        const { data, error } = await supabase
          .from('institution')
          .select('tts_enabled, tts_volume, tts_rate')
          .eq('id', institution.id)
          .single()

        if (error) throw error

        if (data) {
          setTtsEnabled(data.tts_enabled ?? true)
          setTtsVolume(data.tts_volume ?? 0.8)
          setTtsRate(data.tts_rate ?? 0.9)
        }
      } catch (error) {
        console.error('Error al cargar configuración TTS:', error)
        // Mantener valores por defecto si hay error
      }
    }

    loadTTSConfig()
  }, [institution?.id])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const channelRef = useRef<any>(null)

  // TTS hook
  const { speak } = useSpeech({
    lang: 'es-AR',
    rate: ttsRate,
    volume: ttsVolume,
    enabled: ttsEnabled
  })

  // Activate audio (user interaction required)
  const handleActivateAudio = () => {
    // Play a silent audio to unlock audio context
    playNotificationSound(0.01)
    setTimeout(() => {
      speak('Sistema de audio activado')
    }, 300)
    setShowAudioPrompt(false)
    // Save preference
    localStorage.setItem(`pantalla_audio_activated_${slug}`, 'true')
  }

  // Check if audio was already activated
  useEffect(() => {
    const wasActivated = localStorage.getItem(`pantalla_audio_activated_${slug}`)
    if (wasActivated === 'true') {
      setShowAudioPrompt(false)
    }
  }, [slug])

  // Test TTS function
  const handleTestTTS = () => {
    playNotificationSound(ttsVolume)
    setTimeout(() => {
      speak('María González, consultorio 3')
    }, 500)
  }

  // Transform data for PublicScreenTTS component
  // Creates compatible structure from daily_queue data
  // Using useMemo to prevent infinite re-renders
  const callEvents = useMemo(() => {
    if (!currentCall) return []

    // Split patient name into first and last name
    const nameParts = currentCall.patient_name.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    return [{
      id: currentCall.id,
      appointment_id: currentCall.id,
      created_at: currentCall.called_at || new Date().toISOString(),
      appointment: {
        patient: {
          first_name: firstName,
          last_name: lastName
        },
        room: {
          name: '' // daily_queue doesn't have room
        },
        service: {
          name: currentCall.service_name
        }
      }
    }]
  }, [currentCall])

  // Determinar si hay múltiples servicios activos
  const hasMultipleServices = useMemo(() => {
    const services = new Set(appointments.map(apt => apt.service_name))
    return services.size > 1
  }, [appointments])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Initialize audio for notifications using HTML Audio (more reliable)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create audio element with data URL (beep sound)
      const createBeepSound = () => {
        // Create a simple beep using data URL
        const audioData = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiR2/LJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywFLJeywF"

        const audio = new Audio(audioData)
        audio.volume = 0.5

        return audio
      }

      // Create HTML Audio element for notifications
      const playNotification = async () => {
        try {
          const audio = createBeepSound()
          await audio.play()
        } catch (error) {
          // Fallback: Try a simple beep
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.5)
          } catch (fallbackError) {
            console.error('Error playing audio:', fallbackError)
          }
        }
      }

      audioRef.current = { play: playNotification } as any

      // Preload audio on first user interaction
      let audioInitialized = false
      const initializeAudio = () => {
        if (!audioInitialized) {
          const testAudio = createBeepSound()
          testAudio.volume = 0.01 // Very quiet test
          testAudio.play().then(() => {
            audioInitialized = true
          }).catch(() => {
            // Audio initialization failed, will try on demand
          })
        }
      }

      document.addEventListener('click', initializeAudio, { once: true })
      document.addEventListener('touchstart', initializeAudio, { once: true })

      return () => {
        document.removeEventListener('click', initializeAudio)
        document.removeEventListener('touchstart', initializeAudio)
      }
    }
  }, [])

  // Fetch institution data
  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        const { data, error } = await supabase
          .from('institution')
          .select(`
            id,
            name,
            type,
            slug,
            zone:zone_id (
              name
            )
          `)
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .single()

        if (error) throw error

        // Fix the zone structure from Supabase
        const institutionData: Institution = {
          id: data.id,
          name: data.name,
          type: data.type,
          slug: data.slug,
          zone: Array.isArray(data.zone) ? data.zone[0] : data.zone
        }

        setInstitution(institutionData)
      } catch (error) {
        console.error('Error fetching institution:', error)
      }
    }

    fetchInstitution()
  }, [slug])

  // Fetch appointments data
  const fetchAppointments = async () => {
    if (!institution?.id) {
      return
    }

    try {
      const { data, error } = await supabase
        .from('daily_queue')
        .select(`
          id,
          order_number,
          patient_name,
          status,
          called_at,
          queue_date,
          service:service_id (
            name
          )
        `)
        .eq('institution_id', institution.id)
        .eq('queue_date', new Date().toISOString().split('T')[0])
        .in('status', ['disponible', 'llamado', 'atendido'])
        .order('order_number', { ascending: true })

      if (error) throw error

      const formattedAppointments: PublicAppointment[] = data?.map((item: any) => ({
        id: item.id,
        order_number: item.order_number,
        patient_name: item.patient_name,
        service_name: item.service?.name || '',
        status: item.status,
        called_at: item.called_at,
        queue_date: item.queue_date
      })) || []

      setAppointments(formattedAppointments)

      // Find current call (most recent 'llamado' status)
      const currentCalledAppointment = formattedAppointments.find(apt => apt.status === 'llamado')
      setCurrentCall(currentCalledAppointment || null)

      setLoading(false)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setLoading(false)
    }
  }

  // Setup realtime subscription
  useEffect(() => {
    if (!institution?.id) return

    fetchAppointments()

    // Subscribe to changes in daily_queue table
    const channel = supabase
      .channel(`public-display-${institution.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_queue',
          filter: `institution_id=eq.${institution.id}`
        },
        (payload: any) => {

          // If status changed to 'llamado', play notification sound
          if (payload.eventType === 'UPDATE' &&
              payload.new?.status === 'llamado' &&
              payload.old?.status !== 'llamado') {
            if (soundEnabled && audioRef.current) {
              setTimeout(async () => {
                try {
                  await audioRef.current?.play()
                } catch (error) {
                  console.error('❌ Audio failed:', error)
                }
              }, 300) // Small delay to ensure sound plays after UI update
            }
          }

          // Refresh queue data
          setTimeout(() => {
            fetchAppointments()
          }, 100)
        }
      )
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting')
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [institution, soundEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const getAnonymizedName = (firstName: string, lastName: string) => {
    // Show first name and first letter of last name for privacy
    return `${firstName} ${lastName.charAt(0).toUpperCase()}.`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-blue-800">Cargando información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Audio Activation Prompt */}
      {showAudioPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mb-6">
              <Volume2Icon className="h-20 w-20 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Activar Audio
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Para escuchar los anuncios de llamados, haz clic en el botón de abajo.
              </p>
              <p className="text-gray-500 text-sm mt-3">
                Solo necesitas hacer esto una vez.
              </p>
            </div>
            <button
              onClick={handleActivateAudio}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <Volume2Icon className="inline-block h-6 w-6 mr-3" />
              Activar Audio y Comenzar
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img
                src="/images/logo.png"
                alt="Logo"
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold text-blue-900">
                  {institution?.name || 'Centro de Salud'}
                </h1>
                {institution?.zone && (
                  <p className="text-blue-700 mt-1">{institution.zone.name}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono text-blue-900">
                {format(currentTime, 'HH:mm:ss')}
              </div>
              <div className="text-sm text-blue-700">
                {format(currentTime, 'EEEE, dd/MM/yyyy', { locale: es })}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs text-gray-600">
                  {connectionStatus === 'connected' ? 'En línea' :
                   connectionStatus === 'connecting' ? 'Conectando' : 'Desconectado'}
                </span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="ml-4 p-1 hover:bg-gray-100 rounded"
                  title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
                >
                  {soundEnabled ? (
                    <Volume2Icon className="h-4 w-4 text-gray-600" />
                  ) : (
                    <VolumeXIcon className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={async () => {
                    if (audioRef.current && soundEnabled) {
                      try {
                        await audioRef.current.play()
                      } catch (error) {
                        console.error('❌ Error:', error)
                      }
                    }
                  }}
                  className="ml-2 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
                  title="Probar sonido"
                >
                  🔔
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Template Selector Button */}
      <TemplateSelector
        currentTemplateId={currentTemplate?.id}
        onTemplateChange={handleTemplateChange}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Multi-Service Display with Selected Template */}
        <MultiServiceDisplay
          appointments={appointments}
          template={currentTemplate}
        />

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Sistema Turnero ZS - {format(currentTime, 'yyyy')}
          </p>
          <p className="text-xs mt-1">
            Actualización en tiempo real • Última actualización: {format(currentTime, 'HH:mm:ss')}
          </p>
        </footer>
      </main>

      {/* TTS Components */}
      <PublicScreenTTS
        callEvents={callEvents}
        enabled={ttsEnabled}
        volume={ttsVolume}
        rate={ttsRate}
        includeServiceName={true}
      />
      <TTSControls onTest={handleTestTTS} />
    </div>
  )
}