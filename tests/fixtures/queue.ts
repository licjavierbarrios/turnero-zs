/**
 * Queue Fixtures
 * Factories para crear datos de prueba de Cola Diaria (daily_queue)
 */

import type { QueueItem, QueueStatus } from '@/lib/turnos/types'

/**
 * Crea un elemento de cola mínimo válido
 */
export const createQueueItem = (overrides?: Partial<QueueItem>): QueueItem => ({
  id: 'queue-1',
  order_number: 1,
  patient_name: 'Pablo González',
  patient_dni: '12345678',
  service_id: 'service-1',
  service_name: 'Medicina General',
  professional_id: null,
  professional_name: null,
  room_id: null,
  room_name: null,
  status: 'pendiente' as QueueStatus,
  created_at: '2025-10-22T08:00:00Z',
  enabled_at: null,
  called_at: null,
  attended_at: null,
  created_by: null,
  ...overrides,
})

/**
 * Crea una cola completa con múltiples elementos en diferentes estados
 */
export const createQueueItems = (count: number = 10): QueueItem[] => {
  const statuses: QueueStatus[] = ['pendiente', 'disponible', 'llamado', 'atendido']
  const services = [
    { id: 'service-1', name: 'Medicina General' },
    { id: 'service-2', name: 'Pediatría' },
    { id: 'service-3', name: 'Cardiología' },
  ]
  const rooms = [
    { id: 'room-1', name: 'Consultorio A' },
    { id: 'room-2', name: 'Consultorio B' },
    { id: 'room-3', name: 'Consultorio C' },
  ]
  const professionals = [
    { id: 'prof-1', name: 'Juan Pérez' },
    { id: 'prof-2', name: 'María García' },
    { id: 'prof-3', name: 'Carlos Martínez' },
  ]

  const items: QueueItem[] = []
  const now = new Date()

  for (let i = 1; i <= count; i++) {
    const status = statuses[(i - 1) % statuses.length]
    const service = services[(i - 1) % services.length]
    const room = rooms[(i - 1) % rooms.length]
    const professional = professionals[(i - 1) % professionals.length]

    let enabledAt = null
    let calledAt = null
    let attendedAt = null

    const baseTime = new Date(now.getTime() - (count - i) * 600000) // Cada uno 10 min antes

    if (['disponible', 'llamado', 'atendido'].includes(status)) {
      enabledAt = new Date(baseTime.getTime() + 120000).toISOString() // +2 min
    }
    if (['llamado', 'atendido'].includes(status)) {
      calledAt = new Date(baseTime.getTime() + 300000).toISOString() // +5 min
    }
    if (status === 'atendido') {
      attendedAt = new Date(baseTime.getTime() + 1800000).toISOString() // +30 min
    }

    items.push({
      id: `queue-${i}`,
      order_number: i,
      patient_name: `Paciente ${String(i).padStart(2, '0')}`,
      patient_dni: `${String(10000000 + i).slice(0, 8)}`,
      service_id: service.id,
      service_name: service.name,
      professional_id: ['llamado', 'atendido'].includes(status) ? professional.id : null,
      professional_name: ['llamado', 'atendido'].includes(status) ? professional.name : null,
      room_id: ['llamado', 'atendido'].includes(status) ? room.id : null,
      room_name: ['llamado', 'atendido'].includes(status) ? room.name : null,
      status: status as QueueStatus,
      created_at: baseTime.toISOString(),
      enabled_at: enabledAt,
      called_at: calledAt,
      attended_at: attendedAt,
      created_by: null,
    })
  }

  return items
}

/**
 * Elementos de cola por estado
 */
export const mockQueueItemPending: QueueItem = {
  id: 'queue-pending-1',
  order_number: 1,
  patient_name: 'Pablo González',
  patient_dni: '12345678',
  service_id: 'service-1',
  service_name: 'Medicina General',
  professional_id: null,
  professional_name: null,
  room_id: null,
  room_name: null,
  status: 'pendiente',
  created_at: '2025-10-22T08:00:00Z',
  enabled_at: null,
  called_at: null,
  attended_at: null,
  created_by: null,
}

