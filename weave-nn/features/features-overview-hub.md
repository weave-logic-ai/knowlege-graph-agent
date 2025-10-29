---
type: feature-hub
status: active
created_date: "2025-10-20"
updated_date: "2025-10-21"
scope: "mvp"
obsidian_first: true

tags:
  - features
  - mvp
  - obsidian-first
  - scope/mvp

visual:
  icon: "zap"
  cssclasses:
    - type-features
    - scope-mvp
---

# Weave-NN Features (MVP - Obsidian-First)

**Purpose**: MVP feature set for Weave-NN (Obsidian-native approach)
**Status**: 🏗️ Ready for Phase 5 implementation
**Approach**: Obsidian desktop + Python MCP + RabbitMQ + N8N
**Timeline**: 2 weeks to MVP

**Last Updated**: 2025-10-21

---

## 📊 MVP Feature Summary

**Total MVP Features**: 8 core features
**Web-Focused Features**: 27 features archived to `.archive/features/`
**Approach**: Obsidian-first (no custom web UI for MVP)

---

## ✅ MVP Features (Obsidian-First)

### Backend Infrastructure

#### [[rabbitmq-message-queue|RabbitMQ Message Queue]] 🔴 MVP - Phase 5
**Status**: Ready for implementation
**Category**: Infrastructure
**Complexity**: Moderate
**Purpose**: Event-driven architecture for multi-client workflows
**Key Capabilities**:
- Async message processing
- 5 queues (mcp_sync, git_auto_commit, n8n_workflows, agent_tasks, dlq)
- Topic exchange routing
- Dead letter queue for error handling
**Implementation**: Phase 5, Day 1

---

#### [[git-integration|Git Version Control Integration]] 🔴 MVP - Phase 5
**Status**: Ready for implementation
**Category**: Data Management
**Complexity**: Moderate
**Purpose**: Automatic version control for all vault changes
**Key Capabilities**:
- Auto-commit on file changes (5-second debouncing)
- Workspace watcher for closed pane commits
- Pre-commit validation
- Commit history accessible via MCP
**Implementation**: Phase 5, Day 5

---

### Workflow Automation

#### [[n8n-workflow-automation|N8N Workflow Automation]] 🔴 MVP - Phase 6
**Status**: Ready for implementation
**Category**: Automation
**Complexity**: Moderate
**Purpose**: Visual workflow builder for non-technical team members
**Key Capabilities**:
- 5 core workflows (client onboarding, weekly reports, knowledge extraction, pattern sync, meeting automation)
- RabbitMQ integration for event-driven triggers
- 150+ integrations (Slack, GitHub, Claude API)
- MCP Server Trigger node for exposing workflows as AI tools
**Implementation**: Phase 6, Days 8-9

---

#### [[obsidian-tasks-integration|Obsidian Tasks Integration]] 🔴 MVP - Phase 6
**Status**: Ready for implementation
**Category**: Planning
**Complexity**: Simple
**Purpose**: Native task management using obsidian-tasks plugin
**Key Capabilities**:
- Markdown checkbox syntax (`- [ ]`, `- [x]`)
- Task queries (due today, overdue, by project)
- MCP task tools (list, create, complete)
- Agent-powered task workflows
**Implementation**: Phase 6, Day 10

---

### AI & Intelligence

#### [[ai-integration-component|MCP-Based AI Integration]] 🔴 MVP - Phase 5
**Status**: Ready for implementation
**Category**: AI
**Complexity**: Moderate
**Purpose**: FastMCP server exposing vault operations to Claude
**Key Capabilities**:
- FastMCP decorators for 60-70% less code
- CRUD tools (create, read, update, delete, list notes)
- Automatic schema generation from type hints
- Claude Desktop integration
**Implementation**: Phase 5, Day 2

---

#### [[auto-linking|Automatic Link Suggestions]] 🟡 Phase 5 MVP
**Status**: Ready for implementation
**Category**: AI
**Complexity**: Moderate
**Purpose**: Agent-powered wikilink suggestions based on content
**Key Capabilities**:
- Claude-Flow agent rule for link suggestions
- Semantic analysis of note content
- Suggests relevant existing notes to link
**Implementation**: Phase 5, Day 4 (Agent Rules)

---

#### [[semantic-search|Semantic Search]] 🟡 MVP
**Status**: Included in MVP
**Category**: AI
**Complexity**: Moderate
**Purpose**: Vector-based semantic search across vault
**Rationale**: "We will have 1000s of nodes quickly" - critical for cross-project
**Key Capabilities**:
- OpenAI embeddings
- Vector search via shadow cache
- Cross-project pattern discovery
**Implementation**: Phase 5, Day 3 (Shadow Cache)

---

## 🚫 Archived Features (Web-Focused / Future)

### Archived to `.archive/features/`

**Total Archived**: 27 features moved to archive
**Reason**: Web UI deferred to post-MVP (v1.1+)

**Categories Archived**:
- **Editor Features** (7 files): markdown-editor-component, wikilink-autocomplete, syntax-highlighting, collaborative-editing, version-history, comments-annotations
- **Graph Visualization** (3 files): knowledge-graph-visualization, canvas-visualization, graph-analytics
- **Collaboration Features** (6 files): workspace-management, user-permissions, sharing, activity-feed, team-analytics, collaborative-editing
- **Data Management** (5 files): backup-sync, export-import, data-portability, multi-vault, version-history
- **Planning Features** (4 files): decision-tracking, phase-management, daily-log-automation, temporal-view
- **Other** (2 files): ai-summaries, auto-tagging

