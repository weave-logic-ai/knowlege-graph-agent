/**
 * Dashboard Module
 *
 * Provides dashboard server functionality for the Knowledge Graph Agent.
 * Supports development and production modes with GraphQL endpoint detection.
 *
 * @module dashboard
 *
 * @example
 * ```typescript
 * import { createDashboardServer, createDashboardConfig } from './dashboard';
 *
 * const config = createDashboardConfig(process.cwd(), {
 *   port: 3000,
 *   mode: 'development',
 * });
 *
 * const server = createDashboardServer(config);
 * await server.start();
 *
 * // Check GraphQL connection
 * const connected = await server.checkGraphQLConnection();
 *
 * // Later...
 * await server.stop();
 * ```
 */
export type { DashboardMode, DashboardConfig, DashboardStatus, DashboardState, DashboardEventType, IDashboardServer, } from './server.js';
export { DashboardServer, } from './server.js';
export { createDashboardServer, createDashboardConfig, } from './server.js';
//# sourceMappingURL=index.d.ts.map