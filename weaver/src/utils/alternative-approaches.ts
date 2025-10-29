/**
 * Alternative Approach Generation - Fallback strategies
 *
 * Generates alternative approaches when primary operations fail,
 * implements fallback chains, and provides graceful degradation.
 */

import { logger } from './logger.js';
import { type ErrorCategory, classifyError } from './error-taxonomy.js';
import { withRetry } from './error-recovery.js';

/**
 * Alternative approach definition
 */
export interface AlternativeApproach<T> {
  /** Name of the approach */
  name: string;

  /** Description of what this approach does */
  description: string;

  /** Priority (lower = higher priority) */
  priority: number;

  /** Function to execute */
  execute: () => Promise<T>;

  /** Cost estimate (relative scale) */
  cost?: number;

  /** Expected reliability (0-1) */
  reliability?: number;

  /** Whether this approach requires specific conditions */
  requiresConditions?: () => boolean;
}

/**
 * Fallback chain configuration
 */
export interface FallbackChainConfig<T> {
  /** Primary approach */
  primary: AlternativeApproach<T>;

  /** Fallback approaches in order */
  fallbacks: AlternativeApproach<T>[];

  /** Graceful degradation function (final fallback) */
  gracefulDegradation?: () => Promise<T>;

  /** Maximum time to spend on all attempts (ms) */
  maxTotalTime?: number;

  /** Callback on approach switch */
  onApproachSwitch?: (from: string, to: string, error: Error) => void;
}

/**
 * Execute operation with fallback chain
 *
 * Tries primary approach, then fallbacks in order, with final graceful degradation
 */
