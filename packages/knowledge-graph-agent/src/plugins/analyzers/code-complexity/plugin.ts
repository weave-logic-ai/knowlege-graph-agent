/**
 * Code Complexity Analyzer Plugin
 *
 * Implements the AnalyzerPlugin interface for analyzing TypeScript/JavaScript
 * code complexity. Provides streaming analysis, cyclomatic complexity,
 * cognitive complexity, Halstead metrics, and deep nesting detection.
 *
 * @module plugins/analyzers/code-complexity/plugin
 */

import { parse, type TSESTree } from '@typescript-eslint/typescript-estree';
import { relative, extname, basename } from 'path';
import { createLogger } from '../../../utils/logger.js';
import type {
  AnalyzerPlugin,
  AnalysisInput,
  AnalysisResult,
  AnalysisStreamChunk,
  PluginContext,
} from '../../types.js';
import {
  calculateCyclomaticComplexity,
  calculateCognitiveComplexity,
  calculateMaxNestingDepth,
  calculateLinesOfCode,
  countReturnStatements,
  calculateMaintainabilityIndex,
  calculateHalsteadMetrics,
  classifyComplexityLevel,
  detectComplexityIssues,
  generateRecommendations,
} from './metrics.js';
import type {
  ComplexityScore,
  ComplexityLevel,
  FunctionAnalysis,
  FunctionKind,
  HalsteadMetrics,
} from './types.js';
import { DEFAULT_THRESHOLDS, EMPTY_HALSTEAD_METRICS } from './types.js';

const logger = createLogger('code-complexity-analyzer-plugin');

// ============================================================================
// Plugin Configuration
// ============================================================================

/**
 * Configuration options for the Code Complexity Analyzer plugin
 */
export interface CodeComplexityPluginConfig {
  /** Cyclomatic complexity threshold for "high" designation */
  cyclomaticHigh?: number;
  /** Cyclomatic complexity threshold for "critical" designation */
  cyclomaticCritical?: number;
  /** Cognitive complexity threshold for "high" designation */
  cognitiveHigh?: number;
  /** Cognitive complexity threshold for "critical" designation */
  cognitiveCritical?: number;
  /** Maximum recommended nesting depth */
  maxNestingDepth?: number;
  /** Maximum recommended function length (LOC) */
  maxFunctionLength?: number;
  /** Include Halstead metrics in analysis */
  includeHalstead?: boolean;
  /** Minimum complexity to include in results (filter out simple functions) */
  minComplexityToReport?: number;
}

// ============================================================================
// Code Complexity Analyzer Plugin
// ============================================================================

/**
 * Code Complexity Analyzer Plugin
 *
 * Implements the AnalyzerPlugin interface for analyzing code complexity
 * in TypeScript and JavaScript files.
 *
 * Features:
 * - Cyclomatic complexity (McCabe) calculation
 * - Cognitive complexity (SonarSource) calculation
 * - Halstead software science metrics
 * - Deep nesting detection (> 4 levels)
 * - Lines of code counting
 * - Function and class counting
 * - Streaming analysis support
 * - Structured entity and relationship extraction
 *
 * @example
 * ```typescript
 * const plugin = new CodeComplexityAnalyzerPlugin();
 * await plugin.initialize(context);
 *
 * const result = await plugin.analyze({
 *   id: 'analysis-1',
 *   content: sourceCode,
 *   contentType: 'typescript',
 *   filePath: '/src/example.ts'
 * });
 *
 * console.log(`Found ${result.entities?.length} entities`);
 * ```
 */
export class CodeComplexityAnalyzerPlugin implements AnalyzerPlugin {
  readonly name = 'code-complexity-analyzer';
  readonly version = '1.0.0';
  readonly type = 'analyzer' as const;
  readonly supportedContentTypes = ['typescript', 'javascript', 'tsx', 'jsx'];

  private context: PluginContext | null = null;
  private config: CodeComplexityPluginConfig = {};
  private thresholds = { ...DEFAULT_THRESHOLDS };

  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================

  /**
   * Initialize the plugin with context
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;

    // Load configuration from plugin config
    if (context.pluginConfig) {
      this.config = context.pluginConfig as CodeComplexityPluginConfig;
      this.thresholds = {
        cyclomaticHigh: this.config.cyclomaticHigh ?? DEFAULT_THRESHOLDS.cyclomaticHigh,
        cyclomaticCritical: this.config.cyclomaticCritical ?? DEFAULT_THRESHOLDS.cyclomaticCritical,
        cognitiveHigh: this.config.cognitiveHigh ?? DEFAULT_THRESHOLDS.cognitiveHigh,
        cognitiveCritical: this.config.cognitiveCritical ?? DEFAULT_THRESHOLDS.cognitiveCritical,
        maxNestingDepth: this.config.maxNestingDepth ?? DEFAULT_THRESHOLDS.maxNestingDepth,
        maxFunctionLength: this.config.maxFunctionLength ?? DEFAULT_THRESHOLDS.maxFunctionLength,
      };
    }

    logger.info('Code Complexity Analyzer Plugin initialized', {
      thresholds: this.thresholds,
    });
  }

  /**
   * Cleanup plugin resources
   */
  async destroy(): Promise<void> {
    this.context = null;
    logger.info('Code Complexity Analyzer Plugin destroyed');
  }

