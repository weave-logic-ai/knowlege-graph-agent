# Concurrent Execution Architecture

## Overview

This document describes the architecture for running multiple services concurrently within the Knowledge Graph Agent:

1. **MCP Server** - stdio transport for Claude Desktop
2. **GraphQL API** - HTTP server for programmatic access
3. **Web Dashboard** - Next.js/Express for visual management
4. **Redis Cache** - Optional distributed caching and pub/sub

## Architecture Decision: Single Process Model

### Chosen Approach
**Single process with multiple servers** sharing a centralized ServiceContainer.

### Rationale
- **Simpler deployment**: Single binary/process to manage
- **Efficient resource sharing**: No IPC overhead between services
- **Direct memory sharing**: Singleton services work naturally
- **SQLite compatibility**: WAL mode works best with single process
- **Easier debugging**: Unified logging and error tracking
- **Graceful shutdown**: Coordinated cleanup is simpler

### Trade-offs
- All services fail together (mitigated by health checks)
- No horizontal scaling (acceptable for local development tooling)
- Memory pressure shared across services

---

## Component Architecture

```
+------------------------------------------------------------------+
|                     Knowledge Graph Agent Process                  |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------------+  +------------------------------+      |
|  |   ServiceContainer     |  |        Event Bus             |      |
|  |   (Singleton)          |  |   (Cross-service events)     |      |
|  +------------------------+  +------------------------------+      |
|           |                              |                         |
|           v                              v                         |
|  +------------------+  +------------------+  +------------------+  |
|  | KnowledgeGraph   |  |  AgentRegistry   |  | WorkflowRegistry |  |
|  | Database (SQLite)|  |  (Agent pool)    |  | (Workflow exec)  |  |
|  +------------------+  +------------------+  +------------------+  |
|           ^                    ^                    ^              |
|           |                    |                    |              |
|  +--------+--------------------+--------------------+--------+     |
|  |                                                           |     |
|  |  +-------------+  +---------------+  +---------------+    |     |
|  |  | MCP Server  |  | GraphQL API   |  | Web Dashboard |    |     |
|  |  | (stdio)     |  | (HTTP :4000)  |  | (HTTP :3000)  |    |     |
|  |  +-------------+  +---------------+  +---------------+    |     |
|  |                                                           |     |
|  +-----------------------------------------------------------+     |
|                                                                    |
|  +------------------+                                              |
|  | Redis Client     | <-- Optional                                 |
|  | (Pub/Sub, Cache) |                                              |
|  +------------------+                                              |
|                                                                    |
+------------------------------------------------------------------+
```

---

## File Structure

```
src/server/
  index.ts                  # Main orchestrator, ServiceContainer
  types.ts                  # Shared types and interfaces
  event-bus.ts              # Cross-service event emitter
  port-manager.ts           # Port conflict detection
  serve-command.ts          # CLI command implementation

  mcp/
    adapter.ts              # Adapts existing MCP server

  graphql/
    index.ts                # GraphQL server setup
    schema.ts               # Schema definition
    resolvers/
      query.ts              # Query resolvers
      mutation.ts           # Mutation resolvers
      subscription.ts       # Subscription resolvers

  dashboard/
    index.ts                # Express server
    routes/
      api.ts                # REST API routes
      health.ts             # Health check endpoints
    sse.ts                  # Server-Sent Events

  redis/
    client.ts               # Redis client wrapper
    pubsub.ts               # Pub/Sub integration
```

---

## ServiceContainer Implementation

