-- Deshabilitar RLS en user_service para permitir inserción desde la aplicación
ALTER TABLE user_service DISABLE ROW LEVEL SECURITY;

-- Alternativamente, si prefieres mantener RLS, crea estas políticas:
-- CREATE POLICY "user_service_select_all" ON user_service FOR SELECT USING (true);
-- CREATE POLICY "user_service_insert_all" ON user_service FOR INSERT WITH CHECK (true);
-- CREATE POLICY "user_service_update_all" ON user_service FOR UPDATE USING (true) WITH CHECK (true);
-- CREATE POLICY "user_service_delete_all" ON user_service FOR DELETE USING (true);
