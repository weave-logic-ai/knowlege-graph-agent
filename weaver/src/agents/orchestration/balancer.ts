/**
 * Workload Balancer - Intelligent agent workload distribution
 *
 * Distributes tasks across agents using:
 * - Round-robin distribution
 * - Least-loaded agent selection
 * - Capability-based assignment
 * - Adaptive load balancing
 * - Queue management
 * - Resource reservation
 *
 * @example
 * ```typescript
 * const balancer = new WorkloadBalancer();
 * const assignment = balancer.assignTask(task, availableAgents);
 * const distribution = balancer.getWorkloadDistribution();
 * ```
 */

import { logger } from '../../utils/logger.js';
import type {
  WorkloadDistribution,
  BalancerConfig,
} from './types.js';
import type { AgentType, Task } from '../coordinator.js';

/**
 * Task queue entry
 */
interface QueuedTask {
  task: Task;
  assignedAgent?: AgentType;
  queuedAt: Date;
  priority: number;
}

/**
 * Agent workload state
 */
interface AgentWorkload {
  agentType: AgentType;
  activeTasks: Set<string>;
  queuedTasks: QueuedTask[];
  totalCompleted: number;
  averageCompletionTime: number;
  lastAssignedTime?: Date;
}

/**
 * Workload Balancer
 */
export class WorkloadBalancer {
  private workloads: Map<AgentType, AgentWorkload>;
  private config: Required<BalancerConfig>;
  private roundRobinIndex = 0;
  private taskQueue: QueuedTask[] = [];
  private reservations = new Map<string, AgentType>();

  constructor(config: BalancerConfig = {}) {
    this.config = {
      strategy: config.strategy ?? 'adaptive',
      maxConcurrentTasksPerAgent: config.maxConcurrentTasksPerAgent ?? 3,
      enableQueueing: config.enableQueueing ?? true,
      enableReservation: config.enableReservation ?? true,
    };

    this.workloads = new Map();
  }

  // ========================================================================
  // Agent Registration
  // ========================================================================

  /**
   * Register an agent for load balancing
   */
  registerAgent(agentType: AgentType): void {
    if (!this.workloads.has(agentType)) {
      this.workloads.set(agentType, {
        agentType,
        activeTasks: new Set(),
        queuedTasks: [],
        totalCompleted: 0,
        averageCompletionTime: 0,
        lastAssignedTime: undefined,
      });
    }
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentType: AgentType): void {
    this.workloads.delete(agentType);
  }

  /**
   * Get all registered agents
   */
  getRegisteredAgents(): AgentType[] {
    return Array.from(this.workloads.keys());
  }

  // ========================================================================
  // Task Assignment
  // ========================================================================

  /**
   * Assign task to best available agent
   */
  assignTask(
    task: Task,
    availableAgents: AgentType[],
    preferredAgent?: AgentType
  ): AgentType | null {
    // Ensure all agents are registered
    for (const agent of availableAgents) {
      this.registerAgent(agent);
    }

    // Try preferred agent first
    if (preferredAgent && availableAgents.includes(preferredAgent)) {
      const workload = this.workloads.get(preferredAgent);
      if (workload && this.canAcceptTask(workload)) {
        this.addTaskToAgent(preferredAgent, task);
        return preferredAgent;
      }
    }

    // Select agent based on strategy
    let selectedAgent: AgentType | null = null;

    switch (this.config.strategy) {
      case 'round-robin':
        selectedAgent = this.roundRobinSelection(availableAgents);
        break;
      case 'least-loaded':
        selectedAgent = this.leastLoadedSelection(availableAgents);
        break;
      case 'capability-based':
        selectedAgent = this.capabilityBasedSelection(task, availableAgents);
        break;
      case 'adaptive':
        selectedAgent = this.adaptiveSelection(task, availableAgents);
        break;
    }

    if (selectedAgent) {
      this.addTaskToAgent(selectedAgent, task);
      return selectedAgent;
    }

    // Queue task if no agent available
    if (this.config.enableQueueing) {
      this.queueTask(task);
      logger.info('Task queued - all agents at capacity', { taskId: task.id });
      return null;
    }

    logger.warn('Unable to assign task - no available agents', { taskId: task.id });
    return null;
  }

