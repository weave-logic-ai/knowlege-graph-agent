/**
 * Vector Store Migration to AgentDB
 *
 * Provides utilities for migrating existing SQLite-based VectorStore
 * data to the high-performance AgentDB backend.
 *
 * Features:
 * - Batch migration with progress tracking
 * - Post-migration validation
 * - Rollback support
 * - Parallel processing for large datasets
 *
 * @module integrations/agentic-flow/migration/migrate-to-agentdb
 */
/**
 * Migration options
 */
export interface MigrationOptions {
    /** Number of vectors to migrate per batch */
    batchSize: number;
    /** Callback for progress updates */
    onProgress?: (progress: MigrationProgress) => void;
    /** Validate data after migration */
    validateAfterMigration: boolean;
    /** Number of parallel batches (default: 1) */
    parallelBatches: number;
    /** Skip vectors that fail to migrate */
    skipOnError: boolean;
    /** Sample size for validation (percentage, 0-100) */
    validationSampleSize: number;
    /** Dry run mode - validate without migrating */
    dryRun: boolean;
}
/**
 * Migration progress information
 */
export interface MigrationProgress {
    /** Total vectors to migrate */
    total: number;
    /** Successfully migrated vectors */
    migrated: number;
    /** Failed migrations */
    failed: number;
    /** Skipped vectors */
    skipped: number;
    /** Progress percentage (0-100) */
    percentage: number;
    /** Estimated time remaining in milliseconds */
    estimatedTimeRemaining: number;
    /** Current migration rate (vectors/second) */
    rate: number;
    /** Current batch number */
    currentBatch: number;
    /** Total batches */
    totalBatches: number;
    /** Current phase */
    phase: 'preparing' | 'migrating' | 'validating' | 'complete';
}
/**
 * Migration result
 */
export interface MigrationResult {
    /** Whether migration completed successfully */
    success: boolean;
    /** Total vectors migrated */
    totalMigrated: number;
    /** Total vectors that failed to migrate */
    totalFailed: number;
    /** Total vectors skipped */
    totalSkipped: number;
    /** Migration duration in milliseconds */
    duration: number;
    /** Error messages */
    errors: string[];
    /** Validation results if performed */
    validation?: ValidationResult;
    /** Summary statistics */
    stats: MigrationStats;
}
/**
 * Migration statistics
 */
export interface MigrationStats {
    /** Average migration rate (vectors/second) */
    avgRate: number;
    /** Peak migration rate (vectors/second) */
    peakRate: number;
    /** Source vector count */
    sourceCount: number;
    /** Target vector count */
    targetCount: number;
    /** Data integrity check result */
    integrityValid: boolean;
}
/**
 * Validation result
 */
export interface ValidationResult {
    /** Whether validation passed */
    valid: boolean;
    /** Number of vectors validated */
    samplesChecked: number;
    /** Number of mismatches found */
    mismatches: number;
    /** Validation errors */
    errors: string[];
    /** Average similarity score of validated vectors */
    avgSimilarity: number;
}
/**
 * Vector entry for migration
 */
export interface VectorEntry {
    nodeId: string;
    content: string;
    embedding: Float32Array;
    metadata: Record<string, unknown>;
}
/**
 * Interface for source vector store (compatible with EnhancedVectorStore)
 */
export interface ISourceVectorStore {
    getAllIds(): string[];
    get(id: string): Promise<{
        id: string;
        vector: number[];
        metadata: Record<string, unknown>;
    } | null>;
    getStats?(): {
        totalVectors: number;
    };
    search?(query: {
        vector: number[];
        k?: number;
        minScore?: number;
    }): Promise<Array<{
        id: string;
        score: number;
        metadata: Record<string, unknown>;
    }>>;
}
/**
 * Interface for target vector store (compatible with AgentDBVectorStore)
 */
export interface ITargetVectorStore {
    upsertBatch(entries: Array<{
        nodeId: string;
        content: string;
        embedding: Float32Array;
        metadata?: Record<string, unknown>;
    }>): Promise<void>;
    search(queryEmbedding: Float32Array, limit?: number, threshold?: number): Promise<Array<{
        nodeId: string;
        content: string;
        similarity: number;
        metadata: Record<string, unknown>;
    }>>;
    getStats(): Promise<{
        totalVectors: number;
        indexSize: number;
        cacheHitRate: number;
    }>;
}
/**
 * Vector Store Migration class
 *
 * Handles the migration of vectors from a source VectorStore
 * (SQLite-based) to AgentDB with progress tracking, validation,
 * and error handling.
 *
 * @example
 * ```typescript
 * const migration = new VectorStoreMigration();
 *
 * const result = await migration.migrate(sourceStore, targetStore, {
 *   batchSize: 100,
 *   validateAfterMigration: true,
 *   onProgress: (progress) => {
 *     console.log(`${progress.percentage}% complete`);
 *   },
 * });
 *
 * if (result.success) {
 *   console.log(`Migrated ${result.totalMigrated} vectors`);
 * }
 * ```
 */
export declare class VectorStoreMigration {
    private startTime;
    private rateHistory;
    /**
     * Log a message
     */
    private log;
    /**
     * Migrate vectors from source to target store
     *
     * @param source - Source VectorStore (SQLite-based)
     * @param target - Target AgentDBVectorStore
     * @param options - Migration options
     * @returns Migration result
     */
    migrate(source: ISourceVectorStore, target: ITargetVectorStore, options?: Partial<MigrationOptions>): Promise<MigrationResult>;
    /**
     * Validate migration by comparing samples between source and target
     */
    private validateMigration;
    /**
     * Calculate migration statistics
     */
    private calculateStats;
    /**
     * Report progress to callback
     */
    private reportProgress;
    /**
     * Get random sample from array
     */
    private randomSample;
}
/**
 * Convenience function for migrating from SQLite to AgentDB
 *
 * @param source - Source VectorStore
 * @param target - Target AgentDBVectorStore
 * @param options - Migration options
 * @returns Migration result
 */
export declare function migrateToAgentDB(source: ISourceVectorStore, target: ITargetVectorStore, options?: Partial<MigrationOptions>): Promise<MigrationResult>;
/**
 * Create a migration plan without executing
 *
 * @param source - Source VectorStore
 * @returns Migration plan details
 */
export declare function createMigrationPlan(source: ISourceVectorStore): Promise<{
    totalVectors: number;
    estimatedDuration: number;
    estimatedBatches: number;
    recommendations: string[];
}>;
//# sourceMappingURL=migrate-to-agentdb.d.ts.map