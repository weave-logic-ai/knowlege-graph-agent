---
question_id: "Q-TECH-004"
question_type: "technical"
title: "Vector Database Selection for Semantic Search"
status: "open"
priority: "medium"
category: "backend"

created_date: "2025-10-20"
last_updated: "2025-10-20"
due_date: "2025-11-10"

assigned_to: "Backend Team"
stakeholders:
  - "AI Integration Team"
  - "Data Team"
  - "Infrastructure Team"
ai_assisted: true

related_decisions:
  - "TS-4"  # Database & Storage
  - "Q-TECH-002"  # Graphiti integration (affects vector DB choice)
  - "ED-1"  # Project Scope (SaaS)

research_tasks:
  - "Benchmark pgvector vs Pinecone vs Qdrant"
  - "Test semantic search quality with OpenAI embeddings"
  - "Evaluate multi-tenancy and data isolation"
  - "Compare costs at different scales (1k, 10k, 100k docs)"
  - "Test integration with Graphiti (if used)"
  - "Assess Google Cloud Vertex AI Vector Search"
  - "Prototype hybrid search (vector + lexical)"

tags:
  - technical
  - backend
  - medium-priority
  - research-needed
  - search
---

# Q-TECH-004: Vector Database Selection for Semantic Search

**Status**: 🔍 **OPEN - Research Needed**
**Priority**: 🟠 **MEDIUM** (becomes HIGH if Graphiti not used)

---

## The Question

Which vector database should we use for semantic search in Weave-NN, and should it be integrated with our primary database or run as a separate service?

### Sub-questions:
1. pgvector (Postgres extension) vs dedicated vector DB (Pinecone, Qdrant, etc.)?
2. Does Graphiti's built-in vector search meet our needs, or do we need separate vector DB?
3. How do we handle multi-tenant vector data isolation?
4. What's the cost at scale (10k, 100k, 1M+ documents)?
5. How does Google Cloud Vertex AI Vector Search fit in?

---

## Context from Analysis

### From Custom Solution Analysis

**Recommended options varied by stack**:

**React Stack**:
- "pgvector or Pinecone" for semantic search

**Svelte Stack**:
- "Supabase pgvector" built-in

**Graphiti Stack**:
- Graphiti includes vector search internally
- Question: Is Graphiti's vector search sufficient?

**Use cases for vector search**:
- Semantic document similarity ("find related docs")
- Auto-linking suggestions
- AI-powered search (meaning, not just keywords)
- Duplicate/similar document detection
- Tag suggestions based on content

---

## Vector Database Candidates

### Option 1: pgvector (Postgres Extension) ⭐

**What it is**: Postgres extension adding vector similarity search

**Architecture**:
```
PostgreSQL
├── Regular tables (documents, metadata)
├── pgvector extension
└── Embeddings stored as vector columns
```

**Pros**:
- Same database as main data (no separate service)
- Simple deployment (just enable extension)
- ACID transactions with vectors + metadata
- No additional cost (included in Postgres)
- Works with Supabase (managed Postgres)
- Multi-tenancy via standard Postgres RLS
- Backup/restore same as main DB

**Cons**:
- Performance may not match dedicated vector DBs at huge scale
- Limited vector-specific features vs specialized DBs
- Index types limited (HNSW, IVFFlat)
- Not optimized purely for vector operations

**Best for**:
- Unified database architecture
- Cost-conscious SaaS
- Up to ~1M vectors (should be fine for most use cases)
- When using Supabase

**Google Cloud fit**:
- Cloud SQL supports pgvector
- AlloyDB (managed Postgres) supports pgvector

---

### Option 2: Pinecone (Managed Vector DB)

**What it is**: Fully managed vector database service

**Architecture**:
```
PostgreSQL              Pinecone
├── Documents           ├── Document vectors
├── Metadata            ├── Metadata (limited)
└── (no vectors)        └── Search indexes
```

**Pros**:
- Purpose-built for vector search
- Excellent performance at scale (billions of vectors)
- Fully managed (no infrastructure)
- Advanced features (hybrid search, filtering)
- Auto-scaling
- Low latency globally

**Cons**:
- Additional service to manage
- Cost adds up (per vector storage + queries)
- Data split across two databases
- Vendor lock-in
- Need to sync metadata between Postgres and Pinecone

**Cost** (as of 2025):
- Free: 1 index, 100k vectors
- Starter: ~$70/month (1 pod, 5M vectors)
- Scale: $200-500+/month

