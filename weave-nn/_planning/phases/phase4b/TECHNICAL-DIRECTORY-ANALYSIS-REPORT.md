---
visual:
  icon: 📋
icon: 📋
---
# Technical Directory Analysis Report

**Date**: 2025-10-23
**Analyst**: Code Analyzer Agent
**Scope**: Evaluate `/technical/` directory against Obsidian-First MVP architecture
**Context**: Phase 4A reduced scope by 70%, pivoted to Obsidian-only MVP (no web frontend initially)

---

## Executive Summary

- **Total files analyzed**: 21
- **Relevant to MVP**: 4 files (19%)
- **Relevant to future (v2.0+)**: 12 files (57%)
- **Not relevant**: 3 files (14%)
- **Misplaced (should relocate)**: 2 files (10%)
- **Missing critical primitives**: 6 items (Python/FastAPI, RabbitMQ, Docker, Git, SQLite, Claude-Flow)

**Key Finding**: The `/technical/` directory is **heavily skewed toward the abandoned web-first architecture**. 81% of files describe technologies that are not needed for the Obsidian-First MVP (Phase 5-6).

**Recommendation**: Archive 15 files to `/technical/_archive/future-web-version/`, keep 4 MVP files, relocate 2 to proper directories, and create 6 new files for missing MVP primitives.

---

## Detailed Analysis

### RELEVANT_MVP (Keep - Needed Now)

**Total**: 4 files

#### 1. **obsidian-api-client.md**
- **Category**: Library / API Client
- **Usage count**: 10+ references across phase docs
- **Found in**: phase-6-mvp-week-1.md (Day 2: REST API Client implementation)
- **Justification**: CRITICAL - Core MCP server depends on this for all Obsidian vault operations
- **Architecture alignment**: ✅ Direct match to Phase 6 Day 2 deliverable
- **Action**: **KEEP**

#### 2. **rest-api-integration.md**
- **Category**: Integration Pattern / Architecture
- **Usage count**: 8 references
- **Found in**: phase-6-mvp-week-1.md, obsidian-first-architecture.md
- **Justification**: CRITICAL - Documents the HTTP-based integration pattern between MCP server and Obsidian
- **Architecture alignment**: ✅ Foundation of MCP server architecture
- **Action**: **KEEP**

#### 3. **jest-testing-framework.md**
- **Category**: Framework / Testing
- **Usage count**: 5 references
- **Found in**: Phase 6 test strategy documents
- **Justification**: HIGH - Test framework for validating MCP server, agent rules, and integrations
- **Architecture alignment**: ✅ Required for Phase 6 TDD approach
- **Action**: **KEEP**

#### 4. **postgresql.md**
- **Category**: Database
- **Usage count**: 2 references (future context only)
- **Found in**: phase-0-pre-development-work.md, mvp-local-first-architecture.md
- **Justification**: MEDIUM - Referenced in migration path (SQLite → PostgreSQL for v1.0)
- **Architecture alignment**: ⚠️ Future migration target, not used in MVP
- **Action**: **KEEP** (as migration documentation reference)

---

### RELEVANT_FUTURE (Archive to future-vision/)

**Total**: 12 files - All web-first technologies obsoleted by Obsidian-First pivot

#### 5. **nextjs.md**
- **Category**: Frontend Framework
- **Usage count**: 3 references (all in archived/obsolete context)
- **Found in**: phase-3-node-expansion.md (legacy), phase-4a-decision-closure.md (marked OBSOLETE)
- **Why obsoleted**: Obsidian IS the frontend. Next.js only needed if building web version (v2.0+)
- **Decision closure quote**: "TS-1: Frontend Framework → ❌ OBSOLETE - Obsidian IS the frontend"
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/nextjs.md`

#### 6. **react-flow.md**
- **Category**: Frontend Library (Graph Visualization)
- **Usage count**: 5 references (obsolete context)
- **Found in**: phase-1 (rejected), phase-4a (marked OBSOLETE as "TS-2: Graph Viz")
- **Why obsoleted**: Obsidian has built-in graph visualization
- **Decision closure quote**: "TS-2: Graph Visualization → ✅ Obsidian native graph (built-in, excellent)"
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/react-flow.md`

