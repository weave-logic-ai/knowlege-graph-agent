/**
 * Workflow Types for Knowledge Graph Agent
 *
 * Type definitions for GOAP (Goal-Oriented Action Planning) workflows,
 * event handling, and task management.
 *
 * @module workflow/types
 */
/**
 * World state representing the current situation for GOAP planning
 *
 * The planner uses this state to determine which actions are applicable
 * and to track progress toward goals.
 *
 * @example
 * ```typescript
 * const currentState: WorldState = {
 *   hasSpecification: true,
 *   specCompleteness: 0.8,
 *   hasAcceptanceCriteria: true,
 *   taskDefined: true,
 *   blockersFree: true,
 *   developmentStarted: false,
 *   timeSinceLastChange: 3600000, // 1 hour
 *   lastChangeTimestamp: Date.now() - 3600000,
 *   activeCollaborators: ['user-1', 'user-2'],
 *   pendingGaps: ['missing-auth-spec'],
 * };
 * ```
 */
export interface WorldState {
    /** Whether a specification document exists */
    hasSpecification: boolean;
    /** Completeness percentage of the specification (0-1) */
    specCompleteness: number;
    /** Whether acceptance criteria have been defined */
    hasAcceptanceCriteria: boolean;
    /** Whether the task has been formally defined */
    taskDefined: boolean;
    /** Whether all blockers have been resolved */
    blockersFree: boolean;
    /** Whether development work has started */
    developmentStarted: boolean;
    /** Time in milliseconds since the last document change */
    timeSinceLastChange: number;
    /** Timestamp of the last document change */
    lastChangeTimestamp: number;
    /** List of currently active collaborator IDs */
    activeCollaborators: string[];
    /** List of pending documentation gap IDs */
    pendingGaps: string[];
    /** Index signature for dynamic access to state properties */
    [key: string]: boolean | number | string[] | undefined;
}
/**
 * Event emitted when a knowledge graph node is updated
 *
 * @example
 * ```typescript
 * const event: NodeUpdateEvent = {
 *   nodeId: 'node-123',
 *   userId: 'user-456',
 *   changes: { status: 'in-progress', priority: 'high' },
 *   timestamp: Date.now(),
 * };
 * ```
 */
export interface NodeUpdateEvent {
    /** ID of the updated node */
    nodeId: string;
    /** ID of the user who made the update */
    userId: string;
    /** Map of changed fields and their new values */
    changes: Record<string, unknown>;
    /** Timestamp when the update occurred */
    timestamp: number;
}
/**
 * Event emitted when documentation gaps are detected
 *
 * @example
 * ```typescript
 * const event: GapDetectedEvent = {
 *   docPath: 'docs/api/authentication.md',
 *   gaps: ['missing-error-codes', 'incomplete-examples'],
 *   confidence: 0.92,
 *   detectedAt: Date.now(),
 * };
 * ```
 */
export interface GapDetectedEvent {
    /** Path to the document with detected gaps */
    docPath: string;
    /** List of identified gap types */
    gaps: string[];
    /** Confidence score of the gap detection (0-1) */
    confidence: number;
    /** Timestamp when gaps were detected */
    detectedAt: number;
}
/**
 * Event emitted when a workflow completes
 *
 * @example
 * ```typescript
 * const event: WorkflowCompleteEvent = {
 *   workflowId: 'wf-789',
 *   outcome: 'success',
 *   duration: 45000, // 45 seconds
 *   artifacts: ['docs/spec.md', 'docs/tasks/task-001.md'],
 * };
 * ```
 */
export interface WorkflowCompleteEvent {
    /** ID of the completed workflow */
    workflowId: string;
    /** Outcome of the workflow execution */
    outcome: 'success' | 'failure' | 'timeout';
    /** Total duration in milliseconds */
    duration: number;
    /** List of artifact paths produced by the workflow */
    artifacts: string[];
}
/**
 * Metadata for a running or completed workflow
 *
 * @example
 * ```typescript
 * const metadata: WorkflowRunMetadata = {
 *   id: 'run-abc-123',
 *   type: 'spec-generation',
 *   startedAt: new Date(),
 *   status: 'running',
 *   currentStep: 'analyze-requirements',
 *   lastEventAt: new Date(),
 * };
 * ```
 */
