---
title: 'Test Strategy Report: Weave-NN MVP Development'
type: implementation
status: in-progress
phase_id: PHASE-5
tags:
  - phase/phase-5
  - type/implementation
  - status/in-progress
priority: critical
visual:
  icon: "\U0001F4CB"
  color: '#7ED321'
  cssclasses:
    - implementation-document
updated: '2025-10-29T04:55:04.095Z'
keywords:
  - executive summary
  - table of contents
  - critical integration points
  - 1. file watcher → rabbitmq publisher
  - 2. rabbitmq exchange → queue routing
  - 3. mcp sync consumer → shadow cache
  - 4. obsidian rest api → mcp server
  - 5. git auto-commit consumer → git repository
  - 6. claude-flow memory sync
  - 7. agent rules execution
---
# Test Strategy Report: Weave-NN MVP Development

**Report Date**: 2025-10-21
**Agent**: TESTER (Hive Mind Swarm)
**Scope**: Phase 5 & Phase 6 MVP Development (Days 0-14)
**Status**: Complete

---

## Executive Summary

This report provides a comprehensive testing strategy for the Weave-NN MVP development across Phases 5 and 6. The strategy identifies critical integration points, end-to-end test scenarios, missing verification steps, and recommended testing frameworks. The architecture is event-driven with RabbitMQ as the central message bus, requiring careful integration testing across multiple async components.

**Key Findings**:
- 14 critical integration points identified
- 8 missing verification steps discovered in current plan
- 23 end-to-end test scenarios designed
- 3 testing frameworks recommended for implementation
- Risk-based testing approach prioritized for 2-week timeline

---

## Table of Contents

