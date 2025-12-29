/**
 * Audit Chain Service
 *
 * Implements deterministic logging with:
 * - DAG (Directed Acyclic Graph) structure for event ordering
 * - Hybrid Logical Clocks (HLC) for distributed ordering
 * - BLAKE3 hashing for event IDs
 * - Ed25519 signatures for authenticity
 *
 * @module audit/services/audit-chain
 */

import type {
  Blake3Hash,
  Ed25519Signature,
  Did,
  HybridLogicalClock,
  KnowledgeGraphEventPayload,
  EventEnvelope,
  LedgerEvent,
  Checkpoint,
  MerkleProof,
  EventQueryOptions,
  EventQueryResult,
  ChainStats,
  EventValidation,
} from '../types.js';
import type { AuditChainConfig } from '../config.js';
import {
  createAuditChainConfig,
  validateAuditChainConfig,
} from '../config.js';
import { createLogger } from '../../utils/index.js';

const logger = createLogger('audit-chain');

/**
 * Simple BLAKE3-like hash (in production, use actual BLAKE3)
 * This is a placeholder - real implementation would use @noble/hashes or similar
 *
 * @param data - Data to hash
 * @returns 64-character hex hash string
 */
function blake3Hash(data: string): Blake3Hash {
  // Simplified hash for demo - use real BLAKE3 in production
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Simple Ed25519-like signature (in production, use actual Ed25519)
 * This is a placeholder - real implementation would use @noble/ed25519
 *
 * @param data - Data to sign
 * @param _privateKey - Private key for signing
 * @returns 128-character hex signature string
 */
function signData(data: string, _privateKey?: string): Ed25519Signature {
  // Simplified signature for demo - use real Ed25519 in production
  const hash = blake3Hash(data + (_privateKey || 'default-key'));
  return hash + hash.split('').reverse().join('');
}

/**
 * Verify signature (simplified)
 *
 * @param _data - Original data
 * @param _signature - Signature to verify
 * @param _publicKey - Public key for verification
 * @returns Whether signature is valid
 */
function verifySignature(
  _data: string,
  _signature: Ed25519Signature,
  _publicKey?: string
): boolean {
  // In production, use actual Ed25519 verification
  return true;
}

/**
 * Canonical CBOR-like serialization (simplified JSON for demo)
 *
 * @param obj - Object to serialize
 * @returns Canonical string representation
 */
function canonicalSerialize(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as object).sort());
}

/**
 * Audit Chain class
 *
 * Provides:
 * - Event creation and signing
 * - DAG-based event storage
 * - HLC-based ordering
 * - Checkpoint creation
 * - Event querying with Merkle proofs
 *
 * @example
 * ```typescript
 * const chain = createAuditChain({ agentDid: 'did:key:abc123' });
 *
 * // Append an event
 * const event = await chain.appendEvent({
 *   type: 'NodeCreated',
 *   nodeId: 'node-1',
 *   nodeType: 'Document',
 *   properties: { title: 'My Doc' }
 * });
 *
 * // Query events
 * const result = await chain.queryEvents({ type: 'NodeCreated', limit: 10 });
 * ```
 */
export class AuditChain {
  private config: AuditChainConfig;
  private events: Map<Blake3Hash, LedgerEvent> = new Map();
  private tips: Set<Blake3Hash> = new Set(); // Current DAG tips
  private hlc: HybridLogicalClock;
  private checkpoints: Checkpoint[] = [];
  private eventsSinceCheckpoint: number = 0;

  /**
   * Create a new AuditChain instance
   *
   * @param config - Partial configuration (merged with defaults)
   */
  constructor(config?: Partial<AuditChainConfig>) {
    const baseConfig = createAuditChainConfig();
    this.config = { ...baseConfig, ...config };

    const validation = validateAuditChainConfig(this.config);
    if (!validation.valid) {
      logger.warn('Invalid configuration', { errors: validation.errors });
    }

    // Initialize HLC
    this.hlc = {
      physicalMs: Date.now(),
      logical: 0,
    };

    logger.info('Audit chain initialized', {
      agentDid: this.config.agentDid,
      backend: this.config.backend,
    });
  }

  /**
   * Tick the HLC and return new timestamp
   *
   * Implements the HLC tick algorithm:
   * - If physical time has advanced, reset logical counter
   * - Otherwise, increment logical counter
   *
   * @returns New HLC timestamp
   */
  private tickHLC(): HybridLogicalClock {
    const now = Date.now();

    if (now > this.hlc.physicalMs) {
      this.hlc = { physicalMs: now, logical: 0 };
    } else {
      this.hlc = {
        physicalMs: this.hlc.physicalMs,
        logical: this.hlc.logical + 1,
      };
    }

    return { ...this.hlc };
  }

