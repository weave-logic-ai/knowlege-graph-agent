/**
 * PM2 Connection Pool
 * Manages reusable PM2 connections for performance optimization
 */

import pm2 from 'pm2';

/**
 * PM2 connection pool singleton
 */
class PM2ConnectionPool {
  private connected = false;
  private connecting: Promise<void> | null = null;
  private lastUsed = Date.now();
  private idleTimeout = 60000; // 1 minute
  private idleTimer: NodeJS.Timeout | null = null;

  /**
   * Get or create PM2 connection
   */
  async connect(): Promise<void> {
    // Already connected
    if (this.connected) {
      this.lastUsed = Date.now();
      this.resetIdleTimer();
      return;
    }

    // Connection in progress
    if (this.connecting) {
      return this.connecting;
    }

    // Start new connection
    this.connecting = new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          this.connecting = null;
          reject(new Error(`Failed to connect to PM2: ${err.message}`));
          return;
        }
        this.connected = true;
        this.connecting = null;
        this.lastUsed = Date.now();
        this.resetIdleTimer();
        resolve();
      });
    });

    return this.connecting;
  }

  /**
   * Disconnect from PM2 (called on idle timeout)
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return;

    return new Promise((resolve) => {
      pm2.disconnect();
      this.connected = false;
      this.connecting = null;
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
        this.idleTimer = null;
      }
      resolve();
    });
  }

  /**
   * Reset idle timeout timer
   */
  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      const idleTime = Date.now() - this.lastUsed;
      if (idleTime >= this.idleTimeout) {
        this.disconnect().catch(console.error);
      }
    }, this.idleTimeout);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Force disconnect (for cleanup)
   */
  async forceDisconnect(): Promise<void> {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.connected) {
      await this.disconnect();
    }
  }
}

/**
 * Export singleton instance
 */
export const connectionPool = new PM2ConnectionPool();
