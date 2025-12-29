/**
 * Decision Tracker - Track and explain AI decisions
 *
 * Provides comprehensive tracking of AI reasoning and decision-making,
 * enabling transparency, debugging, and audit trails for all automated actions.
 *
 * @module reasoning/tracker
 */

import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { getLogger } from '../utils/index.js';
import type {
  Decision,
  DecisionContext,
  DecisionOutcome,
  ReasoningChain,
  ReasoningChainStatus,
  ConfidenceLevel,
  DecisionType,
  CreateDecisionParams,
  ReasoningStats,
} from './types.js';

const logger = getLogger().child('reasoning');

/**
 * Events emitted by the DecisionTracker
 */
export interface DecisionTrackerEvents {
  chainStarted: (chain: ReasoningChain) => void;
  chainEnded: (chain: ReasoningChain) => void;
  decisionRecorded: (decision: Decision) => void;
  outcomeRecorded: (decision: Decision) => void;
}

/**
 * Decision Tracker for recording, explaining, and auditing AI decisions
 *
 * @example
 * ```typescript
 * const tracker = createDecisionTracker();
 *
 * // Start a reasoning chain for a goal
 * const chainId = tracker.startChain('Process user query about entities');
 *
 * // Record decisions as they're made
 * const decision = tracker.recordDecision({
 *   action: 'Extract entities from query',
 *   reasoning: [
 *     'Query contains multiple noun phrases',
 *     'NLP analysis identified 3 potential entities',
 *     'Confidence scores above threshold for all 3',
 *   ],
 *   confidence: 'high',
 *   context: {
 *     trigger: 'user_query',
 *     inputs: { query: 'Tell me about Apple and Microsoft' },
 *     constraints: ['max 10 entities', 'confidence > 0.7'],
 *     alternatives: [],
 *   },
 * });
 *
 * // Record outcome after execution
 * tracker.recordOutcome(decision.id, {
 *   success: true,
 *   result: { entities: ['Apple', 'Microsoft'] },
 *   duration: 150,
 *   sideEffects: [],
 * });
 *
 * // Get explanation
 * console.log(tracker.explainDecision(decision.id));
 *
 * // End the chain
 * tracker.endChain(chainId);
 * ```
 */
export class DecisionTracker extends EventEmitter {
  private decisions: Map<string, Decision> = new Map();
  private chains: Map<string, ReasoningChain> = new Map();
  private currentChain?: ReasoningChain;
  private maxDecisions: number;
  private maxChains: number;

  constructor(options: { maxDecisions?: number; maxChains?: number } = {}) {
    super();
    this.maxDecisions = options.maxDecisions ?? 10000;
    this.maxChains = options.maxChains ?? 1000;
  }

  /**
   * Start a new reasoning chain for a specific goal
   *
   * @param goal - The goal this reasoning chain is working toward
   * @returns The chain ID
   */
  startChain(goal: string): string {
    // Enforce max chains limit
    if (this.chains.size >= this.maxChains) {
      this.pruneOldChains();
    }

    const chain: ReasoningChain = {
      id: randomUUID(),
      decisions: [],
      startTime: new Date(),
      goal,
      status: 'in_progress',
    };

    this.chains.set(chain.id, chain);
    this.currentChain = chain;

    logger.info('Reasoning chain started', { id: chain.id, goal });
    this.emit('chainStarted', chain);

    return chain.id;
  }

  /**
   * Record a decision made by the system
   *
   * @param params - Decision parameters
   * @returns The recorded decision
   */
  recordDecision(params: CreateDecisionParams): Decision {
    // Enforce max decisions limit
    if (this.decisions.size >= this.maxDecisions) {
      this.pruneOldDecisions();
    }

    const decision: Decision = {
      id: randomUUID(),
      type: params.type ?? 'automatic',
      action: params.action,
      reasoning: params.reasoning,
      confidence: params.confidence,
      context: params.context,
      timestamp: new Date(),
    };

    this.decisions.set(decision.id, decision);

    if (this.currentChain) {
      this.currentChain.decisions.push(decision);
    }

    logger.debug('Decision recorded', {
      id: decision.id,
      action: params.action,
      confidence: params.confidence,
      chainId: this.currentChain?.id,
    });

    this.emit('decisionRecorded', decision);

    return decision;
  }

  /**
   * Record the outcome of a decision after execution
   *
   * @param decisionId - ID of the decision
   * @param outcome - The outcome to record
   */
  recordOutcome(decisionId: string, outcome: DecisionOutcome): void {
    const decision = this.decisions.get(decisionId);
    if (!decision) {
      logger.warn('Decision not found for outcome', { decisionId });
      return;
    }

    decision.outcome = outcome;
    this.emit('outcomeRecorded', decision);

    logger.debug('Outcome recorded', {
      decisionId,
      success: outcome.success,
      duration: outcome.duration,
    });
  }