**Best for**:
- Large scale (millions of vectors)
- Need absolute best performance
- Budget for managed service

**Google Cloud fit**:
- Runs anywhere (cloud-agnostic)
- No special GCP integration

---

### Option 3: Qdrant (Open Source Vector DB)

**What it is**: Open source vector search engine (can self-host or use Qdrant Cloud)

**Architecture**:
```
PostgreSQL              Qdrant
├── Documents           ├── Document vectors
├── Metadata            ├── Payload (metadata)
└── (no vectors)        └── HNSW indexes
```

**Pros**:
- Open source (Apache 2.0)
- Can self-host (Docker, Kubernetes)
- Rich filtering and payload support
- Good performance
- Managed cloud option available
- API-first design

**Cons**:
- Another service to deploy (if self-hosted)
- Self-hosting adds operational overhead
- Managed cloud costs similar to Pinecone
- Smaller community than Pinecone

**Cost**:
- Self-hosted: Infrastructure only (~$20-100/month for Cloud Run)
- Qdrant Cloud: Similar to Pinecone pricing

**Best for**:
- Want open source + control
- Can manage infrastructure
- Avoid vendor lock-in

**Google Cloud fit**:
- Can deploy on Cloud Run, GKE
- No native GCP integration

---

### Option 4: Vertex AI Vector Search (Google Cloud Native)

**What it is**: Google's managed vector search service

**Architecture**:
```
PostgreSQL              Vertex AI Vector Search
├── Documents           ├── Document vectors
├── Metadata            ├── Embeddings
└── (no vectors)        └── Matching Engine
```

**Pros**:
- Native GCP integration
- Scales to billions of vectors
- Fast (optimized by Google)
- Integrates with Vertex AI (embeddings, models)
- Good for GCP-first architecture

**Cons**:
- GCP lock-in
- Pricing can be complex
- Less mature than Pinecone
- Documentation not as extensive

**Cost**:
- Pay for index size + queries
- ~$0.30/hour per index (always-on)
- Query costs separate
- Can be expensive at scale

**Best for**:
- All-in on Google Cloud
- Need GCP service integration
- Large scale within GCP

**Google Cloud fit**:
- ✅✅ Perfect fit (native service)

---

### Option 5: Weaviate (Open Source)

**What it is**: Open source vector database with GraphQL API

**Pros**:
- Open source
- GraphQL API (modern)
- Hybrid search (vector + keyword)
- Modular (use different embedding models)

**Cons**:
- Another service to deploy
- Less popular than Qdrant/Pinecone
- Community smaller

**Best for**:
- Want GraphQL
- Need flexibility in embeddings

---

### Option 6: Use Graphiti's Built-in Vector Search

**What it is**: If we use Graphiti (Q-TECH-002), it includes vector search

**Pros**:
- No separate vector DB needed
- Integrated with graph queries
- Simplified architecture
- Unified hybrid search (vector + BM25 + graph)

**Cons**:
- Dependent on Graphiti decision
- Less control over vector indexing
- Performance unknown compared to dedicated vector DBs
- Multi-tenancy concerns (same as Graphiti)

**Research needed**:
- Is Graphiti's vector search production-ready?
- Performance at scale?
- Can we customize embedding models?

**Decision dependency**:
- **IF Graphiti is used AND vector search is good** → No separate vector DB needed
- **IF Graphiti not used OR vector search insufficient** → Need dedicated vector DB

---

## Key Evaluation Criteria

### 1. Integration Architecture

**Question**: Single database vs separate service?

**Option A: Unified (pgvector)**
```
┌─────────────────────┐
│    PostgreSQL       │
│  ┌───────────────┐  │
│  │   Documents   │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │  Embeddings   │  │
│  │  (pgvector)   │  │
│  └───────────────┘  │
└─────────────────────┘
```
**Pros**: Simple, ACID, single backup
**Cons**: May not scale to billions of vectors

---

**Option B: Separate Service (Pinecone/Qdrant/Vertex)**
```
┌──────────────┐       ┌──────────────┐
│  PostgreSQL  │       │  Vector DB   │
│  Documents   │       │  Embeddings  │
└──────────────┘       └──────────────┘
        ↑                      ↑
        └──────────────────────┘
              Keep in sync
```
**Pros**: Optimized performance, scale independently
**Cons**: Two services, sync complexity

---

### 2. Multi-Tenancy & Data Isolation

**Critical for SaaS**: Workspace data must be isolated

