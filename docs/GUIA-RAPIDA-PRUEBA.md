# Guía de Carga del Sistema — Referencia del Administrador

Referencia personal para recordar el orden y los pasos de carga de datos en el sistema.
**No es guía de instalación ni técnica.**

---

## PARTE 1: Carga Inicial del CPS B° EVITA

Hacer en este orden. Cada paso depende del anterior.

### Checklist general

- [ ] 1. Crear la institución CPS B° EVITA
- [ ] 2. Crear los consultorios
- [ ] 3. Crear los servicios
- [ ] 4. Cargar los profesionales
- [ ] 5. Crear usuarios del sistema y asignar roles

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

### Paso 2 — Crear los consultorios

**Dónde:** Iniciar sesión como admin del CPS → `/consultorios`

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

### Paso 3 — Crear los servicios

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

### Paso 4 — Cargar los profesionales

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

### Paso 5 — Crear usuarios y asignar roles

Ver **PARTE 2** para el detalle de cada tipo de usuario.

**Orden sugerido:**
1. Primero crear los **admin** (necesitan acceso para configurar cosas)
2. Luego **administrativos** (quienes cargan pacientes día a día)
3. Luego **profesionales** con cuenta (los que van a usar el sistema)
4. Luego **servicio** (enfermería, laboratorio, etc.)
5. Por último **pantalla** (el usuario para la TV de sala de espera)

---

## PARTE 2: Cómo Cargar Cada Tipo de Usuario

### Roles disponibles

| Rol | Para quién | Qué puede hacer |
|-----|-----------|-----------------|
| `admin` | Coordinador/jefe de la institución | Todo: configurar, crear usuarios, ver reportes |
| `administrativo` | Recepcionista, ventanilla | Cargar pacientes, asignar consultorios, llamar turnos |
| `profesional` | Médicos, psicólogos, nutricionistas | Ver su propia cola, llamar sus pacientes |
| `servicio` | Enfermería, laboratorio, vacunación | Ver y gestionar su propia cola de servicio |
| `pantalla` | Nadie (es para la TV) | Solo ve la pantalla pública de llamados |

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

### Caso especial: Usuario PANTALLA

El usuario `pantalla` es el que se deja logueado en la TV de sala de espera.

1. Seguir los **Pasos A y B** con rol `pantalla`
2. En la TV, ingresar con esas credenciales
3. El sistema lleva automáticamente a la pantalla pública del CPS
4. Dejar el navegador abierto todo el día

> Credenciales sugeridas para la TV: `pantalla@cps-evita.com` / contraseña simple que no olvidés.

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
| Pantalla pública | `/pantalla/[slug]` | pantalla (TV) |
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
