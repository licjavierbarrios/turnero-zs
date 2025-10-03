'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Calendar, Clock, User, Activity, Building, DoorOpen } from 'lucide-react'

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
  created_at: string
  updated_at: string
  professional?: {
    id: string
    first_name: string
    last_name: string
    institution: {
      name: string
      zone_name: string
    }
  }
  service?: {
    id: string
    name: string
  }
  room?: {
    id: string
    name: string
  } | null
}

type Professional = {
  id: string
  first_name: string
  last_name: string
  institution_id: string
  institution_name: string
  zone_name: string
}

type Service = {
  id: string
  name: string
  institution_id: string
  duration_minutes: number
}

type Room = {
  id: string
  name: string
  institution_id: string
}

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
]

export default function HorariosPage() {
  const [slotTemplates, setSlotTemplates] = useState<SlotTemplate[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSlotTemplate, setEditingSlotTemplate] = useState<SlotTemplate | null>(null)
  const [formData, setFormData] = useState({
    professional_id: '',
    service_id: '',
    room_id: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '17:00',
    slot_duration_minutes: 30,
    is_active: true
  })
  const [error, setError] = useState<string | null>(null)
  const [selectedInstitution, setSelectedInstitution] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([fetchSlotTemplates(), fetchProfessionals()])
  }, [])

  useEffect(() => {
    if (formData.professional_id) {
      const professional = professionals.find(p => p.id === formData.professional_id)
      if (professional) {
        fetchServicesForInstitution(professional.institution_id)
        fetchRoomsForInstitution(professional.institution_id)
        setSelectedInstitution(professional.institution_id)
      }
    }
  }, [formData.professional_id, professionals])

  const fetchSlotTemplates = async () => {
    try {
      setLoading(true)
      // Get slot templates first
      const { data: templatesData, error: templatesError } = await supabase
        .from('slot_template')
        .select('*')
        .order('professional_id', { ascending: true })
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })

      if (templatesError) throw templatesError

      // Get related data
      const { data: professionalsData, error: profError } = await supabase
        .from('professional')
        .select(`
          id,
          first_name,
          last_name,
          institution_id
        `)

      const { data: institutionsData, error: instError } = await supabase
        .from('institution')
        .select(`
          id,
          name,
          zone:zone_id!inner(
            name
          )
        `)

      const { data: servicesData, error: servError } = await supabase
        .from('service')
        .select('id, name')

      const { data: roomsData, error: roomsError } = await supabase
        .from('room')
        .select('id, name')

      if (profError || instError || servError || roomsError) {
        throw profError || instError || servError || roomsError
      }
      
      const formattedData = templatesData?.map(template => {
        const professional = professionalsData?.find(p => p.id === template.professional_id)
        const institution = professional ? institutionsData?.find(i => i.id === professional.institution_id) : undefined
        const service = servicesData?.find(s => s.id === template.service_id)
        const room = roomsData?.find(r => r.id === template.room_id)
        
        return {
          ...template,
          professional: professional ? {
            id: professional.id,
            first_name: professional.first_name,
            last_name: professional.last_name,
            institution: {
              name: institution?.name || 'Sin institución',
              zone_name: institution?.zone?.[0]?.name || 'Sin zona'
            }
          } : undefined,
          service: service ? {
            id: service.id,
            name: service.name
          } : undefined,
          room: room ? {
            id: room.id,
            name: room.name
          } : null
        }
      }) || []
      
      setSlotTemplates(formattedData)
    } catch (error) {
      console.error('Error fetching slot templates:', error)
      setError('Error al cargar las plantillas de horarios')
    } finally {
      setLoading(false)
    }
  }

  const fetchProfessionals = async () => {
    try {
      // First get professionals
      const { data: professionalsData, error: profError } = await supabase
        .from('professional')
        .select('id, first_name, last_name, institution_id')
        .eq('is_active', true)
        .order('last_name', { ascending: true })

      if (profError) throw profError

      // Then get institutions with zones
      const { data: institutionsData, error: instError } = await supabase
        .from('institution')
        .select(`
          id,
          name,
          zone:zone_id!inner(
            name
          )
        `)

      if (instError) throw instError
      
      const formattedData = professionalsData?.map(prof => {
        const institution = institutionsData?.find(inst => inst.id === prof.institution_id)
        return {
          id: prof.id,
          first_name: prof.first_name,
          last_name: prof.last_name,
          institution_id: prof.institution_id,
          institution_name: institution?.name || 'Sin institución',
          zone_name: institution?.zone?.[0]?.name || 'Sin zona'
        }
      }) || []
      
      setProfessionals(formattedData)
    } catch (error) {
      console.error('Error fetching professionals:', error)
    }
  }

  const fetchServicesForInstitution = async (institutionId: string) => {
    try {
      const { data, error } = await supabase
        .from('service')
        .select('id, name, institution_id, duration_minutes')
        .eq('institution_id', institutionId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchRoomsForInstitution = async (institutionId: string) => {
    try {
      const { data, error } = await supabase
        .from('room')
        .select('id, name, institution_id')
        .eq('institution_id', institutionId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setRooms(data || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (editingSlotTemplate) {
        // Update existing slot template
        const { error } = await supabase
          .from('slot_template')
          .update({
            professional_id: formData.professional_id,
            service_id: formData.service_id,
            room_id: formData.room_id || null,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            slot_duration_minutes: formData.slot_duration_minutes,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSlotTemplate.id)

        if (error) throw error
        
        toast({
          title: "Plantilla de horario actualizada",
          description: "La plantilla de horario se ha actualizado correctamente.",
        })
      } else {
        // Create new slot template
        const { error } = await supabase
          .from('slot_template')
          .insert({
            professional_id: formData.professional_id,
            service_id: formData.service_id,
            room_id: formData.room_id || null,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            slot_duration_minutes: formData.slot_duration_minutes,
            is_active: formData.is_active
          })

        if (error) throw error
        
        toast({
          title: "Plantilla de horario creada",
          description: "La plantilla de horario se ha creado correctamente.",
        })
      }

      setIsDialogOpen(false)
      setEditingSlotTemplate(null)
      resetForm()
      fetchSlotTemplates()
    } catch (error) {
      console.error('Error saving slot template:', error)
      setError(`Error al ${editingSlotTemplate ? 'actualizar' : 'crear'} la plantilla de horario`)
    }
  }

  const handleEdit = (slotTemplate: SlotTemplate) => {
    setEditingSlotTemplate(slotTemplate)
    setFormData({
      professional_id: slotTemplate.professional_id,
      service_id: slotTemplate.service_id,
      room_id: slotTemplate.room_id || '',
      day_of_week: slotTemplate.day_of_week,
      start_time: slotTemplate.start_time,
      end_time: slotTemplate.end_time,
      slot_duration_minutes: slotTemplate.slot_duration_minutes,
      is_active: slotTemplate.is_active
    })
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (slotTemplate: SlotTemplate) => {
    try {
      const { error } = await supabase
        .from('slot_template')
        .update({
          is_active: !slotTemplate.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', slotTemplate.id)

      if (error) throw error
      
      toast({
        title: slotTemplate.is_active ? "Plantilla desactivada" : "Plantilla activada",
        description: `La plantilla ha sido ${slotTemplate.is_active ? 'desactivada' : 'activada'} correctamente.`,
      })
      
      fetchSlotTemplates()
    } catch (error) {
      console.error('Error toggling slot template status:', error)
      setError('Error al cambiar el estado de la plantilla')
    }
  }

  const handleDelete = async (slotTemplate: SlotTemplate) => {
    const professional = slotTemplate.professional
    const dayName = daysOfWeek.find(d => d.value === slotTemplate.day_of_week)?.label
    
    if (!confirm(`¿Estás seguro de que deseas eliminar la plantilla de horario de ${professional?.first_name} ${professional?.last_name} para el ${dayName}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('slot_template')
        .delete()
        .eq('id', slotTemplate.id)

      if (error) throw error
      
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla de horario se ha eliminado correctamente.",
      })
      
      fetchSlotTemplates()
    } catch (error) {
      console.error('Error deleting slot template:', error)
      setError('Error al eliminar la plantilla')
    }
  }

  const resetForm = () => {
    setFormData({ 
      professional_id: '',
      service_id: '',
      room_id: '',
      day_of_week: 1,
      start_time: '08:00',
      end_time: '17:00',
      slot_duration_minutes: 30,
      is_active: true
    })
    setEditingSlotTemplate(null)
    setSelectedInstitution('')
    setServices([])
    setRooms([])
    setError(null)
  }

  const formatTime = (time: string): string => {
    return time.substring(0, 5) // Remove seconds if present
  }

  const calculateSlots = (startTime: string, endTime: string, duration: number): number => {
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    return Math.floor(diffMinutes / duration)
  }

  // Group slot templates by professional
  const templatesByProfessional = slotTemplates.reduce((acc, template) => {
    if (!template.professional) return acc
    
    const professionalKey = `${template.professional.first_name} ${template.professional.last_name} - ${template.professional.institution.name}`
    if (!acc[professionalKey]) {
      acc[professionalKey] = []
    }
    acc[professionalKey].push(template)
    return acc
  }, {} as Record<string, SlotTemplate[]>)

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Horarios</h1>
          <p className="text-muted-foreground">
            Administra las plantillas de horarios de los profesionales
          </p>
        </div>
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSlotTemplate ? 'Editar Plantilla de Horario' : 'Nueva Plantilla de Horario'}
              </DialogTitle>
              <DialogDescription>
                {editingSlotTemplate 
                  ? 'Modifica la plantilla de horario' 
                  : 'Crea una nueva plantilla de horario semanal'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="slot_professional_id">Profesional *</Label>
                <Select 
                  value={formData.professional_id} 
                  onValueChange={(value) => setFormData({ ...formData, professional_id: value, service_id: '', room_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar profesional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.first_name} {professional.last_name} - {professional.institution_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slot_service_id">Servicio *</Label>
                  <Select 
                    value={formData.service_id} 
                    onValueChange={(value) => {
                      const service = services.find(s => s.id === value)
                      setFormData({ 
                        ...formData, 
                        service_id: value,
                        slot_duration_minutes: service?.duration_minutes || 30
                      })
                    }}
                    disabled={!selectedInstitution}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.duration_minutes} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slot_room_id">Consultorio (opcional)</Label>
                  <Select 
                    value={formData.room_id} 
                    onValueChange={(value) => setFormData({ ...formData, room_id: value })}
                    disabled={!selectedInstitution}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar consultorio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin consultorio asignado</SelectItem>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slot_day_of_week">Día de la semana *</Label>
                <Select 
                  value={formData.day_of_week.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar día" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slot_start_time">Hora de inicio *</Label>
                  <Input
                    id="slot_start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slot_end_time">Hora de fin *</Label>
                  <Input
                    id="slot_end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slot_duration_minutes">Duración turno (min) *</Label>
                  <Input
                    id="slot_duration_minutes"
                    type="number"
                    min="5"
                    max="240"
                    step="5"
                    value={formData.slot_duration_minutes}
                    onChange={(e) => setFormData({ ...formData, slot_duration_minutes: parseInt(e.target.value) || 30 })}
                    required
                  />
                </div>
              </div>

              {formData.start_time && formData.end_time && formData.slot_duration_minutes && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Clock className="inline mr-1 h-4 w-4" />
                    Esta plantilla generará aproximadamente {' '}
                    <strong>{calculateSlots(formData.start_time, formData.end_time, formData.slot_duration_minutes)} turnos</strong>
                    {' '} por día
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="slot_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="slot_is_active">Plantilla activa</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSlotTemplate ? 'Actualizar' : 'Crear'} Plantilla
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p>Cargando plantillas de horarios...</p>
        </div>
      ) : slotTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-muted-foreground">
              No hay plantillas de horarios registradas. Crea la primera plantilla.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(templatesByProfessional).map(([professionalName, professionalTemplates]) => (
            <Card key={professionalName}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  {professionalName}
                </CardTitle>
                <CardDescription>
                  {professionalTemplates.length} plantilla{professionalTemplates.length !== 1 ? 's' : ''} de horario{professionalTemplates.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Día</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Consultorio</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Turnos/día</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {professionalTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                            {daysOfWeek.find(d => d.value === template.day_of_week)?.label}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Activity className="mr-2 h-4 w-4 text-green-600" />
                            {template.service?.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {template.room ? (
                            <div className="flex items-center">
                              <DoorOpen className="mr-2 h-4 w-4 text-purple-600" />
                              {template.room.name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin consultorio</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatTime(template.start_time)} - {formatTime(template.end_time)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {template.slot_duration_minutes} min
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {calculateSlots(template.start_time, template.end_time, template.slot_duration_minutes)} turnos
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={template.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {template.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(template)}
                              title={template.is_active ? 'Desactivar' : 'Activar'}
                            >
                              {template.is_active ? (
                                <Calendar className="h-4 w-4 text-red-600" />
                              ) : (
                                <Calendar className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(template)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}