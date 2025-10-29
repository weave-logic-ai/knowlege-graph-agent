/**
 * Configuration Module - Public API
 *
 * Exports all configuration-related functionality.
 */

// New configuration system (Phase 11)
export { ConfigManager, getConfigManager } from './config-manager.js';
export type { WeaverConfig, ServerConfig, DatabaseConfig, WorkflowsConfig, EmbeddingsConfig, PerceptionConfig, LearningConfig, GitConfig, VaultConfig, ObsidianConfig, AIConfig, FeatureFlags } from './schema.js';
export { configSchema, isSensitiveKey, maskSensitiveValue } from './schema.js';
export { defaultConfig, CONFIG_VERSION, USER_CONFIG_FILE, USER_CONFIG_DIR } from './defaults.js';
export { migrateConfig, needsMigration, getConfigVersion } from './migrations.js';

// Legacy configuration for backward compatibility
export { config, getAbsolutePath, resolveVaultPath, displayConfig } from './legacy.js';
