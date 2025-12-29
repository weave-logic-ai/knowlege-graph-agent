/**
 * Reviewer Agent
 *
 * Specialized agent for code review, security auditing, performance analysis,
 * and best practices validation. Extends BaseAgent with review-specific capabilities.
 *
 * @module agents/reviewer-agent
 */
import { BaseAgent } from './base-agent.js';
import { AgentType, type AgentTask, type AgentResult, type AgentConfig } from './types.js';
/**
 * Reviewer agent configuration
 */
export interface ReviewerAgentConfig extends AgentConfig {
    type: AgentType.REVIEWER;
    /** Default severity threshold for issues */
    severityThreshold?: ReviewSeverity;
    /** Enable security scanning */
    enableSecurityAudit?: boolean;
    /** Enable performance analysis */
    enablePerformanceAnalysis?: boolean;
    /** Custom rules file path */
    customRulesPath?: string;
}
/**
 * Review context for code analysis
 */
export interface ReviewContext {
    /** File path being reviewed */
    filePath: string;
    /** Programming language */
    language: string;
    /** Project context or description */
    projectContext?: string;
    /** File content (if already loaded) */
    content?: string;
    /** Specific line range to review */
    lineRange?: {
        start: number;
        end: number;
    };
}
/**
 * Issue severity levels
 */
export type ReviewSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
/**
 * Issue category types
 */
export type ReviewCategory = 'bug' | 'security' | 'performance' | 'style' | 'documentation' | 'maintainability';
/**
 * Individual review issue
 */
export interface ReviewIssue {
    /** Severity level */
    severity: ReviewSeverity;
    /** Issue category */
    category: ReviewCategory;
    /** Line number where issue occurs */
    line: number;
    /** Column number (optional) */
    column?: number;
    /** Issue description */
    message: string;
    /** Suggested fix */
    suggestion?: string;
    /** Rule ID that triggered this issue */
    ruleId?: string;
    /** Code snippet showing the issue */
    codeSnippet?: string;
}
/**
 * Code review result
 */
export interface CodeReviewResult {
    /** Overall summary of the review */
    summary: string;
    /** List of issues found */
    issues: ReviewIssue[];
    /** General suggestions for improvement */
    suggestions: string[];
    /** Code quality metrics */
    metrics: {
        /** Cyclomatic complexity score */
        complexity: number;
        /** Maintainability index (0-100) */
        maintainability: number;
        /** Testability score (0-100) */
        testability: number;
        /** Lines of code */
        linesOfCode: number;
        /** Comment ratio */
        commentRatio: number;
    };
    /** Files reviewed */
    filesReviewed: string[];
    /** Total issues by severity */
    issueCounts: Record<ReviewSeverity, number>;
}
/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
    /** Vulnerability type */
    type: string;
    /** Severity level */
    severity: ReviewSeverity;
    /** Location in code */
    location: string;
    /** Line number */
    line?: number;
    /** Detailed description */
    description: string;
    /** CVE reference if applicable */
    cveReference?: string;
    /** Recommended remediation steps */
    remediation: string;
    /** Confidence level (0-1) */
    confidence: number;
}
/**
 * Security audit result
 */
export interface SecurityAuditResult {
    /** List of vulnerabilities found */
    vulnerabilities: SecurityVulnerability[];
    /** Overall security score (0-100) */
    score: number;
    /** Summary of findings */
    summary: string;
    /** Files audited */
    filesAudited: string[];
    /** Vulnerability counts by severity */
    vulnerabilityCounts: Record<ReviewSeverity, number>;
    /** Recommendations */
    recommendations: string[];
}
/**
 * Performance issue
 */
export interface PerformanceIssue {
    /** Issue type */
    type: string;
    /** Severity */
    severity: ReviewSeverity;
    /** Location */
    location: string;
    /** Line number */
    line?: number;
    /** Description */
    description: string;
    /** Optimization suggestion */
    suggestion: string;
    /** Estimated impact */
    impact: 'high' | 'medium' | 'low';
}
/**
 * Performance analysis result
 */
