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
        isolate: true, // Isolate each test file in its own process
        execArgv: ['--max-old-space-size=2048'], // Limit memory per fork
      },
    },
    // CRITICAL: Aggressive rate limiting to prevent MainThread explosion
    maxConcurrency: 1, // Only 1 test running at a time within a file
    maxWorkers: 1, // Only 1 worker process at a time
    minWorkers: 1, // Keep at least 1 worker (same as max for consistency)

    // CRITICAL: Additional thread safety measures
    fileParallelism: false, // Disable parallel file execution completely
    sequence: {
      concurrent: false, // Force sequential execution
      shuffle: false, // Don't shuffle (predictable order)
    },

    // CRITICAL: Only run tests in our tests/ directory
    include: ['tests/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{git,cache,output,temp}/**',
      '**/.next/**',
      '**/coverage/**',
    ],
    // Prevent infinite loops and hangs
    testTimeout: 30000, // 30 seconds max per test
    hookTimeout: 10000, // 10 seconds for setup/teardown
    teardownTimeout: 5000,

    // Aggressive timeouts to catch hanging tests quickly
    bail: 0, // Don't bail early - run all tests
    retry: 0, // Don't retry failed tests automatically

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
