/**
 * Utilities Module
 *
 * Provides error handling, recovery, and logging utilities.
 *
 * @module utils
 */

// Error Taxonomy
export {
  ErrorCategory,
  ErrorSeverity,
  classifyError,
  isRetryableError,
  isTransientError,
  isRateLimitError,
  isPermanentError,
  KnowledgeGraphError,
  createValidationError,
  createConfigurationError,
  createResourceError,
  type ClassifiedError,
} from './error-taxonomy.js';

// Error Recovery
export {
  withRetry,
  retry,
  withFallback,
  withCircuitBreaker,
  retryable,
  calculateBackoff,
  sleep,
  CircuitBreaker,
  CircuitState,
  RetriesExhaustedError,
  CircuitOpenError,
  type RetryOptions,
  type RetryResult,
  type FallbackOptions,
  type CircuitBreakerOptions,
} from './error-recovery.js';

// Logger
export {
  Logger,
  LogLevel,
  getLogger,
  createLogger,
  setDefaultLogger,
  parseLogLevel,
  createProgressLogger,
  type LoggerOptions,
  type LogEntry,
  type ProgressLogger,
} from './logger.js';
