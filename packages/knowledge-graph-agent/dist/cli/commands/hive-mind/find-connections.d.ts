/**
 * Hive Mind - Connection Finder
 *
 * Uses TF-IDF similarity to find potential connections between documents.
 * Suggests links for orphan files to reconnect the knowledge graph.
 *
 * SPEC-003: Hive Mind Reconnection Tools
 */
import { Command } from 'commander';
export interface FindConnectionsOptions {
    threshold?: string;
    suggest?: boolean;
    limit?: string;
    output?: string;
    json?: boolean;
    verbose?: boolean;
}
export interface SimilarityMatch {
    source: string;
    target: string;
    similarity: number;
    sharedTerms: string[];
}
export interface DocumentVector {
    file: string;
    terms: Map<string, number>;
    magnitude: number;
}
export interface ConnectionFinderResult {
    totalDocuments: number;
    suggestedConnections: SimilarityMatch[];
    orphanConnections: SimilarityMatch[];
    termCount: number;
    averageSimilarity: number;
}
export declare class ConnectionFinder {
    private documents;
    private documentVectors;
    private documentFrequency;
    private totalDocuments;
    /**
     * Build TF-IDF index from vault
     */
    buildIndex(vaultPath: string): Promise<void>;
    /**
     * Find similar documents to a source file
     */
    findSimilar(sourceFile: string, threshold?: number, limit?: number): SimilarityMatch[];
    /**
     * Calculate cosine similarity between two document vectors
     */
    private cosineSimilarity;
    /**
     * Find shared terms between two documents
     */
    private findSharedTerms;
    /**
     * Suggest connections for orphan files
     */
    suggestConnections(vaultPath: string, orphanFiles: string[], threshold?: number, limit?: number): Promise<SimilarityMatch[]>;
    /**
     * Find all potential connections above threshold
     */
    findAllConnections(vaultPath: string, threshold?: number, limit?: number): Promise<ConnectionFinderResult>;
    /**
     * Get index statistics
     */
    getStats(): {
        documents: number;
        terms: number;
    };
}
export declare function createFindConnectionsCommand(): Command;
export default createFindConnectionsCommand;
//# sourceMappingURL=find-connections.d.ts.map