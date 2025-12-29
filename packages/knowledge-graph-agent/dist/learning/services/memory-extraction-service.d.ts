/**
 * Memory Extraction Service
 *
 * Extracts different types of memories from completed task results
 * including episodic, procedural, semantic, technical, and context memories.
 *
 * @module learning/services/memory-extraction-service
 */
import { type ExtractedMemory, type TaskResult } from '../types.js';
/**
 * Configuration for memory extraction
 */
export interface MemoryExtractionConfig {
    /** Extract episodic memories */
    extractEpisodic: boolean;
    /** Extract procedural memories */
    extractProcedural: boolean;
    /** Extract semantic memories */
    extractSemantic: boolean;
    /** Extract technical memories */
    extractTechnical: boolean;
    /** Minimum confidence threshold */
    minConfidence: number;
    /** Maximum content length */
    maxContentLength: number;
    /** Include embeddings */
    generateEmbeddings: boolean;
}
/**
 * Memory Extraction Service
 *
 * Extracts structured memories from task execution results for
 * later retrieval and agent priming.
 *
 * @example
 * ```typescript
 * const extractor = new MemoryExtractionService();
 * const memories = await extractor.extractFromTask(taskResult);
 * console.log(`Extracted ${memories.length} memories`);
 * ```
 */
export declare class MemoryExtractionService {
    private config;
    constructor(config?: Partial<MemoryExtractionConfig>);
    /**
     * Extract all memory types from a task result
     */
    extractFromTask(taskResult: TaskResult): Promise<ExtractedMemory[]>;
    /**
     * Extract episodic memory - what happened during task execution
     */
    private extractEpisodic;
    /**
     * Extract procedural memory - how the task was executed
     */
    private extractProcedural;
    /**
     * Extract semantic memories - concepts and facts learned
     */
    private extractSemantic;
    /**
     * Extract technical memories - code patterns and solutions
     */
    private extractTechnical;
    /**
     * Extract context memory - environmental information
     */
    private extractContext;
    private createTaskSummary;
    private buildProcedure;
    private buildContextSummary;
    private extractConcepts;
    private extractFacts;
    private identifyPatterns;
    private extractTaskTags;
    private extractActionTags;
    private calculateEpisodicConfidence;
    private calculateProceduralConfidence;
    private formatDuration;
    private truncateContent;
    private groupByType;
}
/**
 * Create a memory extraction service instance
 */
export declare function createMemoryExtractionService(config?: Partial<MemoryExtractionConfig>): MemoryExtractionService;
//# sourceMappingURL=memory-extraction-service.d.ts.map