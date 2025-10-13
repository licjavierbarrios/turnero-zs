'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface QueueItem {
  id: string
  order_number: number
  patient_name: string
  patient_dni: string
  service_id: string
  service_name: string
  status: 'pendiente' | 'disponible' | 'llamado' | 'atendido' | 'cancelado'
  created_at: string
  enabled_at: string | null
  called_at: string | null
  attended_at: string | null
}

interface Service {
  id: string
  name: string
}

const statusConfig = {
  pendiente: {
    label: 'Pendiente',
    color: 'bg-gray-300 text-gray-800',
    description: 'Cargado, no listo para llamar'
  },
  disponible: {
    label: 'Disponible',
    color: 'bg-green-500 text-white',
    description: 'Listo para ser llamado'
  },
  llamado: {
    label: 'Llamando',
    color: 'bg-yellow-500 text-white',
    description: 'Actualmente llamando'
  },
  atendido: {
    label: 'Atendido',
    color: 'bg-blue-500 text-white',
    description: 'Ya fue atendido'
  },
  cancelado: {
    label: 'Cancelado',
    color: 'bg-red-500 text-white',
    description: 'Cancelado'
  }
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [filteredQueue, setFilteredQueue] = useState<QueueItem[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [userServices, setUserServices] = useState<Service[]>([]) // Servicios asignados al usuario
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('ALL') // Filtro por servicio
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [callingId, setCallingId] = useState<string | null>(null) // ID del item que está siendo llamado

  // Form state
  const [patientName, setPatientName] = useState('')
  const [patientDni, setPatientDni] = useState('')
  const [selectedService, setSelectedService] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  // Realtime subscription for daily_queue changes
  useEffect(() => {
    const contextData = localStorage.getItem('institution_context')
    if (!contextData) return

    const context = JSON.parse(contextData)

    // Subscribe to daily_queue changes for this institution
    const channel = supabase
      .channel(`daily_queue_${context.institution_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_queue',
          filter: `institution_id=eq.${context.institution_id}`
        },
        (payload) => {
          console.log('Daily queue change:', payload)
          // Refresh data when any change occurs
          fetchData()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filtrar cola por servicio seleccionado
  useEffect(() => {
    if (selectedServiceFilter === 'ALL') {
      setFilteredQueue(queue)
    } else {
      setFilteredQueue(queue.filter(item => item.service_id === selectedServiceFilter))
    }
  }, [selectedServiceFilter, queue])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Obtener contexto institucional
      const contextData = localStorage.getItem('institution_context')
      if (!contextData) {
        console.error('No hay contexto institucional')
        return
      }
      const context = JSON.parse(contextData)

      // Obtener usuario actual
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        console.error('No hay usuario autenticado')
        return
      }

      // Obtener servicios asignados al usuario
      const { data: userServicesData, error: userServicesError } = await supabase
        .from('user_service')
        .select(`
          service_id,
          service:service_id (
            id,
            name
          )
        `)
        .eq('user_id', authUser.id)
        .eq('institution_id', context.institution_id)
        .eq('is_active', true)

      if (userServicesError) throw userServicesError

      const assignedServices = (userServicesData || [])
        .filter(us => us.service)
        .map(us => ({
          id: (us.service as any).id,
          name: (us.service as any).name
        }))

      setUserServices(assignedServices)

      // Obtener todos los servicios de la institución (para el formulario de carga)
      const { data: servicesData, error: servicesError } = await supabase
        .from('service')
        .select('id, name')
        .eq('institution_id', context.institution_id)
        .eq('is_active', true)
        .order('name')

      if (servicesError) throw servicesError
      setServices(servicesData || [])

      // Obtener cola del día actual
      const today = new Date().toISOString().split('T')[0]

      const { data: queueData, error: queueError } = await supabase
        .from('daily_queue')
        .select(`
          id,
          order_number,
          patient_name,
          patient_dni,
          service_id,
          status,
          created_at,
          enabled_at,
          called_at,
          attended_at,
          service:service_id (
            name
          )
        `)
        .eq('institution_id', context.institution_id)
        .eq('queue_date', today)
        .order('order_number', { ascending: true })

      if (queueError) throw queueError

      // Transformar datos
      const transformedQueue: QueueItem[] = (queueData || []).map(item => ({
        id: item.id,
        order_number: item.order_number,
        patient_name: item.patient_name,
        patient_dni: item.patient_dni,
        service_id: item.service_id,
        service_name: (item.service as any)?.name || 'Sin servicio',
        status: item.status,
        created_at: item.created_at,
        enabled_at: item.enabled_at,
        called_at: item.called_at,
        attended_at: item.attended_at
      }))

      setQueue(transformedQueue)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const contextData = localStorage.getItem('institution_context')
      if (!contextData) return
      const context = JSON.parse(contextData)

      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id

      const today = new Date().toISOString().split('T')[0]

      // Obtener siguiente número de orden
      const { data: nextNumber } = await supabase
        .rpc('get_next_order_number', {
          p_institution_id: context.institution_id,
          p_date: today
        })

      const { error } = await supabase
        .from('daily_queue')
        .insert({
          order_number: nextNumber,
          patient_name: patientName,
          patient_dni: patientDni,
          service_id: selectedService,
          institution_id: context.institution_id,
          queue_date: today,
          status: 'pendiente',
          created_by: userId
        })

      if (error) throw error

      // Limpiar formulario y cerrar dialog
      setPatientName('')
      setPatientDni('')
      setSelectedService('')
      setIsDialogOpen(false)

      // Recargar cola
      fetchData()
    } catch (error) {
      console.error('Error al agregar paciente:', error)
      alert('Error al agregar paciente')
    }
  }

  const updateStatus = async (id: string, newStatus: QueueItem['status']) => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id

      const updates: any = {
        status: newStatus
      }

      // Agregar timestamps según el estado
      if (newStatus === 'disponible') {
        updates.enabled_at = new Date().toISOString()
      } else if (newStatus === 'llamado') {
        updates.called_at = new Date().toISOString()
        updates.called_by = userId

        // Activar estado "llamando" en el botón
        setCallingId(id)
      } else if (newStatus === 'atendido') {
        updates.attended_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('daily_queue')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      fetchData()

      // Si se está llamando, esperar el tiempo de los dos anuncios TTS
      // Dingdong: ~2s
      // Primer llamado: 3s delay + 3s TTS = 6s
      // Segundo llamado: 8s delay + 3s TTS = 11s total
      if (newStatus === 'llamado') {
        setTimeout(() => {
          setCallingId(null)
        }, 11000) // 11 segundos para ambos llamados completos
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      alert('Error al actualizar estado')
      setCallingId(null) // Resetear estado si hay error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando cola del día...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cola del Día</h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Cargar Paciente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cargar Nuevo Paciente</DialogTitle>
                <DialogDescription>
                  Copie los datos del paciente desde el HSI
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPatient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Nombre Completo *</Label>
                  <Input
                    id="patient_name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_dni">DNI *</Label>
                  <Input
                    id="patient_dni"
                    value={patientDni}
                    onChange={(e) => setPatientDni(e.target.value)}
                    placeholder="Ej: 12345678"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Servicio/Especialidad *</Label>
                  <Select value={selectedService} onValueChange={setSelectedService} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Cargar Paciente</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtro por servicio */}
      {userServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filtrar por Servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="service_filter">Selecciona el servicio que deseas ver:</Label>
              <Select value={selectedServiceFilter} onValueChange={setSelectedServiceFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Todos los servicios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los servicios</SelectItem>
                  {userServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedServiceFilter !== 'ALL' && (
                <Badge variant="outline" className="text-sm">
                  Mostrando: {userServices.find(s => s.id === selectedServiceFilter)?.name}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leyenda de colores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Estados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <Badge className={config.color}>{config.label}</Badge>
                <span className="text-sm text-gray-600">{config.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de pacientes */}
      {filteredQueue.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">
              {queue.length === 0
                ? 'No hay pacientes en la cola del día'
                : 'No hay pacientes en el servicio seleccionado'
              }
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {queue.length === 0
                ? 'Use el botón "Cargar Paciente" para agregar pacientes'
                : 'Selecciona otro servicio o "Todos los servicios" para ver más pacientes'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQueue.map((item) => (
            <Card key={item.id} className={item.status === 'atendido' ? 'opacity-50' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Info del paciente */}
                  <div className="flex items-center gap-6">
                    <div className="text-4xl font-bold text-gray-900 w-16 text-center">
                      {String(item.order_number).padStart(3, '0')}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {item.patient_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        DNI: {item.patient_dni} • {item.service_name}
                      </p>
                    </div>
                  </div>

                  {/* Estado y acciones */}
                  <div className="flex items-center gap-4">
                    <Badge className={statusConfig[item.status].color + ' text-sm px-4 py-2'}>
                      {statusConfig[item.status].label}
                    </Badge>

                    {/* Botones según estado */}
                    <div className="flex gap-2">
                      {item.status === 'pendiente' && (
                        <Button
                          onClick={() => updateStatus(item.id, 'disponible')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Habilitar
                        </Button>
                      )}

                      {item.status === 'disponible' && (
                        <Button
                          onClick={() => updateStatus(item.id, 'llamado')}
                          className="bg-yellow-600 hover:bg-yellow-700"
                          disabled={callingId === item.id}
                        >
                          {callingId === item.id ? (
                            <>
                              <span className="animate-pulse">🔔</span> Llamando...
                            </>
                          ) : (
                            'Llamar'
                          )}
                        </Button>
                      )}

                      {item.status === 'llamado' && (
                        <Button
                          onClick={() => updateStatus(item.id, 'atendido')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Marcar Atendido
                        </Button>
                      )}

                      {(item.status === 'pendiente' || item.status === 'disponible') && (
                        <Button
                          onClick={() => updateStatus(item.id, 'cancelado')}
                          variant="outline"
                          className="text-red-600"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
