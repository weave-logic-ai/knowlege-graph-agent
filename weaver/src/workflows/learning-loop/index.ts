/**
 * Learning Loop Markdown Workflow System
 *
 * This module provides async markdown-based workflows for the learning loop.
 * Each learning stage (Perception, Reasoning, Execution, Reflection) generates
 * a markdown template that users fill out at their convenience. When marked as
 * completed, workflows trigger automatically to process the feedback.
 *
 * @module workflows/learning-loop
 */

export * from './types.js';
export * from './markdown-parser.js';
export * from './file-watcher.js';
export * from './base-workflow.js';
export * from './perception-workflow.js';
export * from './reasoning-workflow.js';
export * from './execution-workflow.js';
export * from './reflection-workflow.js';
export * from './workflow-engine.js';
export * from './template-generator.js';

// Re-export singleton instances for convenience
export { markdownParser } from './markdown-parser.js';
export { learningLoopWatcher } from './file-watcher.js';
export { workflowEngine } from './workflow-engine.js';
export { templateGenerator } from './template-generator.js';

/**
 * Quick start guide:
 *
 * ```typescript
 * import { workflowEngine, templateGenerator } from './workflows/learning-loop';
 *
 * // Start the workflow engine (starts file watcher)
 * await workflowEngine.start();
 *
 * // Generate initial perception template
 * await templateGenerator.generateTemplate(
 *   'perception',
 *   'session-abc123',
 *   'SOP-001',
 *   { taskDescription: 'Add user authentication', experiences: [...], vaultNotes: [...] }
 * );
 *
 * // User fills out perception.md and sets status: completed
 * // Workflow engine automatically:
 * // 1. Detects the change
 * // 2. Parses the markdown
 * // 3. Runs perception workflow
 * // 4. Generates reasoning template
 *
 * // Process continues through all stages automatically
 * ```
 */