  /**
   * Update HLC based on received event
   *
   * Implements the HLC receive algorithm:
   * - Take max of local, remote, and current time
   * - Adjust logical counter appropriately
   *
   * @param received - HLC from received event
   */
  private updateHLC(received: HybridLogicalClock): void {
    const now = Date.now();
    const maxPhysical = Math.max(
      now,
      this.hlc.physicalMs,
      received.physicalMs
    );

    if (
      maxPhysical === this.hlc.physicalMs &&
      maxPhysical === received.physicalMs
    ) {
      this.hlc = {
        physicalMs: maxPhysical,
        logical: Math.max(this.hlc.logical, received.logical) + 1,
      };
    } else if (maxPhysical === this.hlc.physicalMs) {
      this.hlc = { physicalMs: maxPhysical, logical: this.hlc.logical + 1 };
    } else if (maxPhysical === received.physicalMs) {
      this.hlc = { physicalMs: maxPhysical, logical: received.logical + 1 };
    } else {
      this.hlc = { physicalMs: maxPhysical, logical: 0 };
    }
  }

  /**
   * Compare two HLCs
   *
   * @param a - First HLC
   * @param b - Second HLC
   * @returns Negative if a < b, positive if a > b, zero if equal
   */
  private compareHLC(a: HybridLogicalClock, b: HybridLogicalClock): number {
    if (a.physicalMs !== b.physicalMs) {
      return a.physicalMs - b.physicalMs;
    }
    return a.logical - b.logical;
  }

  /**
   * Get current DAG tips (events with no children)
   *
   * Tips are the "leaf" events in the DAG that have not been
   * referenced as parents by any other event.
   *
   * @returns Array of tip event IDs
   */
  getTips(): Blake3Hash[] {
    return Array.from(this.tips);
  }

  /**
   * Append an event to the chain
   *
   * Creates a new event with:
   * - Current tips as parents (DAG structure)
   * - New HLC timestamp
   * - Signature for authenticity
   *
   * @param payload - Event payload to append
   * @returns The created ledger event
   *
   * @example
   * ```typescript
   * const event = await chain.appendEvent({
   *   type: 'NodeCreated',
   *   nodeId: 'doc-1',
   *   nodeType: 'Document',
   *   properties: { title: 'README' }
   * });
   * console.log('Event ID:', event.id);
   * ```
   */
  async appendEvent(
    payload: KnowledgeGraphEventPayload
  ): Promise<LedgerEvent> {
    // Get current tips as parents
    const parents = this.getTips();

    // Tick HLC
    const hlc = this.tickHLC();

    // Create envelope
    const envelope: EventEnvelope = {
      parents,
      hlc,
      author: this.config.agentDid,
      payload,
    };

    // Compute event ID (BLAKE3 hash of canonical envelope)
    const serialized = canonicalSerialize(envelope);
    const eventId = blake3Hash(serialized);

    // Sign event ID
    const signature = signData(eventId, this.config.privateKey);

    // Create event
    const event: LedgerEvent = {
      id: eventId,
      envelope,
      signature,
    };

    // Store event
    this.events.set(eventId, event);

    // Update tips: remove parents from tips, add new event
    for (const parent of parents) {
      this.tips.delete(parent);
    }
    this.tips.add(eventId);

    // Track events since checkpoint
    this.eventsSinceCheckpoint++;

    // Create checkpoint if needed
    if (this.eventsSinceCheckpoint >= this.config.checkpointInterval) {
      await this.createCheckpoint();
    }

    logger.debug('Appended event', {
      eventId,
      type: payload.type,
      parents: parents.length,
    });

    return event;
  }

