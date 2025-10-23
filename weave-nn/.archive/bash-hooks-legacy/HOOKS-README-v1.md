---
status: archived
archive_date: "2025-10-23"
archive_reason: "Replaced by Weaver (workflow.dev) unified workflow proxy"
replacement: "[[../../docs/weaver-workflow-proxy]]"
original_path: ".claude/HOOKS-README.md"
version: "1.0 - Bash Hooks Legacy"
---

# ⚠️ ARCHIVED: Claude Code Hooks Configuration (v1.0 - Bash Hooks)

> **Archive Notice**: This documentation has been archived as of 2025-10-23 and replaced by Weaver (workflow.dev) workflow proxy.
>
> **Reason**: The bash-based hooks system has been superseded by Weaver's unified workflow automation, which provides:
> - Workflow engine abstraction (n8n, Temporal, Make, Zapier)
> - Dynamic routing based on task complexity
> - Better error handling and retry logic
> - Centralized workflow management
>
> **New Documentation**: See [[../../docs/weaver-workflow-proxy]] for current automation approach.
>
> **Original Location**: `.claude/HOOKS-README.md`

---

# Claude Code Hooks Configuration

**Status**: ⚠️ ARCHIVED - Replaced by Weaver Workflow Proxy (2025-10-23)
**Version**: 1.0 (Bash Hooks - Legacy)

---

## Overview

This project previously used **bash-based hooks** to automate task logging and phase documentation. Hooks were configured in `.claude/settings.json` and executed automatically during Claude Code sessions.

**Migration Status**: This approach has been replaced by Weaver workflow proxy for more robust and scalable automation.

---

## Configured Hooks

### 1. PostToolUse Hook - Task Tracking

**Purpose**: Automatically create task logs and update phase documents when tasks are completed via TodoWrite

**Configuration**:
```json
{
  "PostToolUse": {
    "enabled": true,
    "command": "bash",
    "args": ["-c", "bash .bin/hooks/post-tool-task-tracker.sh"],
    "description": "Track TodoWrite completions and update task logs + phase documents"
  }
}
```

**Behavior**:
- Triggers after **any** tool use (PostToolUse is a native Claude Code event)
- Filters for `TodoWrite` tool usage
- Parses JSON input to find todos marked as `"status": "completed"`
- For each completed task:
  1. Extracts task details (content, priority, phase)
  2. Executes `.bin/create-task-log.sh` to create task log
  3. Executes `.bin/hooks/update-phase-incrementally.sh` to update phase document
  4. Updates phase progress tracker with latest metrics

**Environment Variables** (automatically provided by Claude Code):
- `$TOOL_NAME` - Name of tool used (we filter for "TodoWrite")
- `$TOOL_INPUT` - JSON input to the tool
- `$TOOL_OUTPUT` - JSON output from the tool

**Task Log Output**:
```
_log/tasks/[phase].[day].[task_name].[subtask].hash].md
```

**Phase Document Updates**:
- Adds/updates "📊 Progress Tracker" section
- Shows completion percentage, duration, file metrics
- Creates table with links to all task logs
- Automatically marks phase as completed when 100% done

---

### 2. SessionEnd Hook - Phase Completion

**Purpose**: Defer comprehensive phase summary generation (Claude Code unavailable during SessionEnd)

**Configuration**:
```json
{
  "SessionEnd": {
    "enabled": true,
    "command": "bash",
    "args": ["-c", "if [ -n \"$PHASE_COMPLETE\" ]; then bash .bin/hooks/phase-summary-wrapper.sh; fi"],
    "description": "Defer phase summary generation (Claude Code unavailable during SessionEnd)",
    "generateSummary": true,
    "persistState": true,
    "exportMetrics": true
  }
}
```

**Behavior**:
- Triggers at end of Claude Code session (native event)
- Checks if `$PHASE_COMPLETE` environment variable is set
- **Cannot run documenter-agent directly** (Claude Code process is terminating)
- Instead, creates a deferred task script in `.bin/hooks/deferred/`
- Displays instructions for running the phase summary manually

