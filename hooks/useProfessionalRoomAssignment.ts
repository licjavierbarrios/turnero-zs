import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Tipos para asignación de consultorios a profesionales
 */

export interface ProfessionalRoomPreference {
  id: string
  professional_id: string
  room_id: string | null
  is_preferred: boolean
  notes: string | null
  institution_id: string
  created_at: string
  updated_at: string
  room?: {
    id: string
    name: string
  }
}

export interface DailyProfessionalAssignment {
  id: string
  professional_id: string
  room_id: string
  assignment_date: string // DATE format: YYYY-MM-DD
  start_time: string | null
  end_time: string | null
  assignment_notes: string | null
  created_by: string | null
  institution_id: string
  created_at: string
  professional?: {
    id: string
    first_name: string
    last_name: string
    speciality: string | null
  }
  room?: {
    id: string
    name: string
  }
  created_by_user?: {
    first_name: string
    last_name: string
  }
}

export interface Professional {
  id: string
  first_name: string
  last_name: string
  institution_id: string
  speciality: string | null
  is_active: boolean
  user_id: string | null
  professional_type: string | null
}

export interface Room {
  id: string
  name: string
  institution_id: string
  is_active: boolean
}

/**
 * Hook para gestionar asignaciones de consultorios a profesionales
 */
