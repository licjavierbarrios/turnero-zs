import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getNextOrderNumber,
  generateTempId,
  isTempId,
  getTodayISO,
  getNowISO,
  getInstitutionContext,
  isAdminOrAdministrativo
} from '@/lib/turnos/helpers'
import type { QueueItem } from '@/lib/turnos/types'

describe('Turnos Helpers', () => {
  describe('getNextOrderNumber', () => {
    test('should return 1 for empty queue', () => {
      const result = getNextOrderNumber([])
      expect(result).toBe(1)
    })

    test('should return correct next order number for queue with items', () => {
      const queue: QueueItem[] = [
        {
          id: '1',
          order_number: 1,
          patient_name: 'Juan',
          patient_dni: '12345678',
          service_id: 's1',
          service_name: 'Service',
          professional_id: null,
          professional_name: null,
          room_id: null,
          room_name: null,
          status: 'pendiente',
          created_at: '2025-10-20T10:00:00Z',
          enabled_at: null,
          called_at: null,
          attended_at: null
        },
        {
          id: '2',
          order_number: 2,
          patient_name: 'Pedro',
          patient_dni: '87654321',
          service_id: 's1',
          service_name: 'Service',
          professional_id: null,
          professional_name: null,
          room_id: null,
          room_name: null,
          status: 'disponible',
          created_at: '2025-10-20T10:05:00Z',
          enabled_at: '2025-10-20T10:05:00Z',
          called_at: null,
          attended_at: null
        }
      ]
      const result = getNextOrderNumber(queue)
      expect(result).toBe(3)
    })

    test('should handle non-sequential order numbers', () => {
      const queue: QueueItem[] = [
        {
          id: '1',
          order_number: 5,
          patient_name: 'Juan',
          patient_dni: '12345678',
          service_id: 's1',
          service_name: 'Service',
          professional_id: null,
          professional_name: null,
          room_id: null,
          room_name: null,
          status: 'pendiente',
          created_at: '2025-10-20T10:00:00Z',
          enabled_at: null,
          called_at: null,
          attended_at: null
        }
      ]
      const result = getNextOrderNumber(queue)
      expect(result).toBe(6)
    })
  })

  describe('generateTempId', () => {
    test('should generate temp ID with index 0', () => {
      const result = generateTempId(0)
      expect(result).toMatch(/^temp-\d+-0$/)
    })

    test('should generate different temp IDs for different indices', () => {
      const id0 = generateTempId(0)
      const id1 = generateTempId(1)
      expect(id0).not.toBe(id1)
      expect(id0).toMatch(/temp-\d+-0/)
      expect(id1).toMatch(/temp-\d+-1/)
    })

    test('should generate unique IDs over time', async () => {
      const id1 = generateTempId(0)
      await new Promise(resolve => setTimeout(resolve, 10))
      const id2 = generateTempId(0)
      expect(id1).not.toBe(id2)
    })
  })

  describe('isTempId', () => {
    test('should return true for temp IDs', () => {
      expect(isTempId('temp-1234567890-0')).toBe(true)
      expect(isTempId('temp-9999999999-5')).toBe(true)
    })

    test('should return false for regular UUIDs', () => {
      expect(isTempId('550e8400-e29b-41d4-a716-446655440000')).toBe(false)
      expect(isTempId('uuid-12345')).toBe(false)
    })

    test('should return false for empty strings and null-like values', () => {
      expect(isTempId('')).toBe(false)
      expect(isTempId('null')).toBe(false)
    })
  })

  describe('getTodayISO', () => {
    test('should return date in ISO format YYYY-MM-DD', () => {
      const result = getTodayISO()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    test('should return a valid date string', () => {
      const result = getTodayISO()
      const date = new Date(result + 'T00:00:00Z')
      expect(date.getFullYear()).toBeGreaterThan(2020)
      expect(date.getMonth()).toBeGreaterThanOrEqual(0)
      expect(date.getMonth()).toBeLessThan(12)
    })
  })

  describe('getNowISO', () => {
    test('should return datetime in ISO format', () => {
      const result = getNowISO()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test('should be parseable as a valid date', () => {
      const result = getNowISO()
      const date = new Date(result)
      expect(date.getTime()).toBeGreaterThan(0)
    })

    test('should end with Z (UTC timezone)', () => {
      const result = getNowISO()
      expect(result).toMatch(/Z$/)
    })
  })

  describe('getInstitutionContext', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    test('should return null when no context in localStorage', () => {
      const result = getInstitutionContext()
      expect(result).toBeNull()
    })

    test('should return parsed context when it exists', () => {
      const mockContext = {
        institution_id: 'inst-123',
        user_role: 'admin'
      }
      localStorage.setItem('institution_context', JSON.stringify(mockContext))

      const result = getInstitutionContext()
      expect(result).toEqual(mockContext)
    })

    test('should handle complex context objects', () => {
      const mockContext = {
        institution_id: 'inst-456',
        user_role: 'medico',
        user_id: 'user-789',
        institution_name: 'CAPS Centro'
      }
      localStorage.setItem('institution_context', JSON.stringify(mockContext))

      const result = getInstitutionContext()
      expect(result).toEqual(mockContext)
      expect(result?.institution_id).toBe('inst-456')
      expect(result?.user_role).toBe('medico')
    })
  })

  describe('isAdminOrAdministrativo', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    test('should return false when no context', () => {
      const result = isAdminOrAdministrativo()
      expect(result).toBe(false)
    })

    test('should return true when user_role is admin', () => {
      localStorage.setItem(
        'institution_context',
        JSON.stringify({
          institution_id: 'inst-123',
          user_role: 'admin'
        })
      )
      const result = isAdminOrAdministrativo()
      expect(result).toBe(true)
    })

    test('should return true when user_role is administrativo', () => {
      localStorage.setItem(
        'institution_context',
        JSON.stringify({
          institution_id: 'inst-123',
          user_role: 'administrativo'
        })
      )
      const result = isAdminOrAdministrativo()
      expect(result).toBe(true)
    })

    test('should return false for other roles', () => {
      localStorage.setItem(
        'institution_context',
        JSON.stringify({
          institution_id: 'inst-123',
          user_role: 'medico'
        })
      )
      const result = isAdminOrAdministrativo()
      expect(result).toBe(false)
    })

    test('should return false when user_role is pantalla', () => {
      localStorage.setItem(
        'institution_context',
        JSON.stringify({
          institution_id: 'inst-123',
          user_role: 'pantalla'
        })
      )
      const result = isAdminOrAdministrativo()
      expect(result).toBe(false)
    })
  })
})
