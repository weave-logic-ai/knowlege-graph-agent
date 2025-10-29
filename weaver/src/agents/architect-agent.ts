/**
 * Architect Agent - System design and architecture planning
 *
 * Capabilities:
 * - High-level system architecture design
 * - Design pattern selection and recommendation
 * - API design (REST, GraphQL, gRPC)
 * - Architecture review and assessment
 * - Technology stack recommendations
 *
 * @example
 * ```typescript
 * const architect = new ArchitectAgent({ claudeClient });
 * const design = await architect.designSystem(requirements);
 * const patterns = await architect.selectPatterns(problem);
 * const api = await architect.designAPI(features);
 * ```
 */

import { ClaudeClient } from './claude-client.js';
import { PromptBuilder } from './prompt-builder.js';
import type { ParsedResponse } from './types.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * System requirements for architecture design
 */
export interface SystemRequirements {
  description: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: {
    scalability?: string;
    performance?: string;
    security?: string;
    reliability?: string;
    maintainability?: string;
  };
  constraints: string[];
  stakeholders: string[];
}

/**
 * System architecture design
 */
export interface SystemArchitecture {
  overview: string;
  components: Array<{
    name: string;
    responsibility: string;
    interfaces: string[];
    dependencies: string[];
  }>;
  dataFlow: Array<{
    from: string;
    to: string;
    description: string;
    protocol?: string;
  }>;
  technologies: {
    backend: string[];
    frontend: string[];
    database: string[];
    infrastructure: string[];
  };
  patterns: string[];
  diagrams: {
    mermaid?: string;
    description: string;
  };
  tradeoffs: Array<{
    decision: string;
    pros: string[];
    cons: string[];
  }>;
}

/**
 * Design pattern recommendation
 */
export interface PatternRecommendation {
  problem: string;
  recommendedPatterns: Array<{
    name: string;
    category: 'creational' | 'structural' | 'behavioral' | 'architectural';
    description: string;
    applicability: string;
    consequences: string[];
    implementation: string;
    examples: string[];
  }>;
  rationale: string;
}

/**
 * API design specification
 */
export interface APIDesign {
  type: 'REST' | 'GraphQL' | 'gRPC' | 'WebSocket';
  baseUrl?: string;
  endpoints?: Array<{
    path: string;
    method: string;
    description: string;
    parameters: Array<{ name: string; type: string; required: boolean }>;
    requestBody?: { schema: Record<string, unknown> };
    responses: Array<{ status: number; description: string; schema?: Record<string, unknown> }>;
  }>;
  schema?: string; // GraphQL schema or Protocol Buffer definitions
  authentication: {
    type: string;
    description: string;
  };
  rateLimit?: {
    strategy: string;
    limits: string[];
  };
  versioning: {
    strategy: string;
    currentVersion: string;
  };
  documentation: string;
}

/**
 * Architecture review result
 */
export interface ArchitectureReview {
  projectPath: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    suggestion: string;
    impact: string;
  }>;
  technicalDebt: Array<{
    area: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    estimatedEffort: string;
  }>;
  complianceWithPrinciples: {
    SOLID: { score: number; notes: string };
    DRY: { score: number; notes: string };
    KISS: { score: number; notes: string };
    YAGNI: { score: number; notes: string };
  };
}

/**
 * Architect agent configuration
 */
export interface ArchitectAgentConfig {
  claudeClient: ClaudeClient;
}

/**
 * Architect Agent - AI-powered system architecture design
 */
export class ArchitectAgent {
  private claudeClient: ClaudeClient;

  constructor(config: ArchitectAgentConfig) {
    this.claudeClient = config.claudeClient;
  }

  // ========================================================================
  // System Design
  // ========================================================================

