/**
 * Health Check System
 * Monitors service health and availability
 */

import http from 'node:http';
import net from 'node:net';
import type {
  HealthCheckResult,
  HealthStatus,
  ServiceConfig,
} from './types.js';

/**
 * Health check service
 */
export class HealthCheckService {
  /**
   * Perform health check for a service
   */
  async checkHealth(config: ServiceConfig): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = [];

    // HTTP endpoint health check
    if (config.health?.endpoint) {
      const httpCheck = await this.checkHTTPEndpoint(
        config.health.endpoint,
        config.health.timeout || 5000
      );
      checks.push(httpCheck);
    }

    // TCP port health check
    if (config.health?.tcp_port) {
      const tcpCheck = await this.checkTCPPort(
        config.health.tcp_port,
        config.health.timeout || 5000
      );
      checks.push(tcpCheck);
    }

    // Calculate overall health
    const overallHealth = this.calculateOverallHealth(checks);

    return {
      status: overallHealth,
      timestamp: new Date(),
      checks,
      overall_health: overallHealth,
    };
  }

  /**
   * Check HTTP endpoint availability
   */
  private async checkHTTPEndpoint(
    endpoint: string,
    timeout: number
  ): Promise<HealthCheckResult['checks'][0]> {
    const startTime = Date.now();

    try {
      const response = await this.httpRequest(endpoint, timeout);
      const duration = Date.now() - startTime;

      const status: HealthStatus =
        response.statusCode >= 200 && response.statusCode < 300
          ? 'healthy'
          : response.statusCode >= 500
            ? 'unhealthy'
            : 'degraded';

      return {
        name: 'HTTP Endpoint',
        status,
        message: `HTTP ${response.statusCode} - ${response.statusMessage}`,
        duration_ms: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        name: 'HTTP Endpoint',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: duration,
      };
    }
  }

  /**
   * Check TCP port availability
   */
  private async checkTCPPort(
    port: number,
    timeout: number
  ): Promise<HealthCheckResult['checks'][0]> {
    const startTime = Date.now();

    try {
      await this.tcpConnect('localhost', port, timeout);
      const duration = Date.now() - startTime;

      return {
        name: 'TCP Port',
        status: 'healthy',
        message: `Port ${port} is accessible`,
        duration_ms: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        name: 'TCP Port',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Port not accessible',
        duration_ms: duration,
      };
    }
  }

  /**
   * Make HTTP request with timeout
   */
  private httpRequest(
    url: string,
    timeout: number
  ): Promise<{ statusCode: number; statusMessage: string }> {
    return new Promise((resolve, reject) => {
      const req = http.get(url, { timeout }, (res) => {
        resolve({
          statusCode: res.statusCode || 0,
          statusMessage: res.statusMessage || '',
        });
        res.resume(); // Drain response
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Test TCP connection
   */
  private tcpConnect(
    host: string,
    port: number,
    timeout: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();

      const timeoutId = setTimeout(() => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      }, timeout);

      socket.connect(port, host, () => {
        clearTimeout(timeoutId);
        socket.end();
        resolve();
      });

      socket.on('error', (err) => {
        clearTimeout(timeoutId);
        socket.destroy();
        reject(err);
      });
    });
  }

  /**
   * Calculate overall health from individual checks
   */
  private calculateOverallHealth(
    checks: HealthCheckResult['checks']
  ): HealthStatus {
    if (checks.length === 0) {
      return 'unknown';
    }

    const hasUnhealthy = checks.some((check) => check.status === 'unhealthy');
    const hasDegraded = checks.some((check) => check.status === 'degraded');

    if (hasUnhealthy) {
      return 'unhealthy';
    }

    if (hasDegraded) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Perform continuous health monitoring
   */
  async monitorHealth(
    config: ServiceConfig,
    callback: (result: HealthCheckResult) => void
  ): Promise<() => void> {
    if (!config.health?.enabled) {
      throw new Error('Health checks not enabled for this service');
    }

    const interval = config.health.interval || 30000;
    const startupDelay = config.health.startup_delay || 0;

    // Wait for startup delay
    if (startupDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, startupDelay));
    }

    // Start monitoring
    const intervalId = setInterval(async () => {
      try {
        const result = await this.checkHealth(config);
        callback(result);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

/**
 * Create and export singleton instance
 */
export const healthCheckService = new HealthCheckService();
