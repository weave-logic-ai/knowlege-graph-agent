/**
 * Agent Coordinator - Intelligent routing and multi-agent collaboration
 *
 * Routes tasks to appropriate agents based on:
 * - Agent capabilities matrix
 * - Task complexity and requirements
 * - Multi-agent collaboration needs
 * - Conflict resolution
 *
 * @example
 * ```typescript
 * const coordinator = new AgentCoordinator({ claudeClient });
 * const agent = coordinator.selectAgent('research arXiv papers');
 * const result = await coordinator.executeTask(task);
 * const workflow = await coordinator.orchestrateWorkflow(tasks);
 * ```
 */

import { ClaudeClient } from './claude-client.js';
import { ResearcherAgent } from './researcher-agent.js';
import { CoderAgent } from './coder-agent.js';
import { ArchitectAgent } from './architect-agent.js';
import { TesterAgent } from './tester-agent.js';
import { AnalystAgent } from './analyst-agent.js';
import { PlanningExpert } from './planning-expert.js';
import { ErrorDetector } from './error-detector.js';

/**
 * Agent capability definition
 */
export interface AgentCapability {
  agentType: AgentType;
  capabilities: string[];
  strengths: string[];
  limitations: string[];
  typicalTasks: string[];
}

/**
 * Agent type enumeration
 */
export type AgentType =
  | 'researcher'
  | 'coder'
  | 'architect'
  | 'tester'
  | 'analyst'
  | 'planner'
  | 'error-detector';

/**
 * Task definition
 */
export interface Task {
  id: string;
  description: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies?: string[];
  requiredCapabilities?: string[];
  estimatedComplexity?: number;
}

/**
 * Task execution result
 */
export interface TaskResult {
  taskId: string;
  agentType: AgentType;
  success: boolean;
  result?: unknown;
  error?: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

/**
 * Multi-agent workflow
 */
export interface Workflow {
  id: string;
  tasks: Task[];
  dependencies: Map<string, string[]>;
  executionStrategy: 'sequential' | 'parallel' | 'adaptive';
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  workflowId: string;
  tasks: TaskResult[];
  totalDuration: number;
  successRate: number;
  conflicts?: Array<{
    taskIds: string[];
    issue: string;
    resolution: string;
  }>;
}

/**
 * Agent selection criteria
 */
export interface SelectionCriteria {
  taskDescription: string;
  taskType?: string;
  requiredCapabilities?: string[];
  complexity?: number;
  context?: Record<string, unknown>;
}

/**
 * Coordinator configuration
 */
export interface CoordinatorConfig {
  claudeClient: ClaudeClient;
}

/**
 * Agent Coordinator - Routes tasks and orchestrates multi-agent workflows
 */
export class AgentCoordinator {
  private claudeClient: ClaudeClient;
  private agents: Map<AgentType, ResearcherAgent | CoderAgent | ArchitectAgent | TesterAgent | AnalystAgent | PlanningExpert | ErrorDetector>;
  private capabilityMatrix: Map<AgentType, AgentCapability>;

