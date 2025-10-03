# Turnero ZS - Project Overview

## Purpose
Turnero ZS is a multi-zone appointment and queue management system designed specifically for Argentine healthcare centers (CAPS/hospitals). The system aims to:
- Reduce average wait time by 25-40% within 3 months
- Decrease absenteeism by 10-20%
- Achieve ≥85% schedule occupancy rate
- Maintain ≥95% complete event logging

## Technology Stack
- **Frontend**: Next.js 15.5.2 with App Router, React 18
- **Styling**: Tailwind CSS 4, shadcn/ui 3 components
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Real-time**: Supabase channels per institution
- **Security**: Row Level Security (RLS) based on membership and roles
- **Language**: TypeScript with strict mode enabled
- **Bundler**: Next.js built-in bundler

## Core Domain Entities
- **Zones** → **Institutions** → **Rooms/Services/Professionals**
- **Patients, Users, Memberships** with role-based access
- **Appointments** with state transitions (pendiente → esperando → llamado → en_consulta → finalizado)
- **Call Events & Attendance Events** for complete traceability

## User Roles
- `admin`: System administrators
- `administrativo`: Administrative staff
- `medico`: Healthcare professionals
- `enfermeria`: Nursing staff
- `pantalla`: Public display operators

## Institution Types
- `caps`: Primary care centers
- `hospital_seccional`: District hospitals
- `hospital_distrital`: Regional hospitals
- `hospital_regional`: Provincial hospitals

## Development Context
- All user-facing text and database content should be in Spanish (Argentine healthcare context)
- System is inspired by HSI (Hospital Information System)
- MVP excludes patient mobile apps, HSI integration, and emergency/bed management features
- Currently in Sprint 1 of development roadmap