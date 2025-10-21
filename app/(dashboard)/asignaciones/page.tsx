'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useCrudOperation } from '@/hooks/useCrudOperation'
import { useInstitutionContext } from '@/hooks/useInstitutionContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DeleteConfirmation } from '@/components/crud/DeleteConfirmation'
import { useToast } from '@/hooks/use-toast'
import { useRequirePermission } from '@/hooks/use-permissions'
import { CalendarIcon, Plus, Trash2, Building2, UserCheck, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getTodayISO, formatFullName } from '@/lib/supabase/helpers'

interface Professional {
  id: string
  first_name: string
  last_name: string
  speciality: string | null
}

interface Room {
  id: string
  name: string
}

interface Assignment {
  id: string
  professional_id: string
  room_id: string
  institution_id: string
  assignment_date: string
  professional_name?: string
  professional_speciality?: string | null
  room_name?: string
}

export default function AsignacionesPage() {
  const { hasAccess, loading: permissionLoading } = useRequirePermission('/asignaciones')
  const { toast } = useToast()
  const { context, requireContext } = useInstitutionContext()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')

  // Obtener institution_id del contexto
  requireContext()
  const institutionId = context!.institution_id
  const today = getTodayISO()

  // Hook CRUD para asignaciones diarias (solo CREATE y DELETE)
  const {
    items: assignments,
    isLoading,
    isSaving,
    isDeleteDialogOpen,
    itemToDelete: deletingAssignment,
    error,
    openDeleteDialog,
    closeDeleteDialog,
    handleDelete: crudHandleDelete,
    refreshData
  } = useCrudOperation<Assignment>({
    tableName: 'daily_professional_assignment',
    initialFormData: {
      professional_id: '',
      room_id: '',
      institution_id: institutionId,
      assignment_date: today
    },
    selectFields: `
      *,
      professional:professional_id!inner(first_name, last_name, speciality),
      room:room_id!inner(name)
    `,
    filterConditions: {
      institution_id: institutionId,
      assignment_date: today
    },
    transformFn: (item: any) => ({
      ...item,
      professional_name: formatFullName(item.professional?.first_name, item.professional?.last_name),
      professional_speciality: item.professional?.speciality,
      room_name: item.room?.name
    }),
    onSuccess: (operation) => {
      const messages = {
        create: { title: 'Asignación creada', description: 'El profesional ha sido asignado al consultorio.' },
        update: { title: 'Asignación actualizada', description: 'La asignación se ha actualizado correctamente.' },
        delete: { title: 'Asignación eliminada', description: 'La asignación ha sido eliminada correctamente.' }
      }
      toast(messages[operation])
    },
    onError: (operation, error) => {
      toast({
        title: 'Error',
        description: `Error al ${operation === 'create' ? 'crear' : operation === 'delete' ? 'eliminar' : 'actualizar'} la asignación`,
        variant: 'destructive'
      })
    }
  })

  // Cargar profesionales y consultorios al montar
  useEffect(() => {
    fetchProfessionalsAndRooms()
  }, [])

  const fetchProfessionalsAndRooms = async () => {
    try {
      // Profesionales activos
      const { data: profsData, error: profsError } = await supabase
        .from('professional')
        .select('id, first_name, last_name, speciality')
        .eq('institution_id', institutionId)
        .eq('is_active', true)
        .order('last_name')

      if (profsError) throw profsError
      setProfessionals(profsData || [])

      // Consultorios activos
      const { data: roomsData, error: roomsError } = await supabase
        .from('room')
        .select('id, name')
        .eq('institution_id', institutionId)
        .eq('is_active', true)
        .order('name')

      if (roomsError) throw roomsError
      setRooms(roomsData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive'
      })
    }
  }

  const handleAddAssignment = async () => {
    if (!selectedProfessional || !selectedRoom) {
      toast({
        title: 'Error',
        description: 'Selecciona un profesional y un consultorio',
        variant: 'destructive'
      })
      return
    }

    try {
      const { data: authData } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('daily_professional_assignment')
        .insert({
          professional_id: selectedProfessional,
          room_id: selectedRoom,
          institution_id: institutionId,
          assignment_date: today,
          created_by: authData.user?.id
        })

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Error',
            description: 'Este profesional ya tiene una asignación para hoy',
            variant: 'destructive'
          })
        } else {
          throw error
        }
        return
      }

      toast({
        title: 'Asignación creada',
        description: 'El profesional ha sido asignado al consultorio'
      })

      // Limpiar selección
      setSelectedProfessional('')
      setSelectedRoom('')

      // Recargar datos
      refreshData()
    } catch (error) {
      console.error('Error al crear asignación:', error)
      toast({
        title: 'Error',
        description: 'No se pudo crear la asignación',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    await crudHandleDelete()
  }

  // Profesionales que ya están asignados hoy
  const assignedProfessionalIds = assignments.map(a => a.professional_id)
  const availableProfessionals = professionals.filter(p => !assignedProfessionalIds.includes(p.id))

  // Consultorios ocupados hoy
  const occupiedRoomIds = assignments.map(a => a.room_id)

  if (permissionLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Asignaciones del Día</h1>
        <p className="text-muted-foreground">
          Asigna profesionales a consultorios para el día {format(new Date(), "EEEE, dd 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Alert informativo */}
      <Alert>
        <CalendarIcon className="h-4 w-4" />
        <AlertDescription>
          Las asignaciones se hacen por día. Asigna los profesionales antes de cargar turnos.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Formulario de nueva asignación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nueva Asignación
          </CardTitle>
          <CardDescription>
            Asigna un profesional a un consultorio disponible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Profesional</label>
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar profesional" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfessionals.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Todos los profesionales ya están asignados
                    </div>
                  ) : (
                    availableProfessionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {formatFullName(prof.first_name, prof.last_name)}
                        {prof.speciality && ` - ${prof.speciality}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Consultorio</label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar consultorio" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                      {occupiedRoomIds.includes(room.id) && ' (Ocupado)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAddAssignment}
                disabled={!selectedProfessional || !selectedRoom || isSaving}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Asignar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de asignaciones actuales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Asignaciones Actuales ({assignments.length})
          </CardTitle>
          <CardDescription>
            Profesionales asignados a consultorios hoy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay profesionales asignados para hoy
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Usa el formulario de arriba para crear asignaciones
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 text-blue-800 rounded-full p-3">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">
                            {assignment.professional_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {assignment.professional_speciality && (
                              <Badge variant="secondary" className="text-xs">
                                {assignment.professional_speciality}
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">→</span>
                            <Badge className="bg-green-100 text-green-800">
                              <Building2 className="h-3 w-3 mr-1" />
                              {assignment.room_name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(assignment)}
                        className="text-red-600 hover:text-red-700"
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmación de Eliminación */}
      <DeleteConfirmation
        isOpen={isDeleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        itemName={deletingAssignment?.professional_name || ''}
        onConfirm={handleDelete}
        isDeleting={isSaving}
      />
    </div>
  )
}
