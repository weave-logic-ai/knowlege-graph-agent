/**
 * Exochain Audit Types
 *
 * Type definitions for deterministic logging events and chain operations.
 * These types define the structure of the append-only audit log with
 * DAG-based causality tracking and BFT consensus support.
 *
 * @module audit/types
 */

/**
 * BLAKE3 hash type (32 bytes represented as 64-character hex string).
 * Used for event IDs, Merkle roots, and content-addressable storage.
 */
export type Blake3Hash = string;

/**
 * Ed25519 signature type (64 bytes represented as 128-character hex string).
 * Used for cryptographic signing of events and checkpoints.
 */
export type Ed25519Signature = string;

/**
 * Decentralized Identifier following the DID specification.
 * Format: `did:method:method-specific-id`
 *
 * @example
 * ```typescript
 * const agentDid: Did = 'did:exo:agent-abc123';
 * const peerDid: Did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
 * ```
 */
export type Did = string;

/**
 * Hybrid Logical Clock for deterministic event ordering.
 * Combines physical wall-clock time with a logical counter to provide
 * causal ordering even with clock skew between agents.
 *
 * @see {@link https://cse.buffalo.edu/tech-reports/2014-04.pdf|HLC Paper}
 */
export interface HybridLogicalClock {
  /** Physical time in milliseconds since Unix epoch */
  physicalMs: number;
  /** Logical counter for events at the same physical time */
  logical: number;
}

// ============================================================================
// Knowledge Graph Event Payloads
// ============================================================================

/**
 * Event payload for node creation in the knowledge graph.
 */
export interface NodeCreatedPayload {
  type: 'NodeCreated';
  /** Unique identifier for the node */
  nodeId: string;
  /** Type/label of the node (e.g., 'File', 'Function', 'Class') */
  nodeType: string;
  /** Node properties and metadata */
  data: Record<string, unknown>;
}

/**
 * Event payload for node updates in the knowledge graph.
 */
export interface NodeUpdatedPayload {
  type: 'NodeUpdated';
  /** Identifier of the updated node */
  nodeId: string;
  /** Changed properties (old values not stored for privacy) */
  changes: Record<string, unknown>;
}

/**
 * Event payload for node deletion in the knowledge graph.
 */
export interface NodeDeletedPayload {
  type: 'NodeDeleted';
  /** Identifier of the deleted node */
  nodeId: string;
}

/**
 * Event payload for edge creation in the knowledge graph.
 */
export interface EdgeCreatedPayload {
  type: 'EdgeCreated';
  /** Unique identifier for the edge */
  edgeId: string;
  /** Source node identifier */
  sourceId: string;
  /** Target node identifier */
  targetId: string;
  /** Relationship type (e.g., 'IMPORTS', 'CALLS', 'DEPENDS_ON') */
  relation: string;
}

/**
 * Event payload for edge deletion in the knowledge graph.
 */
export interface EdgeDeletedPayload {
  type: 'EdgeDeleted';
  /** Identifier of the deleted edge */
  edgeId: string;
}

/**
 * Event payload for query execution tracking.
 */
export interface QueryExecutedPayload {
  type: 'QueryExecuted';
  /** BLAKE3 hash of the query for deduplication */
  queryHash: Blake3Hash;
  /** Type of query (e.g., 'cypher', 'traversal', 'vector') */
  queryType: string;
  /** Number of results returned */
  resultCount: number;
}

/**
 * Event payload for workflow start.
 */
export interface WorkflowStartedPayload {
  type: 'WorkflowStarted';
  /** Unique workflow execution identifier */
  workflowId: string;
  /** Type of workflow (e.g., 'codebase-analysis', 'gap-detection') */
  workflowType: string;
  /** What triggered the workflow (e.g., 'manual', 'scheduled', 'event') */
  trigger: string;
}

/**
 * Event payload for workflow completion.
 */
