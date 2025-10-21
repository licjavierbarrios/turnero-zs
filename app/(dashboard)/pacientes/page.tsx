'use client'

import { useCrudOperation } from '@/hooks/useCrudOperation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CrudDialog } from '@/components/crud/CrudDialog'
import { DeleteConfirmation } from '@/components/crud/DeleteConfirmation'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, User, Calendar } from 'lucide-react'
import { calculateAge, formatDNI, formatDate } from '@/lib/supabase/helpers'

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
  const { toast } = useToast()

  // Hook CRUD con todas las operaciones y estados
  const {
    items: patients,
    formData,
    isLoading,
    isSaving,
    isDialogOpen,
    isDeleteDialogOpen,
    editingItem: editingPatient,
    itemToDelete: deletingPatient,
    error,
    updateFormField,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    openDeleteDialog,
    closeDeleteDialog,
    handleSubmit: crudHandleSubmit,
    handleDelete: crudHandleDelete
  } = useCrudOperation<Patient>({
    tableName: 'patient',
    initialFormData: {
      first_name: '',
      last_name: '',
      dni: '',
      email: '',
      phone: '',
      address: '',
      birth_date: ''
    },
    selectFields: '*',
    onSuccess: (operation) => {
      const messages = {
        create: { title: 'Paciente creado', description: 'El paciente se ha creado correctamente.' },
        update: { title: 'Paciente actualizado', description: 'El paciente se ha actualizado correctamente.' },
        delete: { title: 'Paciente eliminado', description: 'El paciente se ha eliminado correctamente.' }
      }
      toast(messages[operation])
    },
    onError: (operation, error) => {
      if (error.message?.includes('duplicate key value violates unique constraint')) {
        toast({
          title: 'Error',
          description: 'Ya existe un paciente con ese DNI',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Error',
          description: `Error al ${operation === 'create' ? 'crear' : operation === 'update' ? 'actualizar' : 'eliminar'} el paciente`,
          variant: 'destructive'
        })
      }
    }
  })

  // Wrappers para los handlers (los componentes esperan void)
  const handleSubmit = async () => {
    await crudHandleSubmit()
  }

  const handleDelete = async () => {
    await crudHandleDelete()
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
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Paciente
        </Button>
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
          {isLoading ? (
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
                        {patient.birth_date ? `${calculateAge(patient.birth_date)} años` : 'N/A'}
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
                      {formatDate(patient.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(patient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(patient)}
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

      {/* Dialog de Creación/Edición usando CrudDialog */}
      <CrudDialog
        isOpen={isDialogOpen}
        onOpenChange={closeDialog}
        title={editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
        description={
          editingPatient
            ? 'Modifica los datos del paciente'
            : 'Registra un nuevo paciente en el sistema'
        }
        editingItem={editingPatient}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        size="2xl"
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Nombre *</Label>
            <Input
              id="first_name"
              type="text"
              value={formData.first_name || ''}
              onChange={(e) => updateFormField('first_name', e.target.value)}
              placeholder="Nombre del paciente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Apellido *</Label>
            <Input
              id="last_name"
              type="text"
              value={formData.last_name || ''}
              onChange={(e) => updateFormField('last_name', e.target.value)}
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
              value={formData.dni || ''}
              onChange={(e) => updateFormField('dni', e.target.value.replace(/\D/g, ''))}
              placeholder="12345678"
              maxLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date || ''}
              onChange={(e) => updateFormField('birth_date', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => updateFormField('email', e.target.value)}
              placeholder="email@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => updateFormField('phone', e.target.value)}
              placeholder="Ej: +54 11 1234-5678"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Textarea
            id="address"
            value={formData.address || ''}
            onChange={(e) => updateFormField('address', e.target.value)}
            placeholder="Dirección completa del paciente"
            rows={2}
          />
        </div>
      </CrudDialog>

      {/* Dialog de Confirmación de Eliminación */}
      <DeleteConfirmation
        isOpen={isDeleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        itemName={deletingPatient ? `${deletingPatient.first_name} ${deletingPatient.last_name}` : ''}
        onConfirm={handleDelete}
        isDeleting={isSaving}
      />
    </div>
  )
}
