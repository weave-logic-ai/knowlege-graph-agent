/**
 * SPARC Planner
 *
 * Main orchestrator for creating comprehensive SPARC plans.
 * Reads and analyzes documentation to build real development plans.
 *
 * @module sparc/sparc-planner
 */
import { DecisionLogManager } from './decision-log.js';
import type { SPARCPlan } from './types.js';
/**
 * Parsed documentation file
 */
interface ParsedDoc {
    path: string;
    filename: string;
    title: string;
    content: string;
    frontmatter: Record<string, unknown>;
    headings: Array<{
        level: number;
        text: string;
        line: number;
    }>;
    sections: Array<{
        heading: string;
        content: string;
        level: number;
    }>;
    codeBlocks: Array<{
        language: string;
        code: string;
    }>;
    links: string[];
    type: 'feature' | 'requirement' | 'architecture' | 'api' | 'guide' | 'spec' | 'unknown';
}
/**
 * Planner options
 */
export interface SPARCPlannerOptions {
    /** Project root path */
    projectRoot: string;
    /** Output directory for plan artifacts */
    outputDir?: string;
    /** Plan name */
    name: string;
    /** Plan description */
    description: string;
    /** Docs directory to analyze */
    docsDir?: string;
    /** Enable parallel research */
    parallelResearch?: boolean;
    /** Number of review passes */
    reviewPasses?: number;
    /** Auto-build consensus for low confidence */
    autoConsensus?: boolean;
    /** Knowledge graph integration */
    kgEnabled?: boolean;
    /** Vector database integration */
    vectorEnabled?: boolean;
}
/**
 * SPARC Planner
 *
 * Orchestrates the full SPARC planning process by reading and analyzing documentation.
 */
export declare class SPARCPlanner {
    private readonly options;
    private plan;
    private decisionLog;
    private consensusBuilder;
    private parsedDocs;
    constructor(options: SPARCPlannerOptions);
    /**
     * Initialize a new plan
     */
    private initializePlan;
    /**
     * Execute the full planning process
     */
    executePlanning(): Promise<SPARCPlan>;
    /**
     * Execute research phase - read and parse all documentation
     */
    private executeResearchPhase;
    /**
     * Read all documentation files from a directory
     */
    private readDocsDirectory;
    /**
     * Parse a markdown documentation file
     */
    private parseDocFile;
    /**
     * Extract headings from markdown content
     */
    private extractHeadings;
    /**
     * Extract sections from markdown content based on headings
     */
    private extractSections;
    /**
     * Extract code blocks from markdown
     */
    private extractCodeBlocks;
    /**
     * Extract links from markdown
     */
    private extractLinks;
    /**
     * Classify document type based on content and path
     */
    private classifyDocument;
    /**
     * Create a research finding from a parsed document
     */
    private createFindingFromDoc;
    /**
     * Summarize document content
     */
    private summarizeDocContent;
    /**
     * Execute specification phase - extract requirements and features from docs
     */
    private executeSpecificationPhase;
    /**
     * Extract requirements from documentation
     */
    private extractRequirementsFromDocs;
    /**
     * Extract bullet point requirements from content
     */
    private extractBulletRequirements;
    /**
     * Create a requirement object
     */
    private createRequirement;
    /**
     * Extract acceptance criteria from text
     */
    private extractAcceptanceCriteria;
    /**
     * Infer priority from text
     */
    private inferPriority;
    /**
     * Extract features from documentation
     */
    private extractFeaturesFromDocs;
    /**
     * Create a feature from a document
     */
    private createFeatureFromDoc;
    /**
     * Extract user stories from text
     */
    private extractUserStories;
    /**
     * Infer complexity from content
     */
    private inferComplexity;
    /**
     * Extract dependencies from document links
     */
    private extractDependencies;
    /**
     * Extract problem statement from docs
     */
    private extractProblemStatement;
    /**
     * Extract goals from docs
     */
    private extractGoals;
    /**
     * Extract constraints from docs
     */
    private extractConstraints;
    /**
     * Extract assumptions from docs
     */
    private extractAssumptions;
    /**
     * Extract success metrics from docs
     */
    private extractSuccessMetrics;
    /**
     * Execute pseudocode phase
     */
    private executePseudocodePhase;
    /**
     * Create algorithm design from document
     */
    private createAlgorithmFromDoc;
    /**
     * Execute architecture phase
     */
    private executeArchitecturePhase;
    /**
     * Extract components from documentation
     */
    private extractComponentsFromDocs;
    /**
     * Infer component type
     */
    private inferComponentType;
    /**
     * Extract responsibilities from content
     */
    private extractResponsibilities;
    /**
     * Extract technologies mentioned
     */
    private extractTechnologies;
    /**
     * Extract patterns from documentation
     */
    private extractPatternsFromDocs;
    /**
     * Extract architecture overview
     */
    private extractArchitectureOverview;
    /**
     * Extract data flow description
     */
    private extractDataFlow;
    /**
     * Extract security considerations
     */
    private extractSecurityConsiderations;
    /**
     * Execute refinement phase - generate development tasks
     */
    private executeRefinementPhase;
    /**
     * Create a SPARC task
     */
    private createTask;
    /**
     * Map complexity to priority
     */
    private mapComplexityToPriority;
    /**
     * Map requirement priority to task priority
     */
    private mapPriorityToTaskPriority;
    /**
     * Estimate design hours based on complexity
     */
    private estimateDesignHours;
    /**
     * Estimate implementation hours based on complexity
     */
    private estimateImplementationHours;
    /**
     * Estimate test hours based on complexity
     */
    private estimateTestHours;
    /**
     * Calculate parallel task groups
     */
    private calculateParallelGroups;
    /**
     * Calculate critical path
     */
    private calculateCriticalPath;
    /**
     * Analyze existing code in src directory
     */
    private analyzeExistingCode;
    /**
     * Execute review phase
     */
    private executeReviewPhase;
    /**
     * Add a decision to the log
     */
    private addDecision;
    /**
     * Update plan statistics
     */
    private updateStatistics;
    /**
     * Save plan to disk
     */
    savePlan(): void;
    /**
     * Generate markdown summary
     */
    private generateMarkdownSummary;
    /**
     * Get the current plan
     */
    getPlan(): SPARCPlan;
    /**
     * Get decision log manager
     */
    getDecisionLog(): DecisionLogManager;
    /**
     * Get parsed documentation
     */
    getParsedDocs(): ParsedDoc[];
}
/**
 * Create a SPARC planner
 */
export declare function createSPARCPlanner(options: SPARCPlannerOptions): SPARCPlanner;
export {};
//# sourceMappingURL=sparc-planner.d.ts.map