const auditQueryTool = {
  name: "kg_audit_query",
  description: "Query the audit log for events with filtering by type, time range, and limit. Returns events from the deterministic append-only log.",
  inputSchema: {
    type: "object",
    properties: {
      eventType: {
        type: "string",
        description: "Filter by event type (e.g., NodeCreated, WorkflowCompleted, SyncStarted)"
      },
      startTime: {
        type: "string",
        description: "Start time filter as ISO 8601 timestamp (e.g., 2024-01-01T00:00:00Z)"
      },
      endTime: {
        type: "string",
        description: "End time filter as ISO 8601 timestamp (e.g., 2024-12-31T23:59:59Z)"
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 50, max: 1000)",
        default: 50,
        minimum: 1,
        maximum: 1e3
      },
      includePayload: {
        type: "boolean",
        description: "Include the full event payload in results (default: false)",
        default: false
      }
    }
  }
};
function createAuditQueryHandler(auditChain) {
  return async (params) => {
    const startTime = Date.now();
    const {
      eventType,
      startTime: startTimeParam,
      endTime: endTimeParam,
      limit = 50,
      includePayload = false
    } = params;
    try {
      if (!auditChain) {
        return {
          success: false,
          error: "Audit chain not initialized. The exochain audit system is not available.",
          metadata: { executionTime: Date.now() - startTime }
        };
      }
      const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 1e3);
      const queryOptions = {
        limit: safeLimit
      };
      if (eventType && typeof eventType === "string") {
        queryOptions.type = eventType;
      }
      if (startTimeParam && typeof startTimeParam === "string") {
        const startMs = new Date(startTimeParam).getTime();
        if (!isNaN(startMs)) {
          queryOptions.since = { physicalMs: startMs, logical: 0 };
        }
      }
      if (endTimeParam && typeof endTimeParam === "string") {
        const endMs = new Date(endTimeParam).getTime();
        if (!isNaN(endMs)) {
          queryOptions.until = { physicalMs: endMs, logical: Number.MAX_SAFE_INTEGER };
        }
      }
      const result = await auditChain.queryEvents(queryOptions);
      const formattedEvents = result.events.map((event) => {
        const baseEvent = {
          id: event.id,
          type: event.envelope.payload.type,
          author: event.envelope.author,
          timestamp: new Date(event.envelope.hlc.physicalMs).toISOString(),
          hlc: {
            physicalMs: event.envelope.hlc.physicalMs,
            logical: event.envelope.hlc.logical
          },
          parentCount: event.envelope.parents.length
        };
        if (includePayload) {
          return {
            ...baseEvent,
            payload: event.envelope.payload,
            signature: event.signature,
            parents: event.envelope.parents
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
            endTime: endTimeParam || null
          }
        },
        metadata: {
          executionTime: Date.now() - startTime,
          itemCount: formattedEvents.length
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
  auditQueryTool,
  createAuditQueryHandler
};
//# sourceMappingURL=query.js.map
