---
# Node Metadata
phase_id: "PHASE-5"
phase_name: "MVP Development - Week 1 (Backend Infrastructure)"
type: planning
status: "pending"
priority: "critical"
created_date: "2025-10-21"
start_date: "TBD"
end_date: "TBD"
duration: "5 days"

# Scope
scope:
  current_phase: "mvp"
  obsidian_only: true
  web_version_needed: false

# Dependencies
dependencies:
  requires: ["PHASE-4"]
  enables: ["PHASE-6"]
  blocks: []

# Tags
tags:
  - scope/mvp
  - type/planning
  - status/pending
  - priority/critical
  - phase-5
  - week-1
  - backend

# Visual
visual:
  icon: "server"
  cssclasses:
    - type-planning
    - scope-mvp
    - status-pending
    - priority-critical
---

# Phase 5: MVP Development - Week 1 (Backend Infrastructure)

**Status**: ⏳ **PENDING**
**Priority**: 🔴 **CRITICAL**
**Duration**: 5 days (Monday-Friday, Week 1)
**Depends On**: [[phase-4-decision-closure|Phase 4]] ✅

---

## 🎯 Objectives

### Primary Goals
1. **Install & Configure Infrastructure** - Obsidian plugins, RabbitMQ, N8N
2. **Build Python MCP Server** - REST API client for Obsidian
3. **Integrate Claude-Flow** - Agent rules + memory storage
4. **Set Up Event Bus** - RabbitMQ message queue + file watcher
5. **Implement Git Automation** - Auto-commit workflow

### Target Deliverables
- ✅ Obsidian plugins installed and configured
- ✅ RabbitMQ message queue operational
- ✅ Python MCP server with REST API integration
- ✅ Claude-Flow agents connected to vault
- ✅ File watcher → RabbitMQ → MCP sync pipeline
- ✅ Git auto-commit on file changes

---

## 📋 Day-by-Day Breakdown

### Day 0 (Weekend/Prep): Prerequisites & Plugin Installation

**Obsidian Plugins to Install**:
- [ ] **obsidian-local-rest-api** (CRITICAL)
  - Install from Community Plugins
  - Generate API key
  - Test: `curl https://localhost:27124/vault/`
  - Save API key to `.env` file

- [ ] **obsidian-mehrmaid** (HIGH PRIORITY)
  - Install from Community Plugins
  - Test: Create note with mehrmaid graph
  - Verify wikilinks work inside nodes

- [ ] **obsidian-tasks** (CRITICAL)
  - Install from Community Plugins
  - Configure global filter
  - Test task queries

- [ ] **obsidian-advanced-uri** (FALLBACK)
  - Install from Community Plugins
  - Test basic URI: `obsidian://open?vault=weave-nn`

**Development Environment Setup**:
- [ ] Python 3.11+ installed
- [ ] Create virtual environment: `python -m venv .venv`
- [ ] Install dependencies:
  ```bash
  pip install fastapi uvicorn pika requests pyyaml watchdog gitpython
  ```
- [ ] Create `.env` file:
  ```
  OBSIDIAN_API_URL=https://localhost:27124
  OBSIDIAN_API_KEY=<your-api-key>
  RABBITMQ_URL=amqp://admin:password@localhost:5672
  CLAUDE_API_KEY=<your-claude-key>
  ```

**GCP VM Setup** (if using cloud):
- [ ] Provision e2-standard-2 VM (2 vCPU, 8 GB RAM)
- [ ] Install Docker
- [ ] Open ports: 5672 (RabbitMQ), 15672 (RabbitMQ UI), 5678 (N8N)

**Success Criteria**: All plugins installed, dev environment ready, VM provisioned (if needed)

---

### Day 1: RabbitMQ + File Watcher Setup

**Morning (4 hours): Install RabbitMQ**

- [ ] **Install RabbitMQ via Docker**:
  ```bash
  docker run -d \
    --name rabbitmq \
    -p 5672:5672 \
    -p 15672:15672 \
    -e RABBITMQ_DEFAULT_USER=admin \
    -e RABBITMQ_DEFAULT_PASS=<secure-password> \
    rabbitmq:3-management
  ```