  /**
   * End a reasoning chain
   *
   * @param chainId - ID of the chain to end
   * @param status - Final status of the chain
   */
  endChain(chainId: string, status: ReasoningChainStatus = 'completed'): void {
    const chain = this.chains.get(chainId);
    if (!chain) {
      logger.warn('Chain not found', { chainId });
      return;
    }

    chain.endTime = new Date();
    chain.status = status;

    if (this.currentChain?.id === chainId) {
      this.currentChain = undefined;
    }

    logger.info('Reasoning chain ended', {
      id: chainId,
      status,
      decisions: chain.decisions.length,
      duration: chain.endTime.getTime() - chain.startTime.getTime(),
    });

    this.emit('chainEnded', chain);
  }

  /**
   * Get a decision by ID
   *
   * @param id - Decision ID
   * @returns The decision or undefined
   */
  getDecision(id: string): Decision | undefined {
    return this.decisions.get(id);
  }

  /**
   * Get a reasoning chain by ID
   *
   * @param id - Chain ID
   * @returns The chain or undefined
   */
  getChain(id: string): ReasoningChain | undefined {
    return this.chains.get(id);
  }

  /**
   * Get the currently active reasoning chain
   *
   * @returns The current chain or undefined
   */
  getCurrentChain(): ReasoningChain | undefined {
    return this.currentChain;
  }

