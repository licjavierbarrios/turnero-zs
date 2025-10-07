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
import { Plus, Edit, Trash2, User, Shield, Building2, Eye, EyeOff } from 'lucide-react'

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

// Role options for selection (excludes super_admin)
const selectableRoles = {
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
  const [editingUserMemberships, setEditingUserMemberships] = useState<Membership[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [userFormData, setUserFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_active: true,
    zone_id: '',
    institution_id: '',
    role: '' as Membership['role'] | ''
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

  // Search states
  const [userSearch, setUserSearch] = useState('')
  const [membershipUserSearch, setMembershipUserSearch] = useState('')
  const [membershipSearch, setMembershipSearch] = useState('')
  const [selectedZone, setSelectedZone] = useState<string>('ALL')
  const [selectedInstitution, setSelectedInstitution] = useState<string>('ALL')
  const [membershipSelectedZone, setMembershipSelectedZone] = useState<string>('ALL')
  const [membershipSelectedInstitution, setMembershipSelectedInstitution] = useState<string>('ALL')
  const [zones, setZones] = useState<Array<{ id: string, name: string }>>([])
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([])
  const [filteredInstitutionsForFilter, setFilteredInstitutionsForFilter] = useState<Institution[]>([])
  const [filteredMembershipInstitutions, setFilteredMembershipInstitutions] = useState<Institution[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [filteredMemberships, setFilteredMemberships] = useState<Membership[]>([])
  const [filteredMembershipUsers, setFilteredMembershipUsers] = useState<User[]>([])
  const [userFormInstitutions, setUserFormInstitutions] = useState<Institution[]>([])

  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([fetchUsers(), fetchMemberships(), fetchInstitutions(), fetchZones()])
  }, [])

  // Filter users by zone, institution and search
  useEffect(() => {
    // Exclude super admin users
    const superAdminIds = new Set(
      memberships
        .filter(m => m.role === 'super_admin')
        .map(m => m.user_id)
    )
    let filtered = users.filter(u => !superAdminIds.has(u.id))

    // Filter by zone if selected
    if (selectedZone !== 'ALL') {
      const zoneUserIds = new Set(
        memberships
          .filter(m => m.institution?.zone_name === selectedZone)
          .map(m => m.user_id)
      )
      filtered = filtered.filter(u => zoneUserIds.has(u.id))
    }

    // Filter by institution if selected
    if (selectedInstitution !== 'ALL') {
      const institutionUserIds = new Set(
        memberships
          .filter(m => m.institution?.name === selectedInstitution)
          .map(m => m.user_id)
      )
      filtered = filtered.filter(u => institutionUserIds.has(u.id))
    }

    // Filter by search text
    if (userSearch.trim() !== '') {
      const search = userSearch.toLowerCase()
      filtered = filtered.filter(u =>
        u.first_name.toLowerCase().includes(search) ||
        u.last_name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      )
    }

    setFilteredUsers(filtered)
  }, [userSearch, users, selectedZone, selectedInstitution, memberships])

  // Filter institutions for users tab filter (cascade with zone)
  useEffect(() => {
    if (selectedZone === 'ALL') {
      setFilteredInstitutionsForFilter(institutions)
    } else {
      setFilteredInstitutionsForFilter(
        institutions.filter(i => i.zone_name === selectedZone)
      )
    }
  }, [selectedZone, institutions])

  // Reset institution filter when zone changes
  useEffect(() => {
    if (selectedZone !== 'ALL' && selectedInstitution !== 'ALL') {
      const institutionExists = institutions.some(
        i => i.zone_name === selectedZone && i.name === selectedInstitution
      )
      if (!institutionExists) {
        setSelectedInstitution('ALL')
      }
    }
  }, [selectedZone, selectedInstitution, institutions])

  // Filter institutions by zone (for memberships tab)
  useEffect(() => {
    if (membershipSelectedZone === 'ALL') {
      setFilteredInstitutions(institutions)
    } else {
      setFilteredInstitutions(
        institutions.filter(i => i.zone_name === membershipSelectedZone)
      )
    }
  }, [membershipSelectedZone, institutions])

  // Filter institutions for membership tab filter (cascade with zone)
  useEffect(() => {
    if (membershipSelectedZone === 'ALL') {
      setFilteredMembershipInstitutions(institutions)
    } else {
      setFilteredMembershipInstitutions(
        institutions.filter(i => i.zone_name === membershipSelectedZone)
      )
    }
  }, [membershipSelectedZone, institutions])

  // Reset membership institution filter when zone changes
  useEffect(() => {
    if (membershipSelectedZone !== 'ALL' && membershipSelectedInstitution !== 'ALL') {
      const institutionExists = institutions.some(
        i => i.zone_name === membershipSelectedZone && i.name === membershipSelectedInstitution
      )
      if (!institutionExists) {
        setMembershipSelectedInstitution('ALL')
      }
    }
  }, [membershipSelectedZone, membershipSelectedInstitution, institutions])

  // Filter institutions by zone (for user form)
  useEffect(() => {
    if (userFormData.zone_id === '') {
      setUserFormInstitutions([])
    } else {
      const zoneName = zones.find(z => z.id === userFormData.zone_id)?.name
      setUserFormInstitutions(
        institutions.filter(i => i.zone_name === zoneName)
      )
    }
  }, [userFormData.zone_id, institutions, zones])

  // Filter users for membership search
  useEffect(() => {
    if (membershipUserSearch.trim() === '') {
      setFilteredMembershipUsers(users)
    } else {
      const search = membershipUserSearch.toLowerCase()
      setFilteredMembershipUsers(
        users.filter(u =>
          u.first_name.toLowerCase().includes(search) ||
          u.last_name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
        )
      )
    }
  }, [membershipUserSearch, users])

  // Filter memberships by zone, institution and search
  useEffect(() => {
    // Exclude super_admin memberships
    let filtered = memberships.filter(m => m.role !== 'super_admin')

    // Filter by zone if selected
    if (membershipSelectedZone !== 'ALL') {
      filtered = filtered.filter(m => m.institution?.zone_name === membershipSelectedZone)
    }

    // Filter by institution if selected
    if (membershipSelectedInstitution !== 'ALL') {
      filtered = filtered.filter(m => m.institution?.name === membershipSelectedInstitution)
    }

    // Filter by search text (user name or email)
    if (membershipSearch.trim() !== '') {
      const search = membershipSearch.toLowerCase()
      filtered = filtered.filter(m =>
        m.user?.first_name.toLowerCase().includes(search) ||
        m.user?.last_name.toLowerCase().includes(search) ||
        m.user?.email.toLowerCase().includes(search)
      )
    }

    setFilteredMemberships(filtered)
  }, [membershipSearch, memberships, membershipSelectedZone, membershipSelectedInstitution])

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
            zone_id,
            zone:zone_id(id, name)
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
          zone_id,
          zone:zone_id(id, name)
        `)
        .order('name', { ascending: true })

      if (error) throw error

      const formattedData = data?.map(item => ({
        id: item.id,
        name: item.name,
        zone_name: item.zone?.name || 'Sin zona'
      })) || []

      setInstitutions(formattedData)
      setFilteredInstitutions(formattedData)
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
  }

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from('zone')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error
      setZones(data || [])
    } catch (error) {
      console.error('Error fetching zones:', error)
    }
  }

  // User CRUD operations
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate zone, institution and role for new users
    if (!editingUser && (!userFormData.zone_id || !userFormData.institution_id || !userFormData.role)) {
      setError('Debes seleccionar zona, institución y rol para el nuevo usuario')
      return
    }

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
        // Create new user via API route (server-side with admin privileges)
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: userFormData.email,
            password: userFormData.password,
            first_name: userFormData.first_name,
            last_name: userFormData.last_name,
            is_active: userFormData.is_active
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al crear usuario')
        }

        const { user: newUser } = await response.json()
        console.log('✅ Usuario creado:', newUser.id)

        // Create membership for the new user
        if (userFormData.institution_id && userFormData.role) {
          const { error: membershipError } = await supabase
            .from('membership')
            .insert({
              user_id: newUser.id,
              institution_id: userFormData.institution_id,
              role: userFormData.role,
              is_active: true
            })

          if (membershipError) throw membershipError

          toast({
            title: "Usuario creado",
            description: "El usuario y su membresía se han creado correctamente.",
          })
        } else {
          toast({
            title: "Usuario creado sin institución",
            description: "Usuario creado, pero falta asignar institución. Por favor asígnala en Membresías.",
            variant: "destructive"
          })
        }
      }

      setIsUserDialogOpen(false)
      setEditingUser(null)
      resetUserForm()
      fetchUsers()
      fetchMemberships() // Refresh memberships list
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
      is_active: user.is_active,
      zone_id: '',
      institution_id: '',
      role: ''
    })
    // Load user's memberships
    const userMemberships = memberships.filter(m => m.user_id === user.id)
    setEditingUserMemberships(userMemberships)
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
      // Delete related records in order (due to foreign key constraints)

      // 1. Delete call_events
      const { error: callEventError } = await supabase
        .from('call_event')
        .delete()
        .eq('called_by', user.id)

      if (callEventError) throw callEventError

      // 2. Delete attendance_events
      const { error: attendanceEventError } = await supabase
        .from('attendance_event')
        .delete()
        .eq('recorded_by', user.id)

      if (attendanceEventError) throw attendanceEventError

      // 3. Delete appointments created by this user
      const { error: appointmentError } = await supabase
        .from('appointment')
        .delete()
        .eq('created_by', user.id)

      if (appointmentError) throw appointmentError

      // 4. Delete memberships (should cascade automatically, but explicit is safer)
      const { error: membershipError } = await supabase
        .from('membership')
        .delete()
        .eq('user_id', user.id)

      if (membershipError) throw membershipError

      // 5. Finally delete the user
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
      is_active: true,
      zone_id: '',
      institution_id: '',
      role: ''
    })
    setEditingUser(null)
    setEditingUserMemberships([])
    setShowPassword(false)
    setError(null)
  }

  const resetMembershipForm = () => {
    setMembershipFormData({
      user_id: '',
      institution_id: '',
      role: '',
      is_active: true
    })
    setMembershipUserSearch('')
    setSelectedZone('ALL')
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
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                      <div className="relative">
                        <Input
                          id="user_password"
                          type={showPassword ? "text" : "password"}
                          value={userFormData.password}
                          onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                          placeholder="Contraseña"
                          required={!editingUser}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
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

                    {editingUser && (
                      <>
                        <div className="border-t pt-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">Instituciones Asignadas</h4>
                            <span className="text-xs text-muted-foreground">
                              {editingUserMemberships.length} institución(es)
                            </span>
                          </div>

                          {editingUserMemberships.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                              Este usuario no tiene instituciones asignadas. Usa la pestaña "Membresías" para asignarle instituciones.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {editingUserMemberships.map((membership) => (
                                <div key={membership.id} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{membership.institution?.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {membership.institution?.zone_name} • {roleLabels[membership.role]}
                                    </p>
                                  </div>
                                  <Badge className={roleColors[membership.role]}>
                                    {roleLabels[membership.role]}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Para gestionar las instituciones de este usuario, ve a la pestaña "Membresías".
                          </p>
                        </div>
                      </>
                    )}

                    {!editingUser && (
                      <>
                        <div className="border-t pt-4 space-y-4">
                          <h4 className="font-semibold text-sm">Asignación de Zona e Institución</h4>
                          <p className="text-xs text-muted-foreground">
                            Selecciona la zona sanitaria, institución y rol para este usuario.
                          </p>

                          <div className="space-y-2">
                            <Label htmlFor="user_zone_id">Zona Sanitaria *</Label>
                            <Select
                              value={userFormData.zone_id}
                              onValueChange={(value) => setUserFormData({ ...userFormData, zone_id: value, institution_id: '', role: '' })}
                              required
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

                          {userFormData.zone_id && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="user_institution_id">Institución *</Label>
                                <Select
                                  value={userFormData.institution_id}
                                  onValueChange={(value) => setUserFormData({ ...userFormData, institution_id: value })}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar institución" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {userFormInstitutions.map((inst) => (
                                      <SelectItem key={inst.id} value={inst.id}>
                                        {inst.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="user_role">Rol *</Label>
                                <Select
                                  value={userFormData.role}
                                  onValueChange={(value) => setUserFormData({ ...userFormData, role: value as Membership['role'] })}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(selectableRoles).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsUserDialogOpen(false)
                          resetUserForm()
                        }}
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
            {/* Filtros */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[20px]">
                  <Label htmlFor="zone_filter">Filtrar por Zona</Label>
                  {selectedZone !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedZone('ALL')
                        setSelectedInstitution('ALL')
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <Select
                  value={selectedZone}
                  onValueChange={setSelectedZone}
                >
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
                <div className="flex items-center justify-between min-h-[20px]">
                  <Label htmlFor="institution_filter">Filtrar por Institución</Label>
                  {selectedInstitution !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedInstitution('ALL')}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
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
                    {filteredInstitutionsForFilter.map((institution) => (
                      <SelectItem key={institution.id} value={institution.name}>
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[20px]">
                  <Label htmlFor="user_search_filter">Buscar Usuario</Label>
                  <div className="h-[20px]"></div>
                </div>
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
                <p>Cargando usuarios...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No hay usuarios registrados. Crea el primer usuario.
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No se encontraron usuarios con los filtros aplicados.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Instituciones</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const userMemberships = memberships.filter(m => m.user_id === user.id)
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {userMemberships.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">Sin instituciones</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {userMemberships.map((m) => (
                                <Badge key={m.id} variant="outline" className="text-xs">
                                  {m.institution?.name} ({roleLabels[m.role]})
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
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
                    )
                  })}
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
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

                    {!editingMembership && (
                      <>
                        {/* Paso 1: Buscar Usuario */}
                        <div className="space-y-2">
                          <Label htmlFor="membership_user_search">Buscar Usuario *</Label>
                          <Input
                            id="membership_user_search"
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={membershipUserSearch}
                            onChange={(e) => setMembershipUserSearch(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Escribe para buscar entre {users.length} usuarios
                          </p>
                        </div>

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
                              {filteredMembershipUsers.filter(u => u.is_active).length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                  No se encontraron usuarios
                                </div>
                              ) : (
                                filteredMembershipUsers.filter(u => u.is_active).map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name} - {user.email}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {editingMembership && (
                      <div className="space-y-2">
                        <Label>Usuario</Label>
                        <div className="p-3 border rounded-md bg-gray-50">
                          <p className="font-medium">
                            {editingMembership.user?.first_name} {editingMembership.user?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{editingMembership.user?.email}</p>
                        </div>
                      </div>
                    )}

                    {/* Paso 2: Seleccionar Zona */}
                    <div className="space-y-2">
                      <Label htmlFor="zone_filter">Zona Sanitaria *</Label>
                      <Select
                        value={selectedZone}
                        onValueChange={(value) => {
                          setSelectedZone(value)
                          setMembershipFormData({ ...membershipFormData, institution_id: '' })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar zona" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.name}>
                              {zone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Paso 3: Seleccionar Institución */}
                    <div className="space-y-2">
                      <Label htmlFor="membership_institution_id">Institución *</Label>
                      <Select
                        value={membershipFormData.institution_id}
                        onValueChange={(value) => setMembershipFormData({ ...membershipFormData, institution_id: value })}
                        disabled={!selectedZone}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedZone ? "Primero selecciona una zona" : "Seleccionar institución"} />
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
                          {Object.entries(selectableRoles).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
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
            {/* Filtros */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[20px]">
                  <Label htmlFor="membership_zone_filter">Filtrar por Zona</Label>
                  {membershipSelectedZone !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMembershipSelectedZone('ALL')
                        setMembershipSelectedInstitution('ALL')
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <Select
                  value={membershipSelectedZone}
                  onValueChange={setMembershipSelectedZone}
                >
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
                <div className="flex items-center justify-between min-h-[20px]">
                  <Label htmlFor="membership_institution_filter">Filtrar por Institución</Label>
                  {membershipSelectedInstitution !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setMembershipSelectedInstitution('ALL')}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <Select
                  value={membershipSelectedInstitution}
                  onValueChange={setMembershipSelectedInstitution}
                  disabled={membershipSelectedZone === 'ALL'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={membershipSelectedZone === 'ALL' ? 'Selecciona una zona primero' : 'Todas las instituciones'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las instituciones</SelectItem>
                    {filteredMembershipInstitutions.map((institution) => (
                      <SelectItem key={institution.id} value={institution.name}>
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[20px]">
                  <Label htmlFor="membership_search_filter">Buscar por Usuario</Label>
                  <div className="h-[20px]"></div>
                </div>
                <Input
                  id="membership_search_filter"
                  type="text"
                  placeholder="Nombre, apellido o email..."
                  value={membershipSearch}
                  onChange={(e) => setMembershipSearch(e.target.value)}
                />
              </div>
            </div>

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
            ) : filteredMemberships.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No se encontraron membresías con los filtros aplicados.
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
                  {filteredMemberships.map((membership) => (
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
