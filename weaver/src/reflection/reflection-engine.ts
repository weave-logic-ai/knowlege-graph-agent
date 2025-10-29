/**
 * Reflection Engine
 *
 * Analyzes experiences to identify patterns and generate improvement suggestions.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Experience,
  Lesson,
  ExperienceDomain,
} from '../memory/types.js';
import type {
  Reflection,
  ReflectionType,
  Pattern,
  PatternType,
  ImprovementSuggestion,
  ImprovementPriority,
  ExperienceAnalysis,
  ExperienceComparison,
  PerformanceTrend,
  IReflectionEngine,
  ReflectionConfig,
} from './types.js';
import { logger } from '../utils/logger.js';

/**
 * Core reflection engine for experience analysis
 */
export class ReflectionEngine implements IReflectionEngine {
  private config: Required<ReflectionConfig>;

  constructor(config: ReflectionConfig = {}) {
    this.config = {
      minExperiences: config.minExperiences || 3,
      minConfidence: config.minConfidence || 0.7,
      maxPatterns: config.maxPatterns || 10,
      maxImprovements: config.maxImprovements || 5,
      domains: config.domains || [],
      enableAnticipatory: config.enableAnticipatory ?? false,
    };
  }

  /**
   * Reflect on a single experience
   */
  async reflectOnExperience(experience: Experience): Promise<Reflection> {
    const analysis = await this.analyzeExperience(experience);

    // Generate basic improvements from single experience
    const improvements: ImprovementSuggestion[] = [];
    if (!experience.success && analysis.alternativeApproaches.length > 0) {
      improvements.push({
        id: `improvement-${uuidv4()}`,
        description: 'Try alternative approach',
        rationale: analysis.alternativeApproaches[0],
        priority: 'medium',
        estimatedImpact: 0.6,
        actionable: true,
        relatedExperiences: [experience.id],
      });
    }

    return {
      id: `reflection-${uuidv4()}`,
      type: 'post-execution',
      timestamp: new Date(),
      experiences: [experience.id],
      summary: this.generateExperienceSummary(experience),
      patterns: [],
      improvements,
      insights: this.extractInsights(analysis),
      confidence: this.calculateConfidence([experience]),
      metadata: {
        analysis,
      },
    };
  }

  /**
   * Reflect on multiple experiences
   */
  async reflectOnExperiences(experiences: Experience[]): Promise<Reflection> {
    if (experiences.length < this.config.minExperiences) {
      logger.warn('Insufficient experiences for comprehensive reflection', {
        count: experiences.length,
        required: this.config.minExperiences,
      });
    }

    const patterns = await this.identifyPatterns(experiences);
    const improvements = await this.generateImprovements(experiences, patterns);

    return {
      id: `reflection-${uuidv4()}`,
      type: 'periodic',
      timestamp: new Date(),
      experiences: experiences.map(exp => exp.id),
      summary: this.generateMultiExperienceSummary(experiences),
      patterns,
      improvements,
      insights: this.extractCrossExperienceInsights(experiences, patterns),
      confidence: this.calculateConfidence(experiences),
    };
  }

  /**
   * Identify patterns across experiences
   */
  async identifyPatterns(experiences: Experience[]): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Group experiences by domain
    const byDomain = this.groupByDomain(experiences);

    for (const [domain, domainExps] of Object.entries(byDomain)) {
      // Success patterns
      const successExps = domainExps.filter(exp => exp.success);
      if (successExps.length >= 2) {
        const successPattern = this.extractSuccessPattern(
          successExps,
          domain as ExperienceDomain
        );
        if (successPattern && successPattern.confidence >= this.config.minConfidence) {
          patterns.push(successPattern);
        }
      }

      // Failure patterns
      const failureExps = domainExps.filter(exp => !exp.success);
      if (failureExps.length >= 2) {
        const failurePattern = this.extractFailurePattern(
          failureExps,
          domain as ExperienceDomain
        );
        if (failurePattern && failurePattern.confidence >= this.config.minConfidence) {
          patterns.push(failurePattern);
        }
      }

      // Performance patterns
      const perfPattern = this.extractPerformancePattern(
        domainExps,
        domain as ExperienceDomain
      );
      if (perfPattern && perfPattern.confidence >= this.config.minConfidence) {
        patterns.push(perfPattern);
      }
    }

