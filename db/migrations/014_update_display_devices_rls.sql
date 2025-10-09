-- Migración: Actualizar RLS para display_devices
-- Fecha: 2025-01-XX
-- Descripción: Permitir que usuarios con display_devices accedan a daily_queue_display

-- ============================================================
-- 1. POLÍTICAS PARA display_devices
-- ============================================================

-- Permitir que los usuarios lean sus propios display_devices
DROP POLICY IF EXISTS "Users can view their own display devices" ON display_devices;
CREATE POLICY "Users can view their own display devices"
  ON display_devices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir que los usuarios actualicen last_seen_at de sus propios dispositivos
DROP POLICY IF EXISTS "Users can update their own display devices last_seen" ON display_devices;
CREATE POLICY "Users can update their own display devices last_seen"
  ON display_devices
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. POLÍTICAS PARA daily_queue_display (vista)
-- ============================================================

-- La vista hereda permisos de daily_queue, necesitamos actualizar las políticas de daily_queue

-- Permitir que display_devices lean la cola de su institución
DROP POLICY IF EXISTS "Display devices can view daily queue" ON daily_queue;
CREATE POLICY "Display devices can view daily queue"
  ON daily_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM display_devices dd
      WHERE dd.user_id = auth.uid()
        AND dd.institution_id = daily_queue.institution_id
        AND dd.is_active = true
    )
  );

-- ============================================================
-- 3. REALTIME: Permitir que display_devices se suscriban
-- ============================================================

-- Verificar y agregar daily_queue a la publicación de realtime solo si no existe
-- (esto permite que los display_devices reciban actualizaciones en tiempo real)
DO $$
BEGIN
  -- Intentar agregar la tabla a la publicación
  -- Si ya existe, no hace nada
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_queue;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- La tabla ya está en la publicación, continuar
  END;
END $$;

-- ============================================================
-- 4. POLÍTICAS PARA institution
-- ============================================================

-- Permitir que display_devices lean información de su institución
DROP POLICY IF EXISTS "Display devices can view their institution" ON institution;
CREATE POLICY "Display devices can view their institution"
  ON institution
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM display_devices dd
      WHERE dd.user_id = auth.uid()
        AND dd.institution_id = institution.id
        AND dd.is_active = true
    )
  );

-- ============================================================
-- 5. POLÍTICAS PARA service
-- ============================================================

-- Permitir que display_devices lean servicios de su institución
DROP POLICY IF EXISTS "Display devices can view services" ON service;
CREATE POLICY "Display devices can view services"
  ON service
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM display_devices dd
      WHERE dd.user_id = auth.uid()
        AND dd.institution_id = service.institution_id
        AND dd.is_active = true
    )
  );

-- ============================================================
-- 6. FUNCIÓN HELPER: Verificar si es display_device
-- ============================================================

CREATE OR REPLACE FUNCTION is_display_device(institution_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM display_devices
    WHERE user_id = auth.uid()
      AND institution_id = institution_uuid
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- NOTAS
-- ============================================================

-- Esta migración permite que:
-- 1. Los usuarios con display_devices puedan leer la daily_queue de su institución
-- 2. Los display_devices puedan actualizar su last_seen_at (para heartbeat)
-- 3. Los display_devices puedan leer información de su institución y servicios
-- 4. Los display_devices puedan suscribirse a cambios en tiempo real vía Realtime

-- Las políticas están diseñadas para:
-- - Mantener seguridad: solo acceso a datos de su institución
-- - Permitir operación normal de las pantallas públicas
-- - Permitir tracking de actividad con last_seen_at
