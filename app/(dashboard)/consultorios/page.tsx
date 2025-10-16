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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, DoorOpen, DoorClosed, Building } from 'lucide-react'

type Room = {
  id: string
  institution_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
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

export default function ConsultoriosPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    institution_id: '',
    description: '',
    is_active: true
  })
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Get current institution from localStorage
    const contextData = localStorage.getItem('institution_context')
    if (contextData) {
      const context = JSON.parse(contextData)
      setCurrentInstitutionId(context.institution_id)
      setFormData(prev => ({ ...prev, institution_id: context.institution_id }))
    }

    Promise.all([fetchRooms(), fetchInstitutions()])
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)

      // Get current institution from localStorage
      const contextData = localStorage.getItem('institution_context')
      if (!contextData) {
        setError('No se encontró el contexto de la institución')
        return
      }
      const context = JSON.parse(contextData)

      const { data, error } = await supabase
        .from('room')
        .select(`
          *,
          institution:institution_id!inner (
            id,
            name,
            zone_name:zone!inner(name)
          )
        `)
        .eq('institution_id', context.institution_id)
        .order('name', { ascending: true })

      if (error) throw error

      const formattedData = data?.map((item: any) => ({
        ...item,
        institution: item.institution ? {
          id: item.institution.id,
          name: item.institution.name,
          zone_name: item.institution.zone_name?.[0]?.name || 'Sin zona'
        } : undefined
      })) || []

      setRooms(formattedData)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      setError('Error al cargar los consultorios')
    } finally {
      setLoading(false)
    }
  }

  const fetchInstitutions = async () => {
    try {
      // Get current institution from localStorage
      const contextData = localStorage.getItem('institution_context')
      if (!contextData) {
        return
      }
      const context = JSON.parse(contextData)

      const { data, error } = await supabase
        .from('institution')
        .select(`
          id,
          name,
          zone_name:zone!inner(name)
        `)
        .eq('id', context.institution_id)
        .single()

      if (error) throw error

      const formattedData = {
        id: data.id,
        name: data.name,
        zone_name: data.zone_name?.[0]?.name || 'Sin zona'
      }

      setInstitutions([formattedData])
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Validar que tenemos institution_id
      if (!formData.institution_id) {
        setError('No se ha establecido la institución')
        return
      }

      if (editingRoom) {
        // Update existing room
        const { error } = await supabase
          .from('room')
          .update({
            name: formData.name,
            institution_id: formData.institution_id,
            description: formData.description || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRoom.id)

        if (error) throw error

        toast({
          title: "Consultorio actualizado",
          description: "El consultorio se ha actualizado correctamente.",
        })
      } else {
        // Create new room
        const { error } = await supabase
          .from('room')
          .insert({
            name: formData.name,
            institution_id: formData.institution_id,
            description: formData.description || null,
            is_active: formData.is_active
          })

        if (error) throw error

        toast({
          title: "Consultorio creado",
          description: "El consultorio se ha creado correctamente.",
        })
      }

      setIsDialogOpen(false)
      setEditingRoom(null)
      resetForm()
      fetchRooms()
    } catch (error) {
      console.error('Error saving room:', error)
      setError(`Error al ${editingRoom ? 'actualizar' : 'crear'} el consultorio`)
    }
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      institution_id: room.institution_id,
      description: room.description || '',
      is_active: room.is_active
    })
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (room: Room) => {
    try {
      const { error } = await supabase
        .from('room')
        .update({
          is_active: !room.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', room.id)

      if (error) throw error
      
      toast({
        title: room.is_active ? "Consultorio desactivado" : "Consultorio activado",
        description: `El consultorio ha sido ${room.is_active ? 'desactivado' : 'activado'} correctamente.`,
      })
      
      fetchRooms()
    } catch (error) {
      console.error('Error toggling room status:', error)
      setError('Error al cambiar el estado del consultorio')
    }
  }

  const openDeleteDialog = (room: Room) => {
    setDeletingRoom(room)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingRoom) return

    try {
      const { error } = await supabase
        .from('room')
        .delete()
        .eq('id', deletingRoom.id)

      if (error) throw error

      toast({
        title: "Consultorio eliminado",
        description: "El consultorio se ha eliminado correctamente.",
      })

      fetchRooms()
    } catch (error) {
      console.error('Error deleting room:', error)
      setError('Error al eliminar el consultorio')
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingRoom(null)
    }
  }

  const resetForm = () => {
    const contextData = localStorage.getItem('institution_context')
    const institutionId = contextData ? JSON.parse(contextData).institution_id : ''

    setFormData({
      name: '',
      institution_id: institutionId,
      description: '',
      is_active: true
    })
    setEditingRoom(null)
    setError(null)
  }

  // Group rooms by institution for better display
  const roomsByInstitution = rooms.reduce((acc, room) => {
    if (!room.institution) return acc
    
    const institutionKey = `${room.institution.name} - ${room.institution.zone_name}`
    if (!acc[institutionKey]) {
      acc[institutionKey] = []
    }
    acc[institutionKey].push(room)
    return acc
  }, {} as Record<string, Room[]>)

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Consultorios</h1>
          <p className="text-muted-foreground">
            Administra los consultorios y salas de las instituciones
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
              Nuevo Consultorio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRoom ? 'Editar Consultorio' : 'Nuevo Consultorio'}
              </DialogTitle>
              <DialogDescription>
                {editingRoom 
                  ? 'Modifica los datos del consultorio' 
                  : 'Crea un nuevo consultorio o sala'
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
                <Label htmlFor="room_name">Nombre *</Label>
                <Input
                  id="room_name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Consultorio 1, Sala de Emergencias"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room_institution_id">Institución *</Label>
                <Input
                  id="room_institution_id"
                  type="text"
                  value={institutions[0]?.name ? `${institutions[0].name} - ${institutions[0].zone_name}` : 'Cargando...'}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room_description">Descripción</Label>
                <Textarea
                  id="room_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del consultorio o sala"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="room_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="room_is_active">Consultorio activo</Label>
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
                  {editingRoom ? 'Actualizar' : 'Crear'} Consultorio
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p>Cargando consultorios...</p>
        </div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-muted-foreground">
              No hay consultorios registrados. Crea el primer consultorio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(roomsByInstitution).map(([institutionName, institutionRooms]) => (
            <Card key={institutionName}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  {institutionName}
                </CardTitle>
                <CardDescription>
                  {institutionRooms.length} consultorio{institutionRooms.length !== 1 ? 's' : ''} registrado{institutionRooms.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {institutionRooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {room.is_active ? (
                              <DoorOpen className="mr-2 h-4 w-4 text-green-600" />
                            ) : (
                              <DoorClosed className="mr-2 h-4 w-4 text-red-600" />
                            )}
                            {room.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {room.description || (
                            <span className="text-muted-foreground">Sin descripción</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={room.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {room.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(room.created_at).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(room)}
                              title={room.is_active ? 'Desactivar' : 'Activar'}
                            >
                              {room.is_active ? (
                                <DoorClosed className="h-4 w-4" />
                              ) : (
                                <DoorOpen className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(room)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(room)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el consultorio <strong>{deletingRoom?.name}</strong>.
              <br /><br />
              <strong>Esta acción no se puede deshacer.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setDeletingRoom(null)
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