export interface PerformanceAnalysisResult {
    /** Performance issues found */
    issues: PerformanceIssue[];
    /** Overall performance score (0-100) */
    score: number;
    /** Summary */
    summary: string;
    /** Optimization opportunities */
    optimizations: string[];
    /** Estimated complexity */
    timeComplexity?: string;
    /** Space complexity estimate */
    spaceComplexity?: string;
}
/**
 * Best practices check result
 */
export interface BestPracticesResult {
    /** Passed checks */
    passed: string[];
    /** Failed checks */
    failed: Array<{
        rule: string;
        message: string;
        severity: ReviewSeverity;
        location?: string;
    }>;
    /** Overall compliance score (0-100) */
    score: number;
    /** Summary */
    summary: string;
    /** Standards validated against */
    standards: string;
}
/**
 * Review action types
 */
export type ReviewAction = 'code_review' | 'security_audit' | 'performance_analysis' | 'best_practices' | 'documentation_review';
/**
 * Reviewer Agent
 *
 * Capabilities:
 * - Code review and quality analysis
 * - Security vulnerability scanning
 * - Performance analysis and optimization suggestions
 * - Best practices validation
 * - Documentation review
 *
 * @example
 * ```typescript
 * const reviewer = new ReviewerAgent({
 *   name: 'code-reviewer',
 *   type: AgentType.REVIEWER,
 * });
 *
 * const result = await reviewer.execute({
 *   id: 'task-1',
 *   description: 'Review authentication module',
 *   priority: TaskPriority.HIGH,
 *   input: {
 *     data: {
 *       action: 'code_review',
 *       filePath: 'src/auth/login.ts',
 *       language: 'typescript',
 *     }
 *   },
 *   createdAt: new Date()
 * });
 * ```
 */
export declare class ReviewerAgent extends BaseAgent {
    /** Agent type */
    readonly agentType = AgentType.REVIEWER;
    /** Agent capabilities */
    readonly capabilities: string[];
    /** Security patterns to detect */
    private readonly securityPatterns;
    /** Performance anti-patterns */
    private readonly performancePatterns;
    /** Code quality rules */
    private readonly codeQualityRules;
    constructor(config: Partial<ReviewerAgentConfig> & {
        name: string;
    });
    /**
     * Execute review task
     */
    protected executeTask(task: AgentTask): Promise<AgentResult>;
    /**
     * Perform comprehensive code review
     */
    reviewCode(code: string, context: ReviewContext, additionalFiles?: string[]): Promise<CodeReviewResult>;
    /**
     * Perform security audit on files
     */
    securityAudit(files: string[]): Promise<SecurityAuditResult>;
    /**
     * Analyze code for performance issues
     */
    analyzePerformance(code: string): Promise<PerformanceAnalysisResult>;
    /**
     * Check code against best practices
     */
    checkBestPractices(code: string, standards: string): Promise<BestPracticesResult>;
    /**
     * Review documentation quality
     */
    reviewDocumentation(code: string, filePath: string): Promise<{
        score: number;
        issues: Array<{
            type: string;
            message: string;
            severity: ReviewSeverity;
        }>;
        suggestions: string[];
        coverage: {
            documented: number;
            total: number;
            percentage: number;
        };
    }>;
    /**
     * Read file content
     */
    private readFile;
    /**
     * Detect language from file extension
     */
    private detectLanguage;
    /**
     * Check code quality issues
     */
    private checkCodeQuality;
    /**
     * Check for security issues
     */
    private checkSecurityIssues;
    /**
     * Calculate code quality metrics
     */
    private calculateCodeMetrics;
    /**
     * Generate improvement suggestions
     */
    private generateSuggestions;
    /**
     * Generate review summary
     */
    private generateReviewSummary;
    /**
     * Generate security recommendations
     */
    private generateSecurityRecommendations;
    /**
     * Estimate time complexity
     */
    private estimateTimeComplexity;
    /**
     * Estimate space complexity
     */
    private estimateSpaceComplexity;
    /**
     * Generate optimization suggestions
     */
    private generateOptimizations;
    /**
     * Get best practice rules based on standards
     */
    private getBestPracticeRules;
}
//# sourceMappingURL=reviewer-agent.d.ts.map