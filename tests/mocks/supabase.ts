import { vi } from 'vitest'
import type { User, Session } from '@supabase/supabase-js'

// Mock data básico
export const mockUser: Partial<User> = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'authenticated',
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

export const mockSession: Partial<Session> = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser as User,
}

// Factory para crear mock de Supabase client con estado personalizado
export const createMockSupabaseClient = (options?: {
  authenticated?: boolean
  user?: Partial<User>
  queryData?: any
  queryError?: any
}) => {
  const {
    authenticated = false,
    user = mockUser,
    queryData = null,
    queryError = null,
  } = options || {}

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: authenticated
            ? { ...mockSession, user: user as User }
            : null,
        },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: authenticated ? (user as User) : null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {
          session: authenticated
            ? { ...mockSession, user: user as User }
            : null,
          user: authenticated ? (user as User) : null,
        },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: queryData,
        error: queryError,
      }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: queryData,
        error: queryError,
      }),
    })),
    channel: vi.fn((name: string) => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue({
        unsubscribe: vi.fn(),
      }),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  }
}

// Mock de usuario autenticado con rol específico
export const createAuthenticatedMock = (role: 'admin' | 'administrativo' | 'medico' | 'enfermeria' | 'pantalla') => {
  const user: Partial<User> = {
    ...mockUser,
    user_metadata: {
      role,
    },
  }

  return createMockSupabaseClient({
    authenticated: true,
    user,
  })
}

// Mock de operación exitosa con datos
export const createSuccessQueryMock = (data: any) => {
  return createMockSupabaseClient({
    queryData: data,
    queryError: null,
  })
}

// Mock de error de query
export const createErrorQueryMock = (errorMessage: string, code?: string) => {
  return createMockSupabaseClient({
    queryData: null,
    queryError: {
      message: errorMessage,
      code: code || 'PGRST000',
      details: '',
      hint: '',
    },
  })
}

// Mock de Realtime channel con eventos
export const createMockRealtimeChannel = () => {
  const listeners: Record<string, Function[]> = {}

  return {
    on: vi.fn((event: string, callback: Function) => {
      if (!listeners[event]) {
        listeners[event] = []
      }
      listeners[event].push(callback)
      return mockChannel
    }),
    subscribe: vi.fn().mockResolvedValue({
      unsubscribe: vi.fn(),
    }),
    unsubscribe: vi.fn(),
    trigger: (event: string, payload: any) => {
      const eventListeners = listeners[event] || []
      eventListeners.forEach((callback) => callback(payload))
    },
  }
}

const mockChannel = createMockRealtimeChannel()

// Helper para simular cambios en tiempo real
export const simulateRealtimeUpdate = (
  channel: ReturnType<typeof createMockRealtimeChannel>,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  table: string,
  record: any
) => {
  channel.trigger('postgres_changes', {
    eventType,
    schema: 'public',
    table,
    new: eventType !== 'DELETE' ? record : {},
    old: eventType === 'UPDATE' || eventType === 'DELETE' ? record : {},
  })
}
