/**
 * Knowledge Graph Generator
 *
 * Scans documentation and generates a knowledge graph from markdown files.
 */
import type { GeneratorOptions } from '../core/types.js';
import { KnowledgeGraphManager } from '../core/graph.js';
/**
 * Generate knowledge graph from docs directory
 */
export declare function generateGraph(options: GeneratorOptions): Promise<{
    graph: KnowledgeGraphManager;
    stats: {
        filesScanned: number;
        nodesCreated: number;
        edgesCreated: number;
        errors: string[];
    };
}>;
/**
 * Generate graph and save to database
 */
export declare function generateAndSave(options: GeneratorOptions, dbPath: string): Promise<{
    success: boolean;
    stats: {
        filesScanned: number;
        nodesCreated: number;
        edgesCreated: number;
        errors: string[];
    };
}>;
/**
 * Generate graph from existing database (incremental update)
 */
export declare function updateGraph(dbPath: string, docsRoot: string): Promise<{
    added: number;
    updated: number;
    removed: number;
    errors: string[];
}>;
//# sourceMappingURL=graph-generator.d.ts.map