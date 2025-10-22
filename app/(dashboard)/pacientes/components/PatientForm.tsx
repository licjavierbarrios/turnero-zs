'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Patient = {
  id: string
  first_name: string
  last_name: string
  dni: string | null
  email: string | null
  phone: string | null
  address: string | null
  birth_date: string | null
  created_at: string
  updated_at: string
}

interface PatientFormProps {
  formData: Partial<Patient>
  error?: { message: string } | null
  updateFormField: <K extends keyof Patient>(field: K, value: Patient[K]) => void
}

/**
 * Formulario para crear/editar pacientes
 *
 * @param formData - Datos actuales del formulario
 * @param error - Error si existe
 * @param updateFormField - Callback para actualizar un campo
 *
 * @example
 * ```tsx
 * <PatientForm
 *   formData={formData}
 *   error={error}
 *   updateFormField={updateFormField}
 * />
 * ```
 */
export function PatientForm({
  formData,
  error,
  updateFormField
}: PatientFormProps) {
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nombre *</Label>
          <Input
            id="first_name"
            type="text"
            value={formData.first_name || ''}
            onChange={(e) => updateFormField('first_name', e.target.value)}
            placeholder="Nombre del paciente"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Apellido *</Label>
          <Input
            id="last_name"
            type="text"
            value={formData.last_name || ''}
            onChange={(e) => updateFormField('last_name', e.target.value)}
            placeholder="Apellido del paciente"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dni">DNI</Label>
          <Input
            id="dni"
            type="text"
            value={formData.dni || ''}
            onChange={(e) => updateFormField('dni', e.target.value.replace(/\D/g, ''))}
            placeholder="12345678"
            maxLength={8}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date || ''}
            onChange={(e) => updateFormField('birth_date', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => updateFormField('email', e.target.value)}
            placeholder="email@ejemplo.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => updateFormField('phone', e.target.value)}
            placeholder="Ej: +54 11 1234-5678"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Textarea
          id="address"
          value={formData.address || ''}
          onChange={(e) => updateFormField('address', e.target.value)}
          placeholder="Dirección completa del paciente"
          rows={2}
        />
      </div>
    </>
  )
}
