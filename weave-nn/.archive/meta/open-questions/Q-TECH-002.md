---
question_id: Q-TECH-002
question_type: technical
title: Graphiti Integration Strategy & Temporal Knowledge Graph Architecture
status: open
priority: high
category: backend
created_date: '2025-10-20'
last_updated: '2025-10-20'
due_date: '2025-11-03'
assigned_to: Backend Team
stakeholders:
  - Architecture Team
  - AI Integration Team
  - Data Team
ai_assisted: true
related_decisions:
  - TS-3
  - TS-4
  - ED-1
research_tasks:
  - Set up Graphiti locally and test basic operations
  - Evaluate multi-tenancy support in Graphiti
  - Test temporal queries and point-in-time retrieval
  - Benchmark performance with 10k+ episodes
  - Design integration architecture (sidecar vs embedded)
  - Test hybrid search (semantic + BM25 + graph)
  - Evaluate Graphiti MCP server capabilities
tags:
  - technical
  - backend
  - high-priority
  - research-needed
  - knowledge-graph
---

# Q-TECH-002: Graphiti Integration Strategy & Temporal Knowledge Graph Architecture

**Status**: 🔍 **OPEN - Research Needed**
**Priority**: 🟡 **HIGH**

---

## The Question

How should we integrate **Graphiti** (temporal knowledge graph engine) into Weave-NN, and is it the right choice for our multi-tenant SaaS architecture?

### Sub-questions:
1. Should Graphiti run as a Python microservice (sidecar) or can we embed it?
2. How do we handle multi-tenancy with Graphiti's graph structure?
3. Is Graphiti mature enough for production SaaS use?
4. What are the alternatives if Graphiti doesn't fit?
5. How does Graphiti integrate with Google Cloud services (Vertex AI)?

---





## Related

[[fastapi]] • [[tag-based-filtering]] • [[phase-14-obsidian-integration]]
## Related

[[Q-TECH-005]]
## Context from Analysis

### From Custom Solution Analysis

**Why Graphiti was recommended**:
- **Temporal awareness**: Track when facts were valid/invalid
- **Incremental updates**: No batch recomputation needed
- **Hybrid retrieval**: Semantic + BM25 + graph traversal
- **Built for AI agents**: Designed for continuous AI interaction

**Proposed use cases**:
- "Show me all planning documents from last week"
- "What was the state of the project on Oct 15?"
- "Find documents that reference authentication AND were modified after the security audit"
- "Show changes to the API design over time"

**Architecture position**:
```
Data/Knowledge Layer:
├── Postgres (Documents, Metadata)
├── Graphiti (Temporal Knowledge Graph) ← QUESTION
└── Vector DB (Embeddings for Semantic Search)
```

### From Project Scope (ED-1)

**SaaS implications**:
- Multi-tenant isolation required
- Must scale to hundreds of workspaces
- Google Cloud deployment (Cloud Run likely)
- Cost efficiency matters

---

## What is Graphiti?

### Core Capabilities

**Temporal Knowledge Graph**:
- Tracks entities, relationships, and their validity over time
- Supports point-in-time queries ("what did we know on date X?")
- Incremental updates without full graph recomputation

**Hybrid Search**:
- Vector search (semantic similarity)
- BM25 (keyword/lexical search)
- Graph traversal (relationship-based)

**AI-Agent Focused**:
- Designed for continuous AI interaction
- Episode-based knowledge addition
- Conflict resolution for contradicting information

### Technical Stack

**Backend**: Python (FastAPI)
**Database**: PostgreSQL + Neo4j or Postgres with graph extensions
**Embeddings**: OpenAI/Anthropic or custom
**License**: Apache 2.0 (open source)

---

## Key Research Questions

### 1. Multi-Tenancy Support

**Challenge**: Graphiti's default architecture may not support workspace isolation

**Research needed**:
- [ ] Does Graphiti support namespacing/partitioning graphs?
- [ ] Can we run separate Graphiti instances per workspace?
- [ ] How to implement row-level security with Graphiti?
- [ ] Performance impact of multi-tenant design?

