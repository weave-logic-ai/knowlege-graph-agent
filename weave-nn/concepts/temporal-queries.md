---
concept_id: C-005
concept_type: technical-concept
title: Temporal Queries
status: active
category: core-concept
created_date: '2025-10-20'
last_updated: '2025-10-20'
version: '1.0'
author: Hive Mind (Claude)
ai_generated: true
related_concepts:
  - knowledge-graph
  - weave-nn
  - ai-generated-documentation
related_decisions:
  - TS-4
  - FP-2
tags:
  - temporal
  - queries
  - graphiti
  - time-series
  - core-concept
  - advanced-feature
type: concept
visual:
  icon: 💡
  cssclasses:
    - type-concept
    - status-active
updated_date: '2025-10-28'
icon: 💡
---

# Temporal Queries

**Definition**: Temporal queries enable time-aware knowledge retrieval, allowing users to query the [[knowledge-graph|knowledge graph]] at specific points in time or across time ranges. This answers questions like "What did we know about authentication on October 15?" or "How did our API design evolve over the past month?"

---

## Core Concept

Traditional knowledge graphs represent **current state only** - they show what documents exist now and how they're currently connected. Temporal knowledge graphs add a **time dimension**, tracking:

1. **When facts became valid**: Document creation timestamps
2. **When facts became invalid**: Document deletion or contradiction
3. **Evolution of relationships**: How links between documents changed over time
4. **Version history**: Multiple states of the same document across time

This is critical for [[ai-generated-documentation|AI-generated documentation]] because:
- AI analyses can become outdated as code changes
- Planning decisions evolve through iterations
- Understanding context requires knowing "what we knew when"

---

## Temporal vs Traditional Queries

### Traditional Query (Snapshot)
```
"Show all documents tagged #authentication"
```
**Result**: Current documents with authentication tag (ignores history)

### Temporal Query (Time-Aware)
```
"Show all documents tagged #authentication that existed on Oct 15, 2025"
```
**Result**: Documents as they existed on that date, including deleted ones

### Evolution Query
```
"Show how the authentication architecture changed from Oct 1 to Oct 20"
```
**Result**: Timeline of document modifications, new connections, and invalidated approaches

---

## Implementation: Graphiti

[[weave-nn|Weave-NN]] uses **Graphiti** (from Zep AI) to implement temporal knowledge graphs.

### Key Capabilities

1. **Temporal Awareness**: Every fact has `valid_from` and `valid_to` timestamps
2. **Incremental Updates**: No batch recomputation needed when adding documents
3. **Hybrid Retrieval**: Combines semantic search, BM25, and graph traversal
4. **Invalidation Detection**: Automatically flags outdated information when contradicted

### Architecture Integration

```
┌──────────────────────────────────────┐
│         Weave-NN Frontend            │
│    (SvelteKit or Next.js)            │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│      API Layer (Node.js)             │
│  - Document CRUD                     │
│  - Graph queries                     │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Graphiti Service (Python/FastAPI)  │
│  - Temporal graph engine             │
│  - Episode tracking                  │
│  - Time-range queries                │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│     PostgreSQL Database              │
│  - Graph data                        │
│  - Temporal metadata                 │
└──────────────────────────────────────┘
```

---

## Use Cases in Weave-NN

### 1. Point-in-Time Knowledge Reconstruction
**Question**: "What was our understanding of the API design on October 15?"

**Query**:
```python
graphiti.search(
    query="API design",
    time_point="2025-10-15T00:00:00Z"
)
```

**Result**: Shows only documents that existed and were valid on Oct 15, excluding:
- Documents created after Oct 15
- Documents deleted before Oct 15
- Facts marked invalid before Oct 15

---

### 2. Decision Evolution Tracking
**Question**: "How did our authentication approach change from initial planning to implementation?"

**Query**:
```python
graphiti.search(
    query="authentication architecture",
    time_range=("2025-10-01", "2025-10-20")
)
```

**Result**: Timeline showing:
- Initial OAuth2 decision (Oct 1)
- JWT token discussion (Oct 5)
- NextAuth.js selection (Oct 10)
- Final implementation (Oct 20)

---

### 3. Invalidation Detection
**Scenario**: AI generates analysis of API design on Oct 10. On Oct 15, team changes the approach.

**Graphiti Behavior**:
1. Oct 15 document contradicts Oct 10 analysis
2. Oct 10 facts marked as `valid_to: 2025-10-15`
3. Search for "API design" shows newer approach
4. Temporal query for Oct 12 still shows old approach (historically accurate)

