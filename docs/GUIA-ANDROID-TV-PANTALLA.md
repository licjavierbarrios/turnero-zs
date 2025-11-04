# Guía: Usar Android TV como Pantalla Pública en Turnero ZS

**Versión**: 1.0  
**Última actualización**: 2025-11-04  
**Aplicación**: Turnero ZS - Sistema de Gestión de Turnos

---

## 🎯 Objetivo

Usar un TV inteligente con Android TV como **pantalla pública en tiempo real** para mostrar la cola de pacientes, números de orden y estado de atención en tu institución de salud.

---

## 📋 Requisitos Previos

### Hardware

- ✅ **TV Smart con Android TV** (cualquier versión 5.0+)
- ✅ **Conexión a Internet** (WiFi o Ethernet)
- ✅ **Control remoto** (el del TV o uno compatible)
- ✅ **Poder mantener el TV encendido** 24/7 (opcional pero recomendado)

### Software

- ✅ Navegador web instalado (Chrome, Firefox, o el navegador por defecto)
- ✅ Acceso a Turnero ZS (cuenta con rol `pantalla`)

---

## 🚀 Pasos de Configuración

### Paso 1: Crear Usuario con Rol "Pantalla"

**En Turnero ZS (super-admin)**:

1. Ve a `https://turnero-zs.vercel.app/super-admin/usuarios`
2. Crea un nuevo usuario (ejemplo):
   - Email: `pantalla-institucioN@salud.gob.ar`
   - Contraseña: Segura y simple de recordar
   - Nombre: `Pantalla Pública`

3. Asigna membresía a la institución:
   - Institución: Tu centro de salud
   - Rol: **`pantalla`** (importante)
   - Estado: Activo

**Resultado**: Usuario con acceso de solo lectura a la pantalla pública

---

### Paso 2: Conectar TV a Internet

1. **En el TV**:
   - Abre **Configuración** (Settings)
   - Ve a **Red** (Network)
   - Selecciona **WiFi** o **Ethernet**
   - Conecta a tu red

2. **Verifica la conexión**:
   - Abre cualquier aplicación que requiera internet (YouTube, etc.)
   - Debe funcionar sin problemas

---

### Paso 3: Acceder a Turnero ZS en el TV

1. **Abre un navegador** en el TV:
   - Chrome, Firefox, o el navegador por defecto
   - Busca: `turnero-zs.vercel.app`

2. **Inicia sesión**:
   - Email: `pantalla-institucioN@salud.gob.ar`
   - Contraseña: La que estableciste

3. **Selecciona tu institución**:
   - Se te presentará la pantalla de selección institucional
   - Selecciona tu centro de salud
   - Rol mostrará: **"Pantalla"**

4. **Se abrirá automáticamente la pantalla pública**:
   - Ver: `/pantalla/[slug-institución]`
   - Ejemplo: `https://turnero-zs.vercel.app/pantalla/caps-villa-esperanza`

---

### Paso 4: Configuración de Pantalla Pública

**Una vez en la pantalla pública**, verás opciones:

#### 🎨 Selector de Template (Layout)
- **Click en el botón "Template"** para cambiar el layout:
  - **Grid**: Muestra todos los turnos en grilla
  - **List**: Muestra los turnos en lista
  - **Carousel**: Muestra los turnos en carrusel (recomendado para pantallas grandes)

#### 🔊 Configuración de Audio/TTS
- **Botón de volumen**: Activa/desactiva sonido
- **Controles de TTS**:
  - Volumen del sintetizador de voz (0-100%)
  - Velocidad de pronunciación (0.5x - 2x)
  - Habilitar/deshabilitar anuncios de voz

#### ⚙️ Configuración de Institución
- En **super-admin > instituciones**, puedes configurar:
  - `tts_enabled`: Habilitar anuncios automáticos
  - `tts_volume`: Volumen por defecto (0.0 - 1.0)
  - `tts_rate`: Velocidad de voz (0.5 - 2.0)

---

## 🎮 Controles en Pantalla Pública

### Controles Disponibles

