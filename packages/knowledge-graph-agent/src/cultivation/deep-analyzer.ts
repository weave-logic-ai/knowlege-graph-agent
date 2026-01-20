/**
 * DeepAnalyzer - Deep Codebase Analysis
 *
 * Provides comprehensive codebase analysis using:
 * - Claude CLI (`claude -p`) when running outside Claude Code
 * - Direct Anthropic API when ANTHROPIC_API_KEY is available
 * - Clear error messaging when neither option is available
 *
 * @module cultivation/deep-analyzer
 */

import { execFileSync, execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, resolve, relative } from 'path';
import { createLogger } from '../utils/index.js';

const logger = createLogger('deep-analyzer');

/**
 * Valid agent types for analysis
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
  /** Force use of API key even if CLI is available */
  forceApiKey?: boolean;
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
  mode: 'cli' | 'api' | 'static';
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
 * Execution mode detection result
 */
interface ExecutionMode {
  mode: 'cli' | 'api' | 'unavailable';
  reason: string;
}

/**
 * DeepAnalyzer - Deep codebase analysis with multiple execution modes
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
  private forceApiKey: boolean;

  constructor(options: DeepAnalyzerOptions) {
    this.projectRoot = resolve(options.projectRoot);
    this.docsPath = options.docsPath || 'docs';
    this.outputDir = options.outputDir || join(this.projectRoot, this.docsPath, 'analysis');
    this.verbose = options.verbose || false;
    this.maxAgents = options.maxAgents || 5;
    this.agentMode = options.agentMode || 'adaptive';
    // Default timeout of 2 minutes (120 seconds)
    this.agentTimeout = options.agentTimeout || 120000;
    this.forceApiKey = options.forceApiKey || false;
  }

  /**
   * Check if running inside a Claude Code session
   */
  private isInsideClaudeCode(): boolean {
    return process.env.CLAUDECODE === '1' || process.env.CLAUDE_CODE === '1';
  }

  /**
   * Check if Anthropic API key is available
   */
  private hasApiKey(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  /**
   * Check if Claude CLI is available
   */
  private isCliAvailable(): boolean {
    try {
      execFileSync('claude', ['--version'], {
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
   * Determine the best execution mode
   */
  private detectExecutionMode(): ExecutionMode {
    const insideClaudeCode = this.isInsideClaudeCode();
    const hasApiKey = this.hasApiKey();
    const cliAvailable = this.isCliAvailable();

    // If forced to use API key
    if (this.forceApiKey) {
      if (hasApiKey) {
        return { mode: 'api', reason: 'Using API key (forced)' };
      }
      return { mode: 'unavailable', reason: 'ANTHROPIC_API_KEY not set (required when forceApiKey=true)' };
    }

    // Inside Claude Code session - CLI doesn't work due to resource contention
    if (insideClaudeCode) {
      if (hasApiKey) {
        return { mode: 'api', reason: 'Using API key (inside Claude Code session)' };
      }
      return {
        mode: 'unavailable',
        reason: 'Cannot run deep analysis inside Claude Code session without ANTHROPIC_API_KEY. ' +
                'Either set ANTHROPIC_API_KEY environment variable, or run this command from a regular terminal.',
      };
    }

    // Outside Claude Code - prefer CLI for OAuth session support
    if (cliAvailable) {
      return { mode: 'cli', reason: 'Using Claude CLI' };
    }

    // CLI not available, try API key
    if (hasApiKey) {
      return { mode: 'api', reason: 'Using API key (CLI not available)' };
    }

    return {
      mode: 'unavailable',
      reason: 'Claude CLI not found. Install Claude Code (https://claude.ai/code) or set ANTHROPIC_API_KEY.',
    };
  }

  /**
   * Check if analysis is available
   */
  async isAvailable(): Promise<boolean> {
    const mode = this.detectExecutionMode();
    return mode.mode !== 'unavailable';
  }

  /**
   * Get availability status with reason
   */
  async getAvailabilityStatus(): Promise<{ available: boolean; reason: string }> {
    const mode = this.detectExecutionMode();
    return {
      available: mode.mode !== 'unavailable',
      reason: mode.reason,
    };
  }

  /**
   * Run deep analysis
   */
  async analyze(): Promise<DeepAnalysisResult> {
    const startTime = Date.now();
    const executionMode = this.detectExecutionMode();

    const result: DeepAnalysisResult = {
      success: false,
      agentsSpawned: 0,
      insightsCount: 0,
      documentsCreated: 0,
      results: [],
      duration: 0,
      errors: [],
      mode: executionMode.mode === 'unavailable' ? 'static' : executionMode.mode,
    };

    // Check availability
    if (executionMode.mode === 'unavailable') {
      result.errors.push(executionMode.reason);
      result.duration = Date.now() - startTime;
      logger.error('Deep analysis unavailable', new Error(executionMode.reason));
      return result;
    }

    logger.info(`Starting deep analysis`, { mode: executionMode.mode, reason: executionMode.reason });

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

    logger.info('Executing analysis agents', { agents: agents.length, mode: 'sequential' });

    // Execute agents sequentially
    for (const agent of agents) {
      const agentResult = await this.executeAgent(agent, executionMode.mode as 'cli' | 'api');
      result.results.push(agentResult);
    }

    // Calculate totals
    result.agentsSpawned = result.results.length;
    result.insightsCount = result.results.reduce((sum, r) => sum + r.insights.length, 0);
    result.documentsCreated = result.results.reduce((sum, r) => sum + r.documents.length, 0);
    result.success = result.results.some(r => r.success); // Success if at least one agent succeeded
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
   * Execute a single agent
   */
  private async executeAgent(agent: AgentConfig, mode: 'cli' | 'api'): Promise<AgentResult> {
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
      logger.info(`Executing agent: ${agent.name}`, { type: agent.type, mode });

      const prompt = this.buildPrompt(agent);
      let output: string;

      if (mode === 'cli') {
        output = await this.runWithCli(prompt);
      } else {
        output = await this.runWithApi(prompt);
      }

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
   * Build context-aware prompt for analysis
   */
  private buildPrompt(agent: AgentConfig): string {
    // Gather project context
    const context = this.gatherProjectContext();

    return `You are analyzing a codebase. Here is the project context:

${context}

Task: ${agent.task}

Provide your findings in markdown format with:
1. Key observations (prefix with "Observation:")
2. Specific recommendations (prefix with "Recommendation:")
3. Any potential issues found (prefix with "Finding:")

Be specific and actionable in your analysis.`;
  }

  /**
   * Gather project context for analysis
   */
  private gatherProjectContext(): string {
    const lines: string[] = [];

    // Check for package.json
    const packageJsonPath = join(this.projectRoot, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        lines.push(`Project: ${pkg.name || 'Unknown'} v${pkg.version || '0.0.0'}`);
        lines.push(`Description: ${pkg.description || 'No description'}`);

        if (pkg.dependencies) {
          const deps = Object.keys(pkg.dependencies).slice(0, 10);
          lines.push(`Key dependencies: ${deps.join(', ')}`);
        }
      } catch {
        // Ignore parse errors
      }
    }

    // List top-level directories
    try {
      const entries = readdirSync(this.projectRoot, { withFileTypes: true });
      const dirs = entries
        .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
        .map(e => e.name)
        .slice(0, 10);

      if (dirs.length > 0) {
        lines.push(`Project structure: ${dirs.join(', ')}`);
      }
    } catch {
      // Ignore errors
    }

    // Check for common config files
    const configFiles = [
      'tsconfig.json',
      'vite.config.ts',
      'vitest.config.ts',
      '.eslintrc.js',
      'Dockerfile',
    ];

    const foundConfigs = configFiles.filter(f => existsSync(join(this.projectRoot, f)));
    if (foundConfigs.length > 0) {
      lines.push(`Config files: ${foundConfigs.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Run analysis using Claude CLI
   */
  private async runWithCli(prompt: string): Promise<string> {
    // Sanitize prompt - escape double quotes and remove dangerous chars
    const sanitizedPrompt = prompt
      .replace(/"/g, '\\"')
      .replace(/[`$]/g, '');

    try {
      const result = execSync(`claude -p "${sanitizedPrompt}"`, {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout: this.agentTimeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      return result;
    } catch (error) {
      if (error instanceof Error) {
        const execError = error as { stderr?: string; stdout?: string; killed?: boolean };
        if (execError.killed) {
          // Timeout - return partial output if available
          if (execError.stdout && execError.stdout.length > 100) {
            return execError.stdout;
          }
          throw new Error(`Claude CLI timed out after ${this.agentTimeout / 1000}s`);
        }
        throw new Error(execError.stderr || error.message);
      }
      throw error;
    }
  }

  /**
   * Run analysis using Anthropic API directly
   */
  private async runWithApi(prompt: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }

    try {
      // Dynamic import to avoid bundling issues
      const { default: Anthropic } = await import('@anthropic-ai/sdk');

      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text from response
      const textBlock = response.content.find(block => block.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        return textBlock.text;
      }

      throw new Error('No text content in API response');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API call failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract insights from agent output
   */
  private extractInsights(output: string): string[] {
    const insights: string[] = [];

    // Look for patterns like "- Insight:", "Observation:", "Finding:", "Recommendation:"
    const patterns = [
      /[-*]?\s*(?:insight|finding|observation|recommendation):\s*(.+)/gi,
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

> Generated by DeepAnalyzer

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
