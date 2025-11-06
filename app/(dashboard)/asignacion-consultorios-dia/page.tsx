'use client'

import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useInstitutionContext } from '@/hooks/useInstitutionContext'
import { useProfessionalRoomAssignment } from '@/hooks/useProfessionalRoomAssignment'
import { Calendar, Plus, Edit, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function AsignacionConsultoriosDiaPage() {
  const { context } = useInstitutionContext()
  const { toast } = useToast()

  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )

  const {
    preferences,
    assignments,
    professionals,
    rooms,
    loading,
    error,
    fetchPreferences,
    fetchAssignments,
    fetchProfessionals,
    fetchRooms,
    createDailyAssignment,
    updateDailyAssignment,
    deleteDailyAssignment,
    savePreference,
    getAssignmentsForRoom
  } = useProfessionalRoomAssignment()

  // Form state
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [isPreferenceDialogOpen, setIsPreferenceDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [editingPreference, setEditingPreference] = useState<any>(null)
  const [deletingAssignment, setDeletingAssignment] = useState<any>(null)

  const [assignmentForm, setAssignmentForm] = useState({
    professional_id: '',
    room_id: '',
    start_time: '',
    end_time: '',
    notes: ''
  })

  const [preferenceForm, setPreferenceForm] = useState({
    professional_id: '',
    room_id: '',
    is_preferred: false,
    notes: ''
  })

  // Load data
  useEffect(() => {
    if (context?.institution_id) {
      Promise.all([
        fetchPreferences(context.institution_id),
        fetchAssignments(context.institution_id, selectedDate),
        fetchProfessionals(context.institution_id),
        fetchRooms(context.institution_id)
      ])
    }
  }, [context?.institution_id, selectedDate, fetchPreferences, fetchAssignments, fetchProfessionals, fetchRooms])

  // Handlers
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!context?.institution_id) return

    try {
      const result = await createDailyAssignment(
        assignmentForm.professional_id,
        assignmentForm.room_id,
        context.institution_id,
        selectedDate,
        assignmentForm.start_time || undefined,
        assignmentForm.end_time || undefined,
        assignmentForm.notes || undefined
      )

      if (result.success) {
        toast({
          title: 'Asignación creada',
          description: 'El profesional ha sido asignado al consultorio'
        })
        setIsAssignmentDialogOpen(false)
        resetAssignmentForm()
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al crear asignación'
      })
    }
  }

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!context?.institution_id || !editingAssignment) return

    try {
      const result = await updateDailyAssignment(
        editingAssignment.id,
        assignmentForm.room_id,
        context.institution_id,
        selectedDate,
        assignmentForm.start_time || undefined,
        assignmentForm.end_time || undefined,
        assignmentForm.notes || undefined
      )

      if (result.success) {
        toast({
          title: 'Asignación actualizada',
          description: 'El consultorio ha sido actualizado'
        })
        setIsAssignmentDialogOpen(false)
        resetAssignmentForm()
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al actualizar asignación'
      })
    }
  }

  const handleDeleteAssignment = async () => {
    if (!context?.institution_id || !deletingAssignment) return

    try {
      const result = await deleteDailyAssignment(
        deletingAssignment.id,
        context.institution_id,
        selectedDate
      )

      if (result.success) {
        toast({
          title: 'Asignación eliminada',
          description: 'La asignación ha sido removida'
        })
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al eliminar asignación'
      })
    } finally {
      setDeletingAssignment(null)
    }
  }

  const handleSavePreference = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!context?.institution_id) return

    try {
      const result = await savePreference(
        preferenceForm.professional_id,
        context.institution_id,
        preferenceForm.room_id || null,
        preferenceForm.is_preferred,
        preferenceForm.notes || undefined
      )

      if (result.success) {
        toast({
          title: 'Preferencia guardada',
          description: 'La preferencia de consultorio ha sido actualizada'
        })
        setIsPreferenceDialogOpen(false)
        resetPreferenceForm()
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al guardar preferencia'
      })
    }
  }

  const openEditDialog = (assignment: any) => {
    setEditingAssignment(assignment)
    setAssignmentForm({
      professional_id: assignment.professional_id,
      room_id: assignment.room_id,
      start_time: assignment.start_time || '',
      end_time: assignment.end_time || '',
      notes: assignment.assignment_notes || ''
    })
    setIsAssignmentDialogOpen(true)
  }

  const openPreferenceDialog = (professionalId: string) => {
    const pref = preferences.find(p => p.professional_id === professionalId)
    setEditingPreference(pref)
    setPreferenceForm({
      professional_id: professionalId,
      room_id: pref?.room_id || '',
      is_preferred: pref?.is_preferred || false,
      notes: pref?.notes || ''
    })
    setIsPreferenceDialogOpen(true)
  }

  const resetAssignmentForm = () => {
    setAssignmentForm({
      professional_id: '',
      room_id: '',
      start_time: '',
      end_time: '',
      notes: ''
    })
    setEditingAssignment(null)
  }

  const resetPreferenceForm = () => {
    setPreferenceForm({
      professional_id: '',
      room_id: '',
      is_preferred: false,
      notes: ''
    })
    setEditingPreference(null)
  }

  const getProfessionalName = (id: string) => {
    const prof = professionals.find(p => p.id === id)
    return prof ? `${prof.first_name} ${prof.last_name}` : 'Desconocido'
  }

  if (!context) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Debe seleccionar una institución primero
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Asignación de Consultorios</h1>
        <p className="text-muted-foreground">
          Asigna profesionales a consultorios para {context.institution_name}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Selector de Fecha */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Seleccionar Fecha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="outline"
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
            >
              Mañana
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Fecha seleccionada: {format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: es })}
          </p>
        </CardContent>
      </Card>

      {/* Secciones por Consultorio */}
      <div className="grid gap-6 mb-6">
        {rooms.map((room) => {
          const roomAssignments = getAssignmentsForRoom(room.id, selectedDate)
          const isOccupied = roomAssignments.length > 0

          return (
            <Card key={room.id} className={isOccupied ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>{room.name}</CardTitle>
                    {isOccupied ? (
                      <Badge className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Ocupado
                      </Badge>
                    ) : (
                      <Badge variant="outline">Disponible</Badge>
                    )}
                  </div>
                  <Dialog
                    open={isAssignmentDialogOpen && !editingAssignment}
                    onOpenChange={(open) => {
                      if (!open) {
                        resetAssignmentForm()
                      }
                      setIsAssignmentDialogOpen(open)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => {
                          resetAssignmentForm()
                          setAssignmentForm(prev => ({ ...prev, room_id: room.id }))
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Asignar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Asignar Profesional a {room.name}</DialogTitle>
                        <DialogDescription>
                          Selecciona un profesional para este consultorio
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateAssignment} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Profesional *</Label>
                          <Select
                            value={assignmentForm.professional_id}
                            onValueChange={(value) =>
                              setAssignmentForm(prev => ({ ...prev, professional_id: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar profesional" />
                            </SelectTrigger>
                            <SelectContent>
                              {professionals.map((prof) => (
                                <SelectItem key={prof.id} value={prof.id}>
                                  {prof.first_name} {prof.last_name}
                                  {prof.speciality && ` - ${prof.speciality}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start_time">Hora Inicio</Label>
                            <Input
                              id="start_time"
                              type="time"
                              value={assignmentForm.start_time}
                              onChange={(e) =>
                                setAssignmentForm(prev => ({ ...prev, start_time: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="end_time">Hora Fin</Label>
                            <Input
                              id="end_time"
                              type="time"
                              value={assignmentForm.end_time}
                              onChange={(e) =>
                                setAssignmentForm(prev => ({ ...prev, end_time: e.target.value }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Notas</Label>
                          <Input
                            id="notes"
                            placeholder="Ej: Asignación especial por evento"
                            value={assignmentForm.notes}
                            onChange={(e) =>
                              setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))
                            }
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAssignmentDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={!assignmentForm.professional_id}>
                            Asignar
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {roomAssignments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Sin asignaciones para esta fecha
                  </p>
                ) : (
                  <div className="space-y-3">
                    {roomAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">
                            {assignment.professional?.first_name} {assignment.professional?.last_name}
                          </p>
                          {assignment.professional?.speciality && (
                            <p className="text-sm text-muted-foreground">
                              {assignment.professional.speciality}
                            </p>
                          )}
                          {(assignment.start_time || assignment.end_time) && (
                            <p className="text-sm text-muted-foreground flex items-center mt-1">
                              <Clock className="mr-1 h-3 w-3" />
                              {assignment.start_time} - {assignment.end_time}
                            </p>
                          )}
                          {assignment.assignment_notes && (
                            <p className="text-sm text-amber-700 mt-1">
                              📝 {assignment.assignment_notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(assignment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingAssignment(assignment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sección de Preferencias */}
      <Card>
        <CardHeader>
          <CardTitle>Preferencias de Consultorios</CardTitle>
          <CardDescription>
            Gestiona los consultorios habituales de los profesionales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {professionals.map((prof) => {
              const pref = preferences.find(p => p.professional_id === prof.id)
              return (
                <div
                  key={prof.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {prof.first_name} {prof.last_name}
                    </p>
                    {pref?.room ? (
                      <p className="text-sm text-green-700">
                        ✓ Consultorio habitual: {pref.room.name}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sin consultorio preferente
                      </p>
                    )}
                    {pref?.notes && (
                      <p className="text-sm text-muted-foreground">
                        {pref.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPreferenceDialog(prof.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Preferencias */}
      <Dialog open={isPreferenceDialogOpen} onOpenChange={setIsPreferenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Preferencia de Consultorio - {getProfessionalName(preferenceForm.professional_id)}
            </DialogTitle>
            <DialogDescription>
              Define el consultorio habitual para este profesional
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePreference} className="space-y-4">
            <div className="space-y-2">
              <Label>Consultorio Preferente</Label>
              <Select
                value={preferenceForm.room_id}
                onValueChange={(value) =>
                  setPreferenceForm(prev => ({ ...prev, room_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin consultorio preferente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin preferencia</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_preferred"
                checked={preferenceForm.is_preferred}
                onChange={(e) =>
                  setPreferenceForm(prev => ({ ...prev, is_preferred: e.target.checked }))
                }
              />
              <Label htmlFor="is_preferred">
                Este es su consultorio habitual
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pref_notes">Notas</Label>
              <Input
                id="pref_notes"
                placeholder="Ej: Equipos de cardiología"
                value={preferenceForm.notes}
                onChange={(e) =>
                  setPreferenceForm(prev => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreferenceDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Guardar Preferencia
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAssignment} onOpenChange={() => setDeletingAssignment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar asignación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta asignación?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
