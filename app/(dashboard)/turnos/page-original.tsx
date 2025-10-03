'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserMembership } from '@/hooks/useUserMembership'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { CalendarIcon, ClockIcon, UserIcon, HeartHandshakeIcon, MapPinIcon, SearchIcon } from 'lucide-react'
import { format, parseISO, startOfDay, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface Patient {
  id: string
  first_name: string
  last_name: string
  dni: string
  phone?: string
  email?: string
}

interface Professional {
  id: string
  first_name: string
  last_name: string
  specialties: string[]
}

interface Service {
  id: string
  name: string
  duration: number
  professional: Professional
  room?: {
    id: string
    name: string
  }
}

interface AvailableSlot {
  datetime: string
  professional_id: string
  service_id: string
  room_id?: string | null
  available: boolean
}

interface Institution {
  id: string
  name: string
}

interface Appointment {
  id: string
  patient: Patient
  professional: Professional
  service: Service
  room?: { name: string }
  scheduled_at: string
  status: string
  notes?: string
  created_at: string
}

const statusColors = {
  'pendiente': 'bg-yellow-100 text-yellow-800',
  'esperando': 'bg-blue-100 text-blue-800',
  'llamado': 'bg-purple-100 text-purple-800',
  'en_consulta': 'bg-green-100 text-green-800',
  'finalizado': 'bg-gray-100 text-gray-800',
  'cancelado': 'bg-red-100 text-red-800',
  'ausente': 'bg-orange-100 text-orange-800'
}

const statusLabels = {
  'pendiente': 'Pendiente',
  'esperando': 'Esperando',
  'llamado': 'Llamado',
  'en_consulta': 'En consulta',
  'finalizado': 'Finalizado',
  'cancelado': 'Cancelado',
  'ausente': 'Ausente'
}

export default function AppointmentsPage() {
  const { userMembership, loading: membershipLoading } = useUserMembership()
  const [activeTab, setActiveTab] = useState('list')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Form states
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [searchPatient, setSearchPatient] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterDate, setFilterDate] = useState<Date>()
  const [filterProfessional, setFilterProfessional] = useState<string>('')

  useEffect(() => {
    if (userMembership) {
      setSelectedInstitution(userMembership.institution_id)
      fetchData()
    }
  }, [userMembership]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedInstitution) {
      fetchAppointments()
      fetchPatients()
      fetchServices()
    }
  }, [selectedInstitution, filterStatus, filterDate, filterProfessional]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedService, selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      if (userMembership?.role === 'admin') {
        const { data, error } = await supabase
          .from('institution')
          .select('id, name')
          .order('name')

        if (error) throw error
        setInstitutions(data || [])
      } else {
        setInstitutions([{ id: userMembership!.institution_id, name: 'Mi Institución' }])
      }
    } catch (error) {
      console.error('Error fetching institutions:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las instituciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async () => {
    if (!selectedInstitution) return

    try {
      let query = supabase
        .from('appointment')
        .select(`
          id,
          scheduled_at,
          status,
          notes,
          created_at,
          patient:patient_id (
            id,
            first_name,
            last_name,
            dni,
            phone,
            email
          ),
          professional:professional_id (
            id,
            first_name,
            last_name,
            specialties
          ),
          service:service_id (
            id,
            name,
            duration
          ),
          room:room_id (
            name
          )
        `)
        .eq('institution_id', selectedInstitution)
        .order('scheduled_at', { ascending: false })

      if (filterStatus) {
        query = query.eq('status', filterStatus)
      }

      if (filterDate) {
        const startOfDateFilter = startOfDay(filterDate)
        const endOfDateFilter = addDays(startOfDateFilter, 1)
        query = query
          .gte('scheduled_at', startOfDateFilter.toISOString())
          .lt('scheduled_at', endOfDateFilter.toISOString())
      }

      if (filterProfessional) {
        query = query.eq('professional_id', filterProfessional)
      }

      const { data, error } = await query

      if (error) throw error

      setAppointments(data?.map((apt: any) => ({
        ...apt,
        patient: apt.patient,
        professional: apt.professional,
        service: apt.service,
        room: apt.room
      })) || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los turnos",
        variant: "destructive",
      })
    }
  }

  const fetchPatients = async () => {
    if (!selectedInstitution) return

    try {
      const { data, error } = await supabase
        .from('patient')
        .select('id, first_name, last_name, dni, phone, email')
        .eq('institution_id', selectedInstitution)
        .order('last_name', { ascending: true })

      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const fetchServices = async () => {
    if (!selectedInstitution) return

    try {
      const { data, error } = await supabase
        .from('service')
        .select(`
          id,
          name,
          duration,
          professional:professional_id (
            id,
            first_name,
            last_name,
            specialties
          ),
          room:room_id (
            id,
            name
          )
        `)
        .eq('institution_id', selectedInstitution)
        .eq('active', true)
        .order('name')

      if (error) throw error
      setServices(data?.map((service: any) => ({
        ...service,
        professional: service.professional,
        room: service.room
      })) || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedService || !selectedDate) return

    try {
      const service = services.find(s => s.id === selectedService)
      if (!service) return

      // Get templates and existing appointments, then generate slots
      const { data: templates, error: templatesError } = await supabase
        .from('slot_template')
        .select('*')
        .eq('institution_id', selectedInstitution)
        .eq('professional_id', service.professional.id)
        .eq('service_id', selectedService)
        .eq('is_active', true)

      if (templatesError) throw templatesError

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointment')
        .select('id, scheduled_at, professional_id, status')
        .eq('institution_id', selectedInstitution)
        .gte('scheduled_at', selectedDate.toISOString().split('T')[0])
        .lt('scheduled_at', new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (appointmentsError) throw appointmentsError

      // Generate time slots for the selected date
      const { generateSlotsForDate } = await import('@/lib/slotGenerator')
      const slots = generateSlotsForDate(
        selectedDate,
        templates || [],
        selectedInstitution,
        appointments || []
      )

      setAvailableSlots(slots.map(slot => ({
        datetime: slot.datetime,
        professional_id: slot.professional_id,
        service_id: slot.service_id,
        room_id: slot.room_id,
        available: slot.available
      })))
    } catch (error) {
      console.error('Error fetching available slots:', error)
    }
  }

  const handleCreateAppointment = async () => {
    if (!selectedPatient || !selectedService || !selectedSlot) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      const service = services.find(s => s.id === selectedService)
      if (!service) throw new Error('Servicio no encontrado')

      const slotDateTime = `${format(selectedDate!, 'yyyy-MM-dd')} ${selectedSlot}`

      const { data, error } = await supabase
        .from('appointment')
        .insert({
          patient_id: selectedPatient,
          professional_id: service.professional.id,
          service_id: selectedService,
          room_id: service.room?.id || null,
          institution_id: selectedInstitution,
          scheduled_at: new Date(slotDateTime).toISOString(),
          status: 'pendiente',
          notes: notes || null,
          created_by: userMembership?.user_id
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Turno creado",
        description: "El turno ha sido agendado exitosamente",
      })

      // Reset form
      setSelectedPatient('')
      setSelectedService('')
      setSelectedDate(undefined)
      setSelectedSlot('')
      setNotes('')
      setIsCreateDialogOpen(false)

      // Refresh appointments
      fetchAppointments()
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el turno",
        variant: "destructive",
      })
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointment')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) throw error

      toast({
        title: "Estado actualizado",
        description: `El turno ha sido marcado como ${statusLabels[newStatus as keyof typeof statusLabels]}`,
      })

      fetchAppointments()
    } catch (error) {
      console.error('Error updating appointment status:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del turno",
        variant: "destructive",
      })
    }
  }

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name} ${patient.dni}`
      .toLowerCase()
      .includes(searchPatient.toLowerCase())
  )

  const selectedServiceData = services.find(s => s.id === selectedService)
  const availableSlotsForDate = availableSlots.filter(slot => slot.available)

  // Extract time from datetime for display
  const availableTimesForDate = availableSlotsForDate.map(slot => {
    const time = new Date(slot.datetime).toTimeString().substring(0, 5)
    return { ...slot, time }
  })

  if (membershipLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando turnos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Turnos</h1>
          <p className="text-gray-600">Administre turnos y citas médicas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Nuevo Turno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Turno</DialogTitle>
              <DialogDescription>
                Complete la información para agendar un nuevo turno
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Patient Selection */}
              <div className="grid gap-2">
                <Label htmlFor="search-patient">Buscar Paciente</Label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search-patient"
                    placeholder="Buscar por nombre o DNI..."
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchPatient && (
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                          selectedPatient === patient.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          setSelectedPatient(patient.id)
                          setSearchPatient(`${patient.first_name} ${patient.last_name} - DNI: ${patient.dni}`)
                        }}
                      >
                        <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                        <div className="text-sm text-gray-600">DNI: {patient.dni}</div>
                        {patient.phone && (
                          <div className="text-sm text-gray-600">Tel: {patient.phone}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Selection */}
              <div className="grid gap-2">
                <Label>Servicio / Profesional</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex flex-col">
                          <span>{service.name}</span>
                          <span className="text-sm text-gray-500">
                            {service.professional.first_name} {service.professional.last_name}
                            {service.room && ` - ${service.room.name}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="grid gap-2">
                <Label>Fecha</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date: Date) => date < new Date() || date > addDays(new Date(), 30)}
                  locale={es}
                  className="rounded-md border"
                />
              </div>

              {/* Time Slot Selection */}
              {selectedServiceData && selectedDate && (
                <div className="grid gap-2">
                  <Label>Horario Disponible</Label>
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {availableTimesForDate.map((slot) => (
                      <Button
                        key={slot.datetime}
                        variant={selectedSlot === slot.time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSlot(slot.time)}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                  {availableTimesForDate.length === 0 && (
                    <p className="text-sm text-gray-500">No hay horarios disponibles para esta fecha</p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="notes">Observaciones (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Observaciones adicionales..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAppointment}>
                Crear Turno
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Turnos</TabsTrigger>
          <TabsTrigger value="calendar">Vista Calendario</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Estado</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los estados</SelectItem>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Calendar
                    mode="single"
                    selected={filterDate}
                    onSelect={setFilterDate}
                    locale={es}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <Label>Profesional</Label>
                  <Select value={filterProfessional} onValueChange={setFilterProfessional}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los profesionales" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los profesionales</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service.professional.id} value={service.professional.id}>
                          {service.professional.first_name} {service.professional.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {appointment.patient.first_name} {appointment.patient.last_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            DNI: {appointment.patient.dni}
                          </span>
                        </div>
                        <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                          {statusLabels[appointment.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {format(parseISO(appointment.scheduled_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HeartHandshakeIcon className="h-4 w-4" />
                          <span>
                            {appointment.professional.first_name} {appointment.professional.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>{appointment.service.name}</span>
                          {appointment.room && (
                            <>
                              <MapPinIcon className="h-4 w-4" />
                              <span>{appointment.room.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Observaciones:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {appointment.status === 'pendiente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAppointmentStatus(appointment.id, 'esperando')}
                        >
                          Check-in
                        </Button>
                      )}
                      {appointment.status === 'esperando' && (
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'llamado')}
                        >
                          Llamar
                        </Button>
                      )}
                      {appointment.status === 'llamado' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateAppointmentStatus(appointment.id, 'en_consulta')}
                        >
                          Ingresó
                        </Button>
                      )}
                      {appointment.status === 'en_consulta' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateAppointmentStatus(appointment.id, 'finalizado')}
                        >
                          Finalizar
                        </Button>
                      )}
                      {(appointment.status === 'pendiente' || appointment.status === 'esperando') && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateAppointmentStatus(appointment.id, 'cancelado')}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {appointments.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay turnos</h3>
                  <p className="text-gray-600">No se encontraron turnos con los filtros aplicados.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Vista Calendario</h3>
              <p className="text-gray-600">La vista calendario estará disponible próximamente.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}