  constructor(config: CoordinatorConfig) {
    this.claudeClient = config.claudeClient;

    // Initialize all agents
    this.agents = new Map<AgentType, ResearcherAgent | CoderAgent | ArchitectAgent | TesterAgent | AnalystAgent | PlanningExpert | ErrorDetector>([
      ['researcher', new ResearcherAgent({ claudeClient: this.claudeClient })],
      ['coder', new CoderAgent({ claudeClient: this.claudeClient })],
      ['architect', new ArchitectAgent({ claudeClient: this.claudeClient })],
      ['tester', new TesterAgent({ claudeClient: this.claudeClient })],
      ['analyst', new AnalystAgent({ claudeClient: this.claudeClient })],
      ['planner', new PlanningExpert()],
      ['error-detector', new ErrorDetector()],
    ]);

    // Define capability matrix
    this.capabilityMatrix = new Map([
      [
        'researcher',
        {
          agentType: 'researcher',
          capabilities: ['arxiv-search', 'paper-analysis', 'trend-identification', 'research-synthesis', 'web-research'],
          strengths: ['Academic research', 'Pattern identification', 'Cross-paper analysis', 'RDR framework'],
          limitations: ['Not for code generation', 'Limited to research tasks'],
          typicalTasks: [
            'Search academic papers',
            'Analyze research trends',
            'Synthesize research findings',
            'Find related work',
          ],
        },
      ],
      [
        'coder',
        {
          agentType: 'coder',
          capabilities: ['code-generation', 'refactoring', 'optimization', 'test-generation', 'tdd'],
          strengths: ['TDD approach', 'Clean code', 'Performance optimization', 'Multiple languages'],
          limitations: ['Needs clear specifications', 'Limited architectural decisions'],
          typicalTasks: [
            'Generate code from spec',
            'Refactor existing code',
            'Optimize performance',
            'Add tests to code',
          ],
        },
      ],
      [
        'architect',
        {
          agentType: 'architect',
          capabilities: ['system-design', 'pattern-selection', 'api-design', 'architecture-review', 'tech-stack'],
          strengths: ['High-level design', 'Pattern expertise', 'Scalability', 'Best practices'],
          limitations: ['Not for detailed implementation', 'Needs requirements'],
          typicalTasks: [
            'Design system architecture',
            'Select design patterns',
            'Design REST/GraphQL API',
            'Review architecture',
          ],
        },
      ],
      [
        'tester',
        {
          agentType: 'tester',
          capabilities: ['test-generation', 'coverage-analysis', 'edge-case-identification', 'test-data-generation', 'property-based-testing'],
          strengths: ['Comprehensive testing', 'Edge case discovery', 'Multiple test strategies', 'Coverage analysis'],
          limitations: ['Needs code to test', 'Limited to testing scope'],
          typicalTasks: [
            'Generate unit tests',
            'Generate integration tests',
            'Analyze test coverage',
            'Find edge cases',
            'Generate test data',
          ],
        },
      ],
      [
        'analyst',
        {
          agentType: 'analyst',
          capabilities: ['code-review', 'quality-metrics', 'security-scanning', 'best-practices', 'technical-debt'],
          strengths: ['Quality assessment', 'Security expertise', 'Metrics calculation', 'Actionable feedback'],
          limitations: ['Analysis only, no fixes', 'Needs code to analyze'],
          typicalTasks: [
            'Review code quality',
            'Calculate metrics',
            'Scan for security issues',
            'Suggest improvements',
          ],
        },
      ],
      [
        'planner',
        {
          agentType: 'planner',
          capabilities: ['goal-decomposition', 'planning', 'cot-reasoning', 'experience-learning'],
          strengths: ['Strategic planning', 'Goal breakdown', 'Experience-based', 'CoT reasoning'],
          limitations: ['Planning only, no execution', 'Needs clear goals'],
          typicalTasks: [
            'Create project plan',
            'Decompose goals',
            'Estimate timelines',
            'Identify risks',
          ],
        },
      ],
      [
        'error-detector',
        {
          agentType: 'error-detector',
          capabilities: ['error-pattern-detection', 'anomaly-identification', 'failure-analysis'],
          strengths: ['Pattern recognition', 'Error categorization', 'Frequency analysis'],
          limitations: ['Detection only, no fixes', 'Needs historical data'],
          typicalTasks: [
            'Detect error patterns',
            'Analyze failures',
            'Identify anomalies',
            'Recommend fixes',
          ],
        },
      ],
    ]);
  }

  // ========================================================================
  // Agent Selection
  // ========================================================================

