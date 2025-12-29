/**
 * GraphQL Resolvers Index
 *
 * Exports all GraphQL resolvers for the knowledge-graph-agent API.
 *
 * @module graphql/resolvers
 */

// Query resolvers
export {
  queryResolvers,
  nodeResolver,
  nodesResolver,
  searchNodesResolver,
  graphResolver,
  tagsResolver,
  nodesByTagResolver,
  relationsResolver,
  healthResolver,
  cacheStatsResolver,
  agentsResolver,
  workflowsResolver,
  auditLogResolver,
  vectorSearchResolver,
  trajectoriesResolver,
  // Types
  type ResolverContext,
  type NodeFilter,
  type PaginationInput,
  type SearchOptions,
  type TrajectoryFilter,
  // Error handling utilities
  ErrorCodes,
} from './queries.js';

// Mutation resolvers
export {
  mutationResolvers,
  type MutationContext,
} from './mutations.js';

// Subscription resolvers
export {
  subscriptionResolvers,
  extendedSubscriptionResolvers,
  mergedSubscriptionResolvers,
  createSubscriptionCleanup,
  type SubscriptionContext,
} from './subscriptions.js';

// Re-export pubsub utilities for resolver integration
export {
  PubSub,
  getPubSub,
  resetPubSub,
  Topics,
  type TopicName,
  type TopicPayloadMap,
  type DeletedNode,
  type AgentStatusPayload,
  type WorkflowProgressPayload,
  type AnalysisProgressPayload,
  type HealthStatusPayload,
  type SubscriptionIterator,
  // Type-safe publish helpers
  publishNodeCreated,
  publishNodeUpdated,
  publishNodeDeleted,
  publishRelationCreated,
  publishAgentStatusChanged,
  publishWorkflowProgress,
  publishHealthUpdated,
  publishAnalysisProgress,
  wireEventEmitter,
} from '../pubsub.js';

// ============================================================================
// Combined Resolvers
// ============================================================================

import { queryResolvers } from './queries.js';
import { mutationResolvers } from './mutations.js';
import { mergedSubscriptionResolvers } from './subscriptions.js';

/**
 * All GraphQL resolvers combined.
 *
 * Import this object and merge with your schema to enable all resolvers.
 *
 * @example
 * ```typescript
 * import { makeExecutableSchema } from '@graphql-tools/schema';
 * import { resolvers } from './resolvers/index.js';
 * import { typeDefs } from './schema.js';
 *
 * const schema = makeExecutableSchema({
 *   typeDefs,
 *   resolvers,
 * });
 * ```
 */
export const resolvers = {
  ...queryResolvers,
  Mutation: mutationResolvers,
  ...mergedSubscriptionResolvers,
};

/**
 * Subscription-only resolvers export.
 *
 * Use this if you only need subscription functionality.
 */
export { mergedSubscriptionResolvers as subscriptions };

/**
 * Mutation-only resolvers export.
 *
 * Use this if you only need mutation functionality.
 */
export { mutationResolvers as mutations };

// Default export for convenience
export default resolvers;
