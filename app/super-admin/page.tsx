'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Building2, Users, Activity, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalZones: 0,
    totalInstitutions: 0,
    totalUsers: 0,
    totalProfessionals: 0,
    capsCount: 0,
    hospitalsCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Fetch zones
      const { data: zones } = await supabase
        .from('zone')
        .select('id')

      // Fetch institutions
      const { data: institutions } = await supabase
        .from('institution')
        .select('id, type')

      // Fetch users
      const { data: users } = await supabase
        .from('users')
        .select('id')

      // Fetch professionals
      const { data: professionals } = await supabase
        .from('professional')
        .select('id')

      const capsCount = institutions?.filter((i: any) => i.type === 'caps').length || 0
      const hospitalsCount = institutions?.filter((i: any) => i.type !== 'caps').length || 0

      setStats({
        totalZones: zones?.length || 0,
        totalInstitutions: institutions?.length || 0,
        totalUsers: users?.length || 0,
        totalProfessionals: professionals?.length || 0,
        capsCount,
        hospitalsCount,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Panel de Super Administrador</h1>
        <p className="text-purple-100">
          Bienvenido al panel de control global del sistema Turnero ZS
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zonas Sanitarias</CardTitle>
            <MapPin className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalZones}</div>
            <p className="text-xs text-gray-500 mt-1">
              Zonas geográficas activas
            </p>
            <Link href="/super-admin/zonas">
              <Button variant="link" className="px-0 text-xs mt-2">
                Ver todas →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instituciones</CardTitle>
            <Building2 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalInstitutions}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.capsCount} CAPS · {stats.hospitalsCount} Hospitales
            </p>
            <Link href="/super-admin/instituciones">
              <Button variant="link" className="px-0 text-xs mt-2">
                Gestionar →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios del Sistema</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              Usuarios registrados
            </p>
            <Link href="/super-admin/usuarios">
              <Button variant="link" className="px-0 text-xs mt-2">
                Ver usuarios →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
            <Activity className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProfessionals}</div>
            <p className="text-xs text-gray-500 mt-1">
              Profesionales de salud
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Tareas comunes de administración</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/super-admin/zonas">
              <Button variant="outline" className="w-full justify-start">
                <MapPin className="h-4 w-4 mr-2" />
                Gestionar Zonas Sanitarias
              </Button>
            </Link>
            <Link href="/super-admin/instituciones">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="h-4 w-4 mr-2" />
                Administrar Instituciones
              </Button>
            </Link>
            <Link href="/super-admin/usuarios">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Gestionar Usuarios
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>Información general</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Sistema Operativo</p>
                <p className="text-xs text-gray-500">
                  Todas las funcionalidades principales están activas
                </p>
              </div>
            </div>

            {stats.totalZones === 0 && (
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Configuración Inicial Pendiente</p>
                  <p className="text-xs text-gray-500">
                    Crea al menos una zona sanitaria para comenzar
                  </p>
                </div>
              </div>
            )}

            {stats.totalZones > 0 && stats.totalInstitutions === 0 && (
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Sin Instituciones</p>
                  <p className="text-xs text-gray-500">
                    Registra instituciones en las zonas creadas
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribution by Zone */}
      {stats.totalZones > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Zona</CardTitle>
            <CardDescription>
              Resumen de instituciones por zona sanitaria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              {stats.totalInstitutions === 0 ? (
                <p>No hay instituciones registradas aún.</p>
              ) : (
                <p>
                  Promedio de {Math.round(stats.totalInstitutions / stats.totalZones)}{' '}
                  instituciones por zona
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started Guide */}
      {stats.totalZones === 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-900">Guía de Inicio</CardTitle>
            <CardDescription className="text-purple-700">
              Pasos para configurar el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-purple-900">Crear Zonas Sanitarias</p>
                <p className="text-sm text-purple-700">
                  Define las zonas geográficas del sistema (Zona Norte, Sur, etc.)
                </p>
                <Link href="/super-admin/zonas">
                  <Button variant="link" className="px-0 text-purple-700 text-sm">
                    Ir a Zonas →
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-purple-900">Registrar Instituciones</p>
                <p className="text-sm text-purple-700">
                  Añade CAPS y hospitales a cada zona
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-purple-900">Crear Administradores</p>
                <p className="text-sm text-purple-700">
                  Asigna un administrador a cada institución
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
