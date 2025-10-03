// Sistema de manejo de concurrencia para slots de turnos
// Previene double-booking y condiciones de carrera

import { supabase } from './supabase'

export interface SlotLock {
  id: string
  slot_datetime: string
  professional_id: string
  service_id: string
  institution_id: string
  locked_by: string
  locked_at: string
  expires_at: string
}

export interface ConcurrencyResult<T = any> {
  success: boolean
  data?: T
  error?: string
  conflictType?: 'slot_taken' | 'lock_expired' | 'invalid_lock' | 'rate_limit'
}

class ConcurrencyManager {
  private static instance: ConcurrencyManager
  private lockDuration = 5 * 60 * 1000 // 5 minutes in milliseconds
  private activeLocks = new Map<string, NodeJS.Timeout>()

  constructor() {
    // Cleanup expired locks periodically
    setInterval(() => this.cleanupExpiredLocks(), 60 * 1000) // Every minute
  }

  static getInstance(): ConcurrencyManager {
    if (!ConcurrencyManager.instance) {
      ConcurrencyManager.instance = new ConcurrencyManager()
    }
    return ConcurrencyManager.instance
  }

  /**
   * Attempt to acquire a lock on a specific time slot
   */
  async acquireSlotLock(
    datetime: string,
    professionalId: string,
    serviceId: string,
    institutionId: string,
    userId: string
  ): Promise<ConcurrencyResult<SlotLock>> {
    try {
      const lockId = this.generateLockId(datetime, professionalId, serviceId)
      const expiresAt = new Date(Date.now() + this.lockDuration).toISOString()

      // First, check if slot is already booked
      const { data: existingAppointment, error: appointmentError } = await supabase
        .from('appointment')
        .select('id')
        .eq('professional_id', professionalId)
        .eq('service_id', serviceId)
        .eq('institution_id', institutionId)
        .eq('scheduled_at', datetime)
        .not('status', 'in', '(cancelado,ausente)')
        .single()

      if (appointmentError && appointmentError.code !== 'PGRST116') {
        throw appointmentError
      }

      if (existingAppointment) {
        return {
          success: false,
          error: 'Slot is already booked',
          conflictType: 'slot_taken'
        }
      }

      // Try to acquire lock using upsert with conflict handling
      const { data: lock, error: lockError } = await supabase
        .from('slot_locks')
        .upsert({
          id: lockId,
          slot_datetime: datetime,
          professional_id: professionalId,
          service_id: serviceId,
          institution_id: institutionId,
          locked_by: userId,
          locked_at: new Date().toISOString(),
          expires_at: expiresAt
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (lockError) {
        // Check if it's a conflict with existing lock
        const { data: existingLock } = await supabase
          .from('slot_locks')
          .select('*')
          .eq('id', lockId)
          .single()

        if (existingLock) {
          // Check if lock is expired
          if (new Date(existingLock.expires_at) < new Date()) {
            // Try to acquire expired lock
            const { data: updatedLock, error: updateError } = await supabase
              .from('slot_locks')
              .update({
                locked_by: userId,
                locked_at: new Date().toISOString(),
                expires_at: expiresAt
              })
              .eq('id', lockId)
              .eq('expires_at', existingLock.expires_at) // Optimistic concurrency control
              .select()
              .single()

            if (updateError) {
              return {
                success: false,
                error: 'Failed to acquire expired lock',
                conflictType: 'invalid_lock'
              }
            }

            this.scheduleAutoRelease(lockId)
            return { success: true, data: updatedLock }
          }

          // Lock is still valid and held by someone else
          return {
            success: false,
            error: `Slot is temporarily locked by another user until ${new Date(existingLock.expires_at).toLocaleTimeString()}`,
            conflictType: 'slot_taken'
          }
        }

        throw lockError
      }

      // Schedule automatic release
      this.scheduleAutoRelease(lockId)

      return { success: true, data: lock }
    } catch (error) {
      console.error('Failed to acquire slot lock:', error)
      return {
        success: false,
        error: 'Internal error acquiring lock'
      }
    }
  }

  /**
   * Release a specific lock
   */
  async releaseSlotLock(lockId: string, userId: string): Promise<ConcurrencyResult> {
    try {
      const { data, error } = await supabase
        .from('slot_locks')
        .delete()
        .eq('id', lockId)
        .eq('locked_by', userId) // Ensure user can only release their own locks
        .select()

      if (error) throw error

      // Cancel auto-release timer
      if (this.activeLocks.has(lockId)) {
        clearTimeout(this.activeLocks.get(lockId)!)
        this.activeLocks.delete(lockId)
      }

      return { success: true, data }
    } catch (error) {
      console.error('Failed to release slot lock:', error)
      return {
        success: false,
        error: 'Failed to release lock'
      }
    }
  }

  /**
   * Create appointment with concurrency protection
   */
  async createAppointmentSafely(
    appointmentData: {
      patient_id: string
      professional_id: string
      service_id: string
      room_id?: string
      institution_id: string
      scheduled_at: string
      notes?: string
      created_by: string
    },
    lockId: string
  ): Promise<ConcurrencyResult> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    try {
      // Verify lock ownership and validity
      const { data: lock, error: lockError } = await supabase
        .from('slot_locks')
        .select('*')
        .eq('id', lockId)
        .eq('locked_by', user.id)
        .single()

      if (lockError || !lock) {
        return {
          success: false,
          error: 'Invalid or expired lock',
          conflictType: 'invalid_lock'
        }
      }

      if (new Date(lock.expires_at) < new Date()) {
        await this.releaseSlotLock(lockId, user.id)
        return {
          success: false,
          error: 'Lock has expired',
          conflictType: 'lock_expired'
        }
      }

      // Double-check slot availability
      const { data: existingAppointment, error: checkError } = await supabase
        .from('appointment')
        .select('id')
        .eq('professional_id', appointmentData.professional_id)
        .eq('service_id', appointmentData.service_id)
        .eq('institution_id', appointmentData.institution_id)
        .eq('scheduled_at', appointmentData.scheduled_at)
        .not('status', 'in', '(cancelado,ausente)')
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingAppointment) {
        await this.releaseSlotLock(lockId, user.id)
        return {
          success: false,
          error: 'Slot was booked by another user',
          conflictType: 'slot_taken'
        }
      }

      // Create appointment and release lock in a transaction-like operation
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointment')
        .insert(appointmentData)
        .select()
        .single()

      if (appointmentError) {
        // If appointment creation fails, keep the lock for retry
        throw appointmentError
      }

      // Release lock after successful appointment creation
      await this.releaseSlotLock(lockId, user.id)

      return { success: true, data: appointment }
    } catch (error) {
      console.error('Failed to create appointment safely:', error)
      return {
        success: false,
        error: 'Failed to create appointment'
      }
    }
  }

