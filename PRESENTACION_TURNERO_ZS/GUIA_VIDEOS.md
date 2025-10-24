# Guía Rápida para Grabar Videos de Demostración

## 📋 Checklist Pre-Grabación

- [ ] Tener usuarios de prueba listos (Admin, Médico, etc.)
- [ ] Bases de datos con datos de ejemplo
- [ ] Sistema en ambiente de desarrollo o producción estable
- [ ] OBS Studio o herramienta de grabación instalada
- [ ] Resolución: 1920x1080 (Full HD)
- [ ] Micrófono probado (si incluye narración)
- [ ] Pantalla limpia (sin notificaciones)

---

## 🎬 Videos a Grabar (En Orden de Presentación)

### Video 01: Flujo del Paciente Overview
**Duración**: 30-45 segundos
**Descripción**: Mostrar diagrama o animación del flujo

**Pasos**:
1. Mostrar diagrama: PENDIENTE → DISPONIBLE → LLAMADO → ATENDIDO
2. Explicar brevemente qué significa cada estado
3. Mostrar tiempos promedio de transición
4. Opcional: Usar herramienta de dibujo para señalar estados

**Tips**: Este video puede ser solo slides si no quieres grabar sistema

---

### Video 02: Login Admin
**Duración**: 20-30 segundos
**Descripción**: Ingreso con credenciales de administrador

**Datos de Ejemplo**:
```
Email: admin@turnero.test
Password: [Tu contraseña de prueba]
Institución: CAPS Centro
```

**Pasos**:
1. Abrir URL: http://localhost:3000
2. Ingresar email de admin
3. Ingresar password
4. Clic en "Iniciar Sesión"
5. Esperar carga
6. Pantalla de selección de institución aparece
7. Esperar 2 segundos de pausa
8. STOP

**Timing**:
- Escribir: 5 segundos
- Login: 3 segundos
- Carga: 5 segundos
- Pausa: 2 segundos

---

### Video 03: Login Usuario General
**Duración**: 20-30 segundos
**Descripción**: Ingreso con usuario de rol diferente

**Datos de Ejemplo**:
```
Email: medico@turnero.test
Password: [Tu contraseña de prueba]
Institución: Hospital Distrital
```

**Pasos**:
1. Logout primero
2. Ingresar email de médico
3. Ingresar password
4. Clic en "Iniciar Sesión"
5. Ver que el dashboard solo muestra su servicio
6. STOP

---

### Video 04: Dashboard Overview
**Duración**: 30-45 segundos
**Descripción**: Interfaz principal del sistema

**Pasos**:
1. Seleccionar institución (si es necesario)
2. Mostrar dashboard completo:
   - Header con información
   - Stats widgets (Total, Pendientes, Disponibles, etc.)
   - Filtros visibles
   - Cola de pacientes
3. Scroll down para mostrar más pacientes
4. Mostrar todos los elementos visibles
5. Scroll back to top
6. STOP

**Tips**:
- Hacer scroll suave
- Pausar 1 segundo en cada sección importante
- Mostrar widgets claramente

---

### Video 05: Cargar Paciente - Formulario
**Duración**: 20-30 segundos
**Descripción**: Abrir modal y llenar datos básicos

**Pasos**:
1. Clic en botón "+ Cargar Paciente"
2. Modal aparece (puede mostrar scroll)
3. Ingresar nombre: "Juan Pérez García"
4. Ingresar DNI: "12345678"
5. Mostrar campos rellenos
6. Scroll down en el modal para ver próxima sección
7. STOP

**Tips**:
- Escribir a velocidad normal (no muy rápido)
- Pausar 1 segundo después de llenar cada campo
- Mostrar validaciones si existen

---

### Video 06: Cargar Paciente - Servicios
**Duración**: 25-35 segundos
**Descripción**: Seleccionar servicios y profesionales

