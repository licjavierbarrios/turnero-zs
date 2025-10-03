import { ServiceGroup } from '@/components/layouts/grid-layout'
import { ServiceAppointment } from '@/components/service-card'

interface RawAppointment {
  id: string
  patient_first_name: string
  patient_last_name: string
  professional_first_name?: string
  professional_last_name?: string
  service_name: string
  room_name?: string
  scheduled_at: string
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
      patient_first_name: apt.patient_first_name,
      patient_last_name: apt.patient_last_name,
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
        // Prioridad: llamado > en_consulta > esperando
        const statusPriority = { 'llamado': 0, 'en_consulta': 1, 'esperando': 2 }
        const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 3
        const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 3

        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }

        // Si tienen el mismo estado, ordenar por hora programada
        return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      })
    }))
    .sort((a, b) => a.serviceName.localeCompare(b.serviceName))

  return result
}
