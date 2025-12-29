import { d as distExports } from "../../../_virtual/index.js";
import { readFile } from "fs/promises";
import { extname, relative } from "path";
import fg from "fast-glob";
import { createLogger } from "../../../utils/logger.js";
import { calculateLinesOfCode, aggregateFileComplexity, classifyComplexityLevel, calculateCyclomaticComplexity, calculateCognitiveComplexity, calculateMaxNestingDepth, countReturnStatements, detectComplexityIssues, generateRecommendations } from "./metrics.js";
import { DEFAULT_THRESHOLDS } from "./types.js";
const logger = createLogger("code-complexity-analyzer");
class CodeComplexityAnalyzer {
  config;
  sourceCache = /* @__PURE__ */ new Map();
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot ?? ".",
      patterns: config.patterns ?? {
        include: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
        exclude: [
          "**/node_modules/**",
          "**/dist/**",
          "**/build/**",
          "**/*.d.ts",
          "**/*.min.js",
          "**/coverage/**"
        ]
      },
      thresholds: { ...DEFAULT_THRESHOLDS, ...config.thresholds },
      maxFiles: config.maxFiles,
      includeNodeModules: config.includeNodeModules ?? false,
      includeTests: config.includeTests ?? true,
      generateGraphNodes: config.generateGraphNodes ?? true,
      minComplexityToReport: config.minComplexityToReport ?? 0,
      verbose: config.verbose ?? false
    };
  }
  // ==========================================================================
  // Project Analysis
  // ==========================================================================
  /**
   * Analyze entire project for complexity
   */
  async analyzeProject() {
    const startedAt = /* @__PURE__ */ new Date();
    logger.info("Starting project complexity analysis", {
      projectRoot: this.config.projectRoot
    });
    const files = await this.findFiles();
    if (this.config.verbose) {
      logger.debug(`Found ${files.length} files to analyze`);
    }
    const fileAnalyses = [];
    for (const filePath of files) {
      try {
        const analysis = await this.analyzeFile(filePath);
        if (analysis) {
          fileAnalyses.push(analysis);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (this.config.verbose) {
          logger.warn(`Failed to analyze ${filePath}`, { error: message });
        }
      }
    }
    const metrics = this.calculateProjectMetrics(fileAnalyses);
    const hotspots = fileAnalyses.filter((f) => f.level === "high" || f.level === "critical").sort((a, b) => b.complexity.cyclomatic - a.complexity.cyclomatic);
    const complexFunctions = fileAnalyses.flatMap((f) => f.complexFunctions).sort((a, b) => b.complexity.cyclomatic - a.complexity.cyclomatic);
    const completedAt = /* @__PURE__ */ new Date();
    const result = {
      projectRoot: this.config.projectRoot,
      files: fileAnalyses,
      metrics,
      hotspots,
      complexFunctions,
      config: this.config,
      timing: {
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime()
      }
    };
    logger.info("Project analysis complete", {
      files: fileAnalyses.length,
      functions: metrics.totalFunctions,
      hotspots: hotspots.length,
      duration: result.timing.durationMs
    });
    return result;
  }
  // ==========================================================================
  // File Analysis
  // ==========================================================================
  /**
   * Analyze a single file for complexity
   */
  async analyzeFile(filePath) {
    const extension = extname(filePath).toLowerCase();
    if (![".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(extension)) {
      return null;
    }
    const sourceCode = await this.getSourceCode(filePath);
    if (!sourceCode) return null;
    const ast = this.parseFile(filePath, sourceCode);
    if (!ast) return null;
    const functions = this.extractFunctions(ast, filePath, sourceCode);
    const { loc, totalLines } = calculateLinesOfCode(sourceCode, 1, sourceCode.split("\n").length);
    const importCount = this.countImports(ast);
    const exportCount = this.countExports(ast);
    const classCount = this.countClasses(ast);
    const complexity = aggregateFileComplexity(functions, loc, totalLines);
    const level = classifyComplexityLevel(complexity, this.config.thresholds);
    const complexFunctions = functions.filter(
      (f) => f.level === "high" || f.level === "critical"
    );
    return {
      filePath,
      relativePath: relative(this.config.projectRoot, filePath),
      extension,
      complexity,
      functions,
      classCount,
      importCount,
      exportCount,
      analyzedAt: /* @__PURE__ */ new Date(),
      parseErrors: [],
      complexFunctions,
      level
    };
  }
  // ==========================================================================
  // AST Parsing
  // ==========================================================================
  /**
   * Parse source file to AST
   */
  parseFile(filePath, sourceCode) {
    const extension = extname(filePath).toLowerCase();
    const isTypeScript = extension === ".ts" || extension === ".tsx";
    const isJsx = extension === ".tsx" || extension === ".jsx";
    try {
      return distExports.parse(sourceCode, {
        loc: true,
        range: true,
        tokens: false,
        comment: false,
        jsx: isJsx,
        // Use looser parsing for JavaScript
        ...isTypeScript ? {} : { allowInvalidAST: true }
      });
    } catch (error) {
      if (this.config.verbose) {
        logger.debug(`Parse error in ${filePath}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
      return null;
    }
  }
  // ==========================================================================
  // Function Extraction
  // ==========================================================================
  /**
   * Extract all functions from AST
   */
  extractFunctions(ast, filePath, sourceCode) {
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
        const name = this.getArrowFunctionName(node) ?? "arrow";
        return {
          node: fn,
          name,
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
    const complexity = {
      cyclomatic,
      cognitive,
      loc,
      totalLines,
      maxNestingDepth,
      parameterCount,
      returnCount
    };
    const level = classifyComplexityLevel(complexity, this.config.thresholds);
    const issues = detectComplexityIssues(complexity, this.config.thresholds, name);
    const recommendations = generateRecommendations(complexity, this.config.thresholds, level);
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
  // ==========================================================================
  // Helper Methods
  // ==========================================================================
  /**
   * Find files matching patterns
   */
  async findFiles() {
    const patterns = this.config.patterns.include.map(
      (p) => p.startsWith("/") ? p : `${this.config.projectRoot}/${p}`
    );
    const ignore = [...this.config.patterns.exclude];
    if (!this.config.includeNodeModules) {
      ignore.push("**/node_modules/**");
    }
    if (!this.config.includeTests) {
      ignore.push("**/*.test.*", "**/*.spec.*", "**/__tests__/**");
    }
    let files = await fg(patterns, {
      ignore,
      absolute: true,
      onlyFiles: true
    });
    if (this.config.maxFiles && files.length > this.config.maxFiles) {
      files = files.slice(0, this.config.maxFiles);
    }
    return files;
  }
  /**
   * Get source code for file (with caching)
   */
  async getSourceCode(filePath) {
    if (this.sourceCache.has(filePath)) {
      return this.sourceCache.get(filePath);
    }
    try {
      const content = await readFile(filePath, "utf-8");
      this.sourceCache.set(filePath, content);
      return content;
    } catch {
      return null;
    }
  }
  /**
   * Get arrow function name from parent
   */
  getArrowFunctionName(node) {
    return null;
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
   * Count exports in AST
   */
  countExports(ast) {
    return ast.body.filter(
      (n) => n.type === "ExportDefaultDeclaration" || n.type === "ExportNamedDeclaration" || n.type === "ExportAllDeclaration"
    ).length;
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
   * Calculate project-wide metrics
   */
  calculateProjectMetrics(files) {
    if (files.length === 0) {
      return {
        totalFiles: 0,
        totalFunctions: 0,
        totalLoc: 0,
        avgCyclomatic: 0,
        avgCognitive: 0,
        avgMaintainability: 100,
        complexityDistribution: { low: 0, moderate: 0, high: 0, critical: 0 },
        filesByLevel: { low: 0, moderate: 0, high: 0, critical: 0 },
        topComplexFiles: [],
        topComplexFunctions: []
      };
    }
    const allFunctions = files.flatMap((f) => f.functions);
    const totalFunctions = allFunctions.length;
    const totalLoc = files.reduce((sum, f) => sum + f.complexity.loc, 0);
    const avgCyclomatic = totalFunctions > 0 ? allFunctions.reduce((sum, f) => sum + f.complexity.cyclomatic, 0) / totalFunctions : 0;
    const avgCognitive = totalFunctions > 0 ? allFunctions.reduce((sum, f) => sum + f.complexity.cognitive, 0) / totalFunctions : 0;
    const avgMaintainability = files.length > 0 ? files.reduce((sum, f) => sum + f.complexity.maintainabilityIndex, 0) / files.length : 100;
    const complexityDistribution = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0
    };
    for (const fn of allFunctions) {
      complexityDistribution[fn.level]++;
    }
    const filesByLevel = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0
    };
    for (const file of files) {
      filesByLevel[file.level]++;
    }
    const topComplexFiles = files.sort((a, b) => b.complexity.cyclomatic - a.complexity.cyclomatic).slice(0, 10).map((f) => ({ path: f.relativePath, score: f.complexity.cyclomatic }));
    const topComplexFunctions = allFunctions.sort((a, b) => b.complexity.cyclomatic - a.complexity.cyclomatic).slice(0, 10).map((f) => ({
      name: f.parentName ? `${f.parentName}.${f.name}` : f.name,
      file: relative(this.config.projectRoot, f.filePath),
      score: f.complexity.cyclomatic
    }));
    return {
      totalFiles: files.length,
      totalFunctions,
      totalLoc,
      avgCyclomatic: Math.round(avgCyclomatic * 100) / 100,
      avgCognitive: Math.round(avgCognitive * 100) / 100,
      avgMaintainability: Math.round(avgMaintainability * 100) / 100,
      complexityDistribution,
      filesByLevel,
      topComplexFiles,
      topComplexFunctions
    };
  }
  /**
   * Clear source cache
   */
  clearCache() {
    this.sourceCache.clear();
  }
}
async function analyzeFileComplexity(filePath, projectRoot) {
  const analyzer = new CodeComplexityAnalyzer({
    projectRoot: projectRoot ?? "."
  });
  return analyzer.analyzeFile(filePath);
}
async function analyzeProjectComplexity(projectRoot, options) {
  const analyzer = new CodeComplexityAnalyzer({
    ...options,
    projectRoot
  });
  return analyzer.analyzeProject();
}
export {
  CodeComplexityAnalyzer,
  analyzeFileComplexity,
  analyzeProjectComplexity
};
//# sourceMappingURL=analyzer.js.map
