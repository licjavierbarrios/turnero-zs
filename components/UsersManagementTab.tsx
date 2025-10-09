'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Users, Settings, Plus, X, Shield } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

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
}

type UserWithMembership = {
  user: User
  role: string
  services: Service[]
}

type UserService = {
  id: string
  user_id: string
  service_id: string
  is_active: boolean
}

interface UsersManagementTabProps {
  institutionId: string
  institutionName: string
}

export function UsersManagementTab({ institutionId, institutionName }: UsersManagementTabProps) {
  const [usersWithData, setUsersWithData] = useState<UserWithMembership[]>([])
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithMembership | null>(null)
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([fetchUsersWithServices(), fetchAvailableServices()])
  }, [institutionId])

  const fetchUsersWithServices = async () => {
    try {
      setLoading(true)

      // Obtener usuarios con membresía en esta institución
      const { data: memberships, error: membershipsError } = await supabase
        .from('membership')
        .select(`
          user_id,
          role,
          user:user_id (
            id,
            email,
            first_name,
            last_name,
            is_active
          )
        `)
        .eq('institution_id', institutionId)
        .eq('is_active', true)

      if (membershipsError) throw membershipsError

      // Obtener asignaciones de servicios para estos usuarios
      const userIds = memberships?.map(m => m.user_id) || []

      const { data: userServices, error: userServicesError } = await supabase
        .from('user_service')
        .select(`
          id,
          user_id,
          service_id,
          is_active,
          service:service_id (
            id,
            name
          )
        `)
        .eq('institution_id', institutionId)
        .in('user_id', userIds)
        .eq('is_active', true)

      if (userServicesError) throw userServicesError

      // Combinar datos
      const usersData: UserWithMembership[] = memberships?.map(m => {
        const userServicesList = userServices?.filter(us => us.user_id === m.user_id) || []
        const services = userServicesList.map(us => ({
          id: us.service_id,
          name: (us.service as any)?.name || 'Servicio desconocido'
        }))

        return {
          user: m.user as User,
          role: m.role,
          services
        }
      }) || []

      setUsersWithData(usersData)
    } catch (error) {
      console.error('Error fetching users with services:', error)
      setError('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableServices = async () => {
    try {
      const { data, error } = await supabase
        .from('service')
        .select('id, name')
        .eq('institution_id', institutionId)
        .order('name', { ascending: true })

      if (error) throw error
      setAvailableServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const handleManageServices = (userData: UserWithMembership) => {
    setSelectedUser(userData)
    setSelectedServices(new Set(userData.services.map(s => s.id)))
    setIsDialogOpen(true)
    setError(null)
  }

  const handleToggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServices)
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId)
    } else {
      newSelected.add(serviceId)
    }
    setSelectedServices(newSelected)
  }

  const handleSaveServices = async () => {
    if (!selectedUser) return

    try {
      setError(null)

      // Obtener asignaciones actuales del usuario
      const { data: currentAssignments, error: fetchError } = await supabase
        .from('user_service')
        .select('id, service_id')
        .eq('user_id', selectedUser.user.id)
        .eq('institution_id', institutionId)

      if (fetchError) throw fetchError

      const currentServiceIds = new Set(currentAssignments?.map(a => a.service_id) || [])
      const selectedServiceIds = selectedServices

      // Servicios a agregar (están seleccionados pero no existen)
      const toAdd = Array.from(selectedServiceIds).filter(id => !currentServiceIds.has(id))

      // Servicios a eliminar (existen pero no están seleccionados)
      const toRemove = Array.from(currentServiceIds).filter(id => !selectedServiceIds.has(id))

      // Agregar nuevas asignaciones
      if (toAdd.length > 0) {
        const insertData = toAdd.map(serviceId => ({
          user_id: selectedUser.user.id,
          service_id: serviceId,
          institution_id: institutionId,
          is_active: true
        }))

        const { error: insertError } = await supabase
          .from('user_service')
          .insert(insertData)

        if (insertError) {
          // Mejorar mensaje de error
          if (insertError.code === '23505') { // Duplicate key
            throw new Error('Este usuario ya tiene asignado uno o más de estos servicios')
          }
          throw insertError
        }
      }

      // Eliminar asignaciones
      if (toRemove.length > 0) {
        const assignmentsToDelete = currentAssignments
          ?.filter(a => toRemove.includes(a.service_id))
          .map(a => a.id) || []

        const { error: deleteError } = await supabase
          .from('user_service')
          .delete()
          .in('id', assignmentsToDelete)

        if (deleteError) throw deleteError
      }

      toast({
        title: "Servicios actualizados",
        description: `Se actualizaron los servicios de ${selectedUser.user.first_name} ${selectedUser.user.last_name}`,
      })

      setIsDialogOpen(false)
      fetchUsersWithServices()
    } catch (error: any) {
      console.error('Error saving services:', error)
      setError(error.message || 'Error al guardar los servicios')
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'administrativo':
        return 'Administrativo'
      case 'medico':
        return 'Médico'
      case 'enfermeria':
        return 'Enfermería'
      case 'pantalla':
        return 'Pantalla'
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'medico':
        return 'bg-blue-100 text-blue-800'
      case 'enfermeria':
        return 'bg-green-100 text-green-800'
      case 'administrativo':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Usuarios de {institutionName}
        </CardTitle>
        <CardDescription>
          Gestiona las asignaciones de servicios para cada usuario
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p>Cargando usuarios...</p>
          </div>
        ) : usersWithData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No hay usuarios en esta institución.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Servicios Asignados</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersWithData.map((userData) => (
                <TableRow key={userData.user.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{userData.user.first_name} {userData.user.last_name}</span>
                      <span className="text-sm text-muted-foreground">{userData.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(userData.role)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleLabel(userData.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {userData.services.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Sin servicios</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {userData.services.map(service => (
                          <Badge key={service.id} variant="outline" className="text-xs">
                            {service.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageServices(userData)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Gestionar Servicios
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Dialog para gestionar servicios */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Gestionar Servicios
              </DialogTitle>
              <DialogDescription>
                {selectedUser && (
                  <>Asigna servicios a {selectedUser.user.first_name} {selectedUser.user.last_name}</>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Servicios disponibles en {institutionName}
                </Label>
                {availableServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay servicios disponibles en esta institución
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {availableServices.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.has(service.id)}
                          onCheckedChange={() => handleToggleService(service.id)}
                        />
                        <Label
                          htmlFor={service.id}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {service.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveServices}>
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
