'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MapPin,
  Building2,
  Users,
  Activity,
  Calendar,
  TrendingUp,
  Clock,
  UserCheck
} from 'lucide-react'

type GlobalMetrics = {
  totalZones: number
  totalInstitutions: number
  totalUsers: number
  totalProfessionals: number
  totalPatients: number
  totalAppointments: number
  todayAppointments: number
  completedAppointments: number
  institutionsByType: {
    caps: number
    hospital_seccional: number
    hospital_distrital: number
    hospital_regional: number
  }
  institutionsByZone: Array<{
    zone_name: string
    count: number
  }>
}

export default function SuperAdminMetricasPage() {
  const [metrics, setMetrics] = useState<GlobalMetrics>({
    totalZones: 0,
    totalInstitutions: 0,
    totalUsers: 0,
    totalProfessionals: 0,
    totalPatients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    institutionsByType: {
      caps: 0,
      hospital_seccional: 0,
      hospital_distrital: 0,
      hospital_regional: 0
    },
    institutionsByZone: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGlobalMetrics()
  }, [])

  const fetchGlobalMetrics = async () => {
    try {
      setLoading(true)

      // Fetch zones
      const { count: zonesCount } = await supabase
        .from('zone')
        .select('id', { count: 'exact', head: true })

      // Fetch institutions
      const { data: institutions } = await supabase
        .from('institution')
        .select('id, type, zone_id, zone:zone_id(name)')

      // Fetch users
      const { count: usersCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })

      // Fetch professionals
      const { count: professionalsCount } = await supabase
        .from('professional')
        .select('id', { count: 'exact', head: true })

      // Fetch patients
      const { count: patientsCount } = await supabase
        .from('patient')
        .select('id', { count: 'exact', head: true })

      // Fetch appointments
      const { count: appointmentsCount } = await supabase
        .from('appointment')
        .select('id', { count: 'exact', head: true })

      // Fetch today's appointments
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { count: todayCount } = await supabase
        .from('appointment')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_at', today.toISOString())
        .lt('scheduled_at', tomorrow.toISOString())

      // Fetch completed appointments
      const { count: completedCount } = await supabase
        .from('appointment')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'finalizado')

      // Calculate institutions by type
      const institutionsByType = {
        caps: institutions?.filter((i: any) => i.type === 'caps').length || 0,
        hospital_seccional: institutions?.filter((i: any) => i.type === 'hospital_seccional').length || 0,
        hospital_distrital: institutions?.filter((i: any) => i.type === 'hospital_distrital').length || 0,
        hospital_regional: institutions?.filter((i: any) => i.type === 'hospital_regional').length || 0
      }

      // Calculate institutions by zone
      const zoneMap = new Map<string, number>()
      institutions?.forEach((inst: any) => {
        const zoneName = (inst.zone as any)?.name || 'Sin zona'
        zoneMap.set(zoneName, (zoneMap.get(zoneName) || 0) + 1)
      })

      const institutionsByZone = Array.from(zoneMap.entries())
        .map(([zone_name, count]) => ({ zone_name, count }))
        .sort((a, b) => b.count - a.count)

      setMetrics({
        totalZones: zonesCount || 0,
        totalInstitutions: institutions?.length || 0,
        totalUsers: usersCount || 0,
        totalProfessionals: professionalsCount || 0,
        totalPatients: patientsCount || 0,
        totalAppointments: appointmentsCount || 0,
        todayAppointments: todayCount || 0,
        completedAppointments: completedCount || 0,
        institutionsByType,
        institutionsByZone
      })
    } catch (error) {
      console.error('Error fetching global metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando métricas globales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Métricas Globales del Sistema</h1>
        <p className="text-muted-foreground">
          Vista completa de estadísticas y métricas de todas las zonas e instituciones
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="instituciones">Instituciones</TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Zonas Sanitarias</CardTitle>
                <MapPin className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalZones}</div>
                <p className="text-xs text-muted-foreground">
                  Zonas geográficas activas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instituciones</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalInstitutions}</div>
                <p className="text-xs text-muted-foreground">
                  CAPS y hospitales totales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Usuarios del sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
                <Activity className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalProfessionals}</div>
                <p className="text-xs text-muted-foreground">
                  Profesionales de salud
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
                <UserCheck className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalPatients}</div>
                <p className="text-xs text-muted-foreground">
                  Pacientes registrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Turnos Totales</CardTitle>
                <Calendar className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  Turnos históricos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.todayAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  Programados para hoy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completados</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.completedAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  Turnos finalizados
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Instituciones Tab */}
        <TabsContent value="instituciones" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Instituciones por Tipo</CardTitle>
                <CardDescription>
                  Distribución de instituciones según su categoría
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CAPS</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {metrics.institutionsByType.caps}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hospitales Seccionales</span>
                  <span className="text-2xl font-bold text-green-600">
                    {metrics.institutionsByType.hospital_seccional}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hospitales Distritales</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {metrics.institutionsByType.hospital_distrital}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hospitales Regionales</span>
                  <span className="text-2xl font-bold text-red-600">
                    {metrics.institutionsByType.hospital_regional}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Por Zona */}
            <Card>
              <CardHeader>
                <CardTitle>Instituciones por Zona</CardTitle>
                <CardDescription>
                  Distribución de instituciones por zona sanitaria
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.institutionsByZone.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay datos disponibles
                  </p>
                ) : (
                  <div className="space-y-3">
                    {metrics.institutionsByZone.map((zone, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate flex-1">
                          {zone.zone_name}
                        </span>
                        <span className="text-xl font-bold text-indigo-600 ml-4">
                          {zone.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Actividad Tab */}
        <TabsContent value="actividad" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tasa de Ocupación</CardTitle>
                <CardDescription>Turnos programados vs capacidad</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {metrics.totalAppointments > 0
                    ? ((metrics.completedAppointments / metrics.totalAppointments) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.completedAppointments} de {metrics.totalAppointments} turnos completados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Promedio por Institución</CardTitle>
                <CardDescription>Turnos promedio por institución</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {metrics.totalInstitutions > 0
                    ? Math.round(metrics.totalAppointments / metrics.totalInstitutions)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Turnos por institución
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profesionales Activos</CardTitle>
                <CardDescription>Promedio por institución</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {metrics.totalInstitutions > 0
                    ? Math.round(metrics.totalProfessionals / metrics.totalInstitutions)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Profesionales por institución
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
