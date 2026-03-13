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
  call_count: number
  queue_date: string
  is_sensitive: boolean
  // Raw IDs for screen filter
  service_id?: string | null
  room_id?: string | null
  queue_session_id?: string | null
  // Professional/Consultorio fields (when service_id is null)
  professional_name?: string
  room_name?: string
  is_professional_assignment?: boolean
}

interface ActiveSession {
  id: string
  name: string
  service_id: string
  start_time: string
  end_time: string
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

function applyScreenFilter(
  items: PublicAppointment[],
  mode: 'all' | 'exclude' | 'include',
  serviceIds: string[],
  roomIds: string[]
): PublicAppointment[] {
  if (mode === 'all') return items

  return items.filter(item => {
    const matchesService = item.service_id ? serviceIds.includes(item.service_id) : null
    const matchesRoom = item.room_id ? roomIds.includes(item.room_id) : null

    if (mode === 'include') {
      // include: mostrar solo los que están en la lista
      return matchesService === true || matchesRoom === true
    }
    // exclude: ocultar los que están en la lista; si las listas están vacías, mostrar todo
    return matchesService !== true && matchesRoom !== true
  })
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

  // Screen filter state (when slug is a screen UUID instead of institution slug)
  const [screenName, setScreenName] = useState<string | null>(null)
  const [screenMode, setScreenMode] = useState<'all' | 'exclude' | 'include'>('all')
  const [screenServiceIds, setScreenServiceIds] = useState<string[]>([])
  const [screenRoomIds, setScreenRoomIds] = useState<string[]>([])
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)

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

  const [announcingAppointmentId, setAnnouncingAppointmentId] = useState<string | null>(null)
  const announcingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  // Includes ALL 'llamado' appointments so the TTS queue can announce each one
  const callEvents = useMemo(() => {
    const calledAppointments = appointments.filter(a => a.status === 'llamado')

    return calledAppointments.map(apt => {
      // For professional assignments, announce the room name
      // For service assignments, announce the service name
      const announcementText = apt.is_professional_assignment
        ? (apt.room_name || 'Consultorio')
        : apt.service_name

      let firstName: string
      let lastName: string

      if (apt.is_sensitive) {
        firstName = 'Paciente'
        lastName = String(apt.order_number).padStart(3, '0')
      } else {
        const nameParts = apt.patient_name.split(' ')
        firstName = nameParts[0] || ''
        lastName = nameParts.slice(1).join(' ') || ''
      }

      return {
        id: `${apt.id}-${apt.call_count}`,
        appointment_id: apt.id,
        created_at: apt.called_at || new Date().toISOString(),
        appointment: {
          patient: { first_name: firstName, last_name: lastName },
          room: { name: '' },
          service: { name: announcementText }
        }
      }
    })
  }, [appointments])

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


  // Fetch institution data (with optional screen token lookup)
  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        // First: try to resolve slug as a screen UUID token
        const { data: screenData } = await supabase
          .from('screen')
          .select('id, name, mode, institution_id')
          .eq('id', slug)
          .eq('is_active', true)
          .single()

        let institutionId: string

        if (screenData) {
          // Slug is a screen token → load filter config
          institutionId = screenData.institution_id
          setScreenName(screenData.name)
          setScreenMode(screenData.mode as 'all' | 'exclude' | 'include')

          if (screenData.mode !== 'all') {
            const { data: configItems } = await supabase
              .from('screen_config_item')
              .select('item_type, item_id')
              .eq('screen_id', screenData.id)

            const items: { item_type: string; item_id: string }[] = configItems || []
            setScreenServiceIds(items.filter(i => i.item_type === 'service').map(i => i.item_id))
            setScreenRoomIds(items.filter(i => i.item_type === 'room').map(i => i.item_id))
          }
        } else {
          // Fallback: resolve slug as institution slug or UUID
          const { data: instData, error: instError } = await supabase
            .from('institution')
            .select('id')
            .or(`slug.eq.${slug},id.eq.${slug}`)
            .single()

          if (instError) throw instError
          institutionId = instData.id
        }

        // Fetch full institution data
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
          .eq('id', institutionId)
          .single()

