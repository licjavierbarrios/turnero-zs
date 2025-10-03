# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Turnero ZS** is a multi-zone appointment and queue management system for Argentine healthcare centers (CAPS/hospitals). It provides appointment scheduling, patient queue management, and real-time public displays to improve patient flow and reduce wait times.

## Technology Stack

- **Frontend**: Next.js 15.5.2 with App Router, Tailwind CSS 4, shadcn/ui 3
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Real-time**: Supabase channels per institution
- **Security**: Row Level Security (RLS) based on membership and roles

## Architecture

### Core Domain Entities
- **Zones** → **Institutions** → **Rooms/Services/Professionals**
- **Patients, Users, Memberships** with role-based access
- **Appointments** with state transitions (pendiente → esperando → llamado → en_consulta → finalizado)
- **Call Events & Attendance Events** for complete traceability

### User Roles
- `admin`: System administrators
- `administrativo`: Administrative staff
- `medico`: Healthcare professionals
- `enfermeria`: Nursing staff
- `pantalla`: Public display operators

### Institution Types
- `caps`: Primary care centers
- `hospital_seccional`: District hospitals
- `hospital_distrital`: Regional hospitals
- `hospital_regional`: Provincial hospitals

## Expected File Structure

```
turnero-zs/
├── app/
│   ├── (dashboard)/
│   │   ├── turnos/page.tsx          # Appointment management
│   │   └── profesional/page.tsx     # Professional schedules
│   └── (public)/
│       └── pantalla/[institutionId]/page.tsx  # Public display
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── AppointmentsTable.tsx       # Appointment listing
│   └── PublicScreen.tsx            # Real-time queue display
├── lib/
│   └── supabaseClient.ts           # Supabase configuration
└── db/
    ├── schema.sql                  # Database schema
    ├── seed.sql                    # Initial data
    └── policies.sql                # RLS policies
```

## Development Context

This system is designed for Argentine healthcare (inspired by HSI - Hospital Information System) and aims to:
- Reduce average wait time by 25-40% within 3 months
- Decrease absenteeism by 10-20%
- Achieve ≥85% schedule occupancy rate
- Maintain ≥95% complete event logging

The MVP excludes patient mobile apps, HSI integration, and emergency/bed management features.

## Key Implementation Notes

- Use Spanish for user-facing text and database content (Argentine healthcare context)
- Implement real-time updates via Supabase channels for public displays
- Ensure proper RLS policies for multi-institutional access
- Follow the appointment state machine: pendiente → esperando → llamado → en_consulta → finalizado/cancelado/ausente
- Consider accessibility requirements for public displays
- Plan for concurrent slot booking scenarios