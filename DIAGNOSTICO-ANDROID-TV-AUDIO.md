# Diagnóstico: Falta de Audio en Android TV

## Problema Reportado
✅ El bip/click funciona en TV  
❌ No suena el archivo dingdong.mp3  
❌ No sale la síntesis de voz (TTS)

## Causa Probable

### 1. **Archivo dingdong.mp3 no se carga**
- **URL**: `/api/audio?file=dingdong.mp3`
- **Endpoint**: `app/api/audio/route.ts`
- **Posible problema**: El navegador Chrome en Android TV puede tener restricciones con CORS o con audio en segundo plano

### 2. **Web Speech API deshabilitada en Android TV**
- Android TV Chrome puede deshabilitar TTS por defecto
- Requiere permiso explícito que no se puede solicitar vía JS

### 3. **El botón "Activar Audio" no está visible o es inaccesible**
- En pantalla grande (TV), el modal puede no ser visible o el botón difícil de tocar

## Soluciones Posibles

### Opción A: Mejorar visibilidad del botón (RECOMENDADO - Inmediato)
```javascript
// Cambios en app/(public)/pantalla/[slug]/page.tsx:
// - Ampliar botón a ocupar 80% de pantalla en TV
// - Hacer texto más grande
// - Agregar instrucciones claras
```

### Opción B: Usar Web Audio API en lugar de HTML Audio
- Web Audio API tiene mejor soporte en Android TV
- Permite más control sobre audio
- Archivo dingdong.mp3 → Buffer de audio descargado y reproducido via Web Audio

### Opción C: Verificar origen del audio (Debug)
1. Ir a Chrome DevTools (F12) en Android TV
2. Navegar a Network tab
3. Intentar reproducir audio
4. Ver si `/api/audio` retorna 200 o error
5. Verificar Content-Type: audio/mpeg

### Opción D: Usar base64 para audio (último recurso)
- Precodificar dingdong.mp3 a base64
- Guardar en código o config
- No requiere descargas, ya está en navegador

## Tests Recomendados

### Test 1: Verificar audio HTML simple
```javascript
// Abrir consola (F12) en Android TV Chrome
const audio = new Audio('/api/audio?file=dingdong.mp3');
audio.volume = 0.5;
audio.play();
// ¿Suena?
```

### Test 2: Verificar TTS
```javascript
const utterance = new SpeechSynthesisUtterance('Hola mundo');
utterance.lang = 'es-AR';
window.speechSynthesis.speak(utterance);
// ¿Se escucha?
```

### Test 3: Verificar Web Audio API
```javascript
const ctx = new (window.AudioContext || window.webkitAudioContext)();
const osc = ctx.createOscillator();
const gainNode = ctx.createGain();
osc.connect(gainNode);
gainNode.connect(ctx.destination);
osc.frequency.value = 800;
osc.start();
setTimeout(() => osc.stop(), 500);
// ¿Suena?
```

## Próximos Pasos

1. **Inmediato**: Ampliar botón "Activar Audio" para que sea más visible/tocable
2. **Corto plazo**: Hacer que el debug de audio sea más fácil (agregarerrores visibles en pantalla)
3. **Si nada funciona**: Cambiar a Web Audio API para archivo dingdong.mp3

