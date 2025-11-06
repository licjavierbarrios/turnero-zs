-- Fix RLS policies for administrative tables
-- These tables are used by super_admin/admin for managing users, professionals, and services

-- Deshabilitar RLS en professional (tabla administrativa)
ALTER TABLE professional DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en user_service (tabla administrativa)
ALTER TABLE user_service DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en user_service_assignment (tabla administrativa)
ALTER TABLE user_service_assignment DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en daily_professional_assignment (tabla administrativa)
ALTER TABLE daily_professional_assignment DISABLE ROW LEVEL SECURITY;

-- Nota: Estas tablas son puramente administrativas y están protegidas por el middleware de autenticación.
-- Si en el futuro necesitas RLS más granular, puedes crear políticas específicas.
