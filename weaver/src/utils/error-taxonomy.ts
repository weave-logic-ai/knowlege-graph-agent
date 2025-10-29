/**
 * Error Taxonomy - Structured error classification system
 *
 * Provides comprehensive error categorization for intelligent
 * retry strategies and error recovery patterns.
 */

/**
 * Primary error categories for classification
 */
export enum ErrorCategory {
  /** Temporary errors likely to succeed on retry (network glitches, timeouts) */
  TRANSIENT = 'transient',

  /** Permanent errors that won't fix with retry (404, validation errors) */
  PERMANENT = 'permanent',

  /** Rate limiting errors requiring exponential backoff */
  RATE_LIMIT = 'rate_limit',

  /** Authentication/authorization failures */
  AUTHENTICATION = 'authentication',

  /** Network connectivity issues */
  NETWORK = 'network',

  /** Input validation or data format errors */
  VALIDATION = 'validation',

  /** Resource exhaustion (disk full, memory, quota) */
  RESOURCE = 'resource',

  /** Configuration or environment errors */
  CONFIGURATION = 'configuration',

  /** Service unavailable or degraded */
  SERVICE = 'service',

  /** Unknown or unclassified errors */
  UNKNOWN = 'unknown',
}

/**
 * Severity levels for error prioritization
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Recommended actions for error handling
 */
export enum RecoveryAction {
  RETRY = 'retry',
  RETRY_WITH_BACKOFF = 'retry_with_backoff',
  FALLBACK = 'fallback',
  SKIP = 'skip',
  ABORT = 'abort',
  NOTIFY = 'notify',
  ESCALATE = 'escalate',
}

/**
 * Structured error information with recovery guidance
 */
export interface RecoverableError {
  /** Error category for classification */
  category: ErrorCategory;

  /** Severity level */
  severity: ErrorSeverity;

  /** Human-readable error message */
  message: string;

  /** Whether error is likely recoverable through retry */
  retryable: boolean;

  /** Recommended recovery actions */
  actions: RecoveryAction[];

  /** Specific suggestions for resolution */
  suggestions: string[];

  /** Original error object */
  originalError: Error;

  /** Error context and metadata */
  context?: Record<string, unknown>;

  /** Timestamp when error occurred */
  timestamp: Date;

  /** Stack trace if available */
  stack?: string;
}

/**
 * Error classification result
 */
export interface ErrorClassification {
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  maxRetries: number;
  baseDelay: number;
  actions: RecoveryAction[];
  suggestions: string[];
}

/**
 * Classifier function type
 */
export type ErrorClassifier = (error: Error) => ErrorClassification;

/**
 * Default error classifier based on error patterns
 */
