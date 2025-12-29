/**
 * GraphQL Request Context
 *
 * Provides request-scoped context for GraphQL resolvers including
 * database access, caching, service management, and authentication.
 *
 * @module graphql/context
 */
import type { KnowledgeGraphDatabase } from '../core/database.js';
import type { AdvancedCache } from '../caching/lru-cache.js';
import type { ServiceManager } from '../services/index.js';
/**
 * Authentication result from API key validation
 */
export interface AuthResult {
    /** Whether authentication succeeded */
    authenticated: boolean;
    /** User or service identifier */
    userId?: string;
    /** Permission scopes granted */
    scopes: string[];
    /** Error message if authentication failed */
    error?: string;
}
/**
 * Request metadata extracted from HTTP request
 */
export interface RequestMeta {
    /** Request ID for tracing */
    requestId: string;
    /** Request start timestamp */
    startTime: number;
    /** Client IP address */
    clientIp: string;
    /** User agent string */
    userAgent: string;
    /** Request path */
    path: string;
}
/**
 * Request-scoped utilities
 */
export interface RequestUtils {
    /**
     * Generate a unique ID
     */
    generateId(): string;
    /**
     * Log with request context
     */
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void;
    /**
     * Get elapsed time since request start
     */
    getElapsedMs(): number;
    /**
     * Create a cache key with request-scoped prefix
     */
    cacheKey(key: string): string;
}
/**
 * Service layer interfaces for resolvers
 */
export interface Services {
    /** Knowledge graph database */
    database: KnowledgeGraphDatabase;
    /** Request-scoped cache */
    cache: AdvancedCache<unknown>;
    /** Service manager for background services */
    serviceManager: ServiceManager;
}
/**
 * GraphQL request context provided to all resolvers
 */
export interface GraphQLContext {
    /** Authentication result */
    auth: AuthResult;
    /** Request metadata */
    request: RequestMeta;
    /** Service layer */
    services: Services;
    /** Request-scoped utilities */
    utils: RequestUtils;
}
/**
 * Configuration for context factory
 */
export interface ContextFactoryConfig {
    /** Knowledge graph database instance */
    database: KnowledgeGraphDatabase;
    /** Cache instance */
    cache: AdvancedCache<unknown>;
    /** Service manager instance */
    serviceManager: ServiceManager;
    /** API key for authentication (optional) */
    apiKey?: string;
    /** Whether to require authentication */
    requireAuth?: boolean;
    /** Custom authentication function */
    authenticate?: (token: string | undefined) => AuthResult | Promise<AuthResult>;
}
/**
 * Create a context factory function for graphql-yoga
 *
 * @param config - Context factory configuration
 * @returns Function that creates request-scoped context
 *
 * @example
 * ```typescript
 * const contextFactory = createContextFactory({
 *   database,
 *   cache,
 *   serviceManager,
 *   apiKey: process.env.API_KEY,
 *   requireAuth: true,
 * });
 *
 * const yoga = createYoga({
 *   context: contextFactory,
 *   // ... other config
 * });
 * ```
 */
export declare function createContextFactory(config: ContextFactoryConfig): (request: {
    request: Request;
}) => Promise<GraphQLContext>;
/**
 * Check if context has a specific permission scope
 *
 * @param context - GraphQL context
 * @param scope - Required permission scope
 * @returns True if scope is present
 */
export declare function hasScope(context: GraphQLContext, scope: string): boolean;
/**
 * Require authentication, throwing if not authenticated
 *
 * @param context - GraphQL context
 * @throws Error if not authenticated
 */
export declare function requireAuth(context: GraphQLContext): void;
/**
 * Require a specific permission scope, throwing if not present
 *
 * @param context - GraphQL context
 * @param scope - Required permission scope
 * @throws Error if scope is not present
 */
export declare function requireScope(context: GraphQLContext, scope: string): void;
/**
 * Type guard to check if value is a valid GraphQL context
 */
export declare function isGraphQLContext(value: unknown): value is GraphQLContext;
//# sourceMappingURL=context.d.ts.map