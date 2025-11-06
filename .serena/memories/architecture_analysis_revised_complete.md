# Análisis Revisado: Usuarios, Profesionales, Servicios y Consultorios

## CASO DE USO REAL

### Ejemplo 1: Dr. Juan Pérez - Sin Consultorio Fijo
- Usuario creado en sistema
- Profesional (Médico)
- En CAPS B° Evita: puede usar ANY de 6 consultorios disponibles
- Flujo diario:
  - Mañana: Administrativo ve "Dr. Juan libre", asigna consultorio 2 (está disponible)
  - Tarde: Puede ser consultorio 4 (cambió disponibilidad)
  - Flexible según necesidad del día

### Ejemplo 2: Dr. Oyola - Con Consultorio "Preferente"
- Usuario creado en sistema
- Profesional (Cardiólogo)
- En Hospital X:
  - **PREFERENCIA**: Consultorio 3 (donde tiene equipos cardiológicos)
  - Admin puede "recordar" esta preferencia: "Dr. Oyola → Consultorio 3"
  - Normalmente: Sistema sugiere consultorio 3 al administrativo
  - Excepciones: Evento ministerial → asignado a consultorio 5 temporalmente
  - Luego: Vuelve a consultorio 3

### Ejemplo 3: Usuario Solo Login
- Coordinador/Supervisor creado en sistema
- NO es Profesional
- NO es Personal de Servicio
- Solo acceso a dashboard/reportes
- No participa en ciclo de atención

---

## CONCEPTOS CLAVE A SEPARAR

### 1. **USER** (Sistema de Autenticación)
```
Usuario del Sistema
├─ email/password
├─ nombre/apellido
├─ is_active
└─ Puede ser:
   ├─ Profesional (atiende pacientes)
   ├─ Personal de Servicio (apoyo administrativo)
   └─ Ninguno de los anteriores (solo login)
```

### 2. **PROFESSIONAL** (Capacidad de Atender)
```
Profesional de Salud
├─ user_id (FK)
├─ institution_id
├─ professional_type: 'medico' | 'nutricionista' | ...
├─ speciality (ej: Cardiología)
├─ license_number
├─ phone
├─ is_active
└─ IMPORTANTE: SIN consultorio aquí
```

### 3. **PROFESSIONAL_ROOM_PREFERENCE** (NUEVO - Consultorios)
```
Preferencia de Consultorio para Profesional
├─ id (UUID)
├─ professional_id (FK)
├─ room_id (FK) [puede ser NULL = sin preferencia fija]
├─ is_preferred: boolean
│  ├─ true: "Dr. Oyola usa consultorio 3 normalmente"
│  └─ false: "Dr. Juan puede usar cualquiera"
├─ notes: text (ej: "Cardiología requiere equipos en sala 3")
├─ created_at, updated_at
```

### 4. **DAILY_QUEUE_ASSIGNMENT** (Asignación Diaria)
```
Asignación de Profesional a Consultorio PARA UN DÍA
├─ id (UUID)
├─ professional_id (FK)
├─ room_id (FK)
├─ scheduled_date (DATE)
├─ start_time (TIME)
├─ end_time (TIME)
├─ assigned_by (user_id)
├─ created_at, updated_at
```

### 5. **SERVICE_STAFF** (Personal de Servicio)
```
Personal de Servicio (Administrativo, Enfermería, etc.)
├─ user_id (FK)
├─ institution_id (FK)
├─ staff_type: 'administrativo' | 'enfermeria' | 'tecnico' | ...
├─ department: varchar (ej: "Admisión")
├─ is_active
└─ NO NECESITA consultorio
```

---

## ARQUITECTURA REVISADA Y CORRECTA

### Modelo de Datos

