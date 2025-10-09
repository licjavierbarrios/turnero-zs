# Arquitectura

Frontend: Next 15.5.2 con App Router, Tailwind 4 y shadcn 3.
Backend: Supabase (Postgres, Auth, Realtime, Storage).
Realtime: canales por institución.
Seguridad: RLS basada en membership y roles.

## Nuevas Características (Enero 2025)

### Sistema de Privacidad
- **3 niveles de privacidad** para protección de datos de pacientes:
  - `public_full_name`: Nombre completo visible
  - `public_initials`: Solo iniciales (ej: "J.P.")
  - `private_ticket_only`: Solo número de turno (ej: "Turno 001")
- **Jerarquía de privacidad**: appointment > service > institution
- Vista SQL `daily_queue_display` con privacidad pre-resuelta
- Componentes: `PrivacyBadge`, `PrivacySelector`

### Sistema de Pantallas Autenticadas
- Tabla `display_devices` para gestión de pantallas públicas
- Login específico para pantallas en `/pantalla/login`
- Autenticación obligatoria con Supabase Auth
- RLS políticas específicas para display_devices
- Heartbeat automático con `last_seen_at`
- Logout en pantalla pública

### Editor de Slug de Instituciones
- Configuración de slug personalizado por institución
- Validación de unicidad y formato
- URL pública amigable: `/pantalla/[slug]`

## Estructura de Carpetas
```
turnero-zs/
  app/(dashboard)/
    turnos/page.tsx
    profesional/page.tsx
    admin/page.tsx                          # Panel de administración
  app/(public)/pantalla/
    [slug]/page.tsx                         # Pantalla pública (slug o ID)
    login/page.tsx                          # Login para pantallas
  app/super-admin/
    usuarios/page.tsx                       # Gestión global de usuarios
  app/api/admin/
    users/route.ts                          # API para creación de usuarios con service role
  components/
    ui/*                                    # shadcn/ui components
    AppointmentsTable.tsx
    PublicScreen.tsx
    PrivacyBadge.tsx                        # Badge interactivo de privacidad
    PrivacySelector.tsx                     # Selector de nivel de privacidad
    InstitutionSettingsTab.tsx              # Editor de slug
    UsersManagementTab.tsx                  # Gestión de servicios por usuario
  lib/
    supabase.ts                             # Cliente de Supabase
    supabaseAdmin.ts                        # Cliente con service role
    privacy-utils.ts                        # Utilidades de privacidad
    audio-utils.ts                          # TTS y sonidos
  db/
    schema.sql
    seed.sql
    policies.sql
    migrations/
      013_add_privacy_system.sql            # Sistema de privacidad
      014_update_display_devices_rls.sql    # RLS para pantallas
```