        if (error) throw error

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
          call_count,
          queue_date,
          service_id,
          professional_id,
          room_id,
          queue_session_id,
          is_sensitive,
          service:service_id (
            name
          ),
          professional:professional_id (
            first_name,
            last_name
          ),
          room:room_id (
            name
          )
        `)
        .eq('institution_id', institution.id)
        .eq('queue_date', new Date().toISOString().split('T')[0])
        .in('status', ['disponible', 'llamado', 'atendido'])
        .order('order_number', { ascending: true })

      if (error) throw error

      const formattedAppointments: PublicAppointment[] = data?.map((item: any) => {
        // Determine if this is a professional assignment (no service_id)
        const isProfessionalAssignment = !item.service_id && item.professional_id

        // Get professional name if assigned
        const professionalName = item.professional
          ? `${item.professional.first_name} ${item.professional.last_name}`.trim()
          : ''

        // Get room name
        const roomName = item.room?.name || ''

        // For professional assignments, use "Consultorio X - Professional Name" format
        // For service assignments, use the service name
        const serviceName = isProfessionalAssignment
          ? (roomName ? `${roomName} - ${professionalName}` : professionalName)
          : (item.service?.name || '')

        const isSensitive = item.is_sensitive ?? false
        return {
          id: item.id,
          order_number: item.order_number,
          patient_name: isSensitive ? '' : item.patient_name,
          service_name: serviceName,
          status: item.status,
          called_at: item.called_at,
          call_count: item.call_count ?? 0,
          queue_date: item.queue_date,
          is_sensitive: isSensitive,
          service_id: item.service_id ?? null,
          room_id: item.room_id ?? null,
          queue_session_id: item.queue_session_id ?? null,
          professional_name: professionalName,
          room_name: roomName,
          is_professional_assignment: isProfessionalAssignment
        }
      }) || []

      // Fetch active session for current time
      const nowTime = new Date().toTimeString().slice(0, 8) // HH:MM:SS
      const { data: sessionsData } = await supabase
        .from('queue_session')
        .select('id, name, service_id, start_time, end_time')
        .eq('institution_id', institution.id)
        .eq('session_date', new Date().toISOString().split('T')[0])
        .eq('is_active', true)

      const active = (sessionsData || []).find(
        (s: any) => s.start_time <= nowTime && s.end_time >= nowTime
      ) || null
      setActiveSession(active as ActiveSession | null)

      // Apply screen filter if this is a screen-token URL
      const screenFiltered = applyScreenFilter(
        formattedAppointments,
        screenMode,
        screenServiceIds,
        screenRoomIds
      )

      // Apply session filter: hide patients from OTHER sessions (not the active one)
      const filteredAppointments = active
        ? screenFiltered.filter(
            item => item.queue_session_id === null || item.queue_session_id === active.id
          )
        : screenFiltered

      setAppointments(filteredAppointments)

      // Find current call (most recent 'llamado' status)
      const currentCalledAppointment = filteredAppointments.find(apt => apt.status === 'llamado')
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

          // If status changed to 'llamado', show "Llamando..." state in UI
          // Note: audio (ding dong + TTS) is handled entirely by PublicScreenTTS to avoid duplicates
          if (payload.eventType === 'UPDATE' &&
              payload.new?.status === 'llamado' &&
              (payload.old?.status !== 'llamado' || payload.new?.call_count !== payload.old?.call_count)) {
            // Show "Llamando..." state for 11 seconds (matches TTS duration)
            if (announcingTimerRef.current) clearTimeout(announcingTimerRef.current)
            setAnnouncingAppointmentId(payload.new.id)
            announcingTimerRef.current = setTimeout(() => setAnnouncingAppointmentId(null), 11000)
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
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-blue-900">
                    {institution?.name || 'Centro de Salud'}
                  </h1>
                  {screenName && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {screenName}
                    </span>
                  )}
                  {activeSession && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      📋 {activeSession.name}
                    </span>
                  )}
                </div>
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
                    if (soundEnabled) {
                      playNotificationSound(ttsVolume)
                    }
                  }}
                  className="ml-2 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
                  title="Probar sonido"
                >
                  🔔
                </button>
                <TemplateSelector
                  currentTemplateId={currentTemplate?.id}
                  onTemplateChange={handleTemplateChange}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Multi-Service Display with Selected Template */}
        <MultiServiceDisplay
          appointments={appointments}
          template={currentTemplate}
          announcingAppointmentId={announcingAppointmentId}
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
        soundEnabled={soundEnabled}
        volume={ttsVolume}
        rate={ttsRate}
        includeServiceName={true}
      />
      <TTSControls onTest={handleTestTTS} />
    </div>
  )
}