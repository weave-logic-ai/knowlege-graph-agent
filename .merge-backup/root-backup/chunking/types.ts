/**
 * Chunking System Types
 *
 * Type definitions for the hybrid chunking system that supports
 * multiple memory types (episodic, semantic, preference, procedural).
 */

/**
 * Content type determines which chunking strategy to use
 */
export type ContentType =
  | 'episodic'      // Task experiences, events
  | 'semantic'      // Reflections, learned patterns
  | 'preference'    // User feedback, decisions
  | 'procedural'    // SOPs, workflows, steps
  | 'working'       // Active context (no chunking)
  | 'document';     // General documents (PPL-based)

/**
 * Memory level in hierarchical architecture
 */
export type MemoryLevel =
  | 'atomic'        // Individual memories
  | 'episodic'      // Event sequences
  | 'semantic'      // Abstract patterns
  | 'strategic';    // High-level strategies

/**
 * Boundary type for chunk segmentation
 */
export type BoundaryType =
  | 'event'         // Event-based boundary
  | 'semantic'      // Topic shift boundary
  | 'step'          // Procedural step boundary
  | 'decision'      // Decision point boundary
  | 'fixed';        // Fixed size boundary

/**
 * Decay function for temporal memory
 */
export type DecayFunction =
  | 'exponential'
  | 'linear'
  | 'none';

/**
 * Learning stage in PRER cycle
 */
export type LearningStage =
  | 'perception'
  | 'reasoning'
  | 'execution'
  | 'reflection';

/**
 * A single chunk with content and metadata
 */
export interface Chunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[];
}

/**
 * Chunk metadata (comprehensive)
 */
export interface ChunkMetadata {
  // Core identifiers
  chunk_id: string;
  doc_id: string;
  source_path: string;
  index: number;

  // Content classification
  content_type: ContentType;
  memory_level: MemoryLevel;

  // Chunking metadata
  strategy: string;
  size_tokens: number;
  overlap_tokens?: number;
  boundary_type?: BoundaryType;

  // Temporal metadata
  created_at: Date;
  source_timestamp?: Date;
  decay_function?: DecayFunction;

  // Relational metadata
  parent_chunk?: string;
  child_chunks?: string[];
  previous_chunk?: string;
  next_chunk?: string;
  related_chunks?: string[];

  // Learning metadata
  learning_session_id?: string;
  sop_id?: string;
  stage?: LearningStage;

  // Semantic metadata
  concepts?: string[];
  entities?: string[];
  confidence?: number;

  // Contextual enrichment
  context_before?: string;
  context_after?: string;
  summary?: string;
}

/**
 * Event boundary type for episodic chunking
 */
export type EventBoundaryType =
  | 'task-start'
  | 'task-end'
  | 'phase-transition';

/**
 * Chunking configuration (strategy-specific)
 */
export interface ChunkingConfig {
  // Document identifiers
  docId?: string;
  sourcePath?: string;

  // Common settings
  maxTokens?: number;
  overlap?: number;
  includeContext?: boolean;
  contextWindowSize?: number;

  // Event-based settings
  eventBoundaries?: EventBoundaryType;
  temporalLinks?: boolean;

  // Semantic boundary settings
  embeddingModel?: string;
  similarityThreshold?: number;
  minChunkSize?: number;

  // Preference signal settings
  decisionKeywords?: string[];
  includeAlternatives?: boolean;

  // Step-based settings
  stepDelimiters?: string[];
  includePrerequisites?: boolean;
  includeOutcomes?: boolean;

  // PPL-based settings
  pplThreshold?: number;
  slidingWindowSize?: number;
}

/**
 * Chunking result
 */
export interface ChunkingResult {
  chunks: Chunk[];
  stats: ChunkingStats;
  warnings?: string[];
}

/**
 * Chunking statistics
 */
export interface ChunkingStats {
  totalChunks: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  totalTokens: number;
  strategy: string;
  durationMs: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Base chunker interface
 */
export interface Chunker {
  /**
   * Name of the chunking strategy
   */
  readonly name: string;

  /**
   * Chunk a document into segments
   */
  chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult>;

  /**
   * Validate configuration
   */
  validate(config: ChunkingConfig): ValidationResult;

  /**
   * Get default configuration
   */
  getDefaultConfig(): ChunkingConfig;
}

/**
 * Document with frontmatter
 */
export interface ParsedDocument {
  content: string;
  frontmatter: Record<string, unknown> | null;
  rawContent: string;
}

/**
 * Chunk storage record
 */
export interface ChunkRecord {
  id: number;
  chunk_id: string;
  doc_id: string;
  source_path: string;
  content: string;
  metadata: string; // JSON serialized metadata
  embedding_id?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Chunk relationship types
 */
export type RelationshipType =
  | 'parent'
  | 'child'
  | 'previous'
  | 'next'
  | 'related';

/**
 * Chunk relationship record
 */
export interface ChunkRelationship {
  id: number;
  source_chunk_id: string;
  target_chunk_id: string;
  relationship_type: RelationshipType;
  strength?: number;
  created_at: string;
}
