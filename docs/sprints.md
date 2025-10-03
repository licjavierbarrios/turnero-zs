# Roadmap por Sprints

**Sprint 0 – Setup (1 semana)** ✅
- Repo, CI, lint/format, rutas base, shadcn y Tailwind, Supabase project.
- SQL inicial + RLS + datos semilla.

**Sprint 1 – ABMs base** ✅ **COMPLETADO**
- ✅ **Infraestructura Base**: shadcn/ui configurado con 13 componentes esenciales
- ✅ **Zonas**: CRUD completo (`/app/(dashboard)/zonas/page.tsx`)
- ✅ **Instituciones**: CRUD con relación a zonas y tipos de institución (`/app/(dashboard)/instituciones/page.tsx`)
- ✅ **Profesionales**: CRUD con especialidades y estados activo/inactivo (`/app/(dashboard)/profesionales/page.tsx`)
- ✅ **Pacientes**: CRUD con validación DNI y cálculo de edad (`/app/(dashboard)/pacientes/page.tsx`)
- ✅ **Usuarios/Membresías**: Sistema completo de usuarios y roles por institución (`/app/(dashboard)/usuarios/page.tsx`)
- 🔄 **Pendiente para Sprint 2**: Consultorios y Servicios (se movieron al Sprint 2)

**Características implementadas en Sprint 1:**
- TypeScript strict mode completo
- Interfaz responsive con Tailwind CSS 4
- Componentes reutilizables shadcn/ui 3
- Sistema de notificaciones toast
- Validaciones client-side y server-side
- Manejo de errores consistente
- Interfaz en español (contexto argentino)
- Integración completa con Supabase
- Verificación completa con lint y typecheck

**Sprint 2 – Agendas y slots** ✅ **COMPLETADO**
- ✅ **Consultorios**: CRUD completo con agrupación por institución (`/app/(dashboard)/consultorios/page.tsx`)
- ✅ **Servicios**: CRUD con duraciones configurables (15min a 2h) (`/app/(dashboard)/servicios/page.tsx`)
- ✅ **Plantillas de horarios**: Sistema complejo de plantillas semanales con relaciones Profesional → Servicio → Consultorio (`/app/(dashboard)/horarios/page.tsx`)
- ✅ **Vista administrativa HSI**: Interfaz estilo HSI con vista semana/día y generación en tiempo real (`/app/(dashboard)/agenda/page.tsx`)
- ✅ **Generador de slots**: Sistema completo de generación de turnos disponibles (`/lib/slotGenerator.ts`)
- ✅ **Turnos disponibles**: Interfaz completa para visualización y filtrado de slots (`/app/(dashboard)/turnos-disponibles/page.tsx`)

**Características implementadas en Sprint 2:**
- Algoritmo inteligente de generación de slots basado en plantillas
- Cálculo automático de disponibilidad y estadísticas de ocupación
- Interfaz de filtrado por fecha, profesional e institución
- Vista grid y lista para slots disponibles
- Integración completa con turnos existentes
- Validación de horarios y duraciones
- Dashboard estadístico con métricas de slots por día
- Sistema de relaciones complejas: Profesional → Servicio → Consultorio (opcional)
- Verificación completa con lint y typecheck sin errores

**Sprint 3 – Flujo de atención** ✅ **COMPLETADO**
- ✅ **Sistema completo de gestión de turnos**: Interfaz administrativa completa (`/app/(dashboard)/turnos/page.tsx`)
- ✅ **Flujo de estados**: Implementación completa del ciclo `pendiente` → `esperando` → `llamado` → `en_consulta` → `finalizado`
- ✅ **Creación de turnos**: Búsqueda de pacientes, selección de servicios, calendario integrado y slots dinámicos
- ✅ **Check-in de pacientes**: Transición de `pendiente` a `esperando` con un botón
- ✅ **Sistema de llamado**: Transición de `esperando` a `llamado` con notificación
- ✅ **Ingreso a consulta**: Transición de `llamado` a `en_consulta`
- ✅ **Finalización y cancelación**: Estados `finalizado`, `cancelado` y `ausente`
- ✅ **Pantalla pública realtime**: Display público con actualizaciones en tiempo real (`/app/(public)/pantalla/[institutionId]/page.tsx`)

**Características implementadas en Sprint 3:**
- Sistema completo de gestión del flujo de atención médica
- Interfaz administrativa responsive con filtros avanzados por estado, fecha y profesional
- Pantalla pública con diseño profesional y actualizaciones en tiempo real vía Supabase channels
- Notificaciones sonoras para llamados (Web Audio API)
- Protección de privacidad en pantalla pública (nombres anonimizados)
- Indicador de conexión en tiempo real y controles de audio
- Clock en tiempo real con fecha en español
- Separación de pacientes en espera, llamados y en consulta
- Integración completa con el sistema de slots del Sprint 2
- Hook personalizado `useUserMembership` para manejo de roles y permisos

**Sprint 4 – Métricas y reportes** ✅ **COMPLETADO**
- ✅ **Dashboard completo de métricas**: Interfaz administrativa con análisis detallado (`/app/(dashboard)/reportes/page.tsx`)
- ✅ **Cálculo de tiempos de espera**: Análisis desde turno programado hasta llamado por profesional y servicio
- ✅ **Cálculo de tiempos de consulta**: Medición de duración real de consultas vs tiempo configurado
- ✅ **Reportes por profesional**: Métricas individuales con especialidades, turnos completados y tiempos promedio
- ✅ **Reportes por servicio**: Análisis por tipo de servicio con comparación de eficiencia vs duración configurada
- ✅ **Exportación CSV**: Funcionalidad completa de exportación para resumen, profesionales y servicios
- ✅ **Visualizaciones interactivas**: Gráficos de torta, líneas y barras con Recharts
- ✅ **Filtros avanzados**: Por período (hoy, ayer, semana, mes, personalizado) e institución

**Características implementadas en Sprint 4:**
- Dashboard responsivo con 4 pestañas: Resumen, Profesionales, Servicios y Tendencias
- Métricas de rendimiento: tasa de ocupación, tiempos promedio, distribución de estados
- Gráficos interactivos: distribución de estados (pie chart), tendencias de turnos y tiempos (line charts)
- Cálculo automático de KPIs: tiempo de espera (scheduled_at → called_at), tiempo de consulta (entered_at → exited_at)
- Sistema de filtros temporal con Calendar component integrado
- Exportación CSV con formato argentino y datos completos para análisis externo
- Manejo de roles: admin ve todas las instituciones, usuarios normales solo su institución
- Formato inteligente de tiempos (ej: "1h 30min", "45min")
- Comparación de eficiencia: tiempo real vs tiempo configurado por servicio
- Integración completa con tablas: appointment, call_event, attendance_event
- Verificación completa con lint y typecheck sin errores

**Sprint 5 – Endurecer**
- RLS fina, auditoría, accesibilidad, pruebas de carga (slots simultáneos), hardening y pilotos.

Hitos: piloto en 1 CAPS (semana 6), luego extender.
