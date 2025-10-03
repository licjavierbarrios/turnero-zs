import { describe, test, expect } from 'vitest'
import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatDateTime, formatTime } from '@/lib/utils'
import { withFrozenTime } from '@/tests/utils/time'

describe('Date Utilities', () => {
  describe('formatDateTime', () => {
    test('should format date to Argentine locale (es-AR)', () => {
      const dateString = '2025-10-03T14:30:00Z'
      const result = formatDateTime(dateString)

      // Formato esperado: dd/mm/yyyy, hh:mm
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/)
    })

    test('should handle different date formats', () => {
      const dates = [
        '2025-10-03T10:00:00Z',
        '2025-01-15T08:30:00Z',
        '2025-12-31T23:59:00Z',
      ]

      dates.forEach((dateString) => {
        const result = formatDateTime(dateString)
        expect(result).toBeTruthy()
        expect(typeof result).toBe('string')
      })
    })
  })

  describe('formatTime', () => {
    test('should format time only', () => {
      const dateString = '2025-10-03T14:30:00Z'
      const result = formatTime(dateString)

      // Formato esperado: hh:mm
      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    test('should format different times correctly', () => {
      const times = [
        { input: '2025-10-03T09:00:00Z', pattern: /\d{2}:\d{2}/ },
        { input: '2025-10-03T15:45:00Z', pattern: /\d{2}:\d{2}/ },
        { input: '2025-10-03T00:00:00Z', pattern: /\d{2}:\d{2}/ },
      ]

      times.forEach(({ input, pattern }) => {
        const result = formatTime(input)
        expect(result).toMatch(pattern)
      })
    })
  })

  describe('date-fns with Spanish locale', () => {
    test('should format dates with Spanish day/month names', () => {
      const date = parseISO('2025-10-03T10:00:00Z')
      const formatted = format(date, 'EEEE, d MMMM yyyy', { locale: es })

      expect(formatted).toContain('octubre')
      // Verificar que es un string válido
      expect(formatted.length).toBeGreaterThan(0)
    })

    test('should parse ISO dates correctly', () => {
      const isoString = '2025-10-03T10:00:00Z'
      const parsed = parseISO(isoString)

      expect(isValid(parsed)).toBe(true)
      expect(parsed.getFullYear()).toBe(2025)
      expect(parsed.getMonth()).toBe(9) // Octubre es mes 9 (0-indexed)
      expect(parsed.getDate()).toBe(3)
    })
  })

  describe('with frozen time', () => {
    withFrozenTime(new Date('2025-10-03T10:00:00Z'), () => {
      test('should use frozen date', () => {
        const now = new Date()
        expect(now.toISOString()).toBe('2025-10-03T10:00:00.000Z')
      })

      test('should format frozen date consistently', () => {
        const now = new Date()
        const formatted = formatDateTime(now.toISOString())

        // Verificar que el formato es consistente
        expect(formatted).toBeTruthy()
        expect(typeof formatted).toBe('string')
      })
    })
  })
})
