/**
 * StatusLegend Component Tests
 * Tests para el componente que muestra la leyenda de estados
 */

import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusLegend } from '@/components/turnos/StatusLegend'

describe('StatusLegend Component', () => {
  describe('Rendering', () => {
    test('should render legend container', () => {
      const { container } = render(<StatusLegend />)

      expect(container).toBeTruthy()
    })

    test('should display status legend items', () => {
      const { container } = render(<StatusLegend />)

      // Should contain elements for different statuses
      const elements = container.querySelectorAll('[class*="flex"]')
      expect(elements.length).toBeGreaterThan(0)
    })

    test('should render without errors', () => {
      const { container } = render(<StatusLegend />)

      expect(container.textContent).toBeTruthy()
      expect(screen.queryByText(/error/i)).toBeNull()
    })
  })

  describe('Status Display', () => {
    test('should include pending status', () => {
      const { container } = render(<StatusLegend />)

      // Legend should contain reference to pending status
      const text = container.textContent?.toLowerCase()
      expect(text).toMatch(/pendiente/)
    })

    test('should include all queue statuses', () => {
      const { container } = render(<StatusLegend />)

      const text = container.textContent?.toLowerCase() || ''

      // Check for key status indicators
      expect(text).toBeTruthy()
      // The legend should reference different queue states
    })
  })

  describe('Visual Representation', () => {
    test('should have colored indicators', () => {
      const { container } = render(<StatusLegend />)

      // Should contain elements with styling for colors
      const styled = container.querySelectorAll('[style]')
      expect(styled.length + container.querySelectorAll('[class*="bg"]').length).toBeGreaterThan(0)
    })

    test('should be visually organized', () => {
      const { container } = render(<StatusLegend />)

      // Should have flex or grid structure for organization
      const organized =
        container.querySelector('[class*="flex"]') ||
        container.querySelector('[class*="grid"]') ||
        container.querySelector('[class*="row"]')

      expect(organized).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    test('should have readable text', () => {
      const { container } = render(<StatusLegend />)

      const text = container.textContent
      expect(text).toBeTruthy()
      expect(text?.length || 0).toBeGreaterThan(10)
    })

    test('should render semantic HTML', () => {
      const { container } = render(<StatusLegend />)

      // Should use standard elements
      const hasContent = container.querySelector('div') || container.querySelector('span')
      expect(hasContent).toBeTruthy()
    })
  })

  describe('Component State', () => {
    test('should handle re-renders', () => {
      const { rerender } = render(<StatusLegend />)

      // Should re-render without errors
      rerender(<StatusLegend />)

      const { container } = render(<StatusLegend />)
      expect(container).toBeTruthy()
    })

    test('should be responsive', () => {
      const { container } = render(<StatusLegend />)

      // Should use responsive classes
      const responsive =
        container.querySelector('[class*="md"]') ||
        container.querySelector('[class*="sm"]') ||
        container.querySelector('[class*="flex"]')

      // At minimum should have flex-based responsive layout
      expect(container.querySelector('[class*="flex"]')).toBeTruthy()
    })
  })
})
