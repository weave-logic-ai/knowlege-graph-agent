/**
 * MCP Client Adapter
 *
 * Provides real MCP tool execution via the claude-flow CLI with retry logic,
 * timeout handling, and graceful fallback to in-memory storage when CLI is unavailable.
 *
 * @module mcp/clients/mcp-client-adapter
 */
/**
 * MCP Client Configuration
 */
export interface McpClientConfig {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries: number;
    /** Initial delay in milliseconds between retries (default: 1000) */
    retryDelayMs: number;
    /** Command execution timeout in milliseconds (default: 30000) */
    timeoutMs: number;
    /** Whether to fallback to in-memory storage when CLI unavailable (default: true) */
    fallbackEnabled: boolean;
    /** Claude-flow CLI command (default: 'npx claude-flow@alpha') */
    cliCommand: string;
    /** Whether to use JSON output format from CLI when available */
    useJsonOutput: boolean;
}
/**
 * Result of a memory operation
 */
export interface MemoryOperationResult {
    /** Whether the operation succeeded */
    success: boolean;
    /** Result data (if successful) */
    data?: unknown;
    /** Error message (if failed) */
    error?: string;
    /** Whether the result came from fallback storage */
    fromFallback: boolean;
    /** Number of attempts made */
    attempts: number;
}
/**
 * MCP Client Adapter
 *
 * Executes real claude-flow CLI commands with robust retry logic and fallback.
 *
 * @example
 * ```typescript
 * const adapter = new McpClientAdapter({
 *   maxRetries: 3,
 *   timeoutMs: 30000,
 * });
 *
 * // Store value
 * await adapter.memoryStore('myKey', 'myValue', 'myNamespace');
 *
 * // Retrieve value
 * const value = await adapter.memoryRetrieve('myKey', 'myNamespace');
 * ```
 */
export declare class McpClientAdapter {
    private config;
    private fallbackStore;
    private cliAvailable;
    private lastCliCheck;
    private readonly CLI_CHECK_INTERVAL;
    constructor(config?: Partial<McpClientConfig>);
    /**
     * Store a value in memory
     *
     * @param key - Memory key
     * @param value - Value to store (will be JSON stringified if object)
     * @param namespace - Memory namespace (default: 'default')
     * @param ttl - Time to live in seconds (optional)
     * @returns Whether the operation succeeded
     */
    memoryStore(key: string, value: string | object, namespace?: string, ttl?: number): Promise<boolean>;
    /**
     * Retrieve a value from memory
     *
     * @param key - Memory key
     * @param namespace - Memory namespace (default: 'default')
     * @returns The stored value or null if not found
     */
    memoryRetrieve(key: string, namespace?: string): Promise<string | null>;
    /**
     * Search memory by pattern
     *
     * @param pattern - Search pattern (supports glob-like matching)
     * @param namespace - Memory namespace (default: 'default')
     * @param limit - Maximum number of results (default: 10)
     * @returns Array of matching keys
     */
    memorySearch(pattern: string, namespace?: string, limit?: number): Promise<string[]>;
    /**
     * Delete a value from memory
     *
     * @param key - Memory key
     * @param namespace - Memory namespace (default: 'default')
     * @returns Whether the operation succeeded
     */
    memoryDelete(key: string, namespace?: string): Promise<boolean>;
    /**
     * List all keys in a namespace
     *
     * @param namespace - Memory namespace (default: 'default')
     * @returns Array of keys
     */
    memoryList(namespace?: string): Promise<string[]>;
    /**
     * Check if CLI is available
     */
    isCliAvailable(): Promise<boolean>;
    /**
     * Get current configuration
     */
    getConfig(): Readonly<McpClientConfig>;
    /**
     * Get fallback store size for a namespace
     */
    getFallbackSize(namespace?: string): number;
    /**
     * Clear fallback store
     */
    clearFallback(namespace?: string): void;
    private executeWithRetry;
    private executeCli;
    private buildStoreCommand;
    private buildQueryCommand;
    private buildSearchCommand;
    private buildDeleteCommand;
    private parseQueryOutput;
    private parseSearchOutput;
    private parseListOutput;
    private escapeShellArg;
    private getOrCreateNamespace;
    private storeFallback;
    private retrieveFallback;
    private searchFallback;
    private deleteFallback;
    private listFallback;
}
/**
 * Create a configured MCP client adapter
 */
export declare function createMcpClientAdapter(config?: Partial<McpClientConfig>): McpClientAdapter;
//# sourceMappingURL=mcp-client-adapter.d.ts.map