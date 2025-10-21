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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CrudDialog } from '@/components/crud/CrudDialog'
import { DeleteConfirmation } from '@/components/crud/DeleteConfirmation'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Activity, Clock, Building } from 'lucide-react'
import { formatDate } from '@/lib/supabase/helpers'
import { groupByField } from '@/lib/supabase/transforms'

type Service = {
  id: string
  institution_id: string
  name: string
  description: string | null
  duration_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
  institution?: {
    id: string
    name: string
    zone_name: string
  }
}

export default function ServiciosPage() {
  const { toast } = useToast()
  const { context, requireContext } = useInstitutionContext()

  // Obtener institution_id del contexto
  requireContext()
  const institutionId = context!.institution_id

  // Hook CRUD para servicios
  const {
    items: services,
    formData,
    isLoading,
    isSaving,
    isDialogOpen,
    isDeleteDialogOpen,
    editingItem: editingService,
    itemToDelete: deletingService,
    error,
    updateFormField,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    openDeleteDialog,
    closeDeleteDialog,
    handleSubmit: crudHandleSubmit,
    handleDelete: crudHandleDelete
  } = useCrudOperation<Service>({
    tableName: 'service',
    initialFormData: {
      name: '',
      institution_id: institutionId,
      description: '',
      duration_minutes: 30,
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
        create: { title: 'Servicio creado', description: 'El servicio se ha creado correctamente.' },
        update: { title: 'Servicio actualizado', description: 'El servicio se ha actualizado correctamente.' },
        delete: { title: 'Servicio eliminado', description: 'El servicio se ha eliminado correctamente.' }
      }
      toast(messages[operation])
    },
    onError: (operation, error) => {
      toast({
        title: 'Error',
        description: `Error al ${operation === 'create' ? 'crear' : operation === 'update' ? 'actualizar' : 'eliminar'} el servicio`,
        variant: 'destructive'
      })
    }
  })

  // Hook para toggle de is_active
  const { toggle: toggleActive, isToggling } = useToggleState({
    tableName: 'service',
    fieldName: 'is_active',
    onSuccess: (id, newValue) => {
      toast({
        title: newValue ? 'Servicio activado' : 'Servicio desactivado',
        description: `El servicio ha sido ${newValue ? 'activado' : 'desactivado'} correctamente.`
      })
      // Actualizar el item en la lista local
      const updatedServices = services.map(s =>
        s.id === id ? { ...s, is_active: newValue } : s
      )
      // Aquí podrías usar setItems si lo expones del hook, o simplemente refetch
    }
  })

  // Wrappers para los handlers
  const handleSubmit = async () => {
    await crudHandleSubmit()
  }

  const handleDelete = async () => {
    await crudHandleDelete()
  }

  const handleToggleActive = async (service: Service) => {
    await toggleActive(service.id, service.is_active)
  }

  // Formatear duración
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
  }

  // Agrupar servicios por institución
  const servicesByInstitution = services.reduce((acc, service) => {
    if (!service.institution) return acc

    const institutionKey = `${service.institution.name} - ${service.institution.zone_name}`
    if (!acc[institutionKey]) {
      acc[institutionKey] = []
    }
    acc[institutionKey].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Servicios</h1>
          <p className="text-muted-foreground">
            Administra los servicios médicos de las instituciones
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Servicio
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p>Cargando servicios...</p>
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-muted-foreground">
              No hay servicios registrados. Crea el primer servicio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(servicesByInstitution).map(([institutionName, institutionServices]) => (
            <Card key={institutionName}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  {institutionName}
                </CardTitle>
                <CardDescription>
                  {institutionServices.length} servicio{institutionServices.length !== 1 ? 's' : ''} registrado{institutionServices.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {institutionServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Activity className="mr-2 h-4 w-4 text-blue-600" />
                            {service.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-gray-500" />
                            <Badge variant="outline">
                              {formatDuration(service.duration_minutes)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {service.description || (
                            <span className="text-muted-foreground">Sin descripción</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={service.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {service.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(service.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(service)}
                              title={service.is_active ? 'Desactivar' : 'Activar'}
                              disabled={isToggling[service.id]}
                            >
                              {service.is_active ? (
                                <Activity className="h-4 w-4 text-red-600" />
                              ) : (
                                <Activity className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(service)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(service)}
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
        title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
        description={
          editingService
            ? 'Modifica los datos del servicio'
            : 'Crea un nuevo servicio médico'
        }
        editingItem={editingService}
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
            <Label htmlFor="service_name">Nombre *</Label>
            <Input
              id="service_name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateFormField('name', e.target.value)}
              placeholder="Ej: Medicina General, Cardiología, Enfermería"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_institution_id">Institución *</Label>
            <Input
              id="service_institution_id"
              type="text"
              value={context?.institution_name || 'Cargando...'}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_duration_minutes">Duración por turno (minutos) *</Label>
            <Select
              value={formData.duration_minutes?.toString() || '30'}
              onValueChange={(value) => updateFormField('duration_minutes', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar duración" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="20">20 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1 hora 30 minutos</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_description">Descripción</Label>
            <Textarea
              id="service_description"
              value={formData.description || ''}
              onChange={(e) => updateFormField('description', e.target.value)}
              placeholder="Descripción del servicio médico"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="service_is_active"
              checked={formData.is_active || false}
              onChange={(e) => updateFormField('is_active', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="service_is_active">Servicio activo</Label>
          </div>
        </div>
      </CrudDialog>

      {/* Dialog de Confirmación de Eliminación */}
      <DeleteConfirmation
        isOpen={isDeleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        itemName={deletingService?.name || ''}
        onConfirm={handleDelete}
        isDeleting={isSaving}
      />
    </div>
  )
}
