/**
 * Workflow Service
 *
 * Main service that orchestrates workflow execution with
 * Workflow DevKit, GOAP planning, and webhook handling.
 *
 * This service provides a unified interface for:
 * - Starting and managing workflows
 * - GOAP-based planning for task generation
 * - File watching and webhook handling
 * - Status monitoring and metrics
 *
 * @module workflow/services/workflow-service
 *
 * @example
 * ```typescript
 * import { createWorkflowService } from './workflow-service.js';
 *
 * const service = createWorkflowService({
 *   inactivityTimeout: 5 * 60 * 1000,
 *   autoStartThreshold: 0.7,
 *   watchPaths: ['./docs'],
 * });
 *
 * await service.start();
 *
 * // Start a collaboration workflow
 * const result = await service.startCollaborationWorkflow(
 *   'graph-123',
 *   './docs/spec.md'
 * );
 *
 * // Get service status
 * const status = service.getStatus();
 * console.log(`Active workflows: ${status.activeWorkflows.length}`);
 *
 * await service.stop();
 * ```
 */
import { type WorkflowConfig } from '../config.js';
import type { GOAPPlan, TaskSpec, GapAnalysis, WorkflowRunMetadata, ReadinessEvaluation } from '../types.js';
import { GOAPAdapter } from '../adapters/goap-adapter.js';
import { type WebhookRegistry, type WorkflowTriggerEvent } from '../handlers/webhook-handlers.js';
/**
 * Workflow service configuration options
 */
export interface WorkflowServiceConfig {
    /** Workflow DevKit configuration */
    workflow?: WorkflowConfig;
    /** Inactivity timeout in ms (default: 5 minutes) */
    inactivityTimeout?: number;
    /** Auto-start development threshold (default: 0.7) */
    autoStartThreshold?: number;
    /** Paths to watch for changes */
    watchPaths?: string[];
    /** Enable debug logging */
    debug?: boolean;
    /** Webhook secret for validation */
    webhookSecret?: string;
    /** Maximum payload size for webhooks */
    maxPayloadSize?: number;
}
/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
    /** Whether workflow completed successfully */
    success: boolean;
    /** Unique workflow run identifier */
    workflowId: string;
    /** When the workflow started */
    startedAt: Date;
    /** When the workflow completed (if finished) */
    completedAt?: Date;
    /** Outcome of the workflow */
    outcome?: 'completed' | 'failed' | 'timeout' | 'cancelled';
    /** Artifacts produced by the workflow */
    artifacts?: string[];
    /** Error message if failed */
    error?: string;
}
/**
 * Service status information
 */
export interface WorkflowServiceStatus {
    /** Whether the service is currently running */
    isRunning: boolean;
    /** List of active workflow runs */
    activeWorkflows: WorkflowRunMetadata[];
    /** Paths being watched for changes */
    watchedPaths: string[];
    /** Timestamp of last activity */
    lastActivity?: Date;
    /** Execution statistics */
    stats: WorkflowExecutionStats;
}
/**
 * Execution statistics
 */
export interface WorkflowExecutionStats {
    /** Total number of workflow executions */
    totalExecutions: number;
    /** Number of successful executions */
    successfulExecutions: number;
    /** Number of failed executions */
    failedExecutions: number;
    /** Average execution duration in ms */
    averageDuration: number;
}
/**
 * Workflow Service
 *
 * Orchestrates the entire workflow system including:
 * - GOAP planning for intelligent task generation
 * - File watching for automatic workflow triggers
 * - Webhook handling for external integrations
 * - Execution tracking and metrics collection
 */
