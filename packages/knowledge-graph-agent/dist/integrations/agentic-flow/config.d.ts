/**
 * Agentic-Flow Configuration
 *
 * Configuration management for optional agentic-flow integration.
 * Provides feature flags and environment-based configuration loading.
 *
 * @module integrations/agentic-flow/config
 */
/**
 * Configuration for agentic-flow integration features
 */
export interface AgenticFlowConfig {
    /**
     * Whether agentic-flow integration is enabled
     */
    enabled: boolean;
    /**
     * Use AgentDB for vector storage (150x faster GNN-enhanced search)
     */
    useAgentDB: boolean;
    /**
     * Use ReasoningBank for adaptive learning and memory distillation
     */
    useReasoningBank: boolean;
    /**
     * Use AgentBooster for dynamic capability enhancement
     */
    useAgentBooster: boolean;
    /**
     * Use ModelRouter for intelligent LLM routing
     */
    useModelRouter: boolean;
    /**
     * Use QUIC transport for high-performance data synchronization
     */
    useQUICTransport: boolean;
    /**
     * Use FederationHub for multi-agent coordination
     */
    useFederationHub: boolean;
}
/**
 * Default configuration with all features disabled
 */
export declare const defaultConfig: AgenticFlowConfig;
/**
 * Load configuration from environment variables
 *
 * Environment variables:
 * - KG_AGENTIC_FLOW: Enable agentic-flow integration
 * - KG_USE_AGENTDB: Enable AgentDB vector store
 * - KG_USE_REASONING_BANK: Enable ReasoningBank
 * - KG_USE_AGENT_BOOSTER: Enable AgentBooster
 * - KG_USE_MODEL_ROUTER: Enable ModelRouter
 * - KG_USE_QUIC_TRANSPORT: Enable QUIC transport
 * - KG_USE_FEDERATION_HUB: Enable FederationHub
 *
 * @returns Configuration loaded from environment
 */
export declare function loadConfigFromEnv(): AgenticFlowConfig;
/**
 * Get the current agentic-flow configuration
 *
 * @returns Current configuration
 */
export declare function getAgenticFlowConfig(): AgenticFlowConfig;
/**
 * Set or update the agentic-flow configuration
 *
 * @param config - Partial configuration to merge
 */
export declare function setAgenticFlowConfig(config: Partial<AgenticFlowConfig>): void;
/**
 * Reset configuration to defaults
 */
export declare function resetAgenticFlowConfig(): void;
/**
 * Initialize configuration from environment
 *
 * Call this at application startup to load environment-based configuration.
 */
export declare function initializeConfig(): void;
/**
 * Check if agentic-flow package is available
 *
 * Uses require.resolve to check for package availability without importing.
 *
 * @returns True if agentic-flow is installed
 */
export declare function isAgenticFlowAvailable(): boolean;
/**
 * Check if agentic-flow is both available and enabled
 *
 * @returns True if agentic-flow can be used
 */
export declare function isAgenticFlowEnabled(): boolean;
/**
 * Validate configuration consistency
 *
 * Checks that enabled features have their dependencies met.
 *
 * @param config - Configuration to validate
 * @returns Validation result with any warnings
 */
export declare function validateConfig(config: AgenticFlowConfig): {
    valid: boolean;
    warnings: string[];
};
//# sourceMappingURL=config.d.ts.map