/**
 * GraphQL Server Setup
 *
 * Provides GraphQL server configuration using graphql-yoga with WebSocket
 * subscriptions, CORS configuration, health checks, and GraphiQL playground.
 *
 * @module graphql/server
 */

import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createYoga, type YogaServerInstance } from 'graphql-yoga';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { createLogger } from '../utils/index.js';
import { createContextFactory, type GraphQLContext, type ContextFactoryConfig } from './context.js';
import { customScalars } from './scalars.js';
import type { KnowledgeGraphDatabase } from '../core/database.js';
import type { AdvancedCache } from '../caching/lru-cache.js';
import type { ServiceManager } from '../services/index.js';

const logger = createLogger('graphql-server');

// ============================================================================
// Types
// ============================================================================

/**
 * GraphQL server configuration options
 */
export interface GraphQLServerConfig {
  /** Port to listen on */
  port: number;
  /** Host to bind to */
  host?: string;
  /** Path for GraphQL endpoint */
  graphqlPath?: string;
  /** Path for health check endpoint */
  healthPath?: string;
  /** Enable GraphiQL playground */
  enableGraphiQL?: boolean;
  /** Enable WebSocket subscriptions */
  enableSubscriptions?: boolean;
  /** CORS configuration */
  cors?: CorsConfig;
  /** Database instance */
  database: KnowledgeGraphDatabase;
  /** Cache instance */
  cache: AdvancedCache<unknown>;
  /** Service manager instance */
  serviceManager: ServiceManager;
  /** API key for authentication (optional) */
  apiKey?: string;
  /** Whether to require authentication */
  requireAuth?: boolean;
  /** Custom resolvers (merged with defaults) */
  resolvers?: Record<string, unknown>;
  /** Custom schema path (default: src/graphql/schema.graphql) */
  schemaPath?: string;
}

/**
 * CORS configuration options
 */
export interface CorsConfig {
  /** Allowed origins (string or array) */
  origin?: string | string[] | boolean;
  /** Allowed methods */
  methods?: string[];
  /** Allowed headers */
  allowedHeaders?: string[];
  /** Exposed headers */
  exposedHeaders?: string[];
  /** Allow credentials */
  credentials?: boolean;
  /** Max age for preflight cache (seconds) */
  maxAge?: number;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  components: {
    database: boolean;
    cache: boolean;
    services: boolean;
  };
}

/**
 * GraphQL server instance with lifecycle methods
 */
export interface GraphQLServerInstance {
  /** Start the server */
  start(): Promise<void>;
  /** Stop the server gracefully */
  stop(): Promise<void>;
  /** Get the HTTP server instance */
  getHttpServer(): Server;
  /** Get the Yoga instance */
  getYoga(): YogaServerInstance<Record<string, unknown>, GraphQLContext>;
  /** Check if server is running */
  isRunning(): boolean;
  /** Get server URL */
  getUrl(): string;
}

// ============================================================================
// Server Factory
// ============================================================================

/**
 * Create a GraphQL server with all configured features
 *
 * @param config - Server configuration
 * @returns GraphQL server instance
 *
 * @example
 * ```typescript
 * const server = createGraphQLServer({
 *   port: 4000,
 *   database,
 *   cache,
 *   serviceManager,
 *   enableGraphiQL: true,
 *   enableSubscriptions: true,
 *   cors: {
 *     origin: ['http://localhost:3000'],
 *     credentials: true,
 *   },
 * });
 *
 * await server.start();
 * console.log(`GraphQL server running at ${server.getUrl()}`);
 * ```
 */
