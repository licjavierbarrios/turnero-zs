/**
 * Sistema de permisos basado en roles (RBAC)
 * Define qué roles tienen acceso a cada ruta del dashboard
 */

export type UserRole = 'admin' | 'administrativo' | 'medico' | 'enfermeria' | 'pantalla'

/**
 * Mapa de rutas y los roles que tienen acceso a ellas
 */
export const routePermissions: Record<string, UserRole[]> = {
  '/dashboard': ['admin', 'administrativo', 'medico', 'enfermeria'],
  '/turnos': ['admin', 'administrativo', 'medico', 'enfermeria'],
  '/agenda': ['admin', 'administrativo', 'medico'],
  '/asignaciones': ['admin', 'administrativo'],
  '/profesionales': ['admin'],
  '/servicios': ['admin'],
  '/consultorios': ['admin'],
  '/reportes': ['admin', 'administrativo'],
  '/configuracion': ['admin'],
}

/**
 * Verifica si un rol tiene permiso para acceder a una ruta
 */
export function hasPermission(userRole: UserRole, route: string): boolean {
  const allowedRoles = routePermissions[route]

  // Si la ruta no está en el mapa, denegar por defecto (seguridad)
  if (!allowedRoles) {
    return false
  }

  return allowedRoles.includes(userRole)
}

/**
 * Obtiene las rutas permitidas para un rol específico
 */
export function getAllowedRoutes(userRole: UserRole): string[] {
  return Object.entries(routePermissions)
    .filter(([_, roles]) => roles.includes(userRole))
    .map(([route]) => route)
}

/**
 * Verifica si un usuario tiene rol de administrador
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin'
}

/**
 * Verifica si un usuario puede gestionar turnos
 */
export function canManageAppointments(userRole: UserRole): boolean {
  return ['admin', 'administrativo'].includes(userRole)
}

/**
 * Verifica si un usuario puede ver reportes
 */
export function canViewReports(userRole: UserRole): boolean {
  return ['admin', 'administrativo'].includes(userRole)
}
