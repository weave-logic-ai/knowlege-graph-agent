/**
 * Code Complexity Analyzer
 *
 * Parses TypeScript/JavaScript files using typescript-estree and
 * analyzes complexity metrics for functions, methods, and files.
 *
 * @module plugins/analyzers/code-complexity/analyzer
 */

import { parse, type TSESTree } from '@typescript-eslint/typescript-estree';
import { readFile } from 'fs/promises';
import { extname, relative, basename } from 'path';
import fastGlob from 'fast-glob';
import { createLogger } from '../../../utils/logger.js';
import {
  calculateCyclomaticComplexity,
  calculateCognitiveComplexity,
  calculateMaxNestingDepth,
  calculateLinesOfCode,
  countReturnStatements,
  calculateMaintainabilityIndex,
  aggregateFileComplexity,
  classifyComplexityLevel,
  detectComplexityIssues,
  generateRecommendations,
} from './metrics.js';
import type {
  AnalyzerConfig,
  FileAnalysis,
  FunctionAnalysis,
  FunctionKind,
  ProjectAnalysis,
  ProjectMetrics,
  ComplexityScore,
  ComplexityLevel,
  DEFAULT_CONFIG,
} from './types.js';
import { DEFAULT_THRESHOLDS } from './types.js';

const logger = createLogger('code-complexity-analyzer');

// ============================================================================
// Code Complexity Analyzer Class
// ============================================================================

/**
 * Analyzes TypeScript/JavaScript code for complexity metrics
 *
 * @example
 * ```typescript
 * const analyzer = new CodeComplexityAnalyzer({
 *   projectRoot: '/my/project',
 *   patterns: { include: ['src/** /*.ts'], exclude: ['** /*.test.ts'] }
 * });
 *
 * const result = await analyzer.analyzeProject();
 * console.log(`Found ${result.complexFunctions.length} complex functions`);
 * ```
 */
export class CodeComplexityAnalyzer {
  private config: AnalyzerConfig;
  private sourceCache: Map<string, string> = new Map();

