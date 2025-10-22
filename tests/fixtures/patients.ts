/**
 * Patient Fixtures
 * Factories para crear datos de prueba de Pacientes
 */

import type { Patient } from '@/lib/types'

/**
 * Crea un paciente mínimo válido
 */
export const createPatient = (overrides?: Partial<Patient>): Patient => ({
  id: 'patient-1',
  first_name: 'Pablo',
  last_name: 'González',
  dni: '12345678',
  email: 'pablo.gonzalez@email.com',
  phone: '+54 11 1111-1111',
  address: 'Calle Falsa 123',
  birth_date: '1980-05-15',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Crea múltiples pacientes
 */
export const createPatientList = (count: number = 5): Patient[] => {
  const firstNames = ['Pablo', 'Carmen', 'Diego', 'Lucía', 'Fernando']
  const lastNames = ['González', 'Martín', 'Díaz', 'Rubio', 'Soto']

  const patients: Patient[] = []
  for (let i = 1; i <= count; i++) {
    const firstNameIdx = (i - 1) % firstNames.length
    const lastNameIdx = (i - 1) % lastNames.length

    patients.push(
      createPatient({
        id: `patient-${i}`,
        first_name: firstNames[firstNameIdx],
        last_name: lastNames[lastNameIdx],
        dni: `${String(i).padStart(8, '0')}`,
        email: `patient${i}@email.com`,
        phone: `+54 11 ${String(i).padStart(4, '0')}-${String(i * 1111).padStart(4, '0')}`,
        birth_date: `${1950 + i}-${String((i % 12) + 1).padStart(2, '0')}-15`,
      })
    )
  }
  return patients
}

/**
 * Pacientes de ejemplo
 */
export const mockPatient1: Patient = {
  id: 'patient-complete-1',
  first_name: 'Pablo',
  last_name: 'González',
  dni: '12345678',
  email: 'pablo.gonzalez@email.com',
  phone: '+54 11 1234-5678',
  address: 'Calle Falsa 123, Apt 4B',
  birth_date: '1980-05-15',
  created_at: '2025-01-02T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockPatient2: Patient = {
  id: 'patient-complete-2',
  first_name: 'Carmen',
  last_name: 'Martín',
  dni: '87654321',
  email: 'carmen.martin@email.com',
  phone: '+54 11 5678-9012',
  address: 'Av. Principal 456',
  birth_date: '1975-08-22',
  created_at: '2025-01-02T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockPatient3: Patient = {
  id: 'patient-complete-3',
  first_name: 'Diego',
  last_name: 'Díaz',
  dni: '11223344',
  email: 'diego.diaz@email.com',
  phone: '+54 11 9012-3456',
  address: 'Calle Nueva 789',
  birth_date: '1990-12-03',
  created_at: '2025-01-02T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

/**
 * Paciente mínimo sin contacto
 */
export const mockPatientMinimal: Patient = {
  id: 'patient-minimal-1',
  first_name: 'Juan',
  last_name: 'Pérez',
  created_at: '2025-10-22T00:00:00Z',
  updated_at: '2025-10-22T00:00:00Z',
}

/**
 * Paciente con datos incompletos
 */
export const mockPatientPartial: Patient = {
  id: 'patient-partial-1',
  first_name: 'Ana',
  last_name: 'López',
  dni: '55667788',
  phone: '+54 11 7890-1234',
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-10-18T14:00:00Z',
}

/**
 * Paciente joven
 */
export const mockPatientYoung: Patient = {
  id: 'patient-young-1',
  first_name: 'Lucía',
  last_name: 'García',
  dni: '99887766',
  email: 'lucia.garcia@email.com',
  phone: '+54 11 3333-4444',
  birth_date: '2010-07-20',
  created_at: '2025-02-10T08:00:00Z',
  updated_at: '2025-10-18T14:00:00Z',
}

/**
 * Paciente adulto mayor
 */
export const mockPatientElderly: Patient = {
  id: 'patient-elderly-1',
  first_name: 'Roberto',
  last_name: 'Soto',
  dni: '11002233',
  email: 'roberto.soto@email.com',
  phone: '+54 11 5555-6666',
  address: 'Residencia Geriátrica ABC',
  birth_date: '1940-03-10',
  created_at: '2025-03-01T08:00:00Z',
  updated_at: '2025-10-18T14:00:00Z',
}
