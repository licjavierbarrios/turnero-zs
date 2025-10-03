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
import { Plus, Edit, Trash2, User, Shield, Building2 } from 'lucide-react'

type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type Membership = {
  id: string
  user_id: string
  institution_id: string
  role: 'super_admin' | 'admin' | 'administrativo' | 'medico' | 'enfermeria' | 'pantalla'
  is_active: boolean
  created_at: string
  updated_at: string
  user?: User
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

const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  administrativo: 'Administrativo',
  medico: 'Médico',
  enfermeria: 'Enfermería',
  pantalla: 'Pantalla'
}

const roleColors = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  administrativo: 'bg-blue-100 text-blue-800',
  medico: 'bg-green-100 text-green-800',
  enfermeria: 'bg-yellow-100 text-yellow-800',
  pantalla: 'bg-orange-100 text-orange-800'
}

export default function SuperAdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'memberships'>('users')

  // User form state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userFormData, setUserFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_active: true
  })

  // Membership form state
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false)
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null)
  const [membershipFormData, setMembershipFormData] = useState({
    user_id: '',
    institution_id: '',
    role: '' as Membership['role'] | '',
    is_active: true
  })

  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([fetchUsers(), fetchMemberships(), fetchInstitutions()])
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('last_name', { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('membership')
        .select(`
          *,
          user:user_id (
            id,
            email,
            first_name,
            last_name,
            is_active
          ),
          institution:institution_id (
            id,
            name,
            zone_name:zone!inner(name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedData = data?.map(item => ({
        ...item,
        institution: item.institution ? {
          id: item.institution.id,
          name: item.institution.name,
          zone_name: item.institution.zone_name?.[0]?.name || 'Sin zona'
        } : undefined
      })) || []

      setMemberships(formattedData)
    } catch (error) {
      console.error('Error fetching memberships:', error)
    }
  }

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institution')
        .select(`
          id,
          name,
          zone_name:zone!inner(name)
        `)
        .order('name', { ascending: true })

      if (error) throw error

      const formattedData = data?.map(item => ({
        id: item.id,
        name: item.name,
        zone_name: item.zone_name?.[0]?.name || 'Sin zona'
      })) || []

      setInstitutions(formattedData)
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
  }

  // User CRUD operations
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          email: userFormData.email,
          first_name: userFormData.first_name,
          last_name: userFormData.last_name,
          is_active: userFormData.is_active,
          updated_at: new Date().toISOString()
        }

        // Only include password if it's provided
        if (userFormData.password) {
          updateData.password_hash = userFormData.password // Note: In real app, this should be hashed
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingUser.id)

        if (error) throw error

        toast({
          title: "Usuario actualizado",
          description: "El usuario se ha actualizado correctamente.",
        })
      } else {
        // Create new user
        const { error } = await supabase
          .from('users')
          .insert({
            email: userFormData.email,
            first_name: userFormData.first_name,
            last_name: userFormData.last_name,
            password_hash: userFormData.password, // Note: In real app, this should be hashed
            is_active: userFormData.is_active
          })

        if (error) throw error

        toast({
          title: "Usuario creado",
          description: "El usuario se ha creado correctamente.",
        })
      }

      setIsUserDialogOpen(false)
      setEditingUser(null)
      resetUserForm()
      fetchUsers()
    } catch (error) {
      console.error('Error saving user:', error)
      setError(`Error al ${editingUser ? 'actualizar' : 'crear'} el usuario`)
    }
  }

  // Membership CRUD operations
  const handleMembershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!membershipFormData.role) {
      setError('Debe seleccionar un rol')
      return
    }

    try {
      if (editingMembership) {
        // Update existing membership
        const { error } = await supabase
          .from('membership')
          .update({
            user_id: membershipFormData.user_id,
            institution_id: membershipFormData.institution_id,
            role: membershipFormData.role,
            is_active: membershipFormData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMembership.id)

        if (error) throw error

        toast({
          title: "Membresía actualizada",
          description: "La membresía se ha actualizado correctamente.",
        })
      } else {
        // Create new membership
        const { error } = await supabase
          .from('membership')
          .insert({
            user_id: membershipFormData.user_id,
            institution_id: membershipFormData.institution_id,
            role: membershipFormData.role,
            is_active: membershipFormData.is_active
          })

        if (error) throw error

        toast({
          title: "Membresía creada",
          description: "La membresía se ha creado correctamente.",
        })
      }

      setIsMembershipDialogOpen(false)
      setEditingMembership(null)
      resetMembershipForm()
      fetchMemberships()
    } catch (error) {
      console.error('Error saving membership:', error)
      setError(`Error al ${editingMembership ? 'actualizar' : 'crear'} la membresía`)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: '',
      is_active: user.is_active
    })
    setIsUserDialogOpen(true)
  }

  const handleEditMembership = (membership: Membership) => {
    setEditingMembership(membership)
    setMembershipFormData({
      user_id: membership.user_id,
      institution_id: membership.institution_id,
      role: membership.role,
      is_active: membership.is_active
    })
    setIsMembershipDialogOpen(true)
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${user.first_name} ${user.last_name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Usuario eliminado",
        description: "El usuario se ha eliminado correctamente.",
      })

      fetchUsers()
      fetchMemberships() // Refresh memberships as they may be affected
    } catch (error) {
      console.error('Error deleting user:', error)
      setError('Error al eliminar el usuario')
    }
  }

  const handleDeleteMembership = async (membership: Membership) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar esta membresía?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('membership')
        .delete()
        .eq('id', membership.id)

      if (error) throw error

      toast({
        title: "Membresía eliminada",
        description: "La membresía se ha eliminada correctamente.",
      })

      fetchMemberships()
    } catch (error) {
      console.error('Error deleting membership:', error)
      setError('Error al eliminar la membresía')
    }
  }

  const resetUserForm = () => {
    setUserFormData({
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      is_active: true
    })
    setEditingUser(null)
    setError(null)
  }

  const resetMembershipForm = () => {
    setMembershipFormData({
      user_id: '',
      institution_id: '',
      role: '',
      is_active: true
    })
    setEditingMembership(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Usuarios - Vista Global</h1>
        <p className="text-muted-foreground">
          Administra todos los usuarios del sistema y sus membresías en instituciones
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="inline mr-2 h-4 w-4" />
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab('memberships')}
          className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
            activeTab === 'memberships'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="inline mr-2 h-4 w-4" />
          Membresías
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Usuarios del Sistema
                </CardTitle>
                <CardDescription>
                  Lista de todos los usuarios registrados en el sistema
                </CardDescription>
              </div>
              <Dialog
                open={isUserDialogOpen}
                onOpenChange={(open) => {
                  setIsUserDialogOpen(open)
                  if (!open) resetUserForm()
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingUser
                        ? 'Modifica los datos del usuario'
                        : 'Crea un nuevo usuario del sistema'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="user_first_name">Nombre *</Label>
                        <Input
                          id="user_first_name"
                          type="text"
                          value={userFormData.first_name}
                          onChange={(e) => setUserFormData({ ...userFormData, first_name: e.target.value })}
                          placeholder="Nombre"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="user_last_name">Apellido *</Label>
                        <Input
                          id="user_last_name"
                          type="text"
                          value={userFormData.last_name}
                          onChange={(e) => setUserFormData({ ...userFormData, last_name: e.target.value })}
                          placeholder="Apellido"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_email">Email *</Label>
                      <Input
                        id="user_email"
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        placeholder="email@ejemplo.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_password">
                        {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                      </Label>
                      <Input
                        id="user_password"
                        type="password"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        placeholder="Contraseña"
                        required={!editingUser}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="user_is_active"
                        checked={userFormData.is_active}
                        onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="user_is_active">Usuario activo</Label>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsUserDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingUser ? 'Actualizar' : 'Crear'} Usuario
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>Cargando usuarios...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No hay usuarios registrados. Crea el primer usuario.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          className={user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }
                        >
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
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
      )}

      {/* Memberships Tab */}
      {activeTab === 'memberships' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Membresías del Sistema
                </CardTitle>
                <CardDescription>
                  Gestiona los roles de todos los usuarios en todas las instituciones
                </CardDescription>
              </div>
              <Dialog
                open={isMembershipDialogOpen}
                onOpenChange={(open) => {
                  setIsMembershipDialogOpen(open)
                  if (!open) resetMembershipForm()
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Membresía
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingMembership ? 'Editar Membresía' : 'Nueva Membresía'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingMembership
                        ? 'Modifica la membresía del usuario'
                        : 'Asigna un rol a un usuario en una institución'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleMembershipSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="membership_user_id">Usuario *</Label>
                      <Select
                        value={membershipFormData.user_id}
                        onValueChange={(value) => setMembershipFormData({ ...membershipFormData, user_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.is_active).map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.first_name} {user.last_name} - {user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="membership_institution_id">Institución *</Label>
                      <Select
                        value={membershipFormData.institution_id}
                        onValueChange={(value) => setMembershipFormData({ ...membershipFormData, institution_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar institución" />
                        </SelectTrigger>
                        <SelectContent>
                          {institutions.map((institution) => (
                            <SelectItem key={institution.id} value={institution.id}>
                              {institution.name} - {institution.zone_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="membership_role">Rol *</Label>
                      <Select
                        value={membershipFormData.role}
                        onValueChange={(value) => setMembershipFormData({ ...membershipFormData, role: value as Membership['role'] })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin (Acceso Global)</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="administrativo">Administrativo</SelectItem>
                          <SelectItem value="medico">Médico</SelectItem>
                          <SelectItem value="enfermeria">Enfermería</SelectItem>
                          <SelectItem value="pantalla">Pantalla</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="membership_is_active"
                        checked={membershipFormData.is_active}
                        onChange={(e) => setMembershipFormData({ ...membershipFormData, is_active: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="membership_is_active">Membresía activa</Label>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsMembershipDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingMembership ? 'Actualizar' : 'Crear'} Membresía
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>Cargando membresías...</p>
              </div>
            ) : memberships.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No hay membresías registradas. Crea la primera membresía.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Institución</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell className="font-medium">
                        {membership.user ? (
                          <div className="flex flex-col">
                            <span>{membership.user.first_name} {membership.user.last_name}</span>
                            <span className="text-sm text-muted-foreground">{membership.user.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Usuario eliminado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {membership.institution ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{membership.institution.name}</span>
                            <span className="text-sm text-muted-foreground">{membership.institution.zone_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Institución eliminada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[membership.role]}>
                          {roleLabels[membership.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={membership.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }
                        >
                          {membership.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(membership.created_at).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMembership(membership)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMembership(membership)}
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
      )}
    </div>
  )
}
