import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HelpCircle } from 'lucide-react'
import { statusConfig } from '@/lib/turnos/config'

/**
 * Leyenda de estados como ícono ? con popover.
 * Se ubica inline junto a los badges de stats.
 */
export function StatusLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
          title="Ver estados"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-sm p-3" align="start">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Estados
        </p>
        <div className="flex flex-col gap-2">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <Badge className={config.color}>{config.label}</Badge>
              <span className="text-sm text-gray-600">{config.description}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
