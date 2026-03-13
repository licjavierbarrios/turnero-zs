# Guía del Usuario - Turnero ZS

Guía práctica para personal administrativo, profesionales y personal de servicios del CPS B° EVITA - Zona Sanitaria III.

---

## Para Quién es Esta Guía

| Rol | Tareas principales |
|-----|-------------------|
| **Administrativo** | Asignar consultorios, cargar pacientes en la cola, llamar turnos |
| **Profesional / Servicio** | Ver y gestionar la cola de su servicio o consultorio |
| **Admin** | Configuración general del sistema |

---

## Inicio de Sesión

1. Abrir el navegador e ir a la URL del sistema
2. Ingresar email y contraseña proporcionados por el administrador
3. El sistema redirige automáticamente según tu rol

> Si el sistema muestra "sin permisos", contactar al administrador para verificar tu rol.

---

## Conceptos Clave

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
- Ejemplo: Juan Pérez solicita turno con la Dra. Morales → se le carga turno en **Enfermería** + turno con **Dra. Morales**

### Estados de un turno

```
PENDIENTE  →  DISPONIBLE  →  LLAMADO  →  ATENDIDO
                                 ↓
                              CANCELADO
```

| Estado | Color | Significado | ¿Aparece en pantalla? |
|--------|-------|-------------|----------------------|
| **Pendiente** | Gris | Cargado, pero aún no visible para llamar | No |
| **Disponible** | Azul | Listo para ser llamado | Sí |
| **Llamado** | Violeta (pulsa) | Paciente siendo llamado activamente | Sí (animado) |
| **Atendido** | Verde | Ya fue atendido | No |
| **Cancelado** | Rojo | Turno cancelado | No |

---

## Inicio del Día — Administrativo

Antes de recibir pacientes, los administrativos deben completar este paso obligatorio:

### Asignar profesionales a consultorios

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

> Si un profesional atiende en dos turnos (mañana y tarde en distintos consultorios), se carga como dos asignaciones separadas. Los administrativos de tarde cargan las asignaciones de tarde.

---

## Cargar un Paciente en la Cola

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

> Ambos turnos se pueden cargar al mismo tiempo. El médico verificará en el HSI si el paciente pasó por Enfermería.

> ⚠️ Si el profesional **no aparece en la lista**, es porque no tiene consultorio asignado. Ir primero a `/asignaciones`.

---

## Llamar un Turno

### Paso 1 — Cambiar estado a Disponible

Cuando el paciente llegó a la sala de espera y está listo para ser llamado:

1. Buscar el turno en la lista (estará en **Pendiente**)
2. Click en **Marcar Disponible**
3. El turno aparece ahora en la pantalla pública de sala de espera

### Paso 2 — Llamar al Paciente

Cuando el servicio o profesional está listo para atender:

1. Buscar el turno en estado **Disponible**
2. Click en **Llamar**
3. La pantalla pública anuncia al paciente con sonido y voz:
   - Para servicios: *"Pedro Páez a Vacunación"*
   - Para profesionales: *"Juan Pérez a Consultorio 1"*

### Botones disponibles cuando un turno está en "Llamado"

Una vez llamado un paciente, aparecen tres botones:

| Botón | Cuándo usarlo |
|-------|--------------|
| **Llamar de nuevo** | El paciente no escuchó o no se presentó — re-anuncia por la pantalla (con sonido y voz). Puede usarse las veces que sea necesario. |
| **Siguiente** | El paciente no está en la sala de espera — lo devuelve al final de la cola (vuelve a "Disponible"). Útil si salió un momento y hay que esperar. |
| **Atendido** | El paciente fue efectivamente atendido. El turno desaparece de la pantalla. |

### Cuándo marcar "Atendido" manualmente

El sistema **marca automáticamente como atendido** al paciente anterior cuando se llama al siguiente del **mismo servicio o profesional**. En la práctica:

- Si llamaste a Elba Olima (Enfermería) y luego llamás a Anakin Skywalker (Enfermería) → Elba queda marcada como atendida automáticamente.
- Si llamaste a Juan Pérez (Dra. Morales) y luego llamás a Ana García (Dra. Morales) → Juan queda marcado como atendido automáticamente.

**Tenés que marcar "Atendido" manualmente cuando:**
- Fue el último paciente del servicio o profesional en el día
- Querés cerrar el turno antes de llamar al siguiente (por ejemplo, si hay una pausa larga entre pacientes)
- El paciente de un servicio distinto quedó en "Llamado" y no tiene siguiente en su misma cola

