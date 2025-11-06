# ✅ Checklist para Aplicar Migraciones

## 🔴 IMPORTANTE - Lee Antes de Proceder

**ANTES DE CUALQUIER COSA:**
1. ✅ Hacer BACKUP de la base de datos Supabase
2. ✅ Probar primero en ambiente de development/preview
3. ✅ Leer completamente este checklist
4. ✅ Leer `ARQUITECTURA_USUARIOS_PROFESIONALES.md`

---

## 📋 Paso 1: Preparar Base de Datos

### 1.1 Backup
```
[ ] Entrar a Supabase dashboard
[ ] Proyecto → Backups
[ ] Crear backup manual
[ ] Esperar a que complete
[ ] Guardar información de backup
```

### 1.2 Verificar Tablas Existentes
```sql
[ ] Abrir SQL Editor en Supabase
[ ] Ejecutar: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
[ ] Verificar que existan: users, professional, institution, room, membership
[ ] Anotar estructura actual de professional (especialmente primeras filas)
```

### 1.3 Contar Registros Actuales
```sql
[ ] SELECT COUNT(*) FROM professional;
    └─ Guardar número: _____ profesionales

[ ] SELECT COUNT(*) FROM users;
    └─ Guardar número: _____ usuarios

[ ] SELECT COUNT(*) FROM membership WHERE role IN ('profesional', 'servicio');
    └─ Guardar número: _____ membresías de profesional/servicio
```

---

## 🔧 Paso 2: Ejecutar Migraciones (EN ORDEN)

### 2.1 Migración 001 - Crear `professional_room_preference`
```
[ ] Abrir archivo: db/migrations/001_create_professional_room_preference.sql
[ ] Copiar COMPLETO el contenido
[ ] En Supabase SQL Editor → Pegar
[ ] Click en "Run" (ejecutar)
[ ] Esperar completación sin errores ✓
[ ] Verificar: SELECT COUNT(*) FROM professional_room_preference;
    └─ Debe retornar: 0 filas
```

### 2.2 Migración 002 - Crear `daily_professional_assignment`
```
[ ] Abrir archivo: db/migrations/002_create_daily_professional_assignment.sql
[ ] Copiar COMPLETO el contenido
[ ] En Supabase SQL Editor → Pegar
[ ] Click en "Run"
[ ] Esperar completación sin errores ✓
[ ] Verificar: SELECT COUNT(*) FROM daily_professional_assignment;
    └─ Debe retornar: 0 filas
```

### 2.3 Migración 003 - Crear `service_staff`
```
[ ] Abrir archivo: db/migrations/003_create_service_staff.sql
[ ] Copiar COMPLETO el contenido
[ ] En Supabase SQL Editor → Pegar
[ ] Click en "Run"
[ ] Esperar completación sin errores ✓
[ ] Verificar: SELECT COUNT(*) FROM service_staff;
    └─ Debe retornar: 0 filas
```

### 2.4 Migración 004 - Mejorar tabla `professional`
```
[ ] Abrir archivo: db/migrations/004_enhance_professional_table.sql
[ ] Copiar COMPLETO el contenido
[ ] En Supabase SQL Editor → Pegar
[ ] Click en "Run"
[ ] Esperar completación sin errores ✓
[ ] Verificar: \d professional (o SELECT * FROM professional LIMIT 1;)
    └─ Debe mostrar nuevas columnas: user_id, professional_type
```

### 2.5 Migración 005 - Actualizar RLS Policies
```
[ ] Abrir archivo: db/migrations/005_update_rls_policies.sql
[ ] Copiar COMPLETO el contenido
[ ] En Supabase SQL Editor → Pegar
[ ] Click en "Run"
[ ] Esperar completación sin errores ✓
[ ] Verificar en Supabase Dashboard:
    └─ Authentication → Policies
    └─ Ver nuevas policies en las tablas creadas
```

### 2.6 Migración 006 - Migrar Datos Existentes
```
[ ] ⚠️ IMPORTANTE: Leer migracion completa antes de ejecutar
[ ] Abrir archivo: db/migrations/006_migrate_existing_professionals.sql
[ ] LEER TODO el archivo, especialmente las NOTAS
[ ] Copiar COMPLETO el contenido
[ ] En Supabase SQL Editor → Pegar
[ ] Click en "Run"
[ ] Esperar completación sin errores ✓
[ ] Verificar: SELECT COUNT(*) FROM professional WHERE user_id IS NULL;
    └─ Debe retornar: 0 (todos los profesionales tienen user_id)
[ ] Verificar: SELECT COUNT(*) FROM professional_room_preference;
    └─ Debe retornar: igual al número de profesionales activos
```

