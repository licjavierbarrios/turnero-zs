# Guía del Usuario - Turnero ZS

Guía práctica para personal administrativo, profesionales y personal de servicios del CPS B° EVITA - Zona Sanitaria III.

---

## 👥 Para Quién es Esta Guía

| Rol | Tareas principales |
|-----|-------------------|
| **Administrativo** | Asignar consultorios, cargar pacientes en la cola, llamar turnos |
| **Profesional / Servicio** | Ver y gestionar la cola de su servicio o consultorio |
| **Pantalla** | Operar la pantalla pública de llamados |
| **Admin** | Configuración general del sistema |

---

## 🔐 Inicio de Sesión

1. Abrir el navegador e ir a la URL del sistema
2. Ingresar email y contraseña proporcionados por el administrador
3. El sistema redirige automáticamente según tu rol

> Si el sistema muestra "sin permisos", contactar al administrador para verificar tu rol.

---

## 📋 Conceptos Clave

### Dos tipos de turno

El sistema maneja dos tipos de turno, con flujos diferentes:

**Turno de Servicio**
- Para servicios que no requieren profesional asignado: Enfermería, Laboratorio, Vacunación, etc.
- No necesita consultorio — el paciente va directamente al sector del servicio
- Ejemplos:
  - Pedro Páez quiere vacunarse → turno al servicio **Vacunación**
  - Marcos Juárez necesita análisis → turno al servicio **Laboratorio**
  - Julia Cobos necesita tomarse la presión → turno al servicio **Enfermería**

**Turno de Profesional**
- Para pacientes que requieren atención de un médico, psicólogo, nutricionista, etc.
- Requiere que el profesional tenga **consultorio asignado** para ese día
- Por normativa del Ministerio de Salud Pública, todo paciente que pide turno con un profesional **también debe tener turno en Enfermería** (para registro en el HSI)
- Ejemplo: Juan Pérez solicita turno con el Dr. García → se le carga turno en **Enfermería** + turno con **Dr. García**

### Estados de un turno

```
PENDIENTE  →  DISPONIBLE  →  LLAMADO  →  ATENDIDO
                                  ↓
                               CANCELADO
```

| Estado | Color | Significado | ¿Aparece en pantalla? |
|--------|-------|-------------|----------------------|
| **Pendiente** | Gris | Cargado, pero aún no visible para llamar | No |
| **Disponible** | Verde | Listo para ser llamado | Sí |
| **Llamado** | Violeta (pulsa) | Paciente siendo llamado activamente | Sí (animado) |
| **Atendido** | Azul | Ya fue atendido | No |
| **Cancelado** | Rojo | Turno cancelado | No |

---

## 🌅 Inicio del Día — Administrativo

Antes de recibir pacientes, los administrativos deben completar este paso obligatorio:

### Paso 1: Asignar profesionales a consultorios

> ⚠️ Sin este paso, **no se pueden cargar turnos para profesionales**.

1. Ir a **Asignaciones** (`/asignaciones`)
2. Por cada profesional que atiende hoy, completar:
   - **Profesional**: seleccionar de la lista
   - **Consultorio**: seleccionar el consultorio asignado
   - **Horario**: indicar hora de inicio y fin (ej: 09:00 a 11:00)
3. Click en **Asignar**

**Ejemplo de carga matutina:**
```
Dra. Morales   → Consultorio 3   → 09:00 a 11:00
Dr. García     → Consultorio 1   → 08:00 a 12:00
Lic. Romero    → Consultorio 2   → 09:00 a 13:00
```

> 💡 Si un profesional atiende en dos turnos (mañana y tarde en distintos consultorios), se carga como dos asignaciones separadas. Los administrativos de tarde cargan las asignaciones de tarde.

---

## 👤 Cargar un Paciente en la Cola

Una vez realizadas las asignaciones, se pueden cargar pacientes.

### Turno de Servicio (Laboratorio, Vacunación, Enfermería, etc.)

1. Ir a **Turnos** (`/turnos`)
2. Click en **+ Agregar Paciente**
3. Completar:
   - **Nombre completo** del paciente
   - **DNI** (opcional pero recomendado)
   - **Tipo**: seleccionar **Servicio**
   - **Servicio**: Laboratorio / Vacunación / Enfermería / etc.
4. Elegir estado inicial:
   - **Pendiente**: si el paciente aún no llegó o está esperando su turno
   - **Disponible**: si el paciente ya está listo para ser llamado
5. Click en **Guardar**

### Turno de Profesional

1. Ir a **Turnos** (`/turnos`)
2. Primero, cargar el turno de **Enfermería**:
   - Click en **+ Agregar Paciente**
   - Tipo: **Servicio** → Servicio: **Enfermería**
   - Estado según corresponda
   - Guardar
3. Luego, cargar el turno del **profesional**:
   - Click en **+ Agregar Paciente**
   - Tipo: **Profesional**
   - Seleccionar el profesional (solo aparecen los que tienen consultorio asignado hoy)
   - Estado según corresponda
   - Guardar

> 💡 Ambos turnos se pueden cargar al mismo tiempo. El médico verificará en el HSI si el paciente pasó por Enfermería.

> ⚠️ Si el profesional **no aparece en la lista**, es porque no tiene consultorio asignado. Ir primero a `/asignaciones`.

