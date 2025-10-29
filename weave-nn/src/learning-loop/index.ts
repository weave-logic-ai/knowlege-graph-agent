/**
 * Autonomous Learning Loop - Main Entry Point
 * Implements the 4-Pillar Framework: Perception → Reasoning → Memory → Execution → Reflection
 *
 * Based on "Fundamentals of Building Autonomous LLM Agents" (arXiv:2510.09244v1)
 */

export * from './types';
export * from './perception';
export * from './reasoning';
export * from './memory';
export * from './execution';
export * from './reflection';
export * from './learning-loop';

// Re-export main class
export { AutonomousLearningLoop } from './learning-loop';
