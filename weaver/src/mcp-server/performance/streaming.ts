/**
 * Streaming Response System
 *
 * Provides Server-Sent Events (SSE) for long-running operations with real-time progress updates.
 * Gracefully falls back to non-streaming for clients that don't support it.
 */

import { logger } from '../../utils/logger.js';
import type { ToolResult } from '../types/index.js';

/**
 * Stream event types
 */
export type StreamEventType =
  | 'progress'
  | 'log'
  | 'data'
  | 'error'
  | 'complete'
  | 'heartbeat';

/**
 * Stream event
 */
export interface StreamEvent {
  type: StreamEventType;
  timestamp: number;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * Progress update
 */
export interface ProgressUpdate {
  current: number;
  total: number;
  percentage: number;
  message?: string;
  estimatedTimeRemaining?: number;
}

/**
 * Stream callback function
 */
export type StreamCallback = (event: StreamEvent) => void;

/**
 * Streaming operation context
 */
export interface StreamingContext {
  operationId: string;
  operationName: string;
  startTime: number;
  onEvent: StreamCallback;
  supportsStreaming: boolean;
}

/**
 * Streaming Response Manager
 *
 * Manages streaming responses for long-running operations with SSE support.
 */
export class StreamingManager {
  private activeStreams: Map<string, StreamingContext> = new Map();
  private streamCounter = 0;
  private heartbeatInterval: number = 30000; // 30 seconds

  /**
   * Create a new streaming context
   *
   * @param operationName - Name of the operation
   * @param onEvent - Event callback function
   * @param supportsStreaming - Whether client supports streaming
   * @returns Streaming context
   */
  createStream(
    operationName: string,
    onEvent: StreamCallback,
    supportsStreaming: boolean = true
  ): StreamingContext {
    const operationId = `stream-${++this.streamCounter}`;
    const context: StreamingContext = {
      operationId,
      operationName,
      startTime: Date.now(),
      onEvent,
      supportsStreaming,
    };

    this.activeStreams.set(operationId, context);

    logger.debug('Stream created', {
      operationId,
      operationName,
      supportsStreaming,
    });

    // Start heartbeat if streaming is supported
    if (supportsStreaming) {
      this.startHeartbeat(operationId);
    }

    return context;
  }

  /**
   * Send a progress update
   *
   * @param context - Streaming context
   * @param progress - Progress information
   */
  sendProgress(context: StreamingContext, progress: ProgressUpdate): void {
    const event: StreamEvent = {
      type: 'progress',
      timestamp: Date.now(),
      data: progress,
      metadata: {
        operationId: context.operationId,
        operationName: context.operationName,
      },
    };

    this.sendEvent(context, event);
  }

  /**
   * Send a log entry
   *
   * @param context - Streaming context
   * @param level - Log level
   * @param message - Log message
   * @param data - Additional data
   */
  sendLog(
    context: StreamingContext,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): void {
    const event: StreamEvent = {
      type: 'log',
      timestamp: Date.now(),
      data: {
        level,
        message,
        ...data,
      },
    };

    this.sendEvent(context, event);
  }

  /**
   * Send data chunk
   *
   * @param context - Streaming context
   * @param data - Data to send
   */
  sendData(context: StreamingContext, data: any): void {
    const event: StreamEvent = {
      type: 'data',
      timestamp: Date.now(),
      data,
    };

    this.sendEvent(context, event);
  }

  /**
   * Send error
   *
   * @param context - Streaming context
   * @param error - Error to send
   */
  sendError(context: StreamingContext, error: Error): void {
    const event: StreamEvent = {
      type: 'error',
      timestamp: Date.now(),
      data: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
    };

    this.sendEvent(context, event);
  }

  /**
   * Complete the stream
   *
   * @param context - Streaming context
   * @param result - Final result
   */
  complete(context: StreamingContext, result: ToolResult): void {
    const event: StreamEvent = {
      type: 'complete',
      timestamp: Date.now(),
      data: result,
      metadata: {
        duration: Date.now() - context.startTime,
      },
    };

    this.sendEvent(context, event);
    this.closeStream(context.operationId);
  }

  /**
   * Send an event to the stream
   *
   * @param context - Streaming context
   * @param event - Event to send
   */
  private sendEvent(context: StreamingContext, event: StreamEvent): void {
    if (!context.supportsStreaming && event.type !== 'complete') {
      // Skip intermediate events if streaming not supported
      logger.debug('Skipping stream event (streaming not supported)', {
        type: event.type,
        operationId: context.operationId,
      });
      return;
    }

    try {
      context.onEvent(event);

      logger.debug('Stream event sent', {
        type: event.type,
        operationId: context.operationId,
      });
    } catch (error) {
      logger.error('Failed to send stream event', error as Error, {
        type: event.type,
        operationId: context.operationId,
      });
    }
  }

  /**
   * Start heartbeat for a stream
   *
   * @param operationId - Operation ID
   */
  private startHeartbeat(operationId: string): void {
    const intervalId = setInterval(() => {
      const context = this.activeStreams.get(operationId);
      if (!context) {
        clearInterval(intervalId);
        return;
      }

      const event: StreamEvent = {
        type: 'heartbeat',
        timestamp: Date.now(),
        data: {
          uptime: Date.now() - context.startTime,
        },
      };

      this.sendEvent(context, event);
    }, this.heartbeatInterval);

    // Store interval ID for cleanup
    (this.activeStreams.get(operationId) as any).heartbeatInterval = intervalId;
  }

  /**
   * Close a stream
   *
   * @param operationId - Operation ID
   */
  private closeStream(operationId: string): void {
    const context = this.activeStreams.get(operationId);
    if (!context) {
      return;
    }

    // Clear heartbeat
    const intervalId = (context as any).heartbeatInterval;
    if (intervalId) {
      clearInterval(intervalId);
    }

    this.activeStreams.delete(operationId);

    logger.debug('Stream closed', {
      operationId,
      duration: Date.now() - context.startTime,
    });
  }

  /**
   * Get active stream count
   *
   * @returns Number of active streams
   */
  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Get all active stream IDs
   *
   * @returns Array of operation IDs
   */
  getActiveStreamIds(): string[] {
    return Array.from(this.activeStreams.keys());
  }

  /**
   * Close all streams
   */
  closeAllStreams(): void {
    logger.info('Closing all streams', {
      count: this.activeStreams.size,
    });

    for (const operationId of this.activeStreams.keys()) {
      this.closeStream(operationId);
    }
  }

  /**
   * Set heartbeat interval
   *
   * @param intervalMs - Interval in milliseconds
   */
  setHeartbeatInterval(intervalMs: number): void {
    this.heartbeatInterval = intervalMs;
    logger.info('Heartbeat interval updated', { intervalMs });
  }
}

/**
 * Create a streaming wrapper for long-running operations
 *
 * @param operationName - Name of the operation
 * @param operation - Operation to execute
 * @param onEvent - Event callback
 * @param supportsStreaming - Whether client supports streaming
 * @returns Operation result
 */
export async function withStreaming<T>(
  manager: StreamingManager,
  operationName: string,
  operation: (context: StreamingContext) => Promise<T>,
  onEvent: StreamCallback,
  supportsStreaming: boolean = true
): Promise<T> {
  const context = manager.createStream(operationName, onEvent, supportsStreaming);

  try {
    const result = await operation(context);

    manager.complete(context, {
      success: true,
      data: result,
    });

    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    manager.sendError(context, err);

    manager.complete(context, {
      success: false,
      error: err.message,
    });

    throw error;
  }
}