export function createGraphQLServer(config: GraphQLServerConfig): GraphQLServerInstance {
  const {
    port,
    host = '0.0.0.0',
    graphqlPath = '/graphql',
    healthPath = '/health',
    enableGraphiQL = true,
    enableSubscriptions = true,
    cors = {},
    database,
    cache,
    serviceManager,
    apiKey,
    requireAuth = false,
    resolvers: customResolvers = {},
    schemaPath,
  } = config;

  let httpServer: Server | null = null;
  let wsServer: WebSocketServer | null = null;
  let isServerRunning = false;
  const startTime = Date.now();

  // Load schema
  const typeDefs = loadSchema(schemaPath);

  // Create resolvers with custom scalars
  const resolvers = {
    ...customScalars,
    ...createDefaultResolvers(),
    ...customResolvers,
  };

  // Create executable schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Create context factory
  const contextFactory = createContextFactory({
    database,
    cache,
    serviceManager,
    apiKey,
    requireAuth,
  });

  // Create CORS configuration
  const corsConfig = buildCorsConfig(cors);

  // Create Yoga instance
  const yoga = createYoga<Record<string, unknown>, GraphQLContext>({
    schema,
    context: contextFactory,
    graphqlEndpoint: graphqlPath,
    graphiql: enableGraphiQL
      ? {
          title: 'Knowledge Graph API',
          defaultQuery: DEFAULT_QUERY,
          subscriptionsProtocol: 'WS',
        }
      : false,
    cors: {
      origin: Array.isArray(corsConfig.origin) ? corsConfig.origin : corsConfig.origin === true ? '*' : [],
      methods: corsConfig.methods,
      allowedHeaders: corsConfig.allowedHeaders,
      exposedHeaders: corsConfig.exposedHeaders,
      credentials: corsConfig.credentials,
      maxAge: corsConfig.maxAge,
    },
    logging: {
      debug: (...args) => logger.debug('GraphQL', { args }),
      info: (...args) => logger.info(args.join(' ')),
      warn: (...args) => logger.warn(args.join(' ')),
      error: (...args) => logger.error(args.join(' ')),
    },
    maskedErrors: process.env.NODE_ENV === 'production',
    landingPage: false,
  });

  // Create HTTP server with health check
  httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Handle health check
    if (req.url === healthPath && req.method === 'GET') {
      const health = await getHealthCheck(database, cache, serviceManager, startTime);
      const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

      res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      res.end(JSON.stringify(health));
      return;
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      handleCorsPreFlight(req, res, corsConfig);
      return;
    }

    // Delegate to Yoga - yoga.handle returns void and writes directly to response
    yoga.handle(req, res);
  });

  // Setup WebSocket server for subscriptions
  if (enableSubscriptions) {
    wsServer = new WebSocketServer({
      server: httpServer,
      path: graphqlPath,
    });

    useServer(
      {
        schema,
        context: async (ctx) => {
          // Create context from WebSocket connection
          const request = new Request(`ws://${host}:${port}${graphqlPath}`, {
            headers: ctx.connectionParams as Record<string, string> | undefined,
          });
          return contextFactory({ request });
        },
        onConnect: () => {
          logger.info('WebSocket client connected');
          return true;
        },
        onDisconnect: (ctx, code, reason) => {
          logger.info('WebSocket client disconnected', { code, reason: reason?.toString() });
        },
        onError: (ctx, message, errors) => {
          logger.error('WebSocket error', undefined, { message, errors });
        },
      },
      wsServer
    );

    logger.info('WebSocket subscriptions enabled', { path: graphqlPath });
  }

  // Return server instance
  return {
    async start(): Promise<void> {
      if (isServerRunning) {
        logger.warn('Server already running');
        return;
      }

      return new Promise((resolve, reject) => {
        httpServer!.listen(port, host, () => {
          isServerRunning = true;
          logger.info('GraphQL server started', {
            url: `http://${host}:${port}${graphqlPath}`,
            graphiql: enableGraphiQL ? `http://${host}:${port}${graphqlPath}` : 'disabled',
            health: `http://${host}:${port}${healthPath}`,
            subscriptions: enableSubscriptions ? `ws://${host}:${port}${graphqlPath}` : 'disabled',
          });
          resolve();
        });

        httpServer!.on('error', (error) => {
          logger.error('Server error', error);
          reject(error);
        });
      });
    },

    async stop(): Promise<void> {
      if (!isServerRunning) {
        return;
      }

      logger.info('Stopping GraphQL server...');

      // Close WebSocket server
      if (wsServer) {
        await new Promise<void>((resolve) => {
          wsServer!.close(() => {
            logger.debug('WebSocket server closed');
            resolve();
          });
        });
      }

      // Close HTTP server
      await new Promise<void>((resolve, reject) => {
        httpServer!.close((error) => {
          if (error) {
            reject(error);
          } else {
            isServerRunning = false;
            logger.info('GraphQL server stopped');
            resolve();
          }
        });
      });
    },

    getHttpServer(): Server {
      return httpServer!;
    },

    getYoga() {
      return yoga;
    },

    isRunning(): boolean {
      return isServerRunning;
    },

    getUrl(): string {
      return `http://${host}:${port}${graphqlPath}`;
    },
  };
}

// ============================================================================
// Schema Loading
// ============================================================================

/**
 * Load GraphQL schema from file
 */
function loadSchema(customPath?: string): string {
  // Try custom path first
  if (customPath && existsSync(customPath)) {
    logger.debug('Loading schema from custom path', { path: customPath });
    return readFileSync(customPath, 'utf-8');
  }

  // Schema search paths (relative to cwd)
  const searchPaths = [
    join(process.cwd(), 'src/graphql/schema.graphql'),
    join(process.cwd(), 'graphql/schema.graphql'),
    join(process.cwd(), 'schema.graphql'),
    // For dist builds
    join(process.cwd(), 'dist/graphql/schema.graphql'),
  ];

  for (const schemaPath of searchPaths) {
    if (existsSync(schemaPath)) {
      logger.debug('Loading schema from path', { path: schemaPath });
      return readFileSync(schemaPath, 'utf-8');
    }
  }

  throw new Error(
    `GraphQL schema not found. Tried: ${[customPath, ...searchPaths].filter(Boolean).join(', ')}`
  );
}

// ============================================================================
// Default Resolvers
// ============================================================================

/**
 * Create default resolvers for system queries
 */
