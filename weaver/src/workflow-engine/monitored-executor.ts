/**
 * Monitored Workflow Executor
 *
 * Wraps workflow execution with monitoring:
 * - Pre-action validation
 * - State snapshots
 * - Post-action verification
 * - Automatic rollback on failure
 */

import { logger } from '../utils/logger.js';
import { stateValidator, type OperationContext } from '../monitoring/state-validator.js';
import { postVerifier, type OperationResult } from '../monitoring/post-verification.js';
import { snapshotManager, type SnapshotOptions } from '../monitoring/snapshots.js';
import { alerting } from '../monitoring/alerting.js';
import type { WorkflowContext } from './types.js';

/**
 * Monitored execution options
 */
export interface MonitoredExecutionOptions {
  validate?: boolean;
  snapshot?: boolean;
  verify?: boolean;
  snapshotOptions?: SnapshotOptions;
  validationContext?: Partial<OperationContext>;
}

/**
 * Execution result
 */
export interface ExecutionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  verification?: {
    success: boolean;
    errors: string[];
    warnings: string[];
    metrics: Record<string, number>;
  };
  snapshotId?: string;
  rolledBack?: boolean;
}

/**
 * Monitored Workflow Executor
 */
export class MonitoredExecutor {
  /**
   * Execute a workflow with full monitoring
   */
  async executeWorkflow<T = unknown>(
    workflowId: string,
    handler: (context: WorkflowContext) => Promise<T>,
    context: WorkflowContext,
    options: MonitoredExecutionOptions = {}
  ): Promise<ExecutionResult<T>> {
    const {
      validate = true,
      snapshot = true,
      verify = true,
      snapshotOptions = {},
      validationContext = {},
    } = options;

    const startTime = new Date();
    let snapshotId: string | undefined;
    let rolledBack = false;

    try {
      // 1. Pre-action validation
      if (validate) {
        logger.debug('Running pre-action validation', { workflowId });

        const validationResult = await stateValidator.validate({
          operation: `workflow:${workflowId}`,
          minMemoryMB: 50,
          minDiskSpaceMB: 100,
          ...validationContext,
        });

        if (!validationResult.valid) {
          logger.error('Pre-action validation failed', new Error(validationResult.errors.join('; ')), {
            workflowId,
            errors: validationResult.errors,
          });

          // Trigger alert
          await alerting.trigger({
            severity: 'critical',
            title: `Workflow Validation Failed: ${workflowId}`,
            message: `Pre-action validation failed: ${validationResult.errors.join(', ')}`,
            source: 'monitored-executor',
            metadata: { workflowId, errors: validationResult.errors },
          });

          return {
            success: false,
            error: new Error(`Validation failed: ${validationResult.errors.join('; ')}`),
            validation: {
              valid: false,
              errors: validationResult.errors,
              warnings: validationResult.warnings,
            },
          };
        }

        if (validationResult.warnings.length > 0) {
          logger.warn('Pre-action validation passed with warnings', {
            workflowId,
            warnings: validationResult.warnings,
          });
        }
      }

      // 2. Create state snapshot
      if (snapshot) {
        logger.debug('Creating state snapshot', { workflowId });

        const stateSnapshot = await snapshotManager.createSnapshot(
          `workflow:${workflowId}`,
          snapshotOptions
        );

        snapshotId = stateSnapshot.id;
      }

      // 3. Execute workflow
      logger.info('Executing monitored workflow', { workflowId });
      const data = await handler(context);

      const endTime = new Date();

      // 4. Post-action verification
      if (verify) {
        logger.debug('Running post-action verification', { workflowId });

        const verificationResult = await postVerifier.verify({
          operation: `workflow:${workflowId}`,
          startTime,
          endTime,
          snapshot: snapshotId ? snapshotManager.getSnapshot(snapshotId) : undefined,
          expectedMetrics: {
            maxDurationMs: 300000, // 5 minutes
            maxMemoryMB: 500,
          },
        });

        if (!verificationResult.success) {
          logger.error('Post-action verification failed', new Error(verificationResult.errors.join('; ')), {
            workflowId,
            errors: verificationResult.errors,
          });

          // Check if rollback occurred
          if (snapshotId) {
            const currentSnapshot = snapshotManager.getSnapshot(snapshotId);
            if (!currentSnapshot) {
              rolledBack = true;
            }
          }

          // Trigger alert
          await alerting.trigger({
            severity: 'warning',
            title: `Workflow Verification Failed: ${workflowId}`,
            message: `Post-action verification failed: ${verificationResult.errors.join(', ')}`,
            source: 'monitored-executor',
            metadata: {
              workflowId,
              errors: verificationResult.errors,
              rolledBack,
            },
          });

          return {
            success: false,
            data,
            error: new Error(`Verification failed: ${verificationResult.errors.join('; ')}`),
            verification: {
              success: false,
              errors: verificationResult.errors,
              warnings: verificationResult.warnings,
              metrics: verificationResult.metrics,
            },
            snapshotId,
            rolledBack,
          };
        }

        if (verificationResult.warnings.length > 0) {
          logger.warn('Post-action verification passed with warnings', {
            workflowId,
            warnings: verificationResult.warnings,
          });
        }

        return {
          success: true,
          data,
          verification: {
            success: true,
            errors: [],
            warnings: verificationResult.warnings,
            metrics: verificationResult.metrics,
          },
          snapshotId,
        };
      }

      return {
        success: true,
        data,
        snapshotId,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      logger.error('Workflow execution failed', err, { workflowId });

      // Trigger alert
      await alerting.trigger({
        severity: 'critical',
        title: `Workflow Execution Failed: ${workflowId}`,
        message: `Workflow execution failed: ${err.message}`,
        source: 'monitored-executor',
        metadata: { workflowId, error: err.message },
      });

      // Attempt rollback if snapshot exists
      if (snapshotId && snapshot) {
        logger.warn('Attempting rollback due to execution failure', { workflowId, snapshotId });

        try {
          await snapshotManager.rollback(snapshotId);
          rolledBack = true;
          logger.info('Rollback successful', { workflowId, snapshotId });
        } catch (rollbackError) {
          logger.error('Rollback failed', rollbackError as Error, { workflowId, snapshotId });
        }
      }

      return {
        success: false,
        error: err,
        snapshotId,
        rolledBack,
      };
    }
  }

  /**
   * Execute a simple operation with monitoring
   */
  async executeOperation<T = unknown>(
    operationName: string,
    operation: () => Promise<T>,
    options: MonitoredExecutionOptions = {}
  ): Promise<ExecutionResult<T>> {
    return this.executeWorkflow(
      operationName,
      async () => operation(),
      {
        workflowId: operationName,
        trigger: 'manual',
        triggeredAt: new Date(),
      },
      options
    );
  }
}

/**
 * Global monitored executor instance
 */
export const monitoredExecutor = new MonitoredExecutor();
