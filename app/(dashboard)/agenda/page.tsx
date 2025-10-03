'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Calendar, ChevronLeft, ChevronRight, User, Clock, Building, Activity, Users, CalendarDays } from 'lucide-react'

type SlotTemplate = {
  id: string
  professional_id: string
  service_id: string
  room_id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  is_active: boolean
}

type Professional = {
  id: string
  first_name: string
  last_name: string
  institution_id: string
  speciality: string | null
}

type Service = {
  id: string
  name: string
  duration_minutes: number
}

type Room = {
  id: string
  name: string
}


type GeneratedSlot = {
  time: string
  professional: Professional
  service: Service
  room: Room | null
  template_id: string
  available: boolean
}

type DaySchedule = {
  date: string
  dayName: string
  dayOfWeek: number
  slots: GeneratedSlot[]
}

const daysOfWeek = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
]

export default function AgendaPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [institutionContext, setInstitutionContext] = useState<any>(null)
  const [slotTemplates, setSlotTemplates] = useState<SlotTemplate[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date())
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar autenticación y contexto institucional
    const userData = localStorage.getItem('user')
    const contextData = localStorage.getItem('institution_context')

    if (!userData || !contextData) {
      router.push('/')
      return
    }

    setUser(JSON.parse(userData))
    setInstitutionContext(JSON.parse(contextData))
  }, [router])

  useEffect(() => {
    if (institutionContext?.institution_id) {
      fetchInstitutionData()
    }
  }, [institutionContext]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (institutionContext?.institution_id && slotTemplates.length > 0) {
      generateWeekSchedule()
    }
  }, [institutionContext, slotTemplates, currentWeek]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInstitutionData = async () => {
    if (!institutionContext?.institution_id) {
      return
    }

    try {
      setLoading(true)

      // Intentar consultar las tablas reales
      try {
        // Fetch professionals
        const { data: professionalData, error: profError } = await supabase
          .from('professional')
          .select('id, first_name, last_name, institution_id, speciality')
          .eq('institution_id', institutionContext.institution_id)
          .eq('is_active', true)

        if (!profError) {
          setProfessionals(professionalData || [])
        }

        // Fetch services
        const { data: serviceData, error: servError } = await supabase
          .from('service')
          .select('id, name, duration_minutes')
          .eq('institution_id', institutionContext.institution_id)
          .eq('is_active', true)

        if (!servError) {
          setServices(serviceData || [])
        }

        // Fetch rooms
        const { data: roomData, error: roomError } = await supabase
          .from('room')
          .select('id, name')
          .eq('institution_id', institutionContext.institution_id)
          .eq('is_active', true)

        if (!roomError) {
          setRooms(roomData || [])
        }

        // Fetch slot templates
        if (professionalData && professionalData.length > 0) {
          const { data: templateData, error: templateError } = await supabase
            .from('slot_template')
            .select('*')
            .in('professional_id', professionalData.map(p => p.id))
            .eq('is_active', true)

          if (!templateError) {
            setSlotTemplates(templateData || [])
          }
        }

      } catch (dbError) {
        // Si las tablas no existen o hay error de BD, usar arrays vacíos
        setProfessionals([])
        setServices([])
        setRooms([])
        setSlotTemplates([])
      }

    } catch (error) {
      console.error('Error fetching institution data:', error)
      setError('Error al cargar los datos. Las tablas de agenda aún no están configuradas.')
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = (startTime: string, endTime: string, duration: number): string[] => {
    const slots: string[] = []
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    let current = new Date(start)
    while (current < end) {
      slots.push(current.toTimeString().substring(0, 5))
      current.setMinutes(current.getMinutes() + duration)
    }
    
    return slots
  }

  const generateWeekSchedule = () => {
    const weekStart = new Date(currentWeek)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start on Sunday
    
    const schedule: DaySchedule[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      
      const daySlots: GeneratedSlot[] = []
      
      // Find templates for this day of week
      const dayTemplates = slotTemplates.filter(template => template.day_of_week === i)
      
      dayTemplates.forEach(template => {
        const professional = professionals.find(p => p.id === template.professional_id)
        const service = services.find(s => s.id === template.service_id)
        const room = rooms.find(r => r.id === template.room_id)
        
        if (professional && service) {
          const timeSlots = generateTimeSlots(
            template.start_time,
            template.end_time,
            template.slot_duration_minutes
          )
          
          timeSlots.forEach(time => {
            daySlots.push({
              time,
              professional,
              service,
              room: room || null,
              template_id: template.id,
              available: true // TODO: Check existing appointments
            })
          })
        }
      })
      
      // Sort slots by time
      daySlots.sort((a, b) => a.time.localeCompare(b.time))
      
      schedule.push({
        date: date.toISOString().split('T')[0],
        dayName: daysOfWeek[i],
        dayOfWeek: i,
        slots: daySlots
      })
    }
    
    setWeekSchedule(schedule)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }

  const getTodaySlots = () => {
    const today = selectedDate.toISOString().split('T')[0]
    return weekSchedule.find(day => day.date === today)?.slots || []
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getWeekRange = () => {
    const weekStart = new Date(currentWeek)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
  }

  const getSlotsByTimeAndProfessional = () => {
    const slots = viewMode === 'week' 
      ? weekSchedule.flatMap(day => day.slots.map(slot => ({ ...slot, date: day.date, dayName: day.dayName })))
      : getTodaySlots().map(slot => ({ ...slot, date: selectedDate.toISOString().split('T')[0], dayName: daysOfWeek[selectedDate.getDay()] }))
    
    // Group by time and then by professional
    const grouped: { [time: string]: { [professionalId: string]: any[] } } = {}
    
    slots.forEach(slot => {
      if (!grouped[slot.time]) grouped[slot.time] = {}
      if (!grouped[slot.time][slot.professional.id]) grouped[slot.time][slot.professional.id] = []
      grouped[slot.time][slot.professional.id].push(slot)
    })
    
    return grouped
  }

  const uniqueProfessionals = professionals.filter(prof => 
    slotTemplates.some(template => template.professional_id === prof.id)
  )

  const timeSlots = Array.from(new Set(
    slotTemplates.flatMap(template => 
      generateTimeSlots(template.start_time, template.end_time, template.slot_duration_minutes)
    )
  )).sort()

  if (!user || !institutionContext) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando agenda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Agenda</h1>
          <p className="text-muted-foreground">
            Vista administrativa de horarios y turnos estilo HSI - {institutionContext.institution_name}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4" />
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'week' | 'day')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="day">Día</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Institution Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Institución Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold">{institutionContext.institution_name}</span>
            </div>
            {institutionContext.zone_name && (
              <span className="text-sm text-muted-foreground">
                {institutionContext.zone_name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {institutionContext?.institution_id && (
        <>
          {/* No Data State */}
          {!loading && professionals.length === 0 && services.length === 0 && slotTemplates.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Agenda no configurada
                </h3>
                <p className="text-gray-600 mb-4">
                  No hay profesionales, servicios o horarios configurados para esta institución.
                </p>
                <p className="text-sm text-gray-500">
                  Para comenzar a usar la agenda, contacte al administrador del sistema para configurar:
                </p>
                <ul className="text-sm text-gray-500 mt-2 space-y-1">
                  <li>• Profesionales de la institución</li>
                  <li>• Servicios disponibles</li>
                  <li>• Horarios de atención</li>
                  <li>• Consultorios disponibles</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Show agenda only if there's data to show */}
          {(professionals.length > 0 || services.length > 0 || slotTemplates.length > 0) && (
            <>
              {/* Navigation */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateDay('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-lg font-semibold">
                    {viewMode === 'week' ? (
                      <span>Semana del {getWeekRange()}</span>
                    ) : (
                      <span>{daysOfWeek[selectedDate.getDay()]}, {formatDate(selectedDate)}</span>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateDay('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const today = new Date()
                    setCurrentWeek(today)
                    setSelectedDate(today)
                  }}
                >
                  Hoy
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card>
              <CardContent className="text-center py-8">
                <p>Cargando agenda...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm text-muted-foreground">Profesionales</p>
                        <p className="text-2xl font-bold">{uniqueProfessionals.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm text-muted-foreground">Servicios</p>
                        <p className="text-2xl font-bold">{services.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                      <div>
                        <p className="text-sm text-muted-foreground">Plantillas</p>
                        <p className="text-2xl font-bold">{slotTemplates.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-orange-600 mr-2" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Turnos {viewMode === 'week' ? 'semanales' : 'del día'}
                        </p>
                        <p className="text-2xl font-bold">
                          {viewMode === 'week' 
                            ? weekSchedule.reduce((sum, day) => sum + day.slots.length, 0)
                            : getTodaySlots().length
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Schedule Grid */}
              {viewMode === 'week' ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Vista Semanal</CardTitle>
                    <CardDescription>
                      Agenda completa de la semana para todos los profesionales
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-8 gap-2 text-sm">
                      {/* Header */}
                      <div className="font-medium p-2 text-center">Horario</div>
                      {weekSchedule.map((day) => (
                        <div key={day.date} className="font-medium p-2 text-center">
                          <div>{day.dayName}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(day.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                          </div>
                        </div>
                      ))}
                      
                      {/* Time slots */}
                      {timeSlots.slice(0, 20).map((time) => (
                        <React.Fragment key={time}>
                          <div className="p-2 text-right font-mono text-xs bg-gray-50">
                            {time}
                          </div>
                          {weekSchedule.map((day) => {
                            const daySlots = day.slots.filter(slot => slot.time === time)
                            return (
                              <div key={`${day.date}-${time}`} className="p-1 min-h-[50px] border border-gray-200">
                                {daySlots.map((slot, index) => (
                                  <div 
                                    key={index}
                                    className="mb-1 p-1 rounded text-xs bg-blue-100 text-blue-800"
                                    title={`${slot.professional.first_name} ${slot.professional.last_name} - ${slot.service.name}`}
                                  >
                                    <div className="font-medium truncate">
                                      {slot.professional.first_name} {slot.professional.last_name.charAt(0)}.
                                    </div>
                                    <div className="truncate">{slot.service.name}</div>
                                    {slot.room && (
                                      <div className="text-xs text-blue-600">{slot.room.name}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Vista Diaria</CardTitle>
                    <CardDescription>
                      Agenda detallada del día seleccionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getTodaySlots().length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="mx-auto h-12 w-12 mb-4" />
                          <p>No hay turnos programados para este día.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(
                            getTodaySlots().reduce((acc, slot) => {
                              if (!acc[slot.time]) acc[slot.time] = []
                              acc[slot.time].push(slot)
                              return acc
                            }, {} as { [time: string]: any[] })
                          ).map(([time, slots]) => (
                            <div key={time} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2 w-20">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="font-mono text-sm font-medium">{time}</span>
                              </div>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {slots.map((slot, index) => (
                                  <div key={index} className="p-3 bg-white rounded border">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <User className="h-4 w-4 text-blue-600" />
                                      <span className="font-medium">
                                        {slot.professional.first_name} {slot.professional.last_name}
                                      </span>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      <div className="flex items-center space-x-2">
                                        <Activity className="h-3 w-3" />
                                        <span>{slot.service.name}</span>
                                      </div>
                                      {slot.room && (
                                        <div className="flex items-center space-x-2">
                                          <Building className="h-3 w-3" />
                                          <span>{slot.room.name}</span>
                                        </div>
                                      )}
                                      <Badge 
                                        variant="outline" 
                                        className={slot.available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                                      >
                                        {slot.available ? 'Disponible' : 'Ocupado'}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
            </>
          )}
        </>
      )}
    </div>
  )
}

// Add React import at the top
import React from 'react'