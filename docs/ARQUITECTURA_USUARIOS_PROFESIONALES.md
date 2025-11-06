# Arquitectura: Usuarios, Profesionales y Asignación de Consultorios

## 📋 Resumen Ejecutivo

Esta documento describe la nueva arquitectura para gestionar usuarios, profesionales y la asignación dinámica de consultorios en Turnero ZS.

**Principios clave:**
- ✅ Usuarios son la base de autenticación
- ✅ Profesionales son usuarios que atienden pacientes
- ✅ Consultorios se asignan DINÁMICAMENTE por día, no al crear usuario
- ✅ Profesionales pueden tener "preferencias" de consultorio (ej: Dr. Oyola → Consultorio 3)
- ✅ Usuarios pueden ser solo login (sin ser profesional ni servicio)

---

## 🏗️ Modelo de Datos

### 1. Tabla `users` (EXISTENTE - Base de Autenticación)
```sql
users
├─ id (UUID PK)
├─ email (UNIQUE)
├─ password_hash
├─ first_name
├─ last_name
├─ is_active
└─ created_at, updated_at

-- La fuente de verdad para nombres y email
-- TODOS los usuarios del sistema pasan por aquí
```

**Propósito:** Sistema de autenticación. TODOS los usuarios (profesionales, administrativos, coordinadores) son registros en esta tabla.

---

### 2. Tabla `professional` (EXISTENTE - MEJORADA)
```sql
professional
├─ id (UUID PK)
├─ user_id (UUID FK) [UNIQUE] ← NUEVO: Link directo a usuario
├─ institution_id (UUID FK)
├─ professional_type (VARCHAR) ← NUEVO: Tipo de profesional
│  └─ Valores: 'medico', 'nutricionista', 'asistente_social', 
│              'enfermero', 'tecnico_laboratorio', 'trabajador_social',
│              'psicólogo', 'kinesiologo', 'otro'
├─ speciality (VARCHAR)
├─ license_number (VARCHAR)
├─ phone (VARCHAR)
├─ is_active
└─ created_at, updated_at

-- CAMBIO: Se eliminan first_name, last_name, email (viven en users)
```

**Propósito:** Datos clínicos/profesionales. Existe SOLO si el usuario es un profesional que atiende pacientes.

---

### 3. Tabla `professional_room_preference` (NUEVA)
```sql
professional_room_preference
├─ id (UUID PK)
├─ professional_id (UUID FK) [UNIQUE con institution_id]
├─ room_id (UUID FK) [puede ser NULL = sin preferencia]
├─ is_preferred (BOOLEAN)
│  └─ true: "Este es mi consultorio habitual"
│  └─ false: "Puedo usar cualquiera"
├─ notes (TEXT)
│  └─ Ej: "Equipos de cardiología aquí"
├─ institution_id (UUID FK)
└─ created_at, updated_at
```

**Propósito:** Guarda la PREFERENCIA de consultorio para cada profesional.

**Ejemplos:**
- Dr. Oyola (cardiólogo): `room_id=consultorio_3, is_preferred=true`
  - "Su consultorio habitual es el 3 porque ahí están los equipos"
- Dr. Juan Pérez: `room_id=NULL, is_preferred=false`
  - "No tiene consultorio fijo, puede usar cualquiera"

**IMPORTANTE:** Esta tabla es una REFERENCIA, no una asignación actual. Es información que el administrativo guarda para saber las preferencias.

---

### 4. Tabla `daily_professional_assignment` (NUEVA - CRÍTICA)
```sql
daily_professional_assignment
├─ id (UUID PK)
├─ professional_id (UUID FK)
├─ room_id (UUID FK) ← Consultorio PARA ESTE DÍA
├─ scheduled_date (DATE)
│  └─ Formato: YYYY-MM-DD (ej: 2025-11-05)
├─ start_time (TIME) [opcional]
├─ end_time (TIME) [opcional]
├─ assignment_notes (TEXT)
│  └─ Ej: "Consultorio temporal por evento ministerial"
├─ assigned_by (UUID FK → users.id)
│  └─ Quién hizo la asignación (para auditoría)
├─ institution_id (UUID FK)
└─ created_at, updated_at

-- ÍNDICES
├─ (professional_id, scheduled_date, institution_id)
├─ (room_id, scheduled_date, institution_id)
└─ (institution_id, scheduled_date)
```