  /**
   * Round-robin selection
   */
  private roundRobinSelection(availableAgents: AgentType[]): AgentType | null {
    const eligibleAgents = availableAgents.filter(agent => {
      const workload = this.workloads.get(agent);
      return workload && this.canAcceptTask(workload);
    });

    if (eligibleAgents.length === 0) {
      return null;
    }

    const selected = eligibleAgents[this.roundRobinIndex % eligibleAgents.length];
    this.roundRobinIndex++;

    return selected ?? null;
  }

  /**
   * Least-loaded selection
   */
  private leastLoadedSelection(availableAgents: AgentType[]): AgentType | null {
    let leastLoaded: AgentType | null = null;
    let minLoad = Infinity;

    for (const agent of availableAgents) {
      const workload = this.workloads.get(agent);
      if (!workload || !this.canAcceptTask(workload)) {
        continue;
      }

      const load = workload.activeTasks.size + workload.queuedTasks.length;
      if (load < minLoad) {
        minLoad = load;
        leastLoaded = agent;
      }
    }

    return leastLoaded;
  }

  /**
   * Capability-based selection (considering task requirements)
   */
  private capabilityBasedSelection(
    task: Task,
    availableAgents: AgentType[]
  ): AgentType | null {
    // This is a simplified version - in practice, you'd integrate with Router
    // For now, just use least-loaded among available agents
    return this.leastLoadedSelection(availableAgents);
  }

