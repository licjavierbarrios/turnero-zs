'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MapPinIcon,
  BuildingIcon,
  UsersIcon,
  HomeIcon,
  LogOutIcon,
  ShieldCheckIcon,
  BarChart3Icon
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/super-admin', icon: HomeIcon },
  { name: 'Zonas Sanitarias', href: '/super-admin/zonas', icon: MapPinIcon },
  { name: 'Instituciones', href: '/super-admin/instituciones', icon: BuildingIcon },
  { name: 'Usuarios', href: '/super-admin/usuarios', icon: UsersIcon },
  { name: 'Métricas Globales', href: '/super-admin/metricas', icon: BarChart3Icon },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Verificar autenticación con Supabase
    // Por ahora, simulamos el usuario
    const mockUser = {
      email: 'licjavierbarrios@hotmail.com',
      name: 'Super Administrador',
      role: 'super_admin'
    }
    setUser(mockUser)
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    // TODO: Implementar logout con Supabase
    localStorage.clear()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-purple-900 to-purple-800 shadow-xl">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-purple-700">
            <ShieldCheckIcon className="h-8 w-8 text-purple-200 mr-3" />
            <div>
              <h1 className="text-lg font-bold text-white">
                Turnero ZS
              </h1>
              <p className="text-xs text-purple-200">Super Admin</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-purple-100 hover:text-white hover:bg-purple-700 transition-colors"
                >
                  <IconComponent className="mr-3 h-5 w-5 text-purple-300 group-hover:text-purple-100" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-purple-700 p-4 space-y-3">
            {/* Super Admin Badge */}
            <div className="bg-purple-700/50 rounded-lg p-3 border border-purple-600">
              <div className="flex items-center space-x-2 mb-1">
                <ShieldCheckIcon className="h-5 w-5 text-purple-200" />
                <span className="text-sm font-bold text-white">
                  Super Administrador
                </span>
              </div>
              <p className="text-xs text-purple-200">
                Acceso Global al Sistema
              </p>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center ring-2 ring-purple-400">
                  <span className="text-lg font-bold text-white">
                    {user?.name?.charAt(0) || 'S'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'Super Admin'}
                </p>
                <p className="text-xs text-purple-200 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs bg-red-500/20 hover:bg-red-500/30 text-red-100 border-red-400"
                onClick={handleLogout}
              >
                <LogOutIcon className="h-3 w-3 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Administración del Sistema
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Gestión global de zonas, instituciones y usuarios
                </p>
              </div>
              <Badge className="bg-purple-100 text-purple-800 text-xs px-3 py-1">
                <ShieldCheckIcon className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
