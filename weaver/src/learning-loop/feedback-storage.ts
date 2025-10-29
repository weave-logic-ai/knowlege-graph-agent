/**
 * Feedback Storage and Retrieval System
 *
 * Persists user feedback in claude-flow memory
 * Provides analytics and trend analysis capabilities
 */

import { claudeFlowCLI } from '../claude-flow/index.js';
import type {
  UserFeedback,
  FeedbackAnalytics,
  PreferenceSignal
} from './feedback-types';

export class FeedbackStorage {
  private readonly namespace = 'weaver_feedback';

  /**
   * Store feedback in claude-flow memory
   */
  async store(feedback: UserFeedback): Promise<void> {
    await claudeFlowCLI.memoryStore(
      feedback.id,
      JSON.stringify(feedback),
      this.namespace
    );
  }

  /**
   * Retrieve feedback for a specific SOP
   */
  async getFeedbackForSOP(sopId: string): Promise<UserFeedback[]> {
    try {
      const results = await claudeFlowCLI.memorySearch(
        sopId,
        this.namespace
      );

      return results
        .map(r => {
          try {
            // Handle both string values and object results from memory
            const valueStr = typeof r === 'string' ? r : (r as any).value;
            return JSON.parse(valueStr) as UserFeedback;
          } catch (e) {
            console.warn('Failed to parse feedback:', e);
            return null;
          }
        })
        .filter((f): f is UserFeedback => f !== null);
    } catch (error) {
      console.warn('Failed to retrieve feedback for SOP:', error);
      return [];
    }
  }

  /**
   * Get all feedback
   */
  async getAllFeedback(): Promise<UserFeedback[]> {
    try {
      const results = await claudeFlowCLI.memoryList(this.namespace);

      return results
        .map(r => {
          try {
            // Handle both string values and object results from memory
            const valueStr = typeof r === 'string' ? r : (r as any).value;
            return JSON.parse(valueStr) as UserFeedback;
          } catch (e) {
            console.warn('Failed to parse feedback:', e);
            return null;
          }
        })
        .filter((f): f is UserFeedback => f !== null);
    } catch (error) {
      console.warn('Failed to retrieve all feedback:', error);
      return [];
    }
  }

  /**
   * Calculate satisfaction trend over time
   */
  async getSatisfactionTrend(sopId?: string): Promise<number[]> {
    const feedback = sopId
      ? await this.getFeedbackForSOP(sopId)
      : await this.getAllFeedback();

    return feedback
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(f => f.satisfactionRating);
  }

  /**
   * Get most preferred approaches for a SOP
   */
  async getApproachPreferences(sopId: string): Promise<Map<string, number>> {
    const feedback = await this.getFeedbackForSOP(sopId);
    const preferences = new Map<string, number>();

    for (const f of feedback) {
      if (f.selectedApproach) {
        preferences.set(
          f.selectedApproach,
          (preferences.get(f.selectedApproach) || 0) + 1
        );
      }
    }

    return preferences;
  }

  /**
   * Get comprehensive analytics for a SOP
   */
  async getAnalytics(sopId?: string): Promise<FeedbackAnalytics> {
    const feedback = sopId
      ? await this.getFeedbackForSOP(sopId)
      : await this.getAllFeedback();

    if (feedback.length === 0) {
      return {
        totalFeedback: 0,
        averageSatisfaction: 0,
        satisfactionTrend: [],
        topApproaches: [],
        commonImprovements: [],
        preferencePatterns: new Map()
      };
    }

    // Calculate average satisfaction
    const averageSatisfaction = feedback.reduce((sum, f) => sum + f.satisfactionRating, 0) / feedback.length;

    // Get satisfaction trend
    const satisfactionTrend = feedback
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(f => f.satisfactionRating);

    // Analyze top approaches
    const approachStats = new Map<string, { count: number; totalSatisfaction: number }>();
    for (const f of feedback) {
      if (f.selectedApproach) {
        const stats = approachStats.get(f.selectedApproach) || { count: 0, totalSatisfaction: 0 };
        stats.count++;
        stats.totalSatisfaction += f.satisfactionRating;
        approachStats.set(f.selectedApproach, stats);
      }
    }

    const topApproaches = Array.from(approachStats.entries())
      .map(([id, stats]) => ({
        id,
        count: stats.count,
        avgSatisfaction: stats.totalSatisfaction / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Analyze common improvements
    const improvementFrequency = new Map<string, number>();
    for (const f of feedback) {
      if (f.improvements) {
        for (const improvement of f.improvements) {
          improvementFrequency.set(
            improvement,
            (improvementFrequency.get(improvement) || 0) + 1
          );
        }
      }
    }

    const commonImprovements = Array.from(improvementFrequency.entries())
      .map(([text, frequency]) => ({ text, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Analyze preference patterns
    const preferencePatterns = new Map<string, PreferenceSignal[]>();
    for (const f of feedback) {
      for (const signal of f.preferenceSignals) {
        const patterns = preferencePatterns.get(signal.category) || [];
        patterns.push(signal);
        preferencePatterns.set(signal.category, patterns);
      }
    }

    return {
      totalFeedback: feedback.length,
      averageSatisfaction,
      satisfactionTrend,
      topApproaches,
      commonImprovements,
      preferencePatterns
    };
  }

  /**
   * Get most recent feedback for a SOP
   */
  async getRecentFeedback(sopId: string, limit: number = 5): Promise<UserFeedback[]> {
    const feedback = await this.getFeedbackForSOP(sopId);

    return feedback
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get feedback by satisfaction level
   */
  async getFeedbackBySatisfaction(
    sopId: string,
    minRating: number,
    maxRating: number
  ): Promise<UserFeedback[]> {
    const feedback = await this.getFeedbackForSOP(sopId);

    return feedback.filter(
      f => f.satisfactionRating >= minRating && f.satisfactionRating <= maxRating
    );
  }

  /**
   * Get all preference signals for a category
   */
  async getPreferenceSignals(category: string, sopId?: string): Promise<PreferenceSignal[]> {
    const feedback = sopId
      ? await this.getFeedbackForSOP(sopId)
      : await this.getAllFeedback();

    const signals: PreferenceSignal[] = [];

    for (const f of feedback) {
      const categorySignals = f.preferenceSignals.filter(s => s.category === category);
      signals.push(...categorySignals);
    }

    return signals;
  }

  /**
   * Calculate improvement rate over time
   */
  async getImprovementRate(sopId: string, windowSize: number = 5): Promise<number> {
    const trend = await this.getSatisfactionTrend(sopId);

    if (trend.length < windowSize * 2) {
      return 0;
    }

    // Compare first window to last window
    const firstWindow = trend.slice(0, windowSize);
    const lastWindow = trend.slice(-windowSize);

    const firstAvg = firstWindow.reduce((a, b) => a + b, 0) / windowSize;
    const lastAvg = lastWindow.reduce((a, b) => a + b, 0) / windowSize;

    return ((lastAvg - firstAvg) / firstAvg) * 100;
  }

  /**
   * Delete old feedback (older than specified days)
   */
  async cleanupOldFeedback(daysToKeep: number = 90): Promise<number> {
    const allFeedback = await this.getAllFeedback();
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    let deletedCount = 0;

    for (const feedback of allFeedback) {
      if (feedback.timestamp < cutoffDate) {
        try {
          await claudeFlowCLI.memoryDelete(feedback.id, this.namespace);
          deletedCount++;
        } catch (error) {
          console.warn(`Failed to delete feedback ${feedback.id}:`, error);
        }
      }
    }

    return deletedCount;
  }
}
