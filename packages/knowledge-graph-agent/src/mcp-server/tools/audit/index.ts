/**
 * Audit Tools
 *
 * MCP tools for the exochain audit system, providing:
 * - Event querying with filtering
 * - Checkpoint creation for state snapshots
 * - Sync status monitoring for peer environments
 *
 * @module mcp-server/tools/audit
 */

// Query tool exports
export {
  auditQueryTool,
  createAuditQueryHandler,
  type AuditQueryParams,
} from './query.js';

// Checkpoint tool exports
export {
  auditCheckpointTool,
  createAuditCheckpointHandler,
  getLatestCheckpoint,
  type AuditCheckpointParams,
} from './checkpoint.js';

// Sync status tool exports
export {
  syncStatusTool,
  createSyncStatusHandler,
  triggerManualSync,
  type SyncStatusParams,
} from './sync.js';

import { auditQueryTool } from './query.js';
import { auditCheckpointTool } from './checkpoint.js';
import { syncStatusTool } from './sync.js';

/**
 * All audit tool definitions for registration
 */
export const auditToolDefinitions = [
  auditQueryTool,
  auditCheckpointTool,
  syncStatusTool,
];
