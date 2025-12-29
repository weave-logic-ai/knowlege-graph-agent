/**
 * Reasoning Module
 *
 * Provides decision tracking, reasoning chains, and explainability.
 */

// ============================================================================
// Types
// ============================================================================

export type DecisionType =
  | 'classification'
  | 'selection'
  | 'routing'
  | 'prioritization'
  | 'validation'
  | 'transformation';

export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface DecisionContext {
  id: string;
  input: Record<string, unknown>;
  options?: string[];
  constraints?: string[];
  timestamp: Date;
}

export interface Alternative {
  id: string;
  description: string;
  score: number;
  reasonNotSelected?: string;
}

export interface DecisionOutcome {
  selected: string;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  alternatives: Alternative[];
  reasoning: string[];
}

export interface Decision {
  id: string;
  type: DecisionType;
  context: DecisionContext;
  outcome: DecisionOutcome;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface ReasoningChain {
  id: string;
  decisions: Decision[];
  conclusion?: string;
  confidence: ConfidenceLevel;
  totalDuration: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Decision Tracker
// ============================================================================

export class DecisionTracker {
  private decisions: Map<string, Decision> = new Map();
  private chains: Map<string, ReasoningChain> = new Map();
  private currentChainId?: string;

  startChain(metadata?: Record<string, unknown>): string {
    const id = `chain-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    this.chains.set(id, {
      id,
      decisions: [],
      confidence: 'medium',
      totalDuration: 0,
      metadata,
    });

    this.currentChainId = id;
    return id;
  }

  endChain(conclusion?: string): ReasoningChain | undefined {
    if (!this.currentChainId) return undefined;

    const chain = this.chains.get(this.currentChainId);
    if (chain) {
      chain.conclusion = conclusion;
      chain.totalDuration = chain.decisions.reduce((sum, d) => sum + d.duration, 0);
      chain.confidence = this.calculateChainConfidence(chain);
    }

    this.currentChainId = undefined;
    return chain;
  }

  recordDecision(
    type: DecisionType,
    context: Omit<DecisionContext, 'id' | 'timestamp'>,
    outcome: DecisionOutcome,
    duration: number,
    metadata?: Record<string, unknown>
  ): Decision {
    const id = `decision-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const decision: Decision = {
      id,
      type,
      context: {
        ...context,
        id: `ctx-${id}`,
        timestamp: new Date(),
      },
      outcome,
      duration,
      metadata,
    };

    this.decisions.set(id, decision);

    if (this.currentChainId) {
      const chain = this.chains.get(this.currentChainId);
      if (chain) {
        chain.decisions.push(decision);
      }
    }

    return decision;
  }

  getDecision(id: string): Decision | undefined {
    return this.decisions.get(id);
  }

  getChain(id: string): ReasoningChain | undefined {
    return this.chains.get(id);
  }

  getAllDecisions(): Decision[] {
    return Array.from(this.decisions.values());
  }

  getAllChains(): ReasoningChain[] {
    return Array.from(this.chains.values());
  }

  getDecisionsByType(type: DecisionType): Decision[] {
    return Array.from(this.decisions.values()).filter((d) => d.type === type);
  }

  getRecentDecisions(limit: number = 10): Decision[] {
    return Array.from(this.decisions.values())
      .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())
      .slice(0, limit);
  }

  getStatistics(): {
    totalDecisions: number;
    totalChains: number;
    averageDuration: number;
    byType: Record<DecisionType, number>;
    byConfidence: Record<ConfidenceLevel, number>;
  } {
    const decisions = Array.from(this.decisions.values());
    const byType: Record<string, number> = {};
    const byConfidence: Record<string, number> = {};

    let totalDuration = 0;

    for (const decision of decisions) {
      byType[decision.type] = (byType[decision.type] || 0) + 1;
      byConfidence[decision.outcome.confidence] =
        (byConfidence[decision.outcome.confidence] || 0) + 1;
      totalDuration += decision.duration;
    }

    return {
      totalDecisions: decisions.length,
      totalChains: this.chains.size,
      averageDuration: decisions.length > 0 ? totalDuration / decisions.length : 0,
      byType: byType as Record<DecisionType, number>,
      byConfidence: byConfidence as Record<ConfidenceLevel, number>,
    };
  }

  export(): {
    decisions: Decision[];
    chains: ReasoningChain[];
    exportedAt: Date;
  } {
    return {
      decisions: Array.from(this.decisions.values()),
      chains: Array.from(this.chains.values()),
      exportedAt: new Date(),
    };
  }

  clear(): void {
    this.decisions.clear();
    this.chains.clear();
    this.currentChainId = undefined;
  }

  private calculateChainConfidence(chain: ReasoningChain): ConfidenceLevel {
    if (chain.decisions.length === 0) return 'medium';

    const avgScore =
      chain.decisions.reduce((sum, d) => sum + d.outcome.confidenceScore, 0) /
      chain.decisions.length;

    if (avgScore >= 0.9) return 'very_high';
    if (avgScore >= 0.7) return 'high';
    if (avgScore >= 0.5) return 'medium';
    if (avgScore >= 0.3) return 'low';
    return 'very_low';
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultTracker: DecisionTracker | undefined;

export function createDecisionTracker(): DecisionTracker {
  return new DecisionTracker();
}

export function getDecisionTracker(): DecisionTracker {
  if (!defaultTracker) {
    defaultTracker = new DecisionTracker();
  }
  return defaultTracker;
}