  /**
   * Batch acquire locks for multiple slots (for bulk operations)
   */
  async acquireMultipleSlotLocks(
    slots: Array<{
      datetime: string
      professionalId: string
      serviceId: string
      institutionId: string
    }>,
    userId: string
  ): Promise<ConcurrencyResult<SlotLock[]>> {
    try {
      const lockResults: SlotLock[] = []
      const failedLocks: string[] = []

      for (const slot of slots) {
        const result = await this.acquireSlotLock(
          slot.datetime,
          slot.professionalId,
          slot.serviceId,
          slot.institutionId,
          userId
        )

        if (result.success && result.data) {
          lockResults.push(result.data)
        } else {
          failedLocks.push(`${slot.datetime} - ${result.error}`)
        }
      }

      if (failedLocks.length > 0) {
        // Release any acquired locks if some failed
        for (const lock of lockResults) {
          await this.releaseSlotLock(lock.id, userId)
        }

        return {
          success: false,
          error: `Failed to acquire all locks: ${failedLocks.join(', ')}`
        }
      }

      return { success: true, data: lockResults }
    } catch (error) {
      console.error('Failed to acquire multiple slot locks:', error)
      return {
        success: false,
        error: 'Failed to acquire multiple locks'
      }
    }
  }

  /**
   * Get current user's active locks
   */
  async getUserActiveLocks(userId: string): Promise<SlotLock[]> {
    try {
      const { data, error } = await supabase
        .from('slot_locks')
        .select('*')
        .eq('locked_by', userId)
        .gt('expires_at', new Date().toISOString())
        .order('locked_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get user active locks:', error)
      return []
    }
  }

