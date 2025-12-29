/**
 * Coder Agent
 *
 * Specialized agent for code generation, refactoring suggestions, and optimization.
 * Extends BaseAgent with TDD-oriented approach and knowledge graph integration.
 *
 * @module agents/coder-agent
 */
import { BaseAgent } from './base-agent.js';
import { type AgentTask, type AgentResult, type CoderAgentConfig } from './types.js';
/**
 * Code generation request
 */
export interface CodeGenerationRequest {
    /** Description of what to generate */
    description: string;
    /** Target language */
    language: 'typescript' | 'javascript';
    /** Target file path (optional) */
    targetPath?: string;
    /** Whether to include tests */
    includeTests?: boolean;
    /** Whether to include JSDoc */
    includeJsdoc?: boolean;
    /** Template to use */
    template?: 'class' | 'function' | 'module' | 'component' | 'service';
    /** Context from existing code */
    context?: string;
}
/**
 * Generated code output
 */
export interface GeneratedCode {
    /** Generated source code */
    code: string;
    /** Target file path */
    path: string;
    /** Generated test code (if requested) */
    testCode?: string;
    /** Test file path (if tests generated) */
    testPath?: string;
    /** Imports required */
    imports: string[];
    /** Exports provided */
    exports: string[];
    /** Dependencies to add */
    dependencies?: string[];
}
/**
 * Refactoring suggestion
 */
export interface RefactoringSuggestion {
    /** Type of refactoring */
    type: 'extract-function' | 'extract-class' | 'rename' | 'inline' | 'move' | 'simplify' | 'modernize' | 'remove-duplication';
    /** Affected file */
    file: string;
    /** Line range */
    lineRange: {
        start: number;
        end: number;
    };
    /** Current code */
    currentCode: string;
    /** Suggested code */
    suggestedCode: string;
    /** Explanation */
    explanation: string;
    /** Priority (1-10) */
    priority: number;
    /** Estimated complexity reduction */
    complexityReduction?: number;
}
/**
 * Complexity metrics for code
 */
export interface ComplexityMetrics {
    /** Cyclomatic complexity */
    cyclomatic: number;
    /** Cognitive complexity */
    cognitive: number;
    /** Lines of code */
    linesOfCode: number;
    /** Number of functions */
    functionCount: number;
    /** Average function length */
    avgFunctionLength: number;
    /** Maximum nesting depth */
    maxNestingDepth: number;
    /** Maintainability index (0-100) */
    maintainabilityIndex: number;
}
/**
 * Code analysis result
 */
export interface CodeAnalysisResult {
    /** File analyzed */
    file: string;
    /** Complexity metrics */
    complexity: ComplexityMetrics;
    /** Refactoring suggestions */
    suggestions: RefactoringSuggestion[];
    /** Detected patterns */
    patterns: string[];
}
/**
 * Coder task type
 */
export type CoderTaskType = 'generate' | 'refactor' | 'analyze' | 'optimize';
/**
 * Coder Agent
 *
 * Capabilities:
 * - Code generation from descriptions
 * - Refactoring suggestions
 * - Complexity analysis
 * - TDD-oriented development support
 *
 * @example
 * ```typescript
 * const coder = new CoderAgent({
 *   name: 'coder-agent',
 *   type: AgentType.CODER,
 *   language: 'typescript',
 * });
 *
 * const result = await coder.execute({
 *   id: 'task-1',
 *   description: 'Generate User service with CRUD operations',
 *   priority: TaskPriority.MEDIUM,
 *   input: {
 *     data: {
 *       description: 'User service with CRUD operations',
 *       language: 'typescript',
 *       template: 'service',
 *       includeTests: true
 *     }
 *   },
 *   createdAt: new Date()
 * });
 * ```
 */
export declare class CoderAgent extends BaseAgent {
    constructor(config: Partial<CoderAgentConfig> & {
        name: string;
    });
    /**
     * Execute coder task
     */
    protected executeTask(task: AgentTask): Promise<AgentResult>;
    /**
     * Generate code from description
     */
    generateCode(request: CodeGenerationRequest): Promise<GeneratedCode>;
    /**
     * Suggest refactoring for code
     */
    suggestRefactoring(code: string, filePath: string): Promise<RefactoringSuggestion[]>;
    /**
     * Analyze code complexity
     */
    analyzeComplexity(code: string, filePath: string): Promise<ComplexityMetrics>;
    private handleGenerateTask;
    private handleRefactorTask;
    private handleAnalyzeTask;
    private handleOptimizeTask;
    private generateClass;
    private generateFunction;
    private generateModule;
    private generateComponent;
    private generateService;
    private generateClassTest;
    private generateFunctionTest;
    private generateServiceTest;
    private findLongFunctions;
    private findDuplicateCode;
    private findModernizationOpportunities;
    private findComplexityIssues;
    private calculateCyclomaticComplexity;
    private calculateCognitiveComplexity;
    private countFunctions;
    private calculateAverageFunctionLength;
    private calculateMaxNestingDepth;
    private detectPatterns;
    private toClassName;
    private toFunctionName;
    private toModuleName;
    private toFileName;
    private toKebabCase;
    private extractEntityName;
}
//# sourceMappingURL=coder-agent.d.ts.map