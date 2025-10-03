# Arquitectura

Frontend: Next 15.5.2 con App Router, Tailwind 4 y shadcn 3.  
Backend: Supabase (Postgres, Auth, Realtime, Storage).  
Realtime: canales por institución.  
Seguridad: RLS basada en membership y roles.

## Estructura de Carpetas
```
turnero-zs/
  app/(dashboard)/turnos/page.tsx
  app/(dashboard)/profesional/page.tsx
  app/(public)/pantalla/[institutionId]/page.tsx
  components/ui/*
  components/AppointmentsTable.tsx
  components/PublicScreen.tsx
  lib/supabaseClient.ts
  db/schema.sql
  db/seed.sql
  db/policies.sql
```
