/**
 * Deep Codebase Analyzer
 *
 * Uses claude-flow agents to perform intelligent analysis of codebase
 * and map discoveries to PRIMITIVES.md taxonomy
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface PrimitiveDiscovery {
  category: string;  // e.g., "schemas/database", "integrations/ai-services"
  name: string;
  description: string;
  files: string[];
  dependencies?: string[];
  usage?: string;
  type: 'pattern' | 'protocol' | 'standard' | 'integration' | 'schema' | 'service' | 'guide' | 'component';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface DeepAnalysisResult {
  primitives: PrimitiveDiscovery[];
  totalCount: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

export class DeepAnalyzer {
  constructor(
    private projectRoot: string,
    private vaultRoot: string
  ) {}

  /**
   * Perform deep analysis using claude-flow agent
   */
  async analyze(): Promise<DeepAnalysisResult> {
    console.log('  🔍 Performing deep codebase analysis...');

    // Check if claude-flow is available
    const hasClaudeFlow = await this.checkClaudeFlow();

    if (!hasClaudeFlow) {
      console.log('  ⚠️  claude-flow not available, using shallow analysis');
      return this.shallowAnalysis();
    }

    // Use claude-flow agent for deep analysis
    try {
      const analysis = await this.claudeFlowAnalysis();
      console.log(`  ✓ Found ${analysis.totalCount} primitives across taxonomy`);
      return analysis;
    } catch (error) {
      console.error('  ❌ Deep analysis failed:', error);
      return this.shallowAnalysis();
    }
  }

  /**
   * Check if claude-flow is available
   */
  private async checkClaudeFlow(): Promise<boolean> {
    try {
      await execAsync('npx claude-flow --version', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Use claude-flow researcher agent for intelligent analysis
   */
  private async claudeFlowAnalysis(): Promise<DeepAnalysisResult> {
    // Read PRIMITIVES.md taxonomy
    const taxonomyPath = path.join(this.vaultRoot, 'PRIMITIVES.md');
    let taxonomy = '';

    try {
      taxonomy = await fs.readFile(taxonomyPath, 'utf-8');
    } catch {
      // Use default taxonomy structure
      taxonomy = this.getDefaultTaxonomy();
    }

    // Create analysis prompt
    const prompt = this.buildAnalysisPrompt(taxonomy);

    // Execute claude-flow agent (researcher type)
    const cmd = `npx claude-flow agent execute researcher "${prompt.replace(/"/g, '\\"')}" --json`;

    try {
      const { stdout } = await execAsync(cmd, {
        cwd: this.projectRoot,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        timeout: 120000 // 2 min timeout
      });

      // Parse agent response
      const response = JSON.parse(stdout);
      return this.parseAgentResponse(response);
    } catch (error) {
      throw new Error(`Agent execution failed: ${error}`);
    }
  }

  /**
   * Build analysis prompt for agent
   */
  private buildAnalysisPrompt(taxonomy: string): string {
    return `Analyze codebase at ${this.projectRoot} and map to PRIMITIVES.md taxonomy.

TAXONOMY:
${taxonomy}

ANALYZE:
1. package.json dependencies
2. Source files (lib/, app/, components/)
3. API routes and patterns
4. Database schemas
5. Integration points
6. Architectural patterns

OUTPUT JSON:
{
  "primitives": [
    {
      "category": "schemas/database",
      "name": "User Schema",
      "description": "...",
      "files": ["lib/db.ts"],
      "dependencies": ["lowdb"],
      "usage": "Authentication and user management",
      "type": "schema",
      "priority": "high"
    }
  ]
}`;
  }

  /**
   * Parse agent JSON response
   */
  private parseAgentResponse(response: any): DeepAnalysisResult {
    const primitives: PrimitiveDiscovery[] = response.primitives || [];

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const prim of primitives) {
      // Count by category
      byCategory[prim.category] = (byCategory[prim.category] || 0) + 1;

      // Count by priority
      byPriority[prim.priority] = (byPriority[prim.priority] || 0) + 1;
    }

    return {
      primitives,
      totalCount: primitives.length,
      byCategory,
      byPriority
    };
  }

  /**
   * Fallback shallow analysis (no agents)
   */
  private async shallowAnalysis(): Promise<DeepAnalysisResult> {
    const primitives: PrimitiveDiscovery[] = [];

    // Try to read package.json
    try {
      const pkgPath = path.join(this.projectRoot, 'package.json');
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));

      // Extract dependencies as integrations
      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          primitives.push({
            category: this.inferCategory(name),
            name: this.formatName(name),
            description: `${name} package integration`,
            files: ['package.json'],
            dependencies: [name],
            type: this.inferType(name),
            priority: this.inferPriority(name)
          });
        }
      }
    } catch {
      // No package.json found
    }

    return {
      primitives,
      totalCount: primitives.length,
      byCategory: {},
      byPriority: {}
    };
  }

  /**
   * Infer category from package name
   */
  private inferCategory(name: string): string {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('react') || nameLower.includes('radix')) return 'components/ui';
    if (nameLower.includes('db') || nameLower.includes('prisma')) return 'integrations/databases';
    if (nameLower.includes('auth') || nameLower.includes('jwt')) return 'integrations/auth-providers';
    if (nameLower.includes('openai') || nameLower.includes('ai')) return 'integrations/ai-services';
    if (nameLower.includes('workflow')) return 'protocols/workflow';

    return 'components/utilities';
  }

  /**
   * Infer primitive type from name
   */
  private inferType(name: string): PrimitiveDiscovery['type'] {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('workflow')) return 'protocol';
    if (nameLower.includes('db')) return 'integration';
    if (nameLower.includes('auth')) return 'integration';
    if (nameLower.includes('schema') || nameLower.includes('zod')) return 'schema';

    return 'component';
  }

  /**
   * Infer priority from package importance
   */
  private inferPriority(name: string): PrimitiveDiscovery['priority'] {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('next') || nameLower.includes('react')) return 'critical';
    if (nameLower.includes('db') || nameLower.includes('auth')) return 'high';
    if (nameLower.includes('workflow') || nameLower.includes('openai')) return 'high';

    return 'medium';
  }

  /**
   * Format package name for display
   */
  private formatName(name: string): string {
    return name
      .replace(/@/g, '')
      .replace(/\//g, ' ')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get default taxonomy structure
   */
  private getDefaultTaxonomy(): string {
    return `
CRITICAL:
- patterns/ (api-patterns, data-patterns, integration-patterns, ui-patterns, security-patterns)
- protocols/ (mcp, api, messaging, rpc, workflow)
- standards/ (data-formats, api-styles, coding-standards)

HIGH PRIORITY:
- integrations/ (ai-services, databases, auth-providers, storage, monitoring)
- schemas/ (database, api, events, configuration)

MEDIUM PRIORITY:
- services/ (ai, storage, monitoring, communication)
- guides/ (setup, development, deployment)

LOW PRIORITY:
- components/ (ui, utilities, adapters, middleware)
`;
  }
}
