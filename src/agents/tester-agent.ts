/**
 * Tester Agent
 *
 * Specialized agent for test generation, coverage analysis, and test improvement.
 * Extends BaseAgent with support for vitest/jest testing frameworks.
 *
 * @module agents/tester-agent
 */

import * as path from 'path';
import { BaseAgent } from './base-agent.js';
import {
  AgentType,
  type AgentTask,
  type AgentResult,
  type TesterAgentConfig,
  type ResultArtifact,
} from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Test framework type
 */
export type TestFramework = 'vitest' | 'jest';

/**
 * Test type
 */
export type TestType = 'unit' | 'integration' | 'e2e' | 'snapshot';

/**
 * Test generation request
 */
export interface TestGenerationRequest {
  /** Source code to test */
  sourceCode: string;
  /** Source file path */
  sourcePath: string;
  /** Target test framework */
  framework: TestFramework;
  /** Types of tests to generate */
  testTypes?: TestType[];
  /** Include edge cases */
  includeEdgeCases?: boolean;
  /** Include error scenarios */
  includeErrorCases?: boolean;
  /** Coverage target percentage */
  coverageTarget?: number;
}

/**
 * Generated test suite
 */
export interface GeneratedTestSuite {
  /** Test file content */
  code: string;
  /** Test file path */
  path: string;
  /** Number of test cases */
  testCount: number;
  /** Estimated coverage */
  estimatedCoverage: number;
  /** Test categories */
  categories: string[];
  /** Import statements */
  imports: string[];
}

/**
 * Test case definition
 */
export interface TestCase {
  /** Test name/description */
  name: string;
  /** Test type */
  type: TestType;
  /** Test category */
  category: string;
  /** Test code */
  code: string;
  /** Setup required */
  setup?: string;
  /** Assertions */
  assertions: string[];
}

/**
 * Coverage metrics
 */
export interface CoverageMetrics {
  /** Line coverage percentage */
  lines: number;
  /** Branch coverage percentage */
  branches: number;
  /** Function coverage percentage */
  functions: number;
  /** Statement coverage percentage */
  statements: number;
  /** Uncovered lines */
  uncoveredLines: number[];
  /** Uncovered functions */
  uncoveredFunctions: string[];
}

/**
 * Coverage analysis result
 */
export interface CoverageAnalysis {
  /** Source file */
  sourceFile: string;
  /** Test file */
  testFile?: string;
  /** Coverage metrics */
  metrics: CoverageMetrics;
  /** Coverage gaps */
  gaps: CoverageGap[];
  /** Recommendations */
  recommendations: string[];
}

/**
 * Coverage gap identification
 */
export interface CoverageGap {
  /** Type of gap */
  type: 'function' | 'branch' | 'line' | 'edge-case';
  /** Location in source */
  location: { start: number; end: number };
  /** Description of what's not covered */
  description: string;
  /** Priority (1-10) */
  priority: number;
  /** Suggested test to add */
  suggestedTest?: string;
}

/**
 * Test suggestion
 */
export interface TestSuggestion {
  /** Suggestion type */
  type: 'add' | 'improve' | 'remove' | 'refactor';
  /** Target test or function */
  target: string;
  /** Description */
  description: string;
  /** Priority (1-10) */
  priority: number;
  /** Sample code */
  sampleCode?: string;
}

/**
 * Tester task type
 */
export type TesterTaskType = 'generate' | 'coverage' | 'suggest' | 'analyze';

// ============================================================================
// Tester Agent
// ============================================================================

/**
 * Tester Agent
 *
 * Capabilities:
 * - Test generation from source code
 * - Coverage analysis and gap detection
 * - Test improvement suggestions
 * - Support for vitest and jest
 *
 * @example
 * ```typescript
 * const tester = new TesterAgent({
 *   name: 'tester-agent',
 *   type: AgentType.TESTER,
 *   testFramework: 'vitest',
 * });
 *
 * const result = await tester.execute({
 *   id: 'task-1',
 *   description: 'Generate tests for UserService',
 *   priority: TaskPriority.MEDIUM,
 *   input: {
 *     data: {
 *       sourceCode: '...',
 *       sourcePath: 'src/user-service.ts',
 *       framework: 'vitest',
 *       includeEdgeCases: true
 *     }
 *   },
 *   createdAt: new Date()
 * });
 * ```
 */
