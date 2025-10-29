/**
 * Configuration Operations Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, writeFileSync, rmSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import Ajv from 'ajv';
import yaml from 'js-yaml';

describe('Configuration Operations', () => {
  let testDir: string;
  let configPath: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `weaver-config-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    configPath = join(testDir, 'config.json');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Configuration Loading', () => {
    it('should load JSON configuration', () => {
      const config = {
        vault: { root: '/test/vault' },
        workflows: { enabled: true },
      };

      writeFileSync(configPath, JSON.stringify(config, null, 2));

      const loaded = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(loaded).toEqual(config);
    });

    it('should load YAML configuration', () => {
      const yamlPath = join(testDir, 'config.yaml');
      const config = {
        vault: { root: '/test/vault' },
        workflows: { enabled: true },
      };

      writeFileSync(yamlPath, yaml.dump(config));

      const loaded = yaml.load(readFileSync(yamlPath, 'utf-8'));
      expect(loaded).toEqual(config);
    });

    it('should handle missing configuration', () => {
      const nonExistentPath = join(testDir, 'missing.json');
      expect(existsSync(nonExistentPath)).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    const schema = {
      type: 'object',
      properties: {
        vault: {
          type: 'object',
          properties: {
            root: { type: 'string' },
          },
        },
        workflows: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
          },
        },
      },
    };

    it('should validate correct configuration', () => {
      const ajv = new Ajv();
      const validate = ajv.compile(schema);

      const config = {
        vault: { root: '/test/vault' },
        workflows: { enabled: true },
      };

      const valid = validate(config);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });

    it('should reject invalid configuration', () => {
      const ajv = new Ajv();
      const validate = ajv.compile(schema);

      const invalidConfig = {
        vault: { root: 123 }, // Should be string
        workflows: { enabled: 'yes' }, // Should be boolean
      };

      const valid = validate(invalidConfig);
      expect(valid).toBe(false);
      expect(validate.errors).toBeDefined();
      expect(validate.errors!.length).toBeGreaterThan(0);
    });

    it('should validate nested properties', () => {
      const nestedSchema = {
        type: 'object',
        properties: {
          server: {
            type: 'object',
            properties: {
              port: { type: 'number', minimum: 1, maximum: 65535 },
            },
          },
        },
      };

      const ajv = new Ajv();
      const validate = ajv.compile(nestedSchema);

      const validConfig = { server: { port: 3000 } };
      const invalidConfig = { server: { port: 70000 } };

      expect(validate(validConfig)).toBe(true);
      expect(validate(invalidConfig)).toBe(false);
    });
  });

  describe('Configuration Formats', () => {
    it('should support JSON format', () => {
      const config = { test: 'value' };
      const json = JSON.stringify(config, null, 2);

      writeFileSync(configPath, json);
      const loaded = JSON.parse(readFileSync(configPath, 'utf-8'));

      expect(loaded).toEqual(config);
    });

    it('should support YAML format', () => {
      const yamlPath = join(testDir, 'config.yaml');
      const config = { test: 'value', nested: { key: 'val' } };

      writeFileSync(yamlPath, yaml.dump(config));
      const loaded = yaml.load(readFileSync(yamlPath, 'utf-8'));

      expect(loaded).toEqual(config);
    });

    it('should handle syntax errors in JSON', () => {
      writeFileSync(configPath, '{ invalid json }');

      expect(() => {
        JSON.parse(readFileSync(configPath, 'utf-8'));
      }).toThrow();
    });

    it('should handle syntax errors in YAML', () => {
      const yamlPath = join(testDir, 'config.yaml');
      writeFileSync(yamlPath, 'invalid:\n  - yaml:\n  missing indent');

      expect(() => {
        yaml.load(readFileSync(yamlPath, 'utf-8'));
      }).toThrow();
    });
  });

  describe('Configuration Updates', () => {
    it('should reload configuration after changes', () => {
      const config1 = { version: 1 };
      const config2 = { version: 2 };

      writeFileSync(configPath, JSON.stringify(config1));
      const loaded1 = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(loaded1.version).toBe(1);

      writeFileSync(configPath, JSON.stringify(config2));
      const loaded2 = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(loaded2.version).toBe(2);
    });

    it('should preserve unmodified values', () => {
      const config = {
        preserved: 'value',
        modified: 'old',
      };

      writeFileSync(configPath, JSON.stringify(config));

      const loaded = JSON.parse(readFileSync(configPath, 'utf-8'));
      loaded.modified = 'new';

      writeFileSync(configPath, JSON.stringify(loaded));
      const updated = JSON.parse(readFileSync(configPath, 'utf-8'));

      expect(updated.preserved).toBe('value');
      expect(updated.modified).toBe('new');
    });
  });

  describe('Default Configuration', () => {
    it('should provide defaults for missing values', () => {
      const partialConfig = { vault: { root: '/test' } };
      const defaults = {
        vault: { root: '/default', watchPatterns: ['**/*.md'] },
        workflows: { enabled: true },
      };

      const merged = { ...defaults, ...partialConfig };
      expect(merged.workflows.enabled).toBe(true);
      expect(merged.vault.root).toBe('/test');
    });

    it('should merge nested defaults', () => {
      const defaults = {
        server: { port: 3000, host: 'localhost', cors: false },
      };

      const userConfig = {
        server: { port: 8080 },
      };

      const merged = {
        server: { ...defaults.server, ...userConfig.server },
      };

      expect(merged.server.port).toBe(8080);
      expect(merged.server.host).toBe('localhost');
      expect(merged.server.cors).toBe(false);
    });
  });
});
