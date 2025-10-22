/**
 * Institution Fixtures
 * Factories para crear datos de prueba de Instituciones
 */

import type { Institution, InstitutionType, InstitutionWithZone } from '@/lib/types'
import { createZone } from './zones'

/**
 * Crea una institución mínima válida
 */
export const createInstitution = (overrides?: Partial<Institution>): Institution => ({
  id: 'inst-1',
  zone_id: 'zone-1',
  name: 'Hospital Centro',
  type: 'hospital_regional' as InstitutionType,
  slug: 'hospital-centro',
  address: 'Calle Principal 123',
  phone: '+54 11 1234-5678',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Crea una institución con su zona relacionada
 */
export const createInstitutionWithZone = (
  overrides?: Partial<Institution>
): InstitutionWithZone => {
  const institution = createInstitution(overrides)
  const zone = createZone({ id: institution.zone_id })
  return {
    ...institution,
    zone,
  }
}

/**
 * Crea múltiples instituciones
 */
export const createInstitutionList = (
  count: number = 3,
  zoneId: string = 'zone-1'
): Institution[] => {
  const institutions: Institution[] = []
  const types: InstitutionType[] = ['caps', 'hospital_seccional', 'hospital_distrital', 'hospital_regional']

  for (let i = 1; i <= count; i++) {
    const typeIndex = (i - 1) % types.length
    institutions.push(
      createInstitution({
        id: `inst-${i}`,
        zone_id: zoneId,
        name: `Institución ${i}`,
        type: types[typeIndex],
        slug: `institucion-${i}`,
      })
    )
  }
  return institutions
}

/**
 * Ejemplos de diferentes tipos de instituciones
 */
export const mockCaps: Institution = {
  id: 'inst-caps-1',
  zone_id: 'zone-1',
  name: 'CAPS Centro',
  type: 'caps',
  slug: 'caps-centro',
  address: 'Av. Principal 100',
  phone: '+54 11 2000-1000',
  created_at: '2025-01-15T08:00:00Z',
  updated_at: '2025-10-20T10:30:00Z',
}

export const mockHospitalSeccional: Institution = {
  id: 'inst-hosp-sec-1',
  zone_id: 'zone-1',
  name: 'Hospital Seccional Norte',
  type: 'hospital_seccional',
  slug: 'hospital-norte',
  address: 'Calle Norte 500',
  phone: '+54 11 3000-2000',
  created_at: '2025-02-01T08:00:00Z',
  updated_at: '2025-10-18T14:00:00Z',
}

export const mockHospitalDistrital: Institution = {
  id: 'inst-hosp-dist-1',
  zone_id: 'zone-1',
  name: 'Hospital Distrital Este',
  type: 'hospital_distrital',
  slug: 'hospital-este',
  address: 'Calle Este 750',
  phone: '+54 11 4000-3000',
  created_at: '2025-03-01T08:00:00Z',
  updated_at: '2025-10-19T11:15:00Z',
}

export const mockHospitalRegional: Institution = {
  id: 'inst-hosp-reg-1',
  zone_id: 'zone-1',
  name: 'Hospital Regional',
  type: 'hospital_regional',
  slug: 'hospital-regional',
  address: 'Av. Metropolitana 1000',
  phone: '+54 11 5000-4000',
  created_at: '2025-01-01T08:00:00Z',
  updated_at: '2025-10-20T09:45:00Z',
}

/**
 * Institución mínima sin dirección ni teléfono
 */
export const mockInstitutionMinimal: Institution = {
  id: 'inst-minimal-1',
  zone_id: 'zone-1',
  name: 'Institución Mínima',
  type: 'caps',
  slug: 'institucion-minima',
  created_at: '2025-10-22T00:00:00Z',
  updated_at: '2025-10-22T00:00:00Z',
}
