/**
 * GraphQL Mutation Definitions
 *
 * Type-safe mutation strings with input types and response types.
 */

import type {
  GraphNode,
  NodeDetail,
  NodeType,
  NodeStatus,
  Agent,
  AgentType,
  WorkflowExecution,
  Notification,
} from './types.js';

// ============================================================================
// Node Mutations
// ============================================================================

export const CREATE_NODE = `
  mutation CreateNode($input: CreateNodeInput!) {
    createNode(input: $input) {
      id
      title
      type
      status
      tags
      path
      createdAt
      updatedAt
    }
  }
`;

export interface CreateNodeInput {
  title: string;
  type: NodeType;
  status?: NodeStatus;
  tags?: string[];
  content?: string;
  frontmatter?: Record<string, unknown>;
  path?: string;
}

export interface CreateNodeVariables {
  input: CreateNodeInput;
}

export interface CreateNodeResponse {
  createNode: GraphNode;
}

export const UPDATE_NODE = `
  mutation UpdateNode($id: ID!, $input: UpdateNodeInput!) {
    updateNode(id: $id, input: $input) {
      id
      title
      type
      status
      tags
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

export interface UpdateNodeInput {
  title?: string;
  type?: NodeType;
  status?: NodeStatus;
  tags?: string[];
  content?: string;
  frontmatter?: Record<string, unknown>;
}

export interface UpdateNodeVariables {
  id: string;
  input: UpdateNodeInput;
}

export interface UpdateNodeResponse {
  updateNode: NodeDetail;
}

export const DELETE_NODE = `
  mutation DeleteNode($id: ID!) {
    deleteNode(id: $id) {
      success
      deletedId
    }
  }
`;

export interface DeleteNodeVariables {
  id: string;
}

export interface DeleteNodeResponse {
  deleteNode: {
    success: boolean;
    deletedId: string;
  };
}

export const BULK_UPDATE_NODES = `
  mutation BulkUpdateNodes($ids: [ID!]!, $input: UpdateNodeInput!) {
    bulkUpdateNodes(ids: $ids, input: $input) {
      updatedCount
      updatedIds
    }
  }
`;

export interface BulkUpdateNodesVariables {
  ids: string[];
  input: UpdateNodeInput;
}

export interface BulkUpdateNodesResponse {
  bulkUpdateNodes: {
    updatedCount: number;
    updatedIds: string[];
  };
}

export const BULK_DELETE_NODES = `
  mutation BulkDeleteNodes($ids: [ID!]!) {
    bulkDeleteNodes(ids: $ids) {
      deletedCount
      deletedIds
    }
  }
`;

export interface BulkDeleteNodesVariables {
  ids: string[];
}

export interface BulkDeleteNodesResponse {
  bulkDeleteNodes: {
    deletedCount: number;
    deletedIds: string[];
  };
}

// ============================================================================
// Edge Mutations
// ============================================================================

export const CREATE_EDGE = `
  mutation CreateEdge($input: CreateEdgeInput!) {
    createEdge(input: $input) {
      id
      source
      target
      type
      weight
      label
    }
  }
`;

export interface CreateEdgeInput {
  source: string;
  target: string;
  type: 'link' | 'reference' | 'parent' | 'related';
  weight?: number;
  label?: string;
}

export interface CreateEdgeVariables {
  input: CreateEdgeInput;
}

export interface CreateEdgeResponse {
  createEdge: {
    id: string;
    source: string;
    target: string;
    type: string;
    weight: number;
    label?: string;
  };
}

export const DELETE_EDGE = `
  mutation DeleteEdge($id: ID!) {
    deleteEdge(id: $id) {
      success
      deletedId
    }
  }
