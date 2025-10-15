'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useRequirePermission } from '@/hooks/use-permissions'

interface QueueItem {
  id: string
  order_number: number
  patient_name: string
  patient_dni: string
  service_id: string
  service_name: string
  professional_id: string | null
  professional_name: string | null
  room_id: string | null
  room_name: string | null
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

interface Professional {
  id: string
  name: string
  speciality: string | null
}

interface Room {
  id: string
  name: string
}

interface ProfessionalAssignment {
  id: string
  professional_id: string
  room_id: string
  professional_name: string
  speciality: string | null
  room_name: string
}

interface AttentionOption {
  id: string
  type: 'service' | 'professional'
  label: string
  service_id: string
  professional_id: string | null
  room_id: string | null
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
  const { hasAccess, loading: permissionLoading } = useRequirePermission('/turnos')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [filteredQueue, setFilteredQueue] = useState<QueueItem[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [professionalAssignments, setProfessionalAssignments] = useState<ProfessionalAssignment[]>([])
  const [attentionOptions, setAttentionOptions] = useState<AttentionOption[]>([])
  const [userServices, setUserServices] = useState<Service[]>([]) // Servicios asignados al usuario

  // Filtros
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('ALL')
  const [selectedProfessionalFilter, setSelectedProfessionalFilter] = useState<string>('ALL')
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL')

  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [callingId, setCallingId] = useState<string | null>(null) // ID del item que está siendo llamado

  // Form state
  const [patientName, setPatientName] = useState('')
  const [patientDni, setPatientDni] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

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

  // Aplicar todos los filtros a la cola
  useEffect(() => {
    let filtered = [...queue]

    // Filtro por servicio
    if (selectedServiceFilter !== 'ALL') {
      filtered = filtered.filter(item => item.service_id === selectedServiceFilter)
    }

    // Filtro por profesional
    if (selectedProfessionalFilter !== 'ALL') {
      filtered = filtered.filter(item => item.professional_id === selectedProfessionalFilter)
    }

    // Filtro por consultorio
    if (selectedRoomFilter !== 'ALL') {
      filtered = filtered.filter(item => item.room_id === selectedRoomFilter)
    }

    // Filtro por estado
    if (selectedStatusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status === selectedStatusFilter)
    }

    setFilteredQueue(filtered)
  }, [selectedServiceFilter, selectedProfessionalFilter, selectedRoomFilter, selectedStatusFilter, queue])

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
        .filter((us: any) => us.service)
        .map((us: any) => ({
          id: (us.service as any).id,
          name: (us.service as any).name
        }))

      setUserServices(assignedServices)

      // Obtener fecha del día actual
      const today = new Date().toISOString().split('T')[0]

      // Obtener todos los servicios de la institución (para el formulario de carga)
      const { data: servicesData, error: servicesError } = await supabase
        .from('service')
        .select('id, name')
        .eq('institution_id', context.institution_id)
        .eq('is_active', true)
        .order('name')

      if (servicesError) throw servicesError
      setServices(servicesData || [])

      // Obtener asignaciones de profesionales del día actual
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('daily_professional_assignment')
        .select(`
          id,
          professional_id,
          room_id,
          professional:professional_id (
            id,
            first_name,
            last_name,
            speciality
          ),
          room:room_id (
            id,
            name
          )
        `)
        .eq('institution_id', context.institution_id)
        .eq('assignment_date', today)

      if (assignmentsError) {
        console.error('Error al cargar asignaciones:', {
          message: assignmentsError.message,
          details: assignmentsError.details,
          hint: assignmentsError.hint,
          code: assignmentsError.code
        })
        throw assignmentsError
      }

      // Transformar asignaciones
      const transformedAssignments: ProfessionalAssignment[] = (assignmentsData || [])
        .filter((a: any) => a.professional && a.room)
        .map((a: any) => {
          const prof = a.professional as any
          return {
            id: a.id,
            professional_id: a.professional_id,
            room_id: a.room_id,
            professional_name: `${prof.first_name} ${prof.last_name}`,
            speciality: prof.speciality,
            room_name: (a.room as any).name
          }
        })

      setProfessionalAssignments(transformedAssignments)

      // Combinar servicios y profesionales en opciones de atención
      const serviceOptions: AttentionOption[] = servicesData.map((s: Service) => ({
        id: `service-${s.id}`,
        type: 'service',
        label: s.name,
        service_id: s.id,
        professional_id: null,
        room_id: null
      }))