export const mockQueueItemAvailable: QueueItem = {
  id: 'queue-available-1',
  order_number: 2,
  patient_name: 'Carmen Martín',
  patient_dni: '87654321',
  service_id: 'service-1',
  service_name: 'Medicina General',
  professional_id: null,
  professional_name: null,
  room_id: null,
  room_name: null,
  status: 'disponible',
  created_at: '2025-10-22T08:10:00Z',
  enabled_at: '2025-10-22T08:12:00Z',
  called_at: null,
  attended_at: null,
  created_by: null,
}

export const mockQueueItemCalled: QueueItem = {
  id: 'queue-called-1',
  order_number: 3,
  patient_name: 'Diego Díaz',
  patient_dni: '11223344',
  service_id: 'service-2',
  service_name: 'Pediatría',
  professional_id: 'prof-1',
  professional_name: 'Juan Pérez',
  room_id: 'room-1',
  room_name: 'Consultorio A',
  status: 'llamado',
  created_at: '2025-10-22T08:20:00Z',
  enabled_at: '2025-10-22T08:22:00Z',
  called_at: '2025-10-22T08:25:00Z',
  attended_at: null,
  created_by: null,
}

export const mockQueueItemAttended: QueueItem = {
  id: 'queue-attended-1',
  order_number: 4,
  patient_name: 'Lucía García',
  patient_dni: '55667788',
  service_id: 'service-3',
  service_name: 'Cardiología',
  professional_id: 'prof-2',
  professional_name: 'María García',
  room_id: 'room-2',
  room_name: 'Consultorio B',
  status: 'atendido',
  created_at: '2025-10-22T08:30:00Z',
  enabled_at: '2025-10-22T08:32:00Z',
  called_at: '2025-10-22T08:35:00Z',
  attended_at: '2025-10-22T09:00:00Z',
  created_by: null,
}

/**
 * Cola con múltiples servicios (escenario realista)
 */
export const mockQueueMultiService: QueueItem[] = [
  mockQueueItemPending,
  mockQueueItemAvailable,
  mockQueueItemCalled,
  mockQueueItemAttended,
  {
    id: 'queue-multi-1',
    order_number: 5,
    patient_name: 'Roberto Soto',
    patient_dni: '99887766',
    service_id: 'service-1',
    service_name: 'Medicina General',
    professional_id: null,
    professional_name: null,
    room_id: null,
    room_name: null,
    status: 'pendiente',
    created_at: '2025-10-22T09:15:00Z',
    enabled_at: null,
    called_at: null,
    attended_at: null,
    created_by: null,
  },
]

/**
 * Cola vacía
 */
export const mockQueueEmpty: QueueItem[] = []

/**
 * Cola con un único paciente
 */
export const mockQueueSingle: QueueItem = {
  id: 'queue-single-1',
  order_number: 1,
  patient_name: 'Único Paciente',
  patient_dni: '00112233',
  service_id: 'service-1',
  service_name: 'Medicina General',
  professional_id: 'prof-1',
  professional_name: 'Juan Pérez',
  room_id: 'room-1',
  room_name: 'Consultorio A',
  status: 'llamado',
  created_at: '2025-10-22T10:00:00Z',
  enabled_at: '2025-10-22T10:02:00Z',
  called_at: '2025-10-22T10:05:00Z',
  attended_at: null,
  created_by: null,
}

/**
 * Cola con nombres largos y caracteres especiales
 */
export const mockQueueItemLongName: QueueItem = {
  id: 'queue-long-name-1',
  order_number: 10,
  patient_name: 'María Magdalena González López de la Cruz',
  patient_dni: '44556677',
  service_id: 'service-1',
  service_name: 'Medicina General',
  professional_id: null,
  professional_name: null,
  room_id: null,
  room_name: null,
  status: 'pendiente',
  created_at: '2025-10-22T11:00:00Z',
  enabled_at: null,
  called_at: null,
  attended_at: null,
  created_by: null,
}