**pgvector approach**:
```sql
-- Add workspace_id to embeddings table
CREATE TABLE document_embeddings (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL,
  document_id uuid NOT NULL,
  embedding vector(1536),
  metadata jsonb
);

-- Row-level security
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation ON document_embeddings
  USING (workspace_id = current_setting('app.workspace_id')::uuid);
```
**Pros**: Built-in Postgres RLS, same as main data
**Cons**: None (this is straightforward)

---

**Pinecone approach**:
```javascript
// Use namespaces for workspaces
await index.namespace(`workspace-${workspaceId}`).upsert([...vectors]);

// Or metadata filtering
await index.query({
  vector: queryVector,
  filter: { workspace_id: workspaceId }
});
```
**Pros**: Namespaces provide isolation
**Cons**: Must ensure filtering on every query

---

**Research tasks**:
- [ ] Verify pgvector RLS performance impact
- [ ] Test Pinecone namespace isolation
- [ ] Compare query latency with/without filtering

---

### 3. Performance & Scale

**Benchmark requirements**:

| Scenario | Documents | Vectors | Test |
|----------|-----------|---------|------|
| **MVP** | 1,000 | 1,000 | Insert + search latency |
| **Growth** | 10,000 | 10,000 | Search quality + speed |
| **Scale** | 100,000 | 100,000 | Concurrent queries |
| **Enterprise** | 1,000,000 | 1,000,000 | Multi-tenant load |

**Metrics to measure**:
- Insert latency (per vector)
- Search latency (p50, p95, p99)
- Recall accuracy (quality of results)
- Memory usage
- Cost per query

**Research tasks**:
- [ ] Benchmark pgvector with 10k, 100k vectors
- [ ] Compare search quality (precision@k)
- [ ] Test concurrent query performance

---

### 4. Cost Analysis

**Assumptions**:
- 10,000 documents (typical workspace at scale)
- 1,536-dimensional embeddings (OpenAI ada-002 or similar)
- 1,000 searches per day per workspace
- 100 workspaces (SaaS growth scenario)

**pgvector (Cloud SQL or Supabase)**:
- Storage: ~60MB per 10k vectors (1536 dimensions)
- Cost: $0 extra (included in Postgres storage)
- 100 workspaces = 6GB storage = ~$1-2/month (negligible)
- Total: **~$0-5/month** (part of DB cost)

**Pinecone**:
- Storage: ~100 pods for 100M vectors (100 workspaces × 1M vectors each)
- Starter plan: $70/month covers ~5M vectors
- 100 workspaces × 10k vectors = 1M vectors = $70/month
- Queries: Included in plan (reasonable limits)
- Total: **~$70-200/month**

**Qdrant (self-hosted on Cloud Run)**:
- Cloud Run instance: ~$50-100/month (always-on)
- Storage: GCS for persistence ~$5/month
- Total: **~$55-105/month**

**Vertex AI Vector Search**:
- Index cost: ~$0.30/hour = $216/month per index
- Multiple indexes for workspaces?
- Query costs additional
- Total: **~$200-500+/month** (can get expensive)

**Winner on cost**: pgvector (by far)

---

### 5. Search Quality & Features

**Features comparison**:

| Feature | pgvector | Pinecone | Qdrant | Vertex AI |
|---------|----------|----------|--------|-----------|
| **Vector similarity** | ✅ | ✅✅ | ✅✅ | ✅✅ |
| **Hybrid search (vector+lexical)** | ⚠️ Manual | ✅ | ✅ | ✅ |
| **Metadata filtering** | ✅ (SQL) | ✅ | ✅✅ | ✅ |
| **Approximate search (HNSW)** | ✅ | ✅ | ✅ | ✅ |
| **Real-time updates** | ✅ | ✅ | ✅ | ⚠️ |
| **Similarity metrics** | L2, Cosine, IP | L2, Cosine, IP | L2, Cosine, IP | L2, Cosine |

**Research tasks**:
- [ ] Test search quality with same embeddings across DBs
- [ ] Implement hybrid search with pgvector (combine with Postgres full-text)
- [ ] Compare result relevance

---

### 6. Google Cloud Integration

**Given ED-1 decision** (GCP deployment):

**pgvector**:
- ✅ Cloud SQL (managed Postgres) supports pgvector
- ✅ AlloyDB supports pgvector
- ✅ Easy integration with Cloud Run, GKE

**Pinecone**:
- ⚠️ Cloud-agnostic (no special GCP features)
- ✅ Can use from GCP (just API calls)

