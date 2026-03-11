# Guía: Usar Android TV como Pantalla Pública en Turnero ZS

**Versión**: 3.0
**Última actualización**: 2026-03-11
**Aplicación**: Turnero ZS - Sistema de Gestión de Turnos

---

## Objetivo

Usar un TV inteligente con Android TV como **pantalla pública en tiempo real** para mostrar la cola de pacientes, números de orden y estado de atención en tu institución de salud.

---

## Requisitos Previos

### Hardware

- TV Smart con Android TV (cualquier versión 5.0+)
- Conexión a Internet (WiFi o Ethernet)
- Control remoto (el del TV o uno compatible)

### Software

- Navegador web instalado (Chrome recomendado)
- Acceso al admin de Turnero ZS para obtener el PIN de pantalla

---

## Pasos de Configuración

### Paso 1: Crear la Pantalla en el Sistema

**En Turnero ZS (como admin de la institución)**:

1. Ir a `https://turnero-zs.vercel.app` e iniciar sesión
2. Navegar a **Pantallas** (`/pantallas`)
3. Crear una nueva pantalla:
   - Nombre: Ej. `Sala de Espera Principal`
   - Modo: `Todos` / `Incluir` / `Excluir` (para filtrar servicios o consultorios)
4. El sistema genera automáticamente un **PIN de 4 dígitos** visible en la tabla

> El PIN aparece en la columna **PIN TV** de la tabla de pantallas (ej: `6399`).
> También se puede acceder por URL directa si se prefiere.

---

### Paso 2: Conectar TV a Internet

1. En el TV, abrí **Configuración > Red**
2. Conectá a tu red WiFi o Ethernet
3. Verificá la conexión abriendo YouTube u otra app

---

### Paso 3: Abrir la Pantalla en el TV — Método PIN (recomendado)

1. Abrí **Chrome** en el TV
2. Ingresá la URL de acceso:
   `https://turnero-zs.vercel.app/tv`
3. Aparece un teclado numérico en pantalla — ingresá el **PIN de 4 dígitos** con el control remoto
4. Al completar los 4 dígitos, redirige automáticamente a la pantalla correspondiente
5. Presioná el botón de pantalla completa del navegador

> Esta URL es fija y corta — se puede configurar como página de inicio del navegador para
> que al encender el TV solo haya que tipear el PIN.

---

### Paso 3 alternativo: Acceso por URL directa

Si se prefiere, también se puede ingresar la URL completa:
`https://turnero-zs.vercel.app/pantalla/[token-uuid]`

El token se puede copiar desde el botón en la tabla de `/pantallas`.

---

### Paso 4: Ajustes en Pantalla

Una vez abierta la pantalla, podés ajustar:

#### Layout (Template)
- Click en **"Template"** para cambiar el diseño:
  - **Grid**: grilla de turnos (recomendado para muchos servicios)
  - **List**: lista vertical
  - **Carousel**: carrusel rotativo (recomendado para pantallas grandes)

#### Audio / TTS
- **Ícono de volumen**: activa/desactiva el sonido
- **Control de volumen TTS**: deslizador 0-100%
- **Velocidad de pronunciación**: 0.5x – 2x
- El audio usa Google Translate TTS con pronunciación correcta en español
- Cuando se llama a un paciente, se anuncia: *"[Nombre] a [servicio/consultorio]"*
- Turnos sensibles: se anuncia solo *"Paciente [número] a [destino]"* (sin nombre)

---

## Configuración Avanzada

### Modo Kiosk (Recomendado para instalación fija)

Para que el TV muestre **solo la pantalla de turnos**:

1. Instalá una app de Kiosk desde Google Play (ej: **Kiosk Mode Lockdown**)
2. Configurá la URL de inicio:
   `https://turnero-zs.vercel.app/tv`
3. El TV mostrará solo Turnero ZS — nadie puede cambiar de app ni salir

Beneficios:
- Sin acceso a otras aplicaciones
- Interfaz limpia
- Se reinicia automáticamente ante crashes

### Auto-Refresh de Página

Para mayor estabilidad (opcional):

```javascript
// Copiar en consola del navegador (F12):
setInterval(() => location.reload(), 3600000); // Cada 1 hora
```

### Apagado automático

En **Configuración > Pantalla > Tiempo de inactividad**: 30 minutos.
O usá un **Smart Plug** con temporizador programado al horario de atención.

---

## Navegadores Recomendados

| Navegador | Compatibilidad | TTS | Recomendado |
|-----------|---------------|-----|-------------|
| **Chrome** | 100% | Excelente | Si |
| Firefox | Buena | Buena | Alternativa |
| Navegador del TV | Variable | Limitado | No ideal |

---

## Lo Que Se Ve en Pantalla

```
+-----------------------------------------+
|  CPS B Evita - Zona Sanitaria III       |
|  [Sala de Espera Principal]             |
+-----------------------------------------+
|                                         |
|  DISPONIBLE (Azul)                      |
|  +--------+  +--------+                 |
|  | 001    |  | 002    |                 |
|  | Juan P.|  | Maria G|                 |
|  | Enfer. |  | Lab.   |                 |
|  +--------+  +--------+                 |
|                                         |
|  LLAMADO (Morado, pulsante)             |
|  +--------+                             |
|  | 003    |  <- animacion activa        |
|  | Carlos |                             |
|  | Dr. X - Consultorio 3               |
|  +--------+                             |
|                                         |
|  ATENDIDO (Verde)                       |
|  | 004 - Ana M. - Laboratorio |        |
+-----------------------------------------+
```

