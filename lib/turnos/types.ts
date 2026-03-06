/**
 * Tipos compartidos para el módulo de turnos/cola
 */

export interface QueueItem {
  id: string
  order_number: number
  patient_name: string
  patient_dni: string
  service_id: string
  service_name: string
  professional_id: string | null
  professional_name: string | null
  room_id: string | null
  room_name: string | null
  status: 'pendiente' | 'disponible' | 'llamado' | 'atendido' | 'cancelado'
  created_at: string
  enabled_at: string | null
  called_at: string | null
  attended_at: string | null
  created_by: string | null
  queue_session_id: string | null
  queue_session_name: string | null
}

export interface QueueSession {
  id: string
  service_id: string
  service_name?: string
  institution_id: string
  session_date: string        // 'YYYY-MM-DD'
  name: string                // ej: "Extracción", "Entrega de resultados"
  start_time: string          // 'HH:MM:SS'
  end_time: string            // 'HH:MM:SS'
  max_slots: number | null
  is_active: boolean
  created_by: string | null
  created_at: string
}

export interface Service {
  id: string
  name: string
}

export interface Professional {
  id: string
  name: string
  speciality: string | null
}

export interface Room {
  id: string
  name: string
}

export interface ProfessionalAssignment {
  id: string
  professional_id: string
  room_id: string
  professional_name: string
  speciality: string | null
  room_name: string
}

export interface AttentionOption {
  id: string
  type: 'service' | 'professional'
  label: string
  service_id: string
  professional_id: string | null
  room_id: string | null
}

export interface StatusConfig {
  label: string
  color: string
  description: string
}

export type QueueStatus = QueueItem['status']

/**
 * Profesional asignado al usuario actual
 * Se usa para filtrar la cola y limitar lo que el usuario puede ver
 */
export interface UserProfessionalAssignment {
  professional_id: string
  professional_name: string
  speciality: string | null
}

/**
 * Servicio asignado al usuario actual
 * Se usa para filtrar la cola y limitar lo que el usuario puede ver
 */
export interface UserServiceAssignment {
  service_id: string
  service_name: string
}
