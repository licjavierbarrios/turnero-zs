# Reemplazo de confirm() con AlertDialog - Progreso

## Archivos completados:
1. ✅ components/UserServicesTab.tsx
2. ✅ app/super-admin/zonas/page.tsx

## Archivos pendientes (trabajando en batch para eficiencia):
3. ⏳ app/super-admin/usuarios/page.tsx (2 confirm - uno para User, otro para Membership)
4. app/super-admin/instituciones/page.tsx
5. app/(dashboard)/usuarios/page.tsx (2 confirm - uno para User, otro para Membership)
6. app/(dashboard)/servicios/page.tsx
7. app/(dashboard)/pacientes/page.tsx
8. app/(dashboard)/horarios/page.tsx
9. app/(dashboard)/consultorios/page.tsx

## Patrón usado:
- Estados: isDeleteDialogOpen, deletingItem
- Función: openDeleteDialog(item), handleDelete() async sin params
- AlertDialog con título, descripción personalizada, botones Cancelar/Eliminar
