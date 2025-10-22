---
type: planning
analysis_date: "2025-10-21"
status: active
priority: critical
tags:
  - planning
  - decisions
  - obsidian-first
  - reanalysis
---

# Decision Reanalysis - Obsidian-First Architecture

**Date**: 2025-10-21
**Context**: User decided to use Obsidian directly as the frontend, not build custom web app
**Impact**: Many decisions become obsolete or drastically simplified

---

## 🎯 Obsidian-First Impact on Decisions

### ✅ Decisions That Are NOW OBSOLETE (Obsidian Provides)

These decisions were about building features that **Obsidian already has**:

1. **TS-1: Frontend Framework** → ❌ OBSOLETE
   - Original: React vs Svelte?
   - **Now**: N/A - Obsidian is the frontend (Electron app)
   - **Action**: Move to [[future-web-version|Future Web Version]] decisions

2. **TS-2: Graph Visualization Library** → ❌ OBSOLETE
   - Original: React Flow vs Svelte Flow?
   - **Now**: ✅ DECIDED - Use Obsidian's native graph view
   - **Decision**: "It's all just built in"

3. **TS-5: Markdown Editor** → ❌ OBSOLETE
   - Original: TipTap vs CodeMirror?
   - **Now**: ✅ DECIDED - Use Obsidian's native editor
   - **Decision**: "User can basically sit in Obsidian and work on projects"

4. **FP-1: MVP Feature Set** → 🔄 SIMPLIFIED
   - Original: Which features to build?
   - **Now**: Most features provided by Obsidian, focus on:
     - MCP server integration
     - Claude-Flow agent rules
     - Task management (obsidian-tasks plugin)
     - Git workflow automation
   - **Action**: Rewrite feature list for Obsidian enhancement

---

### ✅ Decisions That Are NOW SIMPLE (Clear Answer)

These decisions have obvious answers with Obsidian-first:

5. **IR-1: Obsidian Integration** → ✅ DECIDED
   - Original: Plugin? Import/Export? Standalone?
   - **Now**: **USE OBSIDIAN DIRECTLY**
   - **Decision**: Weave-NN = Obsidian vault + Python backend

6. **FP-3: Collaboration Features** → 🔄 DEFERRED
   - Original: Real-time collab needed?
   - **Now**: Git-based initially (commit/push)
   - **Future**: CRDT via Supabase if needed
   - **Decision**: v1.0 = Solo + Git, v2.0+ = Multiplayer

7. **TS-3: Backend Architecture** → ✅ DECIDED
   - Original: Serverless vs Kubernetes?
   - **Now**: **Python API (local/VPS)** for MCP server
   - Simple FastAPI server, can scale later
   - **Decision**: Python FastAPI + MCP SDK

8. **TS-4: Database & Storage** → ✅ DECIDED
   - Original: PostgreSQL vs MongoDB?
   - **Now**: **Markdown files + Git + SQLite (embeddings)**
   - Obsidian reads markdown, Claude-Flow uses SQLite for memory
   - **Decision**: File-based with Git version control

9. **TS-6: Authentication** → 🔄 SIMPLIFIED
   - Original: Supabase Auth vs Auth0?
   - **Now**: Only needed for future multiplayer
   - **MVP**: No auth (local Obsidian)
   - **Future**: Google Auth when adding Supabase
   - **Decision**: Defer to v2.0 (multiplayer phase)

---

### ✅ Decisions That Are STILL RELEVANT (Backend Focus)

These decisions still matter because they're about the backend/MCP layer:

10. **ED-1: Project Scope** → ✅ STILL DECIDED
    - Decision: SaaS from day one
    - **Adjusted**: SaaS is future (v2.0+), MVP is local tool
    - **Rationale**: Prove value locally first, then add cloud features

11. **ED-2: Development Approach** → ✅ DECIDED
    - Decision: Solo + AI (60x speed with Claude-Flow)
    - **Confirmed**: 40 hrs/week, 2 weeks to MVP

12. **ED-3: Target Users** → ✅ DECIDED
    - Decision: Small dev teams + solo developers
    - **Confirmed**: Internal + client projects

