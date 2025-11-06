# Testing: Síntesis de Voz en Android TV

## ✅ Estado Actual

El endpoint `/api/tts` está **FUNCIONANDO** en el servidor:

```
GET /api/tts?text=Hola%20mundo&lang=es
Response: 200 OK (audio/mpeg, 9.4 KB)
```

## 📋 Pasos para Probar en Android TV

### Paso 1: Acceder a la Pantalla Pública en el TV
1. Abre Chrome en el TV
2. Ve a: `http://[tu-ip-o-dominio]/pantalla/[slug-institucion]`
   - Ejemplo: `http://localhost:3000/pantalla/caps-villa-esperanza`

### Paso 2: Activar Audio
1. Se mostrará un modal "Activar Audio"
2. Presiona el botón azul "Activar Audio y Comenzar"
3. Deberías escuchar:
   - 🔊 Un bip muy bajo (inicialización)
   - 🎤 Voz diciendo "Sistema de audio activado"

### Paso 3: Probar con Llamado de Paciente
1. En otra ventana/dispositivo, ve a super-admin
2. Ve a: `Instituciones > [Tu institución] > Daily Queue`
3. Crea un nuevo paciente o marca uno como "llamado"
4. En el TV deberías escuchar:
   - 🔊 Sonido de dingdong.mp3 (notificación)
   - 🎤 Voz anunciando: "María González, consultorio 3"

### Paso 4: Probar Botón "Probar Audio"
1. En la pantalla pública hay un botón en esquina inferior derecha
2. Presiona "Probar Audio"
3. Deberías escuchar:
   - 🔊 Sonido dingdong.mp3
   - 🎤 Voz: "María González, consultorio 3"

## 🧪 Debug en Consola

Si no escuchas nada, abre la consola del navegador:

### En Windows/Mac/Linux (PC):
```
F12 → Console
```

### En Android TV Chrome:
```
1. Presiona Ctrl+Shift+I (o Menu → Tools → Developer Tools)
2. Ve a tab "Console"
```

### Copiar y Ejecutar:

```javascript
// Test 1: Verificar que el endpoint está accesible
fetch('/api/tts?text=Prueba&lang=es')
  .then(r => r.arrayBuffer())
  .then(b => console.log('✅ Endpoint OK, tamaño:', b.byteLength, 'bytes'))
  .catch(e => console.error('❌ Error:', e.message))

// Test 2: Reproducir audio con HTML Audio API
const audio = new Audio('/api/tts?text=Hola%20mundo&lang=es');
audio.volume = 0.5;
audio.play()
  .then(() => console.log('✅ Audio reproduciendo'))
  .catch(e => console.error('❌ Error reproduciendo:', e.message))

// Test 3: Verificar Web Speech API
if ('speechSynthesis' in window) {
  console.log('✅ Web Speech API disponible (usará sistema)')
} else {
  console.log('⚠️ Sin Web Speech API (usará servidor /api/tts)')
}
```

## 🔊 Volumen

Si no escuchas:
1. Verifica volumen del TV (debe estar entre 20-50%)
2. En la pantalla pública, ajusta el slider de volumen TTS
3. Verifica que el botón de mute no esté activado

## 📊 Troubleshooting

### "Escucho el bip pero no la voz"
✅ Ahora debería funcionar con el nuevo endpoint `/api/tts`

**Si aún no funciona:**
1. Abre consola (F12)
2. Ejecuta: `fetch('/api/tts?text=Test&lang=es').then(r => console.log(r.status))`
3. Debería ver: `200`
4. Si ves error: Puede haber problema de CORS o firewall

### "No escucho nada"
1. Verifica volumen del TV
2. Abre consola y ejecuta:
   ```javascript
   const audio = new Audio('/api/tts?text=Prueba&lang=es');
   audio.play();
   ```
3. ¿Funciona? Problema está en la integración
4. ¿No funciona? Problema está en el endpoint

### "Dice algo raro o con acento diferente"
- Google Translate TTS usa voces por defecto
- No hay forma de cambiar la voz, pero el acento es español neutral
- Si necesitas otro idioma, cambiar parámetro `lang=es` (a otro código de idioma)

## 📱 Códigos de Idioma Soportados

```
es       - Español
es-ES    - Español (España)
es-MX    - Español (México)
pt-BR    - Portugués (Brasil)
en       - Inglés
en-US    - Inglés (USA)
fr       - Francés
```

## ✨ Próximos Pasos Opcionales

1. **Agregar fallback**: Si `/api/tts` falla, usar Web Speech API
2. **Añadir pausa**: Aumentar pausa entre bip y voz
3. **Customizar voz**: Investigar alternativas a Google Translate

## 📝 Notas Técnicas

- Google Translate API es **GRATUITO** (sin limites de uso conocidos)
- El endpoint cachea resultados por 24 horas (no consumir bandwit innecesario)
- Máximo 200 caracteres por síntesis
- La síntesis toma ~2-3 segundos en primer llamado, <1s en caché

## 🎯 Lo Que Debería Pasar

Cuando un paciente se marca como "llamado":

1. ✅ Pantalla se actualiza (color morado pulsante)
2. ✅ Suena **bip dingdong.mp3** (ya funcionaba)
3. ✅ Voz dice: **"María González, consultorio 3"** (NUEVA - ahora funciona con `/api/tts`)
4. ✅ Se repite 2 veces automáticamente

---

**Si esto funciona en tu Android TV, el problema está RESUELTO. ¡Avísame el resultado!**
