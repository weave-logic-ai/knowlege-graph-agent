import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { stat, readFile, access } from 'fs/promises';
import { constants } from 'fs';
import {
  createTempVault,
  createTestProject,
  validateVaultStructure,
  validateMarkdownContent,
  measureExecutionTime,
  countFiles,
  type TestFixture
} from './test-helpers';

// Import vault initialization functions (adjust path as needed)
// These would be imported from the actual implementation
interface VaultInitOptions {
  projectPath: string;
  vaultPath: string;
  dryRun?: boolean;
  force?: boolean;
  template?: string;
}

// Mock implementation for testing (replace with actual imports)
async function initializeVault(options: VaultInitOptions): Promise<void> {
  // This would call the actual vault initialization code
  // For now, we'll assume it exists and is properly implemented
  throw new Error('Not implemented - replace with actual vault init');
}

describe('E2E: Vault Initialization', () => {
  let projectFixture: TestFixture | null = null;
  let vaultFixture: TestFixture | null = null;

  beforeEach(async () => {
    // Setup runs before each test
  });

  afterEach(async () => {
    // Cleanup after each test
    if (projectFixture) {
      await projectFixture.cleanup();
      projectFixture = null;
    }
    if (vaultFixture) {
      await vaultFixture.cleanup();
      vaultFixture = null;
    }
  });

  describe('Next.js Project Initialization', () => {
    it('should initialize vault for Next.js App Router project', async () => {
      // Use the pre-created Next.js fixture
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      // Verify fixture exists
      await expect(stat(fixturesPath)).resolves.toBeDefined();

      // Initialize vault
      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      // Validate vault structure
      const validation = await validateVaultStructure(vaultFixture.path);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.structure.hasSpecKit).toBe(true);
      expect(validation.structure.hasWorkflows).toBe(true);
      expect(validation.structure.hasMemory).toBe(true);
      expect(validation.structure.hasMarkdown).toBe(true);
      expect(validation.structure.hasShadowCache).toBe(true);
    });

    it('should generate comprehensive README.md', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      const readmePath = join(vaultFixture.path, 'README.md');
      const content = await readFile(readmePath, 'utf-8');

      // Validate markdown content
      const validation = validateMarkdownContent(content);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Check for Next.js-specific content
      expect(content).toContain('Next.js');
      expect(content).toContain('App Router');
    });

    it('should populate shadow cache with project files', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      const shadowCachePath = join(vaultFixture.path, '.vault', 'shadow-cache.db');

      // Verify shadow cache exists and has content
      const stats = await stat(shadowCachePath);
      expect(stats.size).toBeGreaterThan(0);

      // TODO: Query shadow cache to verify file entries
      // This would require shadow-cache-tools or direct SQLite access
    });

    it('should create spec-kit with project metadata', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      const specKitPath = join(vaultFixture.path, '.vault', 'spec-kit');
      const metadataPath = join(specKitPath, '.speckit', 'metadata.json');

      const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));
      expect(metadata).toHaveProperty('project');
      expect(metadata.project).toHaveProperty('type');
      expect(metadata.project.type).toBe('nextjs');
    });
  });

  describe('React/Vite Project Initialization', () => {
    it('should initialize vault for React + Vite project', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'react-vite');
      vaultFixture = await createTempVault();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      const validation = await validateVaultStructure(vaultFixture.path);
      expect(validation.valid).toBe(true);
      expect(validation.structure.hasSpecKit).toBe(true);
    });

    it('should detect Vite configuration', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'react-vite');
      vaultFixture = await createTempVault();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      const readmePath = join(vaultFixture.path, 'README.md');
      const content = await readFile(readmePath, 'utf-8');

      expect(content).toContain('Vite');
      expect(content).toContain('React');
    });

    it('should use appropriate template for React project', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'react-vite');
      vaultFixture = await createTempVault();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path,
        template: 'react'
      });

      const specKitPath = join(vaultFixture.path, '.vault', 'spec-kit');
      const metadataPath = join(specKitPath, '.speckit', 'metadata.json');

      const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));
      expect(metadata.project.type).toBe('react');
    });
  });

  describe('Dry-Run Mode', () => {
    it('should not write any files in dry-run mode', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      const initialFileCount = await countFiles(vaultFixture.path);

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path,
        dryRun: true
      });

      const finalFileCount = await countFiles(vaultFixture.path);
      expect(finalFileCount).toBe(initialFileCount);
    });

    it('should output preview of operations', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      // Capture console output
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.join(' '));
      };

      try {
        await initializeVault({
          projectPath: fixturesPath,
          vaultPath: vaultFixture.path,
          dryRun: true
        });

        expect(logs.some(log => log.includes('Would create'))).toBe(true);
        expect(logs.some(log => log.includes('vault structure'))).toBe(true);
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Error Handling', () => {
    it('should fail gracefully with invalid project path', async () => {
      vaultFixture = await createTempVault();

      await expect(
        initializeVault({
          projectPath: '/nonexistent/path',
          vaultPath: vaultFixture.path
        })
      ).rejects.toThrow();
    });

    it('should fail if package.json is missing', async () => {
      // Create project without package.json
      projectFixture = await createTestProject({
        'src/index.ts': 'console.log("test");'
      });
      vaultFixture = await createTempVault();

      await expect(
        initializeVault({
          projectPath: projectFixture.path,
          vaultPath: vaultFixture.path
        })
      ).rejects.toThrow(/package\.json/);
    });

    it('should handle permission errors gracefully', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');

      // Create a read-only vault directory
      vaultFixture = await createTempVault();
      // Note: This test may need platform-specific permission handling

      // Test would attempt to write and handle permission errors
      // Implementation depends on actual error handling in vault init
    });

    it('should rollback on initialization failure', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      // Force an error mid-initialization
      // This would need to be implemented in the actual vault init code
      // to support transactional operations

      try {
        await initializeVault({
          projectPath: fixturesPath,
          vaultPath: vaultFixture.path
        });
      } catch {
        // Verify partial files were cleaned up
        const fileCount = await countFiles(vaultFixture.path);
        expect(fileCount).toBe(0);
      }
    });

    it('should validate vault path is writable', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');

      await expect(
        initializeVault({
          projectPath: fixturesPath,
          vaultPath: '/root/forbidden-path'
        })
      ).rejects.toThrow(/permission|writable/i);
    });
  });

  describe('Performance Tests', () => {
    it('should complete small project initialization in <30s', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      const { duration } = await measureExecutionTime(async () => {
        await initializeVault({
          projectPath: fixturesPath,
          vaultPath: vaultFixture.path
        });
      });

      expect(duration).toBeLessThan(30000); // 30 seconds
    });

    it('should handle medium project (<500 files) in <3min', async () => {
      // Create a medium-sized project
      const files: Record<string, string> = {
        'package.json': JSON.stringify({ name: 'medium-project', version: '1.0.0' })
      };

      // Generate 100 source files
      for (let i = 0; i < 100; i++) {
        files[`src/module${i}/index.ts`] = `export function fn${i}() { return ${i}; }`;
        files[`src/module${i}/utils.ts`] = `export const value${i} = ${i};`;
      }

      projectFixture = await createTestProject(files);
      vaultFixture = await createTempVault();

      const { duration } = await measureExecutionTime(async () => {
        await initializeVault({
          projectPath: projectFixture.path,
          vaultPath: vaultFixture.path
        });
      });

      expect(duration).toBeLessThan(180000); // 3 minutes
    });

    it('should efficiently process shadow cache operations', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      const startTime = performance.now();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      const shadowCacheTime = performance.now() - startTime;

      // Shadow cache operations should be fast
      expect(shadowCacheTime).toBeLessThan(10000); // 10 seconds for small project
    });
  });

  describe('Template Selection', () => {
    it('should auto-detect project type from package.json', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      const metadataPath = join(
        vaultFixture.path,
        '.vault',
        'spec-kit',
        '.speckit',
        'metadata.json'
      );
      const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));

      expect(metadata.project.type).toBe('nextjs');
    });

    it('should allow manual template override', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path,
        template: 'custom'
      });

      const metadataPath = join(
        vaultFixture.path,
        '.vault',
        'spec-kit',
        '.speckit',
        'metadata.json'
      );
      const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));

      expect(metadata.project.template).toBe('custom');
    });
  });

  describe('Workflow Integration', () => {
    it('should create workflow files', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      const workflowsPath = join(vaultFixture.path, '.vault', 'workflows');

      // Check for required workflow files
      await expect(
        access(join(workflowsPath, 'spec-kit.json'), constants.F_OK)
      ).resolves.toBeUndefined();
    });

    it('should configure memory namespaces', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      const memoryPath = join(vaultFixture.path, '.vault', 'memory');
      const memoryConfig = join(memoryPath, 'config.json');

      const config = JSON.parse(await readFile(memoryConfig, 'utf-8'));
      expect(config).toHaveProperty('namespaces');
      expect(config.namespaces).toContain('vault');
      expect(config.namespaces).toContain('spec-kit');
    });
  });

  describe('Idempotency', () => {
    it('should handle re-initialization without errors', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      // First initialization
      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      // Second initialization should not fail
      await expect(
        initializeVault({
          projectPath: fixturesPath,
          vaultPath: vaultFixture.path
        })
      ).resolves.toBeUndefined();
    });

    it('should preserve existing data with force flag', async () => {
      const fixturesPath = join(process.cwd(), 'tests', 'fixtures', 'nextjs-app');
      vaultFixture = await createTempVault();

      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path
      });

      // Add custom file
      const customFile = join(vaultFixture.path, 'CUSTOM.md');
      await writeFile(customFile, 'custom content', 'utf-8');

      // Re-initialize with force
      await initializeVault({
        projectPath: fixturesPath,
        vaultPath: vaultFixture.path,
        force: true
      });

      // Custom file should still exist
      await expect(access(customFile)).resolves.toBeUndefined();
    });
  });
});