**Options to explore**:
**Option A**: Single Graphiti instance with workspace metadata
- Add `workspace_id` to all entities/edges
- Filter all queries by workspace
- Risk: Cross-workspace data leakage

**Option B**: Separate Graphiti instance per workspace
- Full isolation
- Higher resource cost
- Complex orchestration

**Option C**: Hybrid - shared infrastructure, logical isolation
- Postgres RLS (Row-Level Security)
- Graph partitioning
- Need to verify Graphiti supports this

---

### 2. Deployment Architecture

**Challenge**: Graphiti is Python, rest of stack may be JavaScript/TypeScript

**Options to evaluate**:

**Option A: Python Microservice (Sidecar)**
```
┌─────────────────┐
│  Next.js/Svelte │
│   (Frontend)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Node.js API    │
│  (Main Backend) │
└────┬───────┬────┘
     │       │
     │    ┌──▼──────────┐
     │    │  Graphiti   │
     │    │  (Python)   │
     │    │  FastAPI    │
     │    └──┬──────────┘
     │       │
┌────▼───────▼────┐
│   PostgreSQL     │
└──────────────────┘
```

**Pros**:
- Clean separation
- Graphiti maintains its architecture
- Can scale independently

**Cons**:
- Extra network hop
- More deployment complexity
- Cross-language debugging

---

**Option B: Python Backend (Unified)**
```
┌─────────────────┐
│  Next.js/Svelte │
│   (Frontend)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  FastAPI        │
│  (Python)       │
│  + Graphiti     │
│  + MCP Server   │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
└─────────────────┘
```

**Pros**:
- Single language backend
- Simpler deployment
- Direct Graphiti integration

**Cons**:
- Team may prefer Node.js/TS
- Less mature SaaS ecosystems in Python
- Tighter coupling

---

**Option C: Graphiti as Service (Cloud Run)**
```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
┌──────▼───────┐        ┌──────────────┐
│   Node API   │───────▶│  Graphiti    │
│  (Cloud Run) │        │  (Cloud Run) │
└──────┬───────┘        └──────┬───────┘
       │                       │
       └───────────┬───────────┘
                   │
            ┌──────▼──────┐
            │  Cloud SQL  │
            │ (Postgres)  │
            └─────────────┘
```

**Pros**:
- Google Cloud native
- Independent scaling
- Service isolation

**Cons**:
- Cross-service latency
- More complex auth
- Higher cloud costs

---

### 3. Temporal Features - Do We Need Them?

**Question**: Are temporal queries essential for MVP, or can we add later?

**Use cases to validate**:

**Tier 1 (MVP Critical)**:
- ✅ "Find all documents about feature X" (basic search, not temporal)
- ✅ "Show related documents" (graph traversal, not temporal)
- ⚠️ "Changes to planning doc over time" (temporal, but could use Git)

**Tier 2 (Nice to Have)**:
- ⏳ "What was the state of project on Oct 15?" (temporal query)
- ⏳ "Show evolution of architecture decisions" (temporal)
- ⏳ "Find documents valid during Q4 2025" (temporal)

**Research questions**:
- Can we defer temporal features to v2?
- Could Git commits provide temporal context instead?
- Is Graphiti overkill if we don't need temporal queries in MVP?

---

### 4. Performance & Scalability

**Benchmarks needed**:
- [ ] Insert 10,000 episodes (documents as episodes)
- [ ] Query performance with large graphs (10k+ nodes, 50k+ edges)
- [ ] Concurrent query performance (100 users)
- [ ] Memory usage per workspace
- [ ] Embedding generation latency

**Acceptance criteria**:
- Insert latency: <100ms per document
- Query latency: <500ms for complex graph queries
- Support 1000+ workspaces on single instance
- Memory: <1GB per 10k documents

---

### 5. Integration with Vector Search

**Question**: Should we use Graphiti's built-in vector search or separate vector DB?

**Option A: Graphiti's Built-in Vector Search**
- Uses embeddings within Graphiti
- Unified hybrid search
- Simpler architecture

**Option B: Separate Vector DB (pgvector/Pinecone)**
- More control over embeddings
- Can optimize separately
- Better for pure semantic search

