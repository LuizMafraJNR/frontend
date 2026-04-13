import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'layers/**/tests/**/*.test.ts',
      'layers/**/*.test.ts',
      'tests/unit/**/*.test.ts',
    ],
    exclude: [
      'node_modules',
      '.nuxt',
      '.storybook',
      '**/*.stories.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.nuxt/',
        '.storybook/',
        '**/*.stories.ts',
        '**/nuxt.config.ts',
        'tests/setup.ts',
      ],
      thresholds: {
        // Targets mínimos de coverage — ver docs/testing.md
        lines: 60,
        functions: 60,
      },
    },
  },
})
