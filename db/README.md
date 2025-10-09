# Base de Datos - Turnero ZS

Estructura organizada de scripts SQL, migraciones y documentación para el sistema Turnero ZS.

## 📁 Estructura de Carpetas

```
db/
├── schema.sql                      # Schema principal del sistema
├── seed.sql                        # Datos iniciales y de prueba
├── policies.sql                    # Políticas RLS principales
├── policies-super-admin.sql        # Políticas RLS con super admin
├── slot-locks-schema.sql           # Schema para locks de turnos
│
├── migrations/                     # Migraciones de base de datos (ordenadas)
│   ├── 001_add_super_admin_role.sql
│   ├── 002_create_display_templates.sql
│   ├── 003_create_daily_queue.sql
│   ├── 004_create_user_service.sql
│   ├── 011_enable_realtime_daily_queue.sql
│   ├── 013_add_privacy_system.sql
│   └── 014_update_display_devices_rls.sql
│
├── scripts/                        # Scripts de utilidad
│   └── create_display_user.sql
│
├── setup/                          # Scripts de configuración inicial
│   ├── authentication-setup.sql
│   ├── crear-usuario-super-admin.sql
│   ├── demo-users-setup.sql
│   ├── establecer-password-super-admin.sql
│   └── SETUP-SUPER-ADMIN-COMPLETO.sql
│
├── maintenance/                    # Scripts de mantenimiento
│   ├── rebuild-database.sql
│   └── reset-database.sql
│
└── docs/                          # Documentación de base de datos
    ├── README-backup-extract.md
    ├── README-reset.md
    └── README-super-admin-setup.md
```

## 🚀 Orden de Ejecución (Setup Inicial)

### 1. Schema Base
```bash
# Ejecutar en SQL Editor de Supabase
db/schema.sql
db/policies.sql
db/policies-super-admin.sql
db/slot-locks-schema.sql
```

### 2. Migraciones (en orden numérico)
```bash
db/migrations/001_add_super_admin_role.sql
db/migrations/002_create_display_templates.sql
db/migrations/003_create_daily_queue.sql
db/migrations/004_create_user_service.sql
db/migrations/011_enable_realtime_daily_queue.sql
db/migrations/013_add_privacy_system.sql
db/migrations/014_update_display_devices_rls.sql
```

### 3. Setup Inicial (elegir uno)
```bash
# Opción A: Setup completo de super admin
db/setup/SETUP-SUPER-ADMIN-COMPLETO.sql

# Opción B: Setup paso a paso
db/setup/authentication-setup.sql
db/setup/crear-usuario-super-admin.sql

# Opción C: Usuarios demo para testing
db/setup/demo-users-setup.sql
```

### 4. Datos Iniciales (opcional)
```bash
db/seed.sql  # Datos de prueba
```

## 📚 Migraciones Aplicadas

| # | Archivo | Descripción | Estado |
|---|---------|-------------|--------|
| 001 | add_super_admin_role.sql | Agrega rol super_admin | ✅ |
| 002 | create_display_templates.sql | Sistema de plantillas para pantallas | ✅ |
| 003 | create_daily_queue.sql | Cola diaria de turnos | ✅ |
| 004 | create_user_service.sql | Asignación usuarios-servicios | ✅ |
| 011 | enable_realtime_daily_queue.sql | Realtime en daily_queue | ✅ |
| 013 | add_privacy_system.sql | Sistema de privacidad multinivel | ✅ |
| 014 | update_display_devices_rls.sql | Tabla display_devices + RLS | ✅ |

## 🔧 Scripts de Mantenimiento

### Reset Completo
```bash
# ⚠️ CUIDADO: Elimina todos los datos
db/maintenance/reset-database.sql
```

### Rebuild
```bash
# Reconstruye estructura desde cero
db/maintenance/rebuild-database.sql
```

## 📖 Documentación

- **[README-super-admin-setup.md](docs/README-super-admin-setup.md)** - Guía completa de setup del super admin
- **[README-reset.md](docs/README-reset.md)** - Instrucciones para reset de base de datos
- **[README-backup-extract.md](docs/README-backup-extract.md)** - Extracción de schema actual

## 🎯 Características Principales

### Sistema de Privacidad (Migración 013)
- 3 niveles: `public_full_name`, `public_initials`, `private_ticket_only`
- Jerarquía: appointment > service > institution
- Vista `daily_queue_display` con privacidad pre-resuelta
- Funciones SQL: `resolve_privacy_level()`, `get_display_name()`

### Display Devices (Migración 014)
- Tabla `display_devices` para gestión de pantallas
- Autenticación obligatoria con Supabase Auth
- RLS policies específicas
- Heartbeat automático con `last_seen_at`

### Multi-Tenant con RLS
- Row Level Security en todas las tablas
- Aislamiento por institución
- Roles: super_admin, admin, administrativo, medico, enfermeria, pantalla
- Funciones helper para verificación de permisos

### Realtime
- Canales por institución
- Actualización automática de cola de turnos
- Sincronización en tiempo real para pantallas públicas

## ⚠️ Notas Importantes

### Migraciones
- Los números de migración tienen gaps (001, 002, 003, 004, 011, 013, 014)
- Las migraciones 005-010 y 012 fueron removidas (debug/temporales)
- Mantener orden numérico al crear nuevas migraciones

### Super Admin
- Debe crearse ANTES de usar el sistema
- Seguir guía en `docs/README-super-admin-setup.md`
- Cambiar password inmediatamente después de crear

### RLS
- NUNCA desactivar RLS en producción
- Todas las tablas deben tener políticas
- Testing de políticas antes de deploy

## 🔗 Referencias

- **Documentación principal**: [../docs/database.md](../docs/database.md)
- **Guía de administrador**: [../docs/GUIA-ADMINISTRADOR.md](../docs/GUIA-ADMINISTRADOR.md)
- **Sistema de privacidad**: [../docs/SISTEMA-PRIVACIDAD.md](../docs/SISTEMA-PRIVACIDAD.md)

---

**Última actualización**: Enero 2025
**Versión de Schema**: 1.0