13. **ED-4: Budget & Resources** → ✅ DECIDED
    - Decision: $1K-$5K, solo + AI
    - **Confirmed**: Minimal cost (just Claude API)

14. **BM-1: Monetization** → 🔄 ADJUSTED
    - Original: Freemium SaaS with pricing tiers
    - **Now**: Internal tool first, free for clients
    - **Future**: SaaS wrapper when ready
    - **Decision**: Phase 1 = internal, Phase 2+ = monetize

15. **BM-2: Open Source** → ✅ DECIDED
    - Decision: Closed source (secret sauce)
    - **Confirmed**: Backend/agents are proprietary

16. **FP-2: AI Integration Priority** → ✅ DECIDED
    - Decision: AI-first, MCP critical
    - **Confirmed**: MCP server is the entire MVP

17. **IR-2: Git Integration** → ✅ DECIDED
    - Decision: Git sync (auto-commit)
    - **Confirmed**: Git CLI + Python wrapper

18. **IR-3: Other Tool Integrations** → ✅ DECIDED
    - Decision: Discord, GitHub Issues, API
    - **Confirmed**: GitHub issue sync for tasks

---

## 🗑️ Features to Move to Future Web Version

These features were about building a **custom web app**. Move to `future-web-version.md`:

### Frontend Features (Obsidian Already Has)
- ❌ Knowledge graph visualization component → Obsidian native
- ❌ Markdown editor component → Obsidian native
- ❌ Wikilink autocomplete → Obsidian native
- ❌ Tag-based filtering → Obsidian native
- ❌ Syntax highlighting → Obsidian native
- ❌ Canvas/whiteboard → Obsidian native
- ❌ Daily notes → Obsidian native
- ❌ Templates → Obsidian native
- ❌ Theme customization → Obsidian native
- ❌ Mobile responsive → Obsidian has mobile app

### SaaS Features (Future v2.0+)
- ❌ User authentication (Supabase Auth)
- ❌ User permissions (workspace-based)
- ❌ Real-time collaboration (CRDT)
- ❌ Public/private sharing (web viewer)
- ❌ Comments & annotations (multiplayer)
- ❌ Team workspace features
- ❌ Billing & subscriptions (Stripe)
- ❌ Analytics dashboard
- ❌ Admin panel

### Infrastructure Features (Not Needed for MVP)
- ❌ Serverless deployment (Vercel/Cloud Run)
- ❌ Multi-tenancy architecture
- ❌ Rate limiting & quotas
- ❌ Monitoring & observability
- ❌ SOC2 compliance
- ❌ GDPR compliance tools

---

## ✅ Features to KEEP (Obsidian Enhancement)

These features **enhance** Obsidian with AI/automation:

### MVP Features (2 Weeks)
1. **MCP Server** (Week 1, Days 1-2)
   - Python FastAPI server
   - MCP SDK integration
   - File operation tools (create, read, update, delete)
   - Search tools (full-text, semantic)
   - Task tools (list, create, update, complete)

2. **Claude-Flow Integration** (Week 1, Days 3-4)
   - Agent rules (6 core rules)
   - Memory store (SQLite + embeddings)
   - Auto-linking suggestions
   - Auto-tagging suggestions
   - Duplicate detection

3. **Git Workflow** (Week 1, Day 5)
   - Auto-commit on save (optional)
   - Git CLI wrapper
   - Commit history viewer
   - GitHub issue sync (tasks → issues)

4. **Task Management** (Week 2, Days 8-9)
   - obsidian-tasks plugin integration
   - MCP task tools
   - Task query capabilities
   - Daily task summary (agent-generated)
   - Project health check

5. **Obsidian Properties** (Week 2, Days 10-11)
   - YAML frontmatter standards
   - Icon assignments (Lucide icons)
   - CSS classes for colors
   - Property validation

6. **Client Project Setup** (Week 2, Days 12-13)
   - Project vault templates
   - Per-client structure
   - Import existing data
   - Export/handoff tools

