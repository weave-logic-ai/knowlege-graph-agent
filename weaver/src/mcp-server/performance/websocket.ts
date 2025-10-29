/**
 * WebSocket Transport
 *
 * Provides WebSocket support for persistent MCP connections with automatic reconnection,
 * keep-alive ping/pong, and connection pooling.
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger.js';

/**
 * WebSocket configuration
 */
export interface WebSocketConfig {
  /**
   * WebSocket port (default: 3001)
   */
  port: number;

  /**
   * Enable automatic reconnection
   */
  autoReconnect: boolean;

  /**
   * Reconnection interval in milliseconds (default: 5000)
   */
  reconnectIntervalMs: number;

  /**
   * Maximum reconnection attempts (default: 5)
   */
  maxReconnectAttempts: number;

  /**
   * Keep-alive ping interval in milliseconds (default: 30000)
   */
  pingIntervalMs: number;

  /**
   * Connection timeout in milliseconds (default: 10000)
   */
  connectionTimeoutMs: number;

  /**
   * Maximum connections in pool (default: 10)
   */
  maxConnections: number;
}

/**
 * WebSocket connection state
 */
export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected'
  | 'error';

/**
 * WebSocket connection info
 */
export interface ConnectionInfo {
  id: string;
  state: ConnectionState;
  connectedAt?: number;
  lastPingAt?: number;
  lastPongAt?: number;
  reconnectAttempts: number;
  messagesSent: number;
  messagesReceived: number;
}

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  id: string;
  type: 'request' | 'response' | 'ping' | 'pong' | 'error';
  data: any;
  timestamp: number;
}

/**
 * WebSocket Manager
 *
 * Manages WebSocket connections for persistent MCP communication.
 * Note: This is a foundation for WebSocket support. Full implementation
 * would require 'ws' library integration.
 */
export class WebSocketManager extends EventEmitter {
  private config: WebSocketConfig;
  private connections: Map<string, ConnectionInfo> = new Map();
  private pingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private connectionCounter = 0;

  /**
   * Create a new WebSocket manager
   *
   * @param config - WebSocket configuration
   */
  constructor(config: Partial<WebSocketConfig> = {}) {
    super();

    this.config = {
      port: config.port || 3001,
      autoReconnect: config.autoReconnect !== false,
      reconnectIntervalMs: config.reconnectIntervalMs || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      pingIntervalMs: config.pingIntervalMs || 30000,
      connectionTimeoutMs: config.connectionTimeoutMs || 10000,
      maxConnections: config.maxConnections || 10,
    };

    logger.debug('WebSocketManager initialized', { ...this.config } as Record<string, unknown>);
  }

  /**
   * Start WebSocket server
   *
   * Note: This is a placeholder. Full implementation requires 'ws' library.
   */
  async start(): Promise<void> {
    logger.info('WebSocket server starting', {
      port: this.config.port,
    });

    // TODO: Implement WebSocket server using 'ws' library
    // const wss = new WebSocketServer({ port: this.config.port });
    //
    // wss.on('connection', (ws) => {
    //   this.handleConnection(ws);
    // });

    logger.warn('WebSocket server requires "ws" library - placeholder only');
    this.emit('started');
  }

  /**
   * Stop WebSocket server
   */
  async stop(): Promise<void> {
    logger.info('WebSocket server stopping');

    // Stop all ping intervals
    for (const interval of this.pingIntervals.values()) {
      clearInterval(interval);
    }
    this.pingIntervals.clear();

    // Close all connections
    this.connections.clear();

    this.emit('stopped');
  }

  /**
   * Handle new WebSocket connection
   *
   * @param ws - WebSocket instance
   */
  private handleConnection(ws: any): void {
    const connectionId = `ws-${++this.connectionCounter}`;

    if (this.connections.size >= this.config.maxConnections) {
      logger.warn('Max connections reached, rejecting connection', {
        connectionId,
        maxConnections: this.config.maxConnections,
      });
      ws.close(1008, 'Max connections reached');
      return;
    }

    const info: ConnectionInfo = {
      id: connectionId,
      state: 'connecting',
      reconnectAttempts: 0,
      messagesSent: 0,
      messagesReceived: 0,
    };

    this.connections.set(connectionId, info);

    logger.info('WebSocket connection established', { connectionId });

    // Set up connection
    this.setupConnection(connectionId, ws);
  }

