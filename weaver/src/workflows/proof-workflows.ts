/**
 * Proof Workflows
 *
 * Workflows that demonstrate task and phase completion tracking.
 * Enhanced in Phase 5 with frontmatter parsing and shadow cache integration.
 */

import { logger } from '../utils/logger.js';
import { parseMarkdownFile } from '../shadow-cache/parser.js';
import type { WorkflowDefinition, WorkflowContext } from '../workflow-engine/index.js';
import type { ShadowCache } from '../shadow-cache/index.js';
import { join } from 'path';

/**
 * Task Completion Workflow
 *
 * Triggered when task-related files are created or modified.
 * Enhanced with frontmatter parsing and shadow cache integration.
 *
 * Triggered on:
 * - Files in _log/tasks/ directory
 * - Files with "task" in the filename
 */
export function createTaskCompletionWorkflow(
  vaultPath: string,
  shadowCache: ShadowCache
): WorkflowDefinition {
  return {
    id: 'task-completion',
    name: 'Task Completion Workflow',
    description: 'Tracks task completion and logs task metadata with frontmatter parsing',
    triggers: ['file:add', 'file:change'],
    enabled: true,
    fileFilter: '_log/tasks/**/*.md',
    handler: async (context: WorkflowContext) => {
      const { fileEvent } = context;
      if (!fileEvent) return;

      logger.info('📋 Task completion workflow triggered', {
        workflow: 'task-completion',
        file: fileEvent.relativePath,
        event: fileEvent.type,
      });

      try {
        // Parse markdown file with frontmatter
        const absolutePath = join(vaultPath, fileEvent.relativePath);
        const fileUpdate = parseMarkdownFile(absolutePath, fileEvent.relativePath);

        // Extract task metadata from frontmatter
        const taskId = (fileUpdate.frontmatter?.['task_id'] as string) || extractTaskId(fileEvent.relativePath);
        const taskName = (fileUpdate.frontmatter?.['task_name'] as string) || fileUpdate.title || extractTaskName(fileEvent.relativePath);
        const status = (fileUpdate.frontmatter?.['status'] as string) || 'unknown';
        const priority = (fileUpdate.frontmatter?.['priority'] as string) || 'medium';
        const startedAt = (fileUpdate.frontmatter?.['started_at'] as string);
        const completedAt = (fileUpdate.frontmatter?.['completed_at'] as string);
        const assignedTo = (fileUpdate.frontmatter?.['assigned_to'] as string);
        const phase = (fileUpdate.frontmatter?.['phase'] as string);

        logger.info('✅ Task tracked with metadata', {
          taskId,
          taskName,
          status,
          priority,
          startedAt,
          completedAt,
          assignedTo,
          phase,
          file: fileEvent.relativePath,
          size: fileEvent.stats?.size,
          timestamp: fileEvent.timestamp,
        });

        // Update file type in frontmatter to 'task_log' for shadow cache
        const enhancedFileUpdate = {
          ...fileUpdate,
          frontmatter: {
            ...fileUpdate.frontmatter,
            type: 'task_log',
            task_id: taskId,
            task_name: taskName,
            status,
            priority,
          },
        };

        // Store in shadow cache with enhanced metadata
        await shadowCache.upsertFile(enhancedFileUpdate);

        logger.debug('Task metadata stored in shadow cache', {
          taskId,
          path: fileEvent.relativePath,
        });
      } catch (error) {
        logger.error('Failed to process task file', error instanceof Error ? error : new Error(String(error)), {
          file: fileEvent.relativePath,
        });
      }
    },
  };
}

/**
 * Backward compatibility: Create default task completion workflow
 */
