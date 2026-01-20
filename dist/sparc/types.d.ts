/**
 * SPARC Planning Types
 *
 * Type definitions for the SPARC (Specification, Pseudocode, Architecture,
 * Refinement, Completion) planning system.
 *
 * @module sparc/types
 */
/**
 * SPARC methodology phases
 */
export type SPARCPhase = 'specification' | 'pseudocode' | 'architecture' | 'refinement' | 'completion';
/**
 * Confidence level for decisions
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'uncertain';
/**
 * Decision status in the log
 */
export type DecisionStatus = 'proposed' | 'approved' | 'rejected' | 'deferred' | 'superseded';
/**
 * Review pass type
 */
export type ReviewPassType = 'documentation' | 'code' | 'sparc-spec';
/**
 * Review finding severity
 */
export type FindingSeverity = 'critical' | 'major' | 'minor' | 'suggestion';
/**
 * Task execution mode
 */
export type TaskExecutionMode = 'sequential' | 'parallel' | 'adaptive';
/**
 * Requirement specification
 */
export interface Requirement {
    /** Unique requirement ID */
    id: string;
    /** Requirement type */
    type: 'functional' | 'non-functional' | 'constraint' | 'assumption';
    /** Requirement description */
    description: string;
    /** Priority level */
    priority: 'must-have' | 'should-have' | 'could-have' | 'won-t-have';
    /** Source of the requirement */
    source: string;
    /** Acceptance criteria */
    acceptanceCriteria: string[];
    /** Related requirement IDs */
    relatedRequirements: string[];
    /** Knowledge graph node reference */
    kgNodeId?: string;
    /** Vector embedding ID for semantic search */
    vectorId?: string;
}
/**
 * Feature specification
 */
export interface Feature {
    /** Feature ID */
    id: string;
    /** Feature name */
    name: string;
    /** Feature description */
    description: string;
    /** User stories */
    userStories: string[];
    /** Associated requirements */
    requirements: string[];
    /** Estimated complexity */
    complexity: 'low' | 'medium' | 'high' | 'very-high';
    /** Dependencies on other features */
    dependencies: string[];
    /** Can be developed in parallel */
    parallelizable: boolean;
    /** Sub-agent assignments */
    assignedAgents?: string[];
}
/**
 * Specification document
 */
export interface SpecificationDocument {
    /** Document ID */
    id: string;
    /** Project name */
    projectName: string;
    /** Version */
    version: string;
    /** Created timestamp */
    createdAt: Date;
    /** Updated timestamp */
    updatedAt: Date;
    /** Executive summary */
    summary: string;
    /** Problem statement */
    problemStatement: string;
    /** Goals and objectives */
    goals: string[];
    /** Requirements list */
    requirements: Requirement[];
    /** Features list */
    features: Feature[];
    /** Constraints */
    constraints: string[];
    /** Assumptions */
    assumptions: string[];
    /** Out of scope items */
    outOfScope: string[];
    /** Success metrics */
    successMetrics: string[];
    /** Knowledge graph references */
    kgReferences: KGReference[];
}
/**
 * Algorithm step
 */
export interface AlgorithmStep {
    /** Step number */
    step: number;
    /** Step description */
    description: string;
    /** Pseudocode */
    pseudocode: string;
    /** Inputs */
    inputs: string[];
    /** Outputs */
    outputs: string[];
    /** Complexity notation */
    complexity?: string;
}
/**
 * Algorithm design
 */
export interface AlgorithmDesign {
    /** Algorithm ID */
    id: string;
    /** Algorithm name */
    name: string;
    /** Purpose */
    purpose: string;
    /** Steps */
    steps: AlgorithmStep[];
    /** Time complexity */
    timeComplexity: string;
    /** Space complexity */
    spaceComplexity: string;
    /** Edge cases */
    edgeCases: string[];
    /** Related feature IDs */
    relatedFeatures: string[];
}
/**
 * Component definition
 */
