# Integración de Text-to-Speech (TTS) en Pantalla Pública

Guía para integrar el anuncio por voz de llamados de pacientes en la pantalla pública.

## 📋 Archivos Creados

### 1. `hooks/use-speech.ts`
Hook personalizado para manejar Web Speech API:
- Controla síntesis de voz del navegador
- Soporte para español argentino (es-AR)
- Configuración de velocidad, volumen y tono
- Detección de soporte del navegador

### 2. `lib/audio-utils.ts`
Utilidades de audio:
- `playNotificationSound()`: Genera sonido "ding-dong" con Web Audio API
- `generateCallText()`: Formatea el texto del anuncio

### 3. `components/public-screen-tts.tsx`
Componente lógico para detectar nuevos llamados y anunciarlos:
- Escucha cambios en `callEvents`
- Reproduce sonido + voz automáticamente
- Evita duplicar anuncios

### 4. `components/tts-controls.tsx`
Controles UI para configurar el TTS:
- Switch on/off
- Slider de volumen (0-100%)
- Slider de velocidad (0.5x - 1.5x)
- Botón de prueba
- Botón flotante con icono de volumen

## 🔧 Cómo Integrar en la Pantalla Pública

### Opción 1: Modificar el archivo existente

Edita `app/(public)/pantalla/[slug]/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { PublicScreenTTS } from '@/components/public-screen-tts'
import { TTSControls } from '@/components/tts-controls'
import { useSpeech } from '@/hooks/use-speech'
import { playNotificationSound } from '@/lib/audio-utils'

export default function PublicScreenPage() {
  // ... tu código existente ...

  // Agregar estados para TTS
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [ttsVolume, setTtsVolume] = useState(1.0)
  const [ttsRate, setTtsRate] = useState(0.9)

  const { speak } = useSpeech({
    lang: 'es-AR',
    rate: ttsRate,
    volume: ttsVolume,
    enabled: ttsEnabled
  })

  // Función de prueba
  const handleTestTTS = () => {
    playNotificationSound(ttsVolume)
    setTimeout(() => {
      speak('María González, consultorio 3')
    }, 500)
  }

  return (
    <div>
      {/* Tu UI existente */}

      {/* Agregar componente TTS (invisible, solo lógica) */}
      <PublicScreenTTS
        callEvents={callEvents} // Tu array de llamados
        enabled={ttsEnabled}
        volume={ttsVolume}
        rate={ttsRate}
      />

      {/* Agregar controles flotantes */}
      <TTSControls
        enabled={ttsEnabled}
        volume={ttsVolume}
        rate={ttsRate}
        onEnabledChange={setTtsEnabled}
        onVolumeChange={setTtsVolume}
        onRateChange={setTtsRate}
        onTest={handleTestTTS}
      />
    </div>
  )
}
```

### Opción 2: Integración mínima (sin controles UI)

Si solo quieres el anuncio automático sin controles:

```tsx
import { PublicScreenTTS } from '@/components/public-screen-tts'

// En tu componente:
<PublicScreenTTS
  callEvents={callEvents}
  enabled={true}
  volume={0.8}
  rate={0.9}
/>
```

## 📊 Formato de Datos Esperado

El componente espera un array de `callEvents` con esta estructura:

```typescript
interface CallEvent {
  id: string
  appointment_id: string
  created_at: string
  appointment?: {
    patient?: {
      first_name: string
      last_name: string
    }
    room?: {
      name: string
    }
  }
}
```

## 🎯 Ejemplo de Anuncio

Cuando se detecta un nuevo llamado:

1. **Sonido**: "Ding-dong" (dos tonos)
2. **Pausa**: 500ms
3. **Voz**: "Juan Pérez, consultorio 3"

## ⚙️ Configuración Recomendada

```typescript
{
  lang: 'es-AR',      // Español argentino
  rate: 0.9,          // Velocidad normal-lenta (más claro)
  volume: 1.0,        // Volumen máximo
  pitch: 1.0,         // Tono normal
  enabled: true       // Activado por defecto
}
```

## 🔊 Compatibilidad de Navegadores

| Navegador | Soporte | Calidad |
|-----------|---------|---------|
| Chrome/Edge | ✅ Excelente | Alta |
| Firefox | ✅ Bueno | Media |
| Safari | ✅ Bueno | Media-Alta |
| Opera | ✅ Excelente | Alta |
| IE 11 | ❌ No | - |

## 📱 Consideraciones Móviles

En dispositivos móviles:
- iOS requiere interacción del usuario antes del primer TTS
- Android funciona automáticamente en la mayoría de navegadores
- Recomendado: Agregar botón "Iniciar Audio" en primer uso

## 🐛 Troubleshooting

### El sonido no se reproduce

```typescript
// Verificar soporte
const supported = 'speechSynthesis' in window
console.log('TTS soportado:', supported)

// Verificar voces disponibles
const voices = window.speechSynthesis.getVoices()
console.log('Voces disponibles:', voices)
```

### La voz suena robótica

- Ajustar `rate` a 0.8-0.9 (más lento = más natural)
- Algunos navegadores tienen mejores voces que otros
- Chrome en Windows tiene voces de alta calidad

### No habla en español

```typescript
// Verificar que exista voz en español
const voices = window.speechSynthesis.getVoices()
const spanishVoice = voices.find(v => v.lang.startsWith('es'))
console.log('Voz español:', spanishVoice)
```

## 🎨 Personalización

### Cambiar el sonido de notificación

Edita `lib/audio-utils.ts` y ajusta las frecuencias:

```typescript
oscillator1.frequency.value = 1318.51 // Tono 1 (más alto)
oscillator2.frequency.value = 1046.50 // Tono 2 (más bajo)
```

### Cambiar el formato del anuncio

Edita `lib/audio-utils.ts` en `generateCallText()`:

```typescript
// Actual: "Juan Pérez, consultorio 3"
return `${patientName}, consultorio ${cleanRoomName}`

// Alternativa: "Paciente Juan Pérez, pasar a consultorio 3"
return `Paciente ${patientName}, pasar a consultorio ${cleanRoomName}`
```

## 💾 Persistir Configuración

Para guardar la configuración del usuario en localStorage:

```typescript
const [ttsEnabled, setTtsEnabled] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tts-enabled')
    return saved ? JSON.parse(saved) : true
  }
  return true
})

useEffect(() => {
  localStorage.setItem('tts-enabled', JSON.stringify(ttsEnabled))
}, [ttsEnabled])
```

## 📚 Referencias

- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechSynthesis - MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