export class TesterAgent extends BaseAgent {
  constructor(config: Partial<TesterAgentConfig> & { name: string }) {
    super({
      type: AgentType.TESTER,
      taskTimeout: 180000, // 3 minutes
      capabilities: ['test-generation', 'coverage-analysis'],
      ...config,
    });
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  /**
   * Execute tester task
   */
  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    const taskType = (task.input?.parameters?.taskType as TesterTaskType) || 'generate';

    switch (taskType) {
      case 'generate':
        return this.handleGenerateTask(task, startTime);
      case 'coverage':
        return this.handleCoverageTask(task, startTime);
      case 'suggest':
        return this.handleSuggestTask(task, startTime);
      case 'analyze':
        return this.handleAnalyzeTask(task, startTime);
      default:
        return this.createErrorResult(
          'INVALID_TASK_TYPE',
          `Unknown task type: ${taskType}`,
          startTime
        );
    }
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  /**
   * Generate tests from source code
   */
  async generateTests(request: TestGenerationRequest): Promise<GeneratedTestSuite> {
    this.logger.info('Generating tests', {
      file: request.sourcePath,
      framework: request.framework,
    });

    const analysis = this.analyzeSourceCode(request.sourceCode);
    const testCases: TestCase[] = [];

    for (const func of analysis.functions) {
      testCases.push(...this.generateFunctionTests(func, request));
    }

    for (const cls of analysis.classes) {
      testCases.push(...this.generateClassTests(cls, request));
    }

    if (request.includeEdgeCases) {
      testCases.push(...this.generateEdgeCaseTests(analysis, request));
    }

    if (request.includeErrorCases) {
      testCases.push(...this.generateErrorCaseTests(analysis, request));
    }

    return this.buildTestSuite(testCases, request);
  }

  /**
   * Analyze test coverage
   */
  async analyzeTestCoverage(
    sourceCode: string,
    sourcePath: string,
    testCode?: string
  ): Promise<CoverageAnalysis> {
    this.logger.info('Analyzing test coverage', { file: sourcePath });

    const analysis = this.analyzeSourceCode(sourceCode);
    const gaps: CoverageGap[] = [];
    const recommendations: string[] = [];

    let testedFunctions = 0;
    let testedBranches = 0;
    let testedLines = 0;

    if (testCode) {
      for (const func of analysis.functions) {
        if (testCode.includes(func.name) || testCode.includes(`'${func.name}'`)) {
          testedFunctions++;
        } else {
          gaps.push({
            type: 'function',
            location: { start: func.line, end: func.line },
            description: `Function '${func.name}' is not tested`,
            priority: 8,
            suggestedTest: this.generateTestStub(func.name, 'function'),
          });
        }
      }

      for (const branch of analysis.branches) {
        if (testCode.includes(branch.condition)) {
          testedBranches++;
        } else {
          gaps.push({
            type: 'branch',
            location: { start: branch.line, end: branch.line },
            description: `Branch '${branch.type}' at line ${branch.line} needs testing`,
            priority: 6,
          });
        }
      }

      testedLines = Math.min(
        analysis.lines,
        Math.round((testedFunctions / Math.max(1, analysis.functions.length)) * analysis.lines)
      );
    } else {
      for (const func of analysis.functions) {
        gaps.push({
          type: 'function',
          location: { start: func.line, end: func.line },
          description: `Function '${func.name}' is not tested`,
          priority: 8,
          suggestedTest: this.generateTestStub(func.name, 'function'),
        });
      }
      recommendations.push('Create a test file for this source file');
    }

    const metrics: CoverageMetrics = {
      lines: analysis.lines > 0 ? Math.round((testedLines / analysis.lines) * 100) : 0,
      branches: analysis.branches.length > 0
        ? Math.round((testedBranches / analysis.branches.length) * 100)
        : 100,
      functions: analysis.functions.length > 0
        ? Math.round((testedFunctions / analysis.functions.length) * 100)
        : 100,
      statements: analysis.lines > 0 ? Math.round((testedLines / analysis.lines) * 100) : 0,
      uncoveredLines: [],
      uncoveredFunctions: analysis.functions
        .filter(f => !testCode?.includes(f.name))
        .map(f => f.name),
    };

    if (metrics.functions < 80) {
      recommendations.push(
        `Increase function coverage from ${metrics.functions}% to at least 80%`
      );
    }
    if (metrics.branches < 70) {
      recommendations.push(
        `Improve branch coverage from ${metrics.branches}% to at least 70%`
      );
    }
    if (gaps.length > 0) {
      recommendations.push(
        `Address ${gaps.length} coverage gap(s) identified`
      );
    }

    return {
      sourceFile: sourcePath,
      testFile: testCode ? sourcePath.replace(/\.ts$/, '.test.ts') : undefined,
      metrics,
      gaps: gaps.sort((a, b) => b.priority - a.priority),
      recommendations,
    };
  }

  /**
   * Suggest test improvements
   */
  async suggestTestCases(
    sourceCode: string,
    testCode: string,
    sourcePath: string
  ): Promise<TestSuggestion[]> {
    this.logger.info('Analyzing tests for improvements', { file: sourcePath });

    const suggestions: TestSuggestion[] = [];
    const sourceAnalysis = this.analyzeSourceCode(sourceCode);
    const testAnalysis = this.analyzeTestCode(testCode);

    for (const func of sourceAnalysis.functions) {
      const hasTest = testAnalysis.testedItems.includes(func.name);
      if (!hasTest) {
        suggestions.push({
          type: 'add',
          target: func.name,
          description: `Add tests for function '${func.name}'`,
          priority: 8,
          sampleCode: this.generateTestStub(func.name, 'function'),
        });
      }
    }

    for (const func of sourceAnalysis.functions) {
      const hasEdgeTests = testAnalysis.edgeCases.some(
        ec => ec.includes(func.name)
      );
      if (!hasEdgeTests && func.hasParameters) {
        suggestions.push({
          type: 'add',
          target: func.name,
          description: `Add edge case tests for '${func.name}' (null, undefined, empty values)`,
          priority: 6,
          sampleCode: this.generateEdgeCaseStub(func.name),
        });
      }
    }

    for (const func of sourceAnalysis.functions) {
      const hasErrorTests = testAnalysis.errorTests.some(
        et => et.includes(func.name)
      );
      if (!hasErrorTests && func.hasErrorHandling) {
        suggestions.push({
          type: 'add',
          target: func.name,
          description: `Add error handling tests for '${func.name}'`,
          priority: 7,
          sampleCode: this.generateErrorTestStub(func.name),
        });
      }
    }

    for (const test of testAnalysis.tests) {
      if (test.assertions === 0) {
        suggestions.push({
          type: 'improve',
          target: test.name,
          description: `Test '${test.name}' has no assertions`,
          priority: 9,
        });
      }
      if (test.assertions === 1) {
        suggestions.push({
          type: 'improve',
          target: test.name,
          description: `Consider adding more assertions to '${test.name}'`,
          priority: 4,
        });
      }
    }

    const testNames = testAnalysis.tests.map(t => t.name);
    const duplicates = testNames.filter(
      (name, index) => testNames.indexOf(name) !== index
    );
    for (const dup of [...new Set(duplicates)]) {
      suggestions.push({
        type: 'remove',
        target: dup,
        description: `Remove duplicate test '${dup}'`,
        priority: 5,
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  // ==========================================================================
  // Private Task Handlers
  // ==========================================================================

  private async handleGenerateTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<GeneratedTestSuite>> {
    const request = task.input?.data as TestGenerationRequest | undefined;

    if (!request?.sourceCode) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Test generation request with source code is required',
        startTime
      ) as AgentResult<GeneratedTestSuite>;
    }

    try {
      const suite = await this.generateTests(request);
      const artifacts: ResultArtifact[] = [{
        type: 'code',
        name: path.basename(suite.path),
        content: suite.code,
        mimeType: 'text/typescript',
      }];

      return this.createSuccessResult(suite, startTime, artifacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('GENERATION_ERROR', `Test generation failed: ${message}`, startTime) as AgentResult<GeneratedTestSuite>;
    }
  }

  private async handleCoverageTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<CoverageAnalysis>> {
    const input = task.input?.data as {
      sourceCode: string;
      sourcePath: string;
      testCode?: string;
    } | undefined;

    if (!input?.sourceCode) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Source code and path are required for coverage analysis',
        startTime
      ) as AgentResult<CoverageAnalysis>;
    }

    try {
      const analysis = await this.analyzeTestCoverage(
        input.sourceCode,
        input.sourcePath,
        input.testCode
      );
      return this.createSuccessResult(analysis, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('COVERAGE_ERROR', `Coverage analysis failed: ${message}`, startTime) as AgentResult<CoverageAnalysis>;
    }
  }

  private async handleSuggestTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<TestSuggestion[]>> {
    const input = task.input?.data as {
      sourceCode: string;
      testCode: string;
      sourcePath: string;
    } | undefined;

    if (!input?.sourceCode || !input?.testCode) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Source code and test code are required',
        startTime
      ) as AgentResult<TestSuggestion[]>;
    }

    try {
      const suggestions = await this.suggestTestCases(
        input.sourceCode,
        input.testCode,
        input.sourcePath
      );
      return this.createSuccessResult(suggestions, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('SUGGESTION_ERROR', `Test suggestion failed: ${message}`, startTime) as AgentResult<TestSuggestion[]>;
    }
  }

  private async handleAnalyzeTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<{ coverage: CoverageAnalysis; suggestions: TestSuggestion[] }>> {
    const input = task.input?.data as {
      sourceCode: string;
      sourcePath: string;
      testCode?: string;
    } | undefined;

    if (!input?.sourceCode) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Source code is required for analysis',
        startTime
      ) as AgentResult<{ coverage: CoverageAnalysis; suggestions: TestSuggestion[] }>;
    }

    try {
      const coverage = await this.analyzeTestCoverage(
        input.sourceCode,
        input.sourcePath,
        input.testCode
      );

      const suggestions = input.testCode
        ? await this.suggestTestCases(input.sourceCode, input.testCode, input.sourcePath)
        : [];

      return this.createSuccessResult({ coverage, suggestions }, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('ANALYSIS_ERROR', `Test analysis failed: ${message}`, startTime) as AgentResult<{ coverage: CoverageAnalysis; suggestions: TestSuggestion[] }>;
    }
  }

  // ==========================================================================
  // Source Code Analysis
  // ==========================================================================

  private analyzeSourceCode(code: string): {
    functions: Array<{
      name: string;
      line: number;
      params: string[];
      hasParameters: boolean;
      hasErrorHandling: boolean;
      isAsync: boolean;
    }>;
    classes: Array<{
      name: string;
      line: number;
      methods: string[];
    }>;
    branches: Array<{
      type: 'if' | 'switch' | 'ternary';
      line: number;
      condition: string;
    }>;
    lines: number;
  } {
    const lines = code.split('\n');
    const functions: Array<{
      name: string;
      line: number;
      params: string[];
      hasParameters: boolean;
      hasErrorHandling: boolean;
      isAsync: boolean;
    }> = [];
    const classes: Array<{
      name: string;
      line: number;
      methods: string[];
    }> = [];
    const branches: Array<{
      type: 'if' | 'switch' | 'ternary';
      line: number;
      condition: string;
    }> = [];

    const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
    const arrowRegex = /(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g;
    const methodRegex = /(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*[^{]+)?\s*\{/g;

    let match;
    while ((match = funcRegex.exec(code)) !== null) {
      const lineNum = code.slice(0, match.index).split('\n').length;
      const params = match[2].split(',').map(p => p.trim()).filter(p => p);
      const funcBody = this.extractFunctionBody(code, match.index);

      functions.push({
        name: match[1],
        line: lineNum,
        params,
        hasParameters: params.length > 0,
        hasErrorHandling: /try\s*\{/.test(funcBody),
        isAsync: match[0].includes('async'),
      });
    }

    while ((match = arrowRegex.exec(code)) !== null) {
      const lineNum = code.slice(0, match.index).split('\n').length;
      const params = match[2].split(',').map(p => p.trim()).filter(p => p);
      const funcBody = this.extractFunctionBody(code, match.index);

      functions.push({
        name: match[1],
        line: lineNum,
        params,
        hasParameters: params.length > 0,
        hasErrorHandling: /try\s*\{/.test(funcBody),
        isAsync: match[0].includes('async'),
      });
    }

    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(code)) !== null) {
      const lineNum = code.slice(0, match.index).split('\n').length;
      const classBody = this.extractClassBody(code, match.index);
      const methods: string[] = [];

      let methodMatch;
      while ((methodMatch = methodRegex.exec(classBody)) !== null) {
        if (!['constructor', 'if', 'while', 'for', 'switch'].includes(methodMatch[1])) {
          methods.push(methodMatch[1]);
        }
      }

      classes.push({
        name: match[1],
        line: lineNum,
        methods,
      });
    }

    const ifRegex = /if\s*\(([^)]+)\)/g;
    while ((match = ifRegex.exec(code)) !== null) {
      const lineNum = code.slice(0, match.index).split('\n').length;
      branches.push({
        type: 'if',
        line: lineNum,
        condition: match[1],
      });
    }

    const switchRegex = /switch\s*\(([^)]+)\)/g;
    while ((match = switchRegex.exec(code)) !== null) {
      const lineNum = code.slice(0, match.index).split('\n').length;
      branches.push({
        type: 'switch',
        line: lineNum,
        condition: match[1],
      });
    }

    return {
      functions,
      classes,
      branches,
      lines: lines.filter(l => l.trim().length > 0).length,
    };
  }

  private analyzeTestCode(code: string): {
    tests: Array<{ name: string; assertions: number }>;
    testedItems: string[];
    edgeCases: string[];
    errorTests: string[];
  } {
    const tests: Array<{ name: string; assertions: number }> = [];
    const testedItems: string[] = [];
    const edgeCases: string[] = [];
    const errorTests: string[] = [];

    const testRegex = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = testRegex.exec(code)) !== null) {
      const testName = match[1];
      const testBody = this.extractTestBody(code, match.index);
      const assertions = (testBody.match(/expect\s*\(/g) || []).length;

      tests.push({ name: testName, assertions });

      const identifiers = testBody.match(/\b[a-zA-Z_]\w*\b/g) || [];
      testedItems.push(...identifiers);

      if (
        testName.toLowerCase().includes('edge') ||
        testName.toLowerCase().includes('empty') ||
        testName.toLowerCase().includes('null') ||
        testName.toLowerCase().includes('undefined') ||
        testBody.includes('null') ||
        testBody.includes('undefined') ||
        testBody.includes('[]') ||
        testBody.includes("''")
      ) {
        edgeCases.push(testName);
      }

      if (
        testName.toLowerCase().includes('error') ||
        testName.toLowerCase().includes('throw') ||
        testName.toLowerCase().includes('fail') ||
        testBody.includes('toThrow') ||
        testBody.includes('rejects')
      ) {
        errorTests.push(testName);
      }
    }

    return {
      tests,
      testedItems: [...new Set(testedItems)],
      edgeCases,
      errorTests,
    };
  }

  // ==========================================================================
  // Test Generation Methods
  // ==========================================================================

  private generateFunctionTests(
    func: { name: string; params: string[]; isAsync: boolean; hasErrorHandling: boolean },
    request: TestGenerationRequest
  ): TestCase[] {
    const testCases: TestCase[] = [];

    testCases.push({
      name: `should execute ${func.name} successfully`,
      type: 'unit',
      category: 'happy-path',
      code: this.generateHappyPathTest(func),
      assertions: ['expect(result).toBeDefined()'],
    });

    if (func.params.length > 0) {
      for (const param of func.params) {
        testCases.push({
          name: `should handle ${param} parameter correctly`,
          type: 'unit',
          category: 'parameter-validation',
          code: this.generateParamTest(func.name, param),
          assertions: [`expect result for ${param}`],
        });
      }
    }

    return testCases;
  }

  private generateClassTests(
    cls: { name: string; methods: string[] },
    request: TestGenerationRequest
  ): TestCase[] {
    const testCases: TestCase[] = [];

    testCases.push({
      name: `should create ${cls.name} instance`,
      type: 'unit',
      category: 'instantiation',
      code: `    const instance = new ${cls.name}();\n    expect(instance).toBeInstanceOf(${cls.name});`,
      setup: `let instance: ${cls.name};`,
      assertions: [`expect(instance).toBeInstanceOf(${cls.name})`],
    });

    for (const method of cls.methods) {
      testCases.push({
        name: `should call ${method} method`,
        type: 'unit',
        category: 'method',
        code: this.generateMethodTest(cls.name, method),
        assertions: [`expect(result).toBeDefined()`],
      });
    }

    return testCases;
  }

  private generateEdgeCaseTests(
    analysis: ReturnType<typeof this.analyzeSourceCode>,
    request: TestGenerationRequest
  ): TestCase[] {
    const testCases: TestCase[] = [];

    for (const func of analysis.functions) {
      if (func.hasParameters) {
        testCases.push({
          name: `should handle null input for ${func.name}`,
          type: 'unit',
          category: 'edge-case',
          code: this.generateNullTest(func.name),
          assertions: ['expect behavior with null'],
        });

        testCases.push({
          name: `should handle empty input for ${func.name}`,
          type: 'unit',
          category: 'edge-case',
          code: this.generateEmptyTest(func.name),
          assertions: ['expect behavior with empty'],
        });
      }
    }

    return testCases;
  }

  private generateErrorCaseTests(
    analysis: ReturnType<typeof this.analyzeSourceCode>,
    request: TestGenerationRequest
  ): TestCase[] {
    const testCases: TestCase[] = [];

    for (const func of analysis.functions) {
      if (func.hasErrorHandling) {
        testCases.push({
          name: `should handle errors in ${func.name}`,
          type: 'unit',
          category: 'error-handling',
          code: this.generateErrorTest(func.name, func.isAsync),
          assertions: ['expect error handling'],
        });
      }
    }

    return testCases;
  }

  // ==========================================================================
  // Test Code Generation Helpers
  // ==========================================================================

  private generateHappyPathTest(
    func: { name: string; isAsync: boolean }
  ): string {
    if (func.isAsync) {
      return `    const result = await ${func.name}();\n    expect(result).toBeDefined();`;
    }
    return `    const result = ${func.name}();\n    expect(result).toBeDefined();`;
  }

  private generateParamTest(funcName: string, param: string): string {
    return `    const testValue = 'test-${param}';\n    const result = ${funcName}(testValue);\n    expect(result).toBeDefined();`;
  }

  private generateMethodTest(className: string, method: string): string {
    return `    const instance = new ${className}();\n    const result = instance.${method}();\n    expect(result).toBeDefined();`;
  }

  private generateNullTest(funcName: string): string {
    return `    expect(() => ${funcName}(null)).not.toThrow();`;
  }

  private generateEmptyTest(funcName: string): string {
    return `    const result = ${funcName}('');\n    expect(result).toBeDefined();`;
  }

  private generateErrorTest(funcName: string, isAsync: boolean): string {
    if (isAsync) {
      return `    await expect(${funcName}(invalidInput)).rejects.toThrow();`;
    }
    return `    expect(() => ${funcName}(invalidInput)).toThrow();`;
  }

  private generateTestStub(name: string, type: 'function' | 'class'): string {
    if (type === 'function') {
      return `  it('should test ${name}', () => {\n    const result = ${name}();\n    expect(result).toBeDefined();\n  });`;
    }
    return `  it('should create ${name} instance', () => {\n    const instance = new ${name}();\n    expect(instance).toBeInstanceOf(${name});\n  });`;
  }

  private generateEdgeCaseStub(funcName: string): string {
    return `  it('should handle edge cases for ${funcName}', () => {\n    expect(${funcName}(null)).toBeDefined();\n    expect(${funcName}(undefined)).toBeDefined();\n    expect(${funcName}('')).toBeDefined();\n  });`;
  }

  private generateErrorTestStub(funcName: string): string {
    return `  it('should handle errors in ${funcName}', () => {\n    expect(() => ${funcName}(invalidInput)).toThrow();\n  });`;
  }

  // ==========================================================================
  // Test Suite Building
  // ==========================================================================

  private buildTestSuite(
    testCases: TestCase[],
    request: TestGenerationRequest
  ): GeneratedTestSuite {
    const isVitest = request.framework === 'vitest';
    const moduleName = path.basename(request.sourcePath, path.extname(request.sourcePath));
    const imports = this.buildImports(request, moduleName);

    let code = '';
    code += imports.join('\n') + '\n\n';

    const byCategory = new Map<string, TestCase[]>();
    for (const test of testCases) {
      if (!byCategory.has(test.category)) {
        byCategory.set(test.category, []);
      }
      byCategory.get(test.category)!.push(test);
    }

    code += `describe('${moduleName}', () => {\n`;

    for (const [category, tests] of byCategory) {
      code += `  describe('${category}', () => {\n`;

      for (const test of tests) {
        if (test.setup) {
          code += `    ${test.setup}\n\n`;
        }

        code += `    it('${test.name}', ${test.code.includes('await') ? 'async ' : ''}() => {\n`;
        code += test.code.split('\n').map(l => `  ${l}`).join('\n') + '\n';
        code += `    });\n\n`;
      }

      code += `  });\n\n`;
    }

    code += '});\n';

    const estimatedCoverage = Math.min(
      100,
      Math.round((testCases.length / Math.max(1, testCases.length)) * 80)
    );

    return {
      code,
      path: request.sourcePath.replace(/\.(ts|tsx|js|jsx)$/, `.test.$1`),
      testCount: testCases.length,
      estimatedCoverage,
      categories: [...byCategory.keys()],
      imports,
    };
  }

  private buildImports(request: TestGenerationRequest, moduleName: string): string[] {
    const imports: string[] = [];
    const isVitest = request.framework === 'vitest';

    if (isVitest) {
      imports.push("import { describe, it, expect, beforeEach, afterEach } from 'vitest';");
    } else {
      imports.push("import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';");
    }

    imports.push(`import { /* exports */ } from './${moduleName}';`);

    return imports;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private extractFunctionBody(code: string, startIndex: number): string {
    let braceCount = 0;
    let inBody = false;
    let bodyStart = startIndex;
    let bodyEnd = startIndex;

    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') {
        if (!inBody) {
          bodyStart = i;
          inBody = true;
        }
        braceCount++;
      } else if (code[i] === '}') {
        braceCount--;
        if (inBody && braceCount === 0) {
          bodyEnd = i + 1;
          break;
        }
      }
    }

    return code.slice(bodyStart, bodyEnd);
  }

  private extractClassBody(code: string, startIndex: number): string {
    return this.extractFunctionBody(code, startIndex);
  }

  private extractTestBody(code: string, startIndex: number): string {
    let parenCount = 0;
    let inTest = false;
    let bodyStart = startIndex;

    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '(') {
        parenCount++;
        inTest = true;
      } else if (code[i] === ')') {
        parenCount--;
        if (inTest && parenCount === 0) {
          return code.slice(bodyStart, i + 1);
        }
      }
    }

    return code.slice(bodyStart, Math.min(bodyStart + 500, code.length));
  }
}

