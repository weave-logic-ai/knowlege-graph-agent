/**
 * Server Infrastructure Types
 *
 * Type definitions for the unified server system that coordinates
 * MCP, GraphQL, and Dashboard servers in a single process.
 *
 * @module server/types
 */

import type { EventEmitter } from 'events';
import type { Server as HTTPServer } from 'http';
import type { KnowledgeGraphDatabase } from '../core/database.js';
import type { ShadowCache } from '../core/cache.js';
import type { AgentRegistry } from '../agents/registry.js';
import type { WorkflowRegistry } from '../workflows/registry.js';
import type { KnowledgeGraphMCPServer } from '../mcp-server/server.js';

// ============================================================================
// Server Configuration Types
// ============================================================================

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  /** Enable MCP server */
  enabled: boolean;
  /** Server name */
  name?: string;
  /** Server version */
  version?: string;
}

/**
 * GraphQL server configuration
 */
export interface GraphQLServerConfig {
  /** Enable GraphQL server */
  enabled: boolean;
  /** Port to listen on */
  port: number;
  /** Enable GraphQL Playground */
  playground?: boolean;
  /** Enable introspection */
  introspection?: boolean;
  /** CORS configuration */
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
  };
}

/**
 * Dashboard server configuration
 */
export interface DashboardServerConfig {
  /** Enable dashboard server */
  enabled: boolean;
  /** Port to listen on */
  port: number;
  /** Enable hot reload for development */
  hotReload?: boolean;
  /** Path to static assets */
  staticPath?: string;
}

/**
 * Database configuration
 */
export interface DatabaseServerConfig {
  /** Path to SQLite database */
  path: string;
  /** Enable WAL mode */
  wal?: boolean;
  /** Busy timeout in milliseconds */
  busyTimeout?: number;
}

/**
 * Cache configuration
 */
export interface CacheServerConfig {
  /** Enable caching */
  enabled: boolean;
  /** Default TTL in milliseconds */
  defaultTTL?: number;
  /** Maximum entries */
  maxEntries?: number;
}

/**
 * Complete server configuration
 */
export interface ServerConfig {
  /** Project root directory */
  projectRoot: string;
  /** MCP server configuration */
  mcp: MCPServerConfig;
  /** GraphQL server configuration */
  graphql: GraphQLServerConfig;
  /** Dashboard server configuration */
  dashboard: DashboardServerConfig;
  /** Database configuration */
  database: DatabaseServerConfig;
  /** Cache configuration */
  cache: CacheServerConfig;
  /** Enable verbose logging */
  verbose?: boolean;
}

// ============================================================================
// Server State Types
// ============================================================================

/**
 * Server status enumeration
 */
export type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

/**
 * Individual server state
 */
export interface ServerState {
  /** Current status */
  status: ServerStatus;
  /** When the server started */
  startedAt?: Date;
  /** Port the server is listening on (if applicable) */
  port?: number;
  /** Error message if status is 'error' */
  error?: string;
  /** Request count */
  requestCount: number;
}

/**
 * Overall server manager state
 */
export interface ServerManagerState {
  /** MCP server state */
  mcp: ServerState;
  /** GraphQL server state */
  graphql: ServerState;
  /** Dashboard server state */
  dashboard: ServerState;
  /** Overall system status */
  overall: ServerStatus;
  /** When the manager was initialized */
  initializedAt?: Date;
}

// ============================================================================
// Health Check Types
// ============================================================================

/**
 * Component health status
 */
export interface ComponentHealth {
  /** Component name */
  name: string;
  /** Is the component healthy */
  healthy: boolean;
  /** Status message */
  message?: string;
  /** Additional metrics */
  metrics?: Record<string, number | string>;
  /** Last check timestamp */
  lastCheck: Date;
}

/**
 * Overall health status
 */