**Important**: The **Progress Tracker is already complete** from iterative task updates! The phase summary adds:
- Executive summary and narrative
- Challenges & solutions analysis
- Lessons learned
- Technical decisions documentation

**Usage**:

**Option 1: Via SessionEnd Hook (Deferred)**
```bash
# Set environment variables before ending session:
export PHASE_COMPLETE=true
export PHASE_NUM=5

# End session (Ctrl+D or /exit)
# Hook creates: .bin/hooks/deferred/phase-5-pending.sh

# After session ends, run the deferred task:
bash .bin/hooks/deferred/phase-5-pending.sh
```

**Option 2: Direct Manual Execution (Recommended)**
```bash
# Run documenter-agent directly anytime:
./.bin/documenter-agent.sh 5 complete
```

**Option 3: Batch Run All Deferred Tasks**
```bash
# Check for and run all pending deferred tasks:
./.bin/run-deferred-tasks.sh

# This script will:
# - List all pending deferred tasks
# - Ask for confirmation
# - Execute each task
# - Archive completed tasks
# - Show summary
```

---

## Automation Scripts

### `.bin/hooks/post-tool-task-tracker.sh` (NEW)

**Purpose**: Main hook script that monitors TodoWrite and triggers task logging + phase updates

**Called By**: PostToolUse hook (native Claude Code event)

**Process**:
1. Checks if `$TOOL_NAME` is "TodoWrite" (exits if not)
2. Parses `$TOOL_INPUT` JSON to extract todos
3. Filters for todos with `"status": "completed"`
4. For each completed todo:
   - Extracts task content, priority, phase number
   - Sanitizes task name for filename
   - Calls `.bin/create-task-log.sh` with extracted data
   - Calls `.bin/hooks/update-phase-incrementally.sh` to update phase document
5. Logs all activity to `.bin/hooks/debug.log`

**Dependencies**:
- `jq` for JSON parsing (required)
- `.bin/create-task-log.sh`
- `.bin/hooks/update-phase-incrementally.sh`

**Debug**:
```bash
# View hook execution log
tail -f /home/aepod/dev/weave-nn/weave-nn/.bin/hooks/debug.log
```

---

### `.bin/hooks/update-phase-incrementally.sh` (NEW)

**Purpose**: Incrementally update phase documents as tasks complete (iterative updates)

**Called By**: `.bin/hooks/post-tool-task-tracker.sh` after each task completion

**Process**:
1. Finds phase document in `_planning/phases/`
2. Scans all task logs for that phase
3. Calculates current metrics:
   - Total tasks logged
   - Completed count
   - Completion percentage
   - Total duration (hours/minutes)
   - Files modified count
4. Generates/updates "📊 Progress Tracker" section:
   - Summary metrics
   - Task table with status emojis and log links
   - Quick stats
5. **Preserves "📊 Phase Completion Summary" section** (if exists from documenter-agent)
6. Updates phase frontmatter status (in_progress or completed)
7. Preserves all other sections of phase document

**Environment Variables**:
- `$PHASE` - Phase number (e.g., "5", "3b")
- `$TASK_ID` - Task identifier
- `$TASK_NAME` - Task description

**Example Output**:
```markdown
## 📊 Progress Tracker

**Last Updated**: 2025-10-23 17:45:32 UTC
**Status**: 🚧 In Progress
**Completion**: 60% (3/5 tasks)
**Total Duration**: 2.5 hours
**Files Modified**: 12

### Task Summary

| Task ID | Task Name | Status | Log |
|---------|-----------|--------|-----|
| `5.23.implement_hooks` | Implement hooks | ✅ completed | [Log](../../_log/tasks/5.23.implement_hooks.1.abc123.md) |
...

## 📊 Phase Completion Summary
[Preserved from documenter-agent if exists]
```

---

### `.bin/hooks/phase-summary-wrapper.sh` (NEW)

**Purpose**: Handle SessionEnd hook limitation (Claude Code unavailable during termination)

**Called By**: SessionEnd hook when `PHASE_COMPLETE=true`