```typescript
// src/server/types.ts

export interface ServerConfig {
  mcp: {
    enabled: boolean;
  };
  graphql: {
    enabled: boolean;
    port: number;
    playground: boolean;
  };
  dashboard: {
    enabled: boolean;
    port: number;
  };
  redis: {
    enabled: boolean;
    url?: string;
  };
  database: {
    path: string;
  };
}

export interface ServiceContainer {
  config: ServerConfig;
  database: KnowledgeGraphDatabase;
  cache: ShadowCache;
  agentRegistry: AgentRegistry;
  workflowRegistry: WorkflowRegistry;
  eventBus: EventEmitter;
  serviceManager: ServiceManager;

  // Server instances (optional based on config)
  mcpServer?: KnowledgeGraphMCPServer;
  graphqlServer?: GraphQLServer;
  dashboardServer?: DashboardServer;
  redisClient?: RedisClient;
}
```

```typescript
// src/server/index.ts

import { EventEmitter } from 'events';
import { createDatabase } from '../core/database.js';
import { createShadowCache } from '../core/cache.js';
import { createRegistry } from '../agents/registry.js';
import { createWorkflowRegistry } from '../workflows/registry.js';
import { createServiceManager } from '../services/manager.js';
import { createLogger } from '../utils/index.js';
import type { ServerConfig, ServiceContainer } from './types.js';

const logger = createLogger('server');

// Singleton instance
let container: ServiceContainer | null = null;

/**
 * Initialize or get the ServiceContainer singleton
 */
export async function getServiceContainer(
  config?: ServerConfig
): Promise<ServiceContainer> {
  if (container) {
    return container;
  }

  if (!config) {
    throw new Error('ServiceContainer not initialized. Provide config.');
  }

  logger.info('Initializing ServiceContainer...');

  // Initialize core services
  const database = createDatabase(config.database.path);
  const cache = createShadowCache({ maxSize: 1000, ttl: 300000 });
  const agentRegistry = createRegistry({ enableHealthMonitoring: true });
  const workflowRegistry = createWorkflowRegistry();
  const eventBus = new EventEmitter();
  eventBus.setMaxListeners(50); // Allow many listeners
  const serviceManager = createServiceManager();

  container = {
    config,
    database,
    cache,
    agentRegistry,
    workflowRegistry,
    eventBus,
    serviceManager,
  };

  logger.info('ServiceContainer initialized');
  return container;
}

/**
 * Check if container is initialized
 */
export function hasServiceContainer(): boolean {
  return container !== null;
}

/**
 * Shutdown and cleanup container
 */
export async function shutdownServiceContainer(): Promise<void> {
  if (!container) return;

  logger.info('Shutting down ServiceContainer...');

  // Shutdown servers
  if (container.mcpServer?.isServerRunning()) {
    await container.mcpServer.shutdown();
  }
  if (container.graphqlServer) {
    await container.graphqlServer.stop();
  }
  if (container.dashboardServer) {
    await container.dashboardServer.stop();
  }
  if (container.redisClient) {
    await container.redisClient.disconnect();
  }

  // Shutdown core services
  await container.serviceManager.shutdown();
  await container.agentRegistry.dispose();
  container.database.close();

  container = null;
  logger.info('ServiceContainer shutdown complete');
}
```

---

## Event Bus Implementation

```typescript
// src/server/event-bus.ts

import { EventEmitter } from 'events';
import { createLogger } from '../utils/index.js';

const logger = createLogger('event-bus');

export type EventType =
  // Graph events
  | 'graph:node:created'
  | 'graph:node:updated'
  | 'graph:node:deleted'
  | 'graph:edge:created'
  | 'graph:edge:deleted'
  // Agent events
  | 'agent:spawned'
  | 'agent:terminated'
  | 'agent:task:started'
  | 'agent:task:completed'
  | 'agent:task:failed'
  // Workflow events
  | 'workflow:started'
  | 'workflow:step:completed'
  | 'workflow:completed'
  | 'workflow:failed'
  // System events
  | 'health:check'
  | 'service:started'
  | 'service:stopped';

export interface EventPayload {
  type: EventType;
  timestamp: Date;
  source: string;
  data: Record<string, unknown>;
}

export class TypedEventBus extends EventEmitter {
  private subscribers = new Map<EventType, Set<string>>();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Emit a typed event
   */
  emitEvent(type: EventType, source: string, data: Record<string, unknown>): void {
    const payload: EventPayload = {
      type,
      timestamp: new Date(),
      source,
      data,
    };

    logger.debug(`Event: ${type}`, { source, data });
    this.emit(type, payload);
    this.emit('*', payload); // Wildcard for listeners that want all events
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe(
    type: EventType | '*',
    handler: (payload: EventPayload) => void,
    subscriberId: string
  ): () => void {
    this.on(type, handler);

    if (!this.subscribers.has(type as EventType)) {
      this.subscribers.set(type as EventType, new Set());
    }
    this.subscribers.get(type as EventType)!.add(subscriberId);

    // Return unsubscribe function
    return () => {
      this.off(type, handler);
      this.subscribers.get(type as EventType)?.delete(subscriberId);
    };
  }
}

export function createEventBus(): TypedEventBus {
  return new TypedEventBus();
}
```