**Qdrant**:
- ✅ Deploy on Cloud Run, GKE
- ⚠️ Self-managed (ops overhead)

**Vertex AI Vector Search**:
- ✅✅ Native GCP service
- ✅ Integrates with Vertex AI (embeddings, models)
- ⚠️ More expensive, GCP lock-in

**Best GCP fit**: pgvector (Cloud SQL) or Vertex AI Vector Search

---

## Dependency on Q-TECH-002 (Graphiti)

**IF Graphiti is used**:
- Graphiti includes vector search
- Test if Graphiti's vector search meets needs
- **IF sufficient** → No separate vector DB needed
- **IF insufficient** → Add pgvector or dedicated vector DB

**IF Graphiti is NOT used**:
- Definitely need vector DB
- Recommendation: **pgvector** (cost, simplicity)

**Decision flow**:
```
Q-TECH-002: Use Graphiti?
    ├── YES → Test Graphiti vector search
    │         ├── Good → Use Graphiti built-in
    │         └── Insufficient → Add pgvector
    └── NO → Use pgvector (default)
```

---

## Recommended Approach

### Phase 1: Start with pgvector (Default)

**Rationale**:
- Lowest cost ($0 extra)
- Simplest architecture (single DB)
- Good enough for 99% of use cases (<1M vectors)
- Easy multi-tenancy (Postgres RLS)
- GCP native (Cloud SQL)

**Implementation**:
```sql
-- Enable pgvector extension
CREATE EXTENSION vector;

-- Create embeddings table
CREATE TABLE document_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  document_id uuid NOT NULL REFERENCES documents(id),
  embedding vector(1536),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create HNSW index for fast similarity search
CREATE INDEX ON document_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- Enable RLS
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
```

**Migration path**:
- If we outgrow pgvector (>1M vectors, performance issues), migrate to Pinecone or Vertex AI
- Data export is straightforward (vectors are just arrays)

---

### Phase 2: Evaluate Graphiti Vector Search (IF using Graphiti)

**IF Q-TECH-002 decides to use Graphiti**:
- [ ] Test Graphiti's built-in vector search
- [ ] Compare with standalone pgvector
- [ ] Decide: use Graphiti's or keep separate pgvector?

**Potential outcome**:
- Use Graphiti for graph queries + vector search
- Remove standalone pgvector if redundant

---

### Phase 3: Scale to Dedicated Vector DB (IF NEEDED)

**Migrate to Pinecone or Vertex AI if**:
- Vectors exceed 1M per workspace
- Search latency becomes unacceptable (>100ms p95)
- Need advanced features (e.g., complex hybrid search)

**Migration is low-risk**:
- Export vectors from pgvector
- Import to new vector DB
- Update API calls
- Gradual rollout per workspace

---

## Trade-off Matrix

| Factor | pgvector | Pinecone | Qdrant (self) | Vertex AI | Graphiti Built-in |
|--------|----------|----------|---------------|-----------|-------------------|
| **Cost** | ✅✅ $0-5/mo | ❌ $70+/mo | ⚠️ $50+/mo | ❌ $200+/mo | ✅✅ Included |
| **Simplicity** | ✅✅ Same DB | ⚠️ Extra service | ⚠️ Self-host | ⚠️ Extra service | ✅✅ Integrated |
| **Performance** | ✅ Good (<1M) | ✅✅ Excellent | ✅✅ Excellent | ✅✅ Excellent | ⚠️ Unknown |
| **Scale** | ⚠️ <1M vectors | ✅✅ Billions | ✅✅ Billions | ✅✅ Billions | ⚠️ Unknown |
| **Multi-tenancy** | ✅✅ Postgres RLS | ✅ Namespaces | ✅ Collections | ✅ Filtering | ⚠️ TBD |
| **GCP Integration** | ✅✅ Cloud SQL | ⚠️ None | ⚠️ Self-deploy | ✅✅ Native | ⚠️ Deploy on GCP |
| **Vendor lock-in** | ✅ Open (Postgres) | ❌ Pinecone | ✅ Open source | ❌ GCP | ✅ Open source |
| **Maturity** | ✅✅ Proven | ✅✅ Proven | ✅ Good | ⚠️ Newer | ⚠️ Unknown |

---

## Risks & Mitigations