  /**
   * Set up WebSocket connection handlers
   *
   * @param connectionId - Connection ID
   * @param ws - WebSocket instance
   */
  private setupConnection(connectionId: string, ws: any): void {
    const info = this.connections.get(connectionId)!;

    // Connection opened
    ws.on('open', () => {
      info.state = 'connected';
      info.connectedAt = Date.now();
      this.emit('connection', connectionId);
      this.startKeepAlive(connectionId, ws);
    });

    // Message received
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        info.messagesReceived++;

        logger.debug('WebSocket message received', {
          connectionId,
          type: message.type,
        });

        if (message.type === 'pong') {
          info.lastPongAt = Date.now();
        } else {
          this.emit('message', connectionId, message);
        }
      } catch (error) {
        logger.error('Failed to parse WebSocket message', error as Error, {
          connectionId,
        });
      }
    });

    // Connection closed
    ws.on('close', () => {
      info.state = 'disconnected';
      this.stopKeepAlive(connectionId);

      logger.info('WebSocket connection closed', { connectionId });

      if (
        this.config.autoReconnect &&
        info.reconnectAttempts < this.config.maxReconnectAttempts
      ) {
        this.scheduleReconnect(connectionId);
      } else {
        this.connections.delete(connectionId);
      }

      this.emit('disconnection', connectionId);
    });

    // Error occurred
    ws.on('error', (error: Error) => {
      info.state = 'error';
      logger.error('WebSocket error', error, { connectionId });
      this.emit('error', connectionId, error);
    });
  }

  /**
   * Start keep-alive ping/pong
   *
   * @param connectionId - Connection ID
   * @param ws - WebSocket instance
   */
  private startKeepAlive(connectionId: string, ws: any): void {
    const interval = setInterval(() => {
      const info = this.connections.get(connectionId);
      if (!info || info.state !== 'connected') {
        clearInterval(interval);
        return;
      }

      const message: WebSocketMessage = {
        id: `ping-${Date.now()}`,
        type: 'ping',
        data: null,
        timestamp: Date.now(),
      };

      ws.send(JSON.stringify(message));
      info.lastPingAt = Date.now();
      info.messagesSent++;

      logger.debug('Sent ping', { connectionId });
    }, this.config.pingIntervalMs);

    this.pingIntervals.set(connectionId, interval);
  }

  /**
   * Stop keep-alive ping/pong
   *
   * @param connectionId - Connection ID
   */
  private stopKeepAlive(connectionId: string): void {
    const interval = this.pingIntervals.get(connectionId);
    if (interval) {
      clearInterval(interval);
      this.pingIntervals.delete(connectionId);
    }
  }

  /**
   * Schedule reconnection attempt
   *
   * @param connectionId - Connection ID
   */
  private scheduleReconnect(connectionId: string): void {
    const info = this.connections.get(connectionId);
    if (!info) return;

    info.reconnectAttempts++;

    logger.info('Scheduling reconnection', {
      connectionId,
      attempt: info.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts,
    });

    setTimeout(() => {
      this.emit('reconnecting', connectionId, info.reconnectAttempts);
      // TODO: Implement actual reconnection logic
    }, this.config.reconnectIntervalMs);
  }

  /**
   * Send message to connection
   *
   * @param connectionId - Connection ID
   * @param message - Message to send
   */
  async sendMessage(
    connectionId: string,
    message: WebSocketMessage
  ): Promise<void> {
    const info = this.connections.get(connectionId);
    if (!info || info.state !== 'connected') {
      throw new Error(`Connection ${connectionId} not available`);
    }

    // TODO: Implement actual message sending
    info.messagesSent++;

    logger.debug('Message sent', {
      connectionId,
      type: message.type,
    });
  }

  /**
   * Get connection information
   *
   * @param connectionId - Connection ID
   * @returns Connection info or undefined
   */
  getConnection(connectionId: string): ConnectionInfo | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections
   *
   * @returns Array of connection info
   */
  getAllConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get active connection count
   *
   * @returns Number of active connections
   */
  getActiveConnectionCount(): number {
    let count = 0;
    for (const info of this.connections.values()) {
      if (info.state === 'connected') {
        count++;
      }
    }
    return count;
  }

  /**
   * Update WebSocket configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('WebSocket configuration updated', { ...this.config } as Record<string, unknown>);
  }
}

/**
 * Create WebSocket manager instance
 *
 * @param config - WebSocket configuration
 * @returns WebSocket manager
 */
export function createWebSocketManager(
  config?: Partial<WebSocketConfig>
): WebSocketManager {
  return new WebSocketManager(config);
}
