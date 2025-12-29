/**
 * Tests for Base Adapter
 *
 * @module tests/integrations/agentic-flow/adapters/base-adapter
 */

import { describe, it, expect } from 'vitest';
import {
  BaseAdapter,
  AdapterStatus,
} from '../../../../src/integrations/agentic-flow/adapters/base-adapter.js';

/**
 * Concrete implementation for testing
 */
class TestAdapter extends BaseAdapter<{ version: string }> {
  private _isAvailable = false;

  getFeatureName(): string {
    return 'test-adapter';
  }

  isAvailable(): boolean {
    return this._isAvailable;
  }

  setAvailable(available: boolean): void {
    this._isAvailable = available;
    this.status.available = available;
  }

  async initialize(): Promise<void> {
    this.status.initialized = true;
  }

  async loadModule(name: string): Promise<unknown> {
    return this.tryLoad(name);
  }

  getModule(): { version: string } | null {
    return this.module;
  }

  setModule(mod: { version: string }): void {
    this.module = mod;
  }

  checkCapability(cap: string): boolean {
    return this.supportsCapability(cap);
  }
}

describe('BaseAdapter', () => {
  describe('initial state', () => {
    it('should have correct initial status', () => {
      const adapter = new TestAdapter();
      const status = adapter.getStatus();

      expect(status.available).toBe(false);
      expect(status.initialized).toBe(false);
      expect(status.error).toBeUndefined();
    });

    it('should have null module initially', () => {
      const adapter = new TestAdapter();
      expect(adapter.getModule()).toBeNull();
    });
  });

  describe('getFeatureName', () => {
    it('should return the feature name', () => {
      const adapter = new TestAdapter();
      expect(adapter.getFeatureName()).toBe('test-adapter');
    });
  });

  describe('isAvailable', () => {
    it('should return false by default', () => {
      const adapter = new TestAdapter();
      expect(adapter.isAvailable()).toBe(false);
    });

    it('should return true when set', () => {
      const adapter = new TestAdapter();
      adapter.setAvailable(true);
      expect(adapter.isAvailable()).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should set initialized to true', async () => {
      const adapter = new TestAdapter();
      await adapter.initialize();

      const status = adapter.getStatus();
      expect(status.initialized).toBe(true);
    });
  });

  describe('getStatus', () => {
    it('should return a copy of status', () => {
      const adapter = new TestAdapter();
      const status1 = adapter.getStatus();
      const status2 = adapter.getStatus();

      expect(status1).toEqual(status2);
      expect(status1).not.toBe(status2);
    });

    it('should have lastChecked timestamp', () => {
      const adapter = new TestAdapter();
      const status = adapter.getStatus();

      expect(status.lastChecked).toBeInstanceOf(Date);
    });
  });

  describe('tryLoad', () => {
    it('should return null for non-existent module', async () => {
      const adapter = new TestAdapter();
      const result = await adapter.loadModule('non-existent-module-xyz');

      expect(result).toBeNull();
    });

    it('should update status with error on failure', async () => {
      const adapter = new TestAdapter();
      await adapter.loadModule('non-existent-module-xyz');

      const status = adapter.getStatus();
      expect(status.available).toBe(false);
      expect(status.error).toBeDefined();
    });
  });

  describe('supportsCapability', () => {
    it('should return false when not available', () => {
      const adapter = new TestAdapter();
      expect(adapter.checkCapability('any')).toBe(false);
    });

    it('should return true when available', () => {
      const adapter = new TestAdapter();
      adapter.setAvailable(true);
      expect(adapter.checkCapability('any')).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset module and status', async () => {
      const adapter = new TestAdapter();
      adapter.setAvailable(true);
      adapter.setModule({ version: '1.0.0' });
      await adapter.initialize();

      adapter.reset();

      expect(adapter.getModule()).toBeNull();
      const status = adapter.getStatus();
      expect(status.available).toBe(false);
      expect(status.initialized).toBe(false);
    });
  });
});
