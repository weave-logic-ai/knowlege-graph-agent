/**
 * Security Middleware
 *
 * Express/Hono middleware for security features:
 * - Input validation
 * - Rate limiting
 * - Audit logging
 * - API key authentication
 */

import type { Context, Next } from 'hono';
import { getAuditLogger } from './audit-logger.js';
import { getRateLimiter } from './rate-limiter.js';
import { getApiKeyManager } from './key-rotation.js';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export interface SecurityMiddlewareConfig {
  enableRateLimiting: boolean;
  enableAuditLogging: boolean;
  enableInputValidation: boolean;
  enableApiKeyAuth: boolean;
}

// ============================================================================
// Request Validation Middleware
// ============================================================================

/**
 * Validate request body against a schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);

      // Attach validated data to context
      c.set('validatedBody', validated);

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const auditLogger = await getAuditLogger();
        await auditLogger.logValidationFailure({
          action: 'body_validation',
          error: error.errors.map(e => e.message).join(', '),
          metadata: {
            path: c.req.path,
            method: c.req.method,
          },
        });

        return c.json(
          {
            error: 'Validation failed',
            details: error.errors,
          },
          400
        );
      }

      throw error;
    }
  };
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validated = schema.parse(query);

      c.set('validatedQuery', validated);

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const auditLogger = await getAuditLogger();
        await auditLogger.logValidationFailure({
          action: 'query_validation',
          error: error.errors.map(e => e.message).join(', '),
          metadata: {
            path: c.req.path,
            method: c.req.method,
          },
        });

        return c.json(
          {
            error: 'Validation failed',
            details: error.errors,
          },
          400
        );
      }

      throw error;
    }
  };
}

/**
 * Validate path parameters against a schema
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validated = schema.parse(params);

      c.set('validatedParams', validated);

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const auditLogger = await getAuditLogger();
        await auditLogger.logValidationFailure({
          action: 'params_validation',
          error: error.errors.map(e => e.message).join(', '),
          metadata: {
            path: c.req.path,
            method: c.req.method,
          },
        });

        return c.json(
          {
            error: 'Validation failed',
            details: error.errors,
          },
          400
        );
      }

      throw error;
    }
  };
}

// ============================================================================
// Rate Limiting Middleware
// ============================================================================

/**
 * Rate limiting middleware
 */
export function rateLimiter(endpoint: string, options?: {
  identifier?: (c: Context) => string;
  onLimitReached?: (c: Context) => void;
}) {
  return async (c: Context, next: Next) => {
    const limiter = getRateLimiter();

    // Get identifier (IP address or custom)
    const identifier = options?.identifier
      ? options.identifier(c)
      : c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    // Check rate limit
    const result = await limiter.checkLimit(identifier, endpoint);

    // Add rate limit headers
    c.header('X-RateLimit-Limit', String(result.remaining + 1));
    c.header('X-RateLimit-Remaining', String(result.remaining));
    c.header('X-RateLimit-Reset', String(result.resetAt));

    if (!result.allowed) {
      // Log rate limit violation
      const auditLogger = await getAuditLogger();
      await auditLogger.logRateLimitViolation({
        endpoint,
        identifier,
        ip: identifier,
        metadata: {
          path: c.req.path,
          method: c.req.method,
        },
      });

      if (options?.onLimitReached) {
        options.onLimitReached(c);
      }

      if (result.retryAfter) {
        c.header('Retry-After', String(Math.ceil(result.retryAfter / 1000)));
      }

      return c.json(
        {
          error: 'Too many requests',
          retryAfter: result.retryAfter,
        },
        429
      );
    }

    await next();
  };
}

// ============================================================================
// API Key Authentication Middleware
// ============================================================================

/**
 * API key authentication middleware
 */
