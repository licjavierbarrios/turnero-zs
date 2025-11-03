/**
 * Membership Fixtures
 * Factories para crear datos de prueba de Membresías (Usuario-Institución-Rol)
 */

import type { Membership, UserRole } from '@/lib/types'
import { mockUserAdmin, mockUserAdministrativo, mockUserDoctor, mockUserNurse, mockUserDisplay } from './users'
import { mockHospitalRegional } from './institutions'

/**
 * Crea una membresía mínima válida
 */
export const createMembership = (overrides?: Partial<Membership>): Membership => ({
  id: 'membership-1',
  user_id: 'user-1',
  institution_id: 'inst-1',
  role: 'admin' as UserRole,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Crea múltiples membresías para un usuario en diferentes instituciones
 */
export const createMembershipsByUser = (
  userId: string,
  institutionIds: string[],
  roles?: UserRole[]
): Membership[] => {
  const defaultRoles: UserRole[] = ['admin', 'administrativo', 'profesional', 'servicio', 'pantalla']

  return institutionIds.map((instId, idx) =>
    createMembership({
      id: `membership-${userId}-${instId}`,
      user_id: userId,
      institution_id: instId,
      role: roles ? roles[idx % roles.length] : defaultRoles[idx % defaultRoles.length],
    })
  )
}

/**
 * Crea múltiples membresías para una institución
 */
export const createMembershipsByInstitution = (
  institutionId: string,
  userIds: string[],
  roles?: UserRole[]
): Membership[] => {
  const defaultRoles: UserRole[] = ['admin', 'administrativo', 'profesional', 'servicio', 'pantalla']

  return userIds.map((userId, idx) =>
    createMembership({
      id: `membership-${userId}-${institutionId}`,
      user_id: userId,
      institution_id: institutionId,
      role: roles ? roles[idx % roles.length] : defaultRoles[idx % defaultRoles.length],
    })
  )
}

/**
 * Membresías de ejemplo - Admin en Hospital
 */
export const mockMembershipAdminHospital: Membership = {
  id: 'membership-admin-hosp-1',
  user_id: mockUserAdmin.id,
  institution_id: mockHospitalRegional.id,
  role: 'admin',
  is_active: true,
  created_at: '2025-01-01T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
  user: mockUserAdmin,
  institution: mockHospitalRegional,
}

/**
 * Membresía - Personal Administrativo
 */
export const mockMembershipAdministrativo: Membership = {
  id: 'membership-admin-staff-1',
  user_id: mockUserAdministrativo.id,
  institution_id: mockHospitalRegional.id,
  role: 'administrativo',
  is_active: true,
  created_at: '2025-01-01T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
  user: mockUserAdministrativo,
  institution: mockHospitalRegional,
}

/**
 * Membresía - Profesional
 */
export const mockMembershipDoctor: Membership = {
  id: 'membership-doctor-1',
  user_id: mockUserDoctor.id,
  institution_id: mockHospitalRegional.id,
  role: 'profesional',
  is_active: true,
  created_at: '2025-01-08T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
  user: mockUserDoctor,
  institution: mockHospitalRegional,
}

/**
 * Membresía - Servicio
 */
export const mockMembershipNurse: Membership = {
  id: 'membership-nurse-1',
  user_id: mockUserNurse.id,
  institution_id: mockHospitalRegional.id,
  role: 'servicio',
  is_active: true,
  created_at: '2025-01-08T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
  user: mockUserNurse,
  institution: mockHospitalRegional,
}

/**
 * Membresía - Pantalla Pública
 */
export const mockMembershipDisplay: Membership = {
  id: 'membership-display-1',
  user_id: mockUserDisplay.id,
  institution_id: mockHospitalRegional.id,
  role: 'pantalla',
  is_active: true,
  created_at: '2025-01-10T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
  user: mockUserDisplay,
  institution: mockHospitalRegional,
}

/**
 * Membresía inactiva
 */
export const mockMembershipInactive: Membership = {
  id: 'membership-inactive-1',
  user_id: 'user-inactive-1',
  institution_id: mockHospitalRegional.id,
  role: 'profesional',
  is_active: false,
  created_at: '2025-02-01T08:00:00Z',
  updated_at: '2025-10-20T14:00:00Z',
}

/**
 * Membresía mínima sin relaciones expandidas
 */
export const mockMembershipMinimal: Membership = {
  id: 'membership-minimal-1',
  user_id: 'user-1',
  institution_id: 'inst-1',
  role: 'administrativo',
  is_active: true,
  created_at: '2025-10-22T00:00:00Z',
  updated_at: '2025-10-22T00:00:00Z',
}

/**
 * Colección de membresías por rol (para simular usuarios completos con múltiples instituciones)
 */
export const mockMembershipCollection: Membership[] = [
  mockMembershipAdminHospital,
  mockMembershipAdministrativo,
  mockMembershipDoctor,
  mockMembershipNurse,
  mockMembershipDisplay,
]
