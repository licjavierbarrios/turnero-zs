-- =====================================================
-- SCRIPT DE DATOS DEMO PARA AUTENTICACIÓN
-- Ejecutar DESPUÉS de crear los usuarios en Supabase Auth
-- =====================================================

-- PASO 1: Crear usuarios en Supabase Auth Dashboard
-- Ve a tu proyecto > Authentication > Users > "Add user"
-- Crear estos usuarios manualmente:

-- Usuario 1: juan.paredes@salud.gov.ar (password: demo123)
-- Usuario 2: maria.lopez@salud.gov.ar (password: demo123)
-- Usuario 3: admin@salud.gov.ar (password: admin123)

-- PASO 2: Obtener los UUIDs de los usuarios creados
-- Ejecuta esta consulta para obtener los UUIDs:
-- SELECT id, email FROM auth.users WHERE email IN (
--   'juan.paredes@salud.gov.ar',
--   'maria.lopez@salud.gov.ar',
--   'admin@salud.gov.ar'
-- );

-- PASO 3: Reemplazar los UUIDs en las siguientes consultas y ejecutar

-- =====================================================
-- INSERTAR PERFILES DE USUARIO
-- =====================================================
-- IMPORTANTE: Reemplaza 'UUID_AQUI' con los UUIDs reales de auth.users

INSERT INTO public.user_profile (id, first_name, last_name, document_number, phone) VALUES
('UUID_JUAN_PAREDES', 'Juan', 'Paredes', '12345678', '+54 9 11 1234-5678'),
('UUID_MARIA_LOPEZ', 'María', 'López', '87654321', '+54 9 11 8765-4321'),
('UUID_ADMIN_SISTEMA', 'Administrador', 'Sistema', '11111111', '+54 9 11 0000-0000');

-- =====================================================
-- INSERTAR MEMBRESÍAS (después de tener instituciones)
-- =====================================================
-- Primero obtén los UUIDs de las instituciones:
-- SELECT id, name FROM institution ORDER BY name;

-- Dr. Juan Paredes - Múltiples instituciones
INSERT INTO public.membership (user_id, institution_id, role, assigned_by) VALUES
('UUID_JUAN_PAREDES', 'UUID_CAPS_SAN_LORENZO', 'medico', 'UUID_ADMIN_SISTEMA'),
('UUID_JUAN_PAREDES', 'UUID_HOSPITAL_DISTRITAL_NORTE', 'medico', 'UUID_ADMIN_SISTEMA'),
('UUID_JUAN_PAREDES', 'UUID_CAPS_VILLA_NUEVA', 'medico', 'UUID_ADMIN_SISTEMA');

-- Enfermera María López - Una institución
INSERT INTO public.membership (user_id, institution_id, role, assigned_by) VALUES
('UUID_MARIA_LOPEZ', 'UUID_CAPS_SAN_LORENZO', 'enfermeria', 'UUID_ADMIN_SISTEMA');

-- Administrador - Todas las instituciones
INSERT INTO public.membership (user_id, institution_id, role, assigned_by) VALUES
('UUID_ADMIN_SISTEMA', 'UUID_CAPS_SAN_LORENZO', 'admin', 'UUID_ADMIN_SISTEMA'),
('UUID_ADMIN_SISTEMA', 'UUID_HOSPITAL_DISTRITAL_NORTE', 'admin', 'UUID_ADMIN_SISTEMA'),
('UUID_ADMIN_SISTEMA', 'UUID_CAPS_VILLA_NUEVA', 'admin', 'UUID_ADMIN_SISTEMA'),
('UUID_ADMIN_SISTEMA', 'UUID_HOSPITAL_REGIONAL_CENTRO', 'admin', 'UUID_ADMIN_SISTEMA');

-- =====================================================
-- CONSULTAS PARA VERIFICAR LA CONFIGURACIÓN
-- =====================================================

-- Verificar usuarios creados
SELECT
  up.first_name,
  up.last_name,
  au.email,
  up.document_number,
  up.is_active
FROM user_profile up
JOIN auth.users au ON up.id = au.id
ORDER BY up.last_name;

-- Verificar membresías
SELECT
  up.first_name || ' ' || up.last_name as usuario,
  i.name as institucion,
  i.type as tipo_institucion,
  z.name as zona,
  m.role as rol,
  m.is_active
FROM membership m
JOIN user_profile up ON m.user_id = up.id
JOIN institution i ON m.institution_id = i.id
JOIN zone z ON i.zone_id = z.id
WHERE m.is_active = true
ORDER BY up.last_name, i.name;

-- Probar función de instituciones por usuario
SELECT * FROM get_user_institutions('UUID_JUAN_PAREDES');
SELECT * FROM get_user_institutions('UUID_MARIA_LOPEZ');
SELECT * FROM get_user_institutions('UUID_ADMIN_SISTEMA');

-- =====================================================
-- SCRIPT COMPLETO PASO A PASO
-- =====================================================

-- 1. En Supabase Dashboard > Authentication > Users:
--    - Crear usuario: juan.paredes@salud.gov.ar / demo123
--    - Crear usuario: maria.lopez@salud.gov.ar / demo123
--    - Crear usuario: admin@salud.gov.ar / admin123

-- 2. Obtener UUIDs de usuarios:
-- SELECT id, email FROM auth.users WHERE email IN (
--   'juan.paredes@salud.gov.ar',
--   'maria.lopez@salud.gov.ar',
--   'admin@salud.gov.ar'
-- );

-- 3. Obtener UUIDs de instituciones:
-- SELECT id, name FROM institution ORDER BY name;

-- 4. Reemplazar UUIDs en los INSERT de arriba y ejecutar

-- 5. Ejecutar consultas de verificación

-- =====================================================
-- EJEMPLO DE CONSULTA FINAL
-- =====================================================
-- Una vez configurado todo, esto debería funcionar:

-- SELECT
--   u.email,
--   ui.institution_name,
--   ui.institution_type,
--   ui.zone_name,
--   ui.user_role
-- FROM auth.users u
-- CROSS JOIN LATERAL get_user_institutions(u.id) ui
-- WHERE u.email = 'juan.paredes@salud.gov.ar';