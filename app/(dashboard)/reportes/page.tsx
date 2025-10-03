'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserMembership } from '@/hooks/useUserMembership'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  ClockIcon,
  CalendarIcon,
  UserIcon,
  HeartHandshakeIcon,
  TrendingUpIcon,
  DownloadIcon,
  FilterIcon
} from 'lucide-react'
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'

interface MetricsSummary {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  averageWaitTime: number
  averageConsultationTime: number
  occupancyRate: number
}

interface ProfessionalMetrics {
  professional_id: string
  professional_name: string
  total_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  no_show_appointments: number
  average_wait_time: number
  average_consultation_time: number
  specialties: string[]
}

interface ServiceMetrics {
  service_id: string
  service_name: string
  total_appointments: number
  completed_appointments: number
  average_wait_time: number
  average_consultation_time: number
  duration_minutes: number
}

interface TimeSeriesData {
  date: string
  appointments: number
  completed: number
  wait_time: number
  consultation_time: number
}

interface Institution {
  id: string
  name: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'custom', label: 'Período personalizado' }
]

export default function ReportesPage() {
  const { userMembership, loading: membershipLoading } = useUserMembership()
  const [selectedInstitution, setSelectedInstitution] = useState<string>('')
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week')
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Data states
  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [professionalMetrics, setProfessionalMetrics] = useState<ProfessionalMetrics[]>([])
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetrics[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])

  useEffect(() => {
    if (userMembership) {
      setSelectedInstitution(userMembership.institution_id)
    }
    fetchInstitutions()
  }, [userMembership]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedInstitution) {
      fetchAllMetrics()
    }
  }, [selectedInstitution, selectedPeriod, customStartDate, customEndDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInstitutions = async () => {
    try {
      if (userMembership?.role === 'admin') {
        const { data, error } = await supabase
          .from('institution')
          .select('id, name')
          .order('name')

        if (error) throw error
        setInstitutions(data || [])
        // Set first institution as default if none selected
        if (!selectedInstitution && data && data.length > 0) {
          setSelectedInstitution(data[0].id)
        }
      } else if (userMembership) {
        setInstitutions([{ id: userMembership.institution_id, name: 'Mi Institución' }])
      } else {
        // If no membership, try to get all institutions
        const { data, error } = await supabase
          .from('institution')
          .select('id, name')
          .order('name')
          .limit(1)

        if (error) {
          console.warn('Could not fetch institutions:', error)
          setInstitutions([])
        } else {
          setInstitutions(data || [])
          // Set first institution as default if none selected
          if (!selectedInstitution && data && data.length > 0) {
            setSelectedInstitution(data[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching institutions:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las instituciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    const now = new Date()

    switch (selectedPeriod) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) }
      case 'yesterday':
        const yesterday = subDays(now, 1)
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) }
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'custom':
        return {
          start: customStartDate ? startOfDay(customStartDate) : startOfDay(subDays(now, 7)),
          end: customEndDate ? endOfDay(customEndDate) : endOfDay(now)
        }
      default:
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    }
  }

  const fetchAllMetrics = async () => {
    if (!selectedInstitution) return

    setLoading(true)
    try {
      const { start, end } = getDateRange()

      await Promise.all([
        fetchSummaryMetrics(start, end),
        fetchProfessionalMetrics(start, end),
        fetchServiceMetrics(start, end),
        fetchTimeSeriesData(start, end)
      ])
    } catch (error) {
      console.error('Error fetching metrics:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSummaryMetrics = async (startDate: Date, endDate: Date) => {
    try {
      const { data: appointments, error } = await supabase
        .from('appointment')
        .select(`
          id,
          status,
          scheduled_at,
          created_at,
          call_event(called_at),
          attendance_event(event_type, occurred_at)
        `)
        .eq('institution_id', selectedInstitution)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())

      if (error) throw error

      const total = appointments?.length || 0
      const completed = appointments?.filter(apt => apt.status === 'finalizado').length || 0
      const cancelled = appointments?.filter(apt => apt.status === 'cancelado').length || 0
      const noShow = appointments?.filter(apt => apt.status === 'ausente').length || 0

      // Calculate average wait times and consultation times
      let totalWaitTime = 0
      let waitTimeCount = 0
      let totalConsultationTime = 0
      let consultationTimeCount = 0

      appointments?.forEach(apt => {
        // Wait time: from scheduled_at to called_at
        if (apt.call_event && apt.call_event.length > 0) {
          const scheduledTime = new Date(apt.scheduled_at).getTime()
          const calledTime = new Date(apt.call_event[0].called_at).getTime()
          totalWaitTime += Math.max(0, calledTime - scheduledTime)
          waitTimeCount++
        }

        // Consultation time: from consultation_start to consultation_end
        if (apt.attendance_event && apt.attendance_event.length > 0) {
          const events = apt.attendance_event.filter((e: any) => 
            e.event_type === 'consultation_start' || e.event_type === 'consultation_end'
          )
          const startEvent = events.find((e: any) => e.event_type === 'consultation_start')
          const endEvent = events.find((e: any) => e.event_type === 'consultation_end')
          
          if (startEvent && endEvent) {
            const startTime = new Date(startEvent.occurred_at).getTime()
            const endTime = new Date(endEvent.occurred_at).getTime()
            totalConsultationTime += Math.max(0, endTime - startTime)
            consultationTimeCount++
          }
        }
      })

      const avgWaitTime = waitTimeCount > 0 ? totalWaitTime / waitTimeCount / (1000 * 60) : 0 // in minutes
      const avgConsultationTime = consultationTimeCount > 0 ? totalConsultationTime / consultationTimeCount / (1000 * 60) : 0 // in minutes

      // Calculate occupancy rate (completed vs scheduled)
      const occupancyRate = total > 0 ? (completed / total) * 100 : 0

      setSummary({
        totalAppointments: total,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        noShowAppointments: noShow,
        averageWaitTime: Math.round(avgWaitTime),
        averageConsultationTime: Math.round(avgConsultationTime),
        occupancyRate: Math.round(occupancyRate * 100) / 100
      })
    } catch (error) {
      console.error('Error fetching summary metrics:', error)
    }
  }

  const fetchProfessionalMetrics = async (startDate: Date, endDate: Date) => {
    try {
      const { data: appointments, error } = await supabase
        .from('appointment')
        .select(`
          id,
          status,
          scheduled_at,
          professional:professional_id (
            id,
            first_name,
            last_name,
            speciality
          ),
          call_event(called_at),
          attendance_event(event_type, occurred_at)
        `)
        .eq('institution_id', selectedInstitution)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())

      if (error) throw error

      // Group by professional
      const professionalGroups: { [key: string]: any[] } = {}
      appointments?.forEach(apt => {
        if (apt.professional && !Array.isArray(apt.professional)) {
          const key = (apt.professional as any).id
          if (!professionalGroups[key]) {
            professionalGroups[key] = []
          }
          professionalGroups[key].push(apt)
        }
      })

      const metrics: ProfessionalMetrics[] = Object.entries(professionalGroups).map(([professionalId, apts]) => {
        const professional = apts[0].professional as any
        const total = apts.length
        const completed = apts.filter(apt => apt.status === 'finalizado').length
        const cancelled = apts.filter(apt => apt.status === 'cancelado').length
        const noShow = apts.filter(apt => apt.status === 'ausente').length

        // Calculate times
        let totalWaitTime = 0
        let waitTimeCount = 0
        let totalConsultationTime = 0
        let consultationTimeCount = 0

        apts.forEach(apt => {
          if (apt.call_event && apt.call_event.length > 0) {
            const scheduledTime = new Date(apt.scheduled_at).getTime()
            const calledTime = new Date(apt.call_event[0].called_at).getTime()
            totalWaitTime += Math.max(0, calledTime - scheduledTime)
            waitTimeCount++
          }

          if (apt.attendance_event && apt.attendance_event.length > 0) {
            const events = apt.attendance_event.filter((e: any) => 
              e.event_type === 'consultation_start' || e.event_type === 'consultation_end'
            )
            const startEvent = events.find((e: any) => e.event_type === 'consultation_start')
            const endEvent = events.find((e: any) => e.event_type === 'consultation_end')
            
            if (startEvent && endEvent) {
              const startTime = new Date(startEvent.occurred_at).getTime()
              const endTime = new Date(endEvent.occurred_at).getTime()
              totalConsultationTime += Math.max(0, endTime - startTime)
              consultationTimeCount++
            }
          }
        })

        return {
          professional_id: professionalId,
          professional_name: `${professional.first_name} ${professional.last_name}`,
          total_appointments: total,
          completed_appointments: completed,
          cancelled_appointments: cancelled,
          no_show_appointments: noShow,
          average_wait_time: waitTimeCount > 0 ? Math.round(totalWaitTime / waitTimeCount / (1000 * 60)) : 0,
          average_consultation_time: consultationTimeCount > 0 ? Math.round(totalConsultationTime / consultationTimeCount / (1000 * 60)) : 0,
          specialties: professional.speciality ? [professional.speciality] : []
        }
      })

      setProfessionalMetrics(metrics.sort((a, b) => b.total_appointments - a.total_appointments))
    } catch (error) {
      console.error('Error fetching professional metrics:', error)
    }
  }

  const fetchServiceMetrics = async (startDate: Date, endDate: Date) => {
    try {
      const { data: appointments, error } = await supabase
        .from('appointment')
        .select(`
          id,
          status,
          scheduled_at,
          service:service_id (
            id,
            name,
            duration_minutes
          ),
          call_event(called_at),
          attendance_event(event_type, occurred_at)
        `)
        .eq('institution_id', selectedInstitution)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())

      if (error) throw error

      // Group by service
      const serviceGroups: { [key: string]: any[] } = {}
      appointments?.forEach(apt => {
        if (apt.service && !Array.isArray(apt.service)) {
          const key = (apt.service as any).id
          if (!serviceGroups[key]) {
            serviceGroups[key] = []
          }
          serviceGroups[key].push(apt)
        }
      })

      const metrics: ServiceMetrics[] = Object.entries(serviceGroups).map(([serviceId, apts]) => {
        const service = apts[0].service as any
        const total = apts.length
        const completed = apts.filter(apt => apt.status === 'finalizado').length

        // Calculate times
        let totalWaitTime = 0
        let waitTimeCount = 0
        let totalConsultationTime = 0
        let consultationTimeCount = 0

        apts.forEach(apt => {
          if (apt.call_event && apt.call_event.length > 0) {
            const scheduledTime = new Date(apt.scheduled_at).getTime()
            const calledTime = new Date(apt.call_event[0].called_at).getTime()
            totalWaitTime += Math.max(0, calledTime - scheduledTime)
            waitTimeCount++
          }

          if (apt.attendance_event && apt.attendance_event.length > 0) {
            const events = apt.attendance_event.filter((e: any) => 
              e.event_type === 'consultation_start' || e.event_type === 'consultation_end'
            )
            const startEvent = events.find((e: any) => e.event_type === 'consultation_start')
            const endEvent = events.find((e: any) => e.event_type === 'consultation_end')
            
            if (startEvent && endEvent) {
              const startTime = new Date(startEvent.occurred_at).getTime()
              const endTime = new Date(endEvent.occurred_at).getTime()
              totalConsultationTime += Math.max(0, endTime - startTime)
              consultationTimeCount++
            }
          }
        })

        return {
          service_id: serviceId,
          service_name: service.name,
          total_appointments: total,
          completed_appointments: completed,
          average_wait_time: waitTimeCount > 0 ? Math.round(totalWaitTime / waitTimeCount / (1000 * 60)) : 0,
          average_consultation_time: consultationTimeCount > 0 ? Math.round(totalConsultationTime / consultationTimeCount / (1000 * 60)) : 0,
          duration_minutes: service.duration_minutes || 0
        }
      })

      setServiceMetrics(metrics.sort((a, b) => b.total_appointments - a.total_appointments))
    } catch (error) {
      console.error('Error fetching service metrics:', error)
    }
  }

  const fetchTimeSeriesData = async (startDate: Date, endDate: Date) => {
    try {
      const { data: appointments, error } = await supabase
        .from('appointment')
        .select(`
          id,
          status,
          scheduled_at,
          call_event(called_at),
          attendance_event(event_type, occurred_at)
        `)
        .eq('institution_id', selectedInstitution)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())

      if (error) throw error

      // Group by date
      const dateGroups: { [key: string]: any[] } = {}
      appointments?.forEach(apt => {
        const date = format(new Date(apt.scheduled_at), 'yyyy-MM-dd')
        if (!dateGroups[date]) {
          dateGroups[date] = []
        }
        dateGroups[date].push(apt)
      })

      const timeSeries: TimeSeriesData[] = Object.entries(dateGroups).map(([date, apts]) => {
        const total = apts.length
        const completed = apts.filter(apt => apt.status === 'finalizado').length

        // Calculate average times for this date
        let totalWaitTime = 0
        let waitTimeCount = 0
        let totalConsultationTime = 0
        let consultationTimeCount = 0

        apts.forEach(apt => {
          if (apt.call_event && apt.call_event.length > 0) {
            const scheduledTime = new Date(apt.scheduled_at).getTime()
            const calledTime = new Date(apt.call_event[0].called_at).getTime()
            totalWaitTime += Math.max(0, calledTime - scheduledTime)
            waitTimeCount++
          }

          if (apt.attendance_event && apt.attendance_event.length > 0) {
            const events = apt.attendance_event.filter((e: any) => 
              e.event_type === 'consultation_start' || e.event_type === 'consultation_end'
            )
            const startEvent = events.find((e: any) => e.event_type === 'consultation_start')
            const endEvent = events.find((e: any) => e.event_type === 'consultation_end')
            
            if (startEvent && endEvent) {
              const startTime = new Date(startEvent.occurred_at).getTime()
              const endTime = new Date(endEvent.occurred_at).getTime()
              totalConsultationTime += Math.max(0, endTime - startTime)
              consultationTimeCount++
            }
          }
        })

        return {
          date,
          appointments: total,
          completed,
          wait_time: waitTimeCount > 0 ? Math.round(totalWaitTime / waitTimeCount / (1000 * 60)) : 0,
          consultation_time: consultationTimeCount > 0 ? Math.round(totalConsultationTime / consultationTimeCount / (1000 * 60)) : 0
        }
      }).sort((a, b) => a.date.localeCompare(b.date))

      setTimeSeriesData(timeSeries)
    } catch (error) {
      console.error('Error fetching time series data:', error)
    }
  }

  const exportToCSV = async (type: 'summary' | 'professionals' | 'services') => {
    try {
      const { start, end } = getDateRange()
      const dateRange = `${format(start, 'yyyy-MM-dd')}_${format(end, 'yyyy-MM-dd')}`

      let csvContent = ''
      let filename = ''

      switch (type) {
        case 'summary':
          if (!summary) return
          csvContent = [
            'Métrica,Valor',
            `Total Turnos,${summary.totalAppointments}`,
            `Turnos Completados,${summary.completedAppointments}`,
            `Turnos Cancelados,${summary.cancelledAppointments}`,
            `Ausencias,${summary.noShowAppointments}`,
            `Tiempo Promedio Espera (min),${summary.averageWaitTime}`,
            `Tiempo Promedio Consulta (min),${summary.averageConsultationTime}`,
            `Tasa Ocupación (%),${summary.occupancyRate}`
          ].join('\n')
          filename = `resumen_metricas_${dateRange}.csv`
          break

        case 'professionals':
          csvContent = [
            'Profesional,Total Turnos,Completados,Cancelados,Ausencias,Tiempo Espera Prom (min),Tiempo Consulta Prom (min),Especialidades',
            ...professionalMetrics.map(prof =>
              `"${prof.professional_name}",${prof.total_appointments},${prof.completed_appointments},${prof.cancelled_appointments},${prof.no_show_appointments},${prof.average_wait_time},${prof.average_consultation_time},"${prof.specialties.join('; ')}"`
            )
          ].join('\n')
          filename = `metricas_profesionales_${dateRange}.csv`
          break

        case 'services':
          csvContent = [
            'Servicio,Total Turnos,Completados,Tiempo Espera Prom (min),Tiempo Consulta Prom (min),Duración Configurada (min)',
            ...serviceMetrics.map(service =>
              `"${service.service_name}",${service.total_appointments},${service.completed_appointments},${service.average_wait_time},${service.average_consultation_time},${service.duration_minutes}`
            )
          ].join('\n')
          filename = `metricas_servicios_${dateRange}.csv`
          break
      }

      // Create and download CSV file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)

      toast({
        title: "Exportación exitosa",
        description: `El archivo ${filename} ha sido descargado`,
      })
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo CSV",
        variant: "destructive",
      })
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  if (membershipLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando membresía...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  if (institutions.length === 0 && !loading && !membershipLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Métricas y Reportes</h1>
            <p className="text-gray-600">Análisis de rendimiento y tiempos de atención</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium mb-2">No se encontraron instituciones</h3>
              <p>No hay instituciones disponibles para mostrar reportes.</p>
              <p className="text-sm mt-2">Contacta con el administrador del sistema.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Métricas y Reportes</h1>
          <p className="text-gray-600">Análisis de rendimiento y tiempos de atención</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userMembership?.role === 'admin' && (
              <div>
                <Label>Institución</Label>
                <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar institución" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((institution) => (
                      <SelectItem key={institution.id} value={institution.id}>
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Período</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <Label>Fecha Inicio</Label>
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    locale={es}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <Label>Fecha Fin</Label>
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    locale={es}
                    className="rounded-md border"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="professionals">Profesionales</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.totalAppointments || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.occupancyRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {summary?.completedAppointments || 0} de {summary?.totalAppointments || 0} completados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Espera Prom.</CardTitle>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(summary?.averageWaitTime || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Consulta Prom.</CardTitle>
                <HeartHandshakeIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(summary?.averageConsultationTime || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution Chart */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Estados</CardTitle>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV('summary')}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completados', value: summary?.completedAppointments || 0, color: COLORS[0] },
                        { name: 'Cancelados', value: summary?.cancelledAppointments || 0, color: COLORS[1] },
                        { name: 'Ausencias', value: summary?.noShowAppointments || 0, color: COLORS[2] }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Completados', value: summary?.completedAppointments || 0 },
                        { name: 'Cancelados', value: summary?.cancelledAppointments || 0 },
                        { name: 'Ausencias', value: summary?.noShowAppointments || 0 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Tiempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">Tiempo de Espera Promedio</p>
                      <p className="text-sm text-gray-600">Desde turno programado hasta llamado</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatTime(summary?.averageWaitTime || 0)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">Tiempo de Consulta Promedio</p>
                      <p className="text-sm text-gray-600">Duración real de la consulta</p>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatTime(summary?.averageConsultationTime || 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="professionals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Métricas por Profesional
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV('professionals')}
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {professionalMetrics.map((prof) => (
                  <Card key={prof.professional_id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{prof.professional_name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prof.specialties.map((specialty, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Turnos</p>
                          <p className="text-xl font-bold">{prof.total_appointments}</p>
                          <p className="text-xs text-green-600">
                            {prof.completed_appointments} completados
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tiempo Espera Prom.</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {formatTime(prof.average_wait_time)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tiempo Consulta Prom.</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatTime(prof.average_consultation_time)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {professionalMetrics.length === 0 && (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay datos de profesionales para el período seleccionado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <HeartHandshakeIcon className="h-5 w-5" />
                  Métricas por Servicio
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV('services')}
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceMetrics.map((service) => (
                  <Card key={service.service_id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{service.service_name}</h3>
                          <p className="text-sm text-gray-600">
                            Duración: {formatTime(service.duration_minutes)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Turnos</p>
                          <p className="text-xl font-bold">{service.total_appointments}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Completados</p>
                          <p className="text-lg font-semibold text-green-600">
                            {service.completed_appointments}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tiempo Espera Prom.</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {formatTime(service.average_wait_time)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tiempo Consulta Prom.</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatTime(service.average_consultation_time)}
                          </p>
                          {service.average_consultation_time > 0 && service.duration_minutes > 0 && (
                            <p className="text-xs text-gray-500">
                              {Math.round((service.average_consultation_time / service.duration_minutes) * 100)}% del tiempo configurado
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {serviceMetrics.length === 0 && (
                  <div className="text-center py-8">
                    <HeartHandshakeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay datos de servicios para el período seleccionado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Turnos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: es })}
                    />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke={COLORS[0]}
                      name="Total Turnos"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke={COLORS[1]}
                      name="Completados"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Tiempos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: es })}
                      formatter={(value: number) => [`${value} min`, '']}
                    />
                    <Line
                      type="monotone"
                      dataKey="wait_time"
                      stroke={COLORS[2]}
                      name="Tiempo de Espera (min)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="consultation_time"
                      stroke={COLORS[3]}
                      name="Tiempo de Consulta (min)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}