# Análisis de Arquitectura: Usuarios, Profesionales y Servicios

## ESTADO ACTUAL (PROBLEMÁTICO)

### 1. Modelo de Datos Existente

**Tabla `users`** (Sistema de Autenticación)
- id (UUID)
- email (única)
- password_hash
- first_name
- last_name
- is_active
- created_at, updated_at

**Tabla `professional`** (DUPLICA la información de usuarios)
- id (UUID)
- institution_id (FK)
- first_name
- last_name
- speciality
- license_number
- email
- phone
- is_active
- created_at, updated_at
- ⚠️ PROBLEMA: Datos duplicados con tabla `users`

**Tabla `membership`** (Sistema de Roles)
- id (UUID)
- user_id (FK)
- institution_id (FK)
- role: 'admin' | 'administrativo' | 'profesional' | 'servicio' | 'pantalla'
- is_active
- created_at, updated_at
- ⚠️ PROBLEMA: Confuso - "profesional" aquí es un ROL, no un tipo de usuario

### 2. Problemas Identificados

#### A. Duplicación de Datos
- Un profesional se crea como:
  1. Usuario en tabla `users` (email, password)
  2. Profesional en tabla `professional` (datos clínicos)
  3. Membresía en tabla `membership` (asignación a institución)
- **RESULTADO**: Múltiples fuentes de verdad para nombre, email, etc.

#### B. Confusión de Conceptos
- "Profesional" existe en 3 contextos diferentes:
  1. Como tabla `professional` (datos clínicos)
  2. Como rol en `membership` (acceso al sistema)
  3. Implícito en la lógica de negocios (quién llama pacientes)
- **RESULTADO**: Código confuso y bug-prone

#### C. Falta de Claridad en Tipos
- No está claro qué es un "profesional":
  - ¿Médico? ¿Nutricionista? ¿Enfermero? ¿Técnico?
- No hay forma de buscar "todos los médicos" vs "todos los nutricionistas"
- Solo hay especialidad como text libre

#### D. Flujo de Creación Ineficiente
- Actualmente requiere 3 pasos:
  1. Crear usuario
  2. Editar membresía
  3. Crear profesional (en otra página)
- **RESULTADO**: Procesos lentos y desconectados

---

## FLUJO DESEADO (SEGÚN USUARIO)

### Decisión Fundamental
> **"Un usuario es SOLO UNO de dos: Profesional O Personal de Servicio"**

### Flujo Propuesto

```
1. Admin crea usuario
   ↓
2. Al crear, selecciona INMEDIATAMENTE:
   ├─ "Es PROFESIONAL" → Requiere:
   │  ├─ Tipo: Médico, Nutricionista, Asistente Social, etc.
   │  └─ Consultorio: (necesario para atender pacientes)
   │
   └─ "Es PERSONAL DE SERVICIO" → Requiere:
      ├─ Tipo: Administrativo, Enfermería, Técnico, etc.
      └─ SIN consultorio
   
3. Sistema automáticamente:
   ├─ Crea usuario en `users`
   ├─ Crea profesional/servicio en tabla correspondiente
   └─ Crea membresía con rol apropiado
```

---

## PROPUESTA DE ARQUITECTURA

### Opción 1: RECOMENDADA - Tabla Única "user_assignment" (MEJOR)

```sql
-- Tabla existente
users
├─ id, email, password_hash
├─ first_name, last_name
└─ is_active

-- Nueva tabla (reemplaza professional y memberships parcialmente)
user_assignment
├─ id (UUID PK)
├─ user_id (FK → users.id) [UNIQUE]
├─ institution_id (FK → institution.id)
├─ assignment_type: 'profesional' | 'personal_servicio'
├─ professional_type: 'medico' | 'nutricionista' | 'asistente_social' | ... (si type='profesional')
├─ room_id (FK → room.id) [NULL si type='personal_servicio']
├─ is_active
├─ created_at, updated_at

-- Tabla existente (simplificada)
professional -- ELIMINAR, los datos están en user_assignment
```

