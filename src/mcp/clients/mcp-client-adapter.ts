/**
 * MCP Client Adapter
 *
 * Provides real MCP tool execution via the claude-flow CLI with retry logic,
 * timeout handling, and graceful fallback to in-memory storage when CLI is unavailable.
 *
 * @module mcp/clients/mcp-client-adapter
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import {
  createLogger,
  withRetry,
  type RetryOptions,
} from '../../utils/index.js';

const execAsync = promisify(exec);

/**
 * Extended exec error type with additional properties
 */
interface ExecError extends Error {
  code?: string | number;
  killed?: boolean;
  stderr?: string;
  stdout?: string;
}
const logger = createLogger('mcp-client-adapter');

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
 * Memory entry stored in fallback
 */
interface FallbackEntry {
  value: string;
  ttl?: number;
  createdAt: number;
  expiresAt?: number;
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
export class McpClientAdapter {
  private config: McpClientConfig;
  private fallbackStore: Map<string, Map<string, FallbackEntry>>;
  private cliAvailable: boolean | null = null;
  private lastCliCheck: number = 0;
  private readonly CLI_CHECK_INTERVAL = 60000; // Re-check CLI availability every 60s

  constructor(config: Partial<McpClientConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      timeoutMs: config.timeoutMs ?? 30000,
      fallbackEnabled: config.fallbackEnabled ?? true,
      cliCommand: config.cliCommand ?? 'npx claude-flow@alpha',
      useJsonOutput: config.useJsonOutput ?? true,
    };
    this.fallbackStore = new Map();
  }

  /**
   * Store a value in memory
   *
   * @param key - Memory key
   * @param value - Value to store (will be JSON stringified if object)
   * @param namespace - Memory namespace (default: 'default')
   * @param ttl - Time to live in seconds (optional)
   * @returns Whether the operation succeeded
   */
  async memoryStore(
    key: string,
    value: string | object,
    namespace: string = 'default',
    ttl?: number
  ): Promise<boolean> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    const result = await this.executeWithRetry(async () => {
      const command = this.buildStoreCommand(key, stringValue, namespace, ttl);
      await this.executeCli(command);
      return true;
    });

    if (result.success) {
      logger.debug('Memory store succeeded via CLI', { key, namespace });
      return true;
    }

    // Fallback to in-memory storage
    if (this.config.fallbackEnabled) {
      this.storeFallback(key, stringValue, namespace, ttl);
      logger.warn('Memory store fell back to in-memory', { key, namespace, error: result.error });
      return true;
    }

