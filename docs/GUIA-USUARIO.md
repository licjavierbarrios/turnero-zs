# Guía del Usuario - Turnero ZS

Guía práctica para personal administrativo, médico y de enfermería.

## 🎯 Para Quién es Esta Guía

- **Personal Administrativo**: Gestión de turnos y atención al paciente
- **Médicos y Enfermeros**: Gestión de sus propias agendas
- **Personal de Pantalla**: Operación de pantallas públicas

## 🔐 Inicio de Sesión

### Primera vez

1. Recibir credenciales del administrador:
   - Email de usuario
   - Contraseña temporal
2. Acceder a la URL del sistema
3. Ingresar email y contraseña
4. **Recomendado**: Cambiar contraseña en el primer acceso

### Acceso Regular

1. Ir a la URL del sistema
2. Ingresar email y contraseña
3. El sistema muestra el dashboard de tu institución

## 🏠 Dashboard

Al ingresar verás:

- **Turnos de Hoy**: Cantidad total programados
- **Turnos Pendientes**: Aún no atendidos
- **Profesionales Activos**: En tu institución
- **Servicios Disponibles**: Tipos de atención
- **Turnos Recientes**: Últimas actividades
- **Acciones Rápidas**: Botones para funciones principales

## 📅 Gestión de Turnos (Personal Administrativo)

### Asignar un Turno Nuevo

1. Click en "Gestionar Turnos" o ir a `/turnos-disponibles`
2. Seleccionar la fecha deseada
3. Ver los horarios disponibles:
   - **Verde**: Horario disponible
   - **Rojo**: Horario ocupado
4. Click en "Asignar Turno" en un slot verde
5. En el diálogo:
   - **Buscar paciente**: Por nombre o DNI
   - **Seleccionar paciente** de la lista
   - **Agregar notas** (opcional): Ej. "Primera consulta", "Control"
6. Click en "Asignar Turno"
7. ✅ Confirmación: "Turno asignado correctamente"

**Ejemplo Práctico:**
```
Paciente: María González (DNI 12.345.678)
Profesional: Dr. Juan Pérez
Servicio: Medicina General
Fecha: Lunes 15/01/2025
Hora: 09:00
Consultorio: Consultorio 1
```

### Buscar Pacientes

**Si el paciente ya existe:**
1. En "Asignar Turno", escribir nombre o DNI en el buscador
2. Seleccionar de la lista
3. Continuar con la asignación

**Si el paciente NO existe:**
1. Primero ir a `/pacientes`
2. Click en "Nuevo Paciente"
3. Completar datos:
   - Nombre y Apellido
   - DNI
   - Fecha de Nacimiento
   - Teléfono (opcional)
4. Guardar
5. Volver a asignar turno

## 🔄 Flujo de Atención

### Estados del Turno

```
1. PENDIENTE     → El turno fue asignado, paciente aún no llegó
2. ESPERANDO     → Paciente llegó y está en sala de espera
3. LLAMADO       → Paciente está siendo llamado (aparece en pantalla)
4. EN CONSULTA   → Paciente está siendo atendido
5. FINALIZADO    → Consulta completada
6. CANCELADO     → Turno cancelado por el paciente
7. AUSENTE       → Paciente no se presentó
```

### Gestión del Día (Paso a Paso)

#### Inicio del Día

1. Ir a `/turnos`
2. Ver lista de turnos del día ordenados por hora
3. Verificar que todos los turnos estén en estado "Pendiente"

#### Cuando Llega un Paciente

1. Buscar el turno del paciente
2. Click en "Marcar Esperando"
3. El turno cambia a estado **ESPERANDO** (azul)

#### Cuando el Profesional Está Listo

1. Buscar el siguiente turno en estado "Esperando"
2. Click en "Llamar Paciente"
3. El turno cambia a estado **LLAMADO** (púrpura)
4. **La pantalla pública muestra el llamado automáticamente**

#### Durante la Consulta

1. El profesional hace click en "Iniciar Consulta"
2. El turno cambia a estado **EN CONSULTA** (verde)

#### Al Finalizar la Consulta

1. El profesional hace click en "Finalizar"
2. El turno cambia a estado **FINALIZADO** (gris)

#### Si el Paciente No Viene

- Si cancela antes: Click en "Cancelar"
- Si no se presenta: Click en "Ausente"

### Ejemplo de Jornada

```
08:00 - Paciente Juan Pérez llega → ESPERANDO
08:05 - Dr. López listo → LLAMAR PACIENTE → LLAMADO
08:07 - Paciente entra → INICIAR CONSULTA → EN CONSULTA
08:22 - Consulta finaliza → FINALIZAR → FINALIZADO

08:30 - Paciente María González llega → ESPERANDO
08:35 - Dr. López listo → LLAMAR PACIENTE → LLAMADO
08:37 - Paciente entra → INICIAR CONSULTA → EN CONSULTA
...
```

## 🖥️ Pantalla Pública

