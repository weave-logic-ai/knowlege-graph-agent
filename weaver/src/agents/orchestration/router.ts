/**
 * Agent Specialization Router - Intelligent capability-based routing
 *
 * Routes tasks to specialized agents based on:
 * - Agent capability registry
 * - File patterns and extensions
 * - Keyword matching
 * - Performance tracking
 * - Fallback assignment
 *
 * @example
 * ```typescript
 * const router = new Router();
 * const decision = await router.routeTask(task, context);
 * const performance = router.getAgentPerformance('frontend-specialist');
 * ```
 */

import { logger } from '../../utils/logger.js';
import type {
  AgentCapabilitySpec,
  RoutingDecision,
  RuleContext,
  RouterConfig,
} from './types.js';
import type { AgentType, Task } from '../coordinator.js';

/**
 * Router for intelligent agent selection
 */
export class Router {
  private capabilities: Map<AgentType, AgentCapabilitySpec>;
  private performance: Map<AgentType, PerformanceMetrics>;
  private config: Required<RouterConfig>;

  constructor(config: RouterConfig = {}) {
    this.config = {
      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
      enableFallback: config.enableFallback ?? true,
      defaultFallbackAgent: config.defaultFallbackAgent ?? 'coder',
    };

    this.capabilities = this.buildCapabilityRegistry();
    this.performance = new Map();

    // Initialize performance tracking
    if (this.config.enablePerformanceTracking) {
      for (const agentType of this.capabilities.keys()) {
        this.performance.set(agentType, {
          totalTasks: 0,
          successfulTasks: 0,
          failedTasks: 0,
          totalDuration: 0,
          averageDuration: 0,
          successRate: 1.0,
        });
      }
    }
  }

  // ========================================================================
  // Capability Registry
  // ========================================================================

  /**
   * Build comprehensive capability registry
   */
  private buildCapabilityRegistry(): Map<AgentType, AgentCapabilitySpec> {
    return new Map<AgentType, AgentCapabilitySpec>([
      [
        'coder',
        {
          agentType: 'coder',
          capabilities: ['code-generation', 'refactoring', 'optimization', 'tdd'],
          filePatterns: ['*.ts', '*.js', '*.tsx', '*.jsx', '*.py', '*.java', '*.go'],
          keywords: ['implement', 'code', 'function', 'class', 'refactor', 'optimize'],
          performanceScore: 1.0,
          concurrentTaskLimit: 3,
        },
      ],
      [
        'researcher',
        {
          agentType: 'researcher',
          capabilities: ['arxiv-search', 'research', 'analysis', 'trends'],
          filePatterns: ['*.md', '*.pdf', 'research/*'],
          keywords: ['research', 'paper', 'arxiv', 'study', 'analysis', 'trends'],
          performanceScore: 1.0,
          concurrentTaskLimit: 2,
        },
      ],
      [
        'architect',
        {
          agentType: 'architect',
          capabilities: ['system-design', 'architecture', 'patterns', 'api-design'],
          filePatterns: ['**/architecture/**', '**/design/**', 'architecture.md'],
          keywords: ['design', 'architecture', 'system', 'pattern', 'api', 'structure'],
          performanceScore: 1.0,
          concurrentTaskLimit: 2,
        },
      ],
      [
        'tester',
        {
          agentType: 'tester',
          capabilities: ['testing', 'test-generation', 'coverage', 'qa'],
          filePatterns: ['*.test.ts', '*.spec.ts', '**/tests/**', '**/test/**'],
          keywords: ['test', 'coverage', 'qa', 'validate', 'verify', 'edge case'],
          performanceScore: 1.0,
          concurrentTaskLimit: 4,
        },
      ],
      [
        'analyst',
        {
          agentType: 'analyst',
          capabilities: ['code-review', 'quality', 'security', 'metrics'],
          filePatterns: ['**/*'],
          keywords: ['review', 'analyze', 'quality', 'security', 'metrics', 'audit'],
          performanceScore: 1.0,
          concurrentTaskLimit: 3,
        },
      ],
      [
        'planner',
        {
          agentType: 'planner',
          capabilities: ['planning', 'goal-decomposition', 'estimation'],
          filePatterns: ['**/plans/**', '**/planning/**', 'plan.md'],
          keywords: ['plan', 'goal', 'decompose', 'estimate', 'timeline', 'milestone'],
          performanceScore: 1.0,
          concurrentTaskLimit: 2,
        },
      ],
      [
        'error-detector',
        {
          agentType: 'error-detector',
          capabilities: ['error-detection', 'debugging', 'anomaly-detection'],
          filePatterns: ['**/logs/**', '*.log'],
          keywords: ['error', 'bug', 'debug', 'failure', 'crash', 'exception'],
          performanceScore: 1.0,
          concurrentTaskLimit: 3,
        },
      ],
    ]);
  }