    logger.error('Memory store failed', undefined, { key, namespace, error: result.error });
    return false;
  }

  /**
   * Retrieve a value from memory
   *
   * @param key - Memory key
   * @param namespace - Memory namespace (default: 'default')
   * @returns The stored value or null if not found
   */
  async memoryRetrieve(key: string, namespace: string = 'default'): Promise<string | null> {
    const result = await this.executeWithRetry(async () => {
      const command = this.buildQueryCommand(key, namespace);
      const output = await this.executeCli(command);
      return this.parseQueryOutput(output, key);
    });

    if (result.success && result.value !== undefined) {
      logger.debug('Memory retrieve succeeded via CLI', { key, namespace });
      return result.value;
    }

    // Fallback to in-memory storage
    if (this.config.fallbackEnabled) {
      const fallbackValue = this.retrieveFallback(key, namespace);
      if (fallbackValue !== null) {
        logger.debug('Memory retrieve fell back to in-memory', { key, namespace });
        return fallbackValue;
      }
    }

    logger.debug('Memory retrieve returned null', { key, namespace });
    return null;
  }

  /**
   * Search memory by pattern
   *
   * @param pattern - Search pattern (supports glob-like matching)
   * @param namespace - Memory namespace (default: 'default')
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of matching keys
   */
  async memorySearch(
    pattern: string,
    namespace: string = 'default',
    limit: number = 10
  ): Promise<string[]> {
    const result = await this.executeWithRetry(async () => {
      const command = this.buildSearchCommand(pattern, namespace, limit);
      const output = await this.executeCli(command);
      return this.parseSearchOutput(output);
    });

    if (result.success && result.value) {
      logger.debug('Memory search succeeded via CLI', { pattern, namespace, count: result.value.length });
      return result.value;
    }

    // Fallback to in-memory search
    if (this.config.fallbackEnabled) {
      const fallbackResults = this.searchFallback(pattern, namespace, limit);
      logger.debug('Memory search fell back to in-memory', { pattern, namespace, count: fallbackResults.length });
      return fallbackResults;
    }

    logger.debug('Memory search returned empty', { pattern, namespace });
    return [];
  }

  /**
   * Delete a value from memory
   *
   * @param key - Memory key
   * @param namespace - Memory namespace (default: 'default')
   * @returns Whether the operation succeeded
   */
  async memoryDelete(key: string, namespace: string = 'default'): Promise<boolean> {
    const result = await this.executeWithRetry(async () => {
      // Use clear command with specific key pattern
      const command = this.buildDeleteCommand(key, namespace);
      await this.executeCli(command);
      return true;
    });

    if (result.success) {
      logger.debug('Memory delete succeeded via CLI', { key, namespace });
    }

    // Also delete from fallback (regardless of CLI success)
    if (this.config.fallbackEnabled) {
      this.deleteFallback(key, namespace);
    }

    return result.success || this.config.fallbackEnabled;
  }

  /**
   * List all keys in a namespace
   *
   * @param namespace - Memory namespace (default: 'default')
   * @returns Array of keys
   */
  async memoryList(namespace: string = 'default'): Promise<string[]> {
    const result = await this.executeWithRetry(async () => {
      const command = `${this.config.cliCommand} memory list --namespace "${namespace}"`;
      const output = await this.executeCli(command);
      return this.parseListOutput(output);
    });

    if (result.success && result.value) {
      logger.debug('Memory list succeeded via CLI', { namespace, count: result.value.length });
      return result.value;
    }

    // Fallback
    if (this.config.fallbackEnabled) {
      const fallbackKeys = this.listFallback(namespace);
      logger.debug('Memory list fell back to in-memory', { namespace, count: fallbackKeys.length });
      return fallbackKeys;
    }

    return [];
  }

  /**
   * Check if CLI is available
   */
  async isCliAvailable(): Promise<boolean> {
    const now = Date.now();

    // Use cached result if recent
    if (this.cliAvailable !== null && now - this.lastCliCheck < this.CLI_CHECK_INTERVAL) {
      return this.cliAvailable;
    }

    try {
      await this.executeCli(`${this.config.cliCommand} --version`, 5000);
      this.cliAvailable = true;
      this.lastCliCheck = now;
      return true;
    } catch {
      this.cliAvailable = false;
      this.lastCliCheck = now;
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<McpClientConfig> {
    return { ...this.config };
  }

  /**
   * Get fallback store size for a namespace
   */
  getFallbackSize(namespace: string = 'default'): number {
    return this.fallbackStore.get(namespace)?.size ?? 0;
  }

  /**
   * Clear fallback store
   */
  clearFallback(namespace?: string): void {
    if (namespace) {
      this.fallbackStore.delete(namespace);
    } else {
      this.fallbackStore.clear();
    }
  }

  // Private methods

  private async executeWithRetry<T>(
    operation: () => Promise<T>
  ): Promise<{ success: boolean; value?: T; error?: string; attempts: number }> {
    const retryOptions: RetryOptions = {
      maxRetries: this.config.maxRetries,
      initialDelay: this.config.retryDelayMs,
      backoffFactor: 2,
      jitter: true,
      onRetry: (error, attempt, delay) => {
        logger.debug('Retrying MCP operation', {
          attempt,
          delay,
          error: error.message,
        });
      },
    };

    const result = await withRetry(operation, retryOptions);

    return {
      success: result.success,
      value: result.value,
      error: result.error?.message,
      attempts: result.attempts,
    };
  }

  private async executeCli(command: string, timeout?: number): Promise<string> {
    const effectiveTimeout = timeout ?? this.config.timeoutMs;

    logger.debug('Executing CLI command', { command: command.substring(0, 100) });

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: effectiveTimeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        shell: '/bin/bash',
      });

      if (stderr && !stderr.includes('DeprecationWarning')) {
        logger.warn('CLI stderr output', { stderr: stderr.substring(0, 500) });
      }

      return stdout.trim();
    } catch (error) {
      const execError = error as ExecError;

      if (execError.code === 'ETIMEDOUT' || execError.killed) {
        throw new Error(`CLI command timed out after ${effectiveTimeout}ms`);
      }

      // Include any output in the error for debugging
      const message = execError.message || 'CLI execution failed';
      const details = execError.stderr || execError.stdout || '';
      throw new Error(`${message}${details ? `: ${details.substring(0, 200)}` : ''}`);
    }
  }

  private buildStoreCommand(
    key: string,
    value: string,
    namespace: string,
    ttl?: number
  ): string {
    const escapedValue = this.escapeShellArg(value);
    let command = `${this.config.cliCommand} memory store "${key}" ${escapedValue} --namespace "${namespace}"`;

    if (ttl !== undefined && ttl > 0) {
      command += ` --ttl ${ttl}`;
    }

    return command;
  }

  private buildQueryCommand(key: string, namespace: string): string {
    // Use query command to search for exact key
    return `${this.config.cliCommand} memory query "${key}" --namespace "${namespace}"`;
  }

  private buildSearchCommand(pattern: string, namespace: string, limit: number): string {
    return `${this.config.cliCommand} memory query "${pattern}" --namespace "${namespace}"`;
  }

  private buildDeleteCommand(key: string, namespace: string): string {
    // claude-flow uses 'clear' for deletion
    return `${this.config.cliCommand} memory clear --namespace "${namespace}"`;
  }

  private parseQueryOutput(output: string, key: string): string | null {
    if (!output || output.includes('not found') || output.includes('No results')) {
      return null;
    }

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(output);
      if (typeof parsed === 'object' && parsed !== null) {
        // Look for the key in the result
        if (key in parsed) {
          return typeof parsed[key] === 'string' ? parsed[key] : JSON.stringify(parsed[key]);
        }
        // Return the whole object as JSON string
        return JSON.stringify(parsed);
      }
      return String(parsed);
    } catch {
      // Return raw output
      return output;
    }
  }

  private parseSearchOutput(output: string): string[] {
    if (!output || output.includes('No results')) {
      return [];
    }

    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(output);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)));
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.keys(parsed);
      }
    } catch {
      // Parse line by line
      return output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'));
    }

    return [];
  }

  private parseListOutput(output: string): string[] {
    return this.parseSearchOutput(output);
  }

  private escapeShellArg(arg: string): string {
    // Escape for shell and wrap in quotes
    const escaped = arg
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$')
      .replace(/\n/g, '\\n');
    return `"${escaped}"`;
  }

  // Fallback storage methods

  private getOrCreateNamespace(namespace: string): Map<string, FallbackEntry> {
    let ns = this.fallbackStore.get(namespace);
    if (!ns) {
      ns = new Map();
      this.fallbackStore.set(namespace, ns);
    }
    return ns;
  }

  private storeFallback(key: string, value: string, namespace: string, ttl?: number): void {
    const ns = this.getOrCreateNamespace(namespace);
    const now = Date.now();

    ns.set(key, {
      value,
      ttl,
      createdAt: now,
      expiresAt: ttl ? now + ttl * 1000 : undefined,
    });
  }

  private retrieveFallback(key: string, namespace: string): string | null {
    const ns = this.fallbackStore.get(namespace);
    if (!ns) return null;

    const entry = ns.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      ns.delete(key);
      return null;
    }

    return entry.value;
  }

  private searchFallback(pattern: string, namespace: string, limit: number): string[] {
    const ns = this.fallbackStore.get(namespace);
    if (!ns) return [];

    const now = Date.now();
    const results: string[] = [];

    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`, 'i');

    for (const [key, entry] of ns) {
      if (results.length >= limit) break;

      // Skip expired entries
      if (entry.expiresAt && now > entry.expiresAt) {
        ns.delete(key);
        continue;
      }

      if (regex.test(key)) {
        results.push(key);
      }
    }

    return results;
  }

  private deleteFallback(key: string, namespace: string): boolean {
    const ns = this.fallbackStore.get(namespace);
    if (!ns) return false;
    return ns.delete(key);
  }

  private listFallback(namespace: string): string[] {
    const ns = this.fallbackStore.get(namespace);
    if (!ns) return [];

    const now = Date.now();
    const keys: string[] = [];

    for (const [key, entry] of ns) {
      // Skip expired entries
      if (entry.expiresAt && now > entry.expiresAt) {
        ns.delete(key);
        continue;
      }
      keys.push(key);
    }

    return keys;
  }
}

/**
 * Create a configured MCP client adapter
 */
export function createMcpClientAdapter(config?: Partial<McpClientConfig>): McpClientAdapter {
  return new McpClientAdapter(config);
}
