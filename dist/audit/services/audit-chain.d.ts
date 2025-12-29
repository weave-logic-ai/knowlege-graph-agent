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
import type { Blake3Hash, KnowledgeGraphEventPayload, LedgerEvent, Checkpoint, MerkleProof, EventQueryOptions, EventQueryResult, ChainStats, EventValidation } from '../types.js';
import type { AuditChainConfig } from '../config.js';
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
export declare class AuditChain {
    private config;
    private events;
    private tips;
    private hlc;
    private checkpoints;
    private eventsSinceCheckpoint;
    /**
     * Create a new AuditChain instance
     *
     * @param config - Partial configuration (merged with defaults)
     */
    constructor(config?: Partial<AuditChainConfig>);
    /**
     * Tick the HLC and return new timestamp
     *
     * Implements the HLC tick algorithm:
     * - If physical time has advanced, reset logical counter
     * - Otherwise, increment logical counter
     *
     * @returns New HLC timestamp
     */
    private tickHLC;
    /**
     * Update HLC based on received event
     *
     * Implements the HLC receive algorithm:
     * - Take max of local, remote, and current time
     * - Adjust logical counter appropriately
     *
     * @param received - HLC from received event
     */
    private updateHLC;
    /**
     * Compare two HLCs
     *
     * @param a - First HLC
     * @param b - Second HLC
     * @returns Negative if a < b, positive if a > b, zero if equal
     */
    private compareHLC;
    /**
     * Get current DAG tips (events with no children)
     *
     * Tips are the "leaf" events in the DAG that have not been
     * referenced as parents by any other event.
     *
     * @returns Array of tip event IDs
     */
    getTips(): Blake3Hash[];
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
    appendEvent(payload: KnowledgeGraphEventPayload): Promise<LedgerEvent>;
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
    validateAndInsert(event: LedgerEvent): Promise<EventValidation>;
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
    createCheckpoint(): Promise<Checkpoint>;
    /**
     * Get the latest checkpoint
     *
     * @returns The most recent checkpoint, or null if none exist
     */
    getLatestCheckpoint(): Checkpoint | null;
    /**
     * Get an event by ID
     *
     * @param eventId - Event ID to look up
     * @returns The event, or null if not found
     */
    getEvent(eventId: Blake3Hash): LedgerEvent | null;
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
    queryEvents(options: EventQueryOptions): Promise<EventQueryResult>;
    /**
     * Generate a Merkle proof for an event
     *
     * @param eventId - Event ID to generate proof for
     * @returns Merkle proof structure
     */
    private generateMerkleProof;
    /**
     * Verify a Merkle proof
     *
     * @param proof - Proof to verify
     * @returns Whether the proof is valid
     */
    verifyMerkleProof(proof: MerkleProof): boolean;
    /**
     * Get chain statistics
     *
     * @returns Current chain statistics
     */
    getStats(): ChainStats;
    /**
     * Get configuration
     *
     * @returns Current configuration (copy)
     */
    getConfig(): AuditChainConfig;
    /**
     * Clear all events (for testing)
     *
     * Resets the chain to initial state.
     */
    clear(): void;
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
    };
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
    import(data: {
        events: LedgerEvent[];
        checkpoints?: Checkpoint[];
    }): Promise<{
        imported: number;
        rejected: number;
    }>;
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
export declare function createAuditChain(config?: Partial<AuditChainConfig>): AuditChain;
//# sourceMappingURL=audit-chain.d.ts.map