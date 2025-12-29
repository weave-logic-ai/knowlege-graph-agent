/**
 * DeepAnalyzer - Claude-Flow Integration for Deep Codebase Analysis
 *
 * Uses claude-flow agents for comprehensive codebase analysis:
 * - Pattern detection and architectural insights
 * - Documentation gap analysis
 * - Standards compliance checking
 *
 * @module cultivation/deep-analyzer
 */
/**
 * Deep analyzer options
 */
export interface DeepAnalyzerOptions {
    /** Project root directory */
    projectRoot: string;
    /** Documentation path (relative to project root) */
    docsPath?: string;
    /** Output directory for analysis results */
    outputDir?: string;
    /** Enable verbose logging */
    verbose?: boolean;
    /** Maximum agents to spawn */
    maxAgents?: number;
    /** Agent execution mode */
    agentMode?: 'sequential' | 'parallel' | 'adaptive';
    /** Timeout for each agent (ms) */
    agentTimeout?: number;
}
/**
 * Analysis result from an agent
 */
export interface AgentResult {
    name: string;
    type: string;
    success: boolean;
    insights: string[];
    documents: Array<{
        path: string;
        title: string;
    }>;
    duration: number;
    error?: string;
}
/**
 * Deep analysis result
 */
export interface DeepAnalysisResult {
    success: boolean;
    agentsSpawned: number;
    insightsCount: number;
    documentsCreated: number;
    results: AgentResult[];
    duration: number;
    errors: string[];
}
/**
 * DeepAnalyzer - Uses claude-flow for deep codebase analysis
 *
 * @example
 * ```typescript
 * const analyzer = new DeepAnalyzer({
 *   projectRoot: '/my/project',
 *   docsPath: 'docs',
 * });
 *
 * const result = await analyzer.analyze();
 * console.log(`Generated ${result.insightsCount} insights`);
 * ```
 */
export declare class DeepAnalyzer {
    private projectRoot;
    private docsPath;
    private outputDir;
    private verbose;
    private maxAgents;
    private agentMode;
    private agentTimeout;
    constructor(options: DeepAnalyzerOptions);
    /**
     * Check if claude-flow is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Run deep analysis
     */
    analyze(): Promise<DeepAnalysisResult>;
    /**
     * Execute agents in parallel
     */
    private executeParallel;
    /**
     * Execute agents sequentially
     */
    private executeSequential;
    /**
     * Execute agents adaptively (start with 2, scale based on success)
     */
    private executeAdaptive;
    /**
     * Execute a single agent
     */
    private executeAgent;
    /**
     * Build prompt for agent
     */
    private buildPrompt;
    /**
     * Run claude-flow agent
     */
    private runClaudeFlowAgent;
    /**
     * Extract insights from agent output
     */
    private extractInsights;
    /**
     * Format output for documentation
     */
    private formatOutput;
}
/**
 * Create a deep analyzer instance
 */
export declare function createDeepAnalyzer(options: DeepAnalyzerOptions): DeepAnalyzer;
/**
 * Run deep analysis on a project
 */
export declare function analyzeDeep(projectRoot: string, docsPath?: string): Promise<DeepAnalysisResult>;
//# sourceMappingURL=deep-analyzer.d.ts.map