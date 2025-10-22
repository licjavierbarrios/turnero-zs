# FASE 2: ATOMIZACIÓN Y REUTILIZACIÓN DE COMPONENTES

> **📌 Ejecutar DESPUÉS de completar:** `CHECKLIST-OPTIMIZACION-COMPLETA.md`
>
> **Objetivo:** Reducir componentes de página de ~300-600 líneas a ~80-120 líneas mediante atomización granular y componentes reutilizables.

---

## 🎯 FILOSOFÍA DE ATOMIZACIÓN

### Principios fundamentales:

1. **Single Responsibility**: Cada componente hace UNA cosa bien
2. **Composición sobre Herencia**: Construir componentes grandes con componentes pequeños
3. **DRY (Don't Repeat Yourself)**: Si se repite 2+ veces, extraer
4. **Colocation**: Colocar código cerca de donde se usa
5. **Progressive Enhancement**: Empezar simple, agregar complejidad solo cuando se necesita

### Regla de tamaño:

```
✅ Componente de página:     80-120 líneas (solo orquestación)
✅ Componente de dominio:    40-100 líneas (lógica específica)
✅ Componente reutilizable:  20-60 líneas (genérico)
✅ Componente UI:            10-40 líneas (presentacional)
```

---

## 📁 ESTRUCTURA DE CARPETAS Y DECISIONES

### Diagrama de decisión: ¿Dónde poner mi componente?

```
┌─────────────────────────────────────────────┐
│ ¿Dónde debería ir este componente?         │
└─────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ ¿Es UI puro (shadcn)? │
        └───────────────────────┘
                    │
          ┌─────────┴─────────┐
         SÍ                   NO
          │                    │
          ▼                    ▼
  components/ui/     ┌──────────────────────┐
  ├── button.tsx     │ ¿Tiene lógica CRUD   │
  ├── card.tsx       │ genérica reutilizable?│
  └── input.tsx      └──────────────────────┘
                              │
                    ┌─────────┴─────────┐
                   SÍ                   NO
                    │                    │
                    ▼                    ▼
          components/crud/      ┌────────────────────┐
          ├── CrudPageLayout    │ ¿Se usa en 2+      │
          ├── EmptyState        │ módulos diferentes? │
          ├── LoadingState      └────────────────────┘
          └── DataTable                 │
                              ┌─────────┴─────────┐
                             SÍ                   NO
                              │                    │
                              ▼                    ▼
                    components/domain/    app/(dashboard)/[modulo]/
                    ├── ProfessionalCard  └── _components/
                    ├── AppointmentCard       ├── PatientForm
                    └── QueueStatusBadge      ├── ServiceSelector
                                              └── RoomCard
```

### Reglas de ubicación:

#### 1. `components/ui/` - Componentes UI Puros (shadcn/ui)
**Características:**
- Sin lógica de negocio
- Solo props de presentación
- Reutilizables en cualquier contexto
- Generalmente de shadcn/ui

**Ejemplos:**
```typescript
// ✅ Correcto
components/ui/button.tsx
components/ui/input.tsx
components/ui/card.tsx

// ❌ Incorrecto (tiene lógica de negocio)
components/ui/patient-form.tsx
```

#### 2. `components/crud/` - Componentes CRUD Genéricos
**Características:**
- Lógica CRUD genérica (no específica de dominio)
- Reutilizable en TODOS los módulos CRUD
- Acepta props genéricos con TypeScript generics

**Ejemplos:**
```typescript
// ✅ Correcto
components/crud/CrudPageLayout.tsx      // Layout genérico
components/crud/CrudDialog.tsx          // Ya existe ✓
components/crud/DeleteConfirmation.tsx  // Ya existe ✓
components/crud/EmptyState.tsx          // Estado vacío genérico
components/crud/LoadingState.tsx        // Loading genérico
components/crud/DataTable.tsx           // Tabla con paginación
components/crud/SearchBar.tsx           // Búsqueda genérica
components/crud/FilterDropdown.tsx      // Filtros genéricos

// ❌ Incorrecto (específico de dominio)
components/crud/PatientFilters.tsx      // Va en domain/ o _components/
```

#### 3. `components/domain/` - Componentes de Dominio Compartidos
**Características:**
- Lógica específica del dominio de salud
- Usado en 2+ módulos diferentes
- Conoce entidades del sistema (Patient, Professional, Appointment)

**Ejemplos:**
```typescript
// ✅ Correcto (usado en /turnos, /profesional, /asignaciones)
components/domain/ProfessionalCard.tsx
components/domain/ProfessionalSelector.tsx

// ✅ Correcto (usado en /turnos, /pantalla, /reportes)
components/domain/AppointmentStatusBadge.tsx
components/domain/QueuePositionCard.tsx

// ✅ Correcto (usado en /pacientes, /turnos)
components/domain/PatientInfoCard.tsx

// ❌ Incorrecto (solo en /pacientes)
components/domain/PatientForm.tsx  // Va en app/(dashboard)/pacientes/_components/
```

#### 4. `app/(dashboard)/[modulo]/_components/` - Componentes Específicos del Módulo
**Características:**
- Solo usado en ESE módulo específico
- Lógica muy específica del caso de uso
- Puede importar de components/domain/ y components/crud/

**Ejemplos:**
```typescript
// ✅ Correcto (solo en /pacientes)
app/(dashboard)/pacientes/_components/PatientForm.tsx
app/(dashboard)/pacientes/_components/PatientTableRow.tsx
app/(dashboard)/pacientes/_components/PatientFilters.tsx

// ✅ Correcto (solo en /servicios)
app/(dashboard)/servicios/_components/ServiceForm.tsx
app/(dashboard)/servicios/_components/DurationSelector.tsx

// ❌ Incorrecto (se usa también en /asignaciones)
app/(dashboard)/profesionales/_components/ProfessionalCard.tsx
// Debería ir en: components/domain/ProfessionalCard.tsx
```

---

## 🔍 PROCESO DE ATOMIZACIÓN: CHECKLIST PASO A PASO

### Antes de crear un componente nuevo:

#### ✅ Checklist de verificación:

```markdown
1. [ ] **Buscar en components/ui/**
   - ¿Ya existe un componente shadcn/ui que haga esto?
   - Ejemplo: Button, Card, Input, Badge, etc.

2. [ ] **Buscar en components/crud/**
   - ¿Ya existe un componente CRUD genérico similar?
   - Ejemplo: CrudDialog, DeleteConfirmation, EmptyState

3. [ ] **Buscar en components/domain/**
   - ¿Ya existe un componente de dominio que haga esto?
   - Ejemplo: ProfessionalCard, AppointmentBadge

4. [ ] **Buscar en otros _components/ del mismo tipo**
   - ¿Existe en /pacientes/_components/ algo que sirva para /servicios/?
   - Si sí → mover a components/domain/

5. [ ] **Buscar patrones similares en el código actual**
   - ¿Hay 2+ lugares con código casi idéntico?
   - Si sí → extraer a componente reutilizable

6. [ ] **Analizar nivel de reutilización:**
   - ¿Se usará en 1 solo módulo? → _components/
   - ¿Se usará en 2+ módulos? → components/domain/
   - ¿Es genérico CRUD? → components/crud/
   - ¿Es UI puro? → components/ui/
```

### Proceso de atomización de un componente:

#### Paso 1: Identificar responsabilidades
```typescript
// Ejemplo: pacientes/page.tsx (335 líneas)

RESPONSABILIDADES IDENTIFICADAS:
1. Layout y header               → extraer a CrudPageLayout
2. Gestión de estado (hook)      → mantener en page.tsx
3. Tabla de datos                → usar CrudDataTable genérico
4. Fila de tabla                 → extraer a PatientTableRow
5. Formulario                    → extraer a PatientForm
6. Loading state                 → extraer a LoadingState
7. Empty state                   → extraer a EmptyState
8. Dialog CRUD                   → ya existe (CrudDialog) ✓
9. Delete confirmation           → ya existe (DeleteConfirmation) ✓
```

#### Paso 2: Clasificar componentes por ubicación
```typescript
CLASIFICACIÓN:

components/crud/ (reutilizables en TODOS los CRUDs):
  - CrudPageLayout.tsx        [NUEVO]
  - LoadingState.tsx          [NUEVO]
  - EmptyState.tsx            [NUEVO]
  - CrudDataTable.tsx         [NUEVO - opcional]

app/(dashboard)/pacientes/_components/ (específicos):
  - PatientForm.tsx           [NUEVO]
  - PatientTableRow.tsx       [NUEVO]
  - PatientFilters.tsx        [FUTURO - si se agrega búsqueda]
```

#### Paso 3: Extraer componentes (orden recomendado)

**Orden de extracción (de más genérico a más específico):**

1. **Primero: Componentes CRUD genéricos** (se usarán en todos)
   ```typescript
   // components/crud/LoadingState.tsx
   // components/crud/EmptyState.tsx
   // components/crud/CrudPageLayout.tsx
   ```

2. **Segundo: Componentes de dominio compartidos** (si aplica)
   ```typescript
   // Solo si el componente se usa en 2+ módulos
   // components/domain/ProfessionalCard.tsx
   ```

3. **Tercero: Componentes específicos del módulo**
   ```typescript
   // app/(dashboard)/pacientes/_components/PatientForm.tsx
   // app/(dashboard)/pacientes/_components/PatientTableRow.tsx
   ```

4. **Cuarto: Refactorizar page.tsx para usar los componentes**
   ```typescript
   // app/(dashboard)/pacientes/page.tsx
   // Usar todos los componentes extraídos
   ```

---

## 📦 COMPONENTES A CREAR (Prioridad)

### 🟢 ALTA PRIORIDAD - Components CRUD (genéricos)

#### 1. `components/crud/CrudPageLayout.tsx`
**Uso:** TODOS los módulos CRUD (pacientes, servicios, consultorios, etc.)
**Líneas:** ~40
**Props:**
```typescript
interface CrudPageLayoutProps {
  title: string
  description: string
  onCreateClick: () => void
  createButtonText?: string
  createButtonIcon?: React.ReactNode
  headerActions?: React.ReactNode  // Acciones extras en header
  children: React.ReactNode
}
```

**Ejemplo de uso:**
```typescript
<CrudPageLayout
  title="Gestión de Pacientes"
  description="Administra los pacientes del sistema"
  onCreateClick={openCreateDialog}
  createButtonText="Nuevo Paciente"
>
  {/* Contenido */}
</CrudPageLayout>
```

---

#### 2. `components/crud/LoadingState.tsx`
**Uso:** TODOS los módulos
**Líneas:** ~15
**Props:**
```typescript
interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}
```

**Ejemplo de uso:**
```typescript
{isLoading ? (
  <LoadingState message="Cargando pacientes..." />
) : (
  <DataTable />
)}
```

---

#### 3. `components/crud/EmptyState.tsx`
**Uso:** TODOS los módulos
**Líneas:** ~25
**Props:**
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}
```

**Ejemplo de uso:**
```typescript
<EmptyState
  icon={<User className="h-12 w-12" />}
  title="No hay pacientes registrados"
  description="Registra el primer paciente para comenzar"
  action={{
    label: "Crear paciente",
    onClick: openCreateDialog
  }}
