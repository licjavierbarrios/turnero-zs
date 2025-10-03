'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, ClockIcon, UserIcon, HeartHandshakeIcon, MapPinIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Appointment {
  id: string
  patient_first_name: string
  patient_last_name: string
  professional_first_name: string
  professional_last_name: string
  service_name: string
  room_name?: string
  institution_name: string
  scheduled_at: string
  status: string
  notes?: string
}

const statusColors = {
  'pendiente': 'bg-yellow-100 text-yellow-800',
  'esperando': 'bg-blue-100 text-blue-800',
  'llamado': 'bg-purple-100 text-purple-800',
  'en_consulta': 'bg-green-100 text-green-800',
  'finalizado': 'bg-gray-100 text-gray-800',
  'cancelado': 'bg-red-100 text-red-800',
  'ausente': 'bg-orange-100 text-orange-800'
}

const statusLabels = {
  'pendiente': 'Pendiente',
  'esperando': 'Esperando',
  'llamado': 'Llamado',
  'en_consulta': 'En consulta',
  'finalizado': 'Finalizado',
  'cancelado': 'Cancelado',
  'ausente': 'Ausente'
}

export default function AppointmentsSimplePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)

      // Get appointments with all related data
      const { data, error } = await supabase
        .from('appointment')
        .select(`
          id,
          scheduled_at,
          status,
          notes,
          patient:patient_id (
            first_name,
            last_name
          ),
          professional:professional_id (
            first_name,
            last_name
          ),
          service:service_id (
            name
          ),
          room:room_id (
            name
          ),
          institution:institution_id (
            name
          )
        `)
        .order('scheduled_at', { ascending: true })

      if (error) throw error

      // Transform the data to flat structure
      const transformedAppointments: Appointment[] = (data || []).map(apt => ({
        id: apt.id,
        patient_first_name: (apt.patient as any)?.first_name || 'N/A',
        patient_last_name: (apt.patient as any)?.last_name || 'N/A',
        professional_first_name: (apt.professional as any)?.first_name || 'N/A',
        professional_last_name: (apt.professional as any)?.last_name || 'N/A',
        service_name: (apt.service as any)?.name || 'N/A',
        room_name: (apt.room as any)?.name,
        institution_name: (apt.institution as any)?.name || 'N/A',
        scheduled_at: apt.scheduled_at,
        status: apt.status,
        notes: apt.notes
      }))

      setAppointments(transformedAppointments)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointment')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appointmentId)

      if (error) throw error

      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId
            ? { ...apt, status: newStatus }
            : apt
        )
      )
    } catch (err) {
      console.error('Error updating appointment status:', err)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando turnos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchAppointments}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Turnos
        </h1>
        <Button onClick={fetchAppointments}>
          Actualizar
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No hay turnos programados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {appointment.patient_first_name} {appointment.patient_last_name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {format(parseISO(appointment.scheduled_at), 'PPP', { locale: es })}
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {format(parseISO(appointment.scheduled_at), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={statusColors[appointment.status as keyof typeof statusColors]}
                  >
                    {statusLabels[appointment.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Profesional</p>
                      <p className="text-gray-600">
                        {appointment.professional_first_name} {appointment.professional_last_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <HeartHandshakeIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Servicio</p>
                      <p className="text-gray-600">{appointment.service_name}</p>
                    </div>
                  </div>

                  {appointment.room_name && (
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Consultorio</p>
                        <p className="text-gray-600">{appointment.room_name}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="font-medium">Institución</p>
                    <p className="text-gray-600">{appointment.institution_name}</p>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">{appointment.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {appointment.status === 'pendiente' && (
                    <Button
                      size="sm"
                      onClick={() => updateAppointmentStatus(appointment.id, 'esperando')}
                    >
                      Marcar como Esperando
                    </Button>
                  )}
                  {appointment.status === 'esperando' && (
                    <Button
                      size="sm"
                      onClick={() => updateAppointmentStatus(appointment.id, 'llamado')}
                    >
                      Llamar Paciente
                    </Button>
                  )}
                  {appointment.status === 'llamado' && (
                    <Button
                      size="sm"
                      onClick={() => updateAppointmentStatus(appointment.id, 'en_consulta')}
                    >
                      Iniciar Consulta
                    </Button>
                  )}
                  {appointment.status === 'en_consulta' && (
                    <Button
                      size="sm"
                      onClick={() => updateAppointmentStatus(appointment.id, 'finalizado')}
                    >
                      Finalizar Consulta
                    </Button>
                  )}

                  {['pendiente', 'esperando', 'llamado'].includes(appointment.status) && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelado')}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAppointmentStatus(appointment.id, 'ausente')}
                      >
                        Marcar Ausente
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}