export interface ArchitectureComponent {
    /** Component ID */
    id: string;
    /** Component name */
    name: string;
    /** Component type */
    type: 'service' | 'module' | 'library' | 'api' | 'database' | 'ui' | 'infrastructure';
    /** Description */
    description: string;
    /** Responsibilities */
    responsibilities: string[];
    /** Interfaces */
    interfaces: ComponentInterface[];
    /** Dependencies */
    dependencies: string[];
    /** Technology choices */
    technologies: string[];
    /** File/directory path */
    path?: string;
    /** Knowledge graph node */
    kgNodeId?: string;
}
/**
 * Component interface
 */
export interface ComponentInterface {
    /** Interface name */
    name: string;
    /** Interface type */
    type: 'api' | 'event' | 'message' | 'callback' | 'import';
    /** Interface definition */
    definition: string;
    /** Input/output contracts */
    contracts?: string;
}
/**
 * Architecture decision
 */
export interface ArchitectureDecision {
    /** Decision ID */
    id: string;
    /** Title */
    title: string;
    /** Context */
    context: string;
    /** Decision made */
    decision: string;
    /** Alternatives considered */
    alternatives: Array<{
        option: string;
        pros: string[];
        cons: string[];
    }>;
    /** Consequences */
    consequences: string[];
    /** Related components */
    relatedComponents: string[];
}
/**
 * Architecture document
 */
export interface ArchitectureDocument {
    /** Document ID */
    id: string;
    /** Version */
    version: string;
    /** Created timestamp */
    createdAt: Date;
    /** High-level overview */
    overview: string;
    /** Architecture patterns used */
    patterns: string[];
    /** Components */
    components: ArchitectureComponent[];
    /** Architecture decisions */
    decisions: ArchitectureDecision[];
    /** Data flow description */
    dataFlow: string;
    /** Security considerations */
    securityConsiderations: string[];
    /** Scalability considerations */
    scalabilityConsiderations: string[];
    /** Diagram references */
    diagrams: string[];
}
/**
 * SPARC task definition
 */
export interface SPARCTask {
    /** Task ID */
    id: string;
    /** Task name */
    name: string;
    /** Description */
    description: string;
    /** SPARC phase this task belongs to */
    phase: SPARCPhase;
    /** Task type */
    type: 'research' | 'design' | 'implementation' | 'review' | 'documentation' | 'testing';
    /** Priority */
    priority: 'critical' | 'high' | 'medium' | 'low';
    /** Estimated effort in hours */
    estimatedHours: number;
    /** Task dependencies */
    dependencies: string[];
    /** Can run in parallel with other tasks */
    parallelizable: boolean;
    /** Assigned agent type */
    assignedAgent?: string;
    /** Status */
    status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'failed';
    /** Context links */
    contextLinks: ContextLink[];
    /** Knowledge graph references */
    kgReferences: KGReference[];
    /** Output artifacts */
    outputs?: TaskOutput[];
}
/**
 * Task output artifact
 */
export interface TaskOutput {
    /** Output type */
    type: 'document' | 'code' | 'diagram' | 'data' | 'report';
    /** Output path */
    path: string;
    /** Description */
    description: string;
}
/**
 * Context link for task
 */
export interface ContextLink {
    /** Link type */
    type: 'document' | 'code' | 'kg-node' | 'vector-result' | 'decision' | 'requirement';
    /** Reference ID or path */
    reference: string;
    /** Description of relevance */
    relevance: string;
}
/**
 * Knowledge graph reference
 */
export interface KGReference {
    /** Node ID in knowledge graph */
    nodeId: string;
    /** Node type */
    nodeType: string;
    /** Relationship to current entity */
    relationship: string;
    /** Node title/name */
    title: string;
}
/**
 * Decision entry in the log
 */
export interface DecisionEntry {
    /** Decision ID */
    id: string;
    /** Decision title */
    title: string;
    /** Decision description */
    description: string;
    /** SPARC phase when decision was made */
    phase: SPARCPhase;
    /** Decision status */
    status: DecisionStatus;
    /** Confidence level */
    confidence: ConfidenceLevel;
    /** Rationale for the decision */
    rationale: string;
    /** Alternatives considered */
    alternatives: string[];
    /** Impact assessment */
    impact: string;
    /** Stakeholders involved */
    stakeholders: string[];
    /** Related decisions */
    relatedDecisions: string[];
    /** Consensus information (if applicable) */
    consensus?: ConsensusInfo;
    /** Created timestamp */
    createdAt: Date;
    /** Updated timestamp */
    updatedAt: Date;
    /** Decision maker (agent or human) */
    decidedBy: string;
}
/**
 * Consensus building information
 */