**Pasos**:
1. (Continuar desde video 05)
2. Ver lista de servicios (Cardiología, Pediatría, etc.)
3. Clic en checkbox "Cardiología"
4. Ver contador: "1 seleccionado"
5. Clic en checkbox "Pediatría"
6. Ver contador: "2 seleccionados"
7. Scroll down para ver profesionales asignados
8. Ver lista de profesionales con horarios
9. Clic en "Dr. Juan García - Consultorio A"
10. Ver contador: "3 seleccionados"
11. STOP

**Tips**:
- Hacer clics claros y visibles
- Pausar 1 segundo después de cada clic
- El contador debe ser bien visible

---

### Video 07: Toggle Estado Inicial (⭐ MUY IMPORTANTE)
**Duración**: 15-25 segundos
**Descripción**: Demostración del nuevo toggle

**Pasos**:
1. (Continuar desde video anterior)
2. Scroll down para ver toggle "Estado Inicial del Paciente"
3. **Mostrar toggle EN PENDIENTE (default, ámbar)**:
   - Leer la descripción: "Pendiente (requiere habilitación posterior)"
4. **Esperar 3 segundos para que lea bien**
5. **Clic en toggle para cambiar a DISPONIBLE (verde)**
6. **Mostrar descripción cambiada**: "Disponible (habilitado para atención inmediata)"
7. **Esperar 3 segundos**
8. **Volver a toggle a PENDIENTE**
9. STOP

**Tips**:
- ⭐ Este es el FEATURE NUEVO, hazlo notable
- Pausas largas para que vea bien el cambio
- Muestra claramente los colores (ámbar vs verde)
- Lee las descripciones en voz si haces narración
- Esta es la parte más importante de toda la demostración

---

### Video 08: Confirmar Carga
**Duración**: 10-20 segundos
**Descripción**: Clic en botón de envío

**Pasos**:
1. (Dejar toggle en PENDIENTE para esta demo)
2. Scroll down para ver botón "Cargar Paciente"
3. **Esperar 1 segundo**
4. **Clic en "Cargar Paciente"**
5. Ver que modal se cierra
6. Ver que paciente aparece en la cola
7. Ver estado "Pendiente" (ámbar)
8. STOP

**Tips**:
- El paciente debe aparecer inmediatamente (optimistic update)
- Debe verse claramente en la cola
- Mostrar hora de carga si es visible

---

### Video 09: Cola Pacientes Overview
**Duración**: 30-45 segundos
**Descripción**: Vista completa de la cola

**Pasos**:
1. Mostrar lista de pacientes completa
2. Señalar cada elemento visible:
   - Número de orden (001, 002, etc.)
   - Nombre del paciente
   - DNI
   - Estado (colores diferentes)
   - Servicio
   - Profesional
   - Hora de carga (con 🕐 icon)
3. Scroll down para mostrar más pacientes
4. Ver diferentes estados (Pendiente, Disponible, Llamado, etc.)
5. Scroll back to top
6. STOP

**Tips**:
- Scroll suave
- Pausar en cada paciente importante
- Muestra claramente los colores de estado
- El icono de reloj (hora) debe ser visible

---

### Video 10: Habilitar Paciente
**Duración**: 20-30 segundos
**Descripción**: Cambiar de Pendiente a Disponible

**Pasos**:
1. Buscar paciente en estado "Pendiente"
2. Ver que tiene botón "Habilitar" **activo** (color azul)
3. **Clic en "Habilitar"**
4. Ver animación/transición
5. Paciente cambia a "Disponible" (color verde)
6. Timestamp se actualiza
7. STOP

**Tips**:
- El botón debe estar claramente activado
- La transición debe ser clara
- Mostrar cambio de color bien visible
- Si hay animación, dejar que complete

---

### Video 11: Permiso Denegado
**Duración**: 15-25 segundos
**Descripción**: Mostrar control de permisos

**Pasos**:
1. Cargar un paciente como Admin A
2. Logout
3. Login como Admin B (o usuario diferente)
4. Ir a turnos
5. Buscar el paciente que cargó Admin A
6. Ver que botón "Habilitar" está **DESHABILITADO** (gris)
7. Ver icono 🔒 (candado) en el botón
8. Hover/Tooltip debe mostrar: "Solo el usuario que creó este paciente puede habilitarlo"
9. STOP

