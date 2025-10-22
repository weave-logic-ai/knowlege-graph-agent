---
# Node Metadata
type: master-plan
status: active
priority: critical
created_date: "2025-10-21"
updated_date: "2025-10-21"
version: "2.0-obsidian-first"

# Scope
scope:
  current_phase: "mvp"
  obsidian_only: true
  web_version_needed: false
  deferred: false

# Tags
tags:
  - scope/mvp
  - type/planning
  - status/active
  - priority/critical
  - obsidian-first

# Visual
visual:
  icon: "map"
  cssclasses:
    - type-planning
    - scope-mvp
    - priority-critical
---

# Weave-NN Master Plan (Obsidian-First)

**Vision**: AI-powered Obsidian vault with Claude-Flow agent integration for managing multi-client projects and cross-project knowledge retention.

**Architecture**: Obsidian desktop app + Python MCP server + RabbitMQ + N8N + Claude-Flow agents
**Timeline**: 2 weeks to MVP
**Budget**: $110/month production (GCP VM + Claude API + embeddings) or $60/month local

**Last Updated**: 2025-10-21
**Current Phase**: Phase 4 (Decision Closure) → Moving to Phase 5 (MVP Development)

---

## 🎯 Overall Objectives

### Primary Goals (Revised)

1. **Obsidian Vault as Frontend** ✅
   - Use Obsidian desktop app directly (not build custom UI)
   - Leverage native graph visualization
   - Use native markdown editor
   - Install obsidian-tasks plugin

2. **Python MCP Backend** ⏳ (Week 1)
   - Build FastAPI MCP server
   - Expose file operation tools
   - Expose search tools (full-text + semantic)
   - Expose task management tools

3. **Claude-Flow Agent Integration** ⏳ (Week 1)
   - Connect MCP server to Claude-Flow
   - Implement 6 core agent rules
   - Set up SQLite memory store
   - Test agent workflows

4. **Git Workflow Automation** ⏳ (Week 1)
   - Auto-commit on save (debounced via workspace.json watcher)
   - Commit history viewer
   - Pre-commit validation
   - GitHub integration (manual linking to issues, defer bidirectional sync to v1.1)

5. **Task Management Integration** ⏳ (Week 2)
   - Configure obsidian-tasks plugin
   - Build MCP task tools
   - Create project dashboards
   - Agent-generated task summaries

6. **Client Project Deployment** ⏳ (Week 2)
   - Use Weave-NN for real client project
   - Validate workflows
   - Create documentation
   - Handoff to client

7. **Event-Driven Infrastructure** ⏳ (Week 1, Day 1)
   - Install RabbitMQ message queue (Docker)
   - Set up file watcher → event publisher
   - Create consumer services (mcp_sync, git_auto_commit, agent_tasks, n8n_workflows)
   - Event-driven async architecture for multi-client workflows

8. **N8N Workflow Automation** ⏳ (Week 2, Days 8-9)
   - Install N8N workflow engine (Docker)
   - Build 5 core workflows (client onboarding, weekly reports, knowledge extraction, cross-project sync, meeting notes automation)
   - Connect to RabbitMQ for event-driven triggers
   - Enable non-technical workflow creation

9. **Cross-Project Knowledge Retention** ⏳ (Week 2)
   - Automated knowledge extraction on project completion
   - Pattern library (domain, technical, process patterns)
   - Reusable components across projects
   - Compound learning system (each project improves the next)

---

## 🔌 Obsidian Integration Strategy

### Primary Integration Method: REST API

**Plugin**: `obsidian-local-rest-api`
**URL**: `https://localhost:27124`
**Authentication**: API key (Bearer token)

**Why REST API** (vs file system or URI):
- ✅ **Synchronous** - Immediate success/error response
- ✅ **Secure** - API key authentication, HTTPS
- ✅ **No conflicts** - Obsidian handles all writes (no file locking issues)
- ✅ **Error handling** - HTTP status codes + JSON errors
- ✅ **Cross-platform** - HTTP works everywhere
- ✅ **Event webhooks** - Can notify on vault changes

**MCP Tools Implementation**:
All MCP file operations use REST API:
- `create_note()` → POST /vault/{path}
- `read_note()` → GET /vault/{path}
- `update_note()` → PUT /vault/{path}
- `delete_note()` → DELETE /vault/{path}
- `list_notes()` → GET /vault/ with query params
- `patch_note_section()` → PATCH /vault/{path}

