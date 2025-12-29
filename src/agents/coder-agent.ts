/**
 * Coder Agent
 *
 * Specialized agent for code generation, refactoring suggestions, and optimization.
 * Extends BaseAgent with TDD-oriented approach and knowledge graph integration.
 *
 * @module agents/coder-agent
 */

import * as path from 'path';
import { BaseAgent } from './base-agent.js';
import {
  AgentType,
  type AgentTask,
  type AgentResult,
  type CoderAgentConfig,
  type ResultArtifact,
} from './types.js';

// ============================================================================
// Types
// ============================================================================

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
  type:
    | 'extract-function'
    | 'extract-class'
    | 'rename'
    | 'inline'
    | 'move'
    | 'simplify'
    | 'modernize'
    | 'remove-duplication';
  /** Affected file */
  file: string;
  /** Line range */
  lineRange: { start: number; end: number };
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

// ============================================================================
// Coder Agent
// ============================================================================

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
export class CoderAgent extends BaseAgent {
  constructor(config: Partial<CoderAgentConfig> & { name: string }) {
    super({
      type: AgentType.CODER,
      taskTimeout: 180000, // 3 minutes
      capabilities: ['code-generation', 'refactoring', 'optimization'],
      ...config,
    });
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  /**
   * Execute coder task
   */
  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    const taskType = (task.input?.parameters?.taskType as CoderTaskType) || 'generate';

    switch (taskType) {
      case 'generate':
        return this.handleGenerateTask(task, startTime);
      case 'refactor':
        return this.handleRefactorTask(task, startTime);
      case 'analyze':
        return this.handleAnalyzeTask(task, startTime);
      case 'optimize':
        return this.handleOptimizeTask(task, startTime);
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
   * Generate code from description
   */
  async generateCode(request: CodeGenerationRequest): Promise<GeneratedCode> {
    this.logger.info('Generating code', {
      description: request.description.slice(0, 50),
      template: request.template,
    });

    switch (request.template) {
      case 'class':
        return this.generateClass(request);
      case 'function':
        return this.generateFunction(request);
      case 'module':
        return this.generateModule(request);
      case 'component':
        return this.generateComponent(request);
      case 'service':
        return this.generateService(request);
      default:
        return this.generateModule(request);
    }
  }

  /**
   * Suggest refactoring for code
   */
  async suggestRefactoring(code: string, filePath: string): Promise<RefactoringSuggestion[]> {
    this.logger.info('Analyzing code for refactoring', { file: filePath });

    const suggestions: RefactoringSuggestion[] = [];
    const lines = code.split('\n');

    suggestions.push(...this.findLongFunctions(code, lines, filePath));
    suggestions.push(...this.findDuplicateCode(code, lines, filePath));
    suggestions.push(...this.findModernizationOpportunities(code, lines, filePath));
    suggestions.push(...this.findComplexityIssues(code, lines, filePath));

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Analyze code complexity
   */
  async analyzeComplexity(code: string, filePath: string): Promise<ComplexityMetrics> {
    this.logger.debug('Analyzing complexity', { file: filePath });

    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(l => l.trim().length > 0);

    const cyclomatic = this.calculateCyclomaticComplexity(code);
    const cognitive = this.calculateCognitiveComplexity(code);
    const functionCount = this.countFunctions(code);
    const avgFunctionLength = this.calculateAverageFunctionLength(code);
    const maxNestingDepth = this.calculateMaxNestingDepth(code);

    const halsteadVolume = Math.log2(nonEmptyLines.length + 1) * nonEmptyLines.length;
    const maintainabilityIndex = Math.max(
      0,
      Math.min(
        100,
        171 - 5.2 * Math.log(halsteadVolume) - 0.23 * cyclomatic - 16.2 * Math.log(nonEmptyLines.length)
      )
    );

    return {
      cyclomatic,
      cognitive,
      linesOfCode: nonEmptyLines.length,
      functionCount,
      avgFunctionLength: Math.round(avgFunctionLength),
      maxNestingDepth,
      maintainabilityIndex: Math.round(maintainabilityIndex),
    };
  }

  // ==========================================================================
  // Private Task Handlers
  // ==========================================================================

  private async handleGenerateTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<GeneratedCode>> {
    const request = task.input?.data as CodeGenerationRequest | undefined;

    if (!request?.description) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Code generation request with description is required',
        startTime
      ) as AgentResult<GeneratedCode>;
    }

    try {
      const generated = await this.generateCode(request);
      const artifacts: ResultArtifact[] = [
        {
          type: 'code',
          name: path.basename(generated.path),
          content: generated.code,
          mimeType: 'text/typescript',
        },
      ];

      if (generated.testCode && generated.testPath) {
        artifacts.push({
          type: 'code',
          name: path.basename(generated.testPath),
          content: generated.testCode,
          mimeType: 'text/typescript',
        });
      }

      return this.createSuccessResult(generated, startTime, artifacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('GENERATION_ERROR', `Code generation failed: ${message}`, startTime) as AgentResult<GeneratedCode>;
    }
  }

  private async handleRefactorTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<RefactoringSuggestion[]>> {
    const input = task.input?.data as { code: string; filePath: string } | undefined;

    if (!input?.code) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Code and file path are required for refactoring',
        startTime
      ) as AgentResult<RefactoringSuggestion[]>;
    }

    try {
      const suggestions = await this.suggestRefactoring(input.code, input.filePath);
      return this.createSuccessResult(suggestions, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('REFACTOR_ERROR', `Refactoring analysis failed: ${message}`, startTime) as AgentResult<RefactoringSuggestion[]>;
    }
  }

  private async handleAnalyzeTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<CodeAnalysisResult>> {
    const input = task.input?.data as { code: string; filePath: string } | undefined;

    if (!input?.code) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Code and file path are required for analysis',
        startTime
      ) as AgentResult<CodeAnalysisResult>;
    }