export async function withFallbackChain<T>(
  config: FallbackChainConfig<T>
): Promise<T> {
  const startTime = Date.now();
  const approaches = [config.primary, ...config.fallbacks];
  const errors: Array<{ approach: string; error: Error }> = [];

  for (let i = 0; i < approaches.length; i++) {
    const approach = approaches[i];

    // Check if we've exceeded max time
    if (config.maxTotalTime && Date.now() - startTime > config.maxTotalTime) {
      logger.warn('Fallback chain timeout exceeded', {
        elapsed: Date.now() - startTime,
        maxTime: config.maxTotalTime,
      });
      break;
    }

    // Check if approach requires conditions
    if (approach.requiresConditions && !approach.requiresConditions()) {
      logger.debug('Skipping approach - conditions not met', {
        approach: approach.name,
      });
      continue;
    }

    try {
      logger.info('Attempting approach', {
        approach: approach.name,
        priority: approach.priority,
        attemptNumber: i + 1,
      });

      const result = await approach.execute();

      logger.info('Approach succeeded', {
        approach: approach.name,
        attemptNumber: i + 1,
        elapsed: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      errors.push({ approach: approach.name, error: err });

      logger.warn('Approach failed', {
        approach: approach.name,
        error: err.message,
        attemptNumber: i + 1,
      });

      // Notify about approach switch
      if (i < approaches.length - 1 && config.onApproachSwitch) {
        config.onApproachSwitch(approach.name, approaches[i + 1].name, err);
      }
    }
  }

  // All approaches failed, try graceful degradation
  if (config.gracefulDegradation) {
    logger.warn('All approaches failed, attempting graceful degradation', {
      failedApproaches: errors.length,
    });

    try {
      return await config.gracefulDegradation();
    } catch (error) {
      logger.error('Graceful degradation failed', error as Error);
      throw error;
    }
  }

  // No graceful degradation available
  const lastError = errors[errors.length - 1]?.error ?? new Error('All approaches failed');
  logger.error('Fallback chain exhausted', lastError, {
    failedApproaches: errors.length,
    errors: errors.map((e) => ({ approach: e.approach, message: e.error.message })),
  });

  throw lastError;
}

/**
 * Generate alternative approaches using AI
 *
 * Uses Claude API to suggest alternative strategies when operations fail
 */
export async function generateAlternativeApproaches(
  failedOperation: string,
  error: Error,
  context: Record<string, unknown>
): Promise<string[]> {
  const classification = classifyError(error);

  // Built-in suggestions based on error category
  const suggestions = getSuggestionsForCategory(classification.category, failedOperation);

  logger.debug('Generated alternative approaches', {
    operation: failedOperation,
    category: classification.category,
    suggestionCount: suggestions.length,
  });

  return suggestions;
}

/**
 * Get suggestions for error category
 */
function getSuggestionsForCategory(
  category: ErrorCategory,
  operation: string
): string[] {
  const suggestions: Record<string, string[]> = {
    network: [
      'Use cached data if available',
      'Retry with increased timeout',
      'Use alternative endpoint or mirror',
      'Fallback to local processing',
      'Queue operation for later retry',
    ],
    rate_limit: [
      'Implement request queuing',
      'Use batch API if available',
      'Switch to alternative API provider',
      'Cache results to reduce API calls',
      'Implement exponential backoff',
    ],
    authentication: [
      'Refresh authentication token',
      'Use alternative credentials',
      'Switch to public/anonymous mode',
      'Fallback to cached/local data',
    ],
    validation: [
      'Relax validation constraints',
      'Use default values for missing fields',
      'Transform data to match expected format',
      'Skip validation and process anyway',
    ],
    resource: [
      'Free up resources',
      'Reduce batch size',
      'Use streaming instead of buffering',
      'Offload to external service',
      'Clean up temporary files',
    ],
    service: [
      'Use alternative service',
      'Fallback to cached data',
      'Queue for retry when service recovers',
      'Use degraded mode',
    ],
    transient: [
      'Retry with exponential backoff',
      'Increase timeout',
      'Check system resources',
    ],
    configuration: [
      'Use default configuration',
      'Check environment variables',
      'Regenerate configuration',
    ],
    permanent: [
      'Skip this operation',
      'Use alternative approach',
      'Notify user for manual intervention',
    ],
    unknown: [
      'Retry with logging',
      'Check system state',
      'Use safe fallback',
    ],
  };

  return suggestions[category] || suggestions.unknown;
}

/**
 * Embedding generation with fallback chain
 *
 * Example: OpenAI API → Xenova local model → Skip embeddings
 */
export async function withEmbeddingFallbacks<T>(
  text: string,
  openaiGenerate: (text: string) => Promise<T>,
  xenovaGenerate: (text: string) => Promise<T>,
  skipEmbeddings: () => Promise<T>
): Promise<T> {
  return withFallbackChain({
    primary: {
      name: 'OpenAI API',
      description: 'Generate embeddings using OpenAI API',
      priority: 1,
      execute: () => openaiGenerate(text),
      cost: 10,
      reliability: 0.95,
    },
    fallbacks: [
      {
        name: 'Xenova Local Model',
        description: 'Generate embeddings using local Xenova model',
        priority: 2,
        execute: () => xenovaGenerate(text),
        cost: 1,
        reliability: 0.90,
      },
    ],
    gracefulDegradation: async () => {
      logger.warn('Skipping embeddings generation - using FTS5 only');
      return skipEmbeddings();
    },
  });
}

/**
 * API request with fallback chain
 */
export async function withAPIFallbacks<T>(
  primaryUrl: string,
  fallbackUrls: string[],
  requestFn: (url: string) => Promise<T>,
  cachedData?: T
): Promise<T> {
  const urls = [primaryUrl, ...fallbackUrls];

  return withFallbackChain({
    primary: {
      name: 'Primary API',
      description: 'Primary API endpoint',
      priority: 1,
      execute: () => requestFn(primaryUrl),
      reliability: 0.95,
    },
    fallbacks: fallbackUrls.map((url, index) => ({
      name: `Fallback API ${index + 1}`,
      description: `Alternative API endpoint ${index + 1}`,
      priority: index + 2,
      execute: () => requestFn(url),
      reliability: 0.85,
    })),
    gracefulDegradation: cachedData
      ? async () => {
          logger.warn('Using cached data - all APIs failed');
          return cachedData;
        }
      : undefined,
  });
}

/**
 * Database query with fallback
 */
export async function withDatabaseFallbacks<T>(
  primaryQuery: () => Promise<T>,
  replicaQuery?: () => Promise<T>,
  cachedResult?: T
): Promise<T> {
  const fallbacks: AlternativeApproach<T>[] = [];

  if (replicaQuery) {
    fallbacks.push({
      name: 'Replica Database',
      description: 'Query read replica',
      priority: 2,
      execute: replicaQuery,
      reliability: 0.90,
    });
  }

  return withFallbackChain({
    primary: {
      name: 'Primary Database',
      description: 'Query primary database',
      priority: 1,
      execute: primaryQuery,
      reliability: 0.98,
    },
    fallbacks,
    gracefulDegradation: cachedResult
      ? async () => {
          logger.warn('Using cached database result');
          return cachedResult;
        }
      : undefined,
  });
}

/**
 * Create a smart retry wrapper with automatic fallbacks
 */
export function createSmartOperation<T>(config: {
  primaryOperation: () => Promise<T>;
  fallbackOperations?: Array<() => Promise<T>>;
  gracefulDegradation?: () => Promise<T>;
  retryPrimary?: boolean;
}): () => Promise<T> {
  return async () => {
    const approaches: AlternativeApproach<T>[] = [
      {
        name: 'Primary Operation',
        description: 'Primary operation with retry',
        priority: 1,
        execute: config.retryPrimary ?? true
          ? () => withRetry(() => config.primaryOperation(), { maxAttempts: 3 })
          : config.primaryOperation,
      },
    ];

    if (config.fallbackOperations) {
      config.fallbackOperations.forEach((op, index) => {
        approaches.push({
          name: `Fallback ${index + 1}`,
          description: `Alternative approach ${index + 1}`,
          priority: index + 2,
          execute: op,
        });
      });
    }

    return withFallbackChain({
      primary: approaches[0],
      fallbacks: approaches.slice(1),
      gracefulDegradation: config.gracefulDegradation,
    });
  };
}

/**
 * Parallel approaches with first success
 *
 * Executes multiple approaches in parallel and returns first successful result
 */
export async function withParallelApproaches<T>(
  approaches: AlternativeApproach<T>[],
  timeout?: number
): Promise<T> {
  logger.info('Executing parallel approaches', {
    count: approaches.length,
    timeout,
  });

  const promises = approaches.map(async (approach) => {
    try {
      const result = await approach.execute();
      return { success: true, result, approach: approach.name };
    } catch (error) {
      return { success: false, error: error as Error, approach: approach.name };
    }
  });

  const results = await Promise.allSettled(promises);

  // Find first successful result
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.success) {
      logger.info('Parallel approach succeeded', {
        approach: result.value.approach,
      });
      return result.value.result;
    }
  }

  // All failed
  throw new Error('All parallel approaches failed');
}
