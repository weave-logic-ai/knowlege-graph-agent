/**
 * Chunking System
 *
 * Public API for the hybrid chunking system.
 */

// Types
export type {
  ContentType,
  MemoryLevel,
  BoundaryType,
  DecayFunction,
  LearningStage,
  Chunk,
  ChunkMetadata,
  EventBoundaryType,
  ChunkingConfig,
  ChunkingResult,
  ChunkingStats,
  ValidationResult,
  Chunker,
  ParsedDocument,
  ChunkRecord,
  ChunkRelationship,
  RelationshipType,
} from './types.js';

// Document parsing
export {
  parseDocument,
  extractTitle,
  extractTags,
  extractDocId,
  extractContentType,
  extractMetadata,
  DocumentParseError,
} from './document-parser.js';

// Chunking strategies
export { EventBasedChunker } from './plugins/event-based-chunker.js';
export { SemanticBoundaryChunker } from './plugins/semantic-boundary-chunker.js';
export { PreferenceSignalChunker } from './plugins/preference-signal-chunker.js';
export { StepBasedChunker } from './plugins/step-based-chunker.js';
export { BaseChunker } from './plugins/base-chunker.js';

// Strategy selection
export { StrategySelector } from './strategy-selector.js';

// Storage
export { ChunkStorage, createChunkStorage, ChunkStorageError } from './chunk-storage.js';

// Manager
export {
  ChunkManager,
  createChunkManager,
  ChunkingError,
  type ChunkingRequest,
  type ChunkingResponse,
} from './chunk-manager.js';

// Utilities
export { countTokens, countTokensInArray, splitByTokens, truncateToTokens } from './utils/tokenizer.js';
export type { Boundary } from './utils/boundary-detector.js';
export {
  detectHeadingBoundaries,
  detectParagraphBoundaries,
  detectCodeBlockBoundaries,
  detectListBoundaries,
  detectAllBoundaries,
} from './utils/boundary-detector.js';
export { jaccardSimilarity, cosineSimilarity, detectSemanticBoundary } from './utils/similarity.js';
export {
  extractContextBefore,
  extractContextAfter,
  extractContextAround,
  generateSummary,
} from './utils/context-extractor.js';
