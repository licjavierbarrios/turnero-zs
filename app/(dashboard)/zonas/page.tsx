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
import { Plus, Edit, Trash2 } from 'lucide-react'

type Zone = {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export default function ZonasPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchZones()
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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
          description: "La zona se ha actualizado correctamente.",
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
          description: "La zona se ha creado correctamente.",
        })
      }

      setIsDialogOpen(false)
      setEditingZone(null)
      setFormData({ name: '', description: '' })
      fetchZones()
    } catch (error) {
      console.error('Error saving zone:', error)
      setError(`Error al ${editingZone ? 'actualizar' : 'crear'} la zona`)
    }
  }

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone)
    setFormData({
      name: zone.name,
      description: zone.description || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (zone: Zone) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la zona "${zone.name}"?`)) {
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
        description: "La zona se ha eliminado correctamente.",
      })
      
      fetchZones()
    } catch (error) {
      console.error('Error deleting zone:', error)
      setError('Error al eliminar la zona')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '' })
    setEditingZone(null)
    setError(null)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Zonas</h1>
          <p className="text-muted-foreground">
            Administra las zonas del sistema de salud
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
              Nueva Zona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingZone ? 'Editar Zona' : 'Nueva Zona'}
              </DialogTitle>
              <DialogDescription>
                {editingZone 
                  ? 'Modifica los datos de la zona' 
                  : 'Crea una nueva zona para organizar las instituciones'
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
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Zona Norte, Zona Centro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción opcional de la zona"
                  rows={3}
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
                  {editingZone ? 'Actualizar' : 'Crear'} Zona
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zonas Registradas</CardTitle>
          <CardDescription>
            Lista de todas las zonas del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Cargando zonas...</p>
            </div>
          ) : zones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay zonas registradas. Crea la primera zona.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>
                      {zone.description || (
                        <span className="text-muted-foreground">Sin descripción</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(zone.created_at).toLocaleDateString('es-AR')}
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