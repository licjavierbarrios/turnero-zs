import type { QueueItem, ProfessionalAssignment, AttentionOption, Service, Professional, Room } from './types'

/**
 * Transforma datos crudos de Supabase a QueueItem tipado.
 *
 * @param raw - Datos crudos de la query de Supabase con joins
 * @returns QueueItem con todos los campos tipados
 *
 * @example
 * ```typescript
 * const { data } = await supabase
 *   .from('daily_queue')
 *   .select(`
 *     *,
 *     service:service_id (name),
 *     professional:professional_id (first_name, last_name),
 *     room:room_id (name)
 *   `)
 *   .single()
 *
 * const queueItem = transformQueueItem(data)
 * ```
 */
export function transformQueueItem(raw: any): QueueItem {
  return {
    id: raw.id,
    order_number: raw.order_number,
    patient_name: raw.patient_name,
    patient_dni: raw.patient_dni,
    service_id: raw.service_id,
    service_name: raw.service?.name || 'Sin servicio',
    professional_id: raw.professional_id,
    professional_name: raw.professional
      ? `${raw.professional.first_name} ${raw.professional.last_name}`
      : null,
    room_id: raw.room_id,
    room_name: raw.room?.name || null,
    status: raw.status,
    created_at: raw.created_at,
    enabled_at: raw.enabled_at,
    called_at: raw.called_at,
    attended_at: raw.attended_at
  }
}

/**
 * Transforma datos de asignaciones de profesionales de Supabase.
 *
 * @param raw - Datos crudos de daily_professional_assignment con joins
 * @returns Array de ProfessionalAssignment tipadas
 *
 * @example
 * ```typescript
 * const { data } = await supabase
 *   .from('daily_professional_assignment')
 *   .select(`
 *     *,
 *     professional:professional_id (id, first_name, last_name, speciality),
 *     room:room_id (id, name)
 *   `)
 *
 * const assignments = transformProfessionalAssignments(data)
 * ```
 */
export function transformProfessionalAssignments(rawData: any[]): ProfessionalAssignment[] {
  return (rawData || [])
    .filter((a: any) => a.professional && a.room)
    .map((a: any) => {
      const prof = a.professional as any
      return {
        id: a.id,
        professional_id: a.professional_id,
        room_id: a.room_id,
        professional_name: `${prof.first_name} ${prof.last_name}`,
        speciality: prof.speciality,
        room_name: (a.room as any).name
      }
    })
}

/**
 * Transforma servicios asignados al usuario desde Supabase.
 *
 * @param rawData - Datos crudos de user_service con joins
 * @returns Array de Service tipadas
 *
 * @example
 * ```typescript
 * const { data } = await supabase
 *   .from('user_service')
 *   .select('service_id, service:service_id (id, name)')
 *
 * const userServices = transformUserServices(data)
 * ```
 */
export function transformUserServices(rawData: any[]): Service[] {
  return (rawData || [])
    .filter((us: any) => us.service)
    .map((us: any) => ({
      id: (us.service as any).id,
      name: (us.service as any).name
    }))
}

/**
 * Combina servicios y asignaciones de profesionales en opciones de atención.
 *
 * @param services - Lista de servicios
 * @param assignments - Lista de asignaciones de profesionales
 * @returns Array combinado de AttentionOption
 *
 * @example
 * ```typescript
 * const options = buildAttentionOptions(services, professionalAssignments)
 * // [
 * //   { id: 'service-123', type: 'service', label: 'Clínica Médica', ... },
 * //   { id: 'professional-456', type: 'professional', label: 'Dr. Pérez - Cardiología (Consultorio 1)', ... }
 * // ]
 * ```
 */
export function buildAttentionOptions(
  services: Service[],
  assignments: ProfessionalAssignment[]
): AttentionOption[] {
  const serviceOptions: AttentionOption[] = services.map((s: Service) => ({
    id: `service-${s.id}`,
    type: 'service',
    label: s.name,
    service_id: s.id,
    professional_id: null,
    room_id: null
  }))

  const professionalOptions: AttentionOption[] = assignments.map((a: ProfessionalAssignment) => ({
    id: `professional-${a.professional_id}`,
    type: 'professional',
    label: a.speciality
      ? `${a.professional_name} - ${a.speciality} (${a.room_name})`
      : `${a.professional_name} (${a.room_name})`,
    service_id: '', // Los profesionales no tienen service_id directo
    professional_id: a.professional_id,
    room_id: a.room_id
  }))

  return [...serviceOptions, ...professionalOptions]
}

/**
 * Extrae listas únicas de profesionales desde la cola.
 *
 * @param queue - Lista de items en la cola
 * @returns Array de Professional únicos
 *
 * @example
 * ```typescript
 * const professionals = extractUniqueProfessionals(queue)
 * // [{ id: '123', name: 'Dr. Pérez', speciality: null }, ...]
 * ```
 */
export function extractUniqueProfessionals(queue: QueueItem[]): Professional[] {
  const uniqueProfessionals: Professional[] = []
  const seen = new Set<string>()

  queue.forEach(item => {
    if (item.professional_id && !seen.has(item.professional_id)) {
      seen.add(item.professional_id)
      uniqueProfessionals.push({
        id: item.professional_id,
        name: item.professional_name || 'Sin nombre',
        speciality: null
      })
    }
  })

  return uniqueProfessionals
}

/**
 * Extrae listas únicas de consultorios desde la cola.
 *
 * @param queue - Lista de items en la cola
 * @returns Array de Room únicos
 *
 * @example
 * ```typescript
 * const rooms = extractUniqueRooms(queue)
 * // [{ id: '123', name: 'Consultorio 1' }, ...]
 * ```
 */
export function extractUniqueRooms(queue: QueueItem[]): Room[] {
  const uniqueRooms: Room[] = []
  const seen = new Set<string>()

  queue.forEach(item => {
    if (item.room_id && !seen.has(item.room_id)) {
      seen.add(item.room_id)
      uniqueRooms.push({
        id: item.room_id,
        name: item.room_name || 'Sin nombre'
      })
    }
  })

  return uniqueRooms
}

/**
 * Calcula actualizaciones de estado según el nuevo estado de un item.
 *
 * @param newStatus - Nuevo estado del item
 * @param userId - ID del usuario que realiza el cambio (opcional)
 * @returns Objeto con campos a actualizar
 *
 * @example
 * ```typescript
 * const updates = buildStatusUpdates('llamado', userId)
 * // { status: 'llamado', called_at: '2025-10-20T14:30:00.000Z', called_by: userId }
 * ```
 */
export function buildStatusUpdates(
  newStatus: QueueItem['status'],
  userId?: string
): Record<string, any> {
  const now = new Date().toISOString()
  const updates: Record<string, any> = {
    status: newStatus
  }

  if (newStatus === 'disponible') {
    updates.enabled_at = now
  } else if (newStatus === 'llamado') {
    updates.called_at = now
    if (userId) updates.called_by = userId
  } else if (newStatus === 'atendido') {
    updates.attended_at = now
  }

  return updates
}
