'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Building2, MapPin, AlertCircle } from 'lucide-react'
import type { Institution, InstitutionType, Zone } from '@/lib/types'
import { INSTITUTION_TYPE_LABELS } from '@/lib/types'

type InstitutionWithZone = Institution & {
  zone?: Zone
}

export default function SuperAdminInstitucionesPage() {
  const [institutions, setInstitutions] = useState<InstitutionWithZone[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInstitution, setEditingInstitution] = useState<InstitutionWithZone | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    zone_id: '',
    type: '' as InstitutionType | '',
    address: '',
    phone: '',
    slug: ''
  })
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingInstitution, setDeletingInstitution] = useState<InstitutionWithZone | null>(null)

  useEffect(() => {
    Promise.all([fetchInstitutions(), fetchZones()])
  }, [])

  const fetchInstitutions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('institution')
        .select(`
          *,
          zone:zone_id (
            id,
            name,
            description
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInstitutions(data || [])
    } catch (error) {
      console.error('Error fetching institutions:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las instituciones.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from('zone')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setZones(data || [])
    } catch (error) {
      console.error('Error fetching zones:', error)
    }
  }

  // Generar slug automático desde el nombre
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno solo
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      // Solo auto-generar slug si no estamos editando o si el slug está vacío
      slug: editingInstitution ? formData.slug : generateSlug(name)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (!formData.zone_id) {
      setError('Debes seleccionar una zona')
      return
    }

    if (!formData.type) {
      setError('Debes seleccionar un tipo de institución')
      return
    }

    if (!formData.slug.trim()) {
      setError('El slug es requerido')
      return
    }

    try {
      const institutionData = {
        name: formData.name,
        zone_id: formData.zone_id,
        type: formData.type as InstitutionType,
        address: formData.address || null,
        phone: formData.phone || null,
        slug: formData.slug,
        updated_at: new Date().toISOString()
      }

      if (editingInstitution) {
        // Update
        const { error } = await supabase
          .from('institution')
          .update(institutionData)
          .eq('id', editingInstitution.id)

        if (error) throw error

        toast({
          title: "Institución actualizada",
          description: `La institución "${formData.name}" se ha actualizado correctamente.`,
        })
      } else {
        // Create
        const { error } = await supabase
          .from('institution')
          .insert(institutionData)

        if (error) throw error

        toast({
          title: "Institución creada",
          description: `La institución "${formData.name}" se ha creado correctamente.`,
        })
      }

      setIsDialogOpen(false)
      setEditingInstitution(null)
      setFormData({ name: '', zone_id: '', type: '', address: '', phone: '', slug: '' })
      fetchInstitutions()
    } catch (error: any) {
      console.error('Error saving institution:', error)
      if (error.message?.includes('unique')) {
        setError('Ya existe una institución con ese slug. Por favor usa uno diferente.')
      } else {
        setError(error.message || 'Error al guardar la institución')
      }
      toast({
        title: "Error",
        description: "No se pudo guardar la institución.",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (institution: InstitutionWithZone) => {
    setEditingInstitution(institution)
    setFormData({
      name: institution.name,
      zone_id: institution.zone_id,
      type: institution.type,
      address: institution.address || '',
      phone: institution.phone || '',
      slug: institution.slug
    })
    setIsDialogOpen(true)
    setError(null)
  }

  const openDeleteDialog = (institution: InstitutionWithZone) => {
    setDeletingInstitution(institution)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingInstitution) return

    try {
      const { error } = await supabase
        .from('institution')
        .delete()
        .eq('id', deletingInstitution.id)

      if (error) throw error

      toast({
        title: "Institución eliminada",
        description: `La institución "${deletingInstitution.name}" se ha eliminado correctamente.`,
      })

      setIsDeleteDialogOpen(false)
      setDeletingInstitution(null)
      fetchInstitutions()
    } catch (error: any) {
      console.error('Error deleting institution:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la institución.",
        variant: "destructive"
      })
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingInstitution(null)
    setFormData({ name: '', zone_id: '', type: '', address: '', phone: '', slug: '' })
    setError(null)
  }

  const getInstitutionTypeColor = (type: InstitutionType): string => {
    switch (type) {
      case 'caps':
        return 'bg-green-100 text-green-800'
      case 'hospital_seccional':
        return 'bg-blue-100 text-blue-800'
      case 'hospital_distrital':
        return 'bg-purple-100 text-purple-800'
      case 'hospital_regional':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Agrupar instituciones por zona
  const institutionsByZone = institutions.reduce((acc, inst) => {
    const zoneName = inst.zone?.name || 'Sin zona'
    if (!acc[zoneName]) acc[zoneName] = []
    acc[zoneName].push(inst)
    return acc
  }, {} as Record<string, InstitutionWithZone[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando instituciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instituciones de Salud</h1>
          <p className="text-gray-500 mt-2">
            Gestión de CAPS, hospitales y centros de salud
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Institución
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingInstitution ? 'Editar Institución' : 'Nueva Institución de Salud'}
              </DialogTitle>
              <DialogDescription>
                {editingInstitution
                  ? 'Modifica los datos de la institución'
                  : 'Registra una nueva institución de salud (CAPS, hospital, etc.)'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Nombre de la Institución *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: CAPS Villa María, Hospital Regional Norte"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zone">Zona Sanitaria *</Label>
                  <Select
                    value={formData.zone_id}
                    onValueChange={(value) => setFormData({ ...formData, zone_id: value })}
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

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Institución *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as InstitutionType })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caps">CAPS</SelectItem>
                      <SelectItem value="hospital_seccional">Hospital Seccional</SelectItem>
                      <SelectItem value="hospital_distrital">Hospital Distrital</SelectItem>
                      <SelectItem value="hospital_regional">Hospital Regional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="slug">Slug (URL amigable) *</Label>
                  <Input
                    id="slug"
                    placeholder="ej: caps-villa-maria"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Se usa para URLs públicas. Solo letras, números y guiones.
                  </p>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    placeholder="Dirección completa"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="Ej: (0123) 456-7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingInstitution ? 'Actualizar' : 'Crear'} Institución
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instituciones</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{institutions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CAPS</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {institutions.filter(i => i.type === 'caps').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hospitales</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {institutions.filter(i => i.type !== 'caps').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zonas Activas</CardTitle>
            <MapPin className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(institutionsByZone).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instituciones Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Instituciones</CardTitle>
          <CardDescription>
            Administra las instituciones de salud del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {institutions.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay instituciones registradas
              </h3>
              <p className="text-gray-500 mb-4">
                Comienza registrando la primera institución de salud
              </p>
              {zones.length === 0 ? (
                <p className="text-sm text-orange-600 mb-4">
                  ⚠️ Primero debes crear al menos una zona sanitaria
                </p>
              ) : (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Institución
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutions.map((institution) => (
                  <TableRow key={institution.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-purple-600 mr-2" />
                        <div>
                          <div>{institution.name}</div>
                          <div className="text-xs text-gray-500">/{institution.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getInstitutionTypeColor(institution.type)}>
                        {INSTITUTION_TYPE_LABELS[institution.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                        {institution.zone?.name || 'Sin zona'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {institution.address || (
                        <span className="text-gray-400 italic">Sin dirección</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {institution.phone || (
                        <span className="text-gray-400 italic">Sin teléfono</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(institution)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(institution)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación de institución</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingInstitution && (
                <>
                  ¿Estás seguro de que deseas eliminar la institución <strong>{deletingInstitution.name}</strong>?
                  <br /><br />
                  <strong>Esto eliminará también todos los recursos relacionados:</strong>
                  <ul className="list-disc list-inside mt-2">
                    <li>Profesionales asignados</li>
                    <li>Consultorios y servicios</li>
                    <li>Turnos y eventos de atención</li>
                    <li>Membresías de usuarios</li>
                  </ul>
                  <br />
                  <strong>Esta acción no se puede deshacer.</strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar institución
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
