import { existsSync, readFileSync, mkdirSync, writeFileSync, statSync } from "fs";
import { join, dirname, relative } from "path";
import { createHash } from "crypto";
import { createLogger } from "../utils/logger.js";
const logger = createLogger("shadow-cache");
const CACHE_VERSION = 1;
const CACHE_FILENAME = "shadow-cache.json";
class ShadowCache {
  projectRoot;
  cacheDir;
  cachePath;
  defaultTTL;
  maxEntries;
  persist;
  entries = /* @__PURE__ */ new Map();
  hitCount = 0;
  missCount = 0;
  loaded = false;
  dirty = false;
  createdAt;
  updatedAt;
  constructor(options) {
    this.projectRoot = options.projectRoot;
    this.cacheDir = options.cacheDir || ".kg";
    this.cachePath = join(this.projectRoot, this.cacheDir, CACHE_FILENAME);
    this.defaultTTL = options.defaultTTL || 60 * 60 * 1e3;
    this.maxEntries = options.maxEntries || 1e4;
    this.persist = options.persist !== false;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }
  /**
   * Load cache from disk
   */
  async load() {
    if (!this.persist) {
      this.loaded = true;
      return true;
    }
    try {
      if (existsSync(this.cachePath)) {
        const data = JSON.parse(readFileSync(this.cachePath, "utf-8"));
        if (data.projectRoot !== this.projectRoot) {
          logger.warn("Cache project root mismatch, starting fresh");
          this.loaded = true;
          return false;
        }
        if (data.version !== CACHE_VERSION) {
          logger.warn("Cache version mismatch, starting fresh", {
            cacheVersion: data.version,
            expectedVersion: CACHE_VERSION
          });
          this.loaded = true;
          return false;
        }
        this.entries = new Map(Object.entries(data.entries));
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.loaded = true;
        logger.info("Cache loaded", { entries: this.entries.size });
        return true;
      }
    } catch (error) {
      logger.error("Failed to load cache", error instanceof Error ? error : new Error(String(error)));
    }
    this.loaded = true;
    return false;
  }
  /**
   * Save cache to disk
   */
  async save() {
    if (!this.persist || !this.dirty) {
      return true;
    }
    try {
      const cacheDir = dirname(this.cachePath);
      if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
      }
      await this.prune();
      const data = {
        version: CACHE_VERSION,
        projectRoot: this.projectRoot,
        createdAt: this.createdAt,
        updatedAt: Date.now(),
        entries: Object.fromEntries(this.entries)
      };
      writeFileSync(this.cachePath, JSON.stringify(data, null, 2));
      this.updatedAt = data.updatedAt;
      this.dirty = false;
      logger.info("Cache saved", { entries: this.entries.size });
      return true;
    } catch (error) {
      logger.error("Failed to save cache", error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
  /**
   * Get cached metadata for a file
   */
  get(filePath) {
    const relativePath = this.normalizePath(filePath);
    const entry = this.entries.get(relativePath);
    if (entry) {
      this.hitCount++;
      return entry;
    }
    this.missCount++;
    return void 0;
  }
  /**
   * Set cached metadata for a file
   */
  set(filePath, metadata) {
    const relativePath = this.normalizePath(filePath);
    const fullPath = join(this.projectRoot, relativePath);
    let entry;
    if (metadata.hash && metadata.size !== void 0 && metadata.mtime !== void 0) {
      entry = {
        path: relativePath,
        size: metadata.size,
        mtime: metadata.mtime,
        hash: metadata.hash,
        type: metadata.type || this.inferFileType(relativePath),
        cachedAt: Date.now()
      };
    } else {
      entry = this.computeMetadata(fullPath, relativePath);
    }
    this.entries.set(relativePath, entry);
    this.dirty = true;
    return entry;
  }
  /**
   * Remove a file from cache
   */
  delete(filePath) {
    const relativePath = this.normalizePath(filePath);
    const deleted = this.entries.delete(relativePath);
    if (deleted) {
      this.dirty = true;
    }
    return deleted;
  }
  /**
   * Check if a file exists in cache
   */
  has(filePath) {
    const relativePath = this.normalizePath(filePath);
    return this.entries.has(relativePath);
  }
  /**
   * Check if a file has changed since caching
   */
  hasChanged(filePath) {
    const relativePath = this.normalizePath(filePath);
    const fullPath = join(this.projectRoot, relativePath);
    const cached = this.entries.get(relativePath);
    if (!cached) {
      return true;
    }
    try {
      const stats = statSync(fullPath);
      if (stats.mtimeMs !== cached.mtime || stats.size !== cached.size) {
        return true;
      }
      return false;
    } catch {
      return true;
    }
  }
  /**
   * Detect changes for a list of files
   */
  async detectChanges(filePaths) {
    const changes = [];
    const currentFiles = /* @__PURE__ */ new Set();
    for (const filePath of filePaths) {
      const relativePath = this.normalizePath(filePath);
      const fullPath = join(this.projectRoot, relativePath);
      currentFiles.add(relativePath);
      const cached = this.entries.get(relativePath);
      try {
        const stats = statSync(fullPath);
        const newMeta = this.computeMetadata(fullPath, relativePath);
        if (!cached) {
          changes.push({
            path: relativePath,
            change: "added",
            newMeta
          });
        } else if (cached.mtime !== stats.mtimeMs || cached.size !== stats.size) {
          if (cached.hash !== newMeta.hash) {
            changes.push({
              path: relativePath,
              change: "modified",
              oldMeta: cached,
              newMeta
            });
          } else {
            changes.push({
              path: relativePath,
              change: "unchanged",
              oldMeta: cached,
              newMeta
            });
          }
        } else {
          changes.push({
            path: relativePath,
            change: "unchanged",
            oldMeta: cached,
            newMeta: cached
          });
        }
      } catch {
        if (cached) {
          changes.push({
            path: relativePath,
            change: "deleted",
            oldMeta: cached
          });
        }
      }
    }
    for (const [path, meta] of this.entries) {
      if (!currentFiles.has(path)) {
        changes.push({
          path,
          change: "deleted",
          oldMeta: meta
        });
      }
    }
    return changes;
  }
  /**
   * Update cache with detected changes
   */
  applyChanges(changes) {
    for (const change of changes) {
      switch (change.change) {
        case "added":
        case "modified":
          if (change.newMeta) {
            this.entries.set(change.path, change.newMeta);
          }
          break;
        case "deleted":
          this.entries.delete(change.path);
          break;
      }
    }
    this.dirty = true;
  }
  /**
   * Get cache statistics
   */
  getStats() {
    let staleCount = 0;
    const now = Date.now();
    for (const entry of this.entries.values()) {
      if (now - entry.cachedAt > this.defaultTTL) {
        staleCount++;
      }
    }
    const totalRequests = this.hitCount + this.missCount;
    return {
      totalEntries: this.entries.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      sizeBytes: this.estimateSize(),
      lastUpdated: this.updatedAt,
      staleEntries: staleCount
    };
  }
  /**
   * Clear all cache entries
   */
  clear() {
    this.entries.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.dirty = true;
  }
  /**
   * Prune stale entries
   */
  async prune() {
    const now = Date.now();
    let prunedCount = 0;
    for (const [path, entry] of this.entries) {
      if (now - entry.cachedAt > this.defaultTTL) {
        this.entries.delete(path);
        prunedCount++;
      }
    }
    if (this.entries.size > this.maxEntries) {
      const entries = Array.from(this.entries.entries()).sort((a, b) => a[1].cachedAt - b[1].cachedAt);
      const toRemove = entries.slice(0, entries.length - this.maxEntries);
      for (const [path] of toRemove) {
        this.entries.delete(path);
        prunedCount++;
      }
    }
    if (prunedCount > 0) {
      this.dirty = true;
      logger.info("Pruned cache entries", { count: prunedCount });
    }
    return prunedCount;
  }
  /**
   * Get all cached file paths
   */
  getAllPaths() {
    return Array.from(this.entries.keys());
  }
  /**
   * Get files by type
   */
  getByType(type) {
    return Array.from(this.entries.values()).filter((e) => e.type === type);
  }
  /**
   * Invalidate entries matching a pattern
   */
  invalidate(pattern) {
    let count = 0;
    for (const path of this.entries.keys()) {
      if (pattern.test(path)) {
        this.entries.delete(path);
        count++;
      }
    }
    if (count > 0) {
      this.dirty = true;
    }
    return count;
  }
  // Private helpers
  normalizePath(filePath) {
    if (filePath.startsWith(this.projectRoot)) {
      return relative(this.projectRoot, filePath);
    }
    return filePath;
  }
  computeMetadata(fullPath, relativePath) {
    const stats = statSync(fullPath);
    const content = readFileSync(fullPath);
    const hash = createHash("md5").update(content).digest("hex");
    return {
      path: relativePath,
      size: stats.size,
      mtime: stats.mtimeMs,
      hash,
      type: this.inferFileType(relativePath),
      cachedAt: Date.now()
    };
  }
  inferFileType(filePath) {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const filename = filePath.split("/").pop()?.toLowerCase() || "";
    if (filename === "dockerfile" || filename.startsWith("dockerfile.")) {
      return "docker";
    }
    if (filename.includes("docker-compose") || filename === "compose.yml" || filename === "compose.yaml") {
      return "docker";
    }
    switch (ext) {
      case "md":
      case "mdx":
        return "markdown";
      case "ts":
      case "tsx":
      case "mts":
      case "cts":
        return "typescript";
      case "js":
      case "jsx":
      case "mjs":
      case "cjs":
        return "javascript";
      case "py":
      case "pyw":
        return "python";
      case "rs":
        return "rust";
      case "go":
        return "go";
      case "java":
        return "java";
      case "php":
        return "php";
      case "rb":
        return "ruby";
      case "yml":
      case "yaml":
        return "yaml";
      case "json":
        return "json";
      case "toml":
        return "toml";
      case "ini":
      case "env":
      case "conf":
      case "config":
        return "config";
      default:
        return "other";
    }
  }
  estimateSize() {
    let size = 0;
    for (const entry of this.entries.values()) {
      size += entry.path.length + entry.hash.length + 100;
    }
    return size;
  }
}
function createShadowCache(options) {
  return new ShadowCache(options);
}
async function loadShadowCache(projectRoot) {
  const cache = new ShadowCache({ projectRoot });
  await cache.load();
  return cache;
}
export {
  ShadowCache,
  createShadowCache,
  loadShadowCache
};
//# sourceMappingURL=cache.js.map
