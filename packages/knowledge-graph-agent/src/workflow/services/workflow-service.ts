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

import { createWorkflowConfig, type WorkflowConfig } from '../config.js';
import type {
  WorldState,
  GOAPPlan,
  TaskSpec,
  GapAnalysis,
  DocumentGap,
  WorkflowRunMetadata,
  ReadinessEvaluation,
} from '../types.js';
import { GOAPAdapter, createGOAPAdapter } from '../adapters/goap-adapter.js';
import {
  createWebhookRegistry,
  createFileWatcherIntegration,
  type WebhookRegistry,
  type FileWatcherIntegration,
  type WorkflowTriggerEvent,
} from '../handlers/webhook-handlers.js';
import { createLogger } from '../../utils/index.js';

const logger = createLogger('workflow-service');

// ============================================================================
// Configuration Types
// ============================================================================

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
 * Resolved configuration with defaults applied
 */
interface ResolvedConfig {
  workflow: WorkflowConfig;
  inactivityTimeout: number;
  autoStartThreshold: number;
  watchPaths: string[];
  debug: boolean;
  webhookSecret?: string;
  maxPayloadSize: number;
}

// ============================================================================
// Result Types
// ============================================================================

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

// ============================================================================
// Workflow Service Class
// ============================================================================

/**
 * Workflow Service
 *
 * Orchestrates the entire workflow system including:
 * - GOAP planning for intelligent task generation
 * - File watching for automatic workflow triggers
 * - Webhook handling for external integrations
 * - Execution tracking and metrics collection
 */
export class WorkflowService {
  private config: ResolvedConfig;
  private goapAdapter: GOAPAdapter;
  private webhookRegistry: WebhookRegistry;
  private fileWatcher: FileWatcherIntegration;

