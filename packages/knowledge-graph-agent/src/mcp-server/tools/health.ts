/**
 * Health Check Tool
 *
 * MCP tool for checking the health status of the knowledge graph server.
 * Provides detailed diagnostics about all server components.
 *
 * @module mcp-server/tools/health
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../types/index.js';
import type { KnowledgeGraphDatabase } from '../../core/database.js';
import type { ShadowCache } from '../../core/cache.js';
import { getRegistry } from '../../agents/index.js';

/**
 * Health status type
 */
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Component health status
 */
interface ComponentHealth {
  status: HealthStatus;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Health check tool definition
 */
export const healthCheckTool: Tool = {
  name: 'kg_health_check',
  description: 'Check the health status of the knowledge graph server',
  inputSchema: {
    type: 'object' as const,
    properties: {
      detailed: {
        type: 'boolean',
        description: 'Include detailed diagnostics',
        default: false,
      },
      components: {
        type: 'array',
        description: 'Specific components to check (database, cache, agents)',
        items: {
          type: 'string',
          enum: ['database', 'cache', 'agents', 'memory'],
        },
      },
    },
  },
};

/**
 * Check database health
 */
function checkDatabaseHealth(database?: KnowledgeGraphDatabase): ComponentHealth {
  if (!database) {
    return {
      status: 'unhealthy',
      message: 'Database not configured',
    };
  }

  try {
    // Try to get stats as a health check
    const stats = database.getStats();
    return {
      status: 'healthy',
      message: 'Database operational',
      details: {
        totalNodes: stats.totalNodes,
        totalEdges: stats.totalEdges,
        orphanNodes: stats.orphanNodes,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database check failed',
    };
  }
}

/**
 * Check cache health
 */
function checkCacheHealth(cache?: ShadowCache): ComponentHealth {
  if (!cache) {
    return {
      status: 'degraded',
      message: 'Cache not configured (non-critical)',
    };
  }

  try {
    const stats = cache.getStats();
    const staleRatio = stats.totalEntries > 0
      ? stats.staleEntries / stats.totalEntries
      : 0;

    if (staleRatio > 0.5) {
      return {
        status: 'degraded',
        message: 'High proportion of stale cache entries',
        details: {
          totalEntries: stats.totalEntries,
          staleEntries: stats.staleEntries,
          hitRate: stats.hitRate,
        },
      };
    }

    return {
      status: 'healthy',
      message: 'Cache operational',
      details: {
        totalEntries: stats.totalEntries,
        hitRate: Math.round(stats.hitRate * 100) / 100,
        sizeBytes: stats.sizeBytes,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Cache check failed',
    };
  }
}

/**
 * Check agent registry health
 */
function checkAgentHealth(): ComponentHealth {
  try {
    const registry = getRegistry();
    const stats = registry.getStats();

    // Check for any failed agents
    const failedCount = stats.instancesByStatus['failed'] || 0;
    const totalInstances = stats.totalInstances;

    if (failedCount > 0 && failedCount === totalInstances) {
      return {
        status: 'unhealthy',
        message: 'All agents in failed state',
        details: stats,
      };
    }

    if (failedCount > 0) {
      return {
        status: 'degraded',
        message: `${failedCount} agent(s) in failed state`,
        details: stats,
      };
    }

    return {
      status: 'healthy',
      message: 'Agent system operational',
      details: {
        registeredTypes: stats.registeredTypes,
        totalInstances: stats.totalInstances,
        byStatus: stats.instancesByStatus,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Agent check failed',
    };
  }
}

/**
 * Check memory health
 */
function checkMemoryHealth(): ComponentHealth {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  const heapUsageRatio = memUsage.heapUsed / memUsage.heapTotal;

  if (heapUsageRatio > 0.9) {
    return {
      status: 'unhealthy',
      message: 'Critical memory pressure',
      details: {
        heapUsedMB: Math.round(heapUsedMB * 100) / 100,
        heapTotalMB: Math.round(heapTotalMB * 100) / 100,
        usagePercent: Math.round(heapUsageRatio * 100),
      },
    };
  }

  if (heapUsageRatio > 0.75) {
    return {
      status: 'degraded',
      message: 'High memory usage',
      details: {
        heapUsedMB: Math.round(heapUsedMB * 100) / 100,
        heapTotalMB: Math.round(heapTotalMB * 100) / 100,
        usagePercent: Math.round(heapUsageRatio * 100),
      },
    };
  }

  return {
    status: 'healthy',
    message: 'Memory usage normal',
    details: {
      heapUsedMB: Math.round(heapUsedMB * 100) / 100,
      heapTotalMB: Math.round(heapTotalMB * 100) / 100,
      usagePercent: Math.round(heapUsageRatio * 100),
    },
  };
}

/**
 * Determine overall health status from component statuses
 */
function determineOverallStatus(components: Record<string, ComponentHealth>): HealthStatus {
  const statuses = Object.values(components).map(c => c.status);

  if (statuses.some(s => s === 'unhealthy')) {
    return 'unhealthy';
  }

  if (statuses.some(s => s === 'degraded')) {
    return 'degraded';
  }

  return 'healthy';
}

/**
 * Create handler for health check tool
 */
export function createHealthCheckHandler(
  database?: KnowledgeGraphDatabase,
  cache?: ShadowCache
): ToolHandler {
  return async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const { detailed = false, components: requestedComponents } = params || {};

    try {
      // Determine which components to check
      const checkComponents = requestedComponents as string[] | undefined
        || ['database', 'cache', 'agents', 'memory'];

      const componentResults: Record<string, ComponentHealth> = {};

      // Run health checks for requested components
      if (checkComponents.includes('database')) {
        componentResults.database = checkDatabaseHealth(database);
      }

      if (checkComponents.includes('cache')) {
        componentResults.cache = checkCacheHealth(cache);
      }

      if (checkComponents.includes('agents')) {
        componentResults.agents = checkAgentHealth();
      }

      if (checkComponents.includes('memory')) {
        componentResults.memory = checkMemoryHealth();
      }

      // Determine overall status
      const overallStatus = determineOverallStatus(componentResults);

      // Build health response
      const health: Record<string, unknown> = {
        status: overallStatus,
        components: Object.fromEntries(
          Object.entries(componentResults).map(([name, result]) => [
            name,
            detailed ? result : result.status,
          ])
        ),
        timestamp: new Date().toISOString(),
      };

      // Add detailed diagnostics if requested
      if (detailed) {
        const memUsage = process.memoryUsage();
        Object.assign(health, {
          memory: {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            arrayBuffers: memUsage.arrayBuffers,
          },
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
        });
      }

      return {
        success: true,
        data: health,
        metadata: {
          executionTime: Date.now() - startTime,
          componentsChecked: checkComponents,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: { status: 'unhealthy' },
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  };
}
