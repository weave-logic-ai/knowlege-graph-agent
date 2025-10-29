/**
 * Feedback Processor - Process user and system feedback
 *
 * Tracks success/failure patterns, extracts improvement signals,
 * and stores learning history for adaptation.
 */

import type { UserFeedback, FeedbackAnalytics } from './feedback-types.js';
import { FeedbackStorage } from './feedback-storage.js';
import { logger } from '../utils/logger.js';

export interface FeedbackPattern {
  category: string;
  pattern: string;
  frequency: number;
  avgSatisfaction: number;
  examples: string[];
  lastSeen: number;
}

export interface ImprovementSignal {
  type: 'success' | 'failure' | 'preference' | 'optimization';
  signal: string;
  confidence: number;
  source: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface LearningHistory {
  totalExecutions: number;
  successRate: number;
  averageSatisfaction: number;
  improvementTrend: number;
  topPatterns: FeedbackPattern[];
  recentSignals: ImprovementSignal[];
}

export class FeedbackProcessor {
  private storage: FeedbackStorage;
  private patterns: Map<string, FeedbackPattern> = new Map();
  private signals: ImprovementSignal[] = [];

  constructor() {
    this.storage = new FeedbackStorage();
  }

  /**
   * Process user feedback and extract learning signals
   */
  async processFeedback(feedback: UserFeedback): Promise<ImprovementSignal[]> {
    logger.info('Processing feedback', {
      sopId: feedback.sopId,
      satisfaction: feedback.satisfactionRating,
    });

    const signals: ImprovementSignal[] = [];

    // Extract satisfaction signal
    const satisfactionSignal = this.extractSatisfactionSignal(feedback);
    if (satisfactionSignal) {
      signals.push(satisfactionSignal);
    }

    // Extract approach preference signals
    const approachSignals = this.extractApproachSignals(feedback);
    signals.push(...approachSignals);

    // Extract improvement signals
    const improvementSignals = this.extractImprovementSignals(feedback);
    signals.push(...improvementSignals);

    // Extract preference signals
    const preferenceSignals = this.extractPreferenceSignals(feedback);
    signals.push(...preferenceSignals);

    // Update patterns
    await this.updatePatterns(feedback, signals);

    // Store signals
    this.signals.push(...signals);

    // Store feedback
    await this.storage.store(feedback);

    logger.info('Feedback processed', {
      sopId: feedback.sopId,
      signals: signals.length,
    });

    return signals;
  }

  /**
   * Extract satisfaction signal
   */
  private extractSatisfactionSignal(
    feedback: UserFeedback
  ): ImprovementSignal | null {
    const rating = feedback.satisfactionRating;

    if (rating >= 4) {
      return {
        type: 'success',
        signal: 'high-satisfaction',
        confidence: rating / 5,
        source: 'user-feedback',
        timestamp: feedback.timestamp,
        metadata: {
          rating,
          comment: feedback.satisfactionComment,
        },
      };
    } else if (rating <= 2) {
      return {
        type: 'failure',
        signal: 'low-satisfaction',
        confidence: (5 - rating) / 5,
        source: 'user-feedback',
        timestamp: feedback.timestamp,
        metadata: {
          rating,
          comment: feedback.satisfactionComment,
        },
      };
    }

    return null;
  }

  /**
   * Extract approach preference signals
   */
  private extractApproachSignals(feedback: UserFeedback): ImprovementSignal[] {
    const signals: ImprovementSignal[] = [];

    if (feedback.selectedApproach && feedback.approaches) {
      const selectedApproach = feedback.approaches.find(
        a => a.id === feedback.selectedApproach
      );

      if (selectedApproach) {
        signals.push({
          type: 'preference',
          signal: `prefer-approach:${selectedApproach.id}`,
          confidence: 0.9,
          source: 'user-selection',
          timestamp: feedback.timestamp,
          metadata: {
            approach: selectedApproach,
            rationale: feedback.approachRationale,
          },
        });
      }
    }

    return signals;
  }

  /**
   * Extract improvement signals from feedback
   */
  private extractImprovementSignals(
    feedback: UserFeedback
  ): ImprovementSignal[] {
    const signals: ImprovementSignal[] = [];

    if (feedback.improvements && feedback.improvements.length > 0) {
      feedback.improvements.forEach(improvement => {
        // Categorize improvement
        const category = this.categorizeImprovement(improvement);

        signals.push({
          type: 'optimization',
          signal: `improve:${category}`,
          confidence: 0.8,
          source: 'user-suggestion',
          timestamp: feedback.timestamp,
          metadata: {
            suggestion: improvement,
            category,
          },
        });
      });
    }

    return signals;
  }

  /**
   * Extract preference signals
   */
  private extractPreferenceSignals(
    feedback: UserFeedback
  ): ImprovementSignal[] {
    const signals: ImprovementSignal[] = [];

    if (feedback.preferenceSignals && feedback.preferenceSignals.length > 0) {
      feedback.preferenceSignals.forEach(preference => {
        if (preference.shouldRepeat) {
          signals.push({
            type: 'preference',
            signal: `${preference.category}:${preference.value}`,
            confidence: 0.85,
            source: 'user-preference',
            timestamp: feedback.timestamp,
            metadata: {
              category: preference.category,
              value: preference.value,
              conditions: preference.conditions,
            },
          });
        }
      });
    }

    return signals;
  }

