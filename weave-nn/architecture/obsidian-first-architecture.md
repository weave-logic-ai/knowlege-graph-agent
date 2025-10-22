---
# Node Metadata
type: architecture
status: active
priority: critical
created_date: "2025-10-21"
updated_date: "2025-10-21"

# Architecture-Specific
architecture_id: "A-005"
architecture_name: "Obsidian-First Architecture"
category: system-architecture
decided_date: "2025-10-21"

# Scope
scope:
  current_phase: "mvp"
  obsidian_only: true
  web_version_needed: false
  deferred: false

# Relationships
relationships:
  related_decisions:
    - "ED-1"
    - "TS-2"
    - "TS-3"
    - "TS-4"
    - "TS-5"
    - "IR-1"
  related_features:
    - "knowledge-graph-visualization"
    - "markdown-editor-component"
    - "basic-ai-integration-mcp"

# Visual
visual:
  icon: "layout-grid"
  cssclasses:
    - type-architecture
    - scope-mvp
    - priority-critical

# Tags
tags:
  - scope/mvp
  - scope/obsidian-only
  - type/architecture
  - status/active
  - priority/critical
  - tech/obsidian
  - tech/python
  - tech/mcp
  - tech/claude-flow
  - category/architecture
---

# Obsidian-First Architecture

**Core Principle**: Weave-NN **IS** an Obsidian vault enhanced with AI agents, not a separate application that integrates with Obsidian.

**Decided**: 2025-10-21
**Timeline Impact**: Reduces MVP from 3-4 months to **2 weeks**

---

## 🎯 Architectural Decision

**Weave-NN = Obsidian Vault + Python MCP Server + Claude-Flow Agents**

Users work **directly in Obsidian**. Weave-NN provides:
1. Backend Python API (MCP interface)
2. Claude-Flow agent rules and workflows
3. Task/project management integration
4. Git workflow automation
5. Future: Multiplayer via Supabase CRDT

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                           │
│                    (Obsidian Desktop)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Graph View  │  │ Editor       │  │ Task Manager │      │
│  │ (Built-in)  │  │ (Built-in)   │  │ (Plugin)     │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                  ┌─────────▼──────────┐
                  │  Obsidian Vault    │
                  │  (Markdown Files)  │
                  │  - Local Files     │
                  │  - Git Tracked     │
                  └─────────┬──────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────────┐
│ Python MCP     │  │ Claude-Flow  │  │ Git Integration  │
│ Server         │  │ Agents       │  │ (CLI/Scripts)    │
│                │  │              │  │                  │
│ - File Ops     │  │ - 8 Workers  │  │ - Auto-commit    │
│ - Search       │  │ - Memory     │  │ - Issue sync     │
│ - AI Tasks     │  │ - Rules      │  │ - Workflow       │
└────────────────┘  └──────────────┘  └──────────────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            ▼
                  ┌──────────────────┐
                  │ Storage Layer    │
                  ├──────────────────┤
                  │ • Markdown Files │
                  │ • SQLite (CF)    │
                  │ • Git Repo       │
                  │ • Embeddings     │
                  └──────────────────┘
                            │
                  (Future: Supabase for multiplayer)
```

---

## 🏗️ Layer Breakdown

### Layer 1: User Interface (Obsidian Desktop)
**What**: Obsidian application (electron-based desktop app)

**Provides**:
- ✅ Knowledge graph visualization (native)
- ✅ Markdown WYSIWYG editor (native)
- ✅ Wikilink parsing and autocomplete (native)
- ✅ Tag management and filtering (native)
- ✅ Canvas/whiteboard (native)
- ✅ Daily notes and templates (native)
- ✅ Plugins ecosystem (community + custom)

**Our Custom Plugins** (if needed):
- Task management enhanced (obsidian-tasks integration)
- MCP status display
- Agent activity monitor
- Git workflow UI

**Why Obsidian**:
- Local-first (no cloud vendor lock-in)
- Markdown-based (portable, future-proof)
- Extensible (plugin API)
- Mature ecosystem (1000+ community plugins)
- Graph view is excellent
- Free (just need our backend)

---

### Layer 2: Data Layer (Markdown Files)
**What**: File system with Git version control

**Structure**:
```
weave-nn/                      # Git repository root
├── .obsidian/                 # Obsidian config
│   ├── plugins/               # Custom plugins
│   ├── themes/                # Custom themes
│   └── workspace.json         # Workspace settings
├── concepts/                  # Concept nodes
├── features/                  # Feature nodes
├── decisions/                 # Decision nodes
├── workflows/                 # Workflow documentation
├── _planning/                 # Project planning
│   ├── phases/                # Phase nodes
│   ├── daily-logs/            # Daily logs
│   └── tasks.md               # Task aggregation
├── _projects/                 # Client projects
│   └── [client-name]/         # Per-client vaults
├── templates/                 # Node templates
├── canvas/                    # Canvas files
└── README.md                  # Vault entry point
```

**Storage**:
- Primary: Markdown files (UTF-8)
- Version control: Git (local + remote)
- Metadata: YAML frontmatter
- Relationships: Wikilinks `[[node-name]]`
- Embeddings: SQLite (Claude-Flow memory)

---

### Layer 3: Backend Services

#### 3A: Python MCP Server
**Purpose**: Provide AI agents (Claude, Claude-Flow) with structured access to vault

**Capabilities**:
- **File Operations**: Create, read, update, delete notes
- **Search**: Full-text, semantic (using embeddings)
- **Graph Queries**: Find related nodes, backlinks, orphans
- **Task Management**: Query tasks, update status, create todos
- **Templates**: Apply templates to new nodes
- **Validation**: YAML frontmatter schema validation

**MCP Tools Exposed**:
```python
# File operations
- create_note(path, content, frontmatter)
- read_note(path)
- update_note(path, updates)
- delete_note(path)
- list_notes(pattern)

