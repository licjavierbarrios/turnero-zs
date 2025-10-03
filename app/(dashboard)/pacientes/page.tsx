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
import { Plus, Edit, Trash2, User, Calendar } from 'lucide-react'

type Patient = {
  id: string
  first_name: string
  last_name: string
  dni: string | null
  email: string | null
  phone: string | null
  address: string | null
  birth_date: string | null
  created_at: string
  updated_at: string
}

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    email: '',
    phone: '',
    address: '',
    birth_date: ''
  })
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('patient')
        .select('*')
        .order('last_name', { ascending: true })

      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
      setError('Error al cargar los pacientes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const patientData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        dni: formData.dni || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        birth_date: formData.birth_date || null
      }

      if (editingPatient) {
        // Update existing patient
        const { error } = await supabase
          .from('patient')
          .update({
            ...patientData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPatient.id)

        if (error) throw error
        
        toast({
          title: "Paciente actualizado",
          description: "El paciente se ha actualizado correctamente.",
        })
      } else {
        // Create new patient
        const { error } = await supabase
          .from('patient')
          .insert(patientData)

        if (error) throw error
        
        toast({
          title: "Paciente creado",
          description: "El paciente se ha creado correctamente.",
        })
      }

      setIsDialogOpen(false)
      setEditingPatient(null)
      resetForm()
      fetchPatients()
    } catch (error) {
      console.error('Error saving patient:', error)
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        setError('Ya existe un paciente con ese DNI')
      } else {
        setError(`Error al ${editingPatient ? 'actualizar' : 'crear'} el paciente`)
      }
    }
  }

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient)
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      dni: patient.dni || '',
      email: patient.email || '',
      phone: patient.phone || '',
      address: patient.address || '',
      birth_date: patient.birth_date || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (patient: Patient) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al paciente "${patient.first_name} ${patient.last_name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('patient')
        .delete()
        .eq('id', patient.id)

      if (error) throw error
      
      toast({
        title: "Paciente eliminado",
        description: "El paciente se ha eliminado correctamente.",
      })
      
      fetchPatients()
    } catch (error) {
      console.error('Error deleting patient:', error)
      setError('Error al eliminar el paciente')
    }
  }

  const resetForm = () => {
    setFormData({ 
      first_name: '',
      last_name: '',
      dni: '',
      email: '',
      phone: '',
      address: '',
      birth_date: ''
    })
    setEditingPatient(null)
    setError(null)
  }

  const calculateAge = (birthDate: string | null): string => {
    if (!birthDate) return 'N/A'
    
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return `${age} años`
  }

  const formatDNI = (dni: string | null): string => {
    if (!dni) return ''
    // Format DNI with dots (e.g., 12.345.678)
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pacientes</h1>
          <p className="text-muted-foreground">
            Administra los pacientes del sistema de salud
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
              Nuevo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
              </DialogTitle>
              <DialogDescription>
                {editingPatient 
                  ? 'Modifica los datos del paciente' 
                  : 'Registra un nuevo paciente en el sistema'
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
                  <Label htmlFor="first_name">Nombre *</Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Nombre del paciente"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido *</Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Apellido del paciente"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
                    placeholder="12345678"
                    maxLength={8}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@ejemplo.com"
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección completa del paciente"
                  rows={2}
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
                  {editingPatient ? 'Actualizar' : 'Crear'} Paciente
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Pacientes Registrados
          </CardTitle>
          <CardDescription>
            Lista de todos los pacientes del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Cargando pacientes...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay pacientes registrados. Registra el primer paciente.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {patient.first_name} {patient.last_name}
                    </TableCell>
                    <TableCell>
                      {patient.dni ? (
                        <Badge variant="outline">
                          {formatDNI(patient.dni)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Sin DNI</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                        {calculateAge(patient.birth_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {patient.email || (
                        <span className="text-muted-foreground">Sin email</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {patient.phone || (
                        <span className="text-muted-foreground">Sin teléfono</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {patient.address ? (
                        <span className="text-sm truncate max-w-[200px] block">
                          {patient.address}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sin dirección</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(patient.created_at).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(patient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(patient)}
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