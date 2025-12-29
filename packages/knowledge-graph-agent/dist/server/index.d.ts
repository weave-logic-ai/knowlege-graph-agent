/**
 * Server Infrastructure Module
 *
 * Provides unified server management for MCP, GraphQL, and Dashboard
 * servers running concurrently in a single Node.js process.
 *
 * @module server
 *
 * @example
 * ```typescript
 * import { createServerManager, createSharedServices } from './server';
 *
 * // Create and start servers
 * const manager = await createServerManager({
 *   projectRoot: process.cwd(),
 *   mcp: { enabled: true },
 *   graphql: { enabled: true, port: 4000 },
 *   dashboard: { enabled: true, port: 3000 },
 *   database: { path: '.kg/knowledge.db' },
 *   cache: { enabled: true },
 * });
 *
 * await manager.startAll();
 *
 * // Graceful shutdown on signals
 * process.on('SIGINT', () => manager.gracefulShutdown());
 * ```
 */
export type { MCPServerConfig, GraphQLServerConfig, DashboardServerConfig, DatabaseServerConfig, CacheServerConfig, ServerConfig, ServerStatus, ServerState, ServerManagerState, ComponentHealth, HealthStatus, ServerEventType, ServerEvent, ServerEventListener, HTTPServerInstance, MCPServerInstance, ServeCommandOptions, ParsedServeOptions, ISharedServices, IServerManager, } from './types.js';
export { DEFAULT_GRAPHQL_PORT, DEFAULT_DASHBOARD_PORT, DEFAULT_DATABASE_PATH, SHUTDOWN_TIMEOUT, HEALTH_CHECK_INTERVAL, } from './types.js';
export { SharedServices, createSharedServices, getSharedServices, createDefaultConfig, } from './shared-services.js';
export { ServerManager, createServerManager, } from './manager.js';
export { ServiceContainer, createServiceContainer, getServiceContainer, hasServiceContainer, shutdownServiceContainer, } from './container.js';
export type { ServiceInitState, ServiceDependency, ContainerConfig, ContainerEventType, } from './container.js';
export { TypedEventBus, createTypedEventBus, createSubscriptionIterator, createNodeTypeFilter, createSourceFilter, } from './event-bus.js';
export type { EventType, EventDataMap, EventEntry, EventFilter, EventHandler, Unsubscribe, NodeEventData, RelationEventData, AgentEventData, WorkflowEventData, PluginEventData, HealthEventData, CacheEvictionData, EventTypeMetrics, EventBusMetrics, ITypedEventBus, TypedEventBusOptions, } from './event-bus.js';
//# sourceMappingURL=index.d.ts.map