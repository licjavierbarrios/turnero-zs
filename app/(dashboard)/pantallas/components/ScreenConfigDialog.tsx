'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

type ScreenMode = 'all' | 'exclude' | 'include'

type Screen = {
  id: string
  institution_id: string
  name: string
  mode: ScreenMode
  is_active: boolean
}

type Service = {
  id: string
  name: string
  is_active: boolean
}

type Room = {
  id: string
  name: string
  is_active: boolean
}

type ConfigItem = {
  item_type: 'service' | 'room'
  item_id: string
}

type Props = {
  open: boolean
  onClose: () => void
  screen: Screen | null
  institutionId: string
  onSaved: () => void
}

const modeLabels: Record<ScreenMode, string> = {
  all: 'Mostrar todo',
  exclude: 'Todo excepto...',
  include: 'Solo seleccionados',
}

export function ScreenConfigDialog({ open, onClose, screen, institutionId, onSaved }: Props) {
  const [mode, setMode] = useState<ScreenMode>('all')
  const [services, setServices] = useState<Service[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set())
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchResources = useCallback(async () => {
    if (!institutionId) return
    setLoading(true)
    try {
      const [servicesRes, roomsRes] = await Promise.all([
        supabase
          .from('service')
          .select('id, name, is_active')
          .eq('institution_id', institutionId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('room')
          .select('id, name, is_active')
          .eq('institution_id', institutionId)
          .eq('is_active', true)
          .order('name'),
      ])
      setServices(servicesRes.data || [])
      setRooms(roomsRes.data || [])
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  const fetchCurrentConfig = useCallback(async () => {
    if (!screen) return
    setMode(screen.mode)

    const { data } = await supabase
      .from('screen_config_item')
      .select('item_type, item_id')
      .eq('screen_id', screen.id)

    const items: ConfigItem[] = data || []
    setSelectedServiceIds(new Set(items.filter(i => i.item_type === 'service').map(i => i.item_id)))
    setSelectedRoomIds(new Set(items.filter(i => i.item_type === 'room').map(i => i.item_id)))
  }, [screen])

  useEffect(() => {
    if (open) {
      fetchResources()
      if (screen) {
        fetchCurrentConfig()
      } else {
        setMode('all')
        setSelectedServiceIds(new Set())
        setSelectedRoomIds(new Set())
      }
    }
  }, [open, screen, fetchResources, fetchCurrentConfig])

  const handleModeChange = (value: string) => {
    setMode(value as ScreenMode)
  }

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleRoom = (id: string) => {
    setSelectedRoomIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!screen) return
    setSaving(true)
    try {
      // Update mode
      await supabase
        .from('screen')
        .update({ mode, updated_at: new Date().toISOString() })
        .eq('id', screen.id)

      // Replace config items
      await supabase.from('screen_config_item').delete().eq('screen_id', screen.id)

      if (mode !== 'all') {
        const items: Omit<ConfigItem & { screen_id: string }, never>[] = [
          ...Array.from(selectedServiceIds).map(id => ({
            screen_id: screen.id,
            item_type: 'service' as const,
            item_id: id,
          })),
          ...Array.from(selectedRoomIds).map(id => ({
            screen_id: screen.id,
            item_type: 'room' as const,
            item_id: id,
          })),
        ]
        if (items.length > 0) {
          await supabase.from('screen_config_item').insert(items)
        }
      }

      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  // Alert: mode=include but some active services/rooms are not selected
  const hasUncoveredItems =
    mode === 'include' &&
    (services.some(s => !selectedServiceIds.has(s.id)) ||
      rooms.some(r => !selectedRoomIds.has(r.id)))

  const showCheckboxes = mode !== 'all'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar pantalla: {screen?.name}</DialogTitle>
          <DialogDescription>
            Seleccioná qué turnos se muestran en esta pantalla.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mode selector */}
            <div className="space-y-2">
              <Label>Modo de visualización</Label>
              <Select value={mode} onValueChange={handleModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(modeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {mode === 'all' && 'Se muestran todos los turnos de la institución.'}
                {mode === 'exclude' && 'Se muestran todos los turnos, excepto los de los servicios/consultorios seleccionados.'}
                {mode === 'include' && 'Solo se muestran turnos de los servicios/consultorios seleccionados.'}
              </p>
            </div>

            {/* Alert for include mode with uncovered items */}
            {hasUncoveredItems && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Hay servicios o consultorios activos que no están incluidos en el filtro. Sus turnos no serán visibles en esta pantalla.
                </AlertDescription>
              </Alert>
            )}

            {/* Checkboxes */}
            {showCheckboxes && (
              <div className="space-y-4">
                {services.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Servicios</Label>
                    <div className="space-y-2 pl-1">
                      {services.map(service => (
                        <div key={service.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`service-${service.id}`}
                            checked={selectedServiceIds.has(service.id)}
                            onCheckedChange={() => toggleService(service.id)}
                          />
                          <Label
                            htmlFor={`service-${service.id}`}
                            className="font-normal cursor-pointer"
                          >
                            {service.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rooms.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Consultorios</Label>
                    <div className="space-y-2 pl-1">
                      {rooms.map(room => (
                        <div key={room.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`room-${room.id}`}
                            checked={selectedRoomIds.has(room.id)}
                            onCheckedChange={() => toggleRoom(room.id)}
                          />
                          <Label
                            htmlFor={`room-${room.id}`}
                            className="font-normal cursor-pointer"
                          >
                            {room.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {services.length === 0 && rooms.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay servicios ni consultorios activos en esta institución.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
