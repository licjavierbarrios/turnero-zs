'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRequirePermission } from '@/hooks/use-permissions'
import { StatusLegend } from '@/components/turnos/StatusLegend'
import { QueueStats } from '@/components/turnos/QueueStats'
import { PatientCard } from '@/components/turnos/PatientCard'
import { AddPatientDialog } from '@/components/turnos/AddPatientDialog'
import { QueueFilters } from '@/components/turnos/QueueFilters'
import { statusConfig } from '@/lib/turnos/config'
import type { QueueItem, Service, Professional, Room, ProfessionalAssignment, AttentionOption, UserProfessionalAssignment } from '@/lib/turnos/types'
import {
  getNextOrderNumber,
  generateTempId,
  getTodayISO,
  getNowISO,
  getInstitutionContext
} from '@/lib/turnos/helpers'
import {
  transformQueueItem,
  transformProfessionalAssignments,
  transformUserServices,
  transformUserProfessionals,
  buildAttentionOptions,
  extractUniqueProfessionals,
  extractUniqueRooms,
  buildStatusUpdates
} from '@/lib/turnos/transforms'

export default function QueuePage() {
  const { hasAccess, loading: permissionLoading } = useRequirePermission('/turnos')
  const [queue, setQueue] = useState<any[]>([])
  const [filteredQueue, setFilteredQueue] = useState<any[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [professionalAssignments, setProfessionalAssignments] = useState<ProfessionalAssignment[]>([])
  const [attentionOptions, setAttentionOptions] = useState<AttentionOption[]>([])
  const [userServices, setUserServices] = useState<Service[]>([]) // Servicios asignados al usuario
  const [userProfessionals, setUserProfessionals] = useState<UserProfessionalAssignment[]>([]) // Profesionales asignados al usuario
  const [currentUserId, setCurrentUserId] = useState<string>('') // ID del usuario actual para permisos

  // Filtros
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('ALL')
  const [selectedProfessionalFilter, setSelectedProfessionalFilter] = useState<string>('ALL')
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL')

  // Estados de loading granulares (Fase 1 - Optimización UX)
  const [initialLoading, setInitialLoading] = useState(true)  // Solo primera carga
  const [isRefreshing, setIsRefreshing] = useState(false)     // Botón refresh
  const [isSaving, setIsSaving] = useState(false)             // Guardar paciente
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [callingId, setCallingId] = useState<string | null>(null) // ID del item que está siendo llamado

  const fetchData = useCallback(async () => {
    try {
      // Solo mostrar loading completo en la primera carga
      if (queue.length === 0) {
        setInitialLoading(true)
      } else {
        setIsRefreshing(true)
      }

      // Obtener contexto institucional
      const context = getInstitutionContext()
      if (!context) {
        console.error('No hay contexto institucional')
        return
      }

      // Obtener usuario actual
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        console.error('No hay usuario autenticado')
        return
      }

      setCurrentUserId(authUser.id)

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

      const assignedServices = transformUserServices(userServicesData)
      setUserServices(assignedServices)

      // Obtener profesionales asignados al usuario
      const { data: userProfessionalsData, error: userProfessionalsError } = await supabase
        .from('user_professional')
        .select(`
          professional_id,
          professional:professional_id (
            id,
            first_name,
            last_name,
            speciality
          )
        `)
        .eq('user_id', authUser.id)
        .eq('institution_id', context.institution_id)
        .eq('is_active', true)

      if (userProfessionalsError) {
        console.warn('Error al cargar profesionales asignados:', userProfessionalsError)
        // No es error fatal, continuamos sin asignaciones de profesional
      }

      const assignedProfessionals = userProfessionalsData ? transformUserProfessionals(userProfessionalsData) : []
      setUserProfessionals(assignedProfessionals)

      // Obtener fecha del día actual
      const today = getTodayISO()

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
      const transformedAssignments = transformProfessionalAssignments(assignmentsData)
      setProfessionalAssignments(transformedAssignments)

      // Combinar servicios y profesionales en opciones de atención
      const options = buildAttentionOptions(servicesData, transformedAssignments)
      setAttentionOptions(options)

      // Obtener cola del día actual con datos completos - INCLUIR created_by
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
          created_by,
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
      const transformedQueue = (queueData || []).map(transformQueueItem)
      setQueue(transformedQueue)

      // Extraer listas únicas de profesionales y consultorios desde la cola
      setProfessionals(extractUniqueProfessionals(transformedQueue))
      setRooms(extractUniqueRooms(transformedQueue))
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setInitialLoading(false)
      setIsRefreshing(false)
    }
  }, [queue.length])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
        async (payload) => {
          console.log('[Realtime] Daily queue change:', payload.eventType, payload)

          // ═══════════════════════════════════════════════════════════
          // FASE 1 - ACTUALIZACIÓN GRANULAR (sin fetchData completo)
          // ═══════════════════════════════════════════════════════════

          if (payload.eventType === 'INSERT') {
            // Necesitamos hacer una query con joins para obtener datos completos
            const { data, error } = await supabase
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
                created_by,
                service:service_id (name),
                professional:professional_id (first_name, last_name),
                room:room_id (name)
              `)
              .eq('id', payload.new.id)
              .single()

            if (!error && data) {
              const newItem = transformQueueItem(data)

              setQueue(prev => {
                // Eliminar temporales con el mismo DNI/nombre (fueron reemplazados)
                const withoutTemp = prev.filter(p =>
                  !(p.id.startsWith('temp-') &&
                    p.patient_dni === newItem.patient_dni &&
                    p.patient_name === newItem.patient_name)
                )

                // Verificar que no exista ya (evitar duplicados)
                if (withoutTemp.some(p => p.id === newItem.id)) {
                  return withoutTemp
                }

                // Agregar el nuevo item y ordenar por order_number
                return [...withoutTemp, newItem].sort((a, b) => a.order_number - b.order_number)
              })
            }
          }
          else if (payload.eventType === 'UPDATE') {
            // Para UPDATE, payload.new ya tiene el ID, podemos actualizar directamente
            const { data, error } = await supabase
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
                created_by,
                service:service_id (name),
                professional:professional_id (first_name, last_name),
                room:room_id (name)
              `)
              .eq('id', payload.new.id)
              .single()

            if (!error && data) {
              const updatedItem = transformQueueItem(data)

              setQueue(prev => prev.map(item =>
                item.id === updatedItem.id ? updatedItem : item
              ))
            }
          }
          else if (payload.eventType === 'DELETE') {
            setQueue(prev => prev.filter(item => item.id !== payload.old.id))
          }
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

    // FILTRO AUTOMÁTICO: Según el rol del usuario, filtrar por asignaciones
    // (a menos que sea admin/administrativo que pueden ver todo)
    const contextData = localStorage.getItem('institution_context')
    if (contextData) {
      const context = JSON.parse(contextData)
      const userRole = context.user_role

      // ROLES DE GESTIÓN: ven TODO
      if (userRole === 'admin' || userRole === 'administrativo') {
        // No aplicar filtro, verán todos los pacientes
      }
      // ROLES CON ASIGNACIONES: filtrar por asignaciones
      else {
        let hasAsignations = false

        // Si el usuario está asignado a profesionales específicos (médico)
        if (userProfessionals.length > 0) {
          hasAsignations = true
          const userProfessionalIds = userProfessionals.map(p => p.professional_id)
          filtered = filtered.filter(item => userProfessionalIds.includes(item.professional_id))
        }

        // Si el usuario está asignado a servicios específicos (enfermería)
        if (userServices.length > 0) {
          hasAsignations = true
          const userServiceIds = userServices.map(s => s.id)
          filtered = filtered.filter(item => userServiceIds.includes(item.service_id))
        }

        // Si NO tiene asignaciones y NO es admin: NO VER NADA
        // (Seguridad: un usuario sin asignaciones no debe ver la cola)
        if (!hasAsignations) {
          filtered = []
        }
      }
    }

    // Filtro manual por servicio (solo aplica si el usuario puede ver múltiples servicios)
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
  }, [selectedServiceFilter, selectedProfessionalFilter, selectedRoomFilter, selectedStatusFilter, queue, userServices, userProfessionals])



  const handleAddPatient = async (data: {
    patientName: string
    patientDni: string
    selectedOptions: string[]
    initialStatus: 'pendiente' | 'disponible'
  }) => {
    const { patientName, patientDni, selectedOptions, initialStatus } = data

    try {
      const context = getInstitutionContext()
      if (!context) return

      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id

      const today = getTodayISO()
      const now = getNowISO()

      // ═══════════════════════════════════════════════════════════
      // FASE 1 - ACTUALIZACIÓN OPTIMISTA
      // ═══════════════════════════════════════════════════════════

      // 1️⃣ Generar items optimistas (uno por cada opción seleccionada)
      const baseOrderNumber = getNextOrderNumber(queue)
      const optimisticItems: any[] = []

      for (let i = 0; i < selectedOptions.length; i++) {
        const optionId = selectedOptions[i]
        const option = attentionOptions.find(o => o.id === optionId)

        if (!option) continue

        // Buscar nombres desde las listas locales
        const serviceName = option.type === 'service'
          ? services.find(s => s.id === option.service_id)?.name || 'Cargando...'
          : ''

        const assignment = professionalAssignments.find(
          a => a.professional_id === option.professional_id
        )

        // Preparar los datos del estado inicial
        const statusData = initialStatus === 'disponible'
          ? {
              status: 'disponible',
              enabled_at: now
            }
          : {
              status: 'pendiente',
              enabled_at: null
            }

        const optimisticItem: any = {
          id: generateTempId(i),
          order_number: baseOrderNumber + i,
          patient_name: patientName,
          patient_dni: patientDni,
          service_id: option.service_id || '',
          service_name: serviceName,
          professional_id: option.professional_id,
          professional_name: assignment?.professional_name || null,
          room_id: option.room_id,
          room_name: assignment?.room_name || null,
          ...statusData,
          created_at: now,
          called_at: null,
          attended_at: null,
          created_by: userId
        }

        optimisticItems.push(optimisticItem)
      }

      // 2️⃣ Actualizar UI inmediatamente
      setQueue(prev => [...prev, ...optimisticItems])

      // 3️⃣ Cerrar diálogo INMEDIATAMENTE (UX mejorada)
      setIsDialogOpen(false)

      // ═══════════════════════════════════════════════════════════
      // FASE 2 - INSERCIÓN EN BACKGROUND
      // ═══════════════════════════════════════════════════════════
      setIsSaving(true)

      for (let i = 0; i < selectedOptions.length; i++) {
        const optionId = selectedOptions[i]
        const option = attentionOptions.find(o => o.id === optionId)

        if (!option) continue

        // Obtener siguiente número de orden REAL del servidor
        const { data: nextNumber, error: rpcError } = await supabase
          .rpc('get_next_order_number', {
            p_institution_id: context.institution_id,
            p_date: today
          })

        if (rpcError) throw rpcError

        // Preparar datos del registro
        const queueEntry: any = {
          order_number: nextNumber,
          patient_name: patientName,
          patient_dni: patientDni,
          institution_id: context.institution_id,
          queue_date: today,
          status: initialStatus,
          created_by: userId
        }

        // Si se carga como disponible, agregar enabled_at
        if (initialStatus === 'disponible') {
          queueEntry.enabled_at = now
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

        const { error: insertError } = await supabase
          .from('daily_queue')
          .insert(queueEntry)

        if (insertError) throw insertError
      }

      // ✅ Supabase Realtime sincronizará automáticamente los IDs reales
      // ✅ NO llamamos a fetchData() → Optimización clave

    } catch (error) {
      console.error('Error al agregar paciente:', error)

      // ═══════════════════════════════════════════════════════════
      // FASE 3 - ROLLBACK EN CASO DE ERROR
      // ═══════════════════════════════════════════════════════════
      // Eliminar todos los items temporales
      setQueue(prev => prev.filter(item => !item.id.startsWith('temp-')))

      alert('Error al agregar paciente. Por favor intente nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const updateStatus = async (id: string, newStatus: QueueItem['status']) => {
    // Guardar estado previo para rollback
    const previousQueue = queue

    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id

      // Construir actualizaciones según el nuevo estado
      const updates = buildStatusUpdates(newStatus, userId)

      // ═══════════════════════════════════════════════════════════
      // FASE 1 - ACTUALIZACIÓN OPTIMISTA
      // ═══════════════════════════════════════════════════════════

      // 1️⃣ Actualizar UI inmediatamente
      setQueue(prev => prev.map(item =>
        item.id === id
          ? { ...item, ...updates }
          : item
      ))

      // 2️⃣ Efectos visuales específicos
      if (newStatus === 'llamado') {
        setCallingId(id)
      }

      // ═══════════════════════════════════════════════════════════
      // FASE 2 - ACTUALIZACIÓN EN SUPABASE (BACKGROUND)
      // ═══════════════════════════════════════════════════════════
      const { error } = await supabase
        .from('daily_queue')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // ✅ NO llamamos a fetchData() → Realtime sincronizará

      // Si se está llamando, esperar el tiempo de los dos anuncios TTS
      if (newStatus === 'llamado') {
        setTimeout(() => {
          setCallingId(null)
        }, 11000) // 11 segundos para ambos llamados completos
      }

    } catch (error) {
      console.error('Error al actualizar estado:', error)

      // ═══════════════════════════════════════════════════════════
      // FASE 3 - ROLLBACK
      // ═══════════════════════════════════════════════════════════
      setQueue(previousQueue)
      setCallingId(null)

      alert('Error al actualizar estado. Por favor intente nuevamente.')
    }
  }

  if (permissionLoading || initialLoading) {
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
          <QueueStats
            totalCount={queue.length}
            filteredCount={filteredQueue.length}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Cargar Paciente
          </Button>
          <AddPatientDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            attentionOptions={attentionOptions}
            onSubmit={handleAddPatient}
          />
        </div>
      </div>

      {/* Filtros Avanzados */}
      <QueueFilters
        selectedServiceFilter={selectedServiceFilter}
        selectedProfessionalFilter={selectedProfessionalFilter}
        selectedRoomFilter={selectedRoomFilter}
        selectedStatusFilter={selectedStatusFilter}
        onServiceFilterChange={setSelectedServiceFilter}
        onProfessionalFilterChange={setSelectedProfessionalFilter}
        onRoomFilterChange={setSelectedRoomFilter}
        onStatusFilterChange={setSelectedStatusFilter}
        services={services}
        professionals={professionals}
        rooms={rooms}
        userServices={userServices}
        onClearFilters={() => {
          setSelectedServiceFilter('ALL')
          setSelectedProfessionalFilter('ALL')
          setSelectedRoomFilter('ALL')
          setSelectedStatusFilter('ALL')
        }}
      />

      {/* Leyenda de colores */}
      <StatusLegend />

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
          {filteredQueue.map((item: any) => (
            <PatientCard
              key={item.id}
              item={item}
              isOptimistic={item.id.startsWith('temp-')}
              callingId={callingId}
              onUpdateStatus={updateStatus}
              currentUserId={currentUserId}
              createdBy={item.created_by}
            />
          ))}
        </div>
      )}
    </div>
  )
}
