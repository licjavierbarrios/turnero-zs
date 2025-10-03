# Sistema de Pantalla Pública Multi-Servicio

## 📋 Contexto

En instituciones como CAPS, múltiples servicios llaman pacientes simultáneamente:
- **Enfermería** (toma de presión)
- **Vacunación**
- **Laboratorio**
- **Consultorios médicos** (varios profesionales)
- **Farmacia**
- **Admisión**

Cada servicio puede tener uno o más consultorios/salas asignados.

## 🎯 Requisitos

### Funcionales
1. **Vista por Servicio**: Mostrar solo llamados relevantes a cada servicio
2. **Vista General**: Mostrar todos los llamados de la institución
3. **Filtrado en Tiempo Real**: Actualización automática por servicio
4. **TTS Selectivo**: Solo anunciar llamados del servicio actual (en vista por servicio)
5. **Historial Reciente**: Últimos 10-20 llamados por servicio
6. **Identificación Clara**: Color/icono por tipo de servicio

### No Funcionales
1. **Performance**: Carga rápida (< 2s)
2. **Real-time**: Actualización < 500ms
3. **Escalabilidad**: Soportar 10+ servicios simultáneos
4. **Accesibilidad**: Legible a 5+ metros de distancia

## 🏗️ Arquitectura Propuesta

### Opción 1: Rutas por Servicio (Recomendada) ⭐

```
/pantalla/[institution_slug]              → Vista general (todos los servicios)
/pantalla/[institution_slug]/servicio/[service_id]  → Vista por servicio específico
```

**Ventajas:**
- ✅ SEO friendly (URLs semánticas)
- ✅ Fácil configuración en tablets (un URL por servicio)
- ✅ Permite deep linking
- ✅ Filtrado server-side optimizado
- ✅ Menor uso de datos (solo carga lo necesario)

**Implementación:**
```typescript
// /pantalla/[institution_slug]/page.tsx - Vista General
- Muestra TODOS los llamados
- Layout en grid (3-4 columnas)
- Agrupados por servicio
- TTS para TODOS los llamados

// /pantalla/[institution_slug]/servicio/[service_id]/page.tsx - Vista por Servicio
- Muestra solo llamados del servicio seleccionado
- Layout optimizado (lista grande, fácil lectura)
- TTS solo para este servicio
- Indicador visual del servicio actual
```

### Opción 2: Selector de Vista con Query Params

```
/pantalla/[institution_slug]?servicio=[service_id]
/pantalla/[institution_slug]?vista=general
```

**Ventajas:**
- ✅ Un solo componente
- ✅ Cambio de vista sin recargar página

**Desventajas:**
- ❌ Más complejo de mantener
- ❌ Estado compartido entre vistas
- ❌ URLs menos amigables

### Opción 3: Tabs/Pestañas en Mismo Componente

**Desventajas:**
- ❌ No apto para tablets dedicadas por servicio
- ❌ Requiere interacción manual
- ❌ Complejidad de estado

## 🎨 Diseño UI Propuesto

### Vista General (Todos los Servicios)

```
┌────────────────────────────────────────────────────────┐
│  CAPS B° Evita - Pantalla General    🔊 [TTS Controls] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│  │ 💉 VACUNACIÓN│ │ 🩺 ENFERMERÍA│ │ 🧪 LABORATORIO│    │
│  │─────────────│ │─────────────│ │─────────────│     │
│  │ LLAMADO:    │ │ LLAMADO:    │ │ ESPERANDO   │     │
│  │ Juan Pérez  │ │ Ana García  │ │             │     │
│  │ Sala 1      │ │ Sala 2      │ │             │     │
│  │             │ │             │ │             │     │
│  │ ESPERANDO:  │ │ ESPERANDO:  │ │ PRÓXIMOS:   │     │
│  │ - M. López  │ │ - C. Ruiz   │ │ - P. Silva  │     │
│  │ - L. Torres │ │ - D. Gómez  │ │ - R. Díaz   │     │
│  └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│  │ 👨‍⚕️ MÉDICO 1 │ │ 👨‍⚕️ MÉDICO 2 │ │ 💊 FARMACIA  │     │
│  │ Dr. Martínez│ │ Dra. Sánchez│ │─────────────│     │
│  │─────────────│ │─────────────│ │ EN CONSULTA │     │
│  │ LLAMADO:    │ │ LLAMADO:    │ │             │     │
│  │ S. Romero   │ │ P. Castro   │ │ PRÓXIMOS:   │     │
│  │ Cons. 3     │ │ Cons. 4     │ │ - E. Vega   │     │
│  └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                        │
│  Última actualización: 14:30:15                       │
└────────────────────────────────────────────────────────┘
```

