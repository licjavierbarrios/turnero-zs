'use client'

import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Stethoscope, UserCheck, UserX } from 'lucide-react'

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

interface ProfessionalTableRowProps {
  professional: Professional
  onEdit: (professional: Professional) => void
  onDelete: (professional: Professional) => void
  onToggleActive: (professional: Professional) => void
}

export function ProfessionalTableRow({
  professional,
  onEdit,
  onDelete,
  onToggleActive
}: ProfessionalTableRowProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <Stethoscope className="h-4 w-4 text-blue-600 mr-2" />
          {professional.first_name} {professional.last_name}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{professional.institution?.name}</span>
          <span className="text-sm text-muted-foreground">
            {professional.institution?.zone?.name || 'Sin zona'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {professional.speciality || 'Sin especialidad'}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {professional.email || '-'}
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {formatDate(professional.created_at)}
      </TableCell>
      <TableCell>
        <Badge
          className={professional.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
          }
        >
          {professional.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleActive(professional)}
            title={professional.is_active ? 'Desactivar' : 'Activar'}
          >
            {professional.is_active ? (
              <UserX className="h-4 w-4" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(professional)}
            title="Editar profesional"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(professional)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Eliminar profesional"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