---

## 📞 Llamar un Turno

### Cambiar estado a Disponible

Cuando el paciente está en la sala de espera y listo para ser llamado:

1. Buscar el turno en la lista
2. Click en **Marcar Disponible**
3. El turno aparece en la pantalla pública

### Llamar al Paciente

Cuando el servicio o profesional está listo para atender:

1. Buscar el turno en estado **Disponible**
2. Click en **Llamar**
3. El turno aparece en la pantalla pública con animación y sonido
4. La pantalla muestra:
   - Para servicios: `Paciente: Pedro Páez → Vacunación`
   - Para profesionales: `Paciente: Juan Pérez → Dr. García - Consultorio 1`

### Marcar como Atendido

Cuando el paciente fue atendido:

1. Buscar el turno en estado **Llamado**
2. Click en **Atendido**
3. El turno desaparece de la pantalla pública

### Cancelar un Turno

Si el paciente no se presenta o cancela:

1. Buscar el turno
2. Click en **Cancelar**

---

## 🖥️ Pantalla Pública

### Configurar (hacer una sola vez por dispositivo)

1. En la TV o PC de sala de espera, abrir el navegador
2. Ir a `/pantalla/[nombre-institucion]`
3. Dejar el navegador abierto todo el día — **no cerrar ni recargar**
4. La pantalla se actualiza automáticamente en tiempo real

### Qué muestra

- Turnos en estado **Llamado**: nombre del paciente, destino (servicio o profesional + consultorio), con animación pulsante
- Turnos en estado **Disponible**: cola de espera visible
- Hora actual
- Nombre de la institución

### Cambiar la vista

La pantalla tiene diferentes modos de visualización. Click en **Cambiar Vista** (esquina superior derecha) para seleccionar:
- **Vista Lista**: todos los servicios en lista vertical
- **Vista Completa**: grilla 2x2
- **Grilla Grande**: grilla 3x2 (pantallas grandes)
- **Carrusel**: rotación automática entre servicios

---

## 🔄 Ejemplo de Jornada Completa

### 7:00 hs — Inicio turno mañana

```
1. Administrativo ingresa al sistema
2. Va a /asignaciones
3. Carga:
   - Dr. García → Consultorio 1 → 08:00 a 12:00
   - Dra. Morales → Consultorio 3 → 09:00 a 11:00
```

### 7:30 hs — Llegan primeros pacientes

```
Paciente: Marcos Juárez — quiere análisis de laboratorio
→ Cargar: Servicio / Laboratorio / Estado: Disponible

Paciente: Pedro Páez — quiere vacunarse
→ Cargar: Servicio / Vacunación / Estado: Disponible

Paciente: Juan Pérez — quiere turno con Dr. García
→ Cargar turno 1: Servicio / Enfermería / Estado: Disponible
→ Cargar turno 2: Profesional / Dr. García / Estado: Pendiente
   (queda pendiente hasta que pase por Enfermería)
```

### Durante el día

```
Laboratorio listo → Llamar a Marcos Juárez
   Pantalla: "Paciente: Marcos Juárez → Laboratorio"

Marcos atendido → Marcar Atendido

Juan pasa por Enfermería → Marcar su turno de Enfermería Atendido
→ Cambiar su turno con Dr. García a Disponible
→ Dr. García listo → Llamar a Juan Pérez
   Pantalla: "Paciente: Juan Pérez → Dr. García - Consultorio 1"
```

---

## ⚠️ Situaciones Comunes

### El profesional no aparece al cargar un turno

**Causa**: No tiene consultorio asignado hoy.
**Solución**: Ir a `/asignaciones` y cargar la asignación del día.

### Un paciente llega y quiere turno para profesional de la tarde

Si son las 9hs y el profesional atiende a las 16hs, el administrativo de tarde debe cargarlo.
Decirle al paciente que vuelva en el horario del turno tarde para que lo registren.

### El profesional se ausenta

1. Ir a `/turnos`
2. Filtrar por ese profesional
3. Marcar todos sus turnos como **Cancelado**
4. Si corresponde, ir a `/asignaciones` y eliminar su asignación del día
5. Avisar a los pacientes

### La pantalla no se actualiza

1. Verificar conexión a internet
2. Recargar la página (F5)
3. Si persiste, avisar al administrador

### Me aparece "sin permisos" o no veo opciones

Contactar al administrador — es posible que tu usuario no tenga el rol correcto asignado.

---

## 💡 Buenas Prácticas

### Administrativos

✅ Llegar con tiempo para cargar las asignaciones de consultorios antes de que lleguen los pacientes
✅ Pedir siempre el DNI del paciente al cargarlo
✅ Marcar los turnos como **Atendido** apenas se completan — mantiene la cola limpia
✅ Si el profesional tiene dos turnos en el día, recordar que los turno tarde los carga el administrativo de tarde

❌ No cargar turnos para un profesional sin antes asignarle consultorio
❌ No dejar turnos en estado **Llamado** sin resolverlos (atendido o cancelado)

### Todos

✅ Cerrar sesión al terminar el turno
✅ Reportar cualquier problema al administrador
✅ No compartir credenciales de acceso

---

## 📞 ¿Necesitás Ayuda?

1. Consultar esta guía
2. Consultar al administrador de tu institución
3. Contactar soporte técnico
