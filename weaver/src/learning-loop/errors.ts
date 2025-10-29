/**
 * Learning Loop Error Classes
 *
 * Provides typed error handling with proper inheritance
 * and context support for the learning loop system.
 */

/**
 * Base error class for learning loop errors
 */
export class LearningLoopError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'LearningLoopError';
    this.code = code;
    this.context = options?.context;
    this.cause = options?.cause;
    Object.setPrototypeOf(this, LearningLoopError.prototype);
  }
}

/**
 * Perception pillar errors
 */
export class PerceptionError extends LearningLoopError {
  constructor(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, 'PERCEPTION_ERROR', options);
    this.name = 'PerceptionError';
    Object.setPrototypeOf(this, PerceptionError.prototype);
  }
}

/**
 * Reasoning pillar errors
 */
export class ReasoningError extends LearningLoopError {
  constructor(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, 'REASONING_ERROR', options);
    this.name = 'ReasoningError';
    Object.setPrototypeOf(this, ReasoningError.prototype);
  }
}

/**
 * Memory pillar errors
 */
export class MemoryError extends LearningLoopError {
  constructor(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, 'MEMORY_ERROR', options);
    this.name = 'MemoryError';
    Object.setPrototypeOf(this, MemoryError.prototype);
  }
}

/**
 * Execution pillar errors
 */
export class ExecutionError extends LearningLoopError {
  constructor(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, 'EXECUTION_ERROR', options);
    this.name = 'ExecutionError';
    Object.setPrototypeOf(this, ExecutionError.prototype);
  }
}

/**
 * Feedback collection errors
 */
export class FeedbackError extends LearningLoopError {
  constructor(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, 'FEEDBACK_ERROR', options);
    this.name = 'FeedbackError';
    Object.setPrototypeOf(this, FeedbackError.prototype);
  }
}

/**
 * Reflection system errors
 */
export class ReflectionError extends LearningLoopError {
  constructor(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, 'REFLECTION_ERROR', options);
    this.name = 'ReflectionError';
    Object.setPrototypeOf(this, ReflectionError.prototype);
  }
}

/**
 * Type guard to check if an error is a LearningLoopError
 */
export function isLearningLoopError(error: unknown): error is LearningLoopError {
  return error instanceof LearningLoopError;
}

/**
 * Format error for logging
 */
export function formatLearningLoopError(error: LearningLoopError): Record<string, unknown> {
  return {
    name: error.name,
    code: error.code,
    message: error.message,
    context: error.context,
    cause: error.cause ? {
      name: error.cause.name,
      message: error.cause.message,
    } : undefined,
  };
}
