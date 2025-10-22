'use client'

import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, UserCheck, Building2 } from 'lucide-react'

interface Assignment {
  id: string
  professional_id: string
  room_id: string
  institution_id: string
  assignment_date: string
  professional_name?: string
  professional_speciality?: string | null
  room_name?: string
}

interface AssignmentTableRowProps {
  assignment: Assignment
  onDelete: (assignment: Assignment) => void
  isDeleting?: boolean
}

export function AssignmentTableRow({
  assignment,
  onDelete,
  isDeleting = false
}: AssignmentTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <UserCheck className="mr-2 h-4 w-4 text-blue-600" />
          {assignment.professional_name}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {assignment.professional_speciality || 'Sin especialidad'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <Building2 className="mr-2 h-4 w-4 text-gray-500" />
          {assignment.room_name}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(assignment)}
          disabled={isDeleting}
          title="Eliminar asignación"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
