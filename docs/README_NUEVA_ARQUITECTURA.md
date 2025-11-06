# 🎯 Nueva Arquitectura: Usuarios, Profesionales y Asignación de Consultorios

## 📌 Start Here - Comienza Aquí

Si eres nuevo a esta arquitectura, sigue este orden:

1. **Este archivo** (5 min) - Entender el concepto
2. **ARQUITECTURA_USUARIOS_PROFESIONALES.md** (20 min) - Modelo completo
3. **IMPLEMENTACION_RESUMEN.md** (10 min) - Qué se creó
4. **CHECKLIST_APLICAR_MIGRACIONES.md** (30 min) - Ejecutar cambios

---

## 🎬 El Problema (Que Resolvimos)

### Antes: Confusión de Conceptos
```
❌ Un profesional estaba:
   ├─ En tabla users (credenciales)
   ├─ En tabla professional (datos clínicos)
   ├─ En tabla membership (roles)
   └─ SIN saber dónde atiende HOY

❌ Consultorios asignados al crear usuario
   └─ Pero Dr. Juan puede usar CUALQUIERA según el día
   └─ Pero Dr. Oyola prefiere consultorio 3 (pero puede cambiar)
   └─ Pero eventos ministeriales requieren cambios temporales

❌ No hay claridad:
   ├─ ¿Es profesional o servicio?
   ├─ ¿Qué tipo de profesional?
   ├─ ¿Dónde atiende hoy?
   └─ ¿Quién lo asignó y por qué?
```

### Después: Claridad Total
```
✅ Usuario (users)
   └─ Email, contraseña, datos de login

✅ Profesional (professional) - SI lo es
   ├─ Tipo: Médico, Nutricionista, etc
   ├─ Especialidad: Cardiología, etc
   ├─ Vinculado 1:1 a Usuario

✅ Preferencia de Consultorio (professional_room_preference) - OPCIONAL
   ├─ Dr. Oyola prefiere consultorio 3 normalmente
   ├─ Sistema lo recuerda

✅ Asignación de HOY (daily_professional_assignment) - VARIABLE
   ├─ Dr. Juan hoy → Consultorio 2
   ├─ Dr. Juan mañana → Consultorio 4 (cambió)
   ├─ Dr. Oyola hoy → Consultorio 5 (excepción, evento ministerial)
   ├─ Dr. Oyola mañana → Consultorio 3 (volvió a preferencia)

✅ Auditoría Completa
   ├─ Quién asignó: assigned_by
   ├─ Cuándo: created_at
   ├─ Por qué: assignment_notes
```

---

## 🏗️ Arquitectura en 30 Segundos

```
┌─────────────────────────────────────┐
│           USUARIO DEL SISTEMA       │ (users tabla)
│  Email, Nombre, Contraseña, Login   │
└────────────┬────────────────────────┘
             │
      ┌──────┼──────┐
      │      │      │
      ▼      ▼      ▼
   
PROF  SERV  COORD   ← Qué tipo es
  │     │      │
  │     │      └─→ membership (role: coordinator)
  │     │
  │     └─→ service_staff (administrativo, enfermería, etc)
  │
  └─→ professional (médico, nutricionista, etc)
       │
       ├─→ professional_room_preference (consultorio preferente)
       │   └─ "Dr. Oyola prefiere consultorio 3"
       │
       └─→ daily_professional_assignment (asignación HOY)
           └─ "Dr. Oyola está en consultorio 5 hoy (evento)"
```

---

## 📊 Tablas Nuevas

| Tabla | Propósito | Campos Clave |
|-------|-----------|--------------|
| `professional_room_preference` | Consultorio preferente | professional_id, room_id, is_preferred |
| `daily_professional_assignment` | Asignación de HOY | professional_id, room_id, scheduled_date |
| `service_staff` | Personal de servicio | user_id, staff_type, department |

---

## 🔄 Casos de Uso

### Caso 1: Dr. Juan Pérez - Sin Consultorio Fijo
```
Estado: Usuario + Profesional + SIN preferencia
Lunes:   Consultorio 2
Martes:  Consultorio 4
Miércoles: Consultorio 1
Asignado según disponibilidad diaria
```

### Caso 2: Dr. Oyola - Con Consultorio Preferente
```
Estado: Usuario + Profesional + Preferencia (Consultorio 3)
Lunes:   Consultorio 3 (preferencia)
Martes:  Consultorio 3 (preferencia)
Miércoles: Consultorio 5 (EXCEPCIÓN: evento ministerial)
Jueves:  Consultorio 3 (volvió a preferencia)
```

### Caso 3: Administrativo María - Personal de Servicio
```
Estado: Usuario + ServiceStaff (administrativo)
Función: Gestiona turnos, administrativo, sin consultorio
Acceso: Dashboard, asignaciones, reportes
```

