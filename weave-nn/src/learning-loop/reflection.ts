/**
 * Reflection System
 * Analyzes execution outcomes and extracts lessons learned
 */

import type {
  ExecutionResult,
  Lesson,
  ReflectionInput,
  ReflectionOutput,
  PatternAnalysis,
  Pattern,
  Correlation,
  Recommendation,
} from './types';

interface ClaudeFlowClient {
  neural_patterns: (params: any) => Promise<any>;
  error_analysis: (params: any) => Promise<any>;
  daa_meta_learning: (params: any) => Promise<any>;
}

interface ClaudeClient {
  sendMessage: (params: any) => Promise<any>;
}

/**
 * Reflection System
 * Implements active learning through outcome analysis
 */
export class ReflectionSystem {
  constructor(
    private claudeFlow: ClaudeFlowClient,
    private claudeClient: ClaudeClient
  ) {}

  /**
   * Reflect on execution result and extract lessons
   */
  async reflect(input: ReflectionInput): Promise<ReflectionOutput> {
    const { execution, includePatternAnalysis = true } = input;

    try {
      // 1. Analyze patterns in execution
      const patternAnalysis = includePatternAnalysis
        ? await this.analyzePatterns(execution)
        : undefined;

      // 2. Extract lessons learned
      const lessons = await this.extractLessons(execution, patternAnalysis);

      // 3. Generate actionable recommendations
      const recommendations = await this.generateRecommendations(execution, lessons);

      // 4. Deep dive into errors if execution failed
      if (!execution.success) {
        const errorLessons = await this.analyzeErrors(execution);
        lessons.push(...errorLessons);
      }

      // 5. Update meta-learning across domains
      await this.updateMetaLearning(execution);

      // Calculate reflection confidence
      const confidence = this.calculateReflectionConfidence(execution, lessons);

      return {
        lessons,
        patternAnalysis,
        recommendations,
        confidence,
      };
    } catch (error) {
      console.warn(`Reflection failed: ${error.message}`);

      // Return minimal reflection on error
      return {
        lessons: [],
        recommendations: [],
        confidence: 0,
      };
    }
  }

  /**
   * Analyze patterns in execution using neural pattern analysis
   */
  private async analyzePatterns(execution: ExecutionResult): Promise<PatternAnalysis> {
    try {
      const analysis = await this.claudeFlow.neural_patterns({
        action: 'analyze',
        operation: execution.task.description,
        metadata: {
          plan: execution.plan,
          outcome: execution.outcome,
          success: execution.success,
          duration: execution.outcome.duration,
        },
      });

      // Parse pattern analysis
      const patterns: Pattern[] = (analysis.patterns || []).map((p: any) => ({
        type: p.type || 'unknown',
        description: p.description,
        frequency: p.frequency || 1,
        impact: p.impact || 0.5,
      }));

      const insights = analysis.insights || [];
      const correlations = this.findCorrelations(execution, patterns);

      return {
        patterns,
        insights,
        correlations,
      };
    } catch (error) {
      console.warn(`Pattern analysis failed: ${error.message}`);
      return {
        patterns: [],
        insights: [],
        correlations: [],
      };
    }
  }

  /**
   * Find correlations between factors
   */
  private findCorrelations(execution: ExecutionResult, patterns: Pattern[]): Correlation[] {
    const correlations: Correlation[] = [];

    // Correlation: Plan complexity vs success
    if (execution.plan.steps.length > 10 && !execution.success) {
      correlations.push({
        factor1: 'high_complexity',
        factor2: 'failure',
        strength: 0.7,
        description: 'Complex plans (>10 steps) correlate with execution failures',
      });
    }

    // Correlation: Past experience vs confidence
    if (execution.context.pastExperiences.length > 5 && execution.plan.confidence > 0.8) {
      correlations.push({
        factor1: 'experience_count',
        factor2: 'high_confidence',
        strength: 0.8,
        description: 'More past experiences correlate with higher plan confidence',
      });
    }

    // Correlation: Duration vs estimated effort
    const estimatedMs = execution.plan.estimatedEffort * 60 * 1000;
    const actualMs = execution.outcome.duration;
    const ratio = actualMs / estimatedMs;

    if (ratio > 1.5 || ratio < 0.5) {
      correlations.push({
        factor1: 'estimated_effort',
        factor2: 'actual_duration',
        strength: 0.6,
        description: `Effort estimation was off by ${Math.abs(ratio - 1) * 100}%`,
      });
    }

    return correlations;
  }

