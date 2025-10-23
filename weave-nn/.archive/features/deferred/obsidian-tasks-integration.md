---
feature_id: "F-033"
feature_name: "Obsidian Tasks Plugin Integration"
type: feature
status: planned
priority: critical
category: task-management
release: "mvp"

effort_estimate: "2-3 days"
dependencies:
  - "F-005" # Basic AI integration (MCP)

related_decisions:
  - "FP-1"
  - "IR-1"

tags:
  - feature
  - mvp
  - tasks
  - obsidian
  - plugin
  - critical

icon: "check-square"
cssclasses:
  - feature
  - mvp
---

# Obsidian Tasks Plugin Integration

Integrate [obsidian-tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) plugin to provide comprehensive task management within Weave-NN.

**Status**: Planned for MVP
**Priority**: Critical (enables project management workflow)
**Effort**: 2-3 days

---

## Overview

The obsidian-tasks plugin provides powerful task management capabilities that integrate perfectly with the Obsidian-first architecture. This feature enables AI agents to create, query, and manage tasks while users work in familiar Obsidian UI.

---

## User Story

**As a** developer/project manager using Weave-NN
**I want** comprehensive task management with queries, filters, and AI automation
**So that** I can track work, manage projects, and let AI agents help organize tasks

---

## Core Capabilities

### 1. Task Syntax
Uses standard Markdown checkboxes with extended metadata:

```markdown
- [ ] Task title 📅 2025-10-25 ⏫ #project/weave-nn
- [x] Completed task ✅ 2025-10-20
- [ ] Task with due date 📅 2025-10-30
- [ ] Task with recurrence 🔁 every week on Monday
- [ ] Task with priority ⏫ high priority
- [ ] Task with start date 🛫 2025-10-22
- [ ] Task with scheduled date ⏳ 2025-10-23
```

**Task Metadata**:
- `📅 YYYY-MM-DD` - Due date
- `✅ YYYY-MM-DD` - Done date
- `🛫 YYYY-MM-DD` - Start date
- `⏳ YYYY-MM-DD` - Scheduled date
- `🔁 recurrence` - Recurring task pattern
- `⏫` ` ` `🔽` - Priority (high, medium, low)
- `#tags` - Project/category tags

---

### 2. Task Queries
Powerful query language to find and display tasks:

````markdown
```tasks
not done
due before tomorrow
path includes _projects/client-a
sort by due
```
````

**Common Queries**:

**All open tasks**:
````markdown
```tasks
not done
```
````

**Tasks due this week**:
````markdown
```tasks
not done
due after yesterday
due before in 7 days
sort by due
```
````

**High priority tasks**:
````markdown
```tasks
not done
priority is high
```
````

**Tasks by project**:
````markdown
```tasks
not done
path includes _projects/client-a
sort by due
```
````

**Overdue tasks**:
````markdown
```tasks
not done
due before today
sort by due
```
````

**Tasks with no due date**:
````markdown
```tasks
not done
no due date
```
````

---

### 3. Dashboard Views
Create project dashboards with task queries:

**Example: Project Dashboard**
```markdown
# Project: Client A - Knowledge Graph Implementation

## 🔥 Overdue
```tasks
not done
due before today
path includes _projects/client-a
```

## 📅 Due This Week
```tasks
not done
due after yesterday
due before in 7 days
path includes _projects/client-a
sort by due
```

## ⏫ High Priority
```tasks
not done
priority is high
path includes _projects/client-a
```

## 📋 All Open Tasks
```tasks
not done
path includes _projects/client-a
sort by due
group by filename
```
```

---

## MCP Integration

### Task Tools for AI Agents

**MCP tools exposed by Python backend**:

#### `list_tasks(filter)`
Query tasks with obsidian-tasks syntax
```python
# List all open tasks
tasks = mcp.list_tasks("not done")

# List tasks due this week
tasks = mcp.list_tasks("not done\ndue after yesterday\ndue before in 7 days")

# List tasks for specific project
tasks = mcp.list_tasks("not done\npath includes _projects/client-a")
```

**Returns**:
```json
[
  {
    "title": "Implement MCP server",
    "status": "incomplete",
    "due_date": "2025-10-25",
    "priority": "high",
    "tags": ["#project/weave-nn", "#backend"],
    "file_path": "_projects/weave-nn/tasks.md",
    "line_number": 15
  }
]
```

