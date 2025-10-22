/**
 * Zone Fixtures
 * Factories para crear datos de prueba de Zonas
 */

import type { Zone } from '@/lib/types'

/**
 * Crea una zona mínima válida
 */
export const createZone = (overrides?: Partial<Zone>): Zone => ({
  id: 'zone-1',
  name: 'Zona Centro',
  description: 'Zona del centro de la ciudad',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Crea múltiples zonas para testing
 */
export const createZoneList = (count: number = 3): Zone[] => {
  const zones: Zone[] = []
  for (let i = 1; i <= count; i++) {
    zones.push(
      createZone({
        id: `zone-${i}`,
        name: `Zona ${i}`,
        description: `Descripción de la zona ${i}`,
      })
    )
  }
  return zones
}

/**
 * Zona de ejemplo completa con todos los campos
 */
export const mockZone: Zone = {
  id: 'zone-complete-1',
  name: 'Zona Metropolitana',
  description: 'Zona metropolitana con múltiples instituciones',
  created_at: '2025-10-01T10:00:00Z',
  updated_at: '2025-10-15T14:30:00Z',
}

/**
 * Zona mínima (solo campos requeridos)
 */
export const mockZoneMinimal: Zone = {
  id: 'zone-minimal-1',
  name: 'Zona Nueva',
  created_at: '2025-10-22T00:00:00Z',
  updated_at: '2025-10-22T00:00:00Z',
}
