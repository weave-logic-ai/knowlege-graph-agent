/**
 * Serve Command
 *
 * CLI command for running all Knowledge Graph Agent services concurrently.
 * Supports MCP server (stdio), GraphQL server (HTTP), and web dashboard.
 *
 * @module cli/commands/serve
 */
import { Command } from 'commander';
/**
 * Create the serve command
 */
export declare function createServeCommand(): Command;
export { ServerManager, createServerManager, SharedServices, createSharedServices, } from '../../server/index.js';
//# sourceMappingURL=serve.d.ts.map