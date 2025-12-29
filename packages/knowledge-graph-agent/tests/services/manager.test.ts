/**
 * Tests for ServiceManager
 *
 * Comprehensive tests for service lifecycle management, health monitoring,
 * event emission, auto-restart functionality, and metrics collection.
 *
 * @module tests/services/manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceManager, createServiceManager } from '../../src/services/manager.js';
import type {
  ServiceConfig,
  ServiceHandler,
  ServiceMetrics,
  ServiceStatus,
  ServiceState,
} from '../../src/services/types.js';

/**
 * Create a mock service handler for testing
 */
function createMockHandler(overrides: Partial<ServiceHandler> = {}): ServiceHandler {
  const metrics: ServiceMetrics = {
    uptime: 0,
    requests: 0,
    errors: 0,
    healthStatus: 'healthy',
  };

  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    healthCheck: vi.fn().mockResolvedValue(true),
    getMetrics: vi.fn().mockReturnValue(metrics),
    ...overrides,
  };
}

/**
 * Create a mock service config for testing
 */
function createMockConfig(overrides: Partial<ServiceConfig> = {}): ServiceConfig {
  return {
    id: `test-service-${Date.now()}`,
    name: 'Test Service',
    type: 'watcher',
    autoStart: false,
    restartOnFailure: false,
    ...overrides,
  };
}

