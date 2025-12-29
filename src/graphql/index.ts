/**
 * GraphQL Module
 *
 * Exports GraphQL server setup, context, and custom scalars for the
 * Knowledge Graph Agent API.
 *
 * @module graphql
 */

// ============================================================================
// Server
// ============================================================================

export {
  createGraphQLServer,
  type GraphQLServerConfig,
  type GraphQLServerInstance,
  type CorsConfig,
  type HealthCheckResponse,
} from './server.js';

// ============================================================================
// Context
// ============================================================================

export {
  createContextFactory,
  hasScope,
  requireAuth,
  requireScope,
  isGraphQLContext,
  type GraphQLContext,
  type AuthResult,
  type RequestMeta,
  type RequestUtils,
  type Services,
  type ContextFactoryConfig,
} from './context.js';

// ============================================================================
// Scalars
// ============================================================================

export {
  DateTimeScalar,
  JSONScalar,
  UUIDScalar,
  FilePathScalar,
  customScalars,
  scalarTypeDefs,
} from './scalars.js';
