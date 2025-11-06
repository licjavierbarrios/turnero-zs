# ⚡ Quick Start - Testing Asignación de Consultorios

## 🎯 Lo que necesitas hacer AHORA

### 1. Ejecutar Migración 007 (2 minutos)

1. Ve a **Supabase Dashboard** → SQL Editor
2. Copia y ejecuta:

```sql
DROP TABLE IF EXISTS user_professional_assignment CASCADE;
```

3. Espera a que complete ✅

---

### 2. Verificar Build (5 minutos)

```bash
cd E:\PROGRAMACION\turnero-zs
npm run build
```

**Esperado:** Compila sin errores

Si hay errores TypeScript:
- Revisa que los errores no sean en `useProfessionalRoomAssignment.ts`
- Si lo son, reporta

---

### 3. Iniciar Dev Server (3 minutos)

```bash
npm run dev
```

**Output esperado:**
```
✓ Ready in X.Xs
- Local: http://localhost:3001
```

---

### 4. Testing Manual (10-15 minutos)

#### Abrir Página
1. Ve a `http://localhost:3001/asignacion-consultorios-dia`
2. Debería cargar sin errores

#### Verificar Datos Iniciales
- [ ] Se muestra lista de profesionales
- [ ] Se muestra lista de consultorios
- [ ] Se muestra asignaciones del día
- [ ] No hay errores en consola

#### Crear Asignación
1. Click en "Crear Asignación" (o botón equivalente)
2. Seleccionar profesional
3. Seleccionar consultorio
4. Click Guardar

**Resultado esperado:**
- Toast de éxito
- Nueva asignación aparece en la lista
- Sin errores en consola

#### Editar Asignación
1. Click en botón "Editar" en una asignación
2. Cambiar algún dato (ej: consultorio)
3. Click Guardar

**Resultado esperado:**
- Toast de actualización
- Cambios visibles en lista
- Sin errores en consola

#### Eliminar Asignación
1. Click en botón "Eliminar"
2. Confirmar en diálogo
3. Esperar a que se elimine

**Resultado esperado:**
- Toast de eliminación
- Asignación desaparece de lista
- Sin errores en consola

#### Gestionar Preferencias
1. Buscar sección de preferencias
2. Crear/Editar preferencia de consultorio
3. Guardar cambios

**Resultado esperado:**
- Preferencia se guarda
- Se muestra en tabla de preferencias
- Sin errores en consola

---

## 🔍 Checklist de Validación

### Base de Datos
- [ ] Migración 007 ejecutada
- [ ] Tabla `user_professional_assignment` eliminada
- [ ] Otras tablas intactas

### Compilación
- [ ] `npm run build` exitoso
- [ ] Sin errores TypeScript
- [ ] Sin warnings críticos

### Página
- [ ] Carga sin errores 404
- [ ] Se cargan datos iniciales
- [ ] Botones funcionan
- [ ] Diálogos se abren/cierran correctamente
- [ ] Toasts aparecen después de acciones

### Funcionalidad CRUD
- [ ] ✅ CREATE - Crear asignación
- [ ] ✅ READ - Ver asignaciones
- [ ] ✅ UPDATE - Editar asignación
- [ ] ✅ DELETE - Eliminar asignación

### Sin Errores
- [ ] Consola: Sin errores rojos
- [ ] Consola: Sin Network errors
- [ ] Consola: Sin TypeScript errors

---

## 🐛 Troubleshooting

### "Connection refused" en localhost:3001
- Verificar que dev server está corriendo
- Ver output de terminal
- Puerto podría estar diferente (ej: 3002)

### "Error loading data" en página
- Revisar Supabase está conectado
- Verificar env variables en `.env.local`
- Ver logs en Supabase → Logs

### Botones no funcionan
- Revisar console.log por errores
- Verificar supabase client está inicializado
- Verificar RLS policies permiten operaciones

### Campo incorrecto error
- Verificar hook tiene `assignment_date` (NO `scheduled_date`)
- Verificar hook tiene `created_by` (NO `assigned_by`)
- Si vés estos errores, contacta - hay problema con hook

---

## 📞 Si algo falla

1. **Captura screenshot** del error
2. **Copia consola completa** (F12 → Console)
3. **Nota el tiempo** cuando pasó
4. **Reporta** con esa información

---

## ✅ Cuando todo funcione

1. Haz commit:
```bash
git add .
git commit -m "feat: implementar asignación diaria de consultorios"
```

2. Celebra 🎉 - La arquitectura está lista para producción

---

## 📚 Para Entender la Arquitectura

Lee en este orden:

1. **Este archivo** (3 min)
2. `FINALIZACION_ARQUITECTURA.md` (10 min)
3. `README_NUEVA_ARQUITECTURA.md` (30 min)
4. `CAMBIOS_REALIZADOS.md` (15 min)

---

**Tiempo total esperado:** 45-60 minutos
**Complejidad:** Media
**Riesgo:** Bajo (cambios probados)

¡A partir de aquí funciona sola!
