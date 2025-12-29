/**
 * Tests for AgentDB Adapter
 *
 * @module tests/integrations/agentic-flow/adapters/agentdb-adapter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AgentDBAdapter,
  createAgentDBAdapter,
  defaultAgentDBConfig,
  AgentDBConfig,
} from '../../../../src/integrations/agentic-flow/adapters/agentdb-adapter.js';

describe('AgentDB Adapter', () => {
  describe('AgentDBAdapter class', () => {
    let adapter: AgentDBAdapter;

    beforeEach(() => {
      adapter = new AgentDBAdapter();
    });

    describe('constructor', () => {
      it('should use default config when no config provided', () => {
        const config = adapter.getConfig();
        expect(config).toEqual(defaultAgentDBConfig);
      });

      it('should merge partial config with defaults', () => {
        const customAdapter = new AgentDBAdapter({
          dimensions: 512,
          enableGNN: false,
        });

        const config = customAdapter.getConfig();
        expect(config.dimensions).toBe(512);
        expect(config.enableGNN).toBe(false);
        expect(config.backend).toBe('auto');
      });
    });

    describe('getFeatureName', () => {
      it('should return "agentdb"', () => {
        expect(adapter.getFeatureName()).toBe('agentdb');
      });
    });

    describe('isAvailable', () => {
      it('should check for agentdb or agentic-flow availability', () => {
        // Returns true if either agentdb or agentic-flow can be resolved
        // The actual result depends on installed packages in the environment
        const result = adapter.isAvailable();
        expect(typeof result).toBe('boolean');
      });
    });

    describe('getStats', () => {
      it('should return initial stats', () => {
        const stats = adapter.getStats();

        expect(stats.totalVectors).toBe(0);
        expect(stats.dimensions).toBe(defaultAgentDBConfig.dimensions);
        expect(stats.indexType).toBe('hnsw');
        expect(stats.memoryUsage).toBe(0);
        expect(stats.lastUpdated).toBeInstanceOf(Date);
      });
    });

    describe('updateConfig', () => {
      it('should update configuration', () => {
        adapter.updateConfig({ dimensions: 768 });

        const config = adapter.getConfig();
        expect(config.dimensions).toBe(768);
      });

      it('should preserve other config values', () => {
        adapter.updateConfig({ enableGNN: false });

        const config = adapter.getConfig();
        expect(config.backend).toBe('auto');
        expect(config.dimensions).toBe(384);
      });
    });

    describe('initialize', () => {
      it('should fail gracefully when AgentDB is not available', async () => {
        await expect(adapter.initialize()).rejects.toThrow();
      });
    });

    describe('operations without initialization', () => {
      it('should throw on insert without initialization', async () => {
        await expect(
          adapter.insert({ id: 'test', vector: [1, 2, 3] })
        ).rejects.toThrow('not initialized');
      });

      it('should throw on search without initialization', async () => {
        await expect(
          adapter.search({ vector: [1, 2, 3], k: 10 })
        ).rejects.toThrow('not initialized');
      });

      it('should throw on delete without initialization', async () => {
        await expect(adapter.delete('test')).rejects.toThrow('not initialized');
      });

      it('should throw on clear without initialization', async () => {
        await expect(adapter.clear()).rejects.toThrow('not initialized');
      });
    });
  });

  describe('createAgentDBAdapter factory', () => {
    it('should create adapter with default config', () => {
      const adapter = createAgentDBAdapter();
      expect(adapter).toBeInstanceOf(AgentDBAdapter);
    });

    it('should create adapter with custom config', () => {
      const adapter = createAgentDBAdapter({
        backend: 'sqlite',
        dimensions: 1024,
      });

      const config = adapter.getConfig();
      expect(config.backend).toBe('sqlite');
      expect(config.dimensions).toBe(1024);
    });
  });

  describe('defaultAgentDBConfig', () => {
    it('should have expected default values', () => {
      expect(defaultAgentDBConfig.backend).toBe('auto');
      expect(defaultAgentDBConfig.dimensions).toBe(384);
      expect(defaultAgentDBConfig.enableGNN).toBe(true);
    });
  });
});
