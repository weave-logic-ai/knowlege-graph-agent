/**
 * Migration Orchestrator - Implements Analysis Recommendations
 *
 * Uses claude-flow swarms to implement suggestions from cultivation analysis:
 * - Fill documentation gaps identified by Gap Analyst
 * - Answer research questions with specialized agents
 * - Build knowledge graph connections
 * - Create missing MOC files and documentation
 *
 * @module cultivation/migration-orchestrator
 */
/**
 * Parsed gap from analysis
 */
interface DocumentationGap {
    section: string;
    description: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    relatedDocs: string[];
}
/**
 * Parsed research question from analysis
 */
interface ResearchQuestion {
    question: string;
    context: string;
    importance: string;
    suggestedResources: string[];
    category: string;
}
/**
 * Parsed connection suggestion from analysis
 */
interface ConnectionSuggestion {
    source: string;
    target: string;
    relationship: string;
    reason: string;
}
/**
 * Parsed analysis results
 */
interface ParsedAnalysis {
    vision: {
        purpose: string;
        goals: string[];
        recommendations: string[];
    };
    gaps: DocumentationGap[];
    questions: ResearchQuestion[];
    connections: ConnectionSuggestion[];
}
/**
 * Migration result
 */
interface MigrationResult {
    success: boolean;
    agentsUsed: number;
    documentsCreated: number;
    documentsUpdated: number;
    connectionsAdded: number;
    questionsAnswered: number;
    gapsFilled: number;
    errors: string[];
    warnings: string[];
    duration: number;
}
/**
 * Orchestrator options
 */
interface OrchestratorOptions {
    projectRoot: string;
    docsPath: string;
    analysisDir: string;
    verbose?: boolean;
    dryRun?: boolean;
    useVectorSearch?: boolean;
    maxAgents?: number;
}
/**
 * Orchestrates the migration from analysis to implemented documentation
 */
export declare class MigrationOrchestrator {
    private projectRoot;
    private docsPath;
    private analysisDir;
    private verbose;
    private dryRun;
    private useVectorSearch;
    private maxAgents;
    private geminiClient;
    constructor(options: OrchestratorOptions);
    /**
     * Check availability status
     */
    getAvailabilityStatus(): Promise<{
        available: boolean;
        reason: string;
    }>;
    /**
     * Run the migration process
     */
    migrate(): Promise<MigrationResult>;
    /**
     * Parse all analysis files from the analysis directory
     */
    private parseAnalysisFiles;
    /**
     * Parse vision synthesis file
     */
    private parseVisionFile;
    /**
     * Parse documentation gaps file
     */
    private parseGapsFile;
    /**
     * Parse research questions file
     */
    private parseQuestionsFile;
    /**
     * Parse knowledge connections file
     */
    private parseConnectionsFile;
    /**
     * Load all documentation as context
     */
    private loadDocsContext;
    /**
     * Create migration agents based on analysis
     */
    private createMigrationAgents;
    /**
     * Build context for gap filler agent
     */
    private buildGapFillerContext;
    /**
     * Build context for researcher agent
     */
    private buildResearcherContext;
    /**
     * Build context for MOC builder agent
     */
    private buildMOCBuilderContext;
    /**
     * Build context for connector agent
     */
    private buildConnectorContext;
    /**
     * Build context for integrator agent
     */
    private buildIntegratorContext;
    /**
     * Execute a single migration agent
     */
    private executeAgent;
    /**
     * Build prompt for agent
     */
    private buildAgentPrompt;
    /**
     * Call AI (Gemini or fallback)
     */
    private callAI;
    /**
     * Process agent response and create/update documents
     */
    private processAgentResponse;
    /**
     * Add frontmatter to document if not present
     */
    private addFrontmatter;
    /**
     * Infer document type from path
     */
    private inferDocType;
    /**
     * Update MOC files with new connections
     */
    private updateMOCFiles;
    /**
     * Find relevant docs based on query
     */
    private findRelevantDocs;
    /**
     * Infer priority from description
     */
    private inferPriority;
    /**
     * Log message
     */
    private log;
}
export type { MigrationResult, OrchestratorOptions, ParsedAnalysis };
//# sourceMappingURL=migration-orchestrator.d.ts.map