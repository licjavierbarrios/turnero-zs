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

      // Get appointments basic data first
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointment')
        .select(`
          id,
          scheduled_at,
          status,
          notes,
          patient_id,
          professional_id,
          service_id,
          room_id,
          institution_id
        `)
        .order('scheduled_at', { ascending: true })

      if (appointmentsError) throw appointmentsError

      // Get all patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patient')
        .select('id, first_name, last_name')


      // Get all professionals
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('professional')
        .select('id, first_name, last_name')

      // Get all services
      const { data: servicesData, error: servicesError } = await supabase
        .from('service')
        .select('id, name')

      // Get all rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('room')
        .select('id, name')

      // Get all institutions
      const { data: institutionsData, error: institutionsError } = await supabase
        .from('institution')
        .select('id, name')

      // Create lookup maps
      const patientsMap = new Map((patientsData || []).map(p => [p.id, p]))
      const professionalsMap = new Map((professionalsData || []).map(p => [p.id, p]))
      const servicesMap = new Map((servicesData || []).map(s => [s.id, s]))
      const roomsMap = new Map((roomsData || []).map(r => [r.id, r]))
      const institutionsMap = new Map((institutionsData || []).map(i => [i.id, i]))


      // Transform the data to flat structure
      const transformedAppointments: Appointment[] = (appointmentsData || []).map(apt => {
        const patient = patientsMap.get(apt.patient_id)
        const professional = professionalsMap.get(apt.professional_id)
        const service = servicesMap.get(apt.service_id)
        const room = roomsMap.get(apt.room_id)
        const institution = institutionsMap.get(apt.institution_id)


        return {
          id: apt.id,
          patient_first_name: patient?.first_name || 'N/A',
          patient_last_name: patient?.last_name || 'N/A',
          professional_first_name: professional?.first_name || 'N/A',
          professional_last_name: professional?.last_name || 'N/A',
          service_name: service?.name || 'N/A',
          room_name: room?.name,
          institution_name: institution?.name || 'N/A',
          scheduled_at: apt.scheduled_at,
          status: apt.status,
          notes: apt.notes
        }
      })

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
      console.log(`Updating appointment ${appointmentId} to status: ${newStatus}`)

      // Update appointment status
      const { error: updateError } = await supabase
        .from('appointment')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appointmentId)

      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }

      console.log('Update successful')

      // If status is "llamado", create a call event
      if (newStatus === 'llamado') {
        const appointment = appointments.find(apt => apt.id === appointmentId)
        if (appointment) {
          const { error: callError } = await supabase
            .from('call_event')
            .insert({
              appointment_id: appointmentId,
              called_at: new Date().toISOString(),
              notes: `Paciente ${appointment.patient_first_name} ${appointment.patient_last_name} llamado a consulta`
            })

          if (callError) {
            console.error('Error creating call event:', callError)
          }
        }
      }

      // Update local state
      console.log('Updating local state...')
      setAppointments(prev => {
        const updated = prev.map(apt =>
          apt.id === appointmentId
            ? { ...apt, status: newStatus }
            : apt
        )
        console.log('Local state updated:', updated.find(a => a.id === appointmentId))
        return updated
      })

      // Refresh data to ensure sync
      console.log('Scheduling refresh...')
      setTimeout(() => {
        console.log('Refreshing data from server...')
        fetchAppointments()
      }, 500)

    } catch (err) {
      console.error('Error updating appointment status:', err)
    }
  }

  if (loading) {
    return (
      <div className="w-full">
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
      <div className="w-full">
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
    <div className="w-full">
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turno #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profesional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment, index) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {appointment.patient_first_name} {appointment.patient_last_name}
                    </div>
                    {appointment.notes && (
                      <div className="text-sm text-gray-500">{appointment.notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <CalendarIcon className="h-4 w-4" />
                      {format(parseISO(appointment.scheduled_at), 'dd/MM/yyyy', { locale: es })}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4" />
                      {format(parseISO(appointment.scheduled_at), 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.professional_first_name} {appointment.professional_last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.service_name}
                    {appointment.room_name && (
                      <div className="text-sm text-gray-500">Consultorio: {appointment.room_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      className={statusColors[appointment.status as keyof typeof statusColors]}
                    >
                      {statusLabels[appointment.status as keyof typeof statusLabels]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col gap-1">
                      {appointment.status === 'pendiente' && (
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'esperando')}
                        >
                          Marcar Esperando
                        </Button>
                      )}
                      {appointment.status === 'esperando' && (
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'llamado')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Llamar Paciente
                        </Button>
                      )}
                      {appointment.status === 'llamado' && (
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'en_consulta')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Iniciar Consulta
                        </Button>
                      )}
                      {appointment.status === 'en_consulta' && (
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'finalizado')}
                          className="bg-gray-600 hover:bg-gray-700"
                        >
                          Finalizar
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
                            Ausente
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}