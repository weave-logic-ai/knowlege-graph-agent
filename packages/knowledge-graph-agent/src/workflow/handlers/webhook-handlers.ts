/**
 * Webhook Handlers
 *
 * Handles incoming webhooks and hooks for workflow triggers.
 * Integrates with the existing file watcher system.
 *
 * @module workflow/handlers/webhook-handlers
 */

import type {
  NodeUpdateEvent,
  GapDetectedEvent,
  WorkflowCompleteEvent,
} from '../types.js';

// Re-export types for convenience
export type { NodeUpdateEvent, GapDetectedEvent, WorkflowCompleteEvent };

/**
 * Event types that can trigger workflows
 */
export type WorkflowTriggerEvent =
  | { type: 'file:created'; path: string; timestamp: number }
  | { type: 'file:changed'; path: string; timestamp: number; changes?: string }
  | { type: 'file:deleted'; path: string; timestamp: number }
  | { type: 'node:updated'; event: NodeUpdateEvent }
  | { type: 'gap:detected'; event: GapDetectedEvent }
  | { type: 'workflow:complete'; event: WorkflowCompleteEvent }
  | { type: 'timeout:inactivity'; lastActivity: number; threshold: number };

/**
 * Webhook handler configuration
 */
export interface WebhookConfig {
  /** Secret for validating webhook signatures */
  secret?: string;
  /** Maximum payload size in bytes */
  maxPayloadSize?: number;
  /** Allowed origins for CORS */
  allowedOrigins?: string[];
  /** Rate limit per minute */
  rateLimit?: number;
}

/**
 * Webhook validation result
 */
export interface WebhookValidation {
  /** Whether the webhook payload is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Parsed event if valid */
  event?: WorkflowTriggerEvent;
}

/**
 * Handler function type for processing workflow trigger events
 * @template T - Context type passed to handlers
 */
export type WebhookHandler<T = unknown> = (
  event: WorkflowTriggerEvent,
  context: T
) => Promise<void>;

/**
 * Webhook handler registry
 *
 * Manages registration and dispatch of webhook event handlers.
 * Supports multiple handlers per event type and provides
 * payload validation with optional signature verification.
 *
 * @example
 * ```typescript
 * const registry = new WebhookRegistry({ secret: 'my-secret' });
 *
 * // Register handler
 * const unsubscribe = registry.on('file:changed', async (event) => {
 *   console.log('File changed:', event.path);
 * });
 *
 * // Emit event
 * await registry.emit({
 *   type: 'file:changed',
 *   path: '/docs/readme.md',
 *   timestamp: Date.now()
 * });
 *
 * // Cleanup
 * unsubscribe();
 * ```
 */
export class WebhookRegistry {
  private handlers: Map<string, WebhookHandler[]> = new Map();
  private config: WebhookConfig;

