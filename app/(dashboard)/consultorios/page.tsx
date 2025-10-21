'use client'

import { useCrudOperation } from '@/hooks/useCrudOperation'
import { useToggleState } from '@/hooks/useToggleState'
import { useInstitutionContext } from '@/hooks/useInstitutionContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CrudDialog } from '@/components/crud/CrudDialog'
import { DeleteConfirmation } from '@/components/crud/DeleteConfirmation'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, DoorOpen, DoorClosed, Building } from 'lucide-react'
import { formatDate } from '@/lib/supabase/helpers'

type Room = {
  id: string
  institution_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  institution?: {
    id: string
    name: string
    zone_name: string
  }
}

export default function ConsultoriosPage() {
  const { toast } = useToast()
  const { context, requireContext } = useInstitutionContext()

  // Obtener institution_id del contexto
  requireContext()
  const institutionId = context!.institution_id

  // Hook CRUD para consultorios
  const {
    items: rooms,
    formData,
    isLoading,
    isSaving,
    isDialogOpen,
    isDeleteDialogOpen,
    editingItem: editingRoom,
    itemToDelete: deletingRoom,
    error,
    updateFormField,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    openDeleteDialog,
    closeDeleteDialog,
    handleSubmit: crudHandleSubmit,
    handleDelete: crudHandleDelete
  } = useCrudOperation<Room>({
    tableName: 'room',
    initialFormData: {
      name: '',
      institution_id: institutionId,
      description: '',
      is_active: true
    },
    selectFields: `
      *,
      institution:institution_id!inner (
        id,
        name,
        zone_name:zone!inner(name)
      )
    `,
    filterConditions: { institution_id: institutionId },
    transformFn: (item: any) => ({
      ...item,
      institution: item.institution ? {
        id: item.institution.id,
        name: item.institution.name,
        zone_name: item.institution.zone_name?.[0]?.name || 'Sin zona'
      } : undefined
    }),
    onSuccess: (operation) => {
      const messages = {
        create: { title: 'Consultorio creado', description: 'El consultorio se ha creado correctamente.' },
        update: { title: 'Consultorio actualizado', description: 'El consultorio se ha actualizado correctamente.' },
        delete: { title: 'Consultorio eliminado', description: 'El consultorio se ha eliminado correctamente.' }
      }
      toast(messages[operation])
    },
    onError: (operation, error) => {
      toast({
        title: 'Error',
        description: `Error al ${operation === 'create' ? 'crear' : operation === 'update' ? 'actualizar' : 'eliminar'} el consultorio`,
        variant: 'destructive'
      })
    }
  })

  // Hook para toggle de is_active
  const { toggle: toggleActive, isToggling } = useToggleState({
    tableName: 'room',
    fieldName: 'is_active',
    onSuccess: (id, newValue) => {
      toast({
        title: newValue ? 'Consultorio activado' : 'Consultorio desactivado',
        description: `El consultorio ha sido ${newValue ? 'activado' : 'desactivado'} correctamente.`
      })
    }
  })

  // Wrappers para los handlers
  const handleSubmit = async () => {
    await crudHandleSubmit()
  }

  const handleDelete = async () => {
    await crudHandleDelete()
  }

  const handleToggleActive = async (room: Room) => {
    await toggleActive(room.id, room.is_active)
  }

  // Agrupar consultorios por institución
  const roomsByInstitution = rooms.reduce((acc, room) => {
    if (!room.institution) return acc

    const institutionKey = `${room.institution.name} - ${room.institution.zone_name}`
    if (!acc[institutionKey]) {
      acc[institutionKey] = []
    }
    acc[institutionKey].push(room)
    return acc
  }, {} as Record<string, Room[]>)

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Consultorios</h1>
          <p className="text-muted-foreground">
            Administra los consultorios y salas de las instituciones
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Consultorio
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p>Cargando consultorios...</p>
        </div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-muted-foreground">
              No hay consultorios registrados. Crea el primer consultorio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(roomsByInstitution).map(([institutionName, institutionRooms]) => (
            <Card key={institutionName}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  {institutionName}
                </CardTitle>
                <CardDescription>
                  {institutionRooms.length} consultorio{institutionRooms.length !== 1 ? 's' : ''} registrado{institutionRooms.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {institutionRooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {room.is_active ? (
                              <DoorOpen className="mr-2 h-4 w-4 text-green-600" />
                            ) : (
                              <DoorClosed className="mr-2 h-4 w-4 text-red-600" />
                            )}
                            {room.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {room.description || (
                            <span className="text-muted-foreground">Sin descripción</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={room.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {room.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(room.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(room)}
                              title={room.is_active ? 'Desactivar' : 'Activar'}
                              disabled={isToggling[room.id]}
                            >
                              {room.is_active ? (
                                <DoorClosed className="h-4 w-4" />
                              ) : (
                                <DoorOpen className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(room)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(room)}
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
        title={editingRoom ? 'Editar Consultorio' : 'Nuevo Consultorio'}
        description={
          editingRoom
            ? 'Modifica los datos del consultorio'
            : 'Crea un nuevo consultorio o sala'
        }
        editingItem={editingRoom}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        size="lg"
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room_name">Nombre *</Label>
            <Input
              id="room_name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateFormField('name', e.target.value)}
              placeholder="Ej: Consultorio 1, Sala de Emergencias"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="room_institution_id">Institución *</Label>
            <Input
              id="room_institution_id"
              type="text"
              value={context?.institution_name || 'Cargando...'}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="room_description">Descripción</Label>
            <Textarea
              id="room_description"
              value={formData.description || ''}
              onChange={(e) => updateFormField('description', e.target.value)}
              placeholder="Descripción del consultorio o sala"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="room_is_active"
              checked={formData.is_active || false}
              onChange={(e) => updateFormField('is_active', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="room_is_active">Consultorio activo</Label>
          </div>
        </div>
      </CrudDialog>

      {/* Dialog de Confirmación de Eliminación */}
      <DeleteConfirmation
        isOpen={isDeleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        itemName={deletingRoom?.name || ''}
        onConfirm={handleDelete}
        isDeleting={isSaving}
      />
    </div>
  )
}