  /**
   * Select the most appropriate agent for a task
   */
  selectAgent(criteria: SelectionCriteria): AgentType {
    const scores: Map<AgentType, number> = new Map();

    for (const [agentType, capability] of this.capabilityMatrix.entries()) {
      let score = 0;

      // Check if task type matches typical tasks
      const taskLower = criteria.taskDescription.toLowerCase();
      for (const typicalTask of capability.typicalTasks) {
        if (taskLower.includes(typicalTask.toLowerCase())) {
          score += 10;
        }
      }

      // Check required capabilities
      if (criteria.requiredCapabilities) {
        for (const requiredCap of criteria.requiredCapabilities) {
          if (capability.capabilities.includes(requiredCap)) {
            score += 20;
          }
        }
      }

      // Check task type
      if (criteria.taskType) {
        const taskTypeLower = criteria.taskType.toLowerCase();
        for (const cap of capability.capabilities) {
          if (taskTypeLower.includes(cap)) {
            score += 15;
          }
        }
      }

      // Keyword matching
      const keywords = [
        { words: ['research', 'paper', 'arxiv', 'study', 'trend'], agent: 'researcher', weight: 10 },
        { words: ['code', 'implement', 'refactor', 'optimize', 'function'], agent: 'coder', weight: 10 },
        { words: ['design', 'architecture', 'system', 'pattern', 'api'], agent: 'architect', weight: 10 },
        { words: ['test', 'coverage', 'edge case', 'validate'], agent: 'tester', weight: 10 },
        { words: ['review', 'analyze', 'quality', 'security', 'metrics'], agent: 'analyst', weight: 10 },
        { words: ['plan', 'goal', 'decompose', 'estimate'], agent: 'planner', weight: 10 },
        { words: ['error', 'failure', 'debug', 'detect'], agent: 'error-detector', weight: 10 },
      ];

      for (const keyword of keywords) {
        if (keyword.agent === agentType) {
          for (const word of keyword.words) {
            if (taskLower.includes(word)) {
              score += keyword.weight;
            }
          }
        }
      }

      scores.set(agentType, score);
    }

    // Return agent with highest score
    let bestAgent: AgentType = 'coder'; // Default
    let bestScore = 0;

    for (const [agent, score] of scores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * Get agent instance by type
   */
  getAgent<T = unknown>(agentType: AgentType): T {
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent type ${agentType} not found`);
    }
    return agent as T;
  }

  /**
   * Get capability matrix
   */
  getCapabilityMatrix(): Map<AgentType, AgentCapability> {
    return new Map(this.capabilityMatrix);
  }

  // ========================================================================
  // Task Execution
  // ========================================================================

  /**
   * Execute a single task with appropriate agent
   */
  async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // Select agent
      const agentType = this.selectAgent({
        taskDescription: task.description,
        taskType: task.type,
        requiredCapabilities: task.requiredCapabilities,
        complexity: task.estimatedComplexity,
      });

      // Execute task based on agent type
      let result: unknown;

      // Route to appropriate agent method
      // This is a simplified example - real implementation would have
      // a more sophisticated routing mechanism
      switch (agentType) {
        case 'researcher': {
          const agent = this.getAgent<ResearcherAgent>('researcher');
          // Example: if task is arxiv search
          if (task.description.toLowerCase().includes('search')) {
            result = await agent.searchArxiv(task.description);
          }
          break;
        }
        case 'coder': {
          const agent = this.getAgent<CoderAgent>('coder');
          // Route based on task type
          break;
        }
        case 'architect': {
          const agent = this.getAgent<ArchitectAgent>('architect');
          break;
        }
        case 'tester': {
          const agent = this.getAgent<TesterAgent>('tester');
          break;
        }
        case 'analyst': {
          const agent = this.getAgent<AnalystAgent>('analyst');
          break;
        }
        case 'planner': {
          const agent = this.getAgent<PlanningExpert>('planner');
          result = await agent.createPlan(task.description);
          break;
        }
        case 'error-detector': {
          const agent = this.getAgent<ErrorDetector>('error-detector');
          result = await agent.detectErrorPatterns();
          break;
        }
      }

      const duration = Date.now() - startTime;

      return {
        taskId: task.id,
        agentType,
        success: true,
        result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        taskId: task.id,
        agentType: 'coder', // Default for error case
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  }

  // ========================================================================
  // Multi-Agent Orchestration
  // ========================================================================

  /**
   * Orchestrate a workflow with multiple agents
   */
  async orchestrateWorkflow(workflow: Workflow): Promise<WorkflowResult> {
    const startTime = Date.now();
    const results: TaskResult[] = [];
    const conflicts: WorkflowResult['conflicts'] = [];

    // Build execution plan based on dependencies
    const executionPlan = this.buildExecutionPlan(workflow);

    // Execute based on strategy
    switch (workflow.executionStrategy) {
      case 'sequential':
        for (const task of executionPlan) {
          const result = await this.executeTask(task);
          results.push(result);
        }
        break;

      case 'parallel': {
        const parallelResults = await Promise.all(
          executionPlan.map(task => this.executeTask(task))
        );
        results.push(...parallelResults);
        break;
      }

      case 'adaptive': {
        // Execute in waves based on dependencies
        const waves = this.groupByDependencies(executionPlan, workflow.dependencies);
        for (const wave of waves) {
          const waveResults = await Promise.all(
            wave.map(task => this.executeTask(task))
          );
          results.push(...waveResults);
        }
        break;
      }
    }

    // Detect conflicts
    const detectedConflicts = this.detectConflicts(results);
    conflicts.push(...detectedConflicts);

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const successRate = results.length > 0 ? successCount / results.length : 0;

    return {
      workflowId: workflow.id,
      tasks: results,
      totalDuration,
      successRate,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  }

  // ========================================================================
  // Conflict Resolution
  // ========================================================================

  /**
   * Detect conflicts between agent outputs
   */
  private detectConflicts(results: TaskResult[]): Array<{
    taskIds: string[];
    issue: string;
    resolution: string;
  }> {
    const conflicts: Array<{
      taskIds: string[];
      issue: string;
      resolution: string;
    }> = [];

    // Check for conflicting recommendations
    // This is a simplified implementation
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const r1 = results[i];
        const r2 = results[j];

        if (!r1 || !r2) continue;

        // Example: if both analyst and architect suggest different patterns
        if (r1.agentType === 'analyst' && r2.agentType === 'architect') {
          // Check for conflicts in their results
          // This would need domain-specific logic
        }
      }
    }

    return conflicts;
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  /**
   * Build execution plan respecting dependencies
   */
  private buildExecutionPlan(workflow: Workflow): Task[] {
    // Topological sort based on dependencies
    const sorted: Task[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string): void => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected: ${taskId}`);
      }

      visiting.add(taskId);

      const deps = workflow.dependencies.get(taskId) || [];
      for (const dep of deps) {
        visit(dep);
      }

      visiting.delete(taskId);
      visited.add(taskId);

      const task = workflow.tasks.find(t => t.id === taskId);
      if (task) {
        sorted.push(task);
      }
    };

