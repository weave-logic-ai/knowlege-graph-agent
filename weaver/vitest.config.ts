import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // CRITICAL: Run tests sequentially to prevent lockups
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run one test file at a time
      },
    },
    // CRITICAL: Only run tests in our tests/ directory
    include: ['tests/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{git,cache,output,temp}/**',
    ],
    // Prevent infinite loops and hangs
    testTimeout: 30000, // 30 seconds max per test
    hookTimeout: 10000, // 10 seconds for setup/teardown
    teardownTimeout: 5000,
    // Don't bail - finish what we can
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/index.ts',
      ],
      lines: 90,
      functions: 90,
      branches: 85,
      statements: 90,
    },
  },
});
