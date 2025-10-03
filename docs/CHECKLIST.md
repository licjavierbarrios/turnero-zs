# Checklist de Pre-Deployment - Turnero ZS

Lista de verificación completa antes de poner el sistema en producción.

## ✅ Configuración de Base de Datos

### Scripts SQL Ejecutados

- [ ] `db/schema.sql` - Schema base ejecutado
- [ ] `db/policies.sql` - RLS policies aplicadas
- [ ] `db/SETUP-SUPER-ADMIN-COMPLETO.sql` - Setup super admin completado
- [ ] `db/update-rls-functions-super-admin.sql` - Funciones RLS actualizadas

### Verificaciones de BD

- [ ] Todas las tablas creadas correctamente
- [ ] RLS habilitado en todas las tablas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Funciones RLS existen en schema `public`:
  - [ ] `is_super_admin()`
  - [ ] `is_admin()`
  - [ ] `user_institutions()`
  - [ ] `has_role_in_institution()`
- [ ] Índices creados correctamente
- [ ] Triggers de `updated_at` funcionando

**Comando de verificación:**
```sql
-- Verificar funciones
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_name IN ('is_super_admin', 'is_admin', 'user_institutions', 'has_role_in_institution')
ORDER BY routine_schema, routine_name;

-- Verificar RLS habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

## ✅ Autenticación y Seguridad

### Supabase Auth

- [ ] Email provider habilitado en Supabase Auth
- [ ] URL de confirmación configurada
- [ ] Redirect URLs autorizadas configuradas
- [ ] Rate limiting configurado

### Usuario Super Admin

- [ ] Usuario super admin creado en Supabase Auth
- [ ] Membership de super admin creada en tabla `membership`
- [ ] Password fuerte establecido
- [ ] Login de super admin verificado

**Test de login:**
1. Ir a la URL del sistema
2. Login con super_admin
3. Verificar acceso a `/super-admin`
4. Verificar que puede ver todas las zonas/instituciones

### Seguridad de Variables de Entorno

- [ ] `.env.local` está en `.gitignore`
- [ ] No hay credenciales en el código fuente
- [ ] Variables de entorno configuradas en Vercel/hosting
- [ ] `NEXT_PUBLIC_SUPABASE_URL` correcta
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` correcta

## ✅ Datos Iniciales

### Zona y Institución Sistema

- [ ] Zona "Sistema" (UUID: 00000000-0000-0000-0000-000000000000) creada
- [ ] Institución "Sistema" (UUID: 00000000-0000-0000-0000-000000000001) creada

### Datos de Producción

- [ ] Al menos 1 zona real creada
- [ ] Al menos 1 institución real creada
- [ ] Al menos 1 admin por institución creado
- [ ] Relación zona → institución correcta

## ✅ Funcionalidades Principales

### Gestión de Usuarios y Membresías

- [ ] Crear usuario funciona
- [ ] Asignar membresía funciona
- [ ] Login con diferentes roles funciona
- [ ] RLS filtra correctamente por institución

### Gestión de Profesionales

- [ ] Crear profesional funciona
- [ ] Editar profesional funciona
- [ ] Activar/desactivar profesional funciona
- [ ] Solo se ven profesionales de la institución del usuario

### Gestión de Pacientes

- [ ] Crear paciente funciona
- [ ] Buscar paciente por DNI funciona
- [ ] Validación de DNI funciona
- [ ] Cálculo de edad funciona

### Consultorios y Servicios

- [ ] Crear consultorio funciona
- [ ] Crear servicio funciona
- [ ] Duración de servicio se calcula correctamente

### Plantillas de Horarios

- [ ] Crear plantilla funciona
- [ ] Cálculo de turnos es correcto
- [ ] Se pueden crear para diferentes días de la semana
- [ ] Filtrado por profesional funciona

### Asignación de Turnos

- [ ] Generación de slots funciona (`/turnos-disponibles`)
- [ ] Búsqueda de pacientes funciona
- [ ] Asignar turno crea el appointment
- [ ] Slots ocupados se marcan correctamente
- [ ] No se pueden asignar dos turnos al mismo horario

### Flujo de Atención

- [ ] Transiciones de estado funcionan
- [ ] `pendiente → esperando` funciona
- [ ] `esperando → llamado` funciona y crea `call_event`
- [ ] `llamado → en_consulta` funciona
- [ ] `en_consulta → finalizado` funciona
- [ ] Cancelar y marcar ausente funciona

### Pantalla Pública

- [ ] `/pantalla` muestra lista de instituciones
- [ ] `/pantalla/[slug]` funciona
- [ ] Realtime updates funcionan
- [ ] Se muestran los turnos llamados
- [ ] Diseño responsive funciona

### Reportes y Métricas

- [ ] Dashboard muestra estadísticas reales
- [ ] `/reportes` funciona correctamente
- [ ] Filtros por período funcionan
- [ ] Cálculo de tiempos de espera correcto
- [ ] Cálculo de tasa de ocupación correcto
- [ ] Exportación a CSV funciona
- [ ] Gráficos se renderizan correctamente

## ✅ Performance

### Frontend

- [ ] Build de Next.js exitoso (`npm run build`)
- [ ] No hay errores de TypeScript
- [ ] No hay warnings críticos
- [ ] Lighthouse Performance > 80
- [ ] Lighthouse Accessibility > 90

### Backend (Supabase)

