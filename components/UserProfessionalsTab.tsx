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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2 } from 'lucide-react'

type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
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

type Professional = {
  id: string
  user_id: string
  institution_id: string
  professional_type: string | null
  speciality: string | null
  license_number: string | null
  is_active: boolean
  created_at: string
  user?: User
  institution?: Institution
}

interface UserProfessionalsTabProps {
  users: User[]
  zones: Zone[]
  institutions: Institution[]
}

const PROFESSIONAL_TYPES = [
  { value: 'medico', label: 'Médico' },
  { value: 'enfermero', label: 'Enfermero' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'psicologo', label: 'Psicólogo' },
  { value: 'odontologo', label: 'Odontólogo' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'otro', label: 'Otro' }
]

export function UserProfessionalsTab({
  users,
  zones,
  institutions
}: UserProfessionalsTabProps) {
  const { toast } = useToast()

  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    user_id: '',
    institution_id: '',
    professional_type: '',
    speciality: '',
    license_number: '',
    zone_id: ''
  })

  // Filter states
  const [selectedZone, setSelectedZone] = useState('ALL')
  const [selectedInstitution, setSelectedInstitution] = useState('ALL')
  const [userSearch, setUserSearch] = useState('')

  // Computed states
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([])

  // Load professionals
  useEffect(() => {
    fetchProfessionals()
  }, [])

  // Filter institutions by zone
  useEffect(() => {
    if (selectedZone === 'ALL') {
      setFilteredInstitutions(institutions)
    } else {
      setFilteredInstitutions(
        institutions.filter(i => i.zone_name === selectedZone)
      )
    }
  }, [selectedZone, institutions])

  // Filter users by search and exclude those already assigned as professionals
  useEffect(() => {
    const assignedUserIds = new Set(professionals.map(p => p.user_id))
    let filtered = users.filter(u => !assignedUserIds.has(u.id) && u.is_active)

    if (userSearch.trim() !== '') {
      const search = userSearch.toLowerCase()
      filtered = filtered.filter(u =>
        u.first_name.toLowerCase().includes(search) ||
        u.last_name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      )
    }

    setFilteredUsers(filtered)
  }, [userSearch, users, professionals])

  // Filter professionals by zone and institution
  useEffect(() => {
    let filtered = professionals

    if (selectedZone !== 'ALL') {
      filtered = filtered.filter(p => {
        const inst = institutions.find(i => i.id === p.institution_id)
        return inst?.zone_name === selectedZone
      })
    }

    if (selectedInstitution !== 'ALL') {
      filtered = filtered.filter(p => p.institution_id === selectedInstitution)
    }

    setFilteredProfessionals(filtered)
  }, [professionals, selectedZone, selectedInstitution, institutions])

  const fetchProfessionals = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('professional')
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
            zone:zone_id(name)
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const formattedData = data?.map((item: any) => ({
        ...item,
        institution: item.institution ? {
          id: item.institution.id,
          name: item.institution.name,
          zone_name: item.institution.zone?.name || 'Sin zona'
        } : undefined
      })) || []

      setProfessionals(formattedData)
    } catch (err) {
      console.error('Error fetching professionals:', err)
      setError('Error al cargar profesionales')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.user_id || !formData.institution_id || !formData.professional_type) {
      setError('Debes completar usuario, institución y tipo de profesional')
      return
    }

    try {
      // Obtener los datos del usuario para guardarlos en el registro profesional
      const selectedUser = users.find(u => u.id === formData.user_id)
      if (!selectedUser && !editingProfessional) {
        setError('Usuario no encontrado')
        return
      }

      if (editingProfessional) {
        // Update professional
        const { error: updateError } = await supabase
          .from('professional')
          .update({
            institution_id: formData.institution_id,
            professional_type: formData.professional_type,
            speciality: formData.speciality || null,
            license_number: formData.license_number || null,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProfessional.id)

        if (updateError) throw updateError

        toast({
          title: "Profesional actualizado",
          description: "El profesional se ha actualizado correctamente.",
        })
      } else {
        // Create professional - guardar también first_name, last_name y email del usuario
        const { error: insertError } = await supabase
          .from('professional')
          .insert({
            user_id: formData.user_id,
            institution_id: formData.institution_id,
            professional_type: formData.professional_type,
            speciality: formData.speciality || null,
            license_number: formData.license_number || null,
            first_name: selectedUser!.first_name,
            last_name: selectedUser!.last_name,
            email: selectedUser!.email,
            is_active: true
          })

        if (insertError) throw insertError

        toast({
          title: "Profesional creado",
          description: "El profesional se ha creado correctamente.",
        })
      }

      setIsDialogOpen(false)
      setEditingProfessional(null)
      resetForm()
      fetchProfessionals()
    } catch (err: any) {
      console.error('Error saving professional:', err)
      if (err.code === '23505') {
        setError('Este usuario ya está asignado como profesional')
      } else {
        setError(`Error al ${editingProfessional ? 'actualizar' : 'crear'} el profesional`)
      }
    }
  }

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional)
    setFormData({
      user_id: professional.user_id,
      institution_id: professional.institution_id,
      professional_type: professional.professional_type || '',
      speciality: professional.speciality || '',
      license_number: professional.license_number || '',
      zone_id: institutions.find(i => i.id === professional.institution_id)?.zone_name || ''
    })
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (professional: Professional) => {
    setDeletingProfessional(professional)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingProfessional) return

    try {
      // Delete any daily assignments for this professional
      const { error: assignmentError } = await supabase
        .from('daily_professional_assignment')
        .delete()
        .eq('professional_id', deletingProfessional.id)

      if (assignmentError) throw assignmentError

      // Delete the professional
      const { error: deleteError } = await supabase
        .from('professional')
        .delete()
        .eq('id', deletingProfessional.id)

      if (deleteError) throw deleteError

      toast({
        title: "Profesional eliminado",
        description: "El profesional se ha eliminado correctamente.",
      })

      setIsDeleteDialogOpen(false)
      setDeletingProfessional(null)
      fetchProfessionals()
    } catch (err) {
      console.error('Error deleting professional:', err)
      setError('Error al eliminar el profesional')
    }
  }

  const resetForm = () => {
    setFormData({
      user_id: '',
      institution_id: '',
      professional_type: '',
      speciality: '',
      license_number: '',
      zone_id: ''
    })
    setSelectedZone('ALL')
    setSelectedInstitution('ALL')
    setUserSearch('')
    setEditingProfessional(null)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Dialog */}
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
            Nuevo Profesional
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProfessional ? 'Editar Profesional' : 'Nuevo Profesional'}
            </DialogTitle>
            <DialogDescription>
              {editingProfessional
                ? 'Modifica los datos del profesional'
                : 'Asigna un usuario como profesional que atiende pacientes'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!editingProfessional && (
              <>
                {/* User Search & Selection */}
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
                          No se encontraron usuarios disponibles
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
              </>
            )}

            {editingProfessional && (
              <div className="space-y-2">
                <Label>Usuario</Label>
                <div className="p-3 border rounded-md bg-gray-50">
                  <p className="font-medium">
                    {editingProfessional.user?.first_name} {editingProfessional.user?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{editingProfessional.user?.email}</p>
                </div>
              </div>
            )}

            {/* Zone Selection */}
            <div className="space-y-2">
              <Label htmlFor="zone_id">Zona Sanitaria *</Label>
              <Select
                value={formData.zone_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, zone_id: value, institution_id: '' })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar zona" />
                </SelectTrigger>
                <SelectContent>
                  {zones
                    .filter(z => z.name !== 'Sistema')
                    .map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Institution Selection */}
            {formData.zone_id && (
              <div className="space-y-2">
                <Label htmlFor="institution_id">Institución *</Label>
                <Select
                  value={formData.institution_id}
                  onValueChange={(value) => setFormData({ ...formData, institution_id: value })}
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
                      filteredInstitutions
                        .filter(i => i.name !== 'Administración del Sistema')
                        .map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>
                            {inst.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Professional Type */}
            <div className="space-y-2">
              <Label htmlFor="professional_type">Tipo de Profesional *</Label>
              <Select
                value={formData.professional_type}
                onValueChange={(value) => setFormData({ ...formData, professional_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {PROFESSIONAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speciality */}
            <div className="space-y-2">
              <Label htmlFor="speciality">Especialidad</Label>
              <Input
                id="speciality"
                type="text"
                value={formData.speciality}
                onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                placeholder="Ej: Cardiología, Pediatría"
              />
            </div>

            {/* License Number */}
            <div className="space-y-2">
              <Label htmlFor="license_number">Matrícula</Label>
              <Input
                id="license_number"
                type="text"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="Ej: MP 12345"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingProfessional ? 'Actualizar' : 'Crear'} Profesional
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Zona
            </label>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las zonas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las zonas</SelectItem>
                {zones
                  .filter(z => z.name !== 'Sistema')
                  .map((zone) => (
                    <SelectItem key={zone.id} value={zone.name}>
                      {zone.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Institución
            </label>
            <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las instituciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las instituciones</SelectItem>
                {institutions
                  .filter(i =>
                    (selectedZone === 'ALL' || i.zone_name === selectedZone) &&
                    i.name !== 'Administración del Sistema'
                  )
                  .map((institution) => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Profesionales Registrados</CardTitle>
          <CardDescription>
            Total: {filteredProfessionals.length} profesional(es)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProfessionals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {professionals.length === 0
                  ? 'No hay profesionales registrados en el sistema.'
                  : 'No hay profesionales que coincidan con los filtros seleccionados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Institución</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessionals.map((professional) => (
                    <TableRow key={professional.id}>
                      <TableCell className="font-medium">
                        {professional.user?.first_name} {professional.user?.last_name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {professional.user?.email || '-'}
                      </TableCell>
                      <TableCell>
                        {PROFESSIONAL_TYPES.find(t => t.value === professional.professional_type)?.label || professional.professional_type || '-'}
                      </TableCell>
                      <TableCell>
                        {professional.speciality || '-'}
                      </TableCell>
                      <TableCell>
                        {professional.license_number || '-'}
                      </TableCell>
                      <TableCell>
                        {professional.institution?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {professional.institution?.zone_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={professional.is_active ? 'default' : 'secondary'}>
                          {professional.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(professional)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(professional)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación de profesional</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingProfessional && (
                <>
                  ¿Estás seguro de que deseas eliminar a <strong>{deletingProfessional.user?.first_name} {deletingProfessional.user?.last_name}</strong> como profesional?
                  <br /><br />
                  También se eliminarán todas sus asignaciones de consultorios.
                  <br /><br />
                  <strong>Esta acción no se puede deshacer.</strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar profesional
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