- [ ] **Access RabbitMQ Management UI**: http://localhost:15672
  - Login: admin / <password>
  - Verify: Queues, Exchanges tabs visible

- [ ] **Create Exchange and Queues**:
  ```bash
  # Declare exchange
  rabbitmqadmin declare exchange name=weave-nn.events type=topic durable=true

  # Declare queues
  rabbitmqadmin declare queue name=n8n_workflows durable=true
  rabbitmqadmin declare queue name=mcp_sync durable=true
  rabbitmqadmin declare queue name=git_auto_commit durable=true
  rabbitmqadmin declare queue name=agent_tasks durable=true
  rabbitmqadmin declare queue name=dlq durable=true

  # Bind queues to exchange
  rabbitmqadmin declare binding source=weave-nn.events destination=n8n_workflows routing_key="vault.*.*"
  rabbitmqadmin declare binding source=weave-nn.events destination=mcp_sync routing_key="vault.file.*"
  rabbitmqadmin declare binding source=weave-nn.events destination=git_auto_commit routing_key="vault.file.updated"
  rabbitmqadmin declare binding source=weave-nn.events destination=agent_tasks routing_key="task.*"
  ```

- [ ] **Test RabbitMQ**: Publish test message, verify it appears in queue

**Afternoon (4 hours): Build File Watcher Publisher**

- [ ] **Create project structure**:
  ```
  weave-nn-mcp/
  ├── publishers/
  │   ├── __init__.py
  │   └── file_watcher.py
  ├── consumers/
  │   └── __init__.py
  ├── utils/
  │   ├── __init__.py
  │   └── rabbitmq_client.py
  └── config.py
  ```

- [ ] **Implement RabbitMQ Publisher** (`utils/rabbitmq_client.py`):
  - Connection management
  - Publish method with JSON serialization
  - Error handling & retry logic

- [ ] **Implement File Watcher** (`publishers/file_watcher.py`):
  - Watch vault directory (recursive)
  - Detect .md file changes (created, modified, deleted)
  - Parse YAML frontmatter
  - Publish events to RabbitMQ (vault.file.*)

- [ ] **Test File Watcher**:
  - Start watcher: `python publishers/file_watcher.py`
  - Create test note in Obsidian
  - Verify event appears in RabbitMQ UI (Queues → mcp_sync → Get Messages)

**Success Criteria**: RabbitMQ operational, file watcher publishes events on vault changes

**Reference**: [[../../features/rabbitmq-message-queue|RabbitMQ Feature]]

---

### Day 2: Python MCP Server Core (REST API Client)

**Morning (4 hours): Obsidian REST API Client**

> **📖 Architecture Reference**: See [[../architecture/obsidian-native-integration-analysis|Obsidian Native Integration Analysis]] for complete REST API architecture, endpoints, authentication, and error handling patterns.

**Implementation Tasks**:

- [ ] **Create Obsidian REST Client** (`utils/obsidian_client.py`):
  - Implement `ObsidianRESTClient` class with initialization (API URL, API key)
  - Implement CRUD methods:
    - `create_note(path, content, frontmatter)` → POST /vault/{path}
    - `read_note(path)` → GET /vault/{path}
    - `update_note(path, content)` → PUT /vault/{path}
    - `delete_note(path)` → DELETE /vault/{path}
    - `list_notes(pattern)` → GET /vault/
    - `patch_note_section(path, heading, content)` → PATCH /vault/{path}
  - Add error handling (HTTPException, retries)
  - Use Bearer token authentication

- [ ] **Test REST API Client**:
  - Create test note with frontmatter
  - Read test note and verify content
  - Update test note
  - Delete test note
  - List all notes with pattern filter
  - Verify all operations work in Obsidian vault

**Afternoon (4 hours): FastAPI MCP Server**

