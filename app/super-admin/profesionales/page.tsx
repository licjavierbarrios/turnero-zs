'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Stethoscope } from 'lucide-react'
import { ProfessionalForm } from './components/ProfessionalForm'
import { ProfessionalTableRow } from './components/ProfessionalTableRow'

type Professional = {
  id: string
  institution_id: string
  first_name: string
  last_name: string
  speciality: string | null
  license_number: string | null
  email: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  institution?: {
    id: string
    name: string
    zone?: {
      name: string
    } | null
  }
}

type Institution = {
  id: string
  name: string
  zone_name: string
}

export default function SuperAdminProfesionalesPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null)
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    institution_id: '',
    speciality: '',
    license_number: '',
    email: '',
    phone: '',
    is_active: true
  })
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([fetchProfessionals(), fetchInstitutions()])
  }, [])

  const fetchProfessionals = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('professional')
        .select(`
          *,
          institution:institution_id (
            id,
            name,
            zone:zone_id (
              name
            )
          )
        `)
        .order('last_name', { ascending: true })

      if (error) throw error
      setProfessionals(data || [])
    } catch (error) {
      console.error('Error fetching professionals:', error)
      setError('Error al cargar los profesionales')
    } finally {
      setLoading(false)
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
      const formattedData = data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        zone_name: item.zone_name?.[0]?.name || 'Sin zona'
      })) || []
      setInstitutions(formattedData)
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (editingProfessional) {
        // Update existing professional
        const { error } = await supabase
          .from('professional')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            institution_id: formData.institution_id,
            speciality: formData.speciality || null,
            license_number: formData.license_number || null,
            email: formData.email || null,
            phone: formData.phone || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProfessional.id)

        if (error) throw error

        toast({
          title: "Profesional actualizado",
          description: "El profesional se ha actualizado correctamente.",
        })
      } else {
        // Create new professional
        const { error } = await supabase
          .from('professional')
          .insert({
            first_name: formData.first_name,
            last_name: formData.last_name,
            institution_id: formData.institution_id,
            speciality: formData.speciality || null,
            license_number: formData.license_number || null,
            email: formData.email || null,
            phone: formData.phone || null,
            is_active: formData.is_active
          })

        if (error) throw error

        toast({
          title: "Profesional creado",
          description: "El profesional se ha creado correctamente.",
        })
      }

      setIsDialogOpen(false)
      setEditingProfessional(null)
      resetForm()
      fetchProfessionals()
    } catch (error) {
      console.error('Error saving professional:', error)
      setError(`Error al ${editingProfessional ? 'actualizar' : 'crear'} el profesional`)
    }
  }

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional)
    setFormData({
      first_name: professional.first_name,
      last_name: professional.last_name,
      institution_id: professional.institution_id,
      speciality: professional.speciality || '',
      license_number: professional.license_number || '',
      email: professional.email || '',
      phone: professional.phone || '',
      is_active: professional.is_active
    })
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (professional: Professional) => {
    try {
      const { error } = await supabase
        .from('professional')
        .update({
          is_active: !professional.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', professional.id)

      if (error) throw error

      toast({
        title: professional.is_active ? "Profesional desactivado" : "Profesional activado",
        description: `El profesional ha sido ${professional.is_active ? 'desactivado' : 'activado'} correctamente.`,
      })

      fetchProfessionals()
    } catch (error) {
      console.error('Error toggling professional status:', error)
      setError('Error al cambiar el estado del profesional')
    }
  }

  const openDeleteDialog = async (professional: Professional) => {
    setDeletingProfessional(professional)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingProfessional) return

    try {
      // Verificar relaciones antes de intentar eliminar
      const [slotTemplates, appointments, assignments, queueItems] = await Promise.all([
        supabase.from('slot_template').select('id', { count: 'exact', head: true }).eq('professional_id', deletingProfessional.id),
        supabase.from('appointment').select('id', { count: 'exact', head: true }).eq('professional_id', deletingProfessional.id),
        supabase.from('daily_professional_assignment').select('id', { count: 'exact', head: true }).eq('professional_id', deletingProfessional.id),
        supabase.from('daily_queue').select('id', { count: 'exact', head: true }).eq('professional_id', deletingProfessional.id)
      ])

      const blockers = []
      if (slotTemplates.count && slotTemplates.count > 0) {
        blockers.push(`${slotTemplates.count} plantilla(s) de horarios`)
      }
      if (appointments.count && appointments.count > 0) {
        blockers.push(`${appointments.count} turno(s) programado(s)`)
      }
      if (assignments.count && assignments.count > 0) {
        blockers.push(`${assignments.count} asignación(es) diaria(s)`)
      }
      if (queueItems.count && queueItems.count > 0) {
        blockers.push(`${queueItems.count} turno(s) en cola`)
      }

      if (blockers.length > 0) {
        toast({
          variant: "destructive",
          title: "No se puede eliminar el profesional",
          description: (
            <div className="space-y-2">
              <p>El profesional tiene relaciones activas:</p>
              <ul className="list-disc list-inside">
                {blockers.map((blocker, index) => (
                  <li key={index}>{blocker}</li>
                ))}
              </ul>
              <p className="mt-2 font-semibold">Primero debes eliminar estas relaciones desde las páginas correspondientes (Horarios, Turnos, Asignaciones).</p>
            </div>
          ),
        })
        setIsDeleteDialogOpen(false)
        setDeletingProfessional(null)
        return
      }

      // Si no hay relaciones, proceder con la eliminación
      const { error } = await supabase
        .from('professional')
        .delete()
        .eq('id', deletingProfessional.id)

      if (error) {
        console.error('Error deleting professional:', error)
        toast({
          variant: "destructive",
          title: "Error al eliminar",
          description: error.message || "Ocurrió un error al intentar eliminar el profesional.",
        })
        return
      }

      toast({
        title: "Profesional eliminado",
        description: "El profesional se ha eliminado correctamente.",
      })

      await fetchProfessionals()
      setIsDeleteDialogOpen(false)
      setDeletingProfessional(null)
    } catch (error: any) {
      console.error('Error deleting professional:', error)
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: error.message || "Ocurrió un error al intentar eliminar el profesional.",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      institution_id: '',
      speciality: '',
      license_number: '',
      email: '',
      phone: '',
      is_active: true
    })
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
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Profesionales</h1>
          <p className="text-muted-foreground">
            Administra los profesionales de la salud del sistema
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
              Nuevo Profesional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProfessional ? 'Editar Profesional' : 'Nuevo Profesional'}
              </DialogTitle>
              <DialogDescription>
                {editingProfessional
                  ? 'Modifica los datos del profesional'
                  : 'Registra un nuevo profesional de la salud'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ProfessionalForm
                formData={formData}
                error={error}
                institutions={institutions}
                onFormChange={(field, value) => setFormData({ ...formData, [field]: value })}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Stethoscope className="mr-2 h-5 w-5" />
            Profesionales Registrados
          </CardTitle>
          <CardDescription>
            Lista de todos los profesionales de la salud del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {professionals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay profesionales registrados. Registra el primer profesional.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professionals.map((professional) => (
                  <ProfessionalTableRow
                    key={professional.id}
                    professional={professional}
                    onEdit={handleEdit}
                    onDelete={openDeleteDialog}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Alert Dialog para Confirmación de Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente al profesional{' '}
              <strong>
                {deletingProfessional?.first_name} {deletingProfessional?.last_name}
              </strong>{' '}
              del sistema.
              {deletingProfessional && (
                <>
                  <br /><br />
                  <span className="text-destructive font-semibold">
                    ⚠️ Nota: Si el profesional está asociado a plantillas de horarios, asignaciones o turnos, la eliminación fallará.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setDeletingProfessional(null)
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
