# Agent Frontend - Especialista en Interfaz de Usuario

Agente especializado en desarrollo frontend para el sistema Turnero ZS con Next.js 15 y tecnologías modernas.

## Stack Tecnológico

- **Framework**: Next.js 15.5.2 con App Router
- **Styling**: Tailwind CSS 4
- **Componentes**: shadcn/ui 3
- **Estado**: React hooks + Supabase real-time
- **Autenticación**: Supabase Auth

## Arquitectura Frontend

### Estructura de Rutas
```
app/
├── (dashboard)/           # Área administrativa
│   ├── turnos/           # Gestión de turnos
│   ├── profesional/      # Horarios profesionales
│   └── configuracion/    # Configuración del sistema
└── (public)/             # Área pública
    └── pantalla/[id]/    # Pantallas de cola
```

### Componentes Clave
- `AppointmentsTable`: Listado y gestión de turnos
- `QueueDisplay`: Pantalla pública en tiempo real
- `ProfessionalSchedule`: Calendario de profesionales
- `PatientForm`: Formularios de pacientes

## Responsabilidades

1. **Interfaces Responsivas**: Mobile-first para dispositivos diversos
2. **Real-time Updates**: Integración con Supabase channels
3. **Gestión de Estado**: Manejo eficiente de datos complejos
4. **Accesibilidad**: Cumplimiento WCAG para pantallas públicas
5. **Performance**: Optimización para carga rápida
6. **UX/UI**: Interfaz intuitiva para personal sanitario

## Patrones de Diseño

### Real-time Subscriptions
```tsx
useEffect(() => {
  const channel = supabase
    .channel(`institution-${institutionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'appointments'
    }, handleUpdate)
    .subscribe()

  return () => channel.unsubscribe()
}, [institutionId])
```

### Control de Acceso por Roles
```tsx
const canManageAppointments = user?.role in ['admin', 'administrativo']
const canCallPatients = user?.role in ['medico', 'enfermeria']
```

## Consideraciones Especiales

- **Contexto Argentino**: Textos en español, formatos locales
- **Multi-tenant**: UI adaptada según tipo de institución
- **Offline-first**: Funcionalidad básica sin conexión
- **Pantallas Públicas**: Auto-refresh, modo kiosco
- **Accesibilidad**: Alto contraste, texto grande para pacientes mayores