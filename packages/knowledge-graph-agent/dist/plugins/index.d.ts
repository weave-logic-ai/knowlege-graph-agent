/**
 * Plugin System
 *
 * Exports plugin system types and utilities for the knowledge-graph-agent.
 *
 * @module plugins
 */
export * from './types.js';
export { PluginManagerImpl, PluginRegistryImpl, PluginLoaderImpl, createPluginManager, createPluginRegistry, createPluginLoader, createDefaultPluginManager, } from './manager.js';
export { AdvancedPluginRegistry, createAdvancedPluginRegistry, type CompatibilityResult, } from './registry.js';
export { AdvancedPluginLoader, createAdvancedPluginLoader, } from './loader.js';
export * from './analyzers/index.js';
//# sourceMappingURL=index.d.ts.map