'use client'

import { useMemo } from 'react'
import { GridLayout } from './layouts/grid-layout'
import { ListLayout } from './layouts/list-layout'
import { CarouselLayout } from './layouts/carousel-layout'
import { groupAppointmentsByService } from '@/lib/group-appointments'

interface DisplayTemplate {
  id: string
  name: string
  layout_type: 'grid-2x2' | 'grid-3x2' | 'list' | 'carousel'
  service_filter_type: 'all' | 'specific'
  service_ids: string[]
  carousel_interval: number
}

interface PublicAppointment {
  id: string
  patient_first_name: string
  patient_last_name: string
  professional_first_name?: string
  professional_last_name?: string
  service_name: string
  room_name?: string
  scheduled_at: string
  status: string
  display_name?: string // Nombre ya procesado según privacidad
  effective_privacy_level?: string // Nivel de privacidad resuelto
}

interface MultiServiceDisplayProps {
  appointments: PublicAppointment[]
  template: DisplayTemplate | null
}

export function MultiServiceDisplay({ appointments, template }: MultiServiceDisplayProps) {
  // Agrupar appointments por servicio
  const serviceGroups = useMemo(() => {
    return groupAppointmentsByService(appointments)
  }, [appointments])

  // Si no hay template seleccionada, usar vista completa por defecto
  const layoutType = template?.layout_type || 'grid-3x2'
  const carouselInterval = template?.carousel_interval || 8

  // Renderizar el layout correspondiente
  switch (layoutType) {
    case 'grid-2x2':
      return <GridLayout services={serviceGroups} columns={2} />

    case 'grid-3x2':
      return <GridLayout services={serviceGroups} columns={3} />

    case 'list':
      return <ListLayout services={serviceGroups} />

    case 'carousel':
      return <CarouselLayout services={serviceGroups} intervalSeconds={carouselInterval} />

    default:
      return <GridLayout services={serviceGroups} columns={3} />
  }
}
