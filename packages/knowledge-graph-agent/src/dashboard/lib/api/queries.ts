/**
 * GraphQL Query Definitions
 *
 * Type-safe query strings with variables and response types.
 */

import type {
  GraphNode,
  GraphEdge,
  NodeDetail,
  GraphStats,
  GraphFilters,
  NodeFilters,
  PaginationParams,
  PaginatedResponse,
  SearchResponse,
  SearchFilters,
  VectorSearchResult,
  WorkflowExecution,
  Agent,
  AgentActivity,
  AgentMetrics,
  LedgerEvent,
  AuditFilters,
  SystemHealth,
  ServiceHealth,
  Notification,
} from './types.js';

// ============================================================================
// Graph Queries
// ============================================================================

export const GET_GRAPH_NODES = `
  query GetGraphNodes($filters: GraphFiltersInput) {
    graphNodes(filters: $filters) {
      id
      title
      type
      status
      tags
      connections
      path
      createdAt
      updatedAt
    }
  }
`;

export interface GetGraphNodesVariables {
  filters?: GraphFilters;
}

export interface GetGraphNodesResponse {
  graphNodes: GraphNode[];
}

export const GET_GRAPH_EDGES = `
  query GetGraphEdges {
    graphEdges {
      id
      source
      target
      type
      weight
      label
    }
  }
`;

export interface GetGraphEdgesResponse {
  graphEdges: GraphEdge[];
}

export const GET_GRAPH_NODE = `
  query GetGraphNode($id: ID!) {
    graphNode(id: $id) {
      id
      title
      type
      status
      tags
      connections
      path
      content
      frontmatter
      wordCount
      lastModified
      createdAt
      updatedAt
      outgoingLinks {
        id
        title
        type
      }
      incomingLinks {
        id
        title
        type
      }
    }
  }
`;

export interface GetGraphNodeVariables {
  id: string;
}

export interface GetGraphNodeResponse {
  graphNode: NodeDetail;
}

export const GET_RELATED_NODES = `
  query GetRelatedNodes($id: ID!, $maxHops: Int) {
    relatedNodes(id: $id, maxHops: $maxHops) {
      nodes {
        id
        title
        type
        status
        tags
        connections
        path
        createdAt
        updatedAt
      }
      edges {
        id
        source
        target
        type
        weight
      }
    }
  }
`;

export interface GetRelatedNodesVariables {
  id: string;
  maxHops?: number;
}

export interface GetRelatedNodesResponse {
  relatedNodes: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
}

export const GET_GRAPH_STATS = `
  query GetGraphStats {
    graphStats {
      totalNodes
      totalEdges
      nodesByType
      nodesByStatus
      orphanNodes
      avgLinksPerNode
      mostConnected {
        id
        title
        connections
      }
    }
  }
`;

export interface GetGraphStatsResponse {
  graphStats: GraphStats;
}

export const GET_NODES_PAGINATED = `
  query GetNodesPaginated(
    $filters: NodeFiltersInput
    $pagination: PaginationInput!
  ) {
    nodesPaginated(filters: $filters, pagination: $pagination) {
      data {
        id
        title
        type
        status
        tags
        connections
        path
        createdAt
        updatedAt
      }
      total
      page
      limit
      hasMore
    }
  }
`;

export interface GetNodesPaginatedVariables {
  filters?: NodeFilters;
  pagination: PaginationParams;
}

export interface GetNodesPaginatedResponse {
  nodesPaginated: PaginatedResponse<GraphNode>;
}

// ============================================================================
// Search Queries
// ============================================================================

export const SEARCH = `
  query Search(
    $query: String!
    $filters: SearchFiltersInput
    $limit: Int
    $offset: Int
  ) {
    search(query: $query, filters: $filters, limit: $limit, offset: $offset) {
      results {
        id
        type
        title
        description
        path
        score
        highlights {
          field
          fragments
        }
      }
      totalCount
      query
      took
      mode
      facets {
        types
        statuses
        tags
      }
    }
  }
`;

