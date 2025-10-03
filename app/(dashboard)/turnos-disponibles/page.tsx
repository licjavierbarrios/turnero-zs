'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { generateAvailableSlots, getSlotStatistics, GeneratedSlot } from '@/lib/slotGenerator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Clock, User, Activity, Building, RefreshCw, TrendingUp, Users, CheckCircle, XCircle, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Institution = {
  id: string
  name: string
  zone_name: string
}

type Professional = {
  id: string
  first_name: string
  last_name: string
  speciality: string | null
}

type Service = {
  id: string
  name: string
}

type Room = {
  id: string
  name: string
}

type SlotWithDetails = GeneratedSlot & {
  professional?: Professional
  service?: Service
  room?: Room | null
}

type Patient = {
  id: string
  first_name: string
  last_name: string
  dni: string | null
}

const daysOfWeek = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
]

export default function TurnosDisponiblesPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<string>('')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [availableSlots, setAvailableSlots] = useState<{ [date: string]: SlotWithDetails[] }>({})
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Patient assignment dialog state
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SlotWithDetails | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchPatient, setSearchPatient] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [appointmentNotes, setAppointmentNotes] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchInstitutions()
    fetchPatients()
  }, [])

  useEffect(() => {
    if (selectedInstitution) {
      fetchInstitutionData()
      generateSlots()
    }
  }, [selectedInstitution]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institution')
        .select(`
          id,
          name,
          zone:zone_id!inner(name)
        `)
        .order('name', { ascending: true })

      if (error) throw error
      
      const formattedData = data?.map(item => ({
        id: item.id,
        name: item.name,
        zone_name: item.zone?.[0]?.name || 'Sin zona'
      })) || []
      
      setInstitutions(formattedData)
    } catch (error) {
      console.error('Error fetching institutions:', error)
      setError('Error al cargar las instituciones')
    }
  }

  const fetchInstitutionData = async () => {
    try {
      // Fetch professionals
      const { data: professionalData, error: profError } = await supabase
        .from('professional')
        .select('id, first_name, last_name, speciality')
        .eq('institution_id', selectedInstitution)
        .eq('is_active', true)

      if (profError) throw profError
      setProfessionals(professionalData || [])

      // Fetch services
      const { data: serviceData, error: servError } = await supabase
        .from('service')
        .select('id, name')
        .eq('institution_id', selectedInstitution)
        .eq('is_active', true)

      if (servError) throw servError
      setServices(serviceData || [])

      // Fetch rooms
      const { data: roomData, error: roomError } = await supabase
        .from('room')
        .select('id, name')
        .eq('institution_id', selectedInstitution)
        .eq('is_active', true)

      if (roomError) throw roomError
      setRooms(roomData || [])

    } catch (error) {
      console.error('Error fetching institution data:', error)
      setError('Error al cargar los datos de la institución')
    }
  }

  const generateSlots = async () => {
    if (!selectedInstitution) return

    try {
      setLoading(true)
      setError(null)

      // Generate slots for next 30 days
      const slots = await generateAvailableSlots(selectedInstitution, 30)
      
      // Enrich slots with professional, service, and room details
      const enrichedSlots: { [date: string]: SlotWithDetails[] } = {}
      
      Object.entries(slots).forEach(([date, daySlots]) => {
        enrichedSlots[date] = daySlots.map(slot => {
          const professional = professionals.find(p => p.id === slot.professional_id)
          const service = services.find(s => s.id === slot.service_id)
          const room = slot.room_id ? rooms.find(r => r.id === slot.room_id) : null
          
          return {
            ...slot,
            professional,
            service,
            room
          }
        })
      })
      
      setAvailableSlots(enrichedSlots)
      
      toast({
        title: "Turnos generados",
        description: "Los turnos disponibles han sido generados correctamente.",
      })
      
    } catch (error) {
      console.error('Error generating slots:', error)
      setError('Error al generar los turnos disponibles')
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patient')
        .select('id, first_name, last_name, dni')
        .order('last_name', { ascending: true })

      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const handleOpenAssignDialog = (slot: SlotWithDetails) => {
    setSelectedSlot(slot)
    setSelectedPatient('')
    setAppointmentNotes('')
    setSearchPatient('')
    setIsAssignDialogOpen(true)
  }

  const handleAssignAppointment = async () => {
    if (!selectedSlot || !selectedPatient || !selectedInstitution) {
      toast({
        title: "Error",
        description: "Debe seleccionar un paciente",
        variant: "destructive"
      })
      return
    }

    try {
      setAssigning(true)

      const { error } = await supabase
        .from('appointment')
        .insert({
          patient_id: selectedPatient,
          professional_id: selectedSlot.professional_id,
          service_id: selectedSlot.service_id,
          room_id: selectedSlot.room_id || null,
          institution_id: selectedInstitution,
          scheduled_at: selectedSlot.datetime,
          status: 'pendiente',
          notes: appointmentNotes || null
        })

      if (error) throw error

      toast({
        title: "Turno asignado",
        description: "El turno ha sido asignado correctamente al paciente.",
      })

      setIsAssignDialogOpen(false)
      generateSlots() // Refresh slots
    } catch (error) {
      console.error('Error assigning appointment:', error)
      toast({
        title: "Error",
        description: "Error al asignar el turno. Puede que el horario ya esté ocupado.",
        variant: "destructive"
      })
    } finally {
      setAssigning(false)
    }
  }

  const getSelectedDateSlots = () => {
    const slots = availableSlots[selectedDate] || []

    if (selectedProfessional) {
      return slots.filter(slot => slot.professional_id === selectedProfessional)
    }

    return slots
  }

  const getNext7DaysSlots = () => {
    const next7Days: { [date: string]: SlotWithDetails[] } = {}
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      next7Days[dateStr] = availableSlots[dateStr] || []
    }
    
    return next7Days
  }

  const formatTime = (datetime: string): string => {
    return new Date(datetime).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr)
    return daysOfWeek[date.getDay()]
  }

  const statistics = getSlotStatistics(availableSlots)
  const selectedDateSlots = getSelectedDateSlots()
  const next7DaysSlots = getNext7DaysSlots()

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Turnos Disponibles</h1>
          <p className="text-muted-foreground">
            Generación y visualización de turnos disponibles basados en plantillas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? 'Vista Grid' : 'Vista Lista'}
          </Button>
          <Button onClick={generateSlots} disabled={!selectedInstitution || loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generando...' : 'Regenerar Turnos'}
          </Button>
        </div>
      </div>

      {/* Institution Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Seleccionar Institución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedInstitution} 
            onValueChange={setSelectedInstitution}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Seleccionar institución para generar turnos" />
            </SelectTrigger>
            <SelectContent>
              {institutions.map((institution) => (
                <SelectItem key={institution.id} value={institution.id}>
                  {institution.name} - {institution.zone_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedInstitution && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Turnos</p>
                    <p className="text-2xl font-bold">{statistics.totalSlots}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Disponibles</p>
                    <p className="text-2xl font-bold">{statistics.availableSlots}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ocupados</p>
                    <p className="text-2xl font-bold">{statistics.occupiedSlots}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ocupación</p>
                    <p className="text-2xl font-bold">{statistics.occupancyRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Todos los profesionales" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los profesionales</SelectItem>
                      {professionals.map((professional) => (
                        <SelectItem key={professional.id} value={professional.id}>
                          {professional.first_name} {professional.last_name}
                          {professional.speciality && ` - ${professional.speciality}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card>
              <CardContent className="text-center py-8">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-4" />
                <p>Generando turnos disponibles...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Selected Date View */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    {getDayName(selectedDate)}, {formatDate(selectedDate)}
                  </CardTitle>
                  <CardDescription>
                    {selectedDateSlots.length} turnos disponibles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDateSlots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="mx-auto h-12 w-12 mb-4" />
                      <p>No hay turnos disponibles para esta fecha.</p>
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                      {selectedDateSlots.map((slot, index) => (
                        <div 
                          key={index} 
                          className={`p-3 border rounded-lg ${slot.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{formatTime(slot.datetime)}</span>
                            </div>
                            <Badge 
                              className={slot.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            >
                              {slot.available ? 'Disponible' : 'Ocupado'}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm mb-2">
                            <div className="flex items-center space-x-2">
                              <User className="h-3 w-3" />
                              <span>
                                {slot.professional?.first_name} {slot.professional?.last_name}
                                {slot.professional?.speciality && ` - ${slot.professional.speciality}`}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Activity className="h-3 w-3" />
                              <span>{slot.service?.name}</span>
                            </div>
                            {slot.room && (
                              <div className="flex items-center space-x-2">
                                <Building className="h-3 w-3" />
                                <span>{slot.room.name}</span>
                              </div>
                            )}
                          </div>
                          {slot.available && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenAssignDialog(slot)}
                              className="w-full"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Asignar Turno
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Next 7 Days Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximos 7 Días</CardTitle>
                  <CardDescription>
                    Vista general de turnos disponibles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {Object.entries(next7DaysSlots).map(([date, daySlots]) => {
                      const availableCount = daySlots.filter(slot => slot.available).length
                      const totalCount = daySlots.length
                      
                      return (
                        <div key={date} className="text-center p-3 border rounded-lg">
                          <div className="font-medium text-sm mb-2">
                            {getDayName(date)}
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-green-600">
                              {availableCount}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              de {totalCount} turnos
                            </div>
                            {totalCount > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${(availableCount / totalCount) * 100}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Dialog for assigning appointment */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Turno</DialogTitle>
            <DialogDescription>
              Seleccione el paciente para asignar este turno
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-4">
              {/* Slot details */}
              <div className="p-3 bg-blue-50 rounded-lg space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{formatDate(selectedSlot.datetime.split('T')[0])}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{formatTime(selectedSlot.datetime)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>
                    {selectedSlot.professional?.first_name} {selectedSlot.professional?.last_name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>{selectedSlot.service?.name}</span>
                </div>
                {selectedSlot.room && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>{selectedSlot.room.name}</span>
                  </div>
                )}
              </div>

              {/* Patient search */}
              <div className="space-y-2">
                <Label htmlFor="search-patient">Buscar paciente</Label>
                <Input
                  id="search-patient"
                  placeholder="Buscar por nombre o DNI..."
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                />
              </div>

              {/* Patient selector */}
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente *</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients
                      .filter(patient => {
                        if (!searchPatient) return true
                        const search = searchPatient.toLowerCase()
                        return (
                          patient.first_name.toLowerCase().includes(search) ||
                          patient.last_name.toLowerCase().includes(search) ||
                          patient.dni?.toLowerCase().includes(search)
                        )
                      })
                      .map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.last_name}, {patient.first_name}
                          {patient.dni && ` - DNI: ${patient.dni}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Observaciones adicionales..."
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignDialogOpen(false)}
                  disabled={assigning}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAssignAppointment}
                  disabled={!selectedPatient || assigning}
                >
                  {assigning ? 'Asignando...' : 'Asignar Turno'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}