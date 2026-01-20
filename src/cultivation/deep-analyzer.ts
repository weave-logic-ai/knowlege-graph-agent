/**
 * DeepAnalyzer - Documentation Cultivation & Knowledge Graph Enhancement
 *
 * Analyzes existing documentation to:
 * - Understand the vision and requirements described
 * - Identify documentation gaps and unclear areas
 * - Guide the documentation process with research questions
 * - Build knowledge graph connections
 *
 * This is NOT for code analysis - use analyze-codebase for that.
 *
 * @module cultivation/deep-analyzer
 */

import { execFileSync, execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, relative, basename, extname } from 'path';
import { createLogger } from '../utils/index.js';

const logger = createLogger('deep-analyzer');

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
  /** Maximum documents to analyze */
  maxDocuments?: number;
  /** Timeout for each analysis (ms) */
  agentTimeout?: number;
  /** Force use of API key even if CLI is available */
  forceApiKey?: boolean;
  /** Preferred provider when multiple are available */
  preferredProvider?: 'anthropic' | 'gemini';
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
  mode: 'cli' | 'anthropic' | 'gemini' | 'static';
}

/**
 * Agent configuration
 */
interface AgentConfig {
  name: string;
  type: string;
  task: string;
  outputFile: string;
}

/**
 * Execution mode detection result
 */
interface ExecutionMode {
  mode: 'cli' | 'anthropic' | 'gemini' | 'unavailable';
  reason: string;
}

/**
 * Document metadata for analysis
 */
interface DocMetadata {
  path: string;
  title: string;
  type: string;
  size: number;
  preview: string;
}

