-- Script para crear un usuario de pantalla completo
-- IMPORTANTE: Este script asume que el usuario YA FUE CREADO en Supabase Auth
-- Debes crear el usuario primero en: Dashboard → Authentication → Users → Add user

-- ============================================================
-- PASO 1: Verificar que el usuario existe en auth.users
-- ============================================================

-- Buscar el usuario por email para obtener su ID
-- Reemplaza 'pantalla@evita.com' con el email del usuario
SELECT
  id as user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'pantalla@evita.com';

-- IMPORTANTE: Si no aparece ningún resultado, debes crear el usuario en el Dashboard de Supabase primero


-- ============================================================
-- PASO 2: Crear registro en la tabla "user"
-- ============================================================

-- NOTA: Reemplaza estos valores:
-- - 'USER_ID_FROM_STEP_1' con el id obtenido del paso 1
-- - 'Pantalla' con el nombre deseado
-- - 'CAPS Evita' con el apellido o descripción

INSERT INTO "user" (id, email, first_name, last_name, is_active)
VALUES (
  'USER_ID_FROM_STEP_1',  -- ← Reemplazar con el UUID del paso 1
  'pantalla@evita.com',
  'Pantalla',
  'CAPS Evita',
  true
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  is_active = EXCLUDED.is_active;


-- ============================================================
-- PASO 3: Crear membresía con rol "pantalla"
-- ============================================================

-- NOTA: Reemplaza estos valores:
-- - 'USER_ID_FROM_STEP_1' con el id del usuario
-- - 'INSTITUTION_ID' con el id de la institución (CAPS B° EVITA)

-- Primero, busca el ID de la institución:
SELECT id, name, slug FROM institution WHERE name ILIKE '%evita%';

-- Luego, crea la membresía:
INSERT INTO membership (user_id, institution_id, role, is_active)
VALUES (
  'USER_ID_FROM_STEP_1',  -- ← Reemplazar con el UUID del usuario
  'INSTITUTION_ID',        -- ← Reemplazar con el UUID de la institución
  'pantalla',
  true
);


-- ============================================================
-- PASO 4: Crear display_device
-- ============================================================

-- NOTA: Reemplaza los valores según corresponda
INSERT INTO display_devices (
  institution_id,
  user_id,
  name,
  type,
  is_active,
  last_seen_at
)
VALUES (
  'INSTITUTION_ID',        -- ← Reemplazar con el UUID de la institución
  'USER_ID_FROM_STEP_1',   -- ← Reemplazar con el UUID del usuario
  'Pantalla Principal - CAPS Evita',
  'general',
  true,
  NOW()
);


-- ============================================================
-- PASO 5: Verificar que todo se creó correctamente
-- ============================================================

-- Verificar el usuario completo
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.is_active as user_active,
  m.role,
  m.is_active as membership_active,
  i.name as institution_name,
  dd.name as display_name,
  dd.is_active as display_active
FROM "user" u
LEFT JOIN membership m ON m.user_id = u.id
LEFT JOIN institution i ON i.id = m.institution_id
LEFT JOIN display_devices dd ON dd.user_id = u.id
WHERE u.email = 'pantalla@evita.com';


-- ============================================================
-- EJEMPLO COMPLETO CON VALORES REALES
-- ============================================================

-- Supongamos que:
-- - El user_id es: '123e4567-e89b-12d3-a456-426614174000'
-- - La institución es: '987fcdeb-51a2-43f7-9d8c-1234567890ab'

/*
-- 1. Verificar usuario
SELECT id, email FROM auth.users WHERE email = 'pantalla@evita.com';
-- Resultado: id = '123e4567-e89b-12d3-a456-426614174000'

-- 2. Crear registro en user
INSERT INTO "user" (id, email, first_name, last_name, is_active)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'pantalla@evita.com',
  'Pantalla',
  'CAPS Evita',
  true
)
ON CONFLICT (id) DO UPDATE SET is_active = true;

-- 3. Buscar institución
SELECT id, name FROM institution WHERE name ILIKE '%evita%';
-- Resultado: id = '987fcdeb-51a2-43f7-9d8c-1234567890ab'

-- 4. Crear membresía
INSERT INTO membership (user_id, institution_id, role, is_active)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  '987fcdeb-51a2-43f7-9d8c-1234567890ab',
  'pantalla',
  true
);

-- 5. Crear display_device
INSERT INTO display_devices (
  institution_id,
  user_id,
  name,
  type,
  is_active
)
VALUES (
  '987fcdeb-51a2-43f7-9d8c-1234567890ab',
  '123e4567-e89b-12d3-a456-426614174000',
  'Pantalla Principal - CAPS Evita',
  'general',
  true
);
*/


-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================

/*
1. El usuario DEBE ser creado primero en Supabase Auth (Dashboard → Authentication → Users)
   - Email: pantalla@evita.com
   - Contraseña temporal: (la que elijas)
   - Confirmar email automáticamente: SÍ (marcar el checkbox)

2. La contraseña debe ser cambiada en el primer login desde el Dashboard de Supabase

3. Si el usuario no puede hacer login, verifica:
   - Que el email esté confirmado en auth.users (email_confirmed_at no sea NULL)
   - Que la contraseña sea correcta
   - Que el usuario esté activo en ambas tablas (user.is_active = true)

4. Para debugging, puedes ejecutar:
   SELECT * FROM auth.users WHERE email = 'pantalla@evita.com';
*/