| Función | Cómo hacerlo |
|---------|-------------|
| **Cambiar Layout** | Click en botón "Template" (esquina superior) |
| **Silenciar/Activar sonido** | Click en icono de volumen |
| **Ajustar volumen TTS** | Deslizar en control de volumen |
| **Ajustar velocidad TTS** | Deslizar en control de velocidad |
| **Pantalla completa** | Presiona **F11** en teclado o doble-click en TV |
| **Salir de sesión** | Presiona **Escape** para volver al menú |

### Navegación en TV (Con Control Remoto)

1. **Movimiento**: Usa las flechas del control
2. **Select**: Botón central/OK
3. **Back**: Botón rojo o atrás
4. **Pantalla completa**: Presiona el botón de programa o menú

---

## 🖥️ Opciones de Navegador Recomendadas

### Para Android TV

#### 1. **Chrome** (Recomendado)
- ✅ Compatible 100%
- ✅ Soporte de audio/TTS excelente
- ✅ Rendimiento óptimo
- ✅ Actualización automática

```
Descarga: Google Play Store > Busca "Chrome"
```

#### 2. **Firefox**
- ✅ Alternativa si Chrome no está disponible
- ✅ Buen soporte de TTS
- ⚠️ Puede ser un poco más lento

#### 3. **Navegador por defecto del TV**
- ✅ Funciona en la mayoría de casos
- ⚠️ Puede tener limitaciones de TTS
- ⚠️ Actualizaciones menos frecuentes

---

## 🔧 Configuración Avanzada

### Opción 1: Modo Kiosk (Recomendado)

**Para que la pantalla muestre solo Turnero ZS**:

1. En Android TV, ve a **Configuración > Aplicaciones > Permisos especiales**
2. Busca **"Acceso de dispositivo administrativo"**
3. Instala una aplicación de Kiosk (ej: **Kiosk Mode Lockdown**)
4. Configura la URL: `https://turnero-zs.vercel.app/pantalla/[slug]`
5. Ahora el TV mostrará SOLO la pantalla de turnos

**Beneficios**:
- ✅ Nadie puede cambiar de aplicación
- ✅ Interfaz limpia
- ✅ Protegido contra accesos no autorizados
- ✅ Se reinicia automáticamente si hay crash

### Opción 2: Apagar Pantalla Automáticamente

**Si quieres ahorrar energía**:

1. En **Configuración > Pantalla**
2. Establece **"Tiempo de inactividad"** a 10-30 minutos
3. O usa un **Smart Plug** con temporizador

### Opción 3: Auto-Refresh de Página

**Para mayor estabilidad** (la página se recarga automáticamente):

```javascript
// Copiar en consola del navegador (F12):
setInterval(() => location.reload(), 3600000); // Cada 1 hora

// Para 4 horas:
setInterval(() => location.reload(), 14400000);
```

---

## 📊 Monitoreo en Tiempo Real

### Qué Ver en Pantalla

```
┌─────────────────────────────────────┐
│  CAPS Villa Esperanza - Zona Norte  │
├─────────────────────────────────────┤
│                                     │
│  DISPONIBLE (Verde)                 │
│  ┌─────────┐  ┌─────────┐          │
│  │ ORDEN   │  │ ORDEN   │          │
│  │  001    │  │  002    │          │
│  │ Juan Pérez │ María García      │
│  │ Medicina General │ Pediatría     │
│  └─────────┘  └─────────┘          │
│                                     │
│  LLAMADO (Morado con animación)     │
│  ┌─────────┐                        │
│  │ ORDEN   │ 👈 Animación pulsante │
│  │  003    │                        │
│  │ Carlos López                     │
│  │ Cardiología                      │
│  └─────────┘                        │
│                                     │
│  ATENDIDO (Verde oscuro)            │
│  ┌─────────┐                        │
│  │ ORDEN   │                        │
│  │  004    │                        │
│  │ Ana Martínez                     │
│  │ Servicios                        │
│  └─────────┘                        │
│                                     │
└─────────────────────────────────────┘
```

### Estados de Pacientes