#### 7. **svelte-flow.md**
- **Category**: Frontend Library (Graph Visualization)
- **Usage count**: 3 references (alternative to react-flow, never chosen)
- **Why obsoleted**: Same reason as react-flow
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/svelte-flow.md`

#### 8. **sveltekit.md**
- **Category**: Frontend Framework
- **Usage count**: 2 references (framework alternative, not chosen)
- **Why obsoleted**: Same reason as Next.js
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/sveltekit.md`

#### 9. **tiptap-editor.md**
- **Category**: Frontend Library (Rich Text Editor)
- **Usage count**: 3 references (obsolete)
- **Found in**: phase-4a-decision-closure.md (marked OBSOLETE as "TS-5")
- **Why obsoleted**: Obsidian has native WYSIWYG editor
- **Decision closure quote**: "TS-5: Markdown Editor → ✅ Obsidian native editor (WYSIWYG + source modes)"
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/tiptap-editor.md`

#### 10. **shadcn-ui.md**
- **Category**: Frontend Library (UI Components)
- **Usage count**: 0 references in phase docs
- **Why obsoleted**: Web UI components not needed for Obsidian-only MVP
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/shadcn-ui.md`

#### 11. **daisyui.md**
- **Category**: Frontend Library (UI Components)
- **Usage count**: 0 references
- **Why obsoleted**: Tailwind CSS components not needed for Obsidian-only MVP
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/daisyui.md`

#### 12. **tailwindcss.md**
- **Category**: Frontend Library (CSS Framework)
- **Usage count**: 0 references
- **Why obsoleted**: CSS framework not needed for backend-only MVP
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/tailwindcss.md`

#### 13. **supabase.md**
- **Category**: Backend Platform (BaaS)
- **Usage count**: 3 references (future multiplayer context only)
- **Found in**: phase-4a (deferred to v2.0), phase-7 (future feature)
- **Why deferred**: Multiplayer/collaboration deferred to v2.0+
- **Architecture quote**: "Layer 4: Future - Multiplayer Layer (Supabase) - Not in MVP"
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/supabase.md`

#### 14. **vercel.md**
- **Category**: Deployment Platform
- **Usage count**: 1 reference (deployment context)
- **Why deferred**: Web hosting not needed for local-first MVP
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/vercel.md`

