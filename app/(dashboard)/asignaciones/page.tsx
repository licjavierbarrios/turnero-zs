'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useCrudOperation } from '@/hooks/useCrudOperation'
import { useInstitutionContext } from '@/hooks/useInstitutionContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DeleteConfirmation } from '@/components/crud/DeleteConfirmation'
import { useToast } from '@/hooks/use-toast'
import { useRequirePermission } from '@/hooks/use-permissions'
import { CalendarIcon, Plus, Trash2, Building2, UserCheck, CheckCircle2, ClockIcon, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getTodayISO, formatFullName } from '@/lib/supabase/helpers'
import { AssignmentForm } from './components/AssignmentForm'
import { TimeInput } from './components/TimeInput'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'

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
  start_time?: string | null
  end_time?: string | null
  professional_name?: string
  professional_speciality?: string | null
  room_name?: string
}

export default function AsignacionesPage() {
  const { hasAccess, loading: permissionLoading } = useRequirePermission('/asignaciones')
  const { toast } = useToast()
  const { context, requireContext } = useInstitutionContext()

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

  // ── Estado de edición ──────────────────────────────────────────────────────
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [editStartHH, setEditStartHH] = useState('')
  const [editStartMM, setEditStartMM] = useState('')
  const [editEndHH, setEditEndHH] = useState('')
  const [editEndMM, setEditEndMM] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const openEditDialog = (assignment: Assignment) => {
    const [sHH = '', sMM = ''] = (assignment.start_time ?? '').slice(0, 5).split(':')
    const [eHH = '', eMM = ''] = (assignment.end_time ?? '').slice(0, 5).split(':')
    setEditStartHH(sHH)
    setEditStartMM(sMM)
    setEditEndHH(eHH)
    setEditEndMM(eMM)
    setEditingAssignment(assignment)
  }

  const handleEditStartHH = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2)
    if (clean && parseInt(clean) > 23) return
    setEditStartHH(clean)
    if (clean.length === 2 && !editStartMM) setEditStartMM('00')
  }
  const handleEditStartMM = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2)
    if (clean && parseInt(clean) > 59) return
    setEditStartMM(clean)
  }
  const handleEditEndHH = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2)
    if (clean && parseInt(clean) > 23) return
    setEditEndHH(clean)
    if (clean.length === 2 && !editEndMM) setEditEndMM('00')
  }
  const handleEditEndMM = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2)
    if (clean && parseInt(clean) > 59) return
    setEditEndMM(clean)
  }

  const handleSaveEdit = async () => {
    if (!editingAssignment) return
    const startTime = `${editStartHH}:${editStartMM}`
    const endTime   = `${editEndHH}:${editEndMM}`
    if (startTime >= endTime) return

    setIsSavingEdit(true)
    try {
      const { error } = await supabase
        .from('daily_professional_assignment')
        .update({ start_time: startTime, end_time: endTime })
        .eq('id', editingAssignment.id)
      if (error) throw error
      toast({ title: 'Horario actualizado' })
      setEditingAssignment(null)
      refreshData()
    } catch {
      toast({ title: 'Error al actualizar el horario', variant: 'destructive' })
    } finally {
      setIsSavingEdit(false)
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  const handleAddAssignment = async (professionalId: string, roomId: string, startTime: string, endTime: string) => {
    try {
      const { error } = await supabase
        .from('daily_professional_assignment')
        .insert({
          professional_id: professionalId,
          room_id: roomId,
          institution_id: institutionId,
          assignment_date: today,
          start_time: startTime,
          end_time: endTime
        })

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Error',
            description: 'Este profesional ya tiene una asignación en ese horario',
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

  // Consultorios ocupados hoy (para marcarlos visualmente)
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
          <AssignmentForm
            institutionId={institutionId}
            occupiedRoomIds={occupiedRoomIds}
            onSubmit={handleAddAssignment}
            isLoading={isSaving}
          />
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
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                            {assignment.start_time && assignment.end_time && (
                              <Badge variant="outline" className="text-xs">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {assignment.start_time.slice(0, 5)} - {assignment.end_time.slice(0, 5)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(assignment)}
                          title="Editar horario"
                          disabled={isSaving}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(assignment)}
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar asignación"
                          disabled={isSaving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edición de horario */}
      <Dialog open={!!editingAssignment} onOpenChange={(open) => { if (!open) setEditingAssignment(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar horario</DialogTitle>
            <DialogDescription>
              {editingAssignment?.professional_name} — {editingAssignment?.room_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="space-y-1.5 flex-1">
                <label className="text-sm font-medium">Desde</label>
                <TimeInput
                  hh={editStartHH}
                  mm={editStartMM}
                  onChangeHH={handleEditStartHH}
                  onChangeMM={handleEditStartMM}
                  disabled={isSavingEdit}
                />
              </div>
              <span className="text-muted-foreground mt-6">a</span>
              <div className="space-y-1.5 flex-1">
                <label className="text-sm font-medium">Hasta</label>
                <TimeInput
                  hh={editEndHH}
                  mm={editEndMM}
                  onChangeHH={handleEditEndHH}
                  onChangeMM={handleEditEndMM}
                  disabled={isSavingEdit}
                />
              </div>
            </div>
            {editStartHH && editStartMM && editEndHH && editEndMM &&
              `${editStartHH}:${editStartMM}` >= `${editEndHH}:${editEndMM}` && (
              <p className="text-xs text-red-600">La hora de fin debe ser mayor que la de inicio</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditingAssignment(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={
                  isSavingEdit ||
                  editStartHH.length < 2 || editStartMM.length < 2 ||
                  editEndHH.length < 2 || editEndMM.length < 2 ||
                  `${editStartHH}:${editStartMM}` >= `${editEndHH}:${editEndMM}`
                }
              >
                {isSavingEdit ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
