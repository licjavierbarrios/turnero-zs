# Requerimientos de Autenticación y Flujo de Instituciones

## Resumen Ejecutivo

El sistema Turnero ZS debe implementar un flujo de autenticación y selección de instituciones que permita a los usuarios acceder únicamente a las instituciones donde tienen asignaciones de trabajo, con roles específicos para cada una.

## Flujo de Usuario

### 1. Pantalla de Login (Punto de Entrada)
- **Ubicación**: Raíz de la aplicación (`/`)
- **Comportamiento**: Primera pantalla que ve cualquier usuario al acceder al sistema
- **Campos requeridos**:
  - Email/Usuario
  - Contraseña
- **Validación**: Autenticación contra base de datos de usuarios
- **Redirección**: Tras login exitoso → Selección de Instituciones

### 2. Selección de Instituciones
- **Trigger**: Inmediatamente después del login exitoso
- **Datos mostrados**: Lista de instituciones donde el usuario tiene asignación
- **Casos posibles**:
  - **1 institución**: Redirección automática al dashboard de esa institución
  - **Múltiples instituciones**: Mostrar listado para selección manual
  - **0 instituciones**: Mensaje de error/contacto con administrador
- **Información por institución**:
  - Nombre de la institución
  - Tipo (CAPS, Hospital Seccional, Hospital Distrital, Hospital Regional)
  - Rol asignado en esa institución
  - Zona geográfica

### 3. Contexto Institucional Post-Selección
- **Alcance**: Toda la funcionalidad queda limitada a la institución seleccionada
- **Módulos disponibles** (todos filtrados por institución):
  - Turnos
  - Agenda
  - Pacientes
  - Profesionales
  - Servicios
  - Consultorios
  - Reportes

## Especificaciones del Dashboard

### Información Institucional Requerida
1. **Nombre de la institución** actualmente seleccionada
2. **Rol del usuario** en esa institución específica
3. **Botón "Cambiar de Institución"** visible y accesible

### Funcionalidad del Botón "Cambiar de Institución"
- **Comportamiento**: Retorna al listado de instituciones disponibles
- **Persistencia**: No pierde la sesión de login
- **Contexto**: Resetea todos los filtros y datos específicos de la institución anterior

## Casos de Uso Típicos

### Agente de Guardia (Múltiples Instituciones)
```
Usuario: Dr. Juan Paredes
Login → Ve listado:
  - CAPS San Lorenzo (Médico)
  - Hospital Distrital Norte (Médico de Guardia)
  - CAPS Villa Nueva (Médico)
Selecciona → CAPS San Lorenzo
Dashboard muestra: "CAPS San Lorenzo - Rol: Médico"
```

### Personal Fijo (Una Institución)
```
Usuario: Enfermera María López
Login → Redirección automática a:
Dashboard: "CAPS Centro - Rol: Enfermería"
```

### Usuario Sin Asignaciones
```
Usuario: Juan Pérez
Login → Mensaje: "No tienes instituciones asignadas. Contacta al administrador."
```

## Consideraciones Técnicas

### Seguridad
- **Row Level Security (RLS)**: Todos los datos deben filtrarse por institución
- **Roles y permisos**: Cada usuario puede tener diferentes roles en diferentes instituciones
- **Tokens de sesión**: Deben incluir institución actualmente seleccionada

### Base de Datos
- **Tabla `membership`**: Relación usuario-institución-rol
- **Filtrado automático**: Todas las consultas deben incluir `institution_id`
- **Auditoría**: Registrar cambios de institución por usuario

### UX/UI
- **Indicador visual**: Siempre mostrar institución actual en header/navbar
- **Breadcrumbs**: Incluir contexto institucional en navegación
- **Confirmación**: Al cambiar de institución, confirmar acción si hay trabajo sin guardar

## Estados de la Aplicación

### Estado No Autenticado
- **Rutas disponibles**: Solo `/login`
- **Redirección**: Cualquier otra ruta redirige a login

### Estado Autenticado Sin Institución
- **Rutas disponibles**: `/institutions/select`
- **Datos**: Lista de instituciones del usuario

### Estado Autenticado Con Institución
- **Rutas disponibles**: Todas las rutas del dashboard
- **Contexto global**: `institution_id` y `user_role` en toda la app
- **Header**: Mostrar institución actual y botón cambiar

## Implementación Prioritaria

### Fase 1: Autenticación Básica
1. Página de login funcional
2. Validación de usuarios
3. Redirección post-login

### Fase 2: Selección de Instituciones
1. Listado de instituciones por usuario
2. Selección y persistencia de contexto
3. Dashboard con información institucional

### Fase 3: Funcionalidad Completa
1. Botón cambiar institución
2. Filtrado automático por institución
3. Roles y permisos específicos

## Notas de Implementación

- **Prioridad**: Este flujo es fundamental para el funcionamiento del sistema
- **Dependencias**: Toda la funcionalidad existente debe adaptarse a este contexto
- **Migración**: Los datos de ejemplo actuales deben incluir contexto institucional
- **Testing**: Crear usuarios de prueba con diferentes configuraciones de instituciones

---

## TRABAJO EN PROGRESO: Extracción de Schema de Base de Datos

### Estado Actual (2025-01-23)
**Objetivo**: Crear scripts de reset/rebuild basados en el schema real de Supabase, no en archivos locales potencialmente obsoletos.

### Progreso Realizado
1. ✅ **Scripts de extracción creados**:
   - `db/extract-current-schema-supabase.sql` - Extractor básico compatible con SQL Editor
   - `db/generate-recreate-script.sql` - Generador de comandos SQL ejecutables
   - `db/simple-schema-extract.sql` - Extractor paso a paso

2. ✅ **Resultado parcial obtenido**:
   - ✅ Índices extraídos correctamente (14 índices personalizados)
   - ❌ Falta extraer: extensiones, tipos ENUM, tablas, constraints, funciones, triggers, políticas RLS

### Problema Identificado
El script `generate-recreate-script.sql` solo devolvió los índices. Posibles causas:
- Script muy complejo para Supabase SQL Editor
- Error silencioso en consultas anteriores
- Limitaciones del entorno SQL Editor

### Próximos Pasos Pendientes
1. **Extracción manual paso a paso**:
   ```sql
   -- Ejecutar una por una en Supabase:
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
   ```

2. **Alternativas de extracción**:
   - CLI de Supabase (instalado pero requiere configuración)
   - pg_dump (si PostgreSQL disponible localmente)
   - Extracción manual tabla por tabla

3. **Scripts finales a crear**:
   - `db/schema-actual-2025-01-23.sql` (schema extraído completo)
   - `db/reset-database-real.sql` (limpieza basada en schema real)
   - `db/rebuild-database-real.sql` (reconstrucción basada en schema real)

### Archivos Relacionados
- `db/README-backup-extract.md` - Documentación del proceso
- `db/README-reset.md` - Instrucciones de uso de scripts reset/rebuild
- `db/backup-current-state.sql` - Script alternativo de backup

### Datos Parciales Obtenidos
**Índices existentes** (14 total):
- appointment: institution_id, patient_id, professional_id, scheduled_at, status
- attendance_event: appointment_id
- call_event: appointment_id
- institution: zone_id
- membership: institution_id, user_id
- professional: institution_id
- room: institution_id
- service: institution_id
- slot_template: professional_id

### Estado de TODO
- [✅] Execute schema extraction script in Supabase SQL Editor
- [🚧] Save extracted schema to timestamped file (PAUSADO)
- [⏳] Create reset script based on real schema
- [⏳] Create rebuild script based on real schema