1. [Critical Integration Points](#critical-integration-points)
2. [End-to-End Test Scenarios (Days 0-14)](#end-to-end-test-scenarios)
3. [Missing Verification Steps](#missing-verification-steps)
4. [Recommended Testing Tools & Frameworks](#recommended-testing-tools-frameworks)
5. [Test Execution Schedule](#test-execution-schedule)
6. [Risk Assessment & Mitigation](#risk-assessment-mitigation)
7. [Acceptance Criteria Validation](#acceptance-criteria-validation)

---

## Critical Integration Points

### 1. File Watcher → RabbitMQ Publisher

**Component**: `publishers/file_watcher.py`
**Integration**: Obsidian file system → RabbitMQ exchange
**Risk Level**: **CRITICAL**

**Test Requirements**:
- File creation triggers `vault.file.created` event
- File modification triggers `vault.file.updated` event
- File deletion triggers `vault.file.deleted` event
- Frontmatter parsing handles malformed YAML gracefully
- Debouncing prevents duplicate events (500ms window)
- Ignores .obsidian/ directory (except workspace.json)

**Test Cases**:
```python
# TC-001: File creation event
def test_file_creation_publishes_event():
    # Setup: Start file watcher, connect to RabbitMQ
    # Action: Create test.md in vault
    # Assert: Event with routing_key "vault.file.created" published
    # Assert: Event payload contains correct file_path and frontmatter

# TC-002: Rapid file changes (debouncing)
def test_debouncing_rapid_changes():
    # Setup: Create test.md
    # Action: Modify file 5 times within 500ms
    # Assert: Only 1 event published (last modification)

# TC-003: Malformed frontmatter handling
def test_malformed_yaml_frontmatter():
    # Setup: Create file with invalid YAML
    # Action: Trigger file event
    # Assert: Event published with empty frontmatter dict
    # Assert: Error logged but watcher doesn't crash
```

---

### 2. RabbitMQ Exchange → Queue Routing

**Component**: RabbitMQ topic exchange `weave-nn.events`
**Integration**: Topic-based routing to 5 queues
**Risk Level**: **CRITICAL**

**Test Requirements**:
- Exchange correctly routes `vault.*.*` to `n8n_workflows`
- Exchange correctly routes `vault.file.*` to `mcp_sync`
- Exchange correctly routes `vault.file.updated` to `git_auto_commit`
- Exchange correctly routes `task.*` to `agent_tasks`
- Failed messages route to `dlq`

**Test Cases**:
```bash
# TC-004: Topic routing validation
# Publish: event with routing_key "vault.file.created"
# Assert: Event appears in queues: n8n_workflows, mcp_sync
# Assert: Event does NOT appear in: git_auto_commit, agent_tasks

# TC-005: Dead letter queue routing
# Publish: event to mcp_sync
# Action: Consumer rejects with nack(requeue=false)
# Assert: Event moves to dlq after max retries
```

---

### 3. MCP Sync Consumer → Shadow Cache

**Component**: `consumers/mcp_sync.py` → SQLite database
**Integration**: RabbitMQ events → SQLite metadata cache
**Risk Level**: **HIGH**

**Test Requirements**:
- Consumer processes events without data loss
- SQLite cache updated within 2 seconds of event
- Concurrent file changes handled correctly
- Cache queries return correct results
- Database schema matches expected structure

**Test Cases**:
```python
# TC-006: Event processing to cache sync
def test_event_to_cache_sync():
    # Setup: Start consumer, empty cache
    # Action: Publish vault.file.created event
    # Assert: SQLite record created within 2s
    # Assert: Record contains frontmatter, tags, links

# TC-007: Concurrent event handling
def test_concurrent_events():
    # Setup: Start consumer
    # Action: Publish 10 events simultaneously
    # Assert: All 10 events processed
    # Assert: No database lock errors
    # Assert: All cache entries correct
```

---

### 4. Obsidian REST API → MCP Server

**Component**: `utils/obsidian_client.py`
**Integration**: Python requests → Obsidian Local REST API plugin
**Risk Level**: **CRITICAL**

**Test Requirements**:
- Create note via POST `/vault/{path}` succeeds
- Read note via GET `/vault/{path}` returns content
- Update note via PUT `/vault/{path}` modifies existing
- Delete note via DELETE `/vault/{path}` removes file
- List notes via GET `/vault/` returns all markdown files
- PATCH note section inserts content at heading
- API authentication (Bearer token) works
- SSL certificate validation (self-signed) handled

**Test Cases**:
```python
# TC-008: CRUD operations end-to-end
def test_crud_operations():
    # Create: POST with frontmatter + content
    # Assert: File exists in Obsidian vault
    # Read: GET same path
    # Assert: Content matches created
    # Update: PUT with new content
    # Assert: File content changed
    # Delete: DELETE path
    # Assert: File no longer exists

# TC-009: Error handling for missing files
def test_read_nonexistent_file():
    # Action: GET /vault/nonexistent.md
    # Assert: HTTP 404 returned
    # Assert: Error message is descriptive
```

---

### 5. Git Auto-Commit Consumer → Git Repository

**Component**: `consumers/git_auto_commit.py` → GitPython
**Integration**: RabbitMQ events → Git commits
**Risk Level**: **MEDIUM**

**Test Requirements**:
- Debouncing (5 seconds) prevents excessive commits
- Only .md files staged and committed
- Commit messages descriptive (single file vs multiple)
- Pre-commit validation runs (YAML, wikilinks)
- workspace.json triggers commits correctly

**Test Cases**:
```python
# TC-010: Debounced commit
def test_debounced_git_commit():
    # Setup: Start consumer, clean git repo
    # Action: Modify 3 files within 5 seconds
    # Wait: 6 seconds
    # Assert: 1 commit created (not 3)
    # Assert: Commit message mentions "3 notes"

# TC-011: Pre-commit validation
def test_pre_commit_validation():
    # Setup: Create file with broken wikilink
    # Action: Trigger commit
    # Assert: Validation detects broken link
    # Assert: Commit blocked or warning logged
```

---

### 6. Claude-Flow Memory Sync

**Component**: `utils/claude_flow_client.py`
**Integration**: MCP sync → Claude-Flow SQLite
**Risk Level**: **MEDIUM**

**Test Requirements**:
- Memory stored on file creation/update
- Memory marked deleted on file deletion
- Relationship graph updated for wikilinks
- Bidirectional sync (Obsidian ↔ Claude-Flow)
- Conflict resolution (last-write-wins)

**Test Cases**:
```python
# TC-012: Bidirectional sync
def test_bidirectional_sync():
    # Phase 1: Obsidian → Claude-Flow
    # Action: Create note with wikilinks
    # Assert: Memory created in Claude-Flow DB
    # Assert: Relationships stored

    # Phase 2: Claude-Flow → Obsidian
    # Action: Update memory in CF DB
    # Assert: Note updated in Obsidian
    # Assert: Content matches memory

# TC-013: Wikilink relationship mapping
def test_wikilink_relationships():
    # Action: Create note with [[concept-a]], [[concept-b]]
    # Assert: CF memory has 2 relationships
    # Assert: Relationship types correct
```

---

### 7. Agent Rules Execution

**Component**: `agents/rules.py` (6 rules)
**Integration**: Agent tasks queue → Rule execution
**Risk Level**: **MEDIUM**

**Test Requirements**:
- All 6 rules (memory_sync, node_creation, update_propagation, schema_validation, auto_linking, auto_tagging) execute
- Rules execute in correct priority order
- Auto-suggestions generated correctly
- Rule coordination prevents conflicts

**Test Cases**:
```python
# TC-014: Auto-linking rule
def test_auto_linking_suggestions():
    # Setup: Create 2 related notes
    # Action: Create 3rd note mentioning both
    # Trigger: auto_linking rule
    # Assert: Suggestions generated
    # Assert: Confidence scores calculated
    # Assert: Top suggestions correct

# TC-015: Auto-tagging rule
def test_auto_tagging():
    # Setup: Create note with minimal tags
    # Trigger: auto_tagging rule
    # Assert: Tags suggested based on content
    # Assert: Required tags auto-applied
    # Assert: Optional tags presented for review
```

---

### 8. N8N Workflow Triggers

**Component**: N8N workflows
**Integration**: RabbitMQ events → N8N nodes
**Risk Level**: **HIGH**

**Test Requirements**:
- RabbitMQ trigger node receives events
- Client onboarding workflow creates all files
- Weekly report workflow queries tasks correctly
- Knowledge extraction workflow parses project files
- Claude API integration works in workflows

**Test Cases**:
```javascript
// TC-016: Client onboarding workflow
// Trigger: POST /webhook/onboard-client
// Payload: {"client_name": "Test Corp", "contact": "test@test.com"}
// Assert: Folder _projects/Test Corp/ created
// Assert: 4 files created (README, requirements, tasks, decisions)
// Assert: Git commit exists
// Assert: Slack notification sent

// TC-017: Weekly report generation
// Setup: Create 10 completed tasks
// Trigger: Cron (Friday 5pm) or manual
// Assert: Report file created in _planning/weekly-reports/
// Assert: Claude API called
// Assert: Task count accurate
// Assert: Git commit count correct
```

---

### 9. Task Management Integration

**Component**: MCP task tools → obsidian-tasks plugin
**Integration**: Task parsing → CRUD operations
**Risk Level**: **MEDIUM**

**Test Requirements**:
- Task parser extracts due dates, priorities, tags
- list_tasks filters by project and status
- create_task appends to correct file
- complete_task updates checkbox
- obsidian-tasks queries work

**Test Cases**:
```python
# TC-018: Task CRUD lifecycle
def test_task_lifecycle():
    # Create: POST /mcp/create_task
    # Assert: Task appears in file with correct format
    # List: GET /mcp/list_tasks
    # Assert: New task in response
    # Complete: PUT /mcp/complete_task
    # Assert: Checkbox changed from [ ] to [x]
    # List again: GET /mcp/list_tasks?status=done
    # Assert: Task appears in completed list
```

---

### 10. Workspace.json Watcher

**Component**: `publishers/workspace_watcher.py`
**Integration**: Obsidian workspace changes → Git commits
**Risk Level**: **LOW**

**Test Requirements**:
- workspace.json changes detected
- Debouncing (5 seconds) works
- Commits triggered after file close
- workspace.json NOT included in commits

**Test Cases**:
```python
# TC-019: Workspace-triggered commit
def test_workspace_commit():
    # Setup: Edit note in Obsidian
    # Action: Close note (updates workspace.json)
    # Wait: 6 seconds
    # Assert: Commit created
    # Assert: Edited note in commit
    # Assert: workspace.json NOT in commit
```

---

### 11. Mehrmaid Visualization Generation

**Component**: `scripts/generate_visualizations.py`
**Integration**: Vault data → Mehrmaid diagrams
**Risk Level**: **LOW**

**Test Requirements**:
- Diagrams render in Obsidian
- Wikilinks clickable in nodes
- LaTeX (if used) renders correctly
- Diagram layout readable

**Test Cases**:
```python
# TC-020: Decision tree generation
def test_decision_tree():
    # Setup: Create 5 decision nodes
    # Action: Run generate_decision_tree()
    # Assert: File visualizations/decision-tree.md created
    # Assert: Mehrmaid syntax valid
    # Assert: All 5 decisions in diagram
    # Manual: Open in Obsidian, verify rendering
```

---

### 12. Obsidian Properties Bulk Update

**Component**: `scripts/apply_tags.py`
**Integration**: Vault nodes → Updated frontmatter
**Risk Level**: **MEDIUM**

**Test Requirements**:
- All 64+ nodes processed
- Frontmatter updated correctly
- No content corruption
- Dry-run mode works

**Test Cases**:
```python
# TC-021: Bulk property application
def test_bulk_update():
    # Setup: 64 nodes without properties
    # Action: Run apply_tags.py (dry-run)
    # Assert: Preview shows correct changes
    # Action: Run apply_tags.py (actual)
    # Assert: All 64 nodes updated
    # Assert: Frontmatter valid YAML
    # Assert: Content unchanged
```

---

### 13. Multi-Service Orchestration

**Component**: All services running simultaneously
**Integration**: End-to-end workflow
**Risk Level**: **CRITICAL**

**Test Requirements**:
- All services start without conflicts
- Services communicate via RabbitMQ
- No race conditions
- Graceful shutdown

**Test Cases**:
```bash
# TC-022: Full stack integration
# Start: file_watcher, mcp_sync, git_auto_commit, agent_tasks, n8n
# Action: Create note → Edit → Add task → Close
# Assert: File watcher publishes
# Assert: MCP sync updates cache
# Assert: Claude-Flow memory synced
# Assert: Git commit created
# Assert: N8N workflow triggered
# Assert: Agent suggests links/tags
# Duration: < 10 seconds total
```

---

### 14. Error Recovery & Resilience

**Component**: All consumers
**Integration**: RabbitMQ DLQ, retry logic
**Risk Level**: **HIGH**

**Test Requirements**:
- Failed messages route to DLQ
- Exponential backoff retries
- Services recover from crashes
- No message loss

**Test Cases**:
```python
# TC-023: DLQ routing on failure
def test_dlq_on_failure():
    # Setup: Create consumer with failing handler
    # Action: Publish event
    # Assert: Consumer tries 3 times
    # Assert: After 3 failures, message in DLQ
    # Assert: Original message intact

# TC-024: Service crash recovery
def test_crash_recovery():
    # Setup: Start consumer
    # Action: Kill consumer process
    # Action: Restart consumer
    # Assert: Consumer reconnects to RabbitMQ
    # Assert: Unacked messages redelivered
```

---

## End-to-End Test Scenarios

### Day-by-Day Test Scenarios (Days 0-14)

#### Day 0: Prerequisites & Plugin Installation

**Success Criteria Validation**:

**Scenario E2E-01: Obsidian Plugins Installation**
```
Precondition: Fresh Obsidian vault
Steps:
  1. Install obsidian-local-rest-api plugin
  2. Generate API key
  3. Test: curl -k -H "Authorization: Bearer {key}" https://localhost:27124/vault/
  4. Install obsidian-mehrmaid plugin
  5. Create test note with mehrmaid graph
  6. Install obsidian-tasks plugin
  7. Create test task query
  8. Install obsidian-advanced-uri plugin (fallback)
Expected:
  ✓ All 4 plugins installed and enabled
  ✓ REST API responds with vault metadata
  ✓ Mehrmaid graph renders with clickable wikilinks
  ✓ Task queries return results
  ✓ URI scheme works: obsidian://open?vault=weave-nn
```

**Scenario E2E-02: Development Environment Setup**
```
Precondition: Python 3.11+ installed
Steps:
  1. Create virtual environment: python3 -m venv .venv
  2. Activate: source .venv/bin/activate
  3. Install dependencies: pip install fastapi uvicorn pika requests pyyaml watchdog gitpython
  4. Create .env file with all required variables
  5. Verify: pip list shows all packages
Expected:
  ✓ Virtual environment active
  ✓ All dependencies installed
  ✓ .env file contains OBSIDIAN_API_URL, OBSIDIAN_API_KEY, RABBITMQ_URL, CLAUDE_API_KEY
  ✓ No version conflicts
```

---

#### Day 1: RabbitMQ + File Watcher Setup

**Scenario E2E-03: RabbitMQ Infrastructure**
```
Precondition: Docker installed
Steps:
  1. Start RabbitMQ: docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
  2. Access UI: http://localhost:15672 (admin/password)
  3. Create exchange: weave-nn.events (topic)
  4. Create 5 queues: n8n_workflows, mcp_sync, git_auto_commit, agent_tasks, dlq
  5. Bind queues to exchange with routing keys
  6. Publish test message: vault.file.created
  7. Verify message in mcp_sync queue
Expected:
  ✓ RabbitMQ container running
  ✓ Management UI accessible
  ✓ Exchange and queues created
  ✓ Bindings correct
  ✓ Test message routed to mcp_sync and n8n_workflows
```

**Scenario E2E-04: File Watcher Integration**
```
Precondition: RabbitMQ running, vault accessible
Steps:
  1. Start file watcher: python publishers/file_watcher.py
  2. Create test.md in Obsidian with frontmatter
  3. Check RabbitMQ UI: Queues → mcp_sync → Get Messages
  4. Verify event payload contains file_path and frontmatter
  5. Modify test.md
  6. Verify vault.file.updated event published
  7. Delete test.md
  8. Verify vault.file.deleted event published
Expected:
  ✓ File watcher running without errors
  ✓ Create event published < 1 second
  ✓ Update event published < 1 second
  ✓ Delete event published < 1 second
  ✓ Frontmatter parsed correctly (JSON in event)
```

---

#### Day 2: Python MCP Server Core

**Scenario E2E-05: REST API Client**
```
Precondition: Obsidian REST API plugin configured
Steps:
  1. Test create_note(): Create test.md via REST
  2. Verify file exists in Obsidian
  3. Test read_note(): Read test.md
  4. Verify content matches
  5. Test update_note(): Modify content
  6. Verify changes in Obsidian
  7. Test delete_note(): Remove test.md
  8. Verify file deleted
  9. Test list_notes(): Get all .md files
  10. Verify returns correct file paths
Expected:
  ✓ All CRUD operations succeed
  ✓ Response times < 200ms
  ✓ HTTP errors handled gracefully (404, 500)
  ✓ SSL certificate validation works
```

**Scenario E2E-06: MCP Server Endpoints**
```
Precondition: MCP server running (uvicorn server:app)
Steps:
  1. Test health: curl http://localhost:8000/health
  2. Test create: POST /mcp/create_note
  3. Test read: GET /mcp/read_note
  4. Test update: PUT /mcp/update_note
  5. Test delete: DELETE /mcp/delete_note
  6. Test list: GET /mcp/list_notes
  7. Access /docs (Swagger UI)
Expected:
  ✓ Health returns {"status": "ok"}
  ✓ All CRUD endpoints work
  ✓ Swagger UI accessible with examples
  ✓ Error responses have descriptive messages
```

---

#### Day 3: MCP Sync Consumer + Shadow Cache

**Scenario E2E-07: Shadow Cache Sync**
```
Precondition: File watcher + MCP sync consumer running
Steps:
  1. Create note concepts/test-concept.md with frontmatter
  2. Wait 2 seconds
  3. Query SQLite: SELECT * FROM nodes WHERE file_path='concepts/test-concept.md'
  4. Verify record exists with frontmatter, tags, links
  5. Update note, add wikilink [[another-concept]]
  6. Wait 2 seconds
  7. Query cache again
  8. Verify links field updated
Expected:
  ✓ Cache entry created within 2 seconds
  ✓ Frontmatter parsed and stored as JSON
  ✓ Tags extracted correctly
  ✓ Wikilinks extracted and stored
  ✓ Updated_at timestamp current
```

**Scenario E2E-08: Claude-Flow Memory Sync**
```
Precondition: Claude-Flow client configured
Steps:
  1. Create note with wikilinks
  2. Verify event triggers memory sync
  3. Query Claude-Flow DB: SELECT * FROM memories WHERE key='test-concept'
  4. Verify memory entry exists
  5. Verify relationships stored for wikilinks
  6. Delete note
  7. Verify memory marked as deleted (soft delete)
Expected:
  ✓ Memory created within 2 seconds
  ✓ Relationships mapped correctly
  ✓ Deleted flag set on file deletion
  ✓ Memory content matches note content
```

---

#### Day 4: Claude-Flow Agent Rules

**Scenario E2E-09: Agent Rules Execution**
```
Precondition: All 6 agent rules implemented, agent consumer running
Steps:
  1. Create note without tags
  2. Wait for auto_tagging rule
  3. Verify tags suggested
  4. Create note with related content
  5. Wait for auto_linking rule
  6. Verify link suggestions generated
  7. Update note status
  8. Verify update_propagation rule triggers
  9. Check related nodes updated
Expected:
  ✓ Auto-tagging suggests 5+ tags
  ✓ Auto-linking suggests 3+ links
  ✓ Update propagation updates dependent nodes
  ✓ All rules execute within 10 seconds
```

**Scenario E2E-10: Full Agent Pipeline**
```
Precondition: File watcher, MCP sync, agent consumer running
Steps:
  1. Create concepts/temporal-queries.md
  2. File watcher publishes event
  3. MCP sync updates cache
  4. Agent receives task event
  5. Agent rules execute (auto-linking, auto-tagging)
  6. Check logs for agent suggestions
Expected:
  ✓ End-to-end pipeline < 5 seconds
  ✓ Cache updated
  ✓ Memory synced
  ✓ Suggestions logged
  ✓ No errors in any service
```

---

#### Day 5: Git Integration + Auto-Commit

**Scenario E2E-11: Git Auto-Commit**
```
Precondition: Git repo initialized, git consumer running
Steps:
  1. Edit note in Obsidian
  2. Wait 5 seconds (debounce)
  3. Check git log -1
  4. Verify commit created
  5. Verify commit message descriptive
  6. Edit 3 files rapidly
  7. Wait 5 seconds
  8. Verify 1 commit (not 3)
Expected:
  ✓ Commit created after 5s debounce
  ✓ Message format: "Updated {filename}" or "Updated 3 notes"
  ✓ Only .md files committed
  ✓ workspace.json NOT committed
```

**Scenario E2E-12: Workspace-Triggered Commit**
```
Precondition: Workspace watcher running
Steps:
  1. Edit note in Obsidian
  2. Close note (triggers workspace.json update)
  3. Wait 5 seconds
  4. Check git log -1
  5. Verify commit includes edited note
  6. Verify workspace.json NOT in commit
Expected:
  ✓ Commit triggered by workspace change
  ✓ Edited file in commit
  ✓ workspace.json excluded
```

---

#### Day 8: N8N Installation + Client Onboarding

**Scenario E2E-13: N8N Setup**
```
Precondition: Docker available
Steps:
  1. Start N8N: docker run -d --name n8n -p 5678:5678 n8nio/n8n
  2. Access UI: http://localhost:5678
  3. Complete setup wizard
  4. Configure credentials: Obsidian API, GitHub, Slack, Claude, RabbitMQ
  5. Test each credential connection
Expected:
  ✓ N8N accessible
  ✓ All 5 credentials configured
  ✓ Test connections successful
```

**Scenario E2E-14: Client Onboarding Workflow**
```
Precondition: N8N running, workflow created
Steps:
  1. Trigger: curl -X POST http://localhost:5678/webhook/onboard-client \
               -d '{"client_name": "Acme Corp", "contact": "john@acme.com"}'
  2. Verify folder created: _projects/Acme Corp/
  3. Verify 4 files created: README.md, requirements.md, tasks.md, decisions.md
  4. Verify placeholders replaced with "Acme Corp" and "john@acme.com"
  5. Verify 3 initial tasks created
  6. Verify git commit exists
  7. Verify Slack notification sent
Expected:
  ✓ Workflow executes < 30 seconds
  ✓ All files created with correct content
  ✓ Git commit message: "feat: Initialize project for Acme Corp"
  ✓ Slack message in #new-projects
```

---

#### Day 9: Advanced N8N Workflows

**Scenario E2E-15: Weekly Report Workflow**
```
Precondition: Tasks exist, git commits exist
Steps:
  1. Create 5 completed tasks this week
  2. Create 5 git commits this week
  3. Trigger workflow manually
  4. Verify queries tasks correctly (5 tasks)
  5. Verify queries git commits correctly (5 commits)
  6. Verify Claude API called with tasks + commits data
  7. Verify report file created: _planning/weekly-reports/2025-10-29.md
  8. Verify Slack message sent
Expected:
  ✓ Task count accurate
  ✓ Commit count accurate
  ✓ Claude summary coherent
  ✓ Report file has frontmatter + summary + breakdown
```

**Scenario E2E-16: Knowledge Extraction Workflow**
```
Precondition: Project with requirements.md, decisions.md exists
Steps:
  1. Publish RabbitMQ event: {"type": "project.closed", "project_id": "test-project"}
  2. Workflow triggers
  3. Verify reads project files
  4. Verify Claude extracts patterns
  5. Verify knowledge base files created (patterns/, components/, lessons/)
  6. Verify pattern index updated
  7. Verify project archived to _archive/test-project-2025-10-29/
Expected:
  ✓ Workflow executes < 60 seconds
  ✓ 4+ knowledge files created
  ✓ Pattern index has new entries
  ✓ Project moved to archive
  ✓ Git commit with archive
```

---

#### Day 10: Task Management Integration

**Scenario E2E-17: Task MCP Tools**
```
Precondition: MCP server running, obsidian-tasks configured
Steps:
  1. Create task: POST /mcp/create_task
     {"title": "Test task", "file_path": "_projects/test/tasks.md", "due_date": "2025-10-30", "priority": "high"}
  2. Verify file updated with task
  3. List tasks: GET /mcp/list_tasks
  4. Verify new task in response
  5. Complete task: PUT /mcp/complete_task {"file_path": "...", "line_number": 5}
  6. Verify checkbox changed to [x]
  7. List completed: GET /mcp/list_tasks?status=done
  8. Verify task appears
Expected:
  ✓ Task created with format: - [ ] Test task 📅 2025-10-30 ⏫
  ✓ List returns all tasks
  ✓ Complete updates file
  ✓ Filtering works
```

**Scenario E2E-18: Agent Task Workflows**
```
Precondition: N8N workflows created
Steps:
  1. Create 5 tasks: 2 due today, 1 overdue, 2 future
  2. Trigger daily task summary (9am cron or manual)
  3. Verify summary includes 3 tasks (today + overdue)
  4. Create meeting note: meetings/2025-10-30.md with action items
  5. Trigger meeting notes workflow
  6. Verify 3 tasks created from action items
Expected:
  ✓ Summary accurate
  ✓ Meeting notes parsed correctly
  ✓ Tasks created with correct metadata
```

---

#### Day 11: Obsidian Properties & Visualization

**Scenario E2E-19: Bulk Properties Application**
```
Precondition: 64+ nodes exist without properties
Steps:
  1. Run: python scripts/apply_tags.py --dry-run
  2. Verify preview shows correct changes
  3. Run: python scripts/apply_tags.py
  4. Verify all 64+ nodes updated
  5. Spot-check 10 random files
  6. Verify frontmatter valid YAML
  7. Verify content unchanged
  8. Verify tags correct based on folder/type
Expected:
  ✓ All nodes processed
  ✓ No content corruption
  ✓ Frontmatter has icon, cssclasses, tags
  ✓ Git commit created
```

**Scenario E2E-20: Mehrmaid Visualizations**
```
Precondition: Nodes have metadata, script created
Steps:
  1. Run: python scripts/generate_visualizations.py
  2. Verify 4 files created:
     - visualizations/decision-tree.md
     - visualizations/feature-graph.md
     - visualizations/architecture-diagram.md
     - visualizations/phase-timeline.md
  3. Open each in Obsidian
  4. Verify Mehrmaid diagrams render
  5. Click wikilinks in diagrams
  6. Verify navigation works
Expected:
  ✓ All 4 visualizations created
  ✓ Diagrams render without errors
  ✓ Wikilinks clickable
  ✓ Layout readable (no overlap)
```

---

#### Day 12: Client Project Deployment

**Scenario E2E-21: Real Client Project**
```
Precondition: All services running
Steps:
  1. Trigger client onboarding for real client
  2. Import existing client documentation
  3. Create requirements.md with real requirements
  4. Create 10 tasks in tasks.md
  5. Wait for agent suggestions
  6. Create note → Edit → Add task → Close
  7. Verify full pipeline:
     - File watcher publishes
     - MCP sync updates cache
     - Claude-Flow memory synced
     - Git commit created
     - N8N workflow triggered (if applicable)
     - Agent suggests links/tags
Expected:
  ✓ Full workflow < 10 seconds
  ✓ All components working
  ✓ No errors in any service
  ✓ Client project operational
```

---

#### Day 13-14: Documentation & Polish

**Scenario E2E-22: Performance Benchmarks**
```
Precondition: All services running
Steps:
  1. Create 100 notes rapidly
  2. Measure: File watcher latency (file change → event)
  3. Measure: MCP sync latency (event → cache update)
  4. Measure: Git commit latency (file change → commit)
  5. Measure: Agent response time (event → suggestions)
  6. Create 100 tasks
  7. Query: GET /mcp/list_tasks (measure response time)
Expected:
  ✓ File watcher < 1 second
  ✓ MCP sync < 2 seconds
  ✓ Git commit < 5 seconds (after debounce)
  ✓ Agent response < 10 seconds
  ✓ Task query < 100ms (shadow cache)
```

**Scenario E2E-23: Error Recovery**
```
Precondition: All services running
Steps:
  1. Kill MCP sync consumer
  2. Publish 10 events
  3. Restart consumer
  4. Verify 10 events redelivered and processed
  5. Publish event with malformed JSON
  6. Verify event sent to DLQ after retries
  7. Stop RabbitMQ
  8. Verify file watcher retries connection
  9. Start RabbitMQ
  10. Verify file watcher reconnects
Expected:
  ✓ No message loss
  ✓ Automatic reconnection
  ✓ DLQ routing on failures
  ✓ Services resilient to crashes
```

---

## Missing Verification Steps

After analyzing the current Phase 5 and Phase 6 plans, the following verification steps are **missing** or **under-specified**:

### 1. **RabbitMQ Message Ordering**

**Missing**: Verification that messages are processed in order
**Risk**: Race conditions if events processed out of sequence
**Recommendation**: Add test to verify FIFO ordering within a queue

```python
# TC-MISSING-01: Message ordering
def test_message_ordering():
    # Publish 10 events in sequence
    # Assert: Consumer processes in same order
```

---

### 2. **Concurrent File Modifications**

**Missing**: Test for simultaneous edits to same file
**Risk**: Database lock errors, lost updates
**Recommendation**: Add concurrency stress test

```python
# TC-MISSING-02: Concurrent file edits
def test_concurrent_edits():
    # Start 5 threads
    # Each thread: Edit same file
    # Assert: All updates applied (no lost writes)
    # Assert: No SQLite lock errors
```

---

### 3. **Large File Handling**

**Missing**: Test for files > 1MB
**Risk**: Timeouts, memory issues
**Recommendation**: Add test with large markdown file

```python
# TC-MISSING-03: Large file handling
def test_large_file():
    # Create 5MB markdown file
    # Trigger file watcher event
    # Assert: Event published successfully
    # Assert: No timeout errors
```

---

### 4. **Frontmatter Schema Evolution**

**Missing**: Test for backward compatibility when templates change
**Risk**: Old nodes break when schema updates
**Recommendation**: Add migration test

```python
# TC-MISSING-04: Schema migration
def test_schema_migration():
    # Create node with old schema (v1)
    # Update template to new schema (v2)
    # Run migration script
    # Assert: Old nodes updated to v2
    # Assert: Content preserved
```

---

### 5. **RabbitMQ Cluster Failure**

**Missing**: Test for RabbitMQ unavailability
**Risk**: System hangs if RabbitMQ down
**Recommendation**: Add resilience test

```python
# TC-MISSING-05: RabbitMQ unavailable
def test_rabbitmq_unavailable():
    # Stop RabbitMQ
    # Trigger file watcher event
    # Assert: File watcher logs error
    # Assert: File watcher retries connection
    # Start RabbitMQ
    # Assert: File watcher reconnects
    # Assert: Buffered events published
```

---

### 6. **Claude API Rate Limiting**

**Missing**: Test for Claude API quota exhaustion
**Risk**: Workflows fail if quota exceeded
**Recommendation**: Add rate limit handling test

```javascript
// TC-MISSING-06: Claude API rate limit
// Setup: Mock Claude API to return 429
// Trigger: N8N workflow with Claude node
// Assert: Workflow retries with backoff
// Assert: User notified of rate limit
```

---

### 7. **Git Merge Conflicts**

**Missing**: Test for concurrent git commits causing conflicts
**Risk**: Lost changes if conflicts not handled
**Recommendation**: Add conflict resolution test

```python
# TC-MISSING-07: Git merge conflict
def test_git_conflict():
    # Setup: 2 git auto-commit consumers
    # Both: Modify different files simultaneously
    # Assert: No conflicts (different files)
    # Both: Modify SAME file simultaneously
    # Assert: Conflict detected
    # Assert: User notified
```

---

### 8. **Obsidian Plugin Crash Recovery**

**Missing**: Test for Obsidian REST API plugin failure
**Risk**: MCP server can't access vault
**Recommendation**: Add fallback test

```python
# TC-MISSING-08: REST API unavailable
def test_rest_api_unavailable():
    # Setup: Stop Obsidian or disable plugin
    # Action: MCP server tries to create note
    # Assert: HTTP error caught
    # Assert: Fallback to URI or file system (if configured)
    # Assert: User notified
```

---

## Recommended Testing Tools & Frameworks

### 1. **pytest** (Python Testing Framework)

**Purpose**: Unit and integration tests for Python components
**Why**: Industry standard, powerful fixtures, parametrization

**Installation**:
```bash
pip install pytest pytest-cov pytest-asyncio pytest-mock
```

**Project Structure**:
```
weave-nn-mcp/
├── tests/
│   ├── unit/
│   │   ├── test_obsidian_client.py
│   │   ├── test_rabbitmq_publisher.py
│   │   ├── test_task_parser.py
│   │   ├── test_git_client.py
│   │   └── test_shadow_cache.py
│   ├── integration/
│   │   ├── test_file_watcher_rabbitmq.py
│   │   ├── test_mcp_sync_consumer.py
│   │   ├── test_agent_rules.py
│   │   └── test_git_auto_commit.py
│   └── e2e/
│       ├── test_full_pipeline.py
│       └── test_client_onboarding.py
├── conftest.py  # Shared fixtures
└── pytest.ini   # Configuration
```

**Sample Test**:
```python
# tests/unit/test_obsidian_client.py
import pytest
from utils.obsidian_client import ObsidianRESTClient

@pytest.fixture
def obsidian_client():
    """Fixture for Obsidian REST client"""
    return ObsidianRESTClient(
        api_url="https://localhost:27124",
        api_key="test-key"
    )

def test_create_note(obsidian_client, mocker):
    """Test create_note method"""
    # Mock requests.post
    mock_post = mocker.patch('requests.post')
    mock_post.return_value.status_code = 201
    mock_post.return_value.json.return_value = {"success": True}

    # Call method
    result = obsidian_client.create_note(
        path="test.md",
        content="Test content",
        frontmatter={"tags": ["test"]}
    )

    # Assertions
    assert result["success"] is True
    mock_post.assert_called_once()
```

**Configuration** (`pytest.ini`):
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --cov=weave-nn-mcp
    --cov-report=html
    --cov-report=term-missing
```

---

### 2. **Docker Compose** (Integration Test Environment)

**Purpose**: Spin up test environment (RabbitMQ, N8N) for integration tests
**Why**: Reproducible, isolated test environment

**File**: `docker-compose.test.yml`
```yaml
version: '3.8'

services:
  rabbitmq-test:
    image: rabbitmq:3-management
    ports:
      - "5673:5672"   # Different port for tests
      - "15673:15672"
    environment:
      RABBITMQ_DEFAULT_USER: test
      RABBITMQ_DEFAULT_PASS: test
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 5s
      timeout: 10s
      retries: 5

  n8n-test:
    image: n8nio/n8n
    ports:
      - "5679:5678"   # Different port for tests
    environment:
      N8N_BASIC_AUTH_ACTIVE: "false"
    depends_on:
      rabbitmq-test:
        condition: service_healthy

  obsidian-mock:
    # Mock Obsidian REST API for tests
    build:
      context: ./tests/mocks
      dockerfile: Dockerfile.obsidian-mock
    ports:
      - "27125:27124"
```

**Usage in Tests**:
```python
# conftest.py
import pytest
import subprocess

@pytest.fixture(scope="session")
def docker_services():
    """Start docker-compose services"""
    subprocess.run(["docker-compose", "-f", "docker-compose.test.yml", "up", "-d"])
    yield
    subprocess.run(["docker-compose", "-f", "docker-compose.test.yml", "down"])
```

---

### 3. **Locust** (Load Testing)

**Purpose**: Performance and stress testing for MCP server and RabbitMQ
**Why**: Identify bottlenecks, verify throughput requirements

**Installation**:
```bash
pip install locust
```

**Load Test**: `tests/load/locustfile.py`
```python
from locust import HttpUser, task, between
import random

class MCPUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def list_notes(self):
        """Test list_notes endpoint"""
        self.client.get("/mcp/list_notes")

    @task(2)
    def read_note(self):
        """Test read_note endpoint"""
        paths = ["concepts/test.md", "features/test.md", "decisions/test.md"]
        path = random.choice(paths)
        self.client.get(f"/mcp/read_note?path={path}")

    @task(1)
    def create_note(self):
        """Test create_note endpoint"""
        self.client.post("/mcp/create_note", json={
            "path": f"test-{random.randint(1, 1000)}.md",
            "content": "Load test content",
            "frontmatter": {"tags": ["load-test"]}
        })

# Run: locust -f tests/load/locustfile.py --host http://localhost:8000
```

**Performance Targets**:
```
Users: 100 concurrent
Duration: 5 minutes
Targets:
  - MCP server: > 100 req/sec
  - RabbitMQ: > 1000 msg/sec
  - Shadow cache query: < 100ms p95
  - File watcher latency: < 1s p99
```

---

## Test Execution Schedule

### Pre-Development (Day -1)

**Setup Test Infrastructure**:
- Install pytest, pytest-cov
- Create test directory structure
- Write 5 unit tests (samples)
- Configure docker-compose.test.yml

---

### Day 0: Prerequisites

**Tests to Run**:
- Manual verification: All plugins installed
- Manual verification: Dev environment setup
- **No automated tests** (one-time setup)

---

### Day 1: RabbitMQ + File Watcher

**Tests to Run** (after implementation):
- TC-001: File creation event
- TC-002: Rapid file changes (debouncing)
- TC-003: Malformed frontmatter
- TC-004: Topic routing validation
- E2E-03: RabbitMQ infrastructure
- E2E-04: File watcher integration

**Estimated Time**: 2 hours testing

---

### Day 2: MCP Server

**Tests to Run**:
- TC-008: CRUD operations
- TC-009: Error handling
- E2E-05: REST API client
- E2E-06: MCP server endpoints
- **Unit tests**: obsidian_client.py (all methods)

**Estimated Time**: 2 hours testing

---

### Day 3: MCP Sync + Shadow Cache

**Tests to Run**:
- TC-006: Event to cache sync
- TC-007: Concurrent events
- TC-012: Bidirectional sync
- TC-013: Wikilink relationships
- E2E-07: Shadow cache sync
- E2E-08: Claude-Flow memory sync

**Estimated Time**: 3 hours testing

---

### Day 4: Agent Rules

**Tests to Run**:
- TC-014: Auto-linking
- TC-015: Auto-tagging
- E2E-09: Agent rules execution
- E2E-10: Full agent pipeline

**Estimated Time**: 2 hours testing

---

### Day 5: Git Integration

**Tests to Run**:
- TC-010: Debounced commit
- TC-011: Pre-commit validation
- TC-019: Workspace-triggered commit
- E2E-11: Git auto-commit
- E2E-12: Workspace-triggered commit
- TC-MISSING-07: Git merge conflicts

**Estimated Time**: 2 hours testing

---

### Day 8: N8N Workflows

**Tests to Run**:
- TC-016: Client onboarding
- E2E-13: N8N setup
- E2E-14: Client onboarding workflow
- Manual: Verify all 5 credentials

**Estimated Time**: 2 hours testing

---

### Day 9: Advanced Workflows

**Tests to Run**:
- TC-017: Weekly report
- E2E-15: Weekly report workflow
- E2E-16: Knowledge extraction workflow

**Estimated Time**: 2 hours testing

---

### Day 10: Task Management

**Tests to Run**:
- TC-018: Task lifecycle
- E2E-17: Task MCP tools
- E2E-18: Agent task workflows

**Estimated Time**: 2 hours testing

---

### Day 11: Properties & Visualization

**Tests to Run**:
- TC-021: Bulk update
- TC-020: Decision tree
- E2E-19: Bulk properties
- E2E-20: Mehrmaid visualizations
- Manual: Verify diagrams render

**Estimated Time**: 2 hours testing

---

### Day 12: Client Project

**Tests to Run**:
- TC-022: Full stack integration
- E2E-21: Real client project
- **All E2E tests** (regression suite)

**Estimated Time**: 4 hours testing

---

### Day 13: Performance & Resilience

**Tests to Run**:
- TC-023: DLQ routing
- TC-024: Crash recovery
- E2E-22: Performance benchmarks
- E2E-23: Error recovery
- TC-MISSING-01 through TC-MISSING-08
- **Load tests**: Locust (5 min run)

**Estimated Time**: 4 hours testing

---

### Day 14: Final Validation

**Tests to Run**:
- **Full regression suite** (all E2E tests)
- **Smoke tests** (critical paths)
- **Performance tests** (benchmarks)
- **Documentation review**

**Estimated Time**: 2 hours testing

---

## Risk Assessment & Mitigation

### High-Risk Integration Points

| Risk | Likelihood | Impact | Mitigation Strategy | Test Coverage |
|------|-----------|--------|---------------------|---------------|
| **RabbitMQ message loss** | Medium | Critical | Durable queues, persistent messages, DLQ | TC-005, TC-023, E2E-23 |
| **Obsidian REST API timeout** | High | High | Retry logic, fallback to URI, connection pooling | TC-009, TC-MISSING-08 |
| **SQLite database lock** | Medium | High | WAL mode, connection pooling, timeout handling | TC-007, TC-MISSING-02 |
| **File watcher missing events** | Low | Critical | Recursive watching, debouncing, event validation | TC-001, TC-002, E2E-04 |
| **Git merge conflicts** | Low | Medium | Single writer (git consumer), conflict detection | TC-MISSING-07 |
| **Claude API quota** | Medium | Medium | Rate limiting, retry with backoff, user notification | TC-MISSING-06 |
| **N8N workflow failure** | Medium | High | Error handling, workflow retries, DLQ routing | TC-016, TC-017 |
| **Concurrent file edits** | Medium | Medium | File locking, last-write-wins, conflict resolution | TC-MISSING-02 |

---

### Risk Mitigation: Test-First Approach

**Strategy**: Write critical tests BEFORE implementation

**Priority 1 (Write First)**:
- TC-001: File creation event (validates core file watcher)
- TC-004: Topic routing (validates RabbitMQ setup)
- TC-008: CRUD operations (validates REST API client)
- TC-022: Full stack integration (validates entire system)

**Priority 2 (Write During)**:
- TC-006: Event to cache sync (validates MCP sync)
- TC-010: Debounced commit (validates git integration)
- TC-018: Task lifecycle (validates task management)

**Priority 3 (Write After)**:
- TC-MISSING-01 through TC-MISSING-08 (resilience tests)

---

## Acceptance Criteria Validation

### Phase 5 Success Criteria

| Criterion | Validation Method | Test Coverage |
|-----------|------------------|---------------|
| RabbitMQ operational | Manual check + TC-004 | E2E-03 |
| File watcher publishes | TC-001, TC-002 | E2E-04 |
| MCP server REST API works | TC-008, TC-009 | E2E-05, E2E-06 |
| Shadow cache synced | TC-006, TC-007 | E2E-07 |
| Claude-Flow memory synced | TC-012, TC-013 | E2E-08 |
| Agent rules execute | TC-014, TC-015 | E2E-09, E2E-10 |
| Git auto-commit works | TC-010, TC-011 | E2E-11, E2E-12 |

---

### Phase 6 Success Criteria

| Criterion | Validation Method | Test Coverage |
|-----------|------------------|---------------|
| N8N workflows operational | TC-016, TC-017 | E2E-13, E2E-14, E2E-15 |
| Task management works | TC-018 | E2E-17, E2E-18 |
| Properties applied | TC-021 | E2E-19 |
| Visualizations generated | TC-020 | E2E-20 |
| Client project deployed | Manual + TC-022 | E2E-21 |
| Performance benchmarks met | Locust + TC-022 | E2E-22 |

---

## Summary & Recommendations

### Critical Findings

1. **14 critical integration points** identified that require explicit testing
2. **8 missing verification steps** discovered in current plan (message ordering, concurrency, large files, etc.)
3. **23 end-to-end test scenarios** designed to cover Days 0-14
4. **Event-driven architecture** requires robust async testing (RabbitMQ → consumers)

---

### Test Strategy Summary

**Approach**: Risk-based testing with focus on critical integration points

**Frameworks Recommended**:
1. **pytest**: Unit and integration tests (Python)
2. **Docker Compose**: Reproducible test environment
3. **Locust**: Performance and load testing

**Coverage Goals**:
- **Unit tests**: 80% code coverage
- **Integration tests**: All 14 integration points
- **E2E tests**: 23 scenarios covering full workflows
- **Performance tests**: Benchmarks for all success criteria

---

### Implementation Priority

**Week 1 (Phase 5)**:
- Day 1: Test RabbitMQ routing + file watcher (CRITICAL)
- Day 2: Test REST API CRUD operations (CRITICAL)
- Day 3: Test shadow cache sync + memory sync (HIGH)
- Day 4: Test agent rules execution (MEDIUM)
- Day 5: Test git auto-commit (MEDIUM)

**Week 2 (Phase 6)**:
- Day 8-9: Test N8N workflows (HIGH)
- Day 10: Test task management (MEDIUM)
- Day 11: Test properties + visualization (LOW)
- Day 12: Full integration test with real client (CRITICAL)
- Day 13-14: Performance + resilience testing (HIGH)

---

### Next Steps

1. **Set up test infrastructure** (Day -1):
   - Install pytest, pytest-cov
   - Create `tests/` directory structure
   - Configure docker-compose.test.yml

2. **Write critical tests first** (Day 0):
   - TC-001: File creation event
   - TC-004: Topic routing
   - TC-008: CRUD operations

3. **Test-driven development** (Days 1-14):
   - Write test → Implement feature → Verify test passes
   - Run regression suite daily
   - Track coverage metrics

4. **Final validation** (Day 14):
   - Full regression suite
   - Performance benchmarks
   - Client acceptance

---

**Report Status**: Complete
**Recommendations**: Actionable and prioritized
**Risk Level**: Managed through comprehensive test coverage
**Confidence**: High (95%) that test strategy will catch critical issues

