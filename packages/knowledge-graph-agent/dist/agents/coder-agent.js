import * as path from "path";
import { BaseAgent } from "./base-agent.js";
import { AgentType } from "./types.js";
class CoderAgent extends BaseAgent {
  constructor(config) {
    super({
      type: AgentType.CODER,
      taskTimeout: 18e4,
      // 3 minutes
      capabilities: ["code-generation", "refactoring", "optimization"],
      ...config
    });
  }
  // ==========================================================================
  // Task Execution
  // ==========================================================================
  /**
   * Execute coder task
   */
  async executeTask(task) {
    const startTime = /* @__PURE__ */ new Date();
    const taskType = task.input?.parameters?.taskType || "generate";
    switch (taskType) {
      case "generate":
        return this.handleGenerateTask(task, startTime);
      case "refactor":
        return this.handleRefactorTask(task, startTime);
      case "analyze":
        return this.handleAnalyzeTask(task, startTime);
      case "optimize":
        return this.handleOptimizeTask(task, startTime);
      default:
        return this.createErrorResult(
          "INVALID_TASK_TYPE",
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
  async generateCode(request) {
    this.logger.info("Generating code", {
      description: request.description.slice(0, 50),
      template: request.template
    });
    switch (request.template) {
      case "class":
        return this.generateClass(request);
      case "function":
        return this.generateFunction(request);
      case "module":
        return this.generateModule(request);
      case "component":
        return this.generateComponent(request);
      case "service":
        return this.generateService(request);
      default:
        return this.generateModule(request);
    }
  }
  /**
   * Suggest refactoring for code
   */
  async suggestRefactoring(code, filePath) {
    this.logger.info("Analyzing code for refactoring", { file: filePath });
    const suggestions = [];
    const lines = code.split("\n");
    suggestions.push(...this.findLongFunctions(code, lines, filePath));
    suggestions.push(...this.findDuplicateCode(code, lines, filePath));
    suggestions.push(...this.findModernizationOpportunities(code, lines, filePath));
    suggestions.push(...this.findComplexityIssues(code, lines, filePath));
    return suggestions.sort((a, b) => b.priority - a.priority);
  }
  /**
   * Analyze code complexity
   */
  async analyzeComplexity(code, filePath) {
    this.logger.debug("Analyzing complexity", { file: filePath });
    const lines = code.split("\n");
    const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
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
      maintainabilityIndex: Math.round(maintainabilityIndex)
    };
  }
  // ==========================================================================
  // Private Task Handlers
  // ==========================================================================
  async handleGenerateTask(task, startTime) {
    const request = task.input?.data;
    if (!request?.description) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Code generation request with description is required",
        startTime
      );
    }
    try {
      const generated = await this.generateCode(request);
      const artifacts = [
        {
          type: "code",
          name: path.basename(generated.path),
          content: generated.code,
          mimeType: "text/typescript"
        }
      ];
      if (generated.testCode && generated.testPath) {
        artifacts.push({
          type: "code",
          name: path.basename(generated.testPath),
          content: generated.testCode,
          mimeType: "text/typescript"
        });
      }
      return this.createSuccessResult(generated, startTime, artifacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("GENERATION_ERROR", `Code generation failed: ${message}`, startTime);
    }
  }
  async handleRefactorTask(task, startTime) {
    const input = task.input?.data;
    if (!input?.code) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Code and file path are required for refactoring",
        startTime
      );
    }
    try {
      const suggestions = await this.suggestRefactoring(input.code, input.filePath);
      return this.createSuccessResult(suggestions, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("REFACTOR_ERROR", `Refactoring analysis failed: ${message}`, startTime);
    }
  }
  async handleAnalyzeTask(task, startTime) {
    const input = task.input?.data;
    if (!input?.code) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Code and file path are required for analysis",
        startTime
      );
    }
    try {
      const complexity = await this.analyzeComplexity(input.code, input.filePath);
      const suggestions = await this.suggestRefactoring(input.code, input.filePath);
      const patterns = this.detectPatterns(input.code);
      return this.createSuccessResult({
        file: input.filePath,
        complexity,
        suggestions,
        patterns
      }, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("ANALYSIS_ERROR", `Code analysis failed: ${message}`, startTime);
    }
  }
  async handleOptimizeTask(task, startTime) {
    const input = task.input?.data;
    if (!input?.code) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Code and file path are required for optimization",
        startTime
      );
    }
    try {
      const metrics = await this.analyzeComplexity(input.code, input.filePath);
      const allSuggestions = await this.suggestRefactoring(input.code, input.filePath);
      const optimizationSuggestions = allSuggestions.filter(
        (s) => s.type === "simplify" || s.type === "inline" || s.complexityReduction
      );
      return this.createSuccessResult({ suggestions: optimizationSuggestions, metrics }, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("OPTIMIZATION_ERROR", `Optimization analysis failed: ${message}`, startTime);
    }
  }
  // ==========================================================================
  // Code Generation Methods
  // ==========================================================================
  generateClass(request) {
    const className = this.toClassName(request.description);
    const isTs = request.language === "typescript";
    let code = "";
    const imports = [];
    const exports$1 = [className];
    if (request.includeJsdoc) {
      code += `/**
 * ${request.description}
 *
 * @class ${className}
 */
`;
    }
    code += `export class ${className} {
`;
    if (isTs) {
      code += `  private readonly logger: Console;

`;
      code += `  constructor() {
`;
      code += `    this.logger = console;
`;
      code += `  }

`;
    } else {
      code += `  constructor() {
`;
      code += `    this.logger = console;
`;
      code += `  }

`;
    }
    code += `  /**
   * Initialize the ${className}
   */
`;
    code += `  async initialize()${isTs ? ": Promise<void>" : ""} {
`;
    code += `    this.logger.log('${className} initialized');
`;
    code += `  }

`;
    code += `  /**
   * Dispose resources
   */
`;
    code += `  async dispose()${isTs ? ": Promise<void>" : ""} {
`;
    code += `    this.logger.log('${className} disposed');
`;
    code += `  }
`;
    code += `}
`;
    let testCode;
    let testPath;
    if (request.includeTests) {
      testCode = this.generateClassTest(className, isTs);
      testPath = request.targetPath?.replace(/\.(ts|js)$/, ".test.$1") || `${this.toFileName(className)}.test.${isTs ? "ts" : "js"}`;
    }
    return {
      code,
      path: request.targetPath || `${this.toFileName(className)}.${isTs ? "ts" : "js"}`,
      testCode,
      testPath,
      imports,
      exports: exports$1
    };
  }
  generateFunction(request) {
    const funcName = this.toFunctionName(request.description);
    const isTs = request.language === "typescript";
    let code = "";
    const imports = [];
    const exports$1 = [funcName];
    if (request.includeJsdoc) {
      code += `/**
 * ${request.description}
 *
 * @param options - Configuration options
 * @returns Result of the operation
 */
`;
    }
    if (isTs) {
      code += `export async function ${funcName}(
`;
      code += `  options: Record<string, unknown> = {}
`;
      code += `): Promise<{ success: boolean; data?: unknown; error?: string }> {
`;
    } else {
      code += `export async function ${funcName}(options = {}) {
`;
    }
    code += `  try {
`;
    code += `    // TODO: Implement ${funcName}
`;
    code += `    console.log('Executing ${funcName}', options);
`;
    code += `    return { success: true };
`;
    code += `  } catch (error) {
`;
    code += `    const message = error instanceof Error ? error.message : String(error);
`;
    code += `    return { success: false, error: message };
`;
    code += `  }
`;
    code += `}
`;
    let testCode;
    let testPath;
    if (request.includeTests) {
      testCode = this.generateFunctionTest(funcName, isTs);
      testPath = request.targetPath?.replace(/\.(ts|js)$/, ".test.$1") || `${this.toFileName(funcName)}.test.${isTs ? "ts" : "js"}`;
    }
    return {
      code,
      path: request.targetPath || `${this.toFileName(funcName)}.${isTs ? "ts" : "js"}`,
      testCode,
      testPath,
      imports,
      exports: exports$1
    };
  }
  generateModule(request) {
    const moduleName = this.toModuleName(request.description);
    const isTs = request.language === "typescript";
    let code = "";
    const imports = [];
    const exports$1 = [];
    code += `/**
 * ${request.description}
 *
 * @module ${moduleName}
 */

`;
    if (isTs) {
      code += `// ============================================================================
`;
      code += `// Types
`;
      code += `// ============================================================================

`;
      code += `export interface ${this.toClassName(moduleName)}Options {
`;
      code += `  /** Enable debug mode */
`;
      code += `  debug?: boolean;
`;
      code += `  /** Configuration object */
`;
      code += `  config?: Record<string, unknown>;
`;
      code += `}

`;
      exports$1.push(`${this.toClassName(moduleName)}Options`);
    }
    code += `// ============================================================================
`;
    code += `// Main Functions
`;
    code += `// ============================================================================

`;
    const mainFunc = this.toFunctionName(`create ${moduleName}`);
    exports$1.push(mainFunc);
    if (request.includeJsdoc) {
      code += `/**
 * Create and initialize ${moduleName}
 */
`;
    }
    if (isTs) {
      code += `export function ${mainFunc}(
`;
      code += `  options: ${this.toClassName(moduleName)}Options = {}
`;
      code += `): { initialized: boolean } {
`;
    } else {
      code += `export function ${mainFunc}(options = {}) {
`;
    }
    code += `  if (options.debug) {
`;
    code += `    console.log('Creating ${moduleName}', options);
`;
    code += `  }

`;
    code += `  return { initialized: true };
`;
    code += `}
`;
    return {
      code,
      path: request.targetPath || `${this.toFileName(moduleName)}.${isTs ? "ts" : "js"}`,
      imports,
      exports: exports$1
    };
  }
  generateComponent(request) {
    const componentName = this.toClassName(request.description);
    const isTs = request.language === "typescript";
    let code = "";
    const imports = ["React"];
    const exports$1 = [componentName];
    if (isTs) {
      code += `export interface ${componentName}Props {
`;
      code += `  /** Component children */
`;
      code += `  children?: React.ReactNode;
`;
      code += `  /** Additional CSS classes */
`;
      code += `  className?: string;
`;
      code += `}

`;
    }
    if (request.includeJsdoc) {
      code += `/**
 * ${request.description}
 */
`;
    }
    if (isTs) {
      code += `export const ${componentName}: React.FC<${componentName}Props> = ({
`;
      code += `  children,
`;
      code += `  className = '',
`;
      code += `}) => {
`;
    } else {
      code += `export const ${componentName} = ({ children, className = '' }) => {
`;
    }
    code += `  return (
`;
    code += `    <div className={\`${this.toKebabCase(componentName)} \${className}\`}>
`;
    code += `      {children}
`;
    code += `    </div>
`;
    code += `  );
`;
    code += `};
`;
    return {
      code: `import React from 'react';

${code}`,
      path: request.targetPath || `${componentName}.${isTs ? "tsx" : "jsx"}`,
      imports,
      exports: exports$1,
      dependencies: ["react"]
    };
  }
  generateService(request) {
    const serviceName = this.toClassName(request.description);
    const isTs = request.language === "typescript";
    let code = "";
    const imports = [];
    const exports$1 = [serviceName];
    if (request.includeJsdoc) {
      code += `/**
 * ${request.description}
 *
 * @class ${serviceName}
 */
`;
    }
    code += `export class ${serviceName} {
`;
    if (isTs) {
      code += `  private initialized: boolean = false;

`;
    } else {
      code += `  initialized = false;

`;
    }
    code += `  constructor() {
`;
    code += `    this.initialized = false;
`;
    code += `  }

`;
    code += `  /**
   * Initialize the service
   */
`;
    code += `  async initialize()${isTs ? ": Promise<void>" : ""} {
`;
    code += `    if (this.initialized) return;
`;
    code += `    // TODO: Add initialization logic
`;
    code += `    this.initialized = true;
`;
    code += `  }

`;
    const entityName = this.extractEntityName(request.description);
    code += `  /**
   * Create a new ${entityName}
   */
`;
    code += `  async create(data${isTs ? ": Record<string, unknown>" : ""})${isTs ? ": Promise<{ id: string; data: Record<string, unknown> }>" : ""} {
`;
    code += `    const id = crypto.randomUUID();
`;
    code += `    return { id, data };
`;
    code += `  }

`;
    code += `  /**
   * Get ${entityName} by ID
   */
`;
    code += `  async getById(id${isTs ? ": string" : ""})${isTs ? ": Promise<Record<string, unknown> | null>" : ""} {
`;
    code += `    // TODO: Implement get by ID
`;
    code += `    return null;
`;
    code += `  }

`;
    code += `  /**
   * Update ${entityName}
   */
`;
    code += `  async update(id${isTs ? ": string" : ""}, data${isTs ? ": Record<string, unknown>" : ""})${isTs ? ": Promise<boolean>" : ""} {
`;
    code += `    // TODO: Implement update
`;
    code += `    return true;
`;
    code += `  }

`;
    code += `  /**
   * Delete ${entityName}
   */
`;
    code += `  async delete(id${isTs ? ": string" : ""})${isTs ? ": Promise<boolean>" : ""} {
`;
    code += `    // TODO: Implement delete
`;
    code += `    return true;
`;
    code += `  }
`;
    code += `}
`;
    let testCode;
    let testPath;
    if (request.includeTests) {
      testCode = this.generateServiceTest(serviceName, isTs);
      testPath = request.targetPath?.replace(/\.(ts|js)$/, ".test.$1") || `${this.toFileName(serviceName)}.test.${isTs ? "ts" : "js"}`;
    }
    return {
      code,
      path: request.targetPath || `${this.toFileName(serviceName)}.${isTs ? "ts" : "js"}`,
      testCode,
      testPath,
      imports,
      exports: exports$1
    };
  }
  // ==========================================================================
  // Test Generation Methods
  // ==========================================================================
  generateClassTest(className, isTs) {
    let code = "";
    code += `import { describe, it, expect, beforeEach } from 'vitest';
`;
    code += `import { ${className} } from './${this.toFileName(className)}';

`;
    code += `describe('${className}', () => {
`;
    code += `  let instance${isTs ? `: ${className}` : ""};

`;
    code += `  beforeEach(() => {
`;
    code += `    instance = new ${className}();
`;
    code += `  });

`;
    code += `  describe('initialize', () => {
`;
    code += `    it('should initialize successfully', async () => {
`;
    code += `      await expect(instance.initialize()).resolves.toBeUndefined();
`;
    code += `    });
`;
    code += `  });

`;
    code += `  describe('dispose', () => {
`;
    code += `    it('should dispose resources', async () => {
`;
    code += `      await expect(instance.dispose()).resolves.toBeUndefined();
`;
    code += `    });
`;
    code += `  });
`;
    code += `});
`;
    return code;
  }
  generateFunctionTest(funcName, isTs) {
    let code = "";
    code += `import { describe, it, expect } from 'vitest';
`;
    code += `import { ${funcName} } from './${this.toFileName(funcName)}';

`;
    code += `describe('${funcName}', () => {
`;
    code += `  it('should execute successfully with default options', async () => {
`;
    code += `    const result = await ${funcName}();
`;
    code += `    expect(result.success).toBe(true);
`;
    code += `  });

`;
    code += `  it('should handle options correctly', async () => {
`;
    code += `    const result = await ${funcName}({ key: 'value' });
`;
    code += `    expect(result.success).toBe(true);
`;
    code += `  });
`;
    code += `});
`;
    return code;
  }
  generateServiceTest(serviceName, isTs) {
    let code = "";
    code += `import { describe, it, expect, beforeEach } from 'vitest';
`;
    code += `import { ${serviceName} } from './${this.toFileName(serviceName)}';

`;
    code += `describe('${serviceName}', () => {
`;
    code += `  let service${isTs ? `: ${serviceName}` : ""};

`;
    code += `  beforeEach(() => {
`;
    code += `    service = new ${serviceName}();
`;
    code += `  });

`;
    code += `  describe('initialize', () => {
`;
    code += `    it('should initialize the service', async () => {
`;
    code += `      await service.initialize();
`;
    code += `      expect(service['initialized']).toBe(true);
`;
    code += `    });

`;
    code += `    it('should be idempotent', async () => {
`;
    code += `      await service.initialize();
`;
    code += `      await service.initialize();
`;
    code += `      expect(service['initialized']).toBe(true);
`;
    code += `    });
`;
    code += `  });

`;
    code += `  describe('CRUD operations', () => {
`;
    code += `    it('should create an entity', async () => {
`;
    code += `      const result = await service.create({ name: 'test' });
`;
    code += `      expect(result.id).toBeDefined();
`;
    code += `      expect(result.data).toEqual({ name: 'test' });
`;
    code += `    });

`;
    code += `    it('should return null for non-existent entity', async () => {
`;
    code += `      const result = await service.getById('non-existent');
`;
    code += `      expect(result).toBeNull();
`;
    code += `    });
`;
    code += `  });
`;
    code += `});
`;
    return code;
  }
  // ==========================================================================
  // Refactoring Detection Methods
  // ==========================================================================
  findLongFunctions(code, lines, filePath) {
    const suggestions = [];
    const functionRegex = /(?:function\s+(\w+)|(\w+)\s*[=:]\s*(?:async\s+)?(?:\([^)]*\)|[\w]+)\s*=>)/g;
    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      const funcName = match[1] || match[2];
      const startLine = code.slice(0, match.index).split("\n").length;
      let braceCount = 0;
      let endLine = startLine;
      let inFunction = false;
      for (let i = startLine - 1; i < lines.length; i++) {
        const line = lines[i];
        for (const char of line) {
          if (char === "{") {
            braceCount++;
            inFunction = true;
          } else if (char === "}") {
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
          type: "extract-function",
          file: filePath,
          lineRange: { start: startLine, end: endLine },
          currentCode: lines.slice(startLine - 1, endLine).join("\n"),
          suggestedCode: `// Consider extracting parts of ${funcName} into smaller functions`,
          explanation: `Function '${funcName}' is ${functionLength} lines long. Consider breaking it into smaller, focused functions.`,
          priority: functionLength > 50 ? 8 : 5,
          complexityReduction: Math.min(30, functionLength - 20)
        });
      }
    }
    return suggestions;
  }
  findDuplicateCode(code, lines, filePath) {
    const suggestions = [];
    const codeBlocks = /* @__PURE__ */ new Map();
    for (let i = 0; i < lines.length - 2; i++) {
      const block = lines.slice(i, i + 3).join("\n").trim();
      if (block.length > 30) {
        const normalized = block.replace(/\s+/g, " ");
        if (!codeBlocks.has(normalized)) {
          codeBlocks.set(normalized, []);
        }
        codeBlocks.get(normalized).push(i + 1);
      }
    }
    for (const [_, lineNumbers] of codeBlocks) {
      if (lineNumbers.length > 1) {
        suggestions.push({
          type: "remove-duplication",
          file: filePath,
          lineRange: { start: lineNumbers[0], end: lineNumbers[0] + 2 },
          currentCode: lines.slice(lineNumbers[0] - 1, lineNumbers[0] + 2).join("\n"),
          suggestedCode: "// Extract duplicated code into a reusable function",
          explanation: `Similar code found at lines ${lineNumbers.join(", ")}. Consider extracting into a shared function.`,
          priority: 6
        });
        break;
      }
    }
    return suggestions;
  }
  findModernizationOpportunities(code, lines, filePath) {
    const suggestions = [];
    const varMatches = code.matchAll(/\bvar\s+(\w+)/g);
    for (const match of varMatches) {
      const lineNum = code.slice(0, match.index).split("\n").length;
      suggestions.push({
        type: "modernize",
        file: filePath,
        lineRange: { start: lineNum, end: lineNum },
        currentCode: lines[lineNum - 1],
        suggestedCode: lines[lineNum - 1].replace(/\bvar\b/, "const"),
        explanation: `Replace 'var' with 'const' or 'let' for better scoping.`,
        priority: 3
      });
    }
    if (code.includes(".then(") && !code.includes("async")) {
      const thenMatch = code.match(/\.then\s*\(/);
      if (thenMatch) {
        const lineNum = code.slice(0, thenMatch.index).split("\n").length;
        suggestions.push({
          type: "modernize",
          file: filePath,
          lineRange: { start: lineNum, end: lineNum },
          currentCode: lines[lineNum - 1],
          suggestedCode: "// Consider using async/await instead of .then()",
          explanation: "Consider converting Promise chains to async/await for better readability.",
          priority: 4
        });
      }
    }
    return suggestions;
  }
  findComplexityIssues(code, lines, filePath) {
    const suggestions = [];
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
        type: "simplify",
        file: filePath,
        lineRange: { start: maxNestingLine, end: maxNestingLine },
        currentCode: lines[maxNestingLine - 1],
        suggestedCode: "// Consider early returns or extracting nested logic",
        explanation: `Deep nesting (${maxNesting} levels) detected. Consider using early returns or extracting nested logic.`,
        priority: 7,
        complexityReduction: maxNesting - 3
      });
    }
    return suggestions;
  }
  // ==========================================================================
  // Complexity Calculation Methods
  // ==========================================================================
  calculateCyclomaticComplexity(code) {
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
      /\|\|/g
    ];
    for (const pattern of patterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }
    return complexity;
  }
  calculateCognitiveComplexity(code) {
    let complexity = 0;
    let nestingLevel = 0;
    const lines = code.split("\n");
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
  countFunctions(code) {
    const functionPatterns = [
      /function\s+\w+/g,
      /\w+\s*[=:]\s*(?:async\s+)?function/g,
      /\w+\s*[=:]\s*(?:async\s+)?\([^)]*\)\s*=>/g
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
  calculateAverageFunctionLength(code) {
    const functionCount = this.countFunctions(code);
    if (functionCount === 0) return 0;
    const lines = code.split("\n").filter((l) => l.trim().length > 0);
    return lines.length / functionCount;
  }
  calculateMaxNestingDepth(code) {
    let maxDepth = 0;
    let currentDepth = 0;
    for (const char of code) {
      if (char === "{") {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === "}") {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
    return maxDepth;
  }
  // ==========================================================================
  // Pattern Detection
  // ==========================================================================
  detectPatterns(code) {
    const patterns = [];
    const patternChecks = [
      { name: "Singleton", regex: /getInstance\s*\(|private\s+static\s+instance/ },
      { name: "Factory", regex: /create[A-Z]\w+\s*\(|factory/i },
      { name: "Observer", regex: /subscribe\s*\(|addEventListener|emit\s*\(/ },
      { name: "Async/Await", regex: /async\s+\w+[\s\S]*?await\s+/ },
      { name: "Error Handling", regex: /try\s*\{[\s\S]*?catch/ }
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
  toClassName(description) {
    return description.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");
  }
  toFunctionName(description) {
    const words = description.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return "doSomething";
    return words[0].toLowerCase() + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
  }
  toModuleName(description) {
    return description.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).join("-").toLowerCase();
  }
  toFileName(name) {
    return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
  extractEntityName(description) {
    const match = description.match(/(\w+)\s*service/i);
    if (match) return match[1].toLowerCase();
    const words = description.split(/\s+/);
    return words[0]?.toLowerCase() || "entity";
  }
}
export {
  CoderAgent
};
//# sourceMappingURL=coder-agent.js.map
