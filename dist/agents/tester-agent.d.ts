/**
 * Tester Agent
 *
 * Specialized agent for test generation, coverage analysis, and test improvement.
 * Extends BaseAgent with support for vitest/jest testing frameworks.
 *
 * @module agents/tester-agent
 */
import { BaseAgent } from './base-agent.js';
import { type AgentTask, type AgentResult, type TesterAgentConfig } from './types.js';
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
    location: {
        start: number;
        end: number;
    };
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
export declare class TesterAgent extends BaseAgent {
    constructor(config: Partial<TesterAgentConfig> & {
        name: string;
    });
    /**
     * Execute tester task
     */
    protected executeTask(task: AgentTask): Promise<AgentResult>;
    /**
     * Generate tests from source code
     */
    generateTests(request: TestGenerationRequest): Promise<GeneratedTestSuite>;
    /**
     * Analyze test coverage
     */
    analyzeTestCoverage(sourceCode: string, sourcePath: string, testCode?: string): Promise<CoverageAnalysis>;
    /**
     * Suggest test improvements
     */
    suggestTestCases(sourceCode: string, testCode: string, sourcePath: string): Promise<TestSuggestion[]>;
    private handleGenerateTask;
    private handleCoverageTask;
    private handleSuggestTask;
    private handleAnalyzeTask;
    private analyzeSourceCode;
    private analyzeTestCode;
    private generateFunctionTests;
    private generateClassTests;
    private generateEdgeCaseTests;
    private generateErrorCaseTests;
    private generateHappyPathTest;
    private generateParamTest;
    private generateMethodTest;
    private generateNullTest;
    private generateEmptyTest;
    private generateErrorTest;
    private generateTestStub;
    private generateEdgeCaseStub;
    private generateErrorTestStub;
    private buildTestSuite;
    private buildImports;
    private extractFunctionBody;
    private extractClassBody;
    private extractTestBody;
}
//# sourceMappingURL=tester-agent.d.ts.map