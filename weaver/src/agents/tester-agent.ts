/**
 * Tester Agent - Comprehensive test generation and validation
 *
 * Capabilities:
 * - Automated test generation (unit, integration, e2e)
 * - Test coverage analysis and reporting
 * - Edge case identification
 * - Test data generation
 * - Property-based testing
 *
 * @example
 * ```typescript
 * const tester = new TesterAgent({ claudeClient });
 * const tests = await tester.generateTests('/path/to/code.ts', 'unit');
 * const coverage = await tester.validateTestCoverage('/project');
 * const edgeCases = await tester.findEdgeCases(spec);
 * ```
 */

import { ClaudeClient } from './claude-client.js';
import { PromptBuilder } from './prompt-builder.js';
import type { ParsedResponse } from './types.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Test strategy types
 */
export type TestStrategy = 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'property-based';

/**
 * Generated test suite
 */
export interface TestSuite {
  strategy: TestStrategy;
  framework: string;
  tests: Array<{
    name: string;
    description: string;
    code: string;
    assertions: string[];
    setup?: string;
    teardown?: string;
  }>;
  coverage: {
    functions: string[];
    branches: string[];
    edgeCases: string[];
  };
  dependencies: string[];
  executionOrder?: string[];
}

/**
 * Coverage analysis result
 */
export interface CoverageAnalysis {
  projectPath: string;
  overallCoverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  filesCoverage: Array<{
    file: string;
    coverage: {
      statements: number;
      branches: number;
      functions: number;
      lines: number;
    };
    uncoveredLines: number[];
    uncoveredFunctions: string[];
  }>;
  gaps: Array<{
    file: string;
    function: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}

/**
 * Edge case specification
 */
export interface EdgeCaseSpec {
  function: string;
  inputTypes: string[];
  constraints: string[];
  expectedBehavior: string;
}

/**
 * Edge case analysis
 */
export interface EdgeCaseAnalysis {
  cases: Array<{
    category: 'boundary' | 'null' | 'empty' | 'invalid' | 'overflow' | 'concurrent' | 'exceptional';
    description: string;
    input: unknown;
    expectedOutput: unknown;
    reasoning: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
  testCode: string;
  executionStrategy: string;
}

/**
 * Test data schema
 */
export interface TestDataSchema {
  fields: Array<{
    name: string;
    type: string;
    constraints?: string[];
    examples?: unknown[];
  }>;
  relationships?: Array<{
    from: string;
    to: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  }>;
}

/**
 * Generated test data
 */
export interface GeneratedTestData {
  schema: TestDataSchema;
  datasets: Array<{
    name: string;
    purpose: string;
    data: unknown[];
    count: number;
  }>;
  fixtures: string;
  seedScript?: string;
}

/**
 * Tester agent configuration
 */
export interface TesterAgentConfig {
  claudeClient: ClaudeClient;
  defaultFramework?: string;
}

/**
 * Tester Agent - AI-powered test generation and validation
 */
export class TesterAgent {
  private claudeClient: ClaudeClient;
  private defaultFramework: string;

  constructor(config: TesterAgentConfig) {
    this.claudeClient = config.claudeClient;
    this.defaultFramework = config.defaultFramework ?? 'vitest';
  }

  // ========================================================================
  // Test Generation
  // ========================================================================

