# 📊 PRESENTACIÓN TURNERO ZS - ÍNDICE

## 🎯 Bienvenida

Aquí encontrarás **TODO** lo que necesitas para presentar **Turnero ZS** - Sistema de Gestión de Turnos para Centros de Salud Argentinos.

---

## 📁 Estructura de Carpeta

```
PRESENTACION_TURNERO_ZS/
├── INDEX.md (este archivo)
│
├── 📊 ARCHIVOS PRINCIPALES
│   ├── Turnero_ZS_Presentacion.pptx      ⭐ LA PRESENTACIÓN
│   ├── PRESENTACION.md                   Contenido de cada slide
│   ├── GUIA_VIDEOS.md                    Cómo grabar cada video
│   ├── RESUMEN_PRESENTACION.md           Guía ejecutiva completa
│   └── README_PRESENTACION.txt           Resumen rápido
│
├── 🐍 SCRIPTS HELPER
│   ├── create_presentation.py            Generador de PowerPoint
│   └── insert_videos_pptx.py             Inserta videos automáticamente
│
├── 📹 videos_demo/                       Carpeta para 19 videos MP4
│   ├── 01-flujo-paciente-overview.mp4
│   ├── 02-login-admin.mp4
│   ├── ... (ver GUIA_VIDEOS.md)
│   └── 19-info-paciente.mp4
│
├── 🎨 archivos_edicion/                  Recursos para editar videos
│   ├── Intro.mp4 (opcional)
│   ├── Outro.mp4 (opcional)
│   ├── Subtitulos.vtt (opcional)
│   └── [Otros assets para edicion]
│
├── 📝 notas_presentador/                 Notas para cada slide
│   ├── notas_slides_1-10.txt
│   ├── notas_slides_11-20.txt
│   └── notas_slides_21-27.txt
│
└── 🎭 assets/                            Logos, imagenes, recursos
    ├── logo-institucion.png (agregar tuyo)
    ├── logo-turnero-zs.png
    └── [Otros assets visuales]
```

---

## 🚀 COMIENZA AQUÍ

### Paso 1: Abre la Presentación (2 minutos)
```
1. Abre: Turnero_ZS_Presentacion.pptx
2. Personaliza portada con tu institución
3. Revisa la estructura (27 slides)
```

### Paso 2: Lee la Guía de Contenido (15 minutos)
```
1. Lee: PRESENTACION.md
2. Entiende cada slide y puntos clave
3. Familiarízate con la estructura
```

### Paso 3: Aprende a Grabar Videos (30 minutos) 
```
1. Lee: GUIA_VIDEOS.md completamente
2. Instala OBS Studio (gratuito)
3. Prepara datos de prueba (usuarios, pacientes)
```

### Paso 4: Graba los 19 Videos (3-5 horas)
```
1. Sigue GUIA_VIDEOS.md paso-a-paso
2. Graba en carpeta: videos_demo/
3. Prioridad: Videos 07, 12, 17
```

### Paso 5: Integra Videos (30 minutos)
```
1. Opción A: Insert → Video en PowerPoint
2. Opción B: python3 insert_videos_pptx.py
```

### Paso 6: Practica Presentación (30-45 minutos)
```
1. Repasa presentación completa
2. Prueba reproducción de videos
3. Practica timing (15-20 min total)
4. Ajusta según feedback
```

### Paso 7: Presenta (20 minutos)
```
1. Llega 30 min antes
2. Prueba técnica completa
3. ¡Presenta con confianza!
```

---

## 📚 ARCHIVOS Y SUS PROPÓSITOS

### 🎬 Turnero_ZS_Presentacion.pptx
**¿QUÉ ES?** Tu presentación PowerPoint profesional
**¿CUÁNDO ABRIR?** Inmediatamente
**¿QUÉ TIENE?** 27 slides listos para usar
**¿QUÉ HACER?**
- Personaliza portada
- Revisa contenido
- Agrega logos
- Inserta videos cuando estén listos

---

### 📖 PRESENTACION.md
**¿QUÉ ES?** Guía detallada de contenido
**¿CUÁNDO LEER?** Después de abrir PowerPoint
**¿QUÉ TIENE?**
- Slide-by-slide breakdown
- Puntos clave para cada slide
- Qué videos van en cada slide
- Notas de presentador

**¿CUÁNDO USAR?**
- Para preparar notas
- Para entender la estructura
- Para saber qué decir

---

### 🎥 GUIA_VIDEOS.md
**¿QUÉ ES?** Tutorial completo para grabar videos
**¿CUÁNDO LEER?** Antes de grabar cualquier video
**¿QUÉ TIENE?**
- 19 videos con instrucciones paso-a-paso
- Duración de cada video
- Qué mostrar en cada uno
- Herramientas recomendadas
- Configuración de OBS
- Tips profesionales

