# Guía: Usar Android TV como Pantalla Pública en Turnero ZS

**Versión**: 2.0
**Última actualización**: 2026-03-06
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
- Acceso al admin de Turnero ZS para obtener la URL de pantalla

---

## Pasos de Configuración

### Paso 1: Crear la Pantalla en el Sistema

**En Turnero ZS (como admin de la institución)**:

1. Ir a `https://turnero-zs.vercel.app` e iniciar sesión
2. Navegar a **Pantallas** (`/pantallas`)
3. Crear una nueva pantalla:
   - Nombre: Ej. `Sala de Espera Principal`
   - Modo: `Todos` (muestra todo) / `Incluir` / `Excluir` (para filtrar servicios o consultorios)
4. Copiar la **URL de la pantalla** generada

> La URL tiene el formato: `https://turnero-zs.vercel.app/pantalla/[token-uuid]`
> Esta URL es pública — quien la tenga puede ver la pantalla sin necesidad de login.

---

### Paso 2: Conectar TV a Internet

1. En el TV, abrí **Configuración > Red**
2. Conectá a tu red WiFi o Ethernet
3. Verificá la conexión abriendo YouTube u otra app

---

### Paso 3: Abrir la Pantalla en el TV

1. Abrí **Chrome** en el TV
2. Ingresá la URL copiada en el Paso 1:
   `https://turnero-zs.vercel.app/pantalla/[token-uuid]`
3. La pantalla de turnos se abrirá directamente — **no requiere login**
4. Presioná **F11** o el botón de pantalla completa del navegador

> El nombre de la pantalla configurada aparece en el encabezado como referencia.

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
- Cuando se llama a un paciente, se anuncia en voz: *"Paciente [nombre], [servicio/consultorio]"*

---

## Configuración Avanzada

### Modo Kiosk (Recomendado para instalación fija)

Para que el TV muestre **solo la pantalla de turnos**:

1. Instalá una app de Kiosk desde Google Play (ej: **Kiosk Mode Lockdown**)
2. Configurá la URL:
   `https://turnero-zs.vercel.app/pantalla/[token-uuid]`
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

**La URL del token es publica** — quien la tenga puede ver la pantalla.
Tratala como una URL interna: no la publiques en redes sociales.

Buenas practicas:
- Usar Ethernet en lugar de WiFi (mas estable y seguro)
- Modo Kiosk para evitar accesos no autorizados al TV
- Si la URL se compromete: borrar la pantalla y crear una nueva en `/pantallas` (genera token nuevo)

**La pantalla solo muestra**: nombre del paciente, numero de orden, servicio/consultorio.
**No muestra**: DNI, telefono, historia clinica ni datos sensibles.

---

## Troubleshooting

### "No carga la pagina"
1. Verificar internet: abrir YouTube en el TV
2. Confirmar que la URL del token sea correcta (copiarla de nuevo desde `/pantallas`)
3. Limpiar cache: `Ctrl + Shift + Del`
4. Reiniciar el TV

### "La pagina se ve muy pequena"
1. `Ctrl + +` para hacer zoom
2. O desde el menu del navegador: Zoom > aumentar

### "El audio no funciona"
1. Verificar que el volumen del TV no este silenciado
2. Aumentar el deslizador de TTS en pantalla
3. Reiniciar el navegador

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

- [ ] Pantalla creada en `/pantallas` y URL copiada
- [ ] TV conectado a internet (preferentemente Ethernet)
- [ ] Chrome instalado y URL cargada
- [ ] Pantalla completa activada (F11)
- [ ] Audio probado con un llamado de prueba
- [ ] Modo Kiosk configurado (si aplica)
- [ ] TV en ubicacion definitiva

---

## Referencias

- `IMPLEMENTACION-ACTUAL.md` — Sistema de cola (`daily_queue`)
- Gestion de pantallas: `/pantallas` (solo admin)
- Codigo fuente: `app/(public)/pantalla/[slug]/page.tsx`
