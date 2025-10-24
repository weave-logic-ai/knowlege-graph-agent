/**
 * Proof Workflows
 *
 * Workflows that demonstrate task and phase completion tracking.
 * These are simplified versions that will be enhanced with Claude Code hooks in Phase 5.
 */

import { logger } from '../utils/logger.js';
import type { WorkflowDefinition, WorkflowContext } from '../workflow-engine/index.js';

/**
 * Task Completion Workflow
 *
 * Triggered when task-related files are created or modified.
 * In Phase 5, this will be triggered by Claude Code hooks.
 *
 * For now, it triggers on:
 * - Files in _log/tasks/ directory
 * - Files with "task" in the filename
 */
export const taskCompletionWorkflow: WorkflowDefinition = {
  id: 'task-completion',
  name: 'Task Completion Workflow',
  description: 'Tracks task completion and logs task metadata',
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

    // Extract task information from file path
    // Example: _log/tasks/review_2025-10-22.3.23.3b.23.implement_hooks.automation.33eb0d.md
    const taskId = extractTaskId(fileEvent.relativePath);
    const taskName = extractTaskName(fileEvent.relativePath);

    logger.info('✅ Task tracked', {
      taskId,
      taskName,
      file: fileEvent.relativePath,
      size: fileEvent.stats?.size,
      timestamp: fileEvent.timestamp,
    });

    // In Phase 5, this will:
    // - Parse task metadata from frontmatter
    // - Update task database
    // - Send notifications
    // - Trigger downstream workflows
    // - Update project dashboards
  },
};

/**
 * Phase Completion Workflow
 *
 * Triggered when phase-related files are created or modified.
 * In Phase 5, this will be triggered by Claude Code hooks.
 *
 * For now, it triggers on:
 * - Files in _planning/phases/ directory
 * - Files with "phase" in the filename
 * - PHASE-*-COMPLETION-REPORT.md files
 */
export const phaseCompletionWorkflow: WorkflowDefinition = {
  id: 'phase-completion',
  name: 'Phase Completion Workflow',
  description: 'Tracks phase completion and generates reports',
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

    // Extract phase information
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

      // In Phase 5, this will:
      // - Parse completion report
      // - Validate exit criteria
      // - Generate metrics dashboard
      // - Archive phase artifacts
      // - Trigger next phase initialization
      // - Send stakeholder notifications
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
