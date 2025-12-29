/**
 * Webhook Handlers
 *
 * Handles incoming webhooks and hooks for workflow triggers.
 * Integrates with the existing file watcher system.
 *
 * @module workflow/handlers/webhook-handlers
 */
import type { NodeUpdateEvent, GapDetectedEvent, WorkflowCompleteEvent } from '../types.js';
export type { NodeUpdateEvent, GapDetectedEvent, WorkflowCompleteEvent };
/**
 * Event types that can trigger workflows
 */
export type WorkflowTriggerEvent = {
    type: 'file:created';
    path: string;
    timestamp: number;
} | {
    type: 'file:changed';
    path: string;
    timestamp: number;
    changes?: string;
} | {
    type: 'file:deleted';
    path: string;
    timestamp: number;
} | {
    type: 'node:updated';
    event: NodeUpdateEvent;
} | {
    type: 'gap:detected';
    event: GapDetectedEvent;
} | {
    type: 'workflow:complete';
    event: WorkflowCompleteEvent;
} | {
    type: 'timeout:inactivity';
    lastActivity: number;
    threshold: number;
};
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
export type WebhookHandler<T = unknown> = (event: WorkflowTriggerEvent, context: T) => Promise<void>;
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
export declare class WebhookRegistry {
    private handlers;
    private config;
    /**
     * Create a new webhook registry
     * @param config - Registry configuration
     */
    constructor(config?: WebhookConfig);
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
    on(eventType: WorkflowTriggerEvent['type'], handler: WebhookHandler): () => void;
    /**
     * Remove all handlers for an event type
     *
     * @param eventType - The event type to clear handlers for
     */
    off(eventType: WorkflowTriggerEvent['type']): void;
    /**
     * Remove all handlers for all event types
     */
    clear(): void;
    /**
     * Get the number of handlers registered for an event type
     *
     * @param eventType - The event type to check
     * @returns Number of registered handlers
     */
    listenerCount(eventType: WorkflowTriggerEvent['type']): number;
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
    emit<T>(event: WorkflowTriggerEvent, context?: T): Promise<void>;
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
    validatePayload(payload: unknown, signature?: string): WebhookValidation;
    /**
     * Get current configuration
     * @returns A copy of the current configuration
     */
    getConfig(): Readonly<WebhookConfig>;
    /**
     * Verify webhook signature
     * @param payload - The payload to verify
     * @param signature - The signature to check against
     * @returns Whether the signature is valid
     */
    private verifySignature;
    /**
     * Parse raw data into typed event
     * @param data - Raw event data
     * @returns Typed workflow trigger event
     * @throws Error if event type is unknown or data is malformed
     */
    private parseEvent;
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
export declare class FileWatcherIntegration {
    private registry;
    private watchPaths;
    private lastActivityMap;
    private inactivityTimers;
    private inactivityThreshold;
    /**
     * Create a new file watcher integration
     * @param registry - Webhook registry to emit events to
     * @param options - Configuration options
     */
    constructor(registry: WebhookRegistry, options?: {
        inactivityThreshold?: number;
    });
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
    watch(path: string): void;
    /**
     * Stop watching a path
     *
     * Clears inactivity timer and removes path from watch list.
     *
     * @param path - Path to stop watching
     */
    unwatch(path: string): void;
    /**
     * Stop watching all paths and clear all timers
     */
    unwatchAll(): void;
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
    onFileCreated(path: string): Promise<void>;
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
    onFileChanged(path: string, changes?: string): Promise<void>;
    /**
     * Handle file deleted event
     *
     * @param path - Path to the deleted file
     */
    onFileDeleted(path: string): Promise<void>;
    /**
     * Get all watched paths
     * @returns Array of watched paths
     */
    getWatchedPaths(): string[];
    /**
     * Get last activity timestamp for a path
     * @param path - Path to check
     * @returns Timestamp of last activity, or undefined if not tracked
     */
    getLastActivity(path: string): number | undefined;
    /**
     * Get the inactivity threshold
     * @returns Inactivity threshold in milliseconds
     */
    getInactivityThreshold(): number;
    /**
     * Set the inactivity threshold
     *
     * Updates the threshold and resets all active timers with the new value.
     *
     * @param threshold - New threshold in milliseconds
     */
    setInactivityThreshold(threshold: number): void;
    /**
     * Check if path should be processed
     * @param path - Path to check
     * @returns Whether the path is being watched
     */
    private shouldProcess;
    /**
     * Update activity timestamp and reset inactivity timer
     * @param path - Path where activity occurred
     */
    private updateActivity;
    /**
     * Find the watched parent path for a given path
     * @param path - Path to find parent for
     * @returns Watched parent path, or undefined if not found
     */
    private findWatchedParent;
    /**
     * Reset the inactivity timer for a path
     * @param path - Path to reset timer for
     */
    private resetInactivityTimer;
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
export declare function createWebhookRegistry(config?: WebhookConfig): WebhookRegistry;
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
export declare function createFileWatcherIntegration(registry: WebhookRegistry, options?: {
    inactivityThreshold?: number;
}): FileWatcherIntegration;
//# sourceMappingURL=webhook-handlers.d.ts.map