  /**
   * Get recent decisions
   *
   * @param limit - Maximum number of decisions to return
   * @returns Array of recent decisions, newest first
   */
  getRecentDecisions(limit = 10): Decision[] {
    return Array.from(this.decisions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get all decisions in a chain
   *
   * @param chainId - Chain ID
   * @returns Array of decisions in the chain
   */
  getChainDecisions(chainId: string): Decision[] {
    const chain = this.chains.get(chainId);
    return chain?.decisions ?? [];
  }

  /**
   * Generate a human-readable explanation of a decision
   *
   * @param decisionId - ID of the decision to explain
   * @returns Formatted explanation string
   */
  explainDecision(decisionId: string): string {
    const decision = this.decisions.get(decisionId);
    if (!decision) return 'Decision not found';

    const lines: string[] = [
      `Decision: ${decision.action}`,
      `Type: ${decision.type}`,
      `Confidence: ${decision.confidence}`,
      `Time: ${decision.timestamp.toISOString()}`,
      '',
      'Reasoning:',
      ...decision.reasoning.map((r, i) => `  ${i + 1}. ${r}`),
    ];

    if (decision.context.constraints.length > 0) {
      lines.push('', 'Constraints:');
      lines.push(...decision.context.constraints.map(c => `  - ${c}`));
    }

    if (decision.context.alternatives.length > 0) {
      lines.push('', 'Alternatives considered:');
      for (const alt of decision.context.alternatives) {
        lines.push(`  * ${alt.action} (${alt.confidence} confidence)`);
        if (alt.pros.length > 0) {
          lines.push(`    Pros: ${alt.pros.join(', ')}`);
        }
        if (alt.cons.length > 0) {
          lines.push(`    Cons: ${alt.cons.join(', ')}`);
        }
        if (alt.rejected && alt.rejectionReason) {
          lines.push(`    Rejected: ${alt.rejectionReason}`);
        }
      }
    }

    if (decision.outcome) {
      lines.push('', `Outcome: ${decision.outcome.success ? 'Success' : 'Failed'}`);
      lines.push(`Duration: ${decision.outcome.duration}ms`);
      if (decision.outcome.error) {
        lines.push(`Error: ${decision.outcome.error}`);
      }
      if (decision.outcome.sideEffects.length > 0) {
        lines.push('Side effects:');
        lines.push(...decision.outcome.sideEffects.map(e => `  - ${e}`));
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate a summary of a reasoning chain
   *
   * @param chainId - ID of the chain to summarize
   * @returns Formatted summary string
   */
  summarizeChain(chainId: string): string {
    const chain = this.chains.get(chainId);
    if (!chain) return 'Chain not found';

    const successCount = chain.decisions.filter(d => d.outcome?.success).length;
    const failCount = chain.decisions.filter(d => d.outcome?.success === false).length;
    const pendingCount = chain.decisions.filter(d => !d.outcome).length;

    const totalDuration = chain.decisions
      .filter(d => d.outcome?.duration)
      .reduce((sum, d) => sum + (d.outcome?.duration ?? 0), 0);

    const lines: string[] = [
      `Reasoning Chain: ${chain.id}`,
      `Goal: ${chain.goal}`,
      `Status: ${chain.status}`,
      `Started: ${chain.startTime.toISOString()}`,
      chain.endTime ? `Ended: ${chain.endTime.toISOString()}` : 'In progress',
      '',
      `Decisions: ${chain.decisions.length}`,
      `  - Successful: ${successCount}`,
      `  - Failed: ${failCount}`,
      `  - Pending: ${pendingCount}`,
      `Total execution time: ${totalDuration}ms`,
      '',
      'Decision sequence:',
    ];

    for (const decision of chain.decisions) {
      const status = decision.outcome
        ? decision.outcome.success
          ? '[OK]'
          : '[FAIL]'
        : '[...]';
      lines.push(`  ${status} ${decision.action} (${decision.confidence})`);
    }

    return lines.join('\n');
  }

  /**
   * Export a chain as a structured object for persistence or analysis
   *
   * @param chainId - ID of the chain to export
   * @returns Structured chain data with explanations
   */
  exportChain(chainId: string): object {
    const chain = this.chains.get(chainId);
    if (!chain) throw new Error(`Chain not found: ${chainId}`);

    return {
      ...chain,
      decisions: chain.decisions.map(d => ({
        ...d,
        explanation: this.explainDecision(d.id),
      })),
      summary: this.summarizeChain(chainId),
    };
  }

  /**
   * Get statistics about reasoning performance
   *
   * @returns Reasoning statistics
   */
  getStats(): ReasoningStats {
    const decisions = Array.from(this.decisions.values());
    const chains = Array.from(this.chains.values());

    const byType: Record<DecisionType, number> = {
      automatic: 0,
      suggested: 0,
      manual: 0,
      override: 0,
    };

    const byConfidence: Record<ConfidenceLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      certain: 0,
    };

    let successCount = 0;
    let completedCount = 0;
    let totalDuration = 0;

    for (const decision of decisions) {
      byType[decision.type]++;
      byConfidence[decision.confidence]++;

      if (decision.outcome) {
        completedCount++;
        if (decision.outcome.success) successCount++;
        totalDuration += decision.outcome.duration;
      }
    }

    const chainsByStatus: Record<ReasoningChainStatus, number> = {
      in_progress: 0,
      completed: 0,
      failed: 0,
      aborted: 0,
    };

    for (const chain of chains) {
      chainsByStatus[chain.status]++;
    }

    return {
      totalDecisions: decisions.length,
      byType,
      byConfidence,
      successRate: completedCount > 0 ? successCount / completedCount : 0,
      averageDuration: completedCount > 0 ? totalDuration / completedCount : 0,
      totalChains: chains.length,
      chainsByStatus,
    };
  }

  /**
   * Find decisions by criteria
   *
   * @param criteria - Search criteria
   * @returns Matching decisions
   */
  findDecisions(criteria: {
    type?: DecisionType;
    confidence?: ConfidenceLevel;
    success?: boolean;
    afterDate?: Date;
    beforeDate?: Date;
    actionContains?: string;
  }): Decision[] {
    return Array.from(this.decisions.values()).filter(d => {
      if (criteria.type && d.type !== criteria.type) return false;
      if (criteria.confidence && d.confidence !== criteria.confidence) return false;
      if (criteria.success !== undefined && d.outcome?.success !== criteria.success)
        return false;
      if (criteria.afterDate && d.timestamp < criteria.afterDate) return false;
      if (criteria.beforeDate && d.timestamp > criteria.beforeDate) return false;
      if (
        criteria.actionContains &&
        !d.action.toLowerCase().includes(criteria.actionContains.toLowerCase())
      )
        return false;
      return true;
    });
  }

  /**
   * Clear all tracked decisions and chains
   */
  clear(): void {
    this.decisions.clear();
    this.chains.clear();
    this.currentChain = undefined;
    logger.info('Decision tracker cleared');
  }

  /**
   * Remove old decisions to stay within limits
   */
  private pruneOldDecisions(): void {
    const sortedDecisions = Array.from(this.decisions.entries()).sort(
      ([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const toRemove = sortedDecisions.slice(0, Math.floor(this.maxDecisions * 0.2));
    for (const [id] of toRemove) {
      this.decisions.delete(id);
    }

    logger.debug('Pruned old decisions', { removed: toRemove.length });
  }

  /**
   * Remove old chains to stay within limits
   */
  private pruneOldChains(): void {
    const sortedChains = Array.from(this.chains.entries())
      .filter(([, chain]) => chain.status !== 'in_progress')
      .sort(([, a], [, b]) => a.startTime.getTime() - b.startTime.getTime());

    const toRemove = sortedChains.slice(0, Math.floor(this.maxChains * 0.2));
    for (const [id] of toRemove) {
      this.chains.delete(id);
    }

    logger.debug('Pruned old chains', { removed: toRemove.length });
  }
}

/**
 * Create a new DecisionTracker instance
 *
 * @param options - Tracker options
 * @returns New DecisionTracker instance
 */
export function createDecisionTracker(options?: {
  maxDecisions?: number;
  maxChains?: number;
}): DecisionTracker {
  return new DecisionTracker(options);
}

// Singleton instance
let defaultTracker: DecisionTracker | undefined;

/**
 * Get the default singleton DecisionTracker instance
 *
 * @returns The default DecisionTracker
 */
export function getDecisionTracker(): DecisionTracker {
  if (!defaultTracker) {
    defaultTracker = new DecisionTracker();
  }
  return defaultTracker;
}

/**
 * Set the default singleton DecisionTracker instance
 *
 * @param tracker - The tracker to use as default
 */
export function setDefaultDecisionTracker(tracker: DecisionTracker): void {
  defaultTracker = tracker;
}
