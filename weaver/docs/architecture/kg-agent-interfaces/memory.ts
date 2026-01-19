/**
 * Knowledge Graph Agent - Memory/Sync Types
 * @module @weave-nn/knowledge-graph-agent/memory
 */

import type { GraphNode, GraphEdge, GraphMetrics } from './core';

// =============================================================================
// Memory Configuration
// =============================================================================

/**
 * Memory client configuration
 */
export interface MemoryConfig {
  /** Default namespace for operations */
  defaultNamespace: string;

  /** Default TTL in seconds (0 = no expiry) */
  defaultTTL: number;

  /** Number of retry attempts for operations */
  retryAttempts: number;

  /** Retry delay in milliseconds */
  retryDelay: number;

  /** Enable automatic sync */
  autoSync: boolean;

  /** Auto-sync interval in milliseconds */
  syncInterval: number;

  /** Batch size for bulk operations */
  batchSize: number;

  /** Enable local caching */
  cacheEnabled: boolean;

  /** Cache TTL in seconds */
  cacheTTL: number;
}

/**
 * Default memory configuration
 */
export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  defaultNamespace: 'kg-graph',
  defaultTTL: 0,
  retryAttempts: 3,
  retryDelay: 1000,
  autoSync: false,
  syncInterval: 300000, // 5 minutes
  batchSize: 50,
  cacheEnabled: true,
  cacheTTL: 3600,
};

// =============================================================================
// Memory Operations
// =============================================================================

/**
 * Memory action type
 */
export type MemoryAction = 'store' | 'retrieve' | 'list' | 'delete' | 'search';

/**
 * Memory entry for storage operations
 */
export interface MemoryEntry {
  /** Entry key */
  key: string;

  /** Entry value */
  value: unknown;

  /** Namespace (uses default if not specified) */
  namespace?: string;

  /** TTL in seconds (uses default if not specified) */
  ttl?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Memory retrieval result
 */
export interface MemoryRetrieveResult<T = unknown> {
  /** Retrieved key */
  key: string;

  /** Retrieved value */
  value: T | null;

  /** Namespace */
  namespace: string;

  /** Whether key was found */
  found: boolean;

  /** Entry metadata */
  metadata?: Record<string, unknown>;

  /** Entry expiration time */
  expiresAt?: Date;
}

/**
 * Batch operation result
 */
export interface BatchResult {
  /** Number of successful operations */
  successful: number;

  /** Number of failed operations */
  failed: number;

  /** Error details */
  errors: Array<{
    key: string;
    error: string;
  }>;

  /** Operation duration in milliseconds */
  duration: number;
}

/**
 * Memory search result
 */
export interface MemorySearchResult<T = unknown> {
  /** Matching key */
  key: string;

  /** Value */
  value: T;

  /** Namespace */
  namespace: string;

  /** Match score (for fuzzy searches) */
  score?: number;
}

// =============================================================================
// Namespace Management
// =============================================================================

/**
 * Namespace information
 */
export interface NamespaceInfo {
  /** Namespace name */
  name: string;

  /** Number of keys in namespace */
  keyCount: number;

  /** Total size in bytes */
  sizeBytes: number;

  /** Last modified timestamp */
  lastModified: Date;

  /** Creation timestamp */
  createdAt: Date;

  /** Namespace description */
  description?: string;
}

/**
 * Namespace operations
 */
export interface NamespaceOperations {
  /** Create a new namespace */
  create(name: string, description?: string): Promise<void>;

  /** Delete a namespace and all its contents */
  delete(name: string): Promise<void>;

  /** List all namespaces */
  list(): Promise<NamespaceInfo[]>;

  /** Get namespace info */
  info(name: string): Promise<NamespaceInfo | null>;

  /** Clear all keys in a namespace */
  clear(name: string): Promise<number>;

