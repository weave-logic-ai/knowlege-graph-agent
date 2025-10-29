/**
 * Task Analyzer - Intelligent task analysis and splitting
 *
 * Analyzes tasks for complexity, dependencies, and parallel execution opportunities.
 *
 * Features:
 * - Automatic complexity estimation
 * - Intelligent task splitting
 * - Dependency graph analysis
 * - Critical path detection
 * - Subtask generation
 *
 * @example
 * ```typescript
 * const analyzer = new TaskAnalyzer();
 * const complexity = analyzer.estimateComplexity(task);
 * const subtasks = analyzer.splitTask(task, 4);
 * const graph = analyzer.analyzeDependencies(tasks);
 * ```
 */

import { logger } from '../../utils/logger.js';
import type {
  ComplexityEstimate,
  Subtask,
  DependencyNode,
  TaskAnalyzerConfig,
} from './types.js';
import type { Task } from '../coordinator.js';

/**
 * Task Analyzer for complexity estimation and splitting
 */
export class TaskAnalyzer {
  private config: Required<TaskAnalyzerConfig>;

  constructor(config: TaskAnalyzerConfig = {}) {
    this.config = {
      splitThreshold: config.splitThreshold ?? 7,
      maxSubtasks: config.maxSubtasks ?? 4,
      enableDependencyAnalysis: config.enableDependencyAnalysis ?? true,
      enableCriticalPath: config.enableCriticalPath ?? true,
    };
  }

  // ========================================================================
  // Complexity Estimation
  // ========================================================================

  /**
   * Estimate task complexity
   */
  estimateComplexity(task: Task): ComplexityEstimate {
    const factors = {
      descriptionLength: this.analyzeDescriptionComplexity(task.description),
      keywordComplexity: this.analyzeKeywordComplexity(task.description),
      requiredCapabilities: (task.requiredCapabilities?.length ?? 0) * 2,
      estimatedLines: this.estimateCodeLines(task.description),
    };

    // Calculate weighted score
    const score =
      factors.descriptionLength * 0.2 +
      factors.keywordComplexity * 0.3 +
      factors.requiredCapabilities * 0.3 +
      (factors.estimatedLines ?? 0) * 0.2;

    const canSplit = score >= this.config.splitThreshold;
    const recommendedSubtasks = canSplit
      ? Math.min(Math.ceil(score / 5), this.config.maxSubtasks)
      : undefined;

    return {
      taskId: task.id,
      score,
      factors,
      canSplit,
      recommendedSubtasks,
    };
  }

  /**
   * Analyze description complexity based on length and structure
   */
  private analyzeDescriptionComplexity(description: string): number {
    const words = description.split(/\s+/).length;
    const sentences = description.split(/[.!?]+/).length;
    const complexity = Math.min(10, (words / 10 + sentences / 2));
    return complexity;
  }

  /**
   * Analyze complexity based on technical keywords
   */
  private analyzeKeywordComplexity(description: string): number {
    const complexKeywords = [
      'architecture', 'design', 'implement', 'integrate', 'optimize',
      'refactor', 'algorithm', 'database', 'api', 'authentication',
      'security', 'performance', 'scalability', 'distributed',
      'concurrent', 'async', 'real-time', 'machine learning',
    ];

    const lowerDesc = description.toLowerCase();
    let score = 0;

    for (const keyword of complexKeywords) {
      if (lowerDesc.includes(keyword)) {
        score += 1;
      }
    }

    return Math.min(10, score);
  }

  /**
   * Estimate number of code lines based on task description
   */
  private estimateCodeLines(description: string): number {
    const lowerDesc = description.toLowerCase();
    let estimate = 50; // Base estimate

    // Adjust based on scope indicators
    if (lowerDesc.includes('simple') || lowerDesc.includes('basic')) {
      estimate = 20;
    } else if (lowerDesc.includes('comprehensive') || lowerDesc.includes('complete')) {
      estimate = 200;
    } else if (lowerDesc.includes('system') || lowerDesc.includes('framework')) {
      estimate = 500;
    }

    // Adjust based on features mentioned
    const featureCount = (lowerDesc.match(/,/g) || []).length;
    estimate += featureCount * 30;

    return Math.min(estimate / 10, 10); // Normalize to 0-10 scale
  }