**Problem Solved**: The documenter-agent.sh needs to invoke Claude Code (`claude --print`) to generate comprehensive summaries, but Claude Code is not available during the SessionEnd hook (process is terminating).

**Solution**: Create a deferred task script that can be run manually after the session ends.

**Process**:
1. Checks for `$PHASE_COMPLETE` and `$PHASE_NUM` environment variables
2. Creates `.bin/hooks/deferred/phase-{NUM}-pending.sh` script
3. Displays clear instructions for manual execution
4. Logs deferral to debug.log

**Output**: Executable deferred task script that runs documenter-agent

**Note**: Progress Tracker is already complete from iterative updates! The phase summary just adds executive narrative, lessons learned, and insights.

---

### `.bin/create-task-log.sh`

**Purpose**: Generate task logs from templates (unchanged)

**Parameters**:
- `$TASK_ID` - Task identifier
- `$PHASE` - Phase number
- `$DAY` - Day of month
- `$TASK_NAME` - Task name
- `$SUBTASK_NAME` - Subtask name (optional)
- `$STATUS` - Task status
- `$AGENT` - Agent name

**Process**:
1. Generate unique hash for filename
2. Create filename: `[phase].[day].[task].[subtask].[hash].md`
3. Copy template from `templates/task-log-template.md`
4. Fill in frontmatter with provided parameters
5. Save to `_log/tasks/`

**Example**:
```bash
TASK_ID="3b.23.test" PHASE="3b" TASK_NAME="test_task" STATUS="completed" AGENT="Coder" ./.bin/create-task-log.sh
```

---

### `.bin/documenter-agent.sh`

**Purpose**: Generate phase completion summaries

**Parameters**:
- `$1` - Phase number (e.g., 3, 5, 6)
- `$2` - Phase status (complete, stopped, blocked, deferred)

**Process**:
1. Find phase document in `_planning/phases/`
2. Search for task logs matching phase number
3. Generate context file with all task logs
4. Invoke Claude Code to create summary
5. Update phase document with:
   - Task completion table
   - Metrics (duration, files modified, etc.)
   - Links to task logs
   - Success criteria validation

**Example**:
```bash
./.bin/documenter-agent.sh 3 complete
```

**Output**:
- Updates `_planning/phases/phase-[num]-*.md`
- Adds task table with links to logs
- Includes metrics and KPIs

---

### `.bin/daily-log-generator.sh`

**Purpose**: Aggregate task logs into daily summaries

**Parameters**:
- `$1` - Date (YYYY-MM-DD) - defaults to today

**Process**:
1. Find all task logs for specified date
2. Aggregate metrics:
   - Total tasks completed
   - Total duration
   - Files modified
   - Success rate
3. Generate daily summary
4. Save to `_planning/daily-logs/YYYY-MM-DD.md`

**Example**:
```bash
./.bin/daily-log-generator.sh 2025-10-23
```

---

## Workflow Examples

### Completing a Task (NEW - Iterative Updates)

**Automated Workflow (With Native Hooks v2.0)**:
```bash
# 1. Work on task implementation
# 2. Use TodoWrite tool and mark task as "completed"
# 3. PostToolUse hook automatically triggers:
#    a. Creates task log in _log/tasks/
#    b. Updates phase document Progress Tracker
#    c. Recalculates completion percentage
#    d. Adds task row to phase table
# 4. Continue to next task - phase document stays current
```

**Key Benefit**: Phase documents update **iteratively** after every task completion, not just at phase end. Always shows current progress!

**Example - As you complete 5 tasks**:
- Task 1 completes → Phase shows "20% (1/5 tasks)"
- Task 2 completes → Phase shows "40% (2/5 tasks)"
- Task 3 completes → Phase shows "60% (3/5 tasks)"
- Task 4 completes → Phase shows "80% (4/5 tasks)"
- Task 5 completes → Phase shows "100% (5/5 tasks)" + status changes to "completed"

---

### Completing a Phase (Comprehensive Summary)

**Two-Step Workflow (Hooks v2.0)**:

```bash
# STEP 1: Progress Tracker (automatic during work)
# ✅ Already done! Updated after every task completion
# Shows: completion %, duration, files modified, task table

# STEP 2: Executive Summary (manual after phase complete)
# The documenter-agent needs Claude Code, which isn't available during SessionEnd hook

# Option A: Direct execution (recommended)
./.bin/documenter-agent.sh 5 complete

# Option B: Via SessionEnd hook (creates deferred task)
export PHASE_COMPLETE=true
export PHASE_NUM=5
# Exit session → creates .bin/hooks/deferred/phase-5-pending.sh
# Then run: bash .bin/hooks/deferred/phase-5-pending.sh
```

**What documenter-agent adds**:
- Executive summary with narrative
- Key accomplishments list
- Challenges & solutions analysis
- Lessons learned (what went well, what to improve)
- Technical decisions documentation
- Reusable patterns identified
- Code metrics aggregation
- Cross-references to concepts/features/decisions

**Benefit**: Progress Tracker gives real-time status. Executive summary adds retrospective insights and learning.

---

## Testing Hooks

### Test PostToolUse Hook (Task Tracking)

**Method 1: Trigger via TodoWrite in Claude Code**
```bash
# In Claude Code session, use TodoWrite tool:
# Mark any todo as "completed" in your response
# Hook will automatically fire

# Verify hook triggered:
tail -20 .bin/hooks/debug.log

# Check task log created:
ls -la _log/tasks/

# Check phase document updated:
cat _planning/phases/phase-[X]-*.md | grep "Progress Tracker"
```

**Method 2: Test scripts directly**
```bash
# Test task log creation:
TASK_ID="test.01" PHASE="0" DAY="23" TASK_NAME="test_task" STATUS="completed" AGENT="Tester" \
  ./.bin/create-task-log.sh

# Test phase update:
PHASE="0" TASK_ID="test.01" TASK_NAME="Test task completion" \
  ./.bin/hooks/update-phase-incrementally.sh

# Verify outputs:
ls -la _log/tasks/0.23.*.md
cat _planning/phases/phase-0-*.md
```

---

### Test SessionEnd Hook (Phase Completion)

```bash
# Method 1: Manual trigger (recommended for testing)
./.bin/documenter-agent.sh 5 complete

# Method 2: Via environment variable (in Claude Code session)
export PHASE_COMPLETE=true
export PHASE_NUM=5
# Then exit session with Ctrl+D or /exit

# Verify: Check _planning/phases/ for updated document
cat _planning/phases/phase-5-*.md | grep "Phase Completion Summary"
```

---

## Troubleshooting

### Hook Not Triggering

**Issue**: PostToolUse hook doesn't create task logs when todos complete

**Solutions**:
1. **Check hook configuration**:
   ```bash
   cat .claude/settings.json | jq '.hooks.PostToolUse'
   # Verify: enabled=true, command="bash", args contains post-tool-task-tracker.sh
   ```

2. **Verify scripts are executable**:
   ```bash
   ls -la .bin/hooks/
   chmod +x .bin/hooks/*.sh
   chmod +x .bin/*.sh
   ```

3. **Check jq is installed** (required for JSON parsing):
   ```bash
   command -v jq || sudo apt-get install jq
   ```

4. **Review debug log**:
   ```bash
   tail -f .bin/hooks/debug.log
   # Should show: TOOL_NAME, TOOL_INPUT, completed tasks processing
   ```

5. **Test TodoWrite manually**:
   - In Claude Code session, create a todo and mark it completed
   - Check if hook triggers by watching debug.log
   - Verify TOOL_INPUT contains valid JSON

6. **Validate settings.json syntax**:
   ```bash
   jq empty .claude/settings.json
   # No output = valid JSON
   ```

---

### Documenter Agent Timeout

**Issue**: `.bin/documenter-agent.sh` times out waiting for Claude Code

**Solutions**:
1. Run manually instead of via hook: `./.bin/documenter-agent.sh 3 complete`
2. Increase timeout in hook configuration
3. Check temp directory is writable: `ls -la /tmp/`
4. Verify context file created: `ls -la /tmp/tmp.*/phase-*-context.md`