**Propósito:** La fuente de verdad para saber QUÉ PROFESIONAL ESTÁ EN QUÉ CONSULTORIO CADA DÍA.

**Ejemplo para 2025-11-05:**
```
Dr. Juan Pérez → Consultorio 2 (flexible, cambió hoy)
Dr. Oyola → Consultorio 3 (su preferencia)
Dr. García → Consultorio 5 (excepción por evento ministerial)
```

**IMPORTANTE:** 
- Un profesional puede tener SOLO UNA asignación por día
- Un consultorio puede tener SOLO UN profesional por día (sin overlaps)
- Esta es la tabla que el administrativo consulta "¿A qué consultorio envío al Dr. Juan?"

---

### 5. Tabla `service_staff` (NUEVA)
```sql
service_staff
├─ id (UUID PK)
├─ user_id (UUID FK) [UNIQUE]
├─ institution_id (UUID FK)
├─ staff_type (VARCHAR)
│  └─ 'administrativo', 'enfermeria', 'tecnico_laboratorio', 'asistente_social', etc
├─ department (VARCHAR)
│  └─ Ej: "Admisión", "Farmacia", "Laboratorio"
├─ is_active
└─ created_at, updated_at
```

**Propósito:** Personal de servicio que NO atiende pacientes (administrativo, enfermería de apoyo, técnicos, etc).

---

### 6. Tabla `membership` (EXISTENTE - SIMPLIFICADA)
```sql
membership
├─ id (UUID PK)
├─ user_id (UUID FK)
├─ institution_id (UUID FK)
├─ role (role_name ENUM)
│  ├─ 'super_admin' (acceso global)
│  ├─ 'admin' (administrador de institución)
│  ├─ 'coordinator' (coordinador/supervisor)
│  └─ 'pantalla' (operador de pantalla pública)
│  
│  ❌ ELIMINADOS: 'profesional', 'servicio'
│     (ahora están en professional y service_staff)
│
├─ is_active
└─ created_at, updated_at
```

**Cambios:**
- ❌ Eliminar roles 'profesional' y 'servicio'
- ✅ Estos conceptos ahora viven en `professional` y `service_staff`
- ✅ Membership solo para roles ADMINISTRATIVOS

---

## 🔄 Flujos de Trabajo

### Flujo 1: Crear un Nuevo Profesional

```
Admin accede a /super-admin/usuarios
│
└─ Formulario de creación:
   ├─ Email, Nombre, Apellido, Contraseña
   │
   ├─ Seleccionar tipo:
   │  └─ ☑ "Es Profesional" → Paso 2a
   │  └─ ☑ "Es Personal Servicio" → Paso 2b
   │  └─ ☑ "Solo acceso al sistema" → Paso 3
   │
   Paso 2a (Si Profesional):
   ├─ Institución (select obligatorio)
   ├─ Tipo Profesional: Médico, Nutricionista, etc (select)
   ├─ Especialidad (text: Cardiología, etc)
   ├─ Matrícula (text)
   ├─ Teléfono (text)
   │
   └─ Sistema crea:
      ├─ Registro en users
      ├─ Registro en professional (con user_id)
      ├─ Preferencia vacía en professional_room_preference
      └─ ✓ Profesional listo para ser asignado

   Paso 2b (Si Servicio):
   ├─ Institución (select)
   ├─ Tipo: Administrativo, Enfermería, etc (select)
   ├─ Departamento (text)
   │
   └─ Sistema crea:
      ├─ Registro en users
      ├─ Registro en service_staff
      └─ ✓ Personal de servicio listo

   Paso 3 (Solo login):
   ├─ Crear usuario en users
   ├─ Crear membership con role 'coordinator'
   └─ ✓ Usuario con solo acceso a sistema
```

---

