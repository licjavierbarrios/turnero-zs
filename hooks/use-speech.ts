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

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Verificar si el navegador soporta Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true)
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
      return
    }

    // Cancelar cualquier speech anterior
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = (event) => {
      // Silenciar error "not-allowed" que es común cuando TTS no fue iniciado por usuario
      if (event.error !== 'not-allowed') {
        console.error('Error en TTS:', event)
      }
      setSpeaking(false)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
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
    volume
  }
}