- [ ] **Create FastAPI Server** (`server.py`):
  ```python
  from fastapi import FastAPI
  from utils.obsidian_client import ObsidianRESTClient
  import os

  app = FastAPI()
  obsidian = ObsidianRESTClient(
      api_url=os.getenv("OBSIDIAN_API_URL"),
      api_key=os.getenv("OBSIDIAN_API_KEY")
  )

  @app.get("/health")
  def health():
      return {"status": "ok"}

  @app.post("/mcp/create_note")
  def mcp_create_note(path: str, content: str, frontmatter: dict = None):
      return obsidian.create_note(path, content, frontmatter)

  @app.get("/mcp/read_note")
  def mcp_read_note(path: str):
      return obsidian.read_note(path)

  @app.put("/mcp/update_note")
  def mcp_update_note(path: str, content: str):
      return obsidian.update_note(path, content)

  @app.delete("/mcp/delete_note")
  def mcp_delete_note(path: str):
      return obsidian.delete_note(path)

  @app.get("/mcp/list_notes")
  def mcp_list_notes(pattern: str = None):
      return obsidian.list_notes(pattern)
  ```

- [ ] **Run MCP Server**: `uvicorn server:app --reload`

- [ ] **Test MCP Endpoints**:
  ```bash
  # Health check
  curl http://localhost:8000/health

  # Create note
  curl -X POST "http://localhost:8000/mcp/create_note?path=test.md" \
    -H "Content-Type: application/json" \
    -d '{"content": "Test note", "frontmatter": {"type": "test"}}'

  # Read note
  curl "http://localhost:8000/mcp/read_note?path=test.md"
  ```

**Success Criteria**: MCP server operational, all CRUD operations work via REST API

**Reference**: [[../../architecture/obsidian-native-integration-analysis|Obsidian Integration Analysis]]

---

### Day 3: MCP Sync Consumer + Shadow Cache

**Morning (4 hours): MCP Sync Consumer**

- [ ] **Create MCP Sync Consumer** (`consumers/mcp_sync.py`):
  - Subscribe to `mcp_sync` queue (RabbitMQ)
  - Process vault.file.* events
  - Update shadow cache (SQLite)
  - Handle errors (send to DLQ)

- [ ] **Implement Shadow Cache** (`utils/shadow_cache.py`):
  ```python
  import sqlite3

  class ShadowCache:
      def __init__(self, db_path=".obsidian/plugins/weave-nn/metadata.db"):
          self.conn = sqlite3.connect(db_path)
          self.create_tables()

      def create_tables(self):
          self.conn.execute("""
              CREATE TABLE IF NOT EXISTS nodes (
                  file_path TEXT PRIMARY KEY,
                  node_type TEXT,
                  frontmatter TEXT,
                  tags TEXT,
                  links TEXT,
                  headings TEXT,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
          """)

      def upsert_node(self, file_path, node_type, frontmatter, tags, links, headings):
          self.conn.execute("""
              INSERT OR REPLACE INTO nodes
              (file_path, node_type, frontmatter, tags, links, headings, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          """, (file_path, node_type, json.dumps(frontmatter),
                json.dumps(tags), json.dumps(links), json.dumps(headings)))
          self.conn.commit()

      def query_by_tag(self, tag):
          cursor = self.conn.execute("""
              SELECT file_path, frontmatter FROM nodes
              WHERE tags LIKE ?
          """, (f'%{tag}%',))
          return cursor.fetchall()
  ```

- [ ] **Test MCP Sync**:
  - Start consumer: `python consumers/mcp_sync.py`
  - Create note in Obsidian
  - Verify cache updated: Query SQLite database

**Afternoon (4 hours): Claude-Flow Memory Sync**

- [ ] **Create Claude-Flow Memory Client** (`utils/claude_flow_client.py`):
  - Connect to Claude-Flow SQLite database
  - Store memory on vault changes
  - Query memory for semantic search

- [ ] **Implement Memory Sync** (in `consumers/mcp_sync.py`):
  - On file created/updated → Store in Claude-Flow memory
  - On file deleted → Mark deleted in memory

- [ ] **Test Memory Sync**:
  - Create note with wikilinks
  - Verify memory entry in Claude-Flow DB
  - Query memory: Verify relationships stored

**Success Criteria**: MCP sync operational, shadow cache updated on file changes, Claude-Flow memory synced

**Reference**: [[../../mcp/agent-rules|Agent Rules]], [[../../mcp/claude-flow-schema-mapping|Schema Mapping]]

---

### Day 4: Claude-Flow Agent Rules

