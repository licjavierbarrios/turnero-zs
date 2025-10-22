'use client'

import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, Clock, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/supabase/helpers'

type Service = {
  id: string
  institution_id: string
  name: string
  description: string | null
  duration_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ServiceTableRowProps {
  service: Service
  isToggling: boolean
  onToggleActive: (service: Service) => void
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
}

/**
 * Fila de tabla para un servicio
 *
 * @param service - Datos del servicio
 * @param isToggling - Si está en proceso de cambiar estado
 * @param onToggleActive - Callback para cambiar estado activo/inactivo
 * @param onEdit - Callback cuando se hace click en editar
 * @param onDelete - Callback cuando se hace click en eliminar
 *
 * @example
 * ```tsx
 * <ServiceTableRow
 *   service={service}
 *   isToggling={isToggling[service.id]}
 *   onToggleActive={(s) => handleToggleActive(s)}
 *   onEdit={(s) => openEditDialog(s)}
 *   onDelete={(s) => openDeleteDialog(s)}
 * />
 * ```
 */
export function ServiceTableRow({
  service,
  isToggling,
  onToggleActive,
  onEdit,
  onDelete
}: ServiceTableRowProps) {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <Activity className="mr-2 h-4 w-4 text-blue-600" />
          {service.name}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-gray-500" />
          <Badge variant="outline">
            {formatDuration(service.duration_minutes)}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        {service.description || (
          <span className="text-muted-foreground">Sin descripción</span>
        )}
      </TableCell>
      <TableCell>
        <Badge
          className={service.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
          }
        >
          {service.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      </TableCell>
      <TableCell>
        {formatDate(service.created_at)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleActive(service)}
            title={service.is_active ? 'Desactivar' : 'Activar'}
            disabled={isToggling}
          >
            {service.is_active ? (
              <Activity className="h-4 w-4 text-red-600" />
            ) : (
              <Activity className="h-4 w-4 text-green-600" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(service)}
            title="Editar servicio"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(service)}
            title="Eliminar servicio"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
