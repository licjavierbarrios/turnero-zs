/**
 * Professional Fixtures
 * Factories para crear datos de prueba de Profesionales
 */

import type { Professional } from '@/lib/types'

/**
 * Crea un profesional mínimo válido
 */
export const createProfessional = (overrides?: Partial<Professional>): Professional => ({
  id: 'prof-1',
  institution_id: 'inst-1',
  first_name: 'Juan',
  last_name: 'Pérez',
  speciality: 'Medicina General',
  license_number: 'MP-123456',
  email: 'juan.perez@hospital.com',
  phone: '+54 11 1234-5678',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Crea múltiples profesionales
 */
export const createProfessionalList = (
  count: number = 3,
  institutionId: string = 'inst-1'
): Professional[] => {
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Roberto']
  const lastNames = ['Pérez', 'García', 'Martínez', 'López', 'Rodríguez']
  const specialities = [
    'Medicina General',
    'Pediatría',
    'Cardiología',
    'Dermatología',
  ]

  const professionals: Professional[] = []
  for (let i = 1; i <= count; i++) {
    const firstNameIdx = (i - 1) % firstNames.length
    const lastNameIdx = (i - 1) % lastNames.length
    const specialityIdx = (i - 1) % specialities.length

    professionals.push(
      createProfessional({
        id: `prof-${i}`,
        institution_id: institutionId,
        first_name: firstNames[firstNameIdx],
        last_name: lastNames[lastNameIdx],
        speciality: specialities[specialityIdx],
        license_number: `MP-${String(i).padStart(6, '0')}`,
        email: `prof${i}@hospital.com`,
      })
    )
  }
  return professionals
}

/**
 * Profesionales de ejemplo
 */
export const mockDoctorGeneral: Professional = {
  id: 'prof-doc-general-1',
  institution_id: 'inst-1',
  first_name: 'Juan',
  last_name: 'Pérez',
  speciality: 'Medicina General',
  license_number: 'MP-123456',
  email: 'juan.perez@hospital.com',
  phone: '+54 11 1234-5678',
  is_active: true,
  created_at: '2025-01-08T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockPediatrician: Professional = {
  id: 'prof-ped-1',
  institution_id: 'inst-1',
  first_name: 'María',
  last_name: 'García',
  speciality: 'Pediatría',
  license_number: 'MP-234567',
  email: 'maria.garcia@hospital.com',
  phone: '+54 11 2345-6789',
  is_active: true,
  created_at: '2025-01-08T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockCardiologist: Professional = {
  id: 'prof-cardio-1',
  institution_id: 'inst-1',
  first_name: 'Carlos',
  last_name: 'Martínez',
  speciality: 'Cardiología',
  license_number: 'MP-345678',
  email: 'carlos.martinez@hospital.com',
  phone: '+54 11 3456-7890',
  is_active: true,
  created_at: '2025-01-08T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockDermatologist: Professional = {
  id: 'prof-derma-1',
  institution_id: 'inst-1',
  first_name: 'Ana',
  last_name: 'López',
  speciality: 'Dermatología',
  license_number: 'MP-456789',
  email: 'ana.lopez@hospital.com',
  phone: '+54 11 4567-8901',
  is_active: true,
  created_at: '2025-01-08T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

/**
 * Profesional inactivo
 */
export const mockProfessionalInactive: Professional = {
  id: 'prof-inactive-1',
  institution_id: 'inst-1',
  first_name: 'Roberto',
  last_name: 'Rodríguez',
  speciality: 'Medicina General',
  license_number: 'MP-567890',
  email: 'roberto.rodriguez@hospital.com',
  phone: '+54 11 5678-9012',
  is_active: false,
  created_at: '2025-02-01T08:00:00Z',
  updated_at: '2025-10-20T14:00:00Z',
}

/**
 * Profesional mínimo sin email ni teléfono
 */
export const mockProfessionalMinimal: Professional = {
  id: 'prof-minimal-1',
  institution_id: 'inst-1',
  first_name: 'Nuevo',
  last_name: 'Profesional',
  is_active: true,
  created_at: '2025-10-22T00:00:00Z',
  updated_at: '2025-10-22T00:00:00Z',
}