**Morning (4 hours): Agent Rule Implementation**

- [ ] **Implement 6 Core Agent Rules**:
  1. **memory_sync** - Bidirectional sync (Obsidian ↔ Claude-Flow)
  2. **node_creation** - Auto-create nodes from agent intents
  3. **update_propagation** - Propagate changes to related nodes
  4. **schema_validation** - Validate YAML frontmatter
  5. **auto_linking** - Suggest wikilinks based on content
  6. **auto_tagging** - Suggest tags based on content

- [ ] **Create Agent Rules File** (`agents/rules.py`):
  ```python
  class AgentRules:
      def __init__(self, obsidian_client, shadow_cache, claude_flow):
          self.obsidian = obsidian_client
          self.cache = shadow_cache
          self.cf = claude_flow

      def auto_linking(self, file_path, content):
          """Suggest wikilinks based on content"""
          # Extract keywords
          keywords = self.extract_keywords(content)

          # Find matching nodes
          suggestions = []
          for keyword in keywords:
              matches = self.cache.query_by_tag(keyword)
              if matches:
                  suggestions.append({
                      "keyword": keyword,
                      "matches": matches,
                      "confidence": 0.85
                  })

          return suggestions

      def auto_tagging(self, file_path, frontmatter, content):
          """Suggest tags based on content"""
          # Use Claude to extract tags
          prompt = f"Extract 5 relevant tags from: {content}"
          tags = self.call_claude(prompt)
          return tags
  ```

- [ ] **Test Agent Rules**:
  - Create note without tags
  - Run auto_tagging rule
  - Verify tags suggested

**Afternoon (4 hours): Agent Integration Testing**

- [ ] **Create Agent Task Consumer** (`consumers/agent_tasks.py`):
  - Subscribe to `agent_tasks` queue
  - Process task.* events
  - Execute agent rules (auto-linking, auto-tagging)

- [ ] **End-to-End Test**:
  1. Create note in Obsidian
  2. File watcher publishes event
  3. MCP sync updates cache
  4. Agent receives task event
  5. Agent suggests links/tags
  6. Verify suggestions appear (log or API response)

**Success Criteria**: All 6 agent rules implemented, agents respond to vault events

**Reference**: [[../../mcp/agent-rules|MCP Agent Rules]]

---

### Day 5: Git Integration + Auto-Commit

**Morning (4 hours): Git Auto-Commit**

- [ ] **Create Git Integration** (`utils/git_client.py`):
  ```python
  from git import Repo

  class GitClient:
      def __init__(self, vault_path):
          self.repo = Repo(vault_path)

      def auto_commit(self, message=None):
          """Auto-commit all changes"""
          # Add all .md files
          self.repo.index.add(['**/*.md'])

          # Get changed files
          changed = [item.a_path for item in self.repo.index.diff('HEAD')]

          # Generate commit message
          if not message:
              if len(changed) == 1:
                  message = f"Updated {changed[0]}"
              else:
                  message = f"Updated {len(changed)} notes"

          # Commit
          self.repo.index.commit(message)

      def validate_pre_commit(self):
          """Validate before commit"""
          # Check for broken wikilinks
          # Check YAML frontmatter syntax
          # Return validation errors
          pass
  ```

- [ ] **Create Git Auto-Commit Consumer** (`consumers/git_auto_commit.py`):
  - Subscribe to `git_auto_commit` queue
  - Debounce events (5 seconds)
  - Auto-commit on vault.file.updated
  - Run pre-commit validation

- [ ] **Test Git Auto-Commit**:
  - Edit note in Obsidian
  - Wait 5 seconds
  - Verify commit created: `git log -1`

**Afternoon (4 hours): Workspace.json Watcher (Enhanced)**

- [ ] **Create Workspace Watcher** (`publishers/workspace_watcher.py`):
  ```python
  from watchdog.observers import Observer
  from watchdog.events import FileSystemEventHandler

  class WorkspaceWatcher(FileSystemEventHandler):
      def __init__(self, publisher, vault_path):
          self.publisher = publisher
          self.workspace_json = f"{vault_path}/.obsidian/workspace.json"
          self.last_modified = 0

      def on_modified(self, event):
          if event.src_path == self.workspace_json:
              current_time = os.path.getmtime(self.workspace_json)

              # Debounce (only trigger if 5 seconds since last change)
              if current_time - self.last_modified > 5:
                  self.last_modified = current_time

                  # Publish event (triggers auto-commit)
                  self.publisher.publish("vault.workspace.updated", {
                      "vault_id": "weave-nn",
                      "timestamp": current_time
                  })
  ```

