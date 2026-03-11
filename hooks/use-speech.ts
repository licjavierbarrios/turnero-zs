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
 * Hook personalizado para Text-to-Speech
 *
 * Usa dos estrategias:
 * 1. Web Speech API (para navegadores de escritorio con soporte)
 * 2. Google Translate TTS API (para Android TV y navegadores sin Web Speech)
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasWebSpeechRef = useRef(false)

  // Verificar si el navegador soporta Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        hasWebSpeechRef.current = true
        setSupported(true)
      } else {
        // Sin Web Speech API, usar Google Translate TTS
        hasWebSpeechRef.current = false
        setSupported(true) // Seguimos soportando via servidor
      }
    }
  }, [])

  // Cancelar cualquier speech en progreso al desmontar
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const speakWithWebSpeech = useCallback((text: string) => {
    if (!hasWebSpeechRef.current || !enabled) {
      return
    }

    // Cancelar cualquier speech anterior
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    // Seleccionar voz en español si está disponible
    const voices = window.speechSynthesis.getVoices()
    const esVoice = voices.find(v => v.lang.startsWith('es'))
    if (esVoice) utterance.voice = esVoice

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = (event) => {
      // 'not-allowed': sin gesto de usuario. 'interrupted': cancel() previo esperado.
      if (event.error !== 'not-allowed' && event.error !== 'interrupted') {
        console.error('Error en TTS (Web Speech):', event.error)
      }
      setSpeaking(false)
    }

    utteranceRef.current = utterance

    // Fix Chrome/Brave: cancel() + speak() inmediato puede fallar.
    // Esperar un tick antes de hablar.
    setTimeout(() => {
      // Verificar que las voces estén cargadas; si no, reintentar cuando estén listas
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null
          window.speechSynthesis.speak(utterance)
        }
      } else {
        window.speechSynthesis.speak(utterance)
      }
    }, 100)
  }, [enabled, lang, rate, pitch, volume])

  const speakWithServerTTS = useCallback((text: string) => {
    if (!enabled) {
      return
    }

    setSpeaking(true)

    // Detener audio anterior si existe
    if (audioRef.current) {
      audioRef.current.pause()
    }

    // Construir URL con parámetros
    const ttsUrl = new URL('/api/tts', typeof window !== 'undefined' ? window.location.origin : '')
    ttsUrl.searchParams.set('text', text)
    ttsUrl.searchParams.set('lang', lang === 'es-AR' ? 'es' : lang) // Google Translate usa 'es' no 'es-AR'

    // Crear elemento de audio
    const audio = new Audio(ttsUrl.toString())
    audio.volume = volume

    audio.onplay = () => setSpeaking(true)
    audio.onended = () => setSpeaking(false)
    audio.onerror = (event) => {
      console.error('Error en TTS (Server):', event)
      setSpeaking(false)
    }

    audioRef.current = audio
    audio.play().catch((error) => {
      // Silenciar errores de autoplay que son normales en algunos navegadores
      if (error.name !== 'NotAllowedError') {
        console.warn('Error reproduciendo TTS:', error)
      }
      setSpeaking(false)
    })
  }, [enabled, lang, volume])

  const speak = useCallback((text: string) => {
    if (!supported || !enabled) {
      return
    }

    // Usar Web Speech API si está disponible, si no usar servidor
    if (hasWebSpeechRef.current) {
      speakWithWebSpeech(text)
    } else {
      speakWithServerTTS(text)
    }
  }, [supported, enabled, speakWithWebSpeech, speakWithServerTTS])

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setSpeaking(false)
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
