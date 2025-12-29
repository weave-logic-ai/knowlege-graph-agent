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
import type { Did } from '../types.js';
import { AuditChain } from './audit-chain.js';
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
export declare class SyndicationService {
    private config;
    private peers;
    private syncTimer?;
    private isRunning;
    private syncInProgress;
    private retryAttempts;
    /**
     * Create a new syndication service instance
     *
     * @param config - Configuration with required auditChain
     */
    constructor(config: Partial<SyndicationConfig> & {
        auditChain: AuditChain;
    });
    /**
     * Generate a deterministic peer ID from endpoint URL
     *
     * @param endpoint - Peer endpoint URL
     * @returns Generated peer ID
     */
    private generatePeerId;
    /**
     * Calculate exponential backoff delay
     *
     * @param attempt - Current retry attempt number
     * @returns Delay in milliseconds
     */
    private calculateBackoff;
    /**
     * Start the syndication service
     *
     * Connects to all configured peers and starts automatic
     * synchronization if enabled.
     */
    start(): Promise<void>;
    /**
     * Stop the syndication service
     *
     * Disconnects from all peers and stops automatic synchronization.
     */
    stop(): Promise<void>;
    /**
     * Connect to all configured peers
     */
    private connectToPeers;
    /**
     * Establish connection to a specific peer
     *
     * @param peerId - Peer identifier
     * @returns True if connection successful
     */
    connectToPeer(peerId: string): Promise<boolean>;
    /**
     * Disconnect from a specific peer
     *
     * @param peerId - Peer identifier
     */
    disconnectPeer(peerId: string): Promise<void>;
    /**
     * Start automatic periodic synchronization
     */
    private startAutoSync;
    /**
     * Stop automatic synchronization
     */
    stopAutoSync(): void;
    /**
     * Synchronize with all connected peers
     *
     * @returns Array of sync results for each peer
     */
    syncWithAllPeers(): Promise<SyncResult[]>;
    /**
     * Synchronize with a specific peer
     *
     * @param peerId - Peer identifier
     * @returns Sync result
     */
    syncWithPeer(peerId: string): Promise<SyncResult>;
    /**
     * Fetch events from a peer
     *
     * In production, this would make an HTTP/WebSocket request.
     *
     * @param peer - Peer information
     * @param request - Sync request
     * @returns Sync response
     */
    private fetchFromPeer;
    /**
     * Send events to a peer
     *
     * In production, this would make an HTTP/WebSocket request.
     *
     * @param peer - Peer information
     * @param events - Events to send
     * @returns Number of events successfully sent
     */
    private sendToPeer;
    /**
     * Get events since a specific checkpoint height
     *
     * Uses the audit chain's query capability to retrieve events
     * that occurred after the specified checkpoint.
     *
     * @param checkpointHeight - Height to query from
     * @returns Array of events
     */
    private getEventsSince;
    /**
     * Add a new peer to the syndication network
     *
     * @param endpoint - Peer endpoint URL
     * @returns Generated peer ID
     */
    addPeer(endpoint: string): string;
    /**
     * Remove a peer from the syndication network
     *
     * @param peerId - Peer identifier
     * @returns True if peer was removed
     */
    removePeer(peerId: string): boolean;
    /**
     * Get information about a specific peer
     *
     * @param peerId - Peer identifier
     * @returns Peer information or undefined
     */
    getPeer(peerId: string): PeerInfo | undefined;
    /**
     * Get all registered peers
     *
     * @returns Array of all peer information
     */
    getAllPeers(): PeerInfo[];
    /**
     * Get currently connected peers
     *
     * @returns Array of connected peer information
     */
    getConnectedPeers(): PeerInfo[];
    /**
     * Get peers in error state
     *
     * @returns Array of error state peer information
     */
    getErrorPeers(): PeerInfo[];
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
    };
    /**
     * Force an immediate sync with all peers
     *
     * @returns Array of sync results
     */
    forceSyncNow(): Promise<SyncResult[]>;
    /**
     * Check if the service is currently running
     *
     * @returns True if running
     */
    isServiceRunning(): boolean;
    /**
     * Check if a sync is currently in progress
     *
     * @returns True if syncing
     */
    isSyncing(): boolean;
    /**
     * Update service configuration
     *
     * Note: Some config changes require restart to take effect.
     *
     * @param updates - Configuration updates
     */
    updateConfig(updates: Partial<Omit<SyndicationConfig, 'auditChain'>>): void;
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
export declare function createSyndicationService(config: Partial<SyndicationConfig> & {
    auditChain: AuditChain;
}): SyndicationService;
//# sourceMappingURL=syndication.d.ts.map