### Flujo 2: Asignar Consultorio Diariamente (LO MÁS IMPORTANTE)

**Hora:** Mañana, administrativo inicia el turnero

```
Admin abre /turnero/asignacion-consultorios-dia
│
├─ Selecciona fecha (hoy, mañana, etc)
│
└─ Para cada CONSULTORIO:
   │
   ├─ Si tiene ASIGNACIÓN DE HOY → Mostrar profesional + horario
   │
   └─ Si NO tiene asignación:
      │
      ├─ Ver PREFERENCIA del profesional (si tiene)
      │  └─ Ej: "Dr. Oyola prefiere consultorio 3"
      │
      ├─ Si preferencia está DISPONIBLE:
      │  └─ Asignar automático ✓
      │
      └─ Si preferencia NO está disponible O sin preferencia:
         ├─ Mostrar lista de profesionales disponibles
         ├─ Admin elige consultorio
         └─ [INSERT en daily_professional_assignment]
```

**Ejemplo Real:**

```
Mañana 2025-11-05, 7:00 AM - Admin abre asignación

CONSULTORIO 1
└─ Disponible
   ├─ Dr. Juan Pérez (sin preferencia)
   ├─ Dr. García (sin preferencia)
   └─ Admin asigna: Dr. Juan → Consultorio 1

CONSULTORIO 2
└─ Disponible
   └─ Admin asigna: Dr. García → Consultorio 2

CONSULTORIO 3
└─ Disponible
   ├─ Dr. Oyola tiene PREFERENCIA aquí
   ├─ Sistema automáticamente asigna Dr. Oyola
   └─ ✓ Asignado

CONSULTORIO 4
└─ Disponible (nadie)

CONSULTORIO 5
└─ Admin necesita asignar a Dr. Oyola por evento ministerial
   ├─ EXCEPCIÓN: Aunque prefiere 3, hoy va a 5
   ├─ Admin selecciona: Dr. Oyola (excepción)
   ├─ Admin agrega nota: "Evento ministerial - consultorio temporal"
   └─ ✓ Asignado (excepción registrada)

CONSULTORIO 6
└─ Disponible (nadie)
```

---

### Flujo 3: Gestionar Preferencias (Consultorios "Habituales")

```
Admin abre /turnero/asignacion-consultorios-dia
│
└─ Sección "Preferencias de Consultorios"
   │
   ├─ Para cada PROFESIONAL:
   │  │
   │  ├─ Mostrar nombre
   │  │
   │  ├─ Botón "Editar Preferencia":
   │  │  │
   │  │  ├─ Seleccionar consultorio preferente
   │  │  │  └─ Ej: "Consultorio 3"
   │  │  │
   │  │  ├─ Checkbox: "Este es su consultorio habitual"
   │  │  │
   │  │  ├─ Notas (text):
   │  │  │  └─ "Equipos de cardiología"
   │  │  │
   │  │  └─ Guardar
   │  │
   │  └─ [UPDATE professional_room_preference]
   │
   └─ Resultado: Sistema "recuerda" preferencias
      ├─ Mañana: Dr. Oyola → Consultorio 3 (automático)
      ├─ Pasado: Dr. Oyola → Consultorio 3 (automático)
      └─ Excepto cuando admin lo asigna a otro (excepción registrada)
```

---

## 🎯 Casos de Uso Cubiertos

### Caso 1: Dr. Juan Pérez - Sin Consultorio Fijo
```
Creación:
├─ Usuario creado: juan.perez@hospital.com
├─ Profesional creado: tipo=medico, especialidad=Medicina General
└─ Preferencia: room_id=NULL (sin preferencia)

Diario:
├─ Lunes: Asignado a Consultorio 2
├─ Martes: Asignado a Consultorio 4 (cambió disponibilidad)
├─ Miércoles: Asignado a Consultorio 1
└─ Admin decide según disponibilidad de consultorios
```

