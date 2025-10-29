/**
 * Utility Exports - Centralized exports for error recovery system
 */

// Error Taxonomy
export {
  ErrorCategory,
  ErrorSeverity,
  RecoveryAction,
  type RecoverableError,
  type ErrorClassification,
  type ErrorClassifier,
  classifyError,
  toRecoverableError,
  isRetryable,
  getRetryCount,
  getBaseDelay,
} from './error-taxonomy.js';

// Error Recovery
export {
  type RetryConfig,
  withRetry,
  withSmartRetry,
  withCategorizedRetry,
  withBatchRetry,
  CircuitBreaker,
  calculateBackoff,
  sleep,
} from './error-recovery.js';

// Error Patterns
export {
  type Solution,
  type ErrorPattern,
  type ErrorOccurrence,
  ErrorPatternDatabase,
  errorPatternDB,
} from './error-patterns.js';

// Error Monitoring
export {
  type ErrorEvent,
  type ErrorMetrics,
  type AlertConfig,
  type Alert,
  ErrorMonitor,
  errorMonitor,
} from './error-monitoring.js';

// Alternative Approaches
export {
  type AlternativeApproach,
  type FallbackChainConfig,
  withFallbackChain,
  generateAlternativeApproaches,
  withEmbeddingFallbacks,
  withAPIFallbacks,
  withDatabaseFallbacks,
  createSmartOperation,
  withParallelApproaches,
} from './alternative-approaches.js';

// Logger
export { logger, createLogger } from './logger.js';