  /**
   * Validate and insert an external event
   *
   * Performs validation:
   * - Signature verification
   * - Parent existence check
   * - Causality verification (HLC ordering)
   * - Event ID recomputation
   *
   * @param event - External event to validate and insert
   * @returns Validation result with details
   *
   * @example
   * ```typescript
   * const validation = await chain.validateAndInsert(externalEvent);
   * if (validation.valid) {
   *   console.log('Event inserted successfully');
   * } else {
   *   console.error('Validation failed:', validation.errors);
   * }
   * ```
   */
  async validateAndInsert(event: LedgerEvent): Promise<EventValidation> {
    const errors: string[] = [];

    // Verify signature
    const signatureValid = verifySignature(event.id, event.signature);
    if (!signatureValid) {
      errors.push('Invalid signature');
    }

    // Check parents exist
    let parentsExist = true;
    for (const parentId of event.envelope.parents) {
      if (!this.events.has(parentId)) {
        parentsExist = false;
        errors.push(`Parent not found: ${parentId}`);
      }
    }

    // Check causality (event HLC must be > all parent HLCs)
    let causalityValid = true;
    for (const parentId of event.envelope.parents) {
      const parent = this.events.get(parentId);
      if (
        parent &&
        this.compareHLC(event.envelope.hlc, parent.envelope.hlc) <= 0
      ) {
        causalityValid = false;
        errors.push('Causality violation: event HLC not greater than parent');
      }
    }

    // Recompute event ID
    const serialized = canonicalSerialize(event.envelope);
    const expectedId = blake3Hash(serialized);
    if (event.id !== expectedId) {
      errors.push('Event ID mismatch');
    }

    const validation: EventValidation = {
      valid: errors.length === 0,
      errors,
      signatureValid,
      causalityValid,
      parentsExist,
    };

    // Insert if valid
    if (validation.valid) {
      this.events.set(event.id, event);
      this.updateHLC(event.envelope.hlc);

      // Update tips
      for (const parent of event.envelope.parents) {
        this.tips.delete(parent);
      }
      this.tips.add(event.id);

      this.eventsSinceCheckpoint++;
      logger.debug('Inserted external event', { eventId: event.id });
    } else {
      logger.warn('Rejected invalid event', { eventId: event.id, errors });
    }

    return validation;
  }

  /**
   * Create a checkpoint
   *
   * Checkpoints provide:
   * - Periodic state snapshots
   * - Efficient verification of chain integrity
   * - Recovery points for sync
   *
   * @returns The created checkpoint
   */
  async createCheckpoint(): Promise<Checkpoint> {
    const height = this.checkpoints.length;

    // Compute event root (simplified - real impl would use MMR)
    const eventIds = Array.from(this.events.keys()).sort();
    const eventRoot = blake3Hash(eventIds.join(':'));

    // Compute state root (simplified)
    const stateRoot = blake3Hash(JSON.stringify(this.getStats()));

    const checkpoint: Checkpoint = {
      height,
      eventRoot,
      stateRoot,
      timestamp: new Date(),
      validatorSignatures: [
        {
          validatorDid: this.config.agentDid,
          signature: signData(eventRoot + stateRoot, this.config.privateKey),
        },
      ],
    };

    this.checkpoints.push(checkpoint);
    this.eventsSinceCheckpoint = 0;

    // Log checkpoint event
    await this.appendEvent({
      type: 'CheckpointCreated',
      height,
      eventRoot,
      stateRoot,
    });

    logger.info('Created checkpoint', { height, eventCount: this.events.size });
    return checkpoint;
  }

  /**
   * Get the latest checkpoint
   *
   * @returns The most recent checkpoint, or null if none exist
   */
  getLatestCheckpoint(): Checkpoint | null {
    return this.checkpoints[this.checkpoints.length - 1] || null;
  }

  /**
   * Get an event by ID
   *
   * @param eventId - Event ID to look up
   * @returns The event, or null if not found
   */
  getEvent(eventId: Blake3Hash): LedgerEvent | null {
    return this.events.get(eventId) || null;
  }

  /**
   * Query events
   *
   * Supports filtering by:
   * - Event type
   * - Author DID
   * - Time range (HLC)
   * - With optional Merkle proofs
   *
   * @param options - Query options
   * @returns Query result with matching events
   *
   * @example
   * ```typescript
   * // Get all NodeCreated events
   * const result = await chain.queryEvents({
   *   type: 'NodeCreated',
   *   limit: 50,
   *   includeProof: true
   * });
   *
   * for (const event of result.events) {
   *   console.log(event.envelope.payload);
   * }
   * ```
   */
  async queryEvents(options: EventQueryOptions): Promise<EventQueryResult> {
    let events = Array.from(this.events.values());

    // Filter by type
    if (options.type) {
      events = events.filter((e) => e.envelope.payload.type === options.type);
    }

    // Filter by author
    if (options.author) {
      events = events.filter((e) => e.envelope.author === options.author);
    }

    // Filter by time range
    if (options.since) {
      events = events.filter(
        (e) => this.compareHLC(e.envelope.hlc, options.since!) > 0
      );
    }
    if (options.until) {
      events = events.filter(
        (e) => this.compareHLC(e.envelope.hlc, options.until!) < 0
      );
    }

    // Sort by HLC
    events.sort((a, b) => this.compareHLC(a.envelope.hlc, b.envelope.hlc));

    const totalCount = events.length;
    const limit = options.limit || 100;
    const hasMore = totalCount > limit;
    events = events.slice(0, limit);

    // Generate proofs if requested
    let proofs: Map<Blake3Hash, MerkleProof> | undefined;
    if (options.includeProof) {
      proofs = new Map();
      for (const event of events) {
        proofs.set(event.id, this.generateMerkleProof(event.id));
      }
    }

    return {
      events,
      proofs,
      totalCount,
      hasMore,
    };
  }

