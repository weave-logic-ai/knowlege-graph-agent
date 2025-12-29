/**
 * Audit Checkpoint Tool
 *
 * MCP tool for creating checkpoints in the audit chain.
 * Checkpoints provide periodic state snapshots for efficient
 * verification and sync recovery.
 *
 * @module mcp-server/tools/audit/checkpoint
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { AuditChain } from '../../../audit/services/audit-chain.js';

/**
 * Audit checkpoint tool definition
 *
 * Creates a checkpoint in the audit chain with optional
 * name and tags for identification.
 */
export const auditCheckpointTool: Tool = {
  name: 'kg_audit_checkpoint',
  description: 'Create a checkpoint in the audit chain. Checkpoints provide periodic state snapshots for efficient verification and sync recovery points.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: 'Optional name for the checkpoint (for reference purposes)',
      },
      tags: {
        type: 'array',
        description: 'Optional tags for categorizing the checkpoint',
        items: {
          type: 'string',
        },
      },
    },
  },
};

/**
 * Parameters for the audit checkpoint tool
 */
export interface AuditCheckpointParams {
  /** Optional checkpoint name */
  name?: string;
  /** Optional tags for the checkpoint */
  tags?: string[];
}

/**
 * Create audit checkpoint handler
 *
 * Factory function that creates a tool handler for checkpoint creation.
 *
 * @param auditChain - The audit chain instance
 * @returns Tool handler function
 *
 * @example
 * ```typescript
 * const auditChain = createAuditChain({ agentDid: 'did:exo:agent-1' });
 * const handler = createAuditCheckpointHandler(auditChain);
 *
 * const result = await handler({
 *   name: 'pre-migration',
 *   tags: ['migration', 'backup']
 * });
 * ```
 */
export function createAuditCheckpointHandler(auditChain?: AuditChain): ToolHandler {
  return async (params: Record<string, unknown>): Promise<ToolResult> => {
    const startTime = Date.now();
    const { name, tags } = params as AuditCheckpointParams;

    try {
      // Check audit chain availability
      if (!auditChain) {
        return {
          success: false,
          error: 'Audit chain not initialized. The exochain audit system is not available.',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Get current stats before checkpoint
      const statsBefore = auditChain.getStats();
      const previousCheckpoint = auditChain.getLatestCheckpoint();

      // Create checkpoint
      const checkpoint = await auditChain.createCheckpoint();

      // Get stats after checkpoint
      const statsAfter = auditChain.getStats();

      // Format response
      const checkpointData = {
        height: checkpoint.height,
        eventRoot: checkpoint.eventRoot,
        stateRoot: checkpoint.stateRoot,
        timestamp: checkpoint.timestamp.toISOString(),
        validatorCount: checkpoint.validatorSignatures.length,
        metadata: {
          name: name || null,
          tags: tags || [],
        },
        stats: {
          totalEventsAtCheckpoint: statsAfter.totalEvents,
          eventsSincePreviousCheckpoint: previousCheckpoint
            ? statsAfter.totalEvents - statsBefore.totalEvents
            : statsAfter.totalEvents,
          previousCheckpointHeight: previousCheckpoint?.height ?? null,
        },
      };

      return {
        success: true,
        data: checkpointData,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  };
}

/**
 * Get the latest checkpoint from the audit chain
 *
 * Utility function to retrieve the most recent checkpoint.
 *
 * @param auditChain - The audit chain instance
 * @returns The latest checkpoint or null if none exist
 */
export function getLatestCheckpoint(auditChain: AuditChain) {
  return auditChain.getLatestCheckpoint();
}