---

## Port Manager Implementation

```typescript
// src/server/port-manager.ts

import { createServer } from 'net';
import { createLogger } from '../utils/index.js';

const logger = createLogger('port-manager');

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find an available port starting from the preferred port
 */
export async function findAvailablePort(
  preferredPort: number,
  maxAttempts: number = 10
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = preferredPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
    logger.debug(`Port ${port} in use, trying ${port + 1}`);
  }
  throw new Error(
    `No available port found in range ${preferredPort}-${preferredPort + maxAttempts}`
  );
}

/**
 * Validate all required ports are available
 */
export async function validatePorts(
  ports: { name: string; port: number }[]
): Promise<{ valid: boolean; conflicts: string[] }> {
  const conflicts: string[] = [];

  for (const { name, port } of ports) {
    if (!(await isPortAvailable(port))) {
      conflicts.push(`${name} port ${port} is already in use`);
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}
```

---

## CLI Serve Command

```typescript
// src/server/serve-command.ts

import { Command } from 'commander';
import chalk from 'chalk';
import { resolve } from 'path';
import {
  getServiceContainer,
  shutdownServiceContainer,
} from './index.js';
import { validatePorts, findAvailablePort } from './port-manager.js';
import { startMCPServer } from './mcp/adapter.js';
import { startGraphQLServer } from './graphql/index.js';
import { startDashboardServer } from './dashboard/index.js';
import { connectRedis } from './redis/client.js';
import type { ServerConfig } from './types.js';

export function createServeCommand(): Command {
  const command = new Command('serve')
    .description('Start knowledge graph servers')
    .option('--mcp', 'Enable MCP server (stdio)')
    .option('--graphql', 'Enable GraphQL API')
    .option('--graphql-port <port>', 'GraphQL port', '4000')
    .option('--dashboard', 'Enable web dashboard')
    .option('--dashboard-port <port>', 'Dashboard port', '3000')
    .option('--redis <url>', 'Redis connection URL')
    .option('--all', 'Enable all services')
    .option('--db <path>', 'Database path', '.kg/knowledge-graph.db')
    .action(async (options) => {
      const config: ServerConfig = {
        mcp: {
          enabled: options.all || options.mcp,
        },
        graphql: {
          enabled: options.all || options.graphql,
          port: parseInt(options.graphqlPort, 10),
          playground: true,
        },
        dashboard: {
          enabled: options.all || options.dashboard,
          port: parseInt(options.dashboardPort, 10),
        },
        redis: {
          enabled: !!options.redis,
          url: options.redis,
        },
        database: {
          path: resolve(process.cwd(), options.db),
        },
      };

      // Validate at least one service is enabled
      if (!config.mcp.enabled && !config.graphql.enabled && !config.dashboard.enabled) {
        console.error(chalk.red('Error: At least one service must be enabled.'));
        console.log(chalk.gray('Use --mcp, --graphql, --dashboard, or --all'));
        process.exit(1);
      }

      // Validate ports
      const portsToCheck: { name: string; port: number }[] = [];
      if (config.graphql.enabled) {
        portsToCheck.push({ name: 'GraphQL', port: config.graphql.port });
      }
      if (config.dashboard.enabled) {
        portsToCheck.push({ name: 'Dashboard', port: config.dashboard.port });
      }

      if (portsToCheck.length > 0) {
        const { valid, conflicts } = await validatePorts(portsToCheck);
        if (!valid) {
          console.error(chalk.red('Port conflicts detected:'));
          conflicts.forEach(c => console.error(chalk.red(`  - ${c}`)));
          process.exit(1);
        }
      }

      try {
        // Initialize service container
        const container = await getServiceContainer(config);
        console.log(chalk.green('Service container initialized'));

        // Start enabled servers
        const startups: Promise<void>[] = [];

        if (config.mcp.enabled) {
          startups.push(
            startMCPServer(container).then(() => {
              console.log(chalk.cyan('MCP Server: Running on stdio'));
            })
          );
        }

        if (config.graphql.enabled) {
          startups.push(
            startGraphQLServer(container).then((server) => {
              container.graphqlServer = server;
              console.log(
                chalk.cyan(`GraphQL API: http://localhost:${config.graphql.port}/graphql`)
              );
            })
          );
        }

        if (config.dashboard.enabled) {
          startups.push(
            startDashboardServer(container).then((server) => {
              container.dashboardServer = server;
              console.log(
                chalk.cyan(`Dashboard: http://localhost:${config.dashboard.port}`)
              );
            })
          );
        }

        if (config.redis.enabled && config.redis.url) {
          startups.push(
            connectRedis(config.redis.url, container.eventBus).then((client) => {
              container.redisClient = client;
              console.log(chalk.cyan('Redis: Connected'));
            })
          );
        }

        await Promise.all(startups);

        console.log(chalk.green('\nAll services started successfully'));
        console.log(chalk.gray('Press Ctrl+C to stop\n'));

        // Setup graceful shutdown
        const shutdown = async (signal: string) => {
          console.log(chalk.yellow(`\nReceived ${signal}, shutting down...`));
          await shutdownServiceContainer();
          console.log(chalk.green('Shutdown complete'));
          process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

      } catch (error) {
        console.error(chalk.red('Failed to start servers:'), error);
        await shutdownServiceContainer();
        process.exit(1);
      }
    });

  return command;
}
```

---

## GraphQL Server Implementation

```typescript
// src/server/graphql/index.ts