describe('ServiceManager', () => {
  let manager: ServiceManager;

  beforeEach(() => {
    manager = createServiceManager();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
    await manager.shutdown();
  });

  describe('constructor', () => {
    it('should create a ServiceManager instance', () => {
      const sm = new ServiceManager();
      expect(sm).toBeInstanceOf(ServiceManager);
    });

    it('should extend EventEmitter', () => {
      expect(typeof manager.on).toBe('function');
      expect(typeof manager.emit).toBe('function');
      expect(typeof manager.removeListener).toBe('function');
    });

    it('should initialize with empty state', () => {
      const services = manager.listServices();
      expect(services).toHaveLength(0);
    });

    it('should not be in shutting down state initially', () => {
      expect(manager.shuttingDown).toBe(false);
    });
  });

  describe('createServiceManager factory', () => {
    it('should create a new ServiceManager instance', () => {
      const sm = createServiceManager();
      expect(sm).toBeInstanceOf(ServiceManager);
    });

    it('should create independent instances', () => {
      const sm1 = createServiceManager();
      const sm2 = createServiceManager();
      expect(sm1).not.toBe(sm2);
    });
  });

  describe('register', () => {
    it('should register a new service', async () => {
      const config = createMockConfig({ id: 'test-svc' });
      const handler = createMockHandler();

      await manager.register(config, handler);

      const services = manager.listServices();
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('test-svc');
    });

    it('should emit registered event', async () => {
      const config = createMockConfig();
      const handler = createMockHandler();
      const eventSpy = vi.fn();
      manager.on('registered', eventSpy);

      await manager.register(config, handler);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].id).toBe(config.id);
    });

    it('should throw when registering duplicate service ID', async () => {
      const config = createMockConfig({ id: 'duplicate-id' });
      const handler = createMockHandler();

      await manager.register(config, handler);

      await expect(manager.register(config, handler)).rejects.toThrow(
        'Service duplicate-id already registered'
      );
    });

    it('should initialize service state correctly', async () => {
      const config = createMockConfig({ id: 'init-test', name: 'Init Test', type: 'scheduler' });
      const handler = createMockHandler();

      await manager.register(config, handler);

      const state = manager.getStatus('init-test');
      expect(state).toBeDefined();
      expect(state?.status).toBe('stopped');
      expect(state?.restarts).toBe(0);
      expect(state?.metrics.uptime).toBe(0);
      expect(state?.metrics.requests).toBe(0);
      expect(state?.metrics.errors).toBe(0);
      expect(state?.metrics.healthStatus).toBe('healthy');
    });

    it('should auto-start service when autoStart is true', async () => {
      const config = createMockConfig({ autoStart: true });
      const handler = createMockHandler();

      await manager.register(config, handler);

      expect(handler.start).toHaveBeenCalledTimes(1);
      const state = manager.getStatus(config.id);
      expect(state?.status).toBe('running');
    });

    it('should not auto-start when autoStart is false', async () => {
      const config = createMockConfig({ autoStart: false });
      const handler = createMockHandler();

      await manager.register(config, handler);

      expect(handler.start).not.toHaveBeenCalled();
      const state = manager.getStatus(config.id);
      expect(state?.status).toBe('stopped');
    });

    it('should start health checks when healthCheckInterval is set', async () => {
      const config = createMockConfig({
        autoStart: true,
        healthCheckInterval: 1000,
      });
      const handler = createMockHandler();

      await manager.register(config, handler);

      // Advance time to trigger health check
      await vi.advanceTimersByTimeAsync(1000);

      expect(handler.healthCheck).toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('should start a stopped service', async () => {
      const config = createMockConfig();
      const handler = createMockHandler();
      await manager.register(config, handler);

      await manager.start(config.id);

      expect(handler.start).toHaveBeenCalledTimes(1);
      const state = manager.getStatus(config.id);
      expect(state?.status).toBe('running');
      expect(state?.startTime).toBeInstanceOf(Date);
    });

    it('should throw for non-existent service', async () => {
      await expect(manager.start('non-existent')).rejects.toThrow(
        'Service non-existent not found'
      );
    });

    it('should emit starting and started events', async () => {
      const config = createMockConfig();
      const handler = createMockHandler();
      await manager.register(config, handler);

      const startingSpy = vi.fn();
      const startedSpy = vi.fn();
      manager.on('starting', startingSpy);
      manager.on('started', startedSpy);

      await manager.start(config.id);

      expect(startingSpy).toHaveBeenCalledTimes(1);
      expect(startedSpy).toHaveBeenCalledTimes(1);
    });

    it('should not start an already running service', async () => {
      const config = createMockConfig({ autoStart: true });
      const handler = createMockHandler();
      await manager.register(config, handler);

      // Try to start again
      await manager.start(config.id);

      expect(handler.start).toHaveBeenCalledTimes(1);
    });

    it('should handle start failure and emit failed event', async () => {
      vi.useRealTimers();
      const config = createMockConfig({ id: 'failing-start' });
      const handler = createMockHandler({
        start: vi.fn().mockRejectedValue(new Error('Start failed')),
      });
      await manager.register(config, handler);

      const failedSpy = vi.fn();
      manager.on('failed', failedSpy);

      await manager.start(config.id);

      expect(failedSpy).toHaveBeenCalledTimes(1);
      const state = manager.getStatus(config.id);
      expect(state?.status).toBe('failed');
      expect(state?.lastError).toBe('Start failed');
      expect(state?.metrics.errors).toBe(1);
    });

    it('should clear lastError on successful start', async () => {
      vi.useRealTimers();
      const config = createMockConfig();
      let attempts = 0;
      const handler = createMockHandler({
        start: vi.fn().mockImplementation(async () => {
          attempts++;
          if (attempts === 1) {
            throw new Error('First attempt failed');
          }
        }),
      });
      await manager.register(config, handler);

      // First start fails
      await manager.start(config.id);
      expect(manager.getStatus(config.id)?.lastError).toBe('First attempt failed');

      // Reset status manually for second attempt
      const state = manager.getStatus(config.id);
      if (state) {
        // Need to manually set to stopped for retry
        (state as { status: ServiceStatus }).status = 'stopped';
      }

      // Second start succeeds
      await manager.start(config.id);
      expect(manager.getStatus(config.id)?.lastError).toBeUndefined();
    });
  });

  describe('stop', () => {
    it('should stop a running service', async () => {
      const config = createMockConfig({ autoStart: true });
      const handler = createMockHandler();
      await manager.register(config, handler);

      await manager.stop(config.id);

      expect(handler.stop).toHaveBeenCalledTimes(1);
      const state = manager.getStatus(config.id);
      expect(state?.status).toBe('stopped');
    });

    it('should throw for non-existent service', async () => {
      await expect(manager.stop('non-existent')).rejects.toThrow(
        'Service non-existent not found'
      );
    });

    it('should emit stopping and stopped events', async () => {
      const config = createMockConfig({ autoStart: true });
      const handler = createMockHandler();
      await manager.register(config, handler);

      const stoppingSpy = vi.fn();
      const stoppedSpy = vi.fn();
      manager.on('stopping', stoppingSpy);
      manager.on('stopped', stoppedSpy);

      await manager.stop(config.id);

      expect(stoppingSpy).toHaveBeenCalledTimes(1);
      expect(stoppedSpy).toHaveBeenCalledTimes(1);
    });

    it('should not stop an already stopped service', async () => {
      const config = createMockConfig();
      const handler = createMockHandler();
      await manager.register(config, handler);

      await manager.stop(config.id);

      expect(handler.stop).not.toHaveBeenCalled();
    });

    it('should calculate uptime on stop', async () => {
      vi.useRealTimers();
      const config = createMockConfig({ autoStart: true });
      const handler = createMockHandler();
      await manager.register(config, handler);

      // Wait a bit before stopping
      await new Promise((resolve) => setTimeout(resolve, 50));
      await manager.stop(config.id);

      const state = manager.getStatus(config.id);
      expect(state?.metrics.uptime).toBeGreaterThanOrEqual(40);
    });

    it('should handle stop failure and emit failed event', async () => {
      const config = createMockConfig({ autoStart: true });
      const handler = createMockHandler({
        stop: vi.fn().mockRejectedValue(new Error('Stop failed')),
      });
      await manager.register(config, handler);

      const failedSpy = vi.fn();
      manager.on('failed', failedSpy);

      await manager.stop(config.id);

      expect(failedSpy).toHaveBeenCalledTimes(1);
      const state = manager.getStatus(config.id);
      expect(state?.status).toBe('failed');
      expect(state?.lastError).toBe('Stop failed');
    });
  });

  describe('restart', () => {
    it('should restart a running service', async () => {
      const config = createMockConfig({ autoStart: true });
      const handler = createMockHandler();
      await manager.register(config, handler);

      await manager.restart(config.id);

      expect(handler.stop).toHaveBeenCalledTimes(1);
      expect(handler.start).toHaveBeenCalledTimes(2); // Once on register, once on restart
    });

    it('should throw for non-existent service', async () => {
      await expect(manager.restart('non-existent')).rejects.toThrow(
        'Service non-existent not found'
      );
    });

    it('should increment restart counter', async () => {
      const config = createMockConfig({ autoStart: true });
      const handler = createMockHandler();
      await manager.register(config, handler);

      await manager.restart(config.id);
      await manager.restart(config.id);

      const state = manager.getStatus(config.id);
      expect(state?.restarts).toBe(2);
    });

    it('should emit restarted event', async () => {
      const config = createMockConfig({ autoStart: true });
      const handler = createMockHandler();
      await manager.register(config, handler);

      const restartedSpy = vi.fn();
      manager.on('restarted', restartedSpy);

      await manager.restart(config.id);

      expect(restartedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('auto-restart on failure', () => {
    it('should auto-restart when restartOnFailure is true', async () => {
      vi.useRealTimers();
      const config = createMockConfig({
        restartOnFailure: true,
        restartDelay: 10,
        maxRestarts: 3,
      });

      let startAttempts = 0;
      const handler = createMockHandler({
        start: vi.fn().mockImplementation(async () => {
          startAttempts++;
          if (startAttempts < 3) {
            throw new Error('Transient failure');
          }
        }),
      });

      await manager.register(config, handler);
      await manager.start(config.id);

      // Wait for retries
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(startAttempts).toBe(3);
      const state = manager.getStatus(config.id);
      expect(state?.status).toBe('running');
    });

    it('should not exceed maxRestarts', async () => {
      vi.useRealTimers();
      const config = createMockConfig({
        restartOnFailure: true,
        restartDelay: 10,
        maxRestarts: 2,
      });

      let startAttempts = 0;
      const handler = createMockHandler({
        start: vi.fn().mockImplementation(async () => {
          startAttempts++;
          throw new Error('Persistent failure');
        }),
      });

      await manager.register(config, handler);
      await manager.start(config.id);

      // Wait for all retry attempts
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Initial + 2 auto-restarts = 3 attempts max
      expect(startAttempts).toBeLessThanOrEqual(3);
      const state = manager.getStatus(config.id);
      expect(state?.status).toBe('failed');
    });

    it('should not auto-restart when restartOnFailure is false', async () => {
      vi.useRealTimers();
      const config = createMockConfig({
        restartOnFailure: false,
      });

      let startAttempts = 0;
      const handler = createMockHandler({
        start: vi.fn().mockImplementation(async () => {
          startAttempts++;
          throw new Error('Failure');
        }),
      });

      await manager.register(config, handler);
      await manager.start(config.id);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(startAttempts).toBe(1);
    });

    it('should use default maxRestarts of 3', async () => {
      vi.useRealTimers();
      const config = createMockConfig({
        restartOnFailure: true,
        restartDelay: 10,
        // maxRestarts not set, should default to 3
      });

      let startAttempts = 0;
      const handler = createMockHandler({
        start: vi.fn().mockImplementation(async () => {
          startAttempts++;
          throw new Error('Failure');
        }),
      });

      await manager.register(config, handler);
      await manager.start(config.id);

      await new Promise((resolve) => setTimeout(resolve, 200));

      // 1 initial + up to 3 restarts = 4 total attempts maximum
      expect(startAttempts).toBeLessThanOrEqual(4);
    });

    it('should use default restartDelay of 1000ms', async () => {
      vi.useRealTimers();
      const config = createMockConfig({
        restartOnFailure: true,
        maxRestarts: 1,
        // restartDelay not set, should default to 1000
      });

      let startAttempts = 0;
      const startTimes: number[] = [];
      const handler = createMockHandler({
        start: vi.fn().mockImplementation(async () => {
          startAttempts++;
          startTimes.push(Date.now());
          if (startAttempts === 1) {
            throw new Error('First failure');
          }
        }),
      });

      await manager.register(config, handler);
      await manager.start(config.id);

      // Wait for restart with default delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      expect(startAttempts).toBe(2);
      if (startTimes.length >= 2) {
        const delay = startTimes[1] - startTimes[0];
        expect(delay).toBeGreaterThanOrEqual(950); // Allow some timing variance
      }
    });
  });

  describe('health checks', () => {
    it('should perform periodic health checks', async () => {
      const config = createMockConfig({
        autoStart: true,
        healthCheckInterval: 100,
      });
      const handler = createMockHandler();
      await manager.register(config, handler);

      // Advance time to trigger multiple health checks
      await vi.advanceTimersByTimeAsync(350);

      expect(handler.healthCheck).toHaveBeenCalledTimes(3);
    });

    it('should emit healthCheck event', async () => {
      const config = createMockConfig({
        autoStart: true,
        healthCheckInterval: 100,
      });
      const handler = createMockHandler();
      await manager.register(config, handler);

      const healthCheckSpy = vi.fn();
      manager.on('healthCheck', healthCheckSpy);

      await vi.advanceTimersByTimeAsync(100);

      expect(healthCheckSpy).toHaveBeenCalledWith({
        id: config.id,
        healthy: true,
      });
    });

    it('should update health status to degraded when check returns false', async () => {
      vi.useRealTimers();
      const config = createMockConfig({
        autoStart: true,
        healthCheckInterval: 50,
      });
      // Handler returns dynamic healthStatus based on last health check
      let currentHealthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      const handler = createMockHandler({
        healthCheck: vi.fn().mockImplementation(async () => {
          currentHealthStatus = 'degraded';
          return false;
        }),
        getMetrics: vi.fn().mockImplementation(() => ({
          uptime: 0,
          requests: 0,
          errors: 0,
          healthStatus: currentHealthStatus,
        })),
      });
      await manager.register(config, handler);

      // Wait for health check to run
      await new Promise((resolve) => setTimeout(resolve, 80));

      const state = manager.getStatus(config.id);
      // Verify health check was called
      expect(handler.healthCheck).toHaveBeenCalled();
      expect(state?.metrics.healthStatus).toBe('degraded');
    });

    it('should update health status to unhealthy when check throws', async () => {
      vi.useRealTimers();
      const config = createMockConfig({
        autoStart: true,
        healthCheckInterval: 50,
      });
      // Handler returns dynamic healthStatus based on last health check
      let currentHealthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let errorCount = 0;
      const handler = createMockHandler({
        healthCheck: vi.fn().mockImplementation(async () => {
          currentHealthStatus = 'unhealthy';
          errorCount++;
          throw new Error('Check failed');
        }),
        getMetrics: vi.fn().mockImplementation(() => ({
          uptime: 0,
          requests: 0,
          errors: errorCount,
          healthStatus: currentHealthStatus,
        })),
      });
      await manager.register(config, handler);

      // Wait for health check to run
      await new Promise((resolve) => setTimeout(resolve, 80));

      const state = manager.getStatus(config.id);
      // Verify health check was called
      expect(handler.healthCheck).toHaveBeenCalled();
      expect(state?.metrics.healthStatus).toBe('unhealthy');
      expect(state?.metrics.errors).toBeGreaterThanOrEqual(1);
    });

    it('should set lastHealthCheck timestamp', async () => {
      const config = createMockConfig({
        autoStart: true,
        healthCheckInterval: 100,
      });
      const handler = createMockHandler();
      await manager.register(config, handler);

      await vi.advanceTimersByTimeAsync(100);

      const state = manager.getStatus(config.id);
      expect(state?.metrics.lastHealthCheck).toBeInstanceOf(Date);
    });

    it('should not run health checks for non-running services', async () => {
      const config = createMockConfig({
        autoStart: false,
        healthCheckInterval: 100,
      });
      const handler = createMockHandler();
      await manager.register(config, handler);

      await vi.advanceTimersByTimeAsync(200);

      expect(handler.healthCheck).not.toHaveBeenCalled();
    });

    it('should stop health checks during shutdown', async () => {
      const config = createMockConfig({
        autoStart: true,
        healthCheckInterval: 100,
      });
      const handler = createMockHandler();
      await manager.register(config, handler);

      await manager.shutdown();

      // Health check timer should be cleared
      await vi.advanceTimersByTimeAsync(200);

      // Only the initial health check (if any) should have run
      const callCount = (handler.healthCheck as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(callCount).toBeLessThanOrEqual(1);
    });
  });

  describe('getStatus', () => {
    it('should return service state', async () => {
      const config = createMockConfig({ id: 'status-test' });
      const handler = createMockHandler();
      await manager.register(config, handler);

      const state = manager.getStatus('status-test');

      expect(state).toBeDefined();
      expect(state?.id).toBe('status-test');
      expect(state?.name).toBe('Test Service');
      expect(state?.type).toBe('watcher');
      expect(state?.status).toBe('stopped');
    });

    it('should return undefined for non-existent service', () => {
      const state = manager.getStatus('non-existent');
      expect(state).toBeUndefined();
    });

    it('should update metrics from handler for running services', async () => {
      const config = createMockConfig({ autoStart: true });
      const customMetrics: ServiceMetrics = {
        uptime: 5000,
        requests: 100,
        errors: 2,
        healthStatus: 'healthy',
      };
      const handler = createMockHandler({
        getMetrics: vi.fn().mockReturnValue(customMetrics),
      });
      await manager.register(config, handler);

      const state = manager.getStatus(config.id);

      expect(state?.metrics.requests).toBe(100);
      expect(state?.metrics.errors).toBe(2);
    });

    it('should return a copy of the state', async () => {
      const config = createMockConfig();
      const handler = createMockHandler();
      await manager.register(config, handler);

      const state1 = manager.getStatus(config.id);
      const state2 = manager.getStatus(config.id);

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('listServices', () => {
    it('should return all registered services', async () => {
      await manager.register(createMockConfig({ id: 'svc-1' }), createMockHandler());
      await manager.register(createMockConfig({ id: 'svc-2' }), createMockHandler());
      await manager.register(createMockConfig({ id: 'svc-3' }), createMockHandler());

      const services = manager.listServices();

      expect(services).toHaveLength(3);
      expect(services.map((s) => s.id)).toContain('svc-1');
      expect(services.map((s) => s.id)).toContain('svc-2');
      expect(services.map((s) => s.id)).toContain('svc-3');
    });

    it('should return empty array when no services registered', () => {
      const services = manager.listServices();
      expect(services).toHaveLength(0);
    });

    it('should return copies of service states', async () => {
      await manager.register(createMockConfig({ id: 'copy-test' }), createMockHandler());

      const services1 = manager.listServices();
      const services2 = manager.listServices();

      expect(services1[0]).not.toBe(services2[0]);
      expect(services1[0]).toEqual(services2[0]);
    });
  });

  describe('getServicesByType', () => {
    it('should return services of specific type', async () => {
      await manager.register(createMockConfig({ id: 'w1', type: 'watcher' }), createMockHandler());
      await manager.register(createMockConfig({ id: 'w2', type: 'watcher' }), createMockHandler());
      await manager.register(
        createMockConfig({ id: 's1', type: 'scheduler' }),
        createMockHandler()
      );

      const watchers = manager.getServicesByType('watcher');
      const schedulers = manager.getServicesByType('scheduler');

      expect(watchers).toHaveLength(2);
      expect(schedulers).toHaveLength(1);
    });

    it('should return empty array for type with no services', () => {
      const services = manager.getServicesByType('analyzer');
      expect(services).toHaveLength(0);
    });
  });

  describe('getServicesByStatus', () => {
    it('should return services with specific status', async () => {
      await manager.register(
        createMockConfig({ id: 'r1', autoStart: true }),
        createMockHandler()
      );
      await manager.register(
        createMockConfig({ id: 'r2', autoStart: true }),
        createMockHandler()
      );
      await manager.register(createMockConfig({ id: 's1', autoStart: false }), createMockHandler());

      const running = manager.getServicesByStatus('running');
      const stopped = manager.getServicesByStatus('stopped');

      expect(running).toHaveLength(2);
      expect(stopped).toHaveLength(1);
    });
  });

  describe('unregister', () => {
    it('should unregister a service', async () => {
      const config = createMockConfig({ id: 'unreg-test' });
      await manager.register(config, createMockHandler());

      await manager.unregister('unreg-test');

      const services = manager.listServices();
      expect(services).toHaveLength(0);
    });

    it('should stop running service before unregistering', async () => {
      const config = createMockConfig({ id: 'stop-unreg', autoStart: true });
      const handler = createMockHandler();
      await manager.register(config, handler);

      await manager.unregister('stop-unreg');

      expect(handler.stop).toHaveBeenCalled();
    });

    it('should stop health checks on unregister', async () => {
      const config = createMockConfig({
        id: 'health-unreg',
        autoStart: true,
        healthCheckInterval: 100,
      });
      const handler = createMockHandler();
      await manager.register(config, handler);

      await manager.unregister('health-unreg');

      // Health checks should be stopped
      await vi.advanceTimersByTimeAsync(200);
      expect(handler.healthCheck).not.toHaveBeenCalled();
    });

    it('should handle unregistering non-existent service gracefully', async () => {
      await expect(manager.unregister('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('shutdown', () => {
    it('should stop all services', async () => {
      const handler1 = createMockHandler();
      const handler2 = createMockHandler();
      await manager.register(createMockConfig({ id: 's1', autoStart: true }), handler1);
      await manager.register(createMockConfig({ id: 's2', autoStart: true }), handler2);

      await manager.shutdown();

      expect(handler1.stop).toHaveBeenCalled();
      expect(handler2.stop).toHaveBeenCalled();
    });

    it('should emit shutdown event', async () => {
      const shutdownSpy = vi.fn();
      manager.on('shutdown', shutdownSpy);

      await manager.shutdown();

      expect(shutdownSpy).toHaveBeenCalledTimes(1);
    });

    it('should set shuttingDown flag', async () => {
      await manager.shutdown();
      expect(manager.shuttingDown).toBe(true);
    });

    it('should clear all internal maps', async () => {
      await manager.register(createMockConfig(), createMockHandler());
      await manager.shutdown();

      expect(manager.listServices()).toHaveLength(0);
    });

    it('should only shutdown once', async () => {
      const shutdownSpy = vi.fn();
      manager.on('shutdown', shutdownSpy);

      await manager.shutdown();
      await manager.shutdown();

      expect(shutdownSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during service stop', async () => {
      const handler = createMockHandler({
        stop: vi.fn().mockRejectedValue(new Error('Stop error')),
      });
      await manager.register(createMockConfig({ autoStart: true }), handler);

      // Should not throw
      await expect(manager.shutdown()).resolves.toBeUndefined();
    });

    it('should clear all health check timers', async () => {
      await manager.register(
        createMockConfig({
          id: 's1',
          autoStart: true,
          healthCheckInterval: 100,
        }),
        createMockHandler()
      );
      await manager.register(
        createMockConfig({
          id: 's2',
          autoStart: true,
          healthCheckInterval: 100,
        }),
        createMockHandler()
      );

      await manager.shutdown();

      // No health checks should run after shutdown
      await vi.advanceTimersByTimeAsync(300);
      // If timers weren't cleared, this would cause issues
    });
  });

  describe('getAggregateMetrics', () => {
    it('should return aggregate metrics for all services', async () => {
      await manager.register(createMockConfig({ id: 's1', autoStart: true }), createMockHandler());
      await manager.register(createMockConfig({ id: 's2', autoStart: true }), createMockHandler());
      await manager.register(
        createMockConfig({ id: 's3', autoStart: false }),
        createMockHandler()
      );

      const metrics = manager.getAggregateMetrics();

      expect(metrics.totalServices).toBe(3);
      expect(metrics.running).toBe(2);
      expect(metrics.stopped).toBe(1);
      expect(metrics.failed).toBe(0);
    });

    it('should aggregate requests and errors', async () => {
      const handler1 = createMockHandler({
        getMetrics: vi.fn().mockReturnValue({
          uptime: 0,
          requests: 50,
          errors: 5,
          healthStatus: 'healthy',
        }),
      });
      const handler2 = createMockHandler({
        getMetrics: vi.fn().mockReturnValue({
          uptime: 0,
          requests: 30,
          errors: 3,
          healthStatus: 'healthy',
        }),
      });

      await manager.register(createMockConfig({ id: 's1', autoStart: true }), handler1);
      await manager.register(createMockConfig({ id: 's2', autoStart: true }), handler2);

      // Call getStatus to update metrics from handlers
      manager.getStatus('s1');
      manager.getStatus('s2');

      const metrics = manager.getAggregateMetrics();

      expect(metrics.totalRequests).toBe(80);
      expect(metrics.totalErrors).toBe(8);
    });

    it('should count healthy services', async () => {
      await manager.register(createMockConfig({ id: 's1' }), createMockHandler());
      await manager.register(createMockConfig({ id: 's2' }), createMockHandler());

      const metrics = manager.getAggregateMetrics();

      expect(metrics.healthyCount).toBe(2);
    });

    it('should return zeros for empty manager', () => {
      const metrics = manager.getAggregateMetrics();

      expect(metrics.totalServices).toBe(0);
      expect(metrics.running).toBe(0);
      expect(metrics.stopped).toBe(0);
      expect(metrics.failed).toBe(0);
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.totalErrors).toBe(0);
      expect(metrics.healthyCount).toBe(0);
    });

    it('should track failed services', async () => {
      vi.useRealTimers();
      const handler = createMockHandler({
        start: vi.fn().mockRejectedValue(new Error('Failure')),
      });
      await manager.register(createMockConfig({ id: 'fail' }), handler);
      await manager.start('fail');

      const metrics = manager.getAggregateMetrics();

      expect(metrics.failed).toBe(1);
    });
  });

  describe('event emission', () => {
    it('should emit all lifecycle events in correct order', async () => {
      const events: string[] = [];
      const config = createMockConfig({ autoStart: false });
      const handler = createMockHandler();

      manager.on('registered', () => events.push('registered'));
      manager.on('starting', () => events.push('starting'));
      manager.on('started', () => events.push('started'));
      manager.on('stopping', () => events.push('stopping'));
      manager.on('stopped', () => events.push('stopped'));

      await manager.register(config, handler);
      await manager.start(config.id);
      await manager.stop(config.id);

      expect(events).toEqual(['registered', 'starting', 'started', 'stopping', 'stopped']);
    });

    it('should pass service state to event handlers', async () => {
      const config = createMockConfig({ id: 'event-state', name: 'Event State Service' });
      const handler = createMockHandler();

      const registeredHandler = vi.fn();
      manager.on('registered', registeredHandler);

      await manager.register(config, handler);

      expect(registeredHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'event-state',
          name: 'Event State Service',
          status: 'stopped',
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle rapid start/stop cycles', async () => {
      const config = createMockConfig();
      const handler = createMockHandler();
      await manager.register(config, handler);

      await manager.start(config.id);
      await manager.stop(config.id);
      await manager.start(config.id);
      await manager.stop(config.id);

      expect(handler.start).toHaveBeenCalledTimes(2);
      expect(handler.stop).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent registrations', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          manager.register(createMockConfig({ id: `concurrent-${i}` }), createMockHandler())
        );
      }

      await Promise.all(promises);

      expect(manager.listServices()).toHaveLength(10);
    });

    it('should handle handler that returns non-Error objects', async () => {
      vi.useRealTimers();
      const config = createMockConfig();
      const handler = createMockHandler({
        start: vi.fn().mockRejectedValue('String error'),
      });
      await manager.register(config, handler);

      await manager.start(config.id);

      const state = manager.getStatus(config.id);
      expect(state?.lastError).toBe('String error');
    });

    it('should preserve service state across multiple status calls', async () => {
      const config = createMockConfig({ autoStart: true });
      const handler = createMockHandler();
      await manager.register(config, handler);

      const state1 = manager.getStatus(config.id);
      const state2 = manager.getStatus(config.id);

      expect(state1?.startTime).toEqual(state2?.startTime);
      expect(state1?.restarts).toBe(state2?.restarts);
    });
  });
});