      const professionalOptions: AttentionOption[] = transformedAssignments.map((a: ProfessionalAssignment) => ({
        id: `professional-${a.professional_id}`,
        type: 'professional',
        label: a.speciality
          ? `${a.professional_name} - ${a.speciality} (${a.room_name})`
          : `${a.professional_name} (${a.room_name})`,
        service_id: '', // Los profesionales no tienen service_id
        professional_id: a.professional_id,
        room_id: a.room_id
      }))

      setAttentionOptions([...serviceOptions, ...professionalOptions])

      // Obtener cola del día actual con datos completos
      const { data: queueData, error: queueError } = await supabase
        .from('daily_queue')
        .select(`
          id,
          order_number,
          patient_name,
          patient_dni,
          service_id,
          professional_id,
          room_id,
          status,
          created_at,
          enabled_at,
          called_at,
          attended_at,
          service:service_id (
            name
          ),
          professional:professional_id (
            first_name,
            last_name,
            speciality
          ),
          room:room_id (
            name
          )
        `)
        .eq('institution_id', context.institution_id)
        .eq('queue_date', today)
        .order('order_number', { ascending: true })

      if (queueError) throw queueError

      // Transformar datos
      const transformedQueue: QueueItem[] = (queueData || []).map((item: any) => ({
        id: item.id,
        order_number: item.order_number,
        patient_name: item.patient_name,
        patient_dni: item.patient_dni,
        service_id: item.service_id,
        service_name: (item.service as any)?.name || 'Sin servicio',
        professional_id: item.professional_id,
        professional_name: item.professional ? `${(item.professional as any).first_name} ${(item.professional as any).last_name}` : null,
        room_id: item.room_id,
        room_name: (item.room as any)?.name || null,
        status: item.status,
        created_at: item.created_at,
        enabled_at: item.enabled_at,
        called_at: item.called_at,
        attended_at: item.attended_at
      }))

      setQueue(transformedQueue)

      // Extraer listas únicas de profesionales y consultorios desde la cola
      const uniqueProfessionals: Professional[] = []
      const uniqueRooms: Room[] = []
      const seenProfessionals = new Set<string>()
      const seenRooms = new Set<string>()

      transformedQueue.forEach(item => {
        if (item.professional_id && !seenProfessionals.has(item.professional_id)) {
          seenProfessionals.add(item.professional_id)
          uniqueProfessionals.push({
            id: item.professional_id,
            name: item.professional_name || 'Sin nombre',
            speciality: null
          })
        }
        if (item.room_id && !seenRooms.has(item.room_id)) {
          seenRooms.add(item.room_id)
          uniqueRooms.push({
            id: item.room_id,
            name: item.room_name || 'Sin nombre'
          })
        }
      })

      setProfessionals(uniqueProfessionals)
      setRooms(uniqueRooms)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedOptions.length === 0) {
      alert('Por favor selecciona al menos un servicio o profesional')
      return
    }

