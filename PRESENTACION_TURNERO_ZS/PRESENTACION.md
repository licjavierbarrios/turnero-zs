# Presentación del Proyecto Turnero ZS

## 📊 Estructura de Presentación PowerPoint

### Slide 1: Portada
- **Título**: Turnero ZS - Sistema de Gestión de Turnos
- **Subtítulo**: Solución integral para centros de salud argentinos (CAPS/Hospitales)
- **Logo/Imagen**: Brandeo del proyecto
- **Información**: Empresa/Instituto
- **Fecha de presentación**

---

### Slide 2: Problema y Contexto
- **Problema**:
  - Demoras prolongadas en atención a pacientes
  - Desorganización en las colas de espera
  - Información fragmentada entre sistemas
  - Falta de visibilidad en tiempo real

- **Contexto**: Sistema de salud argentino (inspirado en HSI)
- **Objetivo**: Reducir tiempos de espera y mejorar experiencia del paciente

**Video Recomendado**: OPCIONAL (screenshot de situación actual si aplica)

---

### Slide 3: Solución - Características Principales
- ✅ Gestión de turnos en tiempo real
- ✅ Cola de pacientes diaria con múltiples estados
- ✅ Pantalla pública de avance
- ✅ Control de profesionales y consultorios
- ✅ Sistema de roles y permisos
- ✅ Múltiples instituciones en una plataforma
- ✅ Toggle para cargar pacientes habilitados o pendientes

**Video**: N/A (slides informativos)

---

### Slide 4: Arquitectura del Sistema
```
┌─────────────────────────────────────────────────┐
│              Turnero ZS Platform                │
├─────────────────────────────────────────────────┤
│                                                 │
│  Frontend (Next.js 15)  │  Backend (Supabase)  │
│  ├─ Dashboard Admin    │  ├─ PostgreSQL       │
│  ├─ Pantalla Pública   │  ├─ Auth             │
│  └─ Gestión Turnos    │  ├─ Realtime         │
│                        │  └─ RLS              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Video**: N/A (arquitectura)

---

### Slide 5: Flujo del Paciente en el Sistema
```
PENDIENTE → DISPONIBLE → LLAMADO → ATENDIDO
   (Pendiente)  (Habilitado)  (En consulta)  (Completado)