export const taskCompletionWorkflow: WorkflowDefinition = {
  id: 'task-completion',
  name: 'Task Completion Workflow',
  description: 'Tracks task completion and logs task metadata (basic version)',
  triggers: ['file:add', 'file:change'],
  enabled: true,
  fileFilter: '_log/tasks/**/*.md',
  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    logger.info('📋 Task completion workflow triggered (basic version)', {
      workflow: 'task-completion',
      file: fileEvent.relativePath,
      event: fileEvent.type,
    });

    const taskId = extractTaskId(fileEvent.relativePath);
    const taskName = extractTaskName(fileEvent.relativePath);

    logger.info('✅ Task tracked', {
      taskId,
      taskName,
      file: fileEvent.relativePath,
      size: fileEvent.stats?.size,
      timestamp: fileEvent.timestamp,
    });
  },
};

/**
 * Phase Completion Workflow
 *
 * Triggered when phase-related files are created or modified.
 * Enhanced with frontmatter parsing and shadow cache integration.
 *
 * Triggered on:
 * - Files in _planning/phases/ directory
 * - Files with "phase" in the filename
 * - PHASE-*-COMPLETION-REPORT.md files
 */
export function createPhaseCompletionWorkflow(
  vaultPath: string,
  shadowCache: ShadowCache
): WorkflowDefinition {
  return {
    id: 'phase-completion',
    name: 'Phase Completion Workflow',
    description: 'Tracks phase completion and generates reports with frontmatter parsing',
    triggers: ['file:add', 'file:change'],
    enabled: true,
    fileFilter: '_planning/phases/**/*COMPLETION*.md',
    handler: async (context: WorkflowContext) => {
      const { fileEvent } = context;
      if (!fileEvent) return;

      logger.info('🎯 Phase completion workflow triggered', {
        workflow: 'phase-completion',
        file: fileEvent.relativePath,
        event: fileEvent.type,
      });

      try {
        // Parse markdown file with frontmatter
        const absolutePath = join(vaultPath, fileEvent.relativePath);
        const fileUpdate = parseMarkdownFile(absolutePath, fileEvent.relativePath);

        // Extract phase metadata from frontmatter
        const phaseId = (fileUpdate.frontmatter?.['phase_id'] as string) || extractPhaseId(fileEvent.relativePath);
        const phaseName = (fileUpdate.frontmatter?.['phase_name'] as string) || fileUpdate.title || 'Unknown Phase';
        const status = (fileUpdate.frontmatter?.['status'] as string) || 'unknown';
        const priority = (fileUpdate.frontmatter?.['priority'] as string);
        const startDate = (fileUpdate.frontmatter?.['start_date'] as string);
        const endDate = (fileUpdate.frontmatter?.['end_date'] as string);
        const duration = (fileUpdate.frontmatter?.['duration'] as string);
        const exitCriteria = (fileUpdate.frontmatter?.['exit_criteria'] as string[]) || [];
        const dependencies = (fileUpdate.frontmatter?.['dependencies'] as string[]) || [];
        const isCompletionReport = fileEvent.relativePath.includes('COMPLETION-REPORT');

        logger.info('✅ Phase milestone tracked with metadata', {
          phaseId,
          phaseName,
          status,
          priority,
          startDate,
          endDate,
          duration,
          isCompletionReport,
          exitCriteriaCount: exitCriteria.length,
          dependenciesCount: dependencies.length,
          file: fileEvent.relativePath,
          size: fileEvent.stats?.size,
          timestamp: fileEvent.timestamp,
        });

        // Update file type in frontmatter to 'phase_log' for shadow cache
        const enhancedFileUpdate = {
          ...fileUpdate,
          frontmatter: {
            ...fileUpdate.frontmatter,
            type: isCompletionReport ? 'phase_completion_report' : 'phase_log',
            phase_id: phaseId,
            phase_name: phaseName,
            status,
            priority,
          },
        };

        // Store in shadow cache with enhanced metadata
        await shadowCache.upsertFile(enhancedFileUpdate);

        logger.debug('Phase metadata stored in shadow cache', {
          phaseId,
          path: fileEvent.relativePath,
        });

        if (isCompletionReport) {
          logger.info('🎉 Phase completion report detected and processed', {
            phaseId,
            phaseName,
            status,
            exitCriteriaCount: exitCriteria.length,
            file: fileEvent.relativePath,
          });
        }
      } catch (error) {
        logger.error('Failed to process phase file', error instanceof Error ? error : new Error(String(error)), {
          file: fileEvent.relativePath,
        });
      }
    },
  };
}

