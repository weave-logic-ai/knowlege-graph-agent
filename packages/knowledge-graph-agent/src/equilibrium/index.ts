/**
 * Equilibrium Module
 *
 * Game-theoretic agent selection using Nash equilibrium principles.
 * Replaces heuristic capability-matching with adaptive, competitive
 * agent selection where dominated agents naturally collapse.
 *
 * @module equilibrium
 */

export {
  // Main class
  AgentEquilibriumSelector,
  // Factory functions
  createAgentEquilibriumSelector,
  createEquilibriumTask,
  // Types
  type AgentParticipation,
  type EquilibriumConfig,
  type EquilibriumResult,
  type Task,
} from './agent-equilibrium.js';
