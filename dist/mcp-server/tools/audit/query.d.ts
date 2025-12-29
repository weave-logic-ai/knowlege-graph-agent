/**
 * Audit Query Tool
 *
 * MCP tool for querying the audit log with filtering by event type,
 * time range, and result limits.
 *
 * @module mcp-server/tools/audit/query
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
import type { AuditChain } from '../../../audit/services/audit-chain.js';
/**
 * Audit query tool definition
 *
 * Provides filtering capabilities for the audit log including:
 * - Event type filtering
 * - Time range filtering via ISO timestamps
 * - Result limiting
 * - Optional payload inclusion
 */
export declare const auditQueryTool: Tool;
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
export declare function createAuditQueryHandler(auditChain?: AuditChain): ToolHandler;
//# sourceMappingURL=query.d.ts.map