  private isRunning = false;
  private activeWorkflows: Map<string, WorkflowRunMetadata> = new Map();
  private lastActivity?: Date;
  private executionStats = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    totalDuration: 0,
  };

  /**
   * Create a new workflow service
   *
   * @param config - Service configuration options
   */
  constructor(config: WorkflowServiceConfig = {}) {
    this.config = this.resolveConfig(config);
    this.goapAdapter = createGOAPAdapter();
    this.webhookRegistry = createWebhookRegistry({
      secret: this.config.webhookSecret,
      maxPayloadSize: this.config.maxPayloadSize,
    });
    this.fileWatcher = createFileWatcherIntegration(this.webhookRegistry, {
      inactivityThreshold: this.config.inactivityTimeout,
    });

    this.setupEventHandlers();
  }

  /**
   * Resolve configuration with defaults
   */
  private resolveConfig(config: WorkflowServiceConfig): ResolvedConfig {
    return {
      workflow: config.workflow ?? createWorkflowConfig(),
      inactivityTimeout: config.inactivityTimeout ?? 5 * 60 * 1000,
      autoStartThreshold: config.autoStartThreshold ?? 0.7,
      watchPaths: config.watchPaths ?? [],
      debug: config.debug ?? false,
      webhookSecret: config.webhookSecret,
      maxPayloadSize: config.maxPayloadSize ?? 1024 * 1024,
    };
  }

  /**
   * Setup event handlers for workflow triggers
   */
  private setupEventHandlers(): void {
    // Handle file changes
    this.webhookRegistry.on('file:changed', async (event) => {
      if (event.type === 'file:changed') {
        logger.debug('File changed event received', { path: event.path });
        this.lastActivity = new Date();
        await this.onDocumentChange(event.path);
      }
    });

    // Handle file creation
    this.webhookRegistry.on('file:created', async (event) => {
      if (event.type === 'file:created') {
        logger.debug('File created event received', { path: event.path });
        this.lastActivity = new Date();
        await this.onDocumentChange(event.path);
      }
    });

    // Handle file deletion
    this.webhookRegistry.on('file:deleted', async (event) => {
      if (event.type === 'file:deleted') {
        logger.debug('File deleted event received', { path: event.path });
        this.lastActivity = new Date();
      }
    });

    // Handle inactivity timeout
    this.webhookRegistry.on('timeout:inactivity', async (event) => {
      if (event.type === 'timeout:inactivity') {
        logger.info('Inactivity timeout triggered', {
          lastActivity: event.lastActivity,
          threshold: event.threshold,
        });
        await this.onInactivityTimeout();
      }
    });
  }

  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================

  /**
   * Start the workflow service
   *
   * Begins watching configured paths and processing events.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Workflow service is already running');
      return;
    }

    logger.info('Starting workflow service', {
      world: this.config.workflow.world,
      watchPaths: this.config.watchPaths,
      inactivityTimeout: this.config.inactivityTimeout,
    });

    // Start watching configured paths
    for (const path of this.config.watchPaths) {
      this.fileWatcher.watch(path);
    }

    this.isRunning = true;
    this.lastActivity = new Date();
    logger.info('Workflow service started');
  }

  /**
   * Stop the workflow service
   *
   * Stops watching all paths and cleans up resources.
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Workflow service is not running');
      return;
    }

    logger.info('Stopping workflow service');

    // Stop watching all paths
    this.fileWatcher.unwatchAll();

    // Clear all webhook handlers
    this.webhookRegistry.clear();

    this.isRunning = false;
    logger.info('Workflow service stopped');
  }

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * Handle document change event
   *
   * Analyzes the changed document for gaps and potentially
   * starts development if completeness threshold is met.
   */
  private async onDocumentChange(docPath: string): Promise<void> {
    logger.debug('Processing document change', { docPath });

    try {
      // Analyze gaps
      const analysis = await this.analyzeGaps(docPath);

      if (analysis.completeness >= this.config.autoStartThreshold) {
        // Generate task spec if completeness threshold met
        logger.info('Completeness threshold met, generating task spec', {
          completeness: analysis.completeness,
          threshold: this.config.autoStartThreshold,
        });

        await this.generateTaskSpec(docPath, analysis);
      } else {
        logger.debug('Waiting for more documentation', {
          completeness: analysis.completeness,
          threshold: this.config.autoStartThreshold,
          gaps: analysis.gaps.length,
        });
      }
    } catch (err) {
      const actualError = err instanceof Error ? err : new Error(String(err));
      logger.error(`Failed to process document change: ${docPath}`, actualError);
    }
  }

  /**
   * Handle inactivity timeout
   *
   * Checks for incomplete documentation and generates
   * missing content when idle.
   */
  private async onInactivityTimeout(): Promise<void> {
    logger.info('Inactivity timeout - checking for incomplete documentation');

    // Get all watched paths and check for gaps
    const watchedPaths = this.fileWatcher.getWatchedPaths();

    for (const path of watchedPaths) {
      try {
        const analysis = await this.analyzeGaps(path);

        if (analysis.gaps.length > 0) {
          logger.info('Found documentation gaps during inactivity', {
            path,
            gapCount: analysis.gaps.length,
          });

          await this.generateMissingDocs(path, analysis);
        }
      } catch (err) {
        const actualError = err instanceof Error ? err : new Error(String(err));
        logger.error(`Failed to analyze path during inactivity: ${path}`, actualError);
      }
    }
  }

  // ==========================================================================
  // Workflow Execution
  // ==========================================================================

  /**
   * Start a collaboration workflow for a graph/document
   *
   * @param graphId - Knowledge graph identifier
   * @param docPath - Path to the document
   * @returns Workflow execution result
   */
  async startCollaborationWorkflow(
    graphId: string,
    docPath: string
  ): Promise<WorkflowExecutionResult> {
    const workflowId = this.generateWorkflowId('collab');
    const startedAt = new Date();

    logger.info('Starting collaboration workflow', { workflowId, graphId, docPath });

    const metadata: WorkflowRunMetadata = {
      id: workflowId,
      type: 'realtime-collab',
      startedAt,
      status: 'running',
      currentStep: 'initialize',
      lastEventAt: startedAt,
    };

    this.activeWorkflows.set(workflowId, metadata);
    this.executionStats.totalExecutions++;

    try {
      // Initialize world state from document
      const worldState = await this.initializeWorldState(docPath);

      // Create GOAP plan
      const plan = this.goapAdapter.createPlan(worldState, 'start-development');

      if (!plan.achievable) {
        logger.warn('Goal not achievable with current state', {
          worldState,
          reason: plan.goal,
        });
      }

      // Update metadata
      metadata.currentStep = 'executing-plan';
      metadata.lastEventAt = new Date();

      // Execute plan
      const execution = await this.goapAdapter.executePlan(plan, worldState);

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      // Update stats
      if (execution.success) {
        this.executionStats.successfulExecutions++;
        metadata.status = 'completed';
      } else {
        this.executionStats.failedExecutions++;
        metadata.status = 'failed';
      }
      this.executionStats.totalDuration += duration;
      metadata.lastEventAt = completedAt;

      logger.info('Collaboration workflow completed', {
        workflowId,
        success: execution.success,
        duration,
        completedSteps: execution.completedSteps.length,
      });

      return {
        success: execution.success,
        workflowId,
        startedAt,
        completedAt,
        outcome: execution.success ? 'completed' : 'failed',
        artifacts: execution.completedSteps,
        error: execution.error,
      };
    } catch (error) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      metadata.status = 'failed';
      metadata.lastEventAt = completedAt;
      this.executionStats.failedExecutions++;
      this.executionStats.totalDuration += duration;

      const actualError = error instanceof Error ? error : new Error(String(error));
      logger.error(`Workflow execution failed: ${workflowId}`, actualError);

      return {
        success: false,
        workflowId,
        startedAt,
        completedAt,
        outcome: 'failed',
        error: actualError.message,
      };
    }
  }

  // ==========================================================================
  // World State & Planning
  // ==========================================================================

  /**
   * Initialize world state from a document
   *
   * @param docPath - Path to the document
   * @returns Initial world state for planning
   */
  private async initializeWorldState(docPath: string): Promise<WorldState> {
    // TODO: Integrate with actual document analysis
    // For now, return a basic initial state
    return {
      hasSpecification: true,
      specCompleteness: 0,
      hasAcceptanceCriteria: false,
      taskDefined: false,
      blockersFree: true,
      developmentStarted: false,
      timeSinceLastChange: 0,
      lastChangeTimestamp: Date.now(),
      activeCollaborators: [],
      pendingGaps: [],
    };
  }

  /**
   * Create a GOAP plan for a goal
   *
   * @param goal - Goal identifier
   * @returns Generated plan
   */
  async createPlan(goal: string): Promise<GOAPPlan> {
    const worldState = await this.initializeWorldState('');
    return this.goapAdapter.createPlan(worldState, goal);
  }

  /**
   * Evaluate readiness for development
   *
   * @param docPath - Path to the document
   * @returns Readiness evaluation
   */
  async evaluateReadiness(docPath: string): Promise<ReadinessEvaluation> {
    const worldState = await this.initializeWorldState(docPath);
    const analysis = await this.analyzeGaps(docPath);

    // Update world state with analysis results
    worldState.specCompleteness = analysis.completeness;
    worldState.hasAcceptanceCriteria = analysis.completeness >= 0.5;
    worldState.pendingGaps = analysis.gaps.map((g) => g.description);

    return this.goapAdapter.evaluateReadiness(worldState);
  }

  // ==========================================================================
  // Gap Analysis & Documentation
  // ==========================================================================

  /**
   * Analyze document for gaps
   *
   * @param docPath - Path to analyze
   * @returns Gap analysis result
   */
  async analyzeGaps(docPath: string): Promise<GapAnalysis> {
    logger.debug('Analyzing gaps', { docPath });

    // Required sections for a complete specification
    const requiredSections = [
      'overview',
      'requirements',
      'acceptance-criteria',
      'technical-spec',
    ];

    // TODO: Integrate with actual document analysis
    // For now, simulate finding some sections
    const foundCount = Math.floor(Math.random() * requiredSections.length) + 1;
    const completeness = foundCount / requiredSections.length;

    const gaps: DocumentGap[] = [];
    for (let i = foundCount; i < requiredSections.length; i++) {
      gaps.push({
        type: 'missing_section',
        description: `Missing ${requiredSections[i]} section`,
        severity: 'high',
        suggestedContent: `# ${requiredSections[i]}\n\nContent to be filled in.`,
      });
    }

    const recommendations = gaps.map(
      (g) => `Add ${g.description.toLowerCase()}`
    );

    return {
      docPath,
      completeness,
      gaps,
      recommendations,
      analyzedAt: new Date(),
    };
  }

  /**
   * Generate task specification from documentation
   *
   * @param docPath - Path to the source document
   * @param analysis - Gap analysis results
   * @returns Generated task specification
   */
  async generateTaskSpec(docPath: string, analysis: GapAnalysis): Promise<TaskSpec> {
    logger.info('Generating task spec', { docPath, completeness: analysis.completeness });

    const priority = this.determinePriority(analysis.completeness);
    const complexity = this.estimateComplexity(analysis);

    const spec: TaskSpec = {
      id: `task-${Date.now()}`,
      version: '1.0.0',
      title: `Task from ${this.extractFilename(docPath)}`,
      description: 'Auto-generated task specification from documentation analysis',
      priority,
      requirements: this.extractRequirements(analysis),
      acceptanceCriteria: this.generateAcceptanceCriteria(analysis),
      estimatedComplexity: complexity,
      sourceDoc: docPath,
      generatedAt: new Date(),
      confidence: analysis.completeness,
    };

    logger.debug('Task spec generated', { specId: spec.id, priority, complexity });
    return spec;
  }

  /**
   * Generate missing documentation
   *
   * @param docPath - Path to the document
   * @param analysis - Gap analysis results
   * @returns List of generated content
   */
  async generateMissingDocs(docPath: string, analysis: GapAnalysis): Promise<string[]> {
    logger.info('Generating missing docs', {
      docPath,
      gapCount: analysis.gaps.length,
    });

    const generatedDocs: string[] = [];

    for (const gap of analysis.gaps) {
      const content =
        gap.suggestedContent ||
        `# ${gap.description}\n\nThis section needs to be completed.\n`;
      generatedDocs.push(content);
    }

    return generatedDocs;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Generate a unique workflow ID
   */
  private generateWorkflowId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Extract filename from path
   */
  private extractFilename(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Determine priority based on completeness
   */
  private determinePriority(
    completeness: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (completeness >= 0.9) return 'high';
    if (completeness >= 0.7) return 'medium';
    if (completeness >= 0.5) return 'low';
    return 'critical'; // Needs more work before starting
  }

  /**
   * Estimate complexity from analysis
   */
  private estimateComplexity(analysis: GapAnalysis): number {
    // Base complexity on inverse of completeness
    const baseComplexity = Math.ceil((1 - analysis.completeness) * 10);
    // Add complexity for each gap
    const gapComplexity = analysis.gaps.length;
    return Math.min(10, Math.max(1, baseComplexity + gapComplexity));
  }

  /**
   * Extract requirements from analysis
   */
  private extractRequirements(analysis: GapAnalysis): string[] {
    const requirements = analysis.recommendations.slice();
    if (requirements.length === 0) {
      requirements.push('Complete specification document');
    }
    return requirements;
  }

  /**
   * Generate acceptance criteria from analysis
   */
  private generateAcceptanceCriteria(analysis: GapAnalysis): string[] {
    const criteria = [
      'Documentation is complete',
      'All tests pass',
      `Completeness score >= ${this.config.autoStartThreshold}`,
    ];

    if (analysis.gaps.length > 0) {
      criteria.push(`All ${analysis.gaps.length} gaps are addressed`);
    }

    return criteria;
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Add a path to watch
   *
   * @param path - Path to watch for changes
   */
  watch(path: string): void {
    this.fileWatcher.watch(path);
    this.config.watchPaths.push(path);
    logger.debug('Added watch path', { path });
  }

  /**
   * Stop watching a path
   *
   * @param path - Path to stop watching
   */
  unwatch(path: string): void {
    this.fileWatcher.unwatch(path);
    const index = this.config.watchPaths.indexOf(path);
    if (index > -1) {
      this.config.watchPaths.splice(index, 1);
    }
    logger.debug('Removed watch path', { path });
  }

  /**
   * Get the webhook registry for external event handling
   *
   * @returns Webhook registry instance
   */
  getWebhookRegistry(): WebhookRegistry {
    return this.webhookRegistry;
  }

  /**
   * Get the GOAP adapter for direct planning access
   *
   * @returns GOAP adapter instance
   */
  getGOAPAdapter(): GOAPAdapter {
    return this.goapAdapter;
  }

  /**
   * Emit a workflow trigger event
   *
   * @param event - Event to emit
   */
  async emitEvent(event: WorkflowTriggerEvent): Promise<void> {
    await this.webhookRegistry.emit(event);
    this.lastActivity = new Date();
  }

  /**
   * Get service status
   *
   * @returns Current service status
   */
  getStatus(): WorkflowServiceStatus {
    const avgDuration =
      this.executionStats.totalExecutions > 0
        ? this.executionStats.totalDuration / this.executionStats.totalExecutions
        : 0;

    return {
      isRunning: this.isRunning,
      activeWorkflows: Array.from(this.activeWorkflows.values()),
      watchedPaths: this.fileWatcher.getWatchedPaths(),
      lastActivity: this.lastActivity,
      stats: {
        totalExecutions: this.executionStats.totalExecutions,
        successfulExecutions: this.executionStats.successfulExecutions,
        failedExecutions: this.executionStats.failedExecutions,
        averageDuration: avgDuration,
      },
    };
  }

  /**
   * Get workflow configuration
   *
   * @returns Copy of the current configuration
   */
  getConfig(): WorkflowServiceConfig {
    return {
      workflow: this.config.workflow,
      inactivityTimeout: this.config.inactivityTimeout,
      autoStartThreshold: this.config.autoStartThreshold,
      watchPaths: [...this.config.watchPaths],
      debug: this.config.debug,
    };
  }

  /**
   * Get a specific workflow run by ID
   *
   * @param workflowId - Workflow run identifier
   * @returns Workflow metadata or undefined
   */
  getWorkflow(workflowId: string): WorkflowRunMetadata | undefined {
    return this.activeWorkflows.get(workflowId);
  }

  /**
   * Cancel a running workflow
   *
   * @param workflowId - Workflow to cancel
   * @returns Whether the workflow was cancelled
   */
  cancelWorkflow(workflowId: string): boolean {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow && workflow.status === 'running') {
      workflow.status = 'failed';
      workflow.lastEventAt = new Date();
      logger.info('Workflow cancelled', { workflowId });
      return true;
    }
    return false;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

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
export function createWorkflowService(config?: WorkflowServiceConfig): WorkflowService {
  return new WorkflowService(config);
}