**Tips**:
- Muestra bien el botón deshabilitado vs habilitado
- El candado 🔒 debe ser visible
- Esto demuestra seguridad

---

### Video 12: Llamar Paciente (CON AUDIO TTS)
**Duración**: 25-40 segundos
**Descripción**: Llamada con audio en tiempo real

**Pasos**:
1. Buscar paciente en estado "Disponible" (verde)
2. Ver botón "Llamar" **activo**
3. **Clic en "Llamar"**
4. Ver animación de llamada (si la hay)
5. **ESCUCHAR AUDIO** (importante):
   ```
   "Paciente Juan Pérez García,
    dirígase al consultorio A"
   ```
6. Audio dura ~11 segundos (dos anuncios)
7. Ver que paciente cambia a "Llamado" (naranja/rojo)
8. Ver que botones cambian
9. Esperar a que termine audio
10. STOP

**Tips**:
- ⭐ INCLUYE EL AUDIO - Este es diferenciador
- Que se escuche claramente el TTS
- El video puede durar más porque incluye audio
- Mostrar animación durante todo el audio
- Importante: Deja que el audio complete

---

### Video 13: Registrar Atención
**Duración**: 15-25 segundos
**Descripción**: Marcar como atendido

**Pasos**:
1. Buscar paciente en estado "Llamado" (naranja)
2. Ver botón "Registrar Atención" **activo**
3. **Clic en "Registrar Atención"**
4. Ver que paciente cambia a "Atendido" (gris/completado)
5. Ver timestamps actualizados
6. Opcional: Ver que desaparece de la cola activa
7. STOP

**Tips**:
- Transición debe ser clara
- Mostrar que el paciente "desaparece" (completó su flujo)
- Los timestamps son importantes

---

### Video 14: Filtros Básicos
**Duración**: 20-30 segundos
**Descripción**: Uso individual de filtros

**Pasos**:
1. Mostrar área de filtros
2. Seleccionar filtro "Servicio"
3. Seleccionar "Cardiología"
4. Ver que cola se actualiza para mostrar solo Cardiología
5. Mostrar contador: "X pacientes" de Cardiología
6. Clic en dropdown "Estado"
7. Seleccionar "Disponible"
8. Ver que se agrega otro filtro
9. Mostrar resultados filtrados
10. Clic en "Limpiar filtros"
11. Ver que vuelve a mostrar todos
12. STOP

**Tips**:
- Pausar después de cada selección
- Mostrar cómo cambian los resultados
- El botón "Limpiar" debe ser visible

---

### Video 15: Filtros Múltiples
**Duración**: 20-30 segundos
**Descripción**: Combinación de filtros simultáneamente

**Pasos**:
1. Seleccionar Servicio = "Pediatría"
2. Seleccionar Profesional = "Dra. María García"
3. Seleccionar Estado = "Pendiente"
4. Ver que se aplican todos simultáneamente
5. Mostrar resultados (debe haber pocos)
6. Mostrar contador
7. Clic en "Limpiar filtros"
8. Ver que vuelve a todos
9. STOP

**Tips**:
- Combina al menos 3 filtros
- Muestra cómo se va reduciendo la lista
- El contador es importante

---

### Video 16: Pantalla Pública - Overview
**Duración**: 30-45 segundos
**Descripción**: Vista pública de la cola

**Pasos**:
1. Abrir nueva pestaña/ventana
2. Navegar a: `http://localhost:3000/pantalla/[institution-id]`
3. Esperar que cargue
4. Mostrar pantalla completa:
   - Diseño atractivo
   - Información clara del próximo paciente
   - Servicio y profesional
   - Consultorio
5. Scroll down para ver más (si hay scroll)
6. Mostrar que está en Full Screen (si aplica)
7. Responsive: ajustar tamaño si es posible
8. STOP

**Tips**:
- Muestra bien el diseño
- Pantalla debe verse limpia y clara
- Importante mostrar que NO REQUIERE LOGIN
- Información debe ser legible desde lejos (para TV)