**Fallback**: Obsidian URI (Advanced URI plugin) if REST API unavailable

### Required Obsidian Plugins

1. **obsidian-local-rest-api** (CRITICAL)
   - Purpose: Enable Python MCP server to interact with vault synchronously
   - Setup: Install, generate API key, test connection
   - Day 0 prerequisite

2. **obsidian-mehrmaid** (HIGH PRIORITY)
   - Purpose: Rich visualizations with clickable wikilinks inside Mermaid nodes
   - Use: Decision trees, feature graphs, architecture diagrams
   - Enables markdown formatting inside graph nodes

3. **obsidian-tasks** (CRITICAL)
   - Purpose: Task management with queries and metadata
   - Use: Project task tracking, daily summaries, MCP task tools
   - Day 0 prerequisite

4. **obsidian-advanced-uri** (FALLBACK)
   - Purpose: Backup automation method if REST API fails
   - Use: Rare edge cases, deep linking
   - Day 0 prerequisite

---

## 🔄 Event-Driven Architecture

### RabbitMQ Message Queue

**Purpose**: Decouple components via async messaging for multi-client workflows

**Why RabbitMQ for Multi-Client Production**:
- ✅ **Async processing** - Handle multiple client projects concurrently
- ✅ **Guaranteed delivery** - No lost events even if consumer down
- ✅ **Retry logic** - Failed messages retry automatically
- ✅ **Dead letter queue** - Capture and investigate failures
- ✅ **Topic routing** - Flexible event distribution (e.g., only sync events to MCP consumer)
- ✅ **Scales to 1000+ clients** - Production-ready from day 1
- ✅ **N8N integration** - N8N can consume RabbitMQ events natively

**Event Flow**:
```
Obsidian file change → File Watcher (Python) → RabbitMQ → Consumers
                                                              ├─ MCP Sync (update shadow cache)
                                                              ├─ Git Auto-Commit (debounced)
                                                              ├─ N8N Workflows (automation)
                                                              └─ Agent Tasks (AI processing)
```

**Infrastructure**:
- **Exchange**: `weave-nn.events` (topic exchange)
- **Queues**:
  1. `mcp_sync` - Binds to `vault.file.*` (shadow cache updates)
  2. `git_auto_commit` - Binds to `vault.file.updated` (debounced commits)
  3. `n8n_workflows` - Binds to `vault.*`, `task.*`, `project.*` (workflow triggers)
  4. `agent_tasks` - Binds to `vault.*`, `task.*` (agent processing)
  5. `dlq` - Dead letter queue (failed message investigation)

**Event Types**:
- `vault.file.created` - New file in vault
- `vault.file.updated` - File modified
- `vault.file.deleted` - File removed
- `vault.workspace.updated` - Workspace.json changed
- `task.created` - New task added
- `task.completed` - Task marked done
- `project.created` - New client project
- `project.closed` - Project completed

**Docker Installation** (Day 1):
```bash
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

**Benefits for Production**:
- Handle 10+ simultaneous client projects without blocking
- Cross-project workflows (knowledge extraction from Project A applies to Project B)
- Resilient to failures (messages queued even if N8N down)
- Audit trail of all vault events

---

## 🤖 N8N Workflow Automation

**Purpose**: Enable visual workflow creation for non-technical team members and complex multi-step automations

**Why N8N for Multi-Client Production**:
- ✅ **Visual workflows** - Non-developers can create automations
- ✅ **150+ integrations** - Slack, GitHub, Google Sheets, Airtable, etc.
- ✅ **RabbitMQ native** - Consumes events from queue
- ✅ **Scheduled workflows** - Cron jobs (weekly reports, daily summaries)
- ✅ **Error handling** - Retry logic, notifications on failure
- ✅ **Workflow templates** - Reusable across clients
- ✅ **Scales** - Handle 100+ workflows across clients

**5 Core MVP Workflows** (Week 2, Days 8-9):

1. **Client Onboarding** (Webhook trigger)
   - Input: Client name, contact, project type
   - Steps: Create project folder, apply templates, create initial tasks, create GitHub repo, send Slack notification
   - Output: Ready-to-use client project structure

2. **Weekly Report Generator** (Cron: Friday 5pm)
   - Input: Query completed tasks (last 7 days), Git commits
   - Steps: Generate summary with Claude, create report note, send to Slack
   - Output: Weekly progress report for each active client

3. **Knowledge Extraction on Project Close** (RabbitMQ: `project.closed`)
   - Input: Project files, decisions, solutions
   - Steps: Analyze with Claude, extract patterns, create knowledge-base entries, update pattern index, generate Mehrmaid viz
   - Output: Reusable patterns for future projects

4. **Cross-Project Pattern Sync** (RabbitMQ: `project.created`)
   - Input: New project requirements
   - Steps: Query knowledge base, find relevant patterns, create suggested-patterns.md
   - Output: Automatically suggest patterns from previous projects

5. **Meeting Notes Automation** (RabbitMQ: `vault.file.created` in `meetings/`)
   - Input: Meeting notes markdown
   - Steps: Extract action items with Claude, create tasks, update meeting note with task links, send Slack notifications
   - Output: Auto-generated tasks from meeting notes

**Docker Installation** (Week 2, Day 8):
```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Benefits for Production**:
- Automate repetitive workflows across 10+ clients
- Enable project managers to create workflows without coding
- Standardize client onboarding, reporting, knowledge extraction
- Reduce manual work from 2 hours/week → 10 minutes/week per client

