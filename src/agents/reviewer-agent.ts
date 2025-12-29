/**
 * Reviewer Agent
 *
 * Specialized agent for code review, security auditing, performance analysis,
 * and best practices validation. Extends BaseAgent with review-specific capabilities.
 *
 * @module agents/reviewer-agent
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseAgent } from './base-agent.js';
import {
  AgentType,
  type AgentTask,
  type AgentResult,
  type AgentConfig,
  type ResultArtifact,
} from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Reviewer agent configuration
 */
export interface ReviewerAgentConfig extends AgentConfig {
  type: AgentType.REVIEWER;
  /** Default severity threshold for issues */
  severityThreshold?: ReviewSeverity;
  /** Enable security scanning */
  enableSecurityAudit?: boolean;
  /** Enable performance analysis */
  enablePerformanceAnalysis?: boolean;
  /** Custom rules file path */
  customRulesPath?: string;
}

/**
 * Review context for code analysis
 */
export interface ReviewContext {
  /** File path being reviewed */
  filePath: string;
  /** Programming language */
  language: string;
  /** Project context or description */
  projectContext?: string;
  /** File content (if already loaded) */
  content?: string;
  /** Specific line range to review */
  lineRange?: { start: number; end: number };
}

/**
 * Issue severity levels
 */
export type ReviewSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Issue category types
 */
export type ReviewCategory = 'bug' | 'security' | 'performance' | 'style' | 'documentation' | 'maintainability';

/**
 * Individual review issue
 */
export interface ReviewIssue {
  /** Severity level */
  severity: ReviewSeverity;
  /** Issue category */
  category: ReviewCategory;
  /** Line number where issue occurs */
  line: number;
  /** Column number (optional) */
  column?: number;
  /** Issue description */
  message: string;
  /** Suggested fix */
  suggestion?: string;
  /** Rule ID that triggered this issue */
  ruleId?: string;
  /** Code snippet showing the issue */
  codeSnippet?: string;
}

/**
 * Code review result
 */
export interface CodeReviewResult {
  /** Overall summary of the review */
  summary: string;
  /** List of issues found */
  issues: ReviewIssue[];
  /** General suggestions for improvement */
  suggestions: string[];
  /** Code quality metrics */
  metrics: {
    /** Cyclomatic complexity score */
    complexity: number;
    /** Maintainability index (0-100) */
    maintainability: number;
    /** Testability score (0-100) */
    testability: number;
    /** Lines of code */
    linesOfCode: number;
    /** Comment ratio */
    commentRatio: number;
  };
  /** Files reviewed */
  filesReviewed: string[];
  /** Total issues by severity */
  issueCounts: Record<ReviewSeverity, number>;
}

/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
  /** Vulnerability type */
  type: string;
  /** Severity level */
  severity: ReviewSeverity;
  /** Location in code */
  location: string;
  /** Line number */
  line?: number;
  /** Detailed description */
  description: string;
  /** CVE reference if applicable */
  cveReference?: string;
  /** Recommended remediation steps */
  remediation: string;
  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * Security audit result
 */
export interface SecurityAuditResult {
  /** List of vulnerabilities found */
  vulnerabilities: SecurityVulnerability[];
  /** Overall security score (0-100) */
  score: number;
  /** Summary of findings */
  summary: string;
  /** Files audited */
  filesAudited: string[];
  /** Vulnerability counts by severity */
  vulnerabilityCounts: Record<ReviewSeverity, number>;
  /** Recommendations */
  recommendations: string[];
}

/**
 * Performance issue
 */
export interface PerformanceIssue {
  /** Issue type */
  type: string;
  /** Severity */
  severity: ReviewSeverity;
  /** Location */
  location: string;
  /** Line number */
  line?: number;
  /** Description */
  description: string;
  /** Optimization suggestion */
  suggestion: string;
  /** Estimated impact */
  impact: 'high' | 'medium' | 'low';
}

/**
 * Performance analysis result
 */
export interface PerformanceAnalysisResult {
  /** Performance issues found */
  issues: PerformanceIssue[];
  /** Overall performance score (0-100) */
  score: number;
  /** Summary */
  summary: string;
  /** Optimization opportunities */
  optimizations: string[];
  /** Estimated complexity */
  timeComplexity?: string;
  /** Space complexity estimate */
  spaceComplexity?: string;
}

/**
 * Best practices check result
 */