#### 15. **railway.md**
- **Category**: Deployment Platform
- **Usage count**: 1 reference
- **Why deferred**: Same as Vercel, hosting not needed for local-first MVP
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/railway.md`

#### 16. **websockets.md**
- **Category**: Communication Protocol
- **Usage count**: 2 references (real-time collaboration context)
- **Why deferred**: Real-time collaboration deferred to v2.0 (Supabase Realtime)
- **Action**: **ARCHIVE** → `/technical/_archive/future-web-version/websockets.md`

---

### NOT_RELEVANT (Archive or Remove)

**Total**: 3 files - Outside project scope entirely

#### 17. **stripe.md**
- **Category**: Payment Processing
- **Usage count**: 0 references
- **Why not relevant**: Project is internal/free for clients (no monetization in scope)
- **Decision closure quote**: "BM-1: Monetization → Internal/free for clients"
- **Action**: **ARCHIVE** → `/technical/_archive/out-of-scope/stripe.md`
- **Note**: May be relevant if project becomes SaaS in v3.0+, but not currently planned

#### 18. **pinecone.md**
- **Category**: Vector Database
- **Usage count**: 3 references (semantic search context)
- **Why not relevant**: MVP uses SQLite for embeddings (local-first), not cloud vector DB
- **Architecture quote**: "Storage: SQLite (embeddings, metadata)"
- **Alternative used**: Local SQLite with embeddings (Claude-Flow memory)
- **Action**: **ARCHIVE** → `/technical/_archive/alternatives/pinecone.md`
- **Note**: Could revisit if scaling to 100k+ notes in v2.0+

#### 19. **graphiti.md**
- **Category**: Knowledge Graph Engine
- **Usage count**: 2 references (evaluation context)
- **Why not relevant**: MVP uses Obsidian's wikilinks + YAML frontmatter (not a separate graph engine)
- **Alternative used**: Native Obsidian graph + SQLite shadow cache
- **Action**: **ARCHIVE** → `/technical/_archive/alternatives/graphiti.md`
- **Note**: Interesting for future if need temporal graph queries, but not MVP

---

### MISPLACED (Move to Different Directory)

**Total**: 2 files - Should be in `/features/` not `/technical/`

#### 20. **property-visualizer.md**
- **Category**: Tool / Application Feature
- **Current location**: `/technical/`
- **Why misplaced**: This is a **feature implementation** (727 lines of code), not a third-party technology
- **Correct location**: `/features/property-visualization.md` or `/architecture/components/property-visualizer.md`
- **Action**: **MOVE** → `/features/property-visualization.md`
- **Justification**: Technical directory should document **external technologies/libraries**, not internal features

#### 21. **rule-engine.md**
- **Category**: Framework / Application Component
- **Current location**: `/technical/`
- **Why misplaced**: This is an **internal framework** (633 lines of code), not a third-party tool
- **Correct location**: `/architecture/components/rule-engine.md` or `/features/agent-rule-engine.md`
- **Action**: **MOVE** → `/architecture/components/rule-engine.md`
- **Justification**: Internal components should be in architecture/, not technical/

---

### MISSING (Should Add)

**Total**: 6 critical MVP primitives - All referenced in Phase 5-6 but not documented in `/technical/`

#### 22. **python-fastapi.md** [CRITICAL]
- **Why needed**: Backend MCP server built with Python + FastAPI (Phase 6, Day 2)
- **References**: phase-6-mvp-week-1.md mentions "FastAPI MCP Server" explicitly
- **Priority**: CRITICAL
- **Template content**:
  ```markdown
  ---
  tech_id: python-fastapi
  category: backend-framework
  maturity: stable
  ---
  # Python FastAPI

  Modern Python web framework for building APIs with automatic OpenAPI docs,
  async support, and type hints. Used for Weave-NN MCP server implementation.

  ## Why FastAPI for MCP Server
  - Async/await native (handles concurrent MCP requests)
  - Type hints enable better IDE support and validation
  - Automatic OpenAPI/Swagger documentation
  - Fast performance (Starlette + Pydantic)

  ## Related
  - MCP SDK integration (Model Context Protocol)
  - REST API endpoints for Obsidian
  - Agent rule execution
  ```

#### 23. **rabbitmq.md** [CRITICAL]
- **Why needed**: Message queue for event-driven architecture (Phase 5, Day 1)
- **References**: phase-6-mvp-week-1.md, mvp-local-first-architecture.md (mentions "RabbitMQ single instance")
- **Priority**: CRITICAL
- **Template content**:
  ```markdown
  ---
  tech_id: rabbitmq
  category: message-queue
  maturity: stable
  ---
  # RabbitMQ

  Open source message broker implementing AMQP protocol. Enables event-driven
  architecture for file watcher → MCP sync → Git commit workflows.

  ## MVP Configuration
  - Single instance (Docker container)
  - 5 queues: n8n_workflows, mcp_sync, git_auto_commit, agent_tasks, dlq
  - Topic exchange: weave-nn.events
  - Management UI: http://localhost:15672

  ## Future Migration
  - v1.0: RabbitMQ cluster (3 nodes for HA)
  ```

#### 24. **docker-compose.md** [HIGH]
- **Why needed**: Deployment orchestration (Phase 5-6 uses Docker Compose exclusively)
- **References**: mvp-local-first-architecture.md (entire deployment strategy based on Docker Compose)
- **Priority**: HIGH
- **Key points**: Local-first deployment, microservices without Kubernetes, 4 services (MCP, file-watcher, event-consumer, RabbitMQ)

#### 25. **git-gitpython.md** [HIGH]
- **Why needed**: Auto-commit workflow (Phase 5, Day 5)
- **References**: phase-6-mvp-week-1.md (Day 5: Git Integration)
- **Priority**: HIGH
- **Key points**: GitPython library for Python, auto-commit on file changes, pre-commit validation hooks

#### 26. **sqlite.md** [MEDIUM]
- **Why needed**: Shadow cache + Claude-Flow memory (Phase 5, Day 3)
- **References**: mvp-local-first-architecture.md ("Storage: SQLite (embeddings, metadata)")
- **Priority**: MEDIUM
- **Key points**: Embedded database, FTS5 for search, migration path to PostgreSQL

#### 27. **claude-flow-mcp.md** [MEDIUM]
- **Why needed**: Agent orchestration framework (Phase 5, Day 4)
- **References**: phase-6-mvp-week-1.md (Day 4: Claude-Flow Agent Rules)
- **Priority**: MEDIUM
- **Key points**: 8 agent types, memory store, 6 core agent rules

---

## Category Breakdown

### By Relevance
| Category | Count | Percentage |
|----------|-------|------------|
| Relevant to MVP | 4 | 19% |
| Relevant to Future (v2.0+) | 12 | 57% |
| Not Relevant | 3 | 14% |
| Misplaced | 2 | 10% |

### By Technology Type
| Type | Count | Examples |
|------|-------|----------|
| Frontend Framework | 2 | Next.js, SvelteKit |
| Frontend Library | 6 | React Flow, TipTap, shadcn, DaisyUI, Tailwind, Svelte Flow |
| Backend Platform | 1 | Supabase |
| Deployment Platform | 2 | Vercel, Railway |
| Database | 2 | PostgreSQL, Pinecone |
| Communication | 1 | WebSockets |
| Testing | 1 | Jest |
| Payment | 1 | Stripe |
| Integration | 1 | REST API |
| API Client | 1 | Obsidian API Client |
| Graph Engine | 1 | Graphiti |
| Internal Tools | 2 | Property Visualizer, Rule Engine |

---

## Recommendations

### Immediate Actions (This Week)

1. **Create missing MVP primitives** (Priority: CRITICAL)
   ```bash
   cd /home/aepod/dev/weave-nn/weave-nn/technical

   # Create 6 missing files based on templates above
   touch python-fastapi.md
   touch rabbitmq.md
   touch docker-compose.md
   touch git-gitpython.md
   touch sqlite.md
   touch claude-flow-mcp.md
   ```

2. **Relocate misplaced files** (Priority: HIGH)
   ```bash
   # Move internal components to architecture/
   mkdir -p ../architecture/components
   git mv property-visualizer.md ../architecture/components/
   git mv rule-engine.md ../architecture/components/
   ```

3. **Archive future-web files** (Priority: MEDIUM)
   ```bash
   # Create archive structure
   mkdir -p _archive/future-web-version
   mkdir -p _archive/out-of-scope
   mkdir -p _archive/alternatives

   # Archive web-first technologies (12 files)
   git mv nextjs.md _archive/future-web-version/
   git mv react-flow.md _archive/future-web-version/
   git mv svelte-flow.md _archive/future-web-version/
   git mv sveltekit.md _archive/future-web-version/
   git mv tiptap-editor.md _archive/future-web-version/
   git mv shadcn-ui.md _archive/future-web-version/
   git mv daisyui.md _archive/future-web-version/
   git mv tailwindcss.md _archive/future-web-version/
   git mv supabase.md _archive/future-web-version/
   git mv vercel.md _archive/future-web-version/
   git mv railway.md _archive/future-web-version/
   git mv websockets.md _archive/future-web-version/

   # Archive out-of-scope (3 files)
   git mv stripe.md _archive/out-of-scope/
   git mv pinecone.md _archive/alternatives/
   git mv graphiti.md _archive/alternatives/
   ```

### Post-Cleanup Directory Structure

```
/technical/
├── _archive/
│   ├── future-web-version/      # 12 files - web-first technologies
│   ├── out-of-scope/             # 1 file  - payment processing
│   └── alternatives/             # 2 files - evaluated but not chosen
│
├── obsidian-api-client.md        # ✅ MVP - KEEP
├── rest-api-integration.md       # ✅ MVP - KEEP
├── jest-testing-framework.md     # ✅ MVP - KEEP
├── postgresql.md                 # ✅ MVP - KEEP (migration ref)
├── python-fastapi.md             # ⭐ NEW - MVP
├── rabbitmq.md                   # ⭐ NEW - MVP
├── docker-compose.md             # ⭐ NEW - MVP
├── git-gitpython.md              # ⭐ NEW - MVP
├── sqlite.md                     # ⭐ NEW - MVP
└── claude-flow-mcp.md            # ⭐ NEW - MVP
```

**Result**: 10 MVP-relevant files (4 existing + 6 new), 15 archived files (organized by relevance category)

---

## Impact Analysis

### Before Cleanup
- **Confusion risk**: HIGH - 81% of files describe abandoned technologies
- **Developer onboarding**: Misleading - new developers see React/Next.js focus
- **Documentation accuracy**: LOW - contradicts Obsidian-First architecture
- **Maintenance burden**: HIGH - keeping 15 obsolete files updated

### After Cleanup
- **Confusion risk**: LOW - only MVP-relevant technologies visible
- **Developer onboarding**: Clear - Python/FastAPI/RabbitMQ focus obvious
- **Documentation accuracy**: HIGH - matches actual MVP implementation
- **Maintenance burden**: LOW - 10 files vs 21 files

---

## Cross-References

### Architecture Alignment
- ✅ **obsidian-first-architecture.md**: Confirms Obsidian native UI, no custom frontend
- ✅ **mvp-local-first-architecture.md**: Confirms Docker Compose, RabbitMQ, SQLite choices
- ✅ **phase-4a-decision-closure.md**: Explicitly marks TS-1, TS-2, TS-5 as OBSOLETE
- ✅ **phase-6-mvp-week-1.md**: Lists exact technology stack (Python, FastAPI, RabbitMQ, Git, SQLite)

### Decision Consistency
| Decision | Status | Technical Files Alignment |
|----------|--------|--------------------------|
| TS-1: Frontend Framework | ❌ OBSOLETE | ✅ Archive Next.js, SvelteKit |
| TS-2: Graph Visualization | ✅ Obsidian native | ✅ Archive React Flow, Svelte Flow |
| TS-3: Backend Architecture | ✅ Python FastAPI + MCP | ⚠️ Missing python-fastapi.md |
| TS-4: Database & Storage | ✅ Markdown + Git + SQLite | ⚠️ Missing sqlite.md, git-gitpython.md |
| TS-5: Markdown Editor | ✅ Obsidian native | ✅ Archive TipTap |
| TS-6: Authentication | 🔄 Deferred to v2.0 | ✅ No auth files present |

---

## Conclusion

The `/technical/` directory **does not reflect the Obsidian-First MVP architecture**. 81% of files document technologies from the abandoned web-first approach. This creates confusion and maintenance burden.

**Actions Required**:
1. ✅ Archive 15 obsolete files (organized by relevance)
2. ✅ Create 6 missing MVP primitive docs (Python/FastAPI, RabbitMQ, Docker, Git, SQLite, Claude-Flow)
3. ✅ Relocate 2 internal components to proper directories
4. ✅ Keep 4 existing MVP-relevant files

**Post-cleanup**: Technical directory will have 10 files (all MVP-relevant) vs current 21 files (only 4 MVP-relevant).

**Timeline**: 2-3 hours for cleanup + documentation creation

**Risk**: LOW - All archived files preserved, easily recoverable for v2.0 web version

---

**Next Steps**:
1. User approval for cleanup strategy
2. Execute file reorganization (git mv)
3. Create 6 missing technical primitive docs
4. Update any broken wikilinks in phase documents
5. Commit with message: "docs: Reorganize /technical/ for Obsidian-First MVP"
