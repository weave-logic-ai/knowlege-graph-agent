/**
 * Planner Agent
 *
 * Specialized agent for task planning, decomposition, dependency analysis,
 * resource allocation, timeline estimation, and risk assessment.
 * Extends BaseAgent with planning capabilities and knowledge graph integration.
 *
 * @module agents/planner-agent
 */
import { BaseAgent } from './base-agent.js';
import { AgentType, type AgentTask, type AgentResult, type PlannerAgentConfig } from './types.js';
import { KnowledgeGraphManager } from '../core/graph.js';
/**
 * Task priority levels for planning
 */
export type PlannerPriority = 'critical' | 'high' | 'medium' | 'low';
/**
 * Dependency relationship types
 */
export type DependencyType = 'blocks' | 'requires' | 'suggests';
/**
 * Risk probability levels
 */
export type RiskProbability = 'high' | 'medium' | 'low';
/**
 * Risk impact levels
 */
export type RiskImpact = 'high' | 'medium' | 'low';
/**
 * Task effort estimation
 */
export interface EffortEstimate {
    /** Minimum hours */
    min: number;
    /** Most likely hours */
    likely: number;
    /** Maximum hours */
    max: number;
    /** Calculated expected value (PERT) */
    expected: number;
}
/**
 * Subtask definition
 */
export interface Subtask {
    /** Unique subtask identifier */
    id: string;
    /** Task description */
    description: string;
    /** Estimated effort */
    estimatedEffort: string;
    /** Parsed effort estimate */
    effortEstimate: EffortEstimate;
    /** Required capabilities to execute */
    requiredCapabilities: string[];
    /** Dependencies on other subtask IDs */
    dependencies: string[];
    /** Task priority */
    priority: PlannerPriority;
    /** Optional assigned agent type */
    assignedAgentType?: AgentType;
}
/**
 * Task decomposition result
 */
export interface TaskDecomposition {
    /** Original root task description */
    rootTask: string;
    /** Decomposed subtasks */
    subtasks: Subtask[];
    /** Total estimated effort */
    totalEstimate: string;
    /** Total effort in hours */
    totalHours: number;
    /** Decomposition timestamp */
    timestamp: Date;
}
/**
 * Dependency graph node
 */