  /**
   * Check plugin health
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string; details?: Record<string, unknown> }> {
    return {
      healthy: true,
      message: 'Code Complexity Analyzer is ready',
      details: {
        supportedContentTypes: this.supportedContentTypes,
        thresholds: this.thresholds,
      },
    };
  }

  /**
   * Get plugin statistics
   */
  async getStats(): Promise<Record<string, unknown>> {
    return {
      name: this.name,
      version: this.version,
      supportedContentTypes: this.supportedContentTypes,
      thresholds: this.thresholds,
    };
  }

  // ==========================================================================
  // Analyzer Interface Methods
  // ==========================================================================

  /**
   * Check if this analyzer can handle the given content type
   */
  canAnalyze(contentType: string): boolean {
    const normalizedType = contentType.toLowerCase().replace(/^\./, '');
    return this.supportedContentTypes.includes(normalizedType) ||
           ['ts', 'js', 'mts', 'mjs', 'cts', 'cjs'].includes(normalizedType);
  }

  /**
   * Analyze content and return structured results
   */
  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    const startTime = Date.now();

    logger.debug('Analyzing content', {
      id: input.id,
      contentType: input.contentType,
      filePath: input.filePath,
    });

    const result: AnalysisResult = {
      success: false,
      analysisType: 'code-complexity',
      entities: [],
      relationships: [],
      tags: [],
      metrics: {
        durationMs: 0,
        tokensProcessed: 0,
        entitiesFound: 0,
        relationshipsFound: 0,
      },
      suggestions: [],
    };

    try {
      // Parse the AST
      const ast = this.parseContent(input.content, input.contentType);
      if (!ast) {
        result.error = {
          code: 'PARSE_ERROR',
          message: 'Failed to parse source code',
        };
        return result;
      }

      // Extract functions and analyze
      const functions = this.extractAndAnalyzeFunctions(ast, input.content, input.filePath || 'unknown');

      // Calculate file-level metrics
      const { loc, totalLines } = calculateLinesOfCode(input.content, 1, input.content.split('\n').length);
      const classCount = this.countClasses(ast);
      const importCount = this.countImports(ast);

      // Generate entities from functions
      for (const fn of functions) {
        const entityId = `${input.id}-fn-${fn.name}-${fn.startLine}`;

        result.entities!.push({
          id: entityId,
          type: 'function',
          value: fn.name,
          confidence: 1.0,
          position: {
            start: fn.startLine,
            end: fn.endLine,
          },
          metadata: {
            kind: fn.kind,
            isAsync: fn.isAsync,
            parentName: fn.parentName,
            complexity: fn.complexity,
            level: fn.level,
            issues: fn.issues,
            recommendations: fn.recommendations,
          },
        });

        // Add relationships for nested functions or class methods
        if (fn.parentName) {
          result.relationships!.push({
            sourceId: entityId,
            targetId: `${input.id}-class-${fn.parentName}`,
            type: 'belongs_to',
            confidence: 1.0,
            metadata: {
              relationship: 'method_of_class',
            },
          });
        }
      }

      // Add class entities
      const classNames = this.extractClassNames(ast);
      for (const className of classNames) {
        result.entities!.push({
          id: `${input.id}-class-${className}`,
          type: 'class',
          value: className,
          confidence: 1.0,
          metadata: {
            methodCount: functions.filter(f => f.parentName === className).length,
          },
        });
      }

      // Generate tags based on complexity
      const complexFunctions = functions.filter(f => f.level === 'high' || f.level === 'critical');
      const avgCyclomatic = functions.length > 0
        ? functions.reduce((sum, f) => sum + f.complexity.cyclomatic, 0) / functions.length
        : 0;

      result.tags = [
        { value: 'code-complexity', confidence: 1.0, category: 'analysis' },
        { value: input.contentType, confidence: 1.0, category: 'language' },
      ];

      if (complexFunctions.length > 0) {
        result.tags.push({
          value: 'has-complex-functions',
          confidence: 1.0,
          category: 'quality',
        });
      }

      if (avgCyclomatic > this.thresholds.cyclomaticHigh) {
        result.tags.push({
          value: 'high-complexity',
          confidence: 1.0,
          category: 'quality',
        });
      }

      // Generate suggestions
      for (const fn of complexFunctions) {
        result.suggestions!.push({
          type: 'other',
          message: `Function "${fn.name}" has ${fn.level} complexity (CC: ${fn.complexity.cyclomatic}). Consider refactoring.`,
          confidence: 0.9,
          action: {
            type: 'refactor',
            function: fn.name,
            location: { line: fn.startLine, file: input.filePath },
            recommendations: fn.recommendations,
          },
        });
      }

      // Generate summary
      result.summary = this.generateSummary(functions, loc, classCount);

      // Calculate quality score (0-1 based on complexity distribution)
      const criticalCount = functions.filter(f => f.level === 'critical').length;
      const highCount = functions.filter(f => f.level === 'high').length;
      const totalFunctions = functions.length || 1;
      result.qualityScore = Math.max(0, 1 - (criticalCount * 0.3 + highCount * 0.1) / totalFunctions);

      // Update metrics
      result.metrics = {
        durationMs: Date.now() - startTime,
        tokensProcessed: input.content.length,
        entitiesFound: result.entities!.length,
        relationshipsFound: result.relationships!.length,
      };

      // Add raw data for debugging
      result.raw = {
        totalFunctions: functions.length,
        complexFunctions: complexFunctions.length,
        loc,
        totalLines,
        classCount,
        importCount,
        avgCyclomatic: Math.round(avgCyclomatic * 100) / 100,
        fileComplexity: functions.reduce((sum, f) => sum + f.complexity.cyclomatic, 0),
      };

      result.success = true;

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.error = {
        code: 'ANALYSIS_ERROR',
        message,
        details: { error },
      };
      logger.error('Analysis failed', error instanceof Error ? error : new Error(message));
    }

