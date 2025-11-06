# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨🚨🚨 CRITICAL GIT POLICY 🚨🚨🚨

### ⛔ NUNCA HAGAS COMMIT SIN AUTORIZACIÓN EXPLÍCITA DEL USUARIO ⛔

**REGLA ABSOLUTA:**
- ❌ **NO EJECUTES** `git add`, `git commit`, `git push` NI NINGÚN COMANDO GIT
- ❌ **NO HAGAS COMMIT** después de implementar cambios
- ❌ **NO ASUMAS** que el usuario quiere que hagas commit
- ✅ **ESPERA** a que el usuario verifique que todo funciona correctamente
- ✅ **ESPERA** a que el usuario **EXPLÍCITAMENTE** te pida hacer commit

**POR QUÉ:**
El usuario necesita:
1. Verificar que los cambios funcionan correctamente
2. Probar la aplicación manualmente
3. Revisar el código antes de commitearlo
4. Decidir cuándo es el momento apropiado para hacer commit

**FLUJO CORRECTO:**
```
1. Claude implementa cambios
2. Claude explica qué cambió
3. ⏸️  PAUSA - Esperar a que el usuario pruebe
4. Usuario verifica que funciona
5. Usuario dice: "Haz el commit" o "Commitea los cambios"
6. ✅ SOLO ENTONCES Claude ejecuta git add/commit/push
```

**EXCEPCIÓN:**
Solo puedes hacer commit si el usuario dice explícitamente:
- "Haz el commit"
- "Commitea los cambios"
- "Push los cambios"
- "Guarda los cambios en git"
- O cualquier variante clara y explícita de estas instrucciones

---

## ⚠️ CRITICAL: SISTEMA ACTIVO vs FUTURO

**ANTES DE HACER CUALQUIER CAMBIO, LEE ESTO:**

🟢 **SISTEMA ACTIVO**: El proyecto usa la tabla `daily_queue` para gestión de turnos del día.
🔴 **SISTEMA FUTURO**: La tabla `appointment` existe pero NO está en uso (implementación futura).

**📖 Lee `IMPLEMENTACION-ACTUAL.md` para detalles completos ANTES de trabajar con turnos/colas/pantalla pública.**

## Project Overview

**Turnero ZS** is a multi-zone appointment and queue management system for Argentine healthcare centers (CAPS/hospitals). It provides appointment scheduling, patient queue management, and real-time public displays to improve patient flow and reduce wait times.

## Technology Stack

- **Frontend**: Next.js 15.5.2 with App Router, Tailwind CSS 4, shadcn/ui 3
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Real-time**: Supabase channels per institution
- **Security**: Row Level Security (RLS) based on membership and roles

## Architecture

### Core Domain Entities
- **Zones** → **Institutions** → **Rooms/Services/Professionals**
- **Patients, Users, Memberships** with role-based access
- **⚠️ Daily Queue (ACTIVO)**: Cola diaria con estados (pendiente → disponible → llamado → atendido)
- **⚠️ Appointments (FUTURO)**: Turnos programados - NO IMPLEMENTADO AÚN
- **Call Events & Attendance Events** for complete traceability

### User Roles (via membership table)
- `super_admin`: Super administrador global
- `admin`: System administrators per institution
- `administrativo`: Administrative staff
- `profesional`: Healthcare provider (attends patients) - LINK to professional table
- `servicio`: Service/department staff (nursing, lab, etc)
- `pantalla`: Public display operators

**IMPORTANT ARCHITECTURE:**
- Un USUARIO puede tener 1+ ROLES en distintas instituciones (via membership)
- Un USUARIO asignado como `profesional` DEBE tener un record en tabla `professional`
- Un USUARIO asignado como `servicio` DEBE tener un record en tabla `service_staff`
- NO confundir: usuarios ≠ profesionales. Un usuario es una cuenta, un profesional es un rol.

### Institution Types
- `caps`: Primary care centers
- `hospital_seccional`: District hospitals
- `hospital_distrital`: Regional hospitals
- `hospital_regional`: Provincial hospitals

## Expected File Structure

