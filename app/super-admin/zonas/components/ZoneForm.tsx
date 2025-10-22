'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { Zone } from '@/lib/types'

interface ZoneFormProps {
  formData: {
    name: string
    description: string
  }
  error: string | null
  editingZone: Zone | null
  onFormChange: (field: string, value: string) => void
}

export function ZoneForm({
  formData,
  error,
  editingZone,
  onFormChange
}: ZoneFormProps) {
  return (
    <div className="space-y-4 mt-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la Zona *</Label>
        <Input
          id="name"
          placeholder="Ej: Zona Norte, Zona Centro, etc."
          value={formData.name}
          onChange={(e) => onFormChange('name', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Descripción opcional de la zona sanitaria"
          value={formData.description}
          onChange={(e) => onFormChange('description', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )
}