  // ========================================================================
  // Task Splitting
  // ========================================================================

  /**
   * Split a complex task into parallel subtasks
   */
  splitTask(task: Task, maxSubtasks?: number): Subtask[] {
    const complexity = this.estimateComplexity(task);

    if (!complexity.canSplit) {
      logger.debug('Task not complex enough to split', {
        taskId: task.id,
        score: complexity.score,
      });
      return [];
    }

    const numSubtasks = maxSubtasks ?? complexity.recommendedSubtasks ?? 2;
    const subtasks: Subtask[] = [];

    // Analyze description for natural split points
    const splitPoints = this.findSplitPoints(task.description);

    if (splitPoints.length >= numSubtasks) {
      // Split based on natural points
      for (let i = 0; i < numSubtasks; i++) {
        subtasks.push(this.createSubtask(task, i, numSubtasks, splitPoints[i]));
      }
    } else {
      // Generic split by phases
      const phases = ['design', 'implementation', 'testing', 'documentation'];
      for (let i = 0; i < Math.min(numSubtasks, phases.length); i++) {
        const phase = phases[i];
        subtasks.push(
          this.createSubtask(
            task,
            i,
            numSubtasks,
            `${phase.charAt(0).toUpperCase() + phase.slice(1)} phase: ${task.description}`
          )
        );
      }
    }

    logger.info('Task split into subtasks', {
      taskId: task.id,
      subtaskCount: subtasks.length,
      complexity: complexity.score,
    });

    return subtasks;
  }

  /**
   * Find natural split points in task description
   */
  private findSplitPoints(description: string): string[] {
    const points: string[] = [];

    // Split by numbered lists
    const numberedMatch = description.match(/\d+\.\s+([^.\n]+)/g);
    if (numberedMatch) {
      points.push(...numberedMatch);
    }

    // Split by bullet points
    const bulletMatch = description.match(/[-*•]\s+([^.\n]+)/g);
    if (bulletMatch) {
      points.push(...bulletMatch);
    }

    // Split by "and" for compound tasks
    if (points.length === 0 && description.includes(' and ')) {
      const parts = description.split(' and ');
      points.push(...parts);
    }

    return points.map(p => p.trim());
  }

  /**
   * Create a subtask from parent task
   */
  private createSubtask(
    parent: Task,
    index: number,
    total: number,
    description: string
  ): Subtask {
    return {
      id: `${parent.id}-sub-${index + 1}`,
      description,
      type: parent.type,
      priority: parent.priority,
      requiredCapabilities: parent.requiredCapabilities,
      estimatedComplexity: parent.estimatedComplexity
        ? Math.ceil(parent.estimatedComplexity / total)
        : undefined,
      parentTaskId: parent.id,
      splitIndex: index,
      totalSplits: total,
    };
  }

  // ========================================================================
  // Dependency Analysis
  // ========================================================================

  /**
   * Analyze dependencies and build dependency graph
   */
  analyzeDependencies(tasks: Task[]): Map<string, DependencyNode> {
    if (!this.config.enableDependencyAnalysis) {
      return new Map();
    }

    const graph = new Map<string, DependencyNode>();

    // Build initial nodes
    for (const task of tasks) {
      graph.set(task.id, {
        taskId: task.id,
        dependencies: task.dependencies ?? [],
        dependents: [],
        level: 0,
        criticalPath: false,
      });
    }

    // Build dependent relationships
    for (const [taskId, node] of graph.entries()) {
      for (const depId of node.dependencies) {
        const depNode = graph.get(depId);
        if (depNode) {
          depNode.dependents.push(taskId);
        }
      }
    }

    // Calculate levels (topological ordering)
    this.calculateLevels(graph);

    // Detect critical path
    if (this.config.enableCriticalPath) {
      this.detectCriticalPath(graph, tasks);
    }

    return graph;
  }

