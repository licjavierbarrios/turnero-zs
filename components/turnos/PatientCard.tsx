import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, Clock } from 'lucide-react'
import { statusConfig } from '@/lib/turnos/config'
import { formatDate } from '@/lib/turnos/helpers'
import type { QueueItem, QueueAction } from '@/lib/turnos/types'

interface PatientCardProps {
  item: QueueItem
  isOptimistic: boolean
  callingId: string | null
  onUpdateStatus: (id: string, action: QueueAction) => void
  currentUserId?: string // ID del usuario actual para validar permisos
  createdBy?: string | null // ID del usuario que creó el turno
}

/**
 * Componente que muestra la información de un paciente en la cola.
 *
 * @param item - Datos del paciente en la cola
 * @param isOptimistic - Si es true, muestra indicador de guardado
 * @param callingId - ID del paciente que está siendo llamado actualmente
 * @param onUpdateStatus - Callback para cambiar el estado del paciente
 * @param currentUserId - ID del usuario actual para validar permisos
 * @param createdBy - ID del usuario que creó el turno
 *
 * @example
 * ```tsx
 * <PatientCard
 *   item={queueItem}
 *   isOptimistic={item.id.startsWith('temp-')}
 *   callingId={callingId}
 *   onUpdateStatus={(id, status) => updateStatus(id, status)}
 *   currentUserId={currentUser.id}
 *   createdBy={queueItem.created_by}
 * />
 * ```
 */
export function PatientCard({
  item,
  isOptimistic,
  callingId,
  onUpdateStatus,
  currentUserId,
  createdBy
}: PatientCardProps) {
  // Verificar si el usuario actual puede habilitar el turno
  // Solo puede hacerlo si:
  // 1. Es el usuario que creó el turno (createdBy === currentUserId)
  // 2. O no tenemos info de createdBy (para compatibilidad hacia atrás)
  const canEnable = !createdBy || createdBy === currentUserId
  
  // Para items temporales (optimistic), permitir siempre (no tienen createdBy aún)
  const isTemporary = item.id.startsWith('temp-')
  const canEnableButton = isTemporary || canEnable

  // Formatear hora de carga
  const createdTime = item.created_at ? formatDate(item.created_at, 'HH:mm') : '--:--'

  return (
    <Card
      className={`
        ${item.status === 'atendido' ? 'opacity-50' : ''}
        ${isOptimistic ? 'border-blue-400 border-2' : ''}
      `}
    >
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Info del paciente */}
          <div className="flex items-center gap-3 flex-1">
            <div className="text-2xl font-bold text-gray-400 w-12 text-center">
              {String(item.order_number).padStart(3, '0')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900">
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
              <div className="flex flex-wrap gap-1.5 mt-0.5 items-center">
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
                {item.queue_session_name && (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                    📋 {item.queue_session_name}
                  </Badge>
                )}
                {item.status === 'disponible' && item.call_count > 0 && (
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                    ⚠ Ya llamado {item.call_count} {item.call_count === 1 ? 'vez' : 'veces'}
                  </Badge>
                )}
                {/* Hora de carga - Discreta */}
                <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto md:ml-0">
                  <Clock className="h-3 w-3" />
                  <span>{createdTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estado y acciones */}
          <div className="flex items-center gap-2">
            {/* Estado - Sin hover */}
            <div className={`${statusConfig[item.status].color} inline-flex items-center rounded-md border border-transparent px-2 py-1 text-xs font-semibold whitespace-nowrap`}>
              {statusConfig[item.status].label}
            </div>

            {/* Botones según estado */}
            <div className="flex gap-1">
              {item.status === 'pendiente' && (
                <>
                  {canEnableButton ? (
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(item.id, 'disponible')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Habilitar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled
                      className="bg-gray-400 cursor-not-allowed opacity-60"
                      title="Solo el usuario que cargó este turno puede habilitarlo"
                    >
                      <Lock className="h-3 w-3 mr-1" />
                      Habilitar
                    </Button>
                  )}
                </>
              )}

              {item.status === 'disponible' && (
                <Button
                  size="sm"
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
                <>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs px-2 py-1">
                    🔔 {item.call_count} {item.call_count === 1 ? 'vez' : 'veces'}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => onUpdateStatus(item.id, 'rellamar')}
                    className="bg-yellow-600 hover:bg-yellow-700"
                    disabled={callingId === item.id}
                  >
                    {callingId === item.id ? (
                      <><span className="animate-pulse">🔔</span> Llamando...</>
                    ) : (
                      'Llamar de nuevo'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onUpdateStatus(item.id, 'siguiente')}
                    variant="outline"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    disabled={callingId === item.id}
                  >
                    Siguiente
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onUpdateStatus(item.id, 'atendido')}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={callingId === item.id}
                  >
                    Atendido
                  </Button>
                </>
              )}

              {(item.status === 'pendiente' || item.status === 'disponible') && (
                <Button
                  size="sm"
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
