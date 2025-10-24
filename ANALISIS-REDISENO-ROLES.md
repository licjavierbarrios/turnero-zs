# 🔍 ANÁLISIS Y REDISEÑO PROFESIONAL DEL SISTEMA DE ROLES

**Fecha:** 2025-10-24  
**Objetivo:** Rediseñar la arquitectura de roles y permisos de forma profesional  
**Estado:** Análisis + Propuesta de solución

---

## 1. EL PROBLEMA ACTUAL

### 1.1 Confusión Conceptual

En `schema.sql` el enum `role_name` tiene:
```sql
CREATE TYPE role_name AS ENUM (
  'super_admin',
  'admin',
  'administrativo',
  'medico',        ← ¿ROL o ENTIDAD?
  'enfermeria',    ← ¿ROL o ENTIDAD?
  'pantalla'
);
```

**El problema:**
- `medico` y `enfermeria` NO son ROLES de sistema
- Son TIPOS DE ENTIDADES que atienden (profesional vs servicio)
- Se está usando `membership.role` para dos cosas distintas:
  1. Permisos de sistema (admin, administrativo, pantalla)
  2. Tipo de entidad que atiende (medico, enfermeria)

### 1.2 Ejemplo Concreto del Problema

Cuando creas usuario `medico@evita.com` con rol "medico":
- ¿Es un ADMIN que gestiona médicos?
- ¿Es un MÉDICO que atiende pacientes?
- ¿A qué médico/profesional representa?

**Resultado:** Confusión, filtrado incorrecto, seguridad débil.

### 1.3 La Arquitectura Actual

```
users
  └─ membership (user → institution + role)
       └─ role = "medico" / "enfermeria" / "admin" / etc.

PROBLEMA: El rol no distingue entre:
  • PERMISO (qué puede hacer)
  • ENTIDAD (qué atiende: profesional vs servicio)
  • INSTANCIA (a qué profesional/servicio específico)
```

---

## 2. ANÁLISIS DE CASOS DE USO

### 2.1 Caso 1: Admin del Sistema
```
Usuario: admin@evita.com
Necesita: Ver TODO en todas las instituciones
Rol propuesto: super_admin o admin
Asignación: Ninguna (ve todo por defecto)
```

### 2.2 Caso 2: Administrativo de Institución
```
Usuario: administrativo@caps-evita.com
Necesita: Gestionar turnos de su institución
Rol propuesto: administrativo
Asignación: Institución específica
```

### 2.3 Caso 3: Pantalla Pública
```
Usuario: pantalla@caps-evita.com
Necesita: Mostrar cola pública
Rol propuesto: pantalla
Asignación: Institución específica
```

### 2.4 Caso 4: Profesional Individual (Dr. Juan González)
```
Usuario: juan.gonzalez@caps-evita.com
Necesita: Ver SOLO sus turnos
Tipo entidad: PROFESIONAL (Médico)
Rol propuesto: profesional
Asignación: Profesional específico + Institución
```

### 2.5 Caso 5: Servicio (Enfermería)
```
Usuario: enfermeria@caps-evita.com
Necesita: Ver SOLO turnos de enfermería
Tipo entidad: SERVICIO (Enfermería)
Rol propuesto: servicio
Asignación: Servicio específico + Institución
```

---

## 3. MODELO DE ROLES PROPUESTO

### 3.1 Nueva Estructura de Roles

```
role_name ENUM:
  'super_admin'      → Ve TODO, puede administrar todo
  'admin'            → Ve TODO en su institución, gestiona
  'administrativo'   → Ve TODO en su institución, gestiona turnos
  'profesional'      → Ve SOLO sus turnos (asignado a professional)
  'servicio'         → Ve SOLO sus turnos (asignado a service)
  'pantalla'         → Ve pantalla pública
```

**Cambio clave:**
- `medico` y `enfermeria` DESAPARECEN del enum
- Se reemplazan con `profesional` y `servicio`
- La distinción entre médico/psicólogo/etc va en la tabla `professional`

### 3.2 Nueva Tabla: user_professional_assignment