**Specific Features Deferred**:
- [[../.archive/features/github-issues-integration|GitHub Issues Integration]] - Defer to v1.1
- [[../.archive/features/node-search|Advanced Node Search]] - Obsidian native search sufficient
- [[../.archive/features/tag-based-filtering|Tag-Based Filtering]] - Obsidian native filtering sufficient
- [[../.archive/features/phase-management|Phase Management]] - Manual phase tracking sufficient

---

## 🎯 MVP Scope Rationale

### Why Obsidian-First?

**Decision D-001**: Start with Obsidian-native implementation
**Rationale**:
- ✅ Validates knowledge graph value immediately
- ✅ Leverages existing Obsidian ecosystem
- ✅ Reduces MVP timeline from 2-6 months → 2 weeks
- ✅ Web UI can be built later if validated

**What This Means**:
- Use Obsidian desktop app directly (no custom web UI)
- Use native Obsidian graph visualization
- Use native markdown editor
- Use obsidian-tasks plugin for task management
- Build Python MCP backend for AI integration
- Build N8N workflows for automation

---

## 📋 Feature Template (MVP Version)

Each MVP feature node includes:

```yaml
---
feature_id: "F-XXX"
feature_name: "Feature Name"
category: "infrastructure|automation|ai|planning"
status: "planned|in-progress|implemented"
priority: "critical|high"
release: "mvp"
complexity: "simple|moderate|complex"

dependencies:
  requires: ["other-feature-id"]
  blocks: []

related_decisions:
  - "[[../decisions/INDEX|Decision Index]]"

tags:
  - feature
  - scope/mvp
  - phase-5 or phase-6
---

# Feature Name

Brief description for Obsidian-first approach.

## User Story
As a [user type], I want [capability] so that [benefit].

## Key Capabilities (Obsidian-Native)
- Capability 1
- Capability 2

## Implementation (Phase X, Day Y)
- Task 1
- Task 2

## Related
- [[../architecture/related]]
- [[../_planning/phases/phase-X]]
```

---

## 🔗 Integration with Planning

### Phase 5 Features (Week 1: Backend)
- [[rabbitmq-message-queue]] - Day 1
- [[ai-integration-component]] (MCP Server) - Day 2
- [[semantic-search]] (Shadow Cache) - Day 3
- [[auto-linking]] (Agent Rules) - Day 4
- [[git-integration]] - Day 5

**Reference**: [[../_planning/phases/phase-5-mvp-week-1|Phase 5 Detailed Plan]]

### Phase 6 Features (Week 2: Automation)
- [[n8n-workflow-automation]] - Days 8-9
- [[obsidian-tasks-integration]] - Day 10

**Reference**: [[../_planning/phases/phase-6-mvp-week-2|Phase 6 Detailed Plan]]

---

## 📊 Feature Status

| Feature | Phase | Day | Status |
|---------|-------|-----|--------|
| RabbitMQ | 5 | 1 | ⏳ Pending |
| MCP Server | 5 | 2 | ⏳ Pending |
| Semantic Search | 5 | 3 | ⏳ Pending |
| Auto-Linking | 5 | 4 | ⏳ Pending |
| Git Integration | 5 | 5 | ⏳ Pending |
| N8N Workflows | 6 | 8-9 | ⏳ Pending |
| Task Management | 6 | 10 | ⏳ Pending |

---

## 🔍 Feature Discovery

### By Phase
- **Phase 5**: Backend infrastructure and AI
- **Phase 6**: Automation and workflows

### By Category
- **Infrastructure**: RabbitMQ, Git
- **AI**: MCP Server, Auto-Linking, Semantic Search
- **Automation**: N8N Workflows
- **Planning**: Obsidian Tasks

### By Priority
- **Critical (MVP blockers)**: All 8 features
- **Deferred (Post-MVP)**: 27 archived features

---

## 📚 Related Documentation

### Planning
- [[../_planning/MASTER-PLAN|Master Plan]] - Complete roadmap
- [[../_planning/phases/phase-5-mvp-week-1|Phase 5 Plan]] - Backend implementation
- [[../_planning/phases/phase-6-mvp-week-2|Phase 6 Plan]] - Automation implementation
- [[../_planning/tasks|Task Hub]] - All 128 implementation tasks

### Decisions
- [[../decisions/INDEX|Decision Index]] - All 16 decisions
- [[../meta/DECISIONS-INDEX|Extended Decision Hub]] - Detailed decision documentation

### Architecture
- [[../architecture/obsidian-native-integration-analysis|Obsidian Integration]] - REST API architecture
- [[../architecture/cross-project-knowledge-retention|Knowledge Retention]] - Pattern extraction

### Research
- [[../_planning/research/fastmcp-research-findings|FastMCP Research]]
- [[../_planning/research/n8n-mcp-integration-research|N8N MCP Research]]
- [[../_planning/research/obsidian-groups-icons-research|Properties Research]]

---

**Status**: MVP features ready for implementation ✅
**Archived**: 27 web-focused features moved to `.archive/features/`
**Next**: Begin Phase 5 Day 0 (prerequisites)
**Last Updated**: 2025-10-21