---

## 📚 Cross-Project Knowledge Retention

**Purpose**: Each project makes the next project better through automated learning capture

**Why Critical for Multi-Client Production**:
- ✅ **Compound learning** - 10th client project takes 50% less time than 1st
- ✅ **Pattern reuse** - E-commerce checkout pattern used across 5 clients
- ✅ **Avoid mistakes** - "Lessons learned" database prevents repeated errors
- ✅ **Faster proposals** - Query similar projects to estimate new ones
- ✅ **Knowledge asset** - Build proprietary pattern library worth $100K+

**Knowledge Extraction Workflow** (N8N, triggered on `project.closed`):

1. Read project files (requirements, decisions, solutions, lessons-learned)
2. Analyze with Claude: Extract patterns, components, lessons
3. Categorize knowledge:
   - Domain patterns (e-commerce, SaaS, fintech, healthcare)
   - Technical patterns (auth, API design, data modeling, real-time sync)
   - Process patterns (requirements gathering, stakeholder management, testing)
4. Create knowledge-base entries
5. Update pattern index
6. Archive project

**Knowledge Base Structure**:
```
knowledge-base/
├── patterns/
│   ├── domain/
│   │   ├── ecommerce/
│   │   │   ├── checkout-optimization.md
│   │   │   └── cart-abandonment-recovery.md
│   │   ├── saas/
│   │   │   ├── onboarding-flow.md
│   │   │   └── subscription-management.md
│   │   └── fintech/
│   │       └── payment-processing-compliance.md
│   ├── technical/
│   │   ├── authentication/
│   │   │   ├── jwt-refresh-token-rotation.md
│   │   │   └── oauth2-implementation.md
│   │   ├── api-design/
│   │   │   └── rest-api-versioning-strategy.md
│   │   └── data-modeling/
│   │       └── multi-tenant-database-design.md
│   └── process/
│       ├── async-stakeholder-feedback.md
│       └── iterative-requirements-gathering.md
├── components/ (reusable code/templates)
├── lessons/ (what worked, what didn't)
└── meta/ (pattern index, knowledge graph)
```

**Pattern Reuse Workflow** (N8N, triggered on `project.created`):

1. Analyze new project requirements
2. Query knowledge base with Claude (semantic search)
3. Identify 5 most relevant patterns
4. Create `_projects/client/suggested-patterns.md`
5. Notify user

**Impact Metrics** (projected after 10 clients):
- Project 1: 40 hours requirements → implementation
- Project 5: 25 hours (37.5% faster, patterns reused)
- Project 10: 20 hours (50% faster, mature pattern library)
- Knowledge base value: $100K-$200K (proprietary patterns)

---

## 📋 Revised Phase Overview

### ✅ Phase 1-3: Completed
- Phase 1: Knowledge Graph Transformation ✅
- Phase 2: Documentation Capture ✅
- Phase 3: Node Expansion & Architecture ✅

**Outcome**:
- 64+ nodes created
- Architecture fully documented
- Business model defined
- Implementation roadmap planned (Phases 1-4)
- Templates and workflows established

