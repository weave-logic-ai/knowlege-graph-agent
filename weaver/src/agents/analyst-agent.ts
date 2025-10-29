/**
 * Analyst Agent - Code review, quality metrics, and security analysis
 *
 * Capabilities:
 * - Comprehensive code review
 * - Quality metrics calculation
 * - Security vulnerability scanning
 * - Best practice compliance
 * - Technical debt assessment
 *
 * @example
 * ```typescript
 * const analyst = new AnalystAgent({ claudeClient });
 * const review = await analyst.reviewCode('/path/to/file.ts', ['security', 'performance']);
 * const metrics = await analyst.calculateMetrics('/project');
 * const security = await analyst.scanSecurity('/path/to/file.ts');
 * ```
 */

import { ClaudeClient } from './claude-client.js';
import { PromptBuilder } from './prompt-builder.js';
import type { ParsedResponse } from './types.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Review criteria
 */
export type ReviewCriteria =
  | 'security'
  | 'performance'
  | 'maintainability'
  | 'readability'
  | 'testability'
  | 'scalability';

/**
 * Code review result
 */
export interface CodeReview {
  file: string;
  criteria: ReviewCriteria[];
  overallScore: number;
  findings: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: ReviewCriteria;
    line?: number;
    issue: string;
    suggestion: string;
    codeSnippet?: string;
  }>;
  strengths: string[];
  bestPractices: {
    followed: string[];
    violated: string[];
  };
  complexity: {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    assessment: string;
  };
  summary: string;
}

/**
 * Quality metrics result
 */
export interface QualityMetrics {
  projectPath: string;
  codeQuality: {
    maintainabilityIndex: number;
    technicalDebt: {
      hours: number;
      issues: number;
    };
    duplication: {
      percentage: number;
      duplicatedBlocks: number;
    };
  };
  complexity: {
    averageCyclomaticComplexity: number;
    averageCognitiveComplexity: number;
    highComplexityFiles: Array<{
      file: string;
      complexity: number;
    }>;
  };
  codeSmells: Array<{
    type: string;
    severity: 'minor' | 'major' | 'critical';
    file: string;
    description: string;
    effort: string;
  }>;
  documentation: {
    coverage: number;
    missing: string[];
  };
  dependencies: {
    outdated: number;
    vulnerable: number;
    unused: number;
  };
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    area: string;
    recommendation: string;
    impact: string;
  }>;
}

/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cwe?: string;
  owasp?: string;
  line?: number;
  description: string;
  impact: string;
  remediation: string;
  codeExample?: string;
}

/**
 * Security scan result
 */
export interface SecurityScanResult {
  file: string;
  riskScore: number;
  vulnerabilities: SecurityVulnerability[];
  securityHeaders: {
    present: string[];
    missing: string[];
  };
  authentication: {
    issues: string[];
    recommendations: string[];
  };
  dataProtection: {
    issues: string[];
    recommendations: string[];
  };
  summary: string;
}

/**
 * Improvement suggestion
 */
export interface ImprovementSuggestion {
  category: 'architecture' | 'performance' | 'security' | 'code-quality' | 'testing' | 'documentation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentState: string;
  proposedState: string;
  benefits: string[];
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
}

/**
 * Analyst agent configuration
 */
export interface AnalystAgentConfig {
  claudeClient: ClaudeClient;
}

/**
 * Analyst Agent - AI-powered code analysis and review
 */
export class AnalystAgent {
  private claudeClient: ClaudeClient;

  constructor(config: AnalystAgentConfig) {
    this.claudeClient = config.claudeClient;
  }

  // ========================================================================
  // Code Review
  // ========================================================================