```
turnero-zs/
├── app/
│   ├── (dashboard)/
│   │   ├── turnos/page.tsx          # Appointment management
│   │   └── profesional/page.tsx     # Professional schedules
│   └── (public)/
│       └── pantalla/[institutionId]/page.tsx  # Public display
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── AppointmentsTable.tsx       # Appointment listing
│   └── PublicScreen.tsx            # Real-time queue display
├── lib/
│   └── supabaseClient.ts           # Supabase configuration
└── db/
    ├── schema.sql                  # Database schema
    ├── seed.sql                    # Initial data
    └── policies.sql                # RLS policies
```

## Development Context

This system is designed for Argentine healthcare (inspired by HSI - Hospital Information System) and aims to:
- Reduce average wait time by 25-40% within 3 months
- Decrease absenteeism by 10-20%
- Achieve ≥85% schedule occupancy rate
- Maintain ≥95% complete event logging

The MVP excludes patient mobile apps, HSI integration, and emergency/bed management features.

## Key Implementation Notes

### Queue Management (ACTIVO)
- ⚠️ **SIEMPRE usa `daily_queue` para turnos del día, NO `appointment`**
- ⚠️ **Estados correctos**: pendiente → disponible → llamado → atendido (NO esperando/en_consulta)
- ⚠️ **Estructura de paciente**: `patient_name` (string completo), NO `patient_first_name/last_name`
- ⚠️ **Número de orden**: `order_number` (001, 002, 003...), muéstralo en pantalla
- Implement real-time updates via Supabase channels for public displays (table: `daily_queue`)
- Plan for concurrent slot booking scenarios
- **Si ves código usando `appointment`, MÁRCALO como TODO: IMPLEMENTACIÓN FUTURA**

### Users & Professionals Architecture (NUEVA)
**Estructura:**
```
users (tabla base - autenticación y datos personales)
  ├─→ membership (roles por institución)
  │   ├─ role = 'profesional' → debe tener professional_id
  │   ├─ role = 'servicio' → debe tener service_staff record
  │   └─ role = 'admin/administrativo/pantalla' → sin requisitos especiales
  │
  ├─→ professional (SOLO si es profesional que atiende)
  │   ├─ user_id (UNIQUE, link a users)
  │   ├─ professional_type (médico, enfermero, nutricionista, etc)
  │   ├─ speciality (cardiología, pediatría, etc)
  │   ├─ license_number (matrícula)
  │   └─→ professional_room_preference (consultorio preferente, OPCIONAL)
  │   └─→ daily_professional_assignment (asignación HOY a consultorio)
  │
  └─→ service_staff (SOLO si es personal de servicio)
      ├─ user_id
      └─ staff_type (administrativo, enfermería, laboratorio, etc)
```

**Flujos Principales:**
1. **Crear usuario como PROFESIONAL:**
   - Crear registro en `users`
   - Crear membresía con role = 'profesional'
   - Crear registro en `professional` con user_id
   - OPCIONALMENTE crear preferencia de consultorio

2. **Asignar consultorio A PROFESIONAL:**
   - Usar tabla `daily_professional_assignment` (NOT `professional_room_preference`)
   - `professional_room_preference` = preferencia (dónde le gusta estar)
   - `daily_professional_assignment` = asignación REAL para HOY
   - Una fila por día = un profesional puede cambiar de consultorio cada día

3. **Crear usuario como SERVICIO:**
   - Crear registro en `users`
   - Crear membresía con role = 'servicio'
   - Crear registro en `service_staff` con user_id
   - Asignar a `user_service` (servicio específico como Control de Enfermería)

**CRITICAL TABLES FOR PROFESSIONALS:**
- `professional` → metadata del profesional (especialidad, matrícula, user_id)
- `professional_room_preference` → consultorio PREFERENTE (opcional, puede ser NULL)
- `daily_professional_assignment` → asignación REAL para un día específico
- NO confundir: preferencia ≠ asignación

### General Implementation
- Use Spanish for user-facing text and database content (Argentine healthcare context)
- Ensure proper RLS policies for multi-institutional access
- Consider accessibility requirements for public displays