### Cancelar un Turno

Si el paciente no se presenta o cancela:

1. Buscar el turno
2. Click en **Cancelar**

---

## Pantalla Pública (TV de Sala de Espera)

### Configurar (hacer una vez por dispositivo)

La pantalla pública **no requiere usuario ni contraseña**. Hay dos formas de abrirla:

**Método recomendado — por PIN:**

1. En el TV o PC de sala de espera, abrir el navegador y entrar a:
   `https://turnero-zs.vercel.app/tv/[slug-institución]`
   Ej: `https://turnero-zs.vercel.app/tv/cps-b-evita`
2. Tipear el **PIN de 4 dígitos** de la pantalla correspondiente (lo tiene el administrador)
3. El sistema redirige automáticamente a la pantalla configurada
4. Guardar esa URL como página de inicio del navegador del TV

**Alternativa — URL directa:**

El administrador puede copiar la URL directa de cada pantalla desde `/pantallas`. Esa URL abre la pantalla sin necesidad de PIN.

> Dejar el navegador abierto todo el día — **no cerrar ni recargar**. La pantalla se actualiza automáticamente en tiempo real.

### Qué muestra

- Turnos en estado **Llamado**: nombre del paciente, destino (servicio o consultorio + profesional), con animación pulsante y anuncio por voz
- Turnos en estado **Disponible**: cola de espera visible
- Hora actual y nombre de la institución

### Controles de audio en la pantalla

En la esquina superior derecha de la pantalla hay un ícono de volumen (🔊):
- **Activado**: suena el ding dong y se anuncia el nombre del paciente por voz
- **Desactivado** (🔇): silencia completamente el audio (ni ding dong ni voz)

Si hay múltiples llamados seguidos, el sistema los anuncia en orden, uno por uno, sin superponerse.

### Cambiar la vista

Click en el ícono de plantilla (esquina superior derecha) para seleccionar:
- **Vista Lista**: todos los servicios en lista vertical
- **Vista Completa**: grilla 2x2
- **Grilla Grande**: grilla 3x2 (pantallas grandes)
- **Carrusel**: rotación automática entre servicios

---

## Ejemplo de Jornada Completa

### 7:00 hs — Inicio turno mañana

```
1. Administrativo ingresa al sistema
2. Va a /asignaciones y carga:
   - Dr. García     → Consultorio 1 → 08:00 a 12:00
   - Dra. Morales   → Consultorio 3 → 09:00 a 11:00
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
   Pantalla anuncia: "Marcos Juárez a Laboratorio"

Marcos atendido → el siguiente en Laboratorio lo marca automáticamente,
   o se presiona "Atendido" si es el último del día.

Enfermería llama a Juan Pérez → pasa por Enfermería
   → Cambiar turno con Dr. García a Disponible
   → Cuando Dr. García está listo → Llamar a Juan Pérez
   Pantalla anuncia: "Juan Pérez a Consultorio 1"

Dr. García llama a Ana García (siguiente paciente)
   → Juan Pérez queda marcado como Atendido automáticamente
```

---

## Situaciones Comunes

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

### La pantalla no anuncia por voz

1. Verificar que el audio esté activado (ícono 🔊 en esquina superior derecha)
2. Si el ícono está en 🔇, hacer click para activar
3. Si es la primera vez que se abre la pantalla, puede aparecer un botón "Activar Audio" — hacer click una sola vez

### Me aparece "sin permisos" o no veo opciones

Contactar al administrador — es posible que tu usuario no tenga el rol correcto asignado.

---

## Buenas Prácticas

### Administrativos

✅ Llegar con tiempo para cargar las asignaciones de consultorios antes de que lleguen los pacientes

✅ Pedir siempre el DNI del paciente al cargarlo

✅ Marcar "Atendido" manualmente al último paciente del día de cada servicio o profesional — el auto-complete solo funciona si hay un siguiente

✅ Si el profesional tiene dos turnos en el día, recordar que las asignaciones de tarde las carga el administrativo de tarde

❌ No cargar turnos para un profesional sin antes asignarle consultorio

❌ No usar "Llamar de nuevo" indefinidamente — si el paciente no aparece luego de 2-3 llamados, usar "Siguiente" o "Cancelar"

### Todos

✅ Cerrar sesión al terminar el turno

✅ Reportar cualquier problema al administrador

✅ No compartir credenciales de acceso

---

## ¿Necesitás Ayuda?

1. Consultar esta guía
2. Consultar al administrador de tu institución
3. Contactar soporte técnico
