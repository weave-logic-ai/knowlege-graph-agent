/**
 * MCP Tools - Barrel Export
 *
 * This file exports all MCP tool definitions for the Weave-NN server.
 * Tools are organized by category:
 * - health: System health checks
 * - shadow-cache: Query vault metadata from SQLite cache
 * - workflow: Trigger and monitor workflow executions
 */

// Export tool registry and utilities
export * from './registry.js';
export * from './health.js';

// Export tool categories (tools will be added as they are implemented)
export * from './shadow-cache/index.js';
export * from './workflow/index.js';
