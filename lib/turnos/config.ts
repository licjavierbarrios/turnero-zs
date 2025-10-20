import type { StatusConfig, QueueStatus } from './types'

/**
 * Configuración de estados de la cola
 */
export const statusConfig: Record<QueueStatus, StatusConfig> = {
  pendiente: {
    label: 'Pendiente',
    color: 'bg-gray-300 text-gray-800',
    description: 'Cargado, no listo para llamar'
  },
  disponible: {
    label: 'Disponible',
    color: 'bg-green-500 text-white',
    description: 'Listo para ser llamado'
  },
  llamado: {
    label: 'Llamando',
    color: 'bg-yellow-500 text-white',
    description: 'Actualmente llamando'
  },
  atendido: {
    label: 'Atendido',
    color: 'bg-blue-500 text-white',
    description: 'Ya fue atendido'
  },
  cancelado: {
    label: 'Cancelado',
    color: 'bg-red-500 text-white',
    description: 'Cancelado'
  }
}
