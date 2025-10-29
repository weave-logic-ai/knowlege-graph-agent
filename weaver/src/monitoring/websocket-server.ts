/**
 * WebSocket Server for Real-Time Dashboard Updates
 *
 * Provides real-time monitoring data to dashboard clients:
 * - Metrics updates every 1s
 * - Health status changes
 * - Alert notifications
 * - Connection management
 */

import { WebSocket, WebSocketServer } from 'ws';
import { logger } from '../utils/logger.js';
import { metricsCollector } from '../service-manager/metrics-collector.js';
import { healthCheckService } from '../service-manager/health-check.js';
import type { Alert } from './alerting.js';

/**
 * Message types
 */
export type WSMessageType =
  | 'metrics'
  | 'health'
  | 'alert'
  | 'connection'
  | 'error';

/**
 * WebSocket message
 */
export interface WSMessage {
  type: WSMessageType;
  timestamp: Date;
  data: unknown;
}

/**
 * WebSocket Dashboard Server
 */
export class DashboardWSServer {
  private wss?: WebSocketServer;
  private clients = new Set<WebSocket>();
  private updateInterval?: NodeJS.Timeout;
  private readonly updateIntervalMs = 1000; // 1 second

  /**
   * Start WebSocket server
   */
  start(port = 3001): void {
    if (this.wss) {
      logger.warn('WebSocket server already running');
      return;
    }

    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    this.wss.on('error', (error: Error) => {
      logger.error('WebSocket server error', error);
    });

    // Start periodic updates
    this.startPeriodicUpdates();

    logger.info('WebSocket dashboard server started', { port });
  }

  /**
   * Stop WebSocket server
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }

    // Close all client connections
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();

    // Close server
    if (this.wss) {
      this.wss.close();
      this.wss = undefined;
    }

    logger.info('WebSocket dashboard server stopped');
  }

  /**
   * Handle new client connection
   */
  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);

    logger.info('Dashboard client connected', { clientCount: this.clients.size });

    // Send initial connection message
    this.sendToClient(ws, {
      type: 'connection',
      timestamp: new Date(),
      data: {
        status: 'connected',
        updateInterval: this.updateIntervalMs,
      },
    });

    // Handle client messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message);
      } catch (error) {
        logger.warn('Invalid WebSocket message', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.clients.delete(ws);
      logger.info('Dashboard client disconnected', { clientCount: this.clients.size });
    });

    ws.on('error', (error: Error) => {
      logger.error('WebSocket client error', error);
      this.clients.delete(ws);
    });
  }

  /**
   * Handle message from client
   */
  private handleClientMessage(ws: WebSocket, message: any): void {
    // Handle client requests (e.g., change update interval, request specific data)
    logger.debug('Client message received', { message });

    if (message.type === 'ping') {
      this.sendToClient(ws, {
        type: 'connection',
        timestamp: new Date(),
        data: { pong: true },
      });
    }
  }

  /**
   * Start periodic updates to all clients
   */
  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.broadcastUpdates();
    }, this.updateIntervalMs);
  }

  /**
   * Broadcast updates to all connected clients
   */
  private async broadcastUpdates(): Promise<void> {
    if (this.clients.size === 0) return;

    try {
      // Collect current metrics
      const metrics = await this.collectMetrics();

      // Broadcast to all clients
      this.broadcast({
        type: 'metrics',
        timestamp: new Date(),
        data: metrics,
      });
    } catch (error) {
      logger.error('Failed to broadcast updates', error as Error);
    }
  }

  /**
   * Collect current metrics
   */
  private async collectMetrics(): Promise<Record<string, unknown>> {
    const metrics: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };

    // Add service metrics if available
    try {
      // This is a placeholder - in real implementation, collect from all services
      metrics.services = {};
    } catch (error) {
      logger.debug('Failed to collect service metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return metrics;
  }

  /**
   * Broadcast alert to all clients
   */
  broadcastAlert(alert: Alert): void {
    this.broadcast({
      type: 'alert',
      timestamp: new Date(),
      data: alert,
    });
  }

  /**
   * Broadcast health status update
   */
  broadcastHealthUpdate(service: string, status: unknown): void {
    this.broadcast({
      type: 'health',
      timestamp: new Date(),
      data: { service, status },
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: WSMessage): void {
    const messageStr = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

/**
 * Global WebSocket server instance
 */
export const dashboardWS = new DashboardWSServer();