    result.metrics!.durationMs = Date.now() - startTime;
    return result;
  }

  /**
   * Stream analysis results for large content
   */
  async *analyzeStream(input: AnalysisInput): AsyncIterable<AnalysisStreamChunk> {
    const startTime = Date.now();

    yield {
      type: 'progress',
      data: { stage: 'parsing', message: 'Parsing source code...' },
      progress: 10,
      timestamp: new Date(),
    };

    // Parse AST
    const ast = this.parseContent(input.content, input.contentType);
    if (!ast) {
      yield {
        type: 'error',
        data: { code: 'PARSE_ERROR', message: 'Failed to parse source code' },
        timestamp: new Date(),
      };
      return;
    }

    yield {
      type: 'progress',
      data: { stage: 'extracting', message: 'Extracting functions...' },
      progress: 30,
      timestamp: new Date(),
    };

    // Extract and analyze functions
    const functions = this.extractAndAnalyzeFunctions(ast, input.content, input.filePath || 'unknown');
    const totalFunctions = functions.length;

    // Stream each function as an entity
    for (let i = 0; i < functions.length; i++) {
      const fn = functions[i];
      const entityId = `${input.id}-fn-${fn.name}-${fn.startLine}`;

      yield {
        type: 'entity',
        data: {
          id: entityId,
          type: 'function',
          value: fn.name,
          confidence: 1.0,
          position: { start: fn.startLine, end: fn.endLine },
          metadata: {
            kind: fn.kind,
            isAsync: fn.isAsync,
            parentName: fn.parentName,
            complexity: fn.complexity,
            level: fn.level,
            issues: fn.issues,
            recommendations: fn.recommendations,
          },
        },
        progress: 30 + Math.round((i / totalFunctions) * 50),
        timestamp: new Date(),
      };

      // Stream relationships
      if (fn.parentName) {
        yield {
          type: 'relationship',
          data: {
            sourceId: entityId,
            targetId: `${input.id}-class-${fn.parentName}`,
            type: 'belongs_to',
            confidence: 1.0,
          },
          timestamp: new Date(),
        };
      }
    }

    yield {
      type: 'progress',
      data: { stage: 'extracting-classes', message: 'Extracting classes...' },
      progress: 85,
      timestamp: new Date(),
    };

    // Stream class entities
    const classNames = this.extractClassNames(ast);
    for (const className of classNames) {
      yield {
        type: 'entity',
        data: {
          id: `${input.id}-class-${className}`,
          type: 'class',
          value: className,
          confidence: 1.0,
          metadata: {
            methodCount: functions.filter(f => f.parentName === className).length,
          },
        },
        timestamp: new Date(),
      };
    }

    // Stream tags
    yield {
      type: 'tag',
      data: { value: 'code-complexity', confidence: 1.0, category: 'analysis' },
      progress: 95,
      timestamp: new Date(),
    };

    // Complete
    yield {
      type: 'complete',
      data: {
        totalFunctions: functions.length,
        complexFunctions: functions.filter(f => f.level === 'high' || f.level === 'critical').length,
        durationMs: Date.now() - startTime,
      },
      progress: 100,
      timestamp: new Date(),
    };
  }

  /**
   * Get configuration options for this analyzer
   */
  getConfigOptions(): Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    default?: unknown;
    required?: boolean;
  }> {
    return {
      cyclomaticHigh: {
        type: 'number',
        description: 'Cyclomatic complexity threshold for "high" designation',
        default: 10,
      },
      cyclomaticCritical: {
        type: 'number',
        description: 'Cyclomatic complexity threshold for "critical" designation',
        default: 20,
      },
      cognitiveHigh: {
        type: 'number',
        description: 'Cognitive complexity threshold for "high" designation',
        default: 15,
      },
      cognitiveCritical: {
        type: 'number',
        description: 'Cognitive complexity threshold for "critical" designation',
        default: 25,
      },
      maxNestingDepth: {
        type: 'number',
        description: 'Maximum recommended nesting depth',
        default: 4,
      },
      maxFunctionLength: {
        type: 'number',
        description: 'Maximum recommended function length in lines',
        default: 50,
      },
      includeHalstead: {
        type: 'boolean',
        description: 'Include Halstead software science metrics',
        default: true,
      },
      minComplexityToReport: {
        type: 'number',
        description: 'Minimum cyclomatic complexity to include in results',
        default: 0,
      },
    };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Parse source code to AST
   */
  private parseContent(content: string, contentType: string): TSESTree.Program | null {
    const isTypeScript = ['typescript', 'tsx', 'ts'].includes(contentType.toLowerCase());
    const isJsx = ['tsx', 'jsx'].includes(contentType.toLowerCase());

    try {
      return parse(content, {
        loc: true,
        range: true,
        tokens: false,
        comment: false,
        jsx: isJsx,
        ...(isTypeScript ? {} : { allowInvalidAST: true }),
      });
    } catch (error) {
      logger.debug('Parse error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Extract and analyze all functions from AST
   */
  private extractAndAnalyzeFunctions(
    ast: TSESTree.Program,
    sourceCode: string,
    filePath: string
  ): FunctionAnalysis[] {
    const functions: FunctionAnalysis[] = [];

    const traverse = (node: TSESTree.Node, parentName?: string): void => {
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
        return {
          node: fn,
          name: 'arrow',
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
    const parameterCount = this.getParameterCount(node);

    // Calculate Halstead metrics if enabled
    const halstead = this.config.includeHalstead !== false
      ? calculateHalsteadMetrics(node)
      : undefined;

    const complexity: ComplexityScore = {
      cyclomatic,
      cognitive,
      loc,
      totalLines,
      maxNestingDepth,
      parameterCount,
      returnCount,
      halstead,
    };

    // Classify complexity level
    const level = classifyComplexityLevel(complexity, this.thresholds);

    // Detect issues
    const issues = detectComplexityIssues(complexity, this.thresholds, name);

    // Add deep nesting detection
    if (maxNestingDepth > this.thresholds.maxNestingDepth) {
      issues.push(`Deep nesting detected: ${maxNestingDepth} levels (threshold: ${this.thresholds.maxNestingDepth})`);
    }

    // Generate recommendations
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
      recommendations,
    };
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
    return ast.body.filter(n => n.type === 'ImportDeclaration').length;
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
   * Extract class names from AST
   */
  private extractClassNames(ast: TSESTree.Program): string[] {
    const names: string[] = [];
    const traverse = (node: TSESTree.Node): void => {
      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        const classNode = node as TSESTree.ClassDeclaration;
        if (classNode.id?.name) {
          names.push(classNode.id.name);
        }
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
    return names;
  }

  /**
   * Generate a summary of the analysis
   */
  private generateSummary(functions: FunctionAnalysis[], loc: number, classCount: number): string {
    const totalFunctions = functions.length;
    const complexFunctions = functions.filter(f => f.level === 'high' || f.level === 'critical').length;
    const avgCyclomatic = totalFunctions > 0
      ? Math.round(functions.reduce((sum, f) => sum + f.complexity.cyclomatic, 0) / totalFunctions * 100) / 100
      : 0;
    const avgCognitive = totalFunctions > 0
      ? Math.round(functions.reduce((sum, f) => sum + f.complexity.cognitive, 0) / totalFunctions * 100) / 100
      : 0;

    return `Analyzed ${totalFunctions} functions and ${classCount} classes across ${loc} lines of code. ` +
      `Average cyclomatic complexity: ${avgCyclomatic}, cognitive complexity: ${avgCognitive}. ` +
      `Found ${complexFunctions} function(s) with high or critical complexity.`;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new Code Complexity Analyzer Plugin instance
 */
export function createCodeComplexityAnalyzerPlugin(): CodeComplexityAnalyzerPlugin {
  return new CodeComplexityAnalyzerPlugin();
}

/**
 * Default export for plugin discovery
 */
export default CodeComplexityAnalyzerPlugin;
