---
title: Obsidian Tasks Plugin
type: technical-primitive
status: in-use
phase_id: PHASE-0
tags:
  - technical
  - tool
  - in-use
  - obsidian-plugin
  - task-management
  - phase/phase-0
  - type/implementation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4C4"
  color: '#7ED321'
  cssclasses:
    - type-technical-primitive
    - status-in-use
updated: '2025-10-29T04:55:06.383Z'
version: '3.0'
keywords:
  - overview
  - why we use it
  - key capabilities
  - integration points
  - configuration
  - deployment
  - trade-offs
  - alternatives considered
  - '[[obsidian-dataview-tasks]]'
  - '[[native-markdown-checkboxes]]'
---

# Obsidian Tasks Plugin

**Category**: Tool/Plugin
**Status**: In Use (MVP)
**First Used**: Phase 0 (Pre-Development Installation Required)

---

## Overview

Obsidian Tasks is a community plugin that provides advanced task management capabilities with rich query syntax, due dates, priorities, recurrence, and completion tracking. It extends standard markdown checkboxes with structured metadata.

**Official Site**: https://github.com/obsidian-tasks-group/obsidian-tasks
**Documentation**: https://publish.obsidian.md/tasks/

---

## Why We Use It

Enables Weave-NN's agent-driven task automation by providing:
- **Structured Task Format**: Parse tasks with priorities, due dates, tags
- **Programmatic Access**: Agents create/update tasks via consistent syntax
- **Query Language**: Search tasks by status, priority, date, tags
- **Completion Tracking**: Automatic completion timestamps and metadata

**Primary Purpose**: MCP tools read/write tasks programmatically for agent-driven automation

**Specific Use Cases**:
- Agents create tasks with priorities and due dates in [[../features/agent-driven-task-automation]]
- Daily log automation generates task summaries in [[../features/daily-log-automation]]
- Query pending tasks by priority/date for agent decision-making
- Track task completion metrics for agent performance

---

## Key Capabilities

- **Rich Task Syntax**: `- [ ] Task description 📅 2025-10-23 ⏫ #tag`
- **Priority Levels**: ⏫ (High), 🔼 (Medium), 🔽 (Low)
- **Due Dates**: `📅 YYYY-MM-DD` format for scheduling
- **Recurrence**: `🔁 every week` for recurring tasks
- **Completion Tracking**: `✅ YYYY-MM-DD` when task is completed
- **Query Language**: Filter tasks by status, date, priority, tags
- **Start Dates**: `🛫 YYYY-MM-DD` for task activation
- **Scheduled Dates**: `⏳ YYYY-MM-DD` for explicit scheduling

---

## Integration Points

**Used By**:
- [[../architecture/mcp-server]] - Reads/writes tasks via Obsidian API
- [[../architecture/agent-orchestration]] - Agents create tasks programmatically
- [[../features/agent-driven-task-automation]] - Automated task creation

**Integrates With**:
- [[obsidian-local-rest-api-plugin]] - Access tasks via REST API
- [[claude-flow]] - Agents manage tasks through API
- [[pyyaml]] - Parse task metadata from frontmatter

**Enables Features**:
- [[../features/agent-driven-task-automation]] - Agents create/track tasks
- [[../features/daily-log-automation]] - Task summaries in daily logs
- [[../features/decision-tracking]] - Track decision implementation tasks

---

## Configuration

**Plugin Installation** (Phase 0 - Required before MVP):
1. Open Obsidian → Settings → Community Plugins
2. Search for "Tasks"
3. Install and enable plugin
4. Configure settings (see below)

**Plugin Settings**:
```yaml
# Tasks Plugin Configuration
Global Task Filter: ""  # No filter, show all tasks
Default Due Date: null  # No default due date
Completion Date Format: "YYYY-MM-DD"
Enable Recurrence: true
Enable Start Dates: true
Enable Scheduled Dates: true
```