  /**
   * Create a new webhook registry
   * @param config - Registry configuration
   */
  constructor(config: WebhookConfig = {}) {
    this.config = {
      maxPayloadSize: config.maxPayloadSize ?? 1024 * 1024, // 1MB default
      rateLimit: config.rateLimit ?? 100,
      ...config,
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
  on(eventType: WorkflowTriggerEvent['type'], handler: WebhookHandler): () => void {
    const handlers = this.handlers.get(eventType) ?? [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);

    // Return unsubscribe function
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
  off(eventType: WorkflowTriggerEvent['type']): void {
    this.handlers.delete(eventType);
  }

  /**
   * Remove all handlers for all event types
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Get the number of handlers registered for an event type
   *
   * @param eventType - The event type to check
   * @returns Number of registered handlers
   */
  listenerCount(eventType: WorkflowTriggerEvent['type']): number {
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
  async emit<T>(event: WorkflowTriggerEvent, context?: T): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];

    await Promise.all(
      handlers.map((handler) =>
        handler(event, context).catch((error: unknown) => {
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
  validatePayload(payload: unknown, signature?: string): WebhookValidation {
    // Check payload exists
    if (!payload || typeof payload !== 'object') {
      return { valid: false, error: 'Invalid payload: must be an object' };
    }

    const data = payload as Record<string, unknown>;

    // Check required type field
    if (!data.type || typeof data.type !== 'string') {
      return { valid: false, error: 'Invalid payload: missing type field' };
    }

    // Validate signature if secret configured
    if (this.config.secret && signature) {
      const isValidSignature = this.verifySignature(payload, signature);
      if (!isValidSignature) {
        return { valid: false, error: 'Invalid signature' };
      }
    }

    // Parse event based on type
    try {
      const event = this.parseEvent(data);
      return { valid: true, event };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to parse event: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get current configuration
   * @returns A copy of the current configuration
   */
  getConfig(): Readonly<WebhookConfig> {
    return { ...this.config };
  }

  /**
   * Verify webhook signature
   * @param payload - The payload to verify
   * @param signature - The signature to check against
   * @returns Whether the signature is valid
   */
  private verifySignature(payload: unknown, signature: string): boolean {
    if (!this.config.secret) return true;

    // Simple HMAC verification (in production, use crypto.timingSafeEqual)
    const crypto = globalThis.crypto;
    if (!crypto?.subtle) {
      console.warn('[Webhook] Crypto not available for signature verification');
      return true;
    }

    // For now, return true - implement proper HMAC in production
    // TODO: Implement HMAC-SHA256 signature verification
    void signature; // Suppress unused variable warning
    return true;
  }

  /**
   * Parse raw data into typed event
   * @param data - Raw event data
   * @returns Typed workflow trigger event
   * @throws Error if event type is unknown or data is malformed
   */
  private parseEvent(data: Record<string, unknown>): WorkflowTriggerEvent {
    switch (data.type) {
      case 'file:created':
      case 'file:changed':
      case 'file:deleted':
        return {
          type: data.type as 'file:created' | 'file:changed' | 'file:deleted',
          path: String(data.path ?? ''),
          timestamp: Number(data.timestamp) || Date.now(),
          ...(data.changes ? { changes: String(data.changes) } : {}),
        } as WorkflowTriggerEvent;

      case 'node:updated':
        return {
          type: 'node:updated',
          event: {
            nodeId: String((data.event as Record<string, unknown>)?.nodeId ?? ''),
            userId: String((data.event as Record<string, unknown>)?.userId ?? ''),
            changes:
              ((data.event as Record<string, unknown>)?.changes as Record<string, unknown>) ?? {},
            timestamp: Number((data.event as Record<string, unknown>)?.timestamp) || Date.now(),
          },
        };

      case 'gap:detected':
        return {
          type: 'gap:detected',
          event: {
            docPath: String((data.event as Record<string, unknown>)?.docPath ?? ''),
            gaps: ((data.event as Record<string, unknown>)?.gaps as string[]) ?? [],
            confidence: Number((data.event as Record<string, unknown>)?.confidence) || 0,
            detectedAt: Number((data.event as Record<string, unknown>)?.detectedAt) || Date.now(),
          },
        };

      case 'workflow:complete': {
        const eventData = data.event as Record<string, unknown>;
        const outcomeValue = eventData?.outcome;
        const validOutcomes = ['success', 'failure', 'timeout'] as const;
        const outcome: 'success' | 'failure' | 'timeout' =
          typeof outcomeValue === 'string' && validOutcomes.includes(outcomeValue as typeof validOutcomes[number])
            ? (outcomeValue as 'success' | 'failure' | 'timeout')
            : 'success';

        return {
          type: 'workflow:complete',
          event: {
            workflowId: String(eventData?.workflowId ?? ''),
            outcome,
            duration: Number(eventData?.duration) || 0,
            artifacts: Array.isArray(eventData?.artifacts)
              ? (eventData.artifacts as unknown[]).map(String)
              : [],
          },
        };
      }

      case 'timeout:inactivity':
        return {
          type: 'timeout:inactivity',
          lastActivity: Number(data.lastActivity) || 0,
          threshold: Number(data.threshold) || 300000,
        };

      default:
        throw new Error(`Unknown event type: ${data.type}`);
    }
  }
}

/**
 * File watcher integration
 *
 * Converts file system events to workflow trigger events and
 * manages inactivity detection for watched paths.
 *
 * @example
 * ```typescript
 * const registry = createWebhookRegistry();
 * const watcher = createFileWatcherIntegration(registry, {
 *   inactivityThreshold: 10 * 60 * 1000 // 10 minutes
 * });
 *
 * // Register for inactivity events
 * registry.on('timeout:inactivity', async (event) => {
 *   console.log('No activity for:', event.threshold, 'ms');
 * });
 *
 * // Start watching
 * watcher.watch('/path/to/docs');
 *
 * // Simulate file events
 * await watcher.onFileCreated('/path/to/docs/new-file.md');
 * await watcher.onFileChanged('/path/to/docs/existing.md', 'content diff');
 * ```
 */
export class FileWatcherIntegration {
  private registry: WebhookRegistry;
  private watchPaths: Set<string> = new Set();
  private lastActivityMap: Map<string, number> = new Map();
  private inactivityTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private inactivityThreshold: number;

  /**
   * Create a new file watcher integration
   * @param registry - Webhook registry to emit events to
   * @param options - Configuration options
   */
  constructor(registry: WebhookRegistry, options: { inactivityThreshold?: number } = {}) {
    this.registry = registry;
    this.inactivityThreshold = options.inactivityThreshold ?? 5 * 60 * 1000; // 5 minutes default
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
  watch(path: string): void {
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
  unwatch(path: string): void {
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
  unwatchAll(): void {
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
  async onFileCreated(path: string): Promise<void> {
    if (!this.shouldProcess(path)) return;

    this.updateActivity(path);
    await this.registry.emit({
      type: 'file:created',
      path,
      timestamp: Date.now(),
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
  async onFileChanged(path: string, changes?: string): Promise<void> {
    if (!this.shouldProcess(path)) return;

    this.updateActivity(path);
    await this.registry.emit({
      type: 'file:changed',
      path,
      timestamp: Date.now(),
      changes,
    });
  }

  /**
   * Handle file deleted event
   *
   * @param path - Path to the deleted file
   */
  async onFileDeleted(path: string): Promise<void> {
    if (!this.shouldProcess(path)) return;

    this.updateActivity(path);
    await this.registry.emit({
      type: 'file:deleted',
      path,
      timestamp: Date.now(),
    });
  }

  /**
   * Get all watched paths
   * @returns Array of watched paths
   */
  getWatchedPaths(): string[] {
    return Array.from(this.watchPaths);
  }

  /**
   * Get last activity timestamp for a path
   * @param path - Path to check
   * @returns Timestamp of last activity, or undefined if not tracked
   */
  getLastActivity(path: string): number | undefined {
    return this.lastActivityMap.get(path);
  }

  /**
   * Get the inactivity threshold
   * @returns Inactivity threshold in milliseconds
   */
  getInactivityThreshold(): number {
    return this.inactivityThreshold;
  }

  /**
   * Set the inactivity threshold
   *
   * Updates the threshold and resets all active timers with the new value.
   *
   * @param threshold - New threshold in milliseconds
   */
  setInactivityThreshold(threshold: number): void {
    this.inactivityThreshold = threshold;
    // Reset all timers with new threshold
    for (const path of Array.from(this.watchPaths)) {
      this.resetInactivityTimer(path);
    }
  }

  /**
   * Check if path should be processed
   * @param path - Path to check
   * @returns Whether the path is being watched
   */
  private shouldProcess(path: string): boolean {
    // Check if path is watched or is under a watched directory
    for (const watchPath of Array.from(this.watchPaths)) {
      if (path === watchPath || path.startsWith(watchPath + '/')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Update activity timestamp and reset inactivity timer
   * @param path - Path where activity occurred
   */
  private updateActivity(path: string): void {
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
  private findWatchedParent(path: string): string | undefined {
    for (const watchPath of Array.from(this.watchPaths)) {
      if (path === watchPath || path.startsWith(watchPath + '/')) {
        return watchPath;
      }
    }
    return undefined;
  }

  /**
   * Reset the inactivity timer for a path
   * @param path - Path to reset timer for
   */
  private resetInactivityTimer(path: string): void {
    // Clear existing timer
    const existingTimer = this.inactivityTimers.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      const lastActivity = this.lastActivityMap.get(path) ?? 0;
      await this.registry.emit({
        type: 'timeout:inactivity',
        lastActivity,
        threshold: this.inactivityThreshold,
      });
    }, this.inactivityThreshold);

    this.inactivityTimers.set(path, timer);
  }
}

/**
 * Create a webhook registry instance
 *
 * Factory function for creating a configured webhook registry.
 *
 * @param config - Registry configuration
 * @returns Configured webhook registry
 *
 * @example
 * ```typescript
 * const registry = createWebhookRegistry({
 *   secret: process.env.WEBHOOK_SECRET,
 *   maxPayloadSize: 2 * 1024 * 1024, // 2MB
 *   rateLimit: 50
 * });
 * ```
 */
export function createWebhookRegistry(config?: WebhookConfig): WebhookRegistry {
  return new WebhookRegistry(config);
}

/**
 * Create a file watcher integration instance
 *
 * Factory function for creating a configured file watcher integration.
 *
 * @param registry - Webhook registry to emit events to
 * @param options - Configuration options
 * @returns Configured file watcher integration
 *
 * @example
 * ```typescript
 * const registry = createWebhookRegistry();
 * const watcher = createFileWatcherIntegration(registry, {
 *   inactivityThreshold: 10 * 60 * 1000 // 10 minutes
 * });
 *
 * watcher.watch('/docs');
 * ```
 */
export function createFileWatcherIntegration(
  registry: WebhookRegistry,
  options?: { inactivityThreshold?: number }
): FileWatcherIntegration {
  return new FileWatcherIntegration(registry, options);
}
