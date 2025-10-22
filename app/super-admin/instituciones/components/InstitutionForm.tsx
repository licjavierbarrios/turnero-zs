'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { InstitutionType, Zone } from '@/lib/types'

interface InstitutionFormProps {
  formData: {
    name: string
    zone_id: string
    type: InstitutionType | ''
    address: string
    phone: string
    slug: string
  }
  error: string | null
  zones: Zone[]
  editingInstitution: { id: string; name: string } | null
  onFormChange: (field: string, value: string) => void
  onNameChange: (name: string) => void
}

export function InstitutionForm({
  formData,
  error,
  zones,
  editingInstitution,
  onFormChange,
  onNameChange
}: InstitutionFormProps) {
  return (
    <div className="space-y-4 mt-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="name">Nombre de la Institución *</Label>
          <Input
            id="name"
            placeholder="Ej: CAPS Villa María, Hospital Regional Norte"
            value={formData.name}
            onChange={(e) => onNameChange(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zone">Zona Sanitaria *</Label>
          <Select
            value={formData.zone_id}
            onValueChange={(value) => onFormChange('zone_id', value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar zona" />
            </SelectTrigger>
            <SelectContent>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Institución *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => onFormChange('type', value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="caps">CAPS</SelectItem>
              <SelectItem value="hospital_seccional">Hospital Seccional</SelectItem>
              <SelectItem value="hospital_distrital">Hospital Distrital</SelectItem>
              <SelectItem value="hospital_regional">Hospital Regional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="slug">Slug (URL amigable) *</Label>
          <Input
            id="slug"
            placeholder="ej: caps-villa-maria"
            value={formData.slug}
            onChange={(e) => onFormChange('slug', e.target.value.toLowerCase())}
            required
          />
          <p className="text-xs text-gray-500">
            Se usa para URLs públicas. Solo letras, números y guiones.
          </p>
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            placeholder="Dirección completa"
            value={formData.address}
            onChange={(e) => onFormChange('address', e.target.value)}
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            placeholder="Ej: (0123) 456-7890"
            value={formData.phone}
            onChange={(e) => onFormChange('phone', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