---

#### `create_task(title, metadata, file_path)`
Create new task in specified file
```python
mcp.create_task(
    title="Build semantic search endpoint",
    metadata={
        "due_date": "2025-10-30",
        "priority": "medium",
        "tags": ["#backend", "#ai"]
    },
    file_path="_projects/weave-nn/tasks.md"
)
```

---

#### `update_task(task_id, updates)`
Update task metadata
```python
mcp.update_task(
    task_id="tasks.md:15",
    updates={
        "due_date": "2025-10-28",
        "priority": "high"
    }
)
```

---

#### `complete_task(task_id)`
Mark task as complete with done date
```python
mcp.complete_task("tasks.md:15")
# Updates: - [x] Task title ✅ 2025-10-21
```

---

## AI Agent Workflows

### 1. Auto-Create Tasks from Meeting Notes
Agent reads daily log, extracts action items, creates tasks

**Trigger**: User saves daily log with action items
**Agent**: Documenter
**Workflow**:
1. Read daily log content
2. Identify sentences with "TODO", "ACTION", "TASK"
3. Extract task title, due date (if mentioned)
4. Create tasks in appropriate project file
5. Link task back to daily log

**Example**:
```markdown
# Daily Log - 2025-10-21

## Meeting with Client A
- Discussed graph visualization requirements
- ACTION: Build prototype by Friday ← Agent detects this
- Need to implement wikilink autocomplete
```

**Agent creates**:
```markdown
# _projects/client-a/tasks.md

- [ ] Build graph visualization prototype 📅 2025-10-25 #prototype
  Created from [[daily-logs/2025-10-21#Meeting with Client A]]
```

---

### 2. Daily Task Summary
Agent generates daily task report for user

**Trigger**: Morning (8am) or user command
**Agent**: Analyst
**Workflow**:
1. Query tasks: due today, overdue, high priority
2. Group by project
3. Generate summary in daily log
4. Highlight blockers/dependencies

**Output**:
```markdown
# Daily Log - 2025-10-21

## 📋 Tasks for Today

### Overdue (2)
- [ ] Complete client proposal 📅 2025-10-18 ⏫ #client-a
- [ ] Review security audit 📅 2025-10-19 ⏫ #internal

### Due Today (4)
- [ ] Implement MCP server 📅 2025-10-21 #weave-nn
- [ ] Test agent workflows 📅 2025-10-21 #weave-nn
- [ ] Send invoice to Client B 📅 2025-10-21 #admin
- [ ] Update project timeline 📅 2025-10-21 #client-a

### High Priority (No Due Date)
- [ ] Set up CI/CD pipeline ⏫ #infrastructure
```

---

### 3. Project Health Check
Agent analyzes project tasks, flags issues

**Trigger**: Weekly or on-demand
**Agent**: Reviewer
**Checks**:
- Tasks with no due date
- Overdue tasks
- Tasks blocked for >7 days
- Tasks with no owner (in team setting)

**Output**:
```markdown
# Project Health: Client A

## ⚠️ Issues Detected

### Overdue Tasks (3)
- Task A (5 days overdue)
- Task B (2 days overdue)
- Task C (1 day overdue)

### Tasks with No Due Date (7)
[List of tasks]

### Suggestions
- [ ] Review overdue tasks, update estimates
- [ ] Add due dates to tasks in "Backend" category
- [ ] Consider breaking down "Implement graph viz" (open 14 days, no progress)
```

---

## File Structure

### Project Task Files
Each project has a dedicated task file:

```
_projects/
├── client-a/
│   ├── README.md
│   ├── tasks.md              ← Project tasks
│   ├── meetings.md
│   └── ...
├── client-b/
│   └── tasks.md
└── weave-nn/
    └── tasks.md
```

### Global Task Dashboard
```
_planning/
├── tasks.md                   ← All tasks aggregated
└── task-dashboard.md          ← Queries and views
```

**tasks.md** (aggregation):
````markdown
# All Tasks

## By Project

### Client A
```tasks
not done
path includes _projects/client-a
sort by due
```

### Client B
```tasks
not done
path includes _projects/client-b
sort by due
```