### Estados

| Estado | Color | Se muestra |
|--------|-------|-----------|
| Pendiente | Gris | No |
| Disponible | Azul | Si |
| Llamado | Morado (anima) | Si — con TTS |
| Atendido | Verde | Si |
| Cancelado | — | No |

### Turnos Sensibles

Los turnos marcados como sensibles (servicio o profesional de salud sensible) muestran **solo el número de orden** en pantalla pública, sin nombre ni médico. El TTS anuncia "Paciente 001 a Consultorio X" sin identificar al paciente.

---

## Controles

| Funcion | Como |
|---------|------|
| Cambiar layout | Click en "Template" |
| Silenciar/activar voz | Click en icono de volumen |
| Ajustar volumen TTS | Deslizador en pantalla |
| Pantalla completa | F11 o doble-click |

### Navegacion con control remoto Android TV
- **Flechas**: moverse entre controles
- **OK / Centro**: seleccionar
- **Atras**: volver

---

## Seguridad

**El PIN de pantalla** permite acceso a la pantalla pública desde cualquier dispositivo.
Tratalo como una URL interna: no lo publiques fuera del personal autorizado.

**La URL del token también es pública** — quien la tenga puede ver la pantalla sin PIN.

Buenas practicas:
- Usar Ethernet en lugar de WiFi (mas estable y seguro)
- Modo Kiosk para evitar accesos no autorizados al TV
- Si se compromete el acceso: borrar la pantalla y crear una nueva en `/pantallas` (genera PIN y token nuevos)

**La pantalla solo muestra**: nombre del paciente, numero de orden, servicio/consultorio.
**No muestra**: DNI, telefono, historia clinica ni datos sensibles.

---

## Troubleshooting

### "No carga la pagina"
1. Verificar internet: abrir YouTube en el TV
2. Confirmar que la URL `https://turnero-zs.vercel.app/tv` sea correcta
3. Limpiar cache: `Ctrl + Shift + Del`
4. Reiniciar el TV

### "PIN incorrecto"
1. Verificar el PIN en `/pantallas` del admin (columna PIN TV)
2. Asegurarse de que la pantalla esté activa (no desactivada)
3. Si se olvidó el PIN: el admin lo ve en cualquier momento desde `/pantallas`

### "La pagina se ve muy pequena"
1. `Ctrl + +` para hacer zoom
2. O desde el menu del navegador: Zoom > aumentar

### "El audio no funciona"
1. Activar el audio desde la pantalla: click en el botón de activar audio (primera vez)
2. Verificar que el volumen del TV no este silenciado
3. Aumentar el deslizador de TTS en pantalla
4. Reiniciar el navegador

### "Se congela o lentifica"
1. Recargar: `F5` o `Ctrl + R`
2. Cerrar otras apps abiertas (YouTube, etc.)
3. Configurar auto-refresh cada 1 hora (ver configuracion avanzada)

### "Se desconecta frecuentemente"
1. Usar Ethernet en lugar de WiFi
2. Acercar el TV al router si se usa WiFi
3. Cambiar a banda 5GHz si esta disponible

---

## Alternativas al Android TV

| Dispositivo | Costo aprox. | Recomendado |
|-------------|-------------|-------------|
| **Raspberry Pi 4** | $40-60 USD | Mejor opcion para uso 24/7 |
| Amazon Fire Stick | $30-40 USD | Buena alternativa |
| Laptop/Desktop via HDMI | Ya disponible | Facil pero mayor consumo |
| Chromecast | $30-50 USD | No ideal para uso permanente |

---

## Tips de Instalacion Fisica

**Ubicacion del TV**:
- Pared frontal de sala de espera, a altura de ojos (1.5–1.8m)
- Sin luz directa sobre la pantalla

**Tamano recomendado**:
- CAPS: 32–43 pulgadas
- Hospital seccional: 43–50 pulgadas
- Hospital grande: 55+ pulgadas

**Distancia de visualizacion**: 3–4 metros ideal (minimo 2m, maximo 6m)

**Audio**:
- Volumen al 30–40% en horario normal
- Reducirlo en horas pico o zonas de mucho ruido

**Mantenimiento**:
- Limpiar pantalla: 1x semana
- Reiniciar TV: programar apagado/encendido diario
- Verificar que muestre datos: 1x dia al comenzar el turno

---

## Checklist de Puesta en Marcha

- [ ] Pantalla creada en `/pantallas` y PIN anotado
- [ ] TV conectado a internet (preferentemente Ethernet)
- [ ] Chrome instalado y configurado con `https://turnero-zs.vercel.app/tv` como página de inicio
- [ ] PIN ingresado en el TV y pantalla visible
- [ ] Audio activado con el botón de la pantalla (requiere click/interacción una vez)
- [ ] Audio probado con un llamado de prueba
- [ ] Modo Kiosk configurado (si aplica)
- [ ] TV en ubicacion definitiva

---

## Referencias

- `IMPLEMENTACION-ACTUAL.md` — Sistema de cola (`daily_queue`)
- Gestion de pantallas: `/pantallas` (solo admin)
- Acceso TV por PIN: `https://turnero-zs.vercel.app/tv`
- Código fuente pantalla: `app/(public)/pantalla/[slug]/page.tsx`
- Código fuente PIN TV: `app/(public)/tv/page.tsx`