  /**
   * Generate a Merkle proof for an event
   *
   * @param eventId - Event ID to generate proof for
   * @returns Merkle proof structure
   */
  private generateMerkleProof(eventId: Blake3Hash): MerkleProof {
    // Simplified proof - real impl would use proper Merkle tree
    const eventIds = Array.from(this.events.keys()).sort();
    const index = eventIds.indexOf(eventId);

    const path: Blake3Hash[] = [];
    const directions: ('left' | 'right')[] = [];

    // Generate sibling hashes (simplified)
    if (index > 0) {
      path.push(blake3Hash(eventIds[index - 1]));
      directions.push('left');
    }
    if (index < eventIds.length - 1) {
      path.push(blake3Hash(eventIds[index + 1]));
      directions.push('right');
    }

    const root = blake3Hash(eventIds.join(':'));

    return { eventId, path, directions, root };
  }

  /**
   * Verify a Merkle proof
   *
   * @param proof - Proof to verify
   * @returns Whether the proof is valid
   */
  verifyMerkleProof(proof: MerkleProof): boolean {
    // Simplified verification - real impl would recompute root
    const checkpoint = this.getLatestCheckpoint();
    return checkpoint ? proof.root === checkpoint.eventRoot : false;
  }

  /**
   * Get chain statistics
   *
   * @returns Current chain statistics
   */
  getStats(): ChainStats {
    const eventsByType: Record<string, number> = {};
    const authors = new Set<Did>();
    let lastEventTime: Date | undefined;

    for (const event of this.events.values()) {
      const type = event.envelope.payload.type;
      eventsByType[type] = (eventsByType[type] || 0) + 1;
      authors.add(event.envelope.author);

      const eventTime = new Date(event.envelope.hlc.physicalMs);
      if (!lastEventTime || eventTime > lastEventTime) {
        lastEventTime = eventTime;
      }
    }

    return {
      totalEvents: this.events.size,
      checkpointHeight: this.checkpoints.length,
      uniqueAuthors: authors.size,
      eventsByType,
      lastEventTime,
      status: 'healthy',
    };
  }

  /**
   * Get configuration
   *
   * @returns Current configuration (copy)
   */
  getConfig(): AuditChainConfig {
    return { ...this.config };
  }

  /**
   * Clear all events (for testing)
   *
   * Resets the chain to initial state.
   */
  clear(): void {
    this.events.clear();
    this.tips.clear();
    this.checkpoints = [];
    this.eventsSinceCheckpoint = 0;
    this.hlc = { physicalMs: Date.now(), logical: 0 };
    logger.info('Audit chain cleared');
  }

  /**
   * Export chain data
   *
   * Exports all events, checkpoints, and tips for backup or sync.
   *
   * @returns Exported chain data
   */
  export(): {
    events: LedgerEvent[];
    checkpoints: Checkpoint[];
    tips: Blake3Hash[];
  } {
    return {
      events: Array.from(this.events.values()),
      checkpoints: [...this.checkpoints],
      tips: this.getTips(),
    };
  }

  /**
   * Import chain data
   *
   * Imports events from external source, validating each.
   *
   * @param data - Data to import
   * @returns Import statistics
   *
   * @example
   * ```typescript
   * const exported = sourceChain.export();
   * const { imported, rejected } = await targetChain.import(exported);
   * console.log(`Imported ${imported} events, rejected ${rejected}`);
   * ```
   */
  async import(data: {
    events: LedgerEvent[];
    checkpoints?: Checkpoint[];
  }): Promise<{ imported: number; rejected: number }> {
    let imported = 0;
    let rejected = 0;

    // Sort events by HLC
    const sortedEvents = [...data.events].sort((a, b) =>
      this.compareHLC(a.envelope.hlc, b.envelope.hlc)
    );

    for (const event of sortedEvents) {
      const validation = await this.validateAndInsert(event);
      if (validation.valid) {
        imported++;
      } else {
        rejected++;
      }
    }

    if (data.checkpoints) {
      this.checkpoints = data.checkpoints;
    }

    logger.info('Imported chain data', { imported, rejected });
    return { imported, rejected };
  }
}

/**
 * Create an audit chain instance
 *
 * Factory function for creating AuditChain instances.
 *
 * @param config - Optional configuration overrides
 * @returns New AuditChain instance
 *
 * @example
 * ```typescript
 * // Create with defaults
 * const chain = createAuditChain();
 *
 * // Create with custom config
 * const chain = createAuditChain({
 *   agentDid: 'did:key:myagent',
 *   backend: 'sqlite',
 *   sqlitePath: './audit.db'
 * });
 * ```
 */
export function createAuditChain(
  config?: Partial<AuditChainConfig>
): AuditChain {
  return new AuditChain(config);
}
