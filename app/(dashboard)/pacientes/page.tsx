'use client'

import { useCrudOperation } from '@/hooks/useCrudOperation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CrudDialog } from '@/components/crud/CrudDialog'
import { DeleteConfirmation } from '@/components/crud/DeleteConfirmation'
import { useToast } from '@/hooks/use-toast'
import { Plus, User } from 'lucide-react'
import { PatientForm } from './components/PatientForm'
import { PatientTableRow } from './components/PatientTableRow'

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
                  <PatientTableRow
                    key={patient.id}
                    patient={patient}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                  />
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
        <PatientForm
          formData={formData}
          error={error}
          updateFormField={updateFormField}
        />
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