---

## ✅ Paso 3: Validación

### 3.1 Verificar Tablas Creadas
```sql
[ ] SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
    
    Debe incluir (nuevas):
    ├─ [ ] daily_professional_assignment
    ├─ [ ] professional_room_preference
    └─ [ ] service_staff
```

### 3.2 Verificar Columnas de `professional`
```sql
[ ] SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'professional'
    ORDER BY ordinal_position;
    
    Debe incluir:
    ├─ [ ] id (UUID)
    ├─ [ ] user_id (UUID) ← NUEVO
    ├─ [ ] institution_id (UUID)
    ├─ [ ] professional_type (VARCHAR) ← NUEVO
    ├─ [ ] speciality (VARCHAR)
    ├─ [ ] first_name (VARCHAR) ← existente (mantener por compatibilidad)
    ├─ [ ] last_name (VARCHAR) ← existente
    ├─ [ ] email (VARCHAR) ← existente
    └─ [ ] ... resto de campos
```

### 3.3 Verificar Índices
```sql
[ ] SELECT indexname FROM pg_indexes 
    WHERE tablename = 'daily_professional_assignment';
    
    Debe incluir:
    ├─ [ ] idx_daily_professional_assignment_professional_date
    ├─ [ ] idx_daily_professional_assignment_room_date
    └─ [ ] idx_daily_professional_assignment_institution_date
```

### 3.4 Verificar RLS Está Habilitado
```sql
[ ] SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = true;
    
    Debe incluir:
    ├─ [ ] daily_professional_assignment
    ├─ [ ] professional_room_preference
    └─ [ ] service_staff
```

### 3.5 Contar Registros Después
```sql
[ ] SELECT COUNT(*) FROM professional;
    └─ Debe ser igual a paso 1.3: _____

[ ] SELECT COUNT(*) FROM professional WHERE user_id IS NOT NULL;
    └─ Debe ser igual a total de profesionales (todos migrados)

[ ] SELECT COUNT(*) FROM professional_room_preference;
    └─ Debe ser igual a profesionales activos

[ ] SELECT COUNT(*) FROM service_staff;
    └─ Debe ser: 0 (aún no hay personal de servicio)
```

---

## 🧪 Paso 4: Testing Manual

### 4.1 Probar Lectura de Datos
```sql
[ ] SELECT 
      p.id, 
      p.first_name, 
      p.last_name,
      u.email,
      p.professional_type,
      prp.room_id
    FROM professional p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN professional_room_preference prp 
      ON p.id = prp.professional_id
    LIMIT 5;
    
    └─ Debe mostrar: profesionales con sus usuarios vinculados
```

### 4.2 Probar Insertar Asignación (TEST)
```sql
[ ] -- Primero obtener IDs reales
    SELECT p.id as prof_id, r.id as room_id 
    FROM professional p, room r 
    WHERE p.institution_id = r.institution_id 
    LIMIT 1;
    
[ ] -- Usar esos IDs para insertar test
    INSERT INTO daily_professional_assignment (
      professional_id, 
      room_id, 
      scheduled_date, 
      institution_id
    ) VALUES (
      'prof-id-aqui',  -- reemplazar
      'room-id-aqui',  -- reemplazar
      '2025-11-05',
      'institution-id' -- reemplazar
    );
    
    └─ Debe insertar sin errores
```

### 4.3 Probar Leer Asignación
```sql
[ ] SELECT dpa.*, p.first_name, p.last_name, r.name
    FROM daily_professional_assignment dpa
    JOIN professional p ON dpa.professional_id = p.id
    JOIN room r ON dpa.room_id = r.id;
    
    └─ Debe mostrar: 1 asignación de test con datos completos
```

### 4.4 Limpiar Test
```sql
[ ] DELETE FROM daily_professional_assignment 
    WHERE scheduled_date = '2025-11-05';
    
    └─ Debe eliminar la asignación de test
```

### 4.5 Probar RLS (Opcional - si tienes usuarios)
```sql
[ ] Conectar como usuario administrativo
[ ] SELECT * FROM professional_room_preference;
    └─ Debe ver preferencias (RLS permite)

[ ] SELECT * FROM users;
    └─ Debe ver solo su propio usuario (RLS restringe)
```

---

## 🚀 Paso 5: Verificar Frontend