`;

export interface DeleteEdgeVariables {
  id: string;
}

export interface DeleteEdgeResponse {
  deleteEdge: {
    success: boolean;
    deletedId: string;
  };
}

// ============================================================================
// Agent Mutations
// ============================================================================

export const SPAWN_AGENT = `
  mutation SpawnAgent($input: SpawnAgentInput!) {
    spawnAgent(input: $input) {
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

export interface SpawnAgentInput {
  type: AgentType;
  name?: string;
  capabilities?: string[];
  config?: Record<string, unknown>;
}

export interface SpawnAgentVariables {
  input: SpawnAgentInput;
}

export interface SpawnAgentResponse {
  spawnAgent: Agent;
}

export const TERMINATE_AGENT = `
  mutation TerminateAgent($id: ID!) {
    terminateAgent(id: $id) {
      success
      terminatedId
    }
  }
`;

export interface TerminateAgentVariables {
  id: string;
}

export interface TerminateAgentResponse {
  terminateAgent: {
    success: boolean;
    terminatedId: string;
  };
}

export const ASSIGN_TASK_TO_AGENT = `
  mutation AssignTaskToAgent($agentId: ID!, $task: TaskInput!) {
    assignTaskToAgent(agentId: $agentId, task: $task) {
      taskId
      agentId
      status
    }
  }
`;

export interface TaskInput {
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

export interface AssignTaskToAgentVariables {
  agentId: string;
  task: TaskInput;
}

export interface AssignTaskToAgentResponse {
  assignTaskToAgent: {
    taskId: string;
    agentId: string;
    status: string;
  };
}

// ============================================================================
// Workflow Mutations
// ============================================================================

export const START_WORKFLOW = `
  mutation StartWorkflow($id: ID!, $input: WorkflowInput) {
    startWorkflow(id: $id, input: $input) {
      id
      workflowId
      status
      startedAt
      steps {
        id
        name
        status
      }
    }
  }
`;

export interface WorkflowInput {
  params?: Record<string, unknown>;
}

export interface StartWorkflowVariables {
  id: string;
  input?: WorkflowInput;
}

export interface StartWorkflowResponse {
  startWorkflow: WorkflowExecution;
}

export const CANCEL_WORKFLOW = `
  mutation CancelWorkflow($id: ID!) {
    cancelWorkflow(id: $id) {
      success
      workflowId
      status
    }
  }
`;

export interface CancelWorkflowVariables {
  id: string;
}

export interface CancelWorkflowResponse {
  cancelWorkflow: {
    success: boolean;
    workflowId: string;
    status: string;
  };
}

// ============================================================================
// Audit Mutations
// ============================================================================

export const CREATE_CHECKPOINT = `
  mutation CreateCheckpoint($description: String) {
    createCheckpoint(description: $description) {
      id
      timestamp
      eventCount
      hash
    }
  }
`;

export interface CreateCheckpointVariables {
  description?: string;
}

export interface CreateCheckpointResponse {
  createCheckpoint: {
    id: string;
    timestamp: string;
    eventCount: number;
    hash: string;
  };
}

// ============================================================================
// Notification Mutations
// ============================================================================

export const MARK_NOTIFICATION_READ = `
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      id
      read
    }
  }
`;

export interface MarkNotificationReadVariables {
  id: string;
}

export interface MarkNotificationReadResponse {
  markNotificationRead: Notification;
}

export const MARK_ALL_NOTIFICATIONS_READ = `
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead {
      updatedCount
    }
  }
`;

export interface MarkAllNotificationsReadResponse {
  markAllNotificationsRead: {
    updatedCount: number;
  };
}

export const CLEAR_NOTIFICATIONS = `
  mutation ClearNotifications {
    clearNotifications {
      deletedCount
    }
  }
`;

export interface ClearNotificationsResponse {
  clearNotifications: {
    deletedCount: number;
  };
}

// ============================================================================
// System Mutations
// ============================================================================

export const EXPORT_GRAPH = `
  mutation ExportGraph($format: ExportFormat!) {
    exportGraph(format: $format) {
      url
      filename
      format
      size
    }
  }
`;

export interface ExportGraphVariables {
  format: 'json' | 'csv' | 'graphml';
}

export interface ExportGraphResponse {
  exportGraph: {
    url: string;
    filename: string;
    format: string;
    size: number;
  };
}

export const SYNC_TO_CLAUDE_FLOW = `
  mutation SyncToClaudeFlow {
    syncToClaudeFlow {
      success
      syncedNodes
      syncedEdges
      errors
    }
  }
`;

export interface SyncToClaudeFlowResponse {
  syncToClaudeFlow: {
    success: boolean;
    syncedNodes: number;
    syncedEdges: number;
    errors?: string[];
  };
}

export const BACKUP_GRAPH = `
  mutation BackupGraph($description: String) {
    backupGraph(description: $description) {
      id
      timestamp
      filename
      size
    }
  }
`;

export interface BackupGraphVariables {
  description?: string;
}

export interface BackupGraphResponse {
  backupGraph: {
    id: string;
    timestamp: string;
    filename: string;
    size: number;
  };
}

export const RESTORE_GRAPH = `
  mutation RestoreGraph($backupId: ID!) {
    restoreGraph(backupId: $backupId) {
      success
      restoredNodes
      restoredEdges
    }
  }
`;

export interface RestoreGraphVariables {
  backupId: string;
}

export interface RestoreGraphResponse {
  restoreGraph: {
    success: boolean;
    restoredNodes: number;
    restoredEdges: number;
  };
}
