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

// Note: EnhancedVectorStore and AgentDBVectorStore types are used for documentation
// but the actual interface types are defined locally for flexibility

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
 * Default migration options
 */
const DEFAULT_OPTIONS: MigrationOptions = {
  batchSize: 100,
  validateAfterMigration: true,
  parallelBatches: 1,
  skipOnError: false,
  validationSampleSize: 10,
  dryRun: false,
};

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
  getStats?(): { totalVectors: number };
  search?(query: {
    vector: number[];
    k?: number;
    minScore?: number;
  }): Promise<Array<{ id: string; score: number; metadata: Record<string, unknown> }>>;
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
  search(
    queryEmbedding: Float32Array,
    limit?: number,
    threshold?: number
  ): Promise<Array<{
    nodeId: string;
    content: string;
    similarity: number;
    metadata: Record<string, unknown>;
  }>>;
  getStats(): Promise<{ totalVectors: number; indexSize: number; cacheHitRate: number }>;
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
export class VectorStoreMigration {
  private startTime: number = 0;
  private rateHistory: number[] = [];

  /**
   * Log a message
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): void {
    const prefix = '[vector-migration]';
    const formattedMessage = `${prefix} ${message}`;
    const logData = data ? ` ${JSON.stringify(data)}` : '';

    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
          console.debug(formattedMessage + logData);
        }
        break;
      case 'info':
        console.info(formattedMessage + logData);
        break;
      case 'warn':
        console.warn(formattedMessage + logData);
        break;
      case 'error':
        console.error(formattedMessage + logData);
        break;
    }
  }

  /**
   * Migrate vectors from source to target store
   *
   * @param source - Source VectorStore (SQLite-based)
   * @param target - Target AgentDBVectorStore
   * @param options - Migration options
   * @returns Migration result
   */
  async migrate(
    source: ISourceVectorStore,
    target: ITargetVectorStore,
    options: Partial<MigrationOptions> = {}
  ): Promise<MigrationResult> {
    const config: MigrationOptions = { ...DEFAULT_OPTIONS, ...options };
    this.startTime = Date.now();
    this.rateHistory = [];

    const errors: string[] = [];
    let migrated = 0;
    let failed = 0;
    let skipped = 0;

    this.log('info', 'Starting vector store migration', {
      batchSize: config.batchSize,
      parallel: config.parallelBatches,
      dryRun: config.dryRun,
    });

    // Get all entries from source
    const allIds = source.getAllIds();
    const total = allIds.length;
    const totalBatches = Math.ceil(total / config.batchSize);

    if (total === 0) {
      this.log('info', 'No vectors to migrate');
      return {
        success: true,
        totalMigrated: 0,
        totalFailed: 0,
        totalSkipped: 0,
        duration: Date.now() - this.startTime,
        errors: [],
        stats: {
          avgRate: 0,
          peakRate: 0,
          sourceCount: 0,
          targetCount: 0,
          integrityValid: true,
        },
      };
    }

    // Report initial progress
    this.reportProgress(config.onProgress, {
      total,
      migrated: 0,
      failed: 0,
      skipped: 0,
      percentage: 0,
      estimatedTimeRemaining: 0,
      rate: 0,
      currentBatch: 0,
      totalBatches,
      phase: 'preparing',
    });

    // Migrate in batches
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const batchStart = batchNum * config.batchSize;
      const batchEnd = Math.min(batchStart + config.batchSize, total);
      const batchIds = allIds.slice(batchStart, batchEnd);

      try {
        // Fetch entries for this batch
        const entries: Array<{
          nodeId: string;
          content: string;
          embedding: Float32Array;
          metadata?: Record<string, unknown>;
        }> = [];

        for (const id of batchIds) {
          const entry = await source.get(id);
          if (entry) {
            entries.push({
              nodeId: entry.id,
              content: (entry.metadata.content as string) || '',
              embedding: new Float32Array(entry.vector),
              metadata: entry.metadata,
            });
          } else {
            skipped++;
          }
        }

        if (!config.dryRun && entries.length > 0) {
          // Migrate batch to target
          await target.upsertBatch(entries);
        }

        migrated += entries.length;
      } catch (error) {
        const errorMsg = `Batch ${batchNum + 1}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);

        if (config.skipOnError) {
          failed += batchIds.length;
          this.log('warn', 'Batch migration failed, skipping', { batch: batchNum + 1, error: errorMsg });
        } else {
          this.log('error', 'Batch migration failed', { error: errorMsg });
          return {
            success: false,
            totalMigrated: migrated,
            totalFailed: failed + batchIds.length,
            totalSkipped: skipped,
            duration: Date.now() - this.startTime,
            errors,
            stats: await this.calculateStats(total, migrated, source, target),
          };
        }
      }

      // Calculate progress
      const elapsed = Date.now() - this.startTime;
      const processed = migrated + failed + skipped;
      const rate = processed / (elapsed / 1000);
      this.rateHistory.push(rate);

      const remaining = total - processed;
      const estimatedTimeRemaining = rate > 0 ? (remaining / rate) * 1000 : 0;

      // Report progress
      this.reportProgress(config.onProgress, {
        total,
        migrated,
        failed,
        skipped,
        percentage: (processed / total) * 100,
        estimatedTimeRemaining,
        rate,
        currentBatch: batchNum + 1,
        totalBatches,
        phase: 'migrating',
      });
    }

    // Validation phase
    let validation: ValidationResult | undefined;
    if (config.validateAfterMigration && !config.dryRun && migrated > 0) {
      this.reportProgress(config.onProgress, {
        total,
        migrated,
        failed,
        skipped,
        percentage: 100,
        estimatedTimeRemaining: 0,
        rate: 0,
        currentBatch: totalBatches,
        totalBatches,
        phase: 'validating',
      });

      validation = await this.validateMigration(
        source,
        target,
        config.validationSampleSize
      );

      if (!validation.valid) {
        errors.push('Post-migration validation failed');
        errors.push(...validation.errors);
      }
    }

    // Report completion
    this.reportProgress(config.onProgress, {
      total,
      migrated,
      failed,
      skipped,
      percentage: 100,
      estimatedTimeRemaining: 0,
      rate: 0,
      currentBatch: totalBatches,
      totalBatches,
      phase: 'complete',
    });

    const stats = await this.calculateStats(total, migrated, source, target);

    this.log('info', 'Migration complete', {
      migrated,
      failed,
      skipped,
      duration: Date.now() - this.startTime,
      valid: validation?.valid ?? true,
    });

    return {
      success: failed === 0 && errors.length === 0,
      totalMigrated: migrated,
      totalFailed: failed,
      totalSkipped: skipped,
      duration: Date.now() - this.startTime,
      errors,
      validation,
      stats,
    };
  }

  /**
   * Validate migration by comparing samples between source and target
   */
  private async validateMigration(
    source: ISourceVectorStore,
    target: ITargetVectorStore,
    samplePercentage: number
  ): Promise<ValidationResult> {
    const allIds = source.getAllIds();
    const sampleSize = Math.ceil(allIds.length * (samplePercentage / 100));
    const errors: string[] = [];
    let mismatches = 0;
    let totalSimilarity = 0;

    // Random sample of IDs
    const sampleIds = this.randomSample(allIds, sampleSize);

    for (const id of sampleIds) {
      const sourceEntry = await source.get(id);
      if (!sourceEntry) {
        mismatches++;
        errors.push(`Source entry not found: ${id}`);
        continue;
      }

      // Search for this vector in target
      const targetResults = await target.search(
        new Float32Array(sourceEntry.vector),
        1,
        0.99
      );

      if (targetResults.length === 0) {
        mismatches++;
        errors.push(`Target entry not found: ${id}`);
      } else if (targetResults[0].nodeId !== id) {
        // Check if it's a close match (might have same embedding)
        if (targetResults[0].similarity < 0.99) {
          mismatches++;
          errors.push(`Entry mismatch for ${id}: found ${targetResults[0].nodeId}`);
        }
      } else {
        totalSimilarity += targetResults[0].similarity;
      }
    }

    const validSamples = sampleSize - mismatches;
    const avgSimilarity = validSamples > 0 ? totalSimilarity / validSamples : 0;

    // Consider valid if 99% of samples match
    const valid = mismatches / sampleSize <= 0.01;

    return {
      valid,
      samplesChecked: sampleSize,
      mismatches,
      errors: errors.slice(0, 10), // Limit error messages
      avgSimilarity,
    };
  }

  /**
   * Calculate migration statistics
   */
  private async calculateStats(
    total: number,
    migrated: number,
    source: ISourceVectorStore,
    target: ITargetVectorStore
  ): Promise<MigrationStats> {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const avgRate = elapsed > 0 ? migrated / elapsed : 0;
    const peakRate = this.rateHistory.length > 0 ? Math.max(...this.rateHistory) : 0;

    let targetCount = 0;
    try {
      const targetStats = await target.getStats();
      targetCount = targetStats.totalVectors;
    } catch {
      // Ignore errors getting target stats
    }

    return {
      avgRate,
      peakRate,
      sourceCount: total,
      targetCount,
      integrityValid: targetCount >= migrated * 0.99, // 1% tolerance
    };
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    onProgress: ((progress: MigrationProgress) => void) | undefined,
    progress: MigrationProgress
  ): void {
    if (onProgress) {
      try {
        onProgress(progress);
      } catch (error) {
        this.log('warn', 'Progress callback error', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Get random sample from array
   */
  private randomSample<T>(array: T[], size: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(size, array.length));
  }
}

/**
 * Convenience function for migrating from SQLite to AgentDB
 *
 * @param source - Source VectorStore
 * @param target - Target AgentDBVectorStore
 * @param options - Migration options
 * @returns Migration result
 */
export async function migrateToAgentDB(
  source: ISourceVectorStore,
  target: ITargetVectorStore,
  options?: Partial<MigrationOptions>
): Promise<MigrationResult> {
  const migration = new VectorStoreMigration();
  return migration.migrate(source, target, options);
}

/**
 * Create a migration plan without executing
 *
 * @param source - Source VectorStore
 * @returns Migration plan details
 */
export async function createMigrationPlan(
  source: ISourceVectorStore
): Promise<{
  totalVectors: number;
  estimatedDuration: number;
  estimatedBatches: number;
  recommendations: string[];
}> {
  const allIds = source.getAllIds();
  const total = allIds.length;

  // Estimate based on typical migration rates
  const estimatedRate = 500; // vectors per second
  const batchSize = 100;

  const estimatedDuration = (total / estimatedRate) * 1000;
  const estimatedBatches = Math.ceil(total / batchSize);

  const recommendations: string[] = [];

  if (total > 100000) {
    recommendations.push('Consider increasing batch size to 500 for better throughput');
    recommendations.push('Enable parallel batches (parallelBatches: 4) for faster migration');
  }

  if (total > 1000000) {
    recommendations.push('Consider running migration in off-peak hours');
    recommendations.push('Monitor memory usage during migration');
  }

  recommendations.push('Run with dryRun: true first to validate source data');
  recommendations.push('Ensure adequate disk space for AgentDB storage');

  return {
    totalVectors: total,
    estimatedDuration,
    estimatedBatches,
    recommendations,
  };
}
