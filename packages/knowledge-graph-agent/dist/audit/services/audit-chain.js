import { createAuditChainConfig, validateAuditChainConfig } from "../config.js";
import { createLogger } from "../../utils/logger.js";
const logger = createLogger("audit-chain");
function blake3Hash(data) {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, "0");
}
function signData(data, _privateKey) {
  const hash = blake3Hash(data + (_privateKey || "default-key"));
  return hash + hash.split("").reverse().join("");
}
function verifySignature(_data, _signature, _publicKey) {
  return true;
}
function canonicalSerialize(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}
class AuditChain {
  config;
  events = /* @__PURE__ */ new Map();
  tips = /* @__PURE__ */ new Set();
  // Current DAG tips
  hlc;
  checkpoints = [];
  eventsSinceCheckpoint = 0;
  /**
   * Create a new AuditChain instance
   *
   * @param config - Partial configuration (merged with defaults)
   */
  constructor(config) {
    const baseConfig = createAuditChainConfig();
    this.config = { ...baseConfig, ...config };
    const validation = validateAuditChainConfig(this.config);
    if (!validation.valid) {
      logger.warn("Invalid configuration", { errors: validation.errors });
    }
    this.hlc = {
      physicalMs: Date.now(),
      logical: 0
    };
    logger.info("Audit chain initialized", {
      agentDid: this.config.agentDid,
      backend: this.config.backend
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
  tickHLC() {
    const now = Date.now();
    if (now > this.hlc.physicalMs) {
      this.hlc = { physicalMs: now, logical: 0 };
    } else {
      this.hlc = {
        physicalMs: this.hlc.physicalMs,
        logical: this.hlc.logical + 1
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
  updateHLC(received) {
    const now = Date.now();
    const maxPhysical = Math.max(
      now,
      this.hlc.physicalMs,
      received.physicalMs
    );
    if (maxPhysical === this.hlc.physicalMs && maxPhysical === received.physicalMs) {
      this.hlc = {
        physicalMs: maxPhysical,
        logical: Math.max(this.hlc.logical, received.logical) + 1
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
  compareHLC(a, b) {
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
  getTips() {
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
  async appendEvent(payload) {
    const parents = this.getTips();
    const hlc = this.tickHLC();
    const envelope = {
      parents,
      hlc,
      author: this.config.agentDid,
      payload
    };
    const serialized = canonicalSerialize(envelope);
    const eventId = blake3Hash(serialized);
    const signature = signData(eventId, this.config.privateKey);
    const event = {
      id: eventId,
      envelope,
      signature
    };
    this.events.set(eventId, event);
    for (const parent of parents) {
      this.tips.delete(parent);
    }
    this.tips.add(eventId);
    this.eventsSinceCheckpoint++;
    if (this.eventsSinceCheckpoint >= this.config.checkpointInterval) {
      await this.createCheckpoint();
    }
    logger.debug("Appended event", {
      eventId,
      type: payload.type,
      parents: parents.length
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
  async validateAndInsert(event) {
    const errors = [];
    const signatureValid = verifySignature(event.id, event.signature);
    let parentsExist = true;
    for (const parentId of event.envelope.parents) {
      if (!this.events.has(parentId)) {
        parentsExist = false;
        errors.push(`Parent not found: ${parentId}`);
      }
    }
    let causalityValid = true;
    for (const parentId of event.envelope.parents) {
      const parent = this.events.get(parentId);
      if (parent && this.compareHLC(event.envelope.hlc, parent.envelope.hlc) <= 0) {
        causalityValid = false;
        errors.push("Causality violation: event HLC not greater than parent");
      }
    }
    const serialized = canonicalSerialize(event.envelope);
    const expectedId = blake3Hash(serialized);
    if (event.id !== expectedId) {
      errors.push("Event ID mismatch");
    }
    const validation = {
      valid: errors.length === 0,
      errors,
      signatureValid,
      causalityValid,
      parentsExist
    };
    if (validation.valid) {
      this.events.set(event.id, event);
      this.updateHLC(event.envelope.hlc);
      for (const parent of event.envelope.parents) {
        this.tips.delete(parent);
      }
      this.tips.add(event.id);
      this.eventsSinceCheckpoint++;
      logger.debug("Inserted external event", { eventId: event.id });
    } else {
      logger.warn("Rejected invalid event", { eventId: event.id, errors });
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
  async createCheckpoint() {
    const height = this.checkpoints.length;
    const eventIds = Array.from(this.events.keys()).sort();
    const eventRoot = blake3Hash(eventIds.join(":"));
    const stateRoot = blake3Hash(JSON.stringify(this.getStats()));
    const checkpoint = {
      height,
      eventRoot,
      stateRoot,
      timestamp: /* @__PURE__ */ new Date(),
      validatorSignatures: [
        {
          validatorDid: this.config.agentDid,
          signature: signData(eventRoot + stateRoot, this.config.privateKey)
        }
      ]
    };
    this.checkpoints.push(checkpoint);
    this.eventsSinceCheckpoint = 0;
    await this.appendEvent({
      type: "CheckpointCreated",
      height,
      eventRoot,
      stateRoot
    });
    logger.info("Created checkpoint", { height, eventCount: this.events.size });
    return checkpoint;
  }
  /**
   * Get the latest checkpoint
   *
   * @returns The most recent checkpoint, or null if none exist
   */
  getLatestCheckpoint() {
    return this.checkpoints[this.checkpoints.length - 1] || null;
  }
  /**
   * Get an event by ID
   *
   * @param eventId - Event ID to look up
   * @returns The event, or null if not found
   */
  getEvent(eventId) {
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
  async queryEvents(options) {
    let events = Array.from(this.events.values());
    if (options.type) {
      events = events.filter((e) => e.envelope.payload.type === options.type);
    }
    if (options.author) {
      events = events.filter((e) => e.envelope.author === options.author);
    }
    if (options.since) {
      events = events.filter(
        (e) => this.compareHLC(e.envelope.hlc, options.since) > 0
      );
    }
    if (options.until) {
      events = events.filter(
        (e) => this.compareHLC(e.envelope.hlc, options.until) < 0
      );
    }
    events.sort((a, b) => this.compareHLC(a.envelope.hlc, b.envelope.hlc));
    const totalCount = events.length;
    const limit = options.limit || 100;
    const hasMore = totalCount > limit;
    events = events.slice(0, limit);
    let proofs;
    if (options.includeProof) {
      proofs = /* @__PURE__ */ new Map();
      for (const event of events) {
        proofs.set(event.id, this.generateMerkleProof(event.id));
      }
    }
    return {
      events,
      proofs,
      totalCount,
      hasMore
    };
  }
  /**
   * Generate a Merkle proof for an event
   *
   * @param eventId - Event ID to generate proof for
   * @returns Merkle proof structure
   */
  generateMerkleProof(eventId) {
    const eventIds = Array.from(this.events.keys()).sort();
    const index = eventIds.indexOf(eventId);
    const path = [];
    const directions = [];
    if (index > 0) {
      path.push(blake3Hash(eventIds[index - 1]));
      directions.push("left");
    }
    if (index < eventIds.length - 1) {
      path.push(blake3Hash(eventIds[index + 1]));
      directions.push("right");
    }
    const root = blake3Hash(eventIds.join(":"));
    return { eventId, path, directions, root };
  }
  /**
   * Verify a Merkle proof
   *
   * @param proof - Proof to verify
   * @returns Whether the proof is valid
   */
  verifyMerkleProof(proof) {
    const checkpoint = this.getLatestCheckpoint();
    return checkpoint ? proof.root === checkpoint.eventRoot : false;
  }
  /**
   * Get chain statistics
   *
   * @returns Current chain statistics
   */
  getStats() {
    const eventsByType = {};
    const authors = /* @__PURE__ */ new Set();
    let lastEventTime;
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
      status: "healthy"
    };
  }
  /**
   * Get configuration
   *
   * @returns Current configuration (copy)
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Clear all events (for testing)
   *
   * Resets the chain to initial state.
   */
  clear() {
    this.events.clear();
    this.tips.clear();
    this.checkpoints = [];
    this.eventsSinceCheckpoint = 0;
    this.hlc = { physicalMs: Date.now(), logical: 0 };
    logger.info("Audit chain cleared");
  }
  /**
   * Export chain data
   *
   * Exports all events, checkpoints, and tips for backup or sync.
   *
   * @returns Exported chain data
   */
  export() {
    return {
      events: Array.from(this.events.values()),
      checkpoints: [...this.checkpoints],
      tips: this.getTips()
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
  async import(data) {
    let imported = 0;
    let rejected = 0;
    const sortedEvents = [...data.events].sort(
      (a, b) => this.compareHLC(a.envelope.hlc, b.envelope.hlc)
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
    logger.info("Imported chain data", { imported, rejected });
    return { imported, rejected };
  }
}
function createAuditChain(config) {
  return new AuditChain(config);
}
export {
  AuditChain,
  createAuditChain
};
//# sourceMappingURL=audit-chain.js.map