### Post-MVP Features (v1.1 - Month 2)
7. **Semantic Search** (embeddings-based)
8. **Advanced Auto-Linking** (context-aware)
9. **Daily Log Automation** (agent-generated summaries)
10. **Meeting Notes → Tasks** (auto-extraction)
11. **Custom Obsidian Plugin** (MCP status, agent monitor)
12. **Decision Dashboard** (canvas-based)

---

## 📋 Updated Decision Summary

### Decisions by Status

#### ✅ Decided (16 decisions)
1. ED-1: Project Scope → Internal tool first, SaaS later
2. ED-2: Development Approach → Solo + AI, 2 weeks
3. ED-3: Target Users → Small dev teams + solo devs
4. ED-4: Budget & Resources → $1K-$5K, minimal
5. TS-2: Graph Visualization → Obsidian native
6. TS-3: Backend Architecture → Python FastAPI + MCP
7. TS-4: Database & Storage → Markdown + Git + SQLite
8. TS-5: Markdown Editor → Obsidian native
9. FP-2: AI Integration Priority → AI-first, MCP critical
10. FP-3: Collaboration Features → Git-based initially
11. BM-1: Monetization → Internal/free, SaaS later
12. BM-2: Open Source → Closed source
13. IR-1: Obsidian Integration → Use Obsidian directly
14. IR-2: Git Integration → Auto-commit + issue sync
15. IR-3: Other Integrations → Discord, GitHub, API
16. TS-6: Authentication → Deferred to v2.0 (multiplayer)

#### ❌ Obsolete (Made Irrelevant by Obsidian)
1. TS-1: Frontend Framework → N/A (Obsidian is frontend)

#### 🔄 Simplified/Adjusted
1. FP-1: MVP Feature Set → Focus on MCP/AI, not UI

#### 📝 Still Open (But Lower Priority)
1. TR-1: Development Timeline → Need detailed 2-week plan
2. TR-2: Development Approach → Formalize methodology

---

## 🎯 New Scope Definition

### MVP Scope (2 Weeks)
**What We're Building**:
- Python MCP server (backend API)
- Claude-Flow agent integration (8 agents + 6 rules)
- Git workflow automation
- Task management (obsidian-tasks)
- Obsidian property standards (icons, colors)
- Client project templates

**What We're NOT Building**:
- ❌ Web frontend (Obsidian IS the frontend)
- ❌ Custom graph visualization
- ❌ Custom markdown editor
- ❌ Authentication system
- ❌ Multiplayer features
- ❌ SaaS infrastructure
- ❌ Billing/subscriptions
- ❌ Admin dashboard

**Total Effort**: 80 hours (2 weeks × 40 hours/week)

---

## 📐 Architecture Simplification

### Before (Custom Web App)
```
Next.js Frontend (React)
    ↓
React Flow (graph viz)
    ↓
TipTap Editor (markdown)
    ↓
REST API (Node.js/Python)
    ↓
PostgreSQL + Pinecone
    ↓
Supabase Auth
```
**Complexity**: High (6+ major components)
**Timeline**: 3-4 months
**Cost**: $235+/month

### After (Obsidian-First)
```
Obsidian Desktop (user interface)
    ↓
Markdown Files + Git (storage)
    ↓
Python MCP Server (backend)
    ↓
Claude-Flow Agents (AI)
    ↓
SQLite (embeddings)
```
**Complexity**: Low (3 major components)
**Timeline**: 2 weeks
**Cost**: $60/month

---

## 🚀 Next Steps

1. **Move obsolete features** to `future-web-version.md`
2. **Update feature list** to remove web app features
3. **Replan phases** for Obsidian-only approach
4. **Update MASTER-PLAN** with 2-week timeline
5. **Document Obsidian standards** (icons, colors, properties)
6. **Create 2-week sprint plan** (day-by-day tasks)

---

## 🔗 Related

- [[obsidian-first-architecture|Obsidian-First Architecture]]
- [[decision-review-2025-10-20|Original Decision Review]]
- [[future-web-version|Future Web Version Plan]] (to be created)
- [[MASTER-PLAN|Master Plan]] (to be updated)

---

**Status**: Active - Use this as new baseline
**Impact**: 70% scope reduction, 85% timeline reduction
**Risk**: Low (Obsidian is proven, stable)
