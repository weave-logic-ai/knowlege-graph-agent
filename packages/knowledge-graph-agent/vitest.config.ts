import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
    testTimeout: 30000,
    server: {
      deps: {
        external: [/node_modules/],
      },
    },
  },
  esbuild: {
    target: 'node20',
  },
  optimizeDeps: {
    exclude: ['better-sqlite3'],
  },
});
