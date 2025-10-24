/**
 * Example Workflows
 *
 * Sample workflow definitions for testing and demonstration.
 */

import { logger } from '../utils/logger.js';
import type { WorkflowDefinition, WorkflowContext } from '../workflow-engine/index.js';

/**
 * File Change Logger - Logs all file changes
 */
export const fileChangeLogger: WorkflowDefinition = {
  id: 'file-change-logger',
  name: 'File Change Logger',
  description: 'Logs details about file changes to the console',
  triggers: ['file:add', 'file:change', 'file:unlink'],
  enabled: true,
  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) {
      logger.warn('File event missing in context', { workflowId: context.workflowId });
      return;
    }

    logger.info('📄 File change detected by workflow', {
      workflow: 'file-change-logger',
      event: fileEvent.type,
      path: fileEvent.relativePath,
      size: fileEvent.stats?.size,
      timestamp: fileEvent.timestamp,
    });
  },
};

/**
 * Markdown Analyzer - Analyzes markdown files when added/changed
 */
export const markdownAnalyzer: WorkflowDefinition = {
  id: 'markdown-analyzer',
  name: 'Markdown Analyzer',
  description: 'Analyzes markdown files and extracts metadata',
  triggers: ['file:add', 'file:change'],
  enabled: true,
  fileFilter: '**/*.md',
  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    // Simulate analysis work
    await new Promise((resolve) => setTimeout(resolve, 100));

    logger.info('📊 Markdown file analyzed', {
      workflow: 'markdown-analyzer',
      path: fileEvent.relativePath,
      size: fileEvent.stats?.size,
      analysis: {
        hasContent: (fileEvent.stats?.size || 0) > 0,
        timestamp: new Date().toISOString(),
      },
    });
  },
};

/**
 * Concept Tracker - Tracks when concept files are created
 */
export const conceptTracker: WorkflowDefinition = {
  id: 'concept-tracker',
  name: 'Concept Tracker',
  description: 'Tracks creation of new concept files',
  triggers: ['file:add'],
  enabled: true,
  fileFilter: 'concepts/**/*.md',
  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    logger.info('💡 New concept created', {
      workflow: 'concept-tracker',
      path: fileEvent.relativePath,
      createdAt: fileEvent.timestamp,
    });

    // In a real implementation, this might:
    // - Send notification
    // - Update concept index
    // - Trigger AI analysis
  },
};

/**
 * File Deletion Monitor - Logs when files are deleted
 */
export const fileDeletionMonitor: WorkflowDefinition = {
  id: 'file-deletion-monitor',
  name: 'File Deletion Monitor',
  description: 'Monitors and logs file deletions',
  triggers: ['file:unlink'],
  enabled: true,
  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    logger.info('🗑️  File deleted', {
      workflow: 'file-deletion-monitor',
      path: fileEvent.relativePath,
      deletedAt: fileEvent.timestamp,
    });

    // In a real implementation, this might:
    // - Archive the file
    // - Update related documents
    // - Clean up shadow cache references
  },
};

/**
 * Get all example workflows
 */
export function getExampleWorkflows(): WorkflowDefinition[] {
  return [
    fileChangeLogger,
    markdownAnalyzer,
    conceptTracker,
    fileDeletionMonitor,
  ];
}
