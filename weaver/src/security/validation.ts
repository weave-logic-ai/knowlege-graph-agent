/**
 * Input Validation Schemas
 *
 * Comprehensive validation using Zod to prevent security vulnerabilities:
 * - Directory traversal attacks
 * - Command injection
 * - XSS attacks
 * - Invalid configurations
 */

import { z } from 'zod';
import path from 'node:path';

// ============================================================================
// File Path Validation
// ============================================================================

/**
 * Validates file paths to prevent directory traversal attacks
 * - No '..' segments
 * - No absolute paths outside allowed directories
 * - Only safe characters
 */
export const filePathSchema = z.string()
  .min(1, 'File path cannot be empty')
  .max(4096, 'File path too long')
  .regex(
    /^[a-zA-Z0-9\/_\-\. ]+$/,
    'File path contains invalid characters'
  )
  .refine(
    (path) => !path.includes('..'),
    'Directory traversal not allowed'
  )
  .refine(
    (path) => !path.startsWith('/etc') && !path.startsWith('/sys') && !path.startsWith('/proc'),
    'Access to system directories not allowed'
  );

/**
 * Validates and normalizes file paths
 */
export function validateFilePath(filePath: string, basePath?: string): string {
  const validated = filePathSchema.parse(filePath);

  // Normalize the path
  const normalized = path.normalize(validated);

  // If basePath provided, ensure the path is within it
  if (basePath) {
    const resolvedBase = path.resolve(basePath);
    const resolvedPath = path.resolve(basePath, normalized);

    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error('Path traversal detected: path is outside base directory');
    }
  }

  return normalized;
}

// ============================================================================
// API Key Validation
// ============================================================================

/**
 * Validates API keys (Anthropic, OpenAI, etc.)
 */
export const apiKeySchema = z.string()
  .min(20, 'API key too short')
  .max(256, 'API key too long')
  .regex(
    /^[a-zA-Z0-9\-_\.]+$/,
    'API key contains invalid characters'
  );

/**
 * Specific validation for Anthropic API keys
 */
export const anthropicApiKeySchema = z.string()
  .regex(
    /^sk-ant-[a-zA-Z0-9\-_]+$/,
    'Invalid Anthropic API key format'
  );

/**
 * Specific validation for OpenAI API keys
 */
export const openaiApiKeySchema = z.string()
  .regex(
    /^sk-[a-zA-Z0-9\-_]+$/,
    'Invalid OpenAI API key format'
  );

// ============================================================================
// Configuration Validation
// ============================================================================

/**
 * Server configuration validation
 */
export const serverConfigSchema = z.object({
  port: z.number()
    .int()
    .min(1024, 'Port must be >= 1024 (avoid privileged ports)')
    .max(65535, 'Port must be <= 65535'),
  host: z.string()
    .ip()
    .or(z.literal('localhost'))
    .or(z.literal('0.0.0.0')),
  cors: z.object({
    origin: z.union([
      z.string().url(),
      z.array(z.string().url()),
      z.literal('*'),
    ]).optional(),
    credentials: z.boolean().optional(),
  }).optional(),
});

/**
 * Database configuration validation
 */
export const databaseConfigSchema = z.object({
  type: z.enum(['sqlite', 'postgres', 'mysql']),
  path: z.string().optional(), // For SQLite
  host: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  database: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  ssl: z.boolean().optional(),
}).refine(
  (config) => {
    if (config.type === 'sqlite') {
      return !!config.path;
    }
    return !!(config.host && config.database && config.username);
  },
  'Invalid database configuration for the selected type'
);

/**
 * Rate limiting configuration validation
 */
export const rateLimitConfigSchema = z.object({
  enabled: z.boolean(),
  maxRequests: z.number().int().min(1).max(10000),
  windowMs: z.number().int().min(1000).max(3600000),
  skipSuccessfulRequests: z.boolean().optional(),
  skipFailedRequests: z.boolean().optional(),
});

/**
 * Security configuration validation
 */
export const securityConfigSchema = z.object({
  enableAuditLogging: z.boolean().default(true),
  enableRateLimiting: z.boolean().default(true),
  enableInputValidation: z.boolean().default(true),
  apiKeyRotationDays: z.number().int().min(1).max(365).default(90),
  maxLoginAttempts: z.number().int().min(1).max(100).default(5),
  sessionTimeoutMs: z.number().int().min(60000).max(86400000).default(3600000),
});

