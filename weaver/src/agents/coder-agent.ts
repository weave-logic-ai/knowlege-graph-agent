/**
 * Coder Agent - Advanced code generation and refactoring
 *
 * Capabilities:
 * - TDD-based code generation
 * - Intelligent refactoring
 * - Performance optimization
 * - Automated test generation
 * - Code quality analysis
 *
 * @example
 * ```typescript
 * const coder = new CoderAgent({ claudeClient });
 * const code = await coder.generateCode(spec, 'typescript');
 * await coder.refactorCode('/path/to/file.ts', 'extract-method');
 * await coder.optimizePerformance('/path/to/slow.ts');
 * ```
 */

import { ClaudeClient } from './claude-client.js';
import { PromptBuilder } from './prompt-builder.js';
import type { ParsedResponse } from './types.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Code specification for generation
 */
export interface CodeSpec {
  description: string;
  inputs: Array<{ name: string; type: string; description?: string }>;
  outputs: Array<{ name: string; type: string; description?: string }>;
  requirements: string[];
  constraints?: string[];
  examples?: Array<{ input: unknown; output: unknown }>;
}

/**
 * Generated code result
 */
export interface GeneratedCode {
  code: string;
  tests: string;
  documentation: string;
  dependencies: string[];
  language: string;
  confidence: number;
}

/**
 * Refactoring strategy
 */
export type RefactoringStrategy =
  | 'extract-method'
  | 'inline-method'
  | 'rename-variable'
  | 'extract-class'
  | 'move-method'
  | 'replace-conditional'
  | 'introduce-parameter-object'
  | 'remove-duplication';

/**
 * Refactoring result
 */
export interface RefactoringResult {
  originalCode: string;
  refactoredCode: string;
  strategy: RefactoringStrategy;
  changes: Array<{
    type: 'added' | 'removed' | 'modified';
    location: string;
    description: string;
  }>;
  reasoning: string;
  testImpact: string;
}

/**
 * Performance optimization result
 */
export interface OptimizationResult {
  originalCode: string;
  optimizedCode: string;
  improvements: Array<{
    type: 'time-complexity' | 'space-complexity' | 'memory-usage' | 'algorithm';
    description: string;
    estimatedGain: string;
  }>;
  benchmarkSuggestions: string[];
  tradoffs: string[];
}

/**
 * Test generation options
 */
export interface TestGenerationOptions {
  coverage: 'basic' | 'thorough' | 'comprehensive';
  framework?: 'vitest' | 'jest' | 'mocha' | 'ava';
  includeEdgeCases?: boolean;
  includeMocks?: boolean;
}

/**
 * Generated tests result
 */
export interface GeneratedTests {
  tests: string;
  framework: string;
  coverage: Array<{
    function: string;
    scenarios: string[];
  }>;
  setupCode?: string;
  teardownCode?: string;
}

/**
 * Coder agent configuration
 */
export interface CoderAgentConfig {
  claudeClient: ClaudeClient;
  defaultLanguage?: string;
  defaultTestFramework?: string;
}

/**
 * Coder Agent - AI-powered code generation and refactoring
 */
export class CoderAgent {
  private claudeClient: ClaudeClient;
  private defaultLanguage: string;
  private defaultTestFramework: string;

  constructor(config: CoderAgentConfig) {
    this.claudeClient = config.claudeClient;
    this.defaultLanguage = config.defaultLanguage ?? 'typescript';
    this.defaultTestFramework = config.defaultTestFramework ?? 'vitest';
  }

  // ========================================================================
  // Code Generation
  // ========================================================================

  /**
   * Generate code from specification using TDD approach
   */
  async generateCode(spec: CodeSpec, language: string = this.defaultLanguage): Promise<GeneratedCode> {
    const prompt = new PromptBuilder()
      .system(`You are an expert ${language} developer who follows TDD (Test-Driven Development) principles.
Generate clean, maintainable, well-documented code with comprehensive tests.`)
      .user(`Generate ${language} code for this specification:

**Description**: {{description}}

**Inputs**:
{{inputs}}

**Outputs**:
{{outputs}}

**Requirements**:
{{requirements}}

{{constraints}}

{{examples}}

Follow TDD: write tests first, then implementation.

Provide JSON with:
- code: the implementation code
- tests: comprehensive test suite
- documentation: JSDoc/docstrings and usage examples
- dependencies: array of required packages
- confidence: 0-1 score of implementation quality`)
      .variable('description', spec.description)
      .variable('inputs', spec.inputs.map(i => `- ${i.name}: ${i.type}${i.description ? ` - ${i.description}` : ''}`).join('\n'))
      .variable('outputs', spec.outputs.map(o => `- ${o.name}: ${o.type}${o.description ? ` - ${o.description}` : ''}`).join('\n'))
      .variable('requirements', spec.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n'))
      .variable('constraints', spec.constraints ? `\n**Constraints**:\n${spec.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : '')
      .variable('examples', spec.examples ? `\n**Examples**:\n${spec.examples.map((e, i) => `Example ${i + 1}:\nInput: ${JSON.stringify(e.input)}\nOutput: ${JSON.stringify(e.output)}`).join('\n\n')}` : '')
      .expectJSON({
        type: 'object',
        properties: {
          code: { type: 'string' },
          tests: { type: 'string' },
          documentation: { type: 'string' },
          dependencies: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Code generation failed: ${response.error}`);
    }

    const result = response.data as Omit<GeneratedCode, 'language'>;

    return {
      ...result,
      language,
    };
  }

