/**
 * Seed Generator - Bootstrap knowledge graph with primitive nodes from codebase analysis
 *
 * Analyzes:
 * - package.json (Node.js dependencies)
 * - composer.json (PHP dependencies)
 * - requirements.txt / pyproject.toml (Python)
 * - Cargo.toml (Rust)
 * - go.mod (Go)
 * - pom.xml / build.gradle (Java)
 * - Existing vault documents
 * - Service configurations
 * - Deployment manifests
 *
 * @module cultivation/seed-generator
 */
import type { VaultContext, SeedAnalysis, GeneratedDocument, CultivationOptions, InitPrimitivesResult } from './types.js';
/**
 * SeedGenerator class for analyzing codebases and generating primitive nodes
 */
export declare class SeedGenerator {
    private vaultContext;
    private projectRoot;
    private startTime;
    private filesScanned;
    constructor(vaultContext: VaultContext, projectRoot: string);
    /**
     * Create a SeedGenerator from project paths
     */
    static create(projectRoot: string, docsPath: string): Promise<SeedGenerator>;
    /**
     * Collect all markdown files in vault
     */
    private static collectVaultFiles;
    /**
     * Analyze entire codebase and generate seed data
     */
    analyze(): Promise<SeedAnalysis>;
    /**
     * Generate primitive nodes from seed analysis
     */
    generatePrimitives(analysis: SeedAnalysis): Promise<GeneratedDocument[]>;
    /**
     * Write generated documents to disk
     */
    writePrimitives(documents: GeneratedDocument[]): Promise<InitPrimitivesResult>;
    /**
     * Full init-primitives workflow
     */
    initPrimitives(options?: CultivationOptions): Promise<InitPrimitivesResult>;
    private analyzeDependencies;
    private analyzePackageJson;
    private analyzePython;
    private analyzeComposer;
    private analyzeCargo;
    private analyzeGoMod;
    private analyzeJava;
    private createDependencyInfo;
    private analyzeVaultDocuments;
    private analyzeServices;
    private extractPorts;
    private analyzeDeployments;
    private classifyDependencies;
    private inferDependencyType;
    private inferCategory;
    private getDocumentationLinks;
    private getRepositoryUrl;
    private inferServiceType;
    private shouldGenerateNode;
    private generateFrameworkNode;
    private generateDependencyNode;
    private generateServiceNode;
    private generateLanguageNode;
    private buildFrameworkContent;
    private buildDependencyContent;
    private buildServiceContent;
    private buildLanguageContent;
    private findRelatedTechnologies;
    private formatTitle;
    private slugify;
    private getLinkText;
    private getLanguageDocUrl;
}
/**
 * Create and run a seed analysis
 */
export declare function analyzeSeed(projectRoot: string, docsPath: string): Promise<SeedAnalysis>;
/**
 * Initialize primitives from codebase analysis
 */
export declare function initPrimitives(projectRoot: string, docsPath: string, options?: CultivationOptions): Promise<InitPrimitivesResult>;
//# sourceMappingURL=seed-generator.d.ts.map