/**
 * Backward compatibility: Create default phase completion workflow
 */
export const phaseCompletionWorkflow: WorkflowDefinition = {
  id: 'phase-completion',
  name: 'Phase Completion Workflow',
  description: 'Tracks phase completion and generates reports (basic version)',
  triggers: ['file:add', 'file:change'],
  enabled: true,
  fileFilter: '_planning/phases/**/*COMPLETION*.md',
  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    logger.info('🎯 Phase completion workflow triggered (basic version)', {
      workflow: 'phase-completion',
      file: fileEvent.relativePath,
      event: fileEvent.type,
    });

    const phaseId = extractPhaseId(fileEvent.relativePath);
    const isCompletionReport = fileEvent.relativePath.includes('COMPLETION-REPORT');

    logger.info('✅ Phase milestone tracked', {
      phaseId,
      isCompletionReport,
      file: fileEvent.relativePath,
      size: fileEvent.stats?.size,
      timestamp: fileEvent.timestamp,
    });

    if (isCompletionReport) {
      logger.info('🎉 Phase completion report detected', {
        phaseId,
        file: fileEvent.relativePath,
      });
    }
  },
};

/**
 * General Task Tracker
 *
 * Tracks task-related files across the vault.
 * Complements task-completion workflow.
 */
export const generalTaskTracker: WorkflowDefinition = {
  id: 'general-task-tracker',
  name: 'General Task Tracker',
  description: 'Tracks task files anywhere in the vault',
  triggers: ['file:add', 'file:change'],
  enabled: true,
  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    // Only process files with "task" in the path or name
    const isTaskFile = fileEvent.relativePath.toLowerCase().includes('task');
    if (!isTaskFile) return;

    // Skip if already handled by task-completion workflow
    if (fileEvent.relativePath.startsWith('_log/tasks/')) return;

    logger.info('📝 Task file detected', {
      workflow: 'general-task-tracker',
      file: fileEvent.relativePath,
      event: fileEvent.type,
    });

    // In Phase 5, this will:
    // - Parse task metadata
    // - Link to project tracking
    // - Update task graphs
    // - Cross-reference with other tasks
  },
};

/**
 * Helper: Extract task ID from file path
 */
function extractTaskId(filePath: string): string {
  // Extract hash from end of filename (last segment before .md)
  const match = filePath.match(/\.([a-f0-9]{6})\.md$/);
  if (!match || !match[1]) return 'unknown';
  return match[1];
}

/**
 * Helper: Extract task name from file path
 */
function extractTaskName(filePath: string): string {
  // Extract task name from filename
  // Example: review_2025-10-22.3.23.3b.23.implement_hooks.automation.33eb0d.md
  const filename = filePath.split('/').pop();
  if (!filename) return 'unknown';

  const parts = filename.split('.');

  // Find the part that looks like a task name (has underscores)
  const taskPart = parts.find((p) => p.includes('_') && p !== 'md');
  if (taskPart) {
    return taskPart.replace(/_/g, ' ');
  }

  return filename.replace('.md', '');
}

/**
 * Helper: Extract phase ID from file path
 */
function extractPhaseId(filePath: string): string {
  // Match phase-4b, PHASE-4B, etc.
  const match = filePath.match(/phase[_-]?(\d+[a-z]?)/i);
  if (!match || !match[1]) return 'unknown';
  return match[1];
}

/**
 * Get proof workflows
 */
export function getProofWorkflows(): WorkflowDefinition[] {
  return [
    taskCompletionWorkflow,
    phaseCompletionWorkflow,
    generalTaskTracker,
  ];
}

/**
 * Export all workflows
 */
export { specKitWorkflow } from './spec-kit-workflow.js';
