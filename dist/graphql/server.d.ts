/**
 * GraphQL Server Setup
 *
 * Provides GraphQL server configuration using graphql-yoga with WebSocket
 * subscriptions, CORS configuration, health checks, and GraphiQL playground.
 *
 * @module graphql/server
 */
import { type Server } from 'http';
import { type YogaServerInstance } from 'graphql-yoga';
import { type GraphQLContext } from './context.js';
import type { KnowledgeGraphDatabase } from '../core/database.js';
import type { AdvancedCache } from '../caching/lru-cache.js';
import type { ServiceManager } from '../services/index.js';
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
export declare function createGraphQLServer(config: GraphQLServerConfig): GraphQLServerInstance;
//# sourceMappingURL=server.d.ts.map