### Caso 4: Coordinador Roberto - Solo Login
```
Estado: Usuario + Membership (role: coordinator)
Función: Acceso a reportes y analytics
Acceso: Dashboard de coordinación
```

---

## 🎯 Página Principal: `/turnero/asignacion-consultorios-dia`

Esta es la página **CENTRAL** donde todo sucede cada día:

```
┌─────────────────────────────────────────────┐
│  ASIGNACIÓN DE CONSULTORIOS PARA HOY        │
├─────────────────────────────────────────────┤
│                                             │
│  Fecha: [Hoy] [Mañana] [Selector]          │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  CONSULTORIO 1 ❌ Disponible                │
│  ┌─────────────────────────────────────┐   │
│  │ [Asignar]                           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  CONSULTORIO 2 ✅ Ocupado                   │
│  ┌─────────────────────────────────────┐   │
│  │ Dr. Juan Pérez                      │   │
│  │ 08:00 - 12:00                       │   │
│  │ [Editar] [Eliminar]                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  CONSULTORIO 3 ✅ Ocupado (Preferencia)     │
│  ┌─────────────────────────────────────┐   │
│  │ Dr. Oyola (Cardiología)             │   │
│  │ 08:00 - 12:00                       │   │
│  │ [Editar] [Eliminar]                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  PREFERENCIAS DE CONSULTORIOS               │
│  ┌─────────────────────────────────────┐   │
│  │ Dr. Juan Pérez  → Sin preferencia   │   │
│  │ Dr. Oyola       → Consultorio 3     │   │
│  │ Dra. García     → Sin preferencia   │   │
│  │ [Editar] [Editar] [Editar]          │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### Workflow Diario:
1. Admin abre página a las 7 AM
2. Ve consultorios disponibles
3. Sistema sugiere asignaciones automáticas (basadas en preferencias)
4. Admin confirma o ajusta
5. Si hay excepciones (evento ministerial), agrega notas
6. Pantalla pública se actualiza automáticamente

---

## 💾 Backend - Hook `useProfessionalRoomAssignment`

```typescript
import { useProfessionalRoomAssignment } from '@/hooks/useProfessionalRoomAssignment'

const {
  assignments,        // Asignaciones para el día seleccionado
  preferences,        // Preferencias de consultorios
  professionals,      // Lista de profesionales
  rooms,             // Lista de consultorios
  
  fetchAssignments,          // Cargar asignaciones de una fecha
  createDailyAssignment,     // Crear asignación
  updateDailyAssignment,     // Editar asignación
  deleteDailyAssignment,     // Eliminar asignación
  savePreference,            // Guardar preferencia de consultorio
  
  getAssignmentsForRoom      // Helper: asignaciones de una sala
} = useProfessionalRoomAssignment()

// Ejemplo:
await createDailyAssignment(
  drJuanId,           // Profesional
  consultorio2Id,     // Consultorio
  institutionId,      // Institución
  '2025-11-05',       // Fecha (HOY)
  '08:00',            // Hora inicio
  '12:00',            // Hora fin
  'Asignación normal' // Notas
)
```

---

## 📝 SQL - Queries Útiles

### Ver quién atiende cada consultorio HOY

```sql
SELECT 
  r.name as consultorio,
  p.first_name || ' ' || p.last_name as profesional,
  dpa.start_time,
  dpa.end_time
FROM daily_professional_assignment dpa
JOIN professional p ON dpa.professional_id = p.id
JOIN room r ON dpa.room_id = r.id
WHERE dpa.scheduled_date = '2025-11-05'
ORDER BY r.name
```

### Ver preferencias de consultorios

```sql
SELECT 
  p.first_name || ' ' || p.last_name as profesional,
  r.name as consultorio_preferente,
  prp.notes
FROM professional p
LEFT JOIN professional_room_preference prp ON p.id = prp.professional_id
LEFT JOIN room r ON prp.room_id = r.id
```

### Historial de asignaciones (auditoría)

```sql
SELECT 
  dpa.scheduled_date,
  p.first_name || ' ' || p.last_name as profesional,
  r.name as consultorio,
  u.first_name || ' ' || u.last_name as asignado_por,
  dpa.assignment_notes,
  dpa.created_at
FROM daily_professional_assignment dpa
JOIN professional p ON dpa.professional_id = p.id
JOIN room r ON dpa.room_id = r.id
LEFT JOIN users u ON dpa.assigned_by = u.id
WHERE dpa.institution_id = 'xxx'
ORDER BY dpa.created_at DESC
```

---

## 🚀 Implementación - Qué Hacer Ahora

### Paso 1: Aplicar Migraciones SQL
```
[ ] Seguir CHECKLIST_APLICAR_MIGRACIONES.md
    └─ 6 migraciones SQL en orden
    └─ ~30 minutos
