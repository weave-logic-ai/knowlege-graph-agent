/**
 * Claude-Flow Integration
 *
 * Integrates knowledge graph with claude-flow memory and coordination.
 */
import type { KnowledgeNode, SyncResult } from '../core/types.js';
import { KnowledgeGraphDatabase } from '../core/database.js';
/**
 * Claude-Flow client configuration
 */
export interface ClaudeFlowConfig {
    namespace: string;
    defaultTTL?: number;
    syncOnChange?: boolean;
}
/**
 * Claude-Flow Knowledge Graph Integration
 *
 * Syncs knowledge graph data with claude-flow memory for
 * cross-session persistence and agent coordination.
 */
export declare class ClaudeFlowIntegration {
    private config;
    constructor(config: ClaudeFlowConfig);
    /**
     * Sync all nodes to claude-flow memory
     */
    syncToMemory(db: KnowledgeGraphDatabase): Promise<SyncResult>;
    /**
     * Sync a single node to memory
     */
    syncNode(node: KnowledgeNode): Promise<boolean>;
    /**
     * Generate memory retrieval commands
     */
    generateRetrievalCommands(): string[];
    /**
     * Generate hook commands for automatic sync
     */
    generateHookCommands(): string[];
    /**
     * Convert node to memory entry format
     */
    private nodeToMemoryEntry;
    /**
     * Extract summary from content
     */
    private extractSummary;
    /**
     * Build tag index from nodes
     */
    private buildTagIndex;
}
/**
 * Create claude-flow integration instance
 */
export declare function createClaudeFlowIntegration(config: ClaudeFlowConfig): ClaudeFlowIntegration;
/**
 * Generate MCP configuration for CLAUDE.md
 */
export declare function generateMcpConfig(namespace: string): string;
//# sourceMappingURL=claude-flow.d.ts.map