    try {
      const contextData = localStorage.getItem('institution_context')
      if (!contextData) return
      const context = JSON.parse(contextData)

      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id

      const today = new Date().toISOString().split('T')[0]

      // Crear una entrada en la cola por cada opción seleccionada
      for (let i = 0; i < selectedOptions.length; i++) {
        const optionId = selectedOptions[i]
        const option = attentionOptions.find(o => o.id === optionId)

        if (!option) continue

        // Obtener siguiente número de orden
        const { data: nextNumber } = await supabase
          .rpc('get_next_order_number', {
            p_institution_id: context.institution_id,
            p_date: today
          })

        // Preparar datos del registro
        const queueEntry: any = {
          order_number: nextNumber,
          patient_name: patientName,
          patient_dni: patientDni,
          institution_id: context.institution_id,
          queue_date: today,
          status: 'pendiente',
          created_by: userId
        }

        // Si es un servicio, agregar service_id
        if (option.type === 'service') {
          queueEntry.service_id = option.service_id
        }

        // Si es un profesional, agregar professional_id y room_id
        if (option.type === 'professional') {
          queueEntry.professional_id = option.professional_id
          queueEntry.room_id = option.room_id
        }

        const { error } = await supabase
          .from('daily_queue')
          .insert(queueEntry)

        if (error) throw error
      }

      // Limpiar formulario y cerrar dialog
      setPatientName('')
      setPatientDni('')
      setSelectedOptions([])
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

  if (permissionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cola del Día</h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
          <div className="flex gap-4 mt-3">
            <Badge variant="outline" className="text-sm px-3 py-1">
              Total: {queue.length}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              Mostrando: {filteredQueue.length}
            </Badge>
            {filteredQueue.length < queue.length && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {queue.length - filteredQueue.length} ocultos por filtros
              </Badge>
            )}
          </div>
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

                <div className="space-y-3">
                  <Label>Servicios y Profesionales *</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecciona todos los servicios/profesionales que el paciente necesita
                  </p>
                  <div className="border rounded-md p-4 max-h-80 overflow-y-auto space-y-3">
                    {attentionOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay servicios o profesionales disponibles
                      </p>
                    ) : (
                      <>
                        {/* Servicios */}
                        {attentionOptions.filter(o => o.type === 'service').length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-700">Servicios</h4>
                            {attentionOptions
                              .filter(o => o.type === 'service')
                              .map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={option.id}
                                    checked={selectedOptions.includes(option.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedOptions([...selectedOptions, option.id])
                                      } else {
                                        setSelectedOptions(selectedOptions.filter(id => id !== option.id))
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={option.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Profesionales */}
                        {attentionOptions.filter(o => o.type === 'professional').length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-700">Profesionales Asignados Hoy</h4>
                            {attentionOptions
                              .filter(o => o.type === 'professional')
                              .map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={option.id}
                                    checked={selectedOptions.includes(option.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedOptions([...selectedOptions, option.id])
                                      } else {
                                        setSelectedOptions(selectedOptions.filter(id => id !== option.id))
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={option.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {selectedOptions.length > 0 && (
                    <p className="text-sm text-blue-600 font-medium">
                      {selectedOptions.length} seleccionado{selectedOptions.length > 1 ? 's' : ''}
                    </p>
                  )}
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

      {/* Filtros Avanzados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filtros</CardTitle>
          <CardDescription>
            Filtra la cola por servicio, profesional, consultorio o estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Servicio */}
            <div className="space-y-2">
              <Label htmlFor="service_filter">Servicio</Label>
              <Select value={selectedServiceFilter} onValueChange={setSelectedServiceFilter}>
                <SelectTrigger id="service_filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los servicios</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Profesional */}
            <div className="space-y-2">
              <Label htmlFor="professional_filter">Profesional</Label>
              <Select value={selectedProfessionalFilter} onValueChange={setSelectedProfessionalFilter}>
                <SelectTrigger id="professional_filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los profesionales</SelectItem>
                  {professionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Consultorio */}
            <div className="space-y-2">
              <Label htmlFor="room_filter">Consultorio</Label>
              <Select value={selectedRoomFilter} onValueChange={setSelectedRoomFilter}>
                <SelectTrigger id="room_filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los consultorios</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Estado */}
            <div className="space-y-2">
              <Label htmlFor="status_filter">Estado</Label>
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger id="status_filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumen de filtros activos y botón limpiar */}
          {(selectedServiceFilter !== 'ALL' || selectedProfessionalFilter !== 'ALL' || selectedRoomFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {selectedServiceFilter !== 'ALL' && (
                  <Badge variant="secondary">
                    Servicio: {services.find(s => s.id === selectedServiceFilter)?.name}
                  </Badge>
                )}
                {selectedProfessionalFilter !== 'ALL' && (
                  <Badge variant="secondary">
                    Profesional: {professionals.find(p => p.id === selectedProfessionalFilter)?.name}
                  </Badge>
                )}
                {selectedRoomFilter !== 'ALL' && (
                  <Badge variant="secondary">
                    Consultorio: {rooms.find(r => r.id === selectedRoomFilter)?.name}
                  </Badge>
                )}
                {selectedStatusFilter !== 'ALL' && (
                  <Badge variant="secondary">
                    Estado: {statusConfig[selectedStatusFilter as keyof typeof statusConfig].label}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedServiceFilter('ALL')
                  setSelectedProfessionalFilter('ALL')
                  setSelectedRoomFilter('ALL')
                  setSelectedStatusFilter('ALL')
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-sm text-gray-600">
                          DNI: {item.patient_dni}
                        </span>
                        {item.service_name && (
                          <Badge variant="outline" className="text-xs">
                            {item.service_name}
                          </Badge>
                        )}
                        {item.professional_name && (
                          <Badge variant="outline" className="text-xs">
                            👨‍⚕️ {item.professional_name}
                          </Badge>
                        )}
                        {item.room_name && (
                          <Badge variant="outline" className="text-xs">
                            🚪 {item.room_name}
                          </Badge>
                        )}
                      </div>
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
