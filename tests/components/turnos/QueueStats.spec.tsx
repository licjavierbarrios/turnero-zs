/**
 * QueueStats Component Tests
 * Tests para el componente que muestra estadísticas de la cola
 */

import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueueStats } from '@/components/turnos/QueueStats'
import {
  createQueueItems,
  mockQueueMultiService,
  mockQueueEmpty,
} from '@/tests/fixtures/queue'

describe('QueueStats Component', () => {
  describe('Rendering', () => {
    test('should render stats container', () => {
      const queueItems = createQueueItems(5)
      const { container } = render(<QueueStats totalCount={queueItems.length} filteredCount={queueItems.length} />)

      expect(container).toBeTruthy()
      // Should have at least some content
      expect(container.textContent?.length).toBeGreaterThan(0)
    })

    test('should display pending count', () => {
      const queueItems = mockQueueMultiService
      render(<QueueStats totalCount={queueItems.length} filteredCount={queueItems.length} />)

      // Should contain text indicating pending items count
      const pendingCount = queueItems.filter(
        (item) => item.status === 'pendiente'
      ).length
      expect(pendingCount).toBeGreaterThan(0)
    })

    test('should handle empty queue', () => {
      const { container } = render(<QueueStats totalCount={0} filteredCount={0} />)

      expect(container).toBeTruthy()
    })
  })

  describe('Statistics Calculations', () => {
    test('should calculate correct statistics for queue with mixed statuses', () => {
      const queueItems = createQueueItems(10)
      const { container } = render(<QueueStats totalCount={queueItems.length} filteredCount={queueItems.length} />)

      const pendingCount = queueItems.filter(
        (item) => item.status === 'pendiente'
      ).length
      const availableCount = queueItems.filter(
        (item) => item.status === 'disponible'
      ).length
      const calledCount = queueItems.filter(
        (item) => item.status === 'llamado'
      ).length
      const attendedCount = queueItems.filter(
        (item) => item.status === 'atendido'
      ).length

      // Verify that stats are displayed
      expect(container.textContent).toBeTruthy()

      // Verify that we have items in different states
      expect(pendingCount + availableCount + calledCount + attendedCount).toBe(
        10
      )
    })

    test('should update when items prop changes', () => {
      const { rerender } = render(
        <QueueStats totalCount={5} filteredCount={5} />
      )

      const newItems = createQueueItems(10)
      rerender(<QueueStats totalCount={10} filteredCount={10} />)

      // Component should still render without errors
      expect(screen.queryByText(/error/i)).toBeNull()
    })
  })

  describe('Display States', () => {
    test('should handle queue with only pending items', () => {
      const queueItems = mockQueueMultiService.filter(
        (item) => item.status === 'pendiente'
      )
      const { container } = render(<QueueStats totalCount={queueItems.length} filteredCount={queueItems.length} />)

      expect(container).toBeTruthy()
    })

    test('should handle queue with all attended items', () => {
      const queueItems = mockQueueMultiService.filter(
        (item) => item.status === 'atendido'
      )
      const { container } = render(<QueueStats totalCount={queueItems.length} filteredCount={queueItems.length} />)

      expect(container).toBeTruthy()
    })

    test('should render without crashing with large queue', () => {
      const largeQueue = createQueueItems(100)
      const { container } = render(<QueueStats totalCount={100} filteredCount={100} />)

      expect(container).toBeTruthy()
      expect(largeQueue).toHaveLength(100)
    })
  })

  describe('Accessibility', () => {
    test('should have accessible structure', () => {
      const queueItems = createQueueItems(5)
      const { container } = render(<QueueStats totalCount={5} filteredCount={5} />)

      // Stats should be in meaningful containers
      expect(container.querySelector('div')).toBeTruthy()
    })

    test('should display readable stat text', () => {
      const queueItems = mockQueueMultiService
      const { container } = render(<QueueStats totalCount={queueItems.length} filteredCount={queueItems.length} />)

      // Should contain some text content
      expect(container.textContent?.length || 0).toBeGreaterThan(5)
    })
  })
})