  /** Rename a namespace */
  rename(oldName: string, newName: string): Promise<void>;
}

// =============================================================================
// Sync Types
// =============================================================================

/**
 * Sync direction
 */
export type SyncDirection = 'push' | 'pull' | 'bidirectional';

/**
 * Sync status
 */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'conflict';

/**
 * Sync options
 */
export interface SyncOptions {
  /** Sync direction */
  direction: SyncDirection;

  /** Force sync (overwrite conflicts) */
  force?: boolean;

  /** Dry run (don't actually sync) */
  dryRun?: boolean;

  /** Filter nodes to sync */
  filter?: (node: GraphNode) => boolean;

  /** Conflict resolution strategy */
  conflictResolution?: ConflictResolution;

  /** Include metrics in sync */
  includeMetrics?: boolean;

  /** Callback for progress updates */
  onProgress?: (progress: SyncProgress) => void;
}

/**
 * Sync progress
 */
export interface SyncProgress {
  /** Current phase */
  phase: 'preparing' | 'diffing' | 'pushing' | 'pulling' | 'resolving' | 'finalizing';

  /** Items processed */
  processed: number;

  /** Total items */
  total: number;

  /** Percentage complete */
  percentage: number;

  /** Current item being processed */
  currentItem?: string;
}

/**
 * Sync result
 */
export interface SyncResult {
  /** Sync direction used */
  direction: SyncDirection;

  /** Items pushed (local to remote) */
  pushed: number;

  /** Items pulled (remote to local) */
  pulled: number;

  /** Items unchanged */
  unchanged: number;

  /** Conflicts encountered */
  conflicts: ConflictInfo[];

  /** Conflicts resolved */
  conflictsResolved: number;

  /** Sync duration in milliseconds */
  duration: number;

  /** Sync timestamp */
  timestamp: Date;

  /** Errors encountered */
  errors: SyncError[];

  /** Was this a dry run */
  dryRun: boolean;
}

/**
 * Sync error
 */
export interface SyncError {
  /** Error type */
  type: 'network' | 'conflict' | 'validation' | 'unknown';

  /** Error message */
  message: string;

  /** Affected key */
  key?: string;

  /** Error details */
  details?: unknown;
}

// =============================================================================
// Conflict Resolution
// =============================================================================

/**
 * Conflict resolution strategy
 */
export type ConflictResolution =
  | 'local-wins'    // Local version always wins
  | 'remote-wins'   // Remote version always wins
  | 'newest-wins'   // Most recently modified wins
  | 'merge'         // Attempt to merge changes
  | 'manual';       // Require manual resolution

/**
 * Conflict information
 */
export interface ConflictInfo {
  /** Conflict key */
  key: string;

  /** Local value */
  localValue: unknown;

  /** Remote value */
  remoteValue: unknown;

  /** Local timestamp */
  localTimestamp: Date;

  /** Remote timestamp */
  remoteTimestamp: Date;

  /** Resolution applied */
  resolution: ConflictResolution | 'unresolved';

  /** Resolved value (if resolved) */
  resolvedValue?: unknown;
}

/**
 * Manual conflict resolution callback
 */
export type ConflictResolver = (conflict: ConflictInfo) => Promise<{
  resolution: 'local' | 'remote' | 'merged';
  value: unknown;
}>;

// =============================================================================
// Graph Snapshot
// =============================================================================

/**
 * Graph snapshot for memory storage
 */
export interface GraphSnapshot {
  /** Snapshot version */
  version: string;

  /** Snapshot timestamp */
  timestamp: Date;

  /** All nodes in the graph */
  nodes: GraphNode[];

  /** All edges in the graph */
  edges: GraphEdge[];

  /** Graph metrics at snapshot time */
  metrics: GraphMetrics;

  /** Content checksum for integrity */
  checksum: string;

  /** Snapshot metadata */
  metadata: SnapshotMetadata;
}

/**
 * Snapshot metadata
 */
export interface SnapshotMetadata {
  /** Source project/vault path */
  sourcePath: string;

  /** Snapshot creator */
  createdBy: string;