---

### 4. Change Impact Analysis
**Question**: "What documents need review after changing the database schema?"

**Query**:
```python
graphiti.search(
    query="database schema",
    related_concepts=["API design", "data models"],
    modified_since="2025-10-18"
)
```

**Result**: Documents referencing database schema, ordered by how recently they were updated, highlighting stale content.

---

## Episodes and Temporal Context

Graphiti uses **episodes** to track temporal context:

### Episode Definition
An episode is a timestamped interaction that adds knowledge to the graph.

**Example**:
```python
graphiti.add_episode(
    source_id="claude-session-123",
    content="User discussed OAuth2 implementation. Decision to use NextAuth.js for simplicity.",
    timestamp="2025-10-20T14:30:00Z",
    metadata={
        "doc_id": "auth-planning",
        "type": "planning",
        "participants": ["Mathew", "Claude"]
    }
)
```

This creates:
- Nodes for entities (OAuth2, NextAuth.js)
- Edges for relationships (decided, uses)
- Temporal metadata (valid from Oct 20)

---

## Advantages Over Git-Only Versioning

| Feature | Git Commits | Temporal Knowledge Graph |
|---------|-------------|--------------------------|
| **Granularity** | File-level diffs | Fact-level validity |
| **Semantic queries** | ❌ Not supported | ✅ "Show authentication decisions" |
| **Relationship tracking** | ❌ Not tracked | ✅ "When did we link auth to API docs?" |
| **Invalidation** | Manual (edit file) | ✅ Automatic contradiction detection |
| **Cross-document evolution** | ❌ Separate histories | ✅ Unified temporal graph |

Git provides file versioning, but temporal knowledge graphs provide **knowledge versioning** - tracking how understanding evolved, not just file changes.

---

## Query Examples

### "Show me the knowledge graph as of last week"
```typescript
const graph = await fetchTemporalGraph({
  timestamp: "2025-10-13T00:00:00Z"
});
// Renders graph view with only nodes/edges valid on Oct 13
```

### "What changed in my planning docs this week?"
```typescript
const changes = await graphiti.search({
  query: "planning",
  time_range: ["2025-10-13", "2025-10-20"],
  change_type: "modified"
});
// Returns documents created or updated in that range
```

### "Find all security decisions made in October"
```typescript
const decisions = await graphiti.search({
  query: "security decisions",
  time_range: ["2025-10-01", "2025-10-31"],
  filters: { tags: ["decision", "security"] }
});
```

---

## Implementation Phases

### Phase 1 (MVP): Basic Temporal Metadata
- Track `created_at` and `updated_at` for documents
- Enable "filter by date range" in UI
- Git commit history as fallback

### Phase 2 (v1.1): Graphiti Integration
- Integrate Graphiti Python service
- Add episode tracking for AI interactions
- Enable point-in-time queries in UI

### Phase 3 (v2.0): Advanced Temporal Features
- Timeline visualization
- Automatic invalidation detection
- Change impact analysis
- Temporal graph animations (watch knowledge evolve)

---

## Related Concepts

- [[knowledge-graph|Knowledge Graph]] - Temporal layer enhances standard graphs
- [[weave-nn|Weave-NN]] - Platform implementing temporal queries
- [[ai-generated-documentation|AI-Generated Documentation]] - Content that evolves over time
- [[../technical/graphiti|Graphiti]] - Implementation technology
- [[../features/temporal-knowledge-graph|Temporal Graph Feature]]

---

## Related Decisions

- [[../decisions/technical/database-storage|TS-4: Database & Storage]] - Postgres + Graphiti for temporal data
- [[../decisions/features/ai-integration|FP-2: AI Integration Priority]] - When to add Graphiti
- [[../decisions/open-questions/Q-TECH-002|Q-TECH-002]]: How to integrate Graphiti?

---

## Key References

**Custom Solution Analysis**: See [[../custom-solution-analysis|Custom Solution Analysis]] section "Temporal Knowledge Graph (Graphiti)" for detailed use cases and integration approach.

**Graphiti Resources**:
- GitHub: https://github.com/getzep/graphiti
- MCP Server: https://github.com/getzep/graphiti/tree/main/mcp_server
- OpenAI Cookbook: Temporal agents with knowledge graphs

---

**Back to**: [[../INDEX|Main Index]] | [[../concepts/|Concepts]]