export function useProfessionalRoomAssignment(institutionId?: string) {
  const [preferences, setPreferences] = useState<ProfessionalRoomPreference[]>([])
  const [assignments, setAssignments] = useState<DailyProfessionalAssignment[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Cargar preferencias de consultorios para una institución
   */
  const fetchPreferences = useCallback(async (instId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('professional_room_preference')
        .select(`
          *,
          room:room_id (
            id,
            name
          )
        `)
        .eq('institution_id', instId)

      if (fetchError) throw fetchError
      setPreferences(data || [])

      return data || []
    } catch (err: any) {
      const error = new Error(err.message || 'Error al cargar preferencias')
      setError(error)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Cargar asignaciones diarias para una fecha y institución
   */
  const fetchAssignments = useCallback(
    async (instId: string, date: string) => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('daily_professional_assignment')
          .select(`
            *,
            professional:professional_id (
              id,
              first_name,
              last_name,
              speciality
            ),
            room:room_id (
              id,
              name
            ),
            created_by_user:created_by (
              first_name,
              last_name
            )
          `)
          .eq('institution_id', instId)
          .eq('assignment_date', date)
          .order('created_at', { ascending: true })

        if (fetchError) throw fetchError
        setAssignments(data || [])

        return data || []
      } catch (err: any) {
        const error = new Error(err.message || 'Error al cargar asignaciones')
        setError(error)
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Cargar profesionales activos de una institución
   */
  const fetchProfessionals = useCallback(async (instId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('professional')
        .select('*')
        .eq('institution_id', instId)
        .eq('is_active', true)
        .order('last_name', { ascending: true })

      if (fetchError) throw fetchError
      setProfessionals(data || [])

      return data || []
    } catch (err: any) {
      const error = new Error(err.message || 'Error al cargar profesionales')
      setError(error)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Cargar consultorios disponibles de una institución
   */
  const fetchRooms = useCallback(async (instId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('room')
        .select('*')
        .eq('institution_id', instId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      setRooms(data || [])

      return data || []
    } catch (err: any) {
      const error = new Error(err.message || 'Error al cargar consultorios')
      setError(error)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Crear o actualizar preferencia de consultorio
   */
  const savePreference = useCallback(
    async (
      professionalId: string,
      instId: string,
      roomId: string | null,
      isPreferred: boolean,
      notes?: string
    ) => {
      try {
        setError(null)

        // Buscar si ya existe
        const existing = preferences.find(
          (p) =>
            p.professional_id === professionalId &&
            p.institution_id === instId
        )

        if (existing) {
          // Actualizar
          const { error: updateError } = await supabase
            .from('professional_room_preference')
            .update({
              room_id: roomId,
              is_preferred: isPreferred,
              notes: notes || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)

          if (updateError) throw updateError
        } else {
          // Crear
          const { error: insertError } = await supabase
            .from('professional_room_preference')
            .insert({
              professional_id: professionalId,
              institution_id: instId,
              room_id: roomId,
              is_preferred: isPreferred,
              notes: notes || null
            })

          if (insertError) throw insertError
        }

        // Recargar preferencias
        await fetchPreferences(instId)

        return { success: true }
      } catch (err: any) {
        const error = new Error(
          err.message || 'Error al guardar preferencia'
        )
        setError(error)
        return { success: false, error }
      }
    },
    [preferences, fetchPreferences]
  )

  /**
   * Crear asignación diaria
   */
  const createDailyAssignment = useCallback(
    async (
      professionalId: string,
      roomId: string,
      instId: string,
      scheduledDate: string,
      startTime?: string,
      endTime?: string,
      notes?: string
    ) => {
      try {
        setError(null)

        const currentUser = await supabase.auth.getUser()

        const { error: insertError } = await supabase
          .from('daily_professional_assignment')
          .insert({
            professional_id: professionalId,
            room_id: roomId,
            assignment_date: scheduledDate,
            start_time: startTime || null,
            end_time: endTime || null,
            assignment_notes: notes || null,
            created_by: currentUser.data.user?.id || null,
            institution_id: instId
          })

        if (insertError) throw insertError

        // Recargar asignaciones
        await fetchAssignments(instId, scheduledDate)

        return { success: true }
      } catch (err: any) {
        const error = new Error(err.message || 'Error al crear asignación')
        setError(error)
        return { success: false, error }
      }
    },
    [fetchAssignments]
  )

  /**
   * Actualizar asignación diaria
   */
  const updateDailyAssignment = useCallback(
    async (
      assignmentId: string,
      roomId: string,
      instId: string,
      scheduledDate: string,
      startTime?: string,
      endTime?: string,
      notes?: string
    ) => {
      try {
        setError(null)

        const { error: updateError } = await supabase
          .from('daily_professional_assignment')
          .update({
            room_id: roomId,
            start_time: startTime || null,
            end_time: endTime || null,
            assignment_notes: notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', assignmentId)

        if (updateError) throw updateError

        // Recargar asignaciones
        await fetchAssignments(instId, scheduledDate)

        return { success: true }
      } catch (err: any) {
        const error = new Error(err.message || 'Error al actualizar asignación')
        setError(error)
        return { success: false, error }
      }
    },
    [fetchAssignments]
  )

  /**
   * Eliminar asignación diaria
   */
  const deleteDailyAssignment = useCallback(
    async (assignmentId: string, instId: string, scheduledDate: string) => {
      try {
        setError(null)

        const { error: deleteError } = await supabase
          .from('daily_professional_assignment')
          .delete()
          .eq('id', assignmentId)

        if (deleteError) throw deleteError

        // Recargar asignaciones
        await fetchAssignments(instId, scheduledDate)

        return { success: true }
      } catch (err: any) {
        const error = new Error(err.message || 'Error al eliminar asignación')
        setError(error)
        return { success: false, error }
      }
    },
    [fetchAssignments]
  )

  /**
   * Obtener preferencia para un profesional
   */
  const getPreferenceForProfessional = useCallback(
    (professionalId: string) => {
      return preferences.find((p) => p.professional_id === professionalId)
    },
    [preferences]
  )

  /**
   * Obtener asignaciones para un profesional en una fecha
   */
  const getAssignmentsForProfessional = useCallback(
    (professionalId: string, date: string) => {
      return assignments.filter(
        (a) =>
          a.professional_id === professionalId &&
          a.assignment_date === date
      )
    },
    [assignments]
  )

  /**
   * Obtener asignaciones para una sala en una fecha
   */
  const getAssignmentsForRoom = useCallback(
    (roomId: string, date: string) => {
      return assignments.filter(
        (a) =>
          a.room_id === roomId &&
          a.assignment_date === date
      )
    },
    [assignments]
  )

  return {
    // Data
    preferences,
    assignments,
    professionals,
    rooms,
    loading,
    error,

    // Fetch methods
    fetchPreferences,
    fetchAssignments,
    fetchProfessionals,
    fetchRooms,

    // Create/Update/Delete methods
    savePreference,
    createDailyAssignment,
    updateDailyAssignment,
    deleteDailyAssignment,

    // Query methods
    getPreferenceForProfessional,
    getAssignmentsForProfessional,
    getAssignmentsForRoom
  }
}
