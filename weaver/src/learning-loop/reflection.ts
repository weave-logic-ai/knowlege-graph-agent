/**
 * Reflection System - Enhanced with User Feedback
 *
 * Combines autonomous analysis with user feedback to create
 * high-confidence learning signals for the adaptation engine.
 */

import { FeedbackCollector } from './feedback-collector.js';
import { FeedbackStorage } from './feedback-storage.js';
import type {
  UserFeedback,
  EnhancedLessons,
  AutonomousLessons,
  ExecutionResult,
  ApproachOption
} from './feedback-types';

// Re-export ExecutionResult for external use
export type { ExecutionResult } from './feedback-types';

export class ReflectionSystem {
  private feedbackCollector: FeedbackCollector;
  private feedbackStorage: FeedbackStorage;

  constructor() {
    this.feedbackCollector = new FeedbackCollector({
      skipOnHighSatisfaction: true
    });
    this.feedbackStorage = new FeedbackStorage();
  }

  /**
   * Main reflection workflow
   *
   * PHASE 1: Autonomous analysis (AI-driven)
   * PHASE 2: User feedback collection
   * PHASE 3: Store feedback for future learning
   * PHASE 4: Synthesize learnings (combine AI + human)
   */
  async reflect(execution: ExecutionResult): Promise<EnhancedLessons> {
    // PHASE 1: Autonomous analysis
    const autonomousLessons = await this.analyzeAutonomously(execution);

    // PHASE 2: Collect user feedback
    const userFeedback = await this.feedbackCollector.collect({
      sopId: execution.sop,
      executionId: execution.id,
      result: execution.result,
      approaches: autonomousLessons.approaches,
      suggestedImprovements: autonomousLessons.potentialImprovements
    });

    // PHASE 3: Store feedback
    await this.feedbackStorage.store(userFeedback);

    // PHASE 4: Synthesize learnings
    const enhancedLessons = this.synthesizeLearnings(
      autonomousLessons,
      userFeedback
    );

    return enhancedLessons;
  }

  /**
   * Autonomous analysis - AI-driven reflection
   */
  private async analyzeAutonomously(execution: ExecutionResult): Promise<AutonomousLessons> {
    // Generate multiple approaches based on execution
    const approaches = this.generateApproaches(execution);

    // Recommend best approach based on metrics
    const recommendedApproach = this.selectBestApproach(approaches, execution);

    // Identify potential improvements
    const potentialImprovements = this.identifyImprovements(execution);

    return {
      approaches,
      recommendedApproach,
      potentialImprovements,
      executionMetrics: {
        duration: execution.duration,
        success: execution.success,
        errorCount: execution.errorCount
      }
    };
  }

  /**
   * Generate multiple approach options
   */
  private generateApproaches(execution: ExecutionResult): ApproachOption[] {
    const approaches: ApproachOption[] = [];

    // Approach 1: Speed-optimized
    approaches.push({
      id: 'speed_optimized',
      name: 'Speed Optimized',
      description: 'Prioritize execution speed and minimal overhead',
      pros: ['Fast execution', 'Low resource usage', 'Quick feedback'],
      cons: ['May skip some checks', 'Less comprehensive'],
      estimatedEffort: '5 minutes',
      qualityScore: 0.7
    });

    // Approach 2: Quality-optimized
    approaches.push({
      id: 'quality_optimized',
      name: 'Quality Optimized',
      description: 'Prioritize code quality and best practices',
      pros: ['High quality output', 'Comprehensive checks', 'Production-ready'],
      cons: ['Slower execution', 'More resources needed'],
      estimatedEffort: '15 minutes',
      qualityScore: 0.9
    });

    // Approach 3: Balanced
    approaches.push({
      id: 'balanced',
      name: 'Balanced',
      description: 'Balance between speed and quality',
      pros: ['Good quality', 'Reasonable speed', 'Practical'],
      cons: ['Not the fastest', 'Not the highest quality'],
      estimatedEffort: '10 minutes',
      qualityScore: 0.8
    });

    // If execution had errors, add error-focused approach
    if (execution.errorCount > 0) {
      approaches.push({
        id: 'error_recovery',
        name: 'Error Recovery',
        description: 'Focus on fixing errors and edge cases',
        pros: ['Robust error handling', 'Comprehensive testing', 'Resilient'],
        cons: ['More complex', 'Slower development'],
        estimatedEffort: '20 minutes',
        qualityScore: 0.85
      });
    }

    return approaches;
  }

  /**
   * Select best approach based on metrics
   */
  private selectBestApproach(approaches: ApproachOption[], execution: ExecutionResult): string {
    // If execution was fast and successful, recommend speed-optimized
    if (execution.success && execution.duration < 60000) {
      return 'speed_optimized';
    }

    // If execution had errors, recommend error recovery
    if (execution.errorCount > 0) {
      return 'error_recovery';
    }

    // Default to balanced
    return 'balanced';
  }