**¿CUÁNDO USAR?**
- Checklist antes de grabar
- Referencia durante grabación
- Para resolver problemas técnicos

---

### 📋 RESUMEN_PRESENTACION.md
**¿QUÉ ES?** Guía ejecutiva completa
**¿CUÁNDO LEER?** Para overview completo
**¿QUÉ TIENE?**
- Estructura de presentación
- Checklist de tareas
- Consejos clave
- Timeline sugerido
- FAQ con respuestas

---

### 📝 README_PRESENTACION.txt
**¿QUÉ ES?** Resumen rápido en texto plano
**¿CUÁNDO USAR?** Para repaso rápido
**¿QUÉ TIENE?** Información esencial compactada

---

### 🐍 create_presentation.py
**¿QUÉ ES?** Script que generó el PowerPoint
**¿CUÁNDO USAR?** Si quieres regenerar o modificar
**¿CÓMO?** `python3 create_presentation.py`

---

### 🐍 insert_videos_pptx.py
**¿QUÉ ES?** Script que inserta videos automáticamente
**¿CUÁNDO USAR?** Cuando tengas los 19 videos listos
**¿CÓMO?** `python3 insert_videos_pptx.py`

---

## 📹 CARPETA: videos_demo/

**¿QUÉ VA AQUÍ?** Los 19 videos MP4 que grabes

**Archivos esperados:**
```
01-flujo-paciente-overview.mp4          30-45s
02-login-admin.mp4                      20-30s
03-login-usuario-general.mp4            20-30s
04-dashboard-overview.mp4               30-45s
05-cargar-paciente-form.mp4             20-30s
06-cargar-paciente-servicios.mp4        25-35s
07-cargar-paciente-toggle.mp4           15-25s ⭐
08-cargar-paciente-submit.mp4           10-20s
09-cola-pacientes-overview.mp4          30-45s
10-habilitar-paciente.mp4               20-30s
11-permiso-denegado.mp4                 15-25s
12-llamar-paciente.mp4                  25-40s ⭐ (CON AUDIO)
13-registrar-atencion.mp4               15-25s
14-filtros-basicos.mp4                  20-30s
15-filtros-multiples.mp4                20-30s
16-pantalla-publica-overview.mp4        30-45s
17-pantalla-realtime.mp4                25-35s ⭐ (REALTIME)
18-roles-y-permisos.mp4                 30-45s
19-info-paciente.mp4                    15-25s
```

**Total: 7-8 minutos de video**

---

## 🎨 CARPETA: archivos_edicion/

**¿QUÉ VA AQUÍ?** Recursos para editar videos (opcional)

**Ejemplos:**
- Intro.mp4 - Clip de introducción
- Outro.mp4 - Clip de cierre
- Subtitulos.vtt - Subtítulos para videos
- Overlays.png - Gráficos para pantalla

**¿ES OBLIGATORIO?** No, pero mejora calidad

---

## 📝 CARPETA: notas_presentador/

**¿QUÉ VA AQUÍ?** Tus notas personales

**Crear archivos como:**
```
notas_slides_1-10.txt
notas_slides_11-20.txt
notas_slides_21-27.txt
```

**Qué incluir:**
- Puntos clave
- Historias/ejemplos
- Preguntas frecuentes
- Timing

---

## 🎭 CARPETA: assets/

**¿QUÉ VA AQUÍ?** Logos, imágenes, recursos visuales

**Ejemplos:**
```
logo-institucion.png       (AGREGAR TUYO)
logo-turnero-zs.png
colores-corporativos.txt
tipografias.txt
```

---

## ⭐ 3 VIDEOS CRÍTICOS

### Video 07: Toggle Estado Inicial
- **Duración**: 15-25 segundos
- **Qué mostrar**:
  - Toggle en "Pendiente" (ámbar)
  - Toggle en "Disponible" (verde)
  - Cambio dinámico
- **Por qué es importante**: Es tu FEATURE NUEVA
- **Tips**: Pausa 3 segundos en cada estado

### Video 12: Llamar Paciente CON AUDIO
- **Duración**: 25-40 segundos
- **Qué mostrar**:
  - Clic en botón "Llamar"
  - Audio TTS anunciando nombre y consultorio
  - ~11 segundos de audio
- **Por qué es importante**: Diferenciador técnico
- **Tips**: Deja que se escuche COMPLETO el audio

