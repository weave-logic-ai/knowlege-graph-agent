/**
 * Knowledge Graph Agent - Core Types
 * @module @weave-nn/knowledge-graph-agent/types
 */

// =============================================================================
// Node Types
// =============================================================================

/**
 * Node type classifications for knowledge graph documents
 */
export type NodeType =
  | 'concept'      // Conceptual/theoretical document
  | 'technical'    // Technical specification
  | 'feature'      // Feature documentation
  | 'architecture' // Architecture document
  | 'guide'        // How-to guide
  | 'reference'    // Reference documentation
  | 'adr'          // Architecture Decision Record
  | 'unknown';     // Unclassified

/**
 * Document status in the knowledge graph
 */
export type DocumentStatus = 'draft' | 'review' | 'published' | 'archived';

/**
 * Priority levels for documents
 */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// =============================================================================
// Document Frontmatter
// =============================================================================

/**
 * Document frontmatter structure
 */
export interface DocumentFrontmatter {
  /** Document title */
  title?: string;
  /** Document type classification */
  type?: string;
  /** Document status */
  status?: DocumentStatus;
  /** Tags for categorization */
  tags?: string[];
  /** Creation date (ISO 8601) */
  created?: string;
  /** Last updated date (ISO 8601) */
  updated?: string;
  /** Author name or identifier */
  author?: string;
  /** Phase or milestone association */
  phase?: string;
  /** Priority level */
  priority?: Priority;
  /** Aliases for wikilink resolution */
  aliases?: string[];
  /** Parent document reference */
  parent?: string;
  /** Related documents */
  related?: string[];
  /** Custom metadata fields */
  [key: string]: unknown;
}

// =============================================================================
// Graph Node
// =============================================================================

/**
 * Graph node representing a document in the knowledge graph
 */
export interface GraphNode {
  /** Unique identifier (typically content hash or path-based) */
  id: string;

  /** Relative file path from project root */
  path: string;

  /** Absolute file path */
  absolutePath: string;

  /** Document title (from frontmatter or filename) */
  title: string;

  /** Node type classification */
  type: NodeType;

  /** Tags extracted from frontmatter */
  tags: string[];

  /** Full frontmatter object */
  frontmatter: DocumentFrontmatter;

  /** Content hash for change detection */
  contentHash: string;

  /** Outbound link count (links from this document) */
  outDegree: number;

  /** Inbound link count (links to this document) */
  inDegree: number;

  /** Total degree (outDegree + inDegree) */
  degree: number;

  /** Is this node an orphan (no connections) */
  isOrphan: boolean;

  /** File size in bytes */
  size: number;

  /** Creation timestamp */
  createdAt: Date;

  /** Last modification timestamp */
  updatedAt: Date;

  /** Last sync timestamp with memory */
  lastSyncAt?: Date;
}

// =============================================================================
// Graph Edge
// =============================================================================

/**
 * Link type classifications
 */
export type LinkType =
  | 'wikilink'     // [[link]] style
  | 'markdown'     // [text](url) style
  | 'reference'    // Implicit reference
  | 'tag'          // Tag-based connection
  | 'semantic';    // Semantic similarity connection

/**
 * Graph edge representing a link between documents
 */
export interface GraphEdge {
  /** Unique edge identifier */
  id: string;

  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Link type */
  type: LinkType;

  /** Link text/alias */
  text?: string;

  /** Original link string (as it appears in source) */
  original: string;

  /** Edge weight (for weighted algorithms) */
  weight: number;

  /** Anchor/heading reference if any */
  anchor?: string;

  /** Position in source document */
  position?: {
    line: number;
    column: number;
    offset: number;
  };

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Creation timestamp */
  createdAt: Date;
}

// =============================================================================
// Graph Metrics
// =============================================================================

/**
 * Hub document information
 */
export interface HubInfo {
  /** Node identifier */
  nodeId: string;
  /** File path */
  path: string;
  /** Document title */
  title: string;
  /** Number of inbound links */
  inboundLinks: number;
  /** Number of outbound links */
  outboundLinks: number;
  /** Total connections */
  totalLinks: number;
  /** PageRank score if calculated */
  pageRank?: number;
}

/**
 * Graph metrics calculated from the knowledge graph
 */
export interface GraphMetrics {
  /** Total number of nodes */
  totalNodes: number;

  /** Total number of edges */
  totalEdges: number;

  /** Number of orphaned nodes (no connections) */
  orphanCount: number;

  /** Average links per document */
  averageDegree: number;

  /** Graph density (edges / possible edges) */
  density: number;

  /** Number of disconnected clusters */
  clusterCount: number;

  /** Nodes with weak connectivity (<2 edges) */
  weaklyConnected: number;

  /** Nodes with strong connectivity (5+ edges) */
  wellConnected: number;

  /** Hub documents with high connectivity */
  hubs: HubInfo[];

  /** Tag distribution */
  tagDistribution: Record<string, number>;

  /** Type distribution */
  typeDistribution: Record<NodeType, number>;

  /** Average path length between connected nodes */
  averagePathLength?: number;

  /** Clustering coefficient */
  clusteringCoefficient?: number;

  /** Timestamp of calculation */
  calculatedAt: Date;
}

// =============================================================================
// Traversal Types
// =============================================================================