  /**
   * Extract lessons from execution
   */
  private async extractLessons(
    execution: ExecutionResult,
    patternAnalysis?: PatternAnalysis
  ): Promise<Lesson[]> {
    const lessons: Lesson[] = [];

    // Success lessons
    if (execution.success) {
      lessons.push({
        type: 'success',
        description: `Successfully completed task: ${execution.task.description}`,
        actions: [
          'Replicate this approach for similar tasks',
          'Document successful patterns',
          'Share knowledge across domain',
        ],
        impact: 'high',
        applicableDomains: [execution.task.domain || 'general'],
      });

      // Extract specific success factors
      if (execution.outcome.metrics.successRate === 1.0) {
        lessons.push({
          type: 'success',
          description: 'All steps completed successfully without errors',
          actions: ['Use this plan structure as template', 'Validate approach for similar tasks'],
          impact: 'medium',
          applicableDomains: [execution.task.domain || 'general'],
        });
      }
    }

    // Failure lessons
    if (!execution.success) {
      lessons.push({
        type: 'failure',
        description: `Task failed: ${execution.outcome.error?.message || 'Unknown error'}`,
        actions: [
          'Investigate root cause',
          'Revise plan approach',
          'Add error handling for this scenario',
        ],
        impact: 'high',
        applicableDomains: [execution.task.domain || 'general'],
      });
    }

    // Optimization lessons from pattern analysis
    if (patternAnalysis?.insights) {
      patternAnalysis.insights.forEach((insight) => {
        lessons.push({
          type: 'optimization',
          description: insight,
          actions: ['Apply optimization in future similar tasks'],
          impact: 'medium',
          applicableDomains: [execution.task.domain || 'general'],
        });
      });
    }

    // Correlation-based lessons
    if (patternAnalysis?.correlations) {
      patternAnalysis.correlations.forEach((corr) => {
        if (corr.strength >= 0.7) {
          lessons.push({
            type: 'optimization',
            description: corr.description,
            actions: [`Consider ${corr.factor1} when planning`, `Monitor ${corr.factor2} during execution`],
            impact: corr.strength >= 0.8 ? 'high' : 'medium',
            applicableDomains: [execution.task.domain || 'general'],
          });
        }
      });
    }

    return lessons;
  }

  /**
   * Analyze errors using Claude-Flow error analysis
   */
  private async analyzeErrors(execution: ExecutionResult): Promise<Lesson[]> {
    try {
      const analysis = await this.claudeFlow.error_analysis({
        logs: execution.logs,
      });

      const errorLessons: Lesson[] = [];

      // Main error lesson
      if (analysis.summary) {
        errorLessons.push({
          type: 'error',
          description: analysis.summary,
          actions: analysis.recommendations || ['Review and retry with adjusted approach'],
          impact: 'high',
          applicableDomains: [execution.task.domain || 'general'],
        });
      }

      // Specific error patterns
      if (analysis.patterns) {
        analysis.patterns.forEach((pattern: any) => {
          errorLessons.push({
            type: 'error',
            description: `Error pattern: ${pattern.description}`,
            actions: pattern.preventions || ['Add validation', 'Improve error handling'],
            impact: 'medium',
            applicableDomains: [execution.task.domain || 'general'],
          });
        });
      }

      return errorLessons;
    } catch (error) {
      console.warn(`Error analysis failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate actionable recommendations
   */
  private async generateRecommendations(
    execution: ExecutionResult,
    lessons: Lesson[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Performance optimization recommendations
    const durationMinutes = execution.outcome.duration / (1000 * 60);
    const estimatedMinutes = execution.plan.estimatedEffort;

    if (durationMinutes > estimatedMinutes * 1.5) {
      recommendations.push({
        type: 'optimization',
        description: 'Task took significantly longer than estimated. Review plan complexity and step dependencies.',
        priority: 'high',
        estimatedImpact: 0.3,
      });
    }

    // Success-based recommendations
    if (execution.success) {
      recommendations.push({
        type: 'enhancement',
        description: 'Successful execution. Consider automating this workflow for future use.',
        priority: 'medium',
        estimatedImpact: 0.5,
      });

      if (execution.outcome.metrics.successRate === 1.0) {
        recommendations.push({
          type: 'enhancement',
          description: 'Perfect execution. Document this approach as best practice for similar tasks.',
          priority: 'high',
          estimatedImpact: 0.7,
        });
      }
    }

    // Failure-based recommendations
    if (!execution.success) {
      recommendations.push({
        type: 'prevention',
        description: 'Execution failed. Add pre-execution validation to catch issues earlier.',
        priority: 'high',
        estimatedImpact: 0.6,
      });

      if (execution.outcome.metrics.stepsCompleted < execution.outcome.metrics.stepsTotal * 0.5) {
        recommendations.push({
          type: 'prevention',
          description: 'Failed early in execution. Review initial steps for common failure points.',
          priority: 'critical' as any,
          estimatedImpact: 0.8,
        });
      }
    }

    // Lesson-based recommendations
    const highImpactLessons = lessons.filter((l) => l.impact === 'high');
    if (highImpactLessons.length >= 3) {
      recommendations.push({
        type: 'enhancement',
        description: `${highImpactLessons.length} high-impact lessons learned. Update task planning templates.`,
        priority: 'high',
        estimatedImpact: 0.65,
      });
    }

    return recommendations;
  }

  /**
   * Update meta-learning across domains
   */
  private async updateMetaLearning(execution: ExecutionResult): Promise<void> {
    try {
      await this.claudeFlow.daa_meta_learning({
        sourceDomain: execution.task.domain || 'general',
        targetDomain: 'general',
        transferMode: 'adaptive',
      });
    } catch (error) {
      // Meta-learning update is non-critical
      console.warn(`Meta-learning update failed: ${error.message}`);
    }
  }

  /**
   * Calculate reflection confidence
   */
  private calculateReflectionConfidence(execution: ExecutionResult, lessons: Lesson[]): number {
    let confidence = 0.5; // Base confidence

    // More lessons = higher confidence in reflection quality
    if (lessons.length >= 5) confidence += 0.2;
    else if (lessons.length >= 3) confidence += 0.1;

    // Clear success/failure = higher confidence
    if (execution.outcome.metrics.successRate === 1.0 || execution.outcome.metrics.successRate === 0.0) {
      confidence += 0.15;
    }

    // High impact lessons = higher confidence
    const highImpactCount = lessons.filter((l) => l.impact === 'high').length;
    if (highImpactCount >= 2) confidence += 0.15;

    return Math.min(confidence, 1.0);
  }
}
