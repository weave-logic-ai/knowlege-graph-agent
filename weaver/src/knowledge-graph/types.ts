/**
 * Knowledge Graph Analysis Types
 * Core type definitions for graph analysis and connection suggestion engine
 */

export interface Frontmatter {
  title?: string;
  tags?: string[];
  category?: string;
  date?: string;
  description?: string;
  aliases?: string[];
  status?: string;
  [key: string]: unknown;
}

export interface GraphNode {
  id: string;
  path: string;
  filename: string;
  content: string;
  frontmatter: Frontmatter;
  outgoingLinks: string[];
  incomingLinks: string[];
  wordCount: number;
  createdAt?: Date;
  modifiedAt?: Date;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: 'explicit' | 'suggested' | 'metadata' | 'semantic';
}

export interface ConnectionSuggestion {
  sourceFile: string;
  targetFile: string;
  score: number;
  reason: string;
  bidirectional: boolean;
  metadata: {
    sharedTags?: string[];
    sharedCategories?: string[];
    semanticSimilarity?: number;
    topicalRelevance?: string;
  };
}

export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  connectedNodes: number;
  disconnectedNodes: number;
  orphanedNodes: number;
  averageDegree: number;
  density: number;
  clusters: number;
  largestComponentSize: number;
}

export interface AnalysisResult {
  metrics: GraphMetrics;
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  suggestions: ConnectionSuggestion[];
  orphanedFiles: string[];
  hubFiles: Array<{ path: string; degree: number }>;
  timestamp: Date;
}

export interface MetadataIndex {
  byTag: Map<string, string[]>;
  byCategory: Map<string, string[]>;
  byDate: Map<string, string[]>;
  byWordCount: Map<string, string[]>;
}

export interface BatchConnectionConfig {
  maxSuggestionsPerFile: number;
  minScore: number;
  preserveExisting: boolean;
  addFrontmatter: boolean;
  bidirectional: boolean;
  dryRun: boolean;
}

export interface BatchConnectionResult {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ file: string; error: string }>;
  connectionsAdded: number;
}

export interface SimilarityScore {
  fileA: string;
  fileB: string;
  score: number;
  method: 'jaccard' | 'cosine' | 'levenshtein' | 'semantic';
}

export interface ClusterInfo {
  id: number;
  files: string[];
  centrality: Map<string, number>;
  density: number;
  avgPathLength: number;
}

export interface ConnectivityReport {
  overall: GraphMetrics;
  clusters: ClusterInfo[];
  topHubs: Array<{ file: string; connections: number }>;
  topSuggestions: ConnectionSuggestion[];
  orphanedFiles: string[];
  weaklyConnectedFiles: Array<{ file: string; degree: number }>;
}
