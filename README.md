# Turnero ZS

Sistema multi-zona de gestión de turnos para centros de salud argentinos.

---

## 🎯 ¿Qué es?

Plataforma integral para que CAPS y hospitales gestionen:
- **Turnos**: Creación, asignación y seguimiento de citas
- **Profesionales**: Horarios, especialidades y disponibilidad
- **Pacientes**: Base de datos centralizada
- **Pantalla pública**: Display en tiempo real de la cola de espera
- **Reportes**: Métricas de ocupación, tiempo de espera y ausentismo

---

## 🚀 Inicio Rápido

```bash
# 1. Clonar proyecto
git clone <repo-url>
cd turnero-zs

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con credenciales Supabase

# 4. Ejecutar en desarrollo
npm run dev
```

Luego abre `http://localhost:3000`

---

## 📋 Funcionalidades Principales

### Dashboard
- **Dashboard Ejecutivo**: Resumen diario con métricas clave
- **Gestión de Turnos**: Control completo del flujo de atención
- **Asignación**: Buscar y asignar turnos disponibles
- **Reportes**: Análisis de ocupación, tiempos y ausentismo

### Administración
- **Zonas**: Organización territorial multi-zona
- **Instituciones**: Gestión de CAPS y hospitales
- **Profesionales**: Registro de especialidades y horarios
- **Pacientes**: Base de datos con validación de datos
- **Servicios**: Configuración de servicios médicos
- **Consultorios**: Gestión de espacios físicos
- **Usuarios**: Control de acceso por rol

### Público
- **Pantalla Pública**: Display en tiempo real de la cola
- **Sincronización**: Actualización instantánea vía Realtime

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Frontend | Next.js 15.5.2 + React 18 |
| Estilos | Tailwind CSS 4 + shadcn/ui |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth + JWT |
| Real-time | Supabase Realtime Channels |
| Lenguaje | TypeScript |

---

## 👥 Roles Disponibles

| Rol | Permisos |
|-----|---------|
| **Super Admin** | Acceso global, multi-zona |
| **Admin** | Administrador de institución |
| **Administrativo** | Gestión de turnos |
| **Profesional** | Ver su agenda |
| **Servicio** | Apoyo en atención |
| **Pantalla** | Operar display público |

---

## 📊 Tipos de Institución

- **CAPS**: Centros de Atención Primaria
- **Hospital Seccional**: Nivel medio
- **Hospital Distrital**: Nivel mayor
- **Hospital Regional**: Nivel máximo

---

## 🔧 Comandos Disponibles

```bash
npm run dev         # Desarrollo (localhost:3000)
npm run build       # Build producción
npm run start       # Servidor producción
npm run lint        # Linting
npm run typecheck   # Verificación TypeScript
```

---

## 📚 Documentación

- **[docs/GUIA-ADMINISTRADOR.md](docs/GUIA-ADMINISTRADOR.md)** - Manual para admins
- **[docs/GUIA-USUARIO.md](docs/GUIA-USUARIO.md)** - Guía operativa
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deploy en producción
- **[CLAUDE.md](CLAUDE.md)** - Instrucciones para Claude Code

---

## 🔐 Seguridad

- ✅ Row Level Security (RLS) multi-tenant
- ✅ Autenticación JWT
- ✅ Validación TypeScript strict
- ✅ Logging de eventos completo

---

## 📄 Licencia

Proyecto interno para sistema de salud argentino.