### 5.1 Revisar Hook
```
[ ] Abrir archivo: hooks/useProfessionalRoomAssignment.ts
[ ] Verificar que compila sin errores (TypeScript)
[ ] Verificar imports están correctos
```

### 5.2 Revisar Página
```
[ ] Abrir archivo: app/(dashboard)/asignacion-consultorios-dia/page.tsx
[ ] Verificar que compila sin errores
[ ] Verificar imports están correctos
```

### 5.3 Compilar Aplicación
```bash
[ ] npm run build
    └─ Debe compilar sin errores
    └─ Si hay errores, revisar TODAS las importaciones
```

### 5.4 Iniciar Desarrollo
```bash
[ ] npm run dev
    └─ Debe iniciar sin errores en http://localhost:3000
[ ] Navegar a http://localhost:3000/asignacion-consultorios-dia
    └─ Debe cargar la página
    └─ Si tienes institución, debe mostrar consultorios
```

---

## 📊 Paso 6: Documentación y Handoff

### 6.1 Documentos Generados
```
[ ] ✅ ARQUITECTURA_USUARIOS_PROFESIONALES.md
    └─ Modelo completo, flujos, casos de uso
    
[ ] ✅ IMPLEMENTACION_RESUMEN.md
    └─ Resumen ejecutivo
    
[ ] ✅ CHECKLIST_APLICAR_MIGRACIONES.md
    └─ Este archivo (para ejecutar)
    
[ ] ✅ Hook: useProfessionalRoomAssignment.ts
[ ] ✅ Página: asignacion-consultorios-dia/page.tsx
[ ] ✅ 6 Migraciones SQL
```

### 6.2 Próximos Pasos para Equipo
```
[ ] Revisar ARQUITECTURA_USUARIOS_PROFESIONALES.md
[ ] Actualizar página /profesionales
[ ] Actualizar página /super-admin/usuarios
[ ] Actualizar página /asignaciones
[ ] Conectar con pantalla pública
[ ] Testing completo
```

---

## ⚠️ Troubleshooting

### Error: "relation X does not exist"
```
CAUSA: Migraciones no ejecutadas en orden o fallaron
SOLUCIÓN:
  1. Verificar en Supabase Dashboard → SQL Editor → History
  2. Ver si hay errores en ejecuciones anteriores
  3. Re-ejecutar desde paso 2.1 en orden
```

### Error: "column X does not exist"
```
CAUSA: Migración 004 no ejecutó correctamente
SOLUCIÓN:
  1. Verificar que columnas existan: SELECT * FROM professional LIMIT 1;
  2. Si no están, re-ejecutar migración 004
  3. Si hay conflictos, contactar al equipo de BD
```

### Error: "duplicate key value violates unique constraint"
```
CAUSA: Datos duplicados en migración 006
SOLUCIÓN:
  1. Revisar profesionales sin email (usuario no se puede crear)
  2. Crear manualmente usuarios para esos profesionales
  3. Re-ejecutar migración 006
```

### Error: "permission denied for schema public"
```
CAUSA: Usuario de Supabase no tiene permisos
SOLUCIÓN:
  1. Usar usuario con rol 'postgres' o más alto
  2. Verificar permisos en Supabase Dashboard
  3. Contactar a administrador Supabase
```

---

## ✨ Checklist Final

```
ANTES DE CONSIDERAR COMPLETO:

[ ] ✅ Todas las migraciones ejecutadas SIN errores
[ ] ✅ Todas las tablas creadas
[ ] ✅ Columnas nuevas en professional
[ ] ✅ RLS habilitado en nuevas tablas
[ ] ✅ Índices creados
[ ] ✅ Datos migrados correctamente
[ ] ✅ Frontend compila sin errores
[ ] ✅ Página carga en navegador
[ ] ✅ Hook funciona (no lanza excepciones)
[ ] ✅ Documentación revisada y entendida

SI TODAS LAS CAJAS ESTÁN MARCADAS: ✅ COMPLETO
```

---

## 📞 Soporte

Si hay problemas:

1. **Revisar documentación:**
   - ARQUITECTURA_USUARIOS_PROFESIONALES.md
   - IMPLEMENTACION_RESUMEN.md

2. **Revisar archivo de migración:**
   - Leer comentarios SQL
   - Entender qué hace cada paso

3. **Contactar a equipo técnico:**
   - Compartir error exacto
   - Compartir resultado de verificaciones
   - Compartir paso donde falló

---

**Versión:** 1.0  
**Fecha:** 2025-11-05  
**Estado:** ✅ Listo para ejecutar