    return patterns.slice(0, this.config.maxPatterns);
  }

  /**
   * Generate improvement suggestions
   */
  async generateImprovements(
    experiences: Experience[],
    patterns: Pattern[]
  ): Promise<ImprovementSuggestion[]> {
    const improvements: ImprovementSuggestion[] = [];

    // Generate improvements from failure patterns
    for (const pattern of patterns) {
      if (pattern.type === 'failure' || pattern.type === 'anti-pattern') {
        improvements.push(this.improvementFromFailurePattern(pattern, experiences));
      }
    }

    // Generate improvements from performance patterns
    for (const pattern of patterns) {
      if (pattern.type === 'optimization') {
        improvements.push(this.improvementFromOptimizationPattern(pattern, experiences));
      }
    }

    // Generate improvements from missing best practices
    const missingPractices = this.identifyMissingBestPractices(experiences);
    improvements.push(...missingPractices);

    // Sort by priority and impact
    improvements.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedImpact - a.estimatedImpact;
    });

    return improvements.slice(0, this.config.maxImprovements);
  }

  /**
   * Analyze a single experience
   */
  async analyzeExperience(experience: Experience): Promise<ExperienceAnalysis> {
    return {
      experienceId: experience.id,
      successFactors: this.identifySuccessFactors(experience),
      failureFactors: this.identifyFailureFactors(experience),
      keyDecisions: this.identifyKeyDecisions(experience),
      alternativeApproaches: this.suggestAlternatives(experience),
      lessonsLearned: experience.lessons.map((lesson, idx) => ({
        id: `lesson-${experience.id}-${idx}`,
        experienceId: experience.id,
        content: lesson,
        category: 'general',
        confidence: 0.8,
        timestamp: new Date(),
        domain: experience.domain,
        tags: [],
      })),
      applicability: {
        domains: [experience.domain],
        taskTypes: [this.extractTaskType(experience.task)],
        confidence: 0.75,
      },
    };
  }

  /**
   * Compare multiple experiences
   */
  async compareExperiences(experiences: Experience[]): Promise<ExperienceComparison> {
    if (experiences.length < 2) {
      throw new Error('Need at least 2 experiences to compare');
    }

    const similarities = this.findSimilarities(experiences);
    const differences = this.findDifferences(experiences);
    const commonPatterns = await this.identifyPatterns(experiences);

    const uniqueApproaches: Record<string, string[]> = {};
    for (const exp of experiences) {
      const analysis = await this.analyzeExperience(exp);
      uniqueApproaches[exp.id] = analysis.alternativeApproaches;
    }

    return {
      experiences: experiences.map(exp => exp.id),
      similarities,
      differences,
      commonPatterns,
      uniqueApproaches,
      recommendation: this.generateComparisonRecommendation(experiences, commonPatterns),
    };
  }

  /**
   * Analyze performance trends
   */
  async analyzePerformanceTrends(
    domain: ExperienceDomain,
    metric: string
  ): Promise<PerformanceTrend> {
    // This would typically query stored experiences
    // For now, return a placeholder
    return {
      domain,
      metric,
      dataPoints: [],
      trend: 'stable',
      confidence: 0.5,
      insights: ['Insufficient data for trend analysis'],
    };
  }

  // Private helper methods

  private groupByDomain(
    experiences: Experience[]
  ): Record<string, Experience[]> {
    const grouped: Record<string, Experience[]> = {};
    for (const exp of experiences) {
      if (!grouped[exp.domain]) {
        grouped[exp.domain] = [];
      }
      grouped[exp.domain].push(exp);
    }
    return grouped;
  }

  private extractSuccessPattern(
    experiences: Experience[],
    domain: ExperienceDomain
  ): Pattern | null {
    if (experiences.length < 2) return null;

    const commonApproaches = this.findCommonApproaches(experiences);

    return {
      id: `pattern-success-${uuidv4()}`,
      type: 'success',
      description: commonApproaches.length > 0
        ? `Successful approach in ${domain}: ${commonApproaches.join(', ')}`
        : `Repeated success in ${domain}`,
      examples: experiences.map(exp => exp.id),
      frequency: experiences.length,
      confidence: Math.min(0.9, experiences.length / 5),
      domain,
    };
  }

  private extractFailurePattern(
    experiences: Experience[],
    domain: ExperienceDomain
  ): Pattern | null {
    if (experiences.length < 2) return null;

    const commonErrors = this.findCommonErrors(experiences);

    return {
      id: `pattern-failure-${uuidv4()}`,
      type: 'failure',
      description: commonErrors.length > 0
        ? `Common failure in ${domain}: ${commonErrors.join(', ')}`
        : `Repeated failure in ${domain}`,
      examples: experiences.map(exp => exp.id),
      frequency: experiences.length,
      confidence: Math.min(0.9, experiences.length / 5),
      domain,
    };
  }

  private extractPerformancePattern(
    experiences: Experience[],
    domain: ExperienceDomain
  ): Pattern | null {
    const withDuration = experiences.filter(exp => exp.duration);
    if (withDuration.length < 3) return null;

    const avgDuration =
      withDuration.reduce((sum, exp) => sum + (exp.duration || 0), 0) /
      withDuration.length;

    return {
      id: `pattern-perf-${uuidv4()}`,
      type: 'optimization',
      description: `Average duration in ${domain}: ${Math.round(avgDuration)}ms`,
      examples: withDuration.map(exp => exp.id),
      frequency: withDuration.length,
      confidence: 0.8,
      domain,
      metadata: { avgDuration },
    };
  }

  private findCommonApproaches(experiences: Experience[]): string[] {
    const approaches = new Map<string, number>();

    for (const exp of experiences) {
      if (exp.plan) {
        const words = exp.plan.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 4) {
            approaches.set(word, (approaches.get(word) || 0) + 1);
          }
        }
      }
    }

    return Array.from(approaches.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }

  private findCommonErrors(experiences: Experience[]): string[] {
    const errors = new Map<string, number>();

    for (const exp of experiences) {
      if (exp.errorMessage) {
        const words = exp.errorMessage.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 4) {
            errors.set(word, (errors.get(word) || 0) + 1);
          }
        }
      }
    }

    return Array.from(errors.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }

  private improvementFromFailurePattern(
    pattern: Pattern,
    experiences: Experience[]
  ): ImprovementSuggestion {
    return {
      id: `improvement-${uuidv4()}`,
      pattern,
      description: `Avoid common failure pattern: ${pattern.description}`,
      rationale: `This pattern has been observed in ${pattern.frequency} similar cases`,
      priority: pattern.frequency >= 5 ? 'high' : 'medium',
      estimatedImpact: pattern.confidence,
      actionable: true,
      steps: [
        'Review the failure pattern',
        'Identify root cause',
        'Implement preventive measures',
        'Add validation checks',
      ],
      relatedExperiences: pattern.examples,
    };
  }

  private improvementFromOptimizationPattern(
    pattern: Pattern,
    experiences: Experience[]
  ): ImprovementSuggestion {
    return {
      id: `improvement-${uuidv4()}`,
      pattern,
      description: `Optimize based on performance pattern: ${pattern.description}`,
      rationale: `Performance metrics indicate potential for improvement`,
      priority: 'medium',
      estimatedImpact: 0.6,
      actionable: true,
      steps: [
        'Profile current performance',
        'Identify bottlenecks',
        'Apply optimization techniques',
        'Measure improvements',
      ],
      relatedExperiences: pattern.examples,
    };
  }

  private identifyMissingBestPractices(experiences: Experience[]): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Check for error handling
    const missingErrorHandling = experiences.filter(
      exp => exp.success && !(exp.plan || '').toLowerCase().includes('error')
    );
    if (missingErrorHandling.length > experiences.length * 0.5) {
      suggestions.push({
        id: `improvement-${uuidv4()}`,
        description: 'Add comprehensive error handling',
        rationale: 'Many successful experiences lack explicit error handling',
        priority: 'medium',
        estimatedImpact: 0.7,
        actionable: true,
        steps: ['Add try-catch blocks', 'Validate inputs', 'Handle edge cases'],
        relatedExperiences: missingErrorHandling.map(exp => exp.id),
      });
    }

    return suggestions;
  }

  private identifySuccessFactors(experience: Experience): string[] {
    const factors: string[] = [];

    if (experience.success) {
      if (experience.plan) {
        factors.push(`Followed plan: ${experience.plan.substring(0, 100)}`);
      }
      if (experience.duration && experience.duration < 5000) {
        factors.push('Completed quickly');
      }
      if (experience.lessons.length > 0) {
        factors.push('Documented lessons learned');
      }
    }

    return factors;
  }

  private identifyFailureFactors(experience: Experience): string[] {
    const factors: string[] = [];

    if (!experience.success) {
      if (experience.errorMessage) {
        factors.push(`Error: ${experience.errorMessage}`);
      }
      if (!experience.plan) {
        factors.push('No execution plan');
      }
      if (experience.duration && experience.duration > 10000) {
        factors.push('Took too long');
      }
    }

    return factors;
  }

  private identifyKeyDecisions(experience: Experience): string[] {
    const decisions: string[] = [];

    if (experience.plan) {
      // Extract decision points from plan
      const planSteps = experience.plan.split(/\d+\.|•|-/).filter(s => s.trim());
      decisions.push(...planSteps.slice(0, 3).map(s => s.trim()));
    }

    return decisions;
  }

  private suggestAlternatives(experience: Experience): string[] {
    const alternatives: string[] = [];

    if (!experience.success) {
      alternatives.push('Add more comprehensive error handling');
      alternatives.push('Break task into smaller steps');
      alternatives.push('Use proven patterns from similar successful experiences');
    }

    return alternatives;
  }

  private extractTaskType(task: string): string {
    const lower = task.toLowerCase();
    if (lower.includes('chunk')) return 'chunking';
    if (lower.includes('embed')) return 'embedding';
    if (lower.includes('index')) return 'indexing';
    if (lower.includes('analyze')) return 'analysis';
    return 'general';
  }

  private findSimilarities(experiences: Experience[]): string[] {
    const similarities: string[] = [];

    const sameDomain = experiences.every(exp => exp.domain === experiences[0].domain);
    if (sameDomain) {
      similarities.push(`All in ${experiences[0].domain} domain`);
    }

    const allSuccessful = experiences.every(exp => exp.success);
    const allFailed = experiences.every(exp => !exp.success);
    if (allSuccessful) {
      similarities.push('All succeeded');
    } else if (allFailed) {
      similarities.push('All failed');
    }

    return similarities;
  }

  private findDifferences(experiences: Experience[]): string[] {
    const differences: string[] = [];

    const durations = experiences.map(exp => exp.duration || 0);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = Math.max(...durations) - Math.min(...durations);
    if (variance > avgDuration) {
      differences.push('Significant variation in execution time');
    }

    return differences;
  }

  private generateComparisonRecommendation(
    experiences: Experience[],
    patterns: Pattern[]
  ): string {
    const successful = experiences.filter(exp => exp.success);
    if (successful.length > experiences.length / 2) {
      return 'Follow the successful patterns identified';
    }
    return 'Review and address the failure patterns';
  }

  private generateExperienceSummary(experience: Experience): string {
    return `${experience.success ? 'Successful' : 'Failed'} ${experience.domain} task: ${experience.task}`;
  }

  private generateMultiExperienceSummary(experiences: Experience[]): string {
    const successful = experiences.filter(exp => exp.success).length;
    return `Analyzed ${experiences.length} experiences: ${successful} successful, ${experiences.length - successful} failed`;
  }

  private extractInsights(analysis: ExperienceAnalysis): string[] {
    const insights: string[] = [];

    if (analysis.successFactors.length > 0) {
      insights.push(`Success driven by: ${analysis.successFactors[0]}`);
    }

    if (analysis.failureFactors.length > 0) {
      insights.push(`Failures due to: ${analysis.failureFactors[0]}`);
    }

    return insights;
  }

  private extractCrossExperienceInsights(
    experiences: Experience[],
    patterns: Pattern[]
  ): string[] {
    const insights: string[] = [];

    const successRate = experiences.filter(exp => exp.success).length / experiences.length;
    insights.push(`Success rate: ${Math.round(successRate * 100)}%`);

    if (patterns.length > 0) {
      insights.push(`Identified ${patterns.length} patterns`);
    }

    return insights;
  }

  private calculateConfidence(experiences: Experience[]): number {
    if (experiences.length >= this.config.minExperiences) {
      return Math.min(0.95, 0.5 + (experiences.length / 20));
    }
    return 0.5;
  }
}