### Weave-NN (Internal)
```tasks
not done
path includes _projects/weave-nn
sort by due
```
````

---

## Implementation Plan

### Day 1: Setup & Basic Integration
- Install obsidian-tasks plugin
- Configure task syntax preferences
- Create sample tasks in test project
- Test query functionality manually
- Document task syntax for team

### Day 2: MCP Task Tools
- Build Python parser for task markdown syntax
- Implement `list_tasks()` MCP tool
- Implement `create_task()` MCP tool
- Implement `update_task()` MCP tool
- Implement `complete_task()` MCP tool
- Test with Claude Desktop

### Day 3: Agent Workflows
- Build "auto-create tasks from notes" agent rule
- Build "daily task summary" agent rule
- Build "project health check" agent rule
- Test agent workflows end-to-end
- Create project task dashboards

---

## Success Criteria

### Must Have (MVP)
- ✅ obsidian-tasks plugin installed and configured
- ✅ All 4 MCP task tools working
- ✅ Claude can create, query, and complete tasks via MCP
- ✅ At least 1 real project using task management
- ✅ Daily task summary working

### Nice to Have
- ⚡ Auto-create tasks from meeting notes
- ⚡ Project health check automation
- ⚡ Recurring tasks for standup/weekly reviews

### Future (v1.1+)
- 🔮 Team task assignment (when multiplayer added)
- 🔮 Task dependencies and blockers
- 🔮 Gantt chart view (canvas or plugin)
- 🔮 Time tracking integration

---

## Examples

### Client Project Task File
```markdown
# Client A: Knowledge Graph Implementation - Tasks

## Phase 1: Setup & Discovery
- [x] Initial meeting and requirements gathering ✅ 2025-10-15
- [x] Create project vault structure ✅ 2025-10-16
- [ ] Document current workflow and pain points 📅 2025-10-22 ⏫
- [ ] Define success criteria 📅 2025-10-23

## Phase 2: Development
- [ ] Build MCP server 📅 2025-10-28 ⏫ #backend
- [ ] Implement graph visualization 📅 2025-10-30 #frontend
- [ ] Set up Claude-Flow agents 📅 2025-11-02 #ai
- [ ] Create task management dashboard 📅 2025-11-05

## Phase 3: Testing & Handoff
- [ ] User acceptance testing 📅 2025-11-08
- [ ] Create documentation 📅 2025-11-10
- [ ] Training session 📅 2025-11-12
- [ ] Project handoff ✅ TBD

## Backlog
- [ ] Explore semantic search enhancements #future
- [ ] Consider multiplayer features #future
```

---

## Plugin Configuration

**Settings** (`.obsidian/plugins/obsidian-tasks/data.json`):
```json
{
  "globalFilter": "",
  "removeGlobalFilter": false,
  "setDoneDate": true,
  "autoSuggestInEditor": true,
  "autoSuggestMinMatch": 0,
  "autoSuggestMaxItems": 6,
  "provideAccessKeys": true,
  "useFilenameAsScheduledDate": false,
  "filenameAsDateFolders": [],
  "prioritySymbols": {
    "High": "⏫",
    "Medium": "",
    "Low": "🔽"
  }
}
```

---

## Related

### Features
- [[basic-ai-integration-mcp|Basic AI Integration (MCP)]] - Enables agent access
- [[decision-tracking|Decision Tracking]] - Similar tracking pattern
- [[git-integration|Git Integration]] - Task → GitHub issue sync

### Architecture
- [[../architecture/obsidian-first-architecture|Obsidian-First Architecture]] - Why Obsidian
- [[../architecture/ai-integration-layer|AI Integration Layer]] - Agent workflows

### Workflows
- [[../workflows/node-creation-process|Node Creation Process]] - Similar workflow
- [[../workflows/phase-management|Phase Management]] - Uses tasks

### External
- [obsidian-tasks GitHub](https://github.com/obsidian-tasks-group/obsidian-tasks)
- [obsidian-tasks Documentation](https://publish.obsidian.md/tasks/)
- [obsidian-tasks Quick Reference](https://publish.obsidian.md/tasks/Quick+Reference)

---

**Status**: Planned for MVP (Week 2, Days 8-9)
**Blockers**: None (plugin is mature and stable)
**Risk**: Low (well-documented, active community)
