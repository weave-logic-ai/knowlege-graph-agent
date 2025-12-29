/**
 * Tests for Agentic-Flow Configuration
 *
 * @module tests/integrations/agentic-flow/config
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AgenticFlowConfig,
  defaultConfig,
  loadConfigFromEnv,
  getAgenticFlowConfig,
  setAgenticFlowConfig,
  resetAgenticFlowConfig,
  initializeConfig,
  isAgenticFlowAvailable,
  isAgenticFlowEnabled,
  validateConfig,
} from '../../../src/integrations/agentic-flow/config.js';

describe('Agentic-Flow Configuration', () => {
  beforeEach(() => {
    // Reset config before each test
    resetAgenticFlowConfig();
    // Clear environment variables
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    resetAgenticFlowConfig();
    vi.unstubAllEnvs();
  });

  describe('defaultConfig', () => {
    it('should have all features disabled by default', () => {
      expect(defaultConfig.enabled).toBe(false);
      expect(defaultConfig.useAgentDB).toBe(false);
      expect(defaultConfig.useReasoningBank).toBe(false);
      expect(defaultConfig.useAgentBooster).toBe(false);
      expect(defaultConfig.useModelRouter).toBe(false);
      expect(defaultConfig.useQUICTransport).toBe(false);
      expect(defaultConfig.useFederationHub).toBe(false);
    });
  });

  describe('loadConfigFromEnv', () => {
    it('should load configuration from environment variables', () => {
      vi.stubEnv('KG_AGENTIC_FLOW', 'true');
      vi.stubEnv('KG_USE_AGENTDB', 'true');
      vi.stubEnv('KG_USE_REASONING_BANK', 'true');

      const config = loadConfigFromEnv();

      expect(config.enabled).toBe(true);
      expect(config.useAgentDB).toBe(true);
      expect(config.useReasoningBank).toBe(true);
      expect(config.useAgentBooster).toBe(false);
    });

    it('should return false for unset environment variables', () => {
      const config = loadConfigFromEnv();

      expect(config.enabled).toBe(false);
      expect(config.useAgentDB).toBe(false);
    });

    it('should return false for non-true values', () => {
      vi.stubEnv('KG_AGENTIC_FLOW', 'false');
      vi.stubEnv('KG_USE_AGENTDB', '1');
      vi.stubEnv('KG_USE_REASONING_BANK', 'yes');

      const config = loadConfigFromEnv();

      expect(config.enabled).toBe(false);
      expect(config.useAgentDB).toBe(false);
      expect(config.useReasoningBank).toBe(false);
    });
  });

  describe('getAgenticFlowConfig', () => {
    it('should return a copy of the current config', () => {
      const config1 = getAgenticFlowConfig();
      const config2 = getAgenticFlowConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different object references
    });

    it('should return default config initially', () => {
      const config = getAgenticFlowConfig();
      expect(config).toEqual(defaultConfig);
    });
  });

  describe('setAgenticFlowConfig', () => {
    it('should merge partial config with existing config', () => {
      setAgenticFlowConfig({ enabled: true, useAgentDB: true });

      const config = getAgenticFlowConfig();

      expect(config.enabled).toBe(true);
      expect(config.useAgentDB).toBe(true);
      expect(config.useReasoningBank).toBe(false);
    });

    it('should allow updating individual features', () => {
      setAgenticFlowConfig({ useModelRouter: true });
      setAgenticFlowConfig({ useFederationHub: true });

      const config = getAgenticFlowConfig();

      expect(config.useModelRouter).toBe(true);
      expect(config.useFederationHub).toBe(true);
    });
  });

  describe('resetAgenticFlowConfig', () => {
    it('should reset config to defaults', () => {
      setAgenticFlowConfig({
        enabled: true,
        useAgentDB: true,
        useReasoningBank: true,
      });

      resetAgenticFlowConfig();

      const config = getAgenticFlowConfig();
      expect(config).toEqual(defaultConfig);
    });
  });

  describe('initializeConfig', () => {
    it('should load config from environment', () => {
      vi.stubEnv('KG_AGENTIC_FLOW', 'true');
      vi.stubEnv('KG_USE_MODEL_ROUTER', 'true');

      initializeConfig();

      const config = getAgenticFlowConfig();
      expect(config.enabled).toBe(true);
      expect(config.useModelRouter).toBe(true);
    });
  });

  describe('isAgenticFlowAvailable', () => {
    it('should return a boolean indicating package availability', () => {
      // The result depends on whether agentic-flow is installed in the environment
      const result = isAgenticFlowAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isAgenticFlowEnabled', () => {
    it('should return enabled status based on config and availability', () => {
      setAgenticFlowConfig({ enabled: true });
      const available = isAgenticFlowAvailable();
      // If available, should match enabled. If not available, should be false
      expect(isAgenticFlowEnabled()).toBe(available);
    });

    it('should return false when not enabled', () => {
      expect(isAgenticFlowEnabled()).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('should return valid for default config', () => {
      const result = validateConfig(defaultConfig);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn when features are enabled but main toggle is off', () => {
      const config: AgenticFlowConfig = {
        ...defaultConfig,
        useAgentDB: true,
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.warnings).toContain(
        'AgentDB is enabled but agentic-flow integration is disabled'
      );
    });

    it('should handle enabled config based on package availability', () => {
      const config: AgenticFlowConfig = {
        ...defaultConfig,
        enabled: true,
      };

      const result = validateConfig(config);
      const available = isAgenticFlowAvailable();

      if (!available) {
        // If not available, should warn about missing package
        expect(result.valid).toBe(false);
        expect(result.warnings).toContain(
          'agentic-flow integration is enabled but package is not installed'
        );
      } else {
        // If available, config should be valid when only enabled
        expect(result.valid).toBe(true);
      }
    });

    it('should accumulate multiple warnings', () => {
      const config: AgenticFlowConfig = {
        ...defaultConfig,
        useAgentDB: true,
        useReasoningBank: true,
        useModelRouter: true,
      };

      const result = validateConfig(config);

      expect(result.warnings.length).toBeGreaterThanOrEqual(3);
    });
  });
});
