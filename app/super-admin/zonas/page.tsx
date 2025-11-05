'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, MapPin } from 'lucide-react'
import type { Zone } from '@/lib/types'
import { ZoneForm } from './components/ZoneForm'
import { ZoneTableRow } from './components/ZoneTableRow'
import { ZoneStats } from './components/ZoneStats'

export default function SuperAdminZonasPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [institutionCounts, setInstitutionCounts] = useState<Record<string, number>>({})
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [error, setError] = useState<string | null>(null)
  const { toast} = useToast()

  const fetchZones = useCallback(async () => {
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
  }, [toast])

  const fetchInstitutionCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('institution')
        .select('zone_id')

      if (error) throw error

      // Contar instituciones por zona
      const counts: Record<string, number> = {}
      data?.forEach((inst: any) => {
        counts[inst.zone_id] = (counts[inst.zone_id] || 0) + 1
      })

      setInstitutionCounts(counts)
    } catch (error) {
      console.error('Error fetching institution counts:', error)
    }
  }, [])

  useEffect(() => {
    fetchZones()
    fetchInstitutionCounts()
  }, [fetchZones, fetchInstitutionCounts])

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

  const openDeleteDialog = (zone: Zone) => {
    const institutionCount = institutionCounts[zone.id] || 0

    if (institutionCount > 0) {
      toast({
        title: "No se puede eliminar",
        description: `Esta zona tiene ${institutionCount} institución(es) asignada(s). Debes reasignarlas o eliminarlas primero.`,
        variant: "destructive"
      })
      return
    }

    setDeletingZone(zone)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingZone) return

    try {
      const { error } = await supabase
        .from('zone')
        .delete()
        .eq('id', deletingZone.id)

      if (error) throw error

      toast({
        title: "Zona eliminada",
        description: `La zona "${deletingZone.name}" se ha eliminado correctamente.`,
      })

      setIsDeleteDialogOpen(false)
      setDeletingZone(null)
      fetchZones()
      fetchInstitutionCounts()
    } catch (error: any) {
      console.error('Error deleting zone:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la zona sanitaria.",
        variant: "destructive"
      })
      setIsDeleteDialogOpen(false)
      setDeletingZone(null)
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

  // Filtrar zonas: excluir zona del sistema
  const visibleZones = zones.filter(z => z.name !== 'Sistema')

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
            <form onSubmit={handleSubmit} className="space-y-4">
              <ZoneForm
                formData={formData}
                error={error}
                editingZone={editingZone}
                onFormChange={(field, value) => setFormData({ ...formData, [field]: value })}
              />

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
      <ZoneStats zones={visibleZones} institutionCounts={institutionCounts} />

      {/* Zonas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Zonas</CardTitle>
          <CardDescription>
            Administra las zonas sanitarias del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visibleZones.length === 0 ? (
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
                {visibleZones.map((zone) => (
                  <ZoneTableRow
                    key={zone.id}
                    zone={zone}
                    institutionCount={institutionCounts[zone.id] || 0}
                    onEdit={handleEdit}
                    onDelete={openDeleteDialog}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la zona sanitaria <strong>{deletingZone?.name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setDeletingZone(null)
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
