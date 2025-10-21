# ✅ Checklist Completo: Optimización de Todos los Componentes

**Fecha de inicio:** 2025-10-21
**Estado general:** 🟡 En progreso
**Progreso total:** 1/22 componentes completados (4.5%)

---

## 📋 Índice

1. [Fase Preparatoria](#fase-preparatoria)
2. [Dashboard Normal](#dashboard-normal)
3. [Super Admin Dashboard](#super-admin-dashboard)
4. [Validación y Documentación](#validación-y-documentación)

---

## 🎯 Fase Preparatoria: Creación de Hooks y Componentes Base

### Hook 1: `useCrudOperation` 🔥
**Archivo:** `hooks/useCrudOperation.ts`
**Tiempo estimado:** 2-3 horas
**Prioridad:** ⭐⭐⭐⭐⭐ CRÍTICO

- [ ] Crear hook genérico con TypeScript generics
- [ ] Implementar operaciones:
  - [ ] `create(data)` - Crear con optimistic update
  - [ ] `update(id, data)` - Actualizar con optimistic update
  - [ ] `delete(id)` - Eliminar con confirmación
  - [ ] `fetchAll()` - Cargar todos los items
  - [ ] `fetchOne(id)` - Cargar un item
- [ ] Gestión de estados:
  - [ ] `items: T[]` - Array de items
  - [ ] `isLoading: boolean` - Carga inicial
  - [ ] `isSaving: boolean` - Guardando cambios
  - [ ] `error: Error | null` - Manejo de errores
- [ ] Funcionalidades adicionales:
  - [ ] Rollback automático en error
  - [ ] Callback `onSuccess` personalizable
  - [ ] Callback `onError` personalizable
  - [ ] Transformación de datos con `transformFn`
- [ ] Documentación JSDoc completa
- [ ] Tests unitarios básicos
- [ ] Ejemplos de uso en documentación

**Componentes que lo usarán (14):**
- `/pacientes`, `/servicios`, `/consultorios`, `/horarios`, `/usuarios` (dashboard)
- `/profesionales`, `/usuarios`, `/instituciones`, `/zonas` (super-admin)

---

### Hook 2: `useInstitutionContext` 🔥
**Archivo:** `hooks/useInstitutionContext.ts`
**Tiempo estimado:** 30-45 min
**Prioridad:** ⭐⭐⭐⭐⭐ CRÍTICO

- [ ] Leer `institution_context` de localStorage
- [ ] Retornar objeto parseado o null
- [ ] Helpers adicionales:
  - [ ] `isAdmin()` - Verifica si es admin
  - [ ] `isAdministrativo()` - Verifica si es administrativo
  - [ ] `hasRole(role)` - Verifica rol específico
  - [ ] `requireContext()` - Lanza error si no hay contexto
- [ ] Memoización con `useMemo`
- [ ] Documentación JSDoc
- [ ] Ejemplos de uso

**Componentes que lo usarán (18+):** Casi todos los componentes del dashboard

---

### Hook 3: `useFormState`
**Archivo:** `hooks/useFormState.ts`
**Tiempo estimado:** 1-1.5 horas
**Prioridad:** ⭐⭐⭐⭐

- [ ] Gestión de estado de formulario genérico
- [ ] Funciones:
  - [ ] `updateField(field, value)` - Actualizar campo
  - [ ] `resetForm()` - Resetear a valores iniciales
  - [ ] `setErrors(errors)` - Establecer errores
  - [ ] `clearError(field)` - Limpiar error específico
- [ ] Estados:
  - [ ] `formData: T`
  - [ ] `errors: Partial<Record<keyof T, string>>`
  - [ ] `isDirty: boolean`
  - [ ] `isValid: boolean`
- [ ] Validación opcional integrada
- [ ] Documentación y ejemplos

**Componentes que lo usarán (10+):** Todos los componentes con formularios

---

### Hook 4: `useToggleState`
**Archivo:** `hooks/useToggleState.ts`
**Tiempo estimado:** 30-45 min
**Prioridad:** ⭐⭐⭐

- [ ] Toggle genérico de campos boolean en Supabase
- [ ] Optimistic update local
- [ ] Rollback en error
- [ ] Loading state por item (`isToggling: Record<string, boolean>`)
- [ ] Documentación y ejemplos

**Componentes que lo usarán (4):** `/servicios`, `/consultorios`, `/profesionales` (dashboard e instituciones)

---

### Hook 5: `useMultipleDataFetch`
**Archivo:** `hooks/useMultipleDataFetch.ts`
**Tiempo estimado:** 2 horas
**Prioridad:** ⭐⭐⭐

- [ ] Coordinar múltiples queries de Supabase
- [ ] Loading state global
- [ ] Errors individuales por query
- [ ] `refetch()` - Recargar todas las queries
- [ ] `refetchOne(key)` - Recargar query específica
- [ ] Documentación y ejemplos

**Componentes que lo usarán (4):** `/horarios`, `/agenda`, `/reportes`, `/usuarios` (super-admin)

---

### Hook 6: `useCascadeSelect`
**Archivo:** `hooks/useCascadeSelect.ts`
**Tiempo estimado:** 1.5 horas
**Prioridad:** ⭐⭐⭐

- [ ] Select cascada: zona → institución → otros
- [ ] Reset automático de selects dependientes
- [ ] Loading states independientes
- [ ] Filtrado automático de opciones
- [ ] Documentación y ejemplos

**Componentes que lo usarán (5):** `/reportes`, `/horarios`, `/usuarios` (super-admin), etc.

---

### Componente 1: `CrudDialog`
**Archivo:** `components/crud/CrudDialog.tsx`
**Tiempo estimado:** 2 horas
**Prioridad:** ⭐⭐⭐⭐⭐ CRÍTICO

- [ ] Dialog genérico con formulario
- [ ] Props:
  - [ ] `isOpen`, `onOpenChange`
  - [ ] `title` (dinámico: "Crear" / "Editar")
  - [ ] `editingItem`
  - [ ] `onSubmit`
  - [ ] `children` (render prop para campos)
- [ ] Botones de acción (Cancelar, Guardar)
- [ ] Loading state en botón
- [ ] Cierre automático en éxito
- [ ] Reset de formulario al cerrar
- [ ] Documentación y ejemplos

**Componentes que lo usarán (10+):** Todos los CRUD

---

### Componente 2: `DeleteConfirmation`
**Archivo:** `components/crud/DeleteConfirmation.tsx`
**Tiempo estimado:** 45 min
**Prioridad:** ⭐⭐⭐⭐

- [ ] AlertDialog genérico para confirmación
- [ ] Props:
  - [ ] `isOpen`, `onOpenChange`
  - [ ] `itemName` (nombre del item a eliminar)
  - [ ] `onConfirm`
  - [ ] `warningMessage` (opcional)
- [ ] Botones Cancelar y Eliminar
- [ ] Loading state en botón
- [ ] Variante danger para botón eliminar
- [ ] Documentación y ejemplos

**Componentes que lo usarán (10+):** Todos los CRUD con eliminación

---

### Componente 3: `CrudTable`
**Archivo:** `components/crud/CrudTable.tsx`
**Tiempo estimado:** 2-3 horas
**Prioridad:** ⭐⭐⭐

- [ ] Tabla genérica con acciones
- [ ] Props:
  - [ ] `data: T[]`
  - [ ] `columns: ColumnDef<T>[]`
  - [ ] `onEdit?: (item: T) => void`
  - [ ] `onDelete?: (item: T) => void`
  - [ ] `customActions?: Action[]`
- [ ] Loading skeleton
- [ ] Empty state
- [ ] Documentación y ejemplos

**Componentes que lo usarán (8+):** Mayoría de listados

---

### Refactor: Mover Helpers Generales
**Archivos:**
- `lib/turnos/helpers.ts` → `lib/supabase/helpers.ts`
- `lib/turnos/transforms.ts` → `lib/supabase/transforms.ts`

**Tiempo estimado:** 30 min
**Prioridad:** ⭐⭐⭐⭐

- [ ] Mover `getInstitutionContext()` → `lib/supabase/helpers.ts`
- [ ] Mover `getNowISO()` → `lib/supabase/helpers.ts`
- [ ] Mover `getTodayISO()` → `lib/supabase/helpers.ts`
- [ ] Mover `isAdminOrAdministrativo()` → `lib/supabase/helpers.ts`
- [ ] Crear `lib/supabase/transforms.ts` con funciones genéricas:
  - [ ] `transformRelationalData<T>(data, schema)`
  - [ ] `normalizeNestedData<T>(data, paths)`
- [ ] Actualizar imports en `/turnos`
- [ ] Verificar que todo compila sin errores

---

### Validación de Fase Preparatoria
- [ ] Todos los hooks creados y documentados
- [ ] Todos los componentes base creados
- [ ] Tests unitarios de hooks pasan
- [ ] Compilación sin errores TypeScript
- [ ] Commit: `feat: crear hooks y componentes base reutilizables`

**Tiempo total estimado Fase Preparatoria:** 12-16 horas

---

## 📦 Dashboard Normal: app/(dashboard)/

### ✅ 1. Cola del Día - `/turnos`
**Archivo:** `app/(dashboard)/turnos/page.tsx`
**Líneas actuales:** 662 (YA OPTIMIZADO)
**Estado:** ✅ COMPLETADO (Fase 2 - Paso 4)

**Trabajo realizado:**
- ✅ Optimistic updates implementados
- ✅ Realtime granular sin fetchData()
- ✅ Componentes extraídos: PatientCard, AddPatientDialog, QueueFilters, StatusLegend, QueueStats
- ✅ Helpers y transforms en archivos separados
- ✅ Reducción de 47% (1250 → 662 líneas)

**Validación:**
- ✅ Funcionalidad preservada al 100%
- ✅ 0 errores TypeScript
- ✅ Usuario confirmó: "funciona perfectamente"

---

### 2. Dashboard Principal - `/dashboard` 📊
**Archivo:** `app/(dashboard)/dashboard/page.tsx`
**Líneas actuales:** 455
**Reducción esperada:** 25-30% → ~320 líneas
**Tiempo estimado:** 2 horas
**Complejidad:** Media
**Prioridad:** ⭐⭐⭐

**Análisis:**
- READ de estadísticas del día
- Información de profesionales y servicios activos
- Lista de turnos recientes
- Cambio de institución
- Acciones rápidas de navegación

**Tareas:**
- [ ] Leer archivo actual y analizar estructura
- [ ] Identificar código duplicado
- [ ] Aplicar `useInstitutionContext()`
- [ ] Extraer componentes:
  - [ ] `StatCard` - Card de estadística
  - [ ] `QuickActionCard` - Tarjeta de acción rápida
  - [ ] `RecentTurnos` - Lista de turnos recientes
- [ ] Aplicar helpers de `lib/supabase/helpers.ts`
- [ ] Optimizar fetches con `useMemo`
- [ ] Verificar funcionalidad
- [ ] Commit: `refactor: optimizar dashboard principal`

**Validación:**
- [ ] Funcionalidad preservada
- [ ] 0 errores TypeScript
- [ ] Reducción de líneas verificada

---

### 3. Gestión de Pacientes - `/pacientes` 🏥
**Archivo:** `app/(dashboard)/pacientes/page.tsx`
**Líneas actuales:** 486
**Reducción esperada:** 45% → ~267 líneas
**Tiempo estimado:** 2-3 horas
**Complejidad:** Media
**Prioridad:** ⭐⭐⭐⭐⭐ ALTA

**Análisis:**
- CRUD completo (Create, Read, Update, Delete)
- Dialog para crear/editar
- AlertDialog para confirmación de eliminación
- Cálculo automático de edad
- Formato de DNI

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useCrudOperation<Patient>`
- [ ] Aplicar `useInstitutionContext()`
- [ ] Reemplazar dialog con `CrudDialog`
- [ ] Reemplazar confirmación con `DeleteConfirmation`
- [ ] Aplicar `useFormState` para formulario
- [ ] Extraer componentes:
  - [ ] `PatientFormFields` - Campos del formulario
  - [ ] `PatientRow` - Fila de tabla (si es compleja)
- [ ] Verificar cálculo de edad funciona
- [ ] Verificar formato de DNI
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar gestión de pacientes con hooks CRUD`

**Validación:**
- [ ] CRUD funciona correctamente
- [ ] Validaciones preservadas
- [ ] 0 errores TypeScript
- [ ] Reducción de líneas verificada

---

### 4. Gestión de Servicios - `/servicios` 🏥
**Archivo:** `app/(dashboard)/servicios/page.tsx`
**Líneas actuales:** 603
**Reducción esperada:** 50% → ~301 líneas
**Tiempo estimado:** 2-3 horas
**Complejidad:** Media
**Prioridad:** ⭐⭐⭐⭐⭐ ALTA

**Análisis:**
- CRUD completo
- Toggle activar/desactivar (`is_active`)
- Select de duraciones predefinidas
- Agrupación por institución

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useCrudOperation<Service>`
- [ ] Aplicar `useToggleState` para `is_active`
- [ ] Aplicar `useInstitutionContext()`
- [ ] Reemplazar dialog con `CrudDialog`
- [ ] Reemplazar confirmación con `DeleteConfirmation`
- [ ] Extraer componentes:
  - [ ] `ServiceFormFields` - Campos del formulario
  - [ ] `ServiceGroupByInstitution` - Agrupación
- [ ] Verificar toggle funciona
- [ ] Verificar select de duraciones
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar gestión de servicios con hooks CRUD`

**Validación:**
- [ ] CRUD funciona correctamente
- [ ] Toggle is_active funciona
- [ ] Agrupación por institución funciona
- [ ] 0 errores TypeScript
- [ ] Reducción de líneas verificada

---

### 5. Gestión de Consultorios - `/consultorios` 🚪
**Archivo:** `app/(dashboard)/consultorios/page.tsx`
**Líneas actuales:** 544
**Reducción esperada:** 50% → ~272 líneas
**Tiempo estimado:** 2 horas
**Complejidad:** Media
**Prioridad:** ⭐⭐⭐⭐⭐ ALTA

**Análisis:**
- Estructura casi idéntica a `/servicios`
- CRUD completo
- Toggle activar/desactivar
- Agrupación por institución

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useCrudOperation<Room>`
- [ ] Aplicar `useToggleState` para `is_active`
- [ ] Aplicar `useInstitutionContext()`
- [ ] Reemplazar dialog con `CrudDialog`
- [ ] Reemplazar confirmación con `DeleteConfirmation`
- [ ] Reutilizar componentes de `/servicios` si es posible
- [ ] Verificar iconos de puerta funciona
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar gestión de consultorios con hooks CRUD`

**Validación:**
- [ ] CRUD funciona correctamente
- [ ] Toggle is_active funciona
- [ ] Agrupación por institución funciona
- [ ] 0 errores TypeScript
- [ ] Reducción de líneas verificada

---

### 6. Gestión de Horarios - `/horarios` ⏰
**Archivo:** `app/(dashboard)/horarios/page.tsx`
**Líneas actuales:** 822
**Reducción esperada:** 30% → ~575 líneas
**Tiempo estimado:** 3-4 horas
**Complejidad:** ALTA
**Prioridad:** ⭐⭐⭐⭐

**Análisis:**
- CRUD de plantillas de horarios
- Select cascada (profesional → institución → servicios/consultorios)
- Cálculo automático de turnos por día
- Días de la semana
- Validación de intervalos

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useCrudOperation<SlotTemplate>`
- [ ] Aplicar `useMultipleDataFetch` para profesionales, servicios, consultorios
- [ ] Aplicar `useCascadeSelect` para selects dependientes
- [ ] Aplicar `useInstitutionContext()`
- [ ] Reemplazar dialog con `CrudDialog`
- [ ] Reemplazar confirmación con `DeleteConfirmation`
- [ ] Extraer componentes:
  - [ ] `SlotTemplateFormFields` - Campos del formulario
  - [ ] `DaySelector` - Selector de días
  - [ ] `TimeRangeSelector` - Selector de rango horario
  - [ ] `SlotCalculator` - Mostrar cálculo de turnos
- [ ] Mantener lógica de cálculo de slots
- [ ] Verificar validación de intervalos
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar gestión de horarios con hooks y componentes`

**Validación:**
- [ ] CRUD funciona correctamente
- [ ] Select cascada funciona
- [ ] Cálculo de slots correcto
- [ ] Validaciones preservadas
- [ ] 0 errores TypeScript
- [ ] Reducción de líneas verificada

---

### 7. Asignaciones Diarias - `/asignaciones` 👨‍⚕️ ✅
**Archivo:** `app/(dashboard)/asignaciones/page.tsx`
**Líneas:** 386 → 399 (agregado DeleteConfirmation para mejor UX)
**Tiempo:** ~40 minutos
**Complejidad:** Media
**Prioridad:** ⭐⭐⭐

**Análisis:**
- CREATE, READ, DELETE (no UPDATE)
- Asignación de profesionales a consultorios
- Prevención de duplicados
- ✅ Agregado DeleteConfirmation (antes inline sin confirmación)

**Cambios realizados:**
- [x] Aplicar `useCrudOperation<Assignment>` (solo CREATE y DELETE)
- [x] Aplicar `useInstitutionContext()` para obtener institution_id
- [x] Usar helpers `getTodayISO()` y `formatFullName()`
- [x] Agregar `DeleteConfirmation` dialog (mejora UX vs inline delete)
- [x] transformFn para aplanar datos de professional y room
- [x] Validación TypeScript: ✅ Sin errores

**Validación:**
- [x] TypeScript compila sin errores
- [ ] Pruebas manuales: CREATE y DELETE
- [ ] Prevención de duplicados funciona

**Nota:** No hubo reducción de líneas porque se agregó DeleteConfirmation dialog (mejor UX), pero se eliminó código duplicado usando hooks centralizados.

---

### 8. Gestión de Usuarios - `/usuarios` 👥
**Archivo:** `app/(dashboard)/usuarios/page.tsx`
**Líneas actuales:** 925
**Reducción esperada:** 40% → ~555 líneas
**Tiempo estimado:** 4-5 horas
**Complejidad:** ALTA
**Prioridad:** ⭐⭐⭐⭐

**Análisis:**
- CRUD DUAL (usuarios + membresías)
- Tabs: Usuarios, Membresías
- Dialogs separados
- Roles: admin, administrativo, médico, enfermeria, pantalla

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useCrudOperation<User>` para usuarios
- [ ] Aplicar `useCrudOperation<Membership>` para membresías
- [ ] Aplicar `useInstitutionContext()`
- [ ] Crear hook personalizado `useUserMemberships` si es necesario
- [ ] Reemplazar dialogs con `CrudDialog`
- [ ] Reemplazar confirmaciones con `DeleteConfirmation`
- [ ] Extraer componentes:
  - [ ] `UserFormFields` - Campos de usuario
  - [ ] `MembershipFormFields` - Campos de membresía
  - [ ] `UsersTab` - Tab de usuarios
  - [ ] `MembershipsTab` - Tab de membresías
- [ ] Verificar validación de roles
- [ ] Verificar relaciones usuarios ↔ membresías
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar gestión de usuarios con CRUD dual`

**Validación:**
- [ ] CRUD de usuarios funciona
- [ ] CRUD de membresías funciona
- [ ] Tabs funcionan correctamente
- [ ] Validaciones preservadas
- [ ] 0 errores TypeScript
- [ ] Reducción de líneas verificada

---

### 9. Profesionales (Vista Institución) - `/profesionales` 👨‍⚕️
**Archivo:** `app/(dashboard)/profesionales/page.tsx`
**Líneas actuales:** 244
**Reducción esperada:** 20% → ~195 líneas
**Tiempo estimado:** 1 hora
**Complejidad:** Baja
**Prioridad:** ⭐⭐

**Análisis:**
- Solo READ y toggle activar/desactivar
- Vista de solo lectura para admins institucionales
- Alerta informativa

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useToggleState` para activar/desactivar
- [ ] Aplicar `useInstitutionContext()`
- [ ] Simplificar lógica de fetch
- [ ] Verificar toggle funciona
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar vista de profesionales institucional`

**Validación:**
- [ ] Vista de lectura funciona
- [ ] Toggle funciona
- [ ] Alerta se muestra correctamente
- [ ] 0 errores TypeScript

---

### 10. Reportes y Métricas - `/reportes` 📊
**Archivo:** `app/(dashboard)/reportes/page.tsx`
**Líneas actuales:** 1016
**Reducción esperada:** 20% → ~812 líneas
**Tiempo estimado:** 4-5 horas
**Complejidad:** ALTA
**Prioridad:** ⭐⭐⭐

**Análisis:**
- Tabs: Resumen, Profesionales, Servicios, Tendencias
- Gráficos con Recharts
- Exportación a CSV
- Filtros cascada (zona, institución, período)

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useMultipleDataFetch` para todas las queries
- [ ] Aplicar `useCascadeSelect` para zona → institución
- [ ] Crear hook `useReportMetrics` para cálculos
- [ ] Crear hook `useCSVExport` para exportación
- [ ] Aplicar `useInstitutionContext()`
- [ ] Extraer componentes:
  - [ ] `MetricCard` - Card de métrica
  - [ ] `ReportFilters` - Filtros de reporte
  - [ ] `ResumenTab` - Tab de resumen
  - [ ] `ProfessionalsTab` - Tab de profesionales
  - [ ] `ServicesTab` - Tab de servicios
  - [ ] `TrendenciasTab` - Tab de tendencias
- [ ] Optimizar con lazy loading de gráficos
- [ ] Verificar exportación CSV funciona
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar reportes con hooks y componentes`

**Validación:**
- [ ] Todas las tabs funcionan
- [ ] Gráficos se renderizan correctamente
- [ ] Filtros funcionan
- [ ] Exportación CSV funciona
- [ ] Cálculos de métricas correctos
- [ ] 0 errores TypeScript

---

### 11. Agenda - `/agenda` 📅
**Archivo:** `app/(dashboard)/agenda/page.tsx`
**Líneas actuales:** ~894 (estimado)
**Reducción esperada:** 25% → ~670 líneas
**Tiempo estimado:** 3-4 horas
**Complejidad:** ALTA
**Prioridad:** ⭐⭐⭐

**Análisis:**
- Generación de agenda desde slot templates
- Vista de calendario
- Filtros y búsqueda

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useMultipleDataFetch` para queries
- [ ] Optimizar generación de agenda con `useMemo`
- [ ] Aplicar `useInstitutionContext()`
- [ ] Extraer componentes:
  - [ ] `CalendarView` - Vista de calendario
  - [ ] `AgendaFilters` - Filtros de agenda
  - [ ] `SlotCard` - Card de turno
- [ ] Verificar generación de slots
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar agenda con hooks y componentes`

**Validación:**
- [ ] Generación de agenda correcta
- [ ] Vista de calendario funciona
- [ ] Filtros funcionan
- [ ] 0 errores TypeScript

---

### 12. Profesional (Vista Personal) - `/profesional`
**Archivo:** `app/(dashboard)/profesional/page.tsx`
**Estado:** Pendiente de análisis
**Tiempo estimado:** 2 horas
**Prioridad:** ⭐⭐

**Tareas:**
- [ ] Leer archivo y analizar funcionalidad
- [ ] Determinar si es vista personal del profesional
- [ ] Aplicar hooks correspondientes según funcionalidad
- [ ] Documentar funcionalidad encontrada
- [ ] Optimizar según patrones establecidos
- [ ] Commit: `refactor: optimizar vista personal de profesional`

**Validación:**
- [ ] Funcionalidad preservada
- [ ] 0 errores TypeScript

---

### 13. Turnos Disponibles - `/turnos-disponibles`
**Archivo:** `app/(dashboard)/turnos-disponibles/page.tsx`
**Estado:** Pendiente de análisis
**Tiempo estimado:** 2-3 horas
**Prioridad:** ⭐⭐

**Tareas:**
- [ ] Leer archivo y analizar funcionalidad
- [ ] Determinar si es vista pública de turnos
- [ ] Aplicar hooks correspondientes según funcionalidad
- [ ] Documentar funcionalidad encontrada
- [ ] Optimizar según patrones establecidos
- [ ] Commit: `refactor: optimizar vista de turnos disponibles`

**Validación:**
- [ ] Funcionalidad preservada
- [ ] 0 errores TypeScript

---

### 14. Configuración - `/configuracion`
**Archivo:** `app/(dashboard)/configuracion/page.tsx`
**Estado:** Pendiente de análisis
**Tiempo estimado:** 1-2 horas
**Prioridad:** ⭐⭐

**Tareas:**
- [ ] Leer archivo y analizar funcionalidad
- [ ] Determinar qué configuraciones maneja
- [ ] Aplicar hooks correspondientes según funcionalidad
- [ ] Documentar funcionalidad encontrada
- [ ] Optimizar según patrones establecidos
- [ ] Commit: `refactor: optimizar configuración`

**Validación:**
- [ ] Funcionalidad preservada
- [ ] 0 errores TypeScript

---

### Validación Completa Dashboard Normal
- [ ] Todos los componentes optimizados
- [ ] Reducción promedio verificada
- [ ] 0 errores TypeScript en proyecto
- [ ] Tests de regresión manuales completos
- [ ] Documentación actualizada
- [ ] Commit final: `feat: optimización completa de dashboard normal`

**Tiempo total estimado Dashboard Normal:** ~35-45 horas

---

## 🔐 Super Admin Dashboard: app/super-admin/

### 1. Dashboard Super Admin - `/super-admin/page` 📊
**Archivo:** `app/super-admin/page.tsx`
**Líneas actuales:** 310
**Reducción esperada:** 20% → ~248 líneas
**Tiempo estimado:** 1.5 horas
**Complejidad:** Media
**Prioridad:** ⭐⭐⭐

**Análisis:**
- Stats cards (zonas, instituciones, usuarios, profesionales)
- Distribución por tipo
- Links rápidos a gestión

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useMultipleDataFetch` para stats
- [ ] Extraer componentes:
  - [ ] `SuperAdminStatCard` - Card de estadística
  - [ ] `DistributionChart` - Gráfico de distribución
  - [ ] `QuickLinks` - Links rápidos
- [ ] Optimizar con `useMemo`
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar dashboard super admin`

**Validación:**
- [ ] Stats se cargan correctamente
- [ ] Gráficos funcionan
- [ ] Links rápidos funcionan
- [ ] 0 errores TypeScript

---

### 2. Gestión de Zonas - `/super-admin/zonas` 🗺️
**Archivo:** `app/super-admin/zonas/page.tsx`
**Estado:** Pendiente de análisis completo
**Tiempo estimado:** 2-3 horas
**Complejidad:** Media
**Prioridad:** ⭐⭐⭐⭐

**Análisis preliminar:**
- CRUD completo de zonas
- Similar estructura a instituciones

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useCrudOperation<Zone>`
- [ ] Reemplazar dialog con `CrudDialog`
- [ ] Reemplazar confirmación con `DeleteConfirmation`
- [ ] Extraer componentes si es necesario
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar gestión de zonas super admin`

**Validación:**
- [ ] CRUD funciona correctamente
- [ ] Validaciones preservadas
- [ ] 0 errores TypeScript

---

### 3. Gestión de Instituciones - `/super-admin/instituciones` 🏥
**Archivo:** `app/super-admin/instituciones/page.tsx`
**Líneas actuales:** 613
**Reducción esperada:** 40% → ~368 líneas
**Tiempo estimado:** 3-4 horas
**Complejidad:** ALTA
**Prioridad:** ⭐⭐⭐⭐⭐

**Análisis:**
- CRUD completo
- Generación automática de slug
- Normalización de slug (acentos, caracteres)
- Tipos: CAPS, Hospital Seccional, Distrital, Regional
- Agrupación por zona

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useCrudOperation<Institution>`
- [ ] Crear helper `generateSlug(name)` en `lib/supabase/helpers.ts`
- [ ] Crear helper `normalizeSlug(slug)` en `lib/supabase/helpers.ts`
- [ ] Reemplazar dialog con `CrudDialog`
- [ ] Reemplazar confirmación con `DeleteConfirmation`
- [ ] Extraer componentes:
  - [ ] `InstitutionFormFields` - Campos del formulario
  - [ ] `InstitutionTypeSelector` - Selector de tipo
  - [ ] `SlugGenerator` - Generador de slug con preview
- [ ] Verificar generación de slug funciona
- [ ] Verificar validación de slug único
- [ ] Verificar agrupación por zona
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar gestión de instituciones super admin`

**Validación:**
- [ ] CRUD funciona correctamente
- [ ] Generación de slug correcta
- [ ] Normalización de slug funciona
- [ ] Validación de duplicados funciona
- [ ] Agrupación por zona funciona
- [ ] 0 errores TypeScript

---

### 4. Gestión de Profesionales - `/super-admin/profesionales` 👨‍⚕️
**Archivo:** `app/super-admin/profesionales/page.tsx`
**Líneas actuales:** 647
**Reducción esperada:** 35% → ~421 líneas
**Tiempo estimado:** 3-4 horas
**Complejidad:** ALTA
**Prioridad:** ⭐⭐⭐⭐⭐

**Análisis:**
- CRUD completo
- Validación de relaciones antes de eliminar
- Checks: plantillas de horarios, citas, asignaciones, cola
- Bloqueadores de eliminación si hay relaciones
- Toggle activar/desactivar

**Tareas:**
- [ ] Leer archivo actual
- [ ] Aplicar `useCrudOperation<Professional>`
- [ ] Crear hook `useRelationshipCheck` para validación
- [ ] Aplicar `useToggleState` para `is_active`
- [ ] Reemplazar dialog con `CrudDialog`
- [ ] Crear `DeleteWithRelationsConfirmation` (componente especial)
- [ ] Extraer componentes:
  - [ ] `ProfessionalFormFields` - Campos del formulario
  - [ ] `RelationshipWarnings` - Advertencias de relaciones
- [ ] Verificar checks de relaciones funciona
- [ ] Verificar bloqueadores de eliminación
- [ ] Pruebas manuales completas
- [ ] Commit: `refactor: optimizar gestión de profesionales super admin`

**Validación:**
- [ ] CRUD funciona correctamente
- [ ] Validación de relaciones funciona
- [ ] Bloqueadores de eliminación funcionan
- [ ] Toggle funciona
- [ ] 0 errores TypeScript

---

### 5. Gestión de Usuarios - `/super-admin/usuarios` 👥
**Archivo:** `app/super-admin/usuarios/page.tsx`
**Líneas actuales:** 1654
**Reducción esperada:** 40% → ~992 líneas
**Tiempo estimado:** 6-8 horas
**Complejidad:** MUY ALTA
**Prioridad:** ⭐⭐⭐⭐⭐

**Análisis:**
- CRUD TRIPLE (usuarios, membresías, servicios)
- Tabs: Usuarios, Membresías, Servicios
- Select cascada compleja (zona → institución)
- Búsquedas en tiempo real
- Rol especial: super_admin (no editable)
- Componente externo: UserServicesTab

**Tareas:**
- [ ] Leer archivo actual (completo)
- [ ] Aplicar `useCrudOperation<User>` para usuarios
- [ ] Aplicar `useCrudOperation<Membership>` para membresías
- [ ] Aplicar `useCascadeSelect` para zona → institución
- [ ] Aplicar `useMultipleDataFetch` para múltiples queries
- [ ] Crear hook `useUserSearch` para búsqueda en tiempo real
- [ ] Reemplazar dialogs con `CrudDialog`
- [ ] Reemplazar confirmaciones con `DeleteConfirmation`
- [ ] Extraer componentes:
  - [ ] `UserFormFields` - Campos de usuario (con password toggle)
  - [ ] `MembershipFormFields` - Campos de membresía
  - [ ] `UsersTab` - Tab de usuarios
  - [ ] `MembershipsTab` - Tab de membresías
  - [ ] Reutilizar `UserServicesTab` existente
  - [ ] `CascadeFilters` - Filtros cascada zona → institución
  - [ ] `SearchBar` - Barra de búsqueda con debounce
- [ ] Verificar rol super_admin no editable
- [ ] Verificar búsqueda en tiempo real
- [ ] Verificar filtros cascada
- [ ] Verificar eliminación con cascada
- [ ] Pruebas manuales completas (EXHAUSTIVAS)
- [ ] Commit: `refactor: optimizar gestión de usuarios super admin`

**Validación:**
- [ ] CRUD de usuarios funciona
- [ ] CRUD de membresías funciona
- [ ] Asignación de servicios funciona
- [ ] Tabs funcionan correctamente
- [ ] Filtros cascada funcionan
- [ ] Búsqueda funciona
- [ ] Rol super_admin protegido
- [ ] Password toggle funciona
- [ ] Eliminación con cascada funciona
- [ ] 0 errores TypeScript

---

### 6. Métricas Super Admin - `/super-admin/metricas`
**Archivo:** `app/super-admin/metricas/page.tsx`
**Estado:** Pendiente de análisis
**Tiempo estimado:** 3-4 horas
**Complejidad:** ALTA
**Prioridad:** ⭐⭐⭐

**Tareas:**
- [ ] Leer archivo y analizar funcionalidad
- [ ] Determinar qué métricas muestra
- [ ] Aplicar hooks correspondientes según funcionalidad
- [ ] Documentar funcionalidad encontrada
- [ ] Optimizar según patrones establecidos
- [ ] Commit: `refactor: optimizar métricas super admin`

**Validación:**
- [ ] Funcionalidad preservada
- [ ] 0 errores TypeScript

---

### Validación Completa Super Admin
- [ ] Todos los componentes optimizados
- [ ] Reducción promedio verificada
- [ ] 0 errores TypeScript en proyecto
- [ ] Tests de regresión manuales completos
- [ ] Documentación actualizada
- [ ] Commit final: `feat: optimización completa de super admin dashboard`

**Tiempo total estimado Super Admin:** ~20-30 horas

---

## ✅ Validación y Documentación Final

### Métricas Finales del Proyecto
- [ ] Calcular reducción total de líneas
- [ ] Calcular porcentaje de optimización
- [ ] Verificar 0 errores TypeScript en todo el proyecto
- [ ] Verificar 0 warnings de ESLint (si es posible)
- [ ] Crear gráfico de progreso

**Métricas esperadas:**
- **Líneas totales antes:** ~10,000
- **Líneas totales después:** ~6,500
- **Reducción esperada:** ~35-40%
- **Hooks creados:** 6-8
- **Componentes genéricos creados:** 8-12
- **Componentes optimizados:** 22

---

### Documentación
- [ ] Actualizar `docs/PLAN-REUTILIZACION-HOOKS-COMPONENTES.md` con resultados
- [ ] Crear `docs/PATRONES-REUTILIZABLES.md` con ejemplos de uso
- [ ] Actualizar `CLAUDE.md` con nuevos patrones
- [ ] Documentar todos los hooks creados en sus archivos
- [ ] Documentar todos los componentes creados
- [ ] Crear guía de uso: `docs/GUIA-HOOKS-COMPONENTES.md`
- [ ] Actualizar `README.md` si es necesario

---

### Tests (Opcional pero Recomendado)
- [ ] Tests unitarios de `useCrudOperation`
- [ ] Tests unitarios de `useInstitutionContext`
- [ ] Tests unitarios de `useFormState`
- [ ] Tests unitarios de helpers
- [ ] Tests de integración de componentes CRUD
- [ ] Coverage report

---

### Git y Deployment
- [ ] Revisar todos los commits
- [ ] Crear PR con resumen completo
- [ ] Code review (si aplica)
- [ ] Merge a main
- [ ] Deploy a staging
- [ ] Validación en staging
- [ ] Deploy a producción
- [ ] Monitoreo post-deploy

---

### Retrospectiva
- [ ] Documentar lecciones aprendidas
- [ ] Documentar patrones exitosos
- [ ] Documentar desafíos encontrados
- [ ] Sugerencias para futuros refactors
- [ ] Crear `docs/RETROSPECTIVA-OPTIMIZACION.md`

---

## 📊 Resumen del Progreso

### Dashboard Normal
| Componente | Estado | Reducción | Tiempo |
|-----------|--------|-----------|--------|
| ✅ Turnos | Completado | 47% | 8h |
| ⬜ Dashboard | Pendiente | - | - |
| ⬜ Pacientes | Pendiente | - | - |
| ⬜ Servicios | Pendiente | - | - |
| ⬜ Consultorios | Pendiente | - | - |
| ⬜ Horarios | Pendiente | - | - |
| ⬜ Asignaciones | Pendiente | - | - |
| ⬜ Usuarios | Pendiente | - | - |
| ⬜ Profesionales | Pendiente | - | - |
| ⬜ Reportes | Pendiente | - | - |
| ⬜ Agenda | Pendiente | - | - |
| ⬜ Otros | Pendiente | - | - |

**Progreso Dashboard Normal:** 1/14 componentes (7%)

---

### Super Admin
| Componente | Estado | Reducción | Tiempo |
|-----------|--------|-----------|--------|
| ⬜ Dashboard | Pendiente | - | - |
| ⬜ Zonas | Pendiente | - | - |
| ⬜ Instituciones | Pendiente | - | - |
| ⬜ Profesionales | Pendiente | - | - |
| ⬜ Usuarios | Pendiente | - | - |
| ⬜ Métricas | Pendiente | - | - |

**Progreso Super Admin:** 0/6 componentes (0%)

---

### Hooks y Componentes Base
| Item | Estado |
|------|--------|
| ⬜ useCrudOperation | Pendiente |
| ⬜ useInstitutionContext | Pendiente |
| ⬜ useFormState | Pendiente |
| ⬜ useToggleState | Pendiente |
| ⬜ useMultipleDataFetch | Pendiente |
| ⬜ useCascadeSelect | Pendiente |
| ⬜ CrudDialog | Pendiente |
| ⬜ DeleteConfirmation | Pendiente |
| ⬜ CrudTable | Pendiente |

**Progreso Hooks/Componentes:** 0/9 (0%)

---

## 📅 Cronograma Sugerido

### Semana 1: Fundamentos
- **Días 1-2:** Crear hooks base (useCrudOperation, useInstitutionContext, useFormState)
- **Días 3-4:** Crear componentes base (CrudDialog, DeleteConfirmation, CrudTable)
- **Día 5:** Validación y documentación de fase preparatoria

### Semana 2: Dashboard Normal - Alta Prioridad
- **Día 1:** Dashboard principal + Pacientes
- **Día 2:** Servicios + Consultorios
- **Día 3:** Horarios
- **Día 4:** Asignaciones + Usuarios
- **Día 5:** Validación de alta prioridad

### Semana 3: Dashboard Normal - Media/Baja Prioridad
- **Día 1:** Profesionales + Reportes
- **Día 2-3:** Reportes (continuación) + Agenda
- **Día 4:** Componentes restantes (configuración, turnos-disponibles, profesional)
- **Día 5:** Validación completa dashboard normal

### Semana 4: Super Admin
- **Día 1:** Dashboard + Zonas
- **Día 2-3:** Instituciones + Profesionales
- **Día 4-5:** Usuarios (el más complejo)

### Semana 5: Super Admin + Validación Final
- **Día 1:** Métricas super admin
- **Día 2:** Validación completa super admin
- **Día 3:** Tests unitarios y de integración
- **Día 4:** Documentación completa
- **Día 5:** Retrospectiva y cierre

---

## 🎯 Notas Importantes

### Principios a Seguir
1. **Un componente a la vez:** No hacer múltiples refactors en paralelo
2. **Validar siempre:** Probar manualmente después de cada cambio
3. **Commits granulares:** Un commit por componente optimizado
4. **Preservar funcionalidad:** 100% de funcionalidad debe mantenerse
5. **Documentar decisiones:** Documentar por qué se tomaron ciertas decisiones

### Cuando Hacer Commit
- ✅ Después de cada componente completado y validado
- ✅ Después de crear cada hook base
- ✅ Después de crear cada componente base
- ❌ NO hacer commit de trabajo incompleto
- ❌ NO hacer commit de código con errores

### Qué Validar en Cada Componente
1. CRUD operations funcionan (si aplica)
2. Formularios validan correctamente
3. Confirmaciones de eliminación funcionan
4. Filtros funcionan (si aplica)
5. Toggle states funcionan (si aplica)
6. Búsquedas funcionan (si aplica)
7. 0 errores TypeScript
8. 0 errores en consola del navegador
9. UI/UX preservada
10. Performance mejorada o igual

---

## 📝 Plantilla de Commit

```
refactor(componente): optimizar [nombre del componente]

- Aplicar useCrudOperation para CRUD operations
- Aplicar useInstitutionContext para contexto
- Reemplazar dialog con CrudDialog
- Reemplazar confirmación con DeleteConfirmation
- Extraer componentes: [lista de componentes]

Reducción: [líneas antes] → [líneas después] ([porcentaje]%)

Validado:
- ✅ CRUD funciona correctamente
- ✅ Formularios validan
- ✅ 0 errores TypeScript
- ✅ UI/UX preservada
```

---

**Estado:** 🟡 Listo para comenzar mañana
**Próximo paso:** Fase Preparatoria - Crear hooks y componentes base
**Tiempo total estimado:** 70-90 horas (~4-5 semanas a tiempo completo)

---

**¿Dudas o ajustes necesarios antes de comenzar?**