    for (const task of workflow.tasks) {
      visit(task.id);
    }

    return sorted;
  }

  /**
   * Group tasks into waves for adaptive execution
   */
  private groupByDependencies(tasks: Task[], dependencies: Map<string, string[]>): Task[][] {
    const waves: Task[][] = [];
    const processed = new Set<string>();

    while (processed.size < tasks.length) {
      const wave: Task[] = [];

      for (const task of tasks) {
        if (processed.has(task.id)) continue;

        const deps = dependencies.get(task.id) || [];
        const allDepsProcessed = deps.every(dep => processed.has(dep));

        if (allDepsProcessed) {
          wave.push(task);
        }
      }

      if (wave.length === 0) {
        throw new Error('Deadlock detected in dependencies');
      }

      for (const task of wave) {
        processed.add(task.id);
      }

      waves.push(wave);
    }

    return waves;
  }

  /**
   * Get agent statistics
   */
  getStatistics(): Map<AgentType, {
    totalTasks: number;
    successRate: number;
    avgDuration: number;
  }> {
    // This would be populated from actual execution history
    // Simplified implementation
    return new Map();
  }
}

/**
 * Create a new coordinator instance
 */
export function createCoordinator(config: CoordinatorConfig): AgentCoordinator {
  return new AgentCoordinator(config);
}
