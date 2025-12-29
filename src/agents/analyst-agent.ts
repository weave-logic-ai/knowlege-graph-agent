/**
 * Analyst Agent
 *
 * Specialized agent for code analysis, metrics calculation, and quality assessment.
 * Extends BaseAgent with static analysis capabilities and knowledge graph integration.
 *
 * @module agents/analyst-agent
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseAgent } from './base-agent.js';
import {
  AgentType,
  type AgentTask,
  type AgentResult,
  type AnalystAgentConfig,
  type ResultArtifact,
} from './types.js';
import { KnowledgeGraphManager } from '../core/graph.js';
import type { KnowledgeNode } from '../core/types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Analysis type
 */
export type AnalysisType = 'code' | 'data' | 'performance' | 'security' | 'quality';

/**
 * Code metrics
 */
export interface CodeMetrics {
  /** Total lines of code */
  totalLines: number;
  /** Lines of code (excluding comments/blanks) */
  linesOfCode: number;
  /** Comment lines */
  commentLines: number;
  /** Blank lines */
  blankLines: number;
  /** Number of files */
  fileCount: number;
  /** Number of functions */
  functionCount: number;
  /** Number of classes */
  classCount: number;
  /** Average function length */
  avgFunctionLength: number;
  /** Maximum function length */
  maxFunctionLength: number;
  /** Cyclomatic complexity */
  cyclomaticComplexity: number;
  /** Cognitive complexity */
  cognitiveComplexity: number;
  /** Maintainability index (0-100) */
  maintainabilityIndex: number;
  /** Technical debt estimate (hours) */
  technicalDebt: number;
}

/**
 * Quality issue
 */
