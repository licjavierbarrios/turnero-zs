'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getServiceColors, getServiceIcon } from '@/lib/service-colors'
import { UserIcon, MapPinIcon, ClockIcon } from 'lucide-react'

export interface ServiceAppointment {
  id: string
  patient_name: string // Nombre completo del paciente (daily_queue structure)
  order_number: number // Número de orden en la cola
  professional_first_name?: string
  professional_last_name?: string
  room_name?: string
  scheduled_at?: string // Opcional ya que daily_queue usa order_number
  status: string
  is_sensitive?: boolean
}

interface ServiceCardProps {
  serviceName: string
  appointments: ServiceAppointment[]
  compact?: boolean
  announcingAppointmentId?: string | null
}

const statusLabels: Record<string, string> = {
  'pendiente': 'Pendiente',
  'disponible': 'Disponible',
  'llamado': 'Llamado',
  'atendido': 'Atendido',
  'en_consulta': 'En consulta'
}

const statusColors: Record<string, string> = {
  'pendiente': 'bg-gray-100 text-gray-800',
  'disponible': 'bg-blue-100 text-blue-800',
  'llamado': 'bg-purple-100 text-purple-800 animate-pulse',
  'atendido': 'bg-green-100 text-green-800',
  'en_consulta': 'bg-green-100 text-green-800'
}

export function ServiceCard({ serviceName, appointments, compact = false, announcingAppointmentId }: ServiceCardProps) {
  const colors = getServiceColors(serviceName)
  const icon = getServiceIcon(serviceName)

  const currentCall = appointments.find(apt => apt.status === 'llamado')
  const isAnnouncing = !!currentCall && currentCall.id === announcingAppointmentId
  const inConsultation = appointments.filter(apt => apt.status === 'en_consulta')
  const waiting = appointments.filter(apt => apt.status === 'disponible')

  return (
    <Card className={`border-2 ${colors.border} ${colors.bg} transition-all hover:shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-lg ${colors.text}`}>
          <span className="text-2xl">{icon}</span>
          <span className="font-bold">{serviceName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Llamado Actual */}
        {currentCall ? (
          <div className={`p-3 bg-white rounded-lg border-2 shadow-sm transition-all ${isAnnouncing ? 'border-yellow-400 animate-pulse' : 'border-purple-300'}`}>
            <div className="flex items-center gap-1 mb-2">
              {isAnnouncing ? (
                <Badge className="bg-yellow-400 text-yellow-900 animate-pulse">
                  🔔 Llamando...
                </Badge>
              ) : (
                <Badge className={statusColors['llamado']}>
                  🔔 {statusLabels['llamado']}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              {currentCall.is_sensitive ? (
                <div className="text-gray-900 font-bold text-2xl">
                  {String(currentCall.order_number).padStart(3, '0')}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                    <UserIcon className="h-4 w-4" />
                    {currentCall.patient_name}
                  </div>
                  <div className="text-gray-600 text-sm">
                    Nº {String(currentCall.order_number).padStart(3, '0')}
                  </div>
                </>
              )}
              {currentCall.room_name && (
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <MapPinIcon className="h-3 w-3" />
                  {currentCall.room_name}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-white/50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm text-center">Sin llamados activos</p>
          </div>
        )}

        {/* En Consulta */}
        {inConsultation.length > 0 && !compact && (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">EN CONSULTA:</p>
            <div className="space-y-1">
              {inConsultation.slice(0, 2).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between text-xs bg-white/70 p-2 rounded"
                >
                  <span className="text-gray-700">
                    {apt.patient_name}
                  </span>
                  {apt.room_name && (
                    <span className="text-gray-500">{apt.room_name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximos */}
        {waiting.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">
              PRÓXIMOS ({waiting.length}):
            </p>
            <div className="space-y-1">
              {waiting.slice(0, compact ? 2 : 3).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-2 text-xs bg-white/70 p-2 rounded"
                >
                  <span className="text-gray-500 font-semibold">
                    {String(apt.order_number).padStart(3, '0')}
                  </span>
                  {!apt.is_sensitive && (
                    <span className="text-gray-700 flex-1">
                      {apt.patient_name}
                    </span>
                  )}
                </div>
              ))}
              {waiting.length > (compact ? 2 : 3) && (
                <p className="text-xs text-gray-500 text-center mt-1">
                  +{waiting.length - (compact ? 2 : 3)} más...
                </p>
              )}
            </div>
          </div>
        )}

        {waiting.length === 0 && inConsultation.length === 0 && !currentCall && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-400">No hay pacientes en espera</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
