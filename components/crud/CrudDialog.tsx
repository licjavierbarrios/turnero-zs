'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

/**
 * Props para el componente CrudDialog
 */
export interface CrudDialogProps<T = any> {
  /**
   * Controla si el dialog está abierto
   */
  isOpen: boolean

  /**
   * Callback ejecutado cuando el dialog debe cerrarse
   */
  onOpenChange: (open: boolean) => void

  /**
   * Título del dialog
   */
  title: string

  /**
   * Descripción opcional del dialog
   */
  description?: string

  /**
   * Item siendo editado (null para crear nuevo)
   */
  editingItem: T | null

  /**
   * Callback ejecutado cuando se confirma el formulario
   */
  onSubmit: () => void | Promise<void>

  /**
   * Indica si el formulario está guardando
   */
  isSaving?: boolean

  /**
   * Texto del botón de confirmar (por defecto: "Guardar" o "Crear")
   */
  submitText?: string

  /**
   * Texto del botón de cancelar (por defecto: "Cancelar")
   */
  cancelText?: string

  /**
   * Indica si el botón de submit está deshabilitado
   */
  submitDisabled?: boolean

  /**
   * Tamaño del dialog
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'

  /**
   * Contenido del formulario (render prop)
   */
  children: React.ReactNode

  /**
   * Callback ejecutado cuando se cancela (opcional, por defecto cierra el dialog)
   */
  onCancel?: () => void
}

/**
 * Componente genérico de Dialog para operaciones CRUD.
 *
 * Proporciona una estructura consistente para dialogs de creación/edición con:
 * - Header con título y descripción
 * - Contenido personalizable mediante children
 * - Footer con botones de acción (Cancelar, Guardar)
 * - Loading state durante el guardado
 * - Cierre automático en cancelación
 *
 * @example
 * ```tsx
 * <CrudDialog
 *   isOpen={isDialogOpen}
 *   onOpenChange={setIsDialogOpen}
 *   title={editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
 *   description="Complete los datos del paciente"
 *   editingItem={editingPatient}
 *   onSubmit={handleSubmit}
 *   isSaving={isSaving}
 *   size="lg"
 * >
 *   <div className="space-y-4">
 *     <Input
 *       label="Nombre"
 *       value={formData.patient_name}
 *       onChange={(e) => updateFormField('patient_name', e.target.value)}
 *     />
 *     <Input
 *       label="DNI"
 *       value={formData.dni}
 *       onChange={(e) => updateFormField('dni', e.target.value)}
 *     />
 *   </div>
 * </CrudDialog>
 * ```
 */
export function CrudDialog<T = any>({
  isOpen,
  onOpenChange,
  title,
  description,
  editingItem,
  onSubmit,
  isSaving = false,
  submitText,
  cancelText = 'Cancelar',
  submitDisabled = false,
  size = 'md',
  children,
  onCancel
}: CrudDialogProps<T>) {

  // Texto del botón de submit por defecto
  const defaultSubmitText = editingItem ? 'Guardar cambios' : 'Crear'
  const finalSubmitText = submitText || defaultSubmitText

  // Handler de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit()
  }

  // Handler de cancelación
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  // Clases de tamaño
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClasses[size]}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          <div className="py-4">
            {children}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              disabled={submitDisabled || isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {finalSubmitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