export interface DependencyNode {
    /** Node identifier */
    id: string;
    /** Node label/description */
    label: string;
    /** Node metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Dependency graph edge
 */
export interface DependencyEdge {
    /** Source node ID */
    from: string;
    /** Target node ID */
    to: string;
    /** Relationship type */
    type: DependencyType;
}
/**
 * Dependency graph analysis result
 */
export interface DependencyGraph {
    /** Graph nodes */
    nodes: DependencyNode[];
    /** Graph edges */
    edges: DependencyEdge[];
    /** Critical path (longest path through graph) */
    criticalPath: string[];
    /** Sets of parallelizable tasks */
    parallelizable: string[][];
    /** Topological order for execution */
    executionOrder: string[];
    /** Detected cycles (should be empty for valid DAG) */
    cycles: string[][];
}
/**
 * Agent information for resource allocation
 */
export interface AgentInfo {
    /** Agent identifier */
    id: string;
    /** Agent type */
    type: AgentType;
    /** Agent capabilities */
    capabilities: string[];
    /** Current availability (0-1) */
    availability: number;
    /** Performance score (0-100) */
    performanceScore?: number;
}
/**
 * Resource assignment
 */
export interface ResourceAssignment {
    /** Task identifier */
    taskId: string;
    /** Assigned agent identifier */
    agentId: string;
    /** Agent type */
    agentType: AgentType;
    /** Planned start time */
    startTime?: Date;
    /** Estimated duration */
    estimatedDuration: string;
    /** Duration in hours */
    durationHours: number;
    /** Assignment confidence score */
    confidence: number;
}
/**
 * Resource allocation result
 */
export interface ResourceAllocation {
    /** Task-to-agent assignments */
    assignments: ResourceAssignment[];
    /** Agent utilization map (agent ID -> utilization percentage) */
    utilization: Map<string, number>;
    /** Identified bottlenecks */
    bottlenecks: string[];
    /** Unassigned tasks (no matching capability) */
    unassignedTasks: string[];
    /** Allocation timestamp */
    timestamp: Date;
}
/**
 * Milestone definition
 */
export interface Milestone {
    /** Milestone name */
    name: string;
    /** Target date */
    date: Date;
    /** Deliverables for this milestone */
    deliverables: string[];
    /** Task IDs that must complete for milestone */
    requiredTasks: string[];
}
/**
 * Phase definition
 */
export interface Phase {
    /** Phase name */
    name: string;
    /** Phase start date */
    start: Date;
    /** Phase end date */
    end: Date;
    /** Tasks in this phase */
    tasks: string[];
    /** Phase description */
    description?: string;
}
/**
 * Timeline estimate result
 */
export interface TimelineEstimate {
    /** Project start date */
    startDate: Date;
    /** Project end date */
    endDate: Date;
    /** Total duration in business days */
    totalDays: number;
    /** Project milestones */
    milestones: Milestone[];
    /** Project phases */
    phases: Phase[];
    /** Estimation confidence (0-100) */
    confidence: number;
    /** Buffer percentage included */
    bufferPercentage: number;
    /** Estimation timestamp */
    timestamp: Date;
}
/**
 * Risk definition
 */
export interface Risk {
    /** Risk identifier */
    id: string;
    /** Risk description */
    description: string;
    /** Probability of occurrence */
    probability: RiskProbability;
    /** Impact if it occurs */
    impact: RiskImpact;
    /** Risk score (probability * impact) */
    score: number;
    /** Mitigation strategy */
    mitigation: string;
    /** Contingency plan */
    contingency: string;
    /** Related task IDs */
    relatedTasks?: string[];
    /** Risk category */
    category: 'technical' | 'resource' | 'schedule' | 'scope' | 'external';
}
/**
 * Risk assessment result
 */
export interface RiskAssessment {
    /** Identified risks */
    risks: Risk[];
    /** Overall risk level */
    overallRisk: RiskProbability;
    /** Risk score (0-100) */
    riskScore: number;
    /** Recommendations for risk mitigation */
    recommendations: string[];
    /** Assessment timestamp */
    timestamp: Date;
}
/**
 * Complete execution plan
 */
export interface ExecutionPlan {
    /** Plan identifier */
    id: string;
    /** Plan name */
    name: string;
    /** Task decomposition */
    decomposition: TaskDecomposition;
    /** Dependency graph */
    dependencies: DependencyGraph;
    /** Resource allocation */
    resources: ResourceAllocation;
    /** Timeline estimate */
    timeline: TimelineEstimate;
    /** Risk assessment */
    risks: RiskAssessment;
    /** Plan status */
    status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
    /** Plan creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
}
/**
 * Planner task type
 */
export type PlannerTaskType = 'decompose' | 'dependencies' | 'allocate' | 'timeline' | 'risks' | 'plan';
/**
 * Planner Agent
 *
 * Capabilities:
 * - Hierarchical task decomposition
 * - Dependency graph analysis with critical path
 * - Capability-based resource allocation
 * - Timeline estimation with milestones
 * - Risk assessment with mitigations
 *
 * @example
 * ```typescript
 * const planner = new PlannerAgent({
 *   name: 'planner-agent',
 *   estimationStrategy: 'realistic',
 * });
 *
 * const decomposition = await planner.decomposeTask(
 *   'Build a REST API with authentication'
 * );
 *
 * const plan = await planner.createExecutionPlan(
 *   'API Project',
 *   'Build a REST API with authentication',
 *   availableAgents
 * );
 * ```
 */
export declare class PlannerAgent extends BaseAgent {
    /** Knowledge graph reference */
    private knowledgeGraph;
    /** Estimation strategy */
    private readonly estimationStrategy;
    /** Include risk assessment by default */
    private readonly includeRiskAssessment;
    /** Maximum parallel tasks */
    private readonly maxParallelTasks;
    /** Task ID counter */
    private taskIdCounter;
    constructor(config: Partial<PlannerAgentConfig> & {
        name: string;
    });
    /**
     * Set knowledge graph for context-aware planning
     */
    setKnowledgeGraph(graph: KnowledgeGraphManager): void;
    /**
     * Execute planner task
     */
    protected executeTask(task: AgentTask): Promise<AgentResult>;
    /**
     * Decompose a complex task into subtasks
     *
     * Uses hierarchical decomposition to break down tasks
     * into manageable, estimable units.
     */
    decomposeTask(task: string): Promise<TaskDecomposition>;
    /**
     * Generate subtasks from a task description
     */
    private generateSubtasks;
    private identifyTaskPatterns;
    private generateApiSubtasks;
    private generateAuthSubtasks;
    private generateDatabaseSubtasks;
    private generateUiSubtasks;
    private generateTestSubtasks;
    private createSubtask;
    private calculateEffortEstimate;
    private setupDependencies;
    /**
     * Analyze dependencies between tasks and build a dependency graph
     */
    analyzeDependencies(subtasks: Subtask[]): Promise<DependencyGraph>;
    private buildNodes;
    private buildEdges;
    private detectCycles;
    private topologicalSort;
    private findCriticalPath;
    private findParallelGroups;
    /**
     * Allocate resources (agents) to tasks based on capabilities
     */
    allocateResources(subtasks: Subtask[], availableAgents: AgentInfo[]): Promise<ResourceAllocation>;
    private findBestAgent;
    private calculateCapabilityMatch;
    private calculateAssignmentConfidence;
    /**
     * Estimate project timeline with milestones
     */
    estimateTimeline(decomposition: TaskDecomposition): Promise<TimelineEstimate>;
    private createPhases;
    private createMilestones;
    private getPhaseDeliverables;
    private calculateTimelineConfidence;
    private addBusinessDays;
    /**
     * Assess risks in an execution plan
     */
    assessRisks(decomposition: TaskDecomposition, dependencies: DependencyGraph, resources?: ResourceAllocation): Promise<RiskAssessment>;
    private generateRiskRecommendations;
    /**
     * Create a complete execution plan
     */
    createExecutionPlan(planName: string, task: string, availableAgents: AgentInfo[]): Promise<ExecutionPlan>;
    private handleDecomposeTask;
    private handleDependenciesTask;
    private handleAllocateTask;
    private handleTimelineTask;
    private handleRisksTask;
    private handlePlanTask;
    private formatDuration;
}
//# sourceMappingURL=planner-agent.d.ts.map