import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { statusConfig } from '@/lib/turnos/config'
import type { QueueItem } from '@/lib/turnos/types'

interface PatientCardProps {
  item: QueueItem
  isOptimistic: boolean
  callingId: string | null
  onUpdateStatus: (id: string, newStatus: QueueItem['status']) => void
}

/**
 * Componente que muestra la información de un paciente en la cola.
 *
 * @param item - Datos del paciente en la cola
 * @param isOptimistic - Si es true, muestra indicador de guardado
 * @param callingId - ID del paciente que está siendo llamado actualmente
 * @param onUpdateStatus - Callback para cambiar el estado del paciente
 *
 * @example
 * ```tsx
 * <PatientCard
 *   item={queueItem}
 *   isOptimistic={item.id.startsWith('temp-')}
 *   callingId={callingId}
 *   onUpdateStatus={(id, status) => updateStatus(id, status)}
 * />
 * ```
 */
export function PatientCard({
  item,
  isOptimistic,
  callingId,
  onUpdateStatus
}: PatientCardProps) {
  return (
    <Card
      className={`
        ${item.status === 'atendido' ? 'opacity-50' : ''}
        ${isOptimistic ? 'border-blue-400 border-2' : ''}
      `}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Info del paciente */}
          <div className="flex items-center gap-6">
            <div className="text-4xl font-bold text-gray-900 w-16 text-center">
              {String(item.order_number).padStart(3, '0')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {item.patient_name}
                </h3>
                {/* Indicador visual de guardado */}
                {isOptimistic && (
                  <Badge variant="outline" className="animate-pulse border-blue-400 text-blue-600">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Guardando...
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-sm text-gray-600">
                  DNI: {item.patient_dni}
                </span>
                {item.service_name && (
                  <Badge variant="outline" className="text-xs">
                    {item.service_name}
                  </Badge>
                )}
                {item.professional_name && (
                  <Badge variant="outline" className="text-xs">
                    👨‍⚕️ {item.professional_name}
                  </Badge>
                )}
                {item.room_name && (
                  <Badge variant="outline" className="text-xs">
                    🚪 {item.room_name}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Estado y acciones */}
          <div className="flex items-center gap-4">
            <Badge className={statusConfig[item.status].color + ' text-sm px-4 py-2'}>
              {statusConfig[item.status].label}
            </Badge>

            {/* Botones según estado */}
            <div className="flex gap-2">
              {item.status === 'pendiente' && (
                <Button
                  onClick={() => onUpdateStatus(item.id, 'disponible')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Habilitar
                </Button>
              )}

              {item.status === 'disponible' && (
                <Button
                  onClick={() => onUpdateStatus(item.id, 'llamado')}
                  className="bg-yellow-600 hover:bg-yellow-700"
                  disabled={callingId === item.id}
                >
                  {callingId === item.id ? (
                    <>
                      <span className="animate-pulse">🔔</span> Llamando...
                    </>
                  ) : (
                    'Llamar'
                  )}
                </Button>
              )}

              {item.status === 'llamado' && (
                <Button
                  onClick={() => onUpdateStatus(item.id, 'atendido')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Marcar Atendido
                </Button>
              )}

              {(item.status === 'pendiente' || item.status === 'disponible') && (
                <Button
                  onClick={() => onUpdateStatus(item.id, 'cancelado')}
                  variant="outline"
                  className="text-red-600"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
