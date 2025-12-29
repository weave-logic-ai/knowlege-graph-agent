# Real-Time Collaboration Integration - Migration Guide

**Version:** 3.0.0
**Date:** 2025-12-29
**Status:** Production Ready
**Author:** Claude Code Architecture Agent

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Migration Steps](#3-migration-steps)
4. [New MCP Tools](#4-new-mcp-tools)
5. [New CLI Commands](#5-new-cli-commands)
6. [Configuration Reference](#6-configuration-reference)
7. [Usage Examples](#7-usage-examples)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Overview

### 1.1 New Features Summary

The Real-Time Collaboration Integration introduces three major subsystems that transform the knowledge-graph-agent into a production-ready, distributed, and auditable system:

| Feature | Provider | Description |
|---------|----------|-------------|
| **Workflow DevKit** | useworkflow.dev | Anthropic's official durable workflow framework with Postgres World persistence |
| **RuVector** | ruvector | Self-learning vector database with HNSW indexing and graph query support |
| **Exochain** | exochain | Deterministic audit logging with DAG-BFT consensus and cross-environment syndication |

### 1.2 Workflow DevKit Integration

The Workflow DevKit (useworkflow.dev) provides enterprise-grade workflow orchestration:

- **Durable Execution**: Workflows survive crashes, restarts, and deployments
- **Event Sourcing**: Complete event history with replay capability
- **Postgres World**: PostgreSQL-backed persistence for production deployments
- **DurableAgent**: AI agent execution with automatic state persistence
- **Vercel Integration**: First-class support for serverless deployment
- **Typed Hooks**: External event integration with full TypeScript support

**Key Workflow Patterns:**
```typescript
// Durable workflow that survives restarts
export async function myWorkflow(input: WorkflowInput) {
  "use workflow";

  // Sleep durably - survives process restarts
  await sleep("5m");

  // Steps are atomic and retryable
  const result = await myStep(input);

  // Wait for external events
  const event = await myHook.wait();
}
```

### 1.3 RuVector Semantic Search

RuVector provides advanced vector search capabilities:

- **HNSW Indexing**: 61 microsecond p50 latency for similarity search
- **Cypher Queries**: Graph traversal for relationship-aware search
- **Self-Learning**: Automatic query optimization via trajectory tracking
- **PostgreSQL Extension**: Unified database with workflows
- **Hyperbolic Embeddings**: Better representation for hierarchical data

**Performance Characteristics:**
| Metric | Value |
|--------|-------|
| p50 Search Latency | 61us |
| p99 Search Latency | 150us |
| Index Build Time | ~1M vectors/hour |
| Memory Overhead | ~100 bytes/vector |

### 1.4 Exochain Audit Trail

Exochain provides deterministic, verifiable audit logging:

- **Hybrid Logical Clocks**: Perfect ordering across distributed systems
- **DAG Structure**: Concurrent operations without conflicts
- **BFT Checkpoints**: Finality under 2 seconds
- **BLAKE3 Hashing**: Fast, cryptographic event identifiers
- **Multi-DID Support**: Native multi-agent identity management
- **Merkle Proofs**: Lightweight verification without full sync

---

## 2. Prerequisites

### 2.1 PostgreSQL Setup

**Minimum Version:** PostgreSQL 14+

**Option A: Local Development (Docker)**

```bash
# Start PostgreSQL with vector extension support
docker run -d \
  --name kg-postgres \
  -e POSTGRES_USER=kg_user \
  -e POSTGRES_PASSWORD=kg_password \
  -e POSTGRES_DB=knowledge_graph \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Verify connection
psql postgresql://kg_user:kg_password@localhost:5432/knowledge_graph -c "SELECT 1"
```

**Option B: Production (Managed PostgreSQL)**

Supported providers:
- **Neon** (recommended for Vercel deployments)
- **Supabase**
- **AWS RDS**
- **Google Cloud SQL**
- **Azure Database for PostgreSQL**

**Required Extensions:**

```sql
-- Connect to your database and enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";  -- If using pgvector mode
```

### 2.2 Environment Variables

Create or update your `.env` file with the following variables:

```bash
# ============================================
# Database Configuration
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/knowledge_graph

# ============================================
# Workflow DevKit Configuration
# ============================================
# World type: "postgres", "vercel", or "local"
WORKFLOW_WORLD=postgres

# Postgres World specific settings
WORKFLOW_SCHEMA=workflow
WORKFLOW_POOL_MAX=20
WORKFLOW_POOL_IDLE_TIMEOUT=30000

# Vercel World (if deploying to Vercel)
VERCEL_TOKEN=your_vercel_token
VERCEL_PROJECT_ID=your_project_id

# ============================================
# RuVector Configuration
# ============================================
# Mode: "postgres", "standalone", or "cloud"
RUVECTOR_MODE=postgres

# Standalone mode data directory
RUVECTOR_DATA_DIR=.ruvector

# Cloud mode endpoint (optional)
RUVECTOR_CLOUD_URL=https://api.ruvector.io
RUVECTOR_API_KEY=your_api_key

# Vector dimensions (default: 384 for all-MiniLM-L6-v2)
RUVECTOR_DIMENSIONS=384

# HNSW parameters
RUVECTOR_HNSW_M=16
RUVECTOR_HNSW_EF_CONSTRUCTION=200
RUVECTOR_HNSW_EF_SEARCH=100

# ============================================
# Exochain Audit Configuration
# ============================================
# Agent identity (generate with kg audit generate-identity)
EXOCHAIN_AGENT_DID=did:exo:your_agent_did
EXOCHAIN_PRIVATE_KEY=your_ed25519_private_key_hex

# Storage backend: "postgres", "file", or "vercel-kv"
EXOCHAIN_BACKEND=postgres
EXOCHAIN_SCHEMA=exochain

# Peer endpoints for syndication (comma-separated)
EXOCHAIN_PEER_ENDPOINTS=https://peer1.example.com,https://peer2.example.com

# BFT checkpoint interval (milliseconds)
EXOCHAIN_CHECKPOINT_INTERVAL=5000

# ============================================
# General Settings
# ============================================
# Deployment environment
NODE_ENV=development
DEPLOYMENT_ENV=local

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### 2.3 NPM Dependencies

Install the required packages:

```bash
# Core workflow dependencies
npm install workflow@^4.0.1-beta.3
npm install @workflow/ai@^1.0.0
npm install @workflow/postgres@^1.0.0

# RuVector dependencies
npm install ruvector@^1.0.0
npm install @ruvector/core@^1.0.0
npm install @ruvector/graph-node@^1.0.0
npm install @ruvector/sona@^1.0.0

# Exochain dependencies
npm install @exochain/core@^0.1.0

# Optional: Vercel integration
npm install @workflow/vercel@^1.0.0
```

**package.json additions:**

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

### 2.4 System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 20.0.0 | 22.x LTS |
| PostgreSQL | 14 | 16+ |
| Memory | 2GB | 8GB+ |
| Storage | 10GB | 50GB+ (for vectors) |
| CPU | 2 cores | 4+ cores |

---

## 3. Migration Steps

### 3.1 Database Schema Migration

**Step 1: Create the base schemas**

```sql
-- Run this migration script against your PostgreSQL database
-- File: migrations/001_realtime_collab.sql

-- Create schemas
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS ruvector;
CREATE SCHEMA IF NOT EXISTS exochain;

-- Grant permissions
GRANT ALL ON SCHEMA workflow TO kg_user;
GRANT ALL ON SCHEMA ruvector TO kg_user;
GRANT ALL ON SCHEMA exochain TO kg_user;
```

**Step 2: Workflow DevKit tables**

```sql
-- File: migrations/002_workflow_tables.sql

-- Workflow runs table
CREATE TABLE workflow.runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name TEXT NOT NULL,
  workflow_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input JSONB,
  output JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Workflow events table (event sourcing)
CREATE TABLE workflow.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES workflow.runs(id) ON DELETE CASCADE,
  sequence_number BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(run_id, sequence_number)
);

-- Workflow hooks table (external events)
CREATE TABLE workflow.hooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES workflow.runs(id) ON DELETE CASCADE,
  hook_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_runs_status ON workflow.runs(status);
CREATE INDEX idx_workflow_runs_name ON workflow.runs(workflow_name);
CREATE INDEX idx_workflow_events_run_id ON workflow.events(run_id);
CREATE INDEX idx_workflow_hooks_run_id ON workflow.hooks(run_id);
```

**Step 3: RuVector tables**

```sql
-- File: migrations/003_ruvector_tables.sql

-- Vector embeddings table
CREATE TABLE ruvector.embeddings (
  id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL,
  embedding vector(384),  -- Adjust dimension as needed
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW index for fast similarity search
CREATE INDEX embeddings_hnsw_idx ON ruvector.embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Graph edges table (for Cypher-like queries)
CREATE TABLE ruvector.edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id TEXT NOT NULL REFERENCES ruvector.embeddings(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES ruvector.embeddings(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  weight FLOAT DEFAULT 1.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, target_id, relation_type)
);

-- Trajectory tracking table (self-learning)
CREATE TABLE ruvector.trajectories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trajectory_id TEXT NOT NULL,
  step_number INT NOT NULL,
  action TEXT NOT NULL,
  state JSONB,
  outcome TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_embeddings_type ON ruvector.embeddings(node_type);
CREATE INDEX idx_edges_source ON ruvector.edges(source_id);
CREATE INDEX idx_edges_target ON ruvector.edges(target_id);
CREATE INDEX idx_edges_relation ON ruvector.edges(relation_type);
CREATE INDEX idx_trajectories_id ON ruvector.trajectories(trajectory_id);
```

**Step 4: Exochain tables**

```sql
-- File: migrations/004_exochain_tables.sql

-- Events DAG table
CREATE TABLE exochain.events (
  id TEXT PRIMARY KEY,  -- BLAKE3 hash
  parent_ids TEXT[] NOT NULL DEFAULT '{}',
  hlc_time BIGINT NOT NULL,
  hlc_counter INT NOT NULL,
  author_did TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BFT checkpoints table
CREATE TABLE exochain.checkpoints (
  height BIGINT PRIMARY KEY,
  event_root TEXT NOT NULL,
  event_count BIGINT NOT NULL,
  signatures JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent identities table
CREATE TABLE exochain.agents (
  did TEXT PRIMARY KEY,
  public_key TEXT NOT NULL,
  display_name TEXT,
  capabilities TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peer connections table
CREATE TABLE exochain.peers (
  endpoint TEXT PRIMARY KEY,
  peer_did TEXT,
  status TEXT NOT NULL DEFAULT 'unknown',
  last_sync_height BIGINT DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_type ON exochain.events(event_type);
CREATE INDEX idx_events_author ON exochain.events(author_did);
CREATE INDEX idx_events_hlc ON exochain.events(hlc_time, hlc_counter);
CREATE INDEX idx_checkpoints_root ON exochain.checkpoints(event_root);
```

**Step 5: Run migrations**

Using the knowledge-graph-agent CLI:

```bash
# Run all migrations
kg migrate up

# Or run specific migration
kg migrate up --to 004_exochain_tables

# Check migration status
kg migrate status

# Rollback if needed
kg migrate down --to 002_workflow_tables
```

Or using a SQL client:

```bash
# Using psql
psql $DATABASE_URL -f migrations/001_realtime_collab.sql
psql $DATABASE_URL -f migrations/002_workflow_tables.sql
psql $DATABASE_URL -f migrations/003_ruvector_tables.sql
psql $DATABASE_URL -f migrations/004_exochain_tables.sql
```

### 3.2 Configuration Updates

**Step 1: Update .kg/config.json**

```json
{
  "version": "2.0.0",
  "projectRoot": ".",
  "docsPath": "docs",

  "database": {
    "type": "sqlite",
    "path": ".kg/knowledge.db",
    "autoBackup": true,
    "backupInterval": 86400000,
    "maxBackups": 5
  },

  "workflow": {
    "enabled": true,
    "world": "postgres",
    "postgres": {
      "connectionString": "${DATABASE_URL}",
      "schema": "workflow",
      "pool": {
        "max": 20,
        "idleTimeoutMillis": 30000
      }
    },
    "durableAgents": {
      "defaultModel": "claude-sonnet-4-20250514",
      "maxConcurrent": 5,
      "timeout": 300000
    },
    "hooks": {
      "fileChange": true,
      "gapDetection": true,
      "taskSpecGeneration": true
    }
  },

  "vector": {
    "enabled": true,
    "mode": "postgres",
    "postgres": {
      "connectionString": "${DATABASE_URL}",
      "schema": "ruvector"
    },
    "dimensions": 384,
    "distanceMetric": "cosine",
    "hnsw": {
      "m": 16,
      "efConstruction": 200,
      "efSearch": 100
    },
    "selfLearning": {
      "enabled": true,
      "trajectoryTracking": true,
      "microLoraEnabled": false
    }
  },

  "audit": {
    "enabled": true,
    "backend": "postgres",
    "postgres": {
      "connectionString": "${DATABASE_URL}",
      "schema": "exochain"
    },
    "agent": {
      "did": "${EXOCHAIN_AGENT_DID}",
      "privateKey": "${EXOCHAIN_PRIVATE_KEY}"
    },
    "checkpoints": {
      "interval": 5000,
      "bftThreshold": 0.67
    },
    "syndication": {
      "enabled": true,
      "peers": []
    }
  },

  "cache": {
    "enabled": true,
    "maxSize": 1000,
    "ttl": 3600000,
    "evictionPolicy": "lru"
  },

  "agents": {
    "maxConcurrent": 5,
    "defaultTimeout": 30000,
    "retryAttempts": 3,
    "claudeFlowEnabled": true
  },

  "services": {
    "watcherEnabled": true,
    "schedulerEnabled": true,
    "syncEnabled": true,
    "healthCheckInterval": 60000
  },

  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

**Step 2: Update TypeScript configuration**

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 3.3 Code Changes Required

**Step 1: Initialize the integration services**

Create `src/realtime/index.ts`:

```typescript
import { PostgresWorld } from "@workflow/postgres";
import { VectorIndex } from "ruvector";
import { DagStore, HybridLogicalClock } from "@exochain/core";
import { createConfigManager } from "../config/manager";

export interface RealtimeCollabConfig {
  workflow: {
    world: PostgresWorld;
  };
  vector: {
    index: VectorIndex;
  };
  audit: {
    store: DagStore;
    clock: HybridLogicalClock;
  };
}

export async function initializeRealtimeCollab(): Promise<RealtimeCollabConfig> {
  const config = createConfigManager(process.cwd());
  const cfg = config.getAll();

  // Initialize Workflow World
  const workflowWorld = new PostgresWorld({
    connectionString: cfg.workflow.postgres.connectionString,
    schema: cfg.workflow.postgres.schema,
    poolConfig: cfg.workflow.postgres.pool,
  });

  // Initialize Vector Index
  const vectorIndex = new VectorIndex({
    postgresUrl: cfg.vector.postgres.connectionString,
    schema: cfg.vector.postgres.schema,
    dimensions: cfg.vector.dimensions,
    distanceMetric: cfg.vector.distanceMetric,
    hnswConfig: cfg.vector.hnsw,
  });

  // Initialize Audit Store
  const auditStore = new DagStore({
    backend: "postgres",
    connectionString: cfg.audit.postgres.connectionString,
    schema: cfg.audit.postgres.schema,
  });

  const auditClock = new HybridLogicalClock();

  return {
    workflow: { world: workflowWorld },
    vector: { index: vectorIndex },
    audit: { store: auditStore, clock: auditClock },
  };
}
```

**Step 2: Create workflow definitions**

Create `src/realtime/workflows/collab-workflow.ts`:

```typescript
import { sleep, createHook, defineHook } from "workflow";
import { DurableAgent } from "@workflow/ai";

// Define typed hooks for external events
export const nodeUpdateHook = defineHook<{
  nodeId: string;
  userId: string;
  changes: Record<string, unknown>;
  timestamp: number;
}>();

export const gapDetectedHook = defineHook<{
  docPath: string;
  gaps: string[];
  confidence: number;
}>();

// Step: Analyze document for gaps
async function analyzeDocumentGaps(docPath: string) {
  "use step";
  // Implementation uses existing CultivationSystem
  const { CultivationSystem } = await import("../../cultivation");
  const cultivation = new CultivationSystem();
  const gaps = await cultivation.analyzeGaps(docPath);
  return { gaps, completeness: 1 - (gaps.length / 10) };
}

// Step: Generate task spec from documentation
async function generateTaskSpec(docPath: string, context: string) {
  "use step";
  const agent = new DurableAgent({
    model: "claude-sonnet-4-20250514",
    systemPrompt: `You are a task specification generator for the knowledge-graph-agent.
    Generate detailed, actionable task specifications from documentation.`,
  });

  return await agent.run(`Generate task spec for: ${docPath}\nContext: ${context}`);
}

// Main collaboration workflow
export async function realtimeCollaborationWorkflow(graphId: string) {
  "use workflow";

  const updateHook = await createHook(nodeUpdateHook);
  const gapHook = await createHook(gapDetectedHook);

  const goapAgent = new DurableAgent({
    model: "claude-sonnet-4-20250514",
    tools: [analyzeDocumentGaps, generateTaskSpec],
    systemPrompt: `You are a GOAP planning agent. Analyze documentation
    completeness and generate task specifications when ready.`,
  });

  let lastChangeTime = Date.now();
  const INACTIVITY_TIMEOUT = "5m";

  while (true) {
    const result = await Promise.race([
      updateHook.wait().then((data) => ({ type: "update" as const, data })),
      sleep(INACTIVITY_TIMEOUT).then(() => ({ type: "timeout" as const, data: null })),
    ]);

    if (result.type === "update" && result.data) {
      lastChangeTime = Date.now();
      const analysis = await analyzeDocumentGaps(result.data.nodeId);

      if (analysis.completeness >= 0.7) {
        await generateTaskSpec(result.data.nodeId, JSON.stringify(analysis));
      }
    } else {
      // Inactivity timeout - generate missing documentation
      await goapAgent.run("Identify and generate documentation for gaps");
    }
  }
}
```

**Step 3: Create vector service wrapper**

Create `src/realtime/services/vector-service.ts`:

```typescript
import { VectorIndex, GraphDB, SonaEngine } from "ruvector";

export interface HybridSearchQuery {
  embedding: number[];
  cypher?: string;
  filters?: Record<string, unknown>;
  limit?: number;
}

export interface HybridSearchResult {
  id: string;
  score: number;
  nodeType: string;
  content: string;
  metadata: Record<string, unknown>;
}

export class EnhancedVectorService {
  private vectorIndex: VectorIndex;
  private graphDb: GraphDB;
  private sonaEngine: SonaEngine;

  constructor(config: {
    postgresUrl: string;
    schema: string;
    dimensions: number;
    hnswConfig: { m: number; efConstruction: number; efSearch: number };
  }) {
    this.vectorIndex = new VectorIndex({
      dimensions: config.dimensions,
      distanceMetric: "Cosine",
      indexType: "HNSW",
      hnswConfig: config.hnswConfig,
    });

    this.graphDb = new GraphDB({
      connectionString: config.postgresUrl,
      schema: config.schema,
    });

    this.sonaEngine = new SonaEngine({
      microLoraEnabled: false,
      trajectoryTracking: true,
    });
  }

  async hybridSearch(query: HybridSearchQuery): Promise<HybridSearchResult[]> {
    const trajectory = this.sonaEngine.startTrajectory("hybrid-search");

    try {
      const vectorResults = await this.vectorIndex.search({
        vector: query.embedding,
        k: query.limit || 10,
        filter: query.filters,
      });

      let graphResults: unknown[] = [];
      if (query.cypher) {
        graphResults = await this.graphDb.query(query.cypher, {
          candidateIds: vectorResults.map((r) => r.id),
        });
      }

      const merged = this.mergeResults(vectorResults, graphResults);
      await trajectory.finalize({ success: true, resultCount: merged.length });

      return merged;
    } catch (error) {
      await trajectory.finalize({ success: false, error: String(error) });
      throw error;
    }
  }

  async upsertNode(node: {
    id: string;
    type: string;
    content: string;
    embedding: number[];
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await this.vectorIndex.upsert({
      id: node.id,
      vector: node.embedding,
      metadata: { type: node.type, ...node.metadata },
    });

    await this.graphDb.query(
      `
      MERGE (n:Node {id: $id})
      SET n.type = $type, n.content = $content, n.metadata = $metadata
    `,
      node
    );
  }

  async recordTrajectory(
    workflowId: string,
    steps: Array<{
      action: string;
      stateSnapshot: Record<string, unknown>;
      outcome: string;
      durationMs: number;
    }>
  ): Promise<void> {
    const trajectory = this.sonaEngine.createTrajectory(workflowId);

    for (const step of steps) {
      await trajectory.addStep({
        action: step.action,
        state: step.stateSnapshot,
        outcome: step.outcome,
        duration: step.durationMs,
      });
    }

    await trajectory.finalize({
      success: steps.every((s) => s.outcome === "success"),
      totalDuration: steps.reduce((sum, s) => sum + s.durationMs, 0),
    });
  }

  private mergeResults(
    vectorResults: unknown[],
    graphResults: unknown[]
  ): HybridSearchResult[] {
    // Merge and re-rank results based on vector similarity and graph relationships
    const resultMap = new Map<string, HybridSearchResult>();

    for (const vr of vectorResults as Array<{ id: string; score: number; metadata: Record<string, unknown> }>) {
      resultMap.set(vr.id, {
        id: vr.id,
        score: vr.score,
        nodeType: vr.metadata.type as string,
        content: vr.metadata.content as string || "",
        metadata: vr.metadata,
      });
    }

    // Boost scores for graph-connected results
    for (const gr of graphResults as Array<{ id: string; graphScore: number }>) {
      const existing = resultMap.get(gr.id);
      if (existing) {
        existing.score = existing.score * 0.7 + gr.graphScore * 0.3;
      }
    }

    return Array.from(resultMap.values()).sort((a, b) => b.score - a.score);
  }
}
```

**Step 4: Create audit service wrapper**

Create `src/realtime/services/audit-service.ts`:

```typescript
import { DagStore, HybridLogicalClock, sign, verify, blake3, canonicalCbor } from "@exochain/core";

export type KnowledgeGraphEventType =
  | "NodeCreated"
  | "NodeUpdated"
  | "EdgeCreated"
  | "QueryExecuted"
  | "WorkflowStarted"
  | "WorkflowCompleted"
  | "GapDetected"
  | "TaskSpecGenerated"
  | "ConflictDetected"
  | "ConflictResolved"
  | "SyncCheckpoint";

export interface KnowledgeGraphEvent {
  id: string;
  envelope: {
    parents: string[];
    hlc: { time: number; counter: number };
    author: string;
    payload: {
      type: KnowledgeGraphEventType;
      data: Record<string, unknown>;
    };
  };
  signature: Uint8Array;
}

export class KnowledgeGraphAuditService {
  private dagStore: DagStore;
  private clock: HybridLogicalClock;
  private agentDid: string;
  private privateKey: Uint8Array;

  constructor(config: {
    dagStore: DagStore;
    agentDid: string;
    privateKey: string;
  }) {
    this.dagStore = config.dagStore;
    this.clock = new HybridLogicalClock();
    this.agentDid = config.agentDid;
    this.privateKey = Buffer.from(config.privateKey, "hex");
  }

  async logEvent(
    type: KnowledgeGraphEventType,
    data: Record<string, unknown>
  ): Promise<string> {
    const parents = await this.dagStore.getTips();
    const hlc = this.clock.tick();

    const envelope = {
      parents,
      hlc,
      author: this.agentDid,
      payload: { type, data },
    };

    const id = blake3(canonicalCbor(envelope));
    const signature = await sign(Buffer.from(id, "hex"), this.privateKey);

    const event: KnowledgeGraphEvent = { id, envelope, signature };
    await this.dagStore.insert(event);

    return id;
  }

  async logNodeCreated(
    nodeId: string,
    nodeType: string,
    data: Record<string, unknown>
  ): Promise<string> {
    return this.logEvent("NodeCreated", { nodeId, nodeType, data });
  }

  async logNodeUpdated(
    nodeId: string,
    changes: Record<string, unknown>
  ): Promise<string> {
    return this.logEvent("NodeUpdated", { nodeId, changes });
  }

  async logWorkflowStarted(workflowId: string, trigger: string): Promise<string> {
    return this.logEvent("WorkflowStarted", { workflowId, trigger });
  }

  async logWorkflowCompleted(
    workflowId: string,
    outcome: "success" | "failure"
  ): Promise<string> {
    return this.logEvent("WorkflowCompleted", { workflowId, outcome });
  }

  async queryEvents(
    type?: KnowledgeGraphEventType,
    since?: { time: number; counter: number },
    includeProof = false
  ): Promise<KnowledgeGraphEvent[]> {
    return this.dagStore.query({
      filter: type ? (e: KnowledgeGraphEvent) => e.envelope.payload.type === type : undefined,
      since,
      includeProof,
    });
  }

  async createCheckpoint(): Promise<{ height: number; eventRoot: string }> {
    return this.dagStore.createCheckpoint();
  }

  async getLatestCheckpoint(): Promise<{ height: number; eventRoot: string }> {
    return this.dagStore.getLatestCheckpoint();
  }

  async syncWithPeer(peerEndpoint: string): Promise<{
    eventsReceived: number;
    newHeight: number;
  }> {
    const localCheckpoint = await this.getLatestCheckpoint();

    const peerResponse = await fetch(`${peerEndpoint}/checkpoint`);
    const peerCheckpoint = await peerResponse.json();

    if (peerCheckpoint.height > localCheckpoint.height) {
      const eventsResponse = await fetch(
        `${peerEndpoint}/events?since=${localCheckpoint.eventRoot}`
      );
      const missingEvents = await eventsResponse.json();

      let eventsReceived = 0;
      for (const event of missingEvents) {
        if (await verify(event) && await this.validateCausality(event)) {
          await this.dagStore.insert(event);
          eventsReceived++;
        }
      }

      return { eventsReceived, newHeight: this.dagStore.height };
    }

    return { eventsReceived: 0, newHeight: localCheckpoint.height };
  }

  private async validateCausality(event: KnowledgeGraphEvent): Promise<boolean> {
    for (const parentId of event.envelope.parents) {
      const parent = await this.dagStore.get(parentId);
      if (!parent) {
        return false;
      }
    }
    return true;
  }
}
```

---

## 4. New MCP Tools

### 4.1 Workflow Tools

| Tool | Description | Input Schema |
|------|-------------|--------------|
| `kg_workflow_start` | Start a durable workflow | `{ workflowType, params? }` |
| `kg_workflow_status` | Get workflow status and event history | `{ workflowId }` |
| `kg_workflow_list` | List all workflows with filtering | `{ status?, limit? }` |

**kg_workflow_start**

```typescript
{
  name: "kg_workflow_start",
  description: "Start a durable workflow for knowledge graph operations",
  inputSchema: {
    type: "object",
    properties: {
      workflowType: {
        type: "string",
        enum: ["realtime-collab", "gap-detection", "task-spec-gen", "sync"],
        description: "Type of workflow to start"
      },
      params: {
        type: "object",
        description: "Workflow-specific parameters"
      }
    },
    required: ["workflowType"]
  }
}
```

**kg_workflow_status**

```typescript
{
  name: "kg_workflow_status",
  description: "Get status of running workflow with event history",
  inputSchema: {
    type: "object",
    properties: {
      workflowId: {
        type: "string",
        description: "UUID of the workflow run"
      }
    },
    required: ["workflowId"]
  }
}
```

**kg_workflow_list**

```typescript
{
  name: "kg_workflow_list",
  description: "List workflows with optional filtering",
  inputSchema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["pending", "running", "completed", "failed"],
        description: "Filter by workflow status"
      },
      limit: {
        type: "number",
        default: 20,
        description: "Maximum number of workflows to return"
      },
      offset: {
        type: "number",
        default: 0,
        description: "Offset for pagination"
      }
    }
  }
}
```

### 4.2 Vector Tools

| Tool | Description | Input Schema |
|------|-------------|--------------|
| `kg_vector_search` | Hybrid vector + graph search | `{ query, cypher?, limit? }` |
| `kg_vector_upsert` | Insert or update vector embedding | `{ id, content, type, metadata? }` |
| `kg_trajectory_list` | List learning trajectories | `{ workflowId?, limit? }` |

**kg_vector_search**

```typescript
{
  name: "kg_vector_search",
  description: "Hybrid vector similarity + graph relationship search",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Natural language query to embed and search"
      },
      cypher: {
        type: "string",
        description: "Optional Cypher query for graph filtering"
      },
      filters: {
        type: "object",
        description: "Metadata filters for vector search"
      },
      limit: {
        type: "number",
        default: 10,
        description: "Maximum results to return"
      }
    },
    required: ["query"]
  }
}
```

**kg_vector_upsert**

```typescript
{
  name: "kg_vector_upsert",
  description: "Insert or update a vector embedding in the index",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the vector"
      },
      content: {
        type: "string",
        description: "Text content to embed"
      },
      type: {
        type: "string",
        description: "Node type (e.g., 'document', 'concept', 'goal')"
      },
      metadata: {
        type: "object",
        description: "Additional metadata to store"
      }
    },
    required: ["id", "content", "type"]
  }
}
```

**kg_trajectory_list**

```typescript
{
  name: "kg_trajectory_list",
  description: "List self-learning trajectories for analysis",
  inputSchema: {
    type: "object",
    properties: {
      workflowId: {
        type: "string",
        description: "Filter by workflow ID"
      },
      success: {
        type: "boolean",
        description: "Filter by success status"
      },
      limit: {
        type: "number",
        default: 20,
        description: "Maximum trajectories to return"
      }
    }
  }
}
```

### 4.3 Audit Tools

| Tool | Description | Input Schema |
|------|-------------|--------------|
| `kg_audit_query` | Query audit log with filters | `{ eventType?, since?, includeProof? }` |
| `kg_audit_checkpoint` | Create or query BFT checkpoint | `{ action }` |
| `kg_sync_status` | Get peer synchronization status | `{ peerEndpoint? }` |

**kg_audit_query**

```typescript
{
  name: "kg_audit_query",
  description: "Query deterministic audit log with optional Merkle proof",
  inputSchema: {
    type: "object",
    properties: {
      eventType: {
        type: "string",
        enum: [
          "NodeCreated", "NodeUpdated", "EdgeCreated",
          "QueryExecuted", "WorkflowStarted", "WorkflowCompleted",
          "GapDetected", "TaskSpecGenerated",
          "ConflictDetected", "ConflictResolved", "SyncCheckpoint"
        ],
        description: "Filter by event type"
      },
      since: {
        type: "string",
        description: "ISO timestamp to filter events after"
      },
      includeProof: {
        type: "boolean",
        default: false,
        description: "Include Merkle proof for verification"
      },
      limit: {
        type: "number",
        default: 50,
        description: "Maximum events to return"
      }
    }
  }
}
```

**kg_audit_checkpoint**

```typescript
{
  name: "kg_audit_checkpoint",
  description: "Create or query BFT checkpoint for syndication",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "query", "latest"],
        description: "Checkpoint action to perform"
      },
      height: {
        type: "number",
        description: "Specific checkpoint height to query"
      }
    },
    required: ["action"]
  }
}
```

**kg_sync_status**

```typescript
{
  name: "kg_sync_status",
  description: "Get synchronization status with peers",
  inputSchema: {
    type: "object",
    properties: {
      peerEndpoint: {
        type: "string",
        description: "Specific peer to check (optional, checks all if omitted)"
      },
      triggerSync: {
        type: "boolean",
        default: false,
        description: "Trigger synchronization if behind"
      }
    }
  }
}
```

---

## 5. New CLI Commands

### 5.1 Workflow Commands

```bash
# Start a workflow
kg workflow start <type> [--params <json>]
kg workflow start realtime-collab
kg workflow start gap-detection --params '{"docPath": "docs/"}'
kg workflow start task-spec-gen --params '{"specId": "feature-123"}'

# Get workflow status
kg workflow status <workflow-id>
kg workflow status abc123-def456

# List workflows
kg workflow list [--status <status>] [--limit <n>]
kg workflow list --status running
kg workflow list --status completed --limit 50

# Cancel a workflow
kg workflow cancel <workflow-id>
kg workflow cancel abc123-def456

# View workflow events (event sourcing)
kg workflow events <workflow-id> [--since <timestamp>]
kg workflow events abc123-def456 --since "2025-01-01T00:00:00Z"

# Trigger a webhook/hook
kg workflow trigger <hook-name> <workflow-id> [--payload <json>]
kg workflow trigger nodeUpdateHook abc123-def456 --payload '{"nodeId": "n1"}'
```

### 5.2 Vector Commands

```bash
# Search vectors
kg vector search <query> [--cypher <query>] [--limit <n>] [--json]
kg vector search "authentication patterns"
kg vector search "user authentication" --cypher "MATCH (n)-[:RELATES_TO]->(m) RETURN m"
kg vector search "api design" --limit 20 --json

# Upsert a vector
kg vector upsert <id> --content <text> --type <type> [--metadata <json>]
kg vector upsert doc-001 --content "User authentication flow" --type document
kg vector upsert concept-auth --content "OAuth2 implementation" --type concept --metadata '{"tags": ["auth"]}'

# Delete a vector
kg vector delete <id>
kg vector delete doc-001

# List vectors by type
kg vector list [--type <type>] [--limit <n>]
kg vector list --type document
kg vector list --type concept --limit 100

# View trajectories (self-learning)
kg vector trajectories [--workflow <id>] [--success]
kg vector trajectories --workflow abc123
kg vector trajectories --success false

# Rebuild HNSW index
kg vector reindex [--force]
kg vector reindex --force

# Export vectors
kg vector export [--format <format>] [--output <file>]
kg vector export --format jsonl --output vectors.jsonl
```

### 5.3 Audit Commands

```bash
# Query audit log
kg audit query [--type <event-type>] [--since <timestamp>] [--limit <n>]
kg audit query
kg audit query --type NodeCreated --since "2025-01-01T00:00:00Z"
kg audit query --type WorkflowCompleted --limit 100

# Create checkpoint
kg audit checkpoint create
kg audit checkpoint query <height>
kg audit checkpoint latest

# View agent identity
kg audit identity
kg audit identity --show-public-key

# Generate new identity
kg audit generate-identity [--output <file>]
kg audit generate-identity --output agent-keys.json

# Sync with peers
kg audit sync [--peer <endpoint>] [--all]
kg audit sync --peer https://peer1.example.com
kg audit sync --all

# View sync status
kg audit status [--peer <endpoint>]
kg audit status
kg audit status --peer https://peer1.example.com

# Register peer
kg audit peer add <endpoint> [--name <name>]
kg audit peer add https://peer1.example.com --name "Production Peer 1"

# List peers
kg audit peer list

# Remove peer
kg audit peer remove <endpoint>

# Verify event
kg audit verify <event-id> [--full-chain]
kg audit verify evt-abc123 --full-chain

# Export audit log
kg audit export [--since <timestamp>] [--format <format>] [--output <file>]
kg audit export --since "2025-01-01" --format jsonl --output audit.jsonl
```

---

## 6. Configuration Reference

### 6.1 Workflow Configuration Options

```typescript
interface WorkflowConfig {
  // Enable/disable workflow system
  enabled: boolean;

  // World type: "postgres", "vercel", or "local"
  world: "postgres" | "vercel" | "local";

  // PostgreSQL World configuration
  postgres: {
    // Connection string (supports env var substitution)
    connectionString: string;

    // Schema name for workflow tables
    schema: string;

    // Connection pool settings
    pool: {
      // Maximum connections
      max: number;

      // Idle timeout in milliseconds
      idleTimeoutMillis: number;

      // Connection timeout in milliseconds
      connectionTimeoutMillis?: number;
    };
  };

  // Vercel World configuration (for Vercel deployments)
  vercel?: {
    // Vercel KV store URL
    kvUrl?: string;
  };

  // Local World configuration (for development)
  local?: {
    // Data directory for local storage
    dataDir: string;
  };

  // DurableAgent configuration
  durableAgents: {
    // Default model for agents
    defaultModel: string;

    // Maximum concurrent agents
    maxConcurrent: number;

    // Agent execution timeout in milliseconds
    timeout: number;

    // Retry configuration
    retry?: {
      maxAttempts: number;
      backoffMs: number;
      maxBackoffMs: number;
    };
  };

  // Hook configuration
  hooks: {
    // Enable file change hooks
    fileChange: boolean;

    // Enable gap detection hooks
    gapDetection: boolean;

    // Enable task spec generation hooks
    taskSpecGeneration: boolean;

    // Custom hooks
    custom?: Array<{
      name: string;
      enabled: boolean;
    }>;
  };
}
```

**Default Values:**

```json
{
  "enabled": true,
  "world": "postgres",
  "postgres": {
    "connectionString": "${DATABASE_URL}",
    "schema": "workflow",
    "pool": {
      "max": 20,
      "idleTimeoutMillis": 30000,
      "connectionTimeoutMillis": 5000
    }
  },
  "durableAgents": {
    "defaultModel": "claude-sonnet-4-20250514",
    "maxConcurrent": 5,
    "timeout": 300000,
    "retry": {
      "maxAttempts": 3,
      "backoffMs": 1000,
      "maxBackoffMs": 30000
    }
  },
  "hooks": {
    "fileChange": true,
    "gapDetection": true,
    "taskSpecGeneration": true
  }
}
```

### 6.2 Vector Configuration Options

```typescript
interface VectorConfig {
  // Enable/disable vector system
  enabled: boolean;

  // Mode: "postgres", "standalone", or "cloud"
  mode: "postgres" | "standalone" | "cloud";

  // PostgreSQL mode configuration
  postgres: {
    connectionString: string;
    schema: string;
  };

  // Standalone mode configuration
  standalone?: {
    dataDir: string;
  };

  // Cloud mode configuration
  cloud?: {
    url: string;
    apiKey: string;
  };

  // Vector dimensions (must match embedding model)
  dimensions: number;

  // Distance metric for similarity
  distanceMetric: "cosine" | "euclidean" | "dot";

  // HNSW index parameters
  hnsw: {
    // Number of bi-directional links per node
    m: number;

    // Size of dynamic candidate list during construction
    efConstruction: number;

    // Size of dynamic candidate list during search
    efSearch: number;
  };

  // Self-learning configuration
  selfLearning: {
    // Enable self-learning
    enabled: boolean;

    // Track query trajectories
    trajectoryTracking: boolean;

    // Enable micro-LoRA adaptation (experimental)
    microLoraEnabled: boolean;

    // Learning rate for adaptations
    learningRate?: number;
  };

  // Embedding configuration
  embedding?: {
    // Model to use for embeddings
    model: string;

    // Batch size for embedding
    batchSize: number;

    // Cache embeddings
    cache: boolean;
  };
}
```

**Default Values:**

```json
{
  "enabled": true,
  "mode": "postgres",
  "postgres": {
    "connectionString": "${DATABASE_URL}",
    "schema": "ruvector"
  },
  "dimensions": 384,
  "distanceMetric": "cosine",
  "hnsw": {
    "m": 16,
    "efConstruction": 200,
    "efSearch": 100
  },
  "selfLearning": {
    "enabled": true,
    "trajectoryTracking": true,
    "microLoraEnabled": false
  },
  "embedding": {
    "model": "all-MiniLM-L6-v2",
    "batchSize": 32,
    "cache": true
  }
}
```

### 6.3 Audit Configuration Options

```typescript
interface AuditConfig {
  // Enable/disable audit system
  enabled: boolean;

  // Storage backend: "postgres", "file", or "vercel-kv"
  backend: "postgres" | "file" | "vercel-kv";

  // PostgreSQL backend configuration
  postgres: {
    connectionString: string;
    schema: string;
  };

  // File backend configuration
  file?: {
    dataDir: string;
  };

  // Agent identity configuration
  agent: {
    // Decentralized identifier
    did: string;

    // Ed25519 private key (hex encoded)
    privateKey: string;

    // Agent display name
    displayName?: string;

    // Agent capabilities
    capabilities?: string[];
  };

  // Checkpoint configuration
  checkpoints: {
    // Interval between checkpoints in milliseconds
    interval: number;

    // BFT threshold (0.0-1.0)
    bftThreshold: number;

    // Auto-create checkpoints
    autoCreate: boolean;
  };

  // Syndication configuration
  syndication: {
    // Enable peer syndication
    enabled: boolean;

    // Peer endpoints
    peers: Array<{
      endpoint: string;
      name?: string;
      autoSync?: boolean;
    }>;

    // Sync interval in milliseconds
    syncInterval: number;

    // Enable automatic sync
    autoSync: boolean;
  };

  // Retention configuration
  retention?: {
    // Maximum events to retain
    maxEvents?: number;

    // Maximum age in days
    maxAgeDays?: number;

    // Archive old events instead of deleting
    archive: boolean;
  };
}
```

**Default Values:**

```json
{
  "enabled": true,
  "backend": "postgres",
  "postgres": {
    "connectionString": "${DATABASE_URL}",
    "schema": "exochain"
  },
  "agent": {
    "did": "${EXOCHAIN_AGENT_DID}",
    "privateKey": "${EXOCHAIN_PRIVATE_KEY}"
  },
  "checkpoints": {
    "interval": 5000,
    "bftThreshold": 0.67,
    "autoCreate": true
  },
  "syndication": {
    "enabled": true,
    "peers": [],
    "syncInterval": 60000,
    "autoSync": false
  },
  "retention": {
    "maxAgeDays": 90,
    "archive": true
  }
}
```

---

## 7. Usage Examples

### 7.1 Starting a Workflow

**Using MCP Tool:**

```json
// Request
{
  "tool": "kg_workflow_start",
  "params": {
    "workflowType": "realtime-collab",
    "params": {
      "graphId": "main-kg",
      "watchPaths": ["docs/", "src/"]
    }
  }
}

// Response
{
  "workflowId": "wf-abc123-def456",
  "status": "running",
  "startedAt": "2025-12-29T10:30:00Z",
  "hooks": {
    "nodeUpdateHook": "hook-123",
    "gapDetectedHook": "hook-456"
  }
}
```

**Using CLI:**

```bash
# Start real-time collaboration workflow
$ kg workflow start realtime-collab --params '{"graphId": "main-kg"}'

Workflow started successfully!
  ID: wf-abc123-def456
  Type: realtime-collab
  Status: running
  Started: 2025-12-29T10:30:00Z

Available hooks:
  - nodeUpdateHook (hook-123)
  - gapDetectedHook (hook-456)

Use 'kg workflow status wf-abc123-def456' to check progress.
```

**Using TypeScript:**

```typescript
import { initializeRealtimeCollab } from "@weavelogic/knowledge-graph-agent/realtime";
import { realtimeCollaborationWorkflow } from "@weavelogic/knowledge-graph-agent/realtime/workflows";

async function main() {
  const { workflow } = await initializeRealtimeCollab();

  // Start the workflow
  const run = await workflow.world.run(realtimeCollaborationWorkflow, "main-kg");

  console.log(`Workflow started: ${run.id}`);

  // Trigger an update hook
  await run.triggerHook("nodeUpdateHook", {
    nodeId: "doc-001",
    userId: "user-123",
    changes: { content: "Updated content" },
    timestamp: Date.now()
  });
}

main();
```

### 7.2 Performing Semantic Search

**Using MCP Tool:**

```json
// Request
{
  "tool": "kg_vector_search",
  "params": {
    "query": "user authentication with OAuth2",
    "cypher": "MATCH (n)-[:IMPLEMENTS]->(p:Pattern) WHERE p.name = 'OAuth2' RETURN n",
    "limit": 5
  }
}

// Response
{
  "results": [
    {
      "id": "doc-auth-001",
      "score": 0.92,
      "nodeType": "document",
      "content": "OAuth2 Authentication Implementation Guide",
      "metadata": {
        "path": "docs/auth/oauth2.md",
        "lastModified": "2025-12-28T15:00:00Z"
      }
    },
    {
      "id": "concept-oauth",
      "score": 0.87,
      "nodeType": "concept",
      "content": "OAuth2 authorization flow with PKCE",
      "metadata": {
        "tags": ["auth", "security", "oauth2"]
      }
    }
  ],
  "searchTime": 61,
  "totalMatches": 23
}
```

**Using CLI:**

```bash
# Basic search
$ kg vector search "user authentication"

Found 15 results (61us):

1. [0.92] doc-auth-001 (document)
   OAuth2 Authentication Implementation Guide
   Path: docs/auth/oauth2.md

2. [0.87] concept-oauth (concept)
   OAuth2 authorization flow with PKCE
   Tags: auth, security, oauth2

3. [0.84] doc-auth-002 (document)
   JWT Token Validation
   Path: docs/auth/jwt.md

# Search with Cypher filter
$ kg vector search "authentication" --cypher "MATCH (n)-[:REQUIRES]->(s:Service) RETURN n"

# JSON output for scripting
$ kg vector search "authentication" --json | jq '.results[0]'
```

**Using TypeScript:**

```typescript
import { EnhancedVectorService } from "@weavelogic/knowledge-graph-agent/realtime/services";

async function searchDocs() {
  const vectorService = new EnhancedVectorService({
    postgresUrl: process.env.DATABASE_URL!,
    schema: "ruvector",
    dimensions: 384,
    hnswConfig: { m: 16, efConstruction: 200, efSearch: 100 }
  });

  // Generate embedding for query (using your preferred embedding model)
  const queryEmbedding = await generateEmbedding("user authentication with OAuth2");

  const results = await vectorService.hybridSearch({
    embedding: queryEmbedding,
    cypher: `
      MATCH (n)-[:IMPLEMENTS]->(p:Pattern)
      WHERE p.name = 'OAuth2'
      RETURN n
    `,
    limit: 10
  });

  for (const result of results) {
    console.log(`[${result.score.toFixed(2)}] ${result.id}: ${result.content}`);
  }
}
```

### 7.3 Querying Audit Logs

**Using MCP Tool:**

```json
// Request
{
  "tool": "kg_audit_query",
  "params": {
    "eventType": "WorkflowCompleted",
    "since": "2025-12-28T00:00:00Z",
    "includeProof": true,
    "limit": 10
  }
}

// Response
{
  "events": [
    {
      "id": "evt-abc123",
      "type": "WorkflowCompleted",
      "timestamp": "2025-12-29T10:35:00Z",
      "author": "did:exo:agent-001",
      "data": {
        "workflowId": "wf-xyz789",
        "outcome": "success",
        "duration": 45000
      },
      "proof": {
        "root": "0x1234...",
        "path": ["0xabcd...", "0xef01..."],
        "index": 42
      }
    }
  ],
  "totalCount": 156,
  "latestCheckpoint": {
    "height": 1250,
    "eventRoot": "0x5678..."
  }
}
```

**Using CLI:**

```bash
# Query all events
$ kg audit query

Recent audit events (50 of 1,250):

[2025-12-29T10:35:00Z] WorkflowCompleted (evt-abc123)
  Workflow: wf-xyz789
  Outcome: success
  Author: did:exo:agent-001

[2025-12-29T10:30:00Z] WorkflowStarted (evt-abc122)
  Workflow: wf-xyz789
  Trigger: realtime-collab
  Author: did:exo:agent-001

# Filter by type
$ kg audit query --type NodeCreated --since "2025-12-28"

# Include Merkle proof
$ kg audit query --type WorkflowCompleted --include-proof

# Verify specific event
$ kg audit verify evt-abc123 --full-chain

Event evt-abc123 verification:
  Signature: VALID
  Parent chain: VALID (42 ancestors)
  Merkle proof: VALID
  Checkpoint: height 1250
```

**Using TypeScript:**

```typescript
import { KnowledgeGraphAuditService } from "@weavelogic/knowledge-graph-agent/realtime/services";

async function queryAudit() {
  const auditService = new KnowledgeGraphAuditService({
    dagStore: await initDagStore(),
    agentDid: process.env.EXOCHAIN_AGENT_DID!,
    privateKey: process.env.EXOCHAIN_PRIVATE_KEY!
  });

  // Query workflow events
  const events = await auditService.queryEvents(
    "WorkflowCompleted",
    { time: Date.now() - 86400000, counter: 0 }, // Last 24 hours
    true // Include proof
  );

  for (const event of events) {
    console.log(`[${event.envelope.payload.type}] ${event.id}`);
    console.log(`  Data: ${JSON.stringify(event.envelope.payload.data)}`);
    console.log(`  Author: ${event.envelope.author}`);
  }

  // Get latest checkpoint
  const checkpoint = await auditService.getLatestCheckpoint();
  console.log(`Latest checkpoint: height ${checkpoint.height}, root ${checkpoint.eventRoot}`);
}
```

### 7.4 Syncing with Peers

**Using MCP Tool:**

```json
// Request
{
  "tool": "kg_sync_status",
  "params": {
    "peerEndpoint": "https://peer1.example.com",
    "triggerSync": true
  }
}

// Response
{
  "localHeight": 1250,
  "peers": [
    {
      "endpoint": "https://peer1.example.com",
      "status": "synced",
      "peerHeight": 1250,
      "lastSyncAt": "2025-12-29T10:35:00Z",
      "eventsReceived": 0
    }
  ],
  "syncTriggered": true,
  "syncResult": {
    "eventsReceived": 15,
    "newHeight": 1265
  }
}
```

**Using CLI:**

```bash
# Check sync status with all peers
$ kg audit status

Audit Chain Status:
  Local height: 1,250 events
  Latest checkpoint: height 1,248 (2025-12-29T10:30:00Z)

Peers:
  https://peer1.example.com
    Status: synced
    Height: 1,250
    Last sync: 5 minutes ago

  https://peer2.example.com
    Status: behind (15 events)
    Height: 1,265
    Last sync: 10 minutes ago

# Sync with specific peer
$ kg audit sync --peer https://peer2.example.com

Syncing with https://peer2.example.com...
  Fetched 15 new events
  Verified signatures: 15/15
  New local height: 1,265

# Sync with all peers
$ kg audit sync --all

Syncing with 2 peers...
  peer1.example.com: already synced
  peer2.example.com: received 15 events
Total events received: 15

# Add a new peer
$ kg audit peer add https://peer3.example.com --name "Staging Environment"

Peer added successfully!
  Endpoint: https://peer3.example.com
  Name: Staging Environment
  Initial height: 0

Initiating first sync...
  Received 1,265 events
  Sync complete!
```

**Using TypeScript:**

```typescript
import { KnowledgeGraphAuditService } from "@weavelogic/knowledge-graph-agent/realtime/services";

async function syncWithPeers() {
  const auditService = new KnowledgeGraphAuditService({
    dagStore: await initDagStore(),
    agentDid: process.env.EXOCHAIN_AGENT_DID!,
    privateKey: process.env.EXOCHAIN_PRIVATE_KEY!
  });

  const peers = [
    "https://peer1.example.com",
    "https://peer2.example.com"
  ];

  for (const peer of peers) {
    try {
      const result = await auditService.syncWithPeer(peer);
      console.log(`Synced with ${peer}:`);
      console.log(`  Events received: ${result.eventsReceived}`);
      console.log(`  New height: ${result.newHeight}`);
    } catch (error) {
      console.error(`Failed to sync with ${peer}: ${error.message}`);
    }
  }

  // Create checkpoint after sync
  const checkpoint = await auditService.createCheckpoint();
  console.log(`Created checkpoint at height ${checkpoint.height}`);
}
```

---

## 8. Troubleshooting

### 8.1 Common Issues

#### Issue: PostgreSQL Connection Failed

**Symptoms:**
```
Error: connection refused to database
Error: ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

1. Verify PostgreSQL is running:
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# For Docker
docker ps | grep postgres
```

2. Check connection string format:
```bash
# Correct format
DATABASE_URL=postgresql://user:password@host:port/database

# Common mistakes
DATABASE_URL=postgres://...  # Use postgresql:// not postgres://
DATABASE_URL=postgresql://user:pass@host/db  # Missing port
```

3. Verify network access:
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check firewall
sudo ufw status
```

#### Issue: Workflow Stuck in "pending" State

**Symptoms:**
```
Workflow wf-xxx has been pending for 5+ minutes
No events recorded in workflow.events table
```

**Solutions:**

1. Check Postgres World connection:
```bash
# Verify schema exists
psql $DATABASE_URL -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'workflow'"

# Check for locks
psql $DATABASE_URL -c "SELECT * FROM pg_locks WHERE relation::regclass::text LIKE 'workflow.%'"
```

2. Verify worker is running:
```typescript
// In your application startup
import { startWorkflowWorker } from "@workflow/postgres";

await startWorkflowWorker({
  connectionString: process.env.DATABASE_URL,
  schema: "workflow",
  concurrency: 5
});
```

3. Check for errors in workflow logs:
```bash
kg workflow events wf-xxx --since "1 hour ago"
```

#### Issue: Vector Search Returns Empty Results

**Symptoms:**
```
kg vector search "query" returns 0 results
Search completes but results array is empty
```

**Solutions:**

1. Verify vectors exist:
```bash
# Check vector count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM ruvector.embeddings"

# Check index status
psql $DATABASE_URL -c "SELECT * FROM pg_indexes WHERE schemaname = 'ruvector'"
```

2. Check embedding dimensions:
```bash
# Verify dimensions match
psql $DATABASE_URL -c "SELECT array_length(embedding, 1) FROM ruvector.embeddings LIMIT 1"
```

3. Rebuild index if corrupted:
```bash
kg vector reindex --force
```

4. Test with simple query:
```bash
# Search for known content
kg vector search "test" --limit 1

# Use raw SQL
psql $DATABASE_URL -c "SELECT id, 1 - (embedding <=> '[0.1, 0.2, ...]') AS similarity FROM ruvector.embeddings ORDER BY similarity DESC LIMIT 5"
```

#### Issue: Audit Events Not Being Recorded

**Symptoms:**
```
kg audit query returns empty results
Events table has no new entries
```

**Solutions:**

1. Verify agent identity is configured:
```bash
# Check environment variables
echo $EXOCHAIN_AGENT_DID
echo $EXOCHAIN_PRIVATE_KEY | head -c 20

# Generate new identity if needed
kg audit generate-identity
```

2. Check audit service initialization:
```typescript
// Ensure audit service is started
const auditService = new KnowledgeGraphAuditService({
  dagStore,
  agentDid: process.env.EXOCHAIN_AGENT_DID!,
  privateKey: process.env.EXOCHAIN_PRIVATE_KEY!
});

// Test logging
const eventId = await auditService.logEvent("NodeCreated", { test: true });
console.log(`Test event created: ${eventId}`);
```

3. Check database schema:
```bash
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'exochain'"
```

#### Issue: Peer Sync Failing

**Symptoms:**
```
Error: Failed to sync with peer
Error: Signature verification failed
Error: Causality validation failed
```

**Solutions:**

1. Verify peer is reachable:
```bash
# Test endpoint
curl -I https://peer1.example.com/checkpoint

# Check response
curl https://peer1.example.com/checkpoint | jq .
```

2. Check clock synchronization:
```bash
# Verify system time is accurate
ntpdate -q pool.ntp.org

# HLC should handle minor drift, but large differences cause issues
```

3. Verify peer uses same DID format:
```bash
# Compare DID formats
echo "Local: $EXOCHAIN_AGENT_DID"
curl https://peer1.example.com/identity | jq .did
```

4. Reset sync state if corrupted:
```bash
# Clear peer sync state
kg audit peer remove https://peer1.example.com
kg audit peer add https://peer1.example.com --name "Peer 1"

# Force full resync
kg audit sync --peer https://peer1.example.com --full
```

### 8.2 Debug Logging

Enable detailed logging for troubleshooting:

**Environment Variables:**

```bash
# Enable debug logging
LOG_LEVEL=debug

# Enable specific component logging
DEBUG=kg:workflow:*
DEBUG=kg:vector:*
DEBUG=kg:audit:*

# Enable all debug logging
DEBUG=kg:*
```

**In Code:**

```typescript
import { setLogLevel, enableDebug } from "@weavelogic/knowledge-graph-agent/utils/logger";

// Set log level
setLogLevel("debug");

// Enable specific debug namespaces
enableDebug("kg:workflow");
enableDebug("kg:vector");
enableDebug("kg:audit");
```

**Log Output Examples:**

```
[2025-12-29T10:30:00.123Z] DEBUG kg:workflow Starting workflow wf-abc123
[2025-12-29T10:30:00.125Z] DEBUG kg:workflow:step Executing step analyzeDocumentGaps
[2025-12-29T10:30:01.456Z] DEBUG kg:vector Searching with embedding dim=384, k=10
[2025-12-29T10:30:01.517Z] DEBUG kg:vector:hnsw HNSW search completed in 61us, found 23 candidates
[2025-12-29T10:30:02.789Z] DEBUG kg:audit Logging event type=NodeCreated
[2025-12-29T10:30:02.801Z] DEBUG kg:audit:dag Appended event evt-xyz with 2 parents
```

### 8.3 Support Resources

**Documentation:**
- Workflow DevKit: https://useworkflow.dev/docs
- RuVector: https://ruvector.dev/docs
- Exochain: https://exochain.dev/docs

**Community:**
- GitHub Issues: https://github.com/weavelogic/knowledge-graph-agent/issues
- Discord: https://discord.gg/weavelogic
- Stack Overflow: Tag `knowledge-graph-agent`

**Enterprise Support:**
- Email: support@weavelogic.dev
- Enterprise Portal: https://enterprise.weavelogic.dev

**Diagnostics Command:**

```bash
# Run full diagnostic suite
kg diag run --all

# Specific diagnostics
kg diag run --workflow
kg diag run --vector
kg diag run --audit

# Export diagnostic report
kg diag export --output diag-report-$(date +%Y%m%d).json
```

---

## Appendix A: Migration Checklist

Use this checklist to track your migration progress:

- [ ] **Prerequisites**
  - [ ] PostgreSQL 14+ installed and running
  - [ ] Environment variables configured
  - [ ] NPM dependencies installed

- [ ] **Database Migration**
  - [ ] Base schemas created
  - [ ] Workflow tables created
  - [ ] RuVector tables created
  - [ ] Exochain tables created
  - [ ] Indexes verified

- [ ] **Configuration**
  - [ ] `.kg/config.json` updated
  - [ ] `tsconfig.json` updated
  - [ ] Environment variables set

- [ ] **Code Changes**
  - [ ] Realtime services initialized
  - [ ] Workflow definitions created
  - [ ] Vector service wrapper implemented
  - [ ] Audit service wrapper implemented

- [ ] **Testing**
  - [ ] Workflow start/status/list working
  - [ ] Vector search returning results
  - [ ] Audit events being recorded
  - [ ] Peer sync functioning

- [ ] **Production Readiness**
  - [ ] Backup strategy configured
  - [ ] Monitoring alerts set up
  - [ ] Documentation updated
  - [ ] Team trained on new features

---

*Migration guide prepared by Claude Code Architecture Agent*
*Version 3.0.0 - December 29, 2025*
