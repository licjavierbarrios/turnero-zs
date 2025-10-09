# Guía del Administrador - Turnero ZS

Guía completa para administradores del sistema Turnero ZS.

## 👤 Roles de Usuario

### Super Admin
- Acceso global a todas las zonas e instituciones
- Gestión de zonas e instituciones
- Creación de usuarios administradores

### Admin
- Gestión completa de una institución específica
- Creación de usuarios (administrativo, médico, enfermería, pantalla)
- Configuración de servicios, consultorios y horarios
- Acceso a reportes y métricas

## 🚀 Primeros Pasos

### 1. Login Inicial

1. Acceder a la URL del sistema
2. Ingresar con credenciales de super_admin o admin
3. El sistema redirige al dashboard

### 2. Configuración Inicial (Super Admin)

#### Crear Zonas

1. Ir a `/super-admin` o `/zonas`
2. Click en "Nueva Zona"
3. Completar:
   - **Nombre**: Ej. "Zona Sanitaria Norte"
   - **Descripción**: Ej. "Zona Norte de la Provincia"
4. Guardar

#### Crear Instituciones

1. Ir a `/super-admin` o `/instituciones`
2. Click en "Nueva Institución"
3. Completar:
   - **Nombre**: Ej. "CAPS San Martín"
   - **Tipo**: CAPS, Hospital Seccional, Hospital Distrital, Hospital Regional
   - **Zona**: Seleccionar la zona correspondiente
   - **Dirección**: Dirección completa
   - **Slug**: Se genera automáticamente (ej. "caps-san-martin")
4. Guardar

### 3. Configuración de Institución (Admin)

#### Crear Profesionales

1. Ir a `/profesionales`
2. Click en "Nuevo Profesional"
3. Completar:
   - **Nombre** y **Apellido**
   - **Especialidad**: Ej. "Medicina General", "Pediatría"
   - **Matrícula**: Número de matrícula profesional
   - **Institución**: Se selecciona automáticamente
   - **Estado**: Activo/Inactivo
4. Guardar

#### Crear Pacientes

1. Ir a `/pacientes`
2. Click en "Nuevo Paciente"
3. Completar:
   - **Nombre** y **Apellido**
   - **DNI**: Documento Nacional de Identidad
   - **Fecha de Nacimiento**
   - **Teléfono** (opcional)
   - **Email** (opcional)
4. Guardar

#### Configurar Consultorios

1. Ir a `/consultorios`
2. Click en "Nuevo Consultorio"
3. Completar:
   - **Nombre**: Ej. "Consultorio 1", "Sala de Pediatría"
   - **Institución**: Se selecciona automáticamente
   - **Estado**: Activo/Inactivo
4. Guardar

#### Configurar Servicios

1. Ir a `/servicios`
2. Click en "Nuevo Servicio"
3. Completar:
   - **Nombre**: Ej. "Medicina General", "Cardiología"
   - **Duración**: Tiempo estimado en minutos (ej. 15, 20, 30)
   - **Institución**: Se selecciona automáticamente
   - **Estado**: Activo/Inactivo
4. Guardar

#### Configurar Plantillas de Horarios

1. Ir a `/horarios`
2. Click en "Nueva Plantilla"
3. Completar:
   - **Profesional**: Seleccionar médico/enfermera
   - **Servicio**: Tipo de atención
   - **Consultorio**: Lugar de atención
   - **Día de la semana**: Lunes a Domingo
   - **Hora de inicio**: Ej. 08:00
   - **Hora de fin**: Ej. 12:00
   - **Duración de turno**: Se calcula automáticamente según el servicio
4. Ver **Turnos calculados**: El sistema muestra cuántos turnos se generarán
5. Guardar

**Ejemplo:**
- Profesional: Dr. Juan Pérez
- Servicio: Medicina General (15 min)
- Consultorio: Consultorio 1
- Día: Lunes
- Horario: 08:00 - 12:00
- **Resultado**: 16 turnos (240 min / 15 min = 16 turnos)

## 📅 Gestión de Turnos

### Asignar Turnos

1. Ir a `/turnos-disponibles`
2. Seleccionar institución (si es super_admin)
3. Seleccionar fecha en el calendario
4. Ver slots disponibles (verde = disponible, rojo = ocupado)
5. Click en "Asignar Turno" en un slot disponible
6. Seleccionar paciente:
   - Buscar por nombre o DNI
   - Seleccionar de la lista
7. Agregar notas (opcional)
8. Click en "Asignar Turno"

### Gestionar Flujo de Atención