```

### Paso 2: Verificar Frontend Funciona
```
[ ] npm run build
[ ] npm run dev
[ ] Navegar a /turnero/asignacion-consultorios-dia
```

### Paso 3: Testing
```
[ ] Crear profesional sin preferencia
[ ] Crear profesional con preferencia
[ ] Asignar a consultorio
[ ] Cambiar asignación (excepción)
[ ] Ver preferencias
```

### Paso 4: Integración
```
[ ] Conectar con pantalla pública
[ ] Conectar con turnero diario
[ ] Actualizar /profesionales
[ ] Actualizar /super-admin/usuarios
```

---

## 📚 Documentación

| Archivo | Propósito | Tiempo |
|---------|-----------|--------|
| **Este archivo** | Overview conceptual | 5 min |
| `ARQUITECTURA_USUARIOS_PROFESIONALES.md` | Modelo detallado | 20 min |
| `IMPLEMENTACION_RESUMEN.md` | Qué se creó | 10 min |
| `CHECKLIST_APLICAR_MIGRACIONES.md` | Cómo implementar | 30 min |
| `hooks/useProfessionalRoomAssignment.ts` | Código del hook | referencia |
| `app/(dashboard)/asignacion-consultorios-dia/page.tsx` | Página principal | referencia |

**Total recomendado:** 1-2 horas para entender completamente

---

## ✅ Checklist Mental

Antes de aplicar migraciones, asegúrate de:

```
[ ] Entiendo que profesionales NO tienen consultorio fijo
[ ] Entiendo que consultorios se asignan POR DÍA
[ ] Entiendo que hay PREFERENCIAS (no asignaciones)
[ ] Entiendo que excepciones (eventos) se guardan con notas
[ ] Entiendo la separación: usuarios / profesionales / servicio
[ ] Entiendo que todo está en una página central: /asignacion-consultorios-dia
[ ] He hecho backup de BD antes de aplicar migraciones
[ ] He leído todo lo anterior sin confundirme
```

Si todas las respuestas son SÍ → **Listo para implementar**

---

## 🎓 Para Diferentes Roles

### Para Desarrollador Backend
→ Revisar `ARQUITECTURA_USUARIOS_PROFESIONALES.md` - Modelo de datos

### Para Desarrollador Frontend
→ Revisar `useProfessionalRoomAssignment.ts` y página `/asignacion-consultorios-dia`

### Para DevOps/DBA
→ Revisar `CHECKLIST_APLICAR_MIGRACIONES.md` - Paso a paso de migraciones

### Para Producto/Diseño
→ Revisar este archivo + flujos en `ARQUITECTURA_USUARIOS_PROFESIONALES.md`

### Para Admin del Sistema
→ Revisar `/turnero/asignacion-consultorios-dia` - Cómo usar

---

## 💡 Key Insights

1. **Asignaciones son DIARIAS**
   - No fijas al crear usuario
   - Cambian según disponibilidad
   - Flexible y dinámico

2. **Preferencias son REFERENCIAS**
   - Ayudan al admin
   - No son obligatorias
   - Pueden ignorarse (excepciones)

3. **Auditoría Completa**
   - Quién asignó
   - Cuándo
   - Por qué (notas)

4. **RLS Automático**
   - Admin ve solo su institución
   - Profesional ve solo sus asignaciones
   - Super admin ve todo

---

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si no asigno a un profesional?**  
R: Nada. Es opcional. Atiende si está asignado.

**P: ¿Puede un profesional estar en 2 consultorios a la vez?**  
R: No. Constraint en BD: 1 profesional = 1 asignación por día.

**P: ¿Puede un consultorio tener 2 profesionales a la vez?**  
R: No. Constraint en BD: 1 consultorio = 1 profesional por día.

**P: ¿Cómo cambio la asignación si hay evento?**  
R: Editas en `/asignacion-consultorios-dia`, cambias consultorio, agregas nota.

**P: ¿Dónde guardo que Dr. Oyola prefiere consultorio 3?**  
R: En sección "Preferencias de Consultorios" → Editar → Consultorio 3.

**P: ¿Qué es `is_preferred`?**  
R: Flag booleano: true = "consultorio habitual", false = "flexible, puede usar cualquiera".

---

## 🎉 Conclusión

Esta arquitectura resuelve el problema central:
- ✅ Claridad total sobre quién es qué
- ✅ Asignación flexible de consultorios por día
- ✅ Preferencias memorizadas pero no rígidas
- ✅ Excepciones fáciles de registrar
- ✅ Auditoría completa
- ✅ Interfaz intuitiva

**Siguiente paso:** Abre `CHECKLIST_APLICAR_MIGRACIONES.md` y comienza la implementación.

---

**Versión:** 1.0  
**Fecha:** 2025-11-05  
**Estado:** ✅ Listo para usar
