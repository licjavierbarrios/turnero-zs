-- ============================================================================
-- ESTABLECER CONTRASEÑA PARA SUPER ADMIN
-- ============================================================================
--
-- Este script establece una contraseña para el usuario super admin
-- directamente en auth.users usando la extensión pgcrypto
--
-- IMPORTANTE: Reemplaza 'TU_CONTRASEÑA_AQUI' con tu contraseña deseada
-- ============================================================================

-- Actualizar contraseña del usuario
UPDATE auth.users
SET
  encrypted_password = crypt('TU_CONTRASEÑA_AQUI', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'licjavierbarrios@hotmail.com';

-- Verificar que se actualizó
SELECT
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmado,
  encrypted_password IS NOT NULL as tiene_password,
  created_at,
  updated_at
FROM auth.users
WHERE email = 'licjavierbarrios@hotmail.com';