---

### ✅ Phase 4: Decision Closure & Obsidian-First Pivot
**Duration**: 1 evening (2025-10-21)
**Status**: ✅ **COMPLETE**
**Priority**: CRITICAL

**Completed**:
- [x] User filled out DECISIONS.md (16 decisions made)
- [x] Analyzed decisions through Obsidian-first lens
- [x] Created obsidian-first-architecture.md
- [x] Identified obsolete decisions (TS-1, TS-2, TS-5)
- [x] Moved web features to future-web-version.md
- [x] Documented tag and group system
- [x] Created decision reanalysis document

**Key Decisions Made**:
1. ED-3: Target Users → Small dev teams + solo developers
2. ED-4: Budget → $1K-$5K, 2 weeks, solo + AI
3. TS-2: Graph Viz → Obsidian native graph
4. TS-3: Backend → Python FastAPI + MCP
5. TS-4: Database → Markdown + Git + SQLite
6. TS-5: Editor → Obsidian native
7. TS-6: Auth → Deferred to v2.0 (multiplayer)
8. FP-2: AI Priority → AI-first, MCP critical
9. FP-3: Collaboration → Git-based initially
10. BM-1: Monetization → Internal/free for clients
11. BM-2: Open Source → Closed source
12. IR-1: Obsidian → **USE OBSIDIAN DIRECTLY**
13. IR-2: Git → Auto-commit + issue sync

**Impact**: Scope reduced 70%, timeline reduced 85% (3-4 months → 2 weeks)

[[phases/phase-4-decision-closure|→ Phase 4 Details]]

---

### ⏳ Phase 5: MVP Development (Week 1) - Backend Infrastructure
**Duration**: 6 days (Days 0-5)
**Status**: Starting next
**Priority**: CRITICAL

**Objective**: Build event-driven backend with Python MCP server, RabbitMQ, and Claude-Flow integration

**Reference**: [[phases/phase-5-mvp-week-1|Phase 5 Detailed Plan]]

---

#### **Day 0: Prerequisites & Plugin Installation** (Weekend/Prep)

**Obsidian Plugins** (Install via Community Plugins):
- [ ] **obsidian-local-rest-api** - CRITICAL for MCP integration
- [ ] **obsidian-mehrmaid** - Visualization with wikilinks
- [ ] **obsidian-tasks** - Task management
- [ ] **obsidian-advanced-uri** - Fallback integration method

**Development Environment**:
- [ ] Python 3.11+ virtual environment created
- [ ] Docker installed for RabbitMQ and N8N
- [ ] Dependencies installed: `fastapi uvicorn pika requests pyyaml watchdog gitpython`
- [ ] `.env` file configured with API keys

**Optional GCP Setup**:
- [ ] Provision e2-standard-2 VM (2 vCPU, 8GB RAM) if using cloud
- [ ] Open firewall ports: 5672, 15672, 5678

**Success Criteria**: All plugins installed, dev environment ready, API keys configured

---

#### **Day 1: RabbitMQ + File Watcher Setup** (Mon)

