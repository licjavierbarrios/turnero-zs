'use client'

import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Edit, Trash2, Building2 } from 'lucide-react'
import type { Zone } from '@/lib/types'

interface ZoneTableRowProps {
  zone: Zone
  institutionCount: number
  onEdit: (zone: Zone) => void
  onDelete: (zone: Zone) => void
}

export function ZoneTableRow({
  zone,
  institutionCount,
  onEdit,
  onDelete
}: ZoneTableRowProps) {
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
          <MapPin className="h-4 w-4 text-purple-600 mr-2" />
          {zone.name}
        </div>
      </TableCell>
      <TableCell className="text-gray-600">
        {zone.description || (
          <span className="text-gray-400 italic">Sin descripción</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Building2 className="h-3 w-3 mr-1" />
          {institutionCount}
        </Badge>
      </TableCell>
      <TableCell className="text-gray-500 text-sm">
        {formatDate(zone.created_at)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(zone)}
            title="Editar zona"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(zone)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Eliminar zona"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