export function apiKeyAuth(options?: {
  headerName?: string;
  queryParam?: string;
  onAuthFailed?: (c: Context) => void;
}) {
  const headerName = options?.headerName || 'X-API-Key';
  const queryParam = options?.queryParam || 'api_key';

  return async (c: Context, next: Next) => {
    // Get API key from header or query
    const apiKey =
      c.req.header(headerName) ||
      c.req.query(queryParam);

    if (!apiKey) {
      const auditLogger = await getAuditLogger();
      await auditLogger.logAuth({
        action: 'api_key_missing',
        result: 'failure',
        ip: c.req.header('x-forwarded-for') || 'unknown',
        metadata: {
          path: c.req.path,
          method: c.req.method,
        },
      });

      if (options?.onAuthFailed) {
        options.onAuthFailed(c);
      }

      return c.json({ error: 'API key required' }, 401);
    }

    // Validate API key
    const keyManager = getApiKeyManager();
    const validation = await keyManager.validateKey(apiKey);

    if (!validation.valid) {
      if (options?.onAuthFailed) {
        options.onAuthFailed(c);
      }

      return c.json(
        {
          error: validation.reason || 'Invalid API key',
        },
        401
      );
    }

    // Attach key ID to context
    c.set('apiKeyId', validation.keyId);

    await next();
  };
}

// ============================================================================
// Audit Logging Middleware
// ============================================================================

/**
 * Request/response audit logging middleware
 */
export function auditLog(options?: {
  includeBody?: boolean;
  includeHeaders?: boolean;
}) {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();

    // Execute request
    await next();

    // Log after response
    const duration = Date.now() - startTime;
    const auditLogger = await getAuditLogger();

    const metadata: Record<string, unknown> = {
      path: c.req.path,
      method: c.req.method,
      status: c.res.status,
      duration,
    };

    if (options?.includeHeaders) {
      // Get all headers from raw request
      const headers: Record<string, string> = {};
      // Hono doesn't provide a direct way to get all headers, so we skip this for now
      // In production, you might need to use c.req.raw.headers
      metadata.headers = headers;
    }

    if (options?.includeBody && c.req.method !== 'GET') {
      try {
        metadata.body = await c.req.json();
      } catch {
        // Ignore if not JSON
      }
    }

    await auditLogger.log({
      level: c.res.status >= 400 ? 'warning' : 'info',
      category: 'access',
      action: 'http_request',
      result: c.res.status < 400 ? 'success' : 'failure',
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      user: c.get('user') || c.get('apiKeyId'),
      metadata,
    });
  };
}

// ============================================================================
// Security Headers Middleware
// ============================================================================

/**
 * Add security headers to responses
 */
export function securityHeaders(options?: {
  enableHSTS?: boolean;
  enableCSP?: boolean;
  cspDirectives?: string;
}) {
  return async (c: Context, next: Next) => {
    await next();

    // Basic security headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // HSTS (only in production with HTTPS)
    if (options?.enableHSTS !== false) {
      c.header(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
    }

    // Content Security Policy
    if (options?.enableCSP !== false) {
      const csp = options?.cspDirectives ||
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';";
      c.header('Content-Security-Policy', csp);
    }
  };
}

// ============================================================================
// CORS Middleware
// ============================================================================

/**
 * CORS middleware with security
 */
export function secureCors(options: {
  allowedOrigins: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}) {
  const allowedMethods = options.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE'];
  const allowedHeaders = options.allowedHeaders || ['Content-Type', 'Authorization', 'X-API-Key'];

  return async (c: Context, next: Next) => {
    const origin = c.req.header('Origin');

    // Check if origin is allowed
    if (origin && options.allowedOrigins.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin);

      if (options.credentials) {
        c.header('Access-Control-Allow-Credentials', 'true');
      }
    }

    c.header('Access-Control-Allow-Methods', allowedMethods.join(', '));
    c.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));

    // Handle preflight
    if (c.req.method === 'OPTIONS') {
      return new Response('', { status: 204 });
    }

    await next();
  };
}

// ============================================================================
// Combined Security Middleware
// ============================================================================

/**
 * Apply all security middleware
 */
export function applySecurity(config: Partial<SecurityMiddlewareConfig> = {}) {
  const fullConfig: SecurityMiddlewareConfig = {
    enableRateLimiting: config.enableRateLimiting ?? true,
    enableAuditLogging: config.enableAuditLogging ?? true,
    enableInputValidation: config.enableInputValidation ?? true,
    enableApiKeyAuth: config.enableApiKeyAuth ?? false,
  };

  return async (c: Context, next: Next) => {
    // Apply security headers
    await securityHeaders()(c, async () => {
      // Apply audit logging if enabled
      if (fullConfig.enableAuditLogging) {
        await auditLog()(c, next);
      } else {
        await next();
      }
    });
  };
}