export interface WorkflowCompletedPayload {
  type: 'WorkflowCompleted';
  /** Workflow execution identifier */
  workflowId: string;
  /** Final outcome of the workflow */
  outcome: 'success' | 'failure' | 'timeout';
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Event payload for individual workflow step completion.
 */
export interface WorkflowStepCompletedPayload {
  type: 'WorkflowStepCompleted';
  /** Parent workflow identifier */
  workflowId: string;
  /** Unique step identifier */
  stepId: string;
  /** Action performed in this step */
  action: string;
  /** Step outcome description */
  outcome: string;
}

/**
 * Event payload for documentation gap detection.
 */
export interface GapDetectedPayload {
  type: 'GapDetected';
  /** Path to the document with gaps */
  docPath: string;
  /** List of identified gaps */
  gaps: string[];
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Event payload for task specification generation.
 */
export interface TaskSpecGeneratedPayload {
  type: 'TaskSpecGenerated';
  /** Generated specification identifier */
  specId: string;
  /** Source document path */
  sourceDoc: string;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Event payload for conflict detection between agents.
 */
export interface ConflictDetectedPayload {
  type: 'ConflictDetected';
  /** Resource being contested */
  resourceId: string;
  /** DIDs of agents in conflict */
  conflictingAgents: Did[];
}

/**
 * Event payload for conflict resolution.
 */
export interface ConflictResolvedPayload {
  type: 'ConflictResolved';
  /** Resource that was contested */
  resourceId: string;
  /** How the conflict was resolved */
  resolution: string;
  /** DID of the resolving agent */
  resolver: Did;
}

/**
 * Event payload for sync operation start.
 */
export interface SyncStartedPayload {
  type: 'SyncStarted';
  /** Peer being synced with */
  peerId: string;
  /** Direction of synchronization */
  direction: 'push' | 'pull' | 'bidirectional';
}

/**
 * Event payload for sync operation completion.
 */
export interface SyncCompletedPayload {
  type: 'SyncCompleted';
  /** Peer that was synced with */
  peerId: string;
  /** Number of events transferred */
  eventsTransferred: number;
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Event payload for checkpoint creation.
 */
export interface CheckpointCreatedPayload {
  type: 'CheckpointCreated';
  /** Checkpoint height (sequential number) */
  height: number;
  /** Merkle root of all events up to this checkpoint */
  eventRoot: Blake3Hash;
  /** Root hash of the current state */
  stateRoot: Blake3Hash;
}

/**
 * Union type of all knowledge graph event payloads.
 * This discriminated union allows type-safe event handling.
 *
 * @example
 * ```typescript
 * function handleEvent(payload: KnowledgeGraphEventPayload) {
 *   switch (payload.type) {
 *     case 'NodeCreated':
 *       console.log(`Node ${payload.nodeId} created`);
 *       break;
 *     case 'WorkflowCompleted':
 *       console.log(`Workflow ${payload.workflowId} ${payload.outcome}`);
 *       break;
 *   }
 * }
 * ```
 */
export type KnowledgeGraphEventPayload =
  | NodeCreatedPayload
  | NodeUpdatedPayload
  | NodeDeletedPayload
  | EdgeCreatedPayload
  | EdgeDeletedPayload
  | QueryExecutedPayload
  | WorkflowStartedPayload
  | WorkflowCompletedPayload
  | WorkflowStepCompletedPayload
  | GapDetectedPayload
  | TaskSpecGeneratedPayload
  | ConflictDetectedPayload
  | ConflictResolvedPayload
  | SyncStartedPayload
  | SyncCompletedPayload
  | CheckpointCreatedPayload;

// ============================================================================
// Event Structure
// ============================================================================

/**
 * Event envelope containing metadata and payload.
 * The envelope wraps the payload with causality tracking (parents),
 * ordering (HLC), and attribution (author).
 */
export interface EventEnvelope {
  /** Parent event IDs forming the DAG structure (empty for genesis) */
  parents: Blake3Hash[];
  /** Hybrid logical clock timestamp for deterministic ordering */
  hlc: HybridLogicalClock;
  /** DID of the agent that created this event */
  author: Did;
  /** The actual event payload */
  payload: KnowledgeGraphEventPayload;
}

/**
 * Complete ledger event with cryptographic signature.
 * This is the unit of storage and transfer in the audit chain.
 */
export interface LedgerEvent {
  /** Event ID (BLAKE3 hash of the serialized envelope) */
  id: Blake3Hash;
  /** Event envelope with metadata and payload */
  envelope: EventEnvelope;
  /** Ed25519 signature of the event ID by the author */
  signature: Ed25519Signature;
}

// ============================================================================
// Consensus and Finality
// ============================================================================

/**
 * Validator signature for BFT checkpoint.
 */
export interface ValidatorSignature {
  /** DID of the validating agent */
  validatorDid: Did;
  /** Ed25519 signature over the checkpoint data */
  signature: Ed25519Signature;
}

/**
 * BFT checkpoint for achieving finality.
 * A checkpoint is final when it has 2f+1 validator signatures
 * where f is the maximum number of Byzantine faults tolerated.
 */
export interface Checkpoint {
  /** Sequential checkpoint number */
  height: number;
  /** Merkle root of all events finalized by this checkpoint */
  eventRoot: Blake3Hash;
  /** State root after applying all finalized events */
  stateRoot: Blake3Hash;
  /** Timestamp of checkpoint creation */
  timestamp: Date;
  /** Validator signatures (need 2f+1 for BFT finality) */
  validatorSignatures: ValidatorSignature[];
}

/**
 * Merkle proof for verifying event inclusion in a checkpoint.
 * Allows lightweight verification without downloading all events.
 */
export interface MerkleProof {
  /** Event being proven */
  eventId: Blake3Hash;
  /** Proof path containing sibling hashes */
  path: Blake3Hash[];
  /** Direction at each level (left=0, right=1 in binary tree) */
  directions: ('left' | 'right')[];
  /** Root hash that should match checkpoint's eventRoot */
  root: Blake3Hash;
}

// ============================================================================
// Peer Synchronization
// ============================================================================

/**
 * Request for synchronization with a peer.
 * Used to request events since a known checkpoint.
 */
export interface SyncRequest {
  /** DID of the requesting agent */
  requester: Did;
  /** Last checkpoint height known to requester */
  lastCheckpointHeight: number;
  /** Last known event root for verification */
  lastEventRoot?: Blake3Hash;
  /** Maximum number of events to receive */
  maxEvents?: number;
}

/**
 * Response to a synchronization request.
 * Contains events since the requester's last checkpoint.
 */
export interface SyncResponse {
  /** DID of the responding agent */
  provider: Did;
  /** Events since the requested checkpoint */
  events: LedgerEvent[];
  /** New checkpoint if one was created */
  checkpoint?: Checkpoint;
  /** Whether more events are available */
  hasMore: boolean;
  /** Cursor for pagination if hasMore is true */
  nextCursor?: Blake3Hash;
}

// ============================================================================
// Query and Results
// ============================================================================

/**
 * Options for querying events from the audit chain.
 */
export interface EventQueryOptions {
  /** Filter by specific event type */
  type?: KnowledgeGraphEventPayload['type'];
  /** Filter by event author */
  author?: Did;
  /** Return events with HLC >= since */
  since?: HybridLogicalClock;
  /** Return events with HLC <= until */
  until?: HybridLogicalClock;
  /** Maximum number of events to return */
  limit?: number;
  /** Include Merkle proofs for each event */
  includeProof?: boolean;
}

/**
 * Result of an event query.
 */
export interface EventQueryResult {
  /** Events matching the query criteria */
  events: LedgerEvent[];
  /** Merkle proofs if requested (keyed by event ID) */
  proofs?: Map<Blake3Hash, MerkleProof>;
  /** Total count of matching events (may exceed returned count) */
  totalCount: number;
  /** Whether more results are available */
  hasMore: boolean;
}

// ============================================================================
// Chain Status and Validation
// ============================================================================

/**
 * Health status of the audit chain.
 */
export type ChainStatus = 'healthy' | 'syncing' | 'degraded';

/**
 * Statistics about the audit chain state.
 */
export interface ChainStats {
  /** Total number of events in the chain */
  totalEvents: number;
  /** Current finalized checkpoint height */
  checkpointHeight: number;
  /** Number of unique event authors */
  uniqueAuthors: number;
  /** Count of events by type */
  eventsByType: Record<string, number>;
  /** Timestamp of most recent event */
  lastEventTime?: Date;
  /** Overall chain health status */
  status: ChainStatus;
}

/**
 * Result of validating a ledger event.
 */
export interface EventValidation {
  /** Whether the event passed all validation checks */
  valid: boolean;
  /** List of validation error messages if invalid */
  errors: string[];
  /** Whether the Ed25519 signature is valid */
  signatureValid: boolean;
  /** Whether HLC causality constraints are satisfied */
  causalityValid: boolean;
  /** Whether all parent events exist in the chain */
  parentsExist: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract the payload type from an event type discriminator.
 *
 * @example
 * ```typescript
 * type NodePayload = ExtractPayload<'NodeCreated'>;
 * // NodePayload is NodeCreatedPayload
 * ```
 */
export type ExtractPayload<T extends KnowledgeGraphEventPayload['type']> = Extract<
  KnowledgeGraphEventPayload,
  { type: T }
>;

/**
 * All possible event type discriminators.
 */
export type EventType = KnowledgeGraphEventPayload['type'];

/**
 * Helper to compare two HLCs for ordering.
 *
 * @param a - First HLC
 * @param b - Second HLC
 * @returns Negative if a < b, positive if a > b, zero if equal
 *
 * @example
 * ```typescript
 * const events = [...];
 * events.sort((a, b) => compareHLC(a.envelope.hlc, b.envelope.hlc));
 * ```
 */
export function compareHLC(a: HybridLogicalClock, b: HybridLogicalClock): number {
  const physicalDiff = a.physicalMs - b.physicalMs;
  if (physicalDiff !== 0) {
    return physicalDiff;
  }
  return a.logical - b.logical;
}

/**
 * Create a new HLC from the current time.
 *
 * @param lastHlc - Previous HLC for maintaining monotonicity
 * @returns New HLC guaranteed to be greater than lastHlc
 */
export function createHLC(lastHlc?: HybridLogicalClock): HybridLogicalClock {
  const now = Date.now();

  if (!lastHlc) {
    return { physicalMs: now, logical: 0 };
  }

  if (now > lastHlc.physicalMs) {
    return { physicalMs: now, logical: 0 };
  }

  // Wall clock hasn't advanced, increment logical
  return { physicalMs: lastHlc.physicalMs, logical: lastHlc.logical + 1 };
}

/**
 * Merge two HLCs (used when receiving events from peers).
 *
 * @param local - Local HLC
 * @param remote - Remote HLC from received event
 * @returns Merged HLC that maintains causality
 */
export function mergeHLC(local: HybridLogicalClock, remote: HybridLogicalClock): HybridLogicalClock {
  const now = Date.now();
  const maxPhysical = Math.max(now, local.physicalMs, remote.physicalMs);

  if (maxPhysical === now && now > local.physicalMs && now > remote.physicalMs) {
    return { physicalMs: now, logical: 0 };
  }

  if (maxPhysical === local.physicalMs && local.physicalMs === remote.physicalMs) {
    return { physicalMs: maxPhysical, logical: Math.max(local.logical, remote.logical) + 1 };
  }

  if (maxPhysical === local.physicalMs) {
    return { physicalMs: maxPhysical, logical: local.logical + 1 };
  }

  return { physicalMs: maxPhysical, logical: remote.logical + 1 };
}
