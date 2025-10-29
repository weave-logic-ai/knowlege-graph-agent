/**
 * Knowledge Graph Workflows
 *
 * Barrel export for the complete knowledge graph workflow system.
 * Includes context analysis, git integration, and workflow integration.
 */

// Workflow integration
export { WorkflowIntegration } from './workflow-integration.js';
export type {
  WorkflowExecutionOptions,
  WorkflowExecutionResult,
} from './workflow-integration.js';

// Document connection workflow
export { createDocumentConnectionWorkflow } from './document-connection.js';

// Workflow registration
export {
  registerKnowledgeGraphWorkflows,
  unregisterKnowledgeGraphWorkflows,
  getKnowledgeGraphWorkflowIds,
} from './register-workflows.js';

// Context analysis (re-export from context/index.ts)
export type { DocumentContext, DirectoryContext, TemporalContext, Primitives } from './context/index.js';
export {
  buildDocumentContext,
  calculateContextSimilarity,
  getContextSummary,
  filterBySimilarity,
  analyzeDirectoryContext,
  analyzeTemporalContext,
  extractPrimitives,
} from './context/index.js';

// Git integration (re-export from git/index.ts)
export { GitIntegration, WorkflowBranchManager, SafeCommit, WorkflowRollback } from './git/index.js';
export type { CommitOptions } from './git/index.js';