### Caso 2: Dr. Oyola - Consultorio Preferente con Excepciones
```
Creación:
├─ Usuario creado: oyola@hospital.com
├─ Profesional creado: tipo=medico, especialidad=Cardiología
└─ Preferencia: room_id=consultorio_3, is_preferred=true
   └─ Notas: "Equipos de cardiología"

Flujo Normal:
├─ Lunes: Preferencia = Consultorio 3 → Asignado a Consultorio 3
├─ Martes: Preferencia = Consultorio 3 → Asignado a Consultorio 3
└─ Miércoles: Preferencia = Consultorio 3 → Asignado a Consultorio 3

Excepciones (Evento Ministerial):
├─ Jueves 7:00 AM:
│  ├─ Admin sabe que evento ministerial
│  ├─ Necesita otros consultorios
│  ├─ Asigna Dr. Oyola a Consultorio 5
│  ├─ Nota: "Evento ministerial - consultorio temporal"
│  └─ [INSERT con room_id=5, assignment_notes=...]
│
└─ Viernes:
   ├─ Evento terminó
   ├─ Sistema vuelve a preferencia automática
   └─ Dr. Oyola → Consultorio 3
```

### Caso 3: Coordinador - Solo Acceso al Sistema
```
Creación:
├─ Usuario creado: coordinador@hospital.com
├─ Professional: NO (no atiende pacientes)
├─ ServiceStaff: NO (no es personal de apoyo)
├─ Membership: role='coordinator'
└─ Acceso: Solo dashboard/reportes/analytics

Flujo:
└─ Solo puede ver, NO puede asignar consultorios
```

---

## 📊 Datos Relacionados en Queries

### Para mostrar "¿Quién está en cada consultorio HOY?"

```sql
SELECT 
  dpa.scheduled_date,
  r.name as consultorio,
  p.first_name || ' ' || p.last_name as profesional,
  p.speciality,
  dpa.start_time,
  dpa.end_time,
  dpa.assignment_notes
FROM daily_professional_assignment dpa
JOIN professional p ON dpa.professional_id = p.id
JOIN users u ON p.user_id = u.id
JOIN room r ON dpa.room_id = r.id
WHERE dpa.institution_id = 'xyz'
  AND dpa.scheduled_date = '2025-11-05'
ORDER BY r.name
```

### Para mostrar "Preferencias de un profesional"

```sql
SELECT 
  p.first_name || ' ' || p.last_name as profesional,
  p.speciality,
  prp.room_id,
  r.name as consultorio_preferente,
  prp.is_preferred,
  prp.notes
FROM professional p
LEFT JOIN professional_room_preference prp 
  ON p.id = prp.professional_id
LEFT JOIN room r ON prp.room_id = r.id
WHERE p.institution_id = 'xyz'
ORDER BY p.last_name
```

---

## 🔐 Row Level Security (RLS)

### Políticas para `professional_room_preference`
- ✅ Super admin ve todas
- ✅ Admin de institución ve sus profesionales
- ✅ Profesionales ven sus propias preferencias
- ✅ Solo admin puede crear/actualizar

### Políticas para `daily_professional_assignment`
- ✅ Super admin ve todas
- ✅ Admin/administrativo de institución ve todas de su institución
- ✅ Profesionales ven sus propias asignaciones
- ✅ Solo admin/administrativo pueden crear/actualizar

### Políticas para `service_staff`
- ✅ Super admin ve todos
- ✅ Admin ve su institución
- ✅ Usuarios ven sus propios datos

---

## 📝 Migraciones SQL

Ubicación: `/db/migrations/`

1. **001_create_professional_room_preference.sql**
   - Crea tabla con índices y trigger

2. **002_create_daily_professional_assignment.sql**
   - Tabla CRÍTICA para asignación diaria
   - Índices optimizados para búsquedas frecuentes

3. **003_create_service_staff.sql**
   - Tabla para personal de servicio

4. **004_enhance_professional_table.sql**
   - Agregar `user_id` y `professional_type`
   - Mantiene compatibilidad hacia atrás

5. **005_update_rls_policies.sql**
   - Políticas de seguridad para nuevas tablas

6. **006_migrate_existing_professionals.sql**
   - Script para migrar datos existentes
   - Crear usuarios para profesionales sin user_id
   - Vincular profesionales a usuarios

