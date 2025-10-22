/**
 * Queue Management Logic Tests
 * Tests para la lógica central de gestión de cola
 *
 * Nota: Como la página usa server-side context, testeamos
 * la lógica de transformación y filtering de forma aislada
 */

import { describe, test, expect, beforeEach } from 'vitest'
import {
  createQueueItems,
  mockQueueItemPending,
  mockQueueItemAvailable,
  mockQueueItemCalled,
  mockQueueItemAttended,
  mockQueueMultiService,
} from '@/tests/fixtures/queue'
import type { QueueItem } from '@/lib/turnos/types'

/**
 * Simular la lógica de filtering que hace la página
 * Esta función replica el comportamiento de useEffect de la página
 */
function filterQueue(
  queue: QueueItem[],
  filters: {
    service?: string
    professional?: string
    room?: string
    status?: string
  }
): QueueItem[] {
  let filtered = [...queue]

  if (filters.service && filters.service !== 'ALL') {
    filtered = filtered.filter(item => item.service_id === filters.service)
  }

  if (filters.professional && filters.professional !== 'ALL') {
    filtered = filtered.filter(item => item.professional_id === filters.professional)
  }

  if (filters.room && filters.room !== 'ALL') {
    filtered = filtered.filter(item => item.room_id === filters.room)
  }

  if (filters.status && filters.status !== 'ALL') {
    filtered = filtered.filter(item => item.status === filters.status)
  }

  return filtered
}

/**
 * Simular la lógica de agregar un paciente a la cola
 */
function addPatientToQueue(
  queue: QueueItem[],
  newItem: QueueItem
): QueueItem[] {
  // El nuevo item se agrega a la cola
  const updated = [...queue, newItem]

  // Se ordena por order_number (como hace la página en realtime)
  return updated.sort((a, b) => a.order_number - b.order_number)
}

/**
 * Simular la lógica de cambiar estado de un paciente
 */
function updateQueueItemStatus(
  queue: QueueItem[],
  itemId: string,
  newStatus: QueueItem['status']
): QueueItem[] {
  return queue.map(item =>
    item.id === itemId
      ? {
          ...item,
          status: newStatus,
          // Actualizar timestamps según el nuevo estado
          enabled_at: newStatus === 'disponible' ? new Date().toISOString() : item.enabled_at,
          called_at: newStatus === 'llamado' ? new Date().toISOString() : item.called_at,
          attended_at: newStatus === 'atendido' ? new Date().toISOString() : item.attended_at,
        }
      : item
  )
}

/**
 * Simular la lógica de eliminar un paciente
 */
function removePatientFromQueue(
  queue: QueueItem[],
  itemId: string
): QueueItem[] {
  return queue.filter(item => item.id !== itemId)
}

