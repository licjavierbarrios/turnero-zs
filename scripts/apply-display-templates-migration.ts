import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = 'https://tdbvjqmnbvnqwwpmbkzg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYnZqcW1uYnZucXd3cG1ia3pnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjk0NTMyOCwiZXhwIjoyMDQyNTIxMzI4fQ.Ud2yopartnl-RlD4i0M88Bqw_F_rJXyqZx3qHUjy-Js'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  try {
    const migrationPath = join(process.cwd(), 'db', 'migrations', '002_create_display_templates.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('Aplicando migración de plantillas de visualización...')

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      console.error('❌ Error al aplicar migración:', error)
      process.exit(1)
    }

    console.log('✅ Migración aplicada exitosamente')
    console.log('📊 Plantillas predefinidas creadas:')
    console.log('   1. Vista Completa (grid 3x2)')
    console.log('   2. Solo Consultorios Médicos (grid 2x2)')
    console.log('   3. Enfermería y Servicios (lista)')
    console.log('   4. Carrusel Automático (8 segundos)')
  } catch (err) {
    console.error('❌ Error inesperado:', err)
    process.exit(1)
  }
}

applyMigration()
