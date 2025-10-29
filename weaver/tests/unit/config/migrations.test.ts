/**
 * Configuration Migration Tests
 */

import { describe, it, expect } from 'vitest';
import { migrateConfig, needsMigration, getConfigVersion } from '../../../src/config/migrations.js';
import { CONFIG_VERSION } from '../../../src/config/defaults.js';

describe('Configuration Migrations', () => {
  describe('getConfigVersion', () => {
    it('should return version from config', () => {
      const config = { version: '1.0.0' };
      expect(getConfigVersion(config)).toBe('1.0.0');
    });

    it('should return 0.1.0 for configs without version', () => {
      const config = {};
      expect(getConfigVersion(config)).toBe('0.1.0');
    });
  });

  describe('needsMigration', () => {
    it('should return false for current version', () => {
      const config = { version: CONFIG_VERSION };
      expect(needsMigration(config)).toBe(false);
    });

    it('should return true for old version', () => {
      const config = { version: '0.1.0' };
      expect(needsMigration(config)).toBe(true);
    });

    it('should return true for configs without version', () => {
      const config = {};
      expect(needsMigration(config)).toBe(true);
    });
  });

  describe('migrateConfig', () => {
    it('should migrate from 0.1.0 to 1.0.0', () => {
      const oldConfig = {
        version: '0.1.0',
        port: 3000,
        logLevel: 'info',
        dbPath: './data/db.sqlite',
      };

      const migrated = migrateConfig(oldConfig, '1.0.0');

      expect(migrated.version).toBe('1.0.0');
      expect(migrated.server).toBeDefined();
      expect(migrated.server?.port).toBe(3000);
      expect(migrated.server?.logLevel).toBe('info');
      expect(migrated.database?.path).toBe('./data/db.sqlite');
    });

    it('should return same config if already at target version', () => {
      const config = { version: '1.0.0', server: { port: 3000 } };
      const result = migrateConfig(config, '1.0.0');

      expect(result).toEqual(config);
    });

    it('should migrate config without version', () => {
      const oldConfig = {
        port: 4000,
        vaultPath: '/home/user/vault',
      };

      const migrated = migrateConfig(oldConfig);

      expect(migrated.version).toBe('1.0.0');
      expect(migrated.server?.port).toBe(4000);
      expect(migrated.vault?.path).toBe('/home/user/vault');
    });

    it('should preserve custom values during migration', () => {
      const oldConfig = {
        version: '0.1.0',
        port: 5000,
        gitAuthorName: 'Custom Author',
        embeddingModel: 'custom-model',
      };

      const migrated = migrateConfig(oldConfig);

      expect(migrated.server?.port).toBe(5000);
      expect(migrated.git?.authorName).toBe('Custom Author');
      expect(migrated.embeddings?.model).toBe('custom-model');
    });

    it('should throw error for unsupported migration path', () => {
      const config = { version: '2.0.0' };

      expect(() => migrateConfig(config, '3.0.0')).toThrow(/No migration path/i);
    });
  });

  describe('migration data integrity', () => {
    it('should preserve all configuration data', () => {
      const oldConfig = {
        version: '0.1.0',
        port: 3001,
        logLevel: 'debug',
        dbPath: './custom/db.sqlite',
        vaultPath: '/custom/vault',
        gitAuthorName: 'Test',
        gitAuthorEmail: 'test@example.com',
        mcpEnabled: false,
      };

      const migrated = migrateConfig(oldConfig);

      // Check all values are preserved
      expect(migrated.server?.port).toBe(3001);
      expect(migrated.server?.logLevel).toBe('debug');
      expect(migrated.database?.path).toBe('./custom/db.sqlite');
      expect(migrated.vault?.path).toBe('/custom/vault');
      expect(migrated.git?.authorName).toBe('Test');
      expect(migrated.git?.authorEmail).toBe('test@example.com');
      expect(migrated.features?.mcpEnabled).toBe(false);
    });

    it('should add default values for new fields', () => {
      const oldConfig = {
        version: '0.1.0',
        port: 3000,
      };

      const migrated = migrateConfig(oldConfig);

      // New fields should have defaults
      expect(migrated.features).toBeDefined();
      expect(migrated.learning).toBeDefined();
      expect(migrated.perception).toBeDefined();
    });
  });
});
