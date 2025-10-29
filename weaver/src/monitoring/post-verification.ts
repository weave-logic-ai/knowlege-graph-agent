/**
 * Post-Action Verification System
 *
 * Verifies expected outcomes after operations:
 * - File integrity checks
 * - Database consistency validation
 * - Service health verification
 * - Performance metrics collection
 * - Automatic rollback on failure
 */

import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import { logger } from '../utils/logger.js';
import { snapshotManager, type StateSnapshot } from './snapshots.js';

/**
 * Verification result
 */
export interface VerificationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  metrics: Record<string, number>;
  metadata?: Record<string, unknown>;
}

/**
 * Expected outcome definition
 */
export interface ExpectedOutcome {
  name: string;
  verify: () => Promise<VerificationResult>;
  critical: boolean;
  rollbackOnFailure?: boolean;
}

/**
 * Operation result to verify
 */
export interface OperationResult {
  operation: string;
  startTime: Date;
  endTime: Date;
  snapshot?: StateSnapshot;
  expectedFiles?: {
    path: string;
    shouldExist: boolean;
    minSize?: number;
    maxSize?: number;
    checksum?: string;
  }[];
  expectedMetrics?: {
    maxDurationMs?: number;
    maxMemoryMB?: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Post-Action Verifier
 */
export class PostVerifier {
  private customVerifiers = new Map<string, ExpectedOutcome>();

  /**
   * Verify operation results
   */
  async verify(result: OperationResult): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    const metadata: Record<string, unknown> = {};

    logger.debug('Running post-action verification', { operation: result.operation });

    // Calculate duration
    const durationMs = result.endTime.getTime() - result.startTime.getTime();
    metrics.duration_ms = durationMs;

    // File integrity checks
    if (result.expectedFiles && result.expectedFiles.length > 0) {
      const fileResult = await this.verifyFiles(result.expectedFiles);
      errors.push(...fileResult.errors);
      warnings.push(...fileResult.warnings);
      Object.assign(metrics, fileResult.metrics);
      if (fileResult.metadata) {
        metadata.files = fileResult.metadata;
      }
    }

    // Performance metrics
    if (result.expectedMetrics) {
      const metricsResult = this.verifyMetrics(result.expectedMetrics, durationMs);
      errors.push(...metricsResult.errors);
      warnings.push(...metricsResult.warnings);
      Object.assign(metrics, metricsResult.metrics);
    }

    // Run custom verifiers
    for (const [name, verifier] of this.customVerifiers) {
      if (!verifier.critical) continue;

      const verifyResult = await verifier.verify();
      if (!verifyResult.success) {
        errors.push(`Custom verifier "${name}" failed: ${verifyResult.errors.join(', ')}`);
      }
      warnings.push(...verifyResult.warnings);
      Object.assign(metrics, verifyResult.metrics);
    }

    const success = errors.length === 0;

    if (!success) {
      logger.error('Post-action verification failed', new Error(errors.join('; ')), {
        operation: result.operation,
        errors,
        metrics,
      });

      // Rollback if snapshot exists and operation failed
      if (result.snapshot) {
        const shouldRollback = this.shouldRollback(result.operation);
        if (shouldRollback) {
          logger.warn('Initiating rollback due to verification failure', {
            operation: result.operation,
            snapshotId: result.snapshot.id,
          });

          try {
            await snapshotManager.rollback(result.snapshot.id);
            warnings.push('Rolled back to previous state due to verification failure');
          } catch (rollbackError) {
            errors.push(
              `Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown error'}`
            );
          }
        }
      }
    } else if (warnings.length > 0) {
      logger.warn('Post-action verification passed with warnings', {
        operation: result.operation,
        warnings,
        metrics,
      });
    } else {
      logger.debug('Post-action verification passed', {
        operation: result.operation,
        metrics,
      });
    }

    return { success, errors, warnings, metrics, metadata };
  }

  /**
   * Verify file integrity
   */
  private async verifyFiles(
    expectedFiles: OperationResult['expectedFiles']
  ): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};
    const fileDetails: Record<string, unknown> = {};

    if (!expectedFiles) {
      return { success: true, errors, warnings, metrics };
    }