import { createServer } from 'http';
import { createYoga } from 'graphql-yoga';
import { createSchema } from './schema.js';
import { createResolvers } from './resolvers/index.js';
import type { ServiceContainer } from '../types.js';

export interface GraphQLServer {
  stop(): Promise<void>;
}

export async function startGraphQLServer(
  container: ServiceContainer
): Promise<GraphQLServer> {
  const { config, database, agentRegistry, workflowRegistry, eventBus } = container;

  const schema = createSchema();
  const resolvers = createResolvers({
    database,
    agentRegistry,
    workflowRegistry,
    eventBus,
  });

  const yoga = createYoga({
    schema,
    context: () => ({
      database,
      agentRegistry,
      workflowRegistry,
      eventBus,
    }),
    graphqlEndpoint: '/graphql',
    landingPage: config.graphql.playground,
  });

  const server = createServer(yoga);

  return new Promise((resolve) => {
    server.listen(config.graphql.port, () => {
      resolve({
        stop: () => new Promise((res) => server.close(() => res())),
      });
    });
  });
}
```

```typescript
// src/server/graphql/schema.ts

import { makeExecutableSchema } from '@graphql-tools/schema';

const typeDefs = /* GraphQL */ `
  type Query {
    # Graph queries
    nodes(query: String, type: NodeType, status: NodeStatus, limit: Int): [Node!]!
    node(id: ID!): Node
    nodeByPath(path: String!): Node
    graphStats: GraphStats!
    tags: [TagCount!]!

    # Agent queries
    agents(type: AgentType, status: AgentStatus): [Agent!]!
    agent(id: ID!): Agent

    # Workflow queries
    workflows: [Workflow!]!
    workflow(id: ID!): Workflow
    workflowExecution(id: ID!): WorkflowExecution

    # System queries
    health: Health!
  }

  type Mutation {
    # Node mutations
    createNode(input: CreateNodeInput!): Node!
    updateNode(id: ID!, input: UpdateNodeInput!): Node!
    deleteNode(id: ID!): Boolean!

    # Agent mutations
    spawnAgent(type: AgentType!, name: String, task: String!): AgentResult!
    terminateAgent(id: ID!): Boolean!

    # Workflow mutations
    startWorkflow(id: ID!, input: JSON): WorkflowExecution!
    cancelWorkflow(executionId: ID!): Boolean!
  }

  type Subscription {
    # Real-time updates
    nodeChanged(types: [EventType!]): NodeEvent!
    agentEvent: AgentEvent!
    workflowEvent(executionId: ID): WorkflowEvent!
  }

  # Types
  enum NodeType {
    concept
    technical
    feature
    primitive
    service
    guide
    standard
    integration
  }

  enum NodeStatus {
    draft
    active
    deprecated
    archived
  }

  enum AgentType {
    researcher
    coder
    tester
    analyst
    architect
    reviewer
    coordinator
    optimizer
    documenter
  }

  enum AgentStatus {
    idle
    running
    completed
    failed
    paused
    terminated
  }

  enum EventType {
    created
    updated
    deleted
  }

  type Node {
    id: ID!
    path: String!
    filename: String!
    title: String!
    type: NodeType!
    status: NodeStatus!
    content: String
    tags: [String!]!
    wordCount: Int!
    outgoingLinks: [Link!]!
    incomingLinks: [Link!]!
    lastModified: String!
  }

  type Link {
    target: String!
    type: String!
    context: String
  }

  type GraphStats {
    totalNodes: Int!
    totalEdges: Int!
    nodesByType: JSON!
    nodesByStatus: JSON!
    orphanNodes: Int!
    avgLinksPerNode: Float!
  }

  type TagCount {
    name: String!
    count: Int!
  }

  type Agent {
    id: ID!
    type: AgentType!
    name: String!
    status: AgentStatus!
    currentTask: String
    queuedTasks: Int!
    completedTasks: Int!
  }

  type AgentResult {
    success: Boolean!
    agentId: ID
    taskId: ID
    result: JSON
    error: String
  }

  type Workflow {
    id: ID!
    name: String!
    version: String!
    description: String
    steps: [WorkflowStep!]!
    tags: [String!]
  }

  type WorkflowStep {
    id: ID!
    name: String!
    description: String
    dependencies: [String!]
  }

  type WorkflowExecution {
    id: ID!
    workflowId: ID!
    status: String!
    progress: Int!
    currentStep: String
    startedAt: String
    completedAt: String
    error: String
  }

  type Health {
    status: String!
    database: Boolean!
    cache: Boolean!
    agents: Boolean!
    uptime: Float!
  }

  # Events
  type NodeEvent {
    type: EventType!
    node: Node!
    timestamp: String!
  }

  type AgentEvent {
    type: String!
    agentId: ID!
    data: JSON
    timestamp: String!
  }

  type WorkflowEvent {
    type: String!
    executionId: ID!
    stepId: String
    data: JSON
    timestamp: String!
  }

  # Inputs
  input CreateNodeInput {
    path: String!
    title: String!
    type: NodeType!
    content: String
    tags: [String!]
  }

  input UpdateNodeInput {
    title: String
    content: String
    status: NodeStatus
    tags: [String!]
  }

  scalar JSON
`;