---

### Video 17: Pantalla Realtime
**Duración**: 25-35 segundos
**Descripción**: Sincronización en tiempo real

**Setup Previo**:
- Abrir Pantalla Pública en una ventana
- Abrir Dashboard en otra ventana (lado a lado)
- Tener pacientes preparados

**Pasos**:
1. **Lado IZQUIERDO**: Mostrar Pantalla Pública (con cola vacía o pocos)
2. **Lado DERECHO**: Dashboard
3. Clic en "+ Cargar Paciente"
4. Llenar: Nombre, DNI, seleccionar servicio
5. **Clic en "Cargar Paciente"**
6. **INMEDIATAMENTE VER EN PANTALLA IZQUIERDA**: Paciente aparece
7. **ESPERAR 3 SEGUNDOS para que vea bien**
8. En Dashboard, clic en "Habilitar"
9. **VER EN PANTALLA que se actualiza a Disponible**
10. En Dashboard, clic en "Llamar"
11. **VER EN PANTALLA que cambia a Llamado**
12. STOP

**Tips**:
- ⭐ Este es el diferenciador REAL-TIME
- Side-by-side para que vea ambos cambios
- Los cambios deben ser instantáneos
- Esperar entre acciones para que vea el cambio

---

### Video 18: Roles y Permisos
**Duración**: 30-45 segundos
**Descripción**: Diferentes vistas por rol

**Datos Necesarios**:
- Admin account
- Médico account (con servicio asignado)
- Pantalla account

**Pasos**:
1. Login como Admin
   - Mostrar acceso completo a dashboard
   - Ver botones para cargar, habilitar, llamar
   - Ver TODOS los servicios
2. Logout
3. Login como Médico
   - Mostrar dashboard
   - Ver que solo muestra SU servicio
   - Si intenta acceder a otro servicio, no puede
4. Logout
5. Login como Pantalla
   - Mostrar que ve pantalla pública solamente
   - Sin botones de acción
6. STOP

**Tips**:
- Cambia de usuario claramente
- Muestra diferencias de UI/UX
- Explica brevemente cada rol

---

### Video 19: Información del Paciente
**Duración**: 15-25 segundos
**Descripción**: Detalles completos de un paciente

**Pasos**:
1. Mostrar tarjeta/card de un paciente
2. Señalar cada campo:
   - Nombre
   - DNI
   - Número de orden
   - Servicio
   - Profesional
   - Consultorio
   - Hora de carga (con 🕐 icon)
   - Estado
3. Opcional: Expandir si hay más información
4. Mostrar tiempos de transición si aplican
5. STOP

**Tips**:
- Pausas para que lea cada campo
- El reloj (🕐) debe ser bien visible
- Muestra que cada paciente tiene info completa

---

## 🎥 Herramientas Recomendadas

### Windows
- **OBS Studio** (Gratuito, recommended)
- **Bandicam** (Pago, muy bueno)
- **ScreenFlow Lite** (Gratuito)

### Mac
- **ScreenFlow** (Profesional)
- **OBS Studio** (Gratuito)

### Linux
- **OBS Studio** (Gratuito)
- **SimpleScreenRecorder** (Gratuito)

---

## 📹 Configuración Recomendada (OBS Studio)

### Resolución
- Resolution: 1920 x 1080
- FPS: 30

### Bitrate
- Bitrate: 6000 kbps (buena calidad sin ser muy pesado)
- Preset: Fast/Faster (para fluides)

### Codificación
- Encoder: Hardware (si tienes GPU)
- Fallback: x264 (software)

### Audio
- Micrófono: Enabled (si narras)
- Desktope Audio: Enabled (para capturar sonidos del sistema)

---

## 📝 Guion de Narración (Opcional)

Si quieres agregar narración, aquí hay ejemplos:

