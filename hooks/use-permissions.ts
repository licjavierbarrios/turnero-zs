'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { hasPermission, type UserRole } from '@/lib/permissions'

/**
 * Hook para verificar permisos de acceso a rutas
 * Redirige automáticamente al dashboard si el usuario no tiene permiso
 */
export function useRequirePermission(route: string) {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkPermission = () => {
      try {
        // Obtener contexto institucional del localStorage
        const contextData = localStorage.getItem('institution_context')

        if (!contextData) {
          // Sin contexto, redirigir a selección de institución
          router.push('/institutions/select')
          return
        }

        const context = JSON.parse(contextData)
        const userRole = context.user_role as UserRole

        // Verificar si tiene permiso
        const permitted = hasPermission(userRole, route)

        if (!permitted) {
          // Sin permiso, redirigir al dashboard
          console.warn(`Usuario con rol ${userRole} intentó acceder a ${route} sin permiso`)
          router.push('/dashboard')
          return
        }

        setHasAccess(true)
      } catch (error) {
        console.error('Error verificando permisos:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [route, router])

  return { hasAccess, loading }
}

/**
 * Hook para obtener el rol del usuario actual
 */
export function useUserRole(): UserRole | null {
  const [userRole, setUserRole] = useState<UserRole | null>(null)

  useEffect(() => {
    try {
      const contextData = localStorage.getItem('institution_context')
      if (contextData) {
        const context = JSON.parse(contextData)
        setUserRole(context.user_role as UserRole)
      }
    } catch (error) {
      console.error('Error obteniendo rol del usuario:', error)
    }
  }, [])

  return userRole
}