  /**
   * Calculate dependency levels using BFS
   */
  private calculateLevels(graph: Map<string, DependencyNode>): void {
    const queue: string[] = [];
    const visited = new Set<string>();

    // Start with nodes that have no dependencies
    for (const [taskId, node] of graph.entries()) {
      if (node.dependencies.length === 0) {
        queue.push(taskId);
        visited.add(taskId);
      }
    }

    while (queue.length > 0) {
      const taskId = queue.shift()!;
      const node = graph.get(taskId)!;

      for (const dependentId of node.dependents) {
        const dependentNode = graph.get(dependentId);
        if (!dependentNode) continue;

        // Update level
        dependentNode.level = Math.max(dependentNode.level, node.level + 1);

        // Add to queue if all dependencies visited
        const allDepsVisited = dependentNode.dependencies.every(dep => visited.has(dep));
        if (allDepsVisited && !visited.has(dependentId)) {
          queue.push(dependentId);
          visited.add(dependentId);
        }
      }
    }
  }

  /**
   * Detect critical path in dependency graph
   */
  private detectCriticalPath(graph: Map<string, DependencyNode>, tasks: Task[]): void {
    // Find longest path from start to end
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const longestPaths = new Map<string, number>();

    // Calculate longest path to each node
    const calculateLongestPath = (taskId: string): number => {
      if (longestPaths.has(taskId)) {
        return longestPaths.get(taskId)!;
      }

      const node = graph.get(taskId);
      if (!node || node.dependencies.length === 0) {
        longestPaths.set(taskId, 1);
        return 1;
      }

      const maxDepPath = Math.max(
        ...node.dependencies.map(dep => calculateLongestPath(dep))
      );

      const pathLength = maxDepPath + 1;
      longestPaths.set(taskId, pathLength);
      return pathLength;
    };

    // Calculate for all nodes
    for (const taskId of graph.keys()) {
      calculateLongestPath(taskId);
    }

    // Mark critical path
    const maxPath = Math.max(...longestPaths.values());
    for (const [taskId, pathLength] of longestPaths.entries()) {
      const node = graph.get(taskId);
      if (node && pathLength === maxPath) {
        node.criticalPath = true;
      }
    }

    logger.debug('Critical path detected', {
      criticalPathLength: maxPath,
      criticalTasks: Array.from(graph.values())
        .filter(n => n.criticalPath)
        .map(n => n.taskId),
    });
  }

  /**
   * Get tasks that can run in parallel
   */
  getParallelizableTasks(tasks: Task[]): Task[][] {
    const graph = this.analyzeDependencies(tasks);
    const levels = new Map<number, Task[]>();

    // Group tasks by dependency level
    for (const [taskId, node] of graph.entries()) {
      const task = tasks.find(t => t.id === taskId);
      if (!task) continue;

      if (!levels.has(node.level)) {
        levels.set(node.level, []);
      }
      levels.get(node.level)!.push(task);
    }

    // Return tasks grouped by level (can run in parallel)
    return Array.from(levels.values());
  }

  /**
   * Get critical path tasks
   */
  getCriticalPathTasks(tasks: Task[]): Task[] {
    const graph = this.analyzeDependencies(tasks);
    const criticalTaskIds = Array.from(graph.values())
      .filter(n => n.criticalPath)
      .map(n => n.taskId);

    return tasks.filter(t => criticalTaskIds.includes(t.id));
  }
}

/**
 * Create a task analyzer instance
 */
export function createTaskAnalyzer(config?: TaskAnalyzerConfig): TaskAnalyzer {
  return new TaskAnalyzer(config);
}