export function createSchema() {
  return makeExecutableSchema({ typeDefs });
}
```

---

## Dashboard Server Implementation

```typescript
// src/server/dashboard/index.ts

import express from 'express';
import cors from 'cors';
import { createServer as createHttpServer } from 'http';
import { setupSSE } from './sse.js';
import { createApiRoutes } from './routes/api.js';
import { createHealthRoutes } from './routes/health.js';
import type { ServiceContainer } from '../types.js';

export interface DashboardServer {
  stop(): Promise<void>;
}

export async function startDashboardServer(
  container: ServiceContainer
): Promise<DashboardServer> {
  const app = express();
  const httpServer = createHttpServer(app);

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api', createApiRoutes(container));
  app.use('/health', createHealthRoutes(container));

  // SSE endpoint for real-time updates
  app.get('/api/events', (req, res) => {
    setupSSE(req, res, container.eventBus);
  });

  // Static files (if building a full dashboard)
  // app.use(express.static('dashboard/dist'));

  return new Promise((resolve) => {
    httpServer.listen(container.config.dashboard.port, () => {
      resolve({
        stop: () => new Promise((res) => httpServer.close(() => res())),
      });
    });
  });
}
```

```typescript
// src/server/dashboard/sse.ts

import type { Request, Response } from 'express';
import type { TypedEventBus, EventPayload } from '../event-bus.js';

