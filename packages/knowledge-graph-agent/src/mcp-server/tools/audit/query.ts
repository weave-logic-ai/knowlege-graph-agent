/**
 * Audit Query Tool
 *
 * MCP tool for querying the audit log with filtering by event type,
 * time range, and result limits.
 *
 * @module mcp-server/tools/audit/query
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { AuditChain } from '../../../audit/services/audit-chain.js';
import type { HybridLogicalClock, KnowledgeGraphEventPayload } from '../../../audit/types.js';

/**
 * Audit query tool definition
 *
 * Provides filtering capabilities for the audit log including:
 * - Event type filtering
 * - Time range filtering via ISO timestamps
 * - Result limiting
 * - Optional payload inclusion
 */
export const auditQueryTool: Tool = {
  name: 'kg_audit_query',
  description: 'Query the audit log for events with filtering by type, time range, and limit. Returns events from the deterministic append-only log.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      eventType: {
        type: 'string',
        description: 'Filter by event type (e.g., NodeCreated, WorkflowCompleted, SyncStarted)',
      },
      startTime: {
        type: 'string',
        description: 'Start time filter as ISO 8601 timestamp (e.g., 2024-01-01T00:00:00Z)',
      },
      endTime: {
        type: 'string',
        description: 'End time filter as ISO 8601 timestamp (e.g., 2024-12-31T23:59:59Z)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 50, max: 1000)',
        default: 50,
        minimum: 1,
        maximum: 1000,
      },
      includePayload: {
        type: 'boolean',
        description: 'Include the full event payload in results (default: false)',
        default: false,
      },
    },
  },
};

/**
 * Parameters for the audit query tool
 */
export interface AuditQueryParams {
  /** Filter by event type */
  eventType?: string;
  /** Start time as ISO timestamp */
  startTime?: string;
  /** End time as ISO timestamp */
  endTime?: string;
  /** Maximum results to return */
  limit?: number;
  /** Include full payload in results */
  includePayload?: boolean;
}

/**
 * Create audit query handler
 *
 * Factory function that creates a tool handler with access to the audit chain.
 *
 * @param auditChain - The audit chain instance to query
 * @returns Tool handler function
 *
 * @example
 * ```typescript
 * const auditChain = createAuditChain({ agentDid: 'did:exo:agent-1' });
 * const handler = createAuditQueryHandler(auditChain);
 *
 * const result = await handler({
 *   eventType: 'NodeCreated',
 *   limit: 10,
 *   includePayload: true
 * });
 * ```
 */
export function createAuditQueryHandler(auditChain?: AuditChain): ToolHandler {
  return async (params: Record<string, unknown>): Promise<ToolResult> => {
    const startTime = Date.now();
    const {
      eventType,
      startTime: startTimeParam,
      endTime: endTimeParam,
      limit = 50,
      includePayload = false,
    } = params as AuditQueryParams;

    try {
      // Check audit chain availability
      if (!auditChain) {
        return {
          success: false,
          error: 'Audit chain not initialized. The exochain audit system is not available.',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Enforce limits
      const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 1000);

      // Build query options
      const queryOptions: {
        type?: KnowledgeGraphEventPayload['type'];
        since?: HybridLogicalClock;
        until?: HybridLogicalClock;
        limit: number;
        includeProof?: boolean;
      } = {
        limit: safeLimit,
      };

      // Add event type filter
      if (eventType && typeof eventType === 'string') {
        queryOptions.type = eventType as KnowledgeGraphEventPayload['type'];
      }

      // Add time range filters
      if (startTimeParam && typeof startTimeParam === 'string') {
        const startMs = new Date(startTimeParam).getTime();
        if (!isNaN(startMs)) {
          queryOptions.since = { physicalMs: startMs, logical: 0 };
        }
      }

      if (endTimeParam && typeof endTimeParam === 'string') {
        const endMs = new Date(endTimeParam).getTime();
        if (!isNaN(endMs)) {
          queryOptions.until = { physicalMs: endMs, logical: Number.MAX_SAFE_INTEGER };
        }
      }

      // Execute query
      const result = await auditChain.queryEvents(queryOptions);

      // Format results
      const formattedEvents = result.events.map((event) => {
        const baseEvent = {
          id: event.id,
          type: event.envelope.payload.type,
          author: event.envelope.author,
          timestamp: new Date(event.envelope.hlc.physicalMs).toISOString(),
          hlc: {
            physicalMs: event.envelope.hlc.physicalMs,
            logical: event.envelope.hlc.logical,
          },
          parentCount: event.envelope.parents.length,
        };

        if (includePayload) {
          return {
            ...baseEvent,
            payload: event.envelope.payload,
            signature: event.signature,
            parents: event.envelope.parents,
          };
        }

        return baseEvent;
      });

      return {
        success: true,
        data: {
          events: formattedEvents,
          count: formattedEvents.length,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          filters: {
            eventType: eventType || null,
            startTime: startTimeParam || null,
            endTime: endTimeParam || null,
          },
        },
        metadata: {
          executionTime: Date.now() - startTime,
          itemCount: formattedEvents.length,
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
