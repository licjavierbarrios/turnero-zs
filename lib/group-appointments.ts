import { ServiceGroup } from '@/components/layouts/grid-layout'
import { ServiceAppointment } from '@/components/service-card'

// Interface para datos de daily_queue (sistema activo)
interface RawAppointment {
  id: string
  patient_name: string // Nombre completo del paciente
  order_number: number // Número de orden en la cola
  professional_first_name?: string
  professional_last_name?: string
  service_name: string
  room_name?: string
  scheduled_at?: string // Opcional - daily_queue no siempre lo usa
  status: string
}

/**
 * Agrupa appointments por servicio
 */
export function groupAppointmentsByService(
  appointments: RawAppointment[],
  serviceFilter?: {
    type: 'all' | 'specific'
    serviceIds?: string[]
  }
): ServiceGroup[] {
  // Agrupar por nombre de servicio
  const grouped = appointments.reduce((acc, apt) => {
    const serviceName = apt.service_name

    if (!acc[serviceName]) {
      acc[serviceName] = []
    }

    acc[serviceName].push({
      id: apt.id,
      patient_name: apt.patient_name,
      order_number: apt.order_number,
      professional_first_name: apt.professional_first_name,
      professional_last_name: apt.professional_last_name,
      room_name: apt.room_name,
      scheduled_at: apt.scheduled_at,
      status: apt.status
    })

    return acc
  }, {} as Record<string, ServiceAppointment[]>)

  // Convertir a array y ordenar por nombre de servicio
  const result: ServiceGroup[] = Object.entries(grouped)
    .map(([serviceName, appointments]) => ({
      serviceName,
      appointments: appointments.sort((a, b) => {
        // Prioridad: llamado > en_consulta > disponible > pendiente
        const statusPriority = { 'llamado': 0, 'en_consulta': 1, 'disponible': 2, 'pendiente': 3 }
        const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 4
        const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 4

        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }

        // Si tienen el mismo estado, ordenar por número de orden
        return a.order_number - b.order_number
      })
    }))
    .sort((a, b) => a.serviceName.localeCompare(b.serviceName))

  return result
}