1. Ir a `/turnos`
2. Ver lista de turnos del día
3. Usar los botones para cambiar estados:
   - **Marcar Esperando**: Paciente llegó al centro de salud
   - **Llamar Paciente**: Llamar al paciente (aparece en pantalla pública)
   - **Iniciar Consulta**: Paciente pasa a consulta
   - **Finalizar**: Consulta completada
   - **Cancelar**: Turno cancelado por el paciente
   - **Ausente**: Paciente no se presentó

**Flujo de Estados:**
```
Pendiente → Esperando → Llamado → En Consulta → Finalizado
                ↓           ↓
            Cancelado   Ausente
```

## 🖥️ Sistema de Pantallas Públicas

### Configuración Inicial de Pantalla (Desde Enero 2025)

Las pantallas públicas ahora requieren autenticación y están asociadas a usuarios específicos.

#### 1. Crear Usuario de Pantalla

1. Ir a `/super-admin/usuarios`
2. Click en "Nuevo Usuario"
3. Completar:
   - **Email**: Usar formato `pantalla@[nombre-institucion].com` (ej: `pantalla@evita.com`)
   - **Nombre**: Ej. "Pantalla Principal"
   - **Apellido**: Nombre de la institución
   - **Password**: Contraseña segura (se usará para login)
   - **Activo**: Marcado
4. Guardar

**IMPORTANTE**: Verificar que el email sea válido con dominio completo (.com, .gov.ar, etc.)

#### 2. Asignar Rol "Pantalla"

1. En la pestaña **Membresías** del usuario creado
2. Click en "Agregar Membresía"
3. Seleccionar:
   - **Institución**: La institución donde estará la pantalla
   - **Rol**: `pantalla`
4. Guardar

#### 3. Crear Dispositivo de Pantalla

1. En la pestaña **Servicios** del usuario
2. O ir a `/admin/pantallas` (si existe)
3. Click en "Crear Display Device"
4. Completar:
   - **Nombre**: Ej. "Pantalla Principal - CAPS Evita"
   - **Institución**: Seleccionar automáticamente
   - **Tipo**: General (para todas las colas) o Específico de Servicio
   - **Activo**: Marcado
5. Guardar

#### 4. Login en la Pantalla

1. Abrir el sistema en la TV/Monitor dedicado
2. El sistema redirige automáticamente a `/` (login)
3. Ingresar credenciales del usuario de pantalla
4. El sistema detecta que es una pantalla y redirige automáticamente a `/pantalla/[slug]`

### Gestión de Pantallas

#### URL Pública Amigable

La URL de la pantalla ahora usa el **slug de la institución**:
- Formato: `/pantalla/[slug]`
- Ejemplo: `/pantalla/caps-evita`
- El slug se configura en la configuración de la institución

#### Editar Slug de Institución

1. Ir a `/admin/configuracion`
2. En la pestaña **Institución**
3. Editar el campo **Slug**
4. Formato: solo minúsculas, números y guiones (ej: `caps-evita`)
5. Debe ser único en todo el sistema
6. Guardar

#### Logout de Pantalla

Las pantallas ahora tienen un botón de **Logout** (rojo, esquina superior derecha):
- Click en el ícono de logout
- Se cierra la sesión y redirige a la página de login
- Útil para mantenimiento o cambio de configuración

#### Monitoreo de Pantallas

El sistema registra automáticamente:
- **last_seen_at**: Última vez que la pantalla estuvo activa (heartbeat)
- **is_active**: Estado de la pantalla
- Los administradores pueden ver el estado de conectividad

### Qué Muestra la Pantalla

- **Turnos llamados**: Pacientes siendo llamados ahora (estado "llamado")
- **Cola de espera**: Pacientes esperando (estado "esperando")
- **Información del turno**:
  - Nombre del paciente (respetando nivel de privacidad)
  - Número de turno
  - Servicio
  - Consultorio
- **Actualización en tiempo real**: Vía Supabase Realtime
- **Síntesis de voz (TTS)**: Anuncio automático cuando se llama un paciente

### Sistema de Privacidad en Pantallas

Las pantallas respetan el **nivel de privacidad** configurado:

| Nivel | Qué Muestra | Ejemplo |
|-------|-------------|---------|
| **public_full_name** | Nombre completo | "Juan Pérez" |
| **public_initials** | Iniciales | "J.P." |
| **private_ticket_only** | Solo número de turno | "Turno 001" |

La privacidad se configura en 3 niveles jerárquicos:
1. **Turno** (appointment) - Prioridad máxima
2. **Servicio** (service)
3. **Institución** (institution) - Valor por defecto

Para configurar privacidad:
1. Ir a `/admin/configuracion`
2. Seleccionar nivel de privacidad institucional
3. O configurar por servicio en `/servicios`
4. O por turno individual en `/turnos` (badge interactivo)

## 👥 Gestión de Usuarios

