'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShieldIcon } from 'lucide-react'
import {
  type PrivacyLevel,
  getPrivacyIcon,
  getPrivacyExample,
  getPrivacyDescription,
} from '@/lib/privacy-utils'

interface PrivacySelectorProps {
  /**
   * Nivel de privacidad seleccionado
   * null = usar default
   */
  value: PrivacyLevel | null

  /**
   * Callback cuando cambia la selección
   */
  onChange: (value: PrivacyLevel | null) => void

  /**
   * Nombre del servicio (para mostrar en el default)
   */
  serviceName?: string

  /**
   * Privacy level del servicio (para mostrar en el default)
   */
  servicePrivacyLevel?: PrivacyLevel

  /**
   * Deshabilitar selector
   */
  disabled?: boolean

  /**
   * Mostrar descripción detallada
   */
  showDescription?: boolean
}

/**
 * Selector de nivel de privacidad para formularios
 * Usado al crear/editar turnos
 */
export function PrivacySelector({
  value,
  onChange,
  serviceName,
  servicePrivacyLevel = 'public_full_name',
  disabled = false,
  showDescription = true
}: PrivacySelectorProps) {
  const selectedValue = value ?? 'default'

  const handleChange = (newValue: string) => {
    if (newValue === 'default') {
      onChange(null)
    } else {
      onChange(newValue as PrivacyLevel)
    }
  }

  const getDefaultLabel = () => {
    const icon = getPrivacyIcon(servicePrivacyLevel)
    const serviceInfo = serviceName ? ` (${serviceName})` : ''
    return `${icon} Predeterminado del servicio${serviceInfo}`
  }

  const getDefaultDescription = () => {
    if (!serviceName) {
      return getPrivacyDescription(servicePrivacyLevel)
    }
    return `${serviceName}: ${getPrivacyDescription(servicePrivacyLevel)}`
  }

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-amber-50/50">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <ShieldIcon className="h-4 w-4" />
        Privacidad en pantalla pública
      </Label>

      <Select
        value={selectedValue}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="Seleccionar privacidad..." />
        </SelectTrigger>

        <SelectContent>
          {/* Opción por defecto */}
          <SelectItem value="default">
            <div className="flex flex-col items-start py-1">
              <span className="font-medium">{getDefaultLabel()}</span>
              <span className="text-xs text-muted-foreground">
                {getPrivacyExample(servicePrivacyLevel)}
              </span>
            </div>
          </SelectItem>

          {/* Divider visual */}
          <div className="my-1 border-t" />

          {/* Nombre completo */}
          <SelectItem value="public_full_name">
            <div className="flex flex-col items-start py-1">
              <span className="font-medium">
                ✅ Nombre completo
              </span>
              <span className="text-xs text-muted-foreground">
                {getPrivacyExample('public_full_name')}
              </span>
            </div>
          </SelectItem>

          {/* Solo iniciales */}
          <SelectItem value="public_initials">
            <div className="flex flex-col items-start py-1">
              <span className="font-medium">
                🔒 Solo iniciales
              </span>
              <span className="text-xs text-muted-foreground">
                {getPrivacyExample('public_initials')}
              </span>
            </div>
          </SelectItem>

          {/* Solo turno */}
          <SelectItem value="private_ticket_only">
            <div className="flex flex-col items-start py-1">
              <span className="font-medium">
                🔐 Solo número de turno
              </span>
              <span className="text-xs text-muted-foreground">
                {getPrivacyExample('private_ticket_only')}
              </span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Descripción detallada */}
      {showDescription && (
        <p className="text-xs text-muted-foreground">
          {selectedValue === 'default'
            ? getDefaultDescription()
            : getPrivacyDescription(value!)}
        </p>
      )}

      {/* Tip para servicios sensibles */}
      {servicePrivacyLevel === 'private_ticket_only' && (
        <div className="flex items-start gap-2 p-2 bg-amber-100 border border-amber-300 rounded text-xs">
          <span className="text-amber-700">💡</span>
          <p className="text-amber-800">
            <strong>Servicio sensible:</strong> Por defecto, los turnos de este servicio
            se llaman solo por número para proteger la privacidad del paciente.
          </p>
        </div>
      )}
    </div>
  )
}
