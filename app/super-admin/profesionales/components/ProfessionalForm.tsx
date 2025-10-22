'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface Institution {
  id: string
  name: string
  zone_name: string
}

interface ProfessionalFormProps {
  formData: {
    first_name: string
    last_name: string
    institution_id: string
    speciality: string
    license_number: string
    email: string
    phone: string
    is_active?: boolean
  }
  error: string | null
  institutions: Institution[]
  onFormChange: (field: string, value: string | boolean) => void
}

export function ProfessionalForm({
  formData,
  error,
  institutions,
  onFormChange
}: ProfessionalFormProps) {
  return (
    <div className="space-y-4 mt-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nombre *</Label>
          <Input
            id="first_name"
            placeholder="Nombre"
            value={formData.first_name}
            onChange={(e) => onFormChange('first_name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Apellido *</Label>
          <Input
            id="last_name"
            placeholder="Apellido"
            value={formData.last_name}
            onChange={(e) => onFormChange('last_name', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="institution_id">Institución *</Label>
        <Select value={formData.institution_id} onValueChange={(value) => onFormChange('institution_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar institución" />
          </SelectTrigger>
          <SelectContent>
            {institutions.map((inst) => (
              <SelectItem key={inst.id} value={inst.id}>
                {inst.name} ({inst.zone_name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="speciality">Especialidad</Label>
          <Input
            id="speciality"
            placeholder="Ej: Cardiólogo"
            value={formData.speciality}
            onChange={(e) => onFormChange('speciality', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="license_number">Matrícula</Label>
          <Input
            id="license_number"
            placeholder="Número de matrícula"
            value={formData.license_number}
            onChange={(e) => onFormChange('license_number', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChange={(e) => onFormChange('email', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            placeholder="Número de teléfono"
            value={formData.phone}
            onChange={(e) => onFormChange('phone', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active !== false}
          onChange={(e) => onFormChange('is_active', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="is_active">Profesional activo</Label>
      </div>
    </div>
  )
}
