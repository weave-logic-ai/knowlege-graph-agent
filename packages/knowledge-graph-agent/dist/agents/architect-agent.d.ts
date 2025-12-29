/**
 * Architect Agent
 *
 * Specialized agent for architecture analysis, design decisions, and dependency analysis.
 * Extends BaseAgent with system design capabilities and knowledge graph integration.
 *
 * @module agents/architect-agent
 */
import { BaseAgent } from './base-agent.js';
import { type AgentTask, type AgentResult, type ArchitectAgentConfig } from './types.js';
import { KnowledgeGraphManager } from '../core/graph.js';
/**
 * Architecture pattern
 */
export type ArchitecturePattern = 'mvc' | 'mvvm' | 'clean-architecture' | 'hexagonal' | 'microservices' | 'monolith' | 'serverless' | 'event-driven' | 'layered' | 'modular';
/**
 * Component type
 */
export type ComponentType = 'service' | 'controller' | 'repository' | 'model' | 'view' | 'utility' | 'middleware' | 'handler' | 'factory' | 'adapter';
/**
 * Architecture component
 */
export interface ArchitectureComponent {
    /** Component name */
    name: string;
    /** Component type */
    type: ComponentType;
    /** File path */
    path: string;
    /** Component description */
    description?: string;
    /** Dependencies (other components) */
    dependencies: string[];
    /** Dependents (components that depend on this) */
    dependents: string[];
    /** Exports provided */
    exports: string[];
    /** Lines of code */
    linesOfCode: number;
    /** Complexity score */
    complexity: number;
}
/**
 * Architecture layer
 */
export interface ArchitectureLayer {
    /** Layer name */
    name: string;
    /** Layer level (0 = highest, like UI) */
    level: number;
    /** Components in this layer */
    components: string[];
    /** Allowed dependencies (layer names) */
    allowedDependencies: string[];
    /** Actual dependencies found */
    actualDependencies: string[];
    /** Violations (dependencies to wrong layers) */
    violations: string[];
}
/**
 * Dependency graph node
 */
export interface DependencyNode {
    /** Node identifier */
    id: string;
    /** Node label */
    label: string;
    /** Node type */
    type: ComponentType;
    /** Outgoing edges (dependencies) */
    outgoing: string[];
    /** Incoming edges (dependents) */
    incoming: string[];
    /** Metrics */
    metrics: {
        fanIn: number;
        fanOut: number;
        instability: number;
        abstractness: number;
    };
}
/**
 * Dependency analysis result
 */
export interface DependencyAnalysis {
    /** Dependency graph */
    graph: DependencyNode[];
    /** Circular dependencies */
    cycles: string[][];
    /** Orphan modules (no deps or dependents) */
    orphans: string[];
    /** Hub modules (many dependencies) */
    hubs: Array<{
        module: string;
        connections: number;
    }>;
    /** Recommendations */
    recommendations: string[];
}
/**
 * Design decision
 */
export interface DesignDecision {
    /** Decision title */
    title: string;
    /** Decision category */
    category: 'structure' | 'pattern' | 'technology' | 'integration' | 'security';
    /** Decision description */
    description: string;
    /** Rationale */
    rationale: string;
    /** Pros */
    pros: string[];
    /** Cons */
    cons: string[];
    /** Alternatives considered */
    alternatives?: string[];
    /** Priority */
    priority: 'low' | 'medium' | 'high';
}
/**
 * Architecture analysis result
 */
export interface ArchitectureAnalysis {
    /** Project name */
    projectName: string;
    /** Detected patterns */
    patterns: ArchitecturePattern[];
    /** Architecture layers */
    layers: ArchitectureLayer[];
    /** Components */
    components: ArchitectureComponent[];
    /** Dependency analysis */
    dependencies: DependencyAnalysis;
    /** Design decisions/recommendations */
    decisions: DesignDecision[];
    /** Overall health score (0-100) */
    healthScore: number;
    /** Analysis timestamp */
    timestamp: Date;
}
/**
 * Design suggestion
 */
export interface DesignSuggestion {
    /** Suggestion type */
    type: 'refactor' | 'extract' | 'merge' | 'introduce' | 'remove';
    /** Target component/module */
    target: string;
    /** Description */
    description: string;
    /** Priority */
    priority: 'low' | 'medium' | 'high';
    /** Expected benefit */
    benefit: string;
    /** Effort estimate */
    effort: 'low' | 'medium' | 'high';
}
/**
 * Architect task type
 */
export type ArchitectTaskType = 'analyze' | 'design' | 'dependencies' | 'suggest';
/**
 * Architect Agent
 *
 * Capabilities:
 * - Architecture analysis and pattern detection
 * - Design decision recommendations
 * - Dependency analysis and visualization
 * - Layer validation
 *
 * @example
 * ```typescript
 * const architect = new ArchitectAgent({
 *   name: 'architect-agent',
 *   type: AgentType.ARCHITECT,
 * });
 *
 * const result = await architect.execute({
 *   id: 'task-1',
 *   description: 'Analyze project architecture',
 *   priority: TaskPriority.MEDIUM,
 *   input: {
 *     data: {
 *       projectRoot: '/path/to/project'
 *     }
 *   },
 *   createdAt: new Date()
 * });
 * ```
 */
export declare class ArchitectAgent extends BaseAgent {
    /** File patterns to analyze */
    private readonly codePatterns;
    /** Knowledge graph reference */
    private knowledgeGraph;
    /** Layer definitions for common architectures */
    private readonly layerDefinitions;
    constructor(config: Partial<ArchitectAgentConfig> & {
        name: string;
    });
    /**
     * Set knowledge graph for context-aware analysis
     */
    setKnowledgeGraph(graph: KnowledgeGraphManager): void;
    /**
     * Execute architect task
     */
    protected executeTask(task: AgentTask): Promise<AgentResult>;
    /**
     * Analyze project architecture
     */
    analyzeArchitecture(projectRoot: string): Promise<ArchitectureAnalysis>;
    /**
     * Suggest design improvements
     */
    suggestDesign(projectRoot: string): Promise<DesignSuggestion[]>;
    /**
     * Map dependencies between modules
     */
    mapDependencies(projectRoot: string): Promise<DependencyAnalysis>;
    private handleAnalyzeTask;
    private handleDesignTask;
    private handleDependenciesTask;
    private handleSuggestTask;
    private discoverComponents;
    private analyzeComponent;
    private inferComponentType;
    private resolveDependencies;
    private resolveDependencyPath;
    private detectPatterns;
    private identifyLayers;
    private inferLayer;
    private findLayerDependencies;
    private analyzeDependencies;
    private buildDependencyGraph;
    private findCycles;
    private findOrphans;
    private findHubs;
    private generateDependencyRecommendations;
    private generateDesignDecisions;
    private calculateHealthScore;
    private extractDependencies;
    private extractExports;
    private calculateComplexity;
    private findFiles;
}
//# sourceMappingURL=architect-agent.d.ts.map