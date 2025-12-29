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
import type { ToolHandler } from '../../types/index.js';
import type { AuditChain } from '../../../audit/services/audit-chain.js';
/**
 * Audit checkpoint tool definition
 *
 * Creates a checkpoint in the audit chain with optional
 * name and tags for identification.
 */
export declare const auditCheckpointTool: Tool;
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
export declare function createAuditCheckpointHandler(auditChain?: AuditChain): ToolHandler;
/**
 * Get the latest checkpoint from the audit chain
 *
 * Utility function to retrieve the most recent checkpoint.
 *
 * @param auditChain - The audit chain instance
 * @returns The latest checkpoint or null if none exist
 */
export declare function getLatestCheckpoint(auditChain: AuditChain): import("../../../audit/types.js").Checkpoint | null;
//# sourceMappingURL=checkpoint.d.ts.map