---
feature_id: F-013
feature_name: GitHub Issues Integration
category: integration
status: planned
priority: high
release: mvp
complexity: moderate
created_date: '2025-10-21'
updated_date: '2025-10-21'
scope:
  current_phase: mvp
  obsidian_only: true
  web_version_needed: false
dependencies:
  requires:
    - git-integration
    - obsidian-tasks-integration
  enables: []
  related_features:
    - git-integration
    - obsidian-tasks-integration
relationships:
  related_decisions:
    - IR-2
    - IR-3
  related_features:
    - git-integration
    - obsidian-tasks-integration
visual:
  icon: github
  cssclasses:
    - type-feature
    - scope-mvp
    - priority-high
    - tech-github
tags:
  - scope/mvp
  - type/feature
  - status/planned
  - priority/high
  - tech/github
  - tech/python
  - category/integration
---

# GitHub Issues Integration

**Obsidian-First Approach**: Bidirectional sync between Obsidian Tasks (markdown todo items) and GitHub Issues using GitHub REST API and Python integration.

**Decision**: [[../archive/DECISIONS#IR-2-Git-Integration|IR-2: Git Integration]] - GitHub issue sync included

---

## 🎯 User Story

As a **project manager using Weave-NN**, I want to **sync tasks between Obsidian and GitHub Issues** so that I can **manage work in my knowledge graph while maintaining visibility with team members and clients on GitHub**.

---









## Related

[[phase-6-file-watcher-weaver-integration]] • [[phase-9-testing-documentation]] • [[cross-project-knowledge-retention]] • [[obsidian-first-architecture]]
## Related

[[obsidian-native-integration-analysis]]
## Related

[[rabbitmq-message-queue]] • [[weaver-workflow-automation]]
## Related

[[github-issues-integration]]
## 🚀 Key Capabilities

### Bidirectional Task Sync
- **Obsidian → GitHub**: Create GitHub issues from Obsidian tasks
- **GitHub → Obsidian**: Import GitHub issues as Obsidian tasks
- **Two-way updates**: Status changes sync in both directions
- **Smart conflict resolution**: Last-write-wins or user review

### Task-to-Issue Mapping
```markdown
# In Obsidian (using obsidian-tasks syntax)
- [ ] Implement MCP server core 📅 2025-10-25 ⏫ #github/weave-nn-123

# Syncs to GitHub Issue #123
Title: Implement MCP server core
Due Date: 2025-10-25
Priority: High
Labels: [mvp, backend, python]
Project: weave-nn
```

### Automatic Issue Creation
- **Agent-triggered**: Claude agents create issues from agent workflows
- **Manual**: User adds `#github` tag to Obsidian task
- **Batch creation**: Create multiple issues from task lists

### Status Synchronization
```
Obsidian Task → GitHub Issue
[ ] (not done) → Open
[x] (done)     → Closed
[/] (partial)  → In Progress (using labels)
[!] (urgent)   → Open + priority:high label
```

### Comment Sync (Optional - v1.1)
- Sync task notes/comments to GitHub issue comments
- Preserve authorship and timestamps
- Markdown formatting maintained

---

## 🏗️ Implementation (Obsidian-First)

### Technology Stack
**GitHub REST API + Python**
- **PyGithub**: Python library for GitHub API
- **GitHub Personal Access Token**: For authentication
- **MCP Tools**: Expose GitHub operations to agents
- **Task Parser**: Parse obsidian-tasks format

### Architecture

```
Obsidian Tasks (Markdown)
    ↓
Task Parser (Python regex/markdown-it)
    ↓
Sync Engine (Python)
    ↓
GitHub REST API (PyGithub)
    ↓
GitHub Issues (Remote)
```

### MCP Tools for GitHub Issues

```python
# Create issue from task
github_create_issue(
    task_text: str,
    repo: str,
    labels: list = None,
    assignees: list = None
) -> dict
# Returns: { "issue_number": 123, "url": "...", "task_link": "..." }

# Sync task to existing issue
github_sync_task_to_issue(
    task_file: str,
    task_line: int,
    issue_number: int,
    repo: str
) -> dict

# Import issue as task
github_import_issue(
    issue_number: int,
    repo: str,
    target_file: str = "_projects/[repo]/tasks.md"
) -> str
# Returns task markdown

# Sync all tasks with GitHub tag
github_sync_all_tasks(
    repo: str,
    dry_run: bool = True
) -> dict
# Returns: { "created": [...], "updated": [...], "errors": [...] }

# List issues
github_list_issues(
    repo: str,
    state: str = "open",
    labels: list = None
) -> list

# Close issue when task completed
github_close_issue(issue_number: int, repo: str) -> dict
```

---

## 📋 MVP Implementation Plan (Nice-to-Have for Week 1)

### Phase 1: Basic Issue Creation (4 hours)
1. **GitHub API Setup**
   - Create GitHub Personal Access Token
   - Configure PyGithub library
   - Test API access

2. **Task Parser**
   - Parse obsidian-tasks format
   - Extract title, due date, priority, tags
   - Identify `#github` tag for sync

3. **Issue Creation**
   - Map task fields to GitHub issue fields
   - Create issue via API
   - Update task with issue link

### Phase 2: Bidirectional Sync (4 hours)
1. **GitHub → Obsidian Import**
   - Fetch issues from GitHub API
   - Convert to obsidian-tasks format
   - Write to task file

2. **Status Sync**
   - Monitor task status changes (file watcher)
   - Update GitHub issue status via API
   - Poll GitHub for issue updates (webhook alternative)

3. **Conflict Resolution**
   - Timestamp comparison (last modified wins)
   - Manual review option

### Phase 3: Agent Integration (2 hours)
1. **MCP Tools**
   - Expose GitHub tools to Claude agents
   - Agent workflow: Auto-create issues from meeting notes
   - Agent workflow: Weekly issue summary

---

## 🎯 Success Criteria (MVP)

### Must Have (Week 1 - Nice to Have)
- ⚡ GitHub API authentication configured
- ⚡ Create GitHub issue from Obsidian task
- ⚡ Import GitHub issue as Obsidian task
- ⚡ Task → Issue status sync (bidirectional)
- ⚡ MCP tools for GitHub operations

### Nice to Have (v1.1)
- 🔮 Automatic sync on task file changes
- 🔮 Comment sync (task notes ↔ issue comments)
- 🔮 Attachment sync (images in tasks → issue attachments)
- 🔮 GitHub webhook support (real-time updates)
- 🔮 Multi-repo support

### Deferred to v2.0+
- 🔮 GitHub Projects integration (Kanban boards)
- 🔮 Pull request ↔ task sync
- 🔮 GitHub Actions triggered by task changes

---

## 🔗 Related Features

### Requires
- [[git-integration]] - Git repo with GitHub remote
- [[obsidian-tasks-integration]] - Task management in Obsidian

### Enables
- Client-facing issue tracking
- Team collaboration on GitHub
- External visibility for internal work

### Integrates With
- [[basic-ai-integration-mcp]] - MCP tools for agents
- [[../architecture/obsidian-first-architecture]] - Integration layer

---

## 💡 Key Advantages (Obsidian-First)

### Local-First with External Sync
- ✅ Work offline in Obsidian (no GitHub required)
- ✅ Sync when online (best-effort delivery)
- ✅ Local tasks = source of truth

### Developer-Friendly
- ✅ Familiar GitHub workflow
- ✅ Standard REST API (no vendor lock-in)
- ✅ Python PyGithub (mature, well-documented)

### Client Collaboration
- ✅ Clients can view/comment on GitHub
- ✅ Internal knowledge graph stays private (Obsidian)
- ✅ Selective export (only relevant tasks synced)

### AI Agent Access
- ✅ Agents can create issues automatically
- ✅ Agents can summarize issue status
- ✅ Agents can update issue progress

---

## 🚧 Key Challenges & Solutions

### Challenge 1: Sync Frequency
**Problem**: Real-time sync = high API usage, infrequent = stale data
**Solution**:
- Manual sync trigger (MCP tool)
- Scheduled sync (every 15 minutes)
- On-demand sync (when task file saved)

### Challenge 2: API Rate Limits
**Problem**: GitHub API rate limits (5000 requests/hour authenticated)
**Solution**:
- Cache issue data locally (SQLite)
- Batch updates
- Only sync tasks with `#github` tag

### Challenge 3: Conflict Resolution
**Problem**: Task updated in Obsidian, issue updated on GitHub
**Solution**:
- Timestamp comparison (last modified wins)
- User review mode (show diff, let user choose)
- Merge strategy (combine changes if possible)

### Challenge 4: Field Mapping
**Problem**: Obsidian tasks have different fields than GitHub issues
**Solution**:
- Define clear mapping (see table below)
- Use GitHub labels for metadata (priority, type, etc.)
- Custom GitHub issue template

---

## 📊 Field Mapping

| Obsidian Task Field | GitHub Issue Field | Notes |
|---------------------|-------------------|-------|
| Task title | Issue title | Direct mapping |
| `📅 YYYY-MM-DD` | Due date | Uses GitHub milestone or project due date |
| `⏫` (high priority) | Label: `priority:high` | Custom label |
| `🔽` (low priority) | Label: `priority:low` | Custom label |
| `#project/weave-nn` | Repository | Maps to GitHub repo |
| `#type/bug` | Label: `bug` | GitHub default label |
| `#type/feature` | Label: `enhancement` | GitHub default label |
| `[ ]` (not done) | State: `open` | Direct mapping |
| `[x]` (done) | State: `closed` | Direct mapping |
| Task description | Issue body | Markdown preserved |
| Task notes | Issue comments | Optional sync (v1.1) |

---

## 📊 Complexity Estimate

**Complexity**: Moderate (10 hours total)
- GitHub API setup: 2 hours
- Task parser: 2 hours
- Issue creation: 2 hours
- Bidirectional sync: 3 hours
- Testing & edge cases: 1 hour

**Priority**: High (enables client collaboration)

---

## 🔗 Related Documentation

### Architecture
- [[../architecture/obsidian-first-architecture]] - Integration layer
- [[../architecture/ai-integration-layer]] - MCP tools

### Decisions
- [[../archive/DECISIONS#IR-2-Git-Integration|IR-2: Git Integration]] - GitHub sync decided
- [[../archive/DECISIONS#IR-3-Other-Integrations|IR-3: Other Integrations]] - GitHub included

### Workflows
- [[../workflows/version-control-integration]] - Git workflow

### Related Features
- [[git-integration]] - Git operations
- [[obsidian-tasks-integration]] - Task management
- [[basic-ai-integration-mcp]] - MCP tools

---

## 📝 Example Workflows

### Workflow 1: Agent Creates Issue from Meeting Notes
```
User: Claude, create GitHub issues for all action items in my meeting notes

Claude (via MCP):
1. Reads meeting notes file
2. Identifies action items (tasks)
3. Creates GitHub issues for each
4. Updates meeting notes with issue links
5. Responds: "Created 5 GitHub issues: #123, #124, #125, #126, #127"
```

### Workflow 2: Client Reports Bug on GitHub
```
Client: Creates GitHub issue #200: "Login button not working"

Sync Engine (scheduled):
1. Polls GitHub API for new issues
2. Finds issue #200
3. Creates task in _projects/[client]/bugs.md:
   - [ ] Fix login button not working 🐛 #github/200 📅 2025-10-28

User: Fixes bug in Obsidian, marks task as done [x]

Sync Engine:
1. Detects task completion
2. Closes GitHub issue #200
3. Posts comment: "Fixed in commit abc123"
```

### Workflow 3: Weekly Issue Summary
```
User: Claude, give me a weekly summary of GitHub issues

Claude (via MCP):
1. Calls github_list_issues(state="all", since="7 days ago")
2. Analyzes issue data
3. Generates summary:
   - 12 issues opened this week
   - 8 issues closed
   - 4 issues still open (2 high priority)
   - Top labels: bug (5), enhancement (3), documentation (2)
```

---

**Status**: Planned for MVP (Nice-to-Have)
**Complexity**: Moderate (10 hours)
**Priority**: High (enables client collaboration)
**Next Steps**: Set up GitHub API, implement task parser
