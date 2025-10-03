# Turnero ZS

Sistema multi-zona de gestión de turnos para centros de salud argentinos (CAPS/hospitales).

## 🎯 Objetivos

- ↓ 25-40% tiempo de espera en 3 meses
- ↓ 10-20% ausentismo
- ≥85% ocupación de agendas
- ≥95% registro completo de eventos

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15.5.2 + App Router, Tailwind CSS 4, shadcn/ui 3
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Seguridad**: Row Level Security (RLS) basada en membership y roles
- **Real-time**: Canales Supabase por institución

## 🏗️ Arquitectura

```
turnero-zs/
├── app/
│   ├── (dashboard)/
│   │   ├── turnos/           # Gestión de turnos
│   │   └── profesional/      # Horarios profesionales
│   └── (public)/
│       └── pantalla/[id]/    # Pantallas públicas
├── components/
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── supabase.ts          # Cliente Supabase
│   └── utils.ts             # Utilidades
└── db/
    ├── schema.sql           # Esquema de base de datos
    ├── policies.sql         # Políticas RLS
    └── seed.sql             # Datos semilla
```

## 🚀 Inicio Rápido

1. **Clonar y configurar**:
   ```bash
   git clone <repo-url>
   cd turnero-zs
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.local.example .env.local
   # Editar .env.local con tus credenciales de Supabase
   ```

3. **Configurar base de datos**:
   - Crear proyecto en Supabase
   - Ejecutar `db/schema.sql`
   - Ejecutar `db/policies.sql`
   - Ejecutar `db/seed.sql` (datos de prueba)

4. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

## 📋 Roadmap por Sprints

- **Sprint 0** ✅ - Setup inicial
- **Sprint 1** ✅ - ABMs base (Zonas, Instituciones, Profesionales, Pacientes, Usuarios)
- **Sprint 2** ✅ - Consultorios, Servicios, Agendas y plantillas de horarios
- **Sprint 3** ✅ - Flujo de atención y pantallas públicas
- **Sprint 4** ✅ - Métricas y reportes
- **Sprint 5** ✅ - Hardening y documentación

### 🏁 Sprint 1 Completado

**Funcionalidades implementadas:**
- ✅ **Gestión de Zonas**: CRUD completo para organización territorial
- ✅ **Gestión de Instituciones**: CAPS y hospitales con tipos y relaciones
- ✅ **Gestión de Profesionales**: Especialidades, matrículas y estados
- ✅ **Gestión de Pacientes**: DNI, edades, validaciones argentinas
- ✅ **Usuarios y Membresías**: Sistema de roles por institución
- ✅ **Super Admin**: Sistema de administración global multi-zona
- ✅ **Infraestructura UI**: 13 componentes shadcn/ui configurados

**Páginas disponibles:**
- `/zonas` - Gestión de zonas
- `/instituciones` - Gestión de instituciones
- `/profesionales` - Gestión de profesionales
- `/pacientes` - Gestión de pacientes
- `/usuarios` - Gestión de usuarios y membresías
- `/super-admin` - Panel de administración global

**Características técnicas:**
- TypeScript strict mode
- Interfaz responsive con Tailwind CSS 4
- Notificaciones toast
- Validaciones client/server-side
- Integración Supabase completa
- Verificación lint/typecheck
- RLS policies multi-tenant con soporte super_admin

### 🏁 Sprint 2 Completado

**Funcionalidades implementadas:**
- ✅ **Gestión de Consultorios**: CRUD con agrupación por institución
- ✅ **Gestión de Servicios**: Configuración de servicios médicos con duración
- ✅ **Plantillas de Horarios**: Sistema completo de agendas semanales
  - Configuración por día de semana
  - Asignación de profesional, servicio y consultorio
  - Cálculo automático de turnos disponibles
  - Gestión de horarios de inicio/fin y duración

**Páginas disponibles:**
- `/consultorios` - Gestión de consultorios y salas
- `/servicios` - Gestión de servicios médicos
- `/horarios` - Gestión de plantillas de horarios

**Características técnicas:**
- RLS policies para consultorios, servicios y plantillas
- Validación de relaciones entre instituciones
- Filtrado dinámico por institución del profesional
- Cálculo en tiempo real de capacidad de agenda

### 🏁 Sprint 3 Completado

**Funcionalidades implementadas:**
- ✅ **Gestión de Turnos**: Flujo completo de atención con transiciones de estado
  - Estados: pendiente → esperando → llamado → en_consulta → finalizado/cancelado/ausente
  - Gestión de eventos de llamado (call_event)
  - Registro de eventos de asistencia (attendance_event)
- ✅ **Asignación de Turnos**: Sistema de reserva desde slots disponibles
  - Búsqueda y selección de pacientes
  - Visualización de disponibilidad en tiempo real
  - Asignación directa a horarios generados desde plantillas
- ✅ **Pantalla Pública**: Display en tiempo real para llamados
  - Actualización vía Supabase Realtime
  - Vista por institución
  - Visualización de cola de espera

**Páginas disponibles:**
- `/turnos` - Gestión del flujo de atención
- `/turnos-disponibles` - Asignación de turnos a pacientes
- `/pantalla` - Selector de instituciones para pantalla pública
- `/pantalla/[slug]` - Pantalla pública en tiempo real

