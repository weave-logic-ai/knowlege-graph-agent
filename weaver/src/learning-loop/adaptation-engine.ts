/**
 * Adaptation Engine - Strategy adjustment based on learning
 *
 * Modifies chunking strategies, search weights, and embedding models
 * based on performance feedback and learning signals.
 */

import type { ImprovementSignal, LearningHistory } from './feedback-processor.js';
import { feedbackProcessor } from './feedback-processor.js';
import { logger } from '../utils/logger.js';

export interface AdaptationStrategy {
  id: string;
  name: string;
  type: 'chunking' | 'search' | 'embedding' | 'perception' | 'execution';
  parameters: Record<string, any>;
  performance: StrategyPerformance;
}

export interface StrategyPerformance {
  successRate: number;
  averageSatisfaction: number;
  executionCount: number;
  lastUsed: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface AdaptationConfig {
  enableAutoAdaptation?: boolean;
  adaptationThreshold?: number;
  minExecutionsBeforeAdapt?: number;
  maxStrategies?: number;
}

export interface AdaptationResult {
  strategyId: string;
  previousParams: Record<string, any>;
  newParams: Record<string, any>;
  reason: string;
  expectedImprovement: number;
}

export class AdaptationEngine {
  private strategies: Map<string, AdaptationStrategy> = new Map();
  private adaptationHistory: AdaptationResult[] = [];

  constructor(private config: AdaptationConfig = {}) {
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default strategies
   */
  private initializeDefaultStrategies(): void {
    // Chunking strategies
    this.registerStrategy({
      id: 'chunking-semantic',
      name: 'Semantic Chunking',
      type: 'chunking',
      parameters: {
        method: 'semantic',
        maxChunkSize: 1000,
        overlapSize: 100,
      },
      performance: this.createEmptyPerformance(),
    });

    this.registerStrategy({
      id: 'chunking-fixed',
      name: 'Fixed-Size Chunking',
      type: 'chunking',
      parameters: {
        method: 'fixed',
        chunkSize: 500,
        overlapSize: 50,
      },
      performance: this.createEmptyPerformance(),
    });

    // Search strategies
    this.registerStrategy({
      id: 'search-balanced',
      name: 'Balanced Search',
      type: 'search',
      parameters: {
        providers: ['google', 'bing'],
        weights: { google: 0.6, bing: 0.4 },
        maxResults: 10,
      },
      performance: this.createEmptyPerformance(),
    });

    this.registerStrategy({
      id: 'search-fast',
      name: 'Fast Search',
      type: 'search',
      parameters: {
        providers: ['duckduckgo'],
        weights: { duckduckgo: 1.0 },
        maxResults: 5,
      },
      performance: this.createEmptyPerformance(),
    });

    // Embedding strategies
    this.registerStrategy({
      id: 'embedding-default',
      name: 'Default Embeddings',
      type: 'embedding',
      parameters: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
      },
      performance: this.createEmptyPerformance(),
    });

    logger.info('Initialized default adaptation strategies', {
      count: this.strategies.size,
    });
  }

  /**
   * Adapt strategies based on learning signals
   */
  async adapt(sopId: string, signals: ImprovementSignal[]): Promise<AdaptationResult[]> {
    if (!this.config.enableAutoAdaptation) {
      logger.info('Auto-adaptation disabled');
      return [];
    }

    const history = await feedbackProcessor.getLearningHistory(sopId);
    const results: AdaptationResult[] = [];

    // Check if we have enough data
    if (history.totalExecutions < (this.config.minExecutionsBeforeAdapt ?? 5)) {
      logger.info('Not enough executions for adaptation', {
        current: history.totalExecutions,
        required: this.config.minExecutionsBeforeAdapt ?? 5,
      });
      return [];
    }

    logger.info('Starting adaptation', {
      sopId,
      signals: signals.length,
      executions: history.totalExecutions,
    });

    // Adapt chunking strategy
    const chunkingAdaptation = await this.adaptChunkingStrategy(history, signals);
    if (chunkingAdaptation) {
      results.push(chunkingAdaptation);
    }

    // Adapt search strategy
    const searchAdaptation = await this.adaptSearchStrategy(history, signals);
    if (searchAdaptation) {
      results.push(searchAdaptation);
    }

    // Adapt embedding strategy
    const embeddingAdaptation = await this.adaptEmbeddingStrategy(history, signals);
    if (embeddingAdaptation) {
      results.push(embeddingAdaptation);
    }

    // Store adaptation history
    this.adaptationHistory.push(...results);

    logger.info('Adaptation completed', {
      sopId,
      adaptations: results.length,
    });

    return results;
  }

  /**
   * Adapt chunking strategy based on performance
   */
  private async adaptChunkingStrategy(
    history: LearningHistory,
    signals: ImprovementSignal[]
  ): Promise<AdaptationResult | null> {
    const chunkingStrategies = Array.from(this.strategies.values()).filter(
      s => s.type === 'chunking'
    );

    if (chunkingStrategies.length === 0) return null;

    // Check for performance signals
    const performanceSignals = signals.filter(
      s => s.type === 'optimization' && s.signal.includes('performance')
    );

    if (performanceSignals.length > 0) {
      // Switch to smaller chunks for better performance
      const currentStrategy = chunkingStrategies[0];
      const newParams = {
        ...currentStrategy.parameters,
        maxChunkSize: Math.max(500, currentStrategy.parameters.maxChunkSize - 200),
      };

      return {
        strategyId: currentStrategy.id,
        previousParams: currentStrategy.parameters,
        newParams,
        reason: 'Reducing chunk size to improve performance',
        expectedImprovement: 0.15,
      };
    }

    // Check for quality signals
    const qualitySignals = signals.filter(
      s => s.signal.includes('quality') || s.signal.includes('thorough')
    );

    if (qualitySignals.length > 0) {
      // Switch to larger chunks for better quality
      const currentStrategy = chunkingStrategies[0];
      const newParams = {
        ...currentStrategy.parameters,
        maxChunkSize: Math.min(2000, currentStrategy.parameters.maxChunkSize + 200),
      };

      return {
        strategyId: currentStrategy.id,
        previousParams: currentStrategy.parameters,
        newParams,
        reason: 'Increasing chunk size to improve quality',
        expectedImprovement: 0.1,
      };
    }

    return null;
  }