function createDefaultResolvers(): Record<string, unknown> {
  return {
    Query: {
      // System health query
      health: async (
        _parent: unknown,
        _args: unknown,
        context: GraphQLContext
      ): Promise<{
        status: string;
        components: { database: boolean; cache: boolean; agents: boolean; vectorStore: boolean };
        uptime: number;
        requestCount: number;
        toolCount: number;
      }> => {
        const { services } = context;
        const dbHealthy = !!services.database;
        const cacheHealthy = !!services.cache;

        return {
          status: dbHealthy && cacheHealthy ? 'HEALTHY' : 'DEGRADED',
          components: {
            database: dbHealthy,
            cache: cacheHealthy,
            agents: true, // Would check agent registry
            vectorStore: false, // Not implemented yet
          },
          uptime: process.uptime() * 1000,
          requestCount: 0, // Would track in context
          toolCount: 0, // Would count MCP tools
        };
      },

      // Version info query
      version: (): {
        version: string;
        buildTime: Date | null;
        gitCommit: string | null;
        nodeVersion: string;
        schemaVersion: string;
      } => ({
        version: process.env.npm_package_version ?? '0.0.0',
        buildTime: null,
        gitCommit: process.env.GIT_COMMIT ?? null,
        nodeVersion: process.version,
        schemaVersion: '1.0.0',
      }),
    },

    // Subscription resolvers would be added here
    Subscription: {},
  };
}

// ============================================================================
// CORS Helpers
// ============================================================================

/**
 * Build CORS configuration for Yoga
 */
function buildCorsConfig(cors: CorsConfig): {
  origin: string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
} {
  const origin = cors.origin === true
    ? true
    : cors.origin === false
      ? false
      : Array.isArray(cors.origin)
        ? cors.origin
        : cors.origin
          ? [cors.origin]
          : ['http://localhost:3000', 'http://localhost:5173']; // Default dashboard origins

  return {
    origin: origin === false ? [] : origin,
    methods: cors.methods ?? ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: cors.allowedHeaders ?? ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: cors.exposedHeaders ?? ['X-Request-ID'],
    credentials: cors.credentials ?? true,
    maxAge: cors.maxAge ?? 86400, // 24 hours
  };
}

/**
 * Handle CORS preflight request
 */
function handleCorsPreFlight(
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse,
  corsConfig: ReturnType<typeof buildCorsConfig>
): void {
  const origin = req.headers.origin;

  if (origin && (corsConfig.origin === true || (Array.isArray(corsConfig.origin) && corsConfig.origin.includes(origin)))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  res.setHeader('Access-Control-Max-Age', corsConfig.maxAge.toString());

  if (corsConfig.credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.writeHead(204);
  res.end();
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Get health check response
 */
async function getHealthCheck(
  database: KnowledgeGraphDatabase,
  cache: AdvancedCache<unknown>,
  serviceManager: ServiceManager,
  startTime: number
): Promise<HealthCheckResponse> {
  let dbHealthy = false;
  let cacheHealthy = false;
  let servicesHealthy = false;

  try {
    // Check database
    const db = database.getDatabase();
    db.prepare('SELECT 1').get();
    dbHealthy = true;
  } catch (error) {
    logger.error('Database health check failed', error instanceof Error ? error : undefined);
  }

  try {
    // Check cache
    cache.set('_health_check', Date.now(), { ttl: 1000 });
    const value = cache.get('_health_check');
    cacheHealthy = value !== undefined;
    cache.delete('_health_check');
  } catch (error) {
    logger.error('Cache health check failed', error instanceof Error ? error : undefined);
  }

  try {
    // Check services
    const states = serviceManager.getAllStates();
    const runningCount = Array.from(states.values()).filter((s) => s.status === 'running').length;
    servicesHealthy = runningCount >= 0; // At least no errors
  } catch (error) {
    logger.error('Services health check failed', error instanceof Error ? error : undefined);
  }

  const allHealthy = dbHealthy && cacheHealthy && servicesHealthy;
  const anyHealthy = dbHealthy || cacheHealthy || servicesHealthy;

  return {
    status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    version: process.env.npm_package_version ?? '0.0.0',
    components: {
      database: dbHealthy,
      cache: cacheHealthy,
      services: servicesHealthy,
    },
  };
}

// ============================================================================
// Default Query for GraphiQL
// ============================================================================

const DEFAULT_QUERY = `# Welcome to the Knowledge Graph API
#
# Try these example queries:

query SystemHealth {
  health {
    status
    components {
      database
      cache
      agents
      vectorStore
    }
    uptime
    requestCount
    toolCount
  }
}

query SystemVersion {
  version {
    version
    nodeVersion
    schemaVersion
  }
}

# Uncomment to query graph stats:
# query GraphStats {
#   graphStats {
#     totalNodes
#     totalEdges
#     nodesByType {
#       type
#       count
#     }
#     orphanNodes
#     avgLinksPerNode
#   }
# }

# Uncomment to search nodes:
# query SearchNodes($query: String!) {
#   search(query: $query) {
#     totalMatches
#     nodes {
#       id
#       title
#       type
#       tags
#     }
#   }
# }
`;
