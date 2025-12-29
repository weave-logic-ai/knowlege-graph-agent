/**
 * Real-Time Collaboration Workflow
 *
 * Durable workflow that monitors documentation changes and
 * autonomously manages task specification generation.
 *
 * Uses Workflow DevKit's "use workflow" and "use step" directives
 * for durable execution with automatic retry and replay.
 *
 * @module workflow/workflows/realtime-collab
 */
/**
 * World state representation for GOAP planning
 *
 * Tracks the current state of documentation and development readiness.
 */
export interface WorldState {
    /** Whether a specification document exists */
    hasSpecification: boolean;
    /** Completeness score from 0 to 1 */
    specCompleteness: number;
    /** Whether acceptance criteria have been defined */
    hasAcceptanceCriteria: boolean;
    /** Whether task is fully defined */
    taskDefined: boolean;
    /** Whether there are no blockers preventing development */
    blockersFree: boolean;
    /** Whether development has started */
    developmentStarted: boolean;
    /** Time since last document change in milliseconds */
    timeSinceLastChange: number;
    /** Timestamp of last document change */
    lastChangeTimestamp: number;
    /** List of active collaborator IDs */
    activeCollaborators: string[];
    /** List of pending gaps to address */
    pendingGaps: string[];
}
/**
 * Event emitted when a node is updated in the knowledge graph
 */
export interface NodeUpdateEvent {
    /** Node ID that was updated */
    nodeId: string;
    /** Type of update (created, modified, deleted) */
    updateType: 'created' | 'modified' | 'deleted';
    /** Path to the document */
    docPath: string;
    /** Timestamp of the update */
    timestamp: Date;
    /** User who made the change */
    userId?: string;
    /** Change summary */
    changeSummary?: string;
}
/**
 * Individual gap identified during analysis
 */
export interface Gap {
    /** Type of gap (missing_section, incomplete_content, etc.) */
    type: 'missing_section' | 'incomplete_content' | 'unclear_requirements' | 'missing_tests';
    /** Human-readable description */
    description: string;
    /** Severity level */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Suggested content to fill the gap */
    suggestedContent?: string;
    /** Location in document where gap was found */
    location?: string;
}
/**
 * Result of gap analysis on a document
 */
export interface GapAnalysis {
    /** Path to analyzed document */
    docPath: string;
    /** Overall completeness score from 0 to 1 */
    completeness: number;
    /** List of identified gaps */
    gaps: Gap[];
    /** Recommendations for improvement */
    recommendations: string[];
    /** Timestamp of analysis */
    analyzedAt: Date;
}
/**
 * Generated task specification from documentation
 */
export interface TaskSpec {
    /** Unique task identifier */
    id: string;
    /** Task version */
    version: string;
    /** Task title */
    title: string;
    /** Detailed description */
    description: string;
    /** Priority level */
    priority: 'low' | 'medium' | 'high' | 'critical';
    /** List of requirements */
    requirements: string[];
    /** Acceptance criteria that must be met */
    acceptanceCriteria: string[];
    /** Estimated complexity (1-10 scale) */
    estimatedComplexity: number;
    /** Source document path */
    sourceDoc: string;
    /** Generation timestamp */
    generatedAt: Date;
    /** Confidence score for the specification */
    confidence: number;
}
/**
 * Step in a GOAP plan
 */
export interface GOAPStep {
    /** Action to take */
    action: string;
    /** Cost of this action */
    cost: number;
    /** Expected state after this action */
    expectedState: Partial<WorldState>;
    /** Prerequisites that must be true */
    preconditions?: Partial<WorldState>;
}
/**
 * GOAP plan for achieving a goal
 */
export interface GOAPPlan {
    /** Goal being pursued */
    goal: string;
    /** Whether the goal is achievable */
    achievable: boolean;
    /** Ordered list of steps */
    steps: GOAPStep[];
    /** Total cost of the plan */
    totalCost: number;
    /** Confidence in plan success */
    confidence: number;
}
/**
 * Main real-time collaboration workflow
 *
 * This durable workflow:
 * 1. Monitors documentation for changes
 * 2. Analyzes gaps when changes occur
 * 3. Generates task specs when documentation is sufficient
 * 4. Auto-generates missing docs after inactivity timeout
 *
 * The workflow uses "use workflow" directive for durability,
 * ensuring it can survive restarts and failures.
 *
 * @param graphId - Knowledge graph identifier
 * @param docPath - Path to monitor for documentation
 * @param options - Workflow configuration options
 *
 * @example
 * ```typescript
 * await realtimeCollaborationWorkflow('graph-123', '/docs/feature.md', {
 *   inactivityTimeout: 5 * 60 * 1000, // 5 minutes
 *   autoStartThreshold: 0.7
 * });
 * ```
 */
export declare function realtimeCollaborationWorkflow(graphId: string, docPath: string, options?: {
    /** Timeout before auto-generating missing docs (ms) */
    inactivityTimeout?: number;
    /** Completeness threshold to trigger development */
    autoStartThreshold?: number;
}): Promise<void>;
/**
 * Gap detection workflow - runs on document change
 *
 * Lightweight workflow that performs gap analysis without
 * the full collaboration loop. Use this for quick checks.
 *
 * @param docPath - Path to document to analyze
 * @returns Gap analysis results
 *
 * @example
 * ```typescript
 * const analysis = await gapDetectionWorkflow('/docs/api-spec.md');
 * console.log(`Completeness: ${analysis.completeness * 100}%`);
 * console.log(`Gaps found: ${analysis.gaps.length}`);
 * ```
 */
export declare function gapDetectionWorkflow(docPath: string): Promise<GapAnalysis>;
/**
 * Task specification workflow - generates spec from docs
 *
 * Complete workflow that analyzes documentation and generates
 * a task specification. Includes gap analysis as part of the process.
 *
 * @param docPath - Path to source documentation
 * @returns Generated task specification
 *
 * @example
 * ```typescript
 * const spec = await taskSpecWorkflow('/docs/new-feature.md');
 * console.log(`Generated task: ${spec.title}`);
 * console.log(`Priority: ${spec.priority}`);
 * console.log(`Complexity: ${spec.estimatedComplexity}/10`);
 * ```
 */
export declare function taskSpecWorkflow(docPath: string): Promise<TaskSpec>;
/**
 * Document enhancement workflow - fills gaps automatically
 *
 * Workflow that analyzes documentation, identifies gaps, and
 * generates content to fill those gaps.
 *
 * @param docPath - Path to document to enhance
 * @returns Object containing analysis and generated content
 *
 * @example
 * ```typescript
 * const result = await documentEnhancementWorkflow('/docs/incomplete.md');
 * console.log(`Filled ${result.generatedContent.length} gaps`);
 * ```
 */
export declare function documentEnhancementWorkflow(docPath: string): Promise<{
    analysis: GapAnalysis;
    generatedContent: string[];
}>;
/**
 * GOAP planning workflow - creates action plan
 *
 * Workflow that analyzes current state and creates an optimal
 * plan to achieve the specified goal.
 *
 * @param docPath - Path to source documentation
 * @param goal - Goal to achieve
 * @returns GOAP plan with steps and costs
 *
 * @example
 * ```typescript
 * const plan = await goapPlanningWorkflow('/docs/feature.md', 'start-development');
 * if (plan.achievable) {
 *   console.log(`Plan has ${plan.steps.length} steps`);
 *   console.log(`Total cost: ${plan.totalCost}`);
 * }
 * ```
 */
export declare function goapPlanningWorkflow(docPath: string, goal: string): Promise<GOAPPlan>;
//# sourceMappingURL=realtime-collab.d.ts.map