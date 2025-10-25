/**
 * Health Check Tool
 *
 * Provides health status for Weaver components including:
 * - Shadow cache connectivity
 * - Workflow engine status
 * - Overall system health
 */

import type { ShadowCache } from '../../shadow-cache/index.js';
import type { WorkflowEngine } from '../../workflow-engine/index.js';
import { logger } from '../../utils/logger.js';

export interface ComponentHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details?: Record<string, unknown>;
}

export interface HealthCheckResult {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  components: ComponentHealth[];
}

export class HealthChecker {
  private shadowCache?: ShadowCache;
  private workflowEngine?: WorkflowEngine;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Set shadow cache reference
   */
  setShadowCache(cache: ShadowCache): void {
    this.shadowCache = cache;
  }

  /**
   * Set workflow engine reference
   */
  setWorkflowEngine(engine: WorkflowEngine): void {
    this.workflowEngine = engine;
  }

  /**
   * Check shadow cache health
   */
  private checkShadowCacheHealth(): ComponentHealth {
    if (!this.shadowCache) {
      return {
        component: 'shadow-cache',
        status: 'unhealthy',
        message: 'Shadow cache not initialized',
      };
    }

    try {
      // Try to get cache stats as a connectivity check
      const stats = this.shadowCache.getStats();

      return {
        component: 'shadow-cache',
        status: 'healthy',
        message: 'Shadow cache operational',
        details: {
          totalFiles: stats.totalFiles,
          totalTags: stats.totalTags,
          lastSync: stats.lastFullSync,
        },
      };
    } catch (error) {
      logger.error('Shadow cache health check failed', error instanceof Error ? error : new Error(String(error)));
      return {
        component: 'shadow-cache',
        status: 'unhealthy',
        message: 'Shadow cache check failed',
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Check workflow engine health
   */
  private checkWorkflowEngineHealth(): ComponentHealth {
    if (!this.workflowEngine) {
      return {
        component: 'workflow-engine',
        status: 'unhealthy',
        message: 'Workflow engine not initialized',
      };
    }

    try {
      const stats = this.workflowEngine.getStats();
      const registry = this.workflowEngine.getRegistry();
      const workflows = registry.getAllWorkflows();

      return {
        component: 'workflow-engine',
        status: 'healthy',
        message: 'Workflow engine operational',
        details: {
          totalWorkflows: workflows.length,
          enabledWorkflows: workflows.filter(w => w.enabled).length,
          totalExecutions: stats.totalExecutions,
          successfulExecutions: stats.successfulExecutions,
          failedExecutions: stats.failedExecutions,
        },
      };
    } catch (error) {
      logger.error('Workflow engine health check failed', error instanceof Error ? error : new Error(String(error)));
      return {
        component: 'workflow-engine',
        status: 'unhealthy',
        message: 'Workflow engine check failed',
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Perform full health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    logger.debug('Performing health check');

    const components: ComponentHealth[] = [
      this.checkShadowCacheHealth(),
      this.checkWorkflowEngineHealth(),
    ];

    // Determine overall health
    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;
    const degradedCount = components.filter(c => c.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    const result: HealthCheckResult = {
      overall,
      timestamp: new Date().toISOString(),
      uptime,
      components,
    };

    logger.debug('Health check completed', { overall, uptime });

    return result;
  }
}

/**
 * Create MCP tool definition for health check
 */
export function createHealthCheckTool(healthChecker: HealthChecker) {
  return {
    name: 'health_check',
    description: 'Check the health status of Weaver components including shadow cache and workflow engine',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
    handler: async () => {
      return await healthChecker.performHealthCheck();
    },
  };
}