export function setupSSE(
  req: Request,
  res: Response,
  eventBus: TypedEventBus
): void {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: new Date() })}\n\n`);

  // Subscribe to all events
  const unsubscribe = eventBus.subscribe(
    '*',
    (payload: EventPayload) => {
      res.write(`event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`);
    },
    `sse-${Date.now()}`
  );

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 30000);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
}
```

---

## Startup and Shutdown Sequence

### Startup Sequence

1. Parse CLI options and validate configuration
2. Initialize ServiceContainer singleton
3. Initialize database connection (shared)
4. Initialize cache (shared)
5. Initialize agent registry (shared)
6. Initialize workflow registry (shared)
7. Initialize event bus (shared)
8. Check port availability for HTTP services
9. Start enabled servers in parallel
10. Register signal handlers for graceful shutdown
11. Log startup complete with service URLs

### Shutdown Sequence

1. Receive SIGINT/SIGTERM signal
2. Stop accepting new connections
3. Wait for in-flight requests to complete (timeout: 30s)
4. Stop HTTP servers (GraphQL, Dashboard)
5. Close MCP server connection
6. Flush pending writes to database
7. Close Redis connection if active
8. Close database connection
9. Exit process

---

## CLI Usage Examples

```bash
# MCP server only (for Claude Desktop config)
kg serve --mcp

# GraphQL API only
kg serve --graphql
kg serve --graphql --graphql-port 5000

# Dashboard only
kg serve --dashboard
kg serve --dashboard --dashboard-port 8080

# Multiple services
kg serve --graphql --dashboard
kg serve --mcp --graphql --dashboard

# All services
kg serve --all

# With Redis for cross-process events
kg serve --all --redis redis://localhost:6379

# Custom database path
kg serve --graphql --db /path/to/knowledge.db
```

---

## Implementation Priority

### Phase 1: Core Infrastructure
1. ServiceContainer implementation
2. Event bus with typed events
3. Port manager utilities
4. Serve command skeleton

### Phase 2: MCP Adapter
1. Adapt existing MCP server to use ServiceContainer
2. Maintain backward compatibility

### Phase 3: GraphQL API
1. Schema definition
2. Query resolvers
3. Mutation resolvers
4. Subscription support

### Phase 4: Dashboard
1. Express server setup
2. API routes
3. SSE for real-time updates
4. Basic health endpoints

### Phase 5: Redis Integration (Optional)
1. Redis client wrapper
2. Pub/Sub integration with event bus
3. Distributed cache layer