### Risk: pgvector doesn't scale to our needs
**Likelihood**: Low (most SaaS won't hit 1M vectors)
**Impact**: Medium (need to migrate)
**Mitigation**: Start with pgvector, monitor performance, migrate if needed

### Risk: Graphiti's vector search is insufficient
**Likelihood**: Medium (new project)
**Impact**: Medium (need separate vector DB)
**Mitigation**: Test Graphiti early, fallback to pgvector

### Risk: Search quality is poor
**Likelihood**: Low (depends on embeddings, not DB)
**Impact**: High (core feature broken)
**Mitigation**: Test with real data early, compare search quality across DBs

### Risk: Costs spiral with dedicated vector DB
**Likelihood**: Medium (Pinecone/Vertex can get expensive)
**Impact**: High (SaaS margins)
**Mitigation**: Start with pgvector, only upgrade if absolutely necessary

---

## Research Tasks Breakdown

### Week 1: pgvector Baseline
- [ ] Set up Postgres with pgvector
- [ ] Create sample embeddings (1k, 10k documents)
- [ ] Benchmark search latency
- [ ] Test multi-tenancy with RLS
- [ ] Implement hybrid search (vector + full-text)

### Week 2: Graphiti Evaluation (IF using Graphiti)
- [ ] Test Graphiti's vector search
- [ ] Compare with pgvector performance
- [ ] Evaluate ease of use
- [ ] Decide: use Graphiti's or separate pgvector?

### Week 3: Alternative Testing (IF pgvector insufficient)
- [ ] Set up Pinecone or Qdrant trial
- [ ] Import same dataset
- [ ] Compare performance and cost
- [ ] Test GCP Vertex AI Vector Search

### Week 4: Final Decision
- [ ] Compile benchmarks
- [ ] Cost projection at scale
- [ ] Make recommendation
- [ ] Document migration path (if needed later)

---

## Informs These Decisions

**Blocked by**:
- [[Q-TECH-002|Q-TECH-002: Graphiti Integration]] - May include vector search

**Blocks**:
- [[../features/semantic-search|FT-1: Semantic Search]] - Implementation approach
- [[../features/auto-linking|FT-2: Auto-linking]] - Vector similarity queries

**Influences**:
- [[../technical/ai-integration|TS-9: AI Integration]] - Embedding generation
- [[../business/costs|BM-4: Infrastructure Costs]] - Vector DB costs

---

## Success Criteria for Decision

We can close this question when:
- [ ] pgvector benchmarked with realistic data
- [ ] Graphiti vector search evaluated (if using Graphiti)
- [ ] Search quality validated
- [ ] Multi-tenancy tested
- [ ] Cost projections at scale calculated
- [ ] GCP deployment validated
- [ ] Clear recommendation documented
- [ ] Migration path defined (if we need to change later)

---

## Resources & References

### pgvector
- GitHub: https://github.com/pgvector/pgvector
- Docs: https://github.com/pgvector/pgvector#readme
- Supabase pgvector: https://supabase.com/docs/guides/ai/vector-search
- Cloud SQL pgvector: https://cloud.google.com/blog/products/databases/introducing-pgvector-for-cloud-sql-for-postgresql

### Pinecone
- Docs: https://docs.pinecone.io
- Pricing: https://www.pinecone.io/pricing/

### Qdrant
- Docs: https://qdrant.tech/documentation/
- GitHub: https://github.com/qdrant/qdrant

### Vertex AI Vector Search
- Docs: https://cloud.google.com/vertex-ai/docs/matching-engine/overview
- Pricing: https://cloud.google.com/vertex-ai/pricing#matching-engine

### Benchmarks
- pgvector vs alternatives: [Research needed]
- Vector DB comparison 2025: [Research needed]

---

## Current Leaning (Preliminary)

**Recommendation: Start with pgvector**

**Rationale**:
- Zero cost (included in Postgres)
- Simple architecture (single database)
- Good performance for expected scale (<100k docs per workspace)
- Multi-tenancy via Postgres RLS (proven)
- GCP native (Cloud SQL supports pgvector)
- Easy migration path if we outgrow it

**Fallback plan**:
- IF Graphiti has good vector search → Use Graphiti's
- IF pgvector insufficient at scale → Migrate to Pinecone or Vertex AI

**Decision**: Start simple, scale when needed.

---

**Next Actions**:
1. Set up pgvector in dev environment
2. Create sample embeddings dataset
3. Benchmark search performance
4. Test multi-tenant queries
5. Wait for Q-TECH-002 decision (Graphiti)
6. Final decision: 2025-11-10

---

**Back to**: [[../INDEX|Decision Hub]] | [[Q-TECH-003|← Previous]] | [[Q-TECH-005|Next →]]
