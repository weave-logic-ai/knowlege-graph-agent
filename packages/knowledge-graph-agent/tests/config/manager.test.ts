/**
 * Configuration Manager Tests
 *
 * Comprehensive tests for ConfigManager class including:
 * - Constructor and initialization
 * - Load/save file persistence
 * - Get/set configuration values
 * - Migration versioning
 * - Configuration validation
 * - Factory functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  ConfigManager,
  createConfigManager,
  getDefaultConfig,
} from '../../src/config/manager.js';
import type { KGConfiguration, ConfigMigration } from '../../src/config/types.js';

// Test helpers
function createTempDir(): string {
  const tempDir = join(tmpdir(), `kg-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

function cleanupTempDir(tempDir: string): void {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe('ConfigManager', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('constructor', () => {
    it('should create ConfigManager with project root', () => {
      const manager = new ConfigManager(tempDir);
      expect(manager).toBeInstanceOf(ConfigManager);
      expect(manager.getConfigPath()).toBe(join(tempDir, '.kg/config.json'));
    });

    it('should create ConfigManager with custom config path', () => {
      const customPath = join(tempDir, 'custom-config.json');
      const manager = new ConfigManager(tempDir, customPath);
      expect(manager.getConfigPath()).toBe(customPath);
    });

    it('should use default config when no file exists', () => {
      const manager = new ConfigManager(tempDir);
      const config = manager.getAll();

      expect(config.version).toBe('1.0.0');
      expect(config.projectRoot).toBe(tempDir);
      expect(config.docsPath).toBe('docs');
    });

    it('should set projectRoot to the actual project root', () => {
      const manager = new ConfigManager(tempDir);
      expect(manager.get('projectRoot')).toBe(tempDir);
    });
  });

  describe('load()', () => {
    it('should load configuration from existing file', () => {
      const configPath = join(tempDir, '.kg/config.json');
      const kgDir = join(tempDir, '.kg');
      mkdirSync(kgDir, { recursive: true });

      const customConfig: Partial<KGConfiguration> = {
        version: '2.0.0',
        docsPath: 'documentation',
        database: {
          path: 'custom.db',
          autoBackup: false,
          backupInterval: 3600000,
          maxBackups: 3,
        },
      };

      writeFileSync(configPath, JSON.stringify(customConfig, null, 2));

      const manager = new ConfigManager(tempDir);
      const config = manager.getAll();

      expect(config.version).toBe('2.0.0');
      expect(config.docsPath).toBe('documentation');
      expect(config.database.path).toBe('custom.db');
      expect(config.database.autoBackup).toBe(false);
    });

    it('should merge loaded config with defaults', () => {
      const configPath = join(tempDir, '.kg/config.json');
      const kgDir = join(tempDir, '.kg');
      mkdirSync(kgDir, { recursive: true });

      // Partial config without all fields
      const partialConfig = {
        version: '1.5.0',
        database: {
          path: 'custom.db',
        },
      };

      writeFileSync(configPath, JSON.stringify(partialConfig, null, 2));

      const manager = new ConfigManager(tempDir);
      const config = manager.getAll();

      // Custom values
      expect(config.version).toBe('1.5.0');
      expect(config.database.path).toBe('custom.db');

      // Default values filled in
      expect(config.database.autoBackup).toBe(true);
      expect(config.database.backupInterval).toBe(86400000);
      expect(config.cache.enabled).toBe(true);
      expect(config.agents.maxConcurrent).toBe(5);
    });

    it('should use defaults when config file is invalid JSON', () => {
      const configPath = join(tempDir, '.kg/config.json');
      const kgDir = join(tempDir, '.kg');
      mkdirSync(kgDir, { recursive: true });

      writeFileSync(configPath, 'invalid json {{{');

      const manager = new ConfigManager(tempDir);
      const config = manager.getAll();

      expect(config.version).toBe('1.0.0');
      expect(config.database.path).toBe('.kg/knowledge.db');
    });

    it('should use defaults when config file cannot be read', () => {
      // Use a path that does not exist
      const manager = new ConfigManager('/nonexistent/path/that/does/not/exist');
      const config = manager.getAll();

      expect(config.version).toBe('1.0.0');
    });
  });

  describe('save()', () => {
    it('should save configuration to file', () => {
      const manager = new ConfigManager(tempDir);
      manager.save();

      const configPath = join(tempDir, '.kg/config.json');
      expect(existsSync(configPath)).toBe(true);

      const savedData = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(savedData.version).toBe('1.0.0');
      expect(savedData.projectRoot).toBe(tempDir);
    });

    it('should create directory if it does not exist', () => {
      const customPath = join(tempDir, 'nested/deep/config.json');
      const manager = new ConfigManager(tempDir, customPath);
      manager.save();

      expect(existsSync(customPath)).toBe(true);
    });

    it('should format JSON with indentation', () => {
      const manager = new ConfigManager(tempDir);
      manager.save();

      const configPath = join(tempDir, '.kg/config.json');
      const content = readFileSync(configPath, 'utf-8');

      // Check for indentation (formatted JSON)
      expect(content).toContain('\n');
      expect(content).toContain('  ');
    });

    it('should throw error when save fails', () => {
      // Create a directory where the config file should be
      const configPath = join(tempDir, '.kg/config.json');
      const kgDir = join(tempDir, '.kg');
      mkdirSync(kgDir, { recursive: true });
      mkdirSync(configPath, { recursive: true }); // Create as directory instead of file

      const manager = new ConfigManager(tempDir);

      expect(() => manager.save()).toThrow();
    });
  });

  describe('get()', () => {
    it('should return configuration value by key', () => {
      const manager = new ConfigManager(tempDir);

      expect(manager.get('version')).toBe('1.0.0');
      expect(manager.get('docsPath')).toBe('docs');
      expect(manager.get('database')).toEqual({
        path: '.kg/knowledge.db',
        autoBackup: true,
        backupInterval: 86400000,
        maxBackups: 5,
      });
    });

    it('should return nested configuration objects', () => {
      const manager = new ConfigManager(tempDir);

      const database = manager.get('database');
      expect(database.path).toBe('.kg/knowledge.db');
      expect(database.autoBackup).toBe(true);

      const cache = manager.get('cache');
      expect(cache.enabled).toBe(true);
      expect(cache.evictionPolicy).toBe('lru');
    });

    it('should return all configuration sections', () => {
      const manager = new ConfigManager(tempDir);

      expect(manager.get('agents')).toBeDefined();
      expect(manager.get('services')).toBeDefined();
      expect(manager.get('logging')).toBeDefined();
    });
  });

  describe('set()', () => {
    it('should set configuration value and auto-save', () => {
      const manager = new ConfigManager(tempDir);

      manager.set('docsPath', 'documentation');

      expect(manager.get('docsPath')).toBe('documentation');

      // Verify it was saved to file
      const configPath = join(tempDir, '.kg/config.json');
      const savedData = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(savedData.docsPath).toBe('documentation');
    });

    it('should set nested configuration objects', () => {
      const manager = new ConfigManager(tempDir);

      manager.set('database', {
        path: 'custom.db',
        autoBackup: false,
        backupInterval: 7200000,
        maxBackups: 10,
      });

      const database = manager.get('database');
      expect(database.path).toBe('custom.db');
      expect(database.autoBackup).toBe(false);
      expect(database.backupInterval).toBe(7200000);
      expect(database.maxBackups).toBe(10);
    });

    it('should update version', () => {
      const manager = new ConfigManager(tempDir);

      manager.set('version', '2.0.0');

      expect(manager.get('version')).toBe('2.0.0');
    });
  });

  describe('update()', () => {
    it('should update multiple configuration values', () => {
      const manager = new ConfigManager(tempDir);

      manager.update({
        docsPath: 'new-docs',
        version: '1.1.0',
      });

      expect(manager.get('docsPath')).toBe('new-docs');
      expect(manager.get('version')).toBe('1.1.0');
    });

    it('should merge partial nested objects with defaults', () => {
      const manager = new ConfigManager(tempDir);

      manager.update({
        database: {
          path: 'updated.db',
          autoBackup: true,
          backupInterval: 86400000,
          maxBackups: 5,
        },
      });

      const database = manager.get('database');
      expect(database.path).toBe('updated.db');
      // Should still have default values
      expect(database.autoBackup).toBe(true);
    });

    it('should auto-save after update', () => {
      const manager = new ConfigManager(tempDir);

      manager.update({ docsPath: 'updated-docs' });

      const configPath = join(tempDir, '.kg/config.json');
      const savedData = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(savedData.docsPath).toBe('updated-docs');
    });
  });

  describe('getAll()', () => {
    it('should return a copy of the complete configuration', () => {
      const manager = new ConfigManager(tempDir);

      const config1 = manager.getAll();
      const config2 = manager.getAll();

      // Should be equal but not the same reference
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });

    it('should return all configuration properties', () => {
      const manager = new ConfigManager(tempDir);
      const config = manager.getAll();

      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('projectRoot');
      expect(config).toHaveProperty('docsPath');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('cache');
      expect(config).toHaveProperty('agents');
      expect(config).toHaveProperty('services');
      expect(config).toHaveProperty('logging');
    });
  });

  describe('reset()', () => {
    it('should reset configuration to defaults', () => {
      const manager = new ConfigManager(tempDir);

      // Modify configuration
      manager.set('docsPath', 'custom-docs');
      manager.set('version', '5.0.0');

      // Reset
      manager.reset();

      expect(manager.get('docsPath')).toBe('docs');
      expect(manager.get('version')).toBe('1.0.0');
    });

    it('should preserve projectRoot after reset', () => {
      const manager = new ConfigManager(tempDir);

      manager.reset();

      expect(manager.get('projectRoot')).toBe(tempDir);
    });

    it('should save reset configuration to file', () => {
      const manager = new ConfigManager(tempDir);

      manager.set('docsPath', 'custom-docs');
      manager.reset();

      const configPath = join(tempDir, '.kg/config.json');
      const savedData = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(savedData.docsPath).toBe('docs');
    });

    it('should reset all nested configuration sections', () => {
      const manager = new ConfigManager(tempDir);

      manager.set('database', {
        path: 'custom.db',
        autoBackup: false,
        backupInterval: 1000,
        maxBackups: 1,
      });

      manager.reset();

      const database = manager.get('database');
      expect(database.path).toBe('.kg/knowledge.db');
      expect(database.autoBackup).toBe(true);
      expect(database.backupInterval).toBe(86400000);
      expect(database.maxBackups).toBe(5);
    });
  });

  describe('registerMigration() and migrate()', () => {
    it('should register migrations', () => {
      const manager = new ConfigManager(tempDir);

      const migration: ConfigMigration = {
        version: '1.1.0',
        up: (config) => ({ ...config, docsPath: 'migrated-docs' }),
        down: (config) => ({ ...config, docsPath: 'docs' }),
      };

      manager.registerMigration(migration);
      // No error means success
    });

    it('should sort migrations by version', () => {
      const manager = new ConfigManager(tempDir);

      const migration3: ConfigMigration = {
        version: '3.0.0',
        up: (config) => config,
        down: (config) => config,
      };

      const migration1: ConfigMigration = {
        version: '1.1.0',
        up: (config) => config,
        down: (config) => config,
      };

      const migration2: ConfigMigration = {
        version: '2.0.0',
        up: (config) => config,
        down: (config) => config,
      };

      manager.registerMigration(migration3);
      manager.registerMigration(migration1);
      manager.registerMigration(migration2);

      // Migrations should be applied in order
    });

    it('should upgrade configuration through migrations', () => {
      const manager = new ConfigManager(tempDir);

      const migration: ConfigMigration = {
        version: '1.1.0',
        up: (config) => ({
          ...config,
          docsPath: 'migrated-docs',
          version: '1.1.0',
        }),
        down: (config) => ({
          ...config,
          docsPath: 'docs',
          version: '1.0.0',
        }),
      };

      manager.registerMigration(migration);
      manager.migrate('1.1.0');

      expect(manager.get('version')).toBe('1.1.0');
      expect(manager.get('docsPath')).toBe('migrated-docs');
    });

    it('should downgrade configuration through migrations', () => {
      const manager = new ConfigManager(tempDir);

      // Start at higher version
      manager.set('version', '2.0.0');

      const migration: ConfigMigration = {
        version: '2.0.0',
        up: (config) => ({
          ...config,
          docsPath: 'v2-docs',
        }),
        down: (config) => ({
          ...config,
          docsPath: 'v1-docs',
        }),
      };

      manager.registerMigration(migration);
      manager.migrate('1.0.0');

      expect(manager.get('version')).toBe('1.0.0');
      expect(manager.get('docsPath')).toBe('v1-docs');
    });

    it('should apply multiple migrations in sequence', () => {
      const manager = new ConfigManager(tempDir);

      const migration1: ConfigMigration = {
        version: '1.1.0',
        up: (config) => ({
          ...config,
          docsPath: 'v1.1-docs',
        }),
        down: (config) => ({
          ...config,
          docsPath: 'docs',
        }),
      };

      const migration2: ConfigMigration = {
        version: '1.2.0',
        up: (config) => ({
          ...config,
          docsPath: config.docsPath + '-upgraded',
        }),
        down: (config) => ({
          ...config,
          docsPath: 'v1.1-docs',
        }),
      };

      manager.registerMigration(migration1);
      manager.registerMigration(migration2);
      manager.migrate('1.2.0');

      expect(manager.get('version')).toBe('1.2.0');
      expect(manager.get('docsPath')).toBe('v1.1-docs-upgraded');
    });

    it('should skip migration when already at target version', () => {
      const manager = new ConfigManager(tempDir);

      const migration: ConfigMigration = {
        version: '1.1.0',
        up: (config) => ({
          ...config,
          docsPath: 'should-not-change',
        }),
        down: (config) => config,
      };

      manager.registerMigration(migration);
      manager.migrate('1.0.0'); // Already at 1.0.0

      expect(manager.get('docsPath')).toBe('docs'); // Unchanged
    });

    it('should migrate to latest version when no target specified', () => {
      const manager = new ConfigManager(tempDir);

      const migration: ConfigMigration = {
        version: '2.0.0',
        up: (config) => ({
          ...config,
          docsPath: 'latest-docs',
        }),
        down: (config) => config,
      };

      manager.registerMigration(migration);
      manager.migrate(); // No target = latest

      expect(manager.get('version')).toBe('2.0.0');
    });

    it('should throw error when migration fails', () => {
      const manager = new ConfigManager(tempDir);

      const migration: ConfigMigration = {
        version: '1.1.0',
        up: () => {
          throw new Error('Migration failed');
        },
        down: (config) => config,
      };

      manager.registerMigration(migration);

      expect(() => manager.migrate('1.1.0')).toThrow('Migration failed');
    });

    it('should save configuration after successful migration', () => {
      const manager = new ConfigManager(tempDir);

      const migration: ConfigMigration = {
        version: '1.1.0',
        up: (config) => ({
          ...config,
          docsPath: 'migrated',
        }),
        down: (config) => config,
      };

      manager.registerMigration(migration);
      manager.migrate('1.1.0');

      const configPath = join(tempDir, '.kg/config.json');
      const savedData = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(savedData.version).toBe('1.1.0');
      expect(savedData.docsPath).toBe('migrated');
    });
  });

  describe('validate()', () => {
    it('should validate valid configuration', () => {
      const manager = new ConfigManager(tempDir);
      const result = manager.validate();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid version format', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('version', 'invalid-version');

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid version format, expected semver (e.g., 1.0.0)');
    });

    it('should detect missing database path', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('database', {
        path: '',
        autoBackup: true,
        backupInterval: 86400000,
        maxBackups: 5,
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Database path is required');
    });

    it('should detect negative database backup interval', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('database', {
        path: 'test.db',
        autoBackup: true,
        backupInterval: -1,
        maxBackups: 5,
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Database backup interval must be non-negative');
    });

    it('should detect negative max backups', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('database', {
        path: 'test.db',
        autoBackup: true,
        backupInterval: 86400000,
        maxBackups: -1,
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Database max backups must be non-negative');
    });

    it('should detect negative cache max size', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('cache', {
        enabled: true,
        maxSize: -100,
        ttl: 3600000,
        evictionPolicy: 'lru',
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cache max size must be non-negative');
    });

    it('should detect negative cache TTL', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('cache', {
        enabled: true,
        maxSize: 1000,
        ttl: -1,
        evictionPolicy: 'lru',
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cache TTL must be non-negative');
    });

    it('should detect invalid cache eviction policy', () => {
      const manager = new ConfigManager(tempDir);
      // Force invalid policy through type assertion
      manager.set('cache', {
        enabled: true,
        maxSize: 1000,
        ttl: 3600000,
        evictionPolicy: 'invalid' as 'lru',
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid cache eviction policy');
    });

    it('should detect agents max concurrent less than 1', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('agents', {
        maxConcurrent: 0,
        defaultTimeout: 30000,
        retryAttempts: 3,
        claudeFlowEnabled: true,
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Agents max concurrent must be at least 1');
    });

    it('should detect negative agent timeout', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('agents', {
        maxConcurrent: 5,
        defaultTimeout: -1000,
        retryAttempts: 3,
        claudeFlowEnabled: true,
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Agents default timeout must be non-negative');
    });

    it('should detect negative retry attempts', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('agents', {
        maxConcurrent: 5,
        defaultTimeout: 30000,
        retryAttempts: -1,
        claudeFlowEnabled: true,
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Agents retry attempts must be non-negative');
    });

    it('should detect negative health check interval', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('services', {
        watcherEnabled: true,
        schedulerEnabled: true,
        syncEnabled: true,
        healthCheckInterval: -1000,
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Health check interval must be non-negative');
    });

    it('should detect invalid logging level', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('logging', {
        level: 'invalid' as 'info',
        format: 'text',
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid logging level');
    });

    it('should detect invalid logging format', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('logging', {
        level: 'info',
        format: 'invalid' as 'json',
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid logging format');
    });

    it('should report multiple validation errors', () => {
      const manager = new ConfigManager(tempDir);
      manager.set('version', 'bad');
      manager.set('database', {
        path: '',
        autoBackup: true,
        backupInterval: -1,
        maxBackups: -1,
      });

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });
  });

  describe('exists()', () => {
    it('should return false when config file does not exist', () => {
      const manager = new ConfigManager(tempDir);
      expect(manager.exists()).toBe(false);
    });

    it('should return true after save', () => {
      const manager = new ConfigManager(tempDir);
      manager.save();
      expect(manager.exists()).toBe(true);
    });

    it('should return true when config file exists', () => {
      const configPath = join(tempDir, '.kg/config.json');
      const kgDir = join(tempDir, '.kg');
      mkdirSync(kgDir, { recursive: true });
      writeFileSync(configPath, '{}');

      const manager = new ConfigManager(tempDir);
      expect(manager.exists()).toBe(true);
    });
  });

  describe('getConfigPath()', () => {
    it('should return default config path', () => {
      const manager = new ConfigManager(tempDir);
      expect(manager.getConfigPath()).toBe(join(tempDir, '.kg/config.json'));
    });

    it('should return custom config path', () => {
      const customPath = join(tempDir, 'my-config.json');
      const manager = new ConfigManager(tempDir, customPath);
      expect(manager.getConfigPath()).toBe(customPath);
    });
  });
});

describe('getDefaultConfig()', () => {
  it('should return default configuration', () => {
    const config = getDefaultConfig();

    expect(config.version).toBe('1.0.0');
    expect(config.docsPath).toBe('docs');
    expect(config.database.path).toBe('.kg/knowledge.db');
    expect(config.cache.enabled).toBe(true);
    expect(config.agents.maxConcurrent).toBe(5);
    expect(config.services.watcherEnabled).toBe(true);
    expect(config.logging.level).toBe('info');
  });

  it('should return a copy, not the original', () => {
    const config1 = getDefaultConfig();
    const config2 = getDefaultConfig();

    // Modify one
    config1.docsPath = 'modified';

    // Other should be unchanged
    expect(config2.docsPath).toBe('docs');
  });

  it('should have all required properties', () => {
    const config = getDefaultConfig();

    expect(config).toHaveProperty('version');
    expect(config).toHaveProperty('projectRoot');
    expect(config).toHaveProperty('docsPath');
    expect(config).toHaveProperty('database');
    expect(config).toHaveProperty('cache');
    expect(config).toHaveProperty('agents');
    expect(config).toHaveProperty('services');
    expect(config).toHaveProperty('logging');

    // Database properties
    expect(config.database).toHaveProperty('path');
    expect(config.database).toHaveProperty('autoBackup');
    expect(config.database).toHaveProperty('backupInterval');
    expect(config.database).toHaveProperty('maxBackups');

    // Cache properties
    expect(config.cache).toHaveProperty('enabled');
    expect(config.cache).toHaveProperty('maxSize');
    expect(config.cache).toHaveProperty('ttl');
    expect(config.cache).toHaveProperty('evictionPolicy');

    // Agents properties
    expect(config.agents).toHaveProperty('maxConcurrent');
    expect(config.agents).toHaveProperty('defaultTimeout');
    expect(config.agents).toHaveProperty('retryAttempts');
    expect(config.agents).toHaveProperty('claudeFlowEnabled');

    // Services properties
    expect(config.services).toHaveProperty('watcherEnabled');
    expect(config.services).toHaveProperty('schedulerEnabled');
    expect(config.services).toHaveProperty('syncEnabled');
    expect(config.services).toHaveProperty('healthCheckInterval');

    // Logging properties
    expect(config.logging).toHaveProperty('level');
    expect(config.logging).toHaveProperty('format');
  });
});

describe('createConfigManager()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should create ConfigManager instance', () => {
    const manager = createConfigManager(tempDir);
    expect(manager).toBeInstanceOf(ConfigManager);
  });

  it('should create ConfigManager with custom config path', () => {
    const customPath = join(tempDir, 'custom.json');
    const manager = createConfigManager(tempDir, customPath);

    expect(manager.getConfigPath()).toBe(customPath);
  });

  it('should be equivalent to using constructor directly', () => {
    const manager1 = createConfigManager(tempDir);
    const manager2 = new ConfigManager(tempDir);

    expect(manager1.getAll()).toEqual(manager2.getAll());
    expect(manager1.getConfigPath()).toBe(manager2.getConfigPath());
  });
});

describe('File-based persistence', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should persist configuration across instances', () => {
    const manager1 = new ConfigManager(tempDir);
    manager1.set('docsPath', 'persistent-docs');
    manager1.set('version', '2.5.0');

    // Create new instance with same path
    const manager2 = new ConfigManager(tempDir);

    expect(manager2.get('docsPath')).toBe('persistent-docs');
    expect(manager2.get('version')).toBe('2.5.0');
  });

  it('should persist nested configuration', () => {
    const manager1 = new ConfigManager(tempDir);
    manager1.set('database', {
      path: 'persisted.db',
      autoBackup: false,
      backupInterval: 1800000,
      maxBackups: 10,
    });

    const manager2 = new ConfigManager(tempDir);
    const database = manager2.get('database');

    expect(database.path).toBe('persisted.db');
    expect(database.autoBackup).toBe(false);
    expect(database.backupInterval).toBe(1800000);
    expect(database.maxBackups).toBe(10);
  });

  it('should persist migrations', () => {
    const migration: ConfigMigration = {
      version: '1.5.0',
      up: (config) => ({
        ...config,
        docsPath: 'migrated-persistent',
      }),
      down: (config) => config,
    };

    const manager1 = new ConfigManager(tempDir);
    manager1.registerMigration(migration);
    manager1.migrate('1.5.0');

    const manager2 = new ConfigManager(tempDir);
    expect(manager2.get('version')).toBe('1.5.0');
    expect(manager2.get('docsPath')).toBe('migrated-persistent');
  });
});

describe('Migration versioning', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should handle major version upgrades', () => {
    const manager = new ConfigManager(tempDir);

    const migration: ConfigMigration = {
      version: '2.0.0',
      up: (config) => ({
        ...config,
        docsPath: 'v2-major-upgrade',
      }),
      down: (config) => ({
        ...config,
        docsPath: 'docs',
      }),
    };

    manager.registerMigration(migration);
    manager.migrate('2.0.0');

    expect(manager.get('version')).toBe('2.0.0');
    expect(manager.get('docsPath')).toBe('v2-major-upgrade');
  });

  it('should handle minor version upgrades', () => {
    const manager = new ConfigManager(tempDir);

    const migration: ConfigMigration = {
      version: '1.1.0',
      up: (config) => ({
        ...config,
        docsPath: 'minor-upgrade',
      }),
      down: (config) => config,
    };

    manager.registerMigration(migration);
    manager.migrate('1.1.0');

    expect(manager.get('version')).toBe('1.1.0');
  });

  it('should handle patch version upgrades', () => {
    const manager = new ConfigManager(tempDir);

    const migration: ConfigMigration = {
      version: '1.0.1',
      up: (config) => ({
        ...config,
        docsPath: 'patch-upgrade',
      }),
      down: (config) => config,
    };

    manager.registerMigration(migration);
    manager.migrate('1.0.1');

    expect(manager.get('version')).toBe('1.0.1');
  });

  it('should handle multiple version jumps', () => {
    const manager = new ConfigManager(tempDir);

    const migrations: ConfigMigration[] = [
      {
        version: '1.1.0',
        up: (config) => ({
          ...config,
          docsPath: config.docsPath + '-1.1',
        }),
        down: (config) => ({
          ...config,
          docsPath: 'docs',
        }),
      },
      {
        version: '1.2.0',
        up: (config) => ({
          ...config,
          docsPath: config.docsPath + '-1.2',
        }),
        down: (config) => ({
          ...config,
          docsPath: config.docsPath?.replace('-1.2', '') || 'docs',
        }),
      },
      {
        version: '2.0.0',
        up: (config) => ({
          ...config,
          docsPath: config.docsPath + '-2.0',
        }),
        down: (config) => ({
          ...config,
          docsPath: config.docsPath?.replace('-2.0', '') || 'docs',
        }),
      },
    ];

    migrations.forEach((m) => manager.registerMigration(m));
    manager.migrate('2.0.0');

    expect(manager.get('version')).toBe('2.0.0');
    expect(manager.get('docsPath')).toBe('docs-1.1-1.2-2.0');
  });

  it('should correctly compare version strings', () => {
    const manager = new ConfigManager(tempDir);

    // Set initial version higher
    manager.set('version', '1.5.0');

    const migration: ConfigMigration = {
      version: '1.2.0',
      up: (config) => ({
        ...config,
        docsPath: 'should-not-apply',
      }),
      down: (config) => config,
    };

    manager.registerMigration(migration);
    manager.migrate('1.5.0'); // Already at or above 1.2.0

    // Should not have applied the migration
    expect(manager.get('docsPath')).toBe('docs');
  });
});
