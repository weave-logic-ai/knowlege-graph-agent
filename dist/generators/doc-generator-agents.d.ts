/**
 * Agent-Driven Document Generator
 *
 * Spawns expert agents from claude-flow to analyze existing code and
 * documentation, then generates appropriate documents for each directory.
 */
/**
 * Document generation context
 */
export interface GenerationContext {
    projectRoot: string;
    docsPath: string;
    projectName: string;
    languages: string[];
    frameworks: string[];
    existingDocs: string[];
    sourceFiles: string[];
}
/**
 * Generation result for a single document
 */
export interface GeneratedDoc {
    path: string;
    title: string;
    type: string;
    generated: boolean;
    error?: string;
}
/**
 * Overall generation result
 */
export interface AgentGenerationResult {
    success: boolean;
    documentsGenerated: GeneratedDoc[];
    agentsSpawned: number;
    errors: string[];
}
/**
 * Analyze project and generate documents using expert agents
 */
export declare function generateDocsWithAgents(projectRoot: string, docsPath: string, options?: {
    parallel?: boolean;
    dryRun?: boolean;
    verbose?: boolean;
}): Promise<AgentGenerationResult>;
//# sourceMappingURL=doc-generator-agents.d.ts.map