/**
 * Complete application configuration validation
 */
export const appConfigSchema = z.object({
  server: serverConfigSchema,
  database: databaseConfigSchema.optional(),
  security: securityConfigSchema,
  rateLimit: rateLimitConfigSchema.optional(),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    file: filePathSchema.optional(),
    console: z.boolean().default(true),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

// ============================================================================
// CLI Argument Validation
// ============================================================================

/**
 * Validates CLI command arguments
 */
export const cliCommandSchema = z.object({
  command: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid command name'),
  args: z.array(z.string().max(1000)).max(50),
  flags: z.record(z.string(), z.union([
    z.string(),
    z.number(),
    z.boolean(),
  ])),
});

/**
 * Validates workflow names
 */
export const workflowNameSchema = z.string()
  .min(1)
  .max(100)
  .regex(
    /^[a-zA-Z0-9\-_\.]+$/,
    'Workflow name can only contain letters, numbers, hyphens, underscores, and dots'
  );

// ============================================================================
// MCP Tool Input Validation
// ============================================================================

/**
 * Validates MCP tool names
 */
export const mcpToolNameSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Invalid MCP tool name');

/**
 * Validates MCP tool arguments
 */
export const mcpToolArgsSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(z.unknown()),
    z.record(z.unknown()),
  ])
).refine(
  (args) => {
    // Prevent excessively large payloads
    const stringified = JSON.stringify(args);
    return stringified.length <= 1_000_000; // 1MB max
  },
  'MCP tool arguments payload too large'
);

// ============================================================================
// Git Operation Validation
// ============================================================================

/**
 * Validates git remote URLs
 */
export const gitRemoteUrlSchema = z.string()
  .max(2048)
  .regex(
    /^(https?:\/\/|git@)[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+$/,
    'Invalid git remote URL'
  )
  .refine(
    (url) => {
      // Block potentially dangerous protocols
      const lowerUrl = url.toLowerCase();
      return !lowerUrl.startsWith('file://') &&
             !lowerUrl.startsWith('ftp://') &&
             !lowerUrl.includes('javascript:');
    },
    'Unsafe git remote protocol'
  );

/**
 * Validates git branch names
 */
export const gitBranchSchema = z.string()
  .min(1)
  .max(255)
  .regex(
    /^[a-zA-Z0-9\-_\/\.]+$/,
    'Invalid git branch name'
  )
  .refine(
    (branch) => !branch.startsWith('-') && !branch.startsWith('.'),
    'Branch name cannot start with - or .'
  );

// ============================================================================
// Email Validation
// ============================================================================

export const emailSchema = z.string()
  .email('Invalid email address')
  .max(254) // RFC 5321
  .toLowerCase();

// ============================================================================
// URL Validation
// ============================================================================

export const urlSchema = z.string()
  .url('Invalid URL')
  .max(2048)
  .refine(
    (url) => {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    },
    'Only HTTP and HTTPS protocols allowed'
  );

// ============================================================================
// JSON Validation
// ============================================================================

/**
 * Validates and parses JSON strings safely
 */
export function validateJson<T = unknown>(
  jsonString: string,
  schema?: z.ZodSchema<T>
): T {
  // Limit JSON size to prevent DoS
  if (jsonString.length > 10_000_000) { // 10MB
    throw new Error('JSON payload too large');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Invalid JSON: ' + (error as Error).message);
  }

  if (schema) {
    return schema.parse(parsed);
  }

  return parsed as T;
}

// ============================================================================
// Environment Variable Validation
// ============================================================================

/**
 * Validates environment variables
 */
export const envVarsSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  HOST: z.string().optional(),

  // API Keys
  ANTHROPIC_API_KEY: anthropicApiKeySchema.optional(),
  OPENAI_API_KEY: openaiApiKeySchema.optional(),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Security
  ENABLE_RATE_LIMITING: z.string()
    .transform(val => val === 'true')
    .default('true'),
  ENABLE_AUDIT_LOGGING: z.string()
    .transform(val => val === 'true')
    .default('true'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type EnvVars = z.infer<typeof envVarsSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates input with detailed error messages
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');

      throw new Error(
        `Validation failed${context ? ` for ${context}` : ''}: ${message}`
      );
    }
    throw error;
  }
}

/**
 * Validates input and returns safe result
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessage = result.error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join(', ');

  return { success: false, error: errorMessage };
}
