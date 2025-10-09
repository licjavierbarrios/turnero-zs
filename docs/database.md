# Base de Datos

## Entidades principales
- Zonas → Instituciones → Consultorios / Servicios / Profesionales.
- Pacientes, Usuarios y Membresías.
- Turnos con estados.
- Eventos de atención y llamados.
- **Pantallas públicas** (display_devices) para visualización en salas de espera.
- **Sistema de privacidad** de datos de pacientes con jerarquía configurable.

## Enums
- institution_type: caps | hospital_seccional | hospital_distrital | hospital_regional
- appointment_status: pendiente | esperando | llamado | en_consulta | finalizado | cancelado | ausente
- role_name: admin | administrativo | medico | enfermeria | pantalla
- **privacy_level**: public_full_name | public_initials | private_ticket_only

## DDL Resumido
```sql
create table zone (...);
create table institution (...);
create table room (...);
create table service (...);
create table professional (...);
create table slot_template (...);
create table patient (...);
create table appointment (...);
create table call_event (...);
create table attendance_event (...);
create table membership (...);
create table display_devices (...);  -- Nueva tabla para pantallas públicas
```

## Nuevas Características (Enero 2025)

### Tabla display_devices
Gestiona las pantallas públicas autenticadas:

```sql
create table display_devices (
  id uuid primary key default uuid_generate_v4(),
  institution_id uuid references institution(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null default 'general' check (type in ('general', 'service_specific')),
  is_active boolean default true,
  last_seen_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Campos clave:**
- `user_id`: Usuario de Supabase Auth asociado (con rol "pantalla")
- `institution_id`: Institución a la que pertenece la pantalla
- `type`: Tipo de pantalla (general o específica de servicio)
- `last_seen_at`: Heartbeat para monitoreo de conectividad

**RLS Policies:**
- SELECT: Usuarios con rol "pantalla" pueden ver su propio dispositivo
- UPDATE: Usuarios con rol "pantalla" pueden actualizar `last_seen_at`
- Administradores pueden gestionar dispositivos de su institución

### Sistema de Privacidad
Columnas agregadas a múltiples tablas:

```sql
-- institution
alter table institution
  add column privacy_level privacy_level default 'public_full_name';

-- service
alter table service
  add column privacy_level privacy_level default null;

-- appointment
alter table appointment
  add column privacy_level privacy_level default null;
```

**Jerarquía de privacidad**: appointment > service > institution

### Vista daily_queue_display
Vista optimizada para pantallas públicas con privacidad pre-resuelta:

```sql
create or replace view daily_queue_display as
select
  dq.id,
  dq.institution_id,
  dq.patient_id,
  dq.appointment_id,
  dq.ticket_number,
  dq.status,
  dq.service_name,
  dq.room_name,
  dq.scheduled_time,
  dq.called_at,
  dq.attended_at,
  dq.created_at,
  dq.updated_at,
  resolve_privacy_level(a.id) as resolved_privacy_level,
  get_display_name(
    p.first_name,
    p.last_name,
    dq.ticket_number,
    resolve_privacy_level(a.id)
  ) as display_name
from daily_queue dq
left join appointment a on dq.appointment_id = a.id
left join patient p on dq.patient_id = p.id;
```

### Funciones SQL
**resolve_privacy_level(appointment_id)**
Resuelve el nivel de privacidad según la jerarquía appointment > service > institution.

**get_display_name(first_name, last_name, ticket_number, privacy_level)**
Devuelve el nombre a mostrar según el nivel de privacidad:
- `public_full_name`: "Juan Pérez"
- `public_initials`: "J.P."
- `private_ticket_only`: "Turno 001"

## Migraciones Recientes

### 013_add_privacy_system.sql
- Crea enum `privacy_level`
- Agrega columna `privacy_level` a institution, service, appointment
- Crea funciones `resolve_privacy_level()` y `get_display_name()`
- Crea vista `daily_queue_display`

### 014_update_display_devices_rls.sql
- Crea tabla `display_devices`
- Políticas RLS para display_devices
- Permite SELECT/UPDATE a usuarios con rol "pantalla"
- Permite gestión completa a administradores de la institución
