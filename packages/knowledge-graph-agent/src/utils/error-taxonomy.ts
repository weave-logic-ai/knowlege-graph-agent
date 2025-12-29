/**
 * Error Taxonomy System
 *
 * Provides structured error classification for intelligent retry strategies
 * and graceful degradation. Based on weaver error handling patterns.
 *
 * @module utils/error-taxonomy
 */

/**
 * Error categories for classification and recovery strategy selection
 */
export enum ErrorCategory {
  /** Transient errors that may succeed on retry (network hiccups, temporary failures) */
  TRANSIENT = 'transient',

  /** Permanent errors that won't succeed on retry (invalid input, missing resources) */
  PERMANENT = 'permanent',

  /** Rate limit errors requiring backoff (429 responses) */
  RATE_LIMIT = 'rate_limit',

  /** Network connectivity errors (DNS, connection refused) */
  NETWORK = 'network',

  /** Input validation errors (schema violations, type mismatches) */
  VALIDATION = 'validation',

  /** Resource errors (file not found, permissions) */
  RESOURCE = 'resource',

  /** Configuration errors (missing config, invalid settings) */
  CONFIGURATION = 'configuration',

  /** Timeout errors (operation exceeded time limit) */
  TIMEOUT = 'timeout',

  /** Unknown errors that couldn't be classified */
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  /** Informational - operation can continue */
  INFO = 'info',

  /** Warning - operation continues with degraded functionality */
  WARNING = 'warning',

  /** Error - operation failed but system stable */
  ERROR = 'error',

  /** Critical - operation failed, may affect system stability */
  CRITICAL = 'critical',

  /** Fatal - system cannot continue */
  FATAL = 'fatal',
}

/**
 * Classified error with metadata
 */
export interface ClassifiedError {
  /** Original error */
  original: Error | unknown;

  /** Classified category */
  category: ErrorCategory;

  /** Error severity */
  severity: ErrorSeverity;

  /** Whether retry is recommended */
  retryable: boolean;

  /** Suggested delay before retry (milliseconds) */
  suggestedDelay: number;

  /** Error message */
  message: string;

  /** Error code if available */
  code?: string;

  /** HTTP status code if applicable */
  statusCode?: number;

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Network error codes that indicate transient failures
 */
const TRANSIENT_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ENOTFOUND',
  'ECONNREFUSED',
  'EPIPE',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
]);

/**
 * Timeout error codes
 */
const TIMEOUT_CODES = new Set([
  'ETIMEDOUT',
  'ABORT_ERR',
  'ERR_TIMEOUT',
]);

/**
 * HTTP status codes that indicate transient failures
 */
const TRANSIENT_STATUS_CODES = new Set([
  408, // Request Timeout
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  520, // Cloudflare Web Server Error
  522, // Cloudflare Connection Timed Out
  524, // Cloudflare Timeout
]);

/**
 * HTTP status codes that indicate rate limiting
 */
const RATE_LIMIT_STATUS_CODES = new Set([
  429, // Too Many Requests
]);

/**
 * HTTP status codes that indicate permanent failures
 */
const PERMANENT_STATUS_CODES = new Set([
  400, // Bad Request
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  405, // Method Not Allowed
  406, // Not Acceptable
  410, // Gone
  415, // Unsupported Media Type
  422, // Unprocessable Entity
  451, // Unavailable For Legal Reasons
]);

/**
 * Extract HTTP status code from error
 */
function extractStatusCode(error: unknown): number | undefined {
  if (error === null || error === undefined) return undefined;

  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;

    // Direct status property
    if (typeof obj.status === 'number') return obj.status;
    if (typeof obj.statusCode === 'number') return obj.statusCode;

    // Nested response object
    if (obj.response && typeof obj.response === 'object') {
      const response = obj.response as Record<string, unknown>;
      if (typeof response.status === 'number') return response.status;
      if (typeof response.statusCode === 'number') return response.statusCode;
    }
  }

  return undefined;
}

/**
 * Extract error code from error
 */
function extractErrorCode(error: unknown): string | undefined {
  if (error === null || error === undefined) return undefined;

  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj.code === 'string') return obj.code;
    if (typeof obj.errno === 'string') return obj.errno;
  }

  return undefined;
}

/**
 * Extract error message from error
 */
function extractMessage(error: unknown): string {
  if (error === null) return 'Null error';
  if (error === undefined) return 'Undefined error';

  if (error instanceof Error) return error.message;

  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
  }

  if (typeof error === 'string') return error;

  return 'Unknown error';
}

/**
 * Check if error message indicates timeout
 */
function isTimeoutMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('deadline exceeded') ||
    lowerMessage.includes('aborted')
  );
}

/**
 * Check if error message indicates validation error
 */
function isValidationMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('validation') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('schema') ||
    lowerMessage.includes('required') ||
    lowerMessage.includes('must be')
  );
}

/**
 * Check if error message indicates configuration error
 */
function isConfigurationMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('config') ||
    lowerMessage.includes('setting') ||
    lowerMessage.includes('environment') ||
    lowerMessage.includes('missing key') ||
    lowerMessage.includes('api key')
  );
}

/**
 * Check if error message indicates resource error
 */
function isResourceMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('no such file') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('access denied') ||
    lowerMessage.includes('enoent')
  );
}