export interface QualityIssue {
  /** Issue type/category */
  type: string;
  /** Severity level */
  severity: 'info' | 'warning' | 'error' | 'critical';
  /** Issue message */
  message: string;
  /** File path */
  file?: string;
  /** Line number */
  line?: number;
  /** Column number */
  column?: number;
  /** Rule that triggered the issue */
  rule?: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Quality assessment result
 */
export interface QualityAssessment {
  /** Overall quality score (0-100) */
  score: number;
  /** Quality grade (A-F) */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Code metrics */
  metrics: CodeMetrics;
  /** Issues found */
  issues: QualityIssue[];
  /** Recommendations */
  recommendations: string[];
  /** Analysis timestamp */
  timestamp: Date;
}

/**
 * File analysis result
 */
export interface FileAnalysis {
  /** File path */
  path: string;
  /** File type */
  type: string;
  /** Lines of code */
  linesOfCode: number;
  /** Complexity score */
  complexity: number;
  /** Issues in this file */
  issues: QualityIssue[];
  /** Dependencies */
  dependencies: string[];
  /** Exports */
  exports: string[];
}

/**
 * Project analysis result
 */
export interface ProjectAnalysis {
  /** Project name */
  name: string;
  /** Root path */
  rootPath: string;
  /** Overall quality assessment */
  quality: QualityAssessment;
  /** Per-file analysis */
  files: FileAnalysis[];
  /** Dependency analysis */
  dependencies: {
    internal: string[];
    external: string[];
    unused: string[];
    missing: string[];
  };
  /** Hotspots (complex/problematic areas) */
  hotspots: Array<{
    file: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Analyst task type
 */
export type AnalystTaskType = 'analyze' | 'metrics' | 'quality' | 'issues';

// ============================================================================
// Analyst Agent
// ============================================================================

/**
 * Analyst Agent
 *
 * Capabilities:
 * - Code analysis and metrics calculation
 * - Quality assessment and scoring
 * - Issue detection and reporting
 * - Dependency analysis
 *
 * @example
 * ```typescript
 * const analyst = new AnalystAgent({
 *   name: 'analyst-agent',
 *   type: AgentType.ANALYST,
 *   analysisType: 'quality',
 * });
 *
 * const result = await analyst.execute({
 *   id: 'task-1',
 *   description: 'Analyze project quality',
 *   priority: TaskPriority.MEDIUM,
 *   input: {
 *     data: {
 *       projectRoot: '/path/to/project',
 *       analysisType: 'quality'
 *     }
 *   },
 *   createdAt: new Date()
 * });
 * ```
 */
export class AnalystAgent extends BaseAgent {
  /** File patterns to analyze */
  private readonly codePatterns = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs'];

  /** Knowledge graph reference */
  private knowledgeGraph: KnowledgeGraphManager | null = null;

  constructor(config: Partial<AnalystAgentConfig> & { name: string }) {
    super({
      type: AgentType.ANALYST,
      taskTimeout: 300000, // 5 minutes for large projects
      capabilities: ['code-analysis', 'metrics', 'quality-assessment'],
      ...config,
    });
  }

  // ==========================================================================
  // Knowledge Graph Integration
  // ==========================================================================

  /**
   * Set knowledge graph for context-aware analysis
   */
  setKnowledgeGraph(graph: KnowledgeGraphManager): void {
    this.knowledgeGraph = graph;
    this.logger.debug('Knowledge graph attached', {
      nodeCount: graph.getMetadata().nodeCount,
    });
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  /**
   * Execute analyst task
   */
  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    const taskType = (task.input?.parameters?.taskType as AnalystTaskType) || 'analyze';

    switch (taskType) {
      case 'analyze':
        return this.handleAnalyzeTask(task, startTime);
      case 'metrics':
        return this.handleMetricsTask(task, startTime);
      case 'quality':
        return this.handleQualityTask(task, startTime);
      case 'issues':
        return this.handleIssuesTask(task, startTime);
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
   * Analyze code and generate metrics
   */
  async analyzeCode(code: string, filePath: string): Promise<FileAnalysis> {
    this.logger.info('Analyzing code', { file: filePath });

    const metrics = await this.calculateCodeMetrics(code);
    const issues = this.findIssues(code, filePath);
    const dependencies = this.extractDependencies(code);
    const exports = this.extractExports(code);

    return {
      path: filePath,
      type: path.extname(filePath).slice(1),
      linesOfCode: metrics.linesOfCode,
      complexity: metrics.cyclomaticComplexity,
      issues,
      dependencies,
      exports,
    };
  }

  /**
   * Calculate code metrics
   *
   * @remarks Renamed from calculateMetrics to avoid conflict with BaseAgent private method
   */
  async calculateCodeMetrics(code: string): Promise<CodeMetrics> {
    this.logger.debug('Calculating metrics');

    const lines = code.split('\n');
    const totalLines = lines.length;
    const blankLines = lines.filter(l => l.trim().length === 0).length;
    const commentLines = this.countCommentLines(code);
    const linesOfCode = totalLines - blankLines - commentLines;

    const functionCount = this.countFunctions(code);
    const classCount = this.countClasses(code);
    const avgFunctionLength = this.calculateAverageFunctionLength(code);
    const maxFunctionLength = this.calculateMaxFunctionLength(code);
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
    const cognitiveComplexity = this.calculateCognitiveComplexity(code);

    // Calculate maintainability index
    const halsteadVolume = Math.log2(linesOfCode + 1) * linesOfCode;
    const maintainabilityIndex = Math.max(
      0,
      Math.min(
        100,
        171 - 5.2 * Math.log(halsteadVolume) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(linesOfCode)
      )
    );

    // Estimate technical debt (simplified calculation)
    const technicalDebt = this.estimateTechnicalDebt(
      linesOfCode,
      cyclomaticComplexity,
      maintainabilityIndex
    );

    return {
      totalLines,
      linesOfCode,
      commentLines,
      blankLines,
      fileCount: 1,
      functionCount,
      classCount,
      avgFunctionLength: Math.round(avgFunctionLength),
      maxFunctionLength,
      cyclomaticComplexity,
      cognitiveComplexity,
      maintainabilityIndex: Math.round(maintainabilityIndex),
      technicalDebt,
    };
  }

  /**
   * Assess code quality
   */
  async assessQuality(code: string, filePath: string): Promise<QualityAssessment> {
    this.logger.info('Assessing quality', { file: filePath });

    const metrics = await this.calculateCodeMetrics(code);
    const issues = this.findIssues(code, filePath);
    const recommendations = this.generateRecommendations(metrics, issues);

    // Calculate score based on metrics and issues
    const score = this.calculateQualityScore(metrics, issues);
    const grade = this.scoreToGrade(score);

    return {
      score,
      grade,
      metrics,
      issues,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Find issues in code
   */
  findIssues(code: string, filePath: string): QualityIssue[] {
    this.logger.debug('Finding issues', { file: filePath });

    const issues: QualityIssue[] = [];
    const lines = code.split('\n');

    // Check for common issues
    issues.push(...this.findComplexityIssues(code, lines, filePath));
    issues.push(...this.findStyleIssues(code, lines, filePath));
    issues.push(...this.findSecurityIssues(code, lines, filePath));
    issues.push(...this.findMaintainabilityIssues(code, lines, filePath));

    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Analyze entire project
   */
  async analyzeProject(projectRoot: string): Promise<ProjectAnalysis> {
    this.logger.info('Analyzing project', { root: projectRoot });

    const files = await this.findFiles(projectRoot);
    const fileAnalyses: FileAnalysis[] = [];
    let aggregatedMetrics: CodeMetrics = this.createEmptyMetrics();
    const allIssues: QualityIssue[] = [];
    const allDependencies = new Set<string>();
    const allExports = new Set<string>();

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const analysis = await this.analyzeCode(content, path.relative(projectRoot, file));

        fileAnalyses.push(analysis);
        allIssues.push(...analysis.issues);
        analysis.dependencies.forEach(d => allDependencies.add(d));
        analysis.exports.forEach(e => allExports.add(e));

        // Aggregate metrics
        const metrics = await this.calculateCodeMetrics(content);
        aggregatedMetrics = this.aggregateMetrics(aggregatedMetrics, metrics);
      } catch (error) {
        this.logger.warn(`Failed to analyze ${file}`, { error });
      }
    }

    // Calculate overall quality
    const score = this.calculateQualityScore(aggregatedMetrics, allIssues);
    const grade = this.scoreToGrade(score);
    const recommendations = this.generateRecommendations(aggregatedMetrics, allIssues);

    // Identify hotspots
    const hotspots = this.identifyHotspots(fileAnalyses);

    // Analyze dependencies
    const dependencies = this.analyzeDependencies(
      fileAnalyses,
      allDependencies,
      allExports
    );

    return {
      name: path.basename(projectRoot),
      rootPath: projectRoot,
      quality: {
        score,
        grade,
        metrics: aggregatedMetrics,
        issues: allIssues,
        recommendations,
        timestamp: new Date(),
      },
      files: fileAnalyses,
      dependencies,
      hotspots,
    };
  }

  // ==========================================================================
  // Private Task Handlers
  // ==========================================================================

  private async handleAnalyzeTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<ProjectAnalysis | FileAnalysis>> {
    const input = task.input?.data as {
      projectRoot?: string;
      code?: string;
      filePath?: string;
    } | undefined;

    if (input?.projectRoot) {
      try {
        const analysis = await this.analyzeProject(input.projectRoot);
        return this.createSuccessResult(analysis, startTime);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return this.createErrorResult('ANALYSIS_ERROR', `Project analysis failed: ${message}`, startTime) as AgentResult<ProjectAnalysis | FileAnalysis>;
      }
    }

    if (input?.code && input?.filePath) {
      try {
        const analysis = await this.analyzeCode(input.code, input.filePath);
        return this.createSuccessResult(analysis, startTime);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return this.createErrorResult('ANALYSIS_ERROR', `Code analysis failed: ${message}`, startTime) as AgentResult<ProjectAnalysis | FileAnalysis>;
      }
    }

    return this.createErrorResult(
      'VALIDATION_ERROR',
      'Either projectRoot or code+filePath is required',
      startTime
    ) as AgentResult<ProjectAnalysis | FileAnalysis>;
  }

  private async handleMetricsTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<CodeMetrics>> {
    const input = task.input?.data as { code: string } | undefined;

    if (!input?.code) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Code is required for metrics calculation',
        startTime
      ) as AgentResult<CodeMetrics>;
    }

    try {
      const metrics = await this.calculateCodeMetrics(input.code);
      return this.createSuccessResult(metrics, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('METRICS_ERROR', `Metrics calculation failed: ${message}`, startTime) as AgentResult<CodeMetrics>;
    }
  }

  private async handleQualityTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<QualityAssessment>> {
    const input = task.input?.data as { code: string; filePath: string } | undefined;

    if (!input?.code) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Code and file path are required for quality assessment',
        startTime
      ) as AgentResult<QualityAssessment>;
    }

    try {
      const assessment = await this.assessQuality(input.code, input.filePath);
      return this.createSuccessResult(assessment, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('QUALITY_ERROR', `Quality assessment failed: ${message}`, startTime) as AgentResult<QualityAssessment>;
    }
  }

  private async handleIssuesTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<QualityIssue[]>> {
    const input = task.input?.data as { code: string; filePath: string } | undefined;

    if (!input?.code) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Code and file path are required for issue detection',
        startTime
      ) as AgentResult<QualityIssue[]>;
    }

    try {
      const issues = this.findIssues(input.code, input.filePath);
      return this.createSuccessResult(issues, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('ISSUES_ERROR', `Issue detection failed: ${message}`, startTime) as AgentResult<QualityIssue[]>;
    }
  }

  // ==========================================================================
  // Metrics Calculation
  // ==========================================================================

  private countCommentLines(code: string): number {
    let count = 0;
    let inBlockComment = false;

    for (const line of code.split('\n')) {
      const trimmed = line.trim();

      if (inBlockComment) {
        count++;
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
      } else if (trimmed.startsWith('//')) {
        count++;
      } else if (trimmed.startsWith('/*')) {
        count++;
        if (!trimmed.includes('*/')) {
          inBlockComment = true;
        }
      }
    }

    return count;
  }

  private countFunctions(code: string): number {
    const patterns = [
      /function\s+\w+/g,
      /\w+\s*[=:]\s*(?:async\s+)?function/g,
      /\w+\s*[=:]\s*(?:async\s+)?\([^)]*\)\s*=>/g,
      /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g,
    ];

    let count = 0;
    for (const pattern of patterns) {
      const matches = code.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }

    return count;
  }

  private countClasses(code: string): number {
    const matches = code.match(/\bclass\s+\w+/g);
    return matches ? matches.length : 0;
  }

  private calculateAverageFunctionLength(code: string): number {
    const functionCount = this.countFunctions(code);
    if (functionCount === 0) return 0;

    const lines = code.split('\n').filter(l => l.trim().length > 0);
    return lines.length / functionCount;
  }

  private calculateMaxFunctionLength(code: string): number {
    let maxLength = 0;
    let currentLength = 0;
    let braceCount = 0;
    let inFunction = false;

    for (const line of code.split('\n')) {
      if (/(?:function|=>)\s*\{?/.test(line) && !inFunction) {
        inFunction = true;
        currentLength = 0;
      }

      if (inFunction) {
        currentLength++;
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount <= 0) {
          maxLength = Math.max(maxLength, currentLength);
          inFunction = false;
          currentLength = 0;
        }
      }
    }

    return maxLength;
  }

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

    for (const line of code.split('\n')) {
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

  private estimateTechnicalDebt(
    linesOfCode: number,
    complexity: number,
    maintainability: number
  ): number {
    // Simplified technical debt estimation in hours
    const complexityDebt = Math.max(0, complexity - 10) * 0.5;
    const maintainabilityDebt = Math.max(0, 100 - maintainability) * 0.1;
    const sizeDebt = Math.max(0, linesOfCode - 500) * 0.01;

    return Math.round((complexityDebt + maintainabilityDebt + sizeDebt) * 10) / 10;
  }

  // ==========================================================================
  // Issue Detection
  // ==========================================================================

  private findComplexityIssues(
    code: string,
    lines: string[],
    filePath: string
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for deep nesting
    let maxNesting = 0;
    let maxNestingLine = 0;
    let currentNesting = 0;

    for (let i = 0; i < lines.length; i++) {
      currentNesting += (lines[i].match(/{/g) || []).length;
      currentNesting -= (lines[i].match(/}/g) || []).length;

      if (currentNesting > maxNesting) {
        maxNesting = currentNesting;
        maxNestingLine = i + 1;
      }
    }

    if (maxNesting > 4) {
      issues.push({
        type: 'complexity',
        severity: maxNesting > 6 ? 'error' : 'warning',
        message: `Deep nesting detected (${maxNesting} levels)`,
        file: filePath,
        line: maxNestingLine,
        rule: 'max-depth',
        suggestion: 'Consider extracting nested logic into separate functions',
      });
    }

    // Check for long functions
    const complexity = this.calculateCyclomaticComplexity(code);
    if (complexity > 15) {
      issues.push({
        type: 'complexity',
        severity: complexity > 25 ? 'error' : 'warning',
        message: `High cyclomatic complexity (${complexity})`,
        file: filePath,
        rule: 'complexity',
        suggestion: 'Break down complex functions into smaller, focused ones',
      });
    }

    return issues;
  }

  private findStyleIssues(
    code: string,
    lines: string[],
    filePath: string
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for console.log statements
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('console.log')) {
        issues.push({
          type: 'style',
          severity: 'warning',
          message: 'Unexpected console.log statement',
          file: filePath,
          line: i + 1,
          rule: 'no-console',
          suggestion: 'Remove or replace with proper logging',
        });
      }
    }

    // Check for var usage
    for (let i = 0; i < lines.length; i++) {
      if (/\bvar\s+/.test(lines[i])) {
        issues.push({
          type: 'style',
          severity: 'warning',
          message: 'Use const or let instead of var',
          file: filePath,
          line: i + 1,
          rule: 'no-var',
          suggestion: 'Replace var with const or let',
        });
      }
    }

    // Check for long lines
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 120) {
        issues.push({
          type: 'style',
          severity: 'info',
          message: `Line too long (${lines[i].length} characters)`,
          file: filePath,
          line: i + 1,
          rule: 'max-len',
          suggestion: 'Break long lines for better readability',
        });
      }
    }

