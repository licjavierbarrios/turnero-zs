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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, MapPin, Building2, AlertCircle } from 'lucide-react'
import type { Zone } from '@/lib/types'

export default function SuperAdminZonasPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [institutionCounts, setInstitutionCounts] = useState<Record<string, number>>({})
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchZones()
    fetchInstitutionCounts()
  }, [])

  const fetchZones = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('zone')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setZones(data || [])
    } catch (error) {
      console.error('Error fetching zones:', error)
      setError('Error al cargar las zonas')
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas sanitarias.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchInstitutionCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('institution')
        .select('zone_id')

      if (error) throw error

      // Contar instituciones por zona
      const counts: Record<string, number> = {}
      data?.forEach((inst) => {
        counts[inst.zone_id] = (counts[inst.zone_id] || 0) + 1
      })

      setInstitutionCounts(counts)
    } catch (error) {
      console.error('Error fetching institution counts:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('El nombre es requerido')
      return
    }

    try {
      if (editingZone) {
        // Update existing zone
        const { error } = await supabase
          .from('zone')
          .update({
            name: formData.name,
            description: formData.description || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingZone.id)

        if (error) throw error

        toast({
          title: "Zona actualizada",
          description: `La zona "${formData.name}" se ha actualizado correctamente.`,
        })
      } else {
        // Create new zone
        const { error } = await supabase
          .from('zone')
          .insert({
            name: formData.name,
            description: formData.description || null
          })

        if (error) throw error

        toast({
          title: "Zona creada",
          description: `La zona "${formData.name}" se ha creado correctamente.`,
        })
      }

      setIsDialogOpen(false)
      setEditingZone(null)
      setFormData({ name: '', description: '' })
      fetchZones()
      fetchInstitutionCounts()
    } catch (error: any) {
      console.error('Error saving zone:', error)
      setError(error.message || 'Error al guardar la zona')
      toast({
        title: "Error",
        description: "No se pudo guardar la zona sanitaria.",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone)
    setFormData({
      name: zone.name,
      description: zone.description || ''
    })
    setIsDialogOpen(true)
    setError(null)
  }

  const handleDelete = async (zone: Zone) => {
    const institutionCount = institutionCounts[zone.id] || 0

    if (institutionCount > 0) {
      toast({
        title: "No se puede eliminar",
        description: `Esta zona tiene ${institutionCount} institución(es) asignada(s). Debes reasignarlas o eliminarlas primero.`,
        variant: "destructive"
      })
      return
    }

    if (!confirm(`¿Estás seguro de eliminar la zona "${zone.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('zone')
        .delete()
        .eq('id', zone.id)

      if (error) throw error

      toast({
        title: "Zona eliminada",
        description: `La zona "${zone.name}" se ha eliminado correctamente.`,
      })

      fetchZones()
      fetchInstitutionCounts()
    } catch (error: any) {
      console.error('Error deleting zone:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la zona sanitaria.",
        variant: "destructive"
      })
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingZone(null)
    setFormData({ name: '', description: '' })
    setError(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando zonas sanitarias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zonas Sanitarias</h1>
          <p className="text-gray-500 mt-2">
            Gestión de zonas geográficas del sistema de salud
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Zona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingZone ? 'Editar Zona Sanitaria' : 'Nueva Zona Sanitaria'}
              </DialogTitle>
              <DialogDescription>
                {editingZone
                  ? 'Modifica los datos de la zona sanitaria'
                  : 'Crea una nueva zona geográfica para organizar las instituciones de salud'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Zona *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Zona Norte, Zona Centro, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción opcional de la zona sanitaria"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingZone ? 'Actualizar' : 'Crear'} Zona
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Zonas</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              Zonas sanitarias registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Instituciones</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(institutionCounts).reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Instituciones en todas las zonas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zones.length > 0
                ? Math.round(Object.values(institutionCounts).reduce((a, b) => a + b, 0) / zones.length)
                : 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Instituciones por zona
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zonas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Zonas</CardTitle>
          <CardDescription>
            Administra las zonas sanitarias del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay zonas sanitarias
              </h3>
              <p className="text-gray-500 mb-4">
                Comienza creando la primera zona sanitaria del sistema
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Zona
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Instituciones</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-purple-600 mr-2" />
                        {zone.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {zone.description || (
                        <span className="text-gray-400 italic">Sin descripción</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Building2 className="h-3 w-3 mr-1" />
                        {institutionCounts[zone.id] || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDate(zone.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(zone)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(zone)}
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
    </div>
  )
}
