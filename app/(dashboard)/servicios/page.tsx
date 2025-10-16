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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Activity, Clock, Building } from 'lucide-react'

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

type Institution = {
  id: string
  name: string
  zone_name: string
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    institution_id: '',
    description: '',
    duration_minutes: 30,
    is_active: true
  })
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingService, setDeletingService] = useState<Service | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Get current institution from localStorage
    const contextData = localStorage.getItem('institution_context')
    if (contextData) {
      const context = JSON.parse(contextData)
      setCurrentInstitutionId(context.institution_id)
      setFormData(prev => ({ ...prev, institution_id: context.institution_id }))
    }

    Promise.all([fetchServices(), fetchInstitutions()])
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)

      // Get current institution from localStorage
      const contextData = localStorage.getItem('institution_context')
      if (!contextData) {
        setError('No se encontró el contexto de la institución')
        return
      }
      const context = JSON.parse(contextData)

      const { data, error } = await supabase
        .from('service')
        .select(`
          *,
          institution:institution_id!inner (
            id,
            name,
            zone_name:zone!inner(name)
          )
        `)
        .eq('institution_id', context.institution_id)
        .order('name', { ascending: true })

      if (error) throw error

      const formattedData = data?.map((item: any) => ({
        ...item,
        institution: item.institution ? {
          id: item.institution.id,
          name: item.institution.name,
          zone_name: item.institution.zone_name?.[0]?.name || 'Sin zona'
        } : undefined
      })) || []

      setServices(formattedData)
    } catch (error) {
      console.error('Error fetching services:', error)
      setError('Error al cargar los servicios')
    } finally {
      setLoading(false)
    }
  }

  const fetchInstitutions = async () => {
    try {
      // Get current institution from localStorage
      const contextData = localStorage.getItem('institution_context')
      if (!contextData) {
        return
      }
      const context = JSON.parse(contextData)

      const { data, error } = await supabase
        .from('institution')
        .select(`
          id,
          name,
          zone_name:zone!inner(name)
        `)
        .eq('id', context.institution_id)
        .single()

      if (error) throw error

      const formattedData = {
        id: data.id,
        name: data.name,
        zone_name: data.zone_name?.[0]?.name || 'Sin zona'
      }

      setInstitutions([formattedData])
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Validar que tenemos institution_id
      if (!formData.institution_id) {
        setError('No se ha establecido la institución')
        return
      }

      if (editingService) {
        // Update existing service
        const { data, error } = await supabase
          .from('service')
          .update({
            name: formData.name,
            institution_id: formData.institution_id,
            description: formData.description || null,
            duration_minutes: formData.duration_minutes,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingService.id)
          .select()

        if (error) {
          console.error('Update error:', error)
          throw error
        }

        console.log('Service updated successfully:', data)

        toast({
          title: "Servicio actualizado",
          description: "El servicio se ha actualizado correctamente.",
        })
      } else {
        // Create new service
        const { data, error } = await supabase
          .from('service')
          .insert({
            name: formData.name,
            institution_id: formData.institution_id,
            description: formData.description || null,
            duration_minutes: formData.duration_minutes,
            is_active: formData.is_active
          })
          .select()

        if (error) {
          console.error('Insert error:', error)
          throw error
        }

        console.log('Service created successfully:', data)

        toast({
          title: "Servicio creado",
          description: "El servicio se ha creado correctamente.",
        })
      }

      setIsDialogOpen(false)
      setEditingService(null)
      resetForm()
      await fetchServices()
    } catch (error: any) {
      console.error('Error saving service:', error)
      const errorMsg = error.message || `Error al ${editingService ? 'actualizar' : 'crear'} el servicio`
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      institution_id: service.institution_id,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      is_active: service.is_active
    })
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('service')
        .update({
          is_active: !service.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id)

      if (error) throw error
      
      toast({
        title: service.is_active ? "Servicio desactivado" : "Servicio activado",
        description: `El servicio ha sido ${service.is_active ? 'desactivado' : 'activado'} correctamente.`,
      })
      
      fetchServices()
    } catch (error) {
      console.error('Error toggling service status:', error)
      setError('Error al cambiar el estado del servicio')
    }
  }

  const openDeleteDialog = (service: Service) => {
    setDeletingService(service)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingService) return

    try {
      const { error } = await supabase
        .from('service')
        .delete()
        .eq('id', deletingService.id)

      if (error) throw error

      toast({
        title: "Servicio eliminado",
        description: "El servicio se ha eliminado correctamente.",
      })

      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      setError('Error al eliminar el servicio')
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingService(null)
    }
  }

  const resetForm = () => {
    const contextData = localStorage.getItem('institution_context')
    const institutionId = contextData ? JSON.parse(contextData).institution_id : ''

    setFormData({
      name: '',
      institution_id: institutionId,
      description: '',
      duration_minutes: 30,
      is_active: true
    })
    setEditingService(null)
    setError(null)
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
  }

  // Group services by institution for better display
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
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </DialogTitle>
              <DialogDescription>
                {editingService 
                  ? 'Modifica los datos del servicio' 
                  : 'Crea un nuevo servicio médico'
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
                <Label htmlFor="service_name">Nombre *</Label>
                <Input
                  id="service_name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Medicina General, Cardiología, Enfermería"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_institution_id">Institución *</Label>
                <Input
                  id="service_institution_id"
                  type="text"
                  value={institutions[0]?.name ? `${institutions[0].name} - ${institutions[0].zone_name}` : 'Cargando...'}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_duration_minutes">Duración por turno (minutos) *</Label>
                <Select 
                  value={formData.duration_minutes.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del servicio médico"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="service_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="service_is_active">Servicio activo</Label>
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
                  {editingService ? 'Actualizar' : 'Crear'} Servicio
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
                          {new Date(service.created_at).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(service)}
                              title={service.is_active ? 'Desactivar' : 'Activar'}
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
                              onClick={() => handleEdit(service)}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el servicio <strong>{deletingService?.name}</strong>.
              <br /><br />
              <strong>Esta acción no se puede deshacer.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setDeletingService(null)
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}