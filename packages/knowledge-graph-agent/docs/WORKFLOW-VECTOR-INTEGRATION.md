# Workflow, Vector & Deterministic Logging Integration

**Version:** 1.0.0
**Date:** 2025-12-29
**Status:** Architecture Design Complete
**Author:** Claude Code Architecture Agent

---

## Executive Summary

This document outlines the integration of three key systems into the knowledge-graph-agent:

1. **Workflow DevKit** (useworkflow.dev) - Anthropic's durable workflow framework with Postgres World
2. **Exochain** - Deterministic logging with DAG-BFT for audit trails and syndication
3. **RuVector** - Self-learning vector database with knowledge graph integration

Together, these form a production-ready stack for real-time collaboration, auditable AI workflows, and semantic search.

---

## Current State Analysis

### Existing Infrastructure (SQLite-based)

| Component | Current | Limitation |
|-----------|---------|------------|
| Database | better-sqlite3 | Single-node, no horizontal scaling |
| Vectors | In-memory similarity | Not production-ready, no HNSW |
| Workflows | Custom file-event driven | No durable execution, no replay |
| Audit | SHA256 tamper-proof logs | Local files, no syndication |

### Migration Path

```
Current                          Target
─────────                        ──────
SQLite KG           ───────►     SQLite (unchanged) OR Postgres
In-memory vectors   ───────►     RuVector (HNSW + Graph)
Custom workflows    ───────►     Workflow DevKit (Postgres World)
Local audit logs    ───────►     Exochain (DAG-BFT)
```

---

## 1. Workflow DevKit Integration

### Why Workflow DevKit over LangGraph

| Feature | Workflow DevKit | LangGraph |
|---------|-----------------|-----------|
| TypeScript-first | ✅ Native | ⚠️ JS port |
| Anthropic ecosystem | ✅ Official | ❌ LangChain |
| Vercel deployment | ✅ Optimized | ⚠️ Manual |
| Event sourcing | ✅ Built-in | ❌ Checkpoints |
| DurableAgent | ✅ `@workflow/ai` | ❌ Custom |
| Postgres persistence | ✅ Postgres World | ✅ Both support |

### Core Integration Pattern

```typescript
// workflows/realtime-collab.ts
import { sleep, createHook, defineHook } from "workflow";
import { DurableAgent } from "@workflow/ai";

// Define typed events for knowledge graph updates
const nodeUpdateHook = defineHook<{
  nodeId: string;
  userId: string;
  changes: Record<string, unknown>;
  timestamp: number;
}>();

const gapDetectedHook = defineHook<{
  docPath: string;
  gaps: string[];
  confidence: number;
}>();

// Step: Analyze document for gaps
async function analyzeDocumentGaps(docPath: string) {
  "use step";
  const cultivation = new CultivationSystem();
  const gaps = await cultivation.analyzeGaps(docPath);
  return { gaps, completeness: 1 - (gaps.length / 10) };
}

// Step: Generate task spec from documentation
async function generateTaskSpec(docPath: string, context: string) {
  "use step";
  const agent = new DurableAgent({
    model: "claude-sonnet-4-20250514",
    systemPrompt: "You are a task specification generator..."
  });

  return await agent.run(`Generate task spec for: ${docPath}\nContext: ${context}`);
}

// Main collaboration workflow
export async function realtimeCollaborationWorkflow(graphId: string) {
  "use workflow";

  // Create hooks for external events
  const updateHook = await createHook(nodeUpdateHook);
  const gapHook = await createHook(gapDetectedHook);

  // Initialize durable agent for GOAP planning
  const goapAgent = new DurableAgent({
    model: "claude-sonnet-4-20250514",
    tools: [analyzeDocumentGaps, generateTaskSpec]
  });

  let lastChangeTime = Date.now();

  while (true) {
    // Wait for either: update event OR 5 minute timeout
    const result = await Promise.race([
      updateHook.wait().then(data => ({ type: 'update' as const, data })),
      sleep("5m").then(() => ({ type: 'timeout' as const, data: null }))
    ]);

    if (result.type === 'update') {
      // Process update
      lastChangeTime = Date.now();
      const analysis = await analyzeDocumentGaps(result.data.docPath);

      if (analysis.completeness >= 0.7) {
        // Enough info - generate task spec
        await generateTaskSpec(result.data.docPath, JSON.stringify(analysis));
      }
    } else {
      // 5 minute timeout - generate missing docs
      await goapAgent.run("Generate documentation for identified gaps");
    }
  }
}
```