/**
 * DeepAnalyzer - Documentation cultivation with AI-powered analysis
 *
 * Reads existing markdown documentation and provides:
 * - Vision synthesis from requirements
 * - Gap analysis identifying missing documentation
 * - Research questions for unclear areas
 * - Knowledge graph connection suggestions
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
  private maxDocuments: number;
  private agentTimeout: number;
  private forceApiKey: boolean;
  private preferredProvider: 'anthropic' | 'gemini';

  constructor(options: DeepAnalyzerOptions) {
    this.projectRoot = resolve(options.projectRoot);
    this.docsPath = options.docsPath || 'docs';
    this.outputDir = options.outputDir || join(this.projectRoot, this.docsPath, 'analysis');
    this.verbose = options.verbose || false;
    this.maxDocuments = options.maxDocuments || 50;
    // Default timeout of 2 minutes (120 seconds)
    this.agentTimeout = options.agentTimeout || 120000;
    this.forceApiKey = options.forceApiKey || false;
    this.preferredProvider = options.preferredProvider || 'anthropic';
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
  private hasAnthropicApiKey(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  /**
   * Check if Google AI / Gemini API key is available
   */
  private hasGeminiApiKey(): boolean {
    return !!(
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY
    );
  }

  /**
   * Get the Gemini API key from available env vars
   */
  private getGeminiApiKey(): string | undefined {
    return (
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY
    );
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
    const hasAnthropicKey = this.hasAnthropicApiKey();
    const hasGeminiKey = this.hasGeminiApiKey();
    const cliAvailable = this.isCliAvailable();

    // If forced to use API key
    if (this.forceApiKey) {
      if (this.preferredProvider === 'gemini' && hasGeminiKey) {
        return { mode: 'gemini', reason: 'Using Gemini API (forced, preferred)' };
      }
      if (hasAnthropicKey) {
        return { mode: 'anthropic', reason: 'Using Anthropic API (forced)' };
      }
      if (hasGeminiKey) {
        return { mode: 'gemini', reason: 'Using Gemini API (forced, fallback)' };
      }
      return { mode: 'unavailable', reason: 'No API key found. Set ANTHROPIC_API_KEY or GOOGLE_AI_API_KEY.' };
    }

    // Prefer API keys for reliability
    if (this.preferredProvider === 'gemini' && hasGeminiKey) {
      return { mode: 'gemini', reason: 'Using Gemini API (preferred)' };
    }
    if (hasAnthropicKey) {
      return { mode: 'anthropic', reason: 'Using Anthropic API' };
    }
    if (hasGeminiKey) {
      return { mode: 'gemini', reason: 'Using Gemini API' };
    }

    // No API keys - try CLI as last resort
    if (insideClaudeCode) {
      return {
        mode: 'unavailable',
        reason: 'Cannot run inside Claude Code without an API key. Set ANTHROPIC_API_KEY or GOOGLE_AI_API_KEY.',
      };
    }

    if (cliAvailable) {
      return { mode: 'cli', reason: 'Using Claude CLI (no API key found)' };
    }

    return {
      mode: 'unavailable',
      reason: 'No execution method available. Set ANTHROPIC_API_KEY or GOOGLE_AI_API_KEY.',
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
   * Scan documentation directory for markdown files
   */
  private scanDocumentation(): DocMetadata[] {
    const docsDir = join(this.projectRoot, this.docsPath);
    if (!existsSync(docsDir)) {
      return [];
    }

    const documents: DocMetadata[] = [];
    const scan = (dir: string) => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'analysis') {
          continue;
        }

        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (entry.isFile() && extname(entry.name) === '.md') {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            const stats = statSync(fullPath);
            const relPath = relative(docsDir, fullPath);

            // Extract title from first heading or filename
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1] : basename(entry.name, '.md');

            // Determine document type from path or frontmatter
            let type = 'general';
            if (relPath.includes('concepts/')) type = 'concept';
            else if (relPath.includes('components/')) type = 'component';
            else if (relPath.includes('services/')) type = 'service';
            else if (relPath.includes('features/')) type = 'feature';
            else if (relPath.includes('guides/')) type = 'guide';
            else if (relPath.includes('standards/')) type = 'standard';
            else if (relPath.includes('references/')) type = 'reference';
            else if (relPath.includes('integrations/')) type = 'integration';
            else if (entry.name.includes('requirement')) type = 'requirement';
            else if (entry.name.includes('spec')) type = 'specification';

            // Get preview (first 500 chars after title)
            const preview = content.slice(0, 2000).replace(/^#.+\n/, '').trim().slice(0, 500);

            documents.push({
              path: relPath,
              title,
              type,
              size: stats.size,
              preview,
            });
          } catch {
            // Skip files that can't be read
          }
        }
      }
    };

    scan(docsDir);
    return documents.slice(0, this.maxDocuments);
  }

  /**
   * Read full content of key documents
   */
  private readKeyDocuments(): Map<string, string> {
    const docsDir = join(this.projectRoot, this.docsPath);
    const keyDocs = new Map<string, string>();

    // Priority documents to read in full
    const priorityFiles = [
      'README.md',
      'MOC.md',
      'PRIMITIVES.md',
      'original_specs.md',
      'business_requirements_document.md',
      'technical_requirements.md',
      'test_strategy.md',
    ];

    for (const file of priorityFiles) {
      const filePath = join(docsDir, file);
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          // Limit to 15KB per document to fit in context
          keyDocs.set(file, content.slice(0, 15000));
        } catch {
          // Skip
        }
      }
    }

    return keyDocs;
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

    logger.info(`Starting documentation cultivation`, { mode: executionMode.mode, reason: executionMode.reason });

    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    // Scan existing documentation
    const documents = this.scanDocumentation();
    const keyDocs = this.readKeyDocuments();

    if (documents.length === 0) {
      result.errors.push('No markdown documents found in docs directory');
      result.duration = Date.now() - startTime;
      return result;
    }

    logger.info('Found documentation', { documents: documents.length, keyDocs: keyDocs.size });

    // Define documentation cultivation agents
    const agents: AgentConfig[] = [
      {
        name: 'Vision Synthesizer',
        type: 'vision',
        task: 'Synthesize the project vision, goals, and core value proposition from the documentation',
        outputFile: 'vision-synthesis.md',
      },
      {
        name: 'Gap Analyst',
        type: 'gaps',
        task: 'Identify documentation gaps, missing sections, and areas that need more detail',
        outputFile: 'documentation-gaps.md',
      },
      {
        name: 'Research Guide',
        type: 'research',
        task: 'Generate research questions and areas that need further investigation or clarification',
        outputFile: 'research-questions.md',
      },
      {
        name: 'Connection Mapper',
        type: 'connections',
        task: 'Identify relationships between concepts and suggest knowledge graph connections',
        outputFile: 'knowledge-connections.md',
      },
    ];

    logger.info('Executing cultivation agents', { agents: agents.length, mode: 'sequential' });

    // Execute agents sequentially
    for (const agent of agents) {
      const agentResult = await this.executeAgent(
        agent,
        executionMode.mode as 'cli' | 'anthropic' | 'gemini',
        documents,
        keyDocs
      );
      result.results.push(agentResult);
    }

    // Calculate totals
    result.agentsSpawned = result.results.length;
    result.insightsCount = result.results.reduce((sum, r) => sum + r.insights.length, 0);
    result.documentsCreated = result.results.reduce((sum, r) => sum + r.documents.length, 0);
    result.success = result.results.some(r => r.success);
    result.duration = Date.now() - startTime;

    // Collect errors
    for (const agentResult of result.results) {
      if (agentResult.error) {
        result.errors.push(`${agentResult.name}: ${agentResult.error}`);
      }
    }

    logger.info('Documentation cultivation complete', {
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
  private async executeAgent(
    agent: AgentConfig,
    mode: 'cli' | 'anthropic' | 'gemini',
    documents: DocMetadata[],
    keyDocs: Map<string, string>
  ): Promise<AgentResult> {
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

      const prompt = this.buildPrompt(agent, documents, keyDocs);
      let output: string;

      if (mode === 'cli') {
        output = await this.runWithCli(prompt);
      } else if (mode === 'anthropic') {
        output = await this.runWithAnthropic(prompt);
      } else {
        output = await this.runWithGemini(prompt);
      }

      // Parse output for insights
      result.insights = this.extractInsights(output);

      // Write output to file
      writeFileSync(outputPath, this.formatOutput(agent, output, mode));
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
   * Build context-aware prompt for documentation cultivation
   */
  private buildPrompt(agent: AgentConfig, documents: DocMetadata[], keyDocs: Map<string, string>): string {
    // Build document inventory
    const inventory = documents.map(d => `- ${d.path} (${d.type}): ${d.title}`).join('\n');

    // Build key document content
    const keyContent = Array.from(keyDocs.entries())
      .map(([name, content]) => `### ${name}\n\n${content}`)
      .join('\n\n---\n\n');

    // Agent-specific instructions
    let specificInstructions = '';
    switch (agent.type) {
      case 'vision':
        specificInstructions = `
Focus on:
1. What is the core purpose/goal of this project?
2. What problem does it solve?
3. What is the target audience/user?
4. What are the key success metrics?
5. What is the overall architecture vision?

Provide a clear, concise synthesis of the project vision with references to specific documentation.`;
        break;

      case 'gaps':
        specificInstructions = `
Identify:
1. Missing documentation (what topics are mentioned but not explained?)
2. Incomplete sections (what areas need more detail?)
3. Outdated information (anything that seems inconsistent?)
4. Missing examples or use cases
5. Unclear terminology or concepts that need definitions

For each gap, specify:
- What is missing
- Where it should be documented
- Why it's important`;
        break;

      case 'research':
        specificInstructions = `
Generate research questions in these categories:
1. Technical questions (how should X be implemented?)
2. Design decisions (why this approach vs alternatives?)
3. Integration questions (how does X connect to Y?)
4. Validation questions (how do we verify X works?)
5. Scalability questions (will this work at scale?)

For each question:
- State the question clearly
- Explain why answering it is important
- Suggest where to look for answers`;
        break;

      case 'connections':
        specificInstructions = `
Identify relationships between documented concepts:
1. Dependencies (X requires Y)
2. Extensions (X extends Y)
3. Alternatives (X is an alternative to Y)
4. Compositions (X is made up of Y and Z)
5. References (X references Y for details)

Suggest knowledge graph nodes and edges in this format:
- [Node A] --relationship--> [Node B]: description

Also identify concepts that should be linked but aren't currently.`;
        break;
    }

    return `You are a documentation analyst helping to cultivate a knowledge graph.

## Your Task
${agent.task}

## Documentation Inventory
The following markdown documents exist in this project:
${inventory}

## Key Document Contents

${keyContent}

## Instructions
${specificInstructions}

## Output Format
Provide your analysis in markdown format with:
1. Clear section headings
2. Specific observations (prefix with "Observation:")
3. Specific recommendations (prefix with "Recommendation:")
4. Key findings (prefix with "Finding:")
5. Research questions where applicable (prefix with "Question:")

Reference specific documents using [[document-name]] wiki-link format where relevant.
Be specific and actionable in your analysis.`;
  }

  /**
   * Run analysis using Claude CLI
   */
  private async runWithCli(prompt: string): Promise<string> {
    const sanitizedPrompt = prompt
      .replace(/"/g, '\\"')
      .replace(/[`$]/g, '');

    try {
      const result = execSync(`claude -p "${sanitizedPrompt}"`, {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout: this.agentTimeout,
        maxBuffer: 10 * 1024 * 1024,
      });
      return result;
    } catch (error) {
      if (error instanceof Error) {
        const execError = error as { stderr?: string; stdout?: string; killed?: boolean };
        if (execError.killed) {
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
  private async runWithAnthropic(prompt: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find(block => block.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        return textBlock.text;
      }

      throw new Error('No text content in API response');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Anthropic API call failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Run analysis using Google Gemini API
   */
  private async runWithGemini(prompt: string): Promise<string> {
    const apiKey = this.getGeminiApiKey();
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY not set');
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No text content in Gemini response');
      }

      return text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API call failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract insights from agent output
   */
  private extractInsights(output: string): string[] {
    const insights: string[] = [];

    const patterns = [
      /[-*]?\s*(?:insight|finding|observation|recommendation|question):\s*(.+)/gi,
      /##\s*(?:insight|finding|observation|recommendation|question):\s*(.+)/gi,
      /(?:key\s+)?(?:insight|finding|observation|recommendation|question):\s*(.+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = output.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          insights.push(match[1].trim());
        }
      }
    }

    return [...new Set(insights)];
  }

  /**
   * Format output for documentation
   */
  private formatOutput(agent: AgentConfig, output: string, mode: string): string {
    const timestamp = new Date().toISOString();

    return `---
title: "${agent.name}"
type: cultivation-analysis
generator: deep-analyzer
agent: ${agent.type}
provider: ${mode}
created: ${timestamp}
---

# ${agent.name}

> Generated by DeepAnalyzer for documentation cultivation

## Purpose

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