  /**
   * Identify potential improvements
   */
  private identifyImprovements(execution: ExecutionResult): string[] {
    const improvements: string[] = [];

    if (execution.duration > 120000) {
      improvements.push('Optimize execution speed - current execution took over 2 minutes');
    }

    if (execution.errorCount > 0) {
      improvements.push(`Fix ${execution.errorCount} error(s) encountered during execution`);
    }

    if (!execution.success) {
      improvements.push('Improve error recovery and resilience');
      improvements.push('Add more comprehensive validation');
    }

    // Add general improvements
    improvements.push('Add more detailed logging for debugging');
    improvements.push('Improve documentation and comments');

    return improvements;
  }

  /**
   * Synthesize learnings from autonomous analysis and user feedback
   */
  private synthesizeLearnings(
    autonomous: AutonomousLessons,
    user: UserFeedback
  ): EnhancedLessons {
    // Generate synthesized recommendations
    const synthesizedRecommendations = this.generateRecommendations(autonomous, user);

    return {
      autonomousAnalysis: autonomous,
      userSatisfaction: user.satisfactionRating,
      userPreferredApproach: user.selectedApproach,
      userImprovements: user.improvements,
      weight: this.calculateWeight(user),
      confidenceScore: this.calculateConfidence(autonomous, user),
      synthesizedRecommendations
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    autonomous: AutonomousLessons,
    user: UserFeedback
  ): string[] {
    const recommendations: string[] = [];

    // If user agrees with AI recommendation
    if (user.selectedApproach === autonomous.recommendedApproach) {
      recommendations.push(`Continue using ${user.selectedApproach} approach - validated by user`);
    } else if (user.selectedApproach) {
      // User disagreed - learn from this
      recommendations.push(`Switch to ${user.selectedApproach} approach - preferred by user`);
      recommendations.push(`Re-evaluate criteria for recommending ${autonomous.recommendedApproach}`);
    }

    // Process user improvements
    if (user.improvements && user.improvements.length > 0) {
      recommendations.push('Incorporate user-suggested improvements:');
      user.improvements.forEach(imp => {
        recommendations.push(`  - ${imp}`);
      });
    }

    // Process preference signals
    for (const signal of user.preferenceSignals) {
      if (signal.shouldRepeat) {
        recommendations.push(`Apply preference: ${signal.category} = ${signal.value}`);
      } else {
        recommendations.push(`Avoid: ${signal.category} = ${signal.value}`);
      }
    }

    // Add quality improvement if satisfaction is low
    if (user.satisfactionRating <= 2) {
      recommendations.push('URGENT: User satisfaction is very low - major changes needed');
      recommendations.push('Review entire approach and consider alternative strategies');
    } else if (user.satisfactionRating === 3) {
      recommendations.push('User satisfaction is moderate - incremental improvements needed');
    }

    return recommendations;
  }

  /**
   * Calculate weight for learning signals
   * User feedback gets 2x weight vs autonomous analysis
   */
  private calculateWeight(feedback: UserFeedback): number {
    const baseWeight = 1.0;
    const userFeedbackMultiplier = 2.0;
    const satisfactionMultiplier = feedback.satisfactionRating / 5;

    return baseWeight * userFeedbackMultiplier * satisfactionMultiplier;
  }

  /**
   * Calculate confidence score
   * High confidence when user agrees with AI
   */
  private calculateConfidence(
    autonomous: AutonomousLessons,
    user: UserFeedback
  ): number {
    let confidence = 0.5; // Base confidence

    // High confidence when user agrees with AI
    if (user.selectedApproach === autonomous.recommendedApproach) {
      confidence = 0.95;
    } else if (user.selectedApproach) {
      // Lower confidence when user disagrees
      confidence = 0.6;
    }

    // Boost confidence for high satisfaction
    if (user.satisfactionRating >= 4) {
      confidence += 0.05;
    }

    // Reduce confidence for low satisfaction
    if (user.satisfactionRating <= 2) {
      confidence -= 0.1;
    }

    // Ensure confidence is in valid range
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Reflect without user feedback (autonomous only)
   * Useful for automated testing or batch processing
   */
  async reflectAutonomous(execution: ExecutionResult): Promise<AutonomousLessons> {
    return this.analyzeAutonomously(execution);
  }

  /**
   * Get historical feedback analytics
   */
  async getAnalytics(sopId?: string) {
    return this.feedbackStorage.getAnalytics(sopId);
  }

  /**
   * Get satisfaction trend for a SOP
   */
  async getSatisfactionTrend(sopId?: string) {
    return this.feedbackStorage.getSatisfactionTrend(sopId);
  }
}

/**
 * Export singleton instance
 */
export const reflectionSystem = new ReflectionSystem();
