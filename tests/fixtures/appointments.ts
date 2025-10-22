/**
 * Appointment Fixtures
 * Factories para crear datos de prueba de Turnos/Citas
 */

import type { Appointment, AppointmentStatus } from '@/lib/types'

/**
 * Crea un turno mínimo válido
 */
export const createAppointment = (overrides?: Partial<Appointment>): Appointment => ({
  id: 'appt-1',
  patient_id: 'patient-1',
  professional_id: 'prof-1',
  service_id: 'service-1',
  room_id: 'room-1',
  institution_id: 'inst-1',
  scheduled_at: '2025-10-25T09:00:00Z',
  status: 'pendiente' as AppointmentStatus,
  notes: 'Primera consulta',
  created_by: 'user-1',
  created_at: '2025-10-22T10:00:00Z',
  updated_at: '2025-10-22T10:00:00Z',
  ...overrides,
})

/**
 * Crea múltiples turnos
 */
export const createAppointmentList = (
  count: number = 5,
  overrides?: Partial<Appointment>
): Appointment[] => {
  const statuses: AppointmentStatus[] = [
    'pendiente',
    'esperando',
    'llamado',
    'en_consulta',
    'finalizado',
  ]

  const appointments: Appointment[] = []
  const now = new Date()

  for (let i = 1; i <= count; i++) {
    const scheduledDate = new Date(now)
    scheduledDate.setDate(scheduledDate.getDate() + i)
    scheduledDate.setHours(9 + (i % 8), 0, 0, 0)

    appointments.push(
      createAppointment({
        id: `appt-${i}`,
        patient_id: `patient-${i}`,
        professional_id: `prof-${(i % 3) + 1}`,
        service_id: `service-${(i % 4) + 1}`,
        room_id: `room-${(i % 3) + 1}`,
        scheduled_at: scheduledDate.toISOString(),
        status: statuses[(i - 1) % statuses.length],
        created_at: new Date(now.getTime() - i * 86400000).toISOString(),
        ...overrides,
      })
    )
  }
  return appointments
}

/**
 * Turnos de ejemplo por estado
 */
export const mockAppointmentPending: Appointment = {
  id: 'appt-pending-1',
  patient_id: 'patient-1',
  professional_id: 'prof-1',
  service_id: 'service-1',
  room_id: 'room-1',
  institution_id: 'inst-1',
  scheduled_at: '2025-10-25T09:00:00Z',
  status: 'pendiente',
  notes: 'Primera consulta',
  created_by: 'user-1',
  created_at: '2025-10-22T10:00:00Z',
  updated_at: '2025-10-22T10:00:00Z',
}

export const mockAppointmentWaiting: Appointment = {
  id: 'appt-waiting-1',
  patient_id: 'patient-2',
  professional_id: 'prof-1',
  service_id: 'service-1',
  room_id: 'room-1',
  institution_id: 'inst-1',
  scheduled_at: '2025-10-22T10:30:00Z',
  status: 'esperando',
  notes: 'Paciente en sala de espera',
  created_by: 'user-1',
  created_at: '2025-10-22T09:00:00Z',
  updated_at: '2025-10-22T10:25:00Z',
}

export const mockAppointmentCalled: Appointment = {
  id: 'appt-called-1',
  patient_id: 'patient-3',
  professional_id: 'prof-2',
  service_id: 'service-2',
  room_id: 'room-2',
  institution_id: 'inst-1',
  scheduled_at: '2025-10-22T11:00:00Z',
  status: 'llamado',
  notes: 'Llamado al consultorio',
  created_by: 'user-1',
  created_at: '2025-10-22T08:00:00Z',
  updated_at: '2025-10-22T10:50:00Z',
}

export const mockAppointmentInConsultation: Appointment = {
  id: 'appt-consulting-1',
  patient_id: 'patient-1',
  professional_id: 'prof-1',
  service_id: 'service-1',
  room_id: 'room-1',
  institution_id: 'inst-1',
  scheduled_at: '2025-10-22T09:00:00Z',
  status: 'en_consulta',
  notes: 'En atención',
  created_by: 'user-1',
  created_at: '2025-10-22T08:00:00Z',
  updated_at: '2025-10-22T09:05:00Z',
}

