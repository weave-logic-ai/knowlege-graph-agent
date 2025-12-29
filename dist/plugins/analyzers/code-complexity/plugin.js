import { d as distExports } from "../../../_virtual/index.js";
import { createLogger } from "../../../utils/logger.js";
import { calculateLinesOfCode, calculateCyclomaticComplexity, calculateCognitiveComplexity, calculateMaxNestingDepth, countReturnStatements, calculateHalsteadMetrics, classifyComplexityLevel, detectComplexityIssues, generateRecommendations } from "./metrics.js";
import { DEFAULT_THRESHOLDS } from "./types.js";
const logger = createLogger("code-complexity-analyzer-plugin");
class CodeComplexityAnalyzerPlugin {
  name = "code-complexity-analyzer";
  version = "1.0.0";
  type = "analyzer";
  supportedContentTypes = ["typescript", "javascript", "tsx", "jsx"];
  context = null;
  config = {};
  thresholds = { ...DEFAULT_THRESHOLDS };
  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================
  /**
   * Initialize the plugin with context
   */
  async initialize(context) {
    this.context = context;
    if (context.pluginConfig) {
      this.config = context.pluginConfig;
      this.thresholds = {
        cyclomaticHigh: this.config.cyclomaticHigh ?? DEFAULT_THRESHOLDS.cyclomaticHigh,
        cyclomaticCritical: this.config.cyclomaticCritical ?? DEFAULT_THRESHOLDS.cyclomaticCritical,
        cognitiveHigh: this.config.cognitiveHigh ?? DEFAULT_THRESHOLDS.cognitiveHigh,
        cognitiveCritical: this.config.cognitiveCritical ?? DEFAULT_THRESHOLDS.cognitiveCritical,
        maxNestingDepth: this.config.maxNestingDepth ?? DEFAULT_THRESHOLDS.maxNestingDepth,
        maxFunctionLength: this.config.maxFunctionLength ?? DEFAULT_THRESHOLDS.maxFunctionLength
      };
    }
    logger.info("Code Complexity Analyzer Plugin initialized", {
      thresholds: this.thresholds
    });
  }
  /**
   * Cleanup plugin resources
   */
  async destroy() {
    this.context = null;
    logger.info("Code Complexity Analyzer Plugin destroyed");
  }
  /**
   * Check plugin health
   */
  async healthCheck() {
    return {
      healthy: true,
      message: "Code Complexity Analyzer is ready",
      details: {
        supportedContentTypes: this.supportedContentTypes,
        thresholds: this.thresholds
      }
    };
  }
  /**
   * Get plugin statistics
   */
  async getStats() {
    return {
      name: this.name,
      version: this.version,
      supportedContentTypes: this.supportedContentTypes,
      thresholds: this.thresholds
    };
  }
  // ==========================================================================
  // Analyzer Interface Methods
  // ==========================================================================
  /**
   * Check if this analyzer can handle the given content type
   */
  canAnalyze(contentType) {
    const normalizedType = contentType.toLowerCase().replace(/^\./, "");
    return this.supportedContentTypes.includes(normalizedType) || ["ts", "js", "mts", "mjs", "cts", "cjs"].includes(normalizedType);
  }
  /**
   * Analyze content and return structured results
   */
  async analyze(input) {
    const startTime = Date.now();
    logger.debug("Analyzing content", {
      id: input.id,
      contentType: input.contentType,
      filePath: input.filePath
    });
    const result = {
      success: false,
      analysisType: "code-complexity",
      entities: [],
      relationships: [],
      tags: [],
      metrics: {
        durationMs: 0,
        tokensProcessed: 0,
        entitiesFound: 0,
        relationshipsFound: 0
      },
      suggestions: []
    };
    try {
      const ast = this.parseContent(input.content, input.contentType);
      if (!ast) {
        result.error = {
          code: "PARSE_ERROR",
          message: "Failed to parse source code"
        };
        return result;
      }
      const functions = this.extractAndAnalyzeFunctions(ast, input.content, input.filePath || "unknown");
      const { loc, totalLines } = calculateLinesOfCode(input.content, 1, input.content.split("\n").length);
      const classCount = this.countClasses(ast);
      const importCount = this.countImports(ast);
      for (const fn of functions) {
        const entityId = `${input.id}-fn-${fn.name}-${fn.startLine}`;
        result.entities.push({
          id: entityId,
          type: "function",
          value: fn.name,
          confidence: 1,
          position: {
            start: fn.startLine,
            end: fn.endLine
          },
          metadata: {
            kind: fn.kind,
            isAsync: fn.isAsync,
            parentName: fn.parentName,
            complexity: fn.complexity,
            level: fn.level,
            issues: fn.issues,
            recommendations: fn.recommendations
          }
        });
        if (fn.parentName) {
          result.relationships.push({
            sourceId: entityId,
            targetId: `${input.id}-class-${fn.parentName}`,
            type: "belongs_to",
            confidence: 1,
            metadata: {
              relationship: "method_of_class"
            }
          });
        }
      }
      const classNames = this.extractClassNames(ast);
      for (const className of classNames) {
        result.entities.push({
          id: `${input.id}-class-${className}`,
          type: "class",
          value: className,
          confidence: 1,
          metadata: {
            methodCount: functions.filter((f) => f.parentName === className).length
          }
        });
      }
      const complexFunctions = functions.filter((f) => f.level === "high" || f.level === "critical");
      const avgCyclomatic = functions.length > 0 ? functions.reduce((sum, f) => sum + f.complexity.cyclomatic, 0) / functions.length : 0;
      result.tags = [
        { value: "code-complexity", confidence: 1, category: "analysis" },
        { value: input.contentType, confidence: 1, category: "language" }
      ];
      if (complexFunctions.length > 0) {
        result.tags.push({
          value: "has-complex-functions",
          confidence: 1,
          category: "quality"
        });
      }
      if (avgCyclomatic > this.thresholds.cyclomaticHigh) {
        result.tags.push({
          value: "high-complexity",
          confidence: 1,
          category: "quality"
        });
      }
      for (const fn of complexFunctions) {
        result.suggestions.push({
          type: "other",
          message: `Function "${fn.name}" has ${fn.level} complexity (CC: ${fn.complexity.cyclomatic}). Consider refactoring.`,
          confidence: 0.9,
          action: {
            type: "refactor",
            function: fn.name,
            location: { line: fn.startLine, file: input.filePath },
            recommendations: fn.recommendations
          }
        });
      }
      result.summary = this.generateSummary(functions, loc, classCount);
      const criticalCount = functions.filter((f) => f.level === "critical").length;
      const highCount = functions.filter((f) => f.level === "high").length;
      const totalFunctions = functions.length || 1;
      result.qualityScore = Math.max(0, 1 - (criticalCount * 0.3 + highCount * 0.1) / totalFunctions);
      result.metrics = {
        durationMs: Date.now() - startTime,
        tokensProcessed: input.content.length,
        entitiesFound: result.entities.length,
        relationshipsFound: result.relationships.length
      };
      result.raw = {
        totalFunctions: functions.length,
        complexFunctions: complexFunctions.length,
        loc,
        totalLines,
        classCount,
        importCount,
        avgCyclomatic: Math.round(avgCyclomatic * 100) / 100,
        fileComplexity: functions.reduce((sum, f) => sum + f.complexity.cyclomatic, 0)
      };
      result.success = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.error = {
        code: "ANALYSIS_ERROR",
        message,
        details: { error }
      };
      logger.error("Analysis failed", error instanceof Error ? error : new Error(message));
    }
    result.metrics.durationMs = Date.now() - startTime;
    return result;
  }
  /**
   * Stream analysis results for large content
   */
  async *analyzeStream(input) {
    const startTime = Date.now();
    yield {
      type: "progress",
      data: { stage: "parsing", message: "Parsing source code..." },
      progress: 10,
      timestamp: /* @__PURE__ */ new Date()
    };
    const ast = this.parseContent(input.content, input.contentType);
    if (!ast) {
      yield {
        type: "error",
        data: { code: "PARSE_ERROR", message: "Failed to parse source code" },
        timestamp: /* @__PURE__ */ new Date()
      };
      return;
    }
    yield {
      type: "progress",
      data: { stage: "extracting", message: "Extracting functions..." },
      progress: 30,
      timestamp: /* @__PURE__ */ new Date()
    };
    const functions = this.extractAndAnalyzeFunctions(ast, input.content, input.filePath || "unknown");
    const totalFunctions = functions.length;
    for (let i = 0; i < functions.length; i++) {
      const fn = functions[i];
      const entityId = `${input.id}-fn-${fn.name}-${fn.startLine}`;
      yield {
        type: "entity",
        data: {
          id: entityId,
          type: "function",
          value: fn.name,
          confidence: 1,
          position: { start: fn.startLine, end: fn.endLine },
          metadata: {
            kind: fn.kind,
            isAsync: fn.isAsync,
            parentName: fn.parentName,
            complexity: fn.complexity,
            level: fn.level,
            issues: fn.issues,
            recommendations: fn.recommendations
          }
        },
        progress: 30 + Math.round(i / totalFunctions * 50),
        timestamp: /* @__PURE__ */ new Date()
      };
      if (fn.parentName) {
        yield {
          type: "relationship",
          data: {
            sourceId: entityId,
            targetId: `${input.id}-class-${fn.parentName}`,
            type: "belongs_to",
            confidence: 1
          },
          timestamp: /* @__PURE__ */ new Date()
        };
      }
    }
    yield {
      type: "progress",
      data: { stage: "extracting-classes", message: "Extracting classes..." },
      progress: 85,
      timestamp: /* @__PURE__ */ new Date()
    };
    const classNames = this.extractClassNames(ast);
    for (const className of classNames) {
      yield {
        type: "entity",
        data: {
          id: `${input.id}-class-${className}`,
          type: "class",
          value: className,
          confidence: 1,
          metadata: {
            methodCount: functions.filter((f) => f.parentName === className).length
          }
        },
        timestamp: /* @__PURE__ */ new Date()
      };
    }
    yield {
      type: "tag",
      data: { value: "code-complexity", confidence: 1, category: "analysis" },
      progress: 95,
      timestamp: /* @__PURE__ */ new Date()
    };
    yield {
      type: "complete",
      data: {
        totalFunctions: functions.length,
        complexFunctions: functions.filter((f) => f.level === "high" || f.level === "critical").length,
        durationMs: Date.now() - startTime
      },
      progress: 100,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Get configuration options for this analyzer
   */
  getConfigOptions() {
    return {
      cyclomaticHigh: {
        type: "number",
        description: 'Cyclomatic complexity threshold for "high" designation',
        default: 10
      },
      cyclomaticCritical: {
        type: "number",
        description: 'Cyclomatic complexity threshold for "critical" designation',
        default: 20
      },
      cognitiveHigh: {
        type: "number",
        description: 'Cognitive complexity threshold for "high" designation',
        default: 15
      },
      cognitiveCritical: {
        type: "number",
        description: 'Cognitive complexity threshold for "critical" designation',
        default: 25
      },
      maxNestingDepth: {
        type: "number",
        description: "Maximum recommended nesting depth",
        default: 4
      },
      maxFunctionLength: {
        type: "number",
        description: "Maximum recommended function length in lines",
        default: 50
      },
      includeHalstead: {
        type: "boolean",
        description: "Include Halstead software science metrics",
        default: true
      },
      minComplexityToReport: {
        type: "number",
        description: "Minimum cyclomatic complexity to include in results",
        default: 0
      }
    };
  }
  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================
  /**
   * Parse source code to AST
   */
  parseContent(content, contentType) {
    const isTypeScript = ["typescript", "tsx", "ts"].includes(contentType.toLowerCase());
    const isJsx = ["tsx", "jsx"].includes(contentType.toLowerCase());
    try {
      return distExports.parse(content, {
        loc: true,
        range: true,
        tokens: false,
        comment: false,
        jsx: isJsx,
        ...isTypeScript ? {} : { allowInvalidAST: true }
      });
    } catch (error) {
      logger.debug("Parse error", {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
  /**
   * Extract and analyze all functions from AST
   */
  extractAndAnalyzeFunctions(ast, sourceCode, filePath) {
    const functions = [];
    const traverse = (node, parentName) => {
      const functionInfo = this.getFunctionInfo(node, parentName);
      if (functionInfo) {
        const analysis = this.analyzeFunctionNode(
          functionInfo.node,
          functionInfo.name,
          functionInfo.kind,
          filePath,
          sourceCode,
          functionInfo.isAsync,
          functionInfo.isExported,
          functionInfo.parentName
        );
        functions.push(analysis);
      }
      let newParentName = parentName;
      if (node.type === "ClassDeclaration" || node.type === "ClassExpression") {
        const classNode = node;
        newParentName = classNode.id?.name ?? "AnonymousClass";
      }
      for (const key of Object.keys(node)) {
        if (key === "parent") continue;
        const child = node[key];
        if (child && typeof child === "object") {
          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && typeof item === "object" && "type" in item) {
                traverse(item, newParentName);
              }
            }
          } else if ("type" in child) {
            traverse(child, newParentName);
          }
        }
      }
    };
    traverse(ast);
    return functions;
  }
  /**
   * Get function information from node
   */
  getFunctionInfo(node, parentName) {
    switch (node.type) {
      case "FunctionDeclaration": {
        const fn = node;
        return {
          node: fn,
          name: fn.id?.name ?? "anonymous",
          kind: fn.generator ? "generator" : "function",
          isAsync: fn.async,
          isExported: false,
          parentName
        };
      }
      case "FunctionExpression": {
        const fn = node;
        return {
          node: fn,
          name: fn.id?.name ?? "anonymous",
          kind: fn.generator ? "generator" : "function",
          isAsync: fn.async,
          isExported: false,
          parentName
        };
      }
      case "ArrowFunctionExpression": {
        const fn = node;
        return {
          node: fn,
          name: "arrow",
          kind: "arrow",
          isAsync: fn.async,
          isExported: false,
          parentName
        };
      }
      case "MethodDefinition": {
        const method = node;
        const methodName = this.getPropertyName(method.key) ?? "method";
        let kind;
        if (method.kind === "constructor") {
          kind = "constructor";
        } else if (method.kind === "get") {
          kind = "getter";
        } else if (method.kind === "set") {
          kind = "setter";
        } else {
          kind = "method";
        }
        const fn = method.value;
        return {
          node: method.value,
          name: methodName,
          kind,
          isAsync: fn.async,
          isExported: false,
          parentName
        };
      }
      default:
        return null;
    }
  }
  /**
   * Analyze a single function node
   */
  analyzeFunctionNode(node, name, kind, filePath, sourceCode, isAsync, isExported, parentName) {
    const startLine = node.loc?.start.line ?? 1;
    const endLine = node.loc?.end.line ?? 1;
    const cyclomatic = calculateCyclomaticComplexity(node);
    const cognitive = calculateCognitiveComplexity(node);
    const maxNestingDepth = calculateMaxNestingDepth(node);
    const { loc, totalLines } = calculateLinesOfCode(sourceCode, startLine, endLine);
    const returnCount = countReturnStatements(node);
    const parameterCount = this.getParameterCount(node);
    const halstead = this.config.includeHalstead !== false ? calculateHalsteadMetrics(node) : void 0;
    const complexity = {
      cyclomatic,
      cognitive,
      loc,
      totalLines,
      maxNestingDepth,
      parameterCount,
      returnCount,
      halstead
    };
    const level = classifyComplexityLevel(complexity, this.thresholds);
    const issues = detectComplexityIssues(complexity, this.thresholds, name);
    if (maxNestingDepth > this.thresholds.maxNestingDepth) {
      issues.push(`Deep nesting detected: ${maxNestingDepth} levels (threshold: ${this.thresholds.maxNestingDepth})`);
    }
    const recommendations = generateRecommendations(complexity, this.thresholds, level);
    return {
      name,
      filePath,
      startLine,
      endLine,
      kind,
      complexity,
      level,
      parentName,
      isAsync,
      isExported,
      issues,
      recommendations
    };
  }
  /**
   * Get property name from key
   */
  getPropertyName(key) {
    if (key.type === "Identifier") {
      return key.name;
    }
    if (key.type === "Literal") {
      return String(key.value);
    }
    return null;
  }
  /**
   * Get parameter count from function
   */
  getParameterCount(node) {
    if ("params" in node && Array.isArray(node.params)) {
      return node.params.length;
    }
    return 0;
  }
  /**
   * Count imports in AST
   */
  countImports(ast) {
    return ast.body.filter((n) => n.type === "ImportDeclaration").length;
  }
  /**
   * Count classes in AST
   */
  countClasses(ast) {
    let count = 0;
    const traverse = (node) => {
      if (node.type === "ClassDeclaration" || node.type === "ClassExpression") {
        count++;
      }
      for (const key of Object.keys(node)) {
        if (key === "parent") continue;
        const child = node[key];
        if (child && typeof child === "object") {
          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && typeof item === "object" && "type" in item) {
                traverse(item);
              }
            }
          } else if ("type" in child) {
            traverse(child);
          }
        }
      }
    };
    traverse(ast);
    return count;
  }
  /**
   * Extract class names from AST
   */
  extractClassNames(ast) {
    const names = [];
    const traverse = (node) => {
      if (node.type === "ClassDeclaration" || node.type === "ClassExpression") {
        const classNode = node;
        if (classNode.id?.name) {
          names.push(classNode.id.name);
        }
      }
      for (const key of Object.keys(node)) {
        if (key === "parent") continue;
        const child = node[key];
        if (child && typeof child === "object") {
          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && typeof item === "object" && "type" in item) {
                traverse(item);
              }
            }
          } else if ("type" in child) {
            traverse(child);
          }
        }
      }
    };
    traverse(ast);
    return names;
  }
  /**
   * Generate a summary of the analysis
   */
  generateSummary(functions, loc, classCount) {
    const totalFunctions = functions.length;
    const complexFunctions = functions.filter((f) => f.level === "high" || f.level === "critical").length;
    const avgCyclomatic = totalFunctions > 0 ? Math.round(functions.reduce((sum, f) => sum + f.complexity.cyclomatic, 0) / totalFunctions * 100) / 100 : 0;
    const avgCognitive = totalFunctions > 0 ? Math.round(functions.reduce((sum, f) => sum + f.complexity.cognitive, 0) / totalFunctions * 100) / 100 : 0;
    return `Analyzed ${totalFunctions} functions and ${classCount} classes across ${loc} lines of code. Average cyclomatic complexity: ${avgCyclomatic}, cognitive complexity: ${avgCognitive}. Found ${complexFunctions} function(s) with high or critical complexity.`;
  }
}
function createCodeComplexityAnalyzerPlugin() {
  return new CodeComplexityAnalyzerPlugin();
}
export {
  CodeComplexityAnalyzerPlugin,
  createCodeComplexityAnalyzerPlugin,
  CodeComplexityAnalyzerPlugin as default
};
//# sourceMappingURL=plugin.js.map
