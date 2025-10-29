/**
 * Dynamic Priority System - Intelligent priority management
 *
 * Adjusts task priorities dynamically based on:
 * - Dependency relationships
 * - Deadline urgency
 * - Critical path analysis
 * - Resource contention
 * - SLA requirements
 *
 * @example
 * ```typescript
 * const prioritySystem = new PrioritySystem();
 * const adjustments = await prioritySystem.adjustPriorities(tasks, context);
 * const criticalTasks = prioritySystem.getCriticalTasks(tasks);
 * ```
 */

import { logger } from '../../utils/logger.js';
import type {
  PriorityAdjustment,
  DependencyNode,
  PrioritySystemConfig,
} from './types.js';
import type { Task } from '../coordinator.js';

/**
 * Priority mapping
 */
const PRIORITY_VALUES: Record<Task['priority'], number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

const VALUE_TO_PRIORITY: Array<[number, Task['priority']]> = [
  [90, 'critical'],
  [65, 'high'],
  [40, 'medium'],
  [0, 'low'],
];

/**
 * Dynamic Priority System
 */
export class PrioritySystem {
  private config: Required<PrioritySystemConfig>;
  private adjustmentHistory: PriorityAdjustment[] = [];

  constructor(config: PrioritySystemConfig = {}) {
    this.config = {
      enableDeadlineAdjustment: config.enableDeadlineAdjustment ?? true,
      enableDependencyAdjustment: config.enableDependencyAdjustment ?? true,
      enableSLAPrioritization: config.enableSLAPrioritization ?? true,
      urgencyThreshold: config.urgencyThreshold ?? 24,
    };
  }

  // ========================================================================
  // Priority Adjustment
  // ========================================================================

  /**
   * Adjust priorities for all tasks
   */
  async adjustPriorities(
    tasks: Task[],
    dependencyGraph: Map<string, DependencyNode>,
    projectDeadline?: Date
  ): Promise<PriorityAdjustment[]> {
    const adjustments: PriorityAdjustment[] = [];

    for (const task of tasks) {
      const adjustment = await this.adjustTaskPriority(
        task,
        dependencyGraph,
        projectDeadline
      );

      if (adjustment) {
        adjustments.push(adjustment);
      }
    }

    this.adjustmentHistory.push(...adjustments);

    logger.info('Priority adjustments completed', {
      totalAdjustments: adjustments.length,
      criticalUpgrades: adjustments.filter(a => a.newPriority === 'critical').length,
    });

    return adjustments;
  }

  /**
   * Adjust priority for single task
   */
  private async adjustTaskPriority(
    task: Task,
    dependencyGraph: Map<string, DependencyNode>,
    projectDeadline?: Date
  ): Promise<PriorityAdjustment | null> {
    const currentValue = PRIORITY_VALUES[task.priority];
    let newValue = currentValue;
    const reasons: string[] = [];

    // Deadline-based adjustment
    if (this.config.enableDeadlineAdjustment && projectDeadline) {
      const deadlineAdjustment = this.calculateDeadlineAdjustment(
        task,
        projectDeadline
      );
      if (deadlineAdjustment > 0) {
        newValue += deadlineAdjustment;
        reasons.push(`Deadline approaching (+${deadlineAdjustment})`);
      }
    }

    // Dependency-based adjustment (critical path)
    if (this.config.enableDependencyAdjustment) {
      const node = dependencyGraph.get(task.id);
      if (node?.criticalPath) {
        const criticalPathBoost = 25;
        newValue += criticalPathBoost;
        reasons.push(`On critical path (+${criticalPathBoost})`);
      }

      // Boost if blocking many tasks
      if (node && node.dependents.length >= 3) {
        const blockingBoost = Math.min(20, node.dependents.length * 5);
        newValue += blockingBoost;
        reasons.push(`Blocking ${node.dependents.length} tasks (+${blockingBoost})`);
      }
    }

    // SLA-based adjustment
    if (this.config.enableSLAPrioritization) {
      const slaAdjustment = this.calculateSLAAdjustment(task);
      if (slaAdjustment > 0) {
        newValue += slaAdjustment;
        reasons.push(`SLA requirement (+${slaAdjustment})`);
      }
    }

    // Complexity-based adjustment
    if (task.estimatedComplexity && task.estimatedComplexity >= 8) {
      const complexityBoost = 10;
      newValue += complexityBoost;
      reasons.push(`High complexity (+${complexityBoost})`);
    }

    // Cap at 100
    newValue = Math.min(100, newValue);

    // Convert back to priority level
    const newPriority = this.valueToPriority(newValue);

    // Only create adjustment if priority changed
    if (newPriority !== task.priority) {
      return {
        taskId: task.id,
        originalPriority: task.priority,
        newPriority,
        reason: reasons.join('; '),
        timestamp: new Date(),
      };
    }

    return null;
  }

  /**
   * Calculate deadline-based adjustment
   */
  private calculateDeadlineAdjustment(task: Task, projectDeadline: Date): number {
    const now = new Date();
    const hoursUntilDeadline = (projectDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeadline <= 0) {
      return 50; // Overdue - maximum boost
    } else if (hoursUntilDeadline <= this.config.urgencyThreshold) {
      // Linear scaling: 0-30 points based on urgency
      return Math.floor(30 * (1 - hoursUntilDeadline / this.config.urgencyThreshold));
    }

    return 0;
  }

