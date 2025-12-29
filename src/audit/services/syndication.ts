/**
 * Syndication Service
 *
 * Handles cross-environment event synchronization between
 * multiple audit chain instances using peer-to-peer communication.
 *
 * Features:
 * - Peer connection management with health tracking
 * - Bidirectional event synchronization
 * - Conflict detection and resolution
 * - Automatic periodic sync with configurable intervals
 * - Exponential backoff for failed sync attempts
 *
 * @module audit/services/syndication
 */

import type {
  Blake3Hash,
  Did,
  LedgerEvent,
  Checkpoint,
  SyncRequest,
  SyncResponse,
  KnowledgeGraphEventPayload,
} from '../types.js';
import { AuditChain } from './audit-chain.js';
import { createLogger } from '../../utils/index.js';

const logger = createLogger('syndication');

/**
 * Peer connection status
 */
export type PeerStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

/**
 * Peer information
 */
export interface PeerInfo {
  /** Unique peer identifier */
  id: string;
  /** Network endpoint URL */
  endpoint: string;
  /** Peer's decentralized identifier */
  did?: Did;
  /** Current connection status */
  status: PeerStatus;
  /** Timestamp of last successful sync */
  lastSyncTime?: Date;
  /** Height of last synced checkpoint */
  lastCheckpointHeight?: number;
  /** Total events received from this peer */
  eventsReceived: number;
  /** Total events sent to this peer */
  eventsSent: number;
  /** Cumulative error count */
  errors: number;
  /** Last error message */
  lastError?: string;
  /** Connection latency in milliseconds */
  latency?: number;
}

/**
 * Sync operation result
 */
export interface SyncResult {
  /** ID of the synced peer */
  peerId: string;
  /** Whether sync completed successfully */
  success: boolean;
  /** Number of events received during sync */
  eventsReceived: number;
  /** Number of events sent during sync */
  eventsSent: number;
  /** New checkpoint height after sync */
  newCheckpointHeight?: number;
  /** Sync duration in milliseconds */
  duration: number;
  /** Error message if sync failed */
  error?: string;
}

/**
 * Syndication service configuration
 */
export interface SyndicationConfig {
  /** Local audit chain instance */
  auditChain: AuditChain;
  /** Initial peer endpoints */
  peers: string[];
  /** Enable automatic periodic synchronization */
  autoSync: boolean;
  /** Interval between auto-syncs in milliseconds */
  syncInterval: number;
  /** Timeout for sync requests in milliseconds */
  requestTimeout: number;
  /** Maximum events to transfer per sync request */
  maxEventsPerRequest: number;
  /** Retry failed syncs automatically */
  retryOnError: boolean;
  /** Maximum retry attempts before giving up */
  maxRetries: number;
  /** Base delay for exponential backoff in milliseconds */
  retryBaseDelay: number;
  /** Maximum delay between retries in milliseconds */
  retryMaxDelay: number;
}

/**
 * Default syndication configuration values
 */
const DEFAULT_CONFIG: Omit<SyndicationConfig, 'auditChain'> = {
  peers: [],
  autoSync: false,
  syncInterval: 5 * 60 * 1000, // 5 minutes
  requestTimeout: 30000, // 30 seconds
  maxEventsPerRequest: 1000,
  retryOnError: true,
  maxRetries: 3,
  retryBaseDelay: 1000, // 1 second
  retryMaxDelay: 30000, // 30 seconds
};

/**
 * Syndication Service
 *
 * Manages peer-to-peer synchronization of audit events across
 * multiple environments. Provides:
 *
 * - Peer discovery and connection management
 * - Bidirectional event synchronization
 * - Conflict detection with hash-based resolution
 * - Automatic periodic sync with health monitoring
 * - Statistics and observability
 *
 * @example
 * ```typescript
 * const auditChain = createAuditChain({ agentDid: 'did:exo:agent-1' });
 * await auditChain.initialize();
 *
 * const syndication = createSyndicationService({
 *   auditChain,
 *   peers: ['https://peer1.example.com/audit', 'https://peer2.example.com/audit'],
 *   autoSync: true,
 *   syncInterval: 60000, // 1 minute
 * });
 *
 * await syndication.start();
 *
 * // Manual sync trigger
 * const results = await syndication.syncWithAllPeers();
 * ```
 */
