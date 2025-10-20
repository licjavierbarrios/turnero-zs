import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { statusConfig } from '@/lib/turnos/config'

/**
 * Componente que muestra la leyenda de colores de los estados de la cola.
 *
 * @example
 * ```tsx
 * <StatusLegend />
 * ```
 */
export function StatusLegend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Estados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <Badge className={config.color}>{config.label}</Badge>
              <span className="text-sm text-gray-600">{config.description}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
