/**
 * Sync Status Tool
 *
 * MCP tool for checking the syndication status of the audit chain
 * across peer environments.
 *
 * @module mcp-server/tools/audit/sync
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../../types/index.js';
import type { SyndicationService } from '../../../audit/services/syndication.js';
/**
 * Sync status tool definition
 *
 * Provides visibility into peer synchronization status,
 * including connection state, sync history, and error tracking.
 */
export declare const syncStatusTool: Tool;
/**
 * Parameters for the sync status tool
 */
export interface SyncStatusParams {
    /** Specific peer ID to check */
    peerId?: string;
    /** Include detailed information */
    detailed?: boolean;
}
/**
 * Create sync status handler
 *
 * Factory function that creates a tool handler for checking sync status.
 *
 * @param syndicationService - The syndication service instance
 * @returns Tool handler function
 *
 * @example
 * ```typescript
 * const syndication = createSyndicationService({ auditChain, peers: [...] });
 * const handler = createSyncStatusHandler(syndication);
 *
 * // Get all peers status
 * const result = await handler({ detailed: true });
 *
 * // Get specific peer status
 * const result = await handler({ peerId: 'peer-abc123', detailed: true });
 * ```
 */
export declare function createSyncStatusHandler(syndicationService?: SyndicationService): ToolHandler;
/**
 * Trigger a manual sync with all peers
 *
 * Utility function to force an immediate sync operation.
 *
 * @param syndicationService - The syndication service instance
 * @returns Array of sync results
 */
export declare function triggerManualSync(syndicationService: SyndicationService): Promise<import("../../../audit/services/syndication.js").SyncResult[]>;
//# sourceMappingURL=sync.d.ts.map