**Task Syntax Reference**:
```markdown
# Standard task
- [ ] Complete project documentation

# With priority
- [ ] Fix critical bug ⏫

# With due date
- [ ] Submit report 📅 2025-10-25

# With tags
- [ ] Review PR #code-review #urgent

# Full featured task
- [ ] Deploy to production 📅 2025-10-23 ⏫ #deployment #critical

# Completed task (automatic timestamp)
- [x] Write tests ✅ 2025-10-22

# Recurring task
- [ ] Weekly team meeting 🔁 every Monday 📅 2025-10-28

# With start date (task becomes active on date)
- [ ] Q4 planning 🛫 2025-12-01 📅 2025-12-15

# With scheduled date (planned work date)
- [ ] Code review ⏳ 2025-10-24 📅 2025-10-25
```

**Query Examples**:
```markdown
# All incomplete tasks
\```tasks
not done
\```

# High priority tasks due this week
\```tasks
not done
priority is high
due before in 7 days
\```

# Tasks tagged with #agent
\```tasks
not done
tags include #agent
\```

# Completed tasks this month
\```tasks
done
done after 2025-10-01
\```
```

---

## Deployment

**MVP (Phase 5-6)**: Obsidian plugin running locally on developer machine
**v1.0 (Post-MVP)**: Same local deployment (Obsidian remains desktop-first)

**Resource Requirements**:
- RAM: 50 MB (plugin overhead)
- CPU: Negligible (task parsing/indexing)
- Storage: <5 MB (plugin installation)

**Health Check**:
```bash
# Via Obsidian Local REST API
curl -X POST https://localhost:27124/search/ \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"query": "task:\"\""}' \
  -k

# Expected: List of files containing tasks
```

---

## Trade-offs

**Pros** (Why we chose it):
- ✅ **Standard Markdown**: Tasks are plain markdown checkboxes, readable without plugin
- ✅ **Rich Metadata**: Supports priorities, dates, tags in human-readable format
- ✅ **Powerful Queries**: Filter tasks by any attribute combination
- ✅ **Programmatic Access**: Consistent syntax enables agent automation
- ✅ **Active Maintenance**: Regularly updated by community team
- ✅ **Large User Base**: 100k+ downloads, well-tested

**Cons** (What we accepted):
- ⚠️ **Requires Manual Installation**: User must install plugin before MVP - mitigated by clear Phase 0 installation guide
- ⚠️ **Custom Syntax**: Emoji-based syntax may not be familiar - acceptable because well-documented
- ⚠️ **No API**: Must parse markdown text to read/write tasks - mitigated by consistent syntax format

---

## Alternatives Considered

**Compared With**:

### [[obsidian-dataview-tasks]]
- **Pros**: JavaScript API for querying, more flexible data model
- **Cons**: Requires complex query syntax, harder to parse programmatically
- **Decision**: Rejected because Tasks plugin has simpler, more standardized syntax for agents

### [[native-markdown-checkboxes]]
- **Pros**: No plugin required, standard markdown syntax
- **Cons**: No metadata (priorities, dates), no query language, no completion tracking
- **Decision**: Rejected because insufficient features for agent-driven automation

### [[todoist-obsidian-integration]]
- **Pros**: Cloud sync, mobile apps, advanced features
- **Cons**: External dependency, requires API keys, not local-first
- **Decision**: Rejected because violates local-first architecture principle

---

## Decision History

**Decision Record**: [[../decisions/technical/task-management-system]]

**Key Reasoning**:
> The Obsidian Tasks plugin was chosen for Phase 0 because it provides the best balance of rich task metadata (priorities, dates, tags) and programmatic accessibility. The emoji-based syntax is consistent and parsable, enabling agents to create and update tasks via the Obsidian REST API. The plugin's query language allows agents to filter tasks for decision-making.

**Date Decided**: 2025-10-20
**Decided By**: System Architect

---

## Phase Usage

### Phase 0 (Pre-Development) - Installation Required
**Prerequisite**: Install plugin before Phase 5 MVP development
- Configure task format settings (completion dates, recurrence)
- Learn query syntax for programmatic access
- Test task creation/completion via Obsidian UI
- Document task syntax for agent usage

### Phase 5 (MVP Week 1) - In Use
**Day 1-5**: MCP server integrates with Tasks plugin
- Agents create tasks with priorities and due dates
- Parse task syntax from markdown files
- Query tasks for agent decision-making
- Track task completion for metrics

### Phase 6 (MVP Week 2) - Enhanced Usage
- Recurring tasks for periodic agent operations
- Task templates for common workflows
- Priority-based task sorting for agent queues
- Completion metrics for agent performance

