/**
 * Service Fixtures
 * Factories para crear datos de prueba de Servicios
 */

import type { Service } from '@/lib/types'

/**
 * Crea un servicio mínimo válido
 */
export const createService = (overrides?: Partial<Service>): Service => ({
  id: 'service-1',
  institution_id: 'inst-1',
  name: 'Medicina General',
  description: 'Consulta de medicina general',
  duration_minutes: 30,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Crea múltiples servicios
 */
export const createServiceList = (
  count: number = 3,
  institutionId: string = 'inst-1'
): Service[] => {
  const serviceNames = [
    'Medicina General',
    'Pediatría',
    'Cardiología',
    'Dermatología',
    'Oftalmología',
  ]

  const services: Service[] = []
  for (let i = 0; i < count; i++) {
    const name = serviceNames[i % serviceNames.length]
    services.push(
      createService({
        id: `service-${i + 1}`,
        institution_id: institutionId,
        name: `${name} ${i > 0 ? `(${i + 1})` : ''}`,
        duration_minutes: 15 + i * 5,
      })
    )
  }
  return services
}

/**
 * Servicios de ejemplo
 */
export const mockMedicineGeneral: Service = {
  id: 'service-med-general-1',
  institution_id: 'inst-1',
  name: 'Medicina General',
  description: 'Consulta de medicina general',
  duration_minutes: 30,
  is_active: true,
  created_at: '2025-01-05T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockPediatrics: Service = {
  id: 'service-ped-1',
  institution_id: 'inst-1',
  name: 'Pediatría',
  description: 'Consulta pediátrica',
  duration_minutes: 25,
  is_active: true,
  created_at: '2025-01-05T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockCardiology: Service = {
  id: 'service-cardio-1',
  institution_id: 'inst-1',
  name: 'Cardiología',
  description: 'Consulta cardiológica',
  duration_minutes: 45,
  is_active: true,
  created_at: '2025-01-05T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockDermatology: Service = {
  id: 'service-derma-1',
  institution_id: 'inst-1',
  name: 'Dermatología',
  description: 'Consulta dermatológica',
  duration_minutes: 20,
  is_active: true,
  created_at: '2025-01-05T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

/**
 * Servicio inactivo
 */
export const mockServiceInactive: Service = {
  id: 'service-inactive-1',
  institution_id: 'inst-1',
  name: 'Servicio Deprecado',
  description: 'Servicio ya no disponible',
  duration_minutes: 30,
  is_active: false,
  created_at: '2025-02-01T08:00:00Z',
  updated_at: '2025-10-20T14:00:00Z',
}

/**
 * Servicio con duración corta
 */
export const mockServiceShort: Service = {
  id: 'service-short-1',
  institution_id: 'inst-1',
  name: 'Consulta Rápida',
  description: 'Consulta rápida de seguimiento',
  duration_minutes: 10,
  is_active: true,
  created_at: '2025-03-01T08:00:00Z',
  updated_at: '2025-10-18T14:00:00Z',
}

/**
 * Servicio con duración larga
 */
export const mockServiceLong: Service = {
  id: 'service-long-1',
  institution_id: 'inst-1',
  name: 'Evaluación Completa',
  description: 'Evaluación completa y detallada',
  duration_minutes: 90,
  is_active: true,
  created_at: '2025-03-01T08:00:00Z',
  updated_at: '2025-10-18T14:00:00Z',
}

/**
 * Servicio mínimo sin descripción
 */
export const mockServiceMinimal: Service = {
  id: 'service-minimal-1',
  institution_id: 'inst-1',
  name: 'Servicio X',
  duration_minutes: 30,
  is_active: true,
  created_at: '2025-10-22T00:00:00Z',
  updated_at: '2025-10-22T00:00:00Z',
}
