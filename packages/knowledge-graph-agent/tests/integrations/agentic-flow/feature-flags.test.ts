/**
 * Tests for Agentic-Flow Feature Flags
 *
 * @module tests/integrations/agentic-flow/feature-flags
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  FeatureFlags,
  featureFlags,
  isFeatureEnabled,
  withFeature,
  withFeatureAsync,
  FeatureFlagName,
} from '../../../src/integrations/agentic-flow/feature-flags.js';
import {
  resetAgenticFlowConfig,
  setAgenticFlowConfig,
} from '../../../src/integrations/agentic-flow/config.js';

describe('Agentic-Flow Feature Flags', () => {
  beforeEach(() => {
    resetAgenticFlowConfig();
    FeatureFlags.resetInstance();
  });

  afterEach(() => {
    resetAgenticFlowConfig();
    FeatureFlags.resetInstance();
  });

  describe('FeatureFlags singleton', () => {
    it('should return the same instance', () => {
      const instance1 = FeatureFlags.getInstance();
      const instance2 = FeatureFlags.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = FeatureFlags.getInstance();
      FeatureFlags.resetInstance();
      const instance2 = FeatureFlags.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('isEnabled', () => {
    it('should return false for all features by default', () => {
      const flags = FeatureFlags.getInstance();

      expect(flags.isEnabled('agentdb')).toBe(false);
      expect(flags.isEnabled('reasoning-bank')).toBe(false);
      expect(flags.isEnabled('agent-booster')).toBe(false);
      expect(flags.isEnabled('model-router')).toBe(false);
      expect(flags.isEnabled('quic-transport')).toBe(false);
      expect(flags.isEnabled('federation-hub')).toBe(false);
    });

    it('should return false for unknown features', () => {
      const flags = FeatureFlags.getInstance();
      expect(flags.isEnabled('unknown-feature' as FeatureFlagName)).toBe(false);
    });
  });

  describe('setFlag', () => {
    it('should allow manual flag setting', () => {
      const flags = FeatureFlags.getInstance();

      flags.setFlag('agentdb', true);
      expect(flags.isEnabled('agentdb')).toBe(true);

      flags.setFlag('agentdb', false);
      expect(flags.isEnabled('agentdb')).toBe(false);
    });
  });

  describe('getAllFlags', () => {
    it('should return all flags as a record', () => {
      const flags = FeatureFlags.getInstance();
      const allFlags = flags.getAllFlags();

      expect(allFlags).toHaveProperty('agentdb');
      expect(allFlags).toHaveProperty('reasoning-bank');
      expect(allFlags).toHaveProperty('agent-booster');
      expect(allFlags).toHaveProperty('model-router');
      expect(allFlags).toHaveProperty('quic-transport');
      expect(allFlags).toHaveProperty('federation-hub');
    });
  });

  describe('getAllFlagInfo', () => {
    it('should return detailed info for all flags', () => {
      const flags = FeatureFlags.getInstance();
      const info = flags.getAllFlagInfo();

      expect(info).toHaveLength(6);
      expect(info[0]).toHaveProperty('name');
      expect(info[0]).toHaveProperty('enabled');
      expect(info[0]).toHaveProperty('description');
      expect(info[0]).toHaveProperty('requiresPackage');
    });
  });

  describe('getEnabledCount', () => {
    it('should return 0 when no features are enabled', () => {
      const flags = FeatureFlags.getInstance();
      expect(flags.getEnabledCount()).toBe(0);
    });

    it('should count enabled features', () => {
      const flags = FeatureFlags.getInstance();
      flags.setFlag('agentdb', true);
      flags.setFlag('model-router', true);
      expect(flags.getEnabledCount()).toBe(2);
    });
  });

  describe('getEnabledFeatures', () => {
    it('should return empty array when no features are enabled', () => {
      const flags = FeatureFlags.getInstance();
      expect(flags.getEnabledFeatures()).toEqual([]);
    });

    it('should return list of enabled feature names', () => {
      const flags = FeatureFlags.getInstance();
      flags.setFlag('agentdb', true);
      flags.setFlag('quic-transport', true);

      const enabled = flags.getEnabledFeatures();
      expect(enabled).toContain('agentdb');
      expect(enabled).toContain('quic-transport');
      expect(enabled).toHaveLength(2);
    });
  });

  describe('getDisabledFeatures', () => {
    it('should return all features when none are enabled', () => {
      const flags = FeatureFlags.getInstance();
      const disabled = flags.getDisabledFeatures();
      expect(disabled).toHaveLength(6);
    });

    it('should exclude enabled features', () => {
      const flags = FeatureFlags.getInstance();
      flags.setFlag('agentdb', true);

      const disabled = flags.getDisabledFeatures();
      expect(disabled).not.toContain('agentdb');
      expect(disabled).toHaveLength(5);
    });
  });

  describe('refresh', () => {
    it('should refresh flags from config', () => {
      const flags = FeatureFlags.getInstance();
      flags.setFlag('agentdb', true);

      // Refresh should reset based on config (not manual settings)
      flags.refresh();

      // Since agentic-flow is not available, all should be false
      expect(flags.isEnabled('agentdb')).toBe(false);
    });
  });

  describe('isFeatureEnabled helper', () => {
    it('should use singleton instance', () => {
      expect(isFeatureEnabled('agentdb')).toBe(false);

      const flags = FeatureFlags.getInstance();
      flags.setFlag('agentdb', true);

      expect(isFeatureEnabled('agentdb')).toBe(true);
    });
  });

  describe('withFeature helper', () => {
    it('should return undefined when feature is disabled', () => {
      const result = withFeature('agentdb', () => 'executed');
      expect(result).toBeUndefined();
    });

    it('should execute function when feature is enabled', () => {
      const flags = FeatureFlags.getInstance();
      flags.setFlag('agentdb', true);

      const result = withFeature('agentdb', () => 'executed');
      expect(result).toBe('executed');
    });

    it('should pass return value through', () => {
      const flags = FeatureFlags.getInstance();
      flags.setFlag('model-router', true);

      const result = withFeature('model-router', () => ({ data: 42 }));
      expect(result).toEqual({ data: 42 });
    });
  });

  describe('withFeatureAsync helper', () => {
    it('should return undefined when feature is disabled', async () => {
      const result = await withFeatureAsync('agentdb', async () => 'executed');
      expect(result).toBeUndefined();
    });

    it('should execute async function when feature is enabled', async () => {
      const flags = FeatureFlags.getInstance();
      flags.setFlag('reasoning-bank', true);

      const result = await withFeatureAsync('reasoning-bank', async () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve('async-executed'), 10);
        });
      });

      expect(result).toBe('async-executed');
    });
  });

  describe('featureFlags export', () => {
    it('should delegate to the singleton instance', () => {
      // featureFlags is a wrapper that delegates to the singleton
      const flags = FeatureFlags.getInstance();
      flags.setFlag('agentdb', true);

      expect(featureFlags.isEnabled('agentdb')).toBe(true);
      expect(featureFlags.getEnabledCount()).toBeGreaterThan(0);
    });
  });
});
