# Plan de Próximos Pasos - Turnero ZS

**Fecha de Análisis**: 2025-10-03
**Estado del Proyecto**: Sprint 1 Completado ✅ - Errores TypeScript Pendientes 🔴

---

## Estado Actual del Proyecto

### ✅ Completado (Sprint 1)
- **Infraestructura Base**: shadcn/ui completamente configurado (13 componentes)
- **CRUD Zonas**: `/app/(dashboard)/zonas/page.tsx`
- **CRUD Instituciones**: `/app/(dashboard)/instituciones/page.tsx`
- **CRUD Profesionales**: `/app/(dashboard)/profesionales/page.tsx`
- **CRUD Pacientes**: `/app/(dashboard)/pacientes/page.tsx` (validación DNI argentino)
- **CRUD Usuarios/Membresías**: `/app/(dashboard)/usuarios/page.tsx` (sistema de roles)

### 🔴 Errores Críticos Actuales
**Archivo**: `app/(public)/pantalla/[slug]/page.tsx`

```
❌ Property 'slug' does not exist on type 'Institution' (línea 214)
❌ Property 'status' does not exist on type Realtime event (líneas 296-297)
❌ 'audioRef.current' is possibly 'null' (línea 307)
```

**Impacto**: El proyecto no compila (`npm run typecheck` falla)

---

## Próximos Pasos Detallados

### 1. 🔴 PRIORIDAD CRÍTICA: Corregir Errores TypeScript
**Tiempo estimado**: 1-2 horas

**Tareas**:
- [ ] Agregar propiedad `slug` al tipo `Institution` o usar campo existente
- [ ] Tipar correctamente eventos de Supabase Realtime (`status` en payload)
- [ ] Implementar null-safety para `audioRef.current`
- [ ] Ejecutar `npm run typecheck` para verificar
- [ ] Ejecutar `npm run lint` para verificar código

**Archivos afectados**:
- `app/(public)/pantalla/[slug]/page.tsx`
- Posiblemente tipos en `lib/` o definiciones de interfaces

---

### 2. 🟡 SPRINT 2: Sistema de Turnos Completo
**Tiempo estimado**: 2-3 semanas

#### 2A. CRUD Consultorios (Rooms)
**Archivo**: `app/(dashboard)/consultorios/page.tsx` ✅ Ya existe

**Funcionalidades a implementar**:
- [ ] Crear/Editar/Eliminar consultorios
- [ ] Relación con instituciones (select dropdown)
- [ ] Campos: nombre, número, piso, estado (activo/inactivo)
- [ ] Capacidad (opcional para salas de espera)
- [ ] Tabla con listado y filtros

**Modelo de datos**:
```typescript
interface Room {
  id: string
  institution_id: string
  name: string
  room_number: string
  floor?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

---

#### 2B. CRUD Servicios (Services)
**Archivo**: `app/(dashboard)/servicios/page.tsx` ✅ Ya existe

**Funcionalidades a implementar**:
- [ ] Crear/Editar/Eliminar servicios médicos
- [ ] Relación con instituciones
- [ ] Asignación a profesionales (relación many-to-many)
- [ ] Campos: nombre, descripción, duración estimada
- [ ] Color para identificación visual

**Modelo de datos**:
```typescript
interface Service {
  id: string
  institution_id: string
  name: string
  description?: string
  duration_minutes: number
  color?: string
  is_active: boolean
}
```

---

#### 2C. Sistema de Horarios y Agenda
**Archivos**:
- `app/(dashboard)/horarios/page.tsx` ✅ Ya existe
- `app/(dashboard)/agenda/page.tsx` ✅ Ya existe

**Funcionalidades a implementar**:
- [ ] Definir horarios de trabajo de profesionales
- [ ] Configuración por día de semana
- [ ] Generación automática de slots de turnos
- [ ] Gestión de excepciones (feriados, ausencias)
- [ ] Vista de calendario mensual/semanal

**Modelo de datos**:
```typescript
interface Schedule {
  id: string
  professional_id: string
  day_of_week: number // 0-6 (domingo-sábado)
  start_time: string  // HH:MM
  end_time: string    // HH:MM
  slot_duration: number // minutos
  is_active: boolean
}