  /**
   * Adaptive selection (combines multiple factors)
   */
  private adaptiveSelection(task: Task, availableAgents: AgentType[]): AgentType | null {
    let bestAgent: AgentType | null = null;
    let bestScore = -Infinity;

    for (const agent of availableAgents) {
      const workload = this.workloads.get(agent);
      if (!workload || !this.canAcceptTask(workload)) {
        continue;
      }

      // Calculate composite score
      const loadScore = this.calculateLoadScore(workload);
      const performanceScore = this.calculatePerformanceScore(workload);
      const recencyScore = this.calculateRecencyScore(workload);

      // Weighted combination
      const score = loadScore * 0.5 + performanceScore * 0.3 + recencyScore * 0.2;

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * Calculate load score (lower load = higher score)
   */
  private calculateLoadScore(workload: AgentWorkload): number {
    const load = workload.activeTasks.size;
    const maxLoad = this.config.maxConcurrentTasksPerAgent;
    return ((maxLoad - load) / maxLoad) * 100;
  }

  /**
   * Calculate performance score based on completion time
   */
  private calculatePerformanceScore(workload: AgentWorkload): number {
    if (workload.totalCompleted === 0) {
      return 50; // Neutral score for new agents
    }

    // Lower completion time = higher score
    // Assuming average completion time ranges from 0-60 seconds
    const avgTime = workload.averageCompletionTime;
    return Math.max(0, 100 - (avgTime / 600)); // 10 minutes max
  }

  /**
   * Calculate recency score (prefer agents that haven't been used recently)
   */
  private calculateRecencyScore(workload: AgentWorkload): number {
    if (!workload.lastAssignedTime) {
      return 100; // Never used - highest score
    }

    const timeSinceAssignment = Date.now() - workload.lastAssignedTime.getTime();
    const minutes = timeSinceAssignment / (1000 * 60);

    // Give higher score to agents not used in last 5 minutes
    return Math.min(100, (minutes / 5) * 100);
  }

  // ========================================================================
  // Task Management
  // ========================================================================

  /**
   * Add task to agent workload
   */
  private addTaskToAgent(agentType: AgentType, task: Task): void {
    const workload = this.workloads.get(agentType);
    if (!workload) {
      return;
    }

    workload.activeTasks.add(task.id);
    workload.lastAssignedTime = new Date();

    // Reserve resources if enabled
    if (this.config.enableReservation) {
      this.reservations.set(task.id, agentType);
    }

    logger.debug('Task assigned to agent', {
      taskId: task.id,
      agent: agentType,
      activeCount: workload.activeTasks.size,
    });
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string, agentType: AgentType, duration: number): void {
    const workload = this.workloads.get(agentType);
    if (!workload) {
      return;
    }

    workload.activeTasks.delete(taskId);
    workload.totalCompleted++;

    // Update average completion time
    const alpha = 0.2; // Exponential moving average factor
    workload.averageCompletionTime =
      alpha * duration + (1 - alpha) * workload.averageCompletionTime;

    // Release reservation
    this.reservations.delete(taskId);

    // Try to assign queued tasks
    this.processQueue();

    logger.debug('Task completed', {
      taskId,
      agent: agentType,
      duration,
      avgCompletionTime: workload.averageCompletionTime,
    });
  }

  /**
   * Remove task from agent (cancelled or failed)
   */
  removeTask(taskId: string, agentType: AgentType): void {
    const workload = this.workloads.get(agentType);
    if (!workload) {
      return;
    }

    workload.activeTasks.delete(taskId);
    this.reservations.delete(taskId);

    // Try to assign queued tasks
    this.processQueue();
  }

  /**
   * Check if agent can accept more tasks
   */
  private canAcceptTask(workload: AgentWorkload): boolean {
    return workload.activeTasks.size < this.config.maxConcurrentTasksPerAgent;
  }

  // ========================================================================
  // Queue Management
  // ========================================================================

  /**
   * Add task to queue
   */
  private queueTask(task: Task): void {
    const queuedTask: QueuedTask = {
      task,
      queuedAt: new Date(),
      priority: this.getPriorityValue(task.priority),
    };

    this.taskQueue.push(queuedTask);
    this.sortQueue();
  }

  /**
   * Process queued tasks
   */
  private processQueue(): void {
    if (!this.config.enableQueueing || this.taskQueue.length === 0) {
      return;
    }

    const availableAgents = this.getAvailableAgents();
    if (availableAgents.length === 0) {
      return;
    }

    let processed = 0;
    for (let i = this.taskQueue.length - 1; i >= 0; i--) {
      const queued = this.taskQueue[i];
      if (!queued) continue;

      const agent = this.assignTask(queued.task, availableAgents);
      if (agent) {
        this.taskQueue.splice(i, 1);
        processed++;
        logger.info('Queued task assigned', {
          taskId: queued.task.id,
          agent,
          queueTime: Date.now() - queued.queuedAt.getTime(),
        });
      }
    }

    if (processed > 0) {
      logger.info('Processed queued tasks', { count: processed });
    }
  }

  /**
   * Get agents with available capacity
   */
  private getAvailableAgents(): AgentType[] {
    const available: AgentType[] = [];

    for (const [agentType, workload] of this.workloads.entries()) {
      if (this.canAcceptTask(workload)) {
        available.push(agentType);
      }
    }

    return available;
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    this.taskQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get priority numeric value
   */
  private getPriorityValue(priority: Task['priority']): number {
    const values: Record<Task['priority'], number> = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
    };
    return values[priority];
  }

  // ========================================================================
  // Monitoring
  // ========================================================================

  /**
   * Get workload distribution
   */
  getWorkloadDistribution(): WorkloadDistribution[] {
    const distribution: WorkloadDistribution[] = [];

    for (const [agentType, workload] of this.workloads.entries()) {
      const total = workload.activeTasks.size + workload.queuedTasks.length;
      const utilization =
        (workload.activeTasks.size / this.config.maxConcurrentTasksPerAgent) * 100;

      distribution.push({
        agentType,
        activeTasks: workload.activeTasks.size,
        queuedTasks: workload.queuedTasks.length,
        utilizationPercent: utilization,
        estimatedCompletionTime: workload.averageCompletionTime * total,
      });
    }

    return distribution;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queuedTasks: number;
    oldestQueueTime: number | null;
    averageQueueTime: number;
  } {
    const now = Date.now();
    let totalQueueTime = 0;
    let oldestTime: number | null = null;

    for (const queued of this.taskQueue) {
      const queueTime = now - queued.queuedAt.getTime();
      totalQueueTime += queueTime;

      if (oldestTime === null || queueTime > oldestTime) {
        oldestTime = queueTime;
      }
    }

    return {
      queuedTasks: this.taskQueue.length,
      oldestQueueTime: oldestTime,
      averageQueueTime:
        this.taskQueue.length > 0 ? totalQueueTime / this.taskQueue.length : 0,
    };
  }

  /**
   * Get agent workload details
   */
  getAgentWorkload(agentType: AgentType): AgentWorkload | undefined {
    return this.workloads.get(agentType);
  }

  /**
   * Clear all queues and reset state
   */
  reset(): void {
    this.taskQueue = [];
    this.reservations.clear();
    this.roundRobinIndex = 0;

    for (const workload of this.workloads.values()) {
      workload.activeTasks.clear();
      workload.queuedTasks = [];
    }
  }
}

/**
 * Create a workload balancer instance
 */
export function createWorkloadBalancer(config?: BalancerConfig): WorkloadBalancer {
  return new WorkloadBalancer(config);
}