```sql
-- TABLA 1: Usuarios (Autenticación - existente)
users
├─ id (UUID PK)
├─ email (UNIQUE)
├─ password_hash
├─ first_name
├─ last_name
├─ is_active
├─ created_at, updated_at
└─ NOTA: Es la base de TODOS. Puede no tener asignación.

-- TABLA 2: Profesionales (Existente - MEJORADO)
professional
├─ id (UUID PK)
├─ user_id (UUID FK) [UNIQUE] -- NUEVO: link directo a usuario
├─ institution_id (UUID FK)
├─ professional_type: 'medico' | 'nutricionista' | ... -- NUEVO: enum
├─ speciality (varchar)
├─ license_number (varchar)
├─ phone (varchar)
├─ is_active (boolean)
├─ created_at, updated_at
└─ CHANGE: Eliminar email/first_name/last_name (viven en users)

-- TABLA 3: Preferencias de Consultorio (NUEVO)
professional_room_preference
├─ id (UUID PK)
├─ professional_id (UUID FK)
├─ room_id (UUID FK) [puede ser NULL]
├─ is_preferred (boolean)
│  ├─ true: "Este es mi consultorio habitual"
│  └─ false: "Puedo usar cualquiera"
├─ notes (text) -- ej: "Equipos de cardiología aquí"
├─ institution_id (UUID FK) -- referencia para RLS
├─ created_at, updated_at
└─ CONSTRAINT: UNIQUE(professional_id, institution_id) por institución

-- TABLA 4: Asignación Diaria de Consultorios (NUEVO)
daily_professional_assignment
├─ id (UUID PK)
├─ professional_id (UUID FK)
├─ room_id (UUID FK)
├─ scheduled_date (DATE)
├─ start_time (TIME)
├─ end_time (TIME)
├─ assignment_notes (text) -- ej: "Asignado excepto hoy"
├─ assigned_by (UUID FK → users.id)
├─ institution_id (UUID FK) -- para RLS
├─ created_at, updated_at
└─ INDEX: (professional_id, scheduled_date, institution_id)

-- TABLA 5: Personal de Servicio (NUEVO)
service_staff
├─ id (UUID PK)
├─ user_id (UUID FK) [UNIQUE]
├─ institution_id (UUID FK)
├─ staff_type: 'administrativo' | 'enfermeria' | 'tecnico' | ...
├─ department (varchar)
├─ is_active (boolean)
├─ created_at, updated_at
└─ CONSTRAINT: UNIQUE(user_id, institution_id)

-- TABLA 6: Membresías Simplificada (Existente - SIMPLIFICADA)
membership
├─ id (UUID PK)
├─ user_id (UUID FK)
├─ institution_id (UUID FK)
├─ role: 'super_admin' | 'admin' | 'coordinator' | 'pantalla'
│  └─ ELIMINADOS: 'profesional', 'servicio' (ahora están en professional y service_staff)
├─ is_active (boolean)
├─ created_at, updated_at
└─ UNIQUE: (user_id, institution_id, role)
```

---

## FLUJO DE CREACIÓN DE USUARIO (REVISADO)

### Paso 1: Crear Usuario Base
```
Admin crea usuario:
├─ Email
├─ Nombre/Apellido
├─ Contraseña
└─ is_active
```

### Paso 2: Seleccionar Tipo (OPCIONAL)
```
¿Qué es este usuario?
├─ A) Profesional de Salud
├─ B) Personal de Servicio
└─ C) Solo acceso al sistema (ninguno)
```

### Paso 3a: Si es PROFESIONAL
```
├─ Institución (select)
├─ Tipo de Profesional (select: Médico, Nutricionista, etc.)
├─ Especialidad (text: Cardiología, Oncología, etc.)
├─ Matrícula (text)
├─ Teléfono (text)
└─ [CREAR en tabla professional]

Luego (OPCIONAL - no ahora):
├─ ¿Tiene consultorio preferente? (SI/NO)
└─ Si SI → Seleccionar consultorio 3 y guardar en professional_room_preference
```

### Paso 3b: Si es PERSONAL DE SERVICIO
```
├─ Institución (select)
├─ Tipo de Personal (select: Administrativo, Enfermería, etc.)
├─ Departamento (text: Admisión, Farmacia, etc.)
└─ [CREAR en tabla service_staff]
```

### Paso 3c: Si es SOLO ACCESO
```
├─ Solo crear en users
├─ Asignar membresía con role 'coordinator' | 'pantalla'
└─ Listo
```

---

## FLUJO DIARIO: ASIGNACIÓN DE CONSULTORIOS

### Mañana - Administrativo inicia el día

```
Admin abre "Asignación de Consultorios Hoy"
│
├─ Ve profesionales programados para HOY
│  └─ Dr. Juan Pérez (sin preferencia)
│  └─ Dr. Oyola (preferencia: Consultorio 3)
│
└─ Para cada profesional:
   │
   ├─ Si tiene preferencia:
   │  ├─ Mostrar: "Dr. Oyola → Consultorio 3 (preferencia)"
   │  ├─ Si consultorio 3 está libre: Asignar automático ✓
   │  └─ Si consultorio 3 NO está libre: Mostrar alternativas
   │
   └─ Si NO tiene preferencia:
      ├─ Mostrar: "Dr. Juan → Seleccionar consultorio"
      └─ Admin selecciona consultorio libre
   
   [INSERT en daily_professional_assignment]
```