  // ========================================================================
  // Code Refactoring
  // ========================================================================

  /**
   * Refactor code using specified strategy
   */
  async refactorCode(filePath: string, strategy: RefactoringStrategy): Promise<RefactoringResult> {
    // Read the file
    const code = await fs.readFile(filePath, 'utf-8');

    const strategyDescriptions: Record<RefactoringStrategy, string> = {
      'extract-method': 'Extract repeated code into reusable methods',
      'inline-method': 'Inline simple methods that are only called once',
      'rename-variable': 'Rename variables for better clarity and consistency',
      'extract-class': 'Extract related functionality into separate classes',
      'move-method': 'Move methods to more appropriate classes',
      'replace-conditional': 'Replace complex conditionals with polymorphism or strategy pattern',
      'introduce-parameter-object': 'Group related parameters into objects',
      'remove-duplication': 'Identify and eliminate code duplication',
    };

    const prompt = new PromptBuilder()
      .system('You are an expert at code refactoring. Apply refactoring patterns to improve code quality while preserving behavior.')
      .user(`Refactor this code using the "${strategy}" strategy:

**Strategy**: ${strategyDescriptions[strategy]}

**Code**:
\`\`\`
{{code}}
\`\`\`

Provide JSON with:
- refactoredCode: the improved code
- changes: array of { type, location, description } for each change
- reasoning: why these changes improve the code
- testImpact: how existing tests might need updating`)
      .variable('code', code)
      .expectJSON({
        type: 'object',
        properties: {
          refactoredCode: { type: 'string' },
          changes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['added', 'removed', 'modified'] },
                location: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
          reasoning: { type: 'string' },
          testImpact: { type: 'string' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Refactoring failed: ${response.error}`);
    }

    const result = response.data as Omit<RefactoringResult, 'originalCode' | 'strategy'>;

    return {
      originalCode: code,
      strategy,
      ...result,
    };
  }

  // ========================================================================
  // Performance Optimization
  // ========================================================================

  /**
   * Analyze and optimize code performance
   */
  async optimizePerformance(filePath: string): Promise<OptimizationResult> {
    const code = await fs.readFile(filePath, 'utf-8');

    const prompt = new PromptBuilder()
      .system('You are an expert at performance optimization. Analyze code for bottlenecks and suggest improvements.')
      .user(`Analyze and optimize this code for performance:

**Code**:
\`\`\`
{{code}}
\`\`\`

Focus on:
1. Time complexity improvements
2. Space complexity optimizations
3. Memory usage reduction
4. Better algorithms or data structures

Provide JSON with:
- optimizedCode: the performance-improved code
- improvements: array of { type, description, estimatedGain }
- benchmarkSuggestions: how to measure the improvements
- tradeoffs: any tradeoffs made (e.g., readability vs speed)`)
      .variable('code', code)
      .expectJSON({
        type: 'object',
        properties: {
          optimizedCode: { type: 'string' },
          improvements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['time-complexity', 'space-complexity', 'memory-usage', 'algorithm'] },
                description: { type: 'string' },
                estimatedGain: { type: 'string' },
              },
            },
          },
          benchmarkSuggestions: { type: 'array', items: { type: 'string' } },
          tradeoffs: { type: 'array', items: { type: 'string' } },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Optimization failed: ${response.error}`);
    }

    const result = response.data as Omit<OptimizationResult, 'originalCode'>;

    return {
      originalCode: code,
      ...result,
    };
  }

  // ========================================================================
  // Test Generation
  // ========================================================================

  /**
   * Generate comprehensive tests for existing code
   */
  async addTests(filePath: string, options: TestGenerationOptions = { coverage: 'thorough' }): Promise<GeneratedTests> {
    const code = await fs.readFile(filePath, 'utf-8');
    const framework = options.framework ?? this.defaultTestFramework;

    const coverageInstructions = {
      basic: 'Cover main functionality and happy paths',
      thorough: 'Cover main functionality, error cases, and boundary conditions',
      comprehensive: 'Cover all code paths, edge cases, error handling, and integration scenarios',
    };

    const prompt = new PromptBuilder()
      .system(`You are an expert at writing tests using ${framework}. Generate comprehensive, maintainable tests.`)
      .user(`Generate ${framework} tests for this code:

**Code**:
\`\`\`
{{code}}
\`\`\`

**Coverage Level**: ${options.coverage} - ${coverageInstructions[options.coverage]}
${options.includeEdgeCases ? '**Include**: Edge cases and boundary conditions' : ''}
${options.includeMocks ? '**Include**: Mocks for external dependencies' : ''}

Provide JSON with:
- tests: complete test suite code
- coverage: array of { function, scenarios } tested
- setupCode: any setup needed (optional)
- teardownCode: any cleanup needed (optional)`)
      .variable('code', code)
      .expectJSON({
        type: 'object',
        properties: {
          tests: { type: 'string' },
          coverage: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                function: { type: 'string' },
                scenarios: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          setupCode: { type: 'string' },
          teardownCode: { type: 'string' },
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

    const result = response.data as Omit<GeneratedTests, 'framework'>;

    return {
      ...result,
      framework,
    };
  }
}

/**
 * Create a new coder agent instance
 */
export function createCoderAgent(config: CoderAgentConfig): CoderAgent {
  return new CoderAgent(config);
}
