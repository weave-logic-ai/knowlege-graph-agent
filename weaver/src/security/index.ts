/**
 * Security Module
 *
 * Comprehensive security features for production deployment:
 * - Input validation with Zod
 * - Rate limiting with token bucket algorithm
 * - Security audit logging with tamper detection
 * - API key rotation and management
 * - Input sanitization helpers
 * - Security middleware for Hono/Express
 */

// Validation
export {
  // Schemas
  filePathSchema,
  apiKeySchema,
  anthropicApiKeySchema,
  openaiApiKeySchema,
  serverConfigSchema,
  databaseConfigSchema,
  rateLimitConfigSchema,
  securityConfigSchema,
  appConfigSchema,
  cliCommandSchema,
  workflowNameSchema,
  mcpToolNameSchema,
  mcpToolArgsSchema,
  gitRemoteUrlSchema,
  gitBranchSchema,
  emailSchema,
  urlSchema,
  envVarsSchema,

  // Functions
  validateFilePath,
  validateJson,
  validate,
  validateSafe,

  // Types
  type AppConfig,
  type EnvVars,
} from './validation.js';

// Rate Limiting
export {
  RateLimiter,
  getRateLimiter,
  destroyRateLimiter,
  DEFAULT_RATE_LIMITS,
  type RateLimitConfig,
  type RateLimitResult,
  type TokenBucket,
} from './rate-limiter.js';

// Audit Logging
export {
  AuditLogger,
  getAuditLogger,
  closeAuditLogger,
  type AuditEvent,
  type AuditLevel,
  type AuditCategory,
  type AuditResult,
  type AuditLoggerConfig,
} from './audit-logger.js';

// API Key Management
export {
  ApiKeyManager,
  getApiKeyManager,
  type ApiKey,
  type KeyRotationConfig,
  type KeyGenerationResult,
} from './key-rotation.js';

// Sanitization
export {
  // HTML/XSS
  escapeHtml,
  stripHtmlTags,
  sanitizeHtmlAttribute,

  // SQL
  escapeSqlString,
  validateSqlIdentifier,
  sanitizeSqlIdentifier,
  buildWhereClause,

  // Shell
  escapeShellArg,
  escapeShellCommand,
  validateShellCommand,
  safeExecSync,

  // Path
  sanitizeFilePath,
  validateFilename,
  sanitizeFilename,

  // URL
  sanitizeUrl,
  validateRedirectUrl,

  // JSON
  sanitizeJson,
  safeJsonParse,

  // Email
  sanitizeEmail,

  // RegEx
  validateRegexPattern,
  safeRegExp,

  // LDAP
  escapeLdapFilter,
  escapeLdapDn,

  // XML
  escapeXml,

  // CSV
  sanitizeCsvCell,

  // General
  removeControlCharacters,
  truncate,
  sanitizeUserInput,
} from './sanitizers.js';

// Middleware
export {
  validateBody,
  validateQuery,
  validateParams,
  rateLimiter,
  apiKeyAuth,
  auditLog,
  securityHeaders,
  secureCors,
  applySecurity,
  type SecurityMiddlewareConfig,
} from './middleware.js';

// ============================================================================
// Security Utilities
// ============================================================================

/**
 * Initialize all security features
 */
export async function initializeSecurity(config?: {
  enableRateLimiting?: boolean;
  enableAuditLogging?: boolean;
  auditLogDir?: string;
}): Promise<void> {
  // Import functions from their modules
  const { getAuditLogger } = await import('./audit-logger.js');
  const { getRateLimiter } = await import('./rate-limiter.js');

  // Initialize audit logger
  if (config?.enableAuditLogging !== false) {
    await getAuditLogger({
      logDir: config?.auditLogDir || './logs/audit',
    });
  }

  // Initialize rate limiter
  if (config?.enableRateLimiting !== false) {
    getRateLimiter();
  }
}

/**
 * Clean up security resources
 */
export async function cleanupSecurity(): Promise<void> {
  // Import functions from their modules
  const { closeAuditLogger } = await import('./audit-logger.js');
  const { destroyRateLimiter } = await import('./rate-limiter.js');

  await closeAuditLogger();
  destroyRateLimiter();
}

// ============================================================================
// Security Health Check
// ============================================================================

export interface SecurityHealthStatus {
  rateLimiting: {
    enabled: boolean;
    endpoints: number;
  };
  auditLogging: {
    enabled: boolean;
    location?: string;
  };
  apiKeyManagement: {
    enabled: boolean;
    totalKeys: number;
    keysNeedingRotation: number;
  };
}

/**
 * Get security health status
 */
export async function getSecurityHealth(): Promise<SecurityHealthStatus> {
  // Import functions from their modules
  const { getRateLimiter, DEFAULT_RATE_LIMITS } = await import('./rate-limiter.js');
  const { getApiKeyManager } = await import('./key-rotation.js');

  const rateLimiter = getRateLimiter();
  const keyManager = getApiKeyManager();

  return {
    rateLimiting: {
      enabled: true,
      endpoints: Object.keys(DEFAULT_RATE_LIMITS).length,
    },
    auditLogging: {
      enabled: true,
      location: './logs/audit',
    },
    apiKeyManagement: {
      enabled: true,
      totalKeys: keyManager.listKeys().length,
      keysNeedingRotation: keyManager.getKeysNeedingRotation().length,
    },
  };
}
