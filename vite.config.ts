import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'tests/**'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'cli/bin': resolve(__dirname, 'src/cli/bin.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'better-sqlite3',
        'chalk',
        'commander',
        'cosmiconfig',
        'fast-glob',
        'gray-matter',
        'handlebars',
        'ignore',
        'inquirer',
        'js-yaml',
        'ora',
        'simple-git',
        'zod',
        'fs',
        'fs/promises',
        'path',
        'os',
        'url',
        'crypto',
        'child_process',
        'zlib',
        'events',
        'process',
        'stream',
        'http',
        'net',
        'util',
        '@anthropic-ai/sdk',
        '@modelcontextprotocol/sdk/server/stdio.js',
        '@modelcontextprotocol/sdk/server/index.js',
        '@modelcontextprotocol/sdk/types.js',
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
    target: 'node20',
    minify: false,
    sourcemap: true,
  },
});
