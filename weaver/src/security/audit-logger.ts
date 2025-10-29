/**
 * Security Audit Logger
 *
 * Tamper-proof audit logging for security-relevant events:
 * - Authentication attempts
 * - Configuration changes
 * - File access
 * - API key usage
 * - Rate limit violations
 * - Validation failures
 */

import { createWriteStream, existsSync, statSync, renameSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type AuditLevel = 'info' | 'warning' | 'critical';
export type AuditCategory =
  | 'auth'
  | 'config'
  | 'access'
  | 'api'
  | 'validation'
  | 'rate_limit'
  | 'security'
  | 'system';

export type AuditResult = 'success' | 'failure' | 'blocked';

export interface AuditEvent {
  timestamp: number;
  level: AuditLevel;
  category: AuditCategory;
  action: string;
  result: AuditResult;
  user?: string;
  ip?: string;
  metadata: Record<string, unknown>;
  hash?: string; // For tamper detection
}

export interface AuditLoggerConfig {
  logDir: string;
  maxFileSize: number; // bytes
  maxFiles: number;
  enableConsole: boolean;
  enableHashing: boolean; // Enable tamper detection
}

// ============================================================================
// Audit Logger Implementation
// ============================================================================

export class AuditLogger {
  private config: AuditLoggerConfig;
  private currentStream: ReturnType<typeof createWriteStream> | null = null;
  private currentFile: string | null = null;
  private eventCount = 0;
  private previousHash: string | null = null;

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = {
      logDir: config.logDir || './logs/audit',
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 100,
      enableConsole: config.enableConsole ?? true,
      enableHashing: config.enableHashing ?? true,
    };
  }

  /**
   * Initialize the audit logger
   */
  async init(): Promise<void> {
    // Create log directory if it doesn't exist
    await mkdir(this.config.logDir, { recursive: true });

    // Open initial log file
    await this.rotateIfNeeded();
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'timestamp' | 'hash'>): Promise<void> {
    const fullEvent: AuditEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Add hash for tamper detection
    if (this.config.enableHashing) {
      fullEvent.hash = this.computeHash(fullEvent);
    }

    // Rotate log file if needed
    await this.rotateIfNeeded();

    // Write to file
    if (this.currentStream) {
      const line = JSON.stringify(fullEvent) + '\n';
      this.currentStream.write(line);
      this.eventCount++;
    }

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(fullEvent);
    }
  }

  // ============================================================================
  // Convenience Methods for Common Events
  // ============================================================================

  async logAuth(params: {
    action: string;
    result: AuditResult;
    user?: string;
    ip?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      level: params.result === 'success' ? 'info' : 'warning',
      category: 'auth',
      action: params.action,
      result: params.result,
      user: params.user,
      ip: params.ip,
      metadata: params.metadata || {},
    });
  }

  async logConfigChange(params: {
    action: string;
    user?: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      level: 'warning',
      category: 'config',
      action: params.action,
      result: 'success',
      user: params.user,
      metadata: params.metadata,
    });
  }

  async logFileAccess(params: {
    action: string;
    path: string;
    result: AuditResult;
    user?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      level: params.result === 'blocked' ? 'critical' : 'info',
      category: 'access',
      action: params.action,
      result: params.result,
      user: params.user,
      metadata: {
        ...params.metadata,
        path: params.path,
      },
    });
  }

  async logApiKeyUsage(params: {
    action: string;
    keyId: string;
    result: AuditResult;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      level: params.result === 'failure' ? 'warning' : 'info',
      category: 'api',
      action: params.action,
      result: params.result,
      metadata: {
        ...params.metadata,
        keyId: params.keyId,
      },
    });
  }

  async logRateLimitViolation(params: {
    endpoint: string;
    identifier: string;
    ip?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      level: 'warning',
      category: 'rate_limit',
      action: 'rate_limit_exceeded',
      result: 'blocked',
      ip: params.ip,
      metadata: {
        ...params.metadata,
        endpoint: params.endpoint,
        identifier: params.identifier,
      },
    });
  }

  async logValidationFailure(params: {
    action: string;
    error: string;
    user?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      level: 'warning',
      category: 'validation',
      action: params.action,
      result: 'failure',
      user: params.user,
      metadata: {
        ...params.metadata,
        error: params.error,
      },
    });
  }

  async logSecurityEvent(params: {
    action: string;
    level: AuditLevel;
    result: AuditResult;
    user?: string;
    ip?: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      level: params.level,
      category: 'security',
      action: params.action,
      result: params.result,
      user: params.user,
      ip: params.ip,
      metadata: params.metadata,
    });
  }

  // ============================================================================
  // Log Rotation
  // ============================================================================

  private async rotateIfNeeded(): Promise<void> {
    // Check if we need to rotate based on file size
    if (this.currentFile && existsSync(this.currentFile)) {
      const stats = statSync(this.currentFile);
      if (stats.size >= this.config.maxFileSize) {
        await this.rotate();
      }
    } else if (!this.currentStream) {
      await this.rotate();
    }
  }

  private async rotate(): Promise<void> {
    // Close current stream
    if (this.currentStream) {
      this.currentStream.end();
      this.currentStream = null;
    }

    // Generate new file name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `audit-${timestamp}.log`;
    const filePath = join(this.config.logDir, fileName);

    // Create new stream
    this.currentFile = filePath;
    this.currentStream = createWriteStream(filePath, {
      flags: 'a', // Append mode
      encoding: 'utf8',
    });

    this.eventCount = 0;
    this.previousHash = null;

    // Clean up old log files
    await this.cleanupOldLogs();
  }

  private async cleanupOldLogs(): Promise<void> {
    // Implementation would list files and remove oldest if count exceeds maxFiles
    // Simplified version here
  }

  // ============================================================================
  // Tamper Detection
  // ============================================================================

  private computeHash(event: AuditEvent): string {
    // Create a deterministic string representation
    const dataToHash = JSON.stringify({
      timestamp: event.timestamp,
      level: event.level,
      category: event.category,
      action: event.action,
      result: event.result,
      user: event.user,
      ip: event.ip,
      metadata: event.metadata,
      previousHash: this.previousHash,
    });

    const hash = createHash('sha256').update(dataToHash).digest('hex');
    this.previousHash = hash;
    return hash;
  }

  /**
   * Verify the integrity of audit log entries
   */
  verifyIntegrity(events: AuditEvent[]): {
    valid: boolean;
    invalidIndices: number[];
  } {
    if (!this.config.enableHashing) {
      return { valid: true, invalidIndices: [] };
    }

    const invalidIndices: number[] = [];
    let previousHash: string | null = null;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const expectedHash = this.recomputeHash(event, previousHash);

      if (event.hash !== expectedHash) {
        invalidIndices.push(i);
      }

      previousHash = event.hash || null;
    }

    return {
      valid: invalidIndices.length === 0,
      invalidIndices,
    };
  }

  private recomputeHash(event: AuditEvent, previousHash: string | null): string {
    const dataToHash = JSON.stringify({
      timestamp: event.timestamp,
      level: event.level,
      category: event.category,
      action: event.action,
      result: event.result,
      user: event.user,
      ip: event.ip,
      metadata: event.metadata,
      previousHash,
    });

    return createHash('sha256').update(dataToHash).digest('hex');
  }

  // ============================================================================
  // Console Output
  // ============================================================================

  private logToConsole(event: AuditEvent): void {
    const timestamp = new Date(event.timestamp).toISOString();
    const level = event.level.toUpperCase().padEnd(8);
    const category = event.category.toUpperCase().padEnd(12);
    const result = event.result.padEnd(8);

    let color = '';
    switch (event.level) {
      case 'critical':
        color = '\x1b[31m'; // Red
        break;
      case 'warning':
        color = '\x1b[33m'; // Yellow
        break;
      case 'info':
        color = '\x1b[36m'; // Cyan
        break;
    }
    const reset = '\x1b[0m';

    const message = `${color}[AUDIT] ${timestamp} ${level} ${category} ${event.action} (${result})${reset}`;
    const details = event.user || event.ip
      ? ` user=${event.user || 'N/A'} ip=${event.ip || 'N/A'}`
      : '';

    console.log(message + details);

    if (Object.keys(event.metadata).length > 0) {
      console.log('  Metadata:', JSON.stringify(event.metadata, null, 2));
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async close(): Promise<void> {
    if (this.currentStream) {
      return new Promise((resolve) => {
        this.currentStream!.end(() => {
          this.currentStream = null;
          resolve();
        });
      });
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalAuditLogger: AuditLogger | null = null;

/**
 * Get or create the global audit logger instance
 */
export async function getAuditLogger(
  config?: Partial<AuditLoggerConfig>
): Promise<AuditLogger> {
  if (!globalAuditLogger) {
    globalAuditLogger = new AuditLogger(config);
    await globalAuditLogger.init();
  }

  return globalAuditLogger;
}

/**
 * Close the global audit logger instance
 */
export async function closeAuditLogger(): Promise<void> {
  if (globalAuditLogger) {
    await globalAuditLogger.close();
    globalAuditLogger = null;
  }
}
