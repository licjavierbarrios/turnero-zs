# ⚡ Acciones Inmediatas Requeridas

**Status:** 🟢 Código completado y validado
**Tiempo estimado:** 1 hora total
**Dificultad:** Bajo

---

## 1️⃣ EJECUTAR MIGRACIÓN 007 (2-3 minutos)

### Paso 1: Abre Supabase Dashboard

1. Ve a [supabase.com](https://supabase.com)
2. Abre tu proyecto
3. Click en **SQL Editor**

### Paso 2: Ejecuta la Migración

Copia y pega en el editor SQL:

```sql
DROP TABLE IF EXISTS user_professional_assignment CASCADE;
```

Luego click **RUN**

**Esperado:** ✅ "Success" message

**Por qué:** Tabla vacía que duplica funcionalidad

---

## 2️⃣ VERIFICAR BUILD (2-3 minutos)

Abre terminal en la carpeta del proyecto:

```bash
cd E:\PROGRAMACION\turnero-zs
npm run build
```

**Esperado:**
```
✓ Built successfully
```

**Si falla:** Reporta el error completo

---

## 3️⃣ INICIAR DEV SERVER (1 minuto)

En la misma terminal:

```bash
npm run dev
```

**Esperado:**
```
✓ Ready in X.Xs
- Local: http://localhost:3001
```

**Nota:** Si usa puerto 3000, mostrará 3001

---

## 4️⃣ TESTING MANUAL (15-20 minutos)

### Abre la Página

Ve a: **http://localhost:3001/asignacion-consultorios-dia**

Si no funciona:
- Intenta http://localhost:3000/...
- Revisa output de terminal para puerto actual

### ✅ Checklist de Validación

#### Carga Inicial
- [ ] Página carga sin errores 404
- [ ] No hay errores rojos en Console (F12)
- [ ] Se ve título "Asignación de Consultorios"
- [ ] Se muestra institución actual

#### Datos Cargados
- [ ] Lista de profesionales no vacía
- [ ] Lista de consultorios no vacía
- [ ] Se muestra fecha actual seleccionada
- [ ] Sin "Loading..." infinito

#### Crear Asignación
1. Click botón "Crear Asignación" (o similar)
2. Selecciona un profesional
3. Selecciona un consultorio
4. Click "Guardar"

**Resultado esperado:**
- [ ] Toast (notificación) de éxito
- [ ] Nueva asignación aparece en la lista
- [ ] Sin errores en Console

#### Editar Asignación
1. En una asignación, click "Editar" (ícono de lápiz)
2. Cambia algo (ej: otro consultorio)
3. Click "Guardar"

**Resultado esperado:**
- [ ] Toast de actualización
- [ ] Cambios visibles inmediatamente
- [ ] Sin errores en Console

#### Eliminar Asignación
1. Click "Eliminar" (ícono de tacho)
2. Confirma en diálogo
3. Espera a que desaparezca

**Resultado esperado:**
- [ ] Toast de eliminación
- [ ] Asignación desaparece de la lista
- [ ] Sin errores en Console

#### Preferencias (Si existe)
1. Busca sección de "Preferencias" o "Consultorios Preferentes"
2. Selecciona profesional
3. Selecciona consultorio preferente
4. Marca "Es Preferencia"
5. Click "Guardar"

**Resultado esperado:**
- [ ] Preferencia se muestra en tabla
- [ ] Puede editar/eliminar
- [ ] Sin errores en Console

### 🐛 Si algo falla

**Opción A: Error de Compilación**
```
Error: Property 'X' does not exist
```
→ Código aún tiene errores TypeScript (raro, pasó las pruebas)

**Opción B: Error en Page Load**
```
404 Not Found
```
→ Ruta incorrecta o página no existe

**Opción C: Error en Operations (CRUD)**
```
Error fetching data
```
→ Problema con Supabase/RLS/BD

**Opción D: Datos no aparecen**
```
Listas vacías
```
→ Verificar datos en BD, revisar RLS policies

---

## 5️⃣ VERIFICAR PERSISTENCIA (5 minutos)

### Test de Persistencia

1. Crea una asignación
2. **Recarga la página** (F5)
3. La asignación debe seguir ahí

**Si desaparece:** Problema con Supabase INSERT/SELECT

---

## ✅ Cuando Todo Funcione

Si completaste todos los puntos anteriores y todo funciona:

### Haz Commit (Opcional pero Recomendado)

```bash
git add .
git commit -m "feat: implementar asignación dinámica de consultorios diarios"
```

### Próximos Pasos

1. Integrar con pantalla pública (futura)
2. Agregar reportes (futura)
3. Notificaciones a profesionales (futura)

---

## 📊 Timeline Estimado

| Paso | Tiempo | Status |
|------|--------|--------|
| 1. Migración 007 | 3 min | ⏳ USER |
| 2. Build verify | 3 min | ⏳ USER |
| 3. Dev server | 1 min | ⏳ USER |
| 4. Testing manual | 20 min | ⏳ USER |
| 5. Persistencia | 5 min | ⏳ USER |
| **TOTAL** | **~32 min** | ⏳ USER |

---

## 🆘 Contacto/Ayuda

Si algo no funciona:

1. **Revisa Console** (F12 → Console tab)
   - Busca mensajes de error rojos
   - Cópia el error completo

2. **Revisa Supabase Logs**
   - Dashboard → Logs
   - Busca errores de RLS o queries

3. **Verifica Configuración**
   - `.env.local` tiene token Supabase correcto
   - Base de datos tiene datos de prueba

4. **Reporta con:**
   - Screenshot del error
   - Console error message completo
   - URL donde pasó
   - Pasos para reproducir

---

## 🎯 Éxito Cuando...

✅ Página carga sin errores
✅ Puedo crear asignaciones
✅ Puedo editar asignaciones
✅ Puedo eliminar asignaciones
✅ Los datos persisten al recargar
✅ Cambios se ven inmediatamente

---

**¡Vamos! Esto debería funcionar en menos de 1 hora** ⏱️
