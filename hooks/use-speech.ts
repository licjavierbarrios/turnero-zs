import { useState, useEffect, useCallback, useRef } from 'react'

interface UseSpeechOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  enabled?: boolean
}

interface UseSpeechReturn {
  speak: (text: string) => void
  speaking: boolean
  supported: boolean
  cancel: () => void
  setEnabled: (enabled: boolean) => void
  setRate: (rate: number) => void
  setVolume: (volume: number) => void
  enabled: boolean
  rate: number
  volume: number
  voicesLoaded: boolean
}

/**
 * Hook personalizado para Text-to-Speech usando Web Speech API
 *
 * @param options - Opciones de configuración de la voz
 * @returns Funciones y estado para controlar el TTS
 *
 * @example
 * const { speak, speaking, supported } = useSpeech({ lang: 'es-AR' })
 * speak('Juan Pérez, consultorio 3')
 */
export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const {
    lang = 'es-AR',
    rate: initialRate = 0.9,
    pitch = 1.0,
    volume: initialVolume = 1.0,
    enabled: initialEnabled = true
  } = options

  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [rate, setRate] = useState(initialRate)
  const [volume, setVolume] = useState(initialVolume)
  const [voicesLoaded, setVoicesLoaded] = useState(false)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Verificar si el navegador soporta Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true)

      // Cargar voces disponibles
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          setVoicesLoaded(true)
          console.log(`TTS: ${voices.length} voces cargadas`)
        }
      }

      // Las voces se cargan de forma asíncrona en algunos navegadores
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    } else {
      console.warn('Web Speech API no está soportada en este navegador')
    }
  }, [])

  // Cancelar cualquier speech en progreso al desmontar
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!supported || !enabled) {
      console.warn('TTS no soportado o deshabilitado')
      return
    }

    if (!text || text.trim().length === 0) {
      console.warn('TTS: Texto vacío')
      return
    }

    // Verificar que las voces estén cargadas
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) {
      console.warn('TTS: Aún no hay voces cargadas. Reintentando en 100ms...')
      setTimeout(() => speak(text), 100)
      return
    }

    try {
      // Cancelar cualquier speech anterior
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.volume = volume

      // Intentar seleccionar una voz en español
      const spanishVoice = voices.find(voice =>
        voice.lang.startsWith('es-') || voice.lang === 'es'
      )
      if (spanishVoice) {
        utterance.voice = spanishVoice
        console.log(`TTS: Usando voz "${spanishVoice.name}" (${spanishVoice.lang})`)
      }

      utterance.onstart = () => {
        console.log('TTS: Reproduciendo:', text)
        setSpeaking(true)
      }

      utterance.onend = () => {
        console.log('TTS: Finalizado')
        setSpeaking(false)
      }

      utterance.onerror = (event) => {
        console.error('Error en TTS:', {
          error: event.error,
          message: event.error === 'canceled'
            ? 'Speech cancelado (puede ser normal si se llama múltiples veces)'
            : event.error === 'not-allowed'
            ? 'Permiso denegado por el navegador'
            : event.error === 'network'
            ? 'Error de red'
            : event.error,
          charIndex: event.charIndex,
          elapsedTime: event.elapsedTime
        })
        setSpeaking(false)
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Excepción en TTS:', error)
      setSpeaking(false)
    }
  }, [supported, enabled, lang, rate, pitch, volume])

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [])

  return {
    speak,
    speaking,
    supported,
    cancel,
    setEnabled,
    setRate,
    setVolume,
    enabled,
    rate,
    volume,
    voicesLoaded
  }
}