export function classifyError(error: Error): ErrorClassification {
  // Handle undefined or null errors
  if (!error) {
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      maxRetries: 0,
      baseDelay: 0,
      actions: [RecoveryAction.ABORT],
      suggestions: ['Error is undefined or null'],
    };
  }

  const message = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();

  // Network errors
  if (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('etimedout') ||
    message.includes('socket hang up') ||
    name.includes('fetch')
  ) {
    return {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      maxRetries: 3,
      baseDelay: 1000,
      actions: [RecoveryAction.RETRY_WITH_BACKOFF, RecoveryAction.FALLBACK],
      suggestions: [
        'Check network connectivity',
        'Verify endpoint URL is correct',
        'Check if service is available',
        'Try alternative endpoint if available',
      ],
    };
  }

  // Rate limiting
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429') ||
    message.includes('quota exceeded')
  ) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      maxRetries: 5,
      baseDelay: 5000,
      actions: [RecoveryAction.RETRY_WITH_BACKOFF],
      suggestions: [
        'Wait for rate limit window to reset',
        'Implement request queuing',
        'Consider upgrading API tier',
        'Batch requests if possible',
      ],
    };
  }

  // Authentication/Authorization
  if (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('authentication') ||
    message.includes('api key')
  ) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      retryable: false,
      maxRetries: 0,
      baseDelay: 0,
      actions: [RecoveryAction.ABORT, RecoveryAction.NOTIFY],
      suggestions: [
        'Verify API credentials are correct',
        'Check if API key is expired',
        'Ensure proper permissions are granted',
        'Regenerate API key if needed',
      ],
    };
  }

  // Validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('malformed') ||
    message.includes('bad request') ||
    message.includes('400')
  ) {
    return {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.HIGH,
      retryable: false,
      maxRetries: 0,
      baseDelay: 0,
      actions: [RecoveryAction.SKIP, RecoveryAction.NOTIFY],
      suggestions: [
        'Validate input data format',
        'Check required fields are present',
        'Verify data types match expected schema',
        'Review API documentation for requirements',
      ],
    };
  }

  // Resource errors
  if (
    message.includes('enospc') ||
    message.includes('out of memory') ||
    message.includes('disk full') ||
    message.includes('resource') ||
    message.includes('quota')
  ) {
    return {
      category: ErrorCategory.RESOURCE,
      severity: ErrorSeverity.CRITICAL,
      retryable: false,
      maxRetries: 0,
      baseDelay: 0,
      actions: [RecoveryAction.ABORT, RecoveryAction.ESCALATE],
      suggestions: [
        'Free up disk space',
        'Increase memory allocation',
        'Clean up temporary files',
        'Check resource quotas',
      ],
    };
  }

  // Service errors
  if (
    message.includes('503') ||
    message.includes('service unavailable') ||
    message.includes('502') ||
    message.includes('bad gateway') ||
    message.includes('500') ||
    message.includes('internal server error')
  ) {
    return {
      category: ErrorCategory.SERVICE,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      maxRetries: 3,
      baseDelay: 2000,
      actions: [RecoveryAction.RETRY_WITH_BACKOFF, RecoveryAction.FALLBACK],
      suggestions: [
        'Wait for service to recover',
        'Check service status page',
        'Use alternative service if available',
        'Contact support if persists',
      ],
    };
  }

  // Configuration errors
  if (
    message.includes('config') ||
    message.includes('environment') ||
    message.includes('not found') && message.includes('file')
  ) {
    return {
      category: ErrorCategory.CONFIGURATION,
      severity: ErrorSeverity.HIGH,
      retryable: false,
      maxRetries: 0,
      baseDelay: 0,
      actions: [RecoveryAction.ABORT, RecoveryAction.NOTIFY],
      suggestions: [
        'Check configuration files exist',
        'Verify environment variables are set',
        'Review configuration documentation',
        'Validate configuration syntax',
      ],
    };
  }

  // Timeout errors (transient)
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('deadline exceeded')
  ) {
    return {
      category: ErrorCategory.TRANSIENT,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      maxRetries: 3,
      baseDelay: 1500,
      actions: [RecoveryAction.RETRY_WITH_BACKOFF],
      suggestions: [
        'Increase timeout duration',
        'Check network latency',
        'Verify service is responding',
        'Consider chunking large operations',
      ],
    };
  }

  // Default: Unknown error
  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    maxRetries: 2,
    baseDelay: 1000,
    actions: [RecoveryAction.RETRY, RecoveryAction.NOTIFY],
    suggestions: [
      'Review error details carefully',
      'Check logs for more context',
      'Search documentation for error type',
      'Contact support if issue persists',
    ],
  };
}

/**
 * Convert Error to RecoverableError with classification
 */
export function toRecoverableError(
  error: Error,
  context?: Record<string, unknown>
): RecoverableError {
  const classification = classifyError(error);

  return {
    category: classification.category,
    severity: classification.severity,
    message: error.message,
    retryable: classification.retryable,
    actions: classification.actions,
    suggestions: classification.suggestions,
    originalError: error,
    context,
    timestamp: new Date(),
    stack: error.stack,
  };
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: Error): boolean {
  const classification = classifyError(error);
  return classification.retryable;
}

/**
 * Get recommended retry count for error
 */
export function getRetryCount(error: Error): number {
  const classification = classifyError(error);
  return classification.maxRetries;
}

/**
 * Get base delay for retry
 */
export function getBaseDelay(error: Error): number {
  const classification = classifyError(error);
  return classification.baseDelay;
}