export const mockAppointmentFinished: Appointment = {
  id: 'appt-finished-1',
  patient_id: 'patient-2',
  professional_id: 'prof-1',
  service_id: 'service-1',
  room_id: 'room-1',
  institution_id: 'inst-1',
  scheduled_at: '2025-10-22T09:30:00Z',
  status: 'finalizado',
  notes: 'Consulta completada. Derivar a cardiología',
  created_by: 'user-1',
  created_at: '2025-10-22T08:30:00Z',
  updated_at: '2025-10-22T10:00:00Z',
}

export const mockAppointmentCancelled: Appointment = {
  id: 'appt-cancelled-1',
  patient_id: 'patient-3',
  professional_id: 'prof-2',
  service_id: 'service-2',
  room_id: 'room-2',
  institution_id: 'inst-1',
  scheduled_at: '2025-10-23T14:00:00Z',
  status: 'cancelado',
  notes: 'Cancelado por solicitud del paciente',
  created_by: 'user-1',
  created_at: '2025-10-21T11:00:00Z',
  updated_at: '2025-10-22T09:15:00Z',
}

export const mockAppointmentAbsent: Appointment = {
  id: 'appt-absent-1',
  patient_id: 'patient-1',
  professional_id: 'prof-3',
  service_id: 'service-3',
  room_id: 'room-3',
  institution_id: 'inst-1',
  scheduled_at: '2025-10-21T15:00:00Z',
  status: 'ausente',
  notes: 'Paciente no se presentó',
  created_by: 'user-1',
  created_at: '2025-10-20T10:00:00Z',
  updated_at: '2025-10-21T15:15:00Z',
}

/**
 * Turno mínimo sin notas
 */
export const mockAppointmentMinimal: Appointment = {
  id: 'appt-minimal-1',
  patient_id: 'patient-1',
  professional_id: 'prof-1',
  service_id: 'service-1',
  institution_id: 'inst-1',
  scheduled_at: '2025-10-25T10:00:00Z',
  status: 'pendiente',
  created_at: '2025-10-22T10:00:00Z',
  updated_at: '2025-10-22T10:00:00Z',
}

/**
 * Turno sin sala asignada
 */
export const mockAppointmentNoRoom: Appointment = {
  id: 'appt-no-room-1',
  patient_id: 'patient-2',
  professional_id: 'prof-2',
  service_id: 'service-2',
  institution_id: 'inst-1',
  scheduled_at: '2025-10-25T11:00:00Z',
  status: 'pendiente',
  notes: 'Pendiente asignación de sala',
  created_by: 'user-1',
  created_at: '2025-10-22T11:00:00Z',
  updated_at: '2025-10-22T11:00:00Z',
}

/**
 * Turno futuro (próxima semana)
 */
export const mockAppointmentNextWeek = (): Appointment => {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(9, 0, 0, 0)

  return {
    id: 'appt-next-week-1',
    patient_id: 'patient-1',
    professional_id: 'prof-1',
    service_id: 'service-1',
    room_id: 'room-1',
    institution_id: 'inst-1',
    scheduled_at: nextWeek.toISOString(),
    status: 'pendiente',
    notes: 'Control de seguimiento',
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Turno pasado (semana anterior)
 */
export const mockAppointmentLastWeek = (): Appointment => {
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  lastWeek.setHours(10, 0, 0, 0)

  return {
    id: 'appt-last-week-1',
    patient_id: 'patient-1',
    professional_id: 'prof-1',
    service_id: 'service-1',
    room_id: 'room-1',
    institution_id: 'inst-1',
    scheduled_at: lastWeek.toISOString(),
    status: 'finalizado',
    notes: 'Consulta completada exitosamente',
    created_by: 'user-1',
    created_at: new Date(lastWeek.getTime() - 86400000).toISOString(),
    updated_at: lastWeek.toISOString(),
  }
}