  /**
   * Register custom agent capability
   */
  registerCapability(spec: AgentCapabilitySpec): void {
    this.capabilities.set(spec.agentType, spec);
    if (this.config.enablePerformanceTracking) {
      this.performance.set(spec.agentType, {
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        totalDuration: 0,
        averageDuration: 0,
        successRate: 1.0,
      });
    }
  }

  /**
   * Get capability specification for agent
   */
  getCapability(agentType: AgentType): AgentCapabilitySpec | undefined {
    return this.capabilities.get(agentType);
  }

  // ========================================================================
  // Task Routing
  // ========================================================================

  /**
   * Route task to most appropriate agent
   */
  async routeTask(task: Task, context: RuleContext): Promise<RoutingDecision> {
    const startTime = Date.now();
    const scores = new Map<AgentType, number>();

    // Calculate scores for each agent
    for (const [agentType, capability] of this.capabilities.entries()) {
      let score = 0;

      // File pattern matching
      score += this.scoreFilePatterns(task, capability);

      // Keyword matching
      score += this.scoreKeywords(task, capability);

      // Capability matching
      score += this.scoreCapabilities(task, capability);

      // Performance weighting
      if (this.config.enablePerformanceTracking) {
        const perf = this.performance.get(agentType);
        if (perf) {
          score *= perf.successRate * capability.performanceScore;
        }
      }

      // Workload consideration
      const workload = context.agentWorkload.get(agentType) ?? 0;
      if (workload >= capability.concurrentTaskLimit) {
        score *= 0.5; // Penalize overloaded agents
      }

      scores.set(agentType, score);
    }

    // Find best agent
    let selectedAgent: AgentType = this.config.defaultFallbackAgent;
    let bestScore = 0;
    const alternatives: Array<{ agent: AgentType; score: number }> = [];

    for (const [agent, score] of scores.entries()) {
      if (score > bestScore) {
        if (bestScore > 0) {
          alternatives.push({ agent: selectedAgent, score: bestScore });
        }
        selectedAgent = agent;
        bestScore = score;
      } else if (score > 0) {
        alternatives.push({ agent, score });
      }
    }

    // Sort alternatives by score
    alternatives.sort((a, b) => b.score - a.score);

    const routingTime = Date.now() - startTime;

    // Build reasoning
    const reasoning = this.buildReasoning(task, selectedAgent, bestScore);

    logger.debug('Task routed to agent', {
      taskId: task.id,
      agent: selectedAgent,
      score: bestScore,
      routingTime,
    });

    return {
      taskId: task.id,
      selectedAgent,
      confidence: this.normalizeScore(bestScore),
      reasoning,
      alternativeAgents: alternatives.slice(0, 3),
      routingTime,
    };
  }

  /**
   * Score based on file patterns
   */
  private scoreFilePatterns(task: Task, capability: AgentCapabilitySpec): number {
    // Check if task metadata contains file information
    const files = (task as unknown as { files?: string[] }).files ?? [];
    let score = 0;

    for (const file of files) {
      for (const pattern of capability.filePatterns) {
        if (this.matchPattern(file, pattern)) {
          score += 10;
        }
      }
    }

    return score;
  }

