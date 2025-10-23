import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AttentionOption } from '@/lib/turnos/types'

interface AddPatientDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  attentionOptions: AttentionOption[]
  onSubmit: (data: {
    patientName: string
    patientDni: string
    selectedOptions: string[]
    initialStatus: 'pendiente' | 'disponible'
  }) => Promise<void>
}

/**
 * Componente de diálogo para cargar un nuevo paciente a la cola.
 *
 * @param isOpen - Controla si el diálogo está abierto
 * @param onOpenChange - Callback cuando cambia el estado de apertura
 * @param attentionOptions - Lista de servicios y profesionales disponibles
 * @param onSubmit - Callback cuando se envía el formulario
 *
 * @example
 * ```tsx
 * <AddPatientDialog
 *   isOpen={isDialogOpen}
 *   onOpenChange={setIsDialogOpen}
 *   attentionOptions={attentionOptions}
 *   onSubmit={async (data) => {
 *     await handleAddPatient(data)
 *   }}
 * />
 * ```
 */
export function AddPatientDialog({
  isOpen,
  onOpenChange,
  attentionOptions,
  onSubmit
}: AddPatientDialogProps) {
  const [patientName, setPatientName] = useState('')
  const [patientDni, setPatientDni] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isHabilitado, setIsHabilitado] = useState(false) // false = pendiente, true = disponible

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedOptions.length === 0) {
      alert('Por favor selecciona al menos un servicio o profesional')
      return
    }

    await onSubmit({
      patientName,
      patientDni,
      selectedOptions,
      initialStatus: isHabilitado ? 'disponible' : 'pendiente'
    })

    // Limpiar formulario
    setPatientName('')
    setPatientDni('')
    setSelectedOptions([])
    setIsHabilitado(false)
  }

  const handleCancel = () => {
    // Limpiar formulario al cancelar
    setPatientName('')
    setPatientDni('')
    setSelectedOptions([])
    setIsHabilitado(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Cargar Nuevo Paciente</DialogTitle>
          <DialogDescription>
            Copie los datos del paciente desde el HSI
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-4">
          <div className="space-y-2">
            <Label htmlFor="patient_name">Nombre Completo *</Label>
            <Input
              id="patient_name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient_dni">DNI *</Label>
            <Input
              id="patient_dni"
              value={patientDni}
              onChange={(e) => setPatientDni(e.target.value)}
              placeholder="Ej: 12345678"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Servicios y Profesionales *</Label>
            <p className="text-sm text-muted-foreground">
              Selecciona todos los servicios/profesionales que el paciente necesita
            </p>
            <div className="border rounded-md p-4 max-h-80 overflow-y-auto space-y-3">
              {attentionOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay servicios o profesionales disponibles
                </p>
              ) : (
                <>
                  {/* Servicios */}
                  {attentionOptions.filter(o => o.type === 'service').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700">Servicios</h4>
                      {attentionOptions
                        .filter(o => o.type === 'service')
                        .map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={option.id}
                              checked={selectedOptions.includes(option.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedOptions([...selectedOptions, option.id])
                                } else {
                                  setSelectedOptions(selectedOptions.filter(id => id !== option.id))
                                }
                              }}
                            />
                            <label
                              htmlFor={option.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Profesionales */}
                  {attentionOptions.filter(o => o.type === 'professional').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700">Profesionales Asignados Hoy</h4>
                      {attentionOptions
                        .filter(o => o.type === 'professional')
                        .map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={option.id}
                              checked={selectedOptions.includes(option.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedOptions([...selectedOptions, option.id])
                                } else {
                                  setSelectedOptions(selectedOptions.filter(id => id !== option.id))
                                }
                              }}
                            />
                            <label
                              htmlFor={option.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {selectedOptions.length > 0 && (
              <p className="text-sm text-blue-600 font-medium">
                {selectedOptions.length} seleccionado{selectedOptions.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Toggle para estado inicial del paciente */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Estado Inicial del Paciente</Label>
                <p className="text-sm text-muted-foreground">
                  {isHabilitado
                    ? 'El paciente se cargará como "Disponible" (habilitado) para atención inmediata'
                    : 'El paciente se cargará como "Pendiente" (requiere habilitación posterior)'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${isHabilitado ? 'text-green-600' : 'text-amber-600'}`}>
                  {isHabilitado ? '✓ Disponible' : '⟳ Pendiente'}
                </span>
                <Switch
                  checked={isHabilitado}
                  onCheckedChange={setIsHabilitado}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer fijo con botones */}
        <div className="flex justify-end gap-2 border-t pt-4 mt-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={() => {
            // Trigger submit del formulario
            const form = document.querySelector('form') as HTMLFormElement
            form?.requestSubmit()
          }}>
            Cargar Paciente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