---

### Template Not Found

**Issue**: Task log script can't find template

**Solutions**:
1. Verify template exists: `ls templates/task-log-template.md`
2. Check SCRIPT_DIR and PROJECT_ROOT paths in script
3. Script will create basic log if template missing (warning shown)

---

## Customization

### Modify Task Log Format

Edit `templates/task-log-template.md` to change structure/fields

### Add Custom Hooks

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "preTask": {
      "enabled": true,
      "command": "bash",
      "args": ["-c", "echo 'Starting task: $TASK_NAME'"]
    }
  }
}
```

### Change Filename Format

Edit `.bin/create-task-log.sh`, line ~35:
```bash
# Current: [phase].[day].[task].[subtask].[hash].md
# Custom: [YYYY-MM-DD]-[task]-[hash].md
FILENAME="$(date +%Y-%m-%d)-${TASK_NAME// /_}-${HASH}.md"
```

---

## Files & Architecture

### Configuration
- `.claude/settings.json` - Native hook configuration (PostToolUse, SessionEnd)
- `.claude/HOOKS-README.md` - This documentation

### Hook Scripts (NEW)
- `.bin/hooks/post-tool-task-tracker.sh` - PostToolUse hook handler (monitors TodoWrite)
- `.bin/hooks/update-phase-incrementally.sh` - Incremental phase updater (iterative)
- `.bin/hooks/debug.log` - Hook execution debug log (auto-generated)

### Legacy Scripts (Still Used)
- `.bin/create-task-log.sh` - Task log generator (136 lines) - Called by hooks
- `.bin/documenter-agent.sh` - Phase completion documenter (245 lines) - Manual/deferred
- `.bin/daily-log-generator.sh` - Daily log aggregator (175 lines) - Manual use
- `.bin/run-deferred-tasks.sh` - Helper to run pending deferred tasks (NEW)

### Templates
- `templates/task-log-template.md` - Task log template (291 lines)

### Output Directories
- `_log/tasks/` - Individual task logs (auto-generated)
- `_log/daily/` - Daily summaries (manual generation)
- `_planning/phases/` - Phase documents (iteratively updated)

---

## Migration Notes (v1.0 → v2.0)

**Breaking Changes**:
1. Removed Claude-Flow custom hooks (`postTask`, `postEdit`, `notify`)
2. Migrated to native Claude Code hooks (`PostToolUse`, `SessionEnd`)
3. Added iterative phase updates (every task completion, not just phase end)
4. SessionEnd hook now defers phase summary (Claude unavailable during termination)

**New Behavior**:
- Task logs created automatically when TodoWrite marks task as "completed"
- Phase documents update incrementally with progress tracker
- No more manual phase updates needed - always current!
- Phase completion summary requires manual execution after session ends

**Known Limitation**:
- **Claude Code is unavailable during SessionEnd hook** (process terminating)
- Therefore, documenter-agent.sh (which calls `claude --print`) cannot run in SessionEnd
- Solution: SessionEnd creates a deferred task script to run manually after session

**Dependencies Added**:
- `jq` (JSON parser) - Required for parsing TodoWrite input

**Why This Solution**:
The SessionEnd hook executes **during Claude Code process shutdown**. At this point:
- The `claude` CLI command is not available
- stdin/stdout pipes are closed or unreliable
- The process cannot spawn new Claude Code instances

Therefore, the best approach is:
1. **Iterative Progress Tracker** - Updates automatically during work (via PostToolUse)
2. **Deferred Phase Summary** - Run manually after session ends (when Claude Code is available)

---

## Related Documentation

- [[../_planning/reviews/PLANNING-REVIEW-2025-10-22]] - Planning review with Phase 3b completion
- [[../templates/task-log-template]] - Task log template structure
- [[../_log/tasks/]] - Task log directory
- [[../_planning/phases/]] - Phase documents directory

---

**Last Updated**: 2025-10-23
**Version**: 2.0 (Native Claude Code Hooks)
**Maintained By**: Hive Mind
**Status**: Production Ready ✅ (Migrated from Claude-Flow)