/**
 * Traversal algorithm options
 */
export type TraversalAlgorithm =
  | 'bfs'           // Breadth-first search
  | 'dfs'           // Depth-first search
  | 'dijkstra'      // Shortest path
  | 'astar'         // A* pathfinding
  | 'pagerank';     // PageRank importance

/**
 * Traversal options
 */
export interface TraversalOptions {
  /** Algorithm to use */
  algorithm: TraversalAlgorithm;
  /** Maximum depth to traverse */
  maxDepth?: number;
  /** Direction of traversal */
  direction?: 'outbound' | 'inbound' | 'both';
  /** Filter function for nodes */
  filter?: (node: GraphNode) => boolean;
  /** Edge types to follow */
  edgeTypes?: LinkType[];
}

/**
 * Traversal result
 */
export interface TraversalResult {
  /** Nodes visited in order */
  visited: GraphNode[];
  /** Path taken (node IDs) */
  path: string[];
  /** Maximum depth reached */
  depth: number;
  /** Algorithm used */
  algorithm: TraversalAlgorithm;
  /** Starting node ID */
  startNode: string;
  /** Ending node ID (for pathfinding) */
  endNode?: string;
  /** Whether target was reached (for pathfinding) */
  targetReached?: boolean;
  /** Execution time in milliseconds */
  executionTime: number;
}

// =============================================================================
// Cluster Types
// =============================================================================

/**
 * Cluster information
 */
export interface Cluster {
  /** Cluster identifier */
  id: number;
  /** Node IDs in this cluster */
  nodes: string[];
  /** Number of nodes */
  size: number;
  /** Internal density of the cluster */
  density: number;
  /** Most central node in the cluster */
  centralNode: string;
  /** Common tags across cluster nodes */
  commonTags: string[];
  /** Suggested cluster label */
  label?: string;
}

// =============================================================================
// Connection Suggestions
// =============================================================================

/**
 * Reason for suggesting a connection
 */
export type SuggestionReason =
  | 'shared-tags'        // Nodes share common tags
  | 'similar-content'    // Content similarity detected
  | 'same-directory'     // Files in same directory
  | 'referenced-topic'   // Topic mentioned in both
  | 'orphan-rescue'      // Connecting orphaned node
  | 'cluster-bridge'     // Bridge between clusters
  | 'semantic-similarity'; // Semantic embedding similarity

/**
 * Connection suggestion
 */
export interface ConnectionSuggestion {
  /** Source node ID */
  sourceId: string;
  /** Source node path */
  sourcePath: string;
  /** Target node ID */
  targetId: string;
  /** Target node path */
  targetPath: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Reason for suggestion */
  reason: SuggestionReason;
  /** Suggested link text */
  suggestedLinkText?: string;
  /** Suggested anchor if applicable */
  suggestedAnchor?: string;
  /** Additional context */
  context?: string;
}

// =============================================================================
// Query Types
// =============================================================================

/**
 * Node query options
 */
export interface NodeQuery {
  /** Filter by type */
  type?: NodeType | NodeType[];
  /** Filter by tags (any match) */
  tags?: string[];
  /** Filter by all tags (must have all) */
  tagsAll?: string[];
  /** Filter by path pattern (glob) */
  path?: string;
  /** Filter orphans only */
  orphansOnly?: boolean;
  /** Filter by minimum degree */
  minDegree?: number;
  /** Filter by maximum degree */
  maxDegree?: number;
  /** Filter by status */
  status?: DocumentStatus;
  /** Search in title/content */
  search?: string;
  /** Sort field */
  sortBy?: 'title' | 'path' | 'degree' | 'createdAt' | 'updatedAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Edge query options
 */
export interface EdgeQuery {
  /** Filter by source node ID */
  source?: string;
  /** Filter by target node ID */
  target?: string;
  /** Filter by edge type */
  type?: LinkType | LinkType[];
  /** Filter by minimum weight */
  minWeight?: number;
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * Graph event types
 */
export type GraphEventType =
  | 'node:added'
  | 'node:updated'
  | 'node:removed'
  | 'edge:added'
  | 'edge:removed'
  | 'graph:built'
  | 'graph:cleared'
  | 'metrics:calculated'
  | 'sync:started'
  | 'sync:completed'
  | 'sync:failed';

/**
 * Graph event
 */
export interface GraphEvent<T = unknown> {
  /** Event type */
  type: GraphEventType;
  /** Event timestamp */
  timestamp: Date;
  /** Event payload */
  payload: T;
  /** Source of the event */
  source: string;
}

/**
 * Event listener function
 */
export type GraphEventListener<T = unknown> = (event: GraphEvent<T>) => void;

// =============================================================================
// Export Types
// =============================================================================

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'dot' | 'mermaid' | 'csv' | 'markdown';

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  /** Include full node content */
  includeContent?: boolean;
  /** Include metrics */
  includeMetrics?: boolean;
  /** Filter nodes to export */
  filter?: NodeQuery;
  /** Pretty print output */
  pretty?: boolean;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Export format used */
  format: ExportFormat;
  /** Exported content */
  content: string;
  /** Number of nodes exported */
  nodeCount: number;
  /** Number of edges exported */
  edgeCount: number;
  /** Export timestamp */
  exportedAt: Date;
}