```sql
CREATE TABLE user_professional_assignment (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  professional_id UUID NOT NULL REFERENCES professional(id),
  institution_id UUID NOT NULL REFERENCES institution(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Propósito:**
- Vincular usuario PROFESIONAL a profesional específico
- Usuario con rol='profesional' usa esta tabla

### 3.3 Nueva Tabla: user_service_assignment

```sql
CREATE TABLE user_service_assignment (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  service_id UUID NOT NULL REFERENCES service(id),
  institution_id UUID NOT NULL REFERENCES institution(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Propósito:**
- Vincular usuario SERVICIO a servicio específico
- Usuario con rol='servicio' usa esta tabla

---

## 4. LÓGICA DE FILTRADO POR ROL

### 4.1 Algoritmo de Filtrado

```typescript
function filterAppointmentsByUserRole(
  allAppointments: Appointment[],
  user: User,
  membership: Membership
): Appointment[] {
  
  switch(membership.role) {
    
    case 'super_admin':
    case 'admin':
      // Ve TODO
      return allAppointments;
    
    case 'administrativo':
      // Ve TODO de su institución
      return allAppointments.filter(
        a => a.institution_id === membership.institution_id
      );
    
    case 'pantalla':
      // Ve TODO de su institución (para pantalla pública)
      return allAppointments.filter(
        a => a.institution_id === membership.institution_id
      );
    
    case 'profesional':
      // Ve SOLO sus turnos (profesional específico)
      const profAssignments = await getUserProfessionalAssignments(user.id);
      const profIds = profAssignments.map(a => a.professional_id);
      return allAppointments.filter(
        a => profIds.includes(a.professional_id)
      );
    
    case 'servicio':
      // Ve SOLO sus turnos (servicio específico)
      const servAssignments = await getUserServiceAssignments(user.id);
      const servIds = servAssignments.map(a => a.service_id);
      return allAppointments.filter(
        a => servIds.includes(a.service_id)
      );
    
    default:
      // Ningún acceso
      return [];
  }
}
```

---

## 5. EJEMPLOS CON EL NUEVO MODELO

### 5.1 Admin del Sistema
```
users.id: admin-uuid
users.email: admin@salud.gob.ar
membership.role: super_admin
membership.institution_id: NULL (o cualquiera, no importa)

Resultado: Ve TODO
```

### 5.2 Dr. Juan González (Profesional)
```
users.id: juan-uuid
users.email: juan.gonzalez@caps-evita.com
users.first_name: Juan
users.last_name: González

membership.role: profesional
membership.institution_id: caps-evita-id

professional.id: prof-juan-uuid
professional.first_name: Juan
professional.last_name: González
professional.speciality: Cardiología
professional.institution_id: caps-evita-id

user_professional_assignment.user_id: juan-uuid
user_professional_assignment.professional_id: prof-juan-uuid
user_professional_assignment.institution_id: caps-evita-id

Resultado: Juan ve SOLO sus turnos
```

### 5.3 Enfermería (Servicio)
```
users.id: enfermeria-uuid
users.email: enfermeria@caps-evita.com

membership.role: servicio
membership.institution_id: caps-evita-id

service.id: serv-enfermeria-uuid
service.name: Enfermería
service.institution_id: caps-evita-id

user_service_assignment.user_id: enfermeria-uuid
user_service_assignment.service_id: serv-enfermeria-uuid
user_service_assignment.institution_id: caps-evita-id

Resultado: Enfermería ve SOLO sus turnos
```

---

## 6. MIGRACIÓN DEL MODELO ACTUAL AL NUEVO

### 6.1 Pasos de Migración

1. **Paso 1:** Crear nuevas tablas
   - `user_professional_assignment`
   - `user_service_assignment`

2. **Paso 2:** Crear nuevo enum `role_name_v2`
   - sin "medico" y "enfermeria"
   - con "profesional" y "servicio"

3. **Paso 3:** Migrar datos existentes
   - membership.role "medico" → "profesional"
   - membership.role "enfermeria" → "servicio"

4. **Paso 4:** Actualizar código TypeScript
   - Cambiar lógica de filtrado
   - Usar las nuevas tablas

5. **Paso 5:** Validación y testing

### 6.2 Datos Actuales a Migrar

Tu situación actual:
```
users:
  • admin@evita.com (role: admin)
  • medico@evita.com (role: medico) ← CAMBIAR A 'profesional'
  • enfermero@evita.com (role: enfermeria) ← CAMBIAR A 'servicio'
  • pantalla@evita.com (role: pantalla)
```

Después de migración:
```
users: (sin cambios)

membership:
  • admin@evita.com → role: admin
  • medico@evita.com → role: profesional ✓
  • enfermero@evita.com → role: servicio ✓
  • pantalla@evita.com → role: pantalla

user_professional_assignment:
  • user_id: medico-uuid
    professional_id: (profesional real que crees)
    institution_id: caps-evita-id

user_service_assignment:
  • user_id: enfermero-uuid
    service_id: (servicio enfermeria que existe)
    institution_id: caps-evita-id
```

---

## 7. IMPACTO EN EL CÓDIGO

### 7.1 Cambios en BD

```sql
-- Nuevo enum (reemplazar role_name)
CREATE TYPE role_name_v2 AS ENUM (
  'super_admin',
  'admin',
  'administrativo',
  'profesional',    -- NUEVO
  'servicio',       -- NUEVO
  'pantalla'
);

-- Nuevas tablas
CREATE TABLE user_professional_assignment (...)
CREATE TABLE user_service_assignment (...)

-- Migrar datos
UPDATE membership SET role = 'profesional' 
WHERE role = 'medico';

UPDATE membership SET role = 'servicio' 
WHERE role = 'enfermeria';

-- Migraciones pendientes...
```

### 7.2 Cambios en TypeScript

```typescript
// types.ts: Actualizar tipo de rol
type UserRole = 'super_admin' | 'admin' | 'administrativo' | 'profesional' | 'servicio' | 'pantalla';

// page.tsx: Actualizar lógica de filtrado
// Usar el algoritmo de la sección 4.1
```

### 7.3 Cambios en RLS Policies

```sql
-- user_professional_assignment
-- Solo admin puede VER/INSERTAR/ACTUALIZAR
-- Usuario puede VER sus propias asignaciones

-- user_service_assignment
-- Mismo patrón que professional
```

---

## 8. VENTAJAS DEL NUEVO MODELO

✅ **Claridad:**
- Roles son para permisos
- Entidades (profesional/servicio) son distintas
- Asignaciones son explícitas

✅ **Seguridad:**
- No hay ambigüedad
- RLS policies más claras
- Filtrado correcto garantizado

✅ **Flexibilidad:**
- Un usuario puede ser admin de una institución
- Otro usuario es profesional en otra institución
- Sin conflictos

✅ **Escalabilidad:**
- Fácil agregar más roles
- Fácil agregar asignaciones múltiples
- Modelo extensible

---

## 9. TIMELINE PROPUESTO

| Fase | Tareas | Tiempo | Dependencias |
|------|--------|--------|--------------|
| 1 | Crear nuevas tablas SQL | 30 min | Ninguna |
| 2 | Migrar datos existentes | 15 min | Fase 1 |
| 3 | Actualizar TypeScript | 45 min | Fase 2 |
| 4 | Testing | 60 min | Fase 3 |
| 5 | Validación final | 30 min | Fase 4 |
| **TOTAL** | | **180 min** | |

---

## 10. PRÓXIMOS PASOS

### Opción A: Implementar inmediatamente
- Vamos con el rediseño propuesto
- Crear migraciones SQL
- Actualizar código
- Testing

### Opción B: Implementar después
- Hacemos un parche temporal
- Guardamos este documento
- Lo hacemos bien en una semana

¿Cuál prefieres?

---

## CONCLUSIÓN

El sistema actual mezcla **roles** con **tipos de entidades**, lo que causa confusión y problemas de seguridad.

El modelo propuesto **separa claramente:**
- **Roles** → qué puedes hacer (admin, administrativo, pantalla)
- **Asignaciones** → qué ves (profesional específico o servicio específico)

Esto es más **profesional, seguro y escalable**.

¿Vamos con la implementación?