/**
 * Classify an error into a category with recovery metadata
 *
 * @param error - The error to classify
 * @returns Classified error with recovery recommendations
 *
 * @example
 * ```typescript
 * try {
 *   await fetchData();
 * } catch (error) {
 *   const classified = classifyError(error);
 *   if (classified.retryable) {
 *     await delay(classified.suggestedDelay);
 *     return retry();
 *   }
 *   throw error;
 * }
 * ```
 */
export function classifyError(error: unknown): ClassifiedError {
  const message = extractMessage(error);
  const code = extractErrorCode(error);
  const statusCode = extractStatusCode(error);

  let category = ErrorCategory.UNKNOWN;
  let severity = ErrorSeverity.ERROR;
  let retryable = false;
  let suggestedDelay = 1000;

  // Check for rate limiting (highest priority)
  if (statusCode && RATE_LIMIT_STATUS_CODES.has(statusCode)) {
    category = ErrorCategory.RATE_LIMIT;
    severity = ErrorSeverity.WARNING;
    retryable = true;
    suggestedDelay = 5000; // Start with 5 second delay for rate limits
  }
  // Check for transient HTTP errors
  else if (statusCode && TRANSIENT_STATUS_CODES.has(statusCode)) {
    category = ErrorCategory.TRANSIENT;
    severity = ErrorSeverity.WARNING;
    retryable = true;
    suggestedDelay = 1000;
  }
  // Check for permanent HTTP errors
  else if (statusCode && PERMANENT_STATUS_CODES.has(statusCode)) {
    category = ErrorCategory.PERMANENT;
    severity = ErrorSeverity.ERROR;
    retryable = false;
    suggestedDelay = 0;
  }
  // Check for timeout by code or message (before network to catch ETIMEDOUT)
  else if ((code && TIMEOUT_CODES.has(code)) || isTimeoutMessage(message)) {
    category = ErrorCategory.TIMEOUT;
    severity = ErrorSeverity.WARNING;
    retryable = true;
    suggestedDelay = 5000;
  }
  // Check for network errors by code
  else if (code && TRANSIENT_NETWORK_CODES.has(code)) {
    category = ErrorCategory.NETWORK;
    severity = ErrorSeverity.WARNING;
    retryable = true;
    suggestedDelay = 2000;
  }
  // Check for validation errors
  else if (isValidationMessage(message)) {
    category = ErrorCategory.VALIDATION;
    severity = ErrorSeverity.ERROR;
    retryable = false;
    suggestedDelay = 0;
  }
  // Check for configuration errors
  else if (isConfigurationMessage(message)) {
    category = ErrorCategory.CONFIGURATION;
    severity = ErrorSeverity.CRITICAL;
    retryable = false;
    suggestedDelay = 0;
  }
  // Check for resource errors
  else if (code === 'ENOENT' || code === 'EACCES' || isResourceMessage(message)) {
    category = ErrorCategory.RESOURCE;
    severity = ErrorSeverity.ERROR;
    retryable = false;
    suggestedDelay = 0;
  }

  return {
    original: error,
    category,
    severity,
    retryable,
    suggestedDelay,
    message,
    code,
    statusCode,
  };
}

/**
 * Check if an error is retryable
 *
 * @param error - The error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return classifyError(error).retryable;
}

/**
 * Check if an error is transient (temporary failure)
 *
 * @param error - The error to check
 * @returns Whether the error is transient
 */
export function isTransientError(error: unknown): boolean {
  const classified = classifyError(error);
  return (
    classified.category === ErrorCategory.TRANSIENT ||
    classified.category === ErrorCategory.NETWORK ||
    classified.category === ErrorCategory.TIMEOUT
  );
}

/**
 * Check if an error is a rate limit error
 *
 * @param error - The error to check
 * @returns Whether the error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  return classifyError(error).category === ErrorCategory.RATE_LIMIT;
}

/**
 * Check if an error is permanent (won't succeed on retry)
 *
 * @param error - The error to check
 * @returns Whether the error is permanent
 */
export function isPermanentError(error: unknown): boolean {
  const classified = classifyError(error);
  return (
    classified.category === ErrorCategory.PERMANENT ||
    classified.category === ErrorCategory.VALIDATION ||
    classified.category === ErrorCategory.CONFIGURATION ||
    classified.category === ErrorCategory.RESOURCE
  );
}

/**
 * Custom error class for knowledge graph operations
 */
export class KnowledgeGraphError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;
  public readonly code?: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      retryable?: boolean;
      code?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = 'KnowledgeGraphError';
    this.category = options.category ?? ErrorCategory.UNKNOWN;
    this.severity = options.severity ?? ErrorSeverity.ERROR;
    this.retryable = options.retryable ?? false;
    this.code = options.code;
    this.context = options.context;
  }
}

/**
 * Create a validation error
 */
export function createValidationError(
  message: string,
  context?: Record<string, unknown>
): KnowledgeGraphError {
  return new KnowledgeGraphError(message, {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    code: 'VALIDATION_ERROR',
    context,
  });
}

/**
 * Create a configuration error
 */
export function createConfigurationError(
  message: string,
  context?: Record<string, unknown>
): KnowledgeGraphError {
  return new KnowledgeGraphError(message, {
    category: ErrorCategory.CONFIGURATION,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    code: 'CONFIGURATION_ERROR',
    context,
  });
}

/**
 * Create a resource error
 */
export function createResourceError(
  message: string,
  context?: Record<string, unknown>
): KnowledgeGraphError {
  return new KnowledgeGraphError(message, {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    code: 'RESOURCE_ERROR',
    context,
  });
}
