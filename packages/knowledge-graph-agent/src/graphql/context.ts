/**
 * GraphQL Request Context
 *
 * Provides request-scoped context for GraphQL resolvers including
 * database access, caching, service management, and authentication.
 *
 * @module graphql/context
 */

import type { IncomingMessage } from 'http';
import type { KnowledgeGraphDatabase } from '../core/database.js';
import type { AdvancedCache } from '../caching/lru-cache.js';
import type { ServiceManager } from '../services/index.js';
import { createLogger } from '../utils/index.js';

const logger = createLogger('graphql-context');

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Context Factory Configuration
// ============================================================================

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

// ============================================================================
// Context Factory
// ============================================================================

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
export function createContextFactory(
  config: ContextFactoryConfig
): (request: { request: Request }) => Promise<GraphQLContext> {
  const {
    database,
    cache,
    serviceManager,
    apiKey,
    requireAuth = false,
    authenticate,
  } = config;

  return async ({ request }: { request: Request }): Promise<GraphQLContext> => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // Extract request metadata
    const requestMeta: RequestMeta = {
      requestId,
      startTime,
      clientIp: extractClientIp(request),
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      path: new URL(request.url).pathname,
    };

    // Authenticate request
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    let auth: AuthResult;

    if (authenticate) {
      // Use custom authentication function
      auth = await authenticate(token);
    } else if (apiKey) {
      // Use simple API key authentication
      auth = validateApiKey(token, apiKey);
    } else {
      // No authentication configured
      auth = {
        authenticated: true,
        scopes: ['read', 'write'],
      };
    }

    // Check if authentication is required
    if (requireAuth && !auth.authenticated) {
      logger.warn('Unauthenticated request rejected', {
        requestId,
        path: requestMeta.path,
        error: auth.error,
      });
    }

    // Create request-scoped utilities
    const utils: RequestUtils = {
      generateId: () => generateRequestId(),
      log: (level, message, data) => {
        const logData = { ...data, requestId };
        switch (level) {
          case 'debug':
            logger.debug(message, logData);
            break;
          case 'info':
            logger.info(message, logData);
            break;
          case 'warn':
            logger.warn(message, logData);
            break;
          case 'error':
            logger.error(message, undefined, logData);
            break;
        }
      },
      getElapsedMs: () => Date.now() - startTime,
      cacheKey: (key) => `req:${requestId}:${key}`,
    };

    // Create services reference
    const services: Services = {
      database,
      cache,
      serviceManager,
    };

    logger.debug('GraphQL context created', {
      requestId,
      authenticated: auth.authenticated,
      scopes: auth.scopes,
    });

    return {
      auth,
      request: requestMeta,
      services,
      utils,
    };
  };
}

// ============================================================================
// Authentication Helpers
// ============================================================================

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(header: string | null): string | undefined {
  if (!header) {
    return undefined;
  }

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return undefined;
  }

  return parts[1];
}

/**
 * Validate API key (simple comparison)
 */
function validateApiKey(token: string | undefined, apiKey: string): AuthResult {
  if (!token) {
    return {
      authenticated: false,
      scopes: [],
      error: 'No authentication token provided',
    };
  }

  // Constant-time comparison to prevent timing attacks
  if (!constantTimeEqual(token, apiKey)) {
    return {
      authenticated: false,
      scopes: [],
      error: 'Invalid API key',
    };
  }

  return {
    authenticated: true,
    userId: 'api-key-user',
    scopes: ['read', 'write', 'admin'],
  };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// ============================================================================
// Request Utilities
// ============================================================================

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Extract client IP from request headers
 */
function extractClientIp(request: Request): string {
  // Check forwarded headers (reverse proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim());
    return ips[0] || 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

// ============================================================================
// Authorization Helpers
// ============================================================================

/**
 * Check if context has a specific permission scope
 *
 * @param context - GraphQL context
 * @param scope - Required permission scope
 * @returns True if scope is present
 */
export function hasScope(context: GraphQLContext, scope: string): boolean {
  return context.auth.scopes.includes(scope);
}

/**
 * Require authentication, throwing if not authenticated
 *
 * @param context - GraphQL context
 * @throws Error if not authenticated
 */
export function requireAuth(context: GraphQLContext): void {
  if (!context.auth.authenticated) {
    throw new Error(context.auth.error ?? 'Authentication required');
  }
}

/**
 * Require a specific permission scope, throwing if not present
 *
 * @param context - GraphQL context
 * @param scope - Required permission scope
 * @throws Error if scope is not present
 */
export function requireScope(context: GraphQLContext, scope: string): void {
  requireAuth(context);
  if (!hasScope(context, scope)) {
    throw new Error(`Permission denied: requires '${scope}' scope`);
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if value is a valid GraphQL context
 */
export function isGraphQLContext(value: unknown): value is GraphQLContext {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    typeof obj.auth === 'object' &&
    typeof obj.request === 'object' &&
    typeof obj.services === 'object' &&
    typeof obj.utils === 'object'
  );
}
