'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Volume2, Save, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { initAudioContext, playNotificationSound } from '@/lib/audio-utils'

interface TTSConfig {
  tts_enabled: boolean
  tts_volume: number
  tts_rate: number
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<TTSConfig>({
    tts_enabled: true,
    tts_volume: 0.8,
    tts_rate: 0.9
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [institutionId, setInstitutionId] = useState<string>('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const contextData = localStorage.getItem('institution_context')
      if (!contextData) {
        setMessage({ type: 'error', text: 'No hay contexto institucional' })
        return
      }
      const context = JSON.parse(contextData)
      setInstitutionId(context.institution_id)

      const { data, error } = await supabase
        .from('institution')
        .select('tts_enabled, tts_volume, tts_rate')
        .eq('id', context.institution_id)
        .single()

      if (error) throw error

      if (data) {
        setConfig({
          tts_enabled: data.tts_enabled ?? true,
          tts_volume: data.tts_volume ?? 0.8,
          tts_rate: data.tts_rate ?? 0.9
        })
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
      setMessage({ type: 'error', text: 'Error al cargar la configuración' })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const { error } = await supabase
        .from('institution')
        .update({
          tts_enabled: config.tts_enabled,
          tts_volume: config.tts_volume,
          tts_rate: config.tts_rate
        })
        .eq('id', institutionId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' })

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error al guardar configuración:', error)
      setMessage({ type: 'error', text: 'Error al guardar la configuración' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestTTS = () => {
    initAudioContext()
    playNotificationSound(config.tts_volume)

    // Crear un utterance temporal con la configuración actual
    const utterance = new SpeechSynthesisUtterance('Juan Pérez a Enfermería')
    utterance.lang = 'es-AR'
    utterance.rate = config.tts_rate
    utterance.volume = config.tts_volume

    setTimeout(() => {
      window.speechSynthesis.speak(utterance)
    }, 500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Configuración general de la institución
        </p>
      </div>

      {/* Mensaje de éxito/error */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Configuración de TTS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Anuncios de Voz (TTS)
          </CardTitle>
          <CardDescription>
            Configuración de los anuncios por voz en las pantallas públicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="tts-enabled" className="text-base font-medium">
                Habilitar Anuncios de Voz
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Los llamados se anunciarán por voz en las pantallas públicas
              </p>
            </div>
            <Switch
              id="tts-enabled"
              checked={config.tts_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, tts_enabled: checked })}
            />
          </div>

          {/* Volume Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="tts-volume" className="text-base font-medium">
                Volumen
              </Label>
              <span className="text-sm text-muted-foreground font-semibold">
                {Math.round(config.tts_volume * 100)}%
              </span>
            </div>
            <Slider
              id="tts-volume"
              min={0}
              max={1}
              step={0.1}
              value={[config.tts_volume]}
              onValueChange={([value]) => setConfig({ ...config, tts_volume: value })}
              disabled={!config.tts_enabled}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              Controla el volumen de los anuncios (0% = silencio, 100% = máximo)
            </p>
          </div>

          {/* Rate Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="tts-rate" className="text-base font-medium">
                Velocidad
              </Label>
              <span className="text-sm text-muted-foreground font-semibold">
                {config.tts_rate.toFixed(1)}x
              </span>
            </div>
            <Slider
              id="tts-rate"
              min={0.5}
              max={1.5}
              step={0.1}
              value={[config.tts_rate]}
              onValueChange={([value]) => setConfig({ ...config, tts_rate: value })}
              disabled={!config.tts_enabled}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              Controla la velocidad de los anuncios (0.5x = lento, 1.5x = rápido)
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleTestTTS}
              disabled={!config.tts_enabled}
              variant="outline"
              className="flex-1"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Probar Voz
            </Button>
            <Button
              onClick={saveConfig}
              disabled={saving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> Esta configuración se aplicará a todas las pantallas públicas de la institución.
              Los operadores de pantalla pueden probar el audio, pero no modificar la configuración.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
