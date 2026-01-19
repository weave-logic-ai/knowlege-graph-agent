/**
 * Documentation Cultivator
 *
 * Long-running swarm-based process that recursively analyzes and builds out
 * all documentation, creates development plans, and integrates SOPs.
 *
 * Uses claude-flow swarm orchestration to systematically:
 * - Research and analyze existing docs
 * - Fill documentation gaps
 * - Create phased development plans
 * - Generate deployment/infrastructure plans
 * - Integrate SOP compliance
 *
 * @module generators/doc-cultivator
 */
/**
 * Cultivation options
 */
export interface CultivationOptions {
    /** Run in background mode */
    background?: boolean;
    /** Verbose output */
    verbose?: boolean;
    /** Dry run - show plan without executing */
    dryRun?: boolean;
    /** Force regenerate all docs */
    force?: boolean;
    /** Include SOP compliance analysis */
    includeSops?: boolean;
    /** Generate development plan */
    generateDevPlan?: boolean;
    /** Generate deployment/infrastructure plan */
    generateInfraPlan?: boolean;
    /** Custom service directories to analyze */
    services?: string[];
    /** Maximum concurrent agents */
    maxAgents?: number;
    /** Output file for background mode */
    outputFile?: string;
}
/**
 * Service analysis result
 */
export interface ServiceAnalysis {
    name: string;
    path: string;
    type: 'frontend' | 'backend' | 'api' | 'admin' | 'shared' | 'unknown';
    languages: string[];
    frameworks: string[];
    existingDocs: string[];
    sourceFiles: string[];
    dependencies: string[];
    description: string;
}
/**
 * Development phase
 */
export interface DevelopmentPhase {
    id: string;
    name: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedEffort: string;
    dependencies: string[];
    services: string[];
    tasks: DevelopmentTask[];
    deliverables: string[];
}
/**
 * Development task
 */
export interface DevelopmentTask {
    id: string;
    title: string;
    description: string;
    service: string;
    type: 'feature' | 'infrastructure' | 'documentation' | 'testing' | 'deployment';
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedEffort: string;
    dependencies: string[];
    acceptance: string[];
}
/**
 * Cultivation result
 */
export interface CultivationResult {
    success: boolean;
    projectRoot: string;
    docsPath: string;
    startTime: Date;
    endTime?: Date;
    services: ServiceAnalysis[];
    documentsGenerated: string[];
    documentsUpdated: string[];
    developmentPlan?: {
        phases: DevelopmentPhase[];
        totalEstimate: string;
        criticalPath: string[];
    };
    infrastructurePlan?: {
        environments: string[];
        services: Record<string, string>;
        deployment: string;
    };
    sopCompliance?: {
        score: number;
        gaps: string[];
        recommendations: string[];
    };
    errors: string[];
    logs: string[];
}
/**
 * Main cultivation function
 */
export declare function cultivateDocs(projectRoot: string, docsPath: string, options?: CultivationOptions): Promise<CultivationResult>;
//# sourceMappingURL=doc-cultivator.d.ts.map