/>
```

---

#### 4. `components/crud/CrudDataTable.tsx` (Opcional - Avanzado)
**Uso:** Tablas con paginación, ordenamiento, búsqueda
**Líneas:** ~150
**Props:**
```typescript
interface CrudDataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  pagination?: {
    pageSize: number
    currentPage: number
    total: number
    onPageChange: (page: number) => void
  }
  sorting?: {
    column: string
    direction: 'asc' | 'desc'
    onSortChange: (column: string) => void
  }
}
```

---

### 🟡 MEDIA PRIORIDAD - Components Domain (compartidos)

#### 5. `components/domain/ProfessionalCard.tsx`
**Uso:** /profesionales, /asignaciones, /turnos, /agenda
**Líneas:** ~60
**Props:**
```typescript
interface ProfessionalCardProps {
  professional: {
    id: string
    first_name: string
    last_name: string
    speciality?: string
    avatar_url?: string
  }
  showSpeciality?: boolean
  onClick?: () => void
  actions?: React.ReactNode
  variant?: 'compact' | 'full'
}
```

---

#### 6. `components/domain/ProfessionalSelector.tsx`
**Uso:** /asignaciones, /turnos, /agenda
**Líneas:** ~80
**Props:**
```typescript
interface ProfessionalSelectorProps {
  institutionId: string
  value: string
  onChange: (professionalId: string) => void
  filterBy?: {
    hasSchedule?: boolean
    isActive?: boolean
    speciality?: string
  }
  excludeIds?: string[]  // Para prevenir duplicados
}
```

---

#### 7. `components/domain/AppointmentStatusBadge.tsx`
**Uso:** /turnos, /pantalla, /reportes
**Líneas:** ~40
**Props:**
```typescript
interface AppointmentStatusBadgeProps {
  status: 'pendiente' | 'disponible' | 'llamado' | 'atendido' | 'ausente'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}