  /**
   * Design high-level system architecture
   */
  async designSystem(requirements: SystemRequirements): Promise<SystemArchitecture> {
    const prompt = new PromptBuilder()
      .system('You are an expert software architect. Design scalable, maintainable, and robust system architectures.')
      .user(`Design a system architecture for:

**Description**: {{description}}

**Functional Requirements**:
{{functionalReqs}}

**Non-Functional Requirements**:
{{nonFunctionalReqs}}

**Constraints**:
{{constraints}}

**Stakeholders**: {{stakeholders}}

Provide comprehensive architecture including:
- Component breakdown with clear responsibilities
- Data flow between components
- Technology stack recommendations
- Design patterns to use
- Mermaid diagram for visualization
- Key tradeoffs and decisions

Return JSON with complete architecture specification.`)
      .variable('description', requirements.description)
      .variable('functionalReqs', requirements.functionalRequirements.map((r, i) => `${i + 1}. ${r}`).join('\n'))
      .variable('nonFunctionalReqs', Object.entries(requirements.nonFunctionalRequirements)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n'))
      .variable('constraints', requirements.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n'))
      .variable('stakeholders', requirements.stakeholders.join(', '))
      .expectJSON({
        type: 'object',
        properties: {
          overview: { type: 'string' },
          components: { type: 'array' },
          dataFlow: { type: 'array' },
          technologies: { type: 'object' },
          patterns: { type: 'array' },
          diagrams: { type: 'object' },
          tradeoffs: { type: 'array' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`System design failed: ${response.error}`);
    }

    return response.data as SystemArchitecture;
  }

  // ========================================================================
  // Pattern Selection
  // ========================================================================

  /**
   * Select and recommend design patterns for a problem
   */
  async selectPatterns(problem: string): Promise<PatternRecommendation> {
    const prompt = new PromptBuilder()
      .system('You are an expert in design patterns. Recommend appropriate patterns for solving specific problems.')
      .user(`Recommend design patterns for this problem:

**Problem**: {{problem}}

For each recommended pattern, provide:
- Name and category (creational/structural/behavioral/architectural)
- Detailed description
- When to apply (applicability)
- Consequences (benefits and drawbacks)
- Implementation approach
- Code examples

Return JSON with pattern recommendations and rationale.`)
      .variable('problem', problem)
      .expectJSON({
        type: 'object',
        properties: {
          recommendedPatterns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                category: { type: 'string', enum: ['creational', 'structural', 'behavioral', 'architectural'] },
                description: { type: 'string' },
                applicability: { type: 'string' },
                consequences: { type: 'array', items: { type: 'string' } },
                implementation: { type: 'string' },
                examples: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          rationale: { type: 'string' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Pattern selection failed: ${response.error}`);
    }

    const result = response.data as Omit<PatternRecommendation, 'problem'>;

    return {
      problem,
      ...result,
    };
  }

  // ========================================================================
  // API Design
  // ========================================================================

  /**
   * Design API for specified features
   */
  async designAPI(
    features: string[],
    apiType: 'REST' | 'GraphQL' | 'gRPC' = 'REST'
  ): Promise<APIDesign> {
    const apiTemplates = {
      REST: 'Design RESTful API endpoints with proper HTTP methods, status codes, and resource modeling.',
      GraphQL: 'Design GraphQL schema with queries, mutations, subscriptions, and type definitions.',
      gRPC: 'Design gRPC service with Protocol Buffer definitions and streaming support.',
    };

    const prompt = new PromptBuilder()
      .system(`You are an expert API architect. ${apiTemplates[apiType]}`)
      .user(`Design a ${apiType} API for these features:

{{features}}

Include:
- Complete API specification (endpoints/schema)
- Authentication and authorization strategy
- Rate limiting approach
- Versioning strategy
- Error handling patterns
- API documentation structure

Return comprehensive JSON API design.`)
      .variable('features', features.map((f, i) => `${i + 1}. ${f}`).join('\n'))
      .expectJSON({
        type: 'object',
        properties: {
          type: { type: 'string' },
          endpoints: { type: 'array' },
          schema: { type: 'string' },
          authentication: { type: 'object' },
          rateLimit: { type: 'object' },
          versioning: { type: 'object' },
          documentation: { type: 'string' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`API design failed: ${response.error}`);
    }

    return response.data as APIDesign;
  }

  // ========================================================================
  // Architecture Review
  // ========================================================================

  /**
   * Review existing project architecture
   */
  async reviewArchitecture(projectPath: string): Promise<ArchitectureReview> {
    // Scan project structure
    const structure = await this.scanProjectStructure(projectPath);

    const prompt = new PromptBuilder()
      .system('You are an expert at reviewing software architectures. Assess quality, identify issues, and provide actionable recommendations.')
      .user(`Review this project architecture:

**Project Structure**:
{{structure}}

Analyze:
1. Adherence to architectural patterns
2. Separation of concerns
3. Code organization
4. Dependency management
5. SOLID, DRY, KISS, YAGNI principles
6. Technical debt
7. Scalability concerns

Provide:
- Overall score (0-100)
- Strengths and weaknesses
- Prioritized recommendations
- Technical debt assessment
- Compliance with design principles

Return comprehensive JSON review.`)
      .variable('structure', structure)
      .expectJSON({
        type: 'object',
        properties: {
          score: { type: 'number' },
          strengths: { type: 'array', items: { type: 'string' } },
          weaknesses: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array' },
          technicalDebt: { type: 'array' },
          complianceWithPrinciples: { type: 'object' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Architecture review failed: ${response.error}`);
    }

    const result = response.data as Omit<ArchitectureReview, 'projectPath'>;

    return {
      projectPath,
      ...result,
    };
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  /**
   * Scan project structure for architecture review
   */
  private async scanProjectStructure(projectPath: string): Promise<string> {
    const structure: string[] = [];

    async function scan(dir: string, depth: number = 0): Promise<void> {
      if (depth > 3) return; // Limit depth

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          // Skip node_modules, .git, etc.
          if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
            continue;
          }

          const indent = '  '.repeat(depth);
          structure.push(`${indent}${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`);

          if (entry.isDirectory()) {
            await scan(path.join(dir, entry.name), depth + 1);
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    }

    await scan(projectPath);

    return structure.join('\n');
  }
}

/**
 * Create a new architect agent instance
 */
export function createArchitectAgent(config: ArchitectAgentConfig): ArchitectAgent {
  return new ArchitectAgent(config);
}