### Vista por Servicio Individual

```
┌────────────────────────────────────────────────────────┐
│  💉 VACUNACIÓN - CAPS B° Evita      🔊 [TTS Controls]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  🔔 LLAMADO ACTUAL - Sala 1                      │ │
│  │                                                  │ │
│  │         JUAN PÉREZ                               │ │
│  │         Turno: 14:30                             │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  PRÓXIMOS TURNOS:                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │  1. María López        - 14:35                   │ │
│  │  2. Luis Torres        - 14:40                   │ │
│  │  3. Carmen Ruiz        - 14:45                   │ │
│  │  4. Diego Gómez        - 14:50                   │ │
│  │  5. Patricia Silva     - 14:55                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  EN CONSULTA:                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Sala 1: Ana García    - Desde 14:15             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Última actualización: 14:30:15                       │
└────────────────────────────────────────────────────────┘
```

## 💾 Estructura de Datos

### Query para Vista General

```typescript
// Obtener todos los appointments del día agrupados por servicio
const { data } = await supabase
  .from('appointment')
  .select(`
    id,
    scheduled_at,
    status,
    patient:patient_id(first_name, last_name),
    professional:professional_id(first_name, last_name),
    service:service_id(id, name, description),
    room:room_id(id, name)
  `)
  .eq('institution_id', institutionId)
  .gte('scheduled_at', startOfDay)
  .lte('scheduled_at', endOfDay)
  .in('status', ['esperando', 'llamado', 'en_consulta'])
  .order('scheduled_at', { ascending: true })

// Agrupar por service_id en el cliente
const appointmentsByService = data.reduce((acc, apt) => {
  const serviceId = apt.service.id
  if (!acc[serviceId]) {
    acc[serviceId] = {
      service: apt.service,
      appointments: []
    }
  }
  acc[serviceId].appointments.push(apt)
  return acc
}, {})
```

### Query para Vista por Servicio

```typescript
// Obtener appointments de un servicio específico
const { data } = await supabase
  .from('appointment')
  .select(`
    id,
    scheduled_at,
    status,
    patient:patient_id(first_name, last_name),
    professional:professional_id(first_name, last_name),
    service:service_id(id, name),
    room:room_id(id, name)
  `)
  .eq('institution_id', institutionId)
  .eq('service_id', serviceId)  // ← Filtrado por servicio
  .gte('scheduled_at', startOfDay)
  .lte('scheduled_at', endOfDay)
  .in('status', ['esperando', 'llamado', 'en_consulta'])
  .order('scheduled_at', { ascending: true })
```

### Suscripción Realtime por Servicio

```typescript
// Suscribirse solo a cambios del servicio actual
supabase
  .channel(`service-${serviceId}-appointments`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'appointment',
      filter: `service_id=eq.${serviceId}` // ← Filtro server-side
    },
    (payload) => {
      handleAppointmentUpdate(payload)
    }
  )
  .subscribe()
```

## 🔊 Configuración TTS por Vista

### Vista General
```typescript
const callEvents = useMemo(() => {
  // Crear eventos para TODOS los servicios
  return allAppointments
    .filter(apt => apt.status === 'llamado')
    .map(apt => ({
      id: apt.id,
      service_name: apt.service.name, // Para anunciar el servicio
      patient_name: `${apt.patient.first_name} ${apt.patient.last_name}`,
      room_name: apt.room.name
    }))
}, [allAppointments])

// Texto TTS: "Vacunación: Juan Pérez, sala 1"
const generateCallText = (event) =>
  `${event.service_name}: ${event.patient_name}, ${event.room_name}`
```

