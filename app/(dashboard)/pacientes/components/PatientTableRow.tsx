'use client'

import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Calendar } from 'lucide-react'
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

interface PatientTableRowProps {
  patient: Patient
  onEdit: (patient: Patient) => void
  onDelete: (patient: Patient) => void
}

/**
 * Fila de tabla para un paciente
 *
 * @param patient - Datos del paciente
 * @param onEdit - Callback cuando se hace click en editar
 * @param onDelete - Callback cuando se hace click en eliminar
 *
 * @example
 * ```tsx
 * <PatientTableRow
 *   patient={patient}
 *   onEdit={(p) => openEditDialog(p)}
 *   onDelete={(p) => openDeleteDialog(p)}
 * />
 * ```
 */
export function PatientTableRow({
  patient,
  onEdit,
  onDelete
}: PatientTableRowProps) {
  return (
    <TableRow>
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
            onClick={() => onEdit(patient)}
            title="Editar paciente"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(patient)}
            title="Eliminar paciente"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