### Phase 7 (v1.0) - Future Enhancement
- Advanced query patterns for complex task filtering
- Task dependencies (blocked by relationships)
- Time tracking integration (estimate vs actual)
- Task analytics and reporting

---

## Learning Resources

**Official Documentation**:
- [Tasks Documentation Hub](https://publish.obsidian.md/tasks/)
- [Query Syntax Reference](https://publish.obsidian.md/tasks/Queries/)
- [Task Format Guide](https://publish.obsidian.md/tasks/Getting+Started/)

**Tutorials**:
- [Getting Started Tutorial](https://publish.obsidian.md/tasks/Getting+Started/)
- [Advanced Queries Guide](https://publish.obsidian.md/tasks/Queries/Advanced+Queries)
- [Date Handling Guide](https://publish.obsidian.md/tasks/Dates/)

**Best Practices**:
- [Task Organization Patterns](https://publish.obsidian.md/tasks/How+To/Task+Organization)
- [Recurring Tasks Best Practices](https://publish.obsidian.md/tasks/Getting+Started/Recurring+Tasks)

**Community**:
- [GitHub Repository](https://github.com/obsidian-tasks-group/obsidian-tasks)
- [GitHub Discussions](https://github.com/obsidian-tasks-group/obsidian-tasks/discussions)
- [Obsidian Forum](https://forum.obsidian.md/)

---

## Monitoring & Troubleshooting

**Health Checks**:
```python
# Python code to verify task parsing
import re

def parse_task(line: str) -> dict:
    """Parse Obsidian Tasks syntax."""
    task = {"text": "", "completed": False, "priority": None, "due": None, "tags": []}

    # Check completion status
    if line.startswith("- [x]") or line.startswith("- [X]"):
        task["completed"] = True
    elif not line.startswith("- [ ]"):
        return None  # Not a task

    # Extract task text (remove checkbox)
    text = re.sub(r"^- \[[xX ]\] ", "", line)

    # Extract priority
    if "⏫" in text:
        task["priority"] = "high"
        text = text.replace("⏫", "")
    elif "🔼" in text:
        task["priority"] = "medium"
        text = text.replace("🔼", "")
    elif "🔽" in text:
        task["priority"] = "low"
        text = text.replace("🔽", "")

    # Extract due date
    due_match = re.search(r"📅 (\d{4}-\d{2}-\d{2})", text)
    if due_match:
        task["due"] = due_match.group(1)
        text = text.replace(due_match.group(0), "")

    # Extract tags
    task["tags"] = re.findall(r"#[\w-]+", text)

    # Clean text
    task["text"] = text.strip()

    return task

# Test
line = "- [ ] Deploy to production 📅 2025-10-23 ⏫ #deployment"
print(parse_task(line))
# Output: {'text': 'Deploy to production #deployment', 'completed': False, 'priority': 'high', 'due': '2025-10-23', 'tags': ['#deployment']}
```

**Common Issues**:
1. **Issue**: Tasks not appearing in query results
   **Solution**: Verify task syntax is correct (checkbox format, emoji spacing)

2. **Issue**: Due dates not parsing
   **Solution**: Ensure date format is `YYYY-MM-DD`, not other formats

3. **Issue**: Completed tasks show wrong timestamp
   **Solution**: Check plugin settings for completion date format

4. **Issue**: Query not filtering correctly
   **Solution**: Check query syntax in plugin documentation, verify filter logic

---

## Code Examples

### Task Creation (Python)
```python
# mcp_server/tools/create_task.py
from datetime import datetime, timedelta

def create_task(
    description: str,
    priority: str = None,
    due_date: str = None,
    tags: list[str] = None
) -> str:
    """Generate Obsidian Tasks syntax."""
    task = f"- [ ] {description}"

    # Add priority
    if priority == "high":
        task += " ⏫"
    elif priority == "medium":
        task += " 🔼"
    elif priority == "low":
        task += " 🔽"

    # Add due date
    if due_date:
        task += f" 📅 {due_date}"

    # Add tags
    if tags:
        task += " " + " ".join(f"#{tag}" for tag in tags)

    return task

# Usage examples
print(create_task("Review PR", priority="high", tags=["code-review"]))
# Output: - [ ] Review PR ⏫ #code-review

print(create_task("Deploy to prod", priority="high", due_date="2025-10-23", tags=["deployment", "critical"]))
# Output: - [ ] Deploy to prod ⏫ 📅 2025-10-23 #deployment #critical
```

### Task Query (Python)
```python
# mcp_server/tools/query_tasks.py
import re
from datetime import datetime

def query_tasks(
    content: str,
    completed: bool = None,
    priority: str = None,
    due_before: str = None,
    tags: list[str] = None
) -> list[dict]:
    """Query tasks from markdown content."""
    tasks = []

    for line in content.split("\n"):
        if not (line.startswith("- [ ]") or line.startswith("- [x]")):
            continue

        task = parse_task(line)  # From previous example
        if not task:
            continue

        # Filter by completion status
        if completed is not None and task["completed"] != completed:
            continue

        # Filter by priority
        if priority and task["priority"] != priority:
            continue

        # Filter by due date
        if due_before and task["due"]:
            if task["due"] > due_before:
                continue

        # Filter by tags
        if tags:
            if not any(f"#{tag}" in task["tags"] for tag in tags):
                continue

        tasks.append(task)

    return tasks

# Usage
content = """
- [ ] Review PR ⏫ 📅 2025-10-23 #code-review
- [ ] Write docs 🔼 #documentation
- [x] Fix bug ✅ 2025-10-22
- [ ] Deploy to prod ⏫ 📅 2025-10-25 #deployment
"""

# Get high priority incomplete tasks
high_priority = query_tasks(content, completed=False, priority="high")
print(high_priority)
# Output: [{'text': 'Review PR #code-review', ...}, {'text': 'Deploy to prod #deployment', ...}]
```

### MCP Tool Integration
```python
# mcp_server/tools/task_tools.py
from mcp.server import Server
from obsidian_client import ObsidianClient

@mcp_server.tool()
async def create_task_in_note(
    note_path: str,
    description: str,
    priority: str = None,
    due_date: str = None,
    tags: list[str] = None
) -> str:
    """Create a task in an Obsidian note."""
    client = ObsidianClient()

    # Read current note content
    content = client.read_note(note_path)

    # Generate task syntax
    task = create_task(description, priority, due_date, tags)

    # Append task to note
    new_content = content + "\n" + task
    client.write_note(note_path, new_content)

    return f"Created task: {task}"

@mcp_server.tool()
async def list_pending_tasks(note_path: str, priority: str = None) -> list[dict]:
    """List pending tasks from a note."""
    client = ObsidianClient()
    content = client.read_note(note_path)

    # Query incomplete tasks
    tasks = query_tasks(content, completed=False, priority=priority)
    return tasks
```

---















## Related

[[yaml-frontmatter]]
## Related

[[wikilinks]]
## Related

[[mcp]]
## Related

[[sqlite]] • [[weaver]]
## Related

[[docker-compose]]
## Related

[[n8n-workflow-automation]] • [[property-visualizer]]
## Related

[[uvicorn]]
## Related Nodes

**Architecture**:
- [[../architecture/mcp-server]] - Reads/writes tasks via Obsidian API
- [[../architecture/task-tracking-layer]] - Defines task management patterns

**Features**:
- [[../features/agent-driven-task-automation]] - Agents create/track tasks
- [[../features/daily-log-automation]] - Task summaries in daily logs
- [[../features/decision-tracking]] - Track decision implementation

**Decisions**:
- [[../decisions/technical/task-management-system]] - Why Tasks plugin

**Other Primitives**:
- [[obsidian-local-rest-api-plugin]] - Access tasks via REST API
- [[claude-flow]] - Agents manage tasks
- [[pyyaml]] - Parse task metadata

---

## Revisit Criteria

**Reconsider this technology if**:
- Plugin becomes unmaintained (no updates for 12+ months)
- Syntax changes break agent parsing logic (breaking changes)
- Obsidian releases native task management (ecosystem improvement)
- Agent automation requires features not supported by plugin

**Scheduled Review**: 2026-04-01 (6 months after v1.0 launch)

---

**Back to**: [[README|Technical Primitives Index]]