**Características técnicas:**
- Máquina de estados para appointments
- Supabase Realtime channels por institución
- Generación dinámica de slots desde slot_templates
- Validación de disponibilidad antes de asignar

### 🏁 Sprint 4 Completado

**Funcionalidades implementadas:**
- ✅ **Dashboard Institucional**: Resumen ejecutivo en tiempo real
  - Estadísticas del día: turnos totales, pendientes y completados
  - Totales de pacientes, profesionales y servicios activos
  - Últimos 5 turnos programados
  - Accesos rápidos a funciones principales
- ✅ **Reportes y Métricas Completas**: Sistema de análisis avanzado
  - **Métricas de Ocupación**: Tasa de ocupación de agendas
  - **Métricas de Tiempo**: Tiempo de espera y duración de consultas
  - **Métricas de Ausentismo**: Cancelaciones y ausencias
  - **Reportes por Profesional**: Rendimiento individual con estadísticas
  - **Reportes por Servicio**: Análisis de servicios médicos
  - **Tendencias Temporales**: Gráficos de evolución en el tiempo
- ✅ **Exportación de Datos**: Exportar a CSV para análisis externo
- ✅ **Filtros Avanzados**: Por institución, período (hoy, ayer, semana, mes, personalizado)

**Páginas disponibles:**
- `/dashboard` - Dashboard ejecutivo con datos reales
- `/reportes` - Sistema completo de métricas y reportes

**Características técnicas:**
- Cálculo de métricas basadas en call_event y attendance_event
- Gráficos interactivos con Recharts
- Agregación de datos por fecha, profesional y servicio
- Exportación CSV con encoding UTF-8 BOM

### 🏁 Sprint 5 Completado

**Documentación completa para producción:**
- ✅ **Guía de Deployment**: Configuración de ambientes, Supabase, Vercel
  - Setup paso a paso de base de datos
  - Configuración de variables de entorno
  - Deploy automático y manual
  - Troubleshooting común
- ✅ **Guía del Administrador**: Manual completo para admins
  - Configuración inicial de zonas e instituciones
  - Gestión de profesionales, servicios y horarios
  - Creación de usuarios y asignación de roles
  - Gestión de reportes y métricas
  - Mejores prácticas operacionales
- ✅ **Guía del Usuario**: Manual para personal operativo
  - Asignación y gestión de turnos
  - Flujo de atención completo
  - Operación de pantalla pública
  - Solución de problemas comunes
- ✅ **Checklist de Pre-Deployment**: Verificación exhaustiva
  - 100+ items de verificación
  - Scripts SQL ejecutados
  - Funcionalidades testeadas
  - Performance y seguridad
  - Plan de contingencia

**Documentos disponibles:**
- `docs/DEPLOYMENT.md` - Guía técnica de deployment
- `docs/GUIA-ADMINISTRADOR.md` - Manual para administradores
- `docs/GUIA-USUARIO.md` - Manual para usuarios finales
- `docs/CHECKLIST.md` - Checklist pre-producción

**Sistema listo para:**
- ✅ Deployment en producción
- ✅ Capacitación de usuarios
- ✅ Piloto en instituciones reales
- ✅ Escalamiento multi-zona

## 📚 Documentación

### Para Desarrolladores
- **README.md** (este archivo): Visión general del proyecto
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**: Guía completa de deployment
- **CLAUDE.md**: Guía para Claude Code (asistente IA)

### Para Administradores
- **[docs/GUIA-ADMINISTRADOR.md](docs/GUIA-ADMINISTRADOR.md)**: Manual completo de administración
- **[docs/CHECKLIST.md](docs/CHECKLIST.md)**: Checklist de pre-deployment

### Para Usuarios Finales
- **[docs/GUIA-USUARIO.md](docs/GUIA-USUARIO.md)**: Guía operativa del sistema

## 🔐 Roles y Permisos

- **super_admin**: Administradores globales (acceso multi-zona)
- **admin**: Administradores institucionales
- **administrativo**: Personal administrativo
- **medico**: Profesionales de la salud
- **enfermeria**: Personal de enfermería
- **pantalla**: Operadores de pantallas públicas

## 🏥 Tipos de Institución

- **caps**: Centros de Atención Primaria
- **hospital_seccional**: Hospitales Seccionales
- **hospital_distrital**: Hospitales Distritales
- **hospital_regional**: Hospitales Regionales

## 📊 Estados de Turnos

```
pendiente → esperando → llamado → en_consulta → finalizado
                                              ↘ cancelado
                                              ↘ ausente
```

## 🔧 Scripts Disponibles

```bash
npm run dev         # Servidor de desarrollo
npm run build       # Build de producción
npm run start       # Servidor de producción
npm run lint        # Linting con ESLint
npm run typecheck   # Verificación de tipos TypeScript
```

## 📝 Convenciones

- Textos en español (contexto sanitario argentino)
- Componentes con shadcn/ui
- Estados en tiempo real vía Supabase channels
- RLS estricto para multi-tenancy
- Logging completo de eventos de atención

## 🤝 Contribución

Este proyecto sigue el flujo de desarrollo por sprints definido en `docs/sprints.md`.

## 📄 Licencia

Proyecto interno para el sistema de salud argentino.