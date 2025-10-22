'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

interface ServiceFormProps {
  formData: Partial<Service>
  error?: { message: string } | null
  institutionName: string
  updateFormField: <K extends keyof Service>(field: K, value: Service[K]) => void
}

/**
 * Formulario para crear/editar servicios médicos
 *
 * @param formData - Datos actuales del formulario
 * @param error - Error si existe
 * @param institutionName - Nombre de la institución (solo lectura)
 * @param updateFormField - Callback para actualizar un campo
 *
 * @example
 * ```tsx
 * <ServiceForm
 *   formData={formData}
 *   error={error}
 *   institutionName="CAPS San Juan"
 *   updateFormField={updateFormField}
 * />
 * ```
 */
export function ServiceForm({
  formData,
  error,
  institutionName,
  updateFormField
}: ServiceFormProps) {
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="service_name">Nombre *</Label>
          <Input
            id="service_name"
            type="text"
            value={formData.name || ''}
            onChange={(e) => updateFormField('name', e.target.value)}
            placeholder="Ej: Medicina General, Cardiología, Enfermería"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="service_institution_id">Institución *</Label>
          <Input
            id="service_institution_id"
            type="text"
            value={institutionName}
            disabled
            className="bg-gray-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="service_duration_minutes">Duración por turno (minutos) *</Label>
          <Select
            value={formData.duration_minutes?.toString() || '30'}
            onValueChange={(value) => updateFormField('duration_minutes', parseInt(value) as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar duración" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="20">20 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="45">45 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="90">1 hora 30 minutos</SelectItem>
              <SelectItem value="120">2 horas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service_description">Descripción</Label>
          <Textarea
            id="service_description"
            value={formData.description || ''}
            onChange={(e) => updateFormField('description', e.target.value)}
            placeholder="Descripción del servicio médico"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="service_is_active"
            checked={formData.is_active || false}
            onChange={(e) => updateFormField('is_active', e.target.checked as any)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="service_is_active">Servicio activo</Label>
        </div>
      </div>
    </>
  )
}
