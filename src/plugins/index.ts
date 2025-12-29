/**
 * Plugin System
 *
 * Exports plugin system types and utilities for the knowledge-graph-agent.
 *
 * @module plugins
 */

// Re-export all types from base
export * from './types.js';

// Plugin manager exports (basic implementations)
export {
  PluginManagerImpl,
  PluginRegistryImpl,
  PluginLoaderImpl,
  createPluginManager,
  createPluginRegistry,
  createPluginLoader,
  createDefaultPluginManager,
} from './manager.js';

// Advanced plugin registry with validation, dependencies, and events
export {
  AdvancedPluginRegistry,
  createAdvancedPluginRegistry,
  type CompatibilityResult,
} from './registry.js';

// Advanced plugin loader with caching and hot-reload
export {
  AdvancedPluginLoader,
  createAdvancedPluginLoader,
} from './loader.js';

// Re-export all analyzers from the analyzers index
export * from './analyzers/index.js';