  /**
   * Categorize improvement suggestion
   */
  private categorizeImprovement(improvement: string): string {
    const lower = improvement.toLowerCase();

    if (lower.includes('test') || lower.includes('coverage')) {
      return 'testing';
    }
    if (lower.includes('document') || lower.includes('comment')) {
      return 'documentation';
    }
    if (lower.includes('performance') || lower.includes('speed')) {
      return 'performance';
    }
    if (lower.includes('error') || lower.includes('validation')) {
      return 'error-handling';
    }
    if (lower.includes('ui') || lower.includes('ux')) {
      return 'user-experience';
    }

    return 'general';
  }

  /**
   * Update pattern tracking
   */
  private async updatePatterns(
    feedback: UserFeedback,
    signals: ImprovementSignal[]
  ): Promise<void> {
    signals.forEach(signal => {
      const key = `${signal.type}:${signal.signal}`;
      const existing = this.patterns.get(key);

      if (existing) {
        existing.frequency++;
        existing.avgSatisfaction =
          (existing.avgSatisfaction * (existing.frequency - 1) +
            feedback.satisfactionRating) /
          existing.frequency;
        existing.lastSeen = Date.now();
        existing.examples.push(
          signal.metadata?.suggestion || signal.metadata?.comment || signal.signal
        );
      } else {
        this.patterns.set(key, {
          category: signal.type,
          pattern: signal.signal,
          frequency: 1,
          avgSatisfaction: feedback.satisfactionRating,
          examples: [
            signal.metadata?.suggestion || signal.metadata?.comment || signal.signal,
          ],
          lastSeen: Date.now(),
        });
      }
    });
  }

  /**
   * Analyze feedback for a specific SOP
   */
  async analyzeFeedback(sopId: string): Promise<FeedbackAnalytics> {
    return await this.storage.getAnalytics(sopId);
  }

  /**
   * Get learning history for a SOP
   */
  async getLearningHistory(sopId: string): Promise<LearningHistory> {
    const analytics = await this.storage.getAnalytics(sopId);
    const trend = await this.storage.getSatisfactionTrend(sopId);

    // Calculate improvement trend
    const improvementTrend =
      trend.length >= 2
        ? trend[trend.length - 1] - trend[0]
        : 0;

    // Get top patterns for this SOP
    const topPatterns = Array.from(this.patterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Get recent signals
    const recentSignals = this.signals
      .filter(s => s.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      .slice(-20);

    return {
      totalExecutions: analytics.totalFeedback,
      successRate: analytics.averageSatisfaction / 5,
      averageSatisfaction: analytics.averageSatisfaction,
      improvementTrend,
      topPatterns,
      recentSignals,
    };
  }

  /**
   * Get improvement recommendations based on patterns
   */
  async getRecommendations(sopId: string): Promise<string[]> {
    const history = await this.getLearningHistory(sopId);
    const recommendations: string[] = [];

    // Low satisfaction patterns
    const lowSatisfactionPatterns = history.topPatterns.filter(
      p => p.avgSatisfaction < 3
    );

    lowSatisfactionPatterns.forEach(pattern => {
      recommendations.push(
        `Address ${pattern.pattern} - frequently mentioned with low satisfaction (${pattern.frequency}x)`
      );
    });

    // Preference patterns
    const preferencePatterns = history.topPatterns.filter(
      p => p.category === 'preference'
    );

    preferencePatterns.forEach(pattern => {
      recommendations.push(
        `Apply preference: ${pattern.pattern} (successful ${pattern.frequency}x)`
      );
    });

    // Declining satisfaction trend
    if (history.improvementTrend < -0.5) {
      recommendations.push(
        'Satisfaction declining - review recent changes and user feedback'
      );
    }

    // Generic recommendations
    if (recommendations.length === 0) {
      recommendations.push('Continue current approach - metrics are stable');
    }

    return recommendations;
  }

  /**
   * Get all tracked patterns
   */
  getPatterns(): FeedbackPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get recent signals
   */
  getRecentSignals(limit: number = 50): ImprovementSignal[] {
    return this.signals.slice(-limit);
  }

  /**
   * Clear old signals (cleanup)
   */
  clearOldSignals(olderThanDays: number = 90): number {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const originalLength = this.signals.length;

    this.signals = this.signals.filter(s => s.timestamp > cutoff);

    const removed = originalLength - this.signals.length;
    logger.info('Cleared old signals', { removed, remaining: this.signals.length });

    return removed;
  }

  /**
   * Export patterns for analysis
   */
  exportPatterns(): Record<string, any> {
    return {
      patterns: Array.from(this.patterns.entries()).map(([key, pattern]) => ({
        key,
        ...pattern,
      })),
      totalPatterns: this.patterns.size,
      totalSignals: this.signals.length,
    };
  }
}

/**
 * Singleton instance
 */
export const feedbackProcessor = new FeedbackProcessor();
