/**
 * Agent Orchestrator - Coordinate claude-flow agents for parallel generation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  VaultContext,
  DocumentGenerationRequest,
  GeneratedDocument,
  AgentTask,
  AgentOrchestrationResult,
  DocumentMetadata,
} from './types.js';

const execAsync = promisify(exec);

export class AgentOrchestrator {
  constructor(private context: VaultContext) {}

  /**
   * Generate documents using claude-flow agents
   */
  async generateDocuments(
    requests: DocumentGenerationRequest[]
  ): Promise<GeneratedDocument[]> {
    const tasks = this.createTasks(requests);

    const result = await this.orchestrateTasks(tasks);

    return this.processResults(result, requests);
  }

  /**
   * Create agent tasks from generation requests
   */
  private createTasks(requests: DocumentGenerationRequest[]): AgentTask[] {
    return requests.map((request, index) => ({
      id: `gen-${index}`,
      type: 'generate',
      agent: this.selectAgent(request.type),
      description: `Generate ${request.type}: ${request.title}`,
      input: request,
      priority: request.priority,
      status: 'pending',
    }));
  }

  /**
   * Select appropriate agent for document type
   */
  private selectAgent(
    type: string
  ): 'researcher' | 'coder' | 'architect' | 'analyst' | 'tester' {
    switch (type) {
      case 'concept':
        return 'researcher';
      case 'feature':
        return 'coder';
      case 'architecture':
        return 'architect';
      case 'integration':
        return 'analyst';
      case 'technical':
        return 'coder';
      case 'guide':
        return 'researcher';
      default:
        return 'researcher';
    }
  }

  /**
   * Orchestrate tasks using claude-flow
   */
  private async orchestrateTasks(
    tasks: AgentTask[]
  ): Promise<AgentOrchestrationResult> {
    const startTime = Date.now();
    const results = new Map<string, any>();
    const errors: Array<{ taskId: string; error: string }> = [];

    // Check if claude-flow is available
    const hasClaudeFlow = await this.checkClaudeFlowAvailable();

    if (!hasClaudeFlow) {
      console.warn('⚠️  claude-flow not available, using template generation');
      return {
        tasksCompleted: 0,
        tasksFailed: tasks.length,
        totalTime: 0,
        results,
        errors: tasks.map(t => ({
          taskId: t.id,
          error: 'claude-flow not available',
        })),
      };
    }

    // Execute tasks in parallel using claude-flow swarm
    try {
      // Initialize swarm
      await this.initializeSwarm(tasks.length);

      // Execute tasks in parallel
      const promises = tasks.map(task => this.executeTask(task));
      const taskResults = await Promise.allSettled(promises);

      // Process results
      taskResults.forEach((result, index) => {
        const task = tasks[index];

        if (result.status === 'fulfilled') {
          results.set(task.id, result.value);
          task.status = 'completed';
          task.result = result.value;
        } else {
          task.status = 'failed';
          task.error = result.reason?.message || 'Unknown error';
          errors.push({
            taskId: task.id,
            error: task.error,
          });
        }
      });
    } catch (error) {
      console.error('Swarm orchestration failed:', error);
    }

    const endTime = Date.now();

    return {
      tasksCompleted: results.size,
      tasksFailed: errors.length,
      totalTime: endTime - startTime,
      results,
      errors,
    };
  }

  /**
   * Check if claude-flow is available
   */
  private async checkClaudeFlowAvailable(): Promise<boolean> {
    try {
      await execAsync('npx claude-flow@alpha --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize claude-flow swarm
   */
  private async initializeSwarm(maxAgents: number): Promise<void> {
    try {
      // Initialize swarm with mesh topology for parallel execution
      const command = `npx claude-flow@alpha mcp call ruv-swarm swarm_init '{"topology": "mesh", "maxAgents": ${maxAgents}, "strategy": "balanced"}'`;

      await execAsync(command);
    } catch (error) {
      console.warn('Swarm initialization failed, continuing without swarm');
    }
  }

  /**
   * Execute individual task
   */
  private async executeTask(task: AgentTask): Promise<any> {
    const request = task.input as DocumentGenerationRequest;

    // Build prompt for agent
    const prompt = this.buildPrompt(request);

    // Execute using claude-flow
    try {
      const command = this.buildClaudeFlowCommand(task.agent, prompt);
      const { stdout } = await execAsync(command);

      // Parse result
      return this.parseAgentOutput(stdout, request);
    } catch (error) {
      throw new Error(
        `Task ${task.id} failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Build prompt for agent
   */
  private buildPrompt(request: DocumentGenerationRequest): string {
    const sections: string[] = [];

    sections.push(`Generate comprehensive documentation for: ${request.title}`);
    sections.push(`\nType: ${request.type}`);
    sections.push(`Description: ${request.description}`);

    if (request.context.primitives) {
      sections.push(`\n## Context from primitives.md:\n${request.context.primitives.slice(0, 500)}...`);
    }

    if (request.context.features) {
      sections.push(`\n## Context from features.md:\n${request.context.features.slice(0, 500)}...`);
    }

    if (request.context.techSpecs) {
      sections.push(`\n## Context from tech-specs.md:\n${request.context.techSpecs.slice(0, 500)}...`);
    }

    sections.push(`\n## Requirements:`);
    sections.push(`1. Create comprehensive documentation`);
    sections.push(`2. Include clear sections and examples`);
    sections.push(`3. Add relevant wikilinks to related documents`);
    sections.push(`4. Follow markdown best practices`);
    sections.push(`5. Keep technical and accurate`);

    sections.push(`\n## Output Format:`);
    sections.push(`Provide the complete markdown content including:`);
    sections.push(`- Clear heading structure`);
    sections.push(`- Overview section`);
    sections.push(`- Technical details`);
    sections.push(`- Examples where appropriate`);
    sections.push(`- References section with wikilinks`);

    return sections.join('\n');
  }

  /**
   * Build claude-flow command
   */
  private buildClaudeFlowCommand(agent: string, prompt: string): string {
    // Escape prompt for shell
    const escapedPrompt = prompt.replace(/'/g, "'\\''");

    // Use Task tool via ruv-swarm MCP
    return `npx claude-flow@alpha mcp call ruv-swarm task_orchestrate '{"task": "${escapedPrompt}", "strategy": "adaptive", "priority": "high"}'`;
  }

  /**
   * Parse agent output
   */
  private parseAgentOutput(
    output: string,
    request: DocumentGenerationRequest
  ): string {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(output);
      return parsed.content || parsed.result || output;
    } catch {
      // Return raw output if not JSON
      return output.trim();
    }
  }

  /**
   * Process orchestration results into generated documents
   */
  private processResults(
    result: AgentOrchestrationResult,
    requests: DocumentGenerationRequest[]
  ): GeneratedDocument[] {
    const documents: GeneratedDocument[] = [];

    requests.forEach((request, index) => {
      const taskId = `gen-${index}`;
      const content = result.results.get(taskId);

      if (content) {
        const frontmatter: DocumentMetadata = {
          title: request.title,
          type: request.type,
          status: 'draft',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          tags: [request.type, 'ai-generated'],
          priority: request.priority,
        };

        documents.push({
          type: request.type,
          path: request.targetPath,
          title: request.title,
          content,
          frontmatter,
          backlinks: [],
        });
      }
    });

    return documents;
  }

  /**
   * Generate single document with specific agent
   */
  async generateWithAgent(
    agent: 'researcher' | 'coder' | 'architect' | 'analyst' | 'tester',
    prompt: string
  ): Promise<string> {
    const command = this.buildClaudeFlowCommand(agent, prompt);

    try {
      const { stdout } = await execAsync(command);
      return this.parseAgentOutput(stdout, {} as DocumentGenerationRequest);
    } catch (error) {
      throw new Error(
        `Agent ${agent} failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