    try {
      const complexity = await this.analyzeComplexity(input.code, input.filePath);
      const suggestions = await this.suggestRefactoring(input.code, input.filePath);
      const patterns = this.detectPatterns(input.code);

      return this.createSuccessResult({
        file: input.filePath,
        complexity,
        suggestions,
        patterns,
      }, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('ANALYSIS_ERROR', `Code analysis failed: ${message}`, startTime) as AgentResult<CodeAnalysisResult>;
    }
  }

  private async handleOptimizeTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<{ suggestions: RefactoringSuggestion[]; metrics: ComplexityMetrics }>> {
    const input = task.input?.data as { code: string; filePath: string } | undefined;

    if (!input?.code) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Code and file path are required for optimization',
        startTime
      ) as AgentResult<{ suggestions: RefactoringSuggestion[]; metrics: ComplexityMetrics }>;
    }

    try {
      const metrics = await this.analyzeComplexity(input.code, input.filePath);
      const allSuggestions = await this.suggestRefactoring(input.code, input.filePath);

      const optimizationSuggestions = allSuggestions.filter(
        s => s.type === 'simplify' || s.type === 'inline' || s.complexityReduction
      );

      return this.createSuccessResult({ suggestions: optimizationSuggestions, metrics }, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('OPTIMIZATION_ERROR', `Optimization analysis failed: ${message}`, startTime) as AgentResult<{ suggestions: RefactoringSuggestion[]; metrics: ComplexityMetrics }>;
    }
  }

  // ==========================================================================
  // Code Generation Methods
  // ==========================================================================

  private generateClass(request: CodeGenerationRequest): GeneratedCode {
    const className = this.toClassName(request.description);
    const isTs = request.language === 'typescript';

    let code = '';
    const imports: string[] = [];
    const exports: string[] = [className];

    if (request.includeJsdoc) {
      code += `/**\n * ${request.description}\n *\n * @class ${className}\n */\n`;
    }

    code += `export class ${className} {\n`;

    if (isTs) {
      code += `  private readonly logger: Console;\n\n`;
      code += `  constructor() {\n`;
      code += `    this.logger = console;\n`;
      code += `  }\n\n`;
    } else {
      code += `  constructor() {\n`;
      code += `    this.logger = console;\n`;
      code += `  }\n\n`;
    }

    code += `  /**\n   * Initialize the ${className}\n   */\n`;
    code += `  async initialize()${isTs ? ': Promise<void>' : ''} {\n`;
    code += `    this.logger.log('${className} initialized');\n`;
    code += `  }\n\n`;

    code += `  /**\n   * Dispose resources\n   */\n`;
    code += `  async dispose()${isTs ? ': Promise<void>' : ''} {\n`;
    code += `    this.logger.log('${className} disposed');\n`;
    code += `  }\n`;

    code += `}\n`;

    let testCode: string | undefined;
    let testPath: string | undefined;

    if (request.includeTests) {
      testCode = this.generateClassTest(className, isTs);
      testPath = request.targetPath?.replace(/\.(ts|js)$/, '.test.$1')
        || `${this.toFileName(className)}.test.${isTs ? 'ts' : 'js'}`;
    }

    return {
      code,
      path: request.targetPath || `${this.toFileName(className)}.${isTs ? 'ts' : 'js'}`,
      testCode,
      testPath,
      imports,
      exports,
    };
  }

  private generateFunction(request: CodeGenerationRequest): GeneratedCode {
    const funcName = this.toFunctionName(request.description);
    const isTs = request.language === 'typescript';

    let code = '';
    const imports: string[] = [];
    const exports: string[] = [funcName];

    if (request.includeJsdoc) {
      code += `/**\n * ${request.description}\n *\n * @param options - Configuration options\n * @returns Result of the operation\n */\n`;
    }

    if (isTs) {
      code += `export async function ${funcName}(\n`;
      code += `  options: Record<string, unknown> = {}\n`;
      code += `): Promise<{ success: boolean; data?: unknown; error?: string }> {\n`;
    } else {
      code += `export async function ${funcName}(options = {}) {\n`;
    }

    code += `  try {\n`;
    code += `    // TODO: Implement ${funcName}\n`;
    code += `    console.log('Executing ${funcName}', options);\n`;
    code += `    return { success: true };\n`;
    code += `  } catch (error) {\n`;
    code += `    const message = error instanceof Error ? error.message : String(error);\n`;
    code += `    return { success: false, error: message };\n`;
    code += `  }\n`;
    code += `}\n`;

    let testCode: string | undefined;
    let testPath: string | undefined;

    if (request.includeTests) {
      testCode = this.generateFunctionTest(funcName, isTs);
      testPath = request.targetPath?.replace(/\.(ts|js)$/, '.test.$1')
        || `${this.toFileName(funcName)}.test.${isTs ? 'ts' : 'js'}`;
    }

    return {
      code,
      path: request.targetPath || `${this.toFileName(funcName)}.${isTs ? 'ts' : 'js'}`,
      testCode,
      testPath,
      imports,
      exports,
    };
  }

  private generateModule(request: CodeGenerationRequest): GeneratedCode {
    const moduleName = this.toModuleName(request.description);
    const isTs = request.language === 'typescript';

    let code = '';
    const imports: string[] = [];
    const exports: string[] = [];

    code += `/**\n * ${request.description}\n *\n * @module ${moduleName}\n */\n\n`;

    if (isTs) {
      code += `// ============================================================================\n`;
      code += `// Types\n`;
      code += `// ============================================================================\n\n`;
      code += `export interface ${this.toClassName(moduleName)}Options {\n`;
      code += `  /** Enable debug mode */\n`;
      code += `  debug?: boolean;\n`;
      code += `  /** Configuration object */\n`;
      code += `  config?: Record<string, unknown>;\n`;
      code += `}\n\n`;
      exports.push(`${this.toClassName(moduleName)}Options`);
    }

    code += `// ============================================================================\n`;
    code += `// Main Functions\n`;
    code += `// ============================================================================\n\n`;

    const mainFunc = this.toFunctionName(`create ${moduleName}`);
    exports.push(mainFunc);

    if (request.includeJsdoc) {
      code += `/**\n * Create and initialize ${moduleName}\n */\n`;
    }

    if (isTs) {
      code += `export function ${mainFunc}(\n`;
      code += `  options: ${this.toClassName(moduleName)}Options = {}\n`;
      code += `): { initialized: boolean } {\n`;
    } else {
      code += `export function ${mainFunc}(options = {}) {\n`;
    }

    code += `  if (options.debug) {\n`;
    code += `    console.log('Creating ${moduleName}', options);\n`;
    code += `  }\n\n`;
    code += `  return { initialized: true };\n`;
    code += `}\n`;

    return {
      code,
      path: request.targetPath || `${this.toFileName(moduleName)}.${isTs ? 'ts' : 'js'}`,
      imports,
      exports,
    };
  }

  private generateComponent(request: CodeGenerationRequest): GeneratedCode {
    const componentName = this.toClassName(request.description);
    const isTs = request.language === 'typescript';

    let code = '';
    const imports = ['React'];
    const exports = [componentName];

    if (isTs) {
      code += `export interface ${componentName}Props {\n`;
      code += `  /** Component children */\n`;
      code += `  children?: React.ReactNode;\n`;
      code += `  /** Additional CSS classes */\n`;
      code += `  className?: string;\n`;
      code += `}\n\n`;
    }

    if (request.includeJsdoc) {
      code += `/**\n * ${request.description}\n */\n`;
    }

    if (isTs) {
      code += `export const ${componentName}: React.FC<${componentName}Props> = ({\n`;
      code += `  children,\n`;
      code += `  className = '',\n`;
      code += `}) => {\n`;
    } else {
      code += `export const ${componentName} = ({ children, className = '' }) => {\n`;
    }

    code += `  return (\n`;
    code += `    <div className={\`${this.toKebabCase(componentName)} \${className}\`}>\n`;
    code += `      {children}\n`;
    code += `    </div>\n`;
    code += `  );\n`;
    code += `};\n`;

    return {
      code: `import React from 'react';\n\n${code}`,
      path: request.targetPath || `${componentName}.${isTs ? 'tsx' : 'jsx'}`,
      imports,
      exports,
      dependencies: ['react'],
    };
  }

  private generateService(request: CodeGenerationRequest): GeneratedCode {
    const serviceName = this.toClassName(request.description);
    const isTs = request.language === 'typescript';

    let code = '';
    const imports: string[] = [];
    const exports = [serviceName];

    if (request.includeJsdoc) {
      code += `/**\n * ${request.description}\n *\n * @class ${serviceName}\n */\n`;
    }

    code += `export class ${serviceName} {\n`;

    if (isTs) {
      code += `  private initialized: boolean = false;\n\n`;
    } else {
      code += `  initialized = false;\n\n`;
    }

    code += `  constructor() {\n`;
    code += `    this.initialized = false;\n`;
    code += `  }\n\n`;

    code += `  /**\n   * Initialize the service\n   */\n`;
    code += `  async initialize()${isTs ? ': Promise<void>' : ''} {\n`;
    code += `    if (this.initialized) return;\n`;
    code += `    // TODO: Add initialization logic\n`;
    code += `    this.initialized = true;\n`;
    code += `  }\n\n`;

    const entityName = this.extractEntityName(request.description);

    code += `  /**\n   * Create a new ${entityName}\n   */\n`;
    code += `  async create(data${isTs ? ': Record<string, unknown>' : ''})${isTs ? ': Promise<{ id: string; data: Record<string, unknown> }>' : ''} {\n`;
    code += `    const id = crypto.randomUUID();\n`;
    code += `    return { id, data };\n`;
    code += `  }\n\n`;

    code += `  /**\n   * Get ${entityName} by ID\n   */\n`;
    code += `  async getById(id${isTs ? ': string' : ''})${isTs ? ': Promise<Record<string, unknown> | null>' : ''} {\n`;
    code += `    // TODO: Implement get by ID\n`;
    code += `    return null;\n`;
    code += `  }\n\n`;

    code += `  /**\n   * Update ${entityName}\n   */\n`;
    code += `  async update(id${isTs ? ': string' : ''}, data${isTs ? ': Record<string, unknown>' : ''})${isTs ? ': Promise<boolean>' : ''} {\n`;
    code += `    // TODO: Implement update\n`;
    code += `    return true;\n`;
    code += `  }\n\n`;

    code += `  /**\n   * Delete ${entityName}\n   */\n`;
    code += `  async delete(id${isTs ? ': string' : ''})${isTs ? ': Promise<boolean>' : ''} {\n`;
    code += `    // TODO: Implement delete\n`;
    code += `    return true;\n`;
    code += `  }\n`;

    code += `}\n`;

    let testCode: string | undefined;
    let testPath: string | undefined;

    if (request.includeTests) {
      testCode = this.generateServiceTest(serviceName, isTs);
      testPath = request.targetPath?.replace(/\.(ts|js)$/, '.test.$1')
        || `${this.toFileName(serviceName)}.test.${isTs ? 'ts' : 'js'}`;
    }

    return {
      code,
      path: request.targetPath || `${this.toFileName(serviceName)}.${isTs ? 'ts' : 'js'}`,
      testCode,
      testPath,
      imports,
      exports,
    };
  }

  // ==========================================================================
  // Test Generation Methods
  // ==========================================================================

  private generateClassTest(className: string, isTs: boolean): string {
    let code = '';
    code += `import { describe, it, expect, beforeEach } from 'vitest';\n`;
    code += `import { ${className} } from './${this.toFileName(className)}';\n\n`;

    code += `describe('${className}', () => {\n`;
    code += `  let instance${isTs ? `: ${className}` : ''};\n\n`;

    code += `  beforeEach(() => {\n`;
    code += `    instance = new ${className}();\n`;
    code += `  });\n\n`;

    code += `  describe('initialize', () => {\n`;
    code += `    it('should initialize successfully', async () => {\n`;
    code += `      await expect(instance.initialize()).resolves.toBeUndefined();\n`;
    code += `    });\n`;
    code += `  });\n\n`;

    code += `  describe('dispose', () => {\n`;
    code += `    it('should dispose resources', async () => {\n`;
    code += `      await expect(instance.dispose()).resolves.toBeUndefined();\n`;
    code += `    });\n`;
    code += `  });\n`;

    code += `});\n`;

    return code;
  }

  private generateFunctionTest(funcName: string, isTs: boolean): string {
    let code = '';
    code += `import { describe, it, expect } from 'vitest';\n`;
    code += `import { ${funcName} } from './${this.toFileName(funcName)}';\n\n`;

    code += `describe('${funcName}', () => {\n`;

    code += `  it('should execute successfully with default options', async () => {\n`;
    code += `    const result = await ${funcName}();\n`;
    code += `    expect(result.success).toBe(true);\n`;
    code += `  });\n\n`;

    code += `  it('should handle options correctly', async () => {\n`;
    code += `    const result = await ${funcName}({ key: 'value' });\n`;
    code += `    expect(result.success).toBe(true);\n`;
    code += `  });\n`;

    code += `});\n`;

    return code;
  }

  private generateServiceTest(serviceName: string, isTs: boolean): string {
    let code = '';
    code += `import { describe, it, expect, beforeEach } from 'vitest';\n`;
    code += `import { ${serviceName} } from './${this.toFileName(serviceName)}';\n\n`;

    code += `describe('${serviceName}', () => {\n`;
    code += `  let service${isTs ? `: ${serviceName}` : ''};\n\n`;

    code += `  beforeEach(() => {\n`;
    code += `    service = new ${serviceName}();\n`;
    code += `  });\n\n`;

    code += `  describe('initialize', () => {\n`;
    code += `    it('should initialize the service', async () => {\n`;
    code += `      await service.initialize();\n`;
    code += `      expect(service['initialized']).toBe(true);\n`;
    code += `    });\n\n`;

    code += `    it('should be idempotent', async () => {\n`;
    code += `      await service.initialize();\n`;
    code += `      await service.initialize();\n`;
    code += `      expect(service['initialized']).toBe(true);\n`;
    code += `    });\n`;
    code += `  });\n\n`;

    code += `  describe('CRUD operations', () => {\n`;
    code += `    it('should create an entity', async () => {\n`;
    code += `      const result = await service.create({ name: 'test' });\n`;
    code += `      expect(result.id).toBeDefined();\n`;
    code += `      expect(result.data).toEqual({ name: 'test' });\n`;
    code += `    });\n\n`;

    code += `    it('should return null for non-existent entity', async () => {\n`;
    code += `      const result = await service.getById('non-existent');\n`;
    code += `      expect(result).toBeNull();\n`;
    code += `    });\n`;
    code += `  });\n`;

    code += `});\n`;

    return code;
  }

  // ==========================================================================
  // Refactoring Detection Methods
  // ==========================================================================

  private findLongFunctions(code: string, lines: string[], filePath: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];
    const functionRegex = /(?:function\s+(\w+)|(\w+)\s*[=:]\s*(?:async\s+)?(?:\([^)]*\)|[\w]+)\s*=>)/g;

    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      const funcName = match[1] || match[2];
      const startLine = code.slice(0, match.index).split('\n').length;

      let braceCount = 0;
      let endLine = startLine;
      let inFunction = false;

      for (let i = startLine - 1; i < lines.length; i++) {
        const line = lines[i];
        for (const char of line) {
          if (char === '{') {
            braceCount++;
            inFunction = true;
          } else if (char === '}') {
            braceCount--;
            if (inFunction && braceCount === 0) {
              endLine = i + 1;
              break;
            }
          }
        }
        if (inFunction && braceCount === 0) break;
      }

      const functionLength = endLine - startLine + 1;
      if (functionLength > 30) {
        suggestions.push({
          type: 'extract-function',
          file: filePath,
          lineRange: { start: startLine, end: endLine },
          currentCode: lines.slice(startLine - 1, endLine).join('\n'),
          suggestedCode: `// Consider extracting parts of ${funcName} into smaller functions`,
          explanation: `Function '${funcName}' is ${functionLength} lines long. Consider breaking it into smaller, focused functions.`,
          priority: functionLength > 50 ? 8 : 5,
          complexityReduction: Math.min(30, functionLength - 20),
        });
      }
    }

    return suggestions;
  }

  private findDuplicateCode(code: string, lines: string[], filePath: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];
    const codeBlocks = new Map<string, number[]>();

    for (let i = 0; i < lines.length - 2; i++) {
      const block = lines.slice(i, i + 3).join('\n').trim();
      if (block.length > 30) {
        const normalized = block.replace(/\s+/g, ' ');
        if (!codeBlocks.has(normalized)) {
          codeBlocks.set(normalized, []);
        }
        codeBlocks.get(normalized)!.push(i + 1);
      }
    }

    for (const [_, lineNumbers] of codeBlocks) {
      if (lineNumbers.length > 1) {
        suggestions.push({
          type: 'remove-duplication',
          file: filePath,
          lineRange: { start: lineNumbers[0], end: lineNumbers[0] + 2 },
          currentCode: lines.slice(lineNumbers[0] - 1, lineNumbers[0] + 2).join('\n'),
          suggestedCode: '// Extract duplicated code into a reusable function',
          explanation: `Similar code found at lines ${lineNumbers.join(', ')}. Consider extracting into a shared function.`,
          priority: 6,
        });
        break;
      }
    }

    return suggestions;
  }

  private findModernizationOpportunities(code: string, lines: string[], filePath: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];

    const varMatches = code.matchAll(/\bvar\s+(\w+)/g);
    for (const match of varMatches) {
      const lineNum = code.slice(0, match.index).split('\n').length;
      suggestions.push({
        type: 'modernize',
        file: filePath,
        lineRange: { start: lineNum, end: lineNum },
        currentCode: lines[lineNum - 1],
        suggestedCode: lines[lineNum - 1].replace(/\bvar\b/, 'const'),
        explanation: `Replace 'var' with 'const' or 'let' for better scoping.`,
        priority: 3,
      });
    }

    if (code.includes('.then(') && !code.includes('async')) {
      const thenMatch = code.match(/\.then\s*\(/);
      if (thenMatch) {
        const lineNum = code.slice(0, thenMatch.index).split('\n').length;
        suggestions.push({
          type: 'modernize',
          file: filePath,
          lineRange: { start: lineNum, end: lineNum },
          currentCode: lines[lineNum - 1],
          suggestedCode: '// Consider using async/await instead of .then()',
          explanation: 'Consider converting Promise chains to async/await for better readability.',
          priority: 4,
        });
      }
    }

    return suggestions;
  }

  private findComplexityIssues(code: string, lines: string[], filePath: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];

    let maxNesting = 0;
    let maxNestingLine = 0;
    let currentNesting = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentNesting += (line.match(/{/g) || []).length;
      currentNesting -= (line.match(/}/g) || []).length;

      if (currentNesting > maxNesting) {
        maxNesting = currentNesting;
        maxNestingLine = i + 1;
      }
    }

    if (maxNesting > 4) {
      suggestions.push({
        type: 'simplify',
        file: filePath,
        lineRange: { start: maxNestingLine, end: maxNestingLine },
        currentCode: lines[maxNestingLine - 1],
        suggestedCode: '// Consider early returns or extracting nested logic',
        explanation: `Deep nesting (${maxNesting} levels) detected. Consider using early returns or extracting nested logic.`,
        priority: 7,
        complexityReduction: maxNesting - 3,
      });
    }

    return suggestions;
  }

  // ==========================================================================
  // Complexity Calculation Methods
  // ==========================================================================

  private calculateCyclomaticComplexity(code: string): number {
    let complexity = 1;

    const patterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*[^:]+\s*:/g,
      /&&/g,
      /\|\|/g,
    ];

    for (const pattern of patterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private calculateCognitiveComplexity(code: string): number {
    let complexity = 0;
    let nestingLevel = 0;

    const lines = code.split('\n');

    for (const line of lines) {
      if (/\b(if|for|while|switch)\s*\(/.test(line)) {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      }

      if (/\belse\b/.test(line)) {
        complexity += 1;
      }

      const closingBraces = (line.match(/}/g) || []).length;
      nestingLevel = Math.max(0, nestingLevel - closingBraces);

      const logicalOps = (line.match(/&&|\|\|/g) || []).length;
      complexity += logicalOps;
    }

    return complexity;
  }

  private countFunctions(code: string): number {
    const functionPatterns = [
      /function\s+\w+/g,
      /\w+\s*[=:]\s*(?:async\s+)?function/g,
      /\w+\s*[=:]\s*(?:async\s+)?\([^)]*\)\s*=>/g,
    ];

    let count = 0;
    for (const pattern of functionPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }

    return count;
  }

  private calculateAverageFunctionLength(code: string): number {
    const functionCount = this.countFunctions(code);
    if (functionCount === 0) return 0;

    const lines = code.split('\n').filter(l => l.trim().length > 0);
    return lines.length / functionCount;
  }

  private calculateMaxNestingDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }

    return maxDepth;
  }

  // ==========================================================================
  // Pattern Detection
  // ==========================================================================

  private detectPatterns(code: string): string[] {
    const patterns: string[] = [];

    const patternChecks: Array<{ name: string; regex: RegExp }> = [
      { name: 'Singleton', regex: /getInstance\s*\(|private\s+static\s+instance/ },
      { name: 'Factory', regex: /create[A-Z]\w+\s*\(|factory/i },
      { name: 'Observer', regex: /subscribe\s*\(|addEventListener|emit\s*\(/ },
      { name: 'Async/Await', regex: /async\s+\w+[\s\S]*?await\s+/ },
      { name: 'Error Handling', regex: /try\s*\{[\s\S]*?catch/ },
    ];

    for (const check of patternChecks) {
      if (check.regex.test(code)) {
        patterns.push(check.name);
      }
    }

    return patterns;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private toClassName(description: string): string {
    return description
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private toFunctionName(description: string): string {
    const words = description
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);

    if (words.length === 0) return 'doSomething';

    return words[0].toLowerCase() +
      words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }

  private toModuleName(description: string): string {
    return description
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .join('-')
      .toLowerCase();
  }

  private toFileName(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  private extractEntityName(description: string): string {
    const match = description.match(/(\w+)\s*service/i);
    if (match) return match[1].toLowerCase();

    const words = description.split(/\s+/);
    return words[0]?.toLowerCase() || 'entity';
  }
}

