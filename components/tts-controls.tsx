'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Volume2, VolumeX, Settings } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface TTSControlsProps {
  enabled: boolean
  volume: number
  rate: number
  onEnabledChange: (enabled: boolean) => void
  onVolumeChange: (volume: number) => void
  onRateChange: (rate: number) => void
  onTest?: () => void
}

/**
 * Controles para configurar el Text-to-Speech
 * Permite habilitar/deshabilitar, ajustar volumen y velocidad
 */
export function TTSControls({
  enabled,
  volume,
  rate,
  onEnabledChange,
  onVolumeChange,
  onRateChange,
  onTest
}: TTSControlsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg bg-white hover:bg-gray-50"
        >
          {enabled ? (
            <Volume2 className="h-6 w-6 text-blue-600" />
          ) : (
            <VolumeX className="h-6 w-6 text-gray-400" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Voz
            </CardTitle>
            <CardDescription>
              Ajusta el anuncio por voz de los llamados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <Label htmlFor="tts-enabled" className="text-sm font-medium">
                Anuncio por Voz
              </Label>
              <Switch
                id="tts-enabled"
                checked={enabled}
                onCheckedChange={onEnabledChange}
              />
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tts-volume" className="text-sm font-medium">
                  Volumen
                </Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <Slider
                id="tts-volume"
                min={0}
                max={1}
                step={0.1}
                value={[volume]}
                onValueChange={([value]: number[]) => onVolumeChange(value)}
                disabled={!enabled}
                className="w-full"
              />
            </div>

            {/* Rate Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tts-rate" className="text-sm font-medium">
                  Velocidad
                </Label>
                <span className="text-sm text-muted-foreground">
                  {rate.toFixed(1)}x
                </span>
              </div>
              <Slider
                id="tts-rate"
                min={0.5}
                max={1.5}
                step={0.1}
                value={[rate]}
                onValueChange={([value]: number[]) => onRateChange(value)}
                disabled={!enabled}
                className="w-full"
              />
            </div>

            {/* Test Button */}
            {onTest && (
              <Button
                onClick={onTest}
                disabled={!enabled}
                variant="secondary"
                className="w-full"
              >
                Probar Voz
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              Los anuncios de voz utilizan la síntesis de voz del navegador.
              La calidad puede variar según el dispositivo.
            </p>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
