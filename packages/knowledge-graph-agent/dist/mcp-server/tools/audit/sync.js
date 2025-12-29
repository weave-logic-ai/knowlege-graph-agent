const syncStatusTool = {
  name: "kg_sync_status",
  description: "Check the syndication status of the audit chain across peer environments. Shows peer connections, sync history, and error states.",
  inputSchema: {
    type: "object",
    properties: {
      peerId: {
        type: "string",
        description: "Specific peer ID to check status for (optional, returns all peers if not specified)"
      },
      detailed: {
        type: "boolean",
        description: "Include detailed sync metrics and history (default: false)",
        default: false
      }
    }
  }
};
function createSyncStatusHandler(syndicationService) {
  return async (params) => {
    const startTime = Date.now();
    const { peerId, detailed = false } = params;
    try {
      if (!syndicationService) {
        return {
          success: false,
          error: "Syndication service not initialized. Cross-environment sync is not available.",
          metadata: { executionTime: Date.now() - startTime }
        };
      }
      const formatPeerInfo = (peer) => {
        const baseInfo = {
          id: peer.id,
          endpoint: peer.endpoint,
          status: peer.status,
          lastSyncTime: peer.lastSyncTime?.toISOString() || null,
          errorCount: peer.errors,
          lastError: peer.lastError || null
        };
        if (detailed) {
          baseInfo.metrics = {
            eventsReceived: peer.eventsReceived,
            eventsSent: peer.eventsSent,
            latency: peer.latency ?? null,
            lastCheckpointHeight: peer.lastCheckpointHeight ?? null
          };
        }
        return baseInfo;
      };
      if (peerId && typeof peerId === "string") {
        const peer = syndicationService.getPeer(peerId);
        if (!peer) {
          return {
            success: false,
            error: `Peer not found: ${peerId}`,
            metadata: { executionTime: Date.now() - startTime }
          };
        }
        return {
          success: true,
          data: {
            peer: formatPeerInfo(peer),
            serviceStatus: {
              running: syndicationService.isServiceRunning(),
              syncing: syndicationService.isSyncing()
            }
          },
          metadata: {
            executionTime: Date.now() - startTime
          }
        };
      }
      const allPeers = syndicationService.getAllPeers();
      const stats = syndicationService.getStats();
      const formattedPeers = allPeers.map(formatPeerInfo);
      const peersByStatus = {
        connected: formattedPeers.filter((p) => p.status === "connected"),
        syncing: formattedPeers.filter((p) => p.status === "syncing"),
        disconnected: formattedPeers.filter((p) => p.status === "disconnected"),
        error: formattedPeers.filter((p) => p.status === "error")
      };
      const responseData = {
        peers: formattedPeers,
        peersByStatus,
        summary: {
          totalPeers: stats.totalPeers,
          connectedPeers: stats.connectedPeers,
          syncingPeers: stats.syncingPeers,
          errorPeers: stats.errorPeers
        },
        serviceStatus: {
          running: stats.isRunning,
          autoSyncEnabled: stats.autoSyncEnabled,
          syncInterval: stats.syncInterval,
          syncing: syndicationService.isSyncing()
        }
      };
      if (detailed) {
        responseData.aggregateMetrics = {
          totalEventsReceived: stats.totalEventsReceived,
          totalEventsSent: stats.totalEventsSent,
          totalErrors: stats.totalErrors
        };
      }
      return {
        success: true,
        data: responseData,
        metadata: {
          executionTime: Date.now() - startTime,
          itemCount: formattedPeers.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: Date.now() - startTime }
      };
    }
  };
}
export {
  createSyncStatusHandler,
  syncStatusTool
};
//# sourceMappingURL=sync.js.map
