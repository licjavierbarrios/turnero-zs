# Project Structure for Turnero ZS

## Current Directory Structure
```
turnero-zs/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Dashboard routes (authenticated)
│   │   ├── layout.tsx           # Dashboard layout
│   │   ├── profesional/         # Professional management
│   │   │   └── page.tsx
│   │   └── turnos/              # Appointment management
│   │       └── page.tsx
│   ├── (public)/                # Public routes
│   │   └── pantalla/            # Public display screens
│   │       └── [institutionId]/
│   │           └── page.tsx
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # React components
│   └── ui/                      # shadcn/ui components (empty, needs setup)
├── db/                          # Database files
│   ├── schema.sql               # Database schema
│   ├── policies.sql             # RLS policies
│   └── seed.sql                 # Initial data
├── docs/                        # Documentation
├── lib/                         # Utility libraries
│   ├── supabase.ts             # Supabase client setup
│   └── utils.ts                # Utility functions
└── Configuration files
    ├── .eslintrc.json          # ESLint configuration
    ├── .mcp.json               # MCP server configuration
    ├── CLAUDE.md               # Claude Code instructions
    ├── next.config.js          # Next.js configuration
    ├── package.json            # Dependencies and scripts
    ├── postcss.config.js       # PostCSS configuration
    ├── tailwind.config.ts      # Tailwind CSS configuration
    └── tsconfig.json           # TypeScript configuration
```

## Expected Structure (Based on CLAUDE.md)
```
turnero-zs/
├── app/
│   ├── (dashboard)/
│   │   ├── turnos/page.tsx          # ✅ Exists
│   │   └── profesional/page.tsx     # ✅ Exists
│   └── (public)/
│       └── pantalla/[institutionId]/page.tsx  # ✅ Exists
├── components/
│   ├── ui/                          # ⚠️ Empty, needs shadcn/ui setup
│   ├── AppointmentsTable.tsx       # ❌ Missing
│   └── PublicScreen.tsx            # ❌ Missing
├── lib/
│   └── supabaseClient.ts           # ⚠️ Different name (supabase.ts)
└── db/
    ├── schema.sql                  # ✅ Exists
    ├── seed.sql                    # ✅ Exists (assumed)
    └── policies.sql                # ✅ Exists
```

## Sprint 1 Implementation Needs
Based on the todo list, Sprint 1 requires:
1. **components/ui/** - Base shadcn/ui components setup
2. **Zones CRUD** - Components and pages for zone management
3. **Institutions CRUD** - Components and pages for institution management  
4. **Professionals CRUD** - Components and pages for professional management
5. **Patients CRUD** - Components and pages for patient management
6. **Users and Memberships** - User management system

## Missing Key Components
- Form components for CRUD operations
- Table components for data listing
- Modal/Dialog components for actions
- Layout components for consistent UI
- Navigation components