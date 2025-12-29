/**
 * Sync Status Tool
 *
 * MCP tool for checking the syndication status of the audit chain
 * across peer environments.
 *
 * @module mcp-server/tools/audit/sync
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { SyndicationService, PeerInfo } from '../../../audit/services/syndication.js';

/**
 * Sync status tool definition
 *
 * Provides visibility into peer synchronization status,
 * including connection state, sync history, and error tracking.
 */
export const syncStatusTool: Tool = {
  name: 'kg_sync_status',
  description: 'Check the syndication status of the audit chain across peer environments. Shows peer connections, sync history, and error states.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      peerId: {
        type: 'string',
        description: 'Specific peer ID to check status for (optional, returns all peers if not specified)',
      },
      detailed: {
        type: 'boolean',
        description: 'Include detailed sync metrics and history (default: false)',
        default: false,
      },
    },
  },
};

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
 * Formatted peer status for API response
 */
interface FormattedPeerStatus {
  /** Peer identifier */
  id: string;
  /** Network endpoint */
  endpoint: string;
  /** Connection status */
  status: string;
  /** Last sync timestamp */
  lastSyncTime: string | null;
  /** Error count */
  errorCount: number;
  /** Last error message */
  lastError: string | null;
  /** Detailed metrics (when detailed=true) */
  metrics?: {
    eventsReceived: number;
    eventsSent: number;
    latency: number | null;
    lastCheckpointHeight: number | null;
  };
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
export function createSyncStatusHandler(syndicationService?: SyndicationService): ToolHandler {
  return async (params: Record<string, unknown>): Promise<ToolResult> => {
    const startTime = Date.now();
    const { peerId, detailed = false } = params as SyncStatusParams;

    try {
      // Check syndication service availability
      if (!syndicationService) {
        return {
          success: false,
          error: 'Syndication service not initialized. Cross-environment sync is not available.',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Format peer info for response
      const formatPeerInfo = (peer: PeerInfo): FormattedPeerStatus => {
        const baseInfo: FormattedPeerStatus = {
          id: peer.id,
          endpoint: peer.endpoint,
          status: peer.status,
          lastSyncTime: peer.lastSyncTime?.toISOString() || null,
          errorCount: peer.errors,
          lastError: peer.lastError || null,
        };

        if (detailed) {
          baseInfo.metrics = {
            eventsReceived: peer.eventsReceived,
            eventsSent: peer.eventsSent,
            latency: peer.latency ?? null,
            lastCheckpointHeight: peer.lastCheckpointHeight ?? null,
          };
        }

        return baseInfo;
      };

      // Handle specific peer query
      if (peerId && typeof peerId === 'string') {
        const peer = syndicationService.getPeer(peerId);

        if (!peer) {
          return {
            success: false,
            error: `Peer not found: ${peerId}`,
            metadata: { executionTime: Date.now() - startTime },
          };
        }

        return {
          success: true,
          data: {
            peer: formatPeerInfo(peer),
            serviceStatus: {
              running: syndicationService.isServiceRunning(),
              syncing: syndicationService.isSyncing(),
            },
          },
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      }

      // Get all peers status
      const allPeers = syndicationService.getAllPeers();
      const stats = syndicationService.getStats();

      const formattedPeers = allPeers.map(formatPeerInfo);

      // Group peers by status
      const peersByStatus: Record<string, FormattedPeerStatus[]> = {
        connected: formattedPeers.filter((p) => p.status === 'connected'),
        syncing: formattedPeers.filter((p) => p.status === 'syncing'),
        disconnected: formattedPeers.filter((p) => p.status === 'disconnected'),
        error: formattedPeers.filter((p) => p.status === 'error'),
      };

      const responseData: Record<string, unknown> = {
        peers: formattedPeers,
        peersByStatus,
        summary: {
          totalPeers: stats.totalPeers,
          connectedPeers: stats.connectedPeers,
          syncingPeers: stats.syncingPeers,
          errorPeers: stats.errorPeers,
        },
        serviceStatus: {
          running: stats.isRunning,
          autoSyncEnabled: stats.autoSyncEnabled,
          syncInterval: stats.syncInterval,
          syncing: syndicationService.isSyncing(),
        },
      };

      // Include aggregate metrics if detailed
      if (detailed) {
        responseData.aggregateMetrics = {
          totalEventsReceived: stats.totalEventsReceived,
          totalEventsSent: stats.totalEventsSent,
          totalErrors: stats.totalErrors,
        };
      }

      return {
        success: true,
        data: responseData,
        metadata: {
          executionTime: Date.now() - startTime,
          itemCount: formattedPeers.length,
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
 * Trigger a manual sync with all peers
 *
 * Utility function to force an immediate sync operation.
 *
 * @param syndicationService - The syndication service instance
 * @returns Array of sync results
 */
export async function triggerManualSync(syndicationService: SyndicationService) {
  return syndicationService.forceSyncNow();
}
