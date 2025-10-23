import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PatientCard } from '@/components/turnos/PatientCard'
import { createQueueItem, mockQueueItemPending, mockQueueItemAvailable, mockQueueItemCalled } from '@/tests/fixtures/queue'

describe('PatientCard', () => {
  const mockOnUpdateStatus = vi.fn()

  describe('Rendering', () => {
    test('should render patient card with all info', () => {
      const item = mockQueueItemPending
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.getByText(item.patient_name)).toBeInTheDocument()
      expect(screen.getByText(new RegExp(item.patient_dni))).toBeInTheDocument()
    })

    test('should render order number padded with zeros', () => {
      const item = createQueueItem({ order_number: 3 })
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.getByText('003')).toBeInTheDocument()
    })

    test('should render service name when available', () => {
      const item = createQueueItem({ service_name: 'Cardiología' })
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.getByText('Cardiología')).toBeInTheDocument()
    })

    test('should render professional name when available', () => {
      const item = createQueueItem({ professional_name: 'Dr. Juan García' })
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.getByText(/Dr\. Juan García/)).toBeInTheDocument()
    })

    test('should render room name when available', () => {
      const item = createQueueItem({ room_name: 'Consultorio A' })
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.getByText(/Consultorio A/)).toBeInTheDocument()
    })
  })

  describe('Optimistic Updates', () => {
    test('should show saving indicator when optimistic', () => {
      const item = mockQueueItemPending
      render(
        <PatientCard
          item={item}
          isOptimistic={true}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.getByText('Guardando...')).toBeInTheDocument()
    })

    test('should not show saving indicator when not optimistic', () => {
      const item = mockQueueItemPending
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.queryByText('Guardando...')).not.toBeInTheDocument()
    })

    test('should have blue border when optimistic', () => {
      const item = mockQueueItemPending
      const { container } = render(
        <PatientCard
          item={item}
          isOptimistic={true}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      const card = container.querySelector('.border-blue-400')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Status Buttons - Pendiente State', () => {
    test('should show "Habilitar" button for pending status', () => {
      const item = mockQueueItemPending
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.getByText('Habilitar')).toBeInTheDocument()
    })

    test('should show "Cancelar" button for pending status', () => {
      const item = mockQueueItemPending
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    test('should call onUpdateStatus with "disponible" when clicking Habilitar', async () => {
      const user = userEvent.setup()
      const item = mockQueueItemPending
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      const button = screen.getByText('Habilitar')
      await user.click(button)

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(item.id, 'disponible')
    })
  })

  describe('Status Buttons - Disponible State', () => {
    test('should show "Llamar" button for available status', () => {
      const item = mockQueueItemAvailable
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.getByText('Llamar')).toBeInTheDocument()
    })

    test('should call onUpdateStatus with "llamado" when clicking Llamar', async () => {
      const user = userEvent.setup()
      const item = mockQueueItemAvailable
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      const button = screen.getByText('Llamar')
      await user.click(button)

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(item.id, 'llamado')
    })

    test('should disable Llamar button when calling this patient', () => {
      const item = mockQueueItemAvailable
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={item.id}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      const button = screen.getByText(/Llamando/) as HTMLButtonElement
      expect(button.disabled).toBe(true)
    })

    test('should show Llamando indicator when calling this patient', () => {
      const item = mockQueueItemAvailable
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={item.id}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.getByText(/Llamando/)).toBeInTheDocument()
    })
  })

  describe('Status Buttons - Llamado State', () => {
    test('should show "Marcar Atendido" button for called status', () => {
      const item = mockQueueItemCalled
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      expect(screen.getByText('Marcar Atendido')).toBeInTheDocument()
    })

    test('should call onUpdateStatus with "atendido" when clicking Marcar Atendido', async () => {
      const user = userEvent.setup()
      const item = mockQueueItemCalled
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      const button = screen.getByText('Marcar Atendido')
      await user.click(button)

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(item.id, 'atendido')
    })
  })

  describe('Visual States', () => {
    test('should show opacity-50 for attended patients', () => {
      const item = createQueueItem({ status: 'atendido' })
      const { container } = render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      const card = container.querySelector('.opacity-50')
      expect(card).toBeInTheDocument()
    })

    test('should not show opacity-50 for pending patients', () => {
      const item = mockQueueItemPending
      const { container } = render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      const card = container.querySelector('.opacity-50')
      expect(card).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have semantic HTML structure', () => {
      const item = mockQueueItemPending
      const { container } = render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      // Check for proper heading
      expect(screen.getByText(item.patient_name).tagName).toBe('H3')
    })

    test('buttons should be accessible with keyboard', async () => {
      const user = userEvent.setup()
      const item = mockQueueItemPending
      render(
        <PatientCard
          item={item}
          isOptimistic={false}
          callingId={null}
          onUpdateStatus={mockOnUpdateStatus}
        />
      )

      const button = screen.getByText('Habilitar')
      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockOnUpdateStatus).toHaveBeenCalled()
    })
  })
})
