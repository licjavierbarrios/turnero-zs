'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  occupiedRoomIds: string[]
  onSubmit: (professionalId: string, roomId: string, startTime: string, endTime: string) => void
  isLoading?: boolean
}

export function AssignmentForm({
  institutionId,
  occupiedRoomIds,
  onSubmit,
  isLoading = false
}: AssignmentFormProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
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

  const handleSubmit = () => {
    if (selectedProfessional && selectedRoom && startTime && endTime) {
      onSubmit(selectedProfessional, selectedRoom, startTime, endTime)
      setSelectedProfessional('')
      setSelectedRoom('')
      setStartTime('')
      setEndTime('')
    }
  }

  const isValid = selectedProfessional && selectedRoom && startTime && endTime && startTime < endTime

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="space-y-2 lg:col-span-2">
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
            {professionals.map((prof) => (
              <SelectItem key={prof.id} value={prof.id}>
                {formatFullName(prof.first_name, prof.last_name)}
                {prof.speciality && ` - ${prof.speciality}`}
              </SelectItem>
            ))}
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
            <SelectValue placeholder="Consultorio" />
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Horario</label>
        <div className="flex gap-1 items-center">
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={loading || isLoading}
            className="w-full"
          />
          <span className="text-muted-foreground text-sm">a</span>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={loading || isLoading}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex items-end">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Asignar
        </Button>
      </div>
    </div>
  )
}