### Postgres World Configuration

```typescript
// config/workflow.ts
import { PostgresWorld } from "@workflow/postgres";

export const workflowConfig = {
  world: new PostgresWorld({
    connectionString: process.env.DATABASE_URL,
    schema: "workflow",
    poolConfig: {
      max: 20,
      idleTimeoutMillis: 30000,
    },
  }),
  // Fallback for local development
  localWorld: process.env.NODE_ENV === "development",
};
```

### Vercel Integration

```typescript
// next.config.ts
import { withWorkflow } from "workflow/next";

export default withWorkflow({
  experimental: {
    serverComponentsExternalPackages: ["workflow"],
  },
});

// middleware.ts
export const config = {
  matcher: ["/((?!.well-known/workflow).*)"],
};
```

---

## 2. Exochain Deterministic Logging

### Why Exochain

| Feature | Benefit for Knowledge-Graph-Agent |
|---------|-----------------------------------|
| **Hybrid Logical Clocks** | Perfect ordering across distributed agents |
| **DAG structure** | Concurrent operations without conflicts |
| **BFT checkpoints** | Finality <2s for cross-environment sync |
| **BLAKE3 hashing** | Fast, deterministic event IDs |
| **Multi-DID support** | Natural fit for multi-agent systems |
| **Merkle proofs** | Lightweight verification without full sync |

### Event Schema for Knowledge-Graph-Agent

```typescript
// types/exochain-events.ts
import { Blake3Hash, Did, HybridLogicalClock } from "@exochain/core";

// Event types for knowledge graph operations
type KnowledgeGraphEventPayload =
  | { type: "NodeCreated"; nodeId: string; nodeType: string; data: Record<string, unknown> }
  | { type: "NodeUpdated"; nodeId: string; changes: Record<string, unknown> }
  | { type: "EdgeCreated"; sourceId: string; targetId: string; relation: string }
  | { type: "QueryExecuted"; queryHash: Blake3Hash; resultCount: number; agent: Did }
  | { type: "WorkflowStarted"; workflowId: string; trigger: string }
  | { type: "WorkflowCompleted"; workflowId: string; outcome: "success" | "failure" }
  | { type: "GapDetected"; docPath: string; gaps: string[]; confidence: number }
  | { type: "TaskSpecGenerated"; specId: string; sourceDoc: string }
  | { type: "ConflictDetected"; nodeId: string; conflictingAgents: Did[] }
  | { type: "ConflictResolved"; nodeId: string; resolution: string; resolver: Did }
  | { type: "SyncCheckpoint"; height: number; eventRoot: Blake3Hash };

interface KnowledgeGraphEvent {
  id: Blake3Hash;
  envelope: {
    parents: Blake3Hash[];
    hlc: HybridLogicalClock;
    author: Did;
    payload: KnowledgeGraphEventPayload;
  };
  signature: Uint8Array;
}
```

### Integration Service

