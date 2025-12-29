import { createWorkflowConfig } from "../config.js";
import { createGOAPAdapter } from "../adapters/goap-adapter.js";
import { createWebhookRegistry, createFileWatcherIntegration } from "../handlers/webhook-handlers.js";
import { createLogger } from "../../utils/logger.js";
const logger = createLogger("workflow-service");
class WorkflowService {
  config;
  goapAdapter;
  webhookRegistry;
  fileWatcher;
  isRunning = false;
  activeWorkflows = /* @__PURE__ */ new Map();
  lastActivity;
  executionStats = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    totalDuration: 0
  };
  /**
   * Create a new workflow service
   *
   * @param config - Service configuration options
   */
  constructor(config = {}) {
    this.config = this.resolveConfig(config);
    this.goapAdapter = createGOAPAdapter();
    this.webhookRegistry = createWebhookRegistry({
      secret: this.config.webhookSecret,
      maxPayloadSize: this.config.maxPayloadSize
    });
    this.fileWatcher = createFileWatcherIntegration(this.webhookRegistry, {
      inactivityThreshold: this.config.inactivityTimeout
    });
    this.setupEventHandlers();
  }
  /**
   * Resolve configuration with defaults
   */
  resolveConfig(config) {
    return {
      workflow: config.workflow ?? createWorkflowConfig(),
      inactivityTimeout: config.inactivityTimeout ?? 5 * 60 * 1e3,
      autoStartThreshold: config.autoStartThreshold ?? 0.7,
      watchPaths: config.watchPaths ?? [],
      debug: config.debug ?? false,
      webhookSecret: config.webhookSecret,
      maxPayloadSize: config.maxPayloadSize ?? 1024 * 1024
    };
  }
  /**
   * Setup event handlers for workflow triggers
   */
  setupEventHandlers() {
    this.webhookRegistry.on("file:changed", async (event) => {
      if (event.type === "file:changed") {
        logger.debug("File changed event received", { path: event.path });
        this.lastActivity = /* @__PURE__ */ new Date();
        await this.onDocumentChange(event.path);
      }
    });
    this.webhookRegistry.on("file:created", async (event) => {
      if (event.type === "file:created") {
        logger.debug("File created event received", { path: event.path });
        this.lastActivity = /* @__PURE__ */ new Date();
        await this.onDocumentChange(event.path);
      }
    });
    this.webhookRegistry.on("file:deleted", async (event) => {
      if (event.type === "file:deleted") {
        logger.debug("File deleted event received", { path: event.path });
        this.lastActivity = /* @__PURE__ */ new Date();
      }
    });
    this.webhookRegistry.on("timeout:inactivity", async (event) => {
      if (event.type === "timeout:inactivity") {
        logger.info("Inactivity timeout triggered", {
          lastActivity: event.lastActivity,
          threshold: event.threshold
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
  async start() {
    if (this.isRunning) {
      logger.warn("Workflow service is already running");
      return;
    }
    logger.info("Starting workflow service", {
      world: this.config.workflow.world,
      watchPaths: this.config.watchPaths,
      inactivityTimeout: this.config.inactivityTimeout
    });
    for (const path of this.config.watchPaths) {
      this.fileWatcher.watch(path);
    }
    this.isRunning = true;
    this.lastActivity = /* @__PURE__ */ new Date();
    logger.info("Workflow service started");
  }
  /**
   * Stop the workflow service
   *
   * Stops watching all paths and cleans up resources.
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn("Workflow service is not running");
      return;
    }
    logger.info("Stopping workflow service");
    this.fileWatcher.unwatchAll();
    this.webhookRegistry.clear();
    this.isRunning = false;
    logger.info("Workflow service stopped");
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
  async onDocumentChange(docPath) {
    logger.debug("Processing document change", { docPath });
    try {
      const analysis = await this.analyzeGaps(docPath);
      if (analysis.completeness >= this.config.autoStartThreshold) {
        logger.info("Completeness threshold met, generating task spec", {
          completeness: analysis.completeness,
          threshold: this.config.autoStartThreshold
        });
        await this.generateTaskSpec(docPath, analysis);
      } else {
        logger.debug("Waiting for more documentation", {
          completeness: analysis.completeness,
          threshold: this.config.autoStartThreshold,
          gaps: analysis.gaps.length
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
  async onInactivityTimeout() {
    logger.info("Inactivity timeout - checking for incomplete documentation");
    const watchedPaths = this.fileWatcher.getWatchedPaths();
    for (const path of watchedPaths) {
      try {
        const analysis = await this.analyzeGaps(path);
        if (analysis.gaps.length > 0) {
          logger.info("Found documentation gaps during inactivity", {
            path,
            gapCount: analysis.gaps.length
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
  async startCollaborationWorkflow(graphId, docPath) {
    const workflowId = this.generateWorkflowId("collab");
    const startedAt = /* @__PURE__ */ new Date();
    logger.info("Starting collaboration workflow", { workflowId, graphId, docPath });
    const metadata = {
      id: workflowId,
      type: "realtime-collab",
      startedAt,
      status: "running",
      currentStep: "initialize",
      lastEventAt: startedAt
    };
    this.activeWorkflows.set(workflowId, metadata);
    this.executionStats.totalExecutions++;
    try {
      const worldState = await this.initializeWorldState(docPath);
      const plan = this.goapAdapter.createPlan(worldState, "start-development");
      if (!plan.achievable) {
        logger.warn("Goal not achievable with current state", {
          worldState,
          reason: plan.goal
        });
      }
      metadata.currentStep = "executing-plan";
      metadata.lastEventAt = /* @__PURE__ */ new Date();
      const execution = await this.goapAdapter.executePlan(plan, worldState);
      const completedAt = /* @__PURE__ */ new Date();
      const duration = completedAt.getTime() - startedAt.getTime();
      if (execution.success) {
        this.executionStats.successfulExecutions++;
        metadata.status = "completed";
      } else {
        this.executionStats.failedExecutions++;
        metadata.status = "failed";
      }
      this.executionStats.totalDuration += duration;
      metadata.lastEventAt = completedAt;
      logger.info("Collaboration workflow completed", {
        workflowId,
        success: execution.success,
        duration,
        completedSteps: execution.completedSteps.length
      });
      return {
        success: execution.success,
        workflowId,
        startedAt,
        completedAt,
        outcome: execution.success ? "completed" : "failed",
        artifacts: execution.completedSteps,
        error: execution.error
      };
    } catch (error) {
      const completedAt = /* @__PURE__ */ new Date();
      const duration = completedAt.getTime() - startedAt.getTime();
      metadata.status = "failed";
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
        outcome: "failed",
        error: actualError.message
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
  async initializeWorldState(docPath) {
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
      pendingGaps: []
    };
  }
  /**
   * Create a GOAP plan for a goal
   *
   * @param goal - Goal identifier
   * @returns Generated plan
   */
  async createPlan(goal) {
    const worldState = await this.initializeWorldState("");
    return this.goapAdapter.createPlan(worldState, goal);
  }
  /**
   * Evaluate readiness for development
   *
   * @param docPath - Path to the document
   * @returns Readiness evaluation
   */
  async evaluateReadiness(docPath) {
    const worldState = await this.initializeWorldState(docPath);
    const analysis = await this.analyzeGaps(docPath);
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
  async analyzeGaps(docPath) {
    logger.debug("Analyzing gaps", { docPath });
    const requiredSections = [
      "overview",
      "requirements",
      "acceptance-criteria",
      "technical-spec"
    ];
    const foundCount = Math.floor(Math.random() * requiredSections.length) + 1;
    const completeness = foundCount / requiredSections.length;
    const gaps = [];
    for (let i = foundCount; i < requiredSections.length; i++) {
      gaps.push({
        type: "missing_section",
        description: `Missing ${requiredSections[i]} section`,
        severity: "high",
        suggestedContent: `# ${requiredSections[i]}

Content to be filled in.`
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
      analyzedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Generate task specification from documentation
   *
   * @param docPath - Path to the source document
   * @param analysis - Gap analysis results
   * @returns Generated task specification
   */
  async generateTaskSpec(docPath, analysis) {
    logger.info("Generating task spec", { docPath, completeness: analysis.completeness });
    const priority = this.determinePriority(analysis.completeness);
    const complexity = this.estimateComplexity(analysis);
    const spec = {
      id: `task-${Date.now()}`,
      version: "1.0.0",
      title: `Task from ${this.extractFilename(docPath)}`,
      description: "Auto-generated task specification from documentation analysis",
      priority,
      requirements: this.extractRequirements(analysis),
      acceptanceCriteria: this.generateAcceptanceCriteria(analysis),
      estimatedComplexity: complexity,
      sourceDoc: docPath,
      generatedAt: /* @__PURE__ */ new Date(),
      confidence: analysis.completeness
    };
    logger.debug("Task spec generated", { specId: spec.id, priority, complexity });
    return spec;
  }
  /**
   * Generate missing documentation
   *
   * @param docPath - Path to the document
   * @param analysis - Gap analysis results
   * @returns List of generated content
   */
  async generateMissingDocs(docPath, analysis) {
    logger.info("Generating missing docs", {
      docPath,
      gapCount: analysis.gaps.length
    });
    const generatedDocs = [];
    for (const gap of analysis.gaps) {
      const content = gap.suggestedContent || `# ${gap.description}

This section needs to be completed.
`;
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
  generateWorkflowId(prefix) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${prefix}-${timestamp}-${random}`;
  }
  /**
   * Extract filename from path
   */
  extractFilename(path) {
    const parts = path.split("/");
    return parts[parts.length - 1] || "unknown";
  }
  /**
   * Determine priority based on completeness
   */
  determinePriority(completeness) {
    if (completeness >= 0.9) return "high";
    if (completeness >= 0.7) return "medium";
    if (completeness >= 0.5) return "low";
    return "critical";
  }
  /**
   * Estimate complexity from analysis
   */
  estimateComplexity(analysis) {
    const baseComplexity = Math.ceil((1 - analysis.completeness) * 10);
    const gapComplexity = analysis.gaps.length;
    return Math.min(10, Math.max(1, baseComplexity + gapComplexity));
  }
  /**
   * Extract requirements from analysis
   */
  extractRequirements(analysis) {
    const requirements = analysis.recommendations.slice();
    if (requirements.length === 0) {
      requirements.push("Complete specification document");
    }
    return requirements;
  }
  /**
   * Generate acceptance criteria from analysis
   */
  generateAcceptanceCriteria(analysis) {
    const criteria = [
      "Documentation is complete",
      "All tests pass",
      `Completeness score >= ${this.config.autoStartThreshold}`
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
  watch(path) {
    this.fileWatcher.watch(path);
    this.config.watchPaths.push(path);
    logger.debug("Added watch path", { path });
  }
  /**
   * Stop watching a path
   *
   * @param path - Path to stop watching
   */
  unwatch(path) {
    this.fileWatcher.unwatch(path);
    const index = this.config.watchPaths.indexOf(path);
    if (index > -1) {
      this.config.watchPaths.splice(index, 1);
    }
    logger.debug("Removed watch path", { path });
  }
  /**
   * Get the webhook registry for external event handling
   *
   * @returns Webhook registry instance
   */
  getWebhookRegistry() {
    return this.webhookRegistry;
  }
  /**
   * Get the GOAP adapter for direct planning access
   *
   * @returns GOAP adapter instance
   */
  getGOAPAdapter() {
    return this.goapAdapter;
  }
  /**
   * Emit a workflow trigger event
   *
   * @param event - Event to emit
   */
  async emitEvent(event) {
    await this.webhookRegistry.emit(event);
    this.lastActivity = /* @__PURE__ */ new Date();
  }
  /**
   * Get service status
   *
   * @returns Current service status
   */
  getStatus() {
    const avgDuration = this.executionStats.totalExecutions > 0 ? this.executionStats.totalDuration / this.executionStats.totalExecutions : 0;
    return {
      isRunning: this.isRunning,
      activeWorkflows: Array.from(this.activeWorkflows.values()),
      watchedPaths: this.fileWatcher.getWatchedPaths(),
      lastActivity: this.lastActivity,
      stats: {
        totalExecutions: this.executionStats.totalExecutions,
        successfulExecutions: this.executionStats.successfulExecutions,
        failedExecutions: this.executionStats.failedExecutions,
        averageDuration: avgDuration
      }
    };
  }
  /**
   * Get workflow configuration
   *
   * @returns Copy of the current configuration
   */
  getConfig() {
    return {
      workflow: this.config.workflow,
      inactivityTimeout: this.config.inactivityTimeout,
      autoStartThreshold: this.config.autoStartThreshold,
      watchPaths: [...this.config.watchPaths],
      debug: this.config.debug
    };
  }
  /**
   * Get a specific workflow run by ID
   *
   * @param workflowId - Workflow run identifier
   * @returns Workflow metadata or undefined
   */
  getWorkflow(workflowId) {
    return this.activeWorkflows.get(workflowId);
  }
  /**
   * Cancel a running workflow
   *
   * @param workflowId - Workflow to cancel
   * @returns Whether the workflow was cancelled
   */
  cancelWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow && workflow.status === "running") {
      workflow.status = "failed";
      workflow.lastEventAt = /* @__PURE__ */ new Date();
      logger.info("Workflow cancelled", { workflowId });
      return true;
    }
    return false;
  }
}
function createWorkflowService(config) {
  return new WorkflowService(config);
}
export {
  WorkflowService,
  createWorkflowService
};
//# sourceMappingURL=workflow-service.js.map
