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
export { auditQueryTool, createAuditQueryHandler, type AuditQueryParams, } from './query.js';
export { auditCheckpointTool, createAuditCheckpointHandler, getLatestCheckpoint, type AuditCheckpointParams, } from './checkpoint.js';
export { syncStatusTool, createSyncStatusHandler, triggerManualSync, type SyncStatusParams, } from './sync.js';
/**
 * All audit tool definitions for registration
 */
export declare const auditToolDefinitions: {
    inputSchema: {
        [x: string]: unknown;
        type: "object";
        properties?: {
            [x: string]: object;
        } | undefined;
        required?: string[] | undefined;
    };
    name: string;
    description?: string | undefined;
    outputSchema?: {
        [x: string]: unknown;
        type: "object";
        properties?: {
            [x: string]: object;
        } | undefined;
        required?: string[] | undefined;
    } | undefined;
    annotations?: {
        title?: string | undefined;
        readOnlyHint?: boolean | undefined;
        destructiveHint?: boolean | undefined;
        idempotentHint?: boolean | undefined;
        openWorldHint?: boolean | undefined;
    } | undefined;
    _meta?: {
        [x: string]: unknown;
    } | undefined;
    icons?: {
        src: string;
        mimeType?: string | undefined;
        sizes?: string[] | undefined;
    }[] | undefined;
    title?: string | undefined;
}[];
//# sourceMappingURL=index.d.ts.map