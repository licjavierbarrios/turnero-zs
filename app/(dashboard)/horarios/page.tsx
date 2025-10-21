'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useCrudOperation } from '@/hooks/useCrudOperation'
import { useToggleState } from '@/hooks/useToggleState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CrudDialog } from '@/components/crud/CrudDialog'
import { DeleteConfirmation } from '@/components/crud/DeleteConfirmation'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Calendar, Clock, User, Activity, DoorOpen } from 'lucide-react'
import { formatFullName } from '@/lib/supabase/helpers'

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
  professional_name?: string
  institution_name?: string
  service_name?: string
  room_name?: string | null
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
  const { toast } = useToast()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<string>('')

  // Hook CRUD para slot_template
  const {
    items: slotTemplates,
    formData,
    isLoading,
    isSaving,
    isDialogOpen,
    isDeleteDialogOpen,
    editingItem: editingSlotTemplate,
    itemToDelete: deletingTemplate,
    error,
    updateFormField,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    openDeleteDialog,
    closeDeleteDialog,
    handleSubmit: crudHandleSubmit,
    handleDelete: crudHandleDelete,
    refreshData
  } = useCrudOperation<SlotTemplate>({
    tableName: 'slot_template',
    initialFormData: {
      professional_id: '',
      service_id: '',
      room_id: '',
      day_of_week: 1,
      start_time: '08:00',
      end_time: '17:00',
      slot_duration_minutes: 30,
      is_active: true
    },
    selectFields: `
      *,
      professional:professional_id!inner(id, first_name, last_name, institution:institution_id!inner(name)),
      service:service_id!inner(id, name),
      room:room_id(id, name)
    `,
    transformFn: (item: any) => ({
      ...item,
      professional_name: item.professional
        ? formatFullName(item.professional.first_name, item.professional.last_name)
        : undefined,
      institution_name: item.professional?.institution?.name || 'Sin institución',
      service_name: item.service?.name || 'Sin servicio',
      room_name: item.room?.name || null
    }),
    onSuccess: (operation) => {
      const messages = {
        create: { title: 'Plantilla creada', description: 'La plantilla de horario se ha creado correctamente.' },
        update: { title: 'Plantilla actualizada', description: 'La plantilla de horario se ha actualizado correctamente.' },
        delete: { title: 'Plantilla eliminada', description: 'La plantilla de horario se ha eliminado correctamente.' }
      }
      toast(messages[operation])
    },
    onError: (operation, error) => {
      toast({
        title: 'Error',
        description: `Error al ${operation === 'create' ? 'crear' : operation === 'update' ? 'actualizar' : 'eliminar'} la plantilla`,
        variant: 'destructive'
      })
    }
  })

  // Hook para toggle de is_active
  const { toggle: toggleActive, isToggling } = useToggleState({
    tableName: 'slot_template',
    fieldName: 'is_active',
    onSuccess: (id, newValue) => {
      toast({
        title: newValue ? 'Plantilla activada' : 'Plantilla desactivada',
        description: `La plantilla ha sido ${newValue ? 'activada' : 'desactivada'} correctamente.`
      })
      refreshData()
    }
  })

  // Cargar datos relacionados al montar
  useEffect(() => {
    fetchProfessionals()
  }, [])

  // Cuando cambia el profesional, cargar servicios y consultorios de su institución
  useEffect(() => {
    if (formData.professional_id) {
      const professional = professionals.find(p => p.id === formData.professional_id)
      if (professional) {
        setSelectedInstitution(professional.institution_id)
        fetchServicesForInstitution(professional.institution_id)
        fetchRoomsForInstitution(professional.institution_id)
      }
    } else {
      setSelectedInstitution('')
      setServices([])
      setRooms([])
    }
  }, [formData.professional_id, professionals])

  const fetchProfessionals = async () => {
    try {
      const { data: professionalsData, error: profError } = await supabase
        .from('professional')
        .select('id, first_name, last_name, institution_id')
        .eq('is_active', true)
        .order('last_name', { ascending: true })

      if (profError) throw profError

      const { data: institutionsData, error: instError } = await supabase
        .from('institution')
        .select('id, name, zone:zone_id!inner(name)')

      if (instError) throw instError

      const formattedData = professionalsData?.map((prof: any) => {
        const institution = institutionsData?.find((inst: any) => inst.id === prof.institution_id)
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

  // Cuando cambia el servicio seleccionado, actualizar la duración
  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    updateFormField('service_id', serviceId)
    if (service) {
      updateFormField('slot_duration_minutes', service.duration_minutes)
    }
  }

  // Wrappers para los handlers
  const handleSubmit = async () => {
    await crudHandleSubmit()
  }

  const handleDelete = async () => {
    await crudHandleDelete()
  }

  const handleToggleActive = async (template: SlotTemplate) => {
    await toggleActive(template.id, template.is_active)
  }

  // Helpers
  const formatTime = (time: string): string => {
    return time.substring(0, 5)
  }

  const calculateSlots = (startTime: string, endTime: string, duration: number): number => {
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    return Math.floor(diffMinutes / duration)
  }

  // Agrupar plantillas por profesional
  const templatesByProfessional = slotTemplates.reduce((acc, template) => {
    if (!template.professional_name || !template.institution_name) return acc

    const professionalKey = `${template.professional_name} - ${template.institution_name}`
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
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Plantilla
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
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
                            {template.service_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {template.room_name ? (
                            <div className="flex items-center">
                              <DoorOpen className="mr-2 h-4 w-4 text-purple-600" />
                              {template.room_name}
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
                              disabled={isToggling[template.id]}
                            >
                              <Calendar className={`h-4 w-4 ${template.is_active ? 'text-red-600' : 'text-green-600'}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(template)}
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

      {/* Dialog de Creación/Edición */}
      <CrudDialog
        isOpen={isDialogOpen}
        onOpenChange={closeDialog}
        title={editingSlotTemplate ? 'Editar Plantilla de Horario' : 'Nueva Plantilla de Horario'}
        description={
          editingSlotTemplate
            ? 'Modifica la plantilla de horario'
            : 'Crea una nueva plantilla de horario semanal'
        }
        editingItem={editingSlotTemplate}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        size="2xl"
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slot_professional_id">Profesional *</Label>
            <Select
              value={formData.professional_id || ''}
              onValueChange={(value) => {
                updateFormField('professional_id', value)
                updateFormField('service_id', '')
                updateFormField('room_id', '')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar profesional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((professional) => (
                  <SelectItem key={professional.id} value={professional.id}>
                    {formatFullName(professional.first_name, professional.last_name)} - {professional.institution_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slot_service_id">Servicio *</Label>
              <Select
                value={formData.service_id || ''}
                onValueChange={handleServiceChange}
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
                value={formData.room_id || ''}
                onValueChange={(value) => updateFormField('room_id', value)}
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
              value={formData.day_of_week?.toString() || '1'}
              onValueChange={(value) => updateFormField('day_of_week', parseInt(value))}
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
                value={formData.start_time || '08:00'}
                onChange={(e) => updateFormField('start_time', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot_end_time">Hora de fin *</Label>
              <Input
                id="slot_end_time"
                type="time"
                value={formData.end_time || '17:00'}
                onChange={(e) => updateFormField('end_time', e.target.value)}
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
                value={formData.slot_duration_minutes || 30}
                onChange={(e) => updateFormField('slot_duration_minutes', parseInt(e.target.value) || 30)}
                required
              />
            </div>
          </div>

          {formData.start_time && formData.end_time && formData.slot_duration_minutes && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <Clock className="inline mr-1 h-4 w-4" />
                Esta plantilla generará aproximadamente{' '}
                <strong>{calculateSlots(formData.start_time, formData.end_time, formData.slot_duration_minutes)} turnos</strong>
                {' '}por día
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="slot_is_active"
              checked={formData.is_active || false}
              onChange={(e) => updateFormField('is_active', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="slot_is_active">Plantilla activa</Label>
          </div>
        </div>
      </CrudDialog>

      {/* Dialog de Confirmación de Eliminación */}
      <DeleteConfirmation
        isOpen={isDeleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        itemName={
          deletingTemplate
            ? `${deletingTemplate.professional_name} - ${daysOfWeek.find(d => d.value === deletingTemplate.day_of_week)?.label}`
            : ''
        }
        onConfirm={handleDelete}
        isDeleting={isSaving}
      />
    </div>
  )
}
