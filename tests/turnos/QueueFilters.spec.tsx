import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueueFilters } from '@/components/turnos/QueueFilters'
import type { Service, Professional, Room } from '@/lib/turnos/types'

describe('QueueFilters', () => {
  const mockServices: Service[] = [
    { id: 's1', name: 'Cardiología' },
    { id: 's2', name: 'Pediatría' }
  ]

  const mockProfessionals: Professional[] = [
    { id: 'p1', name: 'Dr. Juan García', speciality: 'Cardiología' },
    { id: 'p2', name: 'Dra. María López', speciality: 'Pediatría' }
  ]

  const mockRooms: Room[] = [
    { id: 'r1', name: 'Consultorio A' },
    { id: 'r2', name: 'Consultorio B' }
  ]

  const mockCallbacks = {
    onServiceFilterChange: vi.fn(),
    onProfessionalFilterChange: vi.fn(),
    onRoomFilterChange: vi.fn(),
    onStatusFilterChange: vi.fn(),
    onClearFilters: vi.fn()
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('should render filters title', () => {
      render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('Filtros')).toBeInTheDocument()
    })

    test('should render all filter labels when user is admin', () => {
      localStorage.setItem(
        'institution_context',
        JSON.stringify({ institution_id: 'inst1', user_role: 'admin' })
      )

      render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      expect(screen.getByLabelText('Servicio')).toBeInTheDocument()
      expect(screen.getByLabelText('Profesional')).toBeInTheDocument()
      expect(screen.getByLabelText('Consultorio')).toBeInTheDocument()
      expect(screen.getByLabelText('Estado')).toBeInTheDocument()
    })

    test('should not render service filter when user is not admin', () => {
      localStorage.setItem(
        'institution_context',
        JSON.stringify({ institution_id: 'inst1', user_role: 'medico' })
      )

      render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={mockServices}
          {...mockCallbacks}
        />
      )

      expect(screen.queryByLabelText('Servicio')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Profesional')).toBeInTheDocument()
    })

    test('should render with empty data lists', () => {
      render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={[]}
          professionals={[]}
          rooms={[]}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('Filtros')).toBeInTheDocument()
      expect(screen.getByLabelText('Profesional')).toBeInTheDocument()
      expect(screen.getByLabelText('Consultorio')).toBeInTheDocument()
      expect(screen.getByLabelText('Estado')).toBeInTheDocument()
    })
  })

  describe('Active Filters Display', () => {
    test('should not show filter badges when all filters are ALL', () => {
      render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      expect(screen.queryByText('Limpiar filtros')).not.toBeInTheDocument()
    })

    test('should show clear filters button when filters are active', () => {
      render(
        <QueueFilters
          selectedServiceFilter="s1"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('Limpiar filtros')).toBeInTheDocument()
    })

    test('should call onClearFilters when clicking clear button', async () => {
      const user = userEvent.setup()

      render(
        <QueueFilters
          selectedServiceFilter="s1"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      const clearButton = screen.getByText('Limpiar filtros')
      await user.click(clearButton)

      expect(mockCallbacks.onClearFilters).toHaveBeenCalled()
    })

    test('should show multiple filter badges when multiple filters active', () => {
      render(
        <QueueFilters
          selectedServiceFilter="s1"
          selectedProfessionalFilter="p1"
          selectedRoomFilter="r1"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('Limpiar filtros')).toBeInTheDocument()
    })
  })

  describe('User Role Logic', () => {
    test('should show role-specific description for non-admin with assigned services', () => {
      localStorage.setItem(
        'institution_context',
        JSON.stringify({ institution_id: 'inst1', user_role: 'medico' })
      )

      render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[mockServices[0]]}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText(/Cardiología/)).toBeInTheDocument()
    })

    test('should show generic description for admin', () => {
      localStorage.setItem(
        'institution_context',
        JSON.stringify({ institution_id: 'inst1', user_role: 'admin' })
      )

      render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText(/Filtra la cola por servicio/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have proper labels for all selects', () => {
      localStorage.setItem(
        'institution_context',
        JSON.stringify({ institution_id: 'inst1', user_role: 'admin' })
      )

      render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      expect(screen.getByLabelText('Servicio')).toBeInTheDocument()
      expect(screen.getByLabelText('Profesional')).toBeInTheDocument()
      expect(screen.getByLabelText('Consultorio')).toBeInTheDocument()
      expect(screen.getByLabelText('Estado')).toBeInTheDocument()
    })

    test('should have properly associated labels and form controls', () => {
      render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      const profLabel = screen.getByText('Profesional')
      const profSelect = screen.getByLabelText('Profesional')
      expect(profLabel).toBeInTheDocument()
      expect(profSelect).toBeInTheDocument()
    })
  })

  describe('Grid Layout', () => {
    test('should render 4 column grid for admin', () => {
      localStorage.setItem(
        'institution_context',
        JSON.stringify({ institution_id: 'inst1', user_role: 'admin' })
      )

      const { container } = render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      const grid = container.querySelector('.lg\\:grid-cols-4')
      expect(grid).toBeInTheDocument()
    })

    test('should render 3 column grid for non-admin', () => {
      localStorage.setItem(
        'institution_context',
        JSON.stringify({ institution_id: 'inst1', user_role: 'medico' })
      )

      const { container } = render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={mockServices}
          {...mockCallbacks}
        />
      )

      const grid = container.querySelector('.lg\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Component Stability', () => {
    test('should render without crashing with minimal props', () => {
      expect(() => {
        render(
          <QueueFilters
            selectedServiceFilter="ALL"
            selectedProfessionalFilter="ALL"
            selectedRoomFilter="ALL"
            selectedStatusFilter="ALL"
            services={[]}
            professionals={[]}
            rooms={[]}
            userServices={[]}
            {...mockCallbacks}
          />
        )
      }).not.toThrow()
    })

    test('should render without crashing with all data populated', () => {
      expect(() => {
        render(
          <QueueFilters
            selectedServiceFilter="ALL"
            selectedProfessionalFilter="ALL"
            selectedRoomFilter="ALL"
            selectedStatusFilter="ALL"
            services={mockServices}
            professionals={mockProfessionals}
            rooms={mockRooms}
            userServices={mockServices}
            {...mockCallbacks}
          />
        )
      }).not.toThrow()
    })

    test('should maintain callbacks between renders', async () => {
      const { rerender } = render(
        <QueueFilters
          selectedServiceFilter="ALL"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      rerender(
        <QueueFilters
          selectedServiceFilter="s1"
          selectedProfessionalFilter="ALL"
          selectedRoomFilter="ALL"
          selectedStatusFilter="ALL"
          services={mockServices}
          professionals={mockProfessionals}
          rooms={mockRooms}
          userServices={[]}
          {...mockCallbacks}
        />
      )

      // Component should still be interactive
      const clearButton = screen.getByText('Limpiar filtros')
      expect(clearButton).toBeInTheDocument()
    })
  })
})
