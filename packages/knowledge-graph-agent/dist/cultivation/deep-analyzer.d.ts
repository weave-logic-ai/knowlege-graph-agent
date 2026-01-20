/**
 * DeepAnalyzer - Documentation Cultivation & Knowledge Graph Enhancement
 *
 * Analyzes existing documentation to:
 * - Understand the vision and requirements described
 * - Identify documentation gaps and unclear areas
 * - Guide the documentation process with research questions
 * - Build knowledge graph connections
 *
 * This is NOT for code analysis - use analyze-codebase for that.
 *
 * @module cultivation/deep-analyzer
 */
import { ComplianceCheckResult, GapAnalysisResult } from '../sops/index.js';
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
    /** Maximum documents to analyze */
    maxDocuments?: number;
    /** Timeout for each analysis (ms) */
    agentTimeout?: number;
    /** Force use of API key even if CLI is available */
    forceApiKey?: boolean;
    /** Preferred provider when multiple are available */
    preferredProvider?: 'anthropic' | 'gemini';
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
    mode: 'cli' | 'anthropic' | 'gemini' | 'static';
    /** SOP compliance check result */
    sopCompliance?: ComplianceCheckResult;
    /** SOP gap analysis result */
    sopGaps?: GapAnalysisResult;
}
/**
 * DeepAnalyzer - Documentation cultivation with AI-powered analysis
 *
 * Reads existing markdown documentation and provides:
 * - Vision synthesis from requirements
 * - Gap analysis identifying missing documentation
 * - Research questions for unclear areas
 * - Knowledge graph connection suggestions
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
    private maxDocuments;
    private agentTimeout;
    private forceApiKey;
    private preferredProvider;
    constructor(options: DeepAnalyzerOptions);
    /**
     * Check if running inside a Claude Code session
     */
    private isInsideClaudeCode;
    /**
     * Check if Anthropic API key is available
     */
    private hasAnthropicApiKey;
    /**
     * Check if Google AI / Gemini API key is available
     */
    private hasGeminiApiKey;
    /**
     * Get the Gemini API key from available env vars
     */
    private getGeminiApiKey;
    /**
     * Check if Claude CLI is available
     */
    private isCliAvailable;
    /**
     * Determine the best execution mode
     */
    private detectExecutionMode;
    /**
     * Check if analysis is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get availability status with reason
     */
    getAvailabilityStatus(): Promise<{
        available: boolean;
        reason: string;
    }>;
    /**
     * Scan documentation directory for markdown files
     */
    private scanDocumentation;
    /**
     * Read full content of key documents
     */
    private readKeyDocuments;
    /**
     * Scan directory structure for MOC files and coverage
     */
    private scanDirectoryStructure;
    /**
     * Load previous analysis results for iteration tracking
     */
    private loadPreviousAnalysis;
    /**
     * Save analysis metadata for iteration tracking
     */
    private saveAnalysisMetadata;
    /**
     * Run deep analysis
     */
    analyze(): Promise<DeepAnalysisResult>;
    /**
     * Execute a single agent
     */
    private executeAgent;
    /**
     * Build directory coverage summary for prompts
     */
    private buildCoverageSummary;
    /**
     * Build context-aware prompt for documentation cultivation
     */
    private buildPrompt;
    /**
     * Run SOP compliance check against the documentation
     */
    private runSOPComplianceCheck;
    /**
     * Run SOP gap analysis on compliance results
     */
    private runSOPGapAnalysis;
    /**
     * Write SOP gaps summary to analysis output
     */
    private writeSOPGapsSummary;
    /**
     * Build SOP agent-specific instructions with gap context
     */
    private buildSOPAgentInstructions;
    /**
     * Run analysis using Claude CLI
     */
    private runWithCli;
    /**
     * Run analysis using Anthropic API directly
     */
    private runWithAnthropic;
    /**
     * Run analysis using Google Gemini API
     */
    private runWithGemini;
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