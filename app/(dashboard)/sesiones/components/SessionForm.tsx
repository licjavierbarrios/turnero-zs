'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'

type QueueSession = {
  id: string
  service_id: string
  institution_id: string
  session_date: string
  name: string
  start_time: string
  end_time: string
  max_slots: number | null
  is_active: boolean
  created_by: string | null
  created_at: string
}

type Service = {
  id: string
  name: string
}

interface SessionFormProps {
  formData: Partial<QueueSession>
  error?: { message: string } | null
  institutionId: string
  updateFormField: <K extends keyof QueueSession>(field: K, value: QueueSession[K]) => void
}

export function SessionForm({ formData, error, institutionId, updateFormField }: SessionFormProps) {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    supabase
      .from('service')
      .select('id, name')
      .eq('institution_id', institutionId)
      .eq('is_active', true)
      .order('name')
      .then(({ data }: { data: Service[] | null }) => {
        if (data) setServices(data)
      })
  }, [institutionId])

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="session_name">Nombre de la sesión *</Label>
          <Input
            id="session_name"
            type="text"
            value={formData.name || ''}
            onChange={(e) => updateFormField('name', e.target.value)}
            placeholder="Ej: Extracción, Entrega de resultados"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="session_service_id">Servicio *</Label>
          <Select
            value={formData.service_id || ''}
            onValueChange={(value) => updateFormField('service_id', value)}
          >
            <SelectTrigger id="session_service_id">
              <SelectValue placeholder="Seleccionar servicio" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="session_date">Fecha *</Label>
          <Input
            id="session_date"
            type="date"
            value={formData.session_date || ''}
            onChange={(e) => updateFormField('session_date', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="session_start_time">Hora inicio *</Label>
            <Input
              id="session_start_time"
              type="time"
              value={formData.start_time || ''}
              onChange={(e) => updateFormField('start_time', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session_end_time">Hora fin *</Label>
            <Input
              id="session_end_time"
              type="time"
              value={formData.end_time || ''}
              onChange={(e) => updateFormField('end_time', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="session_max_slots">Cupo máximo (opcional)</Label>
          <Input
            id="session_max_slots"
            type="number"
            min={1}
            value={formData.max_slots ?? ''}
            onChange={(e) => updateFormField('max_slots', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Sin límite"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="session_is_active"
            checked={formData.is_active ?? true}
            onChange={(e) => updateFormField('is_active', e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="session_is_active">Sesión activa</Label>
        </div>
      </div>
    </>
  )
}