```

---

### 🔴 BAJA PRIORIDAD - Components específicos por módulo

Estos se crean cuando se optimiza cada módulo específico.

**Ejemplos:**
```typescript
app/(dashboard)/pacientes/_components/
  ├── PatientForm.tsx
  ├── PatientTableRow.tsx
  └── PatientFilters.tsx

app/(dashboard)/servicios/_components/
  ├── ServiceForm.tsx
  ├── DurationSelector.tsx
  └── ServiceTableRow.tsx

app/(dashboard)/profesionales/_components/
  ├── ProfessionalForm.tsx
  ├── ScheduleBuilder.tsx
  └── ProfessionalAvatar.tsx
```

---

## 🎨 PATRONES DE COMPOSICIÓN

### Patrón 1: Layout + Content + Dialogs

```typescript
// app/(dashboard)/pacientes/page.tsx (~80 líneas)

export default function PacientesPage() {
  const { /* hook CRUD */ } = useCrudOperation<Patient>({ /* ... */ })

  return (
    <CrudPageLayout
      title="Gestión de Pacientes"
      description="Administra los pacientes"
      onCreateClick={openCreateDialog}
    >
      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle icon={User}>Pacientes Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : patients.length === 0 ? (
            <EmptyState
              icon={<User />}
              title="No hay pacientes"
              action={{ label: "Crear", onClick: openCreateDialog }}
            />
          ) : (
            <DataTable
              data={patients}
              columns={patientColumns}
              onRowEdit={openEditDialog}
              onRowDelete={openDeleteDialog}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CrudDialog {...dialogProps}>
        <PatientForm formData={formData} updateFormField={updateFormField} />
      </CrudDialog>

      <DeleteConfirmation {...deleteProps} />
    </CrudPageLayout>
  )
}
```

### Patrón 2: Compound Components

```typescript
// Componente compuesto para mejor composición
<DataTable data={patients}>
  <DataTable.Header>
    <DataTable.Column field="name">Nombre</DataTable.Column>
    <DataTable.Column field="dni">DNI</DataTable.Column>
  </DataTable.Header>
  <DataTable.Body>
    {(patient) => <PatientTableRow patient={patient} />}
  </DataTable.Body>
</DataTable>
```

### Patrón 3: Render Props

```typescript
<CrudPage
  data={patients}
  loading={isLoading}
  empty={patients.length === 0}
  renderEmpty={() => <EmptyState title="Sin pacientes" />}
  renderLoading={() => <LoadingState />}
  renderContent={(data) => <PatientTable data={data} />}
/>
```

---

## 📊 CHECKLIST DE MÓDULOS A ATOMIZAR

### Dashboard Normal (8 módulos)

#### ✅ Fase 1 completada (hooks + componentes base)
- [x] Crear hooks reutilizables
- [x] Crear CrudDialog
- [x] Crear DeleteConfirmation

#### 🔄 Fase 2: Atomización de componentes

##### 1. `/pacientes`
**Estado:** ⏳ Pendiente atomización
**Líneas actuales:** 335 → **Objetivo:** ~80 líneas
**Complejidad:** Media
**Componentes a extraer:**
- [ ] `components/crud/CrudPageLayout.tsx` (genérico) - ~40 líneas
- [ ] `components/crud/LoadingState.tsx` (genérico) - ~15 líneas
- [ ] `components/crud/EmptyState.tsx` (genérico) - ~25 líneas
- [ ] `app/(dashboard)/pacientes/_components/PatientForm.tsx` - ~90 líneas
- [ ] `app/(dashboard)/pacientes/_components/PatientTableRow.tsx` - ~60 líneas
- [ ] Refactorizar `page.tsx` para usar componentes

**Validación:**
- [ ] page.tsx tiene ~80 líneas
- [ ] Sin código duplicado
- [ ] TypeScript sin errores
- [ ] Tests funcionan

---

##### 2. `/servicios`
**Estado:** ⏳ Pendiente atomización
**Líneas actuales:** 395 → **Objetivo:** ~100 líneas
**Complejidad:** Media
**Componentes a extraer:**
- [ ] Usar `CrudPageLayout` (ya creado en paso 1)
- [ ] Usar `LoadingState` (ya creado en paso 1)
- [ ] Usar `EmptyState` (ya creado en paso 1)
- [ ] `app/(dashboard)/servicios/_components/ServiceForm.tsx` - ~100 líneas
- [ ] `app/(dashboard)/servicios/_components/DurationSelector.tsx` - ~40 líneas
- [ ] `app/(dashboard)/servicios/_components/ServiceTableRow.tsx` - ~70 líneas
- [ ] Refactorizar `page.tsx`

**Validación:**
- [ ] page.tsx tiene ~100 líneas
- [ ] Reutiliza componentes CRUD genéricos
- [ ] TypeScript sin errores

---

##### 3. `/consultorios`
**Estado:** ⏳ Pendiente atomización
**Líneas actuales:** 350 → **Objetivo:** ~90 líneas
**Complejidad:** Media
**Componentes a extraer:**
- [ ] Usar `CrudPageLayout`, `LoadingState`, `EmptyState`
- [ ] `app/(dashboard)/consultorios/_components/RoomForm.tsx` - ~80 líneas
- [ ] `app/(dashboard)/consultorios/_components/RoomTableRow.tsx` - ~60 líneas
- [ ] Refactorizar `page.tsx`

---

##### 4. `/horarios`
**Estado:** ⏳ Pendiente atomización
**Líneas actuales:** 619 → **Objetivo:** ~120 líneas
**Complejidad:** Alta (cascade selects)
**Componentes a extraer:**
- [ ] Usar componentes CRUD genéricos
- [ ] `components/domain/ProfessionalSelector.tsx` (compartido) - ~80 líneas
- [ ] `app/(dashboard)/horarios/_components/ScheduleForm.tsx` - ~150 líneas
- [ ] `app/(dashboard)/horarios/_components/TimeSlotBuilder.tsx` - ~100 líneas
- [ ] `app/(dashboard)/horarios/_components/ScheduleTableRow.tsx` - ~80 líneas
- [ ] Refactorizar `page.tsx`

**Nota:** Este es el más complejo por los cascade selects

---

##### 5. `/asignaciones`
**Estado:** ⏳ Pendiente atomización
**Líneas actuales:** 399 → **Objetivo:** ~100 líneas
**Complejidad:** Media
**Componentes a extraer:**
- [ ] Usar `CrudPageLayout`, `EmptyState`
- [ ] Usar `ProfessionalSelector` (ya creado en /horarios)
- [ ] `app/(dashboard)/asignaciones/_components/AssignmentForm.tsx` - ~80 líneas
- [ ] `app/(dashboard)/asignaciones/_components/AssignmentCard.tsx` - ~60 líneas
- [ ] `app/(dashboard)/asignaciones/_components/RoomSelector.tsx` - ~50 líneas
- [ ] Refactorizar `page.tsx`

---

##### 6. `/usuarios`
**Estado:** ⏳ Pendiente
**Líneas actuales:** 925
**Complejidad:** Muy Alta (CRUD dual)
**Nota:** Requiere análisis especial por complejidad dual

---

##### 7. `/profesionales`
**Estado:** ⏳ Pendiente
**Líneas actuales:** 244
**Complejidad:** Media

---

##### 8. `/reportes`
**Estado:** ⏳ Pendiente
**Líneas actuales:** 1016
**Complejidad:** Alta (múltiples reportes)

---

## 🔧 GUÍA DE IMPLEMENTACIÓN

### Template para crear componente nuevo:

```typescript
// 1. UBICACIÓN: Decidir carpeta según diagrama
// 2. NOMBRE: PascalCase descriptivo
// 3. PROPS: Interface tipada con TypeScript
// 4. DOCUMENTACIÓN: JSDoc con ejemplos

/**
 * Componente [NOMBRE] - [Descripción breve]
 *
 * @example
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={handler}
 * />
 * ```
 */

interface ComponentNameProps {
  /** Descripción del prop */
  prop1: string
  /** Handler opcional */
  prop2?: () => void
  /** Children para composición */
  children?: React.ReactNode
}

export function ComponentName({
  prop1,
  prop2,
  children
}: ComponentNameProps) {
  return (
    // JSX
  )
}
```

### Checklist de implementación por componente:

```markdown
- [ ] Decidir ubicación usando diagrama de decisión
- [ ] Buscar componentes existentes similares
- [ ] Definir interface de Props con TypeScript
- [ ] Implementar componente
- [ ] Agregar JSDoc con ejemplos
- [ ] Crear tests (si es componente genérico)
- [ ] Validar TypeScript sin errores
- [ ] Usar en al menos 1 módulo
- [ ] Documentar en este archivo
```

---

## 📈 MÉTRICAS DE ÉXITO

### Por componente de página:

- ✅ **Reducción de líneas:** ~60-70% (ej: 335 → ~80-120 líneas)
- ✅ **Responsabilidad única:** page.tsx solo orquesta, no implementa
- ✅ **Reutilización:** Usa al menos 3 componentes compartidos
- ✅ **Legibilidad:** Un desarrollador nuevo entiende el flujo en <2 min

### Por módulo optimizado:

- ✅ **TypeScript:** 0 errores
- ✅ **Tests:** Todos pasan
- ✅ **Performance:** Mismo o mejor que antes
- ✅ **UX:** Igual o mejor que antes

### Proyecto completo:

- ✅ **Componentes CRUD genéricos:** 5-8 componentes reutilizables
- ✅ **Componentes de dominio:** 8-12 componentes compartidos
- ✅ **Componentes específicos:** ~2-4 por módulo
- ✅ **Reducción total:** ~40-50% de código en pages

---

## 🚀 ORDEN DE EJECUCIÓN RECOMENDADO

### Semana 1: Componentes CRUD genéricos (fundación)
1. **Día 1-2:** `CrudPageLayout`, `LoadingState`, `EmptyState`
2. **Día 3:** Validar en 1 módulo de prueba (/pacientes)
3. **Día 4-5:** `CrudDataTable` (opcional, si se necesita)

### Semana 2: Atomizar módulos simples
4. **Día 1:** `/pacientes` completo
5. **Día 2:** `/servicios` completo
6. **Día 3:** `/consultorios` completo
7. **Día 4:** Validación y testing
8. **Día 5:** Documentación y commit

### Semana 3: Componentes de dominio + módulos complejos
9. **Día 1-2:** `ProfessionalSelector`, `ProfessionalCard`
10. **Día 3:** `/asignaciones` completo
11. **Día 4-5:** `/horarios` completo (más complejo)

### Semana 4: Módulos avanzados
12. **Día 1-3:** `/profesionales` y `/reportes`
13. **Día 4:** `/usuarios` (CRUD dual - análisis especial)
14. **Día 5:** Validación final y documentación

---

## 📚 RECURSOS Y REFERENCIAS

### Patrones de diseño:
- **Atomic Design:** Atoms → Molecules → Organisms → Templates → Pages
- **Container/Presentational:** Lógica vs Presentación
- **Compound Components:** Componentes que trabajan juntos
- **Render Props:** Flexibilidad en renderizado

### Links útiles:
- [Atomic Design by Brad Frost](https://bradfrost.com/blog/post/atomic-web-design/)
- [React Component Patterns](https://www.patterns.dev/posts/react-component-patterns)
- [Thinking in React](https://react.dev/learn/thinking-in-react)

---

## ✅ CRITERIOS DE FINALIZACIÓN

Esta fase estará completa cuando:

- [ ] Todos los módulos de Dashboard Normal están atomizados
- [ ] `components/crud/` tiene 5-8 componentes genéricos bien documentados
- [ ] `components/domain/` tiene 8-12 componentes compartidos
- [ ] Cada `page.tsx` tiene ~80-120 líneas (solo orquestación)
- [ ] 0 errores TypeScript en todo el proyecto
- [ ] Tests actualizados y pasando
- [ ] Documentación actualizada
- [ ] Reducción total de ~40-50% de código en pages
- [ ] Código más mantenible y reutilizable

---

## 📝 NOTAS IMPORTANTES

### Errores comunes a evitar:

1. ❌ **Over-engineering:** No crear componentes para TODO
   - Si solo se usa 1 vez y tiene <40 líneas, puede quedarse inline

2. ❌ **Props drilling excesivo:**
   - Si pasas >5 props, considera Context o composition

3. ❌ **Abstracción prematura:**
   - Extraer componente DESPUÉS de ver que se repite, no antes

4. ❌ **Componentes demasiado genéricos:**
   - Si necesitas 15 props para cubrir todos los casos, divide en 2 componentes

5. ❌ **Naming poco descriptivo:**
   - ❌ `Form.tsx` → ✅ `PatientForm.tsx`
   - ❌ `Card.tsx` → ✅ `ProfessionalCard.tsx`

### Cuándo NO extraer:

- Código que solo se usa 1 vez y tiene <40 líneas
- Lógica muy específica sin patrón reutilizable
- Componentes que cambian frecuentemente (esperar a que se estabilicen)

---

## 🎯 PRÓXIMOS PASOS

1. Terminar `CHECKLIST-OPTIMIZACION-COMPLETA.md`
2. Hacer commit y push
3. Comenzar con este documento
4. Empezar por Semana 1: Componentes CRUD genéricos

---

**Versión:** 1.0
**Última actualización:** 2025-01-21
**Autor:** Sistema de optimización turnero-zs
**Estado:** 📋 Planificación - Listo para ejecutar
