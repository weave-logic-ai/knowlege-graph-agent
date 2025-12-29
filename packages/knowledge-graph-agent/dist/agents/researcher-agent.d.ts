/**
 * Researcher Agent
 *
 * Specialized agent for codebase research, pattern analysis, and documentation research.
 * Extends BaseAgent with research-specific capabilities and knowledge graph integration.
 *
 * @module agents/researcher-agent
 */
import { BaseAgent } from './base-agent.js';
import { type AgentTask, type AgentResult, type ResearcherAgentConfig } from './types.js';
import { KnowledgeGraphManager } from '../core/graph.js';
/**
 * Research query type
 */
export type ResearchQueryType = 'codebase' | 'pattern' | 'documentation' | 'reference' | 'general';
/**
 * Research query input
 */
export interface ResearchQuery {
    /** Query string */
    query: string;
    /** Type of research */
    type: ResearchQueryType;
    /** Scope of research (file paths, directories, or patterns) */
    scope?: string[];
    /** Include code snippets in results */
    includeCode?: boolean;
    /** Maximum results to return */
    maxResults?: number;
}
/**
 * Code reference found during research
 */
export interface CodeReference {
    /** File path */
    file: string;
    /** Line number */
    line: number;
    /** Code snippet */
    code: string;
    /** Context around the reference */
    context?: string;
    /** Relevance score (0-1) */
    relevance: number;
}
/**
 * Detected pattern
 */
export interface DetectedPattern {
    /** Pattern name */
    name: string;
    /** Pattern category */
    category: string;
    /** Description of the pattern */
    description: string;
    /** Files where pattern is found */
    locations: string[];
    /** Frequency/occurrence count */
    frequency: number;
    /** Whether this is a recommended pattern */
    recommended: boolean;
    /** Related patterns */
    relatedPatterns?: string[];
}
/**
 * Research finding
 */
export interface ResearchFinding {
    /** Finding title */
    title: string;
    /** Finding description */
    description: string;
    /** Relevance score (0-1) */
    relevance: number;
    /** Source of the finding */
    source: 'code' | 'documentation' | 'knowledge-graph';
    /** Related code references */
    references?: CodeReference[];
    /** Related patterns */
    patterns?: DetectedPattern[];
    /** Related knowledge nodes */
    relatedNodes?: string[];
}
/**
 * Research result data
 */
export interface ResearchResultData {
    /** Query that was executed */
    query: ResearchQuery;
    /** Findings from the research */
    findings: ResearchFinding[];
    /** Summary of findings */
    summary: string;
    /** Total files analyzed */
    filesAnalyzed: number;
    /** Patterns detected */
    patterns: DetectedPattern[];
    /** Recommendations */
    recommendations: string[];
}
/**
 * Researcher Agent
 *
 * Capabilities:
 * - Codebase research and exploration
 * - Pattern detection and analysis
 * - Documentation research
 * - Reference finding across the codebase
 *
 * @example
 * ```typescript
 * const researcher = new ResearcherAgent({
 *   name: 'research-agent',
 *   type: AgentType.RESEARCHER,
 * });
 *
 * const result = await researcher.execute({
 *   id: 'task-1',
 *   description: 'Research authentication patterns',
 *   priority: TaskPriority.MEDIUM,
 *   input: {
 *     data: {
 *       query: 'authentication',
 *       type: 'pattern',
 *       scope: ['src/auth']
 *     }
 *   },
 *   createdAt: new Date()
 * });
 * ```
 */
export declare class ResearcherAgent extends BaseAgent {
    /** File type patterns for analysis */
    private readonly codePatterns;
    /** Documentation patterns */
    private readonly docPatterns;
    /** Knowledge graph reference */
    private knowledgeGraph;
    constructor(config: Partial<ResearcherAgentConfig> & {
        name: string;
    });
    /**
     * Set knowledge graph for context-aware research
     */
    setKnowledgeGraph(graph: KnowledgeGraphManager): void;
    /**
     * Execute research task
     */
    protected executeTask(task: AgentTask): Promise<AgentResult<ResearchResultData>>;
    /**
     * Perform research based on query
     */
    research(query: ResearchQuery, projectRoot: string): Promise<ResearchResultData>;
    /**
     * Analyze patterns in the codebase
     */
    analyzePatterns(query: string, projectRoot: string): Promise<DetectedPattern[]>;
    /**
     * Find references across the codebase
     */
    findReferences(searchTerm: string, projectRoot: string, options?: {
        maxResults?: number;
        filePatterns?: string[];
    }): Promise<CodeReference[]>;
    /**
     * Summarize research findings
     */
    summarizeFindings(findings: ResearchFinding[]): string;
    /**
     * Get relevant nodes from knowledge graph
     */
    private getRelevantNodes;
    /**
     * Research from knowledge graph
     */
    private researchKnowledgeGraph;
    /**
     * Research from codebase
     */
    private researchCodebase;
    /**
     * Research from documentation
     */
    private researchDocumentation;
    /**
     * Detect code patterns
     */
    private detectCodePatterns;
    /**
     * Find files matching patterns
     */
    private findFiles;
    /**
     * Get context around a line
     */
    private getContext;
    /**
     * Calculate relevance of a match
     */
    private calculateRelevance;
    /**
     * Calculate node relevance
     */
    private calculateNodeRelevance;
    /**
     * Calculate content relevance
     */
    private calculateContentRelevance;
    /**
     * Extract title from documentation
     */
    private extractDocTitle;
    /**
     * Extract description from documentation
     */
    private extractDocDescription;
    /**
     * Generate summary from findings
     */
    private generateSummary;
    /**
     * Generate recommendations from research
     */
    private generateRecommendations;
}
//# sourceMappingURL=researcher-agent.d.ts.map