/**
 * Feature Flags for Agentic-Flow Integration
 *
 * Provides runtime feature flag management for selectively enabling
 * agentic-flow components based on configuration and availability.
 *
 * @module integrations/agentic-flow/feature-flags
 */
/**
 * Available feature flag names
 */
export type FeatureFlagName = 'agentdb' | 'reasoning-bank' | 'agent-booster' | 'model-router' | 'quic-transport' | 'federation-hub';
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
export declare class FeatureFlags {
    private static instance;
    private flags;
    private descriptions;
    private constructor();
    /**
     * Get the singleton instance
     *
     * @returns FeatureFlags singleton
     */
    static getInstance(): FeatureFlags;
    /**
     * Reset the singleton instance (for testing)
     */
    static resetInstance(): void;
    /**
     * Initialize flags from current configuration
     */
    private initializeFlags;
    /**
     * Check if a feature is enabled
     *
     * @param feature - Feature name to check
     * @returns True if feature is enabled
     */
    isEnabled(feature: FeatureFlagName): boolean;
    /**
     * Manually set a feature flag
     *
     * Useful for testing or runtime feature toggles.
     *
     * @param feature - Feature name
     * @param enabled - Whether to enable the feature
     */
    setFlag(feature: FeatureFlagName, enabled: boolean): void;
    /**
     * Get all feature flags as a record
     *
     * @returns Record of all flag names to their enabled status
     */
    getAllFlags(): Record<FeatureFlagName, boolean>;
    /**
     * Get detailed information about all flags
     *
     * @returns Array of feature flag info objects
     */
    getAllFlagInfo(): FeatureFlagInfo[];
    /**
     * Refresh flags from current configuration
     *
     * Call this after configuration changes to update flags.
     */
    refresh(): void;
    /**
     * Get enabled feature count
     *
     * @returns Number of enabled features
     */
    getEnabledCount(): number;
    /**
     * Get list of enabled feature names
     *
     * @returns Array of enabled feature names
     */
    getEnabledFeatures(): FeatureFlagName[];
    /**
     * Get list of disabled feature names
     *
     * @returns Array of disabled feature names
     */
    getDisabledFeatures(): FeatureFlagName[];
}
/**
 * Convenience getter for the singleton instance
 *
 * Note: Returns the current singleton instance. After calling
 * FeatureFlags.resetInstance(), this will return a new instance.
 */
export declare const featureFlags: {
    readonly instance: FeatureFlags;
    isEnabled(feature: FeatureFlagName): boolean;
    setFlag(feature: FeatureFlagName, enabled: boolean): void;
    getAllFlags(): Record<FeatureFlagName, boolean>;
    getAllFlagInfo(): FeatureFlagInfo[];
    refresh(): void;
    getEnabledCount(): number;
    getEnabledFeatures(): FeatureFlagName[];
    getDisabledFeatures(): FeatureFlagName[];
};
/**
 * Helper function to check if a feature is enabled
 *
 * @param feature - Feature name to check
 * @returns True if feature is enabled
 */
export declare function isFeatureEnabled(feature: FeatureFlagName): boolean;
/**
 * Helper function to run code only when a feature is enabled
 *
 * @param feature - Feature name to check
 * @param fn - Function to run if feature is enabled
 * @returns Result of function or undefined if disabled
 */
export declare function withFeature<T>(feature: FeatureFlagName, fn: () => T): T | undefined;
/**
 * Helper function to run async code only when a feature is enabled
 *
 * @param feature - Feature name to check
 * @param fn - Async function to run if feature is enabled
 * @returns Promise of result or undefined if disabled
 */
export declare function withFeatureAsync<T>(feature: FeatureFlagName, fn: () => Promise<T>): Promise<T | undefined>;
//# sourceMappingURL=feature-flags.d.ts.map