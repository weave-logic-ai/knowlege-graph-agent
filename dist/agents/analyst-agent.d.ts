/**
 * Analyst Agent
 *
 * Specialized agent for code analysis, metrics calculation, and quality assessment.
 * Extends BaseAgent with static analysis capabilities and knowledge graph integration.
 *
 * @module agents/analyst-agent
 */
import { BaseAgent } from './base-agent.js';
import { type AgentTask, type AgentResult, type AnalystAgentConfig } from './types.js';
import { KnowledgeGraphManager } from '../core/graph.js';
/**
 * Analysis type
 */
export type AnalysisType = 'code' | 'data' | 'performance' | 'security' | 'quality';
/**
 * Code metrics
 */
export interface CodeMetrics {
    /** Total lines of code */
    totalLines: number;
    /** Lines of code (excluding comments/blanks) */
    linesOfCode: number;
    /** Comment lines */
    commentLines: number;
    /** Blank lines */
    blankLines: number;
    /** Number of files */
    fileCount: number;
    /** Number of functions */
    functionCount: number;
    /** Number of classes */
    classCount: number;
    /** Average function length */
    avgFunctionLength: number;
    /** Maximum function length */
    maxFunctionLength: number;
    /** Cyclomatic complexity */
    cyclomaticComplexity: number;
    /** Cognitive complexity */
    cognitiveComplexity: number;
    /** Maintainability index (0-100) */
    maintainabilityIndex: number;
    /** Technical debt estimate (hours) */
    technicalDebt: number;
}
/**
 * Quality issue
 */
export interface QualityIssue {
    /** Issue type/category */
    type: string;
    /** Severity level */
    severity: 'info' | 'warning' | 'error' | 'critical';
    /** Issue message */
    message: string;
    /** File path */
    file?: string;
    /** Line number */
    line?: number;
    /** Column number */
    column?: number;
    /** Rule that triggered the issue */
    rule?: string;
    /** Suggested fix */
    suggestion?: string;
}
/**
 * Quality assessment result
 */
export interface QualityAssessment {
    /** Overall quality score (0-100) */
    score: number;
    /** Quality grade (A-F) */
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    /** Code metrics */
    metrics: CodeMetrics;
    /** Issues found */
    issues: QualityIssue[];
    /** Recommendations */
    recommendations: string[];
    /** Analysis timestamp */
    timestamp: Date;
}
/**
 * File analysis result
 */
export interface FileAnalysis {
    /** File path */
    path: string;
    /** File type */
    type: string;
    /** Lines of code */
    linesOfCode: number;
    /** Complexity score */
    complexity: number;
    /** Issues in this file */
    issues: QualityIssue[];
    /** Dependencies */
    dependencies: string[];
    /** Exports */
    exports: string[];
}
/**
 * Project analysis result
 */
export interface ProjectAnalysis {
    /** Project name */
    name: string;
    /** Root path */
    rootPath: string;
    /** Overall quality assessment */
    quality: QualityAssessment;
    /** Per-file analysis */
    files: FileAnalysis[];
    /** Dependency analysis */
    dependencies: {
        internal: string[];
        external: string[];
        unused: string[];
        missing: string[];
    };
    /** Hotspots (complex/problematic areas) */
    hotspots: Array<{
        file: string;
        reason: string;
        severity: 'low' | 'medium' | 'high';
    }>;
}
/**
 * Analyst task type
 */
export type AnalystTaskType = 'analyze' | 'metrics' | 'quality' | 'issues';
/**
 * Analyst Agent
 *
 * Capabilities:
 * - Code analysis and metrics calculation
 * - Quality assessment and scoring
 * - Issue detection and reporting
 * - Dependency analysis
 *
 * @example
 * ```typescript
 * const analyst = new AnalystAgent({
 *   name: 'analyst-agent',
 *   type: AgentType.ANALYST,
 *   analysisType: 'quality',
 * });
 *
 * const result = await analyst.execute({
 *   id: 'task-1',
 *   description: 'Analyze project quality',
 *   priority: TaskPriority.MEDIUM,
 *   input: {
 *     data: {
 *       projectRoot: '/path/to/project',
 *       analysisType: 'quality'
 *     }
 *   },
 *   createdAt: new Date()
 * });
 * ```
 */
export declare class AnalystAgent extends BaseAgent {
    /** File patterns to analyze */
    private readonly codePatterns;
    /** Knowledge graph reference */
    private knowledgeGraph;
    constructor(config: Partial<AnalystAgentConfig> & {
        name: string;
    });
    /**
     * Set knowledge graph for context-aware analysis
     */
    setKnowledgeGraph(graph: KnowledgeGraphManager): void;
    /**
     * Execute analyst task
     */
    protected executeTask(task: AgentTask): Promise<AgentResult>;
    /**
     * Analyze code and generate metrics
     */
    analyzeCode(code: string, filePath: string): Promise<FileAnalysis>;
    /**
     * Calculate code metrics
     *
     * @remarks Renamed from calculateMetrics to avoid conflict with BaseAgent private method
     */
    calculateCodeMetrics(code: string): Promise<CodeMetrics>;
    /**
     * Assess code quality
     */
    assessQuality(code: string, filePath: string): Promise<QualityAssessment>;
    /**
     * Find issues in code
     */
    findIssues(code: string, filePath: string): QualityIssue[];
    /**
     * Analyze entire project
     */
    analyzeProject(projectRoot: string): Promise<ProjectAnalysis>;
    private handleAnalyzeTask;
    private handleMetricsTask;
    private handleQualityTask;
    private handleIssuesTask;
    private countCommentLines;
    private countFunctions;
    private countClasses;
    private calculateAverageFunctionLength;
    private calculateMaxFunctionLength;
    private calculateCyclomaticComplexity;
    private calculateCognitiveComplexity;
    private estimateTechnicalDebt;
    private findComplexityIssues;
    private findStyleIssues;
    private findSecurityIssues;
    private findMaintainabilityIssues;
    private calculateQualityScore;
    private scoreToGrade;
    private generateRecommendations;
    private createEmptyMetrics;
    private aggregateMetrics;
    private extractDependencies;
    private extractExports;
    private identifyHotspots;
    private analyzeDependencies;
    private findFiles;
}
//# sourceMappingURL=analyst-agent.d.ts.map