  /** Snapshot description */
  description?: string;

  /** Previous snapshot checksum (for chain verification) */
  previousChecksum?: string;

  /** Custom metadata */
  custom?: Record<string, unknown>;
}

/**
 * Snapshot comparison result
 */
export interface SnapshotDiff {
  /** Added nodes */
  addedNodes: GraphNode[];

  /** Removed nodes */
  removedNodes: GraphNode[];

  /** Modified nodes */
  modifiedNodes: Array<{
    nodeId: string;
    changes: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }>;
  }>;

  /** Added edges */
  addedEdges: GraphEdge[];

  /** Removed edges */
  removedEdges: GraphEdge[];

  /** Summary statistics */
  summary: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
  };
}

// =============================================================================
// Cache Types
// =============================================================================

/**
 * Cache entry
 */
export interface CacheEntry<T = unknown> {
  /** Cached key */
  key: string;

  /** Cached value */
  value: T;

  /** Cache timestamp */
  cachedAt: Date;

  /** Expiration timestamp */
  expiresAt: Date;

  /** Cache hits count */
  hits: number;

  /** Last accessed timestamp */
  lastAccessed: Date;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total entries in cache */
  entries: number;

  /** Cache hits */
  hits: number;

  /** Cache misses */
  misses: number;

  /** Hit rate (0-1) */
  hitRate: number;

  /** Total cache size in bytes */
  sizeBytes: number;

  /** Oldest entry timestamp */
  oldestEntry?: Date;

  /** Newest entry timestamp */
  newestEntry?: Date;
}

// =============================================================================
// Memory Client Interface
// =============================================================================

/**
 * Memory client interface
 */
export interface IMemoryClient {
  /** Store a value */
  store(key: string, value: unknown, options?: Partial<MemoryEntry>): Promise<void>;

  /** Retrieve a value */
  retrieve<T = unknown>(key: string, namespace?: string): Promise<T | null>;

  /** List keys in namespace */
  list(namespace?: string): Promise<string[]>;

  /** Delete a key */
  delete(key: string, namespace?: string): Promise<boolean>;

  /** Search by pattern */
  search<T = unknown>(pattern: string, namespace?: string): Promise<MemorySearchResult<T>[]>;

  /** Batch store */
  storeBatch(entries: MemoryEntry[]): Promise<BatchResult>;

  /** Batch retrieve */
  retrieveBatch<T = unknown>(keys: string[], namespace?: string): Promise<Map<string, T | null>>;

  /** Clear namespace */
  clearNamespace(namespace: string): Promise<number>;

  /** Get namespace info */
  getNamespaceInfo(namespace: string): Promise<NamespaceInfo | null>;
}

/**
 * Graph memory client interface (extends base memory)
 */
export interface IGraphMemoryClient extends IMemoryClient {
  /** Sync graph to memory */
  syncGraph(snapshot: GraphSnapshot, options?: SyncOptions): Promise<SyncResult>;

  /** Load graph from memory */
  loadGraph(options?: { version?: string }): Promise<GraphSnapshot | null>;

  /** Store single node */
  storeNode(node: GraphNode): Promise<void>;

  /** Retrieve single node */
  retrieveNode(nodeId: string): Promise<GraphNode | null>;

  /** Store single edge */
  storeEdge(edge: GraphEdge): Promise<void>;

  /** Get sync status */
  getSyncStatus(): Promise<SyncStatus>;

  /** Get last sync time */
  getLastSyncTime(): Promise<Date | null>;

  /** Create snapshot */
  createSnapshot(description?: string): Promise<GraphSnapshot>;

  /** List snapshots */
  listSnapshots(): Promise<Array<{ checksum: string; timestamp: Date; description?: string }>>;

  /** Restore from snapshot */
  restoreSnapshot(checksum: string): Promise<GraphSnapshot>;

  /** Compare snapshots */
  compareSnapshots(checksum1: string, checksum2: string): Promise<SnapshotDiff>;
}
