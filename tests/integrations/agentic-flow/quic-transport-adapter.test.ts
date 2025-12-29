/**
 * QUIC Transport Adapter Tests
 *
 * Comprehensive test suite for the QUICTransportAdapter
 * covering connection management, messaging, and monitoring.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  QUICTransportAdapter,
  createQUICTransportAdapter,
  type QUICMessage,
  type QUICTransportConfig,
} from '../../../src/integrations/agentic-flow/adapters/quic-transport-adapter.js';

describe('QUICTransportAdapter', () => {
  let adapter: QUICTransportAdapter;

  beforeEach(async () => {
    adapter = new QUICTransportAdapter();
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.dispose();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      const newAdapter = new QUICTransportAdapter();
      await newAdapter.initialize();

      expect(newAdapter.isAvailable()).toBe(true);
      expect(newAdapter.getStatus().initialized).toBe(true);

      await newAdapter.dispose();
    });

    it('should initialize with custom config', async () => {
      const config: Partial<QUICTransportConfig> = {
        maxStreams: 50,
        connectionTimeout: 5000,
        enableMultiplexing: true,
      };

      const newAdapter = new QUICTransportAdapter(config);
      await newAdapter.initialize();

      const storedConfig = newAdapter.getConfig();
      expect(storedConfig.maxStreams).toBe(50);
      expect(storedConfig.connectionTimeout).toBe(5000);

      await newAdapter.dispose();
    });

    it('should return feature name', () => {
      expect(adapter.getFeatureName()).toBe('quic-transport');
    });

    it('should handle multiple initializations', async () => {
      await adapter.initialize();
      await adapter.initialize();

      expect(adapter.isAvailable()).toBe(true);
    });
  });

  // ==========================================================================
  // Connection Management Tests
  // ==========================================================================

  describe('connection management', () => {
    it('should connect to an endpoint', async () => {
      const connection = await adapter.connect('localhost:8080');

      expect(connection).toBeDefined();
      expect(connection.id).toBeDefined();
      expect(connection.endpoint).toBe('localhost:8080');
      expect(connection.status).toBe('connected');
      expect(connection.latency).toBeGreaterThan(0);
    });

    it('should connect with custom config', async () => {
      const connection = await adapter.connect('localhost:9090', {
        serverPort: 9090,
        connectionTimeout: 20000,
      });

      expect(connection.endpoint).toBe('localhost:9090');
      expect(connection.status).toBe('connected');
    });

    it('should get connection by ID', async () => {
      const connection = await adapter.connect('localhost:8080');
      const retrieved = await adapter.getConnection(connection.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(connection.id);
      expect(retrieved!.endpoint).toBe('localhost:8080');
    });

    it('should return null for unknown connection', async () => {
      const connection = await adapter.getConnection('unknown-id');
      expect(connection).toBeNull();
    });

    it('should disconnect from endpoint', async () => {
      const connection = await adapter.connect('localhost:8080');
      await adapter.disconnect(connection.id);

      const retrieved = await adapter.getConnection(connection.id);
      expect(retrieved).toBeNull();
    });

    it('should throw when disconnecting unknown connection', async () => {
      await expect(adapter.disconnect('unknown-id')).rejects.toThrow('Connection not found');
    });

    it('should get connection count', async () => {
      expect(await adapter.getConnectionCount()).toBe(0);

      await adapter.connect('localhost:8080');
      expect(await adapter.getConnectionCount()).toBe(1);

      await adapter.connect('localhost:8081');
      expect(await adapter.getConnectionCount()).toBe(2);
    });

    it('should track connection state', async () => {
      expect(adapter.getConnectionState()).toBe('disconnected');
      expect(adapter.isConnected()).toBe(false);

      await adapter.connect('localhost:8080');

      expect(adapter.getConnectionState()).toBe('connected');
      expect(adapter.isConnected()).toBe(true);
    });
  });

  // ==========================================================================
  // Messaging Tests
  // ==========================================================================

  describe('messaging', () => {
    let connectionId: string;

    beforeEach(async () => {
      const connection = await adapter.connect('localhost:8080');
      connectionId = connection.id;
    });

    it('should send a message', async () => {
      const message: QUICMessage = {
        id: 'msg-1',
        type: 'request',
        payload: { action: 'test' },
        timestamp: Date.now(),
        priority: 'normal',
      };

      await expect(adapter.send(connectionId, message)).resolves.not.toThrow();
    });

    it('should send with different priorities', async () => {
      const priorities: Array<'low' | 'normal' | 'high' | 'critical'> = [
        'low', 'normal', 'high', 'critical',
      ];

      for (const priority of priorities) {
        const message: QUICMessage = {
          id: `msg-${priority}`,
          type: 'request',
          payload: { priority },
          timestamp: Date.now(),
          priority,
        };

        await expect(adapter.send(connectionId, message)).resolves.not.toThrow();
      }
    });

    it('should throw when sending to unknown connection', async () => {
      const message: QUICMessage = {
        id: 'msg-1',
        type: 'request',
        payload: {},
        timestamp: Date.now(),
        priority: 'normal',
      };

      await expect(adapter.send('unknown-id', message)).rejects.toThrow('Connection not found');
    });

    it('should send with response', async () => {
      const message: QUICMessage = {
        id: 'msg-rpc',
        type: 'request',
        payload: { query: 'data' },
        timestamp: Date.now(),
        priority: 'normal',
      };

      const response = await adapter.sendWithResponse(connectionId, message, 5000);

      expect(response).toBeDefined();
      expect(response.type).toBe('response');
      expect(response.payload).toBeDefined();
    });

    it('should timeout on sendWithResponse', async () => {
      // Disconnect to force timeout
      await adapter.disconnect(connectionId);
      const conn = await adapter.connect('localhost:8080');

      const message: QUICMessage = {
        id: 'msg-timeout',
        type: 'request',
        payload: {},
        timestamp: Date.now(),
        priority: 'normal',
      };

      // Very short timeout
      await expect(adapter.sendWithResponse(conn.id, message, 1)).rejects.toThrow(/timeout/i);
    }, 10000);

    it('should broadcast to all connections', async () => {
      // Add more connections
      await adapter.connect('localhost:8081');
      await adapter.connect('localhost:8082');

      const message: QUICMessage = {
        id: 'broadcast-1',
        type: 'broadcast',
        payload: { notification: 'hello' },
        timestamp: Date.now(),
        priority: 'normal',
      };

      await expect(adapter.broadcast(message)).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Stream Management Tests
  // ==========================================================================

  describe('stream management', () => {
    let connectionId: string;

    beforeEach(async () => {
      const connection = await adapter.connect('localhost:8080');
      connectionId = connection.id;
    });

    it('should open a stream', async () => {
      const streamId = await adapter.openStream(connectionId);

      expect(streamId).toBeDefined();
      expect(typeof streamId).toBe('string');
    });

    it('should close a stream', async () => {
      const streamId = await adapter.openStream(connectionId);
      await expect(adapter.closeStream(connectionId, streamId)).resolves.not.toThrow();
    });

    it('should throw when opening stream on unknown connection', async () => {
      await expect(adapter.openStream('unknown-id')).rejects.toThrow('Connection not found');
    });

    it('should throw when closing unknown stream', async () => {
      await expect(adapter.closeStream(connectionId, 'unknown-stream')).rejects.toThrow('Stream not found');
    });

    it('should get all streams', async () => {
      await adapter.openStream(connectionId);
      await adapter.openStream(connectionId);

      const streams = adapter.getStreams();
      expect(streams.length).toBe(2);
    });

    it('should enforce max streams limit', async () => {
      const maxStreamsAdapter = new QUICTransportAdapter({ maxStreams: 2 });
      await maxStreamsAdapter.initialize();

      const conn = await maxStreamsAdapter.connect('localhost:8080');

      await maxStreamsAdapter.openStream(conn.id);
      await maxStreamsAdapter.openStream(conn.id);

      await expect(maxStreamsAdapter.openStream(conn.id)).rejects.toThrow('Maximum streams reached');

      await maxStreamsAdapter.dispose();
    });

    it('should create stream with legacy API', async () => {
      const stream = await adapter.createStream('bidirectional');

      expect(stream).toBeDefined();
      expect(stream.direction).toBe('bidirectional');
      expect(stream.state).toBe('open');
    });
  });

  // ==========================================================================
  // Monitoring Tests
  // ==========================================================================

  describe('monitoring', () => {
    it('should get latency stats', async () => {
      await adapter.connect('localhost:8080');

      const stats = await adapter.getLatencyStats();

      expect(stats).toBeDefined();
      expect(typeof stats.avg).toBe('number');
      expect(typeof stats.p95).toBe('number');
      expect(typeof stats.p99).toBe('number');
    });

    it('should return zero stats with no connections', async () => {
      const stats = await adapter.getLatencyStats();

      expect(stats.avg).toBe(0);
      expect(stats.p95).toBe(0);
      expect(stats.p99).toBe(0);
    });

    it('should get connection stats', async () => {
      const connection = await adapter.connect('localhost:8080');

      const message: QUICMessage = {
        id: 'msg-stats',
        type: 'request',
        payload: {},
        timestamp: Date.now(),
        priority: 'normal',
      };
      await adapter.send(connection.id, message);

      const stats = adapter.getStats();

      expect(stats).toBeDefined();
      expect(stats.bytesSent).toBeGreaterThan(0);
      expect(typeof stats.rtt).toBe('number');
    });

    it('should check health', async () => {
      const health = await adapter.checkHealth();

      expect(health.healthy).toBe(true);
      expect(health.message).toBeDefined();
      expect(health.details).toBeDefined();
    });

    it('should get metrics', () => {
      const metrics = adapter.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.totalConnections).toBe('number');
      expect(typeof metrics.activeConnections).toBe('number');
      expect(typeof metrics.messagesSent).toBe('number');
    });

    it('should reset metrics', async () => {
      await adapter.connect('localhost:8080');

      adapter.resetMetrics();

      const metrics = adapter.getMetrics();
      expect(metrics.totalConnections).toBe(0);
      expect(metrics.messagesSent).toBe(0);
    });
  });

  // ==========================================================================
  // Event Handling Tests
  // ==========================================================================

  describe('event handling', () => {
    it('should emit connection events', async () => {
      const events: string[] = [];

      adapter.on('connection:established', () => events.push('established'));
      adapter.on('connection:closed', () => events.push('closed'));

      const connection = await adapter.connect('localhost:8080');
      await adapter.disconnect(connection.id);

      expect(events).toContain('established');
      expect(events).toContain('closed');
    });

    it('should emit message events', async () => {
      const events: string[] = [];

      adapter.on('message:sent', () => events.push('sent'));

      const connection = await adapter.connect('localhost:8080');
      const message: QUICMessage = {
        id: 'msg-event',
        type: 'request',
        payload: {},
        timestamp: Date.now(),
        priority: 'normal',
      };

      await adapter.send(connection.id, message);

      expect(events).toContain('sent');
    });

    it('should unsubscribe from events', async () => {
      let count = 0;
      const handler = () => { count++; };

      adapter.on('connection:established', handler);
      await adapter.connect('localhost:8080');
      expect(count).toBe(1);

      adapter.off('connection:established', handler);
      await adapter.connect('localhost:8081');
      expect(count).toBe(1);
    });
  });

  // ==========================================================================
  // Legacy API Tests
  // ==========================================================================

  describe('legacy API', () => {
    it('should sync data', async () => {
      const result = await adapter.syncData('peer-1', { data: 'test' });

      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThan(0);
    });

    it('should subscribe to sync events', async () => {
      let received = false;
      const handler = () => { received = true; };

      const unsubscribe = adapter.subscribeToSync(handler);
      await adapter.syncData('peer-1', { data: 'test' });

      expect(received).toBe(true);

      unsubscribe();
    });

    it('should send legacy message', async () => {
      const connection = await adapter.connect('localhost:8080');
      const streamId = await adapter.openStream(connection.id);

      const message = {
        id: 'legacy-msg',
        type: 'test',
        payload: { value: 123 },
        timestamp: new Date(),
        priority: 'normal' as const,
      };

      await expect(adapter.sendLegacy(streamId, message)).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Factory Function Tests
  // ==========================================================================

  describe('factory function', () => {
    it('should create adapter with factory', async () => {
      const factoryAdapter = createQUICTransportAdapter({
        maxStreams: 25,
      });

      await factoryAdapter.initialize();

      expect(factoryAdapter.getConfig().maxStreams).toBe(25);

      await factoryAdapter.dispose();
    });
  });
});
