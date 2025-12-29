import { exec } from "child_process";
import { promisify } from "util";
import { withRetry } from "../../utils/error-recovery.js";
import { createLogger } from "../../utils/logger.js";
const execAsync = promisify(exec);
const logger = createLogger("mcp-client-adapter");
class McpClientAdapter {
  config;
  fallbackStore;
  cliAvailable = null;
  lastCliCheck = 0;
  CLI_CHECK_INTERVAL = 6e4;
  // Re-check CLI availability every 60s
  constructor(config = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1e3,
      timeoutMs: config.timeoutMs ?? 3e4,
      fallbackEnabled: config.fallbackEnabled ?? true,
      cliCommand: config.cliCommand ?? "npx claude-flow@alpha",
      useJsonOutput: config.useJsonOutput ?? true
    };
    this.fallbackStore = /* @__PURE__ */ new Map();
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
  async memoryStore(key, value, namespace = "default", ttl) {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    const result = await this.executeWithRetry(async () => {
      const command = this.buildStoreCommand(key, stringValue, namespace, ttl);
      await this.executeCli(command);
      return true;
    });
    if (result.success) {
      logger.debug("Memory store succeeded via CLI", { key, namespace });
      return true;
    }
    if (this.config.fallbackEnabled) {
      this.storeFallback(key, stringValue, namespace, ttl);
      logger.warn("Memory store fell back to in-memory", { key, namespace, error: result.error });
      return true;
    }
    logger.error("Memory store failed", void 0, { key, namespace, error: result.error });
    return false;
  }
  /**
   * Retrieve a value from memory
   *
   * @param key - Memory key
   * @param namespace - Memory namespace (default: 'default')
   * @returns The stored value or null if not found
   */
  async memoryRetrieve(key, namespace = "default") {
    const result = await this.executeWithRetry(async () => {
      const command = this.buildQueryCommand(key, namespace);
      const output = await this.executeCli(command);
      return this.parseQueryOutput(output, key);
    });
    if (result.success && result.value !== void 0) {
      logger.debug("Memory retrieve succeeded via CLI", { key, namespace });
      return result.value;
    }
    if (this.config.fallbackEnabled) {
      const fallbackValue = this.retrieveFallback(key, namespace);
      if (fallbackValue !== null) {
        logger.debug("Memory retrieve fell back to in-memory", { key, namespace });
        return fallbackValue;
      }
    }
    logger.debug("Memory retrieve returned null", { key, namespace });
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
  async memorySearch(pattern, namespace = "default", limit = 10) {
    const result = await this.executeWithRetry(async () => {
      const command = this.buildSearchCommand(pattern, namespace, limit);
      const output = await this.executeCli(command);
      return this.parseSearchOutput(output);
    });
    if (result.success && result.value) {
      logger.debug("Memory search succeeded via CLI", { pattern, namespace, count: result.value.length });
      return result.value;
    }
    if (this.config.fallbackEnabled) {
      const fallbackResults = this.searchFallback(pattern, namespace, limit);
      logger.debug("Memory search fell back to in-memory", { pattern, namespace, count: fallbackResults.length });
      return fallbackResults;
    }
    logger.debug("Memory search returned empty", { pattern, namespace });
    return [];
  }
  /**
   * Delete a value from memory
   *
   * @param key - Memory key
   * @param namespace - Memory namespace (default: 'default')
   * @returns Whether the operation succeeded
   */
  async memoryDelete(key, namespace = "default") {
    const result = await this.executeWithRetry(async () => {
      const command = this.buildDeleteCommand(key, namespace);
      await this.executeCli(command);
      return true;
    });
    if (result.success) {
      logger.debug("Memory delete succeeded via CLI", { key, namespace });
    }
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
  async memoryList(namespace = "default") {
    const result = await this.executeWithRetry(async () => {
      const command = `${this.config.cliCommand} memory list --namespace "${namespace}"`;
      const output = await this.executeCli(command);
      return this.parseListOutput(output);
    });
    if (result.success && result.value) {
      logger.debug("Memory list succeeded via CLI", { namespace, count: result.value.length });
      return result.value;
    }
    if (this.config.fallbackEnabled) {
      const fallbackKeys = this.listFallback(namespace);
      logger.debug("Memory list fell back to in-memory", { namespace, count: fallbackKeys.length });
      return fallbackKeys;
    }
    return [];
  }
  /**
   * Check if CLI is available
   */
  async isCliAvailable() {
    const now = Date.now();
    if (this.cliAvailable !== null && now - this.lastCliCheck < this.CLI_CHECK_INTERVAL) {
      return this.cliAvailable;
    }
    try {
      await this.executeCli(`${this.config.cliCommand} --version`, 5e3);
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
  getConfig() {
    return { ...this.config };
  }
  /**
   * Get fallback store size for a namespace
   */
  getFallbackSize(namespace = "default") {
    return this.fallbackStore.get(namespace)?.size ?? 0;
  }
  /**
   * Clear fallback store
   */
  clearFallback(namespace) {
    if (namespace) {
      this.fallbackStore.delete(namespace);
    } else {
      this.fallbackStore.clear();
    }
  }
  // Private methods
  async executeWithRetry(operation) {
    const retryOptions = {
      maxRetries: this.config.maxRetries,
      initialDelay: this.config.retryDelayMs,
      backoffFactor: 2,
      jitter: true,
      onRetry: (error, attempt, delay) => {
        logger.debug("Retrying MCP operation", {
          attempt,
          delay,
          error: error.message
        });
      }
    };
    const result = await withRetry(operation, retryOptions);
    return {
      success: result.success,
      value: result.value,
      error: result.error?.message,
      attempts: result.attempts
    };
  }
  async executeCli(command, timeout) {
    const effectiveTimeout = timeout ?? this.config.timeoutMs;
    logger.debug("Executing CLI command", { command: command.substring(0, 100) });
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: effectiveTimeout,
        maxBuffer: 10 * 1024 * 1024,
        // 10MB buffer
        shell: "/bin/bash"
      });
      if (stderr && !stderr.includes("DeprecationWarning")) {
        logger.warn("CLI stderr output", { stderr: stderr.substring(0, 500) });
      }
      return stdout.trim();
    } catch (error) {
      const execError = error;
      if (execError.code === "ETIMEDOUT" || execError.killed) {
        throw new Error(`CLI command timed out after ${effectiveTimeout}ms`);
      }
      const message = execError.message || "CLI execution failed";
      const details = execError.stderr || execError.stdout || "";
      throw new Error(`${message}${details ? `: ${details.substring(0, 200)}` : ""}`);
    }
  }
  buildStoreCommand(key, value, namespace, ttl) {
    const escapedValue = this.escapeShellArg(value);
    let command = `${this.config.cliCommand} memory store "${key}" ${escapedValue} --namespace "${namespace}"`;
    if (ttl !== void 0 && ttl > 0) {
      command += ` --ttl ${ttl}`;
    }
    return command;
  }
  buildQueryCommand(key, namespace) {
    return `${this.config.cliCommand} memory query "${key}" --namespace "${namespace}"`;
  }
  buildSearchCommand(pattern, namespace, limit) {
    return `${this.config.cliCommand} memory query "${pattern}" --namespace "${namespace}"`;
  }
  buildDeleteCommand(key, namespace) {
    return `${this.config.cliCommand} memory clear --namespace "${namespace}"`;
  }
  parseQueryOutput(output, key) {
    if (!output || output.includes("not found") || output.includes("No results")) {
      return null;
    }
    try {
      const parsed = JSON.parse(output);
      if (typeof parsed === "object" && parsed !== null) {
        if (key in parsed) {
          return typeof parsed[key] === "string" ? parsed[key] : JSON.stringify(parsed[key]);
        }
        return JSON.stringify(parsed);
      }
      return String(parsed);
    } catch {
      return output;
    }
  }
  parseSearchOutput(output) {
    if (!output || output.includes("No results")) {
      return [];
    }
    try {
      const parsed = JSON.parse(output);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => typeof item === "string" ? item : JSON.stringify(item));
      }
      if (typeof parsed === "object" && parsed !== null) {
        return Object.keys(parsed);
      }
    } catch {
      return output.split("\n").map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith("#"));
    }
    return [];
  }
  parseListOutput(output) {
    return this.parseSearchOutput(output);
  }
  escapeShellArg(arg) {
    const escaped = arg.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/`/g, "\\`").replace(/\$/g, "\\$").replace(/\n/g, "\\n");
    return `"${escaped}"`;
  }
  // Fallback storage methods
  getOrCreateNamespace(namespace) {
    let ns = this.fallbackStore.get(namespace);
    if (!ns) {
      ns = /* @__PURE__ */ new Map();
      this.fallbackStore.set(namespace, ns);
    }
    return ns;
  }
  storeFallback(key, value, namespace, ttl) {
    const ns = this.getOrCreateNamespace(namespace);
    const now = Date.now();
    ns.set(key, {
      value,
      ttl,
      createdAt: now,
      expiresAt: ttl ? now + ttl * 1e3 : void 0
    });
  }
  retrieveFallback(key, namespace) {
    const ns = this.fallbackStore.get(namespace);
    if (!ns) return null;
    const entry = ns.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      ns.delete(key);
      return null;
    }
    return entry.value;
  }
  searchFallback(pattern, namespace, limit) {
    const ns = this.fallbackStore.get(namespace);
    if (!ns) return [];
    const now = Date.now();
    const results = [];
    const regexPattern = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
    const regex = new RegExp(`^${regexPattern}$`, "i");
    for (const [key, entry] of ns) {
      if (results.length >= limit) break;
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
  deleteFallback(key, namespace) {
    const ns = this.fallbackStore.get(namespace);
    if (!ns) return false;
    return ns.delete(key);
  }
  listFallback(namespace) {
    const ns = this.fallbackStore.get(namespace);
    if (!ns) return [];
    const now = Date.now();
    const keys = [];
    for (const [key, entry] of ns) {
      if (entry.expiresAt && now > entry.expiresAt) {
        ns.delete(key);
        continue;
      }
      keys.push(key);
    }
    return keys;
  }
}
function createMcpClientAdapter(config) {
  return new McpClientAdapter(config);
}
export {
  McpClientAdapter,
  createMcpClientAdapter
};
//# sourceMappingURL=mcp-client-adapter.js.map