export interface WorkflowRunMetadata {
    /** Unique run identifier */
    id: string;
    /** Type of workflow being executed */
    type: string;
    /** Timestamp when the workflow started */
    startedAt: Date;
    /** Current status of the workflow */
    status: 'running' | 'completed' | 'failed' | 'suspended';
    /** ID of the currently executing step */
    currentStep?: string;
    /** Timestamp of the last event in this workflow */
    lastEventAt?: Date;
}
/**
 * Generated task specification from documentation analysis
 *
 * @example
 * ```typescript
 * const spec: TaskSpec = {
 *   id: 'task-001',
 *   version: '1.0.0',
 *   title: 'Implement User Authentication',
 *   description: 'Add JWT-based authentication to the API',
 *   priority: 'high',
 *   requirements: [
 *     'Support email/password login',
 *     'Implement token refresh',
 *   ],
 *   acceptanceCriteria: [
 *     'User can login with valid credentials',
 *     'Invalid credentials return 401',
 *   ],
 *   estimatedComplexity: 7,
 *   sourceDoc: 'docs/features/auth.md',
 *   generatedAt: new Date(),
 *   confidence: 0.88,
 * };
 * ```
 */
export interface TaskSpec {
    /** Unique task identifier */
    id: string;
    /** Semantic version of the task specification */
    version: string;
    /** Human-readable task title */
    title: string;
    /** Detailed description of the task */
    description: string;
    /** Task priority level */
    priority: 'low' | 'medium' | 'high' | 'critical';
    /** List of functional requirements */
    requirements: string[];
    /** List of acceptance criteria for completion */
    acceptanceCriteria: string[];
    /** Estimated complexity score (1-10) */
    estimatedComplexity: number;
    /** Path to the source document */
    sourceDoc: string;
    /** Timestamp when the spec was generated */
    generatedAt: Date;
    /** Confidence score of the extraction (0-1) */
    confidence: number;
}
/**
 * Individual gap identified in documentation
 */
export interface DocumentGap {
    /** Type of gap identified */
    type: 'missing_section' | 'incomplete_spec' | 'unclear_requirement' | 'missing_example';
    /** Description of the gap */
    description: string;
    /** Severity level of the gap */
    severity: 'low' | 'medium' | 'high';
    /** Suggested content to fill the gap */
    suggestedContent?: string;
}
/**
 * Result of gap analysis on a document
 *
 * @example
 * ```typescript
 * const analysis: GapAnalysis = {
 *   docPath: 'docs/api/endpoints.md',
 *   completeness: 0.65,
 *   gaps: [
 *     {
 *       type: 'missing_example',
 *       description: 'No code examples for POST /users endpoint',
 *       severity: 'medium',
 *       suggestedContent: '```typescript\nconst response = await fetch...',
 *     },
 *   ],
 *   recommendations: [
 *     'Add request/response examples for all endpoints',
 *     'Include error code documentation',
 *   ],
 *   analyzedAt: new Date(),
 * };
 * ```
 */
export interface GapAnalysis {
    /** Path to the analyzed document */
    docPath: string;
    /** Overall completeness score (0-1) */
    completeness: number;
    /** List of identified gaps */
    gaps: DocumentGap[];
    /** Recommendations for improvement */
    recommendations: string[];
    /** Timestamp when analysis was performed */
    analyzedAt: Date;
}
/**
 * GOAP (Goal-Oriented Action Planning) action definition
 *
 * Actions represent atomic operations that can transform the world state.
 * The planner uses preconditions and effects to build action sequences.
 *
 * @example
 * ```typescript
 * const analyzeAction: GOAPAction = {
 *   id: 'analyze-spec',
 *   name: 'Analyze Specification',
 *   cost: 2,
 *   preconditions: {
 *     hasSpecification: true,
 *   },
 *   effects: {
 *     specCompleteness: 1.0, // Will be fully analyzed
 *   },
 *   execute: async (state) => {
 *     // Perform analysis
 *     return { ...state, specCompleteness: 1.0 };
 *   },
 * };
 * ```
 */
export interface GOAPAction {
    /** Unique action identifier */
    id: string;
    /** Human-readable action name */
    name: string;
    /** Description of what the action does */
    description?: string;
    /** Cost of executing this action (for planning optimization) */
    cost: number;
    /** World state conditions required before this action can execute */
    preconditions: Partial<WorldState>;
    /** Changes to world state after successful execution */
    effects: Partial<WorldState>;
    /** Async function that executes the action and returns the new state (optional) */
    execute?: (state: WorldState) => Promise<WorldState>;
}
/**
 * Step in a GOAP plan
 */