---

## 🎨 Frontend - Componentes y Páginas

### Hook: `useProfessionalRoomAssignment`
Ubicación: `/hooks/useProfessionalRoomAssignment.ts`

```typescript
const {
  preferences,           // Array de preferencias
  assignments,          // Array de asignaciones diarias
  professionals,        // Array de profesionales
  rooms,               // Array de consultorios
  loading,
  error,
  fetchPreferences,         // Cargar preferencias
  fetchAssignments,         // Cargar asignaciones para fecha
  fetchProfessionals,       // Cargar profesionales
  fetchRooms,              // Cargar consultorios
  createDailyAssignment,    // Crear asignación diaria
  updateDailyAssignment,    // Actualizar asignación
  deleteDailyAssignment,    // Eliminar asignación
  savePreference,           // Guardar preferencia
  getAssignmentsForRoom,    // Helper: asignaciones de una sala
  getAssignmentsForProfessional  // Helper: asignaciones de un prof
} = useProfessionalRoomAssignment()
```

### Página: `/turnero/asignacion-consultorios-dia`
Ubicación: `/app/(dashboard)/asignacion-consultorios-dia/page.tsx`

**Características:**
- ✅ Selector de fecha (Hoy, Mañana, o custom)
- ✅ Grid de consultorios
- ✅ Para cada consultorio: mostrar asignado o disponible
- ✅ Botón "Asignar" → abre dialog
- ✅ Dialog: seleccionar profesional + horarios + notas
- ✅ Sección de preferencias
- ✅ Editar/eliminar asignaciones
- ✅ RLS automático (ve solo su institución)

---

## 🚀 Implementación - Orden de Pasos

### Fase 1: Base de Datos ✅
1. ✅ Crear migraciones SQL (001-005)
2. ✅ Aplicar migraciones en Supabase
3. ✅ Migrar datos existentes (006)

### Fase 2: Backend (Hooks) ✅
1. ✅ Crear `useProfessionalRoomAssignment.ts`
2. ✅ Probar queries contra BD
3. ✅ Validar RLS policies

### Fase 3: Frontend ✅
1. ✅ Crear página `/turnero/asignacion-consultorios-dia`
2. ✅ Integrar hook
3. ✅ Probar casos de uso

### Fase 4: Actualizar Páginas Existentes
1. ⏳ Actualizar `/profesionales` (mostrar preferencia)
2. ⏳ Actualizar `/super-admin/usuarios` (crear con tipo)
3. ⏳ Actualizar `/asignaciones` (mostrar asignación del día)

---

## ✅ Validación

### Tests Manuales
- [ ] Crear profesional sin preferencia
- [ ] Crear profesional con preferencia
- [ ] Asignar profesional a consultorio (día)
- [ ] Asignar profesional a consultorio diferente (excepc ión)
- [ ] Ver asignaciones por fecha
- [ ] Ver preferencias
- [ ] RLS: Admin ve solo su institución
- [ ] RLS: Profesional ve solo sus asignaciones

### Datos de Prueba
```sql
-- Después de migrar, crear ejemplos:
INSERT INTO professional_room_preference (...)
VALUES
  ('prof-oyola-id', 'room-3-id', true, 'Equipos de cardiología'),
  ('prof-juan-id', NULL, false, NULL);

INSERT INTO daily_professional_assignment (...)
VALUES
  ('prof-oyola-id', 'room-3-id', '2025-11-05'),
  ('prof-juan-id', 'room-2-id', '2025-11-05');
```

---

## 📞 Contacto y Soporte

Para preguntas sobre esta arquitectura:
- Revisar `/docs/ARQUITECTURA_USUARIOS_PROFESIONALES.md`
- Revisar migraciones SQL en `/db/migrations/`
- Revisar hook en `/hooks/useProfessionalRoomAssignment.ts`
- Revisar página en `/app/(dashboard)/asignacion-consultorios-dia/page.tsx`

---

**Última actualización:** 2025-11-05  
**Versión:** 1.0  
**Estado:** ✅ Diseño completado, implementación iniciada