export interface BestPracticesResult {
  /** Passed checks */
  passed: string[];
  /** Failed checks */
  failed: Array<{
    rule: string;
    message: string;
    severity: ReviewSeverity;
    location?: string;
  }>;
  /** Overall compliance score (0-100) */
  score: number;
  /** Summary */
  summary: string;
  /** Standards validated against */
  standards: string;
}

/**
 * Review action types
 */
export type ReviewAction =
  | 'code_review'
  | 'security_audit'
  | 'performance_analysis'
  | 'best_practices'
  | 'documentation_review';

// ============================================================================
// Reviewer Agent
// ============================================================================

/**
 * Reviewer Agent
 *
 * Capabilities:
 * - Code review and quality analysis
 * - Security vulnerability scanning
 * - Performance analysis and optimization suggestions
 * - Best practices validation
 * - Documentation review
 *
 * @example
 * ```typescript
 * const reviewer = new ReviewerAgent({
 *   name: 'code-reviewer',
 *   type: AgentType.REVIEWER,
 * });
 *
 * const result = await reviewer.execute({
 *   id: 'task-1',
 *   description: 'Review authentication module',
 *   priority: TaskPriority.HIGH,
 *   input: {
 *     data: {
 *       action: 'code_review',
 *       filePath: 'src/auth/login.ts',
 *       language: 'typescript',
 *     }
 *   },
 *   createdAt: new Date()
 * });
 * ```
 */
export class ReviewerAgent extends BaseAgent {
  /** Agent type */
  readonly agentType = AgentType.REVIEWER;

  /** Agent capabilities */
  readonly capabilities = [
    'code_review',
    'security_audit',
    'performance_analysis',
    'best_practices',
    'documentation_review',
  ];