  /**
   * Score based on keyword matching
   */
  private scoreKeywords(task: Task, capability: AgentCapabilitySpec): number {
    const description = task.description.toLowerCase();
    let score = 0;

    for (const keyword of capability.keywords) {
      if (description.includes(keyword.toLowerCase())) {
        score += 5;
      }
    }

    return score;
  }

  /**
   * Score based on required capabilities
   */
  private scoreCapabilities(task: Task, capability: AgentCapabilitySpec): number {
    if (!task.requiredCapabilities || task.requiredCapabilities.length === 0) {
      return 0;
    }

    let score = 0;
    for (const required of task.requiredCapabilities) {
      if (capability.capabilities.includes(required)) {
        score += 15;
      }
    }

    return score;
  }

  /**
   * Simple pattern matching (supports * wildcard)
   */
  private matchPattern(file: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(file);
  }

  /**
   * Normalize score to 0-1 confidence
   */
  private normalizeScore(score: number): number {
    // Assuming max realistic score is around 100
    return Math.min(1.0, score / 100);
  }

  /**
   * Build human-readable reasoning
   */
  private buildReasoning(task: Task, agent: AgentType, score: number): string {
    const capability = this.capabilities.get(agent);
    if (!capability) {
      return 'Default agent assignment';
    }

    const reasons: string[] = [];

    // Check file patterns
    const files = (task as unknown as { files?: string[] }).files ?? [];
    for (const file of files) {
      for (const pattern of capability.filePatterns) {
        if (this.matchPattern(file, pattern)) {
          reasons.push(`File matches pattern: ${pattern}`);
          break;
        }
      }
    }

    // Check keywords
    const matchedKeywords = capability.keywords.filter(kw =>
      task.description.toLowerCase().includes(kw.toLowerCase())
    );
    if (matchedKeywords.length > 0) {
      reasons.push(`Keywords matched: ${matchedKeywords.join(', ')}`);
    }

    // Check capabilities
    if (task.requiredCapabilities) {
      const matchedCaps = task.requiredCapabilities.filter(cap =>
        capability.capabilities.includes(cap)
      );
      if (matchedCaps.length > 0) {
        reasons.push(`Required capabilities: ${matchedCaps.join(', ')}`);
      }
    }

    return reasons.length > 0
      ? reasons.join('; ')
      : `Best match with score ${score.toFixed(1)}`;
  }

  // ========================================================================
  // Performance Tracking
  // ========================================================================

  /**
   * Record task execution result
   */
  recordTaskResult(
    agentType: AgentType,
    success: boolean,
    duration: number
  ): void {
    if (!this.config.enablePerformanceTracking) {
      return;
    }

    const perf = this.performance.get(agentType);
    if (!perf) {
      return;
    }

    perf.totalTasks++;
    if (success) {
      perf.successfulTasks++;
    } else {
      perf.failedTasks++;
    }

    perf.totalDuration += duration;
    perf.averageDuration = perf.totalDuration / perf.totalTasks;
    perf.successRate = perf.successfulTasks / perf.totalTasks;

    // Update performance score (exponential moving average)
    const capability = this.capabilities.get(agentType);
    if (capability) {
      const alpha = 0.1; // Smoothing factor
      capability.performanceScore =
        alpha * perf.successRate + (1 - alpha) * capability.performanceScore;
    }
  }

  /**
   * Get performance metrics for agent
   */
  getAgentPerformance(agentType: AgentType): PerformanceMetrics | undefined {
    return this.performance.get(agentType);
  }

  /**
   * Get all performance metrics
   */
  getAllPerformance(): Map<AgentType, PerformanceMetrics> {
    return new Map(this.performance);
  }

  /**
   * Reset performance metrics
   */
  resetPerformance(): void {
    for (const agentType of this.capabilities.keys()) {
      this.performance.set(agentType, {
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        totalDuration: 0,
        averageDuration: 0,
        successRate: 1.0,
      });

      const capability = this.capabilities.get(agentType);
      if (capability) {
        capability.performanceScore = 1.0;
      }
    }
  }
}

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  totalDuration: number;
  averageDuration: number;
  successRate: number;
}

/**
 * Create a router instance
 */
export function createRouter(config?: RouterConfig): Router {
  return new Router(config);
}