  constructor(config: Partial<AnalyzerConfig> = {}) {
    // Merge with defaults
    this.config = {
      projectRoot: config.projectRoot ?? '.',
      patterns: config.patterns ?? {
        include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        exclude: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/*.d.ts',
          '**/*.min.js',
          '**/coverage/**',
        ],
      },
      thresholds: { ...DEFAULT_THRESHOLDS, ...config.thresholds },
      maxFiles: config.maxFiles,
      includeNodeModules: config.includeNodeModules ?? false,
      includeTests: config.includeTests ?? true,
      generateGraphNodes: config.generateGraphNodes ?? true,
      minComplexityToReport: config.minComplexityToReport ?? 0,
      verbose: config.verbose ?? false,
    };
  }

  // ==========================================================================
  // Project Analysis
  // ==========================================================================

  /**
   * Analyze entire project for complexity
   */
  async analyzeProject(): Promise<ProjectAnalysis> {
    const startedAt = new Date();

    logger.info('Starting project complexity analysis', {
      projectRoot: this.config.projectRoot,
    });

    // Find files to analyze
    const files = await this.findFiles();

    if (this.config.verbose) {
      logger.debug(`Found ${files.length} files to analyze`);
    }

    // Analyze each file
    const fileAnalyses: FileAnalysis[] = [];
    const errors: string[] = [];

    for (const filePath of files) {
      try {
        const analysis = await this.analyzeFile(filePath);
        if (analysis) {
          fileAnalyses.push(analysis);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${filePath}: ${message}`);
        if (this.config.verbose) {
          logger.warn(`Failed to analyze ${filePath}`, { error: message });
        }
      }
    }

    // Calculate project metrics
    const metrics = this.calculateProjectMetrics(fileAnalyses);

    // Identify hotspots
    const hotspots = fileAnalyses
      .filter((f) => f.level === 'high' || f.level === 'critical')
      .sort((a, b) => b.complexity.cyclomatic - a.complexity.cyclomatic);

    // Collect complex functions
    const complexFunctions = fileAnalyses
      .flatMap((f) => f.complexFunctions)
      .sort((a, b) => b.complexity.cyclomatic - a.complexity.cyclomatic);

    const completedAt = new Date();

    const result: ProjectAnalysis = {
      projectRoot: this.config.projectRoot,
      files: fileAnalyses,
      metrics,
      hotspots,
      complexFunctions,
      config: this.config,
      timing: {
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      },
    };

    logger.info('Project analysis complete', {
      files: fileAnalyses.length,
      functions: metrics.totalFunctions,
      hotspots: hotspots.length,
      duration: result.timing.durationMs,
    });

    return result;
  }

  // ==========================================================================
  // File Analysis
  // ==========================================================================

  /**
   * Analyze a single file for complexity
   */
  async analyzeFile(filePath: string): Promise<FileAnalysis | null> {
    const extension = extname(filePath).toLowerCase();

    // Only process TypeScript/JavaScript files
    if (!['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(extension)) {
      return null;
    }

    // Read source code
    const sourceCode = await this.getSourceCode(filePath);
    if (!sourceCode) return null;

    // Parse AST
    const ast = this.parseFile(filePath, sourceCode);
    if (!ast) return null;

    // Extract functions
    const functions = this.extractFunctions(ast, filePath, sourceCode);

    // Calculate file-level metrics
    const { loc, totalLines } = calculateLinesOfCode(sourceCode, 1, sourceCode.split('\n').length);

    // Count imports and exports
    const importCount = this.countImports(ast);
    const exportCount = this.countExports(ast);
    const classCount = this.countClasses(ast);

    // Aggregate file complexity
    const complexity = aggregateFileComplexity(functions, loc, totalLines);

    // Classify file complexity level
    const level = classifyComplexityLevel(complexity, this.config.thresholds);

    // Find complex functions
    const complexFunctions = functions.filter(
      (f) => f.level === 'high' || f.level === 'critical'
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
      analyzedAt: new Date(),
      parseErrors: [],
      complexFunctions,
      level,
    };
  }

  // ==========================================================================
  // AST Parsing
  // ==========================================================================

  /**
   * Parse source file to AST
   */
  private parseFile(filePath: string, sourceCode: string): TSESTree.Program | null {
    const extension = extname(filePath).toLowerCase();
    const isTypeScript = extension === '.ts' || extension === '.tsx';
    const isJsx = extension === '.tsx' || extension === '.jsx';

    try {
      return parse(sourceCode, {
        loc: true,
        range: true,
        tokens: false,
        comment: false,
        jsx: isJsx,
        // Use looser parsing for JavaScript
        ...(isTypeScript ? {} : { allowInvalidAST: true }),
      });
    } catch (error) {
      if (this.config.verbose) {
        logger.debug(`Parse error in ${filePath}`, {
          error: error instanceof Error ? error.message : String(error),
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
  private extractFunctions(
    ast: TSESTree.Program,
    filePath: string,
    sourceCode: string
  ): FunctionAnalysis[] {
    const functions: FunctionAnalysis[] = [];

    const traverse = (node: TSESTree.Node, parentName?: string): void => {
      // Check for function-like nodes
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

      // Track class names for methods
      let newParentName = parentName;
      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        const classNode = node as TSESTree.ClassDeclaration;
        newParentName = classNode.id?.name ?? 'AnonymousClass';
      }

      // Traverse children
      for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        const child = (node as unknown as Record<string, unknown>)[key];
        if (child && typeof child === 'object') {
          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && typeof item === 'object' && 'type' in item) {
                traverse(item as TSESTree.Node, newParentName);
              }
            }
          } else if ('type' in child) {
            traverse(child as TSESTree.Node, newParentName);
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
  private getFunctionInfo(
    node: TSESTree.Node,
    parentName?: string
  ): {
    node: TSESTree.Node;
    name: string;
    kind: FunctionKind;
    isAsync: boolean;
    isExported: boolean;
    parentName?: string;
  } | null {
    switch (node.type) {
      case 'FunctionDeclaration': {
        const fn = node as TSESTree.FunctionDeclaration;
        return {
          node: fn,
          name: fn.id?.name ?? 'anonymous',
          kind: fn.generator ? 'generator' : 'function',
          isAsync: fn.async,
          isExported: false,
          parentName,
        };
      }

      case 'FunctionExpression': {
        const fn = node as TSESTree.FunctionExpression;
        return {
          node: fn,
          name: fn.id?.name ?? 'anonymous',
          kind: fn.generator ? 'generator' : 'function',
          isAsync: fn.async,
          isExported: false,
          parentName,
        };
      }

      case 'ArrowFunctionExpression': {
        const fn = node as TSESTree.ArrowFunctionExpression;
        // Try to get name from variable declaration
        const name = this.getArrowFunctionName(node) ?? 'arrow';
        return {
          node: fn,
          name,
          kind: 'arrow',
          isAsync: fn.async,
          isExported: false,
          parentName,
        };
      }

      case 'MethodDefinition': {
        const method = node as TSESTree.MethodDefinition;
        const methodName = this.getPropertyName(method.key) ?? 'method';
        let kind: FunctionKind;
        if (method.kind === 'constructor') {
          kind = 'constructor';
        } else if (method.kind === 'get') {
          kind = 'getter';
        } else if (method.kind === 'set') {
          kind = 'setter';
        } else {
          kind = 'method';
        }
        const fn = method.value as TSESTree.FunctionExpression;
        return {
          node: method.value,
          name: methodName,
          kind,
          isAsync: fn.async,
          isExported: false,
          parentName,
        };
      }

      default:
        return null;
    }
  }

  /**
   * Analyze a single function node
   */
  private analyzeFunctionNode(
    node: TSESTree.Node,
    name: string,
    kind: FunctionKind,
    filePath: string,
    sourceCode: string,
    isAsync: boolean,
    isExported: boolean,
    parentName?: string
  ): FunctionAnalysis {
    const startLine = node.loc?.start.line ?? 1;
    const endLine = node.loc?.end.line ?? 1;

    // Calculate complexity metrics
    const cyclomatic = calculateCyclomaticComplexity(node);
    const cognitive = calculateCognitiveComplexity(node);
    const maxNestingDepth = calculateMaxNestingDepth(node);
    const { loc, totalLines } = calculateLinesOfCode(sourceCode, startLine, endLine);
    const returnCount = countReturnStatements(node);

    // Get parameter count
    const parameterCount = this.getParameterCount(node);

    const complexity: ComplexityScore = {
      cyclomatic,
      cognitive,
      loc,
      totalLines,
      maxNestingDepth,
      parameterCount,
      returnCount,
    };

    // Classify complexity level
    const level = classifyComplexityLevel(complexity, this.config.thresholds);

    // Detect issues
    const issues = detectComplexityIssues(complexity, this.config.thresholds, name);

    // Generate recommendations
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
      recommendations,
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Find files matching patterns
   */
  private async findFiles(): Promise<string[]> {
    const patterns = this.config.patterns.include.map((p) =>
      p.startsWith('/') ? p : `${this.config.projectRoot}/${p}`
    );

    const ignore = [...this.config.patterns.exclude];
    if (!this.config.includeNodeModules) {
      ignore.push('**/node_modules/**');
    }
    if (!this.config.includeTests) {
      ignore.push('**/*.test.*', '**/*.spec.*', '**/__tests__/**');
    }

    let files = await fastGlob(patterns, {
      ignore,
      absolute: true,
      onlyFiles: true,
    });

    // Limit files if configured
    if (this.config.maxFiles && files.length > this.config.maxFiles) {
      files = files.slice(0, this.config.maxFiles);
    }

    return files;
  }

  /**
   * Get source code for file (with caching)
   */
  private async getSourceCode(filePath: string): Promise<string | null> {
    if (this.sourceCache.has(filePath)) {
      return this.sourceCache.get(filePath)!;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      this.sourceCache.set(filePath, content);
      return content;
    } catch {
      return null;
    }
  }

  /**
   * Get arrow function name from parent
   */
  private getArrowFunctionName(node: TSESTree.Node): string | null {
    // This would require parent tracking in the AST
    // For now, return null and we'll use 'arrow' as default
    return null;
  }

  /**
   * Get property name from key
   */
  private getPropertyName(key: TSESTree.Node): string | null {
    if (key.type === 'Identifier') {
      return (key as TSESTree.Identifier).name;
    }
    if (key.type === 'Literal') {
      return String((key as TSESTree.Literal).value);
    }
    return null;
  }

  /**
   * Get parameter count from function
   */
  private getParameterCount(node: TSESTree.Node): number {
    if ('params' in node && Array.isArray(node.params)) {
      return node.params.length;
    }
    return 0;
  }

  /**
   * Count imports in AST
   */
  private countImports(ast: TSESTree.Program): number {
    return ast.body.filter((n) => n.type === 'ImportDeclaration').length;
  }

  /**
   * Count exports in AST
   */
  private countExports(ast: TSESTree.Program): number {
    return ast.body.filter(
      (n) =>
        n.type === 'ExportDefaultDeclaration' ||
        n.type === 'ExportNamedDeclaration' ||
        n.type === 'ExportAllDeclaration'
    ).length;
  }

  /**
   * Count classes in AST
   */
  private countClasses(ast: TSESTree.Program): number {
    let count = 0;
    const traverse = (node: TSESTree.Node): void => {
      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        count++;
      }
      for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        const child = (node as unknown as Record<string, unknown>)[key];
        if (child && typeof child === 'object') {
          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && typeof item === 'object' && 'type' in item) {
                traverse(item as TSESTree.Node);
              }
            }
          } else if ('type' in child) {
            traverse(child as TSESTree.Node);
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
  private calculateProjectMetrics(files: FileAnalysis[]): ProjectMetrics {
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
        topComplexFunctions: [],
      };
    }

    const allFunctions = files.flatMap((f) => f.functions);
    const totalFunctions = allFunctions.length;
    const totalLoc = files.reduce((sum, f) => sum + f.complexity.loc, 0);

    // Calculate averages
    const avgCyclomatic = totalFunctions > 0
      ? allFunctions.reduce((sum, f) => sum + f.complexity.cyclomatic, 0) / totalFunctions
      : 0;

    const avgCognitive = totalFunctions > 0
      ? allFunctions.reduce((sum, f) => sum + f.complexity.cognitive, 0) / totalFunctions
      : 0;

    const avgMaintainability = files.length > 0
      ? files.reduce((sum, f) => sum + f.complexity.maintainabilityIndex, 0) / files.length
      : 100;

    // Distribution
    const complexityDistribution: Record<ComplexityLevel, number> = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    };
    for (const fn of allFunctions) {
      complexityDistribution[fn.level]++;
    }

    const filesByLevel: Record<ComplexityLevel, number> = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    };
    for (const file of files) {
      filesByLevel[file.level]++;
    }

    // Top complex files
    const topComplexFiles = files
      .sort((a, b) => b.complexity.cyclomatic - a.complexity.cyclomatic)
      .slice(0, 10)
      .map((f) => ({ path: f.relativePath, score: f.complexity.cyclomatic }));

    // Top complex functions
    const topComplexFunctions = allFunctions
      .sort((a, b) => b.complexity.cyclomatic - a.complexity.cyclomatic)
      .slice(0, 10)
      .map((f) => ({
        name: f.parentName ? `${f.parentName}.${f.name}` : f.name,
        file: relative(this.config.projectRoot, f.filePath),
        score: f.complexity.cyclomatic,
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
      topComplexFunctions,
    };
  }

  /**
   * Clear source cache
   */
  clearCache(): void {
    this.sourceCache.clear();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a code complexity analyzer
 */
export function createComplexityAnalyzer(
  config?: Partial<AnalyzerConfig>
): CodeComplexityAnalyzer {
  return new CodeComplexityAnalyzer(config);
}

/**
 * Analyze a single file for complexity
 */
export async function analyzeFileComplexity(
  filePath: string,
  projectRoot?: string
): Promise<FileAnalysis | null> {
  const analyzer = new CodeComplexityAnalyzer({
    projectRoot: projectRoot ?? '.',
  });
  return analyzer.analyzeFile(filePath);
}

/**
 * Analyze a project for complexity
 */
export async function analyzeProjectComplexity(
  projectRoot: string,
  options?: Partial<AnalyzerConfig>
): Promise<ProjectAnalysis> {
  const analyzer = new CodeComplexityAnalyzer({
    ...options,
    projectRoot,
  });
  return analyzer.analyzeProject();
}
