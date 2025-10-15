'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldXIcon, ArrowLeftIcon, HomeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { routePermissions, type UserRole, getAllowedRoutes } from '@/lib/permissions'

const roleNames: Record<UserRole, string> = {
  admin: 'Administrador',
  administrativo: 'Administrativo',
  medico: 'Médico',
  enfermeria: 'Enfermería',
  pantalla: 'Pantalla Pública',
}

const routeNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/turnos': 'Gestión de Turnos',
  '/agenda': 'Agenda',
  '/asignaciones': 'Asignaciones de Profesionales',
  '/profesionales': 'Gestión de Profesionales',
  '/servicios': 'Gestión de Servicios',
  '/consultorios': 'Gestión de Consultorios',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración del Sistema',
}

export default function ForbiddenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [attemptedRoute, setAttemptedRoute] = useState<string | null>(null)
  const [allowedRoutes, setAllowedRoutes] = useState<string[]>([])

  useEffect(() => {
    // Obtener el rol del usuario y la ruta intentada
    try {
      const contextData = localStorage.getItem('institution_context')
      if (contextData) {
        const context = JSON.parse(contextData)
        setUserRole(context.user_role as UserRole)
        setAllowedRoutes(getAllowedRoutes(context.user_role as UserRole))
      }
    } catch (error) {
      console.error('Error obteniendo contexto:', error)
    }

    // Obtener la ruta intentada desde los parámetros de búsqueda
    const route = searchParams.get('route')
    if (route) {
      setAttemptedRoute(route)
    }
  }, [searchParams])

  const getRequiredRoles = (): string => {
    if (!attemptedRoute) return 'No disponible'
    const roles = routePermissions[attemptedRoute]
    if (!roles) return 'No definido'
    return roles.map(role => roleNames[role]).join(', ')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldXIcon className="w-12 h-12 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Acceso Denegado
          </CardTitle>
          <CardDescription className="text-lg">
            No tienes permisos para acceder a esta página
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información del usuario */}
          <Alert>
            <AlertDescription className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Tu rol actual:</span>
                <span className="text-lg font-bold text-blue-600">
                  {userRole ? roleNames[userRole] : 'Desconocido'}
                </span>
              </div>

              {attemptedRoute && (
                <>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold text-gray-700">Página solicitada:</span>
                    <span className="text-gray-900 font-medium">
                      {routeNames[attemptedRoute] || attemptedRoute}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold text-gray-700">Roles requeridos:</span>
                    <span className="text-gray-900 font-medium">
                      {getRequiredRoles()}
                    </span>
                  </div>
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Páginas permitidas */}
          {allowedRoutes.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">
                Páginas a las que puedes acceder:
              </h3>
              <ul className="space-y-2">
                {allowedRoutes.map(route => (
                  <li key={route}>
                    <Button
                      variant="link"
                      className="text-green-700 hover:text-green-900 p-0 h-auto font-normal"
                      onClick={() => router.push(route)}
                    >
                      → {routeNames[route] || route}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mensaje de ayuda */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              ¿Necesitas acceso a más funciones?
            </h3>
            <p className="text-blue-800 text-sm">
              Si crees que deberías tener acceso a esta página, contacta al administrador del sistema
              para solicitar los permisos necesarios.
            </p>
          </div>

          {/* Botones de navegación */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Volver Atrás
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push('/dashboard')}
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Ir al Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