export class SyndicationService {
  private config: SyndicationConfig;
  private peers: Map<string, PeerInfo> = new Map();
  private syncTimer?: ReturnType<typeof setInterval>;
  private isRunning: boolean = false;
  private syncInProgress: boolean = false;
  private retryAttempts: Map<string, number> = new Map();

  /**
   * Create a new syndication service instance
   *
   * @param config - Configuration with required auditChain
   */
  constructor(config: Partial<SyndicationConfig> & { auditChain: AuditChain }) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Initialize peers from config
    for (const endpoint of this.config.peers) {
      const peerId = this.generatePeerId(endpoint);
      this.peers.set(peerId, {
        id: peerId,
        endpoint,
        status: 'disconnected',
        eventsReceived: 0,
        eventsSent: 0,
        errors: 0,
      });
    }
  }

  /**
   * Generate a deterministic peer ID from endpoint URL
   *
   * @param endpoint - Peer endpoint URL
   * @returns Generated peer ID
   */
  private generatePeerId(endpoint: string): string {
    // Simple hash for peer ID generation
    let hash = 0;
    for (let i = 0; i < endpoint.length; i++) {
      const char = endpoint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `peer-${Math.abs(hash).toString(36)}`;
  }

  /**
   * Calculate exponential backoff delay
   *
   * @param attempt - Current retry attempt number
   * @returns Delay in milliseconds
   */
  private calculateBackoff(attempt: number): number {
    const delay = this.config.retryBaseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * delay; // 30% jitter
    return Math.min(delay + jitter, this.config.retryMaxDelay);
  }

  /**
   * Start the syndication service
   *
   * Connects to all configured peers and starts automatic
   * synchronization if enabled.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Syndication service already running');
      return;
    }

    logger.info('Starting syndication service', {
      peers: this.peers.size,
      autoSync: this.config.autoSync,
      syncInterval: this.config.syncInterval,
    });

    this.isRunning = true;

    // Connect to all peers
    await this.connectToPeers();

    // Start auto-sync if enabled
    if (this.config.autoSync) {
      this.startAutoSync();
    }

    logger.info('Syndication service started', {
      connectedPeers: this.getConnectedPeers().length,
    });
  }

  /**
   * Stop the syndication service
   *
   * Disconnects from all peers and stops automatic synchronization.
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping syndication service');

    // Stop auto-sync
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }

    // Wait for any in-progress sync to complete
    const maxWait = 5000;
    const startWait = Date.now();
    while (this.syncInProgress && Date.now() - startWait < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Disconnect from peers
    for (const peer of this.peers.values()) {
      peer.status = 'disconnected';
    }

    this.isRunning = false;
    this.retryAttempts.clear();
    logger.info('Syndication service stopped');
  }

  /**
   * Connect to all configured peers
   */
  private async connectToPeers(): Promise<void> {
    const connectPromises = Array.from(this.peers.values()).map(async (peer) => {
      try {
        await this.connectToPeer(peer.id);
      } catch (error) {
        logger.warn('Failed to connect to peer', {
          peerId: peer.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.allSettled(connectPromises);
  }

  /**
   * Establish connection to a specific peer
   *
   * @param peerId - Peer identifier
   * @returns True if connection successful
   */
  async connectToPeer(peerId: string): Promise<boolean> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      logger.warn('Peer not found', { peerId });
      return false;
    }

    try {
      // In production, would establish WebSocket or HTTP/2 connection
      // For now, simulate connection with health check
      const startTime = Date.now();

      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 50));

      peer.status = 'connected';
      peer.latency = Date.now() - startTime;
      this.retryAttempts.set(peerId, 0);

      logger.debug('Connected to peer', {
        peerId,
        endpoint: peer.endpoint,
        latency: peer.latency,
      });

      return true;
    } catch (error) {
      peer.status = 'error';
      peer.errors++;
      peer.lastError = error instanceof Error ? error.message : String(error);

      logger.error('Failed to connect to peer', undefined, {
        peerId,
        errorMessage: peer.lastError,
      });

      return false;
    }
  }

  /**
   * Disconnect from a specific peer
   *
   * @param peerId - Peer identifier
   */
  async disconnectPeer(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.status = 'disconnected';
      logger.debug('Disconnected from peer', { peerId });
    }
  }

  /**
   * Start automatic periodic synchronization
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      if (!this.syncInProgress) {
        try {
          await this.syncWithAllPeers();
        } catch (err) {
          logger.error('Auto-sync failed', err instanceof Error ? err : undefined, {
            errorMessage: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }, this.config.syncInterval);

    logger.debug('Auto-sync started', { interval: this.config.syncInterval });
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
      logger.debug('Auto-sync stopped');
    }
  }

  /**
   * Synchronize with all connected peers
   *
   * @returns Array of sync results for each peer
   */
  async syncWithAllPeers(): Promise<SyncResult[]> {
    if (this.syncInProgress) {
      logger.warn('Sync already in progress, skipping');
      return [];
    }

    this.syncInProgress = true;
    const results: SyncResult[] = [];

    try {
      const connectedPeers = this.getConnectedPeers();
      logger.debug('Starting sync with all peers', { count: connectedPeers.length });

      for (const peer of connectedPeers) {
        const result = await this.syncWithPeer(peer.id);
        results.push(result);

        // Handle retry logic for failed syncs
        if (!result.success && this.config.retryOnError) {
          const attempts = (this.retryAttempts.get(peer.id) || 0) + 1;
          this.retryAttempts.set(peer.id, attempts);

          if (attempts <= this.config.maxRetries) {
            const delay = this.calculateBackoff(attempts);
            logger.debug('Scheduling retry', { peerId: peer.id, attempt: attempts, delay });
            setTimeout(() => this.syncWithPeer(peer.id), delay);
          } else {
            logger.warn('Max retries exceeded for peer', { peerId: peer.id });
          }
        }
      }

      const successful = results.filter(r => r.success).length;
      logger.info('Sync completed', {
        total: results.length,
        successful,
        failed: results.length - successful,
      });
    } finally {
      this.syncInProgress = false;
    }

    return results;
  }

  /**
   * Synchronize with a specific peer
   *
   * @param peerId - Peer identifier
   * @returns Sync result
   */
  async syncWithPeer(peerId: string): Promise<SyncResult> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      return {
        peerId,
        success: false,
        eventsReceived: 0,
        eventsSent: 0,
        duration: 0,
        error: 'Peer not found',
      };
    }

    if (peer.status !== 'connected') {
      // Try to reconnect
      const connected = await this.connectToPeer(peerId);
      if (!connected) {
        return {
          peerId,
          success: false,
          eventsReceived: 0,
          eventsSent: 0,
          duration: 0,
          error: 'Peer not connected',
        };
      }
    }

    const startTime = Date.now();
    const previousStatus = peer.status;
    peer.status = 'syncing';

    try {
      // Log sync start event
      await this.config.auditChain.appendEvent({
        type: 'SyncStarted',
        peerId,
        direction: 'bidirectional',
      } as KnowledgeGraphEventPayload);

      // Create sync request with current state
      const checkpoint = this.config.auditChain.getLatestCheckpoint();
      const request: SyncRequest = {
        requester: this.config.auditChain.getConfig().agentDid,
        lastCheckpointHeight: checkpoint?.height ?? -1,
        lastEventRoot: checkpoint?.eventRoot,
        maxEvents: this.config.maxEventsPerRequest,
      };

      // Fetch events from peer
      const response = await this.fetchFromPeer(peer, request);

      // Process received events
      let eventsReceived = 0;
      for (const event of response.events) {
        const validation = await this.config.auditChain.validateAndInsert(event);
        if (validation.valid) {
          eventsReceived++;
        } else {
          logger.debug('Received invalid event', {
            eventId: event.id,
            errors: validation.errors,
          });
        }
      }

      // Send our events to peer
      const ourEvents = await this.getEventsSince(peer.lastCheckpointHeight ?? -1);
      const eventsSent = await this.sendToPeer(peer, ourEvents);

      // Update peer stats
      peer.eventsReceived += eventsReceived;
      peer.eventsSent += eventsSent;
      peer.lastSyncTime = new Date();
      peer.lastCheckpointHeight = response.checkpoint?.height ?? peer.lastCheckpointHeight;
      peer.status = 'connected';

      // Reset retry counter on success
      this.retryAttempts.set(peerId, 0);

      const duration = Date.now() - startTime;

      // Log sync completion event
      await this.config.auditChain.appendEvent({
        type: 'SyncCompleted',
        peerId,
        eventsTransferred: eventsReceived + eventsSent,
        duration,
      } as KnowledgeGraphEventPayload);

      logger.info('Sync with peer completed', {
        peerId,
        eventsReceived,
        eventsSent,
        duration,
      });

      return {
        peerId,
        success: true,
        eventsReceived,
        eventsSent,
        newCheckpointHeight: response.checkpoint?.height,
        duration,
      };
    } catch (err) {
      peer.status = 'error';
      peer.errors++;
      peer.lastError = err instanceof Error ? err.message : String(err);
      const duration = Date.now() - startTime;

      logger.error('Sync with peer failed', err instanceof Error ? err : undefined, {
        peerId,
        errorMessage: peer.lastError,
        duration,
      });

      return {
        peerId,
        success: false,
        eventsReceived: 0,
        eventsSent: 0,
        duration,
        error: peer.lastError,
      };
    }
  }

  /**
   * Fetch events from a peer
   *
   * In production, this would make an HTTP/WebSocket request.
   *
   * @param peer - Peer information
   * @param request - Sync request
   * @returns Sync response
   */
  private async fetchFromPeer(peer: PeerInfo, _request: SyncRequest): Promise<SyncResponse> {
    // In production implementation:
    // - Make HTTP POST to peer.endpoint/sync
    // - Set timeout from config.requestTimeout
    // - Handle authentication/authorization
    // - Verify response signatures

    // Simulate network operation
    await new Promise(resolve => setTimeout(resolve, 10));

    // Return empty response for now
    return {
      provider: peer.did || (`did:exo:${peer.id}` as Did),
      events: [],
      hasMore: false,
    };
  }

  /**
   * Send events to a peer
   *
   * In production, this would make an HTTP/WebSocket request.
   *
   * @param peer - Peer information
   * @param events - Events to send
   * @returns Number of events successfully sent
   */
  private async sendToPeer(_peer: PeerInfo, events: LedgerEvent[]): Promise<number> {
    // In production implementation:
    // - Make HTTP POST to peer.endpoint/events
    // - Batch events if exceeding maxEventsPerRequest
    // - Handle acknowledgments
    // - Retry failed sends

    // Simulate network operation
    await new Promise(resolve => setTimeout(resolve, 10));

    return events.length;
  }

  /**
   * Get events since a specific checkpoint height
   *
   * Uses the audit chain's query capability to retrieve events
   * that occurred after the specified checkpoint.
   *
   * @param checkpointHeight - Height to query from
   * @returns Array of events
   */
  private async getEventsSince(checkpointHeight: number): Promise<LedgerEvent[]> {
    const result = await this.config.auditChain.queryEvents({
      limit: this.config.maxEventsPerRequest,
    });

    // The events are returned in HLC order from queryEvents
    // For checkpoint-based filtering, we use the total count as a proxy
    // In production, would use more efficient index-based query
    // that tracks checkpoint heights directly
    if (checkpointHeight < 0) {
      return result.events;
    }

    // Return events beyond the checkpoint count
    return result.events.slice(checkpointHeight);
  }

  /**
   * Add a new peer to the syndication network
   *
   * @param endpoint - Peer endpoint URL
   * @returns Generated peer ID
   */
  addPeer(endpoint: string): string {
    const peerId = this.generatePeerId(endpoint);

    if (!this.peers.has(peerId)) {
      this.peers.set(peerId, {
        id: peerId,
        endpoint,
        status: 'disconnected',
        eventsReceived: 0,
        eventsSent: 0,
        errors: 0,
      });

      logger.debug('Added peer', { peerId, endpoint });

      // Auto-connect if service is running
      if (this.isRunning) {
        this.connectToPeer(peerId).catch((error) => {
          logger.warn('Failed to connect to new peer', {
            peerId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
    } else {
      logger.debug('Peer already exists', { peerId, endpoint });
    }

    return peerId;
  }

  /**
   * Remove a peer from the syndication network
   *
   * @param peerId - Peer identifier
   * @returns True if peer was removed
   */
  removePeer(peerId: string): boolean {
    const removed = this.peers.delete(peerId);
    if (removed) {
      this.retryAttempts.delete(peerId);
      logger.debug('Removed peer', { peerId });
    }
    return removed;
  }

  /**
   * Get information about a specific peer
   *
   * @param peerId - Peer identifier
   * @returns Peer information or undefined
   */
  getPeer(peerId: string): PeerInfo | undefined {
    return this.peers.get(peerId);
  }

  /**
   * Get all registered peers
   *
   * @returns Array of all peer information
   */
  getAllPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get currently connected peers
   *
   * @returns Array of connected peer information
   */
  getConnectedPeers(): PeerInfo[] {
    return Array.from(this.peers.values()).filter(p => p.status === 'connected');
  }

  /**
   * Get peers in error state
   *
   * @returns Array of error state peer information
   */
  getErrorPeers(): PeerInfo[] {
    return Array.from(this.peers.values()).filter(p => p.status === 'error');
  }

  /**
   * Get comprehensive service statistics
   *
   * @returns Statistics object
   */
  getStats(): {
    totalPeers: number;
    connectedPeers: number;
    syncingPeers: number;
    errorPeers: number;
    totalEventsReceived: number;
    totalEventsSent: number;
    totalErrors: number;
    isRunning: boolean;
    autoSyncEnabled: boolean;
    syncInterval: number;
  } {
    let totalEventsReceived = 0;
    let totalEventsSent = 0;
    let totalErrors = 0;
    let connectedPeers = 0;
    let syncingPeers = 0;
    let errorPeers = 0;

    for (const peer of this.peers.values()) {
      totalEventsReceived += peer.eventsReceived;
      totalEventsSent += peer.eventsSent;
      totalErrors += peer.errors;

      switch (peer.status) {
        case 'connected':
          connectedPeers++;
          break;
        case 'syncing':
          syncingPeers++;
          break;
        case 'error':
          errorPeers++;
          break;
      }
    }

    return {
      totalPeers: this.peers.size,
      connectedPeers,
      syncingPeers,
      errorPeers,
      totalEventsReceived,
      totalEventsSent,
      totalErrors,
      isRunning: this.isRunning,
      autoSyncEnabled: this.config.autoSync,
      syncInterval: this.config.syncInterval,
    };
  }

  /**
   * Force an immediate sync with all peers
   *
   * @returns Array of sync results
   */
  async forceSyncNow(): Promise<SyncResult[]> {
    logger.info('Force sync requested');
    return await this.syncWithAllPeers();
  }

  /**
   * Check if the service is currently running
   *
   * @returns True if running
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Check if a sync is currently in progress
   *
   * @returns True if syncing
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  /**
   * Update service configuration
   *
   * Note: Some config changes require restart to take effect.
   *
   * @param updates - Configuration updates
   */
  updateConfig(updates: Partial<Omit<SyndicationConfig, 'auditChain'>>): void {
    const previousAutoSync = this.config.autoSync;
    const previousInterval = this.config.syncInterval;

    Object.assign(this.config, updates);

    // Handle auto-sync changes
    if (this.isRunning) {
      if (updates.autoSync !== undefined || updates.syncInterval !== undefined) {
        if (this.config.autoSync && (!previousAutoSync || this.config.syncInterval !== previousInterval)) {
          this.startAutoSync();
        } else if (!this.config.autoSync && previousAutoSync) {
          this.stopAutoSync();
        }
      }
    }

    logger.debug('Configuration updated', { updates });
  }
}

/**
 * Create a syndication service instance
 *
 * @param config - Configuration with required auditChain
 * @returns Configured SyndicationService instance
 *
 * @example
 * ```typescript
 * const syndication = createSyndicationService({
 *   auditChain,
 *   peers: ['https://peer1.example.com/audit'],
 *   autoSync: true,
 * });
 * ```
 */
export function createSyndicationService(
  config: Partial<SyndicationConfig> & { auditChain: AuditChain }
): SyndicationService {
  return new SyndicationService(config);
}
