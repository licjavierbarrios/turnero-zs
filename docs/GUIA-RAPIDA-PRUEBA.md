# Guía de Carga del Sistema — Referencia del Administrador

Referencia personal para recordar el orden y los pasos de carga de datos en el sistema.
**No es guía de instalación ni técnica.**

---

## PARTE 1: Carga Inicial del CPS B° EVITA

Hacer en este orden. Cada paso depende del anterior.

### Checklist general

- [ ] 1. Crear la institución CPS B° EVITA
- [ ] 2. Crear el usuario admin del CPS ← **necesario antes de continuar**
- [ ] 3. Crear los consultorios
- [ ] 4. Crear los servicios
- [ ] 5. Cargar los profesionales
- [ ] 6. Crear el resto de usuarios del sistema y asignar roles

---

### Paso 1 — Crear la institución

**Dónde:** `/super-admin/instituciones`

1. Click en **Nueva Institución**
2. Completar:
   - **Nombre**: CPS B° EVITA
   - **Tipo**: CAPS
   - **Zona**: Zona Sanitaria III
   - **Dirección**: (dirección real)
   - **Teléfono**: (teléfono real)
   - **Slug**: se genera automático (ej: `cps-bo-evita`) — se usa en la URL de la pantalla pública
3. Guardar

---

### Paso 2 — Crear el usuario admin del CPS

> ⚠️ Hacer esto antes de los pasos siguientes. Los pasos 3, 4 y 5 requieren estar logueado como admin del CPS.

**Dónde:** `/super-admin/usuarios`

1. Pestaña **Usuarios** → **Nuevo Usuario**
   - Nombre, apellido, email, contraseña
   - Guardar
   - Ej: admin@evita.com - pass: evita456
2. Pestaña **Membresías** → **Nueva Membresía**
   - Usuario: el que recién creaste
   - Institución: CPS B° EVITA
   - Rol: `admin` = 'Administrador'
   - Guardar
3. Cerrar sesión de super_admin e iniciar sesión con la cuenta admin recién creada

---

### Paso 3 — Crear los consultorios

**Dónde:** (logueado como admin del CPS) → `/consultorios`

Cargar uno por uno. Ejemplos:
- Consultorio 1
- Consultorio 2
- Consultorio 3
- Sala de Enfermería
- Sala de Vacunación
- Sala de Laboratorio
- (los que correspondan)

> 💡 Los consultorios se asignan diariamente a los profesionales. No hace falta asignarlos acá, solo crearlos.

---

### Paso 4 — Crear los servicios

**Dónde:** `/servicios`

Cargar todos los servicios que ofrece el CPS. Ejemplos:

| Servicio | Duración sugerida |
|----------|------------------|
| Enfermería | 15 min |
| Laboratorio | 15 min |
| Vacunación | 10 min |
| Odontología | 30 min |
| Nutrición | 30 min |
| Salud Mental | 45 min |
| (agregar los que correspondan) | |

> ⚠️ Los servicios son los que aparecen para elegir al cargar un turno. Cuantos más servicios, más opciones tendrán los administrativos.

---

### Paso 5 — Cargar los profesionales

**Dónde:** `/profesionales`

Cargar uno por uno. Por cada profesional completar:
- Nombre y Apellido
- Especialidad (ej: Médico Clínico, Psicólogo, Nutricionista)
- Matrícula
- Email y teléfono (opcional)

> 💡 Los profesionales en esta sección son el **registro clínico** (quién atiende). La cuenta de acceso al sistema se crea por separado en el Paso 5.
>
> Un profesional puede existir sin cuenta de acceso (si no va a usar el sistema directamente). Pero si necesita acceder para ver su agenda o llamar pacientes, también necesita usuario.

---

### Paso 6 — Crear el resto de usuarios y asignar roles

Ver **PARTE 2** para el detalle de cada tipo de usuario.

> El admin ya fue creado en el Paso 2. Acá se crean los demás.

**Orden sugerido:**
1. **Administrativos** (quienes cargan pacientes día a día)
2. **Profesionales** con cuenta (los que van a usar el sistema)
3. **Servicio** (enfermería, laboratorio, etc.)

---

## PARTE 2: Cómo Cargar Cada Tipo de Usuario

### Roles disponibles

| Rol | Para quién | Qué puede hacer |
|-----|-----------|-----------------|
| `admin` | Coordinador/jefe de la institución | Todo: configurar, crear usuarios, ver reportes |
| `administrativo` | Recepcionista, ventanilla | Cargar pacientes, asignar consultorios, llamar turnos |
| `profesional` | Médicos, psicólogos, nutricionistas | Ver su propia cola, llamar sus pacientes |
| `servicio` | Enfermería, laboratorio, vacunación | Ver y gestionar su propia cola de servicio |

> ⚠️ **`admin` ≠ `administrativo`** — Son roles distintos con nombres parecidos:
> - **admin** = jefe/coordinador que configura el sistema (pocas personas, quizás solo una)
> - **administrativo** = personal de recepción que opera el sistema día a día (pueden ser varios)

---

### Cómo crear cualquier usuario (pasos base)

