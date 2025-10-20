import { Badge } from '@/components/ui/badge'

interface QueueStatsProps {
  totalCount: number
  filteredCount: number
}

/**
 * Componente que muestra estadísticas de la cola.
 *
 * @param totalCount - Total de pacientes en la cola
 * @param filteredCount - Cantidad de pacientes mostrados (después de filtros)
 *
 * @example
 * ```tsx
 * <QueueStats
 *   totalCount={25}
 *   filteredCount={10}
 * />
 * ```
 */
export function QueueStats({ totalCount, filteredCount }: QueueStatsProps) {
  const hiddenCount = totalCount - filteredCount

  return (
    <div className="flex gap-4 mt-3">
      <Badge variant="outline" className="text-sm px-3 py-1">
        Total: {totalCount}
      </Badge>
      <Badge variant="outline" className="text-sm px-3 py-1">
        Mostrando: {filteredCount}
      </Badge>
      {hiddenCount > 0 && (
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {hiddenCount} ocultos por filtros
        </Badge>
      )}
    </div>
  )
}
