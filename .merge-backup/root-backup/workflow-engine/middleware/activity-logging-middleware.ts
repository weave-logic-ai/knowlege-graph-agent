/**
 * Workflow Engine Activity Logging Middleware
 *
 * Automatically logs all workflow executions for 100% transparency
 */

import { getActivityLogger } from '../../vault-logger/activity-logger';
import { logger } from '../../utils/logger';
import type { WorkflowDefinition, WorkflowContext } from '../types';

export interface WorkflowExecutionContext {
  workflowId: string;
  workflowName: string;
  startTime: number;
  trigger: string;
}

/**
 * Log workflow execution start
 */
export async function logWorkflowStart(
  workflow: WorkflowDefinition,
  context: WorkflowContext
): Promise<WorkflowExecutionContext> {
  const startTime = Date.now();

  try {
    const activityLogger = getActivityLogger();
    activityLogger.setTask(`Workflow: ${workflow.name}`);

    await activityLogger.logPrompt(`Executing workflow: ${workflow.name}`, {
      workflowId: workflow.id,
      workflowName: workflow.name,
      triggers: workflow.triggers,
      filePath: context.fileEvent?.relativePath,
      eventType: context.trigger,
      timestamp: new Date().toISOString(),
    });

    logger.info('Workflow execution started', {
      workflowId: workflow.id,
      workflowName: workflow.name,
    });

    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      startTime,
      trigger: context.trigger,
    };
  } catch (error) {
    logger.warn('Failed to log workflow start', {
      error,
      workflowId: workflow.id,
    });
    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      startTime,
      trigger: context.trigger,
    };
  }
}

/**
 * Log workflow execution end
 */
export async function logWorkflowEnd(
  executionContext: WorkflowExecutionContext,
  result?: unknown,
  error?: Error
): Promise<void> {
  const duration = Date.now() - executionContext.startTime;

  try {
    const activityLogger = getActivityLogger();

    if (error) {
      await activityLogger.logError(error, {
        workflowId: executionContext.workflowId,
        workflowName: executionContext.workflowName,
        duration_ms: duration,
        trigger: executionContext.trigger,
      });
    } else {
      await activityLogger.logResults({
        workflowId: executionContext.workflowId,
        workflowName: executionContext.workflowName,
        success: true,
        duration_ms: duration,
        trigger: executionContext.trigger,
        result,
      });
    }

    logger.info('Workflow execution completed', {
      workflowId: executionContext.workflowId,
      duration_ms: duration,
      success: !error,
    });
  } catch (logError) {
    logger.warn('Failed to log workflow end', {
      error: logError,
      workflowId: executionContext.workflowId,
    });
  }
}

/**
 * Log workflow step execution
 */
export async function logWorkflowStep(
  workflowId: string,
  stepName: string,
  stepData: Record<string, unknown>
): Promise<void> {
  try {
    const activityLogger = getActivityLogger();

    await activityLogger.logToolCall(
      `workflow.${workflowId}.${stepName}`,
      stepData,
      undefined,
      0
    );
  } catch (error) {
    logger.warn('Failed to log workflow step', {
      error,
      workflowId,
      stepName,
    });
  }
}

/**
 * Wrap workflow handler method with activity logging
 */
export function withWorkflowLogging(workflow: WorkflowDefinition): WorkflowDefinition {
  const originalHandler = workflow.handler;

  return {
    ...workflow,
    async handler(context: WorkflowContext) {
      const executionContext = await logWorkflowStart(workflow, context);

      try {
        await originalHandler.call(workflow, context);
        await logWorkflowEnd(executionContext);
      } catch (error) {
        await logWorkflowEnd(executionContext, undefined, error as Error);
        throw error;
      }
    },
  };
}

/**
 * Log file watcher event
 */
export async function logFileWatcherEvent(
  eventType: string,
  filePath: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const activityLogger = getActivityLogger();

    await activityLogger.logPrompt(`File watcher event: ${eventType}`, {
      eventType,
      filePath,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn('Failed to log file watcher event', {
      error,
      eventType,
      filePath,
    });
  }
}