**Dónde:** `/super-admin/usuarios`

**Paso A — Crear la cuenta:**
1. Ir a pestaña **Usuarios**
2. Click en **Nuevo Usuario**
3. Completar: nombre, apellido, email, contraseña
4. Guardar

**Paso B — Asignar membresía (rol):**
1. Ir a pestaña **Membresías**
2. Click en **Nueva Membresía**
3. Seleccionar:
   - **Usuario**: el que recién creaste
   - **Institución**: CPS B° EVITA
   - **Rol**: el que corresponda (ver tabla arriba)
4. Guardar

---

### Caso especial: Usuario con rol PROFESIONAL

Un profesional necesita dos cosas: cuenta de acceso + registro clínico vinculado.

1. Seguir los **Pasos A y B** con rol `profesional`
2. Ir a `/profesionales`
3. Verificar que el profesional ya existe (del Paso 4)
4. Editar el profesional y **vincular su usuario** (campo Usuario)

> Si el profesional no necesita acceder al sistema (no va a llamar sus propios turnos), solo hacer el Paso 4 sin crear cuenta.

---

### Caso especial: Usuario con rol SERVICIO

Para personal que gestiona un servicio específico (ej: enfermería):

1. Seguir los **Pasos A y B** con rol `servicio`
2. Ir a pestaña **Asignaciones de Servicios** en `/super-admin/usuarios`
3. Asignar al usuario el servicio que gestiona (ej: Enfermería)

> Esto define qué servicios ve ese usuario en la pantalla de turnos.

---

### Pantallas públicas para la TV (sin usuario)

Las TVs de sala de espera **no necesitan usuario ni login**. Cada pantalla tiene una URL única que se abre directo en el navegador.

**Crear una pantalla:**

1. Logueado como admin, ir a `/pantallas`
2. Click en **Nueva pantalla**
3. Poner un nombre descriptivo (ej: `Admisión`, `Laboratorio`, `Sala de espera general`)
4. Guardar
5. Click en el ícono de **copiar URL** — se copia algo como `https://sistema.com/pantalla/xxxxxxxx-xxxx-...`
6. Abrir esa URL en la TV y dejar el navegador abierto

**Configurar qué turnos muestra (opcional):**

1. En `/pantallas`, click en el ícono de configuración (⚙️) de la pantalla
2. Elegir el modo:
   - **Mostrar todo** — todos los turnos de la institución (por defecto)
   - **Todo excepto...** — todos menos los servicios/consultorios que destildés
   - **Solo seleccionados** — solo los servicios/consultorios que tildés
3. Guardar

> 💡 **Ejemplo:** Crear pantalla "Admisión" en modo *Todo excepto Laboratorio*, y pantalla "Laboratorio" en modo *Solo Laboratorio*. Cada TV muestra solo lo que le corresponde.

> 💡 La pantalla muestra su nombre en un badge en el encabezado, para identificarla de un vistazo.

> La URL original `/pantalla/[slug-institución]` sigue funcionando y muestra todo (útil como respaldo).

---

## PARTE 3: Referencia Rápida de Rutas

| Qué hacer | Dónde ir | Quién lo hace |
|-----------|----------|---------------|
| Crear institución | `/super-admin/instituciones` | super_admin |
| Crear zona sanitaria | `/super-admin/zonas` | super_admin |
| Crear/ver usuarios y roles | `/super-admin/usuarios` | super_admin |
| Crear consultorios | `/consultorios` | admin |
| Crear servicios | `/servicios` | admin |
| Cargar profesionales | `/profesionales` | admin |
| Asignar consultorio del día | `/asignaciones` | administrativo |
| Cargar pacientes / llamar turnos | `/turnos` | administrativo |
| Crear y configurar pantallas de TV | `/pantallas` | admin |
| Pantalla pública (URL única por pantalla) | `/pantalla/[uuid-pantalla]` | TV (sin login) |
| Pantalla pública (toda la institución) | `/pantalla/[slug-institución]` | TV (sin login) |
| Reportes | `/reportes` | admin / administrativo |

---

## PARTE 4: Recordatorio — Operación Diaria

Una vez cargado todo lo anterior, cada día el flujo es:

```
1. Administrativo entra al sistema
2. Va a /asignaciones → carga qué profesional atiende en qué consultorio y horario
3. Empiezan a llegar pacientes
4. Por cada paciente → /turnos → Agregar Paciente
   - Si es para un servicio (Laboratorio, Vacunación, Enfermería): seleccionar servicio
   - Si es para un profesional: cargar turno en Enfermería + turno con el profesional
5. Cuando está listo para ser llamado → Marcar Disponible
6. Cuando el servicio/profesional está listo → Llamar
7. La pantalla de la sala de espera se actualiza automáticamente
```

---

## PARTE 5: Cosas que Solo Hace el Super Admin (yo)

- Crear y editar zonas sanitarias
- Crear y editar instituciones
- Crear cuentas de usuario y asignar roles
- Ver métricas globales de todas las instituciones (`/super-admin/metricas`)

> Todo lo demás (profesionales, servicios, consultorios, turnos) lo gestiona el **admin de la institución** o el **administrativo**.