export declare class WorkflowService {
    private config;
    private goapAdapter;
    private webhookRegistry;
    private fileWatcher;
    private isRunning;
    private activeWorkflows;
    private lastActivity?;
    private executionStats;
    /**
     * Create a new workflow service
     *
     * @param config - Service configuration options
     */
    constructor(config?: WorkflowServiceConfig);
    /**
     * Resolve configuration with defaults
     */
    private resolveConfig;
    /**
     * Setup event handlers for workflow triggers
     */
    private setupEventHandlers;
    /**
     * Start the workflow service
     *
     * Begins watching configured paths and processing events.
     */
    start(): Promise<void>;
    /**
     * Stop the workflow service
     *
     * Stops watching all paths and cleans up resources.
     */
    stop(): Promise<void>;
    /**
     * Handle document change event
     *
     * Analyzes the changed document for gaps and potentially
     * starts development if completeness threshold is met.
     */
    private onDocumentChange;
    /**
     * Handle inactivity timeout
     *
     * Checks for incomplete documentation and generates
     * missing content when idle.
     */
    private onInactivityTimeout;
    /**
     * Start a collaboration workflow for a graph/document
     *
     * @param graphId - Knowledge graph identifier
     * @param docPath - Path to the document
     * @returns Workflow execution result
     */
    startCollaborationWorkflow(graphId: string, docPath: string): Promise<WorkflowExecutionResult>;
    /**
     * Initialize world state from a document
     *
     * @param docPath - Path to the document
     * @returns Initial world state for planning
     */
    private initializeWorldState;
    /**
     * Create a GOAP plan for a goal
     *
     * @param goal - Goal identifier
     * @returns Generated plan
     */
    createPlan(goal: string): Promise<GOAPPlan>;
    /**
     * Evaluate readiness for development
     *
     * @param docPath - Path to the document
     * @returns Readiness evaluation
     */
    evaluateReadiness(docPath: string): Promise<ReadinessEvaluation>;
    /**
     * Analyze document for gaps
     *
     * @param docPath - Path to analyze
     * @returns Gap analysis result
     */
    analyzeGaps(docPath: string): Promise<GapAnalysis>;
    /**
     * Generate task specification from documentation
     *
     * @param docPath - Path to the source document
     * @param analysis - Gap analysis results
     * @returns Generated task specification
     */
    generateTaskSpec(docPath: string, analysis: GapAnalysis): Promise<TaskSpec>;
    /**
     * Generate missing documentation
     *
     * @param docPath - Path to the document
     * @param analysis - Gap analysis results
     * @returns List of generated content
     */
    generateMissingDocs(docPath: string, analysis: GapAnalysis): Promise<string[]>;
    /**
     * Generate a unique workflow ID
     */
    private generateWorkflowId;
    /**
     * Extract filename from path
     */
    private extractFilename;
    /**
     * Determine priority based on completeness
     */
    private determinePriority;
    /**
     * Estimate complexity from analysis
     */
    private estimateComplexity;
    /**
     * Extract requirements from analysis
     */
    private extractRequirements;
    /**
     * Generate acceptance criteria from analysis
     */
    private generateAcceptanceCriteria;
    /**
     * Add a path to watch
     *
     * @param path - Path to watch for changes
     */
    watch(path: string): void;
    /**
     * Stop watching a path
     *
     * @param path - Path to stop watching
     */
    unwatch(path: string): void;
    /**
     * Get the webhook registry for external event handling
     *
     * @returns Webhook registry instance
     */
    getWebhookRegistry(): WebhookRegistry;
    /**
     * Get the GOAP adapter for direct planning access
     *
     * @returns GOAP adapter instance
     */
    getGOAPAdapter(): GOAPAdapter;
    /**
     * Emit a workflow trigger event
     *
     * @param event - Event to emit
     */
    emitEvent(event: WorkflowTriggerEvent): Promise<void>;
    /**
     * Get service status
     *
     * @returns Current service status
     */
    getStatus(): WorkflowServiceStatus;
    /**
     * Get workflow configuration
     *
     * @returns Copy of the current configuration
     */
    getConfig(): WorkflowServiceConfig;
    /**
     * Get a specific workflow run by ID
     *
     * @param workflowId - Workflow run identifier
     * @returns Workflow metadata or undefined
     */
    getWorkflow(workflowId: string): WorkflowRunMetadata | undefined;
    /**
     * Cancel a running workflow
     *
     * @param workflowId - Workflow to cancel
     * @returns Whether the workflow was cancelled
     */
    cancelWorkflow(workflowId: string): boolean;
}
/**
 * Create a workflow service instance
 *
 * @param config - Service configuration options
 * @returns Configured workflow service
 *
 * @example
 * ```typescript
 * const service = createWorkflowService({
 *   watchPaths: ['./docs', './specs'],
 *   autoStartThreshold: 0.8,
 * });
 *
 * await service.start();
 * ```
 */
export declare function createWorkflowService(config?: WorkflowServiceConfig): WorkflowService;
//# sourceMappingURL=workflow-service.d.ts.map