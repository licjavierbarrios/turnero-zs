'use client'

import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DoorOpen, DoorClosed, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/supabase/helpers'

type Room = {
  id: string
  institution_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface RoomTableRowProps {
  room: Room
  isToggling: boolean
  onToggleActive: (room: Room) => void
  onEdit: (room: Room) => void
  onDelete: (room: Room) => void
}

export function RoomTableRow({
  room,
  isToggling,
  onToggleActive,
  onEdit,
  onDelete
}: RoomTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center">
          {room.is_active ? (
            <DoorOpen className="mr-2 h-4 w-4 text-green-600" />
          ) : (
            <DoorClosed className="mr-2 h-4 w-4 text-red-600" />
          )}
          {room.name}
        </div>
      </TableCell>
      <TableCell>
        {room.description || (
          <span className="text-muted-foreground">Sin descripción</span>
        )}
      </TableCell>
      <TableCell>
        <Badge
          className={room.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
          }
        >
          {room.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      </TableCell>
      <TableCell>
        {formatDate(room.created_at)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleActive(room)}
            title={room.is_active ? 'Desactivar' : 'Activar'}
            disabled={isToggling}
          >
            {room.is_active ? (
              <DoorClosed className="h-4 w-4" />
            ) : (
              <DoorOpen className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(room)}
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(room)}
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
