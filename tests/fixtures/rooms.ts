/**
 * Room Fixtures
 * Factories para crear datos de prueba de Consultorios/Salas
 */

import type { Room } from '@/lib/types'
import { createInstitution } from './institutions'

/**
 * Crea una sala/consultorio mínimo válido
 */
export const createRoom = (overrides?: Partial<Room>): Room => ({
  id: 'room-1',
  institution_id: 'inst-1',
  name: 'Consultorio 1',
  description: 'Consultorio general',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Crea múltiples salas
 */
export const createRoomList = (
  count: number = 3,
  institutionId: string = 'inst-1'
): Room[] => {
  const rooms: Room[] = []
  for (let i = 1; i <= count; i++) {
    rooms.push(
      createRoom({
        id: `room-${i}`,
        institution_id: institutionId,
        name: `Consultorio ${i}`,
        description: `Sala de consulta ${i}`,
      })
    )
  }
  return rooms
}

/**
 * Consultorios de ejemplo
 */
export const mockRoom1: Room = {
  id: 'room-cons-1',
  institution_id: 'inst-1',
  name: 'Consultorio A',
  description: 'Consultorio de medicina general',
  is_active: true,
  created_at: '2025-01-10T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockRoom2: Room = {
  id: 'room-cons-2',
  institution_id: 'inst-1',
  name: 'Consultorio B',
  description: 'Consultorio de pediatría',
  is_active: true,
  created_at: '2025-01-10T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

export const mockRoom3: Room = {
  id: 'room-cons-3',
  institution_id: 'inst-1',
  name: 'Consultorio C',
  description: 'Consultorio de cardiología',
  is_active: true,
  created_at: '2025-01-10T08:00:00Z',
  updated_at: '2025-10-15T10:30:00Z',
}

/**
 * Sala inactiva
 */
export const mockRoomInactive: Room = {
  id: 'room-inactive-1',
  institution_id: 'inst-1',
  name: 'Consultorio D (Cerrado)',
  description: 'Consultorio en mantenimiento',
  is_active: false,
  created_at: '2025-02-01T08:00:00Z',
  updated_at: '2025-10-20T14:00:00Z',
}

/**
 * Sala mínima sin descripción
 */
export const mockRoomMinimal: Room = {
  id: 'room-minimal-1',
  institution_id: 'inst-1',
  name: 'Sala 1',
  is_active: true,
  created_at: '2025-10-22T00:00:00Z',
  updated_at: '2025-10-22T00:00:00Z',
}