    return issues;
  }

  private findSecurityIssues(
    code: string,
    lines: string[],
    filePath: string
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for eval usage
    for (let i = 0; i < lines.length; i++) {
      if (/\beval\s*\(/.test(lines[i])) {
        issues.push({
          type: 'security',
          severity: 'critical',
          message: 'Avoid using eval()',
          file: filePath,
          line: i + 1,
          rule: 'no-eval',
          suggestion: 'Use safer alternatives to eval',
        });
      }
    }

    // Check for hardcoded secrets patterns
    for (let i = 0; i < lines.length; i++) {
      if (/(?:password|secret|api_key|apikey)\s*[:=]\s*['"][^'"]+['"]/i.test(lines[i])) {
        issues.push({
          type: 'security',
          severity: 'critical',
          message: 'Potential hardcoded secret detected',
          file: filePath,
          line: i + 1,
          rule: 'no-secrets',
          suggestion: 'Use environment variables for secrets',
        });
      }
    }

    // Check for innerHTML usage
    for (let i = 0; i < lines.length; i++) {
      if (/\.innerHTML\s*=/.test(lines[i])) {
        issues.push({
          type: 'security',
          severity: 'warning',
          message: 'Avoid using innerHTML, potential XSS vulnerability',
          file: filePath,
          line: i + 1,
          rule: 'no-inner-html',
          suggestion: 'Use textContent or sanitize HTML',
        });
      }
    }

    return issues;
  }

  private findMaintainabilityIssues(
    code: string,
    lines: string[],
    filePath: string
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for TODO/FIXME comments
    for (let i = 0; i < lines.length; i++) {
      if (/\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(lines[i])) {
        const match = lines[i].match(/\/\/\s*(TODO|FIXME|HACK|XXX)/i);
        issues.push({
          type: 'maintainability',
          severity: 'info',
          message: `${match![1]} comment found`,
          file: filePath,
          line: i + 1,
          rule: 'no-warning-comments',
          suggestion: 'Address and remove the comment',
        });
      }
    }

    // Check for magic numbers
    for (let i = 0; i < lines.length; i++) {
      if (/[^a-zA-Z]\d{3,}[^a-zA-Z]/.test(lines[i]) && !lines[i].includes('//')) {
        issues.push({
          type: 'maintainability',
          severity: 'info',
          message: 'Magic number detected',
          file: filePath,
          line: i + 1,
          rule: 'no-magic-numbers',
          suggestion: 'Extract to a named constant',
        });
      }
    }

    // Check for any type usage
    for (let i = 0; i < lines.length; i++) {
      if (/:\s*any\b/.test(lines[i])) {
        issues.push({
          type: 'maintainability',
          severity: 'warning',
          message: 'Avoid using any type',
          file: filePath,
          line: i + 1,
          rule: 'no-any',
          suggestion: 'Use a more specific type',
        });
      }
    }

    return issues;
  }

  // ==========================================================================
  // Quality Scoring
  // ==========================================================================

  private calculateQualityScore(metrics: CodeMetrics, issues: QualityIssue[]): number {
    let score = 100;

    // Deduct for complexity
    if (metrics.cyclomaticComplexity > 10) {
      score -= Math.min(20, (metrics.cyclomaticComplexity - 10) * 2);
    }

    // Deduct for maintainability
    score -= Math.max(0, 50 - metrics.maintainabilityIndex) * 0.5;

    // Deduct for issues
    const issueDeductions = {
      critical: 10,
      error: 5,
      warning: 2,
      info: 0.5,
    };

    for (const issue of issues) {
      score -= issueDeductions[issue.severity];
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // ==========================================================================
  // Recommendations
  // ==========================================================================

  private generateRecommendations(
    metrics: CodeMetrics,
    issues: QualityIssue[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.cyclomaticComplexity > 15) {
      recommendations.push(
        'Reduce cyclomatic complexity by breaking down complex functions'
      );
    }

    if (metrics.maintainabilityIndex < 50) {
      recommendations.push(
        'Improve code maintainability through refactoring and documentation'
      );
    }

    if (metrics.avgFunctionLength > 30) {
      recommendations.push(
        'Keep functions shorter (under 30 lines) for better readability'
      );
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(
        `Address ${criticalIssues.length} critical issue(s) immediately`
      );
    }

    const securityIssues = issues.filter(i => i.type === 'security');
    if (securityIssues.length > 0) {
      recommendations.push(
        `Fix ${securityIssues.length} security issue(s) to improve safety`
      );
    }

    if (metrics.commentLines / metrics.linesOfCode < 0.1) {
      recommendations.push(
        'Consider adding more documentation comments'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Code quality is good! Keep up the good work.');
    }

    return recommendations;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private createEmptyMetrics(): CodeMetrics {
    return {
      totalLines: 0,
      linesOfCode: 0,
      commentLines: 0,
      blankLines: 0,
      fileCount: 0,
      functionCount: 0,
      classCount: 0,
      avgFunctionLength: 0,
      maxFunctionLength: 0,
      cyclomaticComplexity: 0,
      cognitiveComplexity: 0,
      maintainabilityIndex: 100,
      technicalDebt: 0,
    };
  }

  private aggregateMetrics(current: CodeMetrics, additional: CodeMetrics): CodeMetrics {
    return {
      totalLines: current.totalLines + additional.totalLines,
      linesOfCode: current.linesOfCode + additional.linesOfCode,
      commentLines: current.commentLines + additional.commentLines,
      blankLines: current.blankLines + additional.blankLines,
      fileCount: current.fileCount + 1,
      functionCount: current.functionCount + additional.functionCount,
      classCount: current.classCount + additional.classCount,
      avgFunctionLength: Math.round(
        (current.avgFunctionLength * current.fileCount + additional.avgFunctionLength) /
        (current.fileCount + 1)
      ),
      maxFunctionLength: Math.max(current.maxFunctionLength, additional.maxFunctionLength),
      cyclomaticComplexity: current.cyclomaticComplexity + additional.cyclomaticComplexity,
      cognitiveComplexity: current.cognitiveComplexity + additional.cognitiveComplexity,
      maintainabilityIndex: Math.round(
        (current.maintainabilityIndex * current.fileCount + additional.maintainabilityIndex) /
        (current.fileCount + 1)
      ),
      technicalDebt: current.technicalDebt + additional.technicalDebt,
    };
  }

  private extractDependencies(code: string): string[] {
    const dependencies: string[] = [];

    // Extract imports
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      dependencies.push(match[1]);
    }

    // Extract requires
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(code)) !== null) {
      dependencies.push(match[1]);
    }

    return [...new Set(dependencies)];
  }

  private extractExports(code: string): string[] {
    const exports: string[] = [];

    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(code)) !== null) {
      exports.push(match[1]);
    }

    // Export declarations
    const exportDeclRegex = /export\s*\{([^}]+)\}/g;
    while ((match = exportDeclRegex.exec(code)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      exports.push(...names);
    }

    return [...new Set(exports.filter(e => e))];
  }

  private identifyHotspots(files: FileAnalysis[]): Array<{
    file: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    const hotspots: Array<{
      file: string;
      reason: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    for (const file of files) {
      if (file.complexity > 20) {
        hotspots.push({
          file: file.path,
          reason: `High complexity (${file.complexity})`,
          severity: file.complexity > 30 ? 'high' : 'medium',
        });
      }

      const criticalIssues = file.issues.filter(i => i.severity === 'critical');
      if (criticalIssues.length > 0) {
        hotspots.push({
          file: file.path,
          reason: `${criticalIssues.length} critical issue(s)`,
          severity: 'high',
        });
      }

      if (file.linesOfCode > 500) {
        hotspots.push({
          file: file.path,
          reason: `Large file (${file.linesOfCode} LOC)`,
          severity: file.linesOfCode > 1000 ? 'high' : 'medium',
        });
      }
    }

    return hotspots.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });
  }

  private analyzeDependencies(
    files: FileAnalysis[],
    allDependencies: Set<string>,
    allExports: Set<string>
  ): {
    internal: string[];
    external: string[];
    unused: string[];
    missing: string[];
  } {
    const internal: string[] = [];
    const external: string[] = [];

    for (const dep of allDependencies) {
      if (dep.startsWith('.') || dep.startsWith('/')) {
        internal.push(dep);
      } else {
        external.push(dep);
      }
    }

    // Simplified unused/missing detection
    return {
      internal: [...new Set(internal)],
      external: [...new Set(external)],
      unused: [], // Would require deeper analysis
      missing: [], // Would require package.json parsing
    };
  }

  private async findFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name.startsWith('.')
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.findFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (this.codePatterns.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return files;
  }
}

