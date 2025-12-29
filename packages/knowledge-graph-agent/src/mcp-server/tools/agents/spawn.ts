/**
 * Agent Spawn Tool
 *
 * MCP tool for spawning specialized agents to perform tasks.
 * Integrates with the agent registry for lifecycle management.
 *
 * @module mcp-server/tools/agents/spawn
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import { getRegistry, AgentType, TaskPriority, createTaskId } from '../../../agents/index.js';

/**
 * Agent spawn tool definition
 */
export const agentSpawnTool: Tool = {
  name: 'kg_agent_spawn',
  description: 'Spawn a specialized agent to perform a task',
  inputSchema: {
    type: 'object' as const,
    properties: {
      type: {
        type: 'string',
        description: 'Agent type (researcher, coder, tester, analyst, architect)',
        enum: ['researcher', 'coder', 'tester', 'analyst', 'architect'],
      },
      name: { type: 'string', description: 'Custom agent name (optional)' },
      task: { type: 'string', description: 'Task for the agent to perform' },
      options: {
        type: 'object',
        description: 'Agent-specific options',
        properties: {
          timeout: { type: 'number', description: 'Task timeout in ms' },
          maxRetries: { type: 'number', description: 'Maximum retries' },
          priority: {
            type: 'string',
            description: 'Task priority (low, medium, high, critical)',
            enum: ['low', 'medium', 'high', 'critical'],
          },
        },
      },
    },
    required: ['type', 'task'],
  },
};

/**
 * Map string agent type to AgentType enum
 */
function mapAgentType(type: string): AgentType {
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

  return typeMap[type.toLowerCase()] || AgentType.CUSTOM;
}

/**
 * Map string priority to TaskPriority enum
 */
function mapPriority(priority?: string): TaskPriority {
  const priorityMap: Record<string, TaskPriority> = {
    low: TaskPriority.LOW,
    medium: TaskPriority.MEDIUM,
    high: TaskPriority.HIGH,
    critical: TaskPriority.CRITICAL,
  };

  return priority ? priorityMap[priority.toLowerCase()] || TaskPriority.MEDIUM : TaskPriority.MEDIUM;
}

/**
 * Create handler for agent spawn tool
 */
export function createAgentSpawnHandler(): ToolHandler {
  return async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const { type, name, task, options = {} } = params || {};

    // Validate required parameters
    if (!type || typeof type !== 'string') {
      return {
        success: false,
        error: 'Agent type is required',
        metadata: { executionTime: Date.now() - startTime },
      };
    }

    if (!task || typeof task !== 'string') {
      return {
        success: false,
        error: 'Task description is required',
        metadata: { executionTime: Date.now() - startTime },
      };
    }

    try {
      const registry = getRegistry();
      const agentType = mapAgentType(type);

      // Check if agent type is registered
      if (!registry.isRegistered(agentType)) {
        return {
          success: false,
          error: `Agent type '${type}' is not registered. Available types: ${registry.listTypes().map(t => t.type).join(', ')}`,
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Extract options
      const typedOptions = options as {
        timeout?: number;
        maxRetries?: number;
        priority?: string;
      };

      // Spawn agent
      const agent = await registry.spawn(agentType, {
        name: typeof name === 'string' ? name : `${type}-agent`,
        taskTimeout: typedOptions.timeout,
        retry: typedOptions.maxRetries
          ? { maxRetries: typedOptions.maxRetries, backoffMs: 1000 }
          : undefined,
      });

      // Create task
      const agentTask = {
        id: createTaskId(),
        description: task,
        priority: mapPriority(typedOptions.priority),
        input: {
          data: { task },
          context: {},
        },
        createdAt: new Date(),
      };

      // Execute task
      const result = await agent.execute(agentTask);

      return {
        success: result.success,
        data: {
          agentId: agent.config.id,
          agentType: type,
          agentName: agent.config.name,
          taskId: agentTask.id,
          taskResult: result.data,
          metrics: result.metrics,
          artifacts: result.artifacts,
        },
        error: result.error?.message,
        metadata: {
          executionTime: Date.now() - startTime,
          status: agent.getStatus(),
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