# Graph operations
- find_backlinks(note_path)
- find_related(note_path, limit)
- get_orphans()
- get_graph_stats()

# Task operations
- list_tasks(status, project)
- create_task(title, due_date, project)
- update_task(task_id, updates)
- complete_task(task_id)

# Search
- search_text(query, path_pattern)
- search_semantic(query, limit)
- search_tags(tags)

# Templates
- apply_template(template_name, variables)
- list_templates()
```

**Technology**:
- FastAPI (async Python web framework)
- MCP SDK (Model Context Protocol)
- GitPython (Git operations)
- SQLite + embeddings (semantic search)
- Watchdog (file system monitoring)

**API Endpoints**:
- `POST /mcp/*` - MCP protocol endpoints
- `GET /health` - Health check
- `GET /stats` - Vault statistics

---

#### 3B: Claude-Flow Integration
**Purpose**: Orchestrate multiple AI agents to manage knowledge graph

**Components**:
1. **Claude-Flow Hive Mind** (8 agents)
   - Researcher, Coder, Analyst, Tester, Architect, Reviewer, Optimizer, Documenter

2. **Memory Store** (SQLite)
   - ReasoningBank (agent decisions)
   - Embeddings (semantic connections)
   - Agent rules (behavior definitions)

3. **Agent Rules** (Custom for Weave-NN)
   - Auto-linking: Suggest wikilinks based on content
   - Auto-tagging: Suggest tags based on semantics
   - Duplicate detection: Find similar nodes
   - Node creation: Create nodes from agent workflows
   - Update propagation: Update related nodes when one changes
   - Schema validation: Ensure YAML frontmatter correctness

**Workflow**:
```
User edits node in Obsidian
    ↓
File watcher detects change
    ↓
MCP server notifies Claude-Flow
    ↓
Agents analyze change
    ↓
Agents suggest actions (links, tags, related nodes)
    ↓
User approves/rejects suggestions (in Obsidian)
    ↓
Approved changes committed via MCP
```

---

#### 3C: Git Integration
**Purpose**: Version control, collaboration, issue tracking

**Features**:
- **Auto-commit**: Optional background commits on file save
- **Issue Sync**: Tasks/bugs → GitHub issues (bidirectional)
- **Branch Workflow**: Feature branches for projects
- **Conflict Resolution**: Detect and flag merge conflicts
- **History**: View file history in Obsidian

**Implementation**:
- Git CLI wrapper (Python)
- GitHub API integration (for issues)
- Pre-commit hooks (validation, formatting)
- Post-commit hooks (notifications)

---

### Layer 4: Future - Multiplayer Layer (Supabase)
**Purpose**: Real-time collaboration (future feature)

**Not in MVP**, but architecture supports it:
- Supabase Realtime (CRDT for collaborative editing)
- PostgreSQL (centralized storage for teams)
- Supabase Auth (workspace permissions)
- Supabase Storage (attachments, media)

**Hybrid Model**:
- Solo users: Local Obsidian vault only
- Teams: Vault syncs to Supabase via background service
- Conflict resolution: Last-write-wins or CRDT

---

## 🚀 MVP Implementation (2 Weeks)

### Week 1: Core Backend
**Days 1-2**: Python MCP Server Setup
- FastAPI boilerplate
- MCP SDK integration
- File operation tools (create, read, update, delete)
- Basic search (full-text)

**Days 3-4**: Claude-Flow Integration
- Connect MCP server to Claude-Flow
- Define agent rules (6 rules from Phase 3)
- Test agent file operations
- Memory store setup (SQLite)

**Day 5**: Git Integration
- Git wrapper (commit, status, log)
- Auto-commit workflow
- Validation hooks

**Days 6-7**: Testing & Refinement
- Test all MCP tools with Claude Desktop
- Test agent workflows
- Fix bugs, optimize performance

### Week 2: Task Management & Client Testing
**Days 8-9**: Task Management
- Integrate obsidian-tasks plugin
- MCP task tools (list, create, update)
- Task queries (by project, status, due date)
- Dashboard view (canvas or note)

**Days 10-11**: Client Project Setup
- Create `_projects/` structure
- Per-client vault templates
- Import existing client data
- Test with real project

**Days 12-13**: Documentation & Handoff
- User guide (how to use Weave-NN)
- Developer guide (how to extend)
- Agent rule documentation
- Video walkthrough

**Day 14**: Buffer & Polish
- Final testing
- Performance optimization
- Deploy to production use

---

## 💡 Key Advantages

### 1. **Drastically Reduced Scope**
- ❌ Don't need to build: Graph UI, editor, plugins, themes, mobile apps
- ✅ Only build: Backend API, MCP server, agent rules
- **Result**: 3-4 month project → 2 weeks

### 2. **Local-First, Privacy-First**
- All data on user's machine
- No cloud vendor lock-in
- Git-backed (portable)
- Obsidian is free (our backend is the product)

### 3. **AI-Native from Day 1**
- MCP provides direct AI agent access
- Claude-Flow orchestrates multi-agent workflows
- Agents can create, edit, link nodes automatically
- User approves suggestions (human-in-loop)

### 4. **Proven, Mature UI**
- Obsidian has 1M+ users, battle-tested
- 1000+ community plugins available
- Excellent graph visualization
- Fast, responsive, local

### 5. **Clear Scale Path**
- MVP: Local Obsidian + MCP server
- v1.1: Git issue sync, advanced task management
- v2.0: Multiplayer via Supabase (optional)
- v3.0: Web interface (read-only public sharing)

### 6. **Client-Friendly**
- Markdown export = easy handoff
- Git-based = familiar workflow
- Free for clients (no SaaS fees for them)
- Professional taxonomy (well-organized)

---

## 🔧 Technical Stack (Final)

### Frontend
- **Obsidian Desktop** (Electron app, free)
- **Plugins**:
  - obsidian-tasks (task management)
  - Custom plugin (MCP status, agent monitor)

### Backend
- **Python 3.11+**
  - FastAPI (MCP server)
  - GitPython (Git operations)
  - SQLite (embeddings, Claude-Flow memory)
  - Watchdog (file monitoring)

### AI Integration
- **Claude-Flow v2.7** (agent orchestration)
- **MCP SDK** (Model Context Protocol)
- **OpenAI Embeddings** (semantic search)

### Storage
- **Markdown files** (UTF-8, Git-tracked)
- **SQLite** (embeddings, metadata)
- **Git** (version control)

### Future (v2.0+)
- **Supabase** (multiplayer, auth, storage)
- **Next.js** (web read-only viewer)

---

## 📊 Cost Analysis (Revised)

### MVP Costs (2 weeks)
- **Development**: $0 (solo + AI)
- **Infrastructure**: $0 (local-only)
- **Tools**:
  - Obsidian: Free
  - Python: Free
  - Git: Free
  - Claude API: ~$50/month (usage-based)
  - OpenAI Embeddings: ~$10/month
- **Total Monthly**: **$60/month**

### Scale Costs (v2.0 with 100 users)
- Claude-Flow hosting: $50/month (VPS)
- Supabase: $25/month (Pro tier)
- OpenAI Embeddings: $50/month
- **Total**: **$125/month** for 100 users

**Unit Economics**: $1.25/user/month (infrastructure only)

---

## 🎯 Success Criteria (2 Week MVP)

### Must Have
- ✅ MCP server running and accessible to Claude
- ✅ All file operations working (create, read, update, delete)
- ✅ Claude-Flow agents can create and link nodes
- ✅ Task management integrated (obsidian-tasks)
- ✅ Git auto-commit working
- ✅ Used for 1 real client project

### Nice to Have
- ⚡ Semantic search (embeddings)
- ⚡ GitHub issue sync
- ⚡ Custom Obsidian plugin (agent monitor)

### Future (Post-MVP)
- 🔮 Multiplayer (Supabase)
- 🔮 Web viewer (Next.js)
- 🔮 Mobile sync

---

## 🔗 Related

### Architecture
- [[frontend-layer|Frontend Layer]] - Now: Obsidian native
- [[api-layer|API Layer]] - Python MCP server
- [[data-knowledge-layer|Data & Knowledge Layer]] - Markdown + Git + SQLite
- [[ai-integration-layer|AI Integration Layer]] - Claude-Flow + MCP

### Decisions
- [[../decisions/executive/project-scope|ED-1: Project Scope]] - SaaS (future)
- [[../archive/DECISIONS#TS-2-Graph-Visualization-Library|TS-2: Graph Viz]] - Obsidian native
- [[../archive/DECISIONS#TS-5-Markdown-Editor|TS-5: Editor]] - Obsidian native
- [[../archive/DECISIONS#IR-1-Obsidian-Integration|IR-1: Obsidian]] - USE directly

### Implementation
- [[../implementation/phases/phase-1-core-mvp|Phase 1: Core MVP]] - Now 2 weeks!
- [[../workflows/phase-management|Phase Management]] - Updated timeline

### Features
- [[../features/knowledge-graph-visualization|Graph Visualization]] - Obsidian provides
- [[../features/markdown-editor-component|Markdown Editor]] - Obsidian provides
- [[../features/basic-ai-integration-mcp|MCP Integration]] - Our backend

---

**Status**: ✅ **Active Architecture**
**Decision Date**: 2025-10-21
**Impact**: Reduces MVP timeline from 3-4 months to **2 weeks**
**Next Steps**: Build Python MCP server (Week 1)