### Configurar la Pantalla

**Solo hacer una vez:**

1. En una PC/TV dedicada, abrir navegador
2. Ir a `/pantalla`
3. Seleccionar la institución
4. El navegador mostrará la pantalla completa
5. **No cerrar el navegador** - dejar funcionando todo el día

### Qué Muestra la Pantalla

La pantalla se actualiza automáticamente y muestra:

- **Turnos siendo llamados**: Nombre, consultorio
- **Cola de espera**: Próximos turnos
- **Hora actual**
- **Información de la institución**

**Importante**: No se necesita recargar manualmente, se actualiza sola.

## 👨‍⚕️ Para Médicos y Enfermeros

### Ver Mi Agenda

1. Ir a `/horarios` o `/turnos`
2. Ver tus turnos asignados
3. Gestionar el estado según el flujo de atención

### Gestionar Mis Turnos

**Durante la consulta:**
1. Ver lista de mis turnos del día
2. Cuando estoy listo para el siguiente paciente:
   - Click en "Llamar Paciente"
3. Cuando el paciente entra:
   - Click en "Iniciar Consulta"
4. Al terminar:
   - Click en "Finalizar"

### Consultar Historial de Paciente

1. Ver nombre del paciente en el turno
2. Consultar información adicional en las notas del turno

## 📊 Ver Estadísticas (Todos los Roles)

### Dashboard Principal

- Ver resumen del día
- Turnos totales y pendientes
- Actividad reciente

### Reportes (Admin y Administrativo)

1. Ir a `/reportes`
2. Seleccionar período (hoy, semana, mes)
3. Ver métricas:
   - Ocupación de agendas
   - Tiempos de espera
   - Ausentismo
   - Rendimiento por profesional

## ⚠️ Situaciones Comunes

### ¿Qué hago si un paciente llega tarde?

1. Si es menos de 15 minutos: Marcar como "Esperando" normalmente
2. Si es más de 15 minutos:
   - Consultar con el profesional
   - Si acepta: Marcar "Esperando" (pasará después de los turnos puntuales)
   - Si no acepta: Marcar "Cancelado" y reasignar para otro día

### ¿Qué hago si el profesional se ausenta?

1. Ir a `/turnos`
2. Seleccionar todos los turnos de ese profesional
3. Marcar como "Cancelado"
4. Contactar a los pacientes para reasignar

### ¿Qué hago si un paciente quiere cambiar su turno?

1. Buscar el turno actual → Marcar "Cancelado"
2. Asignar nuevo turno en `/turnos-disponibles`
3. Confirmar con el paciente

### ¿Qué hago si se cae el sistema?

1. Mantener la calma
2. Registrar turnos en papel temporalmente
3. Avisar al administrador
4. Cuando vuelva, actualizar los estados en el sistema

## 💡 Consejos y Buenas Prácticas

### Para Personal Administrativo

✅ **Hacer:**
- Llegar 15 min antes para revisar turnos del día
- Marcar "Esperando" apenas llega el paciente
- Actualizar estados en tiempo real
- Agregar notas importantes en los turnos

❌ **No hacer:**
- No dejar turnos sin actualizar
- No asignar múltiples turnos al mismo horario
- No cerrar la sesión durante el horario de atención

### Para Médicos y Enfermeros

✅ **Hacer:**
- Revisar agenda al inicio del día
- Actualizar estados apenas cambian
- Usar las notas para recordatorios

❌ **No hacer:**
- No saltear el flujo de estados
- No dejar turnos en "Llamado" sin atender

### Para Todos

✅ **Hacer:**
- Cerrar sesión al terminar el turno
- Reportar problemas al administrador
- Mantener información de pacientes confidencial

❌ **No hacer:**
- No compartir contraseñas
- No dejar la sesión abierta sin supervisión

## 🆘 Problemas Frecuentes

### No puedo ver turnos

**Solución**: Verificar que estés en la pantalla correcta (`/turnos` o `/turnos-disponibles`)

### No aparecen pacientes al buscar

**Solución**:
1. Verificar ortografía
2. Buscar por DNI
3. Si no existe, crear el paciente primero

### La pantalla pública no funciona

**Solución**:
1. Recargar la página (F5)
2. Verificar conexión a internet
3. Avisar al administrador

### Me aparece "sin permisos"

**Solución**: Contactar al administrador para verificar tu rol

## 📞 ¿Necesitas Ayuda?

1. **Primera opción**: Consultar esta guía
2. **Segunda opción**: Consultar al administrador de tu institución
3. **Tercera opción**: Contactar soporte técnico

## 🎓 Capacitación

### Temas Básicos (2 horas)
- Login y dashboard
- Asignar turnos
- Gestionar flujo de atención

### Temas Avanzados (2 horas)
- Reportes y métricas
- Gestión de excepciones
- Mejores prácticas

**Recomendación**: Practicar con datos de prueba antes de usar en producción.