### Crear Usuarios

1. Ir a `/usuarios`
2. Click en "Nuevo Usuario"
3. Completar:
   - **Email**: Email del usuario
   - **Nombre**: Nombre completo
   - **Password**: Contraseña temporal
4. Guardar

### Asignar Membresías (Roles)

1. En la lista de usuarios, click en "Agregar Membresía"
2. Seleccionar:
   - **Institución**: Dónde trabajará el usuario
   - **Rol**: admin, administrativo, medico, enfermeria, pantalla
3. Guardar

**Roles y Permisos:**

| Rol | Permisos |
|-----|----------|
| **super_admin** | Acceso global, gestión de zonas e instituciones |
| **admin** | Gestión completa de su institución |
| **administrativo** | Asignar turnos, gestionar pacientes, ver reportes |
| **medico** | Gestionar sus propios turnos y pacientes |
| **enfermeria** | Gestionar turnos de enfermería |
| **pantalla** | Solo acceso a pantalla pública |

## 📊 Reportes y Métricas

### Acceder a Reportes

1. Ir a `/reportes`
2. Seleccionar:
   - **Institución** (si es super_admin)
   - **Período**: Hoy, Ayer, Esta semana, Este mes, Personalizado

### Pestañas Disponibles

#### Resumen
- Total de turnos
- Tasa de ocupación
- Tiempo de espera promedio
- Tiempo de consulta promedio
- Gráfico de distribución de estados

#### Profesionales
- Métricas por profesional
- Turnos totales y completados
- Tiempos promedio de espera y consulta
- Especialidades

#### Servicios
- Métricas por servicio
- Turnos totales y completados
- Comparación tiempo real vs configurado

#### Tendencias
- Gráficos de evolución temporal
- Tendencia de turnos diarios
- Tendencia de tiempos de espera

### Exportar Datos

En cada pestaña, click en "Exportar CSV" para descargar los datos en formato Excel.

## 🎯 Objetivos del Sistema

El sistema está diseñado para alcanzar:

- ↓ **25-40% tiempo de espera** en 3 meses
- ↓ **10-20% ausentismo**
- ≥ **85% ocupación de agendas**
- ≥ **95% registro completo de eventos**

### Monitorear Objetivos

1. Ir a `/reportes`
2. En "Resumen", revisar:
   - **Tasa de Ocupación**: Debe ser ≥ 85%
   - **Tiempo de Espera Promedio**: Monitorear reducción mes a mes
   - **Ausencias**: Porcentaje respecto al total

## ⚙️ Mejores Prácticas

### Configuración Inicial
1. Crear zonas → instituciones → profesionales → servicios → consultorios → horarios
2. Testear generación de turnos en `/turnos-disponibles`
3. Crear pacientes de prueba
4. Asignar turnos de prueba
5. Probar flujo completo de atención

### Operación Diaria
1. Revisar dashboard al inicio del día
2. Verificar turnos del día en `/turnos`
3. Gestionar flujo de atención según llegada de pacientes
4. Al final del día, revisar métricas

### Mantenimiento Semanal
1. Revisar reportes semanales
2. Ajustar plantillas de horarios según demanda
3. Gestionar profesionales (altas/bajas)
4. Backup de datos importantes

### Revisión Mensual
1. Análisis de tendencias mensuales
2. Reunión con profesionales para feedback
3. Ajustes en configuración de servicios
4. Revisión de objetivos alcanzados

## 🆘 Problemas Comunes

### No puedo asignar turnos

**Problema**: No aparecen slots disponibles

**Solución**:
1. Verificar que existan plantillas de horarios creadas
2. Verificar que los profesionales estén activos
3. Verificar que los servicios y consultorios estén activos
4. Ir a `/turnos-disponibles` y click en "Regenerar Turnos"

### La pantalla pública no se actualiza

**Problema**: No se ven los llamados en tiempo real

**Solución**:
1. Verificar conexión a internet
2. Recargar la página
3. Verificar que el slug de la URL sea correcto
4. Contactar con el administrador del sistema

### No puedo crear usuarios

**Problema**: Error al crear usuarios

**Solución**:
1. Verificar que el email no esté duplicado
2. Verificar que todos los campos requeridos estén completos
3. Verificar que tengas permisos de admin

## 📞 Soporte Técnico

Para problemas técnicos:
1. Revisar esta guía
2. Consultar `/dashboard` para estado del sistema
3. Contactar al administrador del sistema
4. Reportar el problema con detalles específicos

## 📚 Recursos Adicionales

- **Documentación técnica**: Ver `DEPLOYMENT.md`
- **Guía de usuario**: Ver `GUIA-USUARIO.md`
- **Arquitectura del sistema**: Ver `README.md`
