/**
 * Agent List Tool
 *
 * MCP tool for listing all active agents and their status.
 * Provides filtering by type and status.
 *
 * @module mcp-server/tools/agents/list
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import { getRegistry, AgentType, AgentStatus } from '../../../agents/index.js';

/**
 * Agent list tool definition
 */
export const agentListTool: Tool = {
  name: 'kg_agent_list',
  description: 'List all active agents and their status',
  inputSchema: {
    type: 'object' as const,
    properties: {
      type: {
        type: 'string',
        description: 'Filter by agent type (researcher, coder, tester, analyst, architect)',
        enum: ['researcher', 'coder', 'tester', 'analyst', 'architect', 'reviewer', 'coordinator', 'optimizer', 'documenter'],
      },
      status: {
        type: 'string',
        description: 'Filter by status (idle, running, completed, failed, paused, terminated)',
        enum: ['idle', 'running', 'completed', 'failed', 'paused', 'terminated'],
      },
    },
  },
};

/**
 * Map string agent type to AgentType enum
 */
function mapAgentType(type: string): AgentType | undefined {
  const typeMap: Record<string, AgentType> = {
    researcher: AgentType.RESEARCHER,
    coder: AgentType.CODER,
    tester: AgentType.TESTER,
    analyst: AgentType.ANALYST,
    architect: AgentType.ARCHITECT,
    reviewer: AgentType.REVIEWER,
    coordinator: AgentType.COORDINATOR,
    optimizer: AgentType.OPTIMIZER,
    documenter: AgentType.DOCUMENTER,
  };

  return typeMap[type.toLowerCase()];
}

/**
 * Map string status to AgentStatus enum
 */
function mapStatus(status: string): AgentStatus | undefined {
  const statusMap: Record<string, AgentStatus> = {
    idle: AgentStatus.IDLE,
    running: AgentStatus.RUNNING,
    completed: AgentStatus.COMPLETED,
    failed: AgentStatus.FAILED,
    paused: AgentStatus.PAUSED,
    terminated: AgentStatus.TERMINATED,
  };

  return statusMap[status.toLowerCase()];
}

/**
 * Create handler for agent list tool
 */
export function createAgentListHandler(): ToolHandler {
  return async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const { type, status } = params || {};

    try {
      const registry = getRegistry();

      // Get all agents
      let agents = registry.listInstances();

      // Filter by type if specified
      if (type && typeof type === 'string') {
        const agentType = mapAgentType(type);
        if (agentType) {
          agents = agents.filter(a => a.type === agentType);
        } else {
          return {
            success: false,
            error: `Invalid agent type: ${type}`,
            metadata: { executionTime: Date.now() - startTime },
          };
        }
      }

      // Filter by status if specified
      if (status && typeof status === 'string') {
        const agentStatus = mapStatus(status);
        if (agentStatus) {
          agents = agents.filter(a => a.status === agentStatus);
        } else {
          return {
            success: false,
            error: `Invalid status: ${status}`,
            metadata: { executionTime: Date.now() - startTime },
          };
        }
      }

      // Get additional metrics for each agent
      const agentDetails = agents.map(agent => {
        const instance = registry.get(agent.id);
        return {
          id: agent.id,
          type: agent.type,
          name: agent.name,
          status: agent.status,
          currentTask: instance?.state.currentTask?.id,
          queuedTasks: instance?.state.taskQueue.length || 0,
          completedTasks: instance?.state.completedTasks.length || 0,
          errorCount: instance?.state.errorCount || 0,
          lastActivity: instance?.state.lastActivity?.toISOString(),
        };
      });

      // Get registered types
      const registeredTypes = registry.listTypes().map(t => ({
        type: t.type,
        instanceCount: t.instanceCount,
        capabilities: t.capabilities.map(c => c.name),
      }));

      // Get overall stats
      const stats = registry.getStats();

      return {
        success: true,
        data: {
          agents: agentDetails,
          count: agents.length,
          registeredTypes,
          stats: {
            totalInstances: stats.totalInstances,
            instancesByType: stats.instancesByType,
            instancesByStatus: stats.instancesByStatus,
          },
        },
        metadata: {
          executionTime: Date.now() - startTime,
          filters: {
            type: type || 'all',
            status: status || 'all',
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  };
}
