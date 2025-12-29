/**
 * Feature Flags for Agentic-Flow Integration
 *
 * Provides runtime feature flag management for selectively enabling
 * agentic-flow components based on configuration and availability.
 *
 * @module integrations/agentic-flow/feature-flags
 */

import { getAgenticFlowConfig, isAgenticFlowAvailable } from './config.js';

/**
 * Available feature flag names
 */
export type FeatureFlagName =
  | 'agentdb'
  | 'reasoning-bank'
  | 'agent-booster'
  | 'model-router'
  | 'quic-transport'
  | 'federation-hub';

/**
 * Feature flag metadata
 */
export interface FeatureFlagInfo {
  name: FeatureFlagName;
  enabled: boolean;
  description: string;
  requiresPackage: boolean;
}

/**
 * Singleton feature flags manager
 *
 * Manages runtime feature flags for agentic-flow integration.
 * Flags are computed based on configuration and package availability.
 */
export class FeatureFlags {
  private static instance: FeatureFlags;
  private flags: Map<FeatureFlagName, boolean>;
  private descriptions: Map<FeatureFlagName, string>;

  private constructor() {
    this.flags = new Map();
    this.descriptions = new Map([
      ['agentdb', 'GNN-enhanced vector database with 150x faster search'],
      ['reasoning-bank', 'Adaptive learning with trajectory tracking and memory distillation'],
      ['agent-booster', 'Dynamic capability enhancement for agents'],
      ['model-router', 'Intelligent LLM routing based on task requirements'],
      ['quic-transport', 'High-performance data synchronization via QUIC protocol'],
      ['federation-hub', 'Multi-agent coordination and distributed workflows'],
    ]);
    this.initializeFlags();
  }

  /**
   * Get the singleton instance
   *
   * @returns FeatureFlags singleton
   */
  static getInstance(): FeatureFlags {
    if (!FeatureFlags.instance) {
      FeatureFlags.instance = new FeatureFlags();
    }
    return FeatureFlags.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static resetInstance(): void {
    FeatureFlags.instance = undefined as unknown as FeatureFlags;
  }

  /**
   * Initialize flags from current configuration
   */
  private initializeFlags(): void {
    const config = getAgenticFlowConfig();
    const available = isAgenticFlowAvailable();

    // Only enable flags if both package is available and config enables the feature
    this.flags.set('agentdb', available && config.enabled && config.useAgentDB);
    this.flags.set('reasoning-bank', available && config.enabled && config.useReasoningBank);
    this.flags.set('agent-booster', available && config.enabled && config.useAgentBooster);
    this.flags.set('model-router', available && config.enabled && config.useModelRouter);
    this.flags.set('quic-transport', available && config.enabled && config.useQUICTransport);
    this.flags.set('federation-hub', available && config.enabled && config.useFederationHub);
  }

  /**
   * Check if a feature is enabled
   *
   * @param feature - Feature name to check
   * @returns True if feature is enabled
   */
  isEnabled(feature: FeatureFlagName): boolean {
    return this.flags.get(feature) ?? false;
  }

  /**
   * Manually set a feature flag
   *
   * Useful for testing or runtime feature toggles.
   *
   * @param feature - Feature name
   * @param enabled - Whether to enable the feature
   */
  setFlag(feature: FeatureFlagName, enabled: boolean): void {
    this.flags.set(feature, enabled);
  }

  /**
   * Get all feature flags as a record
   *
   * @returns Record of all flag names to their enabled status
   */
  getAllFlags(): Record<FeatureFlagName, boolean> {
    return Object.fromEntries(this.flags) as Record<FeatureFlagName, boolean>;
  }

  /**
   * Get detailed information about all flags
   *
   * @returns Array of feature flag info objects
   */
  getAllFlagInfo(): FeatureFlagInfo[] {
    const result: FeatureFlagInfo[] = [];

    for (const [name, enabled] of this.flags) {
      result.push({
        name,
        enabled,
        description: this.descriptions.get(name) ?? '',
        requiresPackage: true,
      });
    }

    return result;
  }

  /**
   * Refresh flags from current configuration
   *
   * Call this after configuration changes to update flags.
   */
  refresh(): void {
    this.initializeFlags();
  }

  /**
   * Get enabled feature count
   *
   * @returns Number of enabled features
   */
  getEnabledCount(): number {
    let count = 0;
    for (const enabled of this.flags.values()) {
      if (enabled) count++;
    }
    return count;
  }

  /**
   * Get list of enabled feature names
   *
   * @returns Array of enabled feature names
   */
  getEnabledFeatures(): FeatureFlagName[] {
    const enabled: FeatureFlagName[] = [];
    for (const [name, isEnabled] of this.flags) {
      if (isEnabled) enabled.push(name);
    }
    return enabled;
  }

  /**
   * Get list of disabled feature names
   *
   * @returns Array of disabled feature names
   */
  getDisabledFeatures(): FeatureFlagName[] {
    const disabled: FeatureFlagName[] = [];
    for (const [name, isEnabled] of this.flags) {
      if (!isEnabled) disabled.push(name);
    }
    return disabled;
  }
}

/**
 * Convenience getter for the singleton instance
 *
 * Note: Returns the current singleton instance. After calling
 * FeatureFlags.resetInstance(), this will return a new instance.
 */
export const featureFlags = {
  get instance(): FeatureFlags {
    return FeatureFlags.getInstance();
  },
  isEnabled(feature: FeatureFlagName): boolean {
    return FeatureFlags.getInstance().isEnabled(feature);
  },
  setFlag(feature: FeatureFlagName, enabled: boolean): void {
    FeatureFlags.getInstance().setFlag(feature, enabled);
  },
  getAllFlags(): Record<FeatureFlagName, boolean> {
    return FeatureFlags.getInstance().getAllFlags();
  },
  getAllFlagInfo(): FeatureFlagInfo[] {
    return FeatureFlags.getInstance().getAllFlagInfo();
  },
  refresh(): void {
    FeatureFlags.getInstance().refresh();
  },
  getEnabledCount(): number {
    return FeatureFlags.getInstance().getEnabledCount();
  },
  getEnabledFeatures(): FeatureFlagName[] {
    return FeatureFlags.getInstance().getEnabledFeatures();
  },
  getDisabledFeatures(): FeatureFlagName[] {
    return FeatureFlags.getInstance().getDisabledFeatures();
  },
};

/**
 * Helper function to check if a feature is enabled
 *
 * @param feature - Feature name to check
 * @returns True if feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlagName): boolean {
  return FeatureFlags.getInstance().isEnabled(feature);
}

/**
 * Helper function to run code only when a feature is enabled
 *
 * @param feature - Feature name to check
 * @param fn - Function to run if feature is enabled
 * @returns Result of function or undefined if disabled
 */
export function withFeature<T>(
  feature: FeatureFlagName,
  fn: () => T
): T | undefined {
  if (FeatureFlags.getInstance().isEnabled(feature)) {
    return fn();
  }
  return undefined;
}

/**
 * Helper function to run async code only when a feature is enabled
 *
 * @param feature - Feature name to check
 * @param fn - Async function to run if feature is enabled
 * @returns Promise of result or undefined if disabled
 */
export async function withFeatureAsync<T>(
  feature: FeatureFlagName,
  fn: () => Promise<T>
): Promise<T | undefined> {
  if (FeatureFlags.getInstance().isEnabled(feature)) {
    return fn();
  }
  return undefined;
}
