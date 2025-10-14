'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  HeartHandshakeIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  BuildingIcon,
  RefreshCwIcon,
  ShieldIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { useRequirePermission } from '@/hooks/use-permissions'

interface DashboardStats {
  todayAppointments: number
  pendingAppointments: number
  completedAppointments: number
  totalPatients: number
  totalProfessionals: number
  totalServices: number
  recentAppointments: Array<{
    id: string
    patient_name: string
    professional_name: string
    service_name: string
    scheduled_at: string
    status: string
  }>
}

import { supabase } from '@/lib/supabase'
import { startOfDay, endOfDay } from 'date-fns'

export default function DashboardPage() {
  const { hasAccess, loading: permissionLoading } = useRequirePermission('/dashboard')
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [institutionContext, setInstitutionContext] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    totalProfessionals: 0,
    totalServices: 0,
    recentAppointments: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboard = async () => {
    try {
      // Verificar sesión de Supabase
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        router.push('/')
        return
      }

      // Obtener datos del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError) {
        router.push('/')
        return
      }

      setUser(userData)

      // Verificar contexto institucional
      const contextData = localStorage.getItem('institution_context')

      if (!contextData) {
        router.push('/institutions/select')
        return
      }

      const parsedContext = JSON.parse(contextData)
      setInstitutionContext(parsedContext)

      // Fetch stats
      await fetchDashboardStats(parsedContext.institution_id)
    } catch (error) {
      console.error('Error en loadDashboard:', error)
      router.push('/')
    }
  }

  const fetchDashboardStats = async (institutionId: string) => {
    try {
      setLoading(true)
      const now = new Date()
      const todayStart = startOfDay(now)
      const todayEnd = endOfDay(now)

      // Fetch today's appointments
      const { data: todayAppointments, error: appointmentsError } = await supabase
        .from('appointment')
        .select('id, status')
        .eq('institution_id', institutionId)
        .gte('scheduled_at', todayStart.toISOString())
        .lte('scheduled_at', todayEnd.toISOString())

      if (appointmentsError) throw appointmentsError

      // Fetch recent appointments with details
      const { data: recentAppointments, error: recentError } = await supabase
        .from('appointment')
        .select(`
          id,
          scheduled_at,
          status,
          patient:patient_id (first_name, last_name),
          professional:professional_id (first_name, last_name),
          service:service_id (name)
        `)
        .eq('institution_id', institutionId)
        .order('scheduled_at', { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      // Fetch total patients
      const { count: patientsCount, error: patientsError } = await supabase
        .from('patient')
        .select('id', { count: 'exact', head: true })

      if (patientsError) throw patientsError

      // Fetch total professionals in institution
      const { count: professionalsCount, error: professionalsError } = await supabase
        .from('professional')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', institutionId)
        .eq('is_active', true)

      if (professionalsError) throw professionalsError

      // Fetch total services in institution
      const { count: servicesCount, error: servicesError } = await supabase
        .from('service')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', institutionId)
        .eq('is_active', true)

      if (servicesError) throw servicesError

      // Calculate stats
      const todayTotal = todayAppointments?.length || 0
      const todayPending = todayAppointments?.filter(apt =>
        apt.status === 'pendiente' || apt.status === 'esperando' || apt.status === 'llamado' || apt.status === 'en_consulta'
      ).length || 0
      const todayCompleted = todayAppointments?.filter(apt => apt.status === 'finalizado').length || 0

      // Format recent appointments
      const formattedRecent = recentAppointments?.map(apt => ({
        id: apt.id,
        patient_name: apt.patient ? `${(apt.patient as any).first_name} ${(apt.patient as any).last_name}` : 'N/A',
        professional_name: apt.professional ? `${(apt.professional as any).first_name} ${(apt.professional as any).last_name}` : 'N/A',
        service_name: apt.service ? (apt.service as any).name : 'N/A',
        scheduled_at: apt.scheduled_at,
        status: apt.status
      })) || []

      setStats({
        todayAppointments: todayTotal,
        pendingAppointments: todayPending,
        completedAppointments: todayCompleted,
        totalPatients: patientsCount || 0,
        totalProfessionals: professionalsCount || 0,
        totalServices: servicesCount || 0,
        recentAppointments: formattedRecent
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeInstitution = () => {
    router.push('/institutions/select')
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

  if (permissionLoading || !user || !institutionContext) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'esperando': return 'bg-blue-100 text-blue-800'
      case 'llamado': return 'bg-purple-100 text-purple-800'
      case 'en_consulta': return 'bg-orange-100 text-orange-800'
      case 'finalizado': return 'bg-green-100 text-green-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      case 'ausente': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendiente': return 'Pendiente'
      case 'esperando': return 'Esperando'
      case 'llamado': return 'Llamado'
      case 'en_consulta': return 'En Consulta'
      case 'finalizado': return 'Finalizado'
      case 'cancelado': return 'Cancelado'
      case 'ausente': return 'Ausente'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Institution Context */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <BuildingIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">
                  Bienvenido, {user.first_name} {user.last_name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <BuildingIcon className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-semibold text-gray-900">
                  {institutionContext.institution_name}
                </span>
              </div>
              <Badge className={getRoleColor(institutionContext.user_role)}>
                <ShieldIcon className="h-3 w-3 mr-1" />
                {getRoleLabel(institutionContext.user_role)}
              </Badge>
              {institutionContext.zone_name && (
                <span className="text-sm text-gray-500">
                  {institutionContext.zone_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleChangeInstitution}>
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Seleccionar Institución
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedAppointments} completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Por atender hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProfessionals}</div>
            <p className="text-xs text-muted-foreground">
              Activos en la institución
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios</CardTitle>
            <HeartHandshakeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              Disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accede a las funciones principales del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/turnos">
              <Button variant="outline" className="w-full h-16 flex flex-col">
                <CalendarIcon className="h-5 w-5 mb-2" />
                Gestionar Turnos
              </Button>
            </Link>
            <Link href="/profesionales">
              <Button variant="outline" className="w-full h-16 flex flex-col">
                <UsersIcon className="h-5 w-5 mb-2" />
                Profesionales
              </Button>
            </Link>
            <Link href="/reportes">
              <Button variant="outline" className="w-full h-16 flex flex-col">
                <TrendingUpIcon className="h-5 w-5 mb-2" />
                Reportes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Turnos Recientes</CardTitle>
          <CardDescription>
            Últimos turnos programados en la institución
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentAppointments && stats.recentAppointments.length > 0 ? (
            <div className="space-y-4">
              {stats.recentAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{appointment.patient_name}</p>
                        <p className="text-sm text-gray-600">
                          {appointment.professional_name} - {appointment.service_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(appointment.scheduled_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {getStatusLabel(appointment.status)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay turnos registrados</p>
              <Link href="/turnos">
                <Button className="mt-4">
                  Crear Primer Turno
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}