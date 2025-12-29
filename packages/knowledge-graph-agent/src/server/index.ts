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

// Types
export type {
  // Configuration types
  MCPServerConfig,
  GraphQLServerConfig,
  DashboardServerConfig,
  DatabaseServerConfig,
  CacheServerConfig,
  ServerConfig,

  // State types
  ServerStatus,
  ServerState,
  ServerManagerState,

  // Health types
  ComponentHealth,
  HealthStatus,

  // Event types
  ServerEventType,
  ServerEvent,
  ServerEventListener,

  // Instance types
  HTTPServerInstance,
  MCPServerInstance,

  // CLI types
  ServeCommandOptions,
  ParsedServeOptions,

  // Interface types
  ISharedServices,
  IServerManager,
} from './types.js';

// Constants
export {
  DEFAULT_GRAPHQL_PORT,
  DEFAULT_DASHBOARD_PORT,
  DEFAULT_DATABASE_PATH,
  SHUTDOWN_TIMEOUT,
  HEALTH_CHECK_INTERVAL,
} from './types.js';

// Shared Services
export {
  SharedServices,
  createSharedServices,
  getSharedServices,
  createDefaultConfig,
} from './shared-services.js';

// Server Manager
export {
  ServerManager,
  createServerManager,
} from './manager.js';

// Service Container
export {
  ServiceContainer,
  createServiceContainer,
  getServiceContainer,
  hasServiceContainer,
  shutdownServiceContainer,
} from './container.js';

// Service Container Types
export type {
  ServiceInitState,
  ServiceDependency,
  ContainerConfig,
  ContainerEventType,
} from './container.js';

// TypedEventBus
export {
  TypedEventBus,
  createTypedEventBus,
  createSubscriptionIterator,
  createNodeTypeFilter,
  createSourceFilter,
} from './event-bus.js';

// TypedEventBus Types
export type {
  // Event Types
  EventType,
  EventDataMap,
  EventEntry,
  EventFilter,
  EventHandler,
  Unsubscribe,

  // Event Data Types
  NodeEventData,
  RelationEventData,
  AgentEventData,
  WorkflowEventData,
  PluginEventData,
  HealthEventData,
  CacheEvictionData,

  // Metrics Types
  EventTypeMetrics,
  EventBusMetrics,

  // Interface and Options
  ITypedEventBus,
  TypedEventBusOptions,
} from './event-bus.js';
