/**
 * SPARC Planning Module
 *
 * Comprehensive SPARC (Specification, Pseudocode, Architecture, Refinement, Completion)
 * planning system with consensus building, decision logging, and review processes.
 *
 * @module sparc
 */

// Types
export * from './types.js';

// Decision Log
export {
  DecisionLogManager,
  createDecisionLogManager,
  type DecisionLogManagerOptions,
  type AddDecisionOptions,
} from './decision-log.js';

// Consensus Builder
export {
  ConsensusBuilder,
  createConsensusBuilder,
  type ConsensusBuilderOptions,
  type AgentVote,
  type ConsensusOption,
} from './consensus.js';

// Review Process
export {
  ReviewProcessManager,
  createReviewProcess,
  type ReviewProcessOptions,
} from './review-process.js';

// SPARC Planner
export {
  SPARCPlanner,
  createSPARCPlanner,
  type SPARCPlannerOptions,
} from './sparc-planner.js';
