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
  patient_first_name: string
  patient_last_name: string
  professional_first_name: string
  professional_last_name: string
  service_name: string
  room_name?: string
  scheduled_at: string
  status: string
  call_number?: number
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
  'esperando': 'bg-blue-100 text-blue-800',
  'llamado': 'bg-purple-100 text-purple-800 animate-pulse',
  'en_consulta': 'bg-green-100 text-green-800'
}

const statusLabels = {
  'esperando': 'Esperando',
  'llamado': 'Llamado',
  'en_consulta': 'En consulta'
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
        .then(({ data }) => {
          if (data) setCurrentTemplate(data)
        })
    }
  }, [slug])

  // Handle template change
  const handleTemplateChange = (template: any) => {
    setCurrentTemplate(template)
    localStorage.setItem(`pantalla_template_${slug}`, template.id)
  }

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const channelRef = useRef<any>(null)

  // TTS hook
  const { speak } = useSpeech({
    lang: 'es-AR',
    rate: ttsRate,
    volume: ttsVolume,
    enabled: ttsEnabled
  })

  // Test TTS function
  const handleTestTTS = () => {
    playNotificationSound(ttsVolume)
    setTimeout(() => {
      speak('María González, consultorio 3')
    }, 500)
  }

  // Transform data for PublicScreenTTS component
  // Creates compatible structure from lastCallEvent
  // Using useMemo to prevent infinite re-renders
  const callEvents = useMemo(() => {
    if (!lastCallEvent || !currentCall || !currentCall.room_name) return []

    return [{
      id: lastCallEvent.id,
      appointment_id: lastCallEvent.appointment_id,
      created_at: lastCallEvent.called_at,
      appointment: {
        patient: {
          first_name: currentCall.patient_first_name,
          last_name: currentCall.patient_last_name
        },
        room: {
          name: currentCall.room_name
        },
        service: {
          name: currentCall.service_name
        }
      }
    }]
  }, [lastCallEvent, currentCall])

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
          .eq('slug', slug)
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
      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()


      const { data, error } = await supabase
        .from('appointment')
        .select(`
          id,
          scheduled_at,
          status,
          patient:patient_id (
            first_name,
            last_name
          ),
          professional:professional_id (
            first_name,
            last_name
          ),
          service:service_id (
            name
          ),
          room:room_id (
            name
          )
        `)
        .eq('institution_id', institution.id)
        .gte('scheduled_at', startOfDay)
        .lte('scheduled_at', endOfDay)
        .in('status', ['pendiente', 'esperando', 'llamado', 'en_consulta'])
        .order('scheduled_at', { ascending: true })


      if (error) throw error

      const formattedAppointments: PublicAppointment[] = data?.map((apt: any) => ({
        id: apt.id,
        patient_first_name: apt.patient?.first_name || '',
        patient_last_name: apt.patient?.last_name || '',
        professional_first_name: apt.professional?.first_name || '',
        professional_last_name: apt.professional?.last_name || '',
        service_name: apt.service?.name || '',
        room_name: apt.room?.name,
        scheduled_at: apt.scheduled_at,
        status: apt.status
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

    // Subscribe to changes in appointments table
    const channel = supabase
      .channel(`public-display-${institution.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment',
          filter: `institution_id=eq.${institution.id}`
        },
        (payload: any) => {

          // If an appointment status changed to 'llamado', play notification sound
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

          // Refresh appointments data
          setTimeout(() => {
            fetchAppointments()
          }, 100)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_event',
          filter: `appointment_id=in.(${appointments.map(apt => apt.id).join(',')})`
        },
        (payload) => {
          setLastCallEvent(payload.new as CallEvent)
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
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">
                {institution?.name || 'Centro de Salud'}
              </h1>
              {institution?.zone && (
                <p className="text-blue-700 mt-1">{institution.zone.name}</p>
              )}
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
        includeServiceName={hasMultipleServices}
      />
      <TTSControls
        enabled={ttsEnabled}
        volume={ttsVolume}
        rate={ttsRate}
        onEnabledChange={setTtsEnabled}
        onVolumeChange={setTtsVolume}
        onRateChange={setTtsRate}
        onTest={handleTestTTS}
      />
    </div>
  )
}