  /**
   * Calculate SLA-based adjustment
   */
  private calculateSLAAdjustment(task: Task): number {
    // Check for SLA metadata
    const sla = (task as unknown as { metadata?: { sla?: string } }).metadata?.sla;

    if (!sla) {
      return 0;
    }

    const slaLevels: Record<string, number> = {
      platinum: 40,
      gold: 30,
      silver: 15,
      bronze: 5,
    };

    return slaLevels[sla.toLowerCase()] ?? 0;
  }

  /**
   * Convert numeric value to priority level
   */
  private valueToPriority(value: number): Task['priority'] {
    for (const [threshold, priority] of VALUE_TO_PRIORITY) {
      if (value >= threshold) {
        return priority;
      }
    }
    return 'low';
  }

  // ========================================================================
  // Critical Path Analysis
  // ========================================================================

  /**
   * Get tasks on critical path
   */
  getCriticalTasks(
    tasks: Task[],
    dependencyGraph: Map<string, DependencyNode>
  ): Task[] {
    const criticalTaskIds = Array.from(dependencyGraph.values())
      .filter(node => node.criticalPath)
      .map(node => node.taskId);

    return tasks.filter(task => criticalTaskIds.includes(task.id));
  }

  /**
   * Get blocking tasks (tasks that block many others)
   */
  getBlockingTasks(
    tasks: Task[],
    dependencyGraph: Map<string, DependencyNode>,
    minDependents = 2
  ): Task[] {
    const blockingTaskIds = Array.from(dependencyGraph.values())
      .filter(node => node.dependents.length >= minDependents)
      .map(node => node.taskId);

    return tasks.filter(task => blockingTaskIds.includes(task.id));
  }

  // ========================================================================
  // Resource Contention
  // ========================================================================

  /**
   * Handle resource contention by adjusting priorities
   */
  handleResourceContention(
    tasks: Task[],
    availableResources: number
  ): PriorityAdjustment[] {
    const adjustments: PriorityAdjustment[] = [];

    // Sort tasks by current priority
    const sortedTasks = [...tasks].sort((a, b) => {
      return PRIORITY_VALUES[b.priority] - PRIORITY_VALUES[a.priority];
    });

    // If we have more tasks than resources, boost top priorities
    if (sortedTasks.length > availableResources) {
      const topTasks = sortedTasks.slice(0, availableResources);

      for (const task of topTasks) {
        if (task.priority === 'medium' || task.priority === 'low') {
          const newPriority = task.priority === 'medium' ? 'high' : 'medium';

          adjustments.push({
            taskId: task.id,
            originalPriority: task.priority,
            newPriority,
            reason: 'Resource contention - prioritized for execution',
            timestamp: new Date(),
          });
        }
      }
    }

    return adjustments;
  }

  // ========================================================================
  // Scheduling
  // ========================================================================

  /**
   * Get recommended task execution order
   */
  getExecutionOrder(
    tasks: Task[],
    dependencyGraph: Map<string, DependencyNode>
  ): Task[] {
    // Sort by:
    // 1. Critical path (highest)
    // 2. Dependency level (lower = earlier)
    // 3. Priority value
    // 4. Number of dependents (more = earlier)

    return [...tasks].sort((a, b) => {
      const nodeA = dependencyGraph.get(a.id);
      const nodeB = dependencyGraph.get(b.id);

      // Critical path first
      if (nodeA?.criticalPath && !nodeB?.criticalPath) return -1;
      if (!nodeA?.criticalPath && nodeB?.criticalPath) return 1;

      // Then by dependency level (lower first)
      if (nodeA && nodeB && nodeA.level !== nodeB.level) {
        return nodeA.level - nodeB.level;
      }

      // Then by priority
      const priorityDiff = PRIORITY_VALUES[b.priority] - PRIORITY_VALUES[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Finally by number of dependents
      const dependentsA = nodeA?.dependents.length ?? 0;
      const dependentsB = nodeB?.dependents.length ?? 0;
      return dependentsB - dependentsA;
    });
  }

  // ========================================================================
  // Metrics
  // ========================================================================

  /**
   * Get adjustment history
   */
  getAdjustmentHistory(): PriorityAdjustment[] {
    return [...this.adjustmentHistory];
  }

  /**
   * Clear adjustment history
   */
  clearHistory(): void {
    this.adjustmentHistory = [];
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalAdjustments: number;
    upgrades: number;
    downgrades: number;
    criticalUpgrades: number;
  } {
    const stats = {
      totalAdjustments: this.adjustmentHistory.length,
      upgrades: 0,
      downgrades: 0,
      criticalUpgrades: 0,
    };

    for (const adj of this.adjustmentHistory) {
      const oldValue = PRIORITY_VALUES[adj.originalPriority];
      const newValue = PRIORITY_VALUES[adj.newPriority];

      if (newValue > oldValue) {
        stats.upgrades++;
        if (adj.newPriority === 'critical') {
          stats.criticalUpgrades++;
        }
      } else if (newValue < oldValue) {
        stats.downgrades++;
      }
    }

    return stats;
  }
}

/**
 * Create a priority system instance
 */
export function createPrioritySystem(config?: PrioritySystemConfig): PrioritySystem {
  return new PrioritySystem(config);
}
