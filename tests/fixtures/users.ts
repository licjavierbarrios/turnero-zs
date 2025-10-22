/**
 * User Fixtures
 * Factories para crear datos de prueba de Usuarios del Sistema
 */

import type { User } from '@/lib/types'

/**
 * Crea un usuario mínimo válido
 */
export const createUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  email: 'usuario@hospital.com',
  password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz', // Hash de ejemplo
  first_name: 'Usuario',
  last_name: 'Prueba',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Crea múltiples usuarios
 */
export const createUserList = (count: number = 5): User[] => {
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Roberto']
  const lastNames = ['Pérez', 'García', 'Martínez', 'López', 'Rodríguez']

  const users: User[] = []
  for (let i = 1; i <= count; i++) {
    const firstNameIdx = (i - 1) % firstNames.length
    const lastNameIdx = (i - 1) % lastNames.length

    users.push(
      createUser({
        id: `user-${i}`,
        email: `user${i}@hospital.com`,
        first_name: firstNames[firstNameIdx],
        last_name: lastNames[lastNameIdx],
      })
    )
  }
  return users
}

/**
 * Usuarios de ejemplo con diferentes roles
 */
export const mockUserAdmin: User = {
  id: 'user-admin-1',
  email: 'admin@hospital.com',
  password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
  first_name: 'Administrador',
  last_name: 'Sistema',
  is_active: true,
  created_at: '2025-01-01T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockUserAdministrativo: User = {
  id: 'user-admin-staff-1',
  email: 'administrativo@hospital.com',
  password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
  first_name: 'Personal',
  last_name: 'Administrativo',
  is_active: true,
  created_at: '2025-01-01T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockUserDoctor: User = {
  id: 'user-doctor-1',
  email: 'doctor@hospital.com',
  password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
  first_name: 'Juan',
  last_name: 'Médico',
  is_active: true,
  created_at: '2025-01-08T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockUserNurse: User = {
  id: 'user-nurse-1',
  email: 'enfermera@hospital.com',
  password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
  first_name: 'María',
  last_name: 'Enfermería',
  is_active: true,
  created_at: '2025-01-08T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockUserDisplay: User = {
  id: 'user-display-1',
  email: 'pantalla@hospital.com',
  password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
  first_name: 'Pantalla',
  last_name: 'Pública',
  is_active: true,
  created_at: '2025-01-10T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

/**
 * Usuario inactivo
 */
export const mockUserInactive: User = {
  id: 'user-inactive-1',
  email: 'inactivo@hospital.com',
  password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
  first_name: 'Usuario',
  last_name: 'Deshabilitado',
  is_active: false,
  created_at: '2025-02-01T08:00:00Z',
  updated_at: '2025-10-20T14:00:00Z',
}

/**
 * Usuario mínimo
 */
export const mockUserMinimal: User = {
  id: 'user-minimal-1',
  email: 'newuser@hospital.com',
  password_hash: '$2a$10$newuserhash',
  first_name: 'Nuevo',
  last_name: 'Usuario',
  is_active: true,
  created_at: '2025-10-22T00:00:00Z',
  updated_at: '2025-10-22T00:00:00Z',
}
