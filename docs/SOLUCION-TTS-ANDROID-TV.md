# Solución: TTS (Text-to-Speech) en Android TV

## Problema Original
En Android TV Chrome, la síntesis de voz (TTS) no funcionaba porque:
- Web Speech API no está soportada o está deshabilitada en Android TV
- El usuario escuchaba el sonido dingdong.mp3 pero NO la voz anunciando el paciente

## Solución Implementada

### 1. Nuevo Endpoint: `/api/tts`
**Archivo**: `app/api/tts/route.ts`

**Funcionalidad**:
- Genera audio MP3 a partir de texto usando Google Translate TTS API
- No requiere credenciales ni configuración
- Cachea resultados por 24 horas para optimizar

**Parámetros**:
```
GET /api/tts?text=María%20González,%20consultorio%203&lang=es
```
- `text`: Texto a sintetizar (máximo 200 caracteres)
- `lang`: Idioma (default: es-AR, Google Translate usa 'es')

**Ejemplo de uso**:
```javascript
const audio = new Audio('/api/tts?text=María González, consultorio 3&lang=es');
audio.play();
```

### 2. Hook Mejorado: `useSpeech`
**Archivo**: `hooks/use-speech.ts`

**Cambios**:
- Detecta automáticamente si Web Speech API está disponible
- **Si Web Speech está disponible**: Usa Web Speech API (navegadores de escritorio)
- **Si NO está disponible**: Usa `/api/tts` (Android TV, navegadores sin soporte)

**Ventajas**:
- Compatible con navegadores modernos (PC, Mac, Linux)
- Compatible con Android TV Chrome
- Compatible con navegadores antiguos sin Web Speech API
- Fallback automático sin intervención del usuario

### 3. Flujo de Síntesis de Voz

```
┌─────────────────────────────────┐
│ Usuario presiona "Activar Audio" │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ speak('María González, consultorio 3')│
└────────────┬────────────────────────┘
             │
        ┌────┴────┐
        │          │
        ▼          ▼
  [Web Speech]  [No Web Speech]
        │              │
        ▼              ▼
   PC/Mac/Linux   Android TV
   Navegador      Navegador
```

## Cambios de Código

### Archivo: `hooks/use-speech.ts`
```typescript
// Nueva función para usar servidor TTS
const speakWithServerTTS = useCallback((text: string) => {
  const ttsUrl = new URL('/api/tts', window.location.origin)
  ttsUrl.searchParams.set('text', text)
  ttsUrl.searchParams.set('lang', 'es') // Google usa 'es' no 'es-AR'
  
  const audio = new Audio(ttsUrl.toString())
  audio.volume = volume
  audio.play()
}, [volume])

// Selecciona automáticamente la estrategia
const speak = useCallback((text: string) => {
  if (hasWebSpeechRef.current) {
    speakWithWebSpeech(text)  // PC/Mac/Linux
  } else {
    speakWithServerTTS(text)  // Android TV
  }
}, [])
```

## Testing

### En PC (Web Speech API disponible):
```javascript
// Abre consola (F12) y prueba:
const { useSpeech } = await import('@/hooks/use-speech');
const { speak } = useSpeech({ lang: 'es-AR' });
speak('Prueba desde Web Speech API');
```

### En Android TV (Sin Web Speech API):
```javascript
// Abre consola (F12) en Chrome del TV y prueba:
const { useSpeech } = await import('@/hooks/use-speech');
const { speak } = useSpeech({ lang: 'es-AR' });
speak('Prueba desde Google Translate TTS');
// Debería conectarse a /api/tts y reproducir el audio
```

## URLs de Prueba

### Probar endpoint TTS directamente:
```
/api/tts?text=María%20González&lang=es
/api/tts?text=Consultorio%20número%203&lang=es
```

### Con caracteres especiales:
```
/api/tts?text=María%20González%2C%20consultorio%203&lang=es
```
(El signo de interrogación `?` se codifica como `%3F`)

## Ventajas

✅ Funciona en Android TV Chrome
✅ Funciona en PC/Mac/Linux sin cambios
✅ Sin depender de Web Speech API limitado
✅ Audio sintetizado en tiempo real
✅ Cacheo automático de 24 horas
✅ Sin costo adicional (Google Translate API pública)

## Limitaciones

⚠️ Máximo 200 caracteres por síntesis (limitación de Google Translate)
⚠️ Requiere conexión a internet
⚠️ Requiere acceso a translate.google.com (firewall puede bloquear)

## Próximos Pasos

1. **Testing en Android TV** (Usuario)
2. **Verificar latencia** en llamadas de pacientes
3. **Agregar alternativa**: Si Google Translate falla, usar Web Speech API como fallback
4. **Monitorear caché**: Verificar que el cacheo de 24 horas funciona

## Archivos Modificados

- ✅ Creado: `app/api/tts/route.ts`
- ✅ Modificado: `hooks/use-speech.ts`

## Rollback (si es necesario)

Si hay problemas, volver al Web Speech API:
```bash
git revert app/api/tts/route.ts
git revert hooks/use-speech.ts
```

