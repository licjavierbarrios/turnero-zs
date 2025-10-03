# Code Style and Conventions for Turnero ZS

## Language and Localization
- **All user-facing text must be in Spanish** (Argentine healthcare context)
- Database content and enums use Spanish terminology
- Comments and variable names can be in English for developer clarity
- Use Argentine date/time formats: DD/MM/YYYY HH:mm

## TypeScript Configuration
- Strict mode enabled in tsconfig.json
- Target ES2017 with modern library support
- Path aliases configured: `@/*` maps to project root
- JSX preserve mode for Next.js handling

## Code Style
- ESLint configuration extends `next/core-web-vitals`
- Disabled rules: `@next/next/no-img-element`
- Warning level: `react-hooks/exhaustive-deps`
- Use functional components with hooks
- Prefer arrow functions for component definitions

## File Structure Conventions
- App Router structure: `app/(dashboard)` and `app/(public)`
- UI components in `components/ui/` (shadcn/ui pattern)
- Utilities in `lib/` directory
- Database files in `db/` directory
- Path aliases use `@/` prefix

## Naming Conventions
- **Files**: kebab-case for pages and components (`appointment-form.tsx`)
- **Components**: PascalCase (`AppointmentForm`)
- **Variables/Functions**: camelCase (`formatAppointmentStatus`)
- **Constants**: UPPER_SNAKE_CASE (`APPOINTMENT_STATUSES`)
- **Database**: snake_case for tables and columns (`appointment_status`)

## Styling Conventions
- Use Tailwind CSS with custom design system
- CSS variables for shadcn/ui theming
- Custom health system colors defined in tailwind.config.ts
- Utility-first approach with `cn()` helper for conditional classes
- Status badges use semantic color coding

## Component Patterns
- Use shadcn/ui components as base
- Custom utility functions for health system specific formatting
- Status management with TypeScript enums matching database enums
- Real-time updates via Supabase channels

## Import Organization
- External libraries first
- Internal utilities and types
- Components last
- Use absolute imports with `@/` prefix

## Database Conventions
- UUID primary keys with `uuid_generate_v4()`
- Timestamps with `TIMESTAMP WITH TIME ZONE`
- Enums for constrained values (status, roles, types)
- Row Level Security (RLS) policies for multi-tenancy
- Spanish terminology for enum values