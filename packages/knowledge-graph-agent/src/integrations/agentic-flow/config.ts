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
export const defaultConfig: AgenticFlowConfig = {
  enabled: false,
  useAgentDB: false,
  useReasoningBank: false,
  useAgentBooster: false,
  useModelRouter: false,
  useQUICTransport: false,
  useFederationHub: false,
};

/**
 * Environment variable prefixes for configuration
 */
const ENV_PREFIX = 'KG_';

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
export function loadConfigFromEnv(): AgenticFlowConfig {
  return {
    enabled: process.env[`${ENV_PREFIX}AGENTIC_FLOW`] === 'true',
    useAgentDB: process.env[`${ENV_PREFIX}USE_AGENTDB`] === 'true',
    useReasoningBank: process.env[`${ENV_PREFIX}USE_REASONING_BANK`] === 'true',
    useAgentBooster: process.env[`${ENV_PREFIX}USE_AGENT_BOOSTER`] === 'true',
    useModelRouter: process.env[`${ENV_PREFIX}USE_MODEL_ROUTER`] === 'true',
    useQUICTransport: process.env[`${ENV_PREFIX}USE_QUIC_TRANSPORT`] === 'true',
    useFederationHub: process.env[`${ENV_PREFIX}USE_FEDERATION_HUB`] === 'true',
  };
}

/**
 * Global configuration instance
 */
let globalConfig: AgenticFlowConfig = { ...defaultConfig };

/**
 * Get the current agentic-flow configuration
 *
 * @returns Current configuration
 */
export function getAgenticFlowConfig(): AgenticFlowConfig {
  return { ...globalConfig };
}

/**
 * Set or update the agentic-flow configuration
 *
 * @param config - Partial configuration to merge
 */
export function setAgenticFlowConfig(config: Partial<AgenticFlowConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Reset configuration to defaults
 */
export function resetAgenticFlowConfig(): void {
  globalConfig = { ...defaultConfig };
}

/**
 * Initialize configuration from environment
 *
 * Call this at application startup to load environment-based configuration.
 */
export function initializeConfig(): void {
  const envConfig = loadConfigFromEnv();
  globalConfig = { ...defaultConfig, ...envConfig };
}

/**
 * Check if agentic-flow package is available
 *
 * Uses require.resolve to check for package availability without importing.
 *
 * @returns True if agentic-flow is installed
 */
export function isAgenticFlowAvailable(): boolean {
  try {
    // Use dynamic require.resolve to check package availability
    // This works with both CommonJS and ESM contexts
    require.resolve('agentic-flow');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if agentic-flow is both available and enabled
 *
 * @returns True if agentic-flow can be used
 */
export function isAgenticFlowEnabled(): boolean {
  return isAgenticFlowAvailable() && globalConfig.enabled;
}

/**
 * Validate configuration consistency
 *
 * Checks that enabled features have their dependencies met.
 *
 * @param config - Configuration to validate
 * @returns Validation result with any warnings
 */
export function validateConfig(config: AgenticFlowConfig): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for features enabled without main toggle
  const features = [
    { key: 'useAgentDB', name: 'AgentDB' },
    { key: 'useReasoningBank', name: 'ReasoningBank' },
    { key: 'useAgentBooster', name: 'AgentBooster' },
    { key: 'useModelRouter', name: 'ModelRouter' },
    { key: 'useQUICTransport', name: 'QUIC Transport' },
    { key: 'useFederationHub', name: 'FederationHub' },
  ] as const;

  for (const feature of features) {
    if (config[feature.key] && !config.enabled) {
      warnings.push(
        `${feature.name} is enabled but agentic-flow integration is disabled`
      );
    }
  }

  // Check for package availability
  if (config.enabled && !isAgenticFlowAvailable()) {
    warnings.push(
      'agentic-flow integration is enabled but package is not installed'
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