interface Slot {
  id: string
  professional_id: string
  service_id?: string
  datetime: string
  is_available: boolean
  locked_until?: string // Para concurrencia
}
```

---

#### 2D. Refactorizar Sistema de Turnos
**Archivos existentes** (3 versiones):
- `app/(dashboard)/turnos/page.tsx`
- `app/(dashboard)/turnos/page-simple.tsx`
- `app/(dashboard)/turnos/page-original.tsx`

**Tareas**:
- [ ] Analizar las 3 versiones y consolidar en una sola
- [ ] Implementar máquina de estados completa:
  - `pendiente` → `esperando` → `llamado` → `en_consulta` → `finalizado`
  - Transiciones: `cancelado`, `ausente`
- [ ] Integrar sistema de bloqueo de slots (ver `db/slot-locks-schema.sql`)
- [ ] Prevenir doble reserva con transacciones
- [ ] Añadir filtros: fecha, profesional, servicio, estado
- [ ] Búsqueda de pacientes por DNI/nombre
- [ ] Confirmación de turnos
- [ ] Notificaciones (toast) para cambios de estado

**Componentes necesarios**:
- Selector de fecha (react-day-picker ya instalado)
- Selector de horarios disponibles
- Formulario de reserva
- Tabla de turnos con acciones

---

#### 2E. Vista de Turnos Disponibles
**Archivo**: `app/(dashboard)/turnos-disponibles/page.tsx` ✅ Ya existe

**Funcionalidades**:
- [ ] Vista pública/administrativa de slots disponibles
- [ ] Filtros: institución, profesional, servicio, rango de fechas
- [ ] Calendario visual con disponibilidad
- [ ] Indicadores de ocupación (X disponibles de Y totales)
- [ ] Opción de reserva rápida

---

### 3. 🟢 SPRINT 3: Real-time y Experiencia del Usuario
**Tiempo estimado**: 1-2 semanas

#### 3A. Pantalla Pública (Ya iniciada)
**Archivo**: `app/(public)/pantalla/[slug]/page.tsx`

**Mejoras a implementar**:
- [x] Corrección de errores TypeScript (debe hacerse primero)
- [ ] Optimizar suscripción a Supabase Realtime channels
- [ ] Mejorar sistema de llamados con sonido (TTS o audio pregrabado)
- [ ] Añadir animaciones de transición
- [ ] Modo de accesibilidad (alto contraste, texto grande)
- [ ] Soporte multi-idioma (español/guaraní para contexto argentino)
- [ ] Visualización de múltiples consultorios simultáneos
- [ ] Indicador de conexión en tiempo real

**Características actuales detectadas**:
- ✅ Suscripción a eventos de llamados
- ✅ Visualización de turnos en espera y en consulta
- ✅ Toggle de sonido
- ✅ Anonimización de nombres

---

#### 3B. Vista de Profesional (Llamar Pacientes)
**Archivo**: `app/(dashboard)/profesional/page.tsx` ✅ Ya existe

**Funcionalidades a implementar**:
- [ ] Lista de turnos asignados al profesional (filtro por usuario logueado)
- [ ] Botón "Llamar Paciente" (cambia estado a `llamado`)
- [ ] Botón "Iniciar Consulta" (cambia estado a `en_consulta`)
- [ ] Botón "Finalizar" (cambia estado a `finalizado`)
- [ ] Registro automático de eventos de llamado (tabla `call_events`)
- [ ] Temporizador de tiempo en consulta
- [ ] Notas rápidas de consulta
- [ ] Marcar como ausente/cancelado
- [ ] Visualización de historia de turnos del paciente

**Integración Realtime**:
- Emitir eventos al llamar paciente para actualizar pantalla pública
- Escuchar confirmaciones de paciente (opcional para futuro)

---

### 4. 🔵 SPRINT 4: Consolidación de Base de Datos
**Tiempo estimado**: 1 semana

#### Archivos de DB Actuales
```
db/
├── schema.sql                          # Schema principal ✅
├── seed.sql                            # Datos iniciales ✅
├── policies.sql                        # Políticas RLS v1
├── policies-simple.sql                 # Políticas RLS v2
├── policies-fixed.sql                  # Políticas RLS v3
├── institutional-rls-policies.sql      # Políticas RLS v4
├── advanced-rls-policies.sql           # Políticas avanzadas
├── slot-locks-schema.sql               # Sistema de bloqueo ⚠️
├── authentication-setup.sql            # Setup autenticación ⚠️
├── authentication-test.sql             # Tests autenticación
└── [varios scripts de backup/reset]
```

**Tareas**:
- [ ] **Consolidar políticas RLS**: Analizar las 4 versiones y crear una definitiva
- [ ] **Implementar slot locking**: Integrar `slot-locks-schema.sql` al schema principal
- [ ] **Migrar a Supabase**: Aplicar migrations vía Supabase CLI
- [ ] **Verificar RLS**: Tests de aislamiento multi-tenant
- [ ] **Setup autenticación**: Implementar `authentication-setup.sql`
- [ ] **Crear usuarios demo**: Ejecutar `demo-users-setup.sql`
- [ ] **Documentar schema**: Actualizar README con diagrama ER
- [ ] **Scripts de mantenimiento**: Consolidar archivos de backup/reset

**Políticas RLS críticas a implementar**:
- Usuarios solo ven instituciones donde tienen membresía
- Profesionales solo ven sus propios turnos
- Pantalla pública solo accede a datos anónimos de su institución
- Administradores pueden gestionar su institución completa

---

### 5. 📊 SPRINT 5: Dashboard y Reportes
**Tiempo estimado**: 1 semana

#### Reportes y Métricas
**Archivo**: `app/(dashboard)/reportes/page.tsx` ✅ Ya existe

**Funcionalidades a implementar**:
- [ ] **Métricas clave**:
  - Tiempo de espera promedio (objetivo: reducir 25-40%)
  - Tasa de absentismo (objetivo: reducir 10-20%)
  - Ocupación de agenda (objetivo: ≥85%)
  - Cantidad de turnos por estado
  - Turnos por profesional/servicio

- [ ] **Gráficos** (usar Recharts):
  - Línea de tiempo: turnos por día/semana/mes
  - Barras: distribución por estado
  - Torta: turnos por servicio
  - Heatmap: horarios más demandados

- [ ] **Filtros**:
  - Rango de fechas
  - Institución
  - Profesional
  - Servicio

- [ ] **Exportación**:
  - CSV para análisis externo
  - PDF para reportes ejecutivos

#### Dashboard Principal
**Archivo**: `app/(dashboard)/dashboard/page.tsx` ✅ Ya existe

**Funcionalidades**:
- [ ] Resumen de turnos del día (tarjetas con números)
- [ ] Lista de turnos próximos
- [ ] Alertas: slots vacíos, ausencias del día
- [ ] Accesos rápidos según rol del usuario
- [ ] Estadísticas en tiempo real

---

## Riesgos y Deuda Técnica Identificada

### 🔴 Críticos
1. **Múltiples versiones de archivos sin consolidar**:
   - `turnos/page.tsx` (3 versiones)
   - Políticas RLS (4 archivos diferentes)

2. **Autenticación no integrada**: Archivos SQL presentes pero no aplicados

3. **Sistema de concurrencia incompleto**: `slot-locks-schema.sql` no integrado

### 🟡 Importantes
4. **Falta de tests**: No hay framework configurado (Jest instalado pero sin tests)

5. **Validación de datos**: Falta validación robusta en formularios (usar Zod más extensivamente)

6. **Manejo de errores**: No hay estrategia unificada de error boundaries

### 🟢 Deseables
7. **Optimización de queries**: Falta paginación en listados grandes

8. **Caché**: No hay estrategia de caché para datos estáticos

9. **Logs y auditoría**: Falta sistema de auditoría de acciones críticas

---

## Dependencias y Tecnologías Disponibles

### Ya instaladas ✅
- **UI**: shadcn/ui 3, Tailwind CSS 4, Lucide Icons
- **Formularios**: react-hook-form, @hookform/resolvers, zod
- **Fechas**: date-fns, react-day-picker
- **Backend**: Supabase (SSR, Auth, Realtime)
- **Gráficos**: Recharts
- **Testing**: Jest, Testing Library (sin configurar)

### Por considerar 🔵
- **Notificaciones push**: Para recordatorios de turnos
- **Email**: Para confirmaciones (Supabase tiene integración)
- **SMS**: Para recordatorios (requiere servicio externo)
- **PDF generation**: Para comprobantes de turnos
- **Telemetría**: Para monitorear performance

---

## Orden de Ejecución Recomendado

```
┌─────────────────────────────────────────────────┐
│ FASE 0: CORRECCIÓN INMEDIATA (Día 1)           │
├─────────────────────────────────────────────────┤
│ 1. Corregir errores TypeScript                 │
│ 2. Verificar build exitoso                     │
│ 3. Commit: "fix: typescript errors en pantalla" │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SPRINT 2: TURNOS CORE (Semanas 1-2)            │
├─────────────────────────────────────────────────┤
│ Semana 1:                                       │
│ - 2A. CRUD Consultorios (2 días)               │
│ - 2B. CRUD Servicios (2 días)                  │
│ - 2C. Sistema Horarios inicio (1 día)          │
│                                                 │
│ Semana 2:                                       │
│ - 2C. Sistema Horarios completar (2 días)      │
│ - 2D. Refactorizar Turnos (2 días)             │
│ - 2E. Turnos Disponibles (1 día)               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SPRINT 3: REAL-TIME (Semanas 3-4)              │
├─────────────────────────────────────────────────┤
│ Semana 3:                                       │
│ - 3B. Vista Profesional (3 días)               │
│ - 3A. Pantalla Pública mejoras (2 días)        │
│                                                 │
│ Semana 4:                                       │
│ - Testing integral (3 días)                    │
│ - Ajustes de UX (2 días)                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SPRINT 4: BASE DE DATOS (Semana 5)             │
├─────────────────────────────────────────────────┤
│ - 4. Consolidar RLS (2 días)                   │
│ - 4. Implementar slot locking (1 día)          │
│ - 4. Migrar a Supabase (1 día)                 │
│ - 4. Setup autenticación (1 día)               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SPRINT 5: REPORTES (Semana 6)                  │
├─────────────────────────────────────────────────┤
│ - 5. Dashboard (2 días)                        │
│ - 5. Reportes y gráficos (2 días)              │
│ - Documentación final (1 día)                  │
└─────────────────────────────────────────────────┘
```

---

## Criterios de Éxito por Sprint

### Sprint 2: Turnos Core
- ✅ CRUD consultorios y servicios funcional
- ✅ Sistema de horarios genera slots correctamente
- ✅ Solo una versión de `turnos/page.tsx` (consolidada)
- ✅ Se pueden crear turnos sin conflictos
- ✅ `npm run typecheck` pasa sin errores
- ✅ `npm run lint` pasa sin warnings

### Sprint 3: Real-time
- ✅ Profesional puede llamar pacientes desde su panel
- ✅ Pantalla pública se actualiza en <2 segundos
- ✅ Sistema de sonido funciona correctamente
- ✅ Estados de turnos se registran en `call_events`
- ✅ No hay memory leaks en suscripciones Realtime

### Sprint 4: Base de Datos
- ✅ Una sola versión de políticas RLS
- ✅ RLS impide acceso cross-tenant
- ✅ Slot locking previene doble reserva
- ✅ Autenticación funciona con roles
- ✅ Datos demo cargados correctamente

### Sprint 5: Reportes
- ✅ Dashboard muestra métricas en tiempo real
- ✅ Reportes generan datos correctos
- ✅ Gráficos son legibles y útiles
- ✅ Exportación CSV funciona
- ✅ Performance <2s para queries de reportes

---

## Próximas Decisiones Requeridas

1. **¿Consolidar archivos ahora o después?**
   - Turnos: ¿Cuál de las 3 versiones es la base?
   - RLS: ¿Cuál política es la más completa?

2. **¿Implementar autenticación antes o después de Sprint 2?**
   - Pro de antes: Desarrollo con contexto de usuario real
   - Pro de después: Más funcionalidad visible primero

3. **¿Configurar testing ahora o al final?**
   - Jest ya instalado pero sin tests
   - ¿Test-driven o testing después de MVP?

4. **¿Modo de desarrollo?**
   - ¿Usar Supabase local o proyecto cloud?
   - ¿Configurar Git hooks con lint/typecheck?

---

## Recursos y Referencias

### Documentación
- Next.js 15: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS 4: https://tailwindcss.com

### Archivos de Referencia en Proyecto
- `CLAUDE.md`: Instrucciones del proyecto
- `docs/sprint_1_completed.md`: Detalle de lo completado (en memoria)
- `db/schema.sql`: Schema completo de base de datos
- `components.json`: Configuración shadcn/ui

### Memoria del Proyecto (`.serena/memories/`)
- `project_overview.md`
- `project_structure.md`
- `code_style_and_conventions.md`
- `sprint_1_completed.md`
- `task_completion_checklist.md`

---

## Notas Finales

Este documento debe actualizarse conforme se completen sprints. Cada sprint debe terminar con:

1. ✅ Todos los tests pasando (cuando existan)
2. ✅ `npm run typecheck` sin errores
3. ✅ `npm run lint` sin warnings
4. ✅ `npm run build` exitoso
5. ✅ Update de memoria `.serena` con progreso
6. ✅ Commit descriptivo en Git

---

**Documento generado**: 2025-10-03
**Próxima revisión**: Después de completar correcciones TypeScript