export interface ConsensusInfo {
    /** Whether consensus was required */
    required: boolean;
    /** Consensus achieved */
    achieved: boolean;
    /** Participating agents */
    participants: string[];
    /** Votes or opinions */
    votes: Array<{
        agent: string;
        vote: 'agree' | 'disagree' | 'abstain';
        reason: string;
    }>;
    /** Consensus method used */
    method: 'majority' | 'unanimous' | 'weighted' | 'expert';
    /** Final outcome */
    outcome: string;
}
/**
 * Decision log document
 */
export interface DecisionLog {
    /** Log ID */
    id: string;
    /** Plan ID this log belongs to */
    planId: string;
    /** All decisions */
    decisions: DecisionEntry[];
    /** Summary statistics */
    statistics: {
        total: number;
        approved: number;
        rejected: number;
        deferred: number;
        highConfidence: number;
        lowConfidence: number;
        consensusRequired: number;
    };
    /** Created timestamp */
    createdAt: Date;
    /** Updated timestamp */
    updatedAt: Date;
}
/**
 * Review finding
 */
export interface ReviewFinding {
    /** Finding ID */
    id: string;
    /** Finding type */
    type: 'missing' | 'incomplete' | 'inconsistent' | 'non-compliant' | 'improvement';
    /** Severity */
    severity: FindingSeverity;
    /** Category */
    category: string;
    /** Description */
    description: string;
    /** Location (file, section, line) */
    location: string;
    /** Suggested fix */
    suggestedFix: string;
    /** Related requirements or standards */
    relatedStandards: string[];
    /** Status */
    status: 'open' | 'fixed' | 'wont-fix' | 'deferred';
    /** Resolution notes */
    resolution?: string;
}
/**
 * Review pass result
 */
export interface ReviewPassResult {
    /** Pass number (1, 2, or 3) */
    passNumber: number;
    /** Review type */
    type: ReviewPassType;
    /** Started timestamp */
    startedAt: Date;
    /** Completed timestamp */
    completedAt: Date;
    /** Findings from this pass */
    findings: ReviewFinding[];
    /** Items reviewed */
    itemsReviewed: number;
    /** Coverage percentage */
    coverage: number;
    /** Pass status */
    status: 'passed' | 'failed' | 'needs-review';
    /** Reviewer agent */
    reviewer: string;
    /** Notes */
    notes: string;
}
/**
 * Complete review result
 */
export interface ReviewResult {
    /** Review ID */
    id: string;
    /** Plan ID being reviewed */
    planId: string;
    /** All review passes */
    passes: ReviewPassResult[];
    /** Total findings */
    totalFindings: number;
    /** Critical findings */
    criticalFindings: number;
    /** All findings addressed */
    allFindingsAddressed: boolean;
    /** Overall status */
    overallStatus: 'approved' | 'rejected' | 'needs-work';
    /** Recommendations */
    recommendations: string[];
    /** Started timestamp */
    startedAt: Date;
    /** Completed timestamp */
    completedAt: Date;
}
/**
 * SPARC Plan status
 */
export type SPARCPlanStatus = 'draft' | 'researching' | 'planning' | 'reviewing' | 'approved' | 'in-progress' | 'completed' | 'failed';
/**
 * Existing code analysis
 */
export interface ExistingCodeAnalysis {
    /** Has existing src directory */
    hasSrcDirectory: boolean;
    /** Source directory path */
    srcPath?: string;
    /** File count */
    fileCount: number;
    /** Language breakdown */
    languages: Record<string, number>;
    /** Key files identified */
    keyFiles: Array<{
        path: string;
        type: string;
        description: string;
        kgNodeId?: string;
    }>;
    /** Patterns identified */
    patterns: string[];
    /** Dependencies */
    dependencies: string[];
    /** Entry points */
    entryPoints: string[];
    /** Test coverage info */
    testCoverage?: {
        hasTests: boolean;
        testFramework?: string;
        estimatedCoverage?: number;
    };
}
/**
 * Research finding from agents
 */
