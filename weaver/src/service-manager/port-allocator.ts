/**
 * Port Allocator
 * Handles port conflict detection and automatic port selection
 */

import net from 'node:net';
import { logger } from './logger.js';
import { withRetry } from '../utils/error-recovery.js';

/**
 * Port allocation configuration
 */
export interface PortConfig {
  preferredPort?: number;
  autoSelect?: boolean;
  retryCount?: number;
  portRange?: { min: number; max: number };
}

/**
 * Port allocator for managing service ports
 */
export class PortAllocator {
  private allocatedPorts = new Map<string, number>();
  private readonly defaultRange = { min: 3000, max: 9999 };

  /**
   * Check if a port is available
   */
  async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
          resolve(false);
        } else {
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(true);
      });

      server.listen(port, '0.0.0.0');
    });
  }

  /**
   * Allocate a port for a service
   */
  async allocatePort(
    serviceName: string,
    config: PortConfig = {}
  ): Promise<number> {
    const {
      preferredPort,
      autoSelect = true,
      retryCount = 3,
      portRange = this.defaultRange,
    } = config;

    // Try preferred port first
    if (preferredPort) {
      const available = await this.tryPort(preferredPort, retryCount);
      if (available) {
        this.allocatedPorts.set(serviceName, preferredPort);
        logger.info(`Allocated preferred port ${preferredPort} to ${serviceName}`);
        return preferredPort;
      }

      if (!autoSelect) {
        throw new Error(
          `Port ${preferredPort} is not available and auto-select is disabled`
        );
      }

      logger.warn(
        `Preferred port ${preferredPort} not available, searching for alternative`
      );
    }

    // Auto-select available port
    if (autoSelect) {
      const port = await this.findAvailablePort(portRange);
      this.allocatedPorts.set(serviceName, port);
      logger.info(`Auto-selected port ${port} for ${serviceName}`);
      return port;
    }

    throw new Error(`No available port found for ${serviceName}`);
  }

  /**
   * Try to bind to a port with retries
   */
  private async tryPort(port: number, retries: number): Promise<boolean> {
    try {
      const result = await withRetry(
        async () => {
          const available = await this.isPortAvailable(port);
          if (!available) {
            throw new Error(`Port ${port} is in use`);
          }
          return true;
        },
        {
          maxAttempts: retries,
          initialDelay: 1000,
          backoffMultiplier: 2,
          jitter: true,
          onRetry: (error, attempt) => {
            logger.debug(`Retrying port ${port} check, attempt ${attempt}`);
          },
        }
      );
      return result;
    } catch {
      return false;
    }
  }

  /**
   * Find an available port in the specified range
   */
  private async findAvailablePort(range: {
    min: number;
    max: number;
  }): Promise<number> {
    // Start from a random port to avoid collisions
    const startPort = Math.floor(
      Math.random() * (range.max - range.min) + range.min
    );

    // Try ports in sequence
    for (let offset = 0; offset < range.max - range.min; offset++) {
      const port = ((startPort - range.min + offset) % (range.max - range.min)) + range.min;

      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    throw new Error(
      `No available ports found in range ${range.min}-${range.max}`
    );
  }

  /**
   * Release a port allocation
   */
  releasePort(serviceName: string): void {
    const port = this.allocatedPorts.get(serviceName);
    if (port) {
      this.allocatedPorts.delete(serviceName);
      logger.debug(`Released port ${port} from ${serviceName}`);
    }
  }

  /**
   * Get allocated port for a service
   */
  getAllocatedPort(serviceName: string): number | undefined {
    return this.allocatedPorts.get(serviceName);
  }

  /**
   * Check for port conflicts across services
   */
  hasConflict(port: number, excludeService?: string): boolean {
    for (const [name, allocatedPort] of this.allocatedPorts.entries()) {
      if (name !== excludeService && allocatedPort === port) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Singleton instance
 */
export const portAllocator = new PortAllocator();
