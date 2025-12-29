/**
 * DeepAnalyzer - Claude-Flow Integration for Deep Codebase Analysis
 *
 * Uses claude-flow agents for comprehensive codebase analysis:
 * - Pattern detection and architectural insights
 * - Documentation gap analysis
 * - Standards compliance checking
 *
 * @module cultivation/deep-analyzer
 */

import { execFileSync, spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { createLogger } from '../utils/index.js';

const logger = createLogger('deep-analyzer');

/**
 * Valid agent types for security validation
 */
const VALID_AGENT_TYPES = new Set([
  'researcher',
  'architect',
  'analyst',
  'coder',
  'tester',
  'reviewer',
  'documenter',
]);

/**
 * Deep analyzer options
 */
export interface DeepAnalyzerOptions {
  /** Project root directory */
  projectRoot: string;
  /** Documentation path (relative to project root) */
  docsPath?: string;
  /** Output directory for analysis results */
  outputDir?: string;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Maximum agents to spawn */
  maxAgents?: number;
  /** Agent execution mode */
  agentMode?: 'sequential' | 'parallel' | 'adaptive';
  /** Timeout for each agent (ms) */
  agentTimeout?: number;
}

/**
 * Analysis result from an agent
 */
export interface AgentResult {
  name: string;
  type: string;
  success: boolean;
  insights: string[];
  documents: Array<{ path: string; title: string }>;
  duration: number;
  error?: string;
}

/**
 * Deep analysis result
 */
export interface DeepAnalysisResult {
  success: boolean;
  agentsSpawned: number;
  insightsCount: number;
  documentsCreated: number;
  results: AgentResult[];
  duration: number;
  errors: string[];
}

/**
 * Agent configuration
 */
interface AgentConfig {
  name: string;
  type: 'researcher' | 'analyst' | 'coder' | 'tester' | 'reviewer';
  task: string;
  outputFile: string;
}

/**
 * DeepAnalyzer - Uses claude-flow for deep codebase analysis
 *
 * @example
 * ```typescript
 * const analyzer = new DeepAnalyzer({
 *   projectRoot: '/my/project',
 *   docsPath: 'docs',
 * });
 *
 * const result = await analyzer.analyze();
 * console.log(`Generated ${result.insightsCount} insights`);
 * ```
 */
export class DeepAnalyzer {
  private projectRoot: string;
  private docsPath: string;
  private outputDir: string;
  private verbose: boolean;
  private maxAgents: number;
  private agentMode: 'sequential' | 'parallel' | 'adaptive';
  private agentTimeout: number;

  constructor(options: DeepAnalyzerOptions) {
    this.projectRoot = resolve(options.projectRoot);
    this.docsPath = options.docsPath || 'docs';
    this.outputDir = options.outputDir || join(this.projectRoot, this.docsPath, 'analysis');
    this.verbose = options.verbose || false;
    this.maxAgents = options.maxAgents || 5;
    this.agentMode = options.agentMode || 'adaptive';
    // Default timeout of 60 seconds (configurable via agentTimeout option)
    this.agentTimeout = options.agentTimeout || 60000;
  }

  /**
   * Check if claude-flow is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // SECURITY: execFileSync does not spawn a shell by default, preventing shell injection
      // Using npx with explicit arguments avoids shell metacharacter interpretation
      execFileSync('npx', ['claude-flow@alpha', '--version'], {
        stdio: 'pipe',
        timeout: 5000,
        windowsHide: true,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run deep analysis
   */
  async analyze(): Promise<DeepAnalysisResult> {
    const startTime = Date.now();

    const result: DeepAnalysisResult = {
      success: false,
      agentsSpawned: 0,
      insightsCount: 0,
      documentsCreated: 0,
      results: [],
      duration: 0,
      errors: [],
    };

    // Check availability
    if (!(await this.isAvailable())) {
      result.errors.push('claude-flow is not available');
      result.duration = Date.now() - startTime;
      return result;
    }

    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    // Define agents
    const agents: AgentConfig[] = [
      {
        name: 'Pattern Researcher',
        type: 'researcher',
        task: 'Analyze codebase architecture, patterns, and design decisions',
        outputFile: 'architecture-patterns.md',
      },
      {
        name: 'Code Analyst',
        type: 'analyst',
        task: 'Identify code quality issues, complexity hotspots, and improvement opportunities',
        outputFile: 'code-analysis.md',
      },
      {
        name: 'Implementation Reviewer',
        type: 'coder',
        task: 'Review implementation patterns, naming conventions, and code style',
        outputFile: 'implementation-review.md',
      },
      {
        name: 'Test Analyzer',
        type: 'tester',
        task: 'Analyze test coverage, testing patterns, and testing gaps',
        outputFile: 'testing-analysis.md',
      },
    ];

    logger.info('Starting deep analysis', { agents: agents.length, mode: this.agentMode });

    // Execute agents based on mode
    if (this.agentMode === 'parallel') {
      result.results = await this.executeParallel(agents);
    } else if (this.agentMode === 'sequential') {
      result.results = await this.executeSequential(agents);
    } else {
      // Adaptive: start with 2, scale based on success
      result.results = await this.executeAdaptive(agents);
    }

    // Calculate totals
    result.agentsSpawned = result.results.length;
    result.insightsCount = result.results.reduce((sum, r) => sum + r.insights.length, 0);
    result.documentsCreated = result.results.reduce((sum, r) => sum + r.documents.length, 0);
    result.success = result.results.every(r => r.success);
    result.duration = Date.now() - startTime;

    // Collect errors
    for (const agentResult of result.results) {
      if (agentResult.error) {
        result.errors.push(`${agentResult.name}: ${agentResult.error}`);
      }
    }

    logger.info('Deep analysis complete', {
      success: result.success,
      insights: result.insightsCount,
      documents: result.documentsCreated,
      duration: result.duration,
    });

    return result;
  }

  /**
   * Execute agents in parallel
   */
  private async executeParallel(agents: AgentConfig[]): Promise<AgentResult[]> {
    const promises = agents.map(agent => this.executeAgent(agent));
    return Promise.all(promises);
  }

  /**
   * Execute agents sequentially
   */
  private async executeSequential(agents: AgentConfig[]): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    for (const agent of agents) {
      results.push(await this.executeAgent(agent));
    }
    return results;
  }

  /**
   * Execute agents adaptively (start with 2, scale based on success)
   */
  private async executeAdaptive(agents: AgentConfig[]): Promise<AgentResult[]> {
    const results: AgentResult[] = [];

    // First batch: 2 agents
    const firstBatch = agents.slice(0, 2);
    const firstResults = await Promise.all(firstBatch.map(a => this.executeAgent(a)));
    results.push(...firstResults);

    // Check success rate
    const successRate = firstResults.filter(r => r.success).length / firstResults.length;

    if (successRate >= 0.5 && agents.length > 2) {
      // Continue with remaining agents in parallel
      const remaining = agents.slice(2);
      const remainingResults = await Promise.all(remaining.map(a => this.executeAgent(a)));
      results.push(...remainingResults);
    } else if (agents.length > 2) {
      // Fall back to sequential
      logger.warn('Low success rate, switching to sequential mode');
      for (const agent of agents.slice(2)) {
        results.push(await this.executeAgent(agent));
      }
    }

    return results;
  }

  /**
   * Execute a single agent
   */
  private async executeAgent(agent: AgentConfig): Promise<AgentResult> {
    const startTime = Date.now();
    const outputPath = join(this.outputDir, agent.outputFile);

    const result: AgentResult = {
      name: agent.name,
      type: agent.type,
      success: false,
      insights: [],
      documents: [],
      duration: 0,
    };

    try {
      logger.info(`Spawning agent: ${agent.name}`, { type: agent.type });

      const prompt = this.buildPrompt(agent);

      // Execute claude-flow agent
      const output = await this.runClaudeFlowAgent(agent.type, prompt);

      // Parse output for insights
      result.insights = this.extractInsights(output);

      // Write output to file
      writeFileSync(outputPath, this.formatOutput(agent, output));
      result.documents.push({ path: outputPath, title: agent.name });

      result.success = true;

      if (this.verbose) {
        logger.debug(`Agent completed: ${agent.name}`, { insights: result.insights.length });
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      logger.error(`Agent failed: ${agent.name}`, error instanceof Error ? error : new Error(String(error)));
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Build prompt for agent
   */
  private buildPrompt(agent: AgentConfig): string {
    return `You are a ${agent.name} analyzing the project at ${this.projectRoot}.

**OBJECTIVE**: ${agent.task}

**COORDINATION PROTOCOL**:
\`\`\`bash
npx claude-flow@alpha hooks pre-task --description "${agent.task}"
\`\`\`

**YOUR TASKS**:
1. Analyze the codebase at ${this.projectRoot}
2. Identify key patterns and conventions
3. Document your findings with specific examples
4. Provide actionable recommendations
5. Generate comprehensive markdown documentation

**OUTPUT REQUIREMENTS**:
- Use clear markdown formatting
- Include code examples from the project
- Organize findings by category
- Prioritize actionable insights

After completing:
\`\`\`bash
npx claude-flow@alpha hooks post-task --task-id "${agent.type}-analysis"
\`\`\`
`;
  }

  /**
   * Run claude-flow agent
   */
  private async runClaudeFlowAgent(type: string, prompt: string): Promise<string> {
    // Security: Validate agent type against allowlist to prevent command injection
    if (!VALID_AGENT_TYPES.has(type)) {
      throw new Error(`Invalid agent type: ${type}. Valid types: ${[...VALID_AGENT_TYPES].join(', ')}`);
    }

    // Security: Sanitize prompt to prevent injection via shell metacharacters
    const sanitizedPrompt = prompt.replace(/[`$\\]/g, '');

    return new Promise((resolve, reject) => {
      const args = ['claude-flow@alpha', 'agent', 'execute', type, sanitizedPrompt, '--json'];

      const proc = spawn('npx', args, {
        cwd: this.projectRoot,
        shell: false, // Security: Disable shell to prevent command injection
        timeout: this.agentTimeout,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Agent exited with code ${code}`));
        }
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Extract insights from agent output
   */
  private extractInsights(output: string): string[] {
    const insights: string[] = [];

    // Look for patterns like "- Insight:" or "## Finding:"
    const patterns = [
      /[-*]\s*(?:insight|finding|observation|recommendation):\s*(.+)/gi,
      /##\s*(?:insight|finding|observation|recommendation):\s*(.+)/gi,
      /(?:key\s+)?(?:insight|finding|observation|recommendation):\s*(.+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = output.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          insights.push(match[1].trim());
        }
      }
    }

    // Deduplicate
    return [...new Set(insights)];
  }

  /**
   * Format output for documentation
   */
  private formatOutput(agent: AgentConfig, output: string): string {
    const timestamp = new Date().toISOString();

    return `---
title: "${agent.name} Analysis"
type: analysis
generator: deep-analyzer
agent: ${agent.type}
created: ${timestamp}
---

# ${agent.name} Analysis

> Generated by DeepAnalyzer using claude-flow

## Overview

${agent.task}

## Analysis

${output}

---

*Generated on ${new Date().toLocaleString()}*
`;
  }
}

/**
 * Create a deep analyzer instance
 */
export function createDeepAnalyzer(options: DeepAnalyzerOptions): DeepAnalyzer {
  return new DeepAnalyzer(options);
}

/**
 * Run deep analysis on a project
 */
export async function analyzeDeep(
  projectRoot: string,
  docsPath?: string
): Promise<DeepAnalysisResult> {
  const analyzer = new DeepAnalyzer({ projectRoot, docsPath });
  return analyzer.analyze();
}