export interface ResearchFinding {
    /** Finding ID */
    id: string;
    /** Agent that produced the finding */
    agent: string;
    /** Topic area */
    topic: string;
    /** Finding summary */
    summary: string;
    /** Detailed content */
    details: string;
    /** Confidence level */
    confidence: ConfidenceLevel;
    /** Evidence/sources */
    evidence: string[];
    /** Related findings */
    relatedFindings: string[];
    /** Knowledge graph references */
    kgReferences: KGReference[];
    /** Vector search results used */
    vectorResults?: string[];
    /** Timestamp */
    timestamp: Date;
}
/**
 * Complete SPARC Plan
 */
export interface SPARCPlan {
    /** Plan ID */
    id: string;
    /** Plan name */
    name: string;
    /** Plan description */
    description: string;
    /** Current status */
    status: SPARCPlanStatus;
    /** Current phase */
    currentPhase: SPARCPhase;
    /** Project root path */
    projectRoot: string;
    /** Output directory for plan artifacts */
    outputDir: string;
    /** Specification document */
    specification?: SpecificationDocument;
    /** Algorithm designs */
    algorithms?: AlgorithmDesign[];
    /** Architecture document */
    architecture?: ArchitectureDocument;
    /** All tasks in the plan */
    tasks: SPARCTask[];
    /** Parallel task groups */
    parallelGroups: string[][];
    /** Critical path tasks */
    criticalPath: string[];
    /** Task execution order */
    executionOrder: string[];
    /** Research findings */
    researchFindings: ResearchFinding[];
    /** Existing code analysis */
    existingCode?: ExistingCodeAnalysis;
    /** Decision log */
    decisionLog: DecisionLog;
    /** Review results */
    reviewResult?: ReviewResult;
    /** Created timestamp */
    createdAt: Date;
    /** Updated timestamp */
    updatedAt: Date;
    /** Plan version */
    version: string;
    /** Author/creator */
    author: string;
    /** Statistics */
    statistics: {
        totalTasks: number;
        completedTasks: number;
        parallelizableTasks: number;
        estimatedHours: number;
        researchFindings: number;
        decisions: number;
        kgNodes: number;
    };
}
/**
 * Agent spawn request
 */
export interface AgentSpawnRequest {
    /** Agent type */
    type: string;
    /** Agent name */
    name: string;
    /** Task to perform */
    task: string;
    /** Task context */
    context: ContextLink[];
    /** Expected outputs */
    expectedOutputs: string[];
    /** Timeout in ms */
    timeout: number;
    /** Priority */
    priority: 'high' | 'normal' | 'low';
}
/**
 * Agent result
 */
export interface AgentExecutionResult {
    /** Agent name */
    agent: string;
    /** Success status */
    success: boolean;
    /** Result data */
    data?: unknown;
    /** Findings produced */
    findings?: ResearchFinding[];
    /** Errors */
    errors?: string[];
    /** Duration in ms */
    duration: number;
    /** Tokens used */
    tokensUsed?: number;
}
/**
 * Consensus request
 */
export interface ConsensusRequest {
    /** Topic requiring consensus */
    topic: string;
    /** Options to choose from */
    options: Array<{
        id: string;
        description: string;
        pros: string[];
        cons: string[];
    }>;
    /** Participating agents */
    participants: string[];
    /** Consensus threshold (0-1) */
    threshold: number;
    /** Timeout in ms */
    timeout: number;
}
/**
 * Consensus result
 */
export interface ConsensusResult {
    /** Consensus achieved */
    achieved: boolean;
    /** Winning option (if achieved) */
    selectedOption?: string;
    /** Votes from each agent */
    votes: Array<{
        agent: string;
        option: string;
        confidence: number;
        reasoning: string;
    }>;
    /** Final rationale */
    rationale: string;
    /** Dissenting opinions */
    dissent?: string[];
}
//# sourceMappingURL=types.d.ts.map