export interface SearchVariables {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface SearchQueryResponse {
  search: SearchResponse;
}

export const VECTOR_SEARCH = `
  query VectorSearch($query: String!, $limit: Int, $threshold: Float) {
    vectorSearch(query: $query, limit: $limit, threshold: $threshold) {
      id
      nodeId
      title
      type
      content
      similarity
      highlights
    }
  }
`;

export interface VectorSearchVariables {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface VectorSearchResponse {
  vectorSearch: VectorSearchResult[];
}

export const SEARCH_SUGGEST = `
  query SearchSuggest($query: String!, $limit: Int) {
    searchSuggest(query: $query, limit: $limit)
  }
`;

export interface SearchSuggestVariables {
  query: string;
  limit?: number;
}

export interface SearchSuggestResponse {
  searchSuggest: string[];
}

// ============================================================================
// Workflow Queries
// ============================================================================

export const GET_WORKFLOWS = `
  query GetWorkflows($status: WorkflowStatus, $limit: Int) {
    workflows(status: $status, limit: $limit) {
      id
      workflowId
      status
      startedAt
      completedAt
      steps {
        id
        name
        status
        progress
      }
      error
    }
  }
`;

export interface GetWorkflowsVariables {
  status?: string;
  limit?: number;
}

export interface GetWorkflowsResponse {
  workflows: WorkflowExecution[];
}

export const GET_WORKFLOW_EXECUTION = `
  query GetWorkflowExecution($id: ID!) {
    workflowExecution(id: $id) {
      id
      workflowId
      status
      startedAt
      completedAt
      steps {
        id
        name
        description
        status
        startedAt
        completedAt
        duration
        progress
        output
        error
      }
      error
    }
  }
`;

export interface GetWorkflowExecutionVariables {
  id: string;
}

export interface GetWorkflowExecutionResponse {
  workflowExecution: WorkflowExecution;
}

// ============================================================================
// Agent Queries
// ============================================================================

export const GET_AGENTS = `
  query GetAgents($status: AgentStatus) {
    agents(status: $status) {
      id
      type
      name
      status
      createdAt
      tasksCompleted
      tasksFailed
    }
  }
`;

export interface GetAgentsVariables {
  status?: 'idle' | 'busy' | 'terminated';
}

export interface GetAgentsResponse {
  agents: Agent[];
}

export const GET_AGENT = `
  query GetAgent($id: ID!) {
    agent(id: $id) {
      id
      type
      name
      status
      createdAt
      tasksCompleted
      tasksFailed
    }
  }
`;

export interface GetAgentVariables {
  id: string;
}

export interface GetAgentResponse {
  agent: Agent;
}

export const GET_AGENT_ACTIVITY = `
  query GetAgentActivity($agentId: ID, $limit: Int, $offset: Int) {
    agentActivity(agentId: $agentId, limit: $limit, offset: $offset) {
      data {
        id
        agentId
        agentType
        agentName
        type
        title
        description
        timestamp
        metadata
        relatedTaskId
        relatedNodeId
      }
      hasMore
    }
  }
`;

export interface GetAgentActivityVariables {
  agentId?: string;
  limit?: number;
  offset?: number;
}

export interface GetAgentActivityResponse {
  agentActivity: {
    data: AgentActivity[];
    hasMore: boolean;
  };
}

export const GET_AGENT_METRICS = `
  query GetAgentMetrics($agentId: ID, $timeRange: String!) {
    agentMetrics(agentId: $agentId, timeRange: $timeRange) {
      agentId
      agentType
      name
      metrics {
        timestamp
        tasksCompleted
        tasksFailed
        avgLatencyMs
        successRate
        memoryUsageMb
      }
    }
  }
`;

export interface GetAgentMetricsVariables {
  agentId?: string;
  timeRange: '1h' | '24h' | '7d' | '30d';
}

export interface GetAgentMetricsResponse {
  agentMetrics: AgentMetrics[];
}

// ============================================================================
// Audit Queries
// ============================================================================

export const GET_AUDIT_EVENTS = `
  query GetAuditEvents($filters: AuditFiltersInput, $cursor: String, $limit: Int) {
    auditEvents(filters: $filters, cursor: $cursor, limit: $limit) {
      events {
        id
        sequence
        envelope {
          id
          hlc {
            physicalMs
            logical
            nodeId
          }
          parents
          payload {
            type
            timestamp
            actor {
              type
              id
              name
            }
            action
            target {
              type
              id
              name
            }
            data
            context {
              workflowId
              stepId
              nodeId
            }
          }
          signature
        }
        hash
        verified
      }
      nextCursor
      hasMore
    }
  }
`;

export interface GetAuditEventsVariables {
  filters?: AuditFilters;
  cursor?: string;
  limit?: number;
}

export interface GetAuditEventsResponse {
  auditEvents: {
    events: LedgerEvent[];
    nextCursor?: string;
    hasMore: boolean;
  };
}

export const GET_AUDIT_EVENT = `
  query GetAuditEvent($id: ID!) {
    auditEvent(id: $id) {
      id
      sequence
      envelope {
        id
        hlc {
          physicalMs
          logical
          nodeId
        }
        parents
        payload {
          type
          timestamp
          actor {
            type
            id
            name
          }
          action
          target {
            type
            id
            name
          }
          data
          context {
            workflowId
            stepId
            nodeId
          }
        }
        signature
      }
      hash
      verified
    }
  }
`;

export interface GetAuditEventVariables {
  id: string;
}

export interface GetAuditEventResponse {
  auditEvent: LedgerEvent;
}

export const VERIFY_AUDIT_EVENT = `
  query VerifyAuditEvent($id: ID!) {
    verifyAuditEvent(id: $id) {
      valid
      errors
    }
  }
`;

export interface VerifyAuditEventVariables {
  id: string;
}

export interface VerifyAuditEventResponse {
  verifyAuditEvent: {
    valid: boolean;
    errors?: string[];
  };
}

export const GET_AUDIT_CHECKPOINTS = `
  query GetAuditCheckpoints($limit: Int) {
    auditCheckpoints(limit: $limit) {
      id
      timestamp
      eventCount
      hash
    }
  }
`;

export interface GetAuditCheckpointsVariables {
  limit?: number;
}

export interface GetAuditCheckpointsResponse {
  auditCheckpoints: Array<{
    id: string;
    timestamp: string;
    eventCount: number;
    hash: string;
  }>;
}

// ============================================================================
// Health Queries
// ============================================================================

export const GET_SYSTEM_HEALTH = `
  query GetSystemHealth {
    systemHealth {
      status
      uptime
      services {
        name
        status
        latency
        message
        lastCheck
        details
      }
      lastCheck
    }
  }
`;

export interface GetSystemHealthResponse {
  systemHealth: SystemHealth;
}

export const GET_SERVICE_HEALTH = `
  query GetServiceHealth($name: String!) {
    serviceHealth(name: $name) {
      name
      status
      latency
      message
      lastCheck
      details
    }
  }
`;

export interface GetServiceHealthVariables {
  name: string;
}

export interface GetServiceHealthResponse {
  serviceHealth: ServiceHealth;
}

// ============================================================================
// Notification Queries
// ============================================================================

export const GET_NOTIFICATIONS = `
  query GetNotifications($limit: Int, $unreadOnly: Boolean) {
    notifications(limit: $limit, unreadOnly: $unreadOnly) {
      id
      type
      title
      message
      timestamp
      read
      action {
        label
        href
      }
    }
  }
`;

export interface GetNotificationsVariables {
  limit?: number;
  unreadOnly?: boolean;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
}
