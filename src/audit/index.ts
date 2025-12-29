/**
 * Audit Module
 *
 * Exports all audit-related functionality for deterministic logging
 * with DAG-BFT consensus support. This module provides:
 *
 * - Configuration management for multiple storage backends
 * - Type definitions for events, checkpoints, and synchronization
 * - Utility functions for Hybrid Logical Clock operations
 *
 * @module audit
 *
 * @example
 * ```typescript
 * import {
 *   createAuditChainConfig,
 *   validateAuditChainConfig,
 *   type LedgerEvent,
 *   type KnowledgeGraphEventPayload,
 *   createHLC,
 * } from './audit/index.js';
 *
 * // Create and validate configuration
 * const config = createAuditChainConfig();
 * const { valid, errors } = validateAuditChainConfig(config);
 *
 * if (!valid) {
 *   throw new Error(`Invalid config: ${errors.join(', ')}`);
 * }
 *
 * // Create an HLC for event ordering
 * const hlc = createHLC();
 * ```
 */

// Configuration exports
export {
  type AuditBackend,
  type ConsensusType,
  type FileBackendConfig,
  type PostgresBackendConfig,
  type AuditChainConfig,
  type ConfigValidationResult,
  DEFAULT_CHECKPOINT_INTERVAL,
  DEFAULT_SYNDICATION_INTERVAL,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_ROTATE_AFTER_EVENTS,
  createAuditChainConfig,
  validateAuditChainConfig,
  defaultConfig,
} from './config.js';

// Type exports
export {
  // Primitive types
  type Blake3Hash,
  type Ed25519Signature,
  type Did,

  // Clock types
  type HybridLogicalClock,

  // Event payload types (individual)
  type NodeCreatedPayload,
  type NodeUpdatedPayload,
  type NodeDeletedPayload,
  type EdgeCreatedPayload,
  type EdgeDeletedPayload,
  type QueryExecutedPayload,
  type WorkflowStartedPayload,
  type WorkflowCompletedPayload,
  type WorkflowStepCompletedPayload,
  type GapDetectedPayload,
  type TaskSpecGeneratedPayload,
  type ConflictDetectedPayload,
  type ConflictResolvedPayload,
  type SyncStartedPayload,
  type SyncCompletedPayload,
  type CheckpointCreatedPayload,

  // Event payload union
  type KnowledgeGraphEventPayload,

  // Event structure types
  type EventEnvelope,
  type LedgerEvent,

  // Consensus types
  type ValidatorSignature,
  type Checkpoint,
  type MerkleProof,

  // Sync types
  type SyncRequest,
  type SyncResponse,

  // Query types
  type EventQueryOptions,
  type EventQueryResult,

  // Status types
  type ChainStatus,
  type ChainStats,
  type EventValidation,

  // Utility types
  type ExtractPayload,
  type EventType,

  // Utility functions
  compareHLC,
  createHLC,
  mergeHLC,
} from './types.js';

// Service exports
export { AuditChain, createAuditChain } from './services/index.js';
