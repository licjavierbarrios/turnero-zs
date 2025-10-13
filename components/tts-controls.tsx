'use client'

import { Button } from '@/components/ui/button'
import { Volume2 } from 'lucide-react'

interface TTSControlsProps {
  onTest?: () => void
}

/**
 * Botón simple para probar el audio TTS
 * La configuración real se hace desde el dashboard
 */
export function TTSControls({ onTest }: TTSControlsProps) {
  if (!onTest) return null

  return (
    <Button
      onClick={onTest}
      variant="outline"
      size="lg"
      className="fixed bottom-4 right-4 h-14 px-6 rounded-full shadow-lg bg-white hover:bg-gray-50"
    >
      <Volume2 className="h-5 w-5 mr-2 text-blue-600" />
      <span className="font-medium">Probar Audio</span>
    </Button>
  )
}