**Research needed**:
- Quality of Graphiti's vector search
- Performance comparison
- Cost comparison (embeddings API calls)

---

### 6. MCP Server Integration

**From analysis**: Graphiti has an MCP server implementation

**Research tasks**:
- [ ] Test Graphiti MCP server with Claude Desktop
- [ ] Evaluate available tools/capabilities
- [ ] Compare with custom MCP server approach
- [ ] Test multi-user MCP access
- [ ] Verify workspace isolation in MCP layer

**Questions**:
- Can we use Graphiti MCP server directly?
- Do we need custom MCP tools on top?
- How does this integrate with our SaaS backend?

---

## Alternative Solutions

### Alternative 1: Pure PostgreSQL with pgvector
**Skip Graphiti entirely, use Postgres extensions**

**Stack**:
- PostgreSQL with pgvector (embeddings)
- pg_graphiti or Apache AGE (graph queries)
- Custom temporal logic in application layer

**Pros**:
- Single database
- Simpler deployment
- Lower cost

**Cons**:
- No built-in temporal graph features
- Need to build hybrid search ourselves
- More application logic

---

### Alternative 2: Neo4j
**Use dedicated graph database**

**Stack**:
- Neo4j (graph database)
- Separate vector DB (Pinecone/pgvector)
- Custom temporal logic

**Pros**:
- Mature graph database
- Excellent query language (Cypher)
- Good visualization tools

**Cons**:
- Another database to manage
- Higher cost (Neo4j enterprise)
- No native temporal features
- Not optimized for AI agents like Graphiti

---

### Alternative 3: LangGraph or LlamaIndex
**Use AI framework's built-in graph features**

**Pros**:
- Integrated with AI workflows
- Simpler for AI-first use case

**Cons**:
- Less mature graph features
- Not true temporal graphs
- May need to switch later

---

## Trade-off Matrix

| Factor | Graphiti | Pure Postgres | Neo4j | LangGraph |
|--------|----------|---------------|-------|-----------|
| **Temporal queries** | ✅✅ Native | ❌ Build yourself | ❌ Build yourself | ❌ Limited |
| **AI-agent focus** | ✅✅ Purpose-built | ⚠️ General DB | ⚠️ General graph | ✅ AI-focused |
| **Multi-tenancy** | ⚠️ Unknown | ✅ RLS built-in | ⚠️ Complex | ⚠️ Unknown |
| **Performance** | ⚠️ Need to test | ✅ Proven | ✅✅ Excellent | ⚠️ Unknown |
| **Deployment** | ⚠️ Python sidecar | ✅ Simple | ⚠️ Another DB | ✅ Embedded |
| **Cost** | ✅ Open source | ✅ Postgres only | ❌ Expensive | ✅ Free |
| **Maturity** | ⚠️ New (2024?) | ✅✅ Very mature | ✅✅ Mature | ⚠️ Evolving |
| **Vendor lock-in** | ✅ Open source | ✅ Open source | ⚠️ Neo4j specific | ⚠️ Framework lock |

---

## Proof of Concept Requirements

### Minimal Viable Graphiti Integration

**Goal**: Validate Graphiti fits our use case

**Tasks**:
1. **Setup** (Day 1)
   - [ ] Install Graphiti locally
   - [ ] Configure with PostgreSQL
   - [ ] Test basic episode addition

2. **Document Ingestion** (Day 2)
   - [ ] Add 100 markdown documents as episodes
   - [ ] Extract entities and relationships
   - [ ] Test semantic search

3. **Temporal Queries** (Day 3)
   - [ ] Query state at specific date
   - [ ] Find documents modified in date range
   - [ ] Test incremental updates

4. **Multi-Tenancy Prototype** (Day 4)
   - [ ] Add workspace_id to all entities
   - [ ] Test query isolation
   - [ ] Verify no cross-workspace leakage

5. **Performance Baseline** (Day 5)
   - [ ] Benchmark with 1k, 5k, 10k documents
   - [ ] Measure query latency
   - [ ] Profile memory usage

