'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { formatFullName } from '@/lib/supabase/helpers'

interface Professional {
  id: string
  first_name: string
  last_name: string
  speciality: string | null
}

interface Room {
  id: string
  name: string
}

interface AssignmentFormProps {
  institutionId: string
  assignedProfessionalIds: string[]
  occupiedRoomIds: string[]
  onSubmit: (professionalId: string, roomId: string) => void
  isLoading?: boolean
}

export function AssignmentForm({
  institutionId,
  assignedProfessionalIds,
  occupiedRoomIds,
  onSubmit,
  isLoading = false
}: AssignmentFormProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profRes, roomRes] = await Promise.all([
          supabase
            .from('professional')
            .select('id, first_name, last_name, speciality')
            .eq('institution_id', institutionId)
            .eq('is_active', true)
            .order('last_name'),
          supabase
            .from('room')
            .select('id, name')
            .eq('institution_id', institutionId)
            .eq('is_active', true)
            .order('name')
        ])

        if (!profRes.error) setProfessionals(profRes.data || [])
        if (!roomRes.error) setRooms(roomRes.data || [])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [institutionId])

  const availableProfessionals = professionals.filter(p => !assignedProfessionalIds.includes(p.id))

  const handleSubmit = () => {
    if (selectedProfessional && selectedRoom) {
      onSubmit(selectedProfessional, selectedRoom)
      setSelectedProfessional('')
      setSelectedRoom('')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Profesional</label>
        <Select
          value={selectedProfessional}
          onValueChange={setSelectedProfessional}
          disabled={loading || isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar profesional" />
          </SelectTrigger>
          <SelectContent>
            {availableProfessionals.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                Todos los profesionales ya están asignados
              </div>
            ) : (
              availableProfessionals.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {formatFullName(prof.first_name, prof.last_name)}
                  {prof.speciality && ` - ${prof.speciality}`}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Consultorio</label>
        <Select
          value={selectedRoom}
          onValueChange={setSelectedRoom}
          disabled={loading || isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar consultorio" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
                {occupiedRoomIds.includes(room.id) && ' (Ocupado)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button
          onClick={handleSubmit}
          disabled={!selectedProfessional || !selectedRoom || isLoading}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Asignar
        </Button>
      </div>
    </div>
  )
}