  /**
   * Perform comprehensive code review
   */
  async reviewCode(filePath: string, criteria: ReviewCriteria[] = ['security', 'performance', 'maintainability']): Promise<CodeReview> {
    const code = await fs.readFile(filePath, 'utf-8');

    const criteriaDescriptions: Record<ReviewCriteria, string> = {
      security: 'Check for vulnerabilities, injection risks, auth issues, data exposure',
      performance: 'Identify inefficient algorithms, memory leaks, unnecessary computations',
      maintainability: 'Assess code organization, naming, documentation, modularity',
      readability: 'Evaluate code clarity, formatting, comments, complexity',
      testability: 'Check for tight coupling, dependencies, side effects',
      scalability: 'Identify bottlenecks, resource constraints, architectural limits',
    };

    const criteriaText = criteria.map(c => `- ${c}: ${criteriaDescriptions[c]}`).join('\n');

    const prompt = new PromptBuilder()
      .system('You are an expert code reviewer. Provide thorough, actionable feedback focused on quality and best practices.')
      .user(`Review this code against these criteria:

{{criteria}}

**Code**:
\`\`\`
{{code}}
\`\`\`

Provide:
1. Overall score (0-100)
2. Findings with severity, line numbers, issues, and suggestions
3. Code strengths
4. Best practices followed/violated
5. Complexity assessment (cyclomatic and cognitive)
6. Summary of key takeaways

Return JSON with complete review.`)
      .variable('criteria', criteriaText)
      .variable('code', code)
      .expectJSON({
        type: 'object',
        properties: {
          overallScore: { type: 'number' },
          findings: { type: 'array' },
          strengths: { type: 'array' },
          bestPractices: { type: 'object' },
          complexity: { type: 'object' },
          summary: { type: 'string' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Code review failed: ${response.error}`);
    }

    const result = response.data as Omit<CodeReview, 'file' | 'criteria'>;

    return {
      file: filePath,
      criteria,
      ...result,
    };
  }

  // ========================================================================
  // Quality Metrics
  // ========================================================================

  /**
   * Calculate comprehensive quality metrics
   */
  async calculateMetrics(projectPath: string): Promise<QualityMetrics> {
    // Scan project structure
    const files = await this.scanProjectFiles(projectPath);

    const prompt = new PromptBuilder()
      .system('You are an expert at software quality assessment. Calculate metrics and identify improvement areas.')
      .user(`Analyze code quality for this project:

**Files**: {{fileCount}} files
**Structure**: {{structure}}

Calculate:
1. Maintainability Index (0-100)
2. Technical Debt (hours, issues)
3. Code Duplication
4. Complexity Metrics (cyclomatic, cognitive)
5. Code Smells (types, severity, effort to fix)
6. Documentation Coverage
7. Dependency Health (outdated, vulnerable, unused)

Provide prioritized recommendations for improvement.

Return comprehensive JSON metrics.`)
      .variable('fileCount', files.length.toString())
      .variable('structure', files.join('\n'))
      .expectJSON({
        type: 'object',
        properties: {
          codeQuality: { type: 'object' },
          complexity: { type: 'object' },
          codeSmells: { type: 'array' },
          documentation: { type: 'object' },
          dependencies: { type: 'object' },
          recommendations: { type: 'array' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Metrics calculation failed: ${response.error}`);
    }

    const result = response.data as Omit<QualityMetrics, 'projectPath'>;

    return {
      projectPath,
      ...result,
    };
  }

  // ========================================================================
  // Security Scanning
  // ========================================================================

  /**
   * Scan code for security vulnerabilities
   */
  async scanSecurity(filePath: string): Promise<SecurityScanResult> {
    const code = await fs.readFile(filePath, 'utf-8');

    const prompt = new PromptBuilder()
      .system('You are a security expert. Identify vulnerabilities and provide remediation guidance.')
      .user(`Perform security scan on this code:

**Code**:
\`\`\`
{{code}}
\`\`\`

Check for:
1. OWASP Top 10 vulnerabilities
2. Injection attacks (SQL, XSS, command injection)
3. Authentication/authorization issues
4. Sensitive data exposure
5. Security misconfigurations
6. Insecure dependencies
7. Cryptographic failures

For each vulnerability:
- Type and severity
- CWE/OWASP reference
- Line number
- Description and impact
- Remediation steps
- Secure code example

Also check:
- Security headers (present/missing)
- Authentication patterns
- Data protection measures

Return JSON with:
- riskScore (0-100, higher = more risk)
- vulnerabilities array
- securityHeaders object
- authentication object
- dataProtection object
- summary`)
      .variable('code', code)
      .expectJSON({
        type: 'object',
        properties: {
          riskScore: { type: 'number' },
          vulnerabilities: { type: 'array' },
          securityHeaders: { type: 'object' },
          authentication: { type: 'object' },
          dataProtection: { type: 'object' },
          summary: { type: 'string' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Security scan failed: ${response.error}`);
    }

    const result = response.data as Omit<SecurityScanResult, 'file'>;

    return {
      file: filePath,
      ...result,
    };
  }

  // ========================================================================
  // Improvement Suggestions
  // ========================================================================

  /**
   * Generate prioritized improvement suggestions
   */
  async suggestImprovements(analysis: {
    codeReview?: CodeReview;
    metrics?: QualityMetrics;
    security?: SecurityScanResult;
  }): Promise<ImprovementSuggestion[]> {
    const analysisText = JSON.stringify(analysis, null, 2);

    const prompt = new PromptBuilder()
      .system('You are an expert at prioritizing technical improvements. Provide actionable, high-impact suggestions.')
      .user(`Based on this analysis:

{{analysis}}

Generate prioritized improvement suggestions covering:
1. Critical security issues
2. Architecture improvements
3. Performance optimizations
4. Code quality enhancements
5. Testing gaps
6. Documentation needs

For each suggestion:
- Category and priority
- Title and description
- Current vs proposed state
- Benefits
- Implementation effort (low/medium/high)
- Step-by-step implementation plan

Return JSON array of suggestions, ordered by priority.`)
      .variable('analysis', analysisText)
      .expectJSON({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            title: { type: 'string' },
            description: { type: 'string' },
            currentState: { type: 'string' },
            proposedState: { type: 'string' },
            benefits: { type: 'array', items: { type: 'string' } },
            effort: { type: 'string', enum: ['low', 'medium', 'high'] },
            implementation: { type: 'array', items: { type: 'string' } },
          },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Improvement suggestion failed: ${response.error}`);
    }

    return response.data as ImprovementSuggestion[];
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  /**
   * Scan project files
   */
  private async scanProjectFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];

    async function scan(dir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    }

    await scan(projectPath);

    return files;
  }
}

/**
 * Create a new analyst agent instance
 */
export function createAnalystAgent(config: AnalystAgentConfig): AnalystAgent {
  return new AnalystAgent(config);
}