| Estado | Color | Significado |
|--------|-------|-------------|
| **Pendiente** | Gris | No se muestra en pantalla |
| **Disponible** | Azul | Puede ser llamado |
| **Llamado** | Morado (anima) | En consulta o esperando |
| **Atendido** | Verde | Consultorio ocupado |
| **Cancelado** | Rojo | No aparece en pantalla |

---

## 🔊 Sistema de Audio/TTS

### Cómo Funciona

1. **Cuando se llama a un paciente**:
   - La pantalla muestra el turno en **morado pulsante**
   - Se **anuncia en voz**: "Paciente número 003, Juan Pérez, Medicina General, Consultorio 1"
   - Se **reproduce un sonido** de notificación

2. **Configuración de voz**:
   - **Idioma**: Español argentino (es-AR)
   - **Velocidad**: Ajustable en pantalla
   - **Volumen**: Control deslizante

3. **Desactivar TTS**:
   - Click en el **icono de volumen silenciado**
   - Útil si la clínica prefiere silencio

### Requisitos de Audio

- ✅ TV con **parlante integrado** (todos los TV smart lo tienen)
- ✅ O conexionarlo a **speakers externos** por HDMI/audio out
- ✅ **Volumen en 30-50%** (audible pero no molesto)

---

## ⚠️ Troubleshooting

### "No puedo acceder a Turnero ZS"

**Solución**:
1. Verifica conexión a internet: Abre YouTube
2. Intenta con DNS diferente: `8.8.8.8` (Google DNS)
3. Reinicia el router
4. Limpia caché del navegador

### "La página se ve muy pequeña"

**Solución**:
1. Presiona **Ctrl + +** (zoom in) en teclado
2. O usa el zoom del navegador
3. Ajusta resolución del TV en **Configuración > Pantalla > Resolución**

### "El audio/TTS no funciona"

**Solución**:
1. Verifica que **volumen del TV no esté silenciado**
2. Aumenta el volumen de TTS en pantalla
3. Prueba en **Configuración > Sonido > Volumen de aplicaciones**
4. Reinicia el navegador

### "Se desconecta de internet frecuentemente"

**Solución**:
1. Acerca el TV a WiFi router
2. O usa Ethernet (más estable)
3. Cambia a WiFi 5GHz si está disponible
4. Reinicia el router cada madrugada (automático)

### "La página se congela o se lentifica"

**Solución**:
1. Recarga la página: **Ctrl + R** o **F5**
2. Limpia caché: **Ctrl + Shift + Del** > Borra todo
3. Cierra otras aplicaciones (YouTube, etc.)
4. Configura auto-refresh cada 1-4 horas (ver configuración avanzada)

---

## 🔐 Seguridad

### Buenas Prácticas

✅ **DO's**:
- ✅ Usar contraseña fuerte para usuario `pantalla`
- ✅ Habilitar Kiosk Mode si es posible
- ✅ Cambiar contraseña cada 3 meses
- ✅ Usar Ethernet en lugar de WiFi (más seguro)
- ✅ Mantener el TV actualizado

❌ **DON'Ts**:
- ❌ No dejar el TV con fácil acceso administrativo
- ❌ No compartir contraseña del usuario `pantalla`
- ❌ No conectar a WiFi público sin VPN
- ❌ No mantener navegador abierto con datos sensibles

### Control de Acceso

**Solo usuarios con rol `pantalla` pueden**:
- ✅ Ver la cola de pacientes
- ✅ Cambiar template de pantalla
- ✅ Ajustar volumen y velocidad de TTS

**NO pueden**:
- ❌ Crear/editar turnos
- ❌ Ver datos de pacientes (DNI, teléfono, etc.)
- ❌ Acceder a otras instituciones
- ❌ Cambiar configuración del sistema

---

## 📱 Alternativas (Si Android TV no es opción)

Si tu TV no es smart, puedes usar:

### 1. **Raspberry Pi** (Recomendado)
- Costo: $40-60 USD
- Conectar a HDMI
- Excelente rendimiento
- Bajo consumo de energía