  /**
   * Release all locks for a user (cleanup on logout/error)
   */
  async releaseAllUserLocks(userId: string): Promise<void> {
    try {
      await supabase
        .from('slot_locks')
        .delete()
        .eq('locked_by', userId)

      // Clear all auto-release timers for this user
      for (const [lockId, timer] of this.activeLocks.entries()) {
        clearTimeout(timer)
        this.activeLocks.delete(lockId)
      }
    } catch (error) {
      console.error('Failed to release all user locks:', error)
    }
  }

  /**
   * Check for slot conflicts before attempting to book
   */
  async checkSlotConflicts(
    datetime: string,
    professionalId: string,
    serviceId: string,
    institutionId: string
  ): Promise<{
    hasConflict: boolean
    conflictType?: 'existing_appointment' | 'active_lock'
    details?: any
  }> {
    try {
      // Check for existing appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointment')
        .select('id, status, patient:patient_id(first_name, last_name)')
        .eq('professional_id', professionalId)
        .eq('service_id', serviceId)
        .eq('institution_id', institutionId)
        .eq('scheduled_at', datetime)
        .not('status', 'in', '(cancelado,ausente)')
        .single()

      if (appointmentError && appointmentError.code !== 'PGRST116') {
        throw appointmentError
      }

      if (appointment) {
        return {
          hasConflict: true,
          conflictType: 'existing_appointment',
          details: appointment
        }
      }

      // Check for active lock
      const lockId = this.generateLockId(datetime, professionalId, serviceId)
      const { data: lock, error: lockError } = await supabase
        .from('slot_locks')
        .select('*')
        .eq('id', lockId)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (lockError && lockError.code !== 'PGRST116') {
        throw lockError
      }

      if (lock) {
        return {
          hasConflict: true,
          conflictType: 'active_lock',
          details: lock
        }
      }

      return { hasConflict: false }
    } catch (error) {
      console.error('Failed to check slot conflicts:', error)
      return { hasConflict: true, conflictType: 'existing_appointment' } // Err on safe side
    }
  }

  private generateLockId(datetime: string, professionalId: string, serviceId: string): string {
    return `lock_${professionalId}_${serviceId}_${datetime.replace(/[:\-T.]/g, '')}`
  }

  private scheduleAutoRelease(lockId: string): void {
    const timer = setTimeout(async () => {
      try {
        await supabase
          .from('slot_locks')
          .delete()
          .eq('id', lockId)
          .lt('expires_at', new Date().toISOString())

        this.activeLocks.delete(lockId)
      } catch (error) {
        console.error('Failed to auto-release lock:', error)
      }
    }, this.lockDuration)

    this.activeLocks.set(lockId, timer)
  }

  private async cleanupExpiredLocks(): Promise<void> {
    try {
      await supabase
        .from('slot_locks')
        .delete()
        .lt('expires_at', new Date().toISOString())
    } catch (error) {
      console.error('Failed to cleanup expired locks:', error)
    }
  }
}

// Export singleton instance
export const concurrencyManager = ConcurrencyManager.getInstance()

// React hook for using concurrency features
export function useConcurrency() {
  const acquireSlotLock = async (
    datetime: string,
    professionalId: string,
    serviceId: string,
    institutionId: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    return concurrencyManager.acquireSlotLock(
      datetime,
      professionalId,
      serviceId,
      institutionId,
      user.id
    )
  }

  const releaseSlotLock = async (lockId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    return concurrencyManager.releaseSlotLock(lockId, user.id)
  }

  const createAppointmentSafely = async (
    appointmentData: any,
    lockId: string
  ) => {
    return concurrencyManager.createAppointmentSafely(appointmentData, lockId)
  }

  const checkSlotConflicts = async (
    datetime: string,
    professionalId: string,
    serviceId: string,
    institutionId: string
  ) => {
    return concurrencyManager.checkSlotConflicts(
      datetime,
      professionalId,
      serviceId,
      institutionId
    )
  }

  return {
    acquireSlotLock,
    releaseSlotLock,
    createAppointmentSafely,
    checkSlotConflicts
  }
}

export default concurrencyManager