- [ ] **Integrate Workspace Watcher**:
  - Start workspace watcher alongside file watcher
  - Publish to RabbitMQ on workspace.json changes
  - Git auto-commit consumer subscribes to workspace events

- [ ] **Test Workspace-Triggered Commit**:
  - Edit note in Obsidian
  - Close note (triggers workspace.json update)
  - Wait 5 seconds
  - Verify commit created

**Success Criteria**: Git auto-commit operational, workspace.json watcher triggers commits

**Reference**: [[../../features/git-integration|Git Integration]]

---

## ✅ Week 1 Success Criteria

### Infrastructure
- [x] RabbitMQ installed and operational
- [x] Exchange and 5 queues created
- [x] Obsidian plugins installed (REST API, Tasks, Mehrmaid, Advanced URI)

### Python Services
- [x] File watcher publishes events to RabbitMQ
- [x] MCP server with REST API client operational
- [x] 3 consumers running (mcp_sync, agent_tasks, git_auto_commit)

### Data Flow
- [x] Obsidian file change → RabbitMQ event → MCP sync → Shadow cache updated
- [x] Obsidian file change → RabbitMQ event → Git auto-commit → Commit created
- [x] Task event → RabbitMQ → Agent executes rules

### Agent Integration
- [x] 6 agent rules implemented
- [x] Claude-Flow memory synced with vault
- [x] Agents respond to vault events

### Git Automation
- [x] Auto-commit on file changes (debounced 5 seconds)
- [x] Workspace.json watcher triggers commits
- [x] Pre-commit validation (YAML, wikilinks)

---

## 🚧 Blockers & Risks

### Potential Blockers
1. **Obsidian REST API issues** - Fallback: Use Obsidian URI
2. **RabbitMQ performance** - Fallback: Increase VM resources
3. **Claude-Flow integration complexity** - Fallback: Simplify agent rules

### Mitigation Strategies
- Test each component in isolation before integration
- Have fallback approaches ready (URI vs REST API)
- Start with minimal agent rules, add more in Week 2

---

## 📊 Metrics to Track

### Development Metrics
- Lines of code written: ~2000 (estimated)
- Tests passing: 100%
- API response time: < 200ms
- RabbitMQ message throughput: > 100 msg/sec

### Functional Metrics
- File watcher latency: < 1 second (file change → event published)
- MCP sync latency: < 2 seconds (event → cache updated)
- Git commit latency: < 5 seconds (file change → commit)

---

## 🔗 Related Documentation

### Features Implemented This Week
- [[../../features/rabbitmq-message-queue|RabbitMQ Message Queue]]
- [[../../features/git-integration|Git Integration]]
- [[../../mcp/agent-rules|MCP Agent Rules]]

### Architecture References
- [[../../architecture/obsidian-native-integration-analysis|Obsidian Integration]]
- [[../../architecture/obsidian-first-architecture|Obsidian-First Architecture]]
- [[../../architecture/ai-integration-layer|AI Integration Layer]]

### Next Phase
- [[phase-6-mvp-week-2|Phase 6: MVP Week 2]] - N8N workflows, task management, client deployment

---

## 📝 Daily Standup Template

Use this for daily progress tracking:

```markdown
## Day X Standup

**Yesterday**:
- Completed: [list accomplishments]
- Blockers: [list blockers]

**Today**:
- Plan: [list tasks for today]
- Focus: [primary goal]

**Blockers**:
- [list any blockers]

**Needs**:
- [help needed, if any]
```

---

**Status**: ⏳ **PENDING**
**Ready to Start**: After Phase 4 completion ✅
**Estimated Effort**: 40 hours (8 hours/day × 5 days)
**Next Phase**: [[phase-6-mvp-week-2|Phase 6: MVP Week 2]]
