'use client'

import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  type PrivacyLevel,
  getPrivacyLabel,
  getPrivacyIcon,
  getPrivacyExample,
  getPrivacyVariant,
} from '@/lib/privacy-utils'

interface PrivacyBadgeProps {
  /**
   * Nivel de privacidad actual
   * null = usar default del servicio
   */
  level: PrivacyLevel | null

  /**
   * Callback cuando se cambia el nivel de privacidad
   */
  onChange?: (newLevel: PrivacyLevel | null) => void | Promise<void>

  /**
   * Deshabilitar edición (solo lectura)
   */
  disabled?: boolean

  /**
   * Mostrar el ejemplo en el dropdown
   */
  showExamples?: boolean

  /**
   * Texto del label por defecto (cuando level es null)
   */
  defaultLabel?: string
}

/**
 * Badge interactivo para mostrar y cambiar el nivel de privacidad
 * de un turno/appointment
 *
 * Soporta cambio rápido mediante dropdown menu
 */
export function PrivacyBadge({
  level,
  onChange,
  disabled = false,
  showExamples = true,
  defaultLabel = 'Predeterminado'
}: PrivacyBadgeProps) {
  const icon = getPrivacyIcon(level)
  const label = level ? getPrivacyLabel(level) : defaultLabel
  const variant = getPrivacyVariant(level)

  // Si no hay onChange o está disabled, mostrar solo el badge
  if (!onChange || disabled) {
    return (
      <Badge variant={variant} className="gap-1">
        <span>{icon}</span>
        <span>{label}</span>
      </Badge>
    )
  }

  const handleChange = async (newLevel: PrivacyLevel | null) => {
    await onChange(newLevel)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant={variant}
          className="gap-1 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span>{icon}</span>
          <span>{label}</span>
        </Badge>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Cambiar privacidad</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleChange('public_full_name')}
          className="flex flex-col items-start gap-1 py-3"
        >
          <div className="flex items-center gap-2 font-medium">
            <span>✅</span>
            <span>Nombre completo</span>
          </div>
          {showExamples && (
            <span className="text-xs text-muted-foreground">
              {getPrivacyExample('public_full_name')}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleChange('public_initials')}
          className="flex flex-col items-start gap-1 py-3"
        >
          <div className="flex items-center gap-2 font-medium">
            <span>🔒</span>
            <span>Solo iniciales</span>
          </div>
          {showExamples && (
            <span className="text-xs text-muted-foreground">
              {getPrivacyExample('public_initials')}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleChange('private_ticket_only')}
          className="flex flex-col items-start gap-1 py-3"
        >
          <div className="flex items-center gap-2 font-medium">
            <span>🔐</span>
            <span>Solo turno</span>
          </div>
          {showExamples && (
            <span className="text-xs text-muted-foreground">
              {getPrivacyExample('private_ticket_only')}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleChange(null)}
          className="flex flex-col items-start gap-1 py-3"
        >
          <div className="flex items-center gap-2 font-medium">
            <span>🔹</span>
            <span>Usar predeterminado</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Configuración del servicio
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