  /**
   * Adapt search strategy based on feedback
   */
  private async adaptSearchStrategy(
    history: LearningHistory,
    signals: ImprovementSignal[]
  ): Promise<AdaptationResult | null> {
    const searchStrategies = Array.from(this.strategies.values()).filter(
      s => s.type === 'search'
    );

    if (searchStrategies.length === 0) return null;

    // Check for speed preference
    const speedSignals = signals.filter(
      s => s.signal.includes('speed') || s.signal.includes('fast')
    );

    if (speedSignals.length > 0) {
      const currentStrategy = searchStrategies[0];
      const newParams = {
        ...currentStrategy.parameters,
        maxResults: Math.max(3, currentStrategy.parameters.maxResults - 2),
      };

      return {
        strategyId: currentStrategy.id,
        previousParams: currentStrategy.parameters,
        newParams,
        reason: 'Reducing search results to improve speed',
        expectedImprovement: 0.2,
      };
    }

    // Check for thoroughness preference
    const thoroughSignals = signals.filter(
      s => s.signal.includes('thorough') || s.signal.includes('comprehensive')
    );

    if (thoroughSignals.length > 0) {
      const currentStrategy = searchStrategies[0];
      const newParams = {
        ...currentStrategy.parameters,
        maxResults: Math.min(20, currentStrategy.parameters.maxResults + 3),
      };

      return {
        strategyId: currentStrategy.id,
        previousParams: currentStrategy.parameters,
        newParams,
        reason: 'Increasing search results for thoroughness',
        expectedImprovement: 0.15,
      };
    }

    return null;
  }

  /**
   * Adapt embedding strategy
   */
  private async adaptEmbeddingStrategy(
    _history: LearningHistory,
    _signals: ImprovementSignal[]
  ): Promise<AdaptationResult | null> {
    // For now, embedding strategy is mostly static
    // Future: Could adapt based on language, domain, etc.
    return null;
  }

  /**
   * Register a new strategy
   */
  registerStrategy(strategy: AdaptationStrategy): void {
    this.strategies.set(strategy.id, strategy);
    logger.info('Strategy registered', { id: strategy.id, type: strategy.type });
  }

  /**
   * Update strategy performance
   */
  updateStrategyPerformance(
    strategyId: string,
    success: boolean,
    satisfaction: number
  ): void {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return;

    const perf = strategy.performance;
    perf.executionCount++;
    perf.successRate =
      (perf.successRate * (perf.executionCount - 1) + (success ? 1 : 0)) /
      perf.executionCount;
    perf.averageSatisfaction =
      (perf.averageSatisfaction * (perf.executionCount - 1) + satisfaction) /
      perf.executionCount;
    perf.lastUsed = Date.now();

    // Update trend
    perf.trend = this.calculateTrend(perf);
  }

  /**
   * Calculate performance trend
   */
  private calculateTrend(
    perf: StrategyPerformance
  ): 'improving' | 'stable' | 'declining' {
    // Simple heuristic - can be enhanced
    if (perf.averageSatisfaction > 4) return 'improving';
    if (perf.averageSatisfaction < 3) return 'declining';
    return 'stable';
  }

  /**
   * Get best strategy for a type
   */
  getBestStrategy(type: AdaptationStrategy['type']): AdaptationStrategy | null {
    const strategies = Array.from(this.strategies.values()).filter(
      s => s.type === type
    );

    if (strategies.length === 0) return null;

    // Sort by success rate and satisfaction
    strategies.sort((a, b) => {
      const scoreA = a.performance.successRate * 0.5 + a.performance.averageSatisfaction / 5 * 0.5;
      const scoreB = b.performance.successRate * 0.5 + b.performance.averageSatisfaction / 5 * 0.5;
      return scoreB - scoreA;
    });

    return strategies[0];
  }

  /**
   * Get all strategies of a type
   */
  getStrategies(type?: AdaptationStrategy['type']): AdaptationStrategy[] {
    const all = Array.from(this.strategies.values());
    return type ? all.filter(s => s.type === type) : all;
  }

  /**
   * Get adaptation history
   */
  getAdaptationHistory(limit?: number): AdaptationResult[] {
    return limit
      ? this.adaptationHistory.slice(-limit)
      : [...this.adaptationHistory];
  }

  /**
   * Create empty performance metrics
   */
  private createEmptyPerformance(): StrategyPerformance {
    return {
      successRate: 0.5,
      averageSatisfaction: 3,
      executionCount: 0,
      lastUsed: Date.now(),
      trend: 'stable',
    };
  }

  /**
   * Export configuration
   */
  exportConfig(): Record<string, any> {
    return {
      strategies: Array.from(this.strategies.entries()).map(([id, strategy]) => ({
        id,
        ...strategy,
      })),
      adaptationHistory: this.adaptationHistory,
      config: this.config,
    };
  }
}

/**
 * Singleton instance
 */
export const adaptationEngine = new AdaptationEngine({
  enableAutoAdaptation: true,
  adaptationThreshold: 0.7,
  minExecutionsBeforeAdapt: 5,
  maxStrategies: 10,
});