### 2. **Amazon Fire Stick**
- Costo: $30-40 USD
- Fácil de configurar
- Buen rendimiento
- Soporte TTS limitado

### 3. **Chromecast**
- Costo: $30-50 USD
- Casting desde dispositivo
- Menos control
- No ideal para 24/7

### 4. **Laptop/Desktop**
- Costo: Ya lo tienes
- Conectar a TV por HDMI
- Máximo control
- Mayor consumo de energía

---

## 📈 Métricas y Monitoreo

### Qué Monitorear

- 📊 **Tiempo promedio en cola**: Debe disminuir
- 📊 **Pacientes atendidos/hora**: Debe aumentar
- 📊 **Satisfacción**: Encuestas a pacientes
- 📊 **Disponibilidad**: Uptime de la pantalla

### Verificar Estado de Pantalla

En super-admin:
1. Ve a **Instituciones**
2. Verifica que **Display Device** esté activo
3. Revisa logs de última conexión

---

## ✨ Tips Profesionales

### Para Mejor Experiencia

1. **Ubicación del TV**:
   - Colgado en **pared frontal** de sala de espera
   - Altura de **ojos** (1.5-1.8m)
   - Luz natural **no directa** sobre pantalla

2. **Tamaño recomendado**:
   - **CAPS**: 32-43 pulgadas
   - **Hospital seccional**: 43-50 pulgadas
   - **Hospital grande**: 50+ pulgadas

3. **Distancia de visualización**:
   - Mínimo: 2 metros
   - Máximo: 6 metros
   - Ideal: 3-4 metros

4. **Sonido**:
   - Volumen: 30-40%
   - Horas pico: Más bajo
   - Noche: Silenciado

5. **Mantenimiento**:
   - Limpiar pantalla: 1x semana
   - Reiniciar TV: Diaria (madrugada)
   - Verificar conexión: 2-3x semana

---

## 📞 Soporte

### Problemas Comunes

**¿Qué hacer si la pantalla deja de funcionar?**

1. Reinicia el TV (apaga y enciende)
2. Verifica conexión a internet
3. Actualiza el navegador
4. Limpia caché
5. Si persiste, contacta al administrador

**¿Cómo reportar errores?**

- Toma screenshot de error
- Anota hora y qué pasó
- Contacta a: `soporte@turnero-zs.com`

---

## 🎯 Casos de Uso Frecuentes

### Caso 1: CAPS con 1 Servicio
```
Pantalla muestra:
- Orden 001, 002, 003 (disponibles)
- Orden 004 (llamado - anima)
- Orden 005 (atendido)
```

### Caso 2: Hospital con Múltiples Servicios
```
Usa layout "GRID":
- Cardiología: 001, 002, 003
- Pediatría: 001, 002
- Medicina General: 001, 002, 003, 004
```

### Caso 3: Hospital Grande con Zonas
```
URL especial: /pantalla/zona/[zone_id]
Muestra TODOS los servicios de una zona
Útil para hospitales con múltiples secciones
```

---

## 🚀 Optimización para Producción

**Cuando esté en funcionamiento real**:

1. ✅ **Documentar**:
   - Credentials en lugar seguro
   - Procedimiento de reinicio

2. ✅ **Monitorear**:
   - Uptime del sistema
   - Calidad de audio
   - Feedback de usuarios

3. ✅ **Mantener**:
   - Actualizar software mensualmente
   - Cambiar contraseña cada 3 meses
   - Revisar logs semanalmente

4. ✅ **Entrenar personal**:
   - Cómo cambiar layout
   - Cómo silenciar audio
   - Qué hacer ante problemas

---

## 📚 Referencias

- 📖 **IMPLEMENTACION-ACTUAL.md** - Sistema de queue (daily_queue)
- 📖 **RLS-QUICK-REFERENCE.md** - Permisos por rol
- 🔗 **App pública**: `/app/(public)/pantalla/[slug]/page.tsx`
- 🔗 **Configuración**: super-admin > instituciones > TTS settings

---

**¡Tu pantalla pública está lista! 🎉**

Cualquier duda o problema, contacta al equipo de soporte.
