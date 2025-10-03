-- Verificar que existe el membership del super admin
SELECT
  m.id,
  m.user_id,
  m.institution_id,
  m.role,
  m.is_active,
  u.email,
  i.name as institution_name
FROM membership m
JOIN users u ON u.id = m.user_id
JOIN institution i ON i.id = m.institution_id
WHERE m.user_id = '2f717f13-99b4-4fcc-a133-427755d89836';

-- Verificar políticas RLS en membership
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'membership';