### Evento Excepcional (Ministerio)

```
Hoy Dr. Oyola NO puede usar consultorio 3
│
└─ Admin:
   ├─ Ve preferencia "Consultorio 3" 
   ├─ Sabe que NO está disponible
   ├─ Asigna manualmente consultorio 5
   └─ [INSERT en daily_professional_assignment: room_id=5]

Mañana:
└─ Vuelve a preferencia automático (consultorio 3)
```

---

## CAMBIOS EN TABLAS

### ❌ ELIMINAR
- Nada de `professional` table (vamos a mejorarla)

### ✏️ MEJORAR `professional`
```sql
ALTER TABLE professional ADD COLUMN user_id UUID UNIQUE NOT NULL REFERENCES users(id);
DELETE FROM professional WHERE email IS NULL; -- limpiar duplicados

-- Eliminar columnas redundantes
ALTER TABLE professional DROP COLUMN first_name;
ALTER TABLE professional DROP COLUMN last_name;
ALTER TABLE professional DROP COLUMN email;

-- Agregar type
ALTER TABLE professional ADD COLUMN professional_type VARCHAR(50);
```

### ✅ CREAR `professional_room_preference`
```sql
CREATE TABLE professional_room_preference (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE CASCADE,
  room_id UUID REFERENCES room(id) ON DELETE SET NULL,
  is_preferred BOOLEAN DEFAULT false,
  notes TEXT,
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(professional_id, institution_id)
);
```

### ✅ CREAR `service_staff`
```sql
CREATE TABLE service_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  staff_type VARCHAR(50) NOT NULL, -- 'administrativo', 'enfermeria', etc
  department VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, institution_id)
);
```

### ✅ CREAR `daily_professional_assignment`
```sql
CREATE TABLE daily_professional_assignment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professional(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  assignment_notes TEXT,
  assigned_by UUID REFERENCES users(id),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_daily_professional_assignment 
  ON daily_professional_assignment(professional_id, scheduled_date, institution_id);
```

### ✏️ SIMPLIFICAR `membership`
```sql
-- Actualizar roles (eliminar 'profesional', 'servicio')
ALTER TYPE role_name REMOVE VALUE 'profesional';
ALTER TYPE role_name REMOVE VALUE 'servicio';
-- (o crear nuevo enum)
```

---

## VENTAJAS DE ESTA ARQUITECTURA

✅ **Claridad**: Usuario ≠ Profesional ≠ Servicio  
✅ **Flexibilidad**: Profesional sin consultorio fijo O con preferencia  
✅ **Dinámico**: Consultorios asignados por día, no fijos  
✅ **Excepciones fáciles**: Dr. Oyola usa sala 5 hoy (excepción)  
✅ **Auditoría**: Se sabe quién asignó y cuándo  
✅ **Escalable**: Fácil agregar nuevos tipos de staff  
✅ **Optional**: Usuario puede ser solo login (sin roles)  

---

## PÁGINAS A CREAR/MODIFICAR

### CREAR
- `/super-admin/usuarios` - Nuevo flujo de creación (3 opciones)
- `/turnero/asignacion-consultorios-dia` - Asignación dinámica diaria
- `/super-admin/profesionales/preferencias` - Gestionar preferencias de consultorios

### MODIFICAR
- `/profesionales` - Ahora lee de `professional` + `professional_room_preference`
- `/asignaciones` - Ahora lee de `daily_professional_assignment`
- `/servicios` - Si maneja personal de servicio

---

## RESUMEN DE LA SOLUCIÓN

**Antes (Confuso):**
- Usuario = Profesional = Rol = ¿Consultorio?
- Todo mezclado

**Después (Claro):**
```
users (autenticación base)
  ├─ professional (si atiende pacientes)
  │   ├─ professional_room_preference (consultorio preferente, OPCIONAL)
  │   └─ daily_professional_assignment (consultorio HOY)
  ├─ service_staff (si es personal apoyo)
  └─ membership (solo para roles admin/coordinator/pantalla)
```

**Resultado:**
- Dr. Juan: usuario + professional (sin preferencia, asignación diaria flexible)
- Dr. Oyola: usuario + professional + preferencia (consultorio 3) + excepciones (consultorio 5 hoy)
- Coordinador: usuario + membership (role: coordinator)