### Vista por Servicio
```typescript
const callEvents = useMemo(() => {
  // Solo eventos del servicio actual
  return serviceAppointments
    .filter(apt => apt.status === 'llamado')
    .map(apt => ({
      id: apt.id,
      patient_name: `${apt.patient.first_name} ${apt.patient.last_name}`,
      room_name: apt.room.name
    }))
}, [serviceAppointments])

// Texto TTS: "Juan Pérez, sala 1" (no menciona servicio porque es obvio)
const generateCallText = (event) =>
  `${event.patient_name}, ${event.room_name}`
```

## 🎨 Sistema de Colores por Servicio

```typescript
const serviceColors: Record<string, { bg: string; text: string; icon: string }> = {
  'vacunacion': {
    bg: 'bg-purple-100',
    text: 'text-purple-900',
    icon: '💉'
  },
  'enfermeria': {
    bg: 'bg-blue-100',
    text: 'text-blue-900',
    icon: '🩺'
  },
  'laboratorio': {
    bg: 'bg-teal-100',
    text: 'text-teal-900',
    icon: '🧪'
  },
  'medico': {
    bg: 'bg-green-100',
    text: 'text-green-900',
    icon: '👨‍⚕️'
  },
  'farmacia': {
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    icon: '💊'
  },
  'default': {
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    icon: '📋'
  }
}
```

## 📱 Casos de Uso

### Caso 1: CAPS con 5 Servicios
**Setup:**
- 1 tablet en sala de espera → Vista general (todas)
- 1 tablet en vacunación → Vista servicio (solo vacunación)
- 1 tablet en enfermería → Vista servicio (solo enfermería)

**URLs:**
```
Sala espera: /pantalla/caps-evita
Vacunación:  /pantalla/caps-evita/servicio/[vacunacion-id]
Enfermería:  /pantalla/caps-evita/servicio/[enfermeria-id]
```

### Caso 2: Hospital con Múltiples Consultorios
**Setup:**
- Pantalla LED grande en hall → Vista general (grid)
- TV en cada consultorio → Vista servicio individual

## 🚀 Plan de Implementación

### Fase 1: Estructura Base (2-3 horas)
- [ ] Crear `/pantalla/[institution_slug]/servicio/[service_id]/page.tsx`
- [ ] Adaptar queries para filtrado por servicio
- [ ] Implementar agrupación por servicio en vista general

### Fase 2: UI/UX (2-3 horas)
- [ ] Diseñar componente ServiceCard para vista general
- [ ] Diseñar componente ServiceQueueView para vista individual
- [ ] Implementar sistema de colores por servicio
- [ ] Añadir iconos por tipo de servicio

### Fase 3: Real-time & TTS (1-2 horas)
- [ ] Configurar suscripciones Realtime filtradas por servicio
- [ ] Adaptar TTS para incluir nombre de servicio (vista general)
- [ ] Adaptar TTS para omitir servicio (vista individual)
- [ ] Testing de múltiples servicios simultáneos

### Fase 4: Optimización (1 hora)
- [ ] Caché de datos por servicio
- [ ] Lazy loading de servicios inactivos
- [ ] Performance testing con 10+ servicios

### Fase 5: Documentación (30 min)
- [ ] Guía de configuración para admins
- [ ] URLs de ejemplo para cada servicio
- [ ] Troubleshooting común

## 📊 Estimación Total

**Tiempo:** 6-9 horas de desarrollo
**Complejidad:** Media
**Impacto:** Alto (mejora UX significativamente)

## 🔧 Consideraciones Técnicas

### Performance
- Usar `useMemo` para agrupaciones
- Implementar virtualización si > 50 appointments
- Limitar historial a últimos 20 por servicio

### Accesibilidad
- Fuentes grandes (24px+ para llamado actual)
- Alto contraste (WCAG AAA)
- Animaciones suaves para nuevos llamados
- TTS configurable por servicio

### Multi-tenant
- Cada institución configura sus servicios
- Colores personalizables por institución
- Iconos personalizables (futuro)

## ✅ Beneficios

1. **Organización:** Clara separación por servicio
2. **Escalabilidad:** Soporta crecimiento de servicios
3. **Flexibilidad:** Vistas general o específica según necesidad
4. **UX:** Pacientes ven solo info relevante
5. **Eficiencia:** Personal ve solo su servicio
6. **Performance:** Queries optimizadas por servicio