**Success criteria**:
- All basic operations work
- Multi-tenancy is feasible
- Performance is acceptable
- Clear integration path identified

---

## Research Tasks Breakdown

### Week 1: Graphiti Fundamentals
- [ ] Install and configure Graphiti
- [ ] Review documentation and examples
- [ ] Test basic CRUD operations
- [ ] Explore MCP server
- [ ] Initial architecture design

### Week 2: Multi-Tenancy & Integration
- [ ] Design multi-tenant schema
- [ ] Prototype workspace isolation
- [ ] Design API integration layer
- [ ] Test with sample documents
- [ ] Evaluate deployment options

### Week 3: Performance & Alternatives
- [ ] Run performance benchmarks
- [ ] Compare with alternatives (pure Postgres)
- [ ] Evaluate cost implications
- [ ] Risk assessment
- [ ] Decision recommendation

---

## Risks & Mitigations

### Risk: Graphiti doesn't support multi-tenancy well
**Likelihood**: Medium
**Impact**: High
**Mitigation**: Prototype early, have Postgres fallback plan

### Risk: Python microservice adds too much complexity
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**: Evaluate if temporal features justify complexity

### Risk: Graphiti project becomes abandoned
**Likelihood**: Low
**Impact**: High
**Mitigation**: Check project activity, have migration plan, it's open source

### Risk: Performance doesn't scale to SaaS needs
**Likelihood**: Low-Medium
**Impact**: High
**Mitigation**: Benchmark early with realistic data volumes

---

## Informs These Decisions

**Blocks**:
- [[../technical/backend-architecture|TS-3: Backend Architecture]] - Python vs Node.js decision
- [[../technical/database-storage|TS-4: Database & Storage]] - Graph storage strategy
- [[../technical/vector-db|Q-TECH-004: Vector DB Selection]] - Integration approach

**Influences**:
- [[../technical/ai-integration|TS-9: AI Integration]] - MCP server design
- [[../features/temporal-queries|FT-5: Temporal Queries]] - Feature feasibility
- [[../business/development-timeline|BM-3: Development Timeline]] - Complexity impact

---

## Success Criteria for Decision

We can close this question when:
- [ ] Graphiti POC completed and evaluated
- [ ] Multi-tenancy approach validated or rejected
- [ ] Performance benchmarks meet requirements
- [ ] Deployment architecture designed
- [ ] Alternative solutions considered
- [ ] Cost analysis completed
- [ ] Clear recommendation: Use Graphiti, modify it, or pick alternative
- [ ] Migration path defined if we need to switch later

---

## Resources & References

### Graphiti
- GitHub: https://github.com/getzep/graphiti
- MCP Server: https://github.com/getzep/graphiti/tree/main/mcp_server
- OpenAI Cookbook: https://cookbook.openai.com/examples/partners/temporal_agents_with_knowledge_graphs
- Docs: [Check if available]

### Alternatives
- pgvector: https://github.com/pgvector/pgvector
- Apache AGE: https://age.apache.org
- Neo4j: https://neo4j.com
- LangGraph: https://python.langchain.com/docs/langgraph

### Multi-Tenancy Patterns
- Postgres RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- SaaS Multi-Tenancy: [Research articles needed]

---

## Current Leaning (Preliminary)

**Before research**:

**Use Graphiti IF**:
- Temporal queries are essential for MVP
- Python microservice complexity is acceptable
- Multi-tenancy can be solved with workspace_id filtering
- Performance meets benchmarks

**Skip Graphiti and use Postgres + pgvector IF**:
- Temporal queries can wait for v2
- Want simpler, single-database architecture
- Team prefers avoiding Python
- Multi-tenancy is cleaner with pure SQL

**Recommendation**: 1-week POC to answer multi-tenancy and performance questions definitively.

---

**Next Actions**:
1. Assign backend developer to Graphiti POC
2. Set up local Graphiti environment
3. Define multi-tenancy test scenarios
4. Schedule POC review: 2025-11-03

---

**Back to**: [[../INDEX|Decision Hub]] | [[Q-TECH-001|← Previous]] | [[Q-TECH-003|Next →]]
