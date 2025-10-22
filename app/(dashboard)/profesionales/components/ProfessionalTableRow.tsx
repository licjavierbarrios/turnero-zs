'use client'

import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserCheck, UserX } from 'lucide-react'

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
  isToggling: boolean
  onToggleActive: (professional: Professional) => void
}

export function ProfessionalTableRow({
  professional,
  isToggling,
  onToggleActive
}: ProfessionalTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {professional.first_name} {professional.last_name}
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
        {professional.speciality || (
          <span className="text-muted-foreground">Sin especialidad</span>
        )}
      </TableCell>
      <TableCell>
        {professional.license_number || (
          <span className="text-muted-foreground">Sin matrícula</span>
        )}
      </TableCell>
      <TableCell>
        {professional.email || (
          <span className="text-muted-foreground">Sin email</span>
        )}
      </TableCell>
      <TableCell>
        {professional.phone || (
          <span className="text-muted-foreground">Sin teléfono</span>
        )}
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
        <Button
          variant={professional.is_active ? "outline" : "default"}
          size="sm"
          onClick={() => onToggleActive(professional)}
          disabled={isToggling}
          title={professional.is_active ? 'Desactivar profesional' : 'Activar profesional'}
        >
          {professional.is_active ? (
            <>
              <UserX className="h-4 w-4 mr-2" />
              Desactivar
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Activar
            </>
          )}
        </Button>
      </TableCell>
    </TableRow>
  )
}
