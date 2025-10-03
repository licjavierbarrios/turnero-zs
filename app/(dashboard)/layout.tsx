'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  HeartHandshakeIcon,
  MapPinIcon,
  BarChart3Icon,
  HomeIcon,
  LogOutIcon,
  BuildingIcon,
  ShieldIcon
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Turnos', href: '/turnos', icon: ClockIcon },
  { name: 'Agenda', href: '/agenda', icon: CalendarIcon },
  { name: 'Pacientes', href: '/pacientes', icon: UserIcon },
  { name: 'Profesionales', href: '/profesionales', icon: UsersIcon },
  { name: 'Servicios', href: '/servicios', icon: HeartHandshakeIcon },
  { name: 'Consultorios', href: '/consultorios', icon: MapPinIcon },
  { name: 'Reportes', href: '/reportes', icon: BarChart3Icon },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [institutionContext, setInstitutionContext] = useState<any>(null)

  useEffect(() => {
    // Verificar autenticación y contexto institucional
    const userData = localStorage.getItem('user')
    const contextData = localStorage.getItem('institution_context')

    if (!userData || !contextData) {
      router.push('/')
      return
    }

    setUser(JSON.parse(userData))
    setInstitutionContext(JSON.parse(contextData))
  }, [router])

  const handleLogout = async () => {
    try {
      // Cerrar sesión en Supabase
      await supabase.auth.signOut()

      // Limpiar localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('institution_context')

      // Redirigir a la página de inicio
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      // Aún así intentar limpiar y redirigir
      localStorage.removeItem('user')
      localStorage.removeItem('institution_context')
      router.push('/')
      router.refresh()
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'administrativo':
        return 'Administrativo'
      case 'medico':
        return 'Médico'
      case 'enfermeria':
        return 'Enfermería'
      case 'pantalla':
        return 'Pantalla'
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'medico':
        return 'bg-blue-100 text-blue-800'
      case 'enfermeria':
        return 'bg-green-100 text-green-800'
      case 'administrativo':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user || !institutionContext) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              Turnero ZS
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <IconComponent className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 p-4 space-y-3">
            {/* Institution Info */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <BuildingIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {institutionContext.institution_name}
                </span>
              </div>
              {institutionContext.zone_name && (
                <span className="text-xs text-blue-700">
                  {institutionContext.zone_name}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user.name}
                </p>
                <Badge className={`text-xs ${getRoleColor(institutionContext.user_role)}`}>
                  <ShieldIcon className="h-3 w-3 mr-1" />
                  {getRoleLabel(institutionContext.user_role)}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Sistema de Turnos
              </h2>
              <div className="flex items-center space-x-4">
                <Link
                  href="/pantalla"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver Pantalla Pública
                </Link>
              </div>
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