---
type: guide
status: active
priority: critical
created_date: "2025-10-21"

tags:
  - scope/mvp
  - type/guide
  - priority/critical
  - setup
---

# Obsidian Tasks Setup Guide

**Quick start guide to install and configure obsidian-tasks plugin for Weave-NN**



---

## 📥 Step 1: Install obsidian-tasks Plugin

### In Obsidian:

1. **Open Settings**: `Ctrl/Cmd + ,`
2. **Go to Community Plugins**:
   - Click "Browse" button
   - Search for "Tasks"
   - Find "Tasks" by Martin Schenck and Clare Macrae
3. **Install Plugin**:
   - Click "Install"
   - Click "Enable" after installation
4. **Verify Installation**:
   - You should see "Tasks" in your installed plugins list
   - Plugin should show as "Enabled"

---

## ⚙️ Step 2: Configure Plugin Settings

### Recommended Settings:

1. **Go to Settings → Tasks**

2. **Global Task Filter** (Optional):
   - Leave empty for now (we'll use tags to filter)
   - Or set to: `#project/weave-nn` to only track project tasks

3. **Global Query** (Optional):
   - Default is fine: `not done`

4. **Date Format**:
   - Keep default: `YYYY-MM-DD`

5. **Auto-suggest**:
   - ✅ Enable "Auto-suggest task formats"
   - This helps when typing tasks

6. **Recurrence**:
   - ✅ Enable if you want recurring tasks
   - Example: `🔁 every week on Monday`

7. **Task Completion**:
   - ✅ Enable "Set done date on task completion"
   - This automatically adds `✅ YYYY-MM-DD` when you check a task

---

## 📝 Step 3: Test Task Format

### Create a Test Note:

1. **Create new note**: `test-tasks.md`

2. **Add test tasks**:
```markdown
# Test Tasks

- [ ] High priority task due today 📅 2025-10-21 ⏫ #test
- [ ] Medium priority task 📅 2025-10-22 🔼 #test
- [ ] Low priority task 📅 2025-10-23 🔽 #test
- [ ] Task with no priority 📅 2025-10-24 #test
- [ ] Recurring task 🔁 every week on Monday #test
```

3. **Test completion**:
   - Click checkbox next to first task
   - Verify it changes to:
     ```markdown
     - [x] High priority task due today ✅ 2025-10-21 📅 2025-10-21 ⏫ #test
     ```

---

## 🔍 Step 4: Test Task Queries

### Create Query Block:

1. **In your test note, add**:
````markdown
## All Test Tasks

```tasks
not done
tags include #test
```
````

2. **Verify**: You should see a live-updating list of uncompleted test tasks

### Try More Queries:

````markdown
## High Priority Tasks Due This Week

```tasks
not done
priority is highest
due before 2025-10-27
```

## Completed Tasks

```tasks
done
tags include #test
```

## Tasks Due Today

```tasks
not done
due today
```
````

---

## ✅ Step 5: Migrate Existing Todos

### Current Todo Locations:

We have tasks scattered across these files:
- `_planning/phases/phase-5-mvp-week-1.md`
- `_planning/phases/phase-6-mvp-week-2.md`
- Various architecture and feature documents

### Migration Strategy:

**Option A: Keep Tasks in Phase Documents** (Recommended)
- Leave tasks in their context (phase plans, architecture docs)
- Use task queries in `_planning/tasks.md` to aggregate them
- Example query to show all Phase 5 tasks:
  ````markdown
  ```tasks
  not done
  tags include #phase-5
  path includes phases/
  ```
  ````

**Option B: Centralize All Tasks**
- Move all tasks to `_planning/tasks.md`
- Organize by phase and category
- Link back to source documents

**Recommended**: **Option A** - Tasks stay in context, use queries to aggregate

---

## 📋 Step 6: Update Phase Documents with Tags

### Phase 5 Tasks - Add Tags:

Edit `/mnt/d/weavelogic/weavelogic-nn/weave-nn/_planning/phases/phase-5-mvp-week-1.md`

**Find tasks like**:
```markdown
- [ ] **Install RabbitMQ via Docker**
```

**Change to**:
```markdown
- [ ] Install RabbitMQ via Docker 📅 2025-10-22 ⏫ #phase-5 #infrastructure #rabbitmq
```

### Phase 6 Tasks - Add Tags:

Edit `/mnt/d/weavelogic/weavelogic-nn/weave-nn/_planning/phases/phase-6-mvp-week-2.md`

**Add tags and dates to all tasks**:
```markdown
- [ ] Install N8N via Docker 📅 2025-10-28 ⏫ #phase-6 #infrastructure #n8n
- [ ] Create client onboarding workflow 📅 2025-10-28 ⏫ #phase-6 #n8n #workflow
```

---

## 🎯 Step 7: Create Dashboard Queries

### In `_planning/tasks.md`:

````markdown
## 🚀 Today's Tasks

```tasks
not done
due today
sort by priority
```

## ⏰ Overdue Tasks

```tasks
not done
due before today
sort by priority
```

## 📅 This Week

```tasks
not done
due after yesterday
due before 2025-10-27
sort by due
```

## 🔥 High Priority (All)

```tasks
not done
(priority is high OR priority is highest)
sort by due
```

## 📦 By Phase

### Phase 5 Tasks (Week 1 Backend)

```tasks
not done
tags include #phase-5
sort by priority
```

### Phase 6 Tasks (Week 2 Automation)

```tasks
not done
tags include #phase-6
sort by priority
```

## 🏷️ By Category

### Infrastructure Tasks

```tasks
not done
tags include #infrastructure
sort by due
```

### Python Development Tasks

```tasks
not done
tags include #python
sort by due
```

### N8N Workflow Tasks

```tasks
not done
tags include #n8n
sort by due
```

### Documentation Tasks

```tasks
not done
tags include #documentation
sort by due
```
````

---

## 📊 Step 8: Verify Task Tracking

### Check Task Counts:

1. **Open**: `_planning/tasks.md`
2. **Verify queries show tasks**:
   - "Today's Tasks" should show tasks due today
   - "Phase 5 Tasks" should show all Phase 5 tasks
   - Counts should match phase documents

### Test Task Completion:

1. **Complete a task** in phase document
2. **Check**: Task should disappear from "not done" queries
3. **Check**: Task should appear in "done" queries

---

## 🔗 Step 9: Link Tasks in MCP Integration

### Future: Task MCP Tools

Once you have tasks set up, these MCP tools will work:

```python
# List all tasks due today
GET /mcp/list_tasks?due_date=today&status=todo

# Create new task
POST /mcp/create_task
{
  "title": "New task",
  "due_date": "2025-10-25",
  "priority": "high",
  "tags": ["phase-5", "python"],
  "file_path": "_planning/tasks.md"
}

# Complete task
PUT /mcp/complete_task
{
  "file_path": "_planning/tasks.md",
  "line_number": 15
}
```

These will be implemented in **Phase 6, Day 10** (Task Management)

---

## ✅ Success Checklist

- [ ] obsidian-tasks plugin installed ✅
- [ ] Plugin enabled in settings ✅
- [ ] Test tasks created and working ✅
- [ ] Task queries showing results ✅
- [ ] Task completion adds done date ✅
- [ ] Phase 5 tasks tagged with dates and priorities ✅
- [ ] Phase 6 tasks tagged with dates and priorities ✅
- [ ] Dashboard queries created in tasks.md ✅
- [ ] All queries returning expected results ✅

---

## 📚 Resources

### Official Documentation:
- [obsidian-tasks GitHub](https://github.com/obsidian-tasks-group/obsidian-tasks)
- [obsidian-tasks Documentation](https://publish.obsidian.md/tasks/Introduction)
- [Query Reference](https://publish.obsidian.md/tasks/Queries/Queries)
- [Date Formats](https://publish.obsidian.md/tasks/Getting+Started/Dates)

### Weave-NN Documentation:
- [[tasks|Central Task Hub]]
- [[../features/obsidian-tasks-integration|Obsidian Tasks Feature]]
- [[phases/phase-6-mvp-week-2#day-10-wednesday-task-management-integration|Phase 6 Task Integration]]

---

## 🚀 Next Steps

After setup:
1. ✅ Complete this setup guide
2. Tag all Phase 5 and Phase 6 tasks
3. Test dashboard queries
4. Start Phase 5 implementation with tracked tasks!

---

**Status**: Ready for immediate use
**Time to Complete**: 15-20 minutes
**Priority**: Critical (enables task tracking for MVP)
