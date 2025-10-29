/**
 * MCP Handlers - Barrel Export
 *
 * This file exports all MCP request handlers for the Weave-NN server.
 * Current handlers:
 * - tool-handler: Handles MCP CallTool requests
 */

// Export tool handler interface and implementation
export * from './tool-handler.js';

// Additional handlers will be added here as they are implemented
// Example: export * from './resource-handlers';
// Example: export * from './prompt-handlers';