**Morning: RabbitMQ Installation**
- [ ] Install RabbitMQ via Docker with management plugin
- [ ] Access RabbitMQ Management UI (http://localhost:15672)
- [ ] Create topic exchange: `weave-nn.events`
- [ ] Create 5 durable queues: `mcp_sync`, `git_auto_commit`, `n8n_workflows`, `agent_tasks`, `dlq`
- [ ] Bind queues with routing keys (vault.*, task.*, etc.)
- [ ] Test message publishing and queue receipt

**Afternoon: File Watcher**
- [ ] Create project structure: `weave-nn-mcp/` with publishers/, consumers/, utils/
- [ ] Implement RabbitMQ publisher client with connection management
- [ ] Build file watcher using Python Watchdog library
- [ ] Add YAML frontmatter parsing
- [ ] Publish vault.file.* events to RabbitMQ on file changes
- [ ] Test end-to-end: Create note in Obsidian → RabbitMQ event received

**Success Criteria**: RabbitMQ operational, file watcher publishing events on file changes

**Reference**: [[../features/rabbitmq-message-queue|RabbitMQ Feature]]

---

#### **Day 2: Python MCP Server Core (REST API Client)** (Tue)

**Morning: Obsidian REST API Client**
- [ ] Create `ObsidianRESTClient` class in `utils/obsidian_client.py`
- [ ] Implement CRUD methods using Obsidian Local REST API:
  - `create_note(path, content, frontmatter)` → POST /vault/{path}
  - `read_note(path)` → GET /vault/{path}
  - `update_note(path, content)` → PUT /vault/{path}
  - `delete_note(path)` → DELETE /vault/{path}
  - `list_notes(pattern)` → GET /vault/
  - `patch_note_section(path, heading, content)` → PATCH /vault/{path}
- [ ] Add error handling and Bearer token authentication
- [ ] Test CRUD operations against Obsidian vault

**Afternoon: FastMCP MCP Server**
- [ ] Create FastMCP server in `server.py` with health endpoint
- [ ] Add MCP tool endpoints (create_note, read_note, update_note, delete_note, list_notes)
- [ ] Start server with uvicorn
- [ ] Test all endpoints with curl commands
- [ ] Add comprehensive error handling

**Success Criteria**: MCP server operational, all CRUD operations work via REST API

**Reference**: [[../architecture/obsidian-native-integration-analysis|REST API Architecture]]

---

#### **Day 3: MCP Sync Consumer + Shadow Cache** (Wed)

**Morning: MCP Sync Consumer**
- [ ] Create MCP Sync Consumer (`consumers/mcp_sync.py`) subscribing to `mcp_sync` queue
- [ ] Process vault.file.* events from RabbitMQ
- [ ] Create ShadowCache class with SQLite database
- [ ] Implement database schema for nodes table (file_path, type, frontmatter, tags, links, headings)
- [ ] Implement upsert_node and query_by_tag methods
- [ ] Add DLQ error handling
- [ ] Test: Create note → RabbitMQ → SQLite cache updated

**Afternoon: Claude-Flow Memory Sync**
- [ ] Create Claude-Flow Memory Client (`utils/claude_flow_client.py`)
- [ ] Implement memory storage on file create/update
- [ ] Implement memory deletion marking on file delete
- [ ] Test: Create note with wikilinks → Verify Claude-Flow DB entry

**Success Criteria**: Shadow cache syncing on file changes, Claude-Flow memory integrated

---

#### **Day 4: Claude-Flow Agent Rules** (Thu)

**Agent Rules Implementation**:
- [ ] Create AgentRules class in `agents/rules.py`
- [ ] Implement 6 core agent rules:
  1. **memory_sync** - Bidirectional Obsidian ↔ Claude-Flow sync
  2. **node_creation** - Auto-create nodes from agent intents
  3. **update_propagation** - Propagate changes to related nodes
  4. **schema_validation** - Validate YAML frontmatter structure
  5. **auto_linking** - Suggest wikilinks based on content
  6. **auto_tagging** - Suggest tags based on content
- [ ] Create Agent Task Consumer (`consumers/agent_tasks.py`)
- [ ] Test end-to-end: Create note → Agent suggests links/tags

**Success Criteria**: All 6 agent rules operational, suggestions appear in workflow

**Reference**: Agent rule YAML files in `infrastructure/salt/files/claude-flow-rules/`

---

#### **Day 5: Git Integration + Auto-Commit** (Fri)

**Git Auto-Commit**:
- [ ] Create GitClient class (`utils/git_client.py`)
- [ ] Implement auto_commit method with descriptive messages
- [ ] Implement validate_pre_commit method
- [ ] Create Git Auto-Commit Consumer (`consumers/git_auto_commit.py`)
- [ ] Add debouncing logic (5 seconds) to batch rapid edits
- [ ] Test: Edit note → Auto-commit created

**Workspace.json Watcher**:
- [ ] Create WorkspaceWatcher class (`publishers/workspace_watcher.py`)
- [ ] Implement workspace.json change detection with debouncing
- [ ] Integrate with file watcher service
- [ ] Test: Edit note → Close pane → Wait → Commit created

**Success Criteria**: Git auto-commits working, workspace watcher triggers commits on pane close

**Reference**: [[../features/git-integration|Git Integration Feature]]

---

### ⏳ Phase 6: MVP Completion (Week 2) - Automation & Workflows
**Duration**: 7 days (Days 8-14)
**Status**: Pending
**Priority**: CRITICAL

**Objective**: N8N workflow automation, task management, properties, client deployment, documentation

**Reference**: [[phases/phase-6-mvp-week-2|Phase 6 Detailed Plan]]

---

#### **Day 8: N8N Installation + Client Onboarding Workflow** (Mon)

**Morning: N8N Installation**
- [ ] Install N8N via Docker with persistent storage
- [ ] Complete N8N initial setup and authentication
- [ ] Configure credentials for 5 services:
  - Obsidian API (REST API key)
  - GitHub (Personal Access Token)
  - Slack (Webhook URL)
  - Claude API (Anthropic API key)
  - RabbitMQ (connection URL)
- [ ] Create and test N8N Hello World workflow

**Afternoon: Client Onboarding Workflow**
- [ ] Create "Client Onboarding" workflow with webhook trigger
- [ ] Implement 7 workflow steps:
  1. Set variables (project_id, date, next_monday)
  2. Create project folder via Obsidian API
  3. Create 4 template files (README, requirements, tasks, decisions)
  4. Create 3 initial tasks with due dates
  5. Git commit with message
  6. Send Slack notification
  7. Return success response
- [ ] Test end-to-end with real client data

**Success Criteria**: N8N operational, client onboarding workflow creates complete project structure

**Reference**: [[../features/n8n-workflow-automation|N8N Feature]]

---

#### **Day 9: N8N Advanced Workflows** (Tue)

**Morning: Weekly Report Generator**
- [ ] Create "Weekly Report Generator" workflow with cron trigger (Friday 5pm)
- [ ] Implement 5 workflow steps:
  1. Query completed tasks (last 7 days) from tasks.md files
  2. Get git commit statistics
  3. Send to Claude API for summary generation
  4. Create report file in `_planning/weekly-reports/`
  5. Send Slack notification with summary
- [ ] Test with sample data

**Afternoon: Knowledge Extraction Workflow**
- [ ] Create "Knowledge Extraction" workflow with RabbitMQ trigger (project.closed event)
- [ ] Implement 6 workflow steps:
  1. Read 4 project files (requirements, decisions, solutions, lessons)
  2. Send to Claude for pattern extraction
  3. Create knowledge base files in `knowledge-base/patterns/`
  4. Update pattern index
  5. Archive project to `_archive/`
  6. Git commit
- [ ] Test with sample project

**Success Criteria**: Both workflows operational, reports generated correctly, patterns extracted

---

#### **Day 10: Task Management Integration** (Wed)

**Morning: Obsidian Tasks MCP Integration**
- [ ] Configure obsidian-tasks plugin settings
- [ ] Create task parser utility (`utils/task_parser.py`)
- [ ] Implement 3 MCP task tools:
  - `list_tasks(project, status)` - Query tasks with filters
  - `create_task(title, file_path, due_date, priority)` - Create new tasks
  - `complete_task(file_path, line_number)` - Mark tasks as done
- [ ] Test all MCP task tools

**Afternoon: Agent-Powered Task Workflows**
- [ ] Create N8N "Daily Task Summary" workflow (cron: 9am daily)
- [ ] Create N8N "Meeting Notes to Tasks" workflow (RabbitMQ trigger)
- [ ] Test both workflows end-to-end

**Success Criteria**: MCP task tools working, agent workflows creating and managing tasks

**Reference**: [[../features/obsidian-tasks-integration|Obsidian Tasks Feature]]

---

#### **Day 11: Obsidian Properties & Visualization** (Thu)

**Morning: Apply Properties to All Nodes**
- [ ] Update 8 template files with properties (icon, cssclasses, tags)
- [ ] Create bulk property application script (`scripts/apply_tags.py`)
- [ ] Apply properties to all 64+ existing nodes
- [ ] Create CSS snippet for node colors (`.obsidian/snippets/weave-nn-colors.css`)
- [ ] Enable CSS snippet in Obsidian settings

**Afternoon: Generate Mehrmaid Visualizations**
- [ ] Create visualization generator script (`scripts/generate_visualizations.py`)
- [ ] Generate 4 visualizations:
  1. Decision tree diagram
  2. Feature dependency graph
  3. Architecture layers diagram
  4. Phase timeline
- [ ] Test all visualizations render in Obsidian with clickable wikilinks

**Success Criteria**: All nodes tagged, graph view color-coded, 4 visualizations working

**Reference**: [[../_planning/research/obsidian-groups-icons-research|Properties Research]]

---

#### **Day 12: Client Project Deployment** (Fri)

**Full-Day: Real Client Project Setup**
- [ ] Set up `_projects/[client-name]/` structure using client onboarding workflow
- [ ] Import existing client documentation
- [ ] Test 4 end-to-end workflows:
  1. Create note test (file watcher → RabbitMQ → MCP sync → shadow cache)
  2. Create task test (MCP tool → Obsidian API → task file)
  3. Generate report test (weekly report workflow)
  4. Knowledge extraction test (project closure workflow)
- [ ] Verify all automation working correctly

**Success Criteria**: Real client project running in Weave-NN, all workflows validated

---

#### **Day 13: Documentation** (Sat)

**Full-Day: Documentation Writing**
- [ ] Write user guide: "How to Use Weave-NN" (setup, workflows, best practices)
- [ ] Write developer guide: "How to Extend Weave-NN" (MCP tools, N8N workflows, agent rules)
- [ ] Document all N8N workflows with screenshots
- [ ] Update README with installation instructions
- [ ] Create architecture diagram

**Success Criteria**: Complete documentation ready for handoff

---

#### **Day 14: Polish & Video** (Sun)

**Full-Day: Final Polish**
- [ ] Performance optimization pass (query speeds, cache efficiency)
- [ ] Bug fixes from client deployment testing
- [ ] Record 10-minute video walkthrough showing:
  1. Client onboarding workflow
  2. Note creation with agent suggestions
  3. Task management
  4. Weekly report generation
  5. Knowledge extraction on project close
- [ ] Final git commit and tag `v1.0-mvp`

**Success Criteria**: MVP polished, video recorded, ready for production use
- Developers can add new agent rules
- Video demonstrates full workflow

**Effort**: 8 hours (1 day)

---

## 📊 Progress Tracking

### Overall MVP Progress
- **Phases Completed**: 4 / 6 (67%)
- **Week 1 (Backend)**: 0 / 5 days (0%)
- **Week 2 (Tasks & Deploy)**: 0 / 5 days (0%)

### Features Completed
- ✅ Knowledge graph (Obsidian native)
- ✅ Markdown editor (Obsidian native)
- ✅ Planning structure (phases, logs, decisions)
- ✅ Canvas visualizations
- ✅ Templates (8 types)
- ✅ Workflows (5 documented)
- ✅ Architecture (4 layers)
- ✅ Business model (pricing, costs, users)
- ⏳ MCP server (0%)
- ⏳ Claude-Flow integration (0%)
- ⏳ Git automation (0%)
- ⏳ Task management (0%)
- ⏳ Obsidian properties (50% - standards defined, not applied)

---

## 🎯 Success Criteria (MVP Launch)

### Must Have (2 Weeks)
- ✅ Obsidian vault with proper structure
- ✅ Architecture documented
- ✅ Templates and workflows established
- ⏳ Python MCP server running
- ⏳ All MCP file tools working
- ⏳ Claude-Flow agents operational
- ⏳ obsidian-tasks plugin integrated
- ⏳ Git auto-commit functional
- ⏳ All nodes tagged with scope/type/status
- ⏳ Used for 1 real client project successfully

### Nice to Have
- ⚡ Semantic search (embeddings)
- ⚡ GitHub issue sync
- ⚡ Custom Obsidian plugin (agent monitor)
- ⚡ Agent workflows: daily summary, auto-tasks

### Deferred to v1.1 (Month 2-3)
- 🔮 Advanced auto-linking (context-aware)
- 🔮 Meeting notes → tasks extraction
- 🔮 Custom decision dashboard (canvas)
- 🔮 Performance optimization
- 🔮 Multi-client parallel workflows

### Deferred to v2.0+ (Future Web Version)
- 🔮 Web frontend (Next.js)
- 🔮 Real-time collaboration (CRDT)
- 🔮 Authentication (Supabase Auth)
- 🔮 SaaS infrastructure
- 🔮 Billing & subscriptions
- 🔮 Mobile apps

---

## 💰 Budget & Resources

### MVP Costs (2 Weeks)

**Development**: $0 (solo + AI, 80 hours)

**Infrastructure** (Option A: GCP VM for Production):
- GCP Compute Engine (e2-standard-2): $50/month
  - 2 vCPU, 8 GB RAM
  - Runs: RabbitMQ + N8N + Python MCP server
  - 24/7 availability for multi-client workflows
- Obsidian: Free ✅
- Python/Git: Free ✅

**APIs**:
- Claude API: ~$50/month (usage-based, scales with clients)
- OpenAI Embeddings: ~$10/month (semantic search)

**Total Monthly (Production)**: **$110/month**

---

**Infrastructure** (Option B: Local Machine for Development/Testing):
- RabbitMQ (Docker): $0 (runs locally)
- N8N (Docker): $0 (runs locally)
- Python MCP server: $0 (runs locally)

**APIs**: $60/month (Claude + embeddings)

**Total Monthly (Local)**: **$60/month**

**Recommendation**: Start with GCP VM ($110/month) for production reliability and 24/7 multi-client availability, can migrate to local for cost savings later if needed.

---

### Post-MVP Costs (v1.1+)
- Same as MVP: $60-$110/month (local vs cloud)
- No additional scaling costs until 100+ clients (then vertical scaling: $150-$200/month for larger VM)

### Future Web Version Costs (v2.0)
- Development: $0 (solo) or $300K-$600K (team)
- Infrastructure: $195-$800/month (100 users)
- See [[future-web-version|Future Web Version]] for details

---

## 🚀 Timeline Summary

### Completed (Phases 1-4)
- **Duration**: 2 days (2025-10-20 to 2025-10-21)
- **Effort**: ~12 hours
- **Output**: 64+ nodes, architecture, decisions

### Upcoming (Phases 5-6: MVP)
- **Duration**: 10 working days (2 weeks)
- **Effort**: 80 hours (40 hrs/week × 2 weeks)
- **Deadline**: 2 weeks from start (target: "yesterday")

### Post-MVP (v1.1)
- **Duration**: 1-2 months
- **Effort**: Variable (improve based on usage)
- **Focus**: Polish, performance, additional agent workflows

### Future (v2.0+)
- **Duration**: 6-12 months
- **Effort**: 6-12 months solo or 3-4 months with team
- **Decision**: Only if MVP proves successful

---

## 🔗 Related Planning Docs

### Decision Documents
- [[decision-review-2025-10-20|Decision Review]] - Original 23 decisions
- [[decision-reanalysis-obsidian-first|Decision Reanalysis]] - Obsidian-first impact
- [[archive/DECISIONS|DECISIONS.md]] - User's responses

### Architecture
- [[../architecture/obsidian-first-architecture|Obsidian-First Architecture]] - System design
- [[../architecture/frontend-layer|Frontend Layer]] - Obsidian capabilities
- [[../architecture/api-layer|API Layer]] - Python MCP server
- [[../architecture/data-knowledge-layer|Data Layer]] - Markdown + Git + SQLite
- [[../architecture/ai-integration-layer|AI Layer]] - Claude-Flow agents

### Features
- [[../features/obsidian-tasks-integration|Obsidian Tasks]] - Task management
- [[../features/basic-ai-integration-mcp|MCP Integration]] - Agent access
- [[../features/git-integration|Git Integration]] - Version control

### Workflows
- [[../workflows/obsidian-properties-groups|Properties & Groups]] - Tag system
- [[../workflows/phase-management|Phase Management]] - How we track phases
- [[../workflows/node-creation-process|Node Creation]] - Standards

### Future Planning
- [[future-web-version|Future Web Version]] - Deferred SaaS features
- [[../implementation/phases/phase-1-core-mvp|Implementation Phase 1]] - Original web plan (deferred)

---

## 📝 Notes

### Why Obsidian-First Works
1. **Scope Reduction**: 70% of planned features already exist in Obsidian
2. **Timeline Reduction**: 3-4 months → 2 weeks (85% faster)
3. **Cost Reduction**: $235/month → $60/month (75% cheaper)
4. **Risk Reduction**: Obsidian is proven, stable, local-first
5. **Flexibility**: Can always build web version later (v2.0)

### Key Architectural Insight
- Obsidian IS the frontend
- Python MCP server IS the backend
- Claude-Flow agents ARE the intelligence layer
- Markdown files ARE the database
- Git IS the version control

**Result**: Minimal custom code, maximum leverage of existing tools

---

**Version**: 2.0 (Obsidian-First)
**Status**: Active
**Last Updated**: 2025-10-21
**Next Review**: After Phase 5 (Week 1 complete)
