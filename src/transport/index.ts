/**
 * Transport Module
 *
 * Provides unified transport services for agent communication
 * and distributed task execution.
 *
 * @module transport
 */

export {
  AgentTransport,
  createAgentTransport,
  type TransportConfig,
  type TransportHealth,
  type TransportMetrics,
  type DistributedExecutionOptions,
  type ParallelExecutionResult,
  type AgentMessage,
  defaultTransportConfig,
} from './agent-transport.js';
