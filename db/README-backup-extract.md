# Extracción del Schema Actual de Supabase

## 🎯 Objetivo
Antes de limpiar la base de datos, necesitamos extraer el schema **real** que está funcionando en Supabase, ya que puede tener modificaciones que no están en nuestros archivos locales.

## 📋 Pasos a seguir

### 1. Extraer el Schema Actual

#### Opción A: Script de Extracción Completa (Recomendado)
1. Ve al **SQL Editor** en tu Supabase Dashboard
2. Ejecuta el archivo `extract-current-schema.sql`:
   ```sql
   -- Copia y pega todo el contenido del archivo
   ```
3. **Copia TODO el output** que aparece en la consola
4. Crea un nuevo archivo: `db/schema-actual-YYYY-MM-DD.sql`
5. Pega todo el output en ese archivo

#### Opción B: Script de Backup Estructurado
1. Ve al **SQL Editor** en Supabase
2. Ejecuta el archivo `backup-current-state.sql`
3. Guarda el output completo como `db/backup-YYYY-MM-DD.sql`

### 2. Verificar la Extracción

El archivo generado debe contener:
- ✅ Extensiones (`uuid-ossp`, `pgcrypto`)
- ✅ Tipos ENUM (`institution_type`, `appointment_status`, `role_name`)
- ✅ Todas las tablas con columnas completas
- ✅ Primary keys y foreign keys
- ✅ Funciones (`update_updated_at_column`)
- ✅ Triggers de `updated_at`
- ✅ Políticas RLS completas

### 3. Crear Scripts de Reset Actualizados

Una vez que tengas el schema real extraído:

1. **Crear reset actualizado**:
   ```sql
   -- Usar el schema real para crear un reset-database-real.sql
   ```

2. **Crear rebuild actualizado**:
   ```sql
   -- Usar el schema real para crear un rebuild-database-real.sql
   ```

## 🔍 ¿Qué diferencias podríamos encontrar?

### Posibles discrepancias entre archivos locales y Supabase:
- **Nuevas columnas** añadidas por comandos SQL directos
- **Políticas RLS modificadas** durante el desarrollo
- **Índices adicionales** creados para performance
- **Constraints actualizados** o modificados
- **Nuevas tablas** que no están en schema.sql local

### Ejemplo de diferencias comunes:
```sql
-- En archivo local (posiblemente obsoleto):
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255)
);

-- En Supabase real (actual):
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

## ⚠️ Ventajas de este enfoque

### ✅ Beneficios:
- **Fidelidad total** al estado real de Supabase
- **No perdemos modificaciones** hechas directamente en BD
- **Backup seguro** antes de cualquier reset
- **Schema versionado** con timestamp

### ❌ Alternativa peligrosa (no recomendada):
- Confiar en archivos locales que pueden estar obsoletos
- Perder modificaciones hechas durante desarrollo
- Schema inconsistente después del reset

## 🚀 Después de la extracción

### Próximos pasos:
1. **Revisar el schema extraído** para entender el estado real
2. **Crear scripts de reset basados en la realidad**
3. **Proceder con la limpieza** usando el schema real como base
4. **Reconstruir exactamente** lo que estaba funcionando

### Files que vas a generar:
```
db/
├── schema-actual-2024-01-15.sql       # Schema real extraído
├── reset-database-real.sql            # Reset basado en schema real
├── rebuild-database-real.sql          # Rebuild basado en schema real
└── backup-complete-2024-01-15.sql     # Backup completo con datos
```

## 🆘 Troubleshooting

### Si el script es muy largo:
- Ejecuta secciones por partes
- Copia cada sección a archivos separados
- Usa `\o archivo.sql` si tu cliente lo soporta

### Si aparecen errores:
- Asegúrate de tener permisos de lectura en todas las tablas
- Algunos metadatos pueden requerir permisos especiales
- Los errores en tablas del sistema son normales (ignorar)

### Para verificar que el backup está completo:
```sql
-- Verificar número de tablas
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Verificar número de policies
SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
```