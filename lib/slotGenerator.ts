import { supabase } from './supabase'

export type SlotTemplate = {
  id: string
  professional_id: string
  service_id: string
  room_id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  is_active: boolean
}

export type GeneratedSlot = {
  datetime: string
  professional_id: string
  service_id: string
  room_id: string | null
  institution_id: string
  template_id: string
  available: boolean
}

export type ExistingAppointment = {
  id: string
  scheduled_at: string
  professional_id: string
  status: string
}

/**
 * Genera slots de tiempo para una plantilla de horario específica
 */
export function generateTimeSlots(
  startTime: string, 
  endTime: string, 
  duration: number
): string[] {
  const slots: string[] = []
  const start = new Date(`2000-01-01T${startTime}:00`)
  const end = new Date(`2000-01-01T${endTime}:00`)
  
  let current = new Date(start)
  while (current < end) {
    slots.push(current.toTimeString().substring(0, 5))
    current.setMinutes(current.getMinutes() + duration)
  }
  
  return slots
}

/**
 * Genera slots de turnos para una fecha específica basado en plantillas
 */
export function generateSlotsForDate(
  date: Date,
  templates: SlotTemplate[],
  institutionId: string,
  existingAppointments: ExistingAppointment[] = []
): GeneratedSlot[] {
  const dayOfWeek = date.getDay()
  const dateStr = date.toISOString().split('T')[0]
  const slots: GeneratedSlot[] = []

  // Filtrar plantillas para el día de la semana específico
  const dayTemplates = templates.filter(
    template => template.day_of_week === dayOfWeek && template.is_active
  )

  dayTemplates.forEach(template => {
    const timeSlots = generateTimeSlots(
      template.start_time,
      template.end_time,
      template.slot_duration_minutes
    )

    timeSlots.forEach(time => {
      const datetime = `${dateStr}T${time}:00`
      
      // Verificar si ya existe un turno para este horario y profesional
      const existingAppointment = existingAppointments.find(
        apt => 
          apt.professional_id === template.professional_id &&
          apt.scheduled_at.startsWith(datetime.substring(0, 16)) &&
          !['cancelado', 'ausente'].includes(apt.status)
      )

      slots.push({
        datetime,
        professional_id: template.professional_id,
        service_id: template.service_id,
        room_id: template.room_id,
        institution_id: institutionId,
        template_id: template.id,
        available: !existingAppointment
      })
    })
  })

  // Ordenar por horario
  slots.sort((a, b) => a.datetime.localeCompare(b.datetime))
  
  return slots
}

/**
 * Genera slots para un rango de fechas
 */
export function generateSlotsForDateRange(
  startDate: Date,
  endDate: Date,
  templates: SlotTemplate[],
  institutionId: string,
  existingAppointments: ExistingAppointment[] = []
): { [date: string]: GeneratedSlot[] } {
  const slots: { [date: string]: GeneratedSlot[] } = {}
  
  const current = new Date(startDate)
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0]
    slots[dateStr] = generateSlotsForDate(current, templates, institutionId, existingAppointments)
    current.setDate(current.getDate() + 1)
  }
  
  return slots
}

/**
 * Obtiene turnos existentes para un rango de fechas
 */
export async function getExistingAppointments(
  startDate: string,
  endDate: string,
  institutionId: string
): Promise<ExistingAppointment[]> {
  const { data, error } = await supabase
    .from('appointment')
    .select('id, scheduled_at, professional_id, status')
    .eq('institution_id', institutionId)
    .gte('scheduled_at', `${startDate}T00:00:00`)
    .lte('scheduled_at', `${endDate}T23:59:59`)
    .order('scheduled_at', { ascending: true })

  if (error) {
    console.error('Error fetching existing appointments:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene plantillas de horarios activas para una institución
 */
export async function getSlotTemplatesForInstitution(
  institutionId: string
): Promise<SlotTemplate[]> {
  // Primero obtener profesionales de la institución
  const { data: professionals, error: profError } = await supabase
    .from('professional')
    .select('id')
    .eq('institution_id', institutionId)
    .eq('is_active', true)

  if (profError) {
    console.error('Error fetching professionals:', profError)
    return []
  }

  const professionalIds = professionals.map((p: any) => p.id)
  
  if (professionalIds.length === 0) {
    return []
  }

  // Luego obtener plantillas de esos profesionales
  const { data: templates, error: templateError } = await supabase
    .from('slot_template')
    .select('*')
    .in('professional_id', professionalIds)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (templateError) {
    console.error('Error fetching slot templates:', templateError)
    return []
  }

  return templates || []
}

/**
 * Genera slots disponibles para los próximos N días
 */
export async function generateAvailableSlots(
  institutionId: string,
  days: number = 30
): Promise<{ [date: string]: GeneratedSlot[] }> {
  try {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Obtener plantillas y turnos existentes en paralelo
    const [templates, existingAppointments] = await Promise.all([
      getSlotTemplatesForInstitution(institutionId),
      getExistingAppointments(startDateStr, endDateStr, institutionId)
    ])

    // Generar slots
    return generateSlotsForDateRange(
      startDate,
      endDate,
      templates,
      institutionId,
      existingAppointments
    )
  } catch (error) {
    console.error('Error generating available slots:', error)
    return {}
  }
}

/**
 * Estadísticas de slots
 */
export function getSlotStatistics(slots: { [date: string]: GeneratedSlot[] }) {
  let totalSlots = 0
  let availableSlots = 0
  let occupiedSlots = 0

  Object.values(slots).forEach(daySlots => {
    totalSlots += daySlots.length
    availableSlots += daySlots.filter(slot => slot.available).length
    occupiedSlots += daySlots.filter(slot => !slot.available).length
  })

  return {
    totalSlots,
    availableSlots,
    occupiedSlots,
    occupancyRate: totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0
  }
}