'use client'

import { ServiceGroup } from './grid-layout'
import { getServiceColors, getServiceIcon } from '@/lib/service-colors'
import { Badge } from '@/components/ui/badge'
import { UserIcon, MapPinIcon } from 'lucide-react'

const statusLabels: Record<string, string> = {
  'pendiente': 'Pendiente',
  'disponible': 'Disponible',
  'llamado': 'Llamado',
  'atendido': 'Atendido'
}

const statusColors: Record<string, string> = {
  'pendiente': 'bg-gray-100 text-gray-800',
  'disponible': 'bg-blue-100 text-blue-800',
  'llamado': 'bg-purple-100 text-purple-800 animate-pulse',
  'atendido': 'bg-green-100 text-green-800'
}

interface ListLayoutProps {
  services: ServiceGroup[]
}

export function ListLayout({ services }: ListLayoutProps) {
  return (
    <div className="space-y-4">
      {services.map((service) => {
        const colors = getServiceColors(service.serviceName)
        const icon = getServiceIcon(service.serviceName)
        const currentCall = service.appointments.find(apt => apt.status === 'llamado')
        const waiting = service.appointments.filter(apt => apt.status === 'disponible')

        return (
          <div
            key={service.serviceName}
            className={`border-l-8 ${colors.border} bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg`}
          >
            {/* Header del Servicio */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
              <span className="text-4xl">{icon}</span>
              <h3 className={`text-2xl font-bold ${colors.text}`}>{service.serviceName}</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Llamado Actual */}
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase">Llamado Actual</h4>
                {currentCall ? (
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 animate-pulse">
                    <div className="mb-2">
                      <Badge className={statusColors['llamado']}>
                        🔔 {statusLabels['llamado']}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-900 font-bold text-xl">
                        <UserIcon className="h-5 w-5" />
                        {currentCall.patient_name}
                      </div>
                      <div className="text-gray-600 text-lg">
                        Nº {String(currentCall.order_number).padStart(3, '0')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-gray-500">Sin llamados activos</p>
                  </div>
                )}
              </div>

              {/* Próximos */}
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase">
                  Próximos en Espera ({waiting.length})
                </h4>
                {waiting.length > 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-2">
                      {waiting.slice(0, 5).map((apt, idx) => (
                        <div
                          key={apt.id}
                          className="flex items-center gap-3 bg-white p-2 rounded"
                        >
                          <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">
                            {String(apt.order_number).padStart(3, '0')}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {apt.patient_name}
                          </span>
                        </div>
                      ))}
                      {waiting.length > 5 && (
                        <p className="text-sm text-gray-600 text-center mt-2">
                          +{waiting.length - 5} personas más en espera
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-gray-500">No hay pacientes en espera</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay servicios activos en este momento</p>
        </div>
      )}
    </div>
  )
}
