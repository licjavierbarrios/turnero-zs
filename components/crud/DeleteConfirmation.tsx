'use client'

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, AlertTriangle } from 'lucide-react'

/**
 * Props para el componente DeleteConfirmation
 */
export interface DeleteConfirmationProps {
  /**
   * Controla si el dialog está abierto
   */
  isOpen: boolean

  /**
   * Callback ejecutado cuando el dialog debe cerrarse
   */
  onOpenChange: (open: boolean) => void

  /**
   * Nombre del item a eliminar (se muestra en el mensaje)
   */
  itemName: string

  /**
   * Callback ejecutado cuando se confirma la eliminación
   */
  onConfirm: () => void | Promise<void>

  /**
   * Indica si la eliminación está en progreso
   */
  isDeleting?: boolean

  /**
   * Título personalizado del dialog (por defecto: "¿Está seguro?")
   */
  title?: string

  /**
   * Mensaje de advertencia adicional
   */
  warningMessage?: string

  /**
   * Texto del botón de confirmar (por defecto: "Eliminar")
   */
  confirmText?: string

  /**
   * Texto del botón de cancelar (por defecto: "Cancelar")
   */
  cancelText?: string

  /**
   * Tipo de acción (afecta el color del botón)
   * @default 'danger'
   */
  variant?: 'danger' | 'warning'
}

/**
 * Componente genérico de confirmación para operaciones de eliminación.
 *
 * Proporciona un AlertDialog consistente con:
 * - Mensaje claro de confirmación
 * - Advertencia visual con icono
 * - Botones de acción (Cancelar, Eliminar)
 * - Loading state durante la eliminación
 * - Customización del mensaje y textos
 *
 * @example
 * ```tsx
 * <DeleteConfirmation
 *   isOpen={isDeleteDialogOpen}
 *   onOpenChange={setIsDeleteDialogOpen}
 *   itemName={patientToDelete?.patient_name || ''}
 *   onConfirm={handleConfirmDelete}
 *   isDeleting={isDeleting}
 *   warningMessage="Esta acción eliminará todos los turnos asociados al paciente."
 * />
 * ```
 */
export function DeleteConfirmation({
  isOpen,
  onOpenChange,
  itemName,
  onConfirm,
  isDeleting = false,
  title = '¿Está seguro?',
  warningMessage,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: DeleteConfirmationProps) {

  // Handler de confirmación
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className={`rounded-full p-2 ${
              variant === 'danger'
                ? 'bg-red-100 dark:bg-red-900/20'
                : 'bg-yellow-100 dark:bg-yellow-900/20'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                variant === 'danger'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`} />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Esta acción no se puede deshacer. Se eliminará permanentemente:{' '}
              <span className="font-semibold text-foreground">{itemName}</span>
            </p>
            {warningMessage && (
              <p className={`text-sm font-medium ${
                variant === 'danger'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                ⚠️ {warningMessage}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className={
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:bg-red-900 dark:hover:bg-red-800'
                : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600'
            }
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
