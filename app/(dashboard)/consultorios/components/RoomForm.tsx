'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Room = {
  id: string
  institution_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface RoomFormProps {
  formData: Partial<Room>
  error?: { message: string } | null
  institutionName: string
  updateFormField: <K extends keyof Room>(field: K, value: Room[K]) => void
}

/**
 * Formulario para crear/editar consultorios
 */
export function RoomForm({
  formData,
  error,
  institutionName,
  updateFormField
}: RoomFormProps) {
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="room_name">Nombre *</Label>
          <Input
            id="room_name"
            type="text"
            value={formData.name || ''}
            onChange={(e) => updateFormField('name', e.target.value)}
            placeholder="Ej: Consultorio 1, Sala de Emergencias"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="room_institution_id">Institución *</Label>
          <Input
            id="room_institution_id"
            type="text"
            value={institutionName}
            disabled
            className="bg-gray-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="room_description">Descripción</Label>
          <Textarea
            id="room_description"
            value={formData.description || ''}
            onChange={(e) => updateFormField('description', e.target.value)}
            placeholder="Descripción del consultorio o sala"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="room_is_active"
            checked={formData.is_active || false}
            onChange={(e) => updateFormField('is_active', e.target.checked as any)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="room_is_active">Consultorio activo</Label>
        </div>
      </div>
    </>
  )
}
