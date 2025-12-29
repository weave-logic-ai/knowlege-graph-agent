/**
 * API Types for Knowledge Graph Agent Dashboard
 *
 * Central type definitions for all API interactions.
 */

// Base types
export type NodeType =
  | 'concept'
  | 'technical'
  | 'feature'
  | 'primitive'
  | 'service'
  | 'guide'
  | 'standard'
  | 'integration';

export type NodeStatus = 'active' | 'draft' | 'deprecated' | 'archived';

export type EdgeType = 'link' | 'reference' | 'parent' | 'related';

export type AgentType =
  | 'researcher'
  | 'coder'
  | 'analyst'
  | 'optimizer'
  | 'coordinator';

export type AuditEventType =
  | 'node:created' | 'node:updated' | 'node:deleted'
  | 'edge:created' | 'edge:deleted'
  | 'workflow:started' | 'workflow:completed' | 'workflow:failed'
  | 'agent:spawned' | 'agent:terminated' | 'agent:task'
  | 'checkpoint:created' | 'sync:completed'
  | 'search:query' | 'config:changed';

// Graph Types
export interface GraphNode {
  id: string;
  title: string;
  type: NodeType;
  status: NodeStatus;
  tags: string[];
  connections: number;
  path: string;
  createdAt: string;
  updatedAt: string;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  label?: string;
}

export interface NodeDetail extends GraphNode {
  content: string;
  frontmatter: Record<string, unknown>;
  wordCount: number;
  lastModified: string;
  outgoingLinks: NodeLink[];
  incomingLinks: NodeLink[];
}

export interface NodeLink {
  id: string;
  title: string;
  type: EdgeType;
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<NodeType, number>;
  nodesByStatus: Record<NodeStatus, number>;
  orphanNodes: number;
  avgLinksPerNode: number;
  mostConnected: Array<{ id: string; title: string; connections: number }>;
}

// Filter Types
export interface GraphFilters {
  types?: NodeType[];
  statuses?: NodeStatus[];
  tags?: string[];
  searchQuery?: string;
}

export interface NodeFilters extends GraphFilters {
  dateRange?: {
    start: string;
    end: string;
  };
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Search Types
export type SearchMode = 'fulltext' | 'semantic' | 'hybrid';

export interface SearchFilters {
  types?: NodeType[];
  statuses?: NodeStatus[];
  tags?: string[];
  dateRange?: { start: string; end: string };
  searchMode: SearchMode;
  includeContent?: boolean;
}

export interface SearchResult {
  id: string;
  type: 'node' | 'workflow' | 'agent' | 'event';
  title: string;
  description?: string;
  path?: string;
  score: number;
  highlights?: Array<{
    field: string;
    fragments: string[];
  }>;
}

export interface VectorSearchResult {
  id: string;
  nodeId: string;
  title: string;
  type: NodeType;
  content: string;
  similarity: number;
  embedding?: number[];
  highlights?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: string;
  took: number;
  mode: SearchMode;
  facets?: {
    types: Record<NodeType, number>;
    statuses: Record<NodeStatus, number>;
    tags: Record<string, number>;
  };
}

// Workflow Types
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  startedAt: string;
  completedAt?: string;
  steps: StepExecution[];
  error?: string;
}

export interface StepExecution {
  id: string;
  name: string;
  description?: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  progress?: number;
  output?: unknown;
  error?: string;
}

// Agent Types
export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  status: 'idle' | 'busy' | 'terminated';
  createdAt: string;
  tasksCompleted: number;
  tasksFailed: number;
}

export interface AgentActivity {
  id: string;
  agentId: string;
  agentType: AgentType;
  agentName: string;
  type: 'task_started' | 'task_completed' | 'task_failed' |
        'spawned' | 'terminated' | 'message' | 'memory_update';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  relatedTaskId?: string;
  relatedNodeId?: string;
}

export interface AgentMetrics {
  agentId: string;
  agentType: AgentType;
  name: string;
  metrics: Array<{
    timestamp: string;
    tasksCompleted: number;
    tasksFailed: number;
    avgLatencyMs: number;
    successRate: number;
    memoryUsageMb: number;
  }>;
}

// Audit Types
export interface HybridLogicalClock {
  physicalMs: number;
  logical: number;
  nodeId: string;
}

export interface LedgerEvent {
  id: string;
  sequence: number;
  envelope: {
    id: string;
    hlc: HybridLogicalClock;
    parents: string[];
    payload: AuditPayload;
    signature: string;
  };
  hash: string;
  verified: boolean;
}

export interface AuditPayload {
  type: AuditEventType;
  timestamp: string;
  actor: {
    type: 'agent' | 'user' | 'system';
    id: string;
    name: string;
  };
  action: string;
  target?: {
    type: string;
    id: string;
    name?: string;
  };
  data?: Record<string, unknown>;
  context?: {
    workflowId?: string;
    stepId?: string;
    nodeId?: string;
  };
}

export interface AuditFilters {
  eventTypes?: AuditEventType[];
  actor?: string;
  from?: string;
  to?: string;
  cursor?: string;
}

// Health Types
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type ServiceStatus = 'up' | 'down' | 'degraded';

export interface SystemHealth {
  status: HealthStatus;
  uptime: number;
  services: ServiceHealth[];
  lastCheck: string;
}

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  latency?: number;
  message?: string;
  lastCheck: string;
  details?: Record<string, unknown>;
}

// Notification Types
export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

// API Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  status: number;
}
