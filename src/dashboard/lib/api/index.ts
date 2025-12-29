/**
 * API Module Exports
 *
 * Central export point for all API-related functionality.
 */

// Client exports
export {
  GraphQLClient,
  initializeClient,
  getClient,
  query,
  mutate,
  subscribe,
  type ClientConfig,
  type GraphQLRequest,
  type GraphQLResponse,
  type SubscriptionHandler,
} from './client.js';

// Type exports
export * from './types.js';

// Query exports
export * from './queries.js';

// Mutation exports
export * from './mutations.js';