**VENTAJAS:**
- ✅ Una única fuente de verdad
- ✅ Garantiza 1:1 relación usuario-asignación
- ✅ Inmediata claridad sobre tipo de usuario
- ✅ Flujo de creación en UNA OPERACIÓN
- ✅ Facilita búsquedas: "todos los médicos de inst X"
- ✅ Simplifica RLS (una tabla menos)

**DESVENTAJAS:**
- ⚠️ Requiere migración de datos existentes
- ⚠️ Cambios en todas las páginas que usan `professional`

---

### Opción 2: Agregar Campos a `professional` (ALTERNATIVA)

```sql
professional
├─ id, institution_id, first_name, last_name, ...
├─ user_id (FK → users.id) [UNIQUE] -- NUEVO
├─ professional_type: 'medico' | 'nutricionista' | ... -- NUEVO
├─ is_assigned_to_institution: boolean -- NUEVO
└─ ... resto de campos

membership -- SIMPLIFICAR a solo admin roles
├─ user_id (FK)
├─ institution_id (FK)
├─ role: 'admin' | 'administrativo' | 'pantalla' -- ELIMINAR 'profesional', 'servicio'
```

**VENTAJAS:**
- ✅ Menos cambios en BD existente
- ✅ Mejor compatibilidad hacia atrás
- ✅ Reutiliza estructura existente

**DESVENTAJAS:**
- ⚠️ Deja tabla `professional` con propósito confuso
- ⚠️ ¿Qué pasa con "personal de servicio" que NO entra aquí?
- ⚠️ Sigue habiendo duplicación entre `users` y `professional`

---

## RECOMENDACIÓN FINAL

**Usar Opción 1** porque:

1. **Claridad**: Una tabla `user_assignment` unifica todo el concepto
2. **Escalabilidad**: Fácil agregar nuevos tipos de asignación
3. **Rendimiento**: Una query en lugar de JOIN users+professional
4. **RLS**: Más simple de implementar políticas de seguridad
5. **UX**: Flujo de creación de usuario en UN paso

### Plan de Migración
1. Crear tabla `user_assignment`
2. Migrar datos de `professional` → `user_assignment`
3. Migrar datos de `membership` (roles profesional/servicio) → `user_assignment`
4. Actualizar RLS policies
5. Actualizar todas las páginas del frontend
6. Remover tabla `professional` (después de validación)
7. Simplificar tabla `membership` (solo admin roles)

---

## CAMPOS PARA ENUM `professional_type`

```sql
CREATE TYPE professional_type AS ENUM (
  'medico',
  'nutricionista',
  'asistente_social',
  'enfermero',
  'tecnico_laboratorio',
  'trabajador_social',
  'psicólogo',
  'kinesiologo',
  'administrativo',
  'otro'
);

CREATE TYPE assignment_type AS ENUM (
  'profesional',
  'personal_servicio'
);
```

---

## IMPACTO EN FRONTEND

### Páginas Afectadas
- `/usuarios` - **Rediseño total** del flujo de creación
- `/profesionales` - Cambiar de `professional` a `user_assignment`
- `/asignaciones` - Mostrar asignaciones desde `user_assignment`
- `/super-admin/usuarios` - Crear con selección inmediata
- Cualquiera que use `professional` tabla

### Nueva Página de Creación de Usuario
```
Paso 1: Datos básicos (nombre, email, password)
         ↓
Paso 2: Seleccionar tipo
         ├─ Profesional → Formulario 3a
         └─ Personal Servicio → Formulario 3b
         ↓
Paso 3a: Si Profesional
         ├─ Tipo de profesional (select)
         ├─ Consultorios disponibles (multiselect)
         └─ Especialidad (text)
         
Paso 3b: Si Personal Servicio
         ├─ Tipo de personal (select)
         └─ Departamento (select)
         ↓
Paso 4: Confirmación
         ↓
Crear en BD: users + user_assignment (transacción atómica)
```
