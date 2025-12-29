const auditCheckpointTool = {
  name: "kg_audit_checkpoint",
  description: "Create a checkpoint in the audit chain. Checkpoints provide periodic state snapshots for efficient verification and sync recovery points.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Optional name for the checkpoint (for reference purposes)"
      },
      tags: {
        type: "array",
        description: "Optional tags for categorizing the checkpoint",
        items: {
          type: "string"
        }
      }
    }
  }
};
function createAuditCheckpointHandler(auditChain) {
  return async (params) => {
    const startTime = Date.now();
    const { name, tags } = params;
    try {
      if (!auditChain) {
        return {
          success: false,
          error: "Audit chain not initialized. The exochain audit system is not available.",
          metadata: { executionTime: Date.now() - startTime }
        };
      }
      const statsBefore = auditChain.getStats();
      const previousCheckpoint = auditChain.getLatestCheckpoint();
      const checkpoint = await auditChain.createCheckpoint();
      const statsAfter = auditChain.getStats();
      const checkpointData = {
        height: checkpoint.height,
        eventRoot: checkpoint.eventRoot,
        stateRoot: checkpoint.stateRoot,
        timestamp: checkpoint.timestamp.toISOString(),
        validatorCount: checkpoint.validatorSignatures.length,
        metadata: {
          name: name || null,
          tags: tags || []
        },
        stats: {
          totalEventsAtCheckpoint: statsAfter.totalEvents,
          eventsSincePreviousCheckpoint: previousCheckpoint ? statsAfter.totalEvents - statsBefore.totalEvents : statsAfter.totalEvents,
          previousCheckpointHeight: previousCheckpoint?.height ?? null
        }
      };
      return {
        success: true,
        data: checkpointData,
        metadata: {
          executionTime: Date.now() - startTime
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
  auditCheckpointTool,
  createAuditCheckpointHandler
};
//# sourceMappingURL=checkpoint.js.map