### Para Video 12 (Llamar Paciente):
```
"Cuando el paciente está disponible, el admin puede
hacer clic en el botón 'Llamar'. El sistema genera
automáticamente un anuncio en tiempo real en español
usando síntesis de voz, que anuncia el nombre del
paciente y el consultorio asignado. El audio se escucha
en la sala de espera, mejorando la experiencia del
paciente y asegurando que no pierda su turno."
```

### Para Video 17 (Realtime):
```
"Uno de los diferenciadores clave del sistema es la
sincronización en tiempo real. Cuando el admin carga
o actualiza un paciente en el dashboard, los cambios
se reflejan instantáneamente en la pantalla pública,
sin necesidad de recargar. Esto es posible gracias a
Supabase Realtime, que mantiene todas las pantallas
sincronizadas automáticamente."
```

### Para Video 07 (Toggle):
```
"La nueva funcionalidad de toggle permite elegir el
estado inicial del paciente. Por defecto, los pacientes
se cargan en estado 'Pendiente', requiriendo una
habilitación posterior. Pero si activas el toggle,
puedes cargarlos directamente en estado 'Disponible',
listos para ser llamados. Esto da flexibilidad al
flujo de trabajo según las necesidades del centro."
```

---

## ✅ Checklist Post-Grabación

Por cada video:
- [ ] Revisado para errores/glitches
- [ ] Audio claro (si aplica)
- [ ] Duración dentro del rango
- [ ] Exportado en MP4 (H.264)
- [ ] Nombrado correctamente (01-video-name.mp4)
- [ ] Backup realizado

Final:
- [ ] Todos los 19 videos listos
- [ ] Total duración: 7-8 minutos
- [ ] Carpeta dedicada: `/videos_demo`
- [ ] PowerPoint actualizada con referencias a videos
- [ ] Probados en PowerPoint

---

## 🎬 Orden de Grabación Sugerido

No necesariamente grabar en orden. Sugiero este orden para eficiencia:

1. **Primero (Preparación)**:
   - Video 01: Flujo (solo slides)
   - Video 04: Dashboard (muestra sistema limpio)

2. **Segundo (Login)**:
   - Video 02: Login Admin
   - Video 03: Login General
   - Video 18: Roles y Permisos

3. **Tercero (Cargar Paciente)**:
   - Video 05: Form
   - Video 06: Servicios
   - Video 07: Toggle (⭐ IMPORTANTE)
   - Video 08: Submit

4. **Cuarto (Gestionar Pacientes)**:
   - Video 09: Cola Overview
   - Video 10: Habilitar
   - Video 11: Permiso Denegado
   - Video 13: Registrar Atención

5. **Quinto (Llamada - Audio)**:
   - Video 12: Llamar (importante: con audio)

6. **Sexto (Filtros)**:
   - Video 14: Filtros Básicos
   - Video 15: Filtros Múltiples

7. **Séptimo (Pantalla Pública)**:
   - Video 16: Overview
   - Video 17: Realtime (⭐ IMPORTANTE - requiere 2 ventanas)

8. **Último (Detalles)**:
   - Video 19: Info Paciente

---

## 💡 Tips Finales

1. **Repite grabaciones**: Graba 2-3 veces cada video, selecciona el mejor
2. **Pequeñas paradas**: Pausa 2-3 segundos entre acciones grandes
3. **Sin errores**: Si cometes error, detén, reinicia la sección
4. **Audio importante**: Los videos con audio TTS son especiales
5. **Sincronización (Video 17)**: Es el más complejo, practica primero
6. **Backup**: Guarda copias en múltiples ubicaciones
7. **Subtítulos**: Considera agregar subtítulos en edición (OBS tiene plugins)
8. **Zoom de pantalla**: Si ves borroso en videos, ajusta zoom del navegador

---

## 📞 Soporte

Si tienes problemas:
- **OBS no captura audio**: Verifica en Settings > Audio que Desktop Audio esté enabled
- **Video borroso**: Asegúrate que resolución sea 1920x1080
- **Audio muy bajo**: Ajusta niveles en OBS (Audio Mixer)
- **Archivo muy grande**: Reduce bitrate a 4000-5000 kbps

¡Mucho éxito con las grabaciones! 🎬📹
