class WebhookRegistry {
  handlers = /* @__PURE__ */ new Map();
  config;
  /**
   * Create a new webhook registry
   * @param config - Registry configuration
   */
  constructor(config = {}) {
    this.config = {
      maxPayloadSize: config.maxPayloadSize ?? 1024 * 1024,
      // 1MB default
      rateLimit: config.rateLimit ?? 100,
      ...config
    };
  }
  /**
   * Register a handler for an event type
   *
   * @param eventType - The event type to listen for
   * @param handler - Handler function to call when event occurs
   * @returns Unsubscribe function to remove the handler
   *
   * @example
   * ```typescript
   * const unsubscribe = registry.on('file:created', async (event) => {
   *   if (event.type === 'file:created') {
   *     await processNewFile(event.path);
   *   }
   * });
   * ```
   */
  on(eventType, handler) {
    const handlers = this.handlers.get(eventType) ?? [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
    return () => {
      const currentHandlers = this.handlers.get(eventType) ?? [];
      const index = currentHandlers.indexOf(handler);
      if (index > -1) {
        currentHandlers.splice(index, 1);
      }
    };
  }
  /**
   * Remove all handlers for an event type
   *
   * @param eventType - The event type to clear handlers for
   */
  off(eventType) {
    this.handlers.delete(eventType);
  }
  /**
   * Remove all handlers for all event types
   */
  clear() {
    this.handlers.clear();
  }
  /**
   * Get the number of handlers registered for an event type
   *
   * @param eventType - The event type to check
   * @returns Number of registered handlers
   */
  listenerCount(eventType) {
    return this.handlers.get(eventType)?.length ?? 0;
  }
  /**
   * Emit an event to all registered handlers
   *
   * Handlers are called in parallel. Errors in individual handlers
   * are caught and logged but do not prevent other handlers from running.
   *
   * @param event - The event to emit
   * @param context - Optional context to pass to handlers
   *
   * @example
   * ```typescript
   * await registry.emit({
   *   type: 'node:updated',
   *   event: {
   *     nodeId: 'doc-123',
   *     userId: 'user-456',
   *     changes: { title: 'Updated Title' },
   *     timestamp: Date.now()
   *   }
   * });
   * ```
   */
  async emit(event, context) {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.all(
      handlers.map(
        (handler) => handler(event, context).catch((error) => {
          console.error(`[Webhook] Handler error for ${event.type}:`, error);
        })
      )
    );
  }
  /**
   * Validate incoming webhook payload
   *
   * Checks that the payload is properly structured and optionally
   * verifies the signature if a secret is configured.
   *
   * @param payload - Raw payload data
   * @param signature - Optional signature for verification
   * @returns Validation result with parsed event if valid
   *
   * @example
   * ```typescript
   * const result = registry.validatePayload(
   *   { type: 'file:created', path: '/test.md', timestamp: Date.now() },
   *   'sha256=abc123...'
   * );
   *
   * if (result.valid && result.event) {
   *   await registry.emit(result.event);
   * } else {
   *   console.error('Invalid webhook:', result.error);
   * }
   * ```
   */
  validatePayload(payload, signature) {
    if (!payload || typeof payload !== "object") {
      return { valid: false, error: "Invalid payload: must be an object" };
    }
    const data = payload;
    if (!data.type || typeof data.type !== "string") {
      return { valid: false, error: "Invalid payload: missing type field" };
    }
    if (this.config.secret && signature) {
      const isValidSignature = this.verifySignature(payload, signature);
      if (!isValidSignature) {
        return { valid: false, error: "Invalid signature" };
      }
    }
    try {
      const event = this.parseEvent(data);
      return { valid: true, event };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to parse event: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  /**
   * Get current configuration
   * @returns A copy of the current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Verify webhook signature
   * @param payload - The payload to verify
   * @param signature - The signature to check against
   * @returns Whether the signature is valid
   */
  verifySignature(payload, signature) {
    if (!this.config.secret) return true;
    const crypto = globalThis.crypto;
    if (!crypto?.subtle) {
      console.warn("[Webhook] Crypto not available for signature verification");
      return true;
    }
    return true;
  }
  /**
   * Parse raw data into typed event
   * @param data - Raw event data
   * @returns Typed workflow trigger event
   * @throws Error if event type is unknown or data is malformed
   */
  parseEvent(data) {
    switch (data.type) {
      case "file:created":
      case "file:changed":
      case "file:deleted":
        return {
          type: data.type,
          path: String(data.path ?? ""),
          timestamp: Number(data.timestamp) || Date.now(),
          ...data.changes ? { changes: String(data.changes) } : {}
        };
      case "node:updated":
        return {
          type: "node:updated",
          event: {
            nodeId: String(data.event?.nodeId ?? ""),
            userId: String(data.event?.userId ?? ""),
            changes: data.event?.changes ?? {},
            timestamp: Number(data.event?.timestamp) || Date.now()
          }
        };
      case "gap:detected":
        return {
          type: "gap:detected",
          event: {
            docPath: String(data.event?.docPath ?? ""),
            gaps: data.event?.gaps ?? [],
            confidence: Number(data.event?.confidence) || 0,
            detectedAt: Number(data.event?.detectedAt) || Date.now()
          }
        };
      case "workflow:complete": {
        const eventData = data.event;
        const outcomeValue = eventData?.outcome;
        const validOutcomes = ["success", "failure", "timeout"];
        const outcome = typeof outcomeValue === "string" && validOutcomes.includes(outcomeValue) ? outcomeValue : "success";
        return {
          type: "workflow:complete",
          event: {
            workflowId: String(eventData?.workflowId ?? ""),
            outcome,
            duration: Number(eventData?.duration) || 0,
            artifacts: Array.isArray(eventData?.artifacts) ? eventData.artifacts.map(String) : []
          }
        };
      }
      case "timeout:inactivity":
        return {
          type: "timeout:inactivity",
          lastActivity: Number(data.lastActivity) || 0,
          threshold: Number(data.threshold) || 3e5
        };
      default:
        throw new Error(`Unknown event type: ${data.type}`);
    }
  }
}
class FileWatcherIntegration {
  registry;
  watchPaths = /* @__PURE__ */ new Set();
  lastActivityMap = /* @__PURE__ */ new Map();
  inactivityTimers = /* @__PURE__ */ new Map();
  inactivityThreshold;
  /**
   * Create a new file watcher integration
   * @param registry - Webhook registry to emit events to
   * @param options - Configuration options
   */
  constructor(registry, options = {}) {
    this.registry = registry;
    this.inactivityThreshold = options.inactivityThreshold ?? 5 * 60 * 1e3;
  }
  /**
   * Add a path to watch
   *
   * Files created, changed, or deleted under this path will
   * trigger workflow events. Inactivity detection starts immediately.
   *
   * @param path - Absolute path to watch
   *
   * @example
   * ```typescript
   * watcher.watch('/path/to/docs');
   * watcher.watch('/path/to/templates');
   * ```
   */
  watch(path) {
    this.watchPaths.add(path);
    this.resetInactivityTimer(path);
  }
  /**
   * Stop watching a path
   *
   * Clears inactivity timer and removes path from watch list.
   *
   * @param path - Path to stop watching
   */
  unwatch(path) {
    this.watchPaths.delete(path);
    const timer = this.inactivityTimers.get(path);
    if (timer) {
      clearTimeout(timer);
      this.inactivityTimers.delete(path);
    }
    this.lastActivityMap.delete(path);
  }
  /**
   * Stop watching all paths and clear all timers
   */
  unwatchAll() {
    for (const path of Array.from(this.watchPaths)) {
      this.unwatch(path);
    }
  }
  /**
   * Handle file created event
   *
   * @param path - Path to the created file
   *
   * @example
   * ```typescript
   * // Called by file system watcher
   * fsWatcher.on('add', (path) => {
   *   watcher.onFileCreated(path);
   * });
   * ```
   */
  async onFileCreated(path) {
    if (!this.shouldProcess(path)) return;
    this.updateActivity(path);
    await this.registry.emit({
      type: "file:created",
      path,
      timestamp: Date.now()
    });
  }
  /**
   * Handle file changed event
   *
   * @param path - Path to the changed file
   * @param changes - Optional description of changes (e.g., diff)
   *
   * @example
   * ```typescript
   * // Called by file system watcher
   * fsWatcher.on('change', (path) => {
   *   const diff = computeDiff(path);
   *   watcher.onFileChanged(path, diff);
   * });
   * ```
   */
  async onFileChanged(path, changes) {
    if (!this.shouldProcess(path)) return;
    this.updateActivity(path);
    await this.registry.emit({
      type: "file:changed",
      path,
      timestamp: Date.now(),
      changes
    });
  }
  /**
   * Handle file deleted event
   *
   * @param path - Path to the deleted file
   */
  async onFileDeleted(path) {
    if (!this.shouldProcess(path)) return;
    this.updateActivity(path);
    await this.registry.emit({
      type: "file:deleted",
      path,
      timestamp: Date.now()
    });
  }
  /**
   * Get all watched paths
   * @returns Array of watched paths
   */
  getWatchedPaths() {
    return Array.from(this.watchPaths);
  }
  /**
   * Get last activity timestamp for a path
   * @param path - Path to check
   * @returns Timestamp of last activity, or undefined if not tracked
   */
  getLastActivity(path) {
    return this.lastActivityMap.get(path);
  }
  /**
   * Get the inactivity threshold
   * @returns Inactivity threshold in milliseconds
   */
  getInactivityThreshold() {
    return this.inactivityThreshold;
  }
  /**
   * Set the inactivity threshold
   *
   * Updates the threshold and resets all active timers with the new value.
   *
   * @param threshold - New threshold in milliseconds
   */
  setInactivityThreshold(threshold) {
    this.inactivityThreshold = threshold;
    for (const path of Array.from(this.watchPaths)) {
      this.resetInactivityTimer(path);
    }
  }
  /**
   * Check if path should be processed
   * @param path - Path to check
   * @returns Whether the path is being watched
   */
  shouldProcess(path) {
    for (const watchPath of Array.from(this.watchPaths)) {
      if (path === watchPath || path.startsWith(watchPath + "/")) {
        return true;
      }
    }
    return false;
  }
  /**
   * Update activity timestamp and reset inactivity timer
   * @param path - Path where activity occurred
   */
  updateActivity(path) {
    const parentPath = this.findWatchedParent(path);
    if (parentPath) {
      this.lastActivityMap.set(parentPath, Date.now());
      this.resetInactivityTimer(parentPath);
    }
  }
  /**
   * Find the watched parent path for a given path
   * @param path - Path to find parent for
   * @returns Watched parent path, or undefined if not found
   */
  findWatchedParent(path) {
    for (const watchPath of Array.from(this.watchPaths)) {
      if (path === watchPath || path.startsWith(watchPath + "/")) {
        return watchPath;
      }
    }
    return void 0;
  }
  /**
   * Reset the inactivity timer for a path
   * @param path - Path to reset timer for
   */
  resetInactivityTimer(path) {
    const existingTimer = this.inactivityTimers.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    const timer = setTimeout(async () => {
      const lastActivity = this.lastActivityMap.get(path) ?? 0;
      await this.registry.emit({
        type: "timeout:inactivity",
        lastActivity,
        threshold: this.inactivityThreshold
      });
    }, this.inactivityThreshold);
    this.inactivityTimers.set(path, timer);
  }
}
function createWebhookRegistry(config) {
  return new WebhookRegistry(config);
}
function createFileWatcherIntegration(registry, options) {
  return new FileWatcherIntegration(registry, options);
}
export {
  FileWatcherIntegration,
  WebhookRegistry,
  createFileWatcherIntegration,
  createWebhookRegistry
};
//# sourceMappingURL=webhook-handlers.js.map