  /** Security patterns to detect */
  private readonly securityPatterns: Array<{
    name: string;
    pattern: RegExp;
    severity: ReviewSeverity;
    description: string;
    remediation: string;
  }> = [
    {
      name: 'SQL Injection',
      pattern: /(\$\{.*?\}|' ?\+ ?[a-zA-Z]|\+ ?['"])/,
      severity: 'critical',
      description: 'Potential SQL injection vulnerability through string concatenation',
      remediation: 'Use parameterized queries or prepared statements',
    },
    {
      name: 'Hardcoded Secret',
      pattern: /(password|secret|api_?key|token|credential)\s*[:=]\s*['"][^'"]{8,}['"]/i,
      severity: 'critical',
      description: 'Hardcoded secret or credential detected',
      remediation: 'Use environment variables or secure secret management',
    },
    {
      name: 'Eval Usage',
      pattern: /\beval\s*\(/,
      severity: 'high',
      description: 'Use of eval() can lead to code injection',
      remediation: 'Avoid eval() and use safer alternatives',
    },
    {
      name: 'Unsafe innerHTML',
      pattern: /\.innerHTML\s*=/,
      severity: 'high',
      description: 'Direct innerHTML assignment can lead to XSS',
      remediation: 'Use textContent or sanitize HTML input',
    },
    {
      name: 'Weak Crypto',
      pattern: /\b(md5|sha1)\s*\(/i,
      severity: 'medium',
      description: 'Weak cryptographic algorithm detected',
      remediation: 'Use SHA-256 or stronger algorithms',
    },
    {
      name: 'Insecure Regex',
      pattern: /new RegExp\s*\([^)]*\+/,
      severity: 'medium',
      description: 'Dynamic regex construction may lead to ReDoS',
      remediation: 'Validate regex input or use static patterns',
    },
    {
      name: 'Missing HTTPS',
      pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/,
      severity: 'medium',
      description: 'Insecure HTTP URL detected',
      remediation: 'Use HTTPS for all external URLs',
    },
    {
      name: 'Console Log',
      pattern: /console\.(log|debug|info)\s*\(/,
      severity: 'low',
      description: 'Console logging should be removed in production',
      remediation: 'Remove or replace with proper logging framework',
    },
  ];

  /** Performance anti-patterns */
  private readonly performancePatterns: Array<{
    name: string;
    pattern: RegExp;
    impact: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
  }> = [
    {
      name: 'N+1 Query Pattern',
      pattern: /for\s*\([^)]+\)\s*\{[^}]*await\s+.*\.(find|query|fetch|get)/,
      impact: 'high',
      description: 'Potential N+1 query pattern detected',
      suggestion: 'Batch queries or use eager loading',
    },
    {
      name: 'Sync in Loop',
      pattern: /for\s*\([^)]+\)\s*\{[^}]*(readFileSync|writeFileSync)/,
      impact: 'high',
      description: 'Synchronous file operations in loop',
      suggestion: 'Use async operations with Promise.all',
    },
    {
      name: 'Missing Memoization',
      pattern: /useMemo|useCallback|memo\(/,
      impact: 'medium',
      description: 'Component may benefit from memoization',
      suggestion: 'Consider useMemo/useCallback for expensive operations',
    },
    {
      name: 'Large Array Copy',
      pattern: /\.concat\(|\.slice\(\)|Array\.from\(/,
      impact: 'medium',
      description: 'Large array copy operation detected',
      suggestion: 'Consider using spread operator or avoid copying if possible',
    },
    {
      name: 'Nested Loop',
      pattern: /for\s*\([^)]+\)\s*\{[^}]*for\s*\([^)]+\)/,
      impact: 'medium',
      description: 'Nested loops may cause O(n^2) complexity',
      suggestion: 'Consider using Map/Set for O(1) lookups',
    },
    {
      name: 'Inefficient String Concat',
      pattern: /\+=\s*['"][^'"]*['"]\s*;/,
      impact: 'low',
      description: 'String concatenation in loop',
      suggestion: 'Use array.join() or template literals',
    },
  ];

  /** Code quality rules */
  private readonly codeQualityRules: Array<{
    id: string;
    name: string;
    pattern: RegExp;
    category: ReviewCategory;
    severity: ReviewSeverity;
    message: string;
    suggestion?: string;
  }> = [
    {
      id: 'no-any',
      name: 'No Any Type',
      pattern: /:\s*any\b/,
      category: 'maintainability',
      severity: 'medium',
      message: 'Avoid using "any" type',
      suggestion: 'Use specific types or "unknown"',
    },
    {
      id: 'no-magic-numbers',
      name: 'No Magic Numbers',
      pattern: /(?<![\d.])[2-9]\d{2,}(?![\d.])/,
      category: 'maintainability',
      severity: 'low',
      message: 'Magic number detected',
      suggestion: 'Extract to named constant',
    },
    {
      id: 'max-function-length',
      name: 'Long Function',
      pattern: /function\s+\w+[^{]*\{[\s\S]{2000,}?\}/,
      category: 'maintainability',
      severity: 'medium',
      message: 'Function is too long (> 50 lines)',
      suggestion: 'Split into smaller functions',
    },
    {
      id: 'no-nested-callbacks',
      name: 'Nested Callbacks',
      pattern: /\(\s*\([^)]*\)\s*=>\s*\{[^}]*\(\s*\([^)]*\)\s*=>\s*\{/,
      category: 'maintainability',
      severity: 'medium',
      message: 'Deeply nested callbacks detected',
      suggestion: 'Use async/await or extract to named functions',
    },
    {
      id: 'missing-error-handling',
      name: 'Missing Error Handling',
      pattern: /\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/,
      category: 'bug',
      severity: 'high',
      message: 'Empty catch block swallows errors',
      suggestion: 'Handle or rethrow errors properly',
    },
    {
      id: 'no-console',
      name: 'Console Statement',
      pattern: /console\.(log|warn|error|debug)\s*\(/,
      category: 'style',
      severity: 'info',
      message: 'Console statement found',
      suggestion: 'Remove or use proper logging',
    },
    {
      id: 'missing-jsdoc',
      name: 'Missing Documentation',
      pattern: /export\s+(function|class|const)\s+[A-Z]/,
      category: 'documentation',
      severity: 'low',
      message: 'Public export missing JSDoc documentation',
      suggestion: 'Add JSDoc comments for public APIs',
    },
    {
      id: 'todo-comment',
      name: 'TODO Comment',
      pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)/i,
      category: 'maintainability',
      severity: 'info',
      message: 'TODO/FIXME comment found',
      suggestion: 'Address or create issue for tracking',
    },
  ];

  constructor(config: Partial<ReviewerAgentConfig> & { name: string }) {
    super({
      type: AgentType.REVIEWER,
      taskTimeout: 180000, // 3 minutes
      capabilities: [
        'code_review',
        'security_audit',
        'performance_analysis',
        'best_practices',
        'documentation_review',
      ],
      ...config,
    });
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  /**
   * Execute review task
   */
  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    const input = task.input?.data as {
      action?: ReviewAction;
      filePath?: string;
      files?: string[];
      code?: string;
      language?: string;
      projectContext?: string;
      standards?: string;
    } | undefined;

    if (!input?.action) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Review action is required in task input.data',
        startTime
      );
    }

    try {
      const projectRoot = (task.input?.context?.projectRoot as string) || process.cwd();

      switch (input.action) {
        case 'code_review': {
          if (!input.filePath && !input.code && !input.files) {
            return this.createErrorResult(
              'VALIDATION_ERROR',
              'Either filePath, files array, or code is required for code review',
              startTime
            );
          }
          const context: ReviewContext = {
            filePath: input.filePath || 'inline-code',
            language: input.language || this.detectLanguage(input.filePath || ''),
            projectContext: input.projectContext,
            content: input.code,
          };
          const result = await this.reviewCode(
            input.code || '',
            context,
            input.files ? input.files.map(f => path.join(projectRoot, f)) : undefined
          );
          return this.createSuccessResult(result, startTime, [
            {
              type: 'report',
              name: 'code-review',
              content: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ]);
        }

        case 'security_audit': {
          const files = input.files?.map(f => path.join(projectRoot, f)) || [];
          const result = await this.securityAudit(files);
          return this.createSuccessResult(result, startTime, [
            {
              type: 'report',
              name: 'security-audit',
              content: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ]);
        }

        case 'performance_analysis': {
          if (!input.code && !input.filePath) {
            return this.createErrorResult(
              'VALIDATION_ERROR',
              'Either code or filePath is required for performance analysis',
              startTime
            );
          }
          const code = input.code || await this.readFile(path.join(projectRoot, input.filePath!));
          const result = await this.analyzePerformance(code);
          return this.createSuccessResult(result, startTime, [
            {
              type: 'report',
              name: 'performance-analysis',
              content: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ]);
        }

        case 'best_practices': {
          if (!input.code && !input.filePath) {
            return this.createErrorResult(
              'VALIDATION_ERROR',
              'Either code or filePath is required for best practices check',
              startTime
            );
          }
          const code = input.code || await this.readFile(path.join(projectRoot, input.filePath!));
          const result = await this.checkBestPractices(code, input.standards || 'default');
          return this.createSuccessResult(result, startTime, [
            {
              type: 'report',
              name: 'best-practices',
              content: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ]);
        }

        case 'documentation_review': {
          if (!input.code && !input.filePath) {
            return this.createErrorResult(
              'VALIDATION_ERROR',
              'Either code or filePath is required for documentation review',
              startTime
            );
          }
          const code = input.code || await this.readFile(path.join(projectRoot, input.filePath!));
          const result = await this.reviewDocumentation(code, input.filePath || 'inline');
          return this.createSuccessResult(result, startTime, [
            {
              type: 'report',
              name: 'documentation-review',
              content: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ]);
        }

        default:
          return this.createErrorResult(
            'VALIDATION_ERROR',
            `Unknown review action: ${input.action}`,
            startTime
          );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('REVIEW_ERROR', `Review failed: ${message}`, startTime);
    }
  }

  // ==========================================================================
  // Public Review Methods
  // ==========================================================================

  /**
   * Perform comprehensive code review
   */
  async reviewCode(
    code: string,
    context: ReviewContext,
    additionalFiles?: string[]
  ): Promise<CodeReviewResult> {
    this.logger.info('Starting code review', { filePath: context.filePath, language: context.language });

    const issues: ReviewIssue[] = [];
    const filesReviewed: string[] = [];
    let totalCode = code;

    // Load file content if not provided
    if (!code && context.filePath !== 'inline-code') {
      try {
        totalCode = await this.readFile(context.filePath);
        filesReviewed.push(context.filePath);
      } catch (error) {
        this.logger.warn('Could not read file', { filePath: context.filePath, error });
      }
    } else if (code) {
      filesReviewed.push(context.filePath);
    }

    // Load additional files
    if (additionalFiles) {
      for (const file of additionalFiles) {
        try {
          const content = await this.readFile(file);
          totalCode += '\n' + content;
          filesReviewed.push(file);
        } catch {
          this.logger.warn('Could not read additional file', { file });
        }
      }
    }

    // Run code quality checks
    const qualityIssues = this.checkCodeQuality(totalCode);
    issues.push(...qualityIssues);

    // Run security checks (lightweight)
    const securityIssues = this.checkSecurityIssues(totalCode);
    issues.push(...securityIssues.map(v => ({
      severity: v.severity,
      category: 'security' as ReviewCategory,
      line: v.line || 0,
      message: v.description,
      suggestion: v.remediation,
      ruleId: v.type,
    })));

    // Calculate metrics
    const metrics = this.calculateCodeMetrics(totalCode);

    // Generate suggestions based on issues
    const suggestions = this.generateSuggestions(issues, metrics);

    // Count issues by severity
    const issueCounts: Record<ReviewSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    for (const issue of issues) {
      issueCounts[issue.severity]++;
    }

    // Generate summary
    const summary = this.generateReviewSummary(issues, metrics, filesReviewed);

    return {
      summary,
      issues,
      suggestions,
      metrics,
      filesReviewed,
      issueCounts,
    };
  }

  /**
   * Perform security audit on files
   */
  async securityAudit(files: string[]): Promise<SecurityAuditResult> {
    this.logger.info('Starting security audit', { fileCount: files.length });

    const vulnerabilities: SecurityVulnerability[] = [];
    const filesAudited: string[] = [];

    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const fileVulns = this.checkSecurityIssues(content, file);
        vulnerabilities.push(...fileVulns);
        filesAudited.push(file);
      } catch (error) {
        this.logger.warn('Could not audit file', { file, error });
      }
    }

    // Count by severity
    const vulnerabilityCounts: Record<ReviewSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    for (const vuln of vulnerabilities) {
      vulnerabilityCounts[vuln.severity]++;
    }

    // Calculate score (100 - weighted penalty)
    const score = Math.max(0, Math.min(100,
      100 -
      (vulnerabilityCounts.critical * 25) -
      (vulnerabilityCounts.high * 15) -
      (vulnerabilityCounts.medium * 5) -
      (vulnerabilityCounts.low * 2) -
      (vulnerabilityCounts.info * 0.5)
    ));

    // Generate recommendations
    const recommendations = this.generateSecurityRecommendations(vulnerabilities);

    // Generate summary
    const totalVulns = vulnerabilities.length;
    const summary = totalVulns === 0
      ? 'No security vulnerabilities detected.'
      : `Found ${totalVulns} security issue(s): ${vulnerabilityCounts.critical} critical, ${vulnerabilityCounts.high} high, ${vulnerabilityCounts.medium} medium, ${vulnerabilityCounts.low} low.`;

    return {
      vulnerabilities,
      score,
      summary,
      filesAudited,
      vulnerabilityCounts,
      recommendations,
    };
  }

  /**
   * Analyze code for performance issues
   */
  async analyzePerformance(code: string): Promise<PerformanceAnalysisResult> {
    this.logger.info('Starting performance analysis');

    const issues: PerformanceIssue[] = [];
    const lines = code.split('\n');

    // Check for performance anti-patterns
    for (const pattern of this.performancePatterns) {
      let match: RegExpExecArray | null;
      const globalPattern = new RegExp(pattern.pattern.source, 'g');

      while ((match = globalPattern.exec(code)) !== null) {
        const lineNumber = code.substring(0, match.index).split('\n').length;
        issues.push({
          type: pattern.name,
          severity: pattern.impact === 'high' ? 'high' : pattern.impact === 'medium' ? 'medium' : 'low',
          location: `Line ${lineNumber}`,
          line: lineNumber,
          description: pattern.description,
          suggestion: pattern.suggestion,
          impact: pattern.impact,
        });
      }
    }

    // Calculate score
    const score = Math.max(0, Math.min(100,
      100 -
      (issues.filter(i => i.impact === 'high').length * 15) -
      (issues.filter(i => i.impact === 'medium').length * 8) -
      (issues.filter(i => i.impact === 'low').length * 3)
    ));

    // Estimate complexity
    const timeComplexity = this.estimateTimeComplexity(code);
    const spaceComplexity = this.estimateSpaceComplexity(code);

    // Generate optimizations
    const optimizations = this.generateOptimizations(issues, code);

    // Summary
    const summary = issues.length === 0
      ? 'No significant performance issues detected.'
      : `Found ${issues.length} performance issue(s): ${issues.filter(i => i.impact === 'high').length} high impact, ${issues.filter(i => i.impact === 'medium').length} medium impact.`;

    return {
      issues,
      score,
      summary,
      optimizations,
      timeComplexity,
      spaceComplexity,
    };
  }

  /**
   * Check code against best practices
   */
  async checkBestPractices(code: string, standards: string): Promise<BestPracticesResult> {
    this.logger.info('Checking best practices', { standards });

    const passed: string[] = [];
    const failed: Array<{
      rule: string;
      message: string;
      severity: ReviewSeverity;
      location?: string;
    }> = [];

    // Define standard rules to check
    const rules = this.getBestPracticeRules(standards);

    for (const rule of rules) {
      const matches = code.match(rule.pattern);
      if (rule.shouldMatch) {
        if (matches) {
          passed.push(rule.name);
        } else {
          failed.push({
            rule: rule.name,
            message: rule.failMessage,
            severity: rule.severity,
          });
        }
      } else {
        if (matches) {
          const lineNumber = code.substring(0, code.indexOf(matches[0])).split('\n').length;
          failed.push({
            rule: rule.name,
            message: rule.failMessage,
            severity: rule.severity,
            location: `Line ${lineNumber}`,
          });
        } else {
          passed.push(rule.name);
        }
      }
    }

    // Calculate score
    const total = passed.length + failed.length;
    const score = total > 0 ? Math.round((passed.length / total) * 100) : 100;

    // Summary
    const summary = failed.length === 0
      ? `All ${passed.length} best practice checks passed.`
      : `${passed.length} of ${total} best practice checks passed. ${failed.length} violations found.`;

    return {
      passed,
      failed,
      score,
      summary,
      standards,
    };
  }

  /**
   * Review documentation quality
   */
  async reviewDocumentation(code: string, filePath: string): Promise<{
    score: number;
    issues: Array<{ type: string; message: string; severity: ReviewSeverity }>;
    suggestions: string[];
    coverage: { documented: number; total: number; percentage: number };
  }> {
    this.logger.info('Reviewing documentation', { filePath });

    const issues: Array<{ type: string; message: string; severity: ReviewSeverity }> = [];
    const suggestions: string[] = [];

    // Count documented vs undocumented exports
    const exportMatches = code.match(/export\s+(function|class|const|interface|type|enum)\s+\w+/g) || [];
    const jsdocMatches = code.match(/\/\*\*[\s\S]*?\*\/\s*export/g) || [];

    const documented = jsdocMatches.length;
    const total = exportMatches.length;
    const percentage = total > 0 ? Math.round((documented / total) * 100) : 100;

    // Check for missing documentation
    if (percentage < 80) {
      issues.push({
        type: 'low-coverage',
        message: `Documentation coverage is ${percentage}% (recommended: >= 80%)`,
        severity: 'medium',
      });
      suggestions.push('Add JSDoc comments to public exports');
    }

    // Check for incomplete JSDoc
    const incompleteJsdoc = code.match(/\/\*\*\s*\*\s*@/g) || [];
    if (incompleteJsdoc.length > 0) {
      issues.push({
        type: 'incomplete-jsdoc',
        message: `${incompleteJsdoc.length} JSDoc comments are missing descriptions`,
        severity: 'low',
      });
      suggestions.push('Add descriptions to JSDoc comments');
    }

    // Check for @param/@returns completeness
    const functionDocs = code.match(/\/\*\*[\s\S]*?\*\/\s*(?:export\s+)?(?:async\s+)?function/g) || [];
    const paramDocs = code.match(/@param/g) || [];
    const returnDocs = code.match(/@returns?/g) || [];

    if (functionDocs.length > returnDocs.length) {
      issues.push({
        type: 'missing-return-docs',
        message: 'Some functions are missing @returns documentation',
        severity: 'info',
      });
    }

    // Calculate score
    let score = percentage;
    score -= issues.filter(i => i.severity === 'high').length * 15;
    score -= issues.filter(i => i.severity === 'medium').length * 10;
    score -= issues.filter(i => i.severity === 'low').length * 5;
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      issues,
      suggestions,
      coverage: {
        documented,
        total,
        percentage,
      },
    };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Read file content
   */
  private async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.php': 'php',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
    };
    return languageMap[ext] || 'unknown';
  }

  /**
   * Check code quality issues
   */
  private checkCodeQuality(code: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = code.split('\n');

    for (const rule of this.codeQualityRules) {
      let match: RegExpExecArray | null;
      const globalPattern = new RegExp(rule.pattern.source, 'g');

      while ((match = globalPattern.exec(code)) !== null) {
        const lineNumber = code.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1] || '';

        issues.push({
          severity: rule.severity,
          category: rule.category,
          line: lineNumber,
          message: rule.message,
          suggestion: rule.suggestion,
          ruleId: rule.id,
          codeSnippet: lineContent.trim(),
        });
      }
    }

    return issues;
  }

  /**
   * Check for security issues
   */
  private checkSecurityIssues(code: string, filePath?: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const lines = code.split('\n');

    for (const pattern of this.securityPatterns) {
      let match: RegExpExecArray | null;
      const globalPattern = new RegExp(pattern.pattern.source, 'gi');

      while ((match = globalPattern.exec(code)) !== null) {
        const lineNumber = code.substring(0, match.index).split('\n').length;

        vulnerabilities.push({
          type: pattern.name,
          severity: pattern.severity,
          location: filePath ? `${filePath}:${lineNumber}` : `Line ${lineNumber}`,
          line: lineNumber,
          description: pattern.description,
          remediation: pattern.remediation,
          confidence: 0.8,
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Calculate code quality metrics
   */
  private calculateCodeMetrics(code: string): CodeReviewResult['metrics'] {
    const lines = code.split('\n');
    const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('/*'));
    const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('/*') || l.trim().startsWith('*'));

    // Calculate cyclomatic complexity (simplified)
    const conditionals = (code.match(/\b(if|else|for|while|switch|case|\?|&&|\|\|)\b/g) || []).length;
    const complexity = conditionals + 1;

    // Maintainability (inverse of complexity and size)
    const maintainability = Math.max(0, Math.min(100,
      100 - (complexity * 2) - (codeLines.length / 10)
    ));

    // Testability (based on function complexity and dependencies)
    const functions = (code.match(/\b(function|=>)\b/g) || []).length;
    const avgComplexity = functions > 0 ? complexity / functions : complexity;
    const testability = Math.max(0, Math.min(100, 100 - (avgComplexity * 5)));

    // Comment ratio
    const commentRatio = lines.length > 0 ? commentLines.length / lines.length : 0;

    return {
      complexity,
      maintainability: Math.round(maintainability),
      testability: Math.round(testability),
      linesOfCode: codeLines.length,
      commentRatio: Math.round(commentRatio * 100) / 100,
    };
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(issues: ReviewIssue[], metrics: CodeReviewResult['metrics']): string[] {
    const suggestions: string[] = [];

    // Based on issues
    const issueCategories = new Set(issues.map(i => i.category));
    if (issueCategories.has('security')) {
      suggestions.push('Address security vulnerabilities as a priority');
    }
    if (issueCategories.has('maintainability')) {
      suggestions.push('Consider refactoring to improve code maintainability');
    }

    // Based on metrics
    if (metrics.complexity > 15) {
      suggestions.push('Code complexity is high. Consider breaking down into smaller functions');
    }
    if (metrics.maintainability < 50) {
      suggestions.push('Maintainability index is low. Simplify logic and add documentation');
    }
    if (metrics.testability < 50) {
      suggestions.push('Code may be difficult to test. Consider dependency injection');
    }
    if (metrics.commentRatio < 0.1) {
      suggestions.push('Add more comments to explain complex logic');
    }
    if (metrics.linesOfCode > 500) {
      suggestions.push('File is large. Consider splitting into multiple modules');
    }

    return suggestions;
  }

  /**
   * Generate review summary
   */
  private generateReviewSummary(
    issues: ReviewIssue[],
    metrics: CodeReviewResult['metrics'],
    filesReviewed: string[]
  ): string {
    const parts: string[] = [
      `Reviewed ${filesReviewed.length} file(s).`,
    ];

    if (issues.length === 0) {
      parts.push('No issues found. Code looks good!');
    } else {
      const critical = issues.filter(i => i.severity === 'critical').length;
      const high = issues.filter(i => i.severity === 'high').length;
      parts.push(`Found ${issues.length} issue(s): ${critical} critical, ${high} high priority.`);
    }

    parts.push(`Metrics: Complexity ${metrics.complexity}, Maintainability ${metrics.maintainability}%, Testability ${metrics.testability}%.`);

    return parts.join(' ');
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(vulnerabilities: SecurityVulnerability[]): string[] {
    const recommendations: string[] = [];
    const types = new Set(vulnerabilities.map(v => v.type));

    if (types.has('SQL Injection')) {
      recommendations.push('Use parameterized queries for all database operations');
    }
    if (types.has('Hardcoded Secret')) {
      recommendations.push('Move secrets to environment variables or secret management');
    }
    if (types.has('XSS') || types.has('Unsafe innerHTML')) {
      recommendations.push('Sanitize all user input before rendering');
    }
    if (types.has('Eval Usage')) {
      recommendations.push('Remove eval() usage and use safer alternatives');
    }

    if (recommendations.length === 0 && vulnerabilities.length > 0) {
      recommendations.push('Review and address all identified vulnerabilities');
    }

    if (vulnerabilities.length === 0) {
      recommendations.push('Continue following secure coding practices');
    }

    return recommendations;
  }

  /**
   * Estimate time complexity
   */
  private estimateTimeComplexity(code: string): string {
    const nestedLoops = (code.match(/for\s*\([^)]+\)\s*\{[^}]*for\s*\([^)]+\)/g) || []).length;
    const loops = (code.match(/\b(for|while)\b/g) || []).length;
    const recursion = (code.match(/function\s+(\w+)[^}]*\1\s*\(/g) || []).length;

    if (nestedLoops > 1) return 'O(n^3) or higher';
    if (nestedLoops === 1) return 'O(n^2)';
    if (recursion > 0) return 'O(n) to O(2^n) - depends on recursion';
    if (loops > 0) return 'O(n)';
    return 'O(1)';
  }

  /**
   * Estimate space complexity
   */
  private estimateSpaceComplexity(code: string): string {
    const arrays = (code.match(/\[\s*\]|new Array|Array\(/g) || []).length;
    const maps = (code.match(/new Map|new Set|new Object|\{\s*\}/g) || []).length;
    const recursion = (code.match(/function\s+(\w+)[^}]*\1\s*\(/g) || []).length;

    if (recursion > 0) return 'O(n) - recursive call stack';
    if (arrays > 2 || maps > 2) return 'O(n) - multiple data structures';
    if (arrays > 0 || maps > 0) return 'O(n)';
    return 'O(1)';
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizations(issues: PerformanceIssue[], code: string): string[] {
    const optimizations: string[] = [];

    // From detected issues
    for (const issue of issues) {
      if (!optimizations.includes(issue.suggestion)) {
        optimizations.push(issue.suggestion);
      }
    }

    // Additional heuristics
    if (code.includes('JSON.parse') && code.includes('JSON.stringify')) {
      optimizations.push('Consider caching JSON parse results if used repeatedly');
    }

    if ((code.match(/await\s+/g) || []).length > 5) {
      optimizations.push('Consider parallel execution with Promise.all for independent async operations');
    }

    return optimizations;
  }

  /**
   * Get best practice rules based on standards
   */
  private getBestPracticeRules(standards: string): Array<{
    name: string;
    pattern: RegExp;
    shouldMatch: boolean;
    failMessage: string;
    severity: ReviewSeverity;
  }> {
    const baseRules = [
      {
        name: 'Use strict mode',
        pattern: /'use strict'|"use strict"/,
        shouldMatch: true,
        failMessage: 'Missing "use strict" directive',
        severity: 'low' as ReviewSeverity,
      },
      {
        name: 'No var declarations',
        pattern: /\bvar\s+/,
        shouldMatch: false,
        failMessage: 'Use const or let instead of var',
        severity: 'medium' as ReviewSeverity,
      },
      {
        name: 'Prefer const',
        pattern: /\blet\s+\w+\s*=[^;]*;/,
        shouldMatch: false,
        failMessage: 'Use const for variables that are not reassigned',
        severity: 'info' as ReviewSeverity,
      },
      {
        name: 'Error handling',
        pattern: /try\s*\{[\s\S]*?\}\s*catch/,
        shouldMatch: true,
        failMessage: 'Consider adding error handling with try-catch',
        severity: 'info' as ReviewSeverity,
      },
      {
        name: 'No debugger',
        pattern: /\bdebugger\b/,
        shouldMatch: false,
        failMessage: 'Remove debugger statements',
        severity: 'high' as ReviewSeverity,
      },
      {
        name: 'No alert',
        pattern: /\balert\s*\(/,
        shouldMatch: false,
        failMessage: 'Remove alert() calls',
        severity: 'medium' as ReviewSeverity,
      },
    ];

    // Add TypeScript-specific rules
    if (standards === 'typescript' || standards === 'default') {
      baseRules.push(
        {
          name: 'Explicit return types',
          pattern: /function\s+\w+\s*\([^)]*\)\s*:/,
          shouldMatch: true,
          failMessage: 'Add explicit return type annotations',
          severity: 'info' as ReviewSeverity,
        },
        {
          name: 'No any type',
          pattern: /:\s*any\b/,
          shouldMatch: false,
          failMessage: 'Avoid using any type',
          severity: 'medium' as ReviewSeverity,
        }
      );
    }

    return baseRules;
  }
}
