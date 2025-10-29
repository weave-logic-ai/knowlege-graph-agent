import { defineConfig } from 'vite';
import { workflowRollupPlugin } from 'workflow/rollup-plugin';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, chmodSync, existsSync } from 'fs';

/**
 * Vite Configuration for Weaver
 *
 * Integrates Workflow DevKit compiler for 'use workflow' and 'use step' directives
 */
export default defineConfig({
  plugins: [
    // TypeScript path resolution
    tsconfigPaths(),

    // Workflow DevKit compiler (CRITICAL for directive support)
    workflowRollupPlugin(),

    // Generate TypeScript declarations
    dts({
      entryRoot: 'src',
      outDir: 'dist/types',
      exclude: ['**/*.test.ts', '**/*.spec.ts', 'tests/**'],
    }),

    // Copy SQL schema files to dist
    {
      name: 'copy-sql-files',
      closeBundle() {
        try {
          mkdirSync('dist/shadow-cache', { recursive: true });
          copyFileSync('src/shadow-cache/schema.sql', 'dist/shadow-cache/schema.sql');
          console.log('✓ Copied schema.sql to dist/');
        } catch (err) {
          console.error('Failed to copy SQL files:', err);
        }
      }
    },
    
    // Set executable permissions on CLI binaries
    {
      name: 'set-executable-permissions',
      closeBundle() {
        const binaries = [
          'dist/cli/bin.js',
          'dist/mcp-server/cli.js',
        ];
        
        binaries.forEach(file => {
          try {
            if (existsSync(file)) {
              chmodSync(file, 0o755);
              console.log(`✓ Set executable: ${file}`);
            }
          } catch (err) {
            console.error(`Failed to chmod ${file}:`, err.message);
          }
        });
      }
    }
  ],

  build: {
    // Library mode for CLI tool
    lib: {
      entry: {
        // Main CLI entry
        'cli/index': resolve(__dirname, 'src/cli/index.ts'),
        'cli/bin': resolve(__dirname, 'src/cli/bin.ts'),

        // Workflow engine entry
        'workflow-engine': resolve(__dirname, 'src/workflow-engine/index.ts'),

        // Workflows (compiled with Workflow DevKit)
        'workflows/kg/document-connection/index': resolve(__dirname, 'src/workflows/kg/document-connection/index.ts'),
        'workflows/kg/document-connection/steps': resolve(__dirname, 'src/workflows/kg/document-connection/steps.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },

    // Output configuration
    outDir: 'dist',
    emptyOutDir: true,

    // Rollup options
    rollupOptions: {
      // Externalize dependencies (don't bundle)
      external: [
        // Node built-ins
        'fs',
        'fs/promises',
        'path',
        'url',
        'stream',
        'events',
        'util',
        'os',
        'crypto',
        'child_process',

        // All node_modules
        /^node:/,
        /^@/,
        /^[a-z]/,
      ],

      output: {
        // Preserve module structure
        preserveModules: true,
        preserveModulesRoot: 'src',

        // ES module format
        format: 'es',

        // Output directory
        dir: 'dist',

        // Use .js extension
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      },
    },

    // Target Node.js
    target: 'node18',

    // Source maps for debugging
    sourcemap: true,

    // Minification (disable for CLI readability)
    minify: false,
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // Server configuration (for development)
  server: {
    port: 3000,
  },

  // Disable browser features
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});