- [ ] Queries optimizadas (sin N+1)
- [ ] Índices en columnas frecuentemente consultadas
- [ ] RLS policies eficientes
- [ ] Connection pooling configurado

### Realtime

- [ ] Canales Supabase funcionan
- [ ] Pantalla pública recibe updates en < 1 segundo
- [ ] No hay memory leaks en subscripciones

## ✅ Testing

### Funcional

- [ ] Flujo completo de un turno (asignar → atender → finalizar)
- [ ] Múltiples usuarios simultáneos
- [ ] Diferentes roles y permisos
- [ ] Casos límite (ej. turno en el pasado)

### Integración

- [ ] Auth de Supabase integrado
- [ ] Realtime integrado
- [ ] Navegación entre páginas
- [ ] Estados persistentes

### Carga

- [ ] Sistema soporta 10+ usuarios concurrentes
- [ ] Asignación de 50+ turnos sin problemas
- [ ] Reportes con 1000+ appointments

## ✅ UX/UI

### Diseño

- [ ] Responsive en mobile (320px+)
- [ ] Responsive en tablet (768px+)
- [ ] Responsive en desktop (1024px+)
- [ ] Dark mode funciona (si está implementado)

### Usabilidad

- [ ] Textos en español
- [ ] Fechas en formato DD/MM/YYYY
- [ ] Mensajes de error claros
- [ ] Loading states visibles
- [ ] Toast notifications funcionan

### Accesibilidad

- [ ] Navegación por teclado funciona
- [ ] Labels en formularios
- [ ] Contraste de colores adecuado
- [ ] Textos alternativos en iconos

## ✅ Documentación

### Documentos Creados

- [ ] `README.md` actualizado
- [ ] `DEPLOYMENT.md` completo
- [ ] `GUIA-ADMINISTRADOR.md` completo
- [ ] `GUIA-USUARIO.md` completo
- [ ] `CHECKLIST.md` (este archivo)

### Código

- [ ] Comentarios en funciones complejas
- [ ] Tipos TypeScript definidos
- [ ] No hay `any` sin justificación

## ✅ Deployment

### Vercel (o similar)

- [ ] Proyecto conectado a GitHub
- [ ] Variables de entorno configuradas
- [ ] Build automático funciona
- [ ] Preview deploys funcionan
- [ ] Dominio personalizado configurado (si aplica)

### Supabase

- [ ] Proyecto de producción separado de desarrollo
- [ ] Backups automáticos configurados
- [ ] Alertas configuradas
- [ ] API keys renovadas (si necesario)

### DNS (si aplica)

- [ ] Dominio apuntando correctamente
- [ ] SSL/HTTPS habilitado
- [ ] Certificado válido

## ✅ Monitoreo

### Logs

- [ ] Logs de errores configurados
- [ ] Logs de Supabase revisados
- [ ] Logs de Vercel revisados

### Métricas

- [ ] Analytics configurado (opcional)
- [ ] Error tracking configurado (Sentry, opcional)
- [ ] Uptime monitoring (opcional)

## ✅ Capacitación

### Administradores

- [ ] Capacitación completada
- [ ] Documentación entregada
- [ ] Credenciales entregadas
- [ ] Q&A session realizada

### Personal

- [ ] Demo del sistema
- [ ] Guía de usuario entregada
- [ ] Período de prueba completado

## ✅ Plan de Contingencia

### Backup

- [ ] Backup manual de BD realizado
- [ ] Backup automático configurado
- [ ] Procedimiento de restauración documentado
- [ ] Backup de `.env.local` en lugar seguro

### Rollback

- [ ] Plan de rollback documentado
- [ ] Versión anterior disponible
- [ ] Contacto de soporte definido

## ✅ Go-Live

### Antes

- [ ] Todas las casillas anteriores marcadas
- [ ] Stakeholders notificados
- [ ] Horario de deployment definido
- [ ] Equipo de soporte disponible

### Durante

- [ ] Deployment ejecutado
- [ ] Verificación post-deployment exitosa
- [ ] Smoke tests pasados

### Después

- [ ] Usuarios notificados
- [ ] Sistema monitoreado primeras 24 horas
- [ ] Feedback inicial recolectado

## 📊 Criterios de Éxito

El sistema está listo para producción cuando:

- ✅ Todas las casillas están marcadas
- ✅ Super admin puede gestionar zonas e instituciones
- ✅ Admins pueden gestionar su institución completa
- ✅ Personal puede asignar y gestionar turnos
- ✅ Pantalla pública funciona en tiempo real
- ✅ Reportes muestran datos correctos
- ✅ No hay errores críticos en logs
- ✅ Performance es aceptable (< 3s carga inicial)

## 🚨 Blockers Críticos

**NO deployar si:**

- ❌ RLS policies no están habilitadas
- ❌ Super admin no puede hacer login
- ❌ Variables de entorno no están configuradas
- ❌ Hay errores en el build de Next.js
- ❌ Pantalla pública no funciona
- ❌ Asignación de turnos no funciona

## ✅ Firma de Aprobación

- [ ] **Desarrollador**: ________________ Fecha: ________
- [ ] **QA/Tester**: ________________ Fecha: ________
- [ ] **Administrador del Sistema**: ________________ Fecha: ________
- [ ] **Stakeholder**: ________________ Fecha: ________

---

**Versión del Sistema**: Sprint 5 - Hardening Completado
**Fecha de Checklist**: _______________
**Próxima Revisión**: _______________
