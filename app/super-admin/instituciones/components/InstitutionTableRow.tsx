'use client'

import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Building2, MapPin } from 'lucide-react'
import type { Institution, InstitutionType, Zone } from '@/lib/types'
import { INSTITUTION_TYPE_LABELS } from '@/lib/types'

type InstitutionWithZone = Institution & {
  zone?: Zone
}

interface InstitutionTableRowProps {
  institution: InstitutionWithZone
  onEdit: (institution: InstitutionWithZone) => void
  onDelete: (institution: InstitutionWithZone) => void
}

export function InstitutionTableRow({
  institution,
  onEdit,
  onDelete
}: InstitutionTableRowProps) {
  const getInstitutionTypeColor = (type: InstitutionType): string => {
    switch (type) {
      case 'caps':
        return 'bg-green-100 text-green-800'
      case 'hospital_seccional':
        return 'bg-blue-100 text-blue-800'
      case 'hospital_distrital':
        return 'bg-purple-100 text-purple-800'
      case 'hospital_regional':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <Building2 className="h-4 w-4 text-purple-600 mr-2" />
          <div>
            <div>{institution.name}</div>
            <div className="text-xs text-gray-500">/{institution.slug}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getInstitutionTypeColor(institution.type)}>
          {INSTITUTION_TYPE_LABELS[institution.type]}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center text-sm">
          <MapPin className="h-3 w-3 text-gray-400 mr-1" />
          {institution.zone?.name || 'Sin zona'}
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600">
        {institution.address || (
          <span className="text-gray-400 italic">Sin dirección</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-gray-600">
        {institution.phone || (
          <span className="text-gray-400 italic">Sin teléfono</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(institution)}
            title="Editar institución"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(institution)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Eliminar institución"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