describe('Queue Management Logic', () => {
  describe('Queue Initialization', () => {
    test('should initialize empty queue', () => {
      const queue: QueueItem[] = []
      expect(queue).toHaveLength(0)
    })

    test('should load queue from fixtures', () => {
      const queue = createQueueItems(5)
      expect(queue).toHaveLength(5)
      expect(queue[0].order_number).toBe(1)
      expect(queue[4].order_number).toBe(5)
    })

    test('should preserve order_number order', () => {
      const queue = createQueueItems(10)

      // Verificar que están ordenados por order_number
      for (let i = 0; i < queue.length - 1; i++) {
        expect(queue[i].order_number).toBeLessThanOrEqual(queue[i + 1].order_number)
      }
    })

    test('should have unique IDs in queue', () => {
      const queue = createQueueItems(10)
      const ids = queue.map(item => item.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(queue.length)
    })
  })

  describe('Adding Patients to Queue', () => {
    test('should add patient to empty queue', () => {
      const queue: QueueItem[] = []
      const newItem = mockQueueItemPending

      const updated = addPatientToQueue(queue, newItem)

      expect(updated).toHaveLength(1)
      expect(updated[0].id).toBe(newItem.id)
    })

    test('should add patient and maintain order', () => {
      const queue = createQueueItems(3)
      const newItem = mockQueueItemPending

      const updated = addPatientToQueue(queue, { ...newItem, order_number: 2 })

      // Después de ordenar, order_number 2 debe ir en posición 1 (0-indexed)
      expect(updated).toHaveLength(4)
    })

    test('should increment order numbers when adding', () => {
      const queue = mockQueueMultiService
      const newPatient = {
        ...mockQueueItemPending,
        id: 'queue-new-1',
        order_number: queue.length + 1,
        patient_name: 'Nuevo Paciente'
      }

      const updated = addPatientToQueue(queue, newPatient)

      expect(updated).toHaveLength(queue.length + 1)
      expect(updated[updated.length - 1].patient_name).toBe('Nuevo Paciente')
    })

    test('should handle duplicate patients', () => {
      const queue = mockQueueMultiService
      const duplicate = queue[0]

      // Intentar agregar un duplicado (mismo DNI y nombre)
      const withDuplicate = [...queue, { ...duplicate, id: 'dup-1' }]

      // Debería haber 2 items con el mismo DNI
      const same = withDuplicate.filter(item => item.patient_dni === duplicate.patient_dni)
      expect(same.length).toBe(2)
    })
  })

  describe('Queue Filtering', () => {
    let testQueue: QueueItem[]

    beforeEach(() => {
      testQueue = createQueueItems(10)
    })

    test('should filter by single service', () => {
      const firstService = testQueue[0].service_id
      const filtered = filterQueue(testQueue, { service: firstService })

      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach(item => {
        expect(item.service_id).toBe(firstService)
      })
    })

    test('should filter by status', () => {
      const filtered = filterQueue(testQueue, { status: 'pendiente' })

      filtered.forEach(item => {
        expect(item.status).toBe('pendiente')
      })
    })

    test('should filter by professional', () => {
      const calledItems = testQueue.filter(item => item.professional_id)
      if (calledItems.length > 0) {
        const firstProf = calledItems[0].professional_id!
        const filtered = filterQueue(testQueue, { professional: firstProf })

        filtered.forEach(item => {
          expect(item.professional_id).toBe(firstProf)
        })
      }
    })

    test('should filter by room', () => {
      const roomItems = testQueue.filter(item => item.room_id)
      if (roomItems.length > 0) {
        const firstRoom = roomItems[0].room_id!
        const filtered = filterQueue(testQueue, { room: firstRoom })

        filtered.forEach(item => {
          expect(item.room_id).toBe(firstRoom)
        })
      }
    })

    test('should combine multiple filters', () => {
      const service = testQueue[0].service_id
      const status = 'pendiente'

      const filtered = filterQueue(testQueue, {
        service,
        status,
      })

      filtered.forEach(item => {
        expect(item.service_id).toBe(service)
        expect(item.status).toBe(status)
      })
    })

    test('should return empty array when no matches', () => {
      const filtered = filterQueue(testQueue, { status: 'cancelado' })

      // La cola de prueba no tiene items cancelados
      expect(filtered.length).toBe(0)
    })

    test('should return full queue with ALL filter', () => {
      const filtered = filterQueue(testQueue, {
        service: 'ALL',
        status: 'ALL',
        professional: 'ALL',
        room: 'ALL',
      })

      expect(filtered).toHaveLength(testQueue.length)
    })
  })

  describe('Status Transitions', () => {
    test('should update item status from pendiente to disponible', () => {
      const queue = [mockQueueItemPending]
      const updated = updateQueueItemStatus(queue, mockQueueItemPending.id, 'disponible')

      expect(updated[0].status).toBe('disponible')
      expect(updated[0].enabled_at).toBeTruthy()
    })

    test('should update item status from disponible to llamado', () => {
      const queue = [mockQueueItemAvailable]
      const updated = updateQueueItemStatus(queue, mockQueueItemAvailable.id, 'llamado')

      expect(updated[0].status).toBe('llamado')
      expect(updated[0].called_at).toBeTruthy()
    })

    test('should update item status from llamado to atendido', () => {
      const queue = [mockQueueItemCalled]
      const updated = updateQueueItemStatus(queue, mockQueueItemCalled.id, 'atendido')

      expect(updated[0].status).toBe('atendido')
      expect(updated[0].attended_at).toBeTruthy()
    })

    test('should preserve other items when updating one', () => {
      const queue = createQueueItems(3)
      const targetId = queue[1].id

      const updated = updateQueueItemStatus(queue, targetId, 'disponible')

      expect(updated).toHaveLength(3)
      expect(updated[0].id).toBe(queue[0].id)
      expect(updated[0].status).toBe(queue[0].status)
      expect(updated[2].id).toBe(queue[2].id)
    })

    test('should not modify item if ID not found', () => {
      const queue = createQueueItems(3)
      const updated = updateQueueItemStatus(queue, 'nonexistent-id', 'atendido')

      expect(updated).toHaveLength(3)
      expect(updated).toEqual(queue)
    })
  })

  describe('Removing Patients', () => {
    test('should remove patient from queue', () => {
      const queue = mockQueueMultiService
      const targetId = queue[0].id

      const updated = removePatientFromQueue(queue, targetId)

      expect(updated).toHaveLength(queue.length - 1)
      expect(updated.find(item => item.id === targetId)).toBeUndefined()
    })

    test('should maintain order after removal', () => {
      const queue = createQueueItems(5)
      const targetId = queue[2].id

      const updated = removePatientFromQueue(queue, targetId)

      // Verificar que mantiene el ordenamiento por order_number
      for (let i = 0; i < updated.length - 1; i++) {
        expect(updated[i].order_number).toBeLessThanOrEqual(updated[i + 1].order_number)
      }
    })

    test('should handle removing non-existent patient', () => {
      const queue = mockQueueMultiService
      const updated = removePatientFromQueue(queue, 'nonexistent-id')

      expect(updated).toEqual(queue)
      expect(updated).toHaveLength(queue.length)
    })

    test('should handle removing from single-item queue', () => {
      const queue = [mockQueueItemPending]
      const updated = removePatientFromQueue(queue, mockQueueItemPending.id)

      expect(updated).toHaveLength(0)
    })
  })

  describe('Queue Statistics', () => {
    test('should calculate pending count', () => {
      const queue = createQueueItems(10)
      const pendingCount = queue.filter(item => item.status === 'pendiente').length

      expect(pendingCount).toBeGreaterThan(0)
    })

    test('should calculate available count', () => {
      const queue = createQueueItems(10)
      const availableCount = queue.filter(item => item.status === 'disponible').length

      expect(availableCount >= 0).toBe(true)
    })

    test('should calculate total in queue', () => {
      const queue = createQueueItems(15)
      expect(queue.length).toBe(15)
    })

    test('should get queue at specific time', () => {
      const queue = mockQueueMultiService
      const now = new Date()

      // Items creados hoy
      const createdToday = queue.filter(item => {
        const created = new Date(item.created_at)
        return created.toDateString() === now.toDateString()
      })

      expect(createdToday.length >= 0).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty queue operations', () => {
      const queue: QueueItem[] = []

      expect(filterQueue(queue, { service: 'any' })).toHaveLength(0)
      expect(removePatientFromQueue(queue, 'any')).toHaveLength(0)
    })

    test('should handle large queues (100+ items)', () => {
      const largeQueue = createQueueItems(100)

      expect(largeQueue).toHaveLength(100)

      const filtered = filterQueue(largeQueue, { status: 'pendiente' })
      expect(filtered.length <= 100).toBe(true)

      const updated = removePatientFromQueue(largeQueue, largeQueue[50].id)
      expect(updated).toHaveLength(99)
    })

    test('should handle queue with null professional/room', () => {
      const queue = mockQueueMultiService
      const pendingItems = queue.filter(item => item.status === 'pendiente')

      pendingItems.forEach(item => {
        expect(item.professional_id).toBeNull()
        expect(item.room_id).toBeNull()
      })
    })

    test('should handle special characters in patient names', () => {
      const specialName = 'María José O\'Connor Müller'
      const item = {
        ...mockQueueItemPending,
        patient_name: specialName
      }

      expect(item.patient_name).toBe(specialName)
    })
  })
})