export interface GOAPPlanStep {
    /** ID of the action to execute */
    action: string;
    /** Cost of this step */
    cost: number;
    /** Expected world state after this step */
    expectedState: Partial<WorldState>;
}
/**
 * GOAP plan generated by the planner
 *
 * @example
 * ```typescript
 * const plan: GOAPPlan = {
 *   goal: 'Complete specification',
 *   achievable: true,
 *   steps: [
 *     { action: 'create-spec', cost: 3, expectedState: { hasSpecification: true } },
 *     { action: 'analyze-spec', cost: 2, expectedState: { specCompleteness: 1.0 } },
 *   ],
 *   totalCost: 5,
 *   confidence: 0.95,
 * };
 * ```
 */
export interface GOAPPlan {
    /** Goal ID this plan achieves */
    goalId: string;
    /** Description of the goal this plan achieves */
    goal?: string;
    /** Whether the goal is achievable from the current state */
    achievable: boolean;
    /** Ordered list of action IDs to execute */
    actionIds: string[];
    /** Ordered sequence of actions to execute with details */
    steps?: GOAPPlanStep[];
    /** Total cost of executing all steps */
    totalCost: number;
    /** Confidence score that the plan will succeed (0-1) */
    confidence?: number;
    /** Reason if plan is not achievable */
    reason?: string;
    /** Estimated time to complete in milliseconds */
    estimatedTimeMs?: number;
    /** When the plan was created */
    createdAt?: Date;
}
/**
 * Options for workflow execution
 */
export interface WorkflowExecutionOptions {
    /** Whether to run in dry-run mode (no side effects) */
    dryRun?: boolean;
    /** Maximum execution time in milliseconds */
    timeout?: number;
    /** Whether to continue on non-critical errors */
    continueOnError?: boolean;
    /** Callback for progress updates */
    onProgress?: (progress: number, step: string) => void;
}
/**
 * Result of workflow execution
 */
export interface WorkflowExecutionResult {
    /** Whether the workflow completed successfully */
    success: boolean;
    /** Workflow run metadata */
    metadata: WorkflowRunMetadata;
    /** List of produced artifacts */
    artifacts: string[];
    /** Error message if failed */
    error?: string;
    /** Detailed execution logs */
    logs: string[];
}
/**
 * Hook handler function type
 */
export type HookHandler<T> = (event: T) => Promise<void> | void;
/**
 * Hook registration for workflow events
 */
export interface HookRegistration<T> {
    /** Unique hook identifier */
    id: string;
    /** Event type to listen for */
    eventType: string;
    /** Handler function */
    handler: HookHandler<T>;
    /** Priority for execution order (higher = earlier) */
    priority?: number;
    /** Whether the hook is currently enabled */
    enabled: boolean;
}
/**
 * GOAP Goal definition for the planner
 *
 * Goals define desired end states that the planner will attempt
 * to achieve through a sequence of actions.
 *
 * @example
 * ```typescript
 * const developmentGoal: GOAPGoal = {
 *   id: 'start-development',
 *   name: 'Start Development',
 *   description: 'Get the project ready to begin development',
 *   conditions: {
 *     taskDefined: true,
 *     developmentStarted: true,
 *   },
 *   priority: 10,
 * };
 * ```
 */
export interface GOAPGoal {
    /** Unique goal identifier */
    id: string;
    /** Human-readable goal name */
    name: string;
    /** Goal description */
    description?: string;
    /** Desired world state conditions */
    conditions: Partial<WorldState>;
    /** Goal priority (higher = more important) */
    priority: number;
}
/**
 * Extended GOAP Plan type for the adapter
 * (Extends the basic GOAPPlan with additional fields)
 */
export interface GOAPPlanExtended extends GOAPPlan {
    /** Goal ID this plan achieves */
    goalId: string;
    /** Ordered list of action IDs to execute */
    actionIds: string[];
    /** Reason if plan is not achievable */
    reason?: string;
    /** Estimated time to complete in milliseconds */
    estimatedTimeMs?: number;
    /** When the plan was created */
    createdAt: Date;
}
/**
 * Result of executing a GOAP plan
 */
export interface PlanExecutionResult {
    /** Whether the plan executed successfully */
    success: boolean;
    /** Final world state after execution */
    finalState: WorldState;
    /** IDs of completed action steps */
    completedSteps: string[];
    /** ID of the step that failed (if any) */
    failedStep?: string;
    /** Error message if execution failed */
    error?: string;
    /** Total execution time in milliseconds */
    executionTimeMs: number;
}
/**
 * Readiness evaluation result
 */
export interface ReadinessEvaluation {
    /** Readiness score from 0 to 1 */
    score: number;
    /** Whether the project is ready for development */
    ready: boolean;
    /** List of blocking issues */
    blockers: string[];
    /** Recommendations for improving readiness */
    recommendations: string[];
    /** When the evaluation was performed */
    evaluatedAt: Date;
}
//# sourceMappingURL=types.d.ts.map