```typescript
// services/audit-chain.ts
import { DagStore, HybridLogicalClock, sign, verify } from "@exochain/core";

export class KnowledgeGraphAuditChain {
  private dagStore: DagStore;
  private clock: HybridLogicalClock;
  private agentDid: Did;
  private privateKey: Uint8Array;

  constructor(config: AuditChainConfig) {
    this.dagStore = new DagStore(config.storageBackend);
    this.clock = new HybridLogicalClock();
    this.agentDid = config.agentDid;
    this.privateKey = config.privateKey;
  }

  // Log a node creation with full audit trail
  async logNodeCreated(nodeId: string, nodeType: string, data: Record<string, unknown>): Promise<Blake3Hash> {
    const parents = await this.dagStore.getTips();
    const hlc = this.clock.tick();

    const event: KnowledgeGraphEvent = {
      id: null!, // Computed from envelope
      envelope: {
        parents,
        hlc,
        author: this.agentDid,
        payload: { type: "NodeCreated", nodeId, nodeType, data }
      },
      signature: null!
    };

    // Compute deterministic event ID
    event.id = blake3(canonicalCbor(event.envelope));

    // Sign with agent's key
    event.signature = await sign(event.id, this.privateKey);

    // Persist to DAG
    await this.dagStore.insert(event);

    return event.id;
  }

  // Log workflow execution for audit
  async logWorkflowExecution(workflowId: string, stage: "started" | "completed", outcome?: string): Promise<Blake3Hash> {
    const payload = stage === "started"
      ? { type: "WorkflowStarted" as const, workflowId, trigger: "realtime-collab" }
      : { type: "WorkflowCompleted" as const, workflowId, outcome: outcome as "success" | "failure" };

    return await this.appendEvent(payload);
  }

  // Query events by type with Merkle proof
  async queryEvents(type: KnowledgeGraphEventPayload["type"], since?: HybridLogicalClock): Promise<KnowledgeGraphEvent[]> {
    return await this.dagStore.query({
      filter: (e) => e.envelope.payload.type === type,
      since,
      includeProof: true
    });
  }

  // Sync with another environment
  async syncWith(peerEndpoint: string): Promise<SyncResult> {
    const localCheckpoint = await this.dagStore.getLatestCheckpoint();
    const peerCheckpoint = await fetch(`${peerEndpoint}/checkpoint`).then(r => r.json());

    if (peerCheckpoint.height > localCheckpoint.height) {
      // Pull missing events
      const missingEvents = await fetch(`${peerEndpoint}/events?since=${localCheckpoint.eventRoot}`).then(r => r.json());

      for (const event of missingEvents) {
        // Verify signature and causality before accepting
        if (await verify(event) && await this.validateCausality(event)) {
          await this.dagStore.insert(event);
        }
      }
    }

    return { eventsReceived: missingEvents.length, newHeight: this.dagStore.height };
  }
}
```

### Cross-Environment Syndication

```typescript
// services/syndication.ts
export class EventSyndication {
  private auditChain: KnowledgeGraphAuditChain;
  private peers: Map<string, PeerConnection> = new Map();

  // Register peer for syndication
  async registerPeer(peerId: string, endpoint: string): Promise<void> {
    const connection = new PeerConnection(endpoint);
    await connection.handshake(this.auditChain.getCheckpoint());
    this.peers.set(peerId, connection);
  }

  // Broadcast event to all peers
  async broadcast(eventId: Blake3Hash): Promise<BroadcastResult> {
    const event = await this.auditChain.getEvent(eventId);
    const results = await Promise.allSettled(
      [...this.peers.values()].map(peer => peer.send(event))
    );

    return {
      success: results.filter(r => r.status === "fulfilled").length,
      failed: results.filter(r => r.status === "rejected").length
    };
  }

  // Subscribe to peer events
  subscribeToEvents(callback: (event: KnowledgeGraphEvent) => void): () => void {
    const handlers = [...this.peers.values()].map(peer =>
      peer.onEvent(async (event) => {
        if (await this.auditChain.validateAndInsert(event)) {
          callback(event);
        }
      })
    );

    return () => handlers.forEach(h => h.unsubscribe());
  }
}
```

---

## 3. RuVector Integration

### Why RuVector for Knowledge-Graph-Agent

| Feature | Benefit |
|---------|---------|
| **HNSW indexing** | 61us p50 latency for semantic search |
| **Cypher queries** | Native graph traversal for KG relationships |
| **Self-learning GNN** | Improves search based on query patterns |
| **Trajectory tracking** | Records agent operation sequences |
| **PostgreSQL extension** | Single database for workflows + vectors |
| **Hyperbolic embeddings** | Better hierarchical goal representation |

### Integration Architecture

```typescript
// services/vector-store.ts
import { VectorIndex, GraphDB, SonaEngine } from "ruvector";

export class EnhancedVectorStore {
  private vectorIndex: VectorIndex;
  private graphDb: GraphDB;
  private sonaEngine: SonaEngine;

  constructor(config: VectorStoreConfig) {
    // Initialize vector index with HNSW
    this.vectorIndex = new VectorIndex({
      dimensions: config.dimensions || 384,
      distanceMetric: "Cosine",
      indexType: "HNSW",
      hnswConfig: {
        m: 16,
        efConstruction: 200,
        efSearch: 100
      }
    });

    // Initialize graph database for relationship queries
    this.graphDb = new GraphDB({
      connectionString: config.postgresUrl,
      schema: "ruvector"
    });

    // Initialize self-learning engine
    this.sonaEngine = new SonaEngine({
      microLoraEnabled: true,
      trajectoryTracking: true
    });
  }

  // Enhanced hybrid search: vector similarity + graph relationships
  async hybridSearch(query: {
    embedding: number[];
    cypher?: string;
    filters?: Record<string, unknown>;
    limit?: number;
  }): Promise<HybridSearchResult[]> {
    // Start trajectory for learning
    const trajectory = this.sonaEngine.startTrajectory("hybrid-search");

    try {
      // Vector similarity search
      const vectorResults = await this.vectorIndex.search({
        vector: query.embedding,
        k: query.limit || 10,
        filter: query.filters
      });

      // Graph relationship expansion
      let graphResults: any[] = [];
      if (query.cypher) {
        graphResults = await this.graphDb.query(query.cypher, {
          candidateIds: vectorResults.map(r => r.id)
        });
      }

      // Merge and re-rank results
      const merged = this.mergeResults(vectorResults, graphResults);

      // Record success for learning
      await trajectory.finalize({ success: true, resultCount: merged.length });

      return merged;
    } catch (error) {
      await trajectory.finalize({ success: false, error: String(error) });
      throw error;
    }
  }

  // Store knowledge graph node with embedding
  async storeNode(node: {
    id: string;
    type: string;
    content: string;
    embedding: number[];
    metadata: Record<string, unknown>;
  }): Promise<void> {
    // Store vector
    await this.vectorIndex.insert({
      id: node.id,
      vector: node.embedding,
      metadata: {
        type: node.type,
        ...node.metadata
      }
    });

    // Store in graph
    await this.graphDb.query(`
      MERGE (n:${node.type} {id: $id})
      SET n.content = $content, n.metadata = $metadata
    `, { id: node.id, content: node.content, metadata: node.metadata });
  }

  // Find related concepts for GOAP planning
  async findRelatedConcepts(goalEmbedding: number[], goalType: string): Promise<RelatedConcept[]> {
    // Semantic search for similar goals
    const semanticMatches = await this.vectorIndex.search({
      vector: goalEmbedding,
      k: 20,
      filter: { type: "goal" }
    });

    // Graph traversal for related skills and examples
    const graphExpansion = await this.graphDb.query(`
      MATCH (goal:Goal)-[:REQUIRES]->(skill:Skill)
      WHERE goal.id IN $goalIds
      MATCH (skill)-[:HAS_EXAMPLE]->(example:Example)
      RETURN goal, skill, example,
             goal.success_rate as successRate,
             example.trajectory as trajectory
      ORDER BY successRate DESC
    `, { goalIds: semanticMatches.map(m => m.id) });

    return this.formatRelatedConcepts(semanticMatches, graphExpansion);
  }

  // Track workflow trajectory for self-learning
  async recordWorkflowTrajectory(workflowId: string, steps: WorkflowStep[]): Promise<void> {
    const trajectory = this.sonaEngine.createTrajectory(workflowId);

    for (const step of steps) {
      await trajectory.addStep({
        action: step.action,
        state: step.stateSnapshot,
        outcome: step.outcome,
        duration: step.durationMs
      });
    }

    await trajectory.finalize({
      success: steps.every(s => s.outcome === "success"),
      totalDuration: steps.reduce((sum, s) => sum + s.durationMs, 0)
    });
  }
}
```

### PostgreSQL Extension Mode

For unified database with workflows:

```sql
-- Enable RuVector extension
CREATE EXTENSION IF NOT EXISTS ruvector;

-- Create vector index for knowledge graph nodes
CREATE TABLE kg_embeddings (
  id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL,
  embedding ruvector.vector(384),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW index
CREATE INDEX kg_embeddings_hnsw_idx ON kg_embeddings
USING ruvector_hnsw (embedding ruvector.vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

-- Hybrid search function
CREATE OR REPLACE FUNCTION hybrid_kg_search(
  query_embedding ruvector.vector(384),
  cypher_filter TEXT DEFAULT NULL,
  limit_count INT DEFAULT 10
) RETURNS TABLE (
  id TEXT,
  node_type TEXT,
  similarity FLOAT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.node_type,
    1 - (e.embedding <=> query_embedding) as similarity,
    e.metadata
  FROM kg_embeddings e
  WHERE (cypher_filter IS NULL OR e.metadata @> cypher_filter::jsonb)
  ORDER BY e.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Unified Architecture

### Complete Integration Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Knowledge-Graph-Agent Stack                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        MCP Server Layer                                 │ │
│  │  kg_realtime_status | kg_workflow_trigger | kg_vector_search           │ │
│  │  kg_audit_query     | kg_sync_status      | kg_gap_detect              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│  ┌─────────────────────────────────┴──────────────────────────────────────┐ │
│  │                     Workflow DevKit Layer                               │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │ │
│  │  │ DurableAgent     │  │ Webhooks/Hooks   │  │ Event Sourcing     │   │ │
│  │  │ (GOAP Planning)  │  │ (Real-time)      │  │ (Postgres World)   │   │ │
│  │  └──────────────────┘  └──────────────────┘  └────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│  ┌─────────────────────────────────┴──────────────────────────────────────┐ │
│  │                        Data Layer                                       │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐   │ │
│  │  │   PostgreSQL    │  │    RuVector     │  │     Exochain         │   │ │
│  │  │ (Workflow State)│  │ (Vectors+Graph) │  │ (Audit DAG)          │   │ │
│  │  │                 │  │                 │  │                      │   │ │
│  │  │ • Event log     │  │ • HNSW index    │  │ • HLC ordering       │   │ │
│  │  │ • Workflow runs │  │ • Cypher queries│  │ • BFT checkpoints    │   │ │
│  │  │ • Step state    │  │ • Self-learning │  │ • Merkle proofs      │   │ │
│  │  │ • Hook state    │  │ • Trajectories  │  │ • Multi-DID          │   │ │
│  │  └─────────────────┘  └─────────────────┘  └──────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│  ┌─────────────────────────────────┴──────────────────────────────────────┐ │
│  │                     Syndication Layer                                   │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │ │
│  │  │ Peer Discovery   │  │ Event Broadcast  │  │ Checkpoint Sync    │   │ │
│  │  │ (Multi-env)      │  │ (Real-time)      │  │ (<2s finality)     │   │ │
│  │  └──────────────────┘  └──────────────────┘  └────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Vercel + Self-Hosted Compatibility

```typescript
// config/deployment.ts
import { PostgresWorld, VercelWorld, LocalWorld } from "workflow";
import { VectorIndex } from "ruvector";
import { DagStore } from "@exochain/core";

export function createDeploymentConfig() {
  const env = process.env.DEPLOYMENT_ENV || "local";

  switch (env) {
    case "vercel":
      return {
        workflow: {
          world: new VercelWorld(),
        },
        vector: {
          // Use RuVector cloud or Postgres extension
          backend: process.env.RUVECTOR_CLOUD_URL
            ? new VectorIndex({ cloudUrl: process.env.RUVECTOR_CLOUD_URL })
            : new VectorIndex({ postgresUrl: process.env.DATABASE_URL }),
        },
        audit: {
          // Exochain with Vercel KV or external
          store: new DagStore({ backend: "vercel-kv" }),
        },
      };

    case "postgres":
      return {
        workflow: {
          world: new PostgresWorld({
            connectionString: process.env.DATABASE_URL,
            schema: "workflow",
          }),
        },
        vector: {
          backend: new VectorIndex({
            postgresUrl: process.env.DATABASE_URL,
            schema: "ruvector",
          }),
        },
        audit: {
          store: new DagStore({
            backend: "postgres",
            connectionString: process.env.DATABASE_URL,
            schema: "exochain",
          }),
        },
      };

    default: // local development
      return {
        workflow: {
          world: new LocalWorld({ dataDir: ".workflow" }),
        },
        vector: {
          backend: new VectorIndex({ dataDir: ".ruvector" }),
        },
        audit: {
          store: new DagStore({ backend: "file", dataDir: ".exochain" }),
        },
      };
  }
}
```

---

## 5. MCP Tools Specification

### New MCP Tools

```typescript
// mcp-server/tools/workflow-vector.ts
export const workflowVectorTools = [
  {
    name: "kg_workflow_start",
    description: "Start a durable workflow for knowledge graph operations",
    inputSchema: {
      type: "object",
      properties: {
        workflowType: {
          type: "string",
          enum: ["realtime-collab", "gap-detection", "task-spec-gen", "sync"]
        },
        params: { type: "object" }
      },
      required: ["workflowType"]
    }
  },
  {
    name: "kg_workflow_status",
    description: "Get status of running workflow with event history",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: { type: "string" }
      },
      required: ["workflowId"]
    }
  },
  {
    name: "kg_vector_search",
    description: "Hybrid vector + graph search for knowledge retrieval",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        cypher: { type: "string" },
        limit: { type: "number", default: 10 }
      },
      required: ["query"]
    }
  },
  {
    name: "kg_audit_query",
    description: "Query deterministic audit log with Merkle proof",
    inputSchema: {
      type: "object",
      properties: {
        eventType: { type: "string" },
        since: { type: "string" }, // ISO timestamp
        includeProof: { type: "boolean", default: false }
      }
    }
  },
  {
    name: "kg_sync_checkpoint",
    description: "Create or query sync checkpoint for cross-environment syndication",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["create", "query", "sync"] },
        peerEndpoint: { type: "string" }
      },
      required: ["action"]
    }
  }
];
```

---

## 6. Implementation Phases

### Phase 1: Workflow DevKit Integration (1 week)

- [ ] Install `workflow` and `@workflow/ai` packages
- [ ] Configure Postgres World with existing database
- [ ] Create realtime-collab workflow
- [ ] Implement DurableAgent for GOAP planning
- [ ] Add webhook handlers for file events
- [ ] Integrate with existing file watcher

### Phase 2: RuVector Integration (1 week)

- [ ] Install `ruvector` packages
- [ ] Configure PostgreSQL extension OR standalone mode
- [ ] Migrate existing vector storage to RuVector
- [ ] Implement hybrid search (vector + Cypher)
- [ ] Add trajectory tracking for workflows
- [ ] Create self-learning hooks

### Phase 3: Exochain Integration (1 week)

- [ ] Install `@exochain/core` packages
- [ ] Define event schemas for KG operations
- [ ] Implement audit chain service
- [ ] Add event logging to workflows
- [ ] Create syndication service
- [ ] Implement checkpoint sync

### Phase 4: MCP & CLI (3-5 days)

- [ ] Register new MCP tools
- [ ] Implement tool handlers
- [ ] Add CLI commands for workflow management
- [ ] Add CLI commands for audit queries

### Phase 5: Testing & Documentation (3-5 days)

- [ ] Integration tests for all layers
- [ ] Performance benchmarks
- [ ] Documentation updates
- [ ] Migration guide from current SQLite

---

## 7. Dependencies

### NPM Packages

```json
{
  "dependencies": {
    "workflow": "^4.0.1-beta.3",
    "@workflow/ai": "^1.0.0",
    "@workflow/postgres": "^1.0.0",
    "ruvector": "^1.0.0",
    "@ruvector/core": "^1.0.0",
    "@ruvector/graph-node": "^1.0.0",
    "@ruvector/sona": "^1.0.0",
    "@exochain/core": "^0.1.0"
  }
}
```

### Environment Variables

```bash
# Workflow
WORKFLOW_WORLD=postgres  # or "vercel" or "local"
DATABASE_URL=postgres://user:pass@host:5432/db

# RuVector
RUVECTOR_MODE=postgres  # or "standalone" or "cloud"
RUVECTOR_CLOUD_URL=     # optional cloud endpoint

# Exochain
EXOCHAIN_AGENT_DID=did:exo:...
EXOCHAIN_PRIVATE_KEY=   # Ed25519 private key
EXOCHAIN_PEER_ENDPOINTS=https://peer1,https://peer2

# Vercel (if using Vercel World)
VERCEL_TOKEN=
VERCEL_PROJECT_ID=
```

---

## 8. Conclusion

This integration provides:

| Capability | Provider | Benefit |
|------------|----------|---------|
| **Durable workflows** | Workflow DevKit | Reliable, replayable execution |
| **Postgres persistence** | Postgres World | Production-ready state management |
| **Vercel deployment** | Vercel World | Seamless serverless deployment |
| **Vector search** | RuVector | 61us latency, self-learning |
| **Graph queries** | RuVector GraphDB | Cypher for relationship traversal |
| **Audit trails** | Exochain | Deterministic, verifiable logs |
| **Syndication** | Exochain BFT | <2s finality across environments |
| **Multi-agent** | Exochain DID | First-class agent identity |

The combination of these three tools provides a complete production stack for the knowledge-graph-agent's real-time collaboration system.

---

*Architecture design prepared by Claude Code Architecture Agent*
*Based on comprehensive research of Workflow DevKit, Exochain, and RuVector*
*Updated: December 29, 2025*