    for (const file of expectedFiles) {
      try {
        const exists = existsSync(file.path);

        if (file.shouldExist && !exists) {
          errors.push(`Expected file not found: ${file.path}`);
          continue;
        }

        if (!file.shouldExist && exists) {
          warnings.push(`Unexpected file exists: ${file.path}`);
          continue;
        }

        if (!exists) continue;

        const stats = await fs.stat(file.path);
        fileDetails[file.path] = {
          size: stats.size,
          modified: stats.mtime,
        };

        // Size checks
        if (file.minSize !== undefined && stats.size < file.minSize) {
          errors.push(
            `File too small: ${file.path} (${stats.size} bytes, expected min ${file.minSize})`
          );
        }

        if (file.maxSize !== undefined && stats.size > file.maxSize) {
          warnings.push(
            `File larger than expected: ${file.path} (${stats.size} bytes, max ${file.maxSize})`
          );
        }

        // Checksum verification
        if (file.checksum) {
          const actualChecksum = await this.calculateChecksum(file.path);
          if (actualChecksum !== file.checksum) {
            errors.push(`File checksum mismatch: ${file.path}`);
          }
        }

        metrics[`file_size_${file.path.replace(/[^a-z0-9]/gi, '_')}`] = stats.size;
      } catch (error) {
        errors.push(
          `File verification failed for ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
      metrics,
      metadata: fileDetails,
    };
  }

  /**
   * Verify performance metrics
   */
  private verifyMetrics(
    expected: NonNullable<OperationResult['expectedMetrics']>,
    actualDurationMs: number
  ): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, number> = {};

    if (expected.maxDurationMs !== undefined) {
      metrics.max_duration_ms = expected.maxDurationMs;

      if (actualDurationMs > expected.maxDurationMs) {
        warnings.push(
          `Operation took longer than expected: ${actualDurationMs}ms (max ${expected.maxDurationMs}ms)`
        );
      }
    }

    if (expected.maxMemoryMB !== undefined) {
      const memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
      metrics.memory_used_mb = memoryUsageMB;

      if (memoryUsageMB > expected.maxMemoryMB) {
        warnings.push(
          `Memory usage higher than expected: ${memoryUsageMB.toFixed(2)}MB (max ${expected.maxMemoryMB}MB)`
        );
      }
    }

    return { success: errors.length === 0, errors, warnings, metrics };
  }

  /**
   * Calculate file checksum (SHA-256)
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Determine if operation should be rolled back on failure
   */
  private shouldRollback(operation: string): boolean {
    // Define operations that should rollback on failure
    const rollbackOperations = [
      'file:write',
      'file:delete',
      'workflow:execute',
      'vault:initialize',
    ];

    return rollbackOperations.some((op) => operation.startsWith(op));
  }

  /**
   * Register custom verifier
   */
  registerVerifier(name: string, verifier: ExpectedOutcome): void {
    this.customVerifiers.set(name, verifier);
    logger.debug('Custom verifier registered', { name, critical: verifier.critical });
  }

  /**
   * Unregister custom verifier
   */
  unregisterVerifier(name: string): void {
    this.customVerifiers.delete(name);
    logger.debug('Custom verifier unregistered', { name });
  }

  /**
   * Quick verification for file operations
   */
  async verifyFileOperation(filePath: string, operation: 'create' | 'update' | 'delete'): Promise<VerificationResult> {
    const startTime = new Date();
    const endTime = new Date();

    return this.verify({
      operation: `file:${operation}`,
      startTime,
      endTime,
      expectedFiles: [
        {
          path: filePath,
          shouldExist: operation !== 'delete',
        },
      ],
    });
  }

  /**
   * Verify workflow execution
   */
  async verifyWorkflowExecution(
    workflowId: string,
    startTime: Date,
    endTime: Date,
    snapshot?: StateSnapshot
  ): Promise<VerificationResult> {
    return this.verify({
      operation: `workflow:${workflowId}`,
      startTime,
      endTime,
      snapshot,
      expectedMetrics: {
        maxDurationMs: 300000, // 5 minutes
        maxMemoryMB: 500,
      },
    });
  }
}

/**
 * Global post-verifier instance
 */
export const postVerifier = new PostVerifier();