```

- **Pendiente**: Paciente registrado, requiere habilitación
- **Disponible**: Paciente habilitado, listo para ser llamado
- **Llamado**: Paciente siendo llamado (con audio)
- **Atendido**: Consulta completada

**Videos Necesarios**:
1. `01-flujo-paciente-overview.mp4` (30-45 seg)

---

### Slide 6: Demo 1 - Login y Autenticación
**Descripción**:
- Admin ingresa con sus credenciales
- Sistema reconoce múltiples instituciones asignadas
- Selecciona institución de trabajo
- Accede al dashboard

**Subtemas**:
- Autenticación segura (Supabase Auth)
- Detección automática de rol
- Routing inteligente según perfil

**Videos Necesarios**:
1. `02-login-admin.mp4` (20-30 seg)
   - Ingresar email y password
   - Ver pantalla de selección de institución
   - Seleccionar institución
   - Acceder al dashboard

2. `03-login-usuario-general.mp4` (20-30 seg)
   - Login de usuario con rol diferente (médico/administrativo)
   - Redirección automática

---

### Slide 7: Demo 2 - Dashboard Principal
**Descripción**:
- Interfaz principal del sistema
- Widgets de información
- Filtros y búsqueda
- Estadísticas en tiempo real

**Subtemas**:
- Vista general de la cola
- Cantidad de pacientes por estado
- Indicadores de performance

**Videos Necesarios**:
1. `04-dashboard-overview.mp4` (30-45 seg)
   - Mostrar dashboard completo
   - Estadísticas (total, pendientes, disponibles, llamados, atendidos)
   - Layout responsivo
   - Elementos visibles

---

### Slide 8: Demo 3 - Cargar Nuevo Paciente (Parte 1)
**Descripción**:
- Abrir diálogo "Cargar Nuevo Paciente"
- Ingresar datos del paciente
- Interfaz intuitiva y clara

**Subtemas**:
- Formulario con validación
- Inputs para nombre y DNI
- Búsqueda inteligente

**Videos Necesarios**:
1. `05-cargar-paciente-form.mp4` (20-30 seg)
   - Clic en botón "Cargar Paciente"
   - Mostrar modal abierto
   - Ingresar nombre completo
   - Ingresar DNI
   - Mostrar validaciones

---

### Slide 9: Demo 4 - Cargar Nuevo Paciente (Parte 2)
**Descripción**:
- Seleccionar servicios/profesionales
- Toggle para estado inicial
- Confirmar carga

**Subtemas**:
- Selección múltiple de servicios
- Toggle Pendiente/Disponible (NUEVA FEATURE)
- Visualización clara de opciones

**Videos Necesarios**:
1. `06-cargar-paciente-servicios.mp4` (25-35 seg)
   - Seleccionar servicios (checkboxes)
   - Mostrar contador de seleccionados
   - Desplegar profesionales asignados
   - Seleccionar profesionales

2. `07-cargar-paciente-toggle.mp4` (15-25 seg)
   - Mostrar toggle "Estado Inicial del Paciente"
   - Dejar en "Pendiente" (defecto)
   - Cambiar a "Disponible"
   - Mostrar descripciones dinámicas
   - Explicar diferencia

3. `08-cargar-paciente-submit.mp4` (10-20 seg)
   - Clic en "Cargar Paciente"
   - Ver modal scroll si hay muchos elementos
   - Confirmación de carga
   - Paciente aparece en la cola

---

### Slide 10: Demo 5 - Gestión de Pacientes en Cola (Parte 1)
**Descripción**:
- Vista de la cola de pacientes
- Estados visuales con colores
- Información de cada paciente

**Subtemas**:
- Tarjetas de pacientes
- Código de colores por estado
- Información del profesional y consultorio

**Videos Necesarios**:
1. `09-cola-pacientes-overview.mp4` (30-45 seg)
   - Mostrar lista de pacientes en cola
   - Diferentes estados (colores)
   - Información visible (orden, paciente, servicio, hora)
   - Scroll en la lista

---

### Slide 11: Demo 6 - Habilitar Paciente (Permiso de Creador)
**Descripción**:
- Solo el admin que cargó el paciente puede habilitarlo
- Validación de permisos
- Cambio de estado pendiente → disponible

**Subtemas**:
- Control de permisos (creador)
- Icono de candado para usuarios sin permiso
- Transición de estados

**Videos Necesarios**:
1. `10-habilitar-paciente.mp4` (20-30 seg)
   - Mostrar paciente en estado "Pendiente"
   - Admin que lo creó puede ver botón "Habilitar"
   - Clic en "Habilitar"
   - Paciente cambia a "Disponible"
   - Mostrar feedback visual

2. `11-permiso-denegado.mp4` (15-25 seg)
   - Mostrar paciente cargado por otro usuario
   - El usuario actual VE botón deshabilitado (con 🔒)
   - Explicar que solo el creador puede habilitar

---

### Slide 12: Demo 7 - Llamar Paciente
**Descripción**:
- Seleccionar paciente disponible
- Sistema de llamada con audio
- Cambio de estado a "Llamado"

**Subtemas**:
- Botón "Llamar" en paciente disponible
- Audio TTS (Text-to-Speech) en español
- Confirmación visual
- Duración: ~5-10 segundos

**Videos Necesarios**:
1. `12-llamar-paciente.mp4` (25-40 seg)
   - Mostrar paciente en estado "Disponible"
   - Clic en botón "Llamar"
   - Ver animación de llamada
   - Escuchar audio de llamada (opcional o con subtítulos)
   - Mostrar cambio a estado "Llamado"
   - Mostrar profesional/consultorio asignado
   - Duración del audio: ~11 segundos

---

### Slide 13: Demo 8 - Registrar Atención
**Descripción**:
- Paciente ya fue llamado
- Cambiar a "Atendido" cuando termina la consulta
- Registrar tiempo de atención

**Subtemas**:
- Botón "Registrar Atención"
- Timestamp automático
- Finalización del flujo

**Videos Necesarios**:
1. `13-registrar-atencion.mp4` (15-25 seg)
   - Mostrar paciente en estado "Llamado"
   - Clic en botón "Registrar Atención"
   - Cambio a estado "Atendido"
   - Mostrar información de timestamps
   - Paciente desaparece de cola activa

---

### Slide 14: Demo 9 - Filtros Avanzados
**Descripción**:
- Filtrar cola por múltiples criterios
- Búsqueda por servicio, profesional, consultorio, estado
- Combinación de filtros

**Subtemas**:
- Dropdowns de filtro
- Limpiar filtros
- Resultados dinámicos

**Videos Necesarios**:
1. `14-filtros-basicos.mp4` (20-30 seg)
   - Mostrar opciones de filtro
   - Filtrar por servicio (ej: Cardiología)
   - Mostrar resultados filtrados
   - Limpiar filtro

2. `15-filtros-multiples.mp4` (20-30 seg)
   - Aplicar múltiples filtros simultáneamente
   - Filtro servicio + profesional
   - Filtro servicio + estado
   - Mostrar cantidad de resultados
   - Limpiar todos

---

### Slide 15: Demo 10 - Pantalla Pública
**Descripción**:
- Pantalla de espera para pacientes
- Información en tiempo real
- Actualización automática
- Acceso solo con rol "pantalla"

**Subtemas**:
- Vista pública de cola
- Número de turno destacado
- Información del profesional/consultorio
- Tema visual atractivo

**Videos Necesarios**:
1. `16-pantalla-publica-overview.mp4` (30-45 seg)
   - Navegación a pantalla pública (URL)
   - Mostrar diseño de pantalla
   - Información visible (orden, servicio, prof)
   - Responsive design
   - Login como usuario "pantalla"

2. `17-pantalla-realtime.mp4` (25-35 seg)
   - Cargar paciente en dashboard
   - Ver actualización en tiempo real en pantalla pública
   - Cambiar estado en dashboard
   - Ver cambio reflejado inmediatamente en pantalla
   - Sincronización Supabase Realtime

---

### Slide 16: Demo 11 - Gestión de Permisos y Roles
**Descripción**:
- Sistema de roles (admin, administrativo, médico, enfermería, pantalla)
- Diferentes permisos por rol
- Control de acceso

**Subtemas**:
- Rol Admin: acceso completo
- Rol Administrativo: cargar pacientes
- Rol Médico: ver y atender solo sus pacientes
- Rol Pantalla: solo lectura de cola
- Rol Enfermería: auxiliar administrativo

**Videos Necesarios**:
1. `18-roles-y-permisos.mp4` (30-45 seg)
   - Login como Admin (acceso completo)
   - Logout y login como Médico
   - Mostrar acceso limitado a sus servicios
   - Logout y login como Pantalla
   - Mostrar pantalla pública solo
   - Explicar diferencias de permisos

---

### Slide 17: Demo 12 - Información Adicional de Paciente
**Descripción**:
- Información completa del paciente
- Hora de creación
- Tiempos de cada estado
- Profesional asignado

**Subtemas**:
- DNI del paciente
- Hora de carga (con clock icon)
- Servicio seleccionado
- Profesional y consultorio
- Timestamps de cada transición

**Videos Necesarios**:
1. `19-info-paciente.mp4` (15-25 seg)
   - Mostrar tarjeta de paciente expandida
   - Información visible (nombre, DNI, hora)
   - Mostrar profesional y consultorio
   - Explicar cada campo

---

### Slide 18: Características Técnicas
**Stack Tecnológico**:
- **Frontend**: Next.js 15.5.2 + React + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui 3
- **Backend**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Tiempo Real**: Supabase Realtime Channels
- **Almacenamiento**: Supabase Storage (audio)
- **Testing**: Vitest + React Testing Library
- **CI/CD**: GitHub Actions

**Video**: N/A (slides técnicos)

---

### Slide 19: Métricas y Resultados
**Objetivos del MVP**:
- ✅ Reducir tiempo de espera en 25-40%
- ✅ Disminuir absentismo en 10-20%
- ✅ Alcanzar ≥85% ocupación de horarios
- ✅ Mantener ≥95% trazabilidad completa

**Características Logradas**:
- ✅ Gestión de cola diaria en tiempo real
- ✅ Sistema de llamada con audio TTS
- ✅ Pantalla pública con sincronización realtime
- ✅ Control de permisos basado en roles
- ✅ Toggle para estado inicial de pacientes
- ✅ Múltiples instituciones
- ✅ Tests automatizados (152 tests)
- ✅ Sin errores de typecheck/lint

**Video**: N/A (estadísticas)

---

### Slide 20: Ventajas Competitivas
- 🚀 Sistema integrado (no requiere cambios en HSI)
- ⚡ Tiempo real (sin recargas)
- 📱 Responsive (desktop, tablet, mobile)
- 🔒 Seguro (RLS, autenticación)
- 🌐 Multi-tenancy (múltiples instituciones)
- ♿ Accesible
- 📊 Escalable (PostgreSQL + Supabase)
- 🎯 Intuitivo (UI clara y lógica)

**Video**: N/A (ventajas)

---

### Slide 21: Roadmap Futuro
**Corto Plazo (1-2 meses)**:
- [ ] Integración con HSI para importar pacientes
- [ ] Estadísticas avanzadas y reportes
- [ ] Notificaciones push para profesionales

**Mediano Plazo (3-6 meses)**:
- [ ] App móvil para pacientes (estado del turno)
- [ ] Confirmación automática de turnos por SMS
- [ ] Asignación automática de profesionales

**Largo Plazo (6+ meses)**:
- [ ] Predicción de demora (ML)
- [ ] Gestor de camas (para hospitales)
- [ ] Integración con sistemas de emergencia

**Video**: N/A (roadmap)

---

### Slide 22: Conclusión y Llamada a la Acción
- **Resumen**: Sistema completo de gestión de turnos
- **Impacto**: Mejor experiencia para pacientes y profesionales
- **Próximos Pasos**:
  - Feedback en instituciones piloto
  - Refinamiento según necesidades
  - Rollout a más instituciones

- **Contacto**: [Tu email/teléfono]
- **Link Demo**: [URL del sistema en producción]
- **GitHub**: github.com/licjavierbarrios/turnero-zs

**Video**: N/A (cierre)

---

## 📹 Lista Completa de Videos Necesarios

### Duración Total Recomendada: 8-10 minutos

| # | Video | Duración | Descripción |
|---|-------|----------|-------------|
| 01 | flujo-paciente-overview.mp4 | 30-45s | Visualización del flujo de estados |
| 02 | login-admin.mp4 | 20-30s | Login como administrador |
| 03 | login-usuario-general.mp4 | 20-30s | Login con rol diferente |
| 04 | dashboard-overview.mp4 | 30-45s | Interfaz principal del dashboard |
| 05 | cargar-paciente-form.mp4 | 20-30s | Abrir modal y llenar formulario |
| 06 | cargar-paciente-servicios.mp4 | 25-35s | Seleccionar servicios/profesionales |
| 07 | cargar-paciente-toggle.mp4 | 15-25s | Toggle de estado inicial (FEATURE NUEVA) |
| 08 | cargar-paciente-submit.mp4 | 10-20s | Confirmar carga de paciente |
| 09 | cola-pacientes-overview.mp4 | 30-45s | Vista de la cola completa |
| 10 | habilitar-paciente.mp4 | 20-30s | Cambiar paciente de pendiente a disponible |
| 11 | permiso-denegado.mp4 | 15-25s | Mostrar control de permisos |
| 12 | llamar-paciente.mp4 | 25-40s | Llamar paciente con audio |
| 13 | registrar-atencion.mp4 | 15-25s | Marcar paciente como atendido |
| 14 | filtros-basicos.mp4 | 20-30s | Uso de filtros simples |
| 15 | filtros-multiples.mp4 | 20-30s | Combinación de múltiples filtros |
| 16 | pantalla-publica-overview.mp4 | 30-45s | Vista de pantalla pública |
| 17 | pantalla-realtime.mp4 | 25-35s | Sincronización en tiempo real |
| 18 | roles-y-permisos.mp4 | 30-45s | Diferentes vistas según rol |
| 19 | info-paciente.mp4 | 15-25s | Información completa del paciente |

**Total: 19 videos, ~450 segundos (7-8 minutos)**

---

## 🎬 Guía de Grabación de Videos

### Recomendaciones Técnicas:
- **Resolución**: 1920x1080 (Full HD) o 2560x1440 (2K)
- **FPS**: 30fps (fluido pero no muy pesado)
- **Formato**: MP4 (H.264)
- **Bitrate**: 5000-8000 kbps para claridad
- **Herramientas recomendadas**:
  - OBS Studio (gratuito, multiplataforma)
  - ScreenFlow (Mac)
  - Camtasia (con edición)
  - Bandicam (Windows)

### Preparación Previa:
1. **Limpiar pantalla**: Cerrar notificaciones innecesarias
2. **Datos de prueba**: Preparar pacientes/servicios para demo
3. **Usuarios de prueba**: Tener credenciales listas
4. **Zoom del navegador**: 100% para mejor legibilidad
5. **Micrófono** (opcional): Narración o explicación

### Guion por Video:
- Cada video debe tener un propósito claro
- Mostrar la acción completa (inicio a fin)
- Incluir transiciones suaves
- 2-3 segundos de pausa antes de empezar la siguiente acción
- Si hay error, reiniciar (grabar limpio)

### Edición Mínima:
- Agregar subtítulos (especialmente para video de audio)
- Clips de introducción/cierre (opcional)
- Acelerar partes lentas (login, loading)
- Insertar anotaciones/flechas para acciones importantes

---

## 💡 Consejos para la Presentación

### Estructura de Presentación en Vivo:
1. **Introducción** (2 min): Problema y solución
2. **Demo en Vivo/Videos** (15-20 min): Mostrar sistema
3. **Características Técnicas** (3-5 min): Stack y arquitectura
4. **Resultados** (2 min): Métricas alcanzadas
5. **Q&A** (5-10 min): Preguntas y respuestas

### Flujo de Videos Sugerido:
- **Parte 1**: Login + Dashboard (introducción)
- **Parte 2**: Cargar paciente (core feature + toggle nuevo)
- **Parte 3**: Gestionar pacientes (flujo completo)
- **Parte 4**: Pantalla pública (diferenciador)
- **Parte 5**: Permisos y roles (seguridad)

### Interactividad:
- Pausar entre videos para explicar
- Responder preguntas mientras se pausa
- Mostrar código/arquitectura en slides técnicas
- Permitir pruebas en vivo si hay conexión estable

---

## 📋 Checklist de Grabación

- [ ] Actualizar datos de prueba (pacientes, profesionales)
- [ ] Verificar conexión a internet (para Supabase)
- [ ] Probar micrófono (si incluye narración)
- [ ] Preparar credenciales de usuarios
- [ ] Revisar iluminación de pantalla
- [ ] Grabar cada video 2-3 veces (seleccionar el mejor)
- [ ] Guardar videos en carpeta dedicada
- [ ] Exportar en formato MP4
- [ ] Renombrar según lista (01-, 02-, etc.)
- [ ] Hacer backup en pendrive/nube
- [ ] Probar videos en PowerPoint antes de presentar

---

## 🎯 Notas Importantes

1. **El Toggle es tu Feature Estrella**: Enfatiza esto en los videos 07 (cargar-paciente-toggle)
2. **Tiempo Real es Clave**: El video 17 (pantalla-realtime) muestra la diferencia
3. **Permisos son Seguridad**: Videos 10 y 11 demuestran control de acceso
4. **Simple pero Poderoso**: La interfaz debe verse intuitiva en todos los videos
5. **Audio TTS**: El video 12 debe dejar escuchar el audio (es diferenciador)