export interface HealthStatus {
  /** Overall health status */
  healthy: boolean;
  /** Overall status string */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Component health details */
  components: ComponentHealth[];
  /** System uptime in milliseconds */
  uptime: number;
  /** Total requests across all servers */
  totalRequests: number;
  /** Memory usage */
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Server event types
 */
export type ServerEventType =
  | 'server:starting'
  | 'server:started'
  | 'server:stopping'
  | 'server:stopped'
  | 'server:error'
  | 'request:received'
  | 'request:completed'
  | 'request:error'
  | 'health:check'
  | 'config:changed';

/**
 * Server event payload
 */
export interface ServerEvent {
  /** Event type */
  type: ServerEventType;
  /** Which server (mcp, graphql, dashboard) */
  server?: 'mcp' | 'graphql' | 'dashboard';
  /** Event timestamp */
  timestamp: Date;
  /** Event data */
  data?: Record<string, unknown>;
  /** Error if applicable */
  error?: Error;
}

/**
 * Server event listener
 */
export type ServerEventListener = (event: ServerEvent) => void | Promise<void>;

// ============================================================================
// Shared Services Interface
// ============================================================================

/**
 * Shared services available to all server components
 */
export interface ISharedServices {
  /** Knowledge graph database */
  database: KnowledgeGraphDatabase;
  /** File metadata cache */
  cache: ShadowCache;
  /** Agent registry */
  agentRegistry: AgentRegistry;
  /** Workflow registry */
  workflowRegistry: WorkflowRegistry;
  /** Cross-service event bus */
  eventBus: EventEmitter;
  /** Project root directory */
  projectRoot: string;
  /** Configuration */
  config: ServerConfig;

  /** Initialize all services */
  initialize(): Promise<void>;
  /** Shutdown all services */
  shutdown(): Promise<void>;
  /** Check if services are initialized */
  isInitialized(): boolean;
  /** Get service health status */
  getHealth(): HealthStatus;
}

// ============================================================================
// Server Manager Interface
// ============================================================================

/**
 * Server manager interface
 */
export interface IServerManager {
  /** Start MCP server */
  startMCP(): Promise<void>;
  /** Start GraphQL server */
  startGraphQL(port?: number): Promise<void>;
  /** Start Dashboard server */
  startDashboard(port?: number): Promise<void>;
  /** Start all enabled servers */
  startAll(): Promise<void>;
  /** Stop a specific server */
  stop(server: 'mcp' | 'graphql' | 'dashboard'): Promise<void>;
  /** Graceful shutdown of all servers */
  gracefulShutdown(): Promise<void>;
  /** Get current state */
  getState(): ServerManagerState;
  /** Get health status */
  getHealth(): HealthStatus;
  /** Subscribe to events */
  on(event: ServerEventType, listener: ServerEventListener): void;
  /** Unsubscribe from events */
  off(event: ServerEventType, listener: ServerEventListener): void;
}

// ============================================================================
// Server Instance Types
// ============================================================================

/**
 * HTTP server instance with metadata
 */
export interface HTTPServerInstance {
  /** HTTP server */
  server: HTTPServer;
  /** Port listening on */
  port: number;
  /** Server type */
  type: 'graphql' | 'dashboard';
  /** Start time */
  startedAt: Date;
}

/**
 * MCP server instance wrapper
 */
export interface MCPServerInstance {
  /** MCP server */
  server: KnowledgeGraphMCPServer;
  /** Start time */
  startedAt: Date;
}

// ============================================================================
// CLI Options Types
// ============================================================================

/**
 * CLI serve command options
 */
export interface ServeCommandOptions {
  /** Enable MCP server */
  mcp?: boolean;
  /** Enable GraphQL server */
  graphql?: boolean;
  /** Enable Dashboard server */
  dashboard?: boolean;
  /** GraphQL port */
  portGraphql?: string | number;
  /** Dashboard port */
  portDashboard?: string | number;
  /** Enable all servers */
  all?: boolean;
  /** Database path */
  db?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Parsed serve options with defaults applied
 */
export interface ParsedServeOptions {
  mcp: boolean;
  graphql: boolean;
  dashboard: boolean;
  graphqlPort: number;
  dashboardPort: number;
  databasePath: string;
  verbose: boolean;
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default port for GraphQL server
 */
export const DEFAULT_GRAPHQL_PORT = 4000;

/**
 * Default port for Dashboard server
 */
export const DEFAULT_DASHBOARD_PORT = 3000;

/**
 * Default database path
 */
export const DEFAULT_DATABASE_PATH = '.kg/knowledge.db';

/**
 * Shutdown timeout in milliseconds
 */
export const SHUTDOWN_TIMEOUT = 10000;

/**
 * Health check interval in milliseconds
 */
export const HEALTH_CHECK_INTERVAL = 30000;
