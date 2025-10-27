/**
 * Tests for init-vault CLI command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initVault } from '../../src/cli/commands/init-vault.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('init-vault command', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'weaver-test-'));
  });

  afterEach(async () => {
    // Cleanup temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('project validation', () => {
    it('should reject non-existent project path', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent');

      await expect(
        initVault(nonExistentPath, { dryRun: true })
      ).rejects.toThrow();
    });

    it('should reject file path (not directory)', async () => {
      const filePath = path.join(tempDir, 'file.txt');
      await fs.writeFile(filePath, 'test');

      await expect(
        initVault(filePath, { dryRun: true })
      ).rejects.toThrow('not a directory');
    });

    it('should accept valid directory path', async () => {
      // Create a minimal Next.js project structure
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', dependencies: { next: '14.0.0' } })
      );

      await expect(
        initVault(tempDir, { dryRun: true })
      ).resolves.not.toThrow();
    });
  });

  describe('framework detection', () => {
    it('should detect Next.js project', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'nextjs-project',
          dependencies: { next: '14.0.0', react: '18.0.0' },
        })
      );

      // Mock console.log to capture output
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await initVault(tempDir, { dryRun: true });

      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('nextjs');

      consoleLogSpy.mockRestore();
    });

    it('should detect React project', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'react-project',
          dependencies: { react: '18.0.0' },
        })
      );

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await initVault(tempDir, { dryRun: true });

      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('react');

      consoleLogSpy.mockRestore();
    });
  });

  describe('dry-run mode', () => {
    it('should not create files in dry-run mode', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', dependencies: { next: '14.0.0' } })
      );

      const vaultPath = path.join(tempDir, '.vault');

      await initVault(tempDir, {
        dryRun: true,
        output: vaultPath,
      });

      // Verify vault directory was NOT created
      await expect(fs.stat(vaultPath)).rejects.toThrow();
    });

    it('should display preview in dry-run mode', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', dependencies: { next: '14.0.0' } })
      );

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await initVault(tempDir, { dryRun: true });

      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('Dry-Run Preview');
      expect(output).toContain('This is a dry-run');

      consoleLogSpy.mockRestore();
    });
  });

  describe('vault creation', () => {
    it('should create vault structure', async () => {
      // Setup test project
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', dependencies: { next: '14.0.0' } })
      );

      const vaultPath = path.join(tempDir, '.vault');

      // Mock inquirer to auto-confirm
      vi.mock('inquirer', () => ({
        default: {
          prompt: vi.fn().mockResolvedValue({ confirmed: true }),
        },
      }));

      await initVault(tempDir, {
        output: vaultPath,
        git: false, // Disable git for simpler testing
      });

      // Verify vault directory was created
      const vaultStats = await fs.stat(vaultPath);
      expect(vaultStats.isDirectory()).toBe(true);

      // Verify subdirectories
      const subdirs = ['concepts', 'technical', 'features'];
      for (const subdir of subdirs) {
        const subdirPath = path.join(vaultPath, subdir);
        const subdirStats = await fs.stat(subdirPath);
        expect(subdirStats.isDirectory()).toBe(true);

        // Verify README exists
        const readmePath = path.join(subdirPath, 'README.md');
        const readmeStats = await fs.stat(readmePath);
        expect(readmeStats.isFile()).toBe(true);
      }
    });

    it('should initialize shadow cache', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', dependencies: { next: '14.0.0' } })
      );

      const vaultPath = path.join(tempDir, '.vault');

      // Mock inquirer
      vi.mock('inquirer', () => ({
        default: {
          prompt: vi.fn().mockResolvedValue({ confirmed: true }),
        },
      }));

      await initVault(tempDir, {
        output: vaultPath,
        git: false,
      });

      // Verify shadow cache database exists
      const cachePath = path.join(vaultPath, '.shadow-cache.db');
      const cacheStats = await fs.stat(cachePath);
      expect(cacheStats.isFile()).toBe(true);
    });
  });

  describe('template selection', () => {
    it('should use auto-detected template', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', dependencies: { next: '14.0.0' } })
      );

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await initVault(tempDir, {
        dryRun: true,
        template: 'auto',
      });

      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('Next.js App Router');

      consoleLogSpy.mockRestore();
    });

    it('should use explicitly specified template', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', dependencies: { react: '18.0.0' } })
      );

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await initVault(tempDir, {
        dryRun: true,
        template: 'react-vite',
      });

      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('React');

      consoleLogSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle missing package.json gracefully', async () => {
      // Don't create package.json

      await expect(
        initVault(tempDir, { dryRun: true })
      ).rejects.toThrow('package.json');
    });

    it('should handle invalid package.json', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        'invalid json{'
      );

      await expect(
        initVault(tempDir, { dryRun: true })
      ).rejects.toThrow();
    });

    it('should handle permission errors', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', dependencies: { next: '14.0.0' } })
      );

      // Make directory read-only
      await fs.chmod(tempDir, 0o444);

      const vaultPath = path.join(tempDir, '.vault');

      // Mock inquirer
      vi.mock('inquirer', () => ({
        default: {
          prompt: vi.fn().mockResolvedValue({ confirmed: true }),
        },
      }));

      await expect(
        initVault(tempDir, { output: vaultPath, git: false })
      ).rejects.toThrow();

      // Restore permissions
      await fs.chmod(tempDir, 0o755);
    });
  });
});

describe('CLI integration', () => {
  it('should export command creator', () => {
    const { createInitVaultCommand } = require('../../src/cli/commands/init-vault.js');
    expect(createInitVaultCommand).toBeDefined();
    expect(typeof createInitVaultCommand).toBe('function');
  });

  it('should create valid Commander command', () => {
    const { createInitVaultCommand } = require('../../src/cli/commands/init-vault.js');
    const command = createInitVaultCommand();

    expect(command.name()).toBe('init-vault');
    expect(command.description()).toContain('Initialize');
  });
});