### Video 17: Sincronización Realtime
- **Duración**: 25-35 segundos
- **Qué mostrar**:
  - Side-by-side: Pantalla Pública + Dashboard
  - Cargar paciente → Aparece instantáneamente
  - Cambiar estado → Se refleja en tiempo real
- **Por qué es importante**: Diferenciador técnico clave
- **Tips**: Practica primero, muestra cambios claros

---

## 📅 TIMELINE RECOMENDADO

| Día | Actividad | Tiempo |
|-----|-----------|--------|
| 1 | Abre PPT + Lee guías | 1 hora |
| 2 | Aprende OBS + Setup | 1 hora |
| 3-4 | Graba videos 1-10 | 2-3 horas |
| 5-6 | Graba videos 11-19 | 2-3 horas |
| 7 | Integra + Practica | 1-2 horas |
| Día Presentación | Presentación + Q&A | 20-30 min |

**Total**: 5-7 días, ~8-12 horas

---

## ✅ CHECKLIST FINAL

### Antes de Grabar Videos
- [ ] OBS Studio instalado
- [ ] Resolución 1920x1080 configurada
- [ ] Usuarios de prueba preparados
- [ ] Datos de demo listos
- [ ] Micrófono probado
- [ ] Pantalla sin distracciones

### Antes de Integrar Videos
- [ ] 19 videos grabados
- [ ] Nombres correctos (01-..., 02-..., etc.)
- [ ] Formato MP4 H.264
- [ ] Videos en carpeta videos_demo/
- [ ] Respaldo en USB + cloud

### Antes de Presentar
- [ ] Videos integrados en PowerPoint
- [ ] Prueba de reproducción completa
- [ ] Audio funciona (especialmente video 12)
- [ ] Timing total: 15-20 minutos
- [ ] Presentación practicada 2+ veces
- [ ] Backup en múltiples dispositivos

---

## 🎬 HERRAMIENTAS NECESARIAS

**Para grabar videos:**
- ✅ OBS Studio (GRATUITO - RECOMENDADO)
- Bandicam
- Screenflow (Mac)

**Para editar (opcional):**
- DaVinci Resolve (Gratuito)
- Adobe Premiere
- Final Cut Pro

**Para presentar:**
- PowerPoint (o LibreOffice Impress)
- Proyector
- Control remoto

---

## 💡 CONSEJOS FINALES

### Para PowerPoint
1. Personaliza con tu institución
2. Agrega tu logo
3. Usa colores corporativos
4. Revisa ortografía
5. Practica mínimo 2 veces

### Para Videos
1. Graba en 1920x1080
2. Escribe a velocidad normal
3. Pausa entre acciones
4. Si hay error, regrabba
5. Backup en múltiples lugares

### Para Presentación
1. Llega 30 min antes
2. Prueba proyector + audio
3. Ten backup (USB + cloud)
4. Mantén calma y energía
5. Disfruta el proceso

---

## 📞 REFERENCIA RÁPIDA

| Necesito... | Abro... | Para... |
|------------|---------|---------|
| La presentación | Turnero_ZS_Presentacion.pptx | Presentar |
| Saber qué decir | PRESENTACION.md | Notas |
| Grabar videos | GUIA_VIDEOS.md | Instrucciones |
| Resumen completo | RESUMEN_PRESENTACION.md | Overview |
| Referencia rápida | README_PRESENTACION.txt | Repaso |
| Insertar videos | insert_videos_pptx.py | Automatizar |

---

## 🎯 ORDEN SUGERIDO DE LECTURA

1. **Este archivo** (INDEX.md) - 5 minutos
2. **README_PRESENTACION.txt** - 5 minutos (resumen rápido)
3. **Abre Turnero_ZS_Presentacion.pptx** - 10 minutos (familiarizarse)
4. **PRESENTACION.md** - 20 minutos (entender contenido)
5. **GUIA_VIDEOS.md** - 30 minutos (antes de grabar)

**Total lectura**: ~70 minutos antes de empezar a grabar

---

## 🚀 ESTÁS LISTO

Tienes **TODOS** los recursos que necesitas:

✅ Presentación profesional (27 slides)
✅ Guía completa de contenido
✅ Tutorial paso-a-paso para videos
✅ Scripts helper
✅ Carpetas organizadas
✅ Checklist y timeline

**Próximo paso**: Abre `Turnero_ZS_Presentacion.pptx` y comienza.

---

## 📧 Soporte

Si necesitas ayuda:
1. Revisa las guías (PRESENTACION.md, GUIA_VIDEOS.md)
2. Consulta el FAQ en RESUMEN_PRESENTACION.md
3. Revisa tips en GUIA_VIDEOS.md

---

**¡Mucho éxito en tu presentación! 🚀**

*Hecho con Claude Code*
