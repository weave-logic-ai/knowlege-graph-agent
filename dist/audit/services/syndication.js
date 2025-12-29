import { createLogger } from "../../utils/logger.js";
const logger = createLogger("syndication");
const DEFAULT_CONFIG = {
  peers: [],
  autoSync: false,
  syncInterval: 5 * 60 * 1e3,
  // 5 minutes
  requestTimeout: 3e4,
  // 30 seconds
  maxEventsPerRequest: 1e3,
  retryOnError: true,
  maxRetries: 3,
  retryBaseDelay: 1e3,
  // 1 second
  retryMaxDelay: 3e4
  // 30 seconds
};
class SyndicationService {
  config;
  peers = /* @__PURE__ */ new Map();
  syncTimer;
  isRunning = false;
  syncInProgress = false;
  retryAttempts = /* @__PURE__ */ new Map();
  /**
   * Create a new syndication service instance
   *
   * @param config - Configuration with required auditChain
   */
  constructor(config) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    for (const endpoint of this.config.peers) {
      const peerId = this.generatePeerId(endpoint);
      this.peers.set(peerId, {
        id: peerId,
        endpoint,
        status: "disconnected",
        eventsReceived: 0,
        eventsSent: 0,
        errors: 0
      });
    }
  }
  /**
   * Generate a deterministic peer ID from endpoint URL
   *
   * @param endpoint - Peer endpoint URL
   * @returns Generated peer ID
   */
  generatePeerId(endpoint) {
    let hash = 0;
    for (let i = 0; i < endpoint.length; i++) {
      const char = endpoint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
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
  calculateBackoff(attempt) {
    const delay = this.config.retryBaseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * delay;
    return Math.min(delay + jitter, this.config.retryMaxDelay);
  }
  /**
   * Start the syndication service
   *
   * Connects to all configured peers and starts automatic
   * synchronization if enabled.
   */
  async start() {
    if (this.isRunning) {
      logger.warn("Syndication service already running");
      return;
    }
    logger.info("Starting syndication service", {
      peers: this.peers.size,
      autoSync: this.config.autoSync,
      syncInterval: this.config.syncInterval
    });
    this.isRunning = true;
    await this.connectToPeers();
    if (this.config.autoSync) {
      this.startAutoSync();
    }
    logger.info("Syndication service started", {
      connectedPeers: this.getConnectedPeers().length
    });
  }
  /**
   * Stop the syndication service
   *
   * Disconnects from all peers and stops automatic synchronization.
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }
    logger.info("Stopping syndication service");
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = void 0;
    }
    const maxWait = 5e3;
    const startWait = Date.now();
    while (this.syncInProgress && Date.now() - startWait < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    for (const peer of this.peers.values()) {
      peer.status = "disconnected";
    }
    this.isRunning = false;
    this.retryAttempts.clear();
    logger.info("Syndication service stopped");
  }
  /**
   * Connect to all configured peers
   */
  async connectToPeers() {
    const connectPromises = Array.from(this.peers.values()).map(async (peer) => {
      try {
        await this.connectToPeer(peer.id);
      } catch (error) {
        logger.warn("Failed to connect to peer", {
          peerId: peer.id,
          error: error instanceof Error ? error.message : String(error)
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
  async connectToPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      logger.warn("Peer not found", { peerId });
      return false;
    }
    try {
      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 50));
      peer.status = "connected";
      peer.latency = Date.now() - startTime;
      this.retryAttempts.set(peerId, 0);
      logger.debug("Connected to peer", {
        peerId,
        endpoint: peer.endpoint,
        latency: peer.latency
      });
      return true;
    } catch (error) {
      peer.status = "error";
      peer.errors++;
      peer.lastError = error instanceof Error ? error.message : String(error);
      logger.error("Failed to connect to peer", void 0, {
        peerId,
        errorMessage: peer.lastError
      });
      return false;
    }
  }
  /**
   * Disconnect from a specific peer
   *
   * @param peerId - Peer identifier
   */
  async disconnectPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.status = "disconnected";
      logger.debug("Disconnected from peer", { peerId });
    }
  }
  /**
   * Start automatic periodic synchronization
   */
  startAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    this.syncTimer = setInterval(async () => {
      if (!this.syncInProgress) {
        try {
          await this.syncWithAllPeers();
        } catch (err) {
          logger.error("Auto-sync failed", err instanceof Error ? err : void 0, {
            errorMessage: err instanceof Error ? err.message : String(err)
          });
        }
      }
    }, this.config.syncInterval);
    logger.debug("Auto-sync started", { interval: this.config.syncInterval });
  }
  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = void 0;
      logger.debug("Auto-sync stopped");
    }
  }
  /**
   * Synchronize with all connected peers
   *
   * @returns Array of sync results for each peer
   */
  async syncWithAllPeers() {
    if (this.syncInProgress) {
      logger.warn("Sync already in progress, skipping");
      return [];
    }
    this.syncInProgress = true;
    const results = [];
    try {
      const connectedPeers = this.getConnectedPeers();
      logger.debug("Starting sync with all peers", { count: connectedPeers.length });
      for (const peer of connectedPeers) {
        const result = await this.syncWithPeer(peer.id);
        results.push(result);
        if (!result.success && this.config.retryOnError) {
          const attempts = (this.retryAttempts.get(peer.id) || 0) + 1;
          this.retryAttempts.set(peer.id, attempts);
          if (attempts <= this.config.maxRetries) {
            const delay = this.calculateBackoff(attempts);
            logger.debug("Scheduling retry", { peerId: peer.id, attempt: attempts, delay });
            setTimeout(() => this.syncWithPeer(peer.id), delay);
          } else {
            logger.warn("Max retries exceeded for peer", { peerId: peer.id });
          }
        }
      }
      const successful = results.filter((r) => r.success).length;
      logger.info("Sync completed", {
        total: results.length,
        successful,
        failed: results.length - successful
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
  async syncWithPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      return {
        peerId,
        success: false,
        eventsReceived: 0,
        eventsSent: 0,
        duration: 0,
        error: "Peer not found"
      };
    }
    if (peer.status !== "connected") {
      const connected = await this.connectToPeer(peerId);
      if (!connected) {
        return {
          peerId,
          success: false,
          eventsReceived: 0,
          eventsSent: 0,
          duration: 0,
          error: "Peer not connected"
        };
      }
    }
    const startTime = Date.now();
    peer.status;
    peer.status = "syncing";
    try {
      await this.config.auditChain.appendEvent({
        type: "SyncStarted",
        peerId,
        direction: "bidirectional"
      });
      const checkpoint = this.config.auditChain.getLatestCheckpoint();
      const request = {
        requester: this.config.auditChain.getConfig().agentDid,
        lastCheckpointHeight: checkpoint?.height ?? -1,
        lastEventRoot: checkpoint?.eventRoot,
        maxEvents: this.config.maxEventsPerRequest
      };
      const response = await this.fetchFromPeer(peer, request);
      let eventsReceived = 0;
      for (const event of response.events) {
        const validation = await this.config.auditChain.validateAndInsert(event);
        if (validation.valid) {
          eventsReceived++;
        } else {
          logger.debug("Received invalid event", {
            eventId: event.id,
            errors: validation.errors
          });
        }
      }
      const ourEvents = await this.getEventsSince(peer.lastCheckpointHeight ?? -1);
      const eventsSent = await this.sendToPeer(peer, ourEvents);
      peer.eventsReceived += eventsReceived;
      peer.eventsSent += eventsSent;
      peer.lastSyncTime = /* @__PURE__ */ new Date();
      peer.lastCheckpointHeight = response.checkpoint?.height ?? peer.lastCheckpointHeight;
      peer.status = "connected";
      this.retryAttempts.set(peerId, 0);
      const duration = Date.now() - startTime;
      await this.config.auditChain.appendEvent({
        type: "SyncCompleted",
        peerId,
        eventsTransferred: eventsReceived + eventsSent,
        duration
      });
      logger.info("Sync with peer completed", {
        peerId,
        eventsReceived,
        eventsSent,
        duration
      });
      return {
        peerId,
        success: true,
        eventsReceived,
        eventsSent,
        newCheckpointHeight: response.checkpoint?.height,
        duration
      };
    } catch (err) {
      peer.status = "error";
      peer.errors++;
      peer.lastError = err instanceof Error ? err.message : String(err);
      const duration = Date.now() - startTime;
      logger.error("Sync with peer failed", err instanceof Error ? err : void 0, {
        peerId,
        errorMessage: peer.lastError,
        duration
      });
      return {
        peerId,
        success: false,
        eventsReceived: 0,
        eventsSent: 0,
        duration,
        error: peer.lastError
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
  async fetchFromPeer(peer, _request) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      provider: peer.did || `did:exo:${peer.id}`,
      events: [],
      hasMore: false
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
  async sendToPeer(_peer, events) {
    await new Promise((resolve) => setTimeout(resolve, 10));
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
  async getEventsSince(checkpointHeight) {
    const result = await this.config.auditChain.queryEvents({
      limit: this.config.maxEventsPerRequest
    });
    if (checkpointHeight < 0) {
      return result.events;
    }
    return result.events.slice(checkpointHeight);
  }
  /**
   * Add a new peer to the syndication network
   *
   * @param endpoint - Peer endpoint URL
   * @returns Generated peer ID
   */
  addPeer(endpoint) {
    const peerId = this.generatePeerId(endpoint);
    if (!this.peers.has(peerId)) {
      this.peers.set(peerId, {
        id: peerId,
        endpoint,
        status: "disconnected",
        eventsReceived: 0,
        eventsSent: 0,
        errors: 0
      });
      logger.debug("Added peer", { peerId, endpoint });
      if (this.isRunning) {
        this.connectToPeer(peerId).catch((error) => {
          logger.warn("Failed to connect to new peer", {
            peerId,
            error: error instanceof Error ? error.message : String(error)
          });
        });
      }
    } else {
      logger.debug("Peer already exists", { peerId, endpoint });
    }
    return peerId;
  }
  /**
   * Remove a peer from the syndication network
   *
   * @param peerId - Peer identifier
   * @returns True if peer was removed
   */
  removePeer(peerId) {
    const removed = this.peers.delete(peerId);
    if (removed) {
      this.retryAttempts.delete(peerId);
      logger.debug("Removed peer", { peerId });
    }
    return removed;
  }
  /**
   * Get information about a specific peer
   *
   * @param peerId - Peer identifier
   * @returns Peer information or undefined
   */
  getPeer(peerId) {
    return this.peers.get(peerId);
  }
  /**
   * Get all registered peers
   *
   * @returns Array of all peer information
   */
  getAllPeers() {
    return Array.from(this.peers.values());
  }
  /**
   * Get currently connected peers
   *
   * @returns Array of connected peer information
   */
  getConnectedPeers() {
    return Array.from(this.peers.values()).filter((p) => p.status === "connected");
  }
  /**
   * Get peers in error state
   *
   * @returns Array of error state peer information
   */
  getErrorPeers() {
    return Array.from(this.peers.values()).filter((p) => p.status === "error");
  }
  /**
   * Get comprehensive service statistics
   *
   * @returns Statistics object
   */
  getStats() {
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
        case "connected":
          connectedPeers++;
          break;
        case "syncing":
          syncingPeers++;
          break;
        case "error":
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
      syncInterval: this.config.syncInterval
    };
  }
  /**
   * Force an immediate sync with all peers
   *
   * @returns Array of sync results
   */
  async forceSyncNow() {
    logger.info("Force sync requested");
    return await this.syncWithAllPeers();
  }
  /**
   * Check if the service is currently running
   *
   * @returns True if running
   */
  isServiceRunning() {
    return this.isRunning;
  }
  /**
   * Check if a sync is currently in progress
   *
   * @returns True if syncing
   */
  isSyncing() {
    return this.syncInProgress;
  }
  /**
   * Update service configuration
   *
   * Note: Some config changes require restart to take effect.
   *
   * @param updates - Configuration updates
   */
  updateConfig(updates) {
    const previousAutoSync = this.config.autoSync;
    const previousInterval = this.config.syncInterval;
    Object.assign(this.config, updates);
    if (this.isRunning) {
      if (updates.autoSync !== void 0 || updates.syncInterval !== void 0) {
        if (this.config.autoSync && (!previousAutoSync || this.config.syncInterval !== previousInterval)) {
          this.startAutoSync();
        } else if (!this.config.autoSync && previousAutoSync) {
          this.stopAutoSync();
        }
      }
    }
    logger.debug("Configuration updated", { updates });
  }
}
function createSyndicationService(config) {
  return new SyndicationService(config);
}
export {
  SyndicationService,
  createSyndicationService
};
//# sourceMappingURL=syndication.js.map
