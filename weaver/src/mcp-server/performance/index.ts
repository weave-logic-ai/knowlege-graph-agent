/**
 * Performance Optimization Module
 *
 * Exports all performance optimization features for the MCP server.
 */

export { RequestBatcher } from './batching.js';
export type { BatchingConfig, BatchExecutionResult } from './batching.js';

export { StreamingManager, withStreaming } from './streaming.js';
export type {
  StreamEvent,
  StreamEventType,
  ProgressUpdate,
  StreamCallback,
  StreamingContext,
} from './streaming.js';

export { ResponseCache } from './cache.js';
export type { CacheConfig, CacheStats } from './cache.js';

export { CompressionManager } from './compression.js';
export type {
  CompressionConfig,
  CompressionAlgorithm,
  CompressionResult,
  CompressionStats,
} from './compression.js';

export { WebSocketManager, createWebSocketManager } from './websocket.js';
export type {
  WebSocketConfig,
  ConnectionState,
  ConnectionInfo,
  WebSocketMessage,
} from './websocket.js';

export { RetryManager, withRetry, DEFAULT_RETRY_POLICY } from './retry.js';
export type {
  RetryConfig,
  RetryPolicy,
  RetryAttempt,
  RetryResult,
} from './retry.js';
