import { vi, beforeEach, afterEach } from 'vitest'

/**
 * Helper para congelar el tiempo durante un test.
 * Útil para tests que dependen de Date.now() o new Date()
 *
 * @example
 * ```typescript
 * import { withFrozenTime } from '@/tests/utils/time'
 *
 * describe('with frozen time', () => {
 *   withFrozenTime(new Date('2025-10-03T10:00:00Z'), () => {
 *     test('should use frozen date', () => {
 *       expect(new Date().toISOString()).toBe('2025-10-03T10:00:00.000Z')
 *     })
 *   })
 * })
 * ```
 */
export const withFrozenTime = (date: Date, fn: () => void) => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(date)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  fn()
}

/**
 * Helper para avanzar el tiempo en tests
 *
 * @example
 * ```typescript
 * import { advanceTime } from '@/tests/utils/time'
 *
 * test('should handle timeout', async () => {
 *   vi.useFakeTimers()
 *
 *   const callback = vi.fn()
 *   setTimeout(callback, 1000)
 *
 *   await advanceTime(1000)
 *   expect(callback).toHaveBeenCalled()
 *
 *   vi.useRealTimers()
 * })
 * ```
 */
export const advanceTime = async (ms: number) => {
  vi.advanceTimersByTime(ms)
  // Dar tiempo para que se ejecuten las promesas pendientes
  await Promise.resolve()
}

/**
 * Helper para avanzar al siguiente tick
 */
export const nextTick = async () => {
  await Promise.resolve()
}

/**
 * Helper para crear una fecha en timezone de Argentina (UTC-3)
 * @param dateString - String de fecha en formato ISO
 */
export const createArgentineDate = (dateString: string): Date => {
  return new Date(dateString)
}

/**
 * Helper para formatear fecha al formato usado en la app (es-AR)
 */
export const formatTestDate = (date: Date): string => {
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Helper para crear un rango de fechas para tests
 */
export const createDateRange = (
  start: Date,
  days: number
): Date[] => {
  const dates: Date[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    dates.push(date)
  }
  return dates
}