  /**
   * Generate comprehensive tests for code
   */
  async generateTests(
    filePath: string,
    strategy: TestStrategy,
    framework: string = this.defaultFramework
  ): Promise<TestSuite> {
    const code = await fs.readFile(filePath, 'utf-8');

    const strategyPrompts: Record<TestStrategy, string> = {
      unit: 'Generate unit tests that test individual functions in isolation. Mock external dependencies.',
      integration: 'Generate integration tests that test how components work together. Test real interactions.',
      e2e: 'Generate end-to-end tests that test complete user workflows from start to finish.',
      performance: 'Generate performance tests that measure execution time, memory usage, and throughput.',
      security: 'Generate security tests that check for vulnerabilities, injection attacks, and auth issues.',
      'property-based': 'Generate property-based tests that verify invariants hold for random inputs.',
    };

    const prompt = new PromptBuilder()
      .system(`You are an expert QA engineer. Generate comprehensive ${strategy} tests using ${framework}.`)
      .user(`Generate ${strategy} tests for this code:

**Strategy**: ${strategyPrompts[strategy]}

**Code**:
\`\`\`
{{code}}
\`\`\`

Include:
- Test cases with descriptive names
- Comprehensive assertions
- Setup and teardown as needed
- Coverage of all functions, branches, and edge cases
- Clear documentation

Return JSON with:
- tests: array of test objects with name, description, code, assertions
- coverage: what functions/branches/edgeCases are tested
- dependencies: required testing libraries
- executionOrder: if tests must run in specific order`)
      .variable('code', code)
      .expectJSON({
        type: 'object',
        properties: {
          tests: { type: 'array' },
          coverage: { type: 'object' },
          dependencies: { type: 'array' },
          executionOrder: { type: 'array' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Test generation failed: ${response.error}`);
    }

    const result = response.data as Omit<TestSuite, 'strategy' | 'framework'>;

    return {
      strategy,
      framework,
      ...result,
    };
  }

  // ========================================================================
  // Coverage Analysis
  // ========================================================================

  /**
   * Validate and analyze test coverage
   */
  async validateTestCoverage(projectPath: string): Promise<CoverageAnalysis> {
    // Scan for test files and source files
    const files = await this.scanProjectFiles(projectPath);

    const prompt = new PromptBuilder()
      .system('You are an expert at analyzing test coverage. Identify gaps and provide recommendations.')
      .user(`Analyze test coverage for this project:

**Source Files**: {{sourceFiles}}
**Test Files**: {{testFiles}}

Analyze:
1. Overall coverage metrics (statements, branches, functions, lines)
2. Per-file coverage breakdown
3. Coverage gaps and untested code
4. Priority recommendations for improving coverage

Return JSON with:
- overallCoverage: aggregate metrics
- filesCoverage: per-file breakdown
- gaps: specific untested areas with priority
- recommendations: actionable improvements`)
      .variable('sourceFiles', files.source.join('\n'))
      .variable('testFiles', files.tests.join('\n'))
      .expectJSON({
        type: 'object',
        properties: {
          overallCoverage: { type: 'object' },
          filesCoverage: { type: 'array' },
          gaps: { type: 'array' },
          recommendations: { type: 'array' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Coverage analysis failed: ${response.error}`);
    }

    const result = response.data as Omit<CoverageAnalysis, 'projectPath'>;

    return {
      projectPath,
      ...result,
    };
  }

  // ========================================================================
  // Edge Case Identification
  // ========================================================================

  /**
   * Find edge cases for a specification
   */
  async findEdgeCases(spec: EdgeCaseSpec): Promise<EdgeCaseAnalysis> {
    const prompt = new PromptBuilder()
      .system('You are an expert at identifying edge cases and boundary conditions in software testing.')
      .user(`Identify edge cases for this function:

**Function**: {{function}}
**Input Types**: {{inputTypes}}
**Constraints**: {{constraints}}
**Expected Behavior**: {{expectedBehavior}}

Find edge cases in these categories:
1. Boundary values (min, max, zero, infinity)
2. Null/undefined/empty inputs
3. Invalid/malformed inputs
4. Overflow/underflow conditions
5. Concurrent access scenarios
6. Exceptional conditions

For each edge case, provide:
- Category
- Description
- Input value
- Expected output
- Reasoning why this is important
- Priority level

Return JSON with:
- cases: array of edge cases
- testCode: complete test suite for all cases
- executionStrategy: how to run these tests effectively`)
      .variable('function', spec.function)
      .variable('inputTypes', spec.inputTypes.join(', '))
      .variable('constraints', spec.constraints.join(', '))
      .variable('expectedBehavior', spec.expectedBehavior)
      .expectJSON({
        type: 'object',
        properties: {
          cases: { type: 'array' },
          testCode: { type: 'string' },
          executionStrategy: { type: 'string' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Edge case analysis failed: ${response.error}`);
    }

    return response.data as EdgeCaseAnalysis;
  }

  // ========================================================================
  // Test Data Generation
  // ========================================================================

  /**
   * Generate test data based on schema
   */
  async generateTestData(schema: TestDataSchema, count: number = 10): Promise<GeneratedTestData> {
    const prompt = new PromptBuilder()
      .system('You are an expert at generating realistic, diverse test data.')
      .user(`Generate test data for this schema:

**Fields**:
{{fields}}

{{relationships}}

Generate ${count} diverse, realistic records that:
1. Cover common scenarios
2. Include edge cases
3. Respect constraints
4. Maintain relationships

Create multiple datasets:
- Happy path data
- Edge case data
- Invalid data (for negative tests)

Return JSON with:
- datasets: array of { name, purpose, data, count }
- fixtures: code to load this data
- seedScript: optional script to seed database`)
      .variable('fields', schema.fields.map(f =>
        `- ${f.name} (${f.type})${f.constraints ? `: ${f.constraints.join(', ')}` : ''}`
      ).join('\n'))
      .variable('relationships', schema.relationships ?
        `\n**Relationships**:\n${schema.relationships.map(r =>
          `- ${r.from} → ${r.to} (${r.type})`
        ).join('\n')}` : '')
      .expectJSON({
        type: 'object',
        properties: {
          datasets: { type: 'array' },
          fixtures: { type: 'string' },
          seedScript: { type: 'string' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Test data generation failed: ${response.error}`);
    }

    const result = response.data as Omit<GeneratedTestData, 'schema'>;

    return {
      schema,
      ...result,
    };
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  /**
   * Scan project for source and test files
   */
  private async scanProjectFiles(projectPath: string): Promise<{ source: string[]; tests: string[] }> {
    const source: string[] = [];
    const tests: string[] = [];

    async function scan(dir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
              if (entry.name.includes('.test.') || entry.name.includes('.spec.')) {
                tests.push(fullPath);
              } else {
                source.push(fullPath);
              }
            }
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    }

    await scan(projectPath);

    return { source, tests };
  }
}

/**
 * Create a new tester agent instance
 */
export function createTesterAgent(config: TesterAgentConfig): TesterAgent {
  return new TesterAgent(config);
}
