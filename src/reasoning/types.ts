/**
 * Reasoning System Types
 *
 * Type definitions for the decision tracking and reasoning chain system.
 * Enables transparent AI decision-making with full audit trails.
 *
 * @module reasoning/types
 */

/**
 * Type of decision made by the system
 * - automatic: System made decision without human input
 * - suggested: System suggests but awaits confirmation
 * - manual: Human-made decision
 * - override: Human override of system decision
 */
export type DecisionType = 'automatic' | 'suggested' | 'manual' | 'override';

/**
 * Confidence level in a decision
 * - low: <50% confidence, should probably get human input
 * - medium: 50-75% confidence, reasonable to proceed
 * - high: 75-95% confidence, strong basis for decision
 * - certain: >95% confidence, essentially deterministic
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'certain';

/**
 * Represents a single decision made by the reasoning system
 */
export interface Decision {
  /** Unique identifier for this decision */
  id: string;

  /** How the decision was made */
  type: DecisionType;

  /** The action taken or to be taken */
  action: string;

  /** Step-by-step reasoning that led to this decision */
  reasoning: string[];

  /** Confidence level in this decision */
  confidence: ConfidenceLevel;

  /** Context in which the decision was made */
  context: DecisionContext;

  /** Outcome after execution (populated later) */
  outcome?: DecisionOutcome;

  /** When the decision was made */
  timestamp: Date;
}

/**
 * Context surrounding a decision
 */
export interface DecisionContext {
  /** What triggered the need for a decision */
  trigger: string;

  /** Input data used to make the decision */
  inputs: Record<string, unknown>;

  /** Constraints that bounded the decision space */
  constraints: string[];

  /** Other options that were considered */
  alternatives: Alternative[];
}

/**
 * An alternative option that was considered
 */
export interface Alternative {
  /** The alternative action */
  action: string;

  /** Advantages of this alternative */
  pros: string[];

  /** Disadvantages of this alternative */
  cons: string[];

  /** Confidence level if this alternative were chosen */
  confidence: ConfidenceLevel;

  /** Whether this alternative was rejected */
  rejected: boolean;

  /** Why this alternative was not chosen */
  rejectionReason?: string;
}

/**
 * Outcome of executing a decision
 */
export interface DecisionOutcome {
  /** Whether the action succeeded */
  success: boolean;

  /** Result data if successful */
  result?: unknown;

  /** Error message if failed */
  error?: string;

  /** How long execution took in milliseconds */
  duration: number;

  /** Unintended effects that occurred */
  sideEffects: string[];
}

/**
 * Status of a reasoning chain
 */
export type ReasoningChainStatus = 'in_progress' | 'completed' | 'failed' | 'aborted';

/**
 * A chain of related decisions working toward a goal
 */
export interface ReasoningChain {
  /** Unique identifier for this chain */
  id: string;

  /** Decisions made as part of this chain */
  decisions: Decision[];

  /** When the chain started */
  startTime: Date;

  /** When the chain ended (if finished) */
  endTime?: Date;

  /** The goal this chain is working toward */
  goal: string;

  /** Current status of the chain */
  status: ReasoningChainStatus;
}

/**
 * Parameters for creating a new decision
 */
export interface CreateDecisionParams {
  /** The action to take */
  action: string;

  /** Reasoning steps */
  reasoning: string[];

  /** Confidence in the decision */
  confidence: ConfidenceLevel;

  /** Decision context */
  context: DecisionContext;

  /** Optional decision type (defaults to 'automatic') */
  type?: DecisionType;
}

/**
 * Statistics about reasoning performance
 */
export interface ReasoningStats {
  /** Total decisions made */
  totalDecisions: number;

  /** Decisions by type */
  byType: Record<DecisionType, number>;

  /** Decisions by confidence level */
  byConfidence: Record<ConfidenceLevel, number>;

  /** Success rate of completed decisions */
  successRate: number;

  /** Average decision duration in ms */
  averageDuration: number;

  /** Total chains started */
  totalChains: number;

  /** Chains by status */
  chainsByStatus: Record<ReasoningChainStatus, number>;
}
