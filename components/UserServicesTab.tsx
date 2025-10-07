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
import { Plus, Edit, Trash2, Activity } from 'lucide-react'

type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
}

type Service = {
  id: string
  name: string
  institution_id: string
  institution_name?: string
  zone_name?: string
}

type UserService = {
  id: string
  user_id: string
  service_id: string
  institution_id: string
  is_active: boolean
  created_at: string
  user?: User
  service?: Service
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

type Zone = {
  id: string
  name: string
}

interface UserServicesTabProps {
  users: User[]
  zones: Zone[]
  institutions: Institution[]
}

export function UserServicesTab({ users, zones, institutions }: UserServicesTabProps) {
  const [userServices, setUserServices] = useState<UserService[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUserService, setEditingUserService] = useState<UserService | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    service_id: '',
    institution_id: '',
    zone_id: '',
    is_active: true
  })

  // Filter state
  const [userSearch, setUserSearch] = useState('')
  const [selectedZone, setSelectedZone] = useState<string>('ALL')
  const [selectedInstitution, setSelectedInstitution] = useState<string>('ALL')
  const [filteredUserServices, setFilteredUserServices] = useState<UserService[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])

  useEffect(() => {
    Promise.all([fetchUserServices(), fetchServices()])
  }, [])

  // Filter user services by zone, institution and user search
  useEffect(() => {
    let filtered = userServices

    if (selectedZone !== 'ALL') {
      filtered = filtered.filter(us => us.institution?.zone_name === selectedZone)
    }

    if (selectedInstitution !== 'ALL') {
      filtered = filtered.filter(us => us.institution?.name === selectedInstitution)
    }

    if (userSearch.trim() !== '') {
      const search = userSearch.toLowerCase()
      filtered = filtered.filter(us =>
        us.user?.first_name.toLowerCase().includes(search) ||
        us.user?.last_name.toLowerCase().includes(search) ||
        us.user?.email.toLowerCase().includes(search)
      )
    }

    setFilteredUserServices(filtered)
  }, [userSearch, selectedZone, selectedInstitution, userServices])

  // Filter users for dropdown
  useEffect(() => {
    if (userSearch.trim() === '') {
      setFilteredUsers(users.filter(u => u.is_active))
    } else {
      const search = userSearch.toLowerCase()
      setFilteredUsers(
        users.filter(u =>
          u.is_active &&
          (u.first_name.toLowerCase().includes(search) ||
          u.last_name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search))
        )
      )
    }
  }, [userSearch, users])

  // Filter institutions by zone
  useEffect(() => {
    if (formData.zone_id === '') {
      setFilteredInstitutions([])
    } else {
      const zoneName = zones.find(z => z.id === formData.zone_id)?.name
      setFilteredInstitutions(
        institutions.filter(i => i.zone_name === zoneName)
      )
    }
  }, [formData.zone_id, institutions, zones])

  // Filter services by institution
  useEffect(() => {
    if (formData.institution_id === '') {
      setFilteredServices([])
    } else {
      setFilteredServices(
        services.filter(s => s.institution_id === formData.institution_id)
      )
    }
  }, [formData.institution_id, services])

  const fetchUserServices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_service')
        .select(`
          *,
          user:user_id (
            id,
            email,
            first_name,
            last_name,
            is_active
          ),
          service:service_id (
            id,
            name,
            institution_id
          ),
          institution:institution_id (
            id,
            name,
            zone:zone_id(name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedData = data?.map(item => ({
        ...item,
        institution: item.institution ? {
          id: item.institution.id,
          name: item.institution.name,
          zone_name: item.institution.zone?.name || 'Sin zona'
        } : undefined
      })) || []

      setUserServices(formattedData)
    } catch (error) {
      console.error('Error fetching user services:', error)
      setError('Error al cargar las asignaciones de servicios')
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('service')
        .select(`
          id,
          name,
          institution_id,
          institution:institution_id (
            name,
            zone:zone_id(name)
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error

      const formattedData = data?.map(item => ({
        ...item,
        institution_name: (item.institution as any)?.name || 'Sin institución',
        zone_name: (item.institution as any)?.zone?.name || 'Sin zona'
      })) || []

      setServices(formattedData)
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.user_id || !formData.service_id || !formData.institution_id) {
      setError('Debes completar todos los campos obligatorios')
      return
    }

    try {
      if (editingUserService) {
        // Update
        const { error } = await supabase
          .from('user_service')
          .update({
            user_id: formData.user_id,
            service_id: formData.service_id,
            institution_id: formData.institution_id,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUserService.id)

        if (error) throw error

        toast({
          title: "Asignación actualizada",
          description: "La asignación de servicio se ha actualizado correctamente.",
        })
      } else {
        // Create
        const { error } = await supabase
          .from('user_service')
          .insert({
            user_id: formData.user_id,
            service_id: formData.service_id,
            institution_id: formData.institution_id,
            is_active: formData.is_active
          })

        if (error) throw error

        toast({
          title: "Asignación creada",
          description: "La asignación de servicio se ha creado correctamente.",
        })
      }

      setIsDialogOpen(false)
      setEditingUserService(null)
      resetForm()
      fetchUserServices()
    } catch (error: any) {
      console.error('Error saving user service:', error)
      if (error.code === '23505') {
        setError('Este usuario ya está asignado a este servicio en esta institución')
      } else {
        setError(`Error al ${editingUserService ? 'actualizar' : 'crear'} la asignación`)
      }
    }
  }

  const handleEdit = (userService: UserService) => {
    setEditingUserService(userService)
    const zoneId = zones.find(z => z.name === userService.institution?.zone_name)?.id || ''
    setFormData({
      user_id: userService.user_id,
      service_id: userService.service_id,
      institution_id: userService.institution_id,
      zone_id: zoneId,
      is_active: userService.is_active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (userService: UserService) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar esta asignación de servicio?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('user_service')
        .delete()
        .eq('id', userService.id)

      if (error) throw error

      toast({
        title: "Asignación eliminada",
        description: "La asignación de servicio se ha eliminado correctamente.",
      })

      fetchUserServices()
    } catch (error) {
      console.error('Error deleting user service:', error)
      setError('Error al eliminar la asignación')
    }
  }

  const handleToggleActive = async (userService: UserService) => {
    try {
      const { error } = await supabase
        .from('user_service')
        .update({
          is_active: !userService.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userService.id)

      if (error) throw error

      toast({
        title: userService.is_active ? "Asignación desactivada" : "Asignación activada",
        description: `La asignación ha sido ${userService.is_active ? 'desactivada' : 'activada'} correctamente.`,
      })

      fetchUserServices()
    } catch (error) {
      console.error('Error toggling user service status:', error)
      setError('Error al cambiar el estado de la asignación')
    }
  }

  const resetForm = () => {
    setFormData({
      user_id: '',
      service_id: '',
      institution_id: '',
      zone_id: '',
      is_active: true
    })
    setEditingUserService(null)
    setUserSearch('')
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Asignación de Servicios a Usuarios
            </CardTitle>
            <CardDescription>
              Asigna servicios específicos a usuarios para filtrar la cola de pacientes
            </CardDescription>
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
                Nueva Asignación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUserService ? 'Editar Asignación' : 'Nueva Asignación de Servicio'}
                </DialogTitle>
                <DialogDescription>
                  {editingUserService
                    ? 'Modifica la asignación del servicio'
                    : 'Asigna un servicio a un usuario para que pueda gestionar pacientes de ese servicio'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Usuario */}
                <div className="space-y-2">
                  <Label htmlFor="user_search">Buscar Usuario *</Label>
                  <Input
                    id="user_search"
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_id">Usuario *</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUsers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No se encontraron usuarios
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} - {user.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Zona */}
                <div className="space-y-2">
                  <Label htmlFor="zone_id">Zona Sanitaria *</Label>
                  <Select
                    value={formData.zone_id}
                    onValueChange={(value) => setFormData({ ...formData, zone_id: value, institution_id: '', service_id: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Institución */}
                {formData.zone_id && (
                  <div className="space-y-2">
                    <Label htmlFor="institution_id">Institución *</Label>
                    <Select
                      value={formData.institution_id}
                      onValueChange={(value) => setFormData({ ...formData, institution_id: value, service_id: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar institución" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredInstitutions.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No hay instituciones en esta zona
                          </div>
                        ) : (
                          filteredInstitutions.map((institution) => (
                            <SelectItem key={institution.id} value={institution.id}>
                              {institution.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Servicio */}
                {formData.institution_id && (
                  <div className="space-y-2">
                    <Label htmlFor="service_id">Servicio *</Label>
                    <Select
                      value={formData.service_id}
                      onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredServices.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No hay servicios en esta institución
                          </div>
                        ) : (
                          filteredServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_active">Asignación activa</Label>
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
                    {editingUserService ? 'Actualizar' : 'Crear'} Asignación
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zone_filter">Filtrar por Zona</Label>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las zonas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las zonas</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.name}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution_filter">Filtrar por Institución</Label>
            <Select
              value={selectedInstitution}
              onValueChange={setSelectedInstitution}
              disabled={selectedZone === 'ALL'}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedZone === 'ALL' ? 'Selecciona una zona primero' : 'Todas las instituciones'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las instituciones</SelectItem>
                {institutions
                  .filter(i => selectedZone === 'ALL' || i.zone_name === selectedZone)
                  .map((institution) => (
                    <SelectItem key={institution.id} value={institution.name}>
                      {institution.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_search_filter">Buscar por Usuario</Label>
            <Input
              id="user_search_filter"
              type="text"
              placeholder="Nombre, apellido o email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Cargando asignaciones...</p>
          </div>
        ) : userServices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No hay asignaciones de servicios. Crea la primera asignación.
            </p>
          </div>
        ) : filteredUserServices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No se encontraron asignaciones con los filtros aplicados.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Institución</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUserServices.map((userService) => (
                <TableRow key={userService.id}>
                  <TableCell className="font-medium">
                    {userService.user ? (
                      <div className="flex flex-col">
                        <span>{userService.user.first_name} {userService.user.last_name}</span>
                        <span className="text-sm text-muted-foreground">{userService.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Usuario eliminado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {userService.institution ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{userService.institution.name}</span>
                        <span className="text-sm text-muted-foreground">{userService.institution.zone_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Institución eliminada</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center w-fit">
                      <Activity className="mr-1 h-3 w-3" />
                      {userService.service?.name || 'Servicio eliminado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={userService.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }
                    >
                      {userService.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(userService.created_at).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(userService)}
                        title={userService.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {userService.is_active ? (
                          <Activity className="h-4 w-4 text-red-600" />
                        ) : (
                          <Activity className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(userService)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(userService)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
