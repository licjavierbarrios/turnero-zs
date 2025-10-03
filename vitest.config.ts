import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['**/*.{ts,tsx}'],
      exclude: [
        'node_modules',
        '.next',
        'playwright-report',
        'tests/e2e/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        '**/types.ts',
        'middleware.ts',
        'coverage/**',
        'tests/**',
      ],
      all: true,
      // Metas de cobertura
      thresholds: {
        lines: 70,
        branches: 65,
        functions: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
