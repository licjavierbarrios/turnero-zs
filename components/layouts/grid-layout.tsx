'use client'

import { ServiceCard, ServiceAppointment } from '@/components/service-card'

export interface ServiceGroup {
  serviceName: string
  appointments: ServiceAppointment[]
}

interface GridLayoutProps {
  services: ServiceGroup[]
  columns: 2 | 3 // 2 para grid-2x2, 3 para grid-3x2
}

export function GridLayout({ services, columns }: GridLayoutProps) {
  const gridCols = columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={`grid ${gridCols} gap-6 auto-rows-fr`}>
      {services.map((service) => (
        <ServiceCard
          key={service.serviceName}
          serviceName={service.serviceName}
          appointments={service.appointments}
          compact={columns === 3}
        />
      ))}
    </div>
  )
}
