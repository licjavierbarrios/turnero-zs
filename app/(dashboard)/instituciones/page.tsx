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
import { useToast } from '@/hooks/use-toast'
import { formatInstitutionType } from '@/lib/utils'
import { Plus, Edit, Trash2, Building2 } from 'lucide-react'

type Institution = {
  id: string
  zone_id: string
  name: string
  type: 'caps' | 'hospital_seccional' | 'hospital_distrital' | 'hospital_regional'
  address: string | null
  phone: string | null
  created_at: string
  updated_at: string
  zone?: {
    id: string
    name: string
  }
}

type Zone = {
  id: string
  name: string
  description: string | null
}

export default function InstitucionesPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    zone_id: '',
    type: '' as Institution['type'] | '',
    address: '',
    phone: ''
  })
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

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
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInstitutions(data || [])
    } catch (error) {
      console.error('Error fetching institutions:', error)
      setError('Error al cargar las instituciones')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.type) {
      setError('Debe seleccionar un tipo de institución')
      return
    }

    try {
      if (editingInstitution) {
        // Update existing institution
        const { error } = await supabase
          .from('institution')
          .update({
            name: formData.name,
            zone_id: formData.zone_id,
            type: formData.type,
            address: formData.address || null,
            phone: formData.phone || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingInstitution.id)

        if (error) throw error
        
        toast({
          title: "Institución actualizada",
          description: "La institución se ha actualizado correctamente.",
        })
      } else {
        // Create new institution
        const { error } = await supabase
          .from('institution')
          .insert({
            name: formData.name,
            zone_id: formData.zone_id,
            type: formData.type,
            address: formData.address || null,
            phone: formData.phone || null
          })

        if (error) throw error
        
        toast({
          title: "Institución creada",
          description: "La institución se ha creado correctamente.",
        })
      }

      setIsDialogOpen(false)
      setEditingInstitution(null)
      resetForm()
      fetchInstitutions()
    } catch (error) {
      console.error('Error saving institution:', error)
      setError(`Error al ${editingInstitution ? 'actualizar' : 'crear'} la institución`)
    }
  }

  const handleEdit = (institution: Institution) => {
    setEditingInstitution(institution)
    setFormData({
      name: institution.name,
      zone_id: institution.zone_id,
      type: institution.type,
      address: institution.address || '',
      phone: institution.phone || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (institution: Institution) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la institución "${institution.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('institution')
        .delete()
        .eq('id', institution.id)

      if (error) throw error
      
      toast({
        title: "Institución eliminada",
        description: "La institución se ha eliminado correctamente.",
      })
      
      fetchInstitutions()
    } catch (error) {
      console.error('Error deleting institution:', error)
      setError('Error al eliminar la institución')
    }
  }

  const resetForm = () => {
    setFormData({ 
      name: '', 
      zone_id: '', 
      type: '', 
      address: '', 
      phone: '' 
    })
    setEditingInstitution(null)
    setError(null)
  }

  const getTypeColor = (type: Institution['type']) => {
    const colors = {
      caps: 'bg-green-100 text-green-800',
      hospital_seccional: 'bg-blue-100 text-blue-800',
      hospital_distrital: 'bg-purple-100 text-purple-800',
      hospital_regional: 'bg-red-100 text-red-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Instituciones</h1>
          <p className="text-muted-foreground">
            Administra las instituciones de salud del sistema
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
              Nueva Institución
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingInstitution ? 'Editar Institución' : 'Nueva Institución'}
              </DialogTitle>
              <DialogDescription>
                {editingInstitution 
                  ? 'Modifica los datos de la institución' 
                  : 'Crea una nueva institución de salud'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Hospital General, CAPS Norte"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zone_id">Zona *</Label>
                  <Select 
                    value={formData.zone_id} 
                    onValueChange={(value) => setFormData({ ...formData, zone_id: value })}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Institución *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value as Institution['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caps">CAPS - Centro de Atención Primaria</SelectItem>
                    <SelectItem value="hospital_seccional">Hospital Seccional</SelectItem>
                    <SelectItem value="hospital_distrital">Hospital Distrital</SelectItem>
                    <SelectItem value="hospital_regional">Hospital Regional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección completa de la institución"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej: +54 11 1234-5678"
                />
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
                  {editingInstitution ? 'Actualizar' : 'Crear'} Institución
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Instituciones Registradas
          </CardTitle>
          <CardDescription>
            Lista de todas las instituciones de salud del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Cargando instituciones...</p>
            </div>
          ) : institutions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay instituciones registradas. Crea la primera institución.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutions.map((institution) => (
                  <TableRow key={institution.id}>
                    <TableCell className="font-medium">{institution.name}</TableCell>
                    <TableCell>
                      {institution.zone?.name || (
                        <span className="text-muted-foreground">Sin zona</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(institution.type)}>
                        {formatInstitutionType(institution.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {institution.address ? (
                        <span className="text-sm">{institution.address}</span>
                      ) : (
                        <span className="text-muted-foreground">Sin dirección</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {institution.phone || (
                        <span className="text-muted-foreground">Sin teléfono</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(institution.created_at).toLocaleDateString('es-AR')}
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
                          onClick={() => handleDelete(institution)}
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
    </div>
  )
}