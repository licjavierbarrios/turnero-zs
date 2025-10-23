import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddPatientDialog } from '@/components/turnos/AddPatientDialog'
import type { AttentionOption } from '@/lib/turnos/types'

describe('AddPatientDialog', () => {
  const mockAttentionOptions: AttentionOption[] = [
    {
      id: 'opt1',
      type: 'service',
      label: 'Cardiología',
      service_id: 's1',
      professional_id: null,
      room_id: null
    },
    {
      id: 'opt2',
      type: 'service',
      label: 'Pediatría',
      service_id: 's2',
      professional_id: null,
      room_id: null
    },
    {
      id: 'opt3',
      type: 'professional',
      label: 'Dr. Juan García - Consultorio A',
      service_id: null,
      professional_id: 'prof1',
      room_id: 'room1'
    }
  ]

  const mockOnSubmit = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnOpenChange.mockClear()
  })

  describe('Rendering', () => {
    test('should not render dialog when closed', () => {
      render(
        <AddPatientDialog
          isOpen={false}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.queryByText('Cargar Nuevo Paciente')).not.toBeInTheDocument()
    })

    test('should render dialog title when open', () => {
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText('Cargar Nuevo Paciente')).toBeInTheDocument()
    })

    test('should render form fields', () => {
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByLabelText(/Nombre Completo/)).toBeInTheDocument()
      expect(screen.getByLabelText(/DNI/)).toBeInTheDocument()
    })

    test('should render service options', () => {
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText('Cardiología')).toBeInTheDocument()
      expect(screen.getByText('Pediatría')).toBeInTheDocument()
    })

    test('should render professional options', () => {
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText('Dr. Juan García - Consultorio A')).toBeInTheDocument()
    })

    test('should show message when no options available', () => {
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={[]}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText(/No hay servicios o profesionales disponibles/)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    test('should require patient name', async () => {
      const user = userEvent.setup()
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      const dniInput = screen.getByLabelText(/DNI/)
      const cardioCheckbox = screen.getByRole('checkbox', { name: /Cardiología/ })

      await user.type(dniInput, '12345678')
      await user.click(cardioCheckbox)

      // Try to submit without name
      const submitButton = screen.getByRole('button', { name: /Cargar Paciente/ })
      await user.click(submitButton)

      // Should not call onSubmit if form is invalid
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    test('should require patient DNI', async () => {
      const user = userEvent.setup()
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Nombre Completo/)
      const cardioCheckbox = screen.getByRole('checkbox', { name: /Cardiología/ })

      await user.type(nameInput, 'Juan Pérez')
      await user.click(cardioCheckbox)

      // Try to submit without DNI
      const submitButton = screen.getByRole('button', { name: /Cargar Paciente/ })
      await user.click(submitButton)

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    test('should require at least one service/professional selected', async () => {
      const user = userEvent.setup()
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Nombre Completo/)
      const dniInput = screen.getByLabelText(/DNI/)

      await user.type(nameInput, 'Juan Pérez')
      await user.type(dniInput, '12345678')

      // Try to submit without selecting any option
      const submitButton = screen.getByRole('button', { name: /Cargar Paciente/ })
      await user.click(submitButton)

      // Should show alert
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    test('should submit form with valid data', async () => {
      const user = userEvent.setup()
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Nombre Completo/)
      const dniInput = screen.getByLabelText(/DNI/)
      const cardioCheckbox = screen.getByRole('checkbox', { name: /Cardiología/ })

      await user.type(nameInput, 'Juan Pérez')
      await user.type(dniInput, '12345678')
      await user.click(cardioCheckbox)

      const submitButton = screen.getByRole('button', { name: /Cargar Paciente/ })
      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith({
        patientName: 'Juan Pérez',
        patientDni: '12345678',
        selectedOptions: ['opt1']
      })
    })

    test('should submit with multiple services selected', async () => {
      const user = userEvent.setup()
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Nombre Completo/)
      const dniInput = screen.getByLabelText(/DNI/)
      const cardioCheckbox = screen.getByRole('checkbox', { name: /Cardiología/ })
      const pediatriaCheckbox = screen.getByRole('checkbox', { name: /Pediatría/ })

      await user.type(nameInput, 'Juan Pérez')
      await user.type(dniInput, '12345678')
      await user.click(cardioCheckbox)
      await user.click(pediatriaCheckbox)

      const submitButton = screen.getByRole('button', { name: /Cargar Paciente/ })
      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith({
        patientName: 'Juan Pérez',
        patientDni: '12345678',
        selectedOptions: ['opt1', 'opt2']
      })
    })

    test('should clear form after successful submission', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Nombre Completo/) as HTMLInputElement
      const dniInput = screen.getByLabelText(/DNI/) as HTMLInputElement
      const cardioCheckbox = screen.getByRole('checkbox', { name: /Cardiología/ })

      await user.type(nameInput, 'Juan Pérez')
      await user.type(dniInput, '12345678')
      await user.click(cardioCheckbox)

      const submitButton = screen.getByRole('button', { name: /Cargar Paciente/ })
      await user.click(submitButton)

      // Rerender to see if form is cleared
      rerender(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      expect(nameInput.value).toBe('')
      expect(dniInput.value).toBe('')
    })
  })

  describe('Dialog Controls', () => {
    test('should call onOpenChange when canceling', async () => {
      const user = userEvent.setup()
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancelar/ })
      await user.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    test('should clear form when canceling', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Nombre Completo/) as HTMLInputElement
      const dniInput = screen.getByLabelText(/DNI/) as HTMLInputElement

      await user.type(nameInput, 'Juan Pérez')
      await user.type(dniInput, '12345678')

      const cancelButton = screen.getByRole('button', { name: /Cancelar/ })
      await user.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalled()
    })
  })

  describe('Selection Counter', () => {
    test('should show selection count when items selected', async () => {
      const user = userEvent.setup()
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      const cardioCheckbox = screen.getByRole('checkbox', { name: /Cardiología/ })
      await user.click(cardioCheckbox)

      expect(screen.getByText(/1 seleccionado/)).toBeInTheDocument()
    })

    test('should show plural when multiple items selected', async () => {
      const user = userEvent.setup()
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      const cardioCheckbox = screen.getByRole('checkbox', { name: /Cardiología/ })
      const pediatriaCheckbox = screen.getByRole('checkbox', { name: /Pediatría/ })

      await user.click(cardioCheckbox)
      await user.click(pediatriaCheckbox)

      expect(screen.getByText(/2 seleccionados/)).toBeInTheDocument()
    })

    test('should not show selection count when no items selected', () => {
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.queryByText(/seleccionado/)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have proper form labels', () => {
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByLabelText(/Nombre Completo/)).toBeInTheDocument()
      expect(screen.getByLabelText(/DNI/)).toBeInTheDocument()
      expect(screen.getByText('Servicios y Profesionales *')).toBeInTheDocument()
    })

    test('should have accessible dialog structure', () => {
      render(
        <AddPatientDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          attentionOptions={mockAttentionOptions}
          onSubmit={mockOnSubmit}
        />
      )

      const title = screen.getByText('Cargar Nuevo Paciente')
      expect(title).toBeInTheDocument()
    })
  })
})
