'use client'

import { useCrudOperation } from '@/hooks/useCrudOperation'
import { useInstitutionContext } from '@/hooks/useInstitutionContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CrudDialog } from '@/components/crud/CrudDialog'
import { DeleteConfirmation } from '@/components/crud/DeleteConfirmation'
import { useToast } from '@/hooks/use-toast'
import { Plus, ListOrdered, Pencil, Trash2 } from 'lucide-react'
import { SessionForm } from './components/SessionForm'

type QueueSession = {
  id: string
  service_id: string
  institution_id: string
  session_date: string
  name: string
  start_time: string
  end_time: string
  max_slots: number | null
  is_active: boolean
  created_by: string | null
  created_at: string
  service?: { name: string }
}

function formatTime(time: string): string {
  return time.slice(0, 5) // HH:MM
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export default function SesionesPage() {
  const { toast } = useToast()
  const { context, requireContext } = useInstitutionContext()

  requireContext()
  const institutionId = context!.institution_id

  const {
    items: sessions,
    formData,
    isLoading,
    isSaving,
    isDialogOpen,
    isDeleteDialogOpen,
    editingItem: editingSession,
    itemToDelete: deletingSession,
    error,
    updateFormField,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    openDeleteDialog,
    closeDeleteDialog,
    handleSubmit: crudHandleSubmit,
    handleDelete: crudHandleDelete,
  } = useCrudOperation<QueueSession>({
    tableName: 'queue_session',
    initialFormData: {
      name: '',
      service_id: '',
      institution_id: institutionId,
      session_date: getTodayISO(),
      start_time: '',
      end_time: '',
      max_slots: null,
      is_active: true,
      created_by: null,
    },
    selectFields: `*, service:service_id (name)`,
    filterConditions: { institution_id: institutionId },
    onSuccess: (operation) => {
      const messages = {
        create: { title: 'Sesión creada', description: 'La sesión de cola se creó correctamente.' },
        update: { title: 'Sesión actualizada', description: 'La sesión de cola se actualizó correctamente.' },
        delete: { title: 'Sesión eliminada', description: 'La sesión de cola se eliminó correctamente.' },
      }
      toast(messages[operation])
    },
    onError: (operation, error) => {
      const isUnique = (error as any)?.code === '23505'
      toast({
        title: 'Error',
        description: isUnique
          ? 'Ya existe una sesión con ese nombre para ese servicio y fecha.'
          : `Error al ${operation === 'create' ? 'crear' : operation === 'update' ? 'actualizar' : 'eliminar'} la sesión`,
        variant: 'destructive',
      })
    },
  })

  const today = getTodayISO()
  const sorted = [...sessions].sort((a, b) => b.session_date.localeCompare(a.session_date))
  const upcoming = sorted.filter((s) => s.session_date >= today)
  const past = sorted.filter((s) => s.session_date < today)

  const SessionTable = ({ items }: { items: QueueSession[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Servicio</TableHead>
          <TableHead>Horario</TableHead>
          <TableHead>Cupo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((session) => (
          <TableRow key={session.id}>
            <TableCell className="font-medium">{formatDate(session.session_date)}</TableCell>
            <TableCell>{session.name}</TableCell>
            <TableCell className="text-muted-foreground">{session.service?.name ?? '—'}</TableCell>
            <TableCell>
              {formatTime(session.start_time)} – {formatTime(session.end_time)}
            </TableCell>
            <TableCell>{session.max_slots ?? 'Sin límite'}</TableCell>
            <TableCell>
              <Badge variant={session.is_active ? 'default' : 'secondary'}>
                {session.is_active ? 'Activa' : 'Inactiva'}
              </Badge>
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button variant="ghost" size="sm" onClick={() => openEditDialog(session)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(session)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sesiones de Cola</h1>
          <p className="text-muted-foreground">
            Administrá sesiones independientes por servicio y horario (ej: Extracción, Entrega de resultados)
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sesión
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p>Cargando sesiones...</p>
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <ListOrdered className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-muted-foreground">
              No hay sesiones registradas. Creá la primera sesión de cola.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Próximas sesiones</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionTable items={upcoming} />
              </CardContent>
            </Card>
          )}
          {past.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground">Sesiones anteriores</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionTable items={past} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <CrudDialog
        isOpen={isDialogOpen}
        onOpenChange={closeDialog}
        title={editingSession ? 'Editar Sesión' : 'Nueva Sesión'}
        description={
          editingSession
            ? 'Modificá los datos de la sesión de cola'
            : 'Creá una sesión de cola para un servicio y horario específico'
        }
        editingItem={editingSession}
        onSubmit={async () => { await crudHandleSubmit() }}
        isSaving={isSaving}
        size="lg"
      >
        <SessionForm
          formData={formData}
          error={error ? { message: error.message } : null}
          institutionId={institutionId}
          updateFormField={updateFormField}
        />
      </CrudDialog>

      <DeleteConfirmation
        isOpen={isDeleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        itemName={deletingSession ? `${deletingSession.name} (${formatDate(deletingSession.session_date)})` : ''}
        onConfirm={async () => { await crudHandleDelete() }}
        isDeleting={isSaving}
      />
    </div>
  )
}
