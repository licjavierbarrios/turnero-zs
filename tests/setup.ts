import '@testing-library/jest-dom'
import 'whatwg-fetch'
import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Mock de next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/mock-path',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Mock de next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
  }),
  headers: () => ({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
  }),
}))

// Mock del cliente de Supabase (importado globalmente)
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
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
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue({ unsubscribe: vi.fn() }),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}))

// Mock de Web Speech API (para TTS)
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
} as any

global.SpeechSynthesisUtterance = class MockSpeechSynthesisUtterance {
  text = ''
  lang = 'es-AR'
  voice = null
  volume = 1
  rate = 1
  pitch = 1
  onstart = null
  onend = null
  onerror = null
  onpause = null
  onresume = null
  onmark = null
  onboundary = null
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  dispatchEvent = vi.fn()
  constructor(text?: string) {
    if (text) this.text = text
  }
} as any

// Suprimir warnings específicos en tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suprimir warnings de React sobre act() en tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: useLayoutEffect') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.requestSubmit'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: any[]) => {
    // Suprimir warnings específicos si es necesario
    if (typeof args[0] === 'string' && args[0].includes('deprecated')) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Limpiar mocks después de cada test
afterEach(() => {
  vi.clearAllMocks()
})
