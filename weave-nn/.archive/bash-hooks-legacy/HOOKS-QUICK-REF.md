---
status: archived
archive_date: "2025-10-23"
archive_reason: "Replaced by Weaver (workflow.dev) unified workflow proxy"
replacement: "[[../../docs/weaver-workflow-proxy]]"
original_path: ".claude/HOOKS-QUICK-REF.md"
version: "1.0 - Bash Hooks Legacy"
---

# ⚠️ ARCHIVED: Hooks Quick Reference (v1.0 - Bash Hooks)

> **Archive Notice**: This quick reference has been archived as of 2025-10-23 and replaced by Weaver (workflow.dev) workflow proxy.
>
> **Reason**: Bash-based hooks have been superseded by Weaver's unified workflow automation.
>
> **New Documentation**: See [[../../docs/weaver-workflow-proxy]] for current automation approach.
>
> **Original Location**: `.claude/HOOKS-QUICK-REF.md`

---

# Hooks Quick Reference

**Version**: 1.0 (Bash Hooks - ARCHIVED)
**Last Updated**: 2025-10-23

---

## TL;DR

**What happens automatically**:
- ✅ Task logs created when you mark todos as "completed"
- ✅ Phase documents update with progress tracker after each task
- ✅ Real-time completion %, duration, file metrics

**What requires manual action**:
- 📝 Phase completion summary (executive narrative, lessons learned)
  - Run: `./.bin/documenter-agent.sh [PHASE] complete`

---

## Quick Commands

### Check What Tasks Completed Today
```bash
ls -la _log/tasks/*.$(date +%d).*.md
```

### View Phase Progress
```bash
cat _planning/phases/phase-*.md | grep "Progress Tracker" -A 30
```

### Generate Phase Summary (Manual)
```bash
# After phase is complete:
./.bin/documenter-agent.sh 5 complete
```

### Run Deferred Tasks
```bash
# Check for pending deferred tasks and run them:
./.bin/run-deferred-tasks.sh
```

### View Hook Debug Log
```bash
tail -f .bin/hooks/debug.log
```

### Test Hook Manually
```bash
# Test task log creation:
TASK_ID="test.01" PHASE="0" TASK_NAME="test_task" STATUS="completed" \
  ./.bin/create-task-log.sh

# Test phase update:
PHASE="0" TASK_ID="test.01" TASK_NAME="Test task" \
  ./.bin/hooks/update-phase-incrementally.sh
```

---

## Hook Behavior Summary

### PostToolUse Hook
**Triggers**: After any tool use (filters for TodoWrite)
**Action**:
1. Detects todos marked "completed"
2. Creates task log in `_log/tasks/`
3. Updates phase document progress tracker
4. Recalculates metrics

**Silent**: Runs in background, check debug.log if issues

### SessionEnd Hook
**Triggers**: When Claude Code session ends
**Action**:
1. Checks for `PHASE_COMPLETE=true` environment variable
2. Creates deferred task script in `.bin/hooks/deferred/`
3. Displays instructions for manual execution

**Why deferred**: Claude Code process is terminating, `claude --print` unavailable

---

## Troubleshooting One-Liners

```bash
# Check if hooks are enabled
cat .claude/settings.json | jq '.hooks'

# Verify scripts are executable
ls -la .bin/hooks/*.sh

# Check jq is installed
command -v jq

# View recent hook activity
tail -20 .bin/hooks/debug.log

# Validate settings.json
jq empty .claude/settings.json

# List all task logs for phase 5
ls -la _log/tasks/5.*.md

# Find deferred tasks
ls -la .bin/hooks/deferred/
```

---

## File Naming Convention

**Task Logs**: `[phase].[day].[task].[subtask].[hash].md`
- Example: `5.23.implement_hooks.1.a3f2c1.md`
- Phase: 5
- Day: 23rd
- Task: implement_hooks
- Subtask: 1
- Hash: a3f2c1 (unique identifier)

**Deferred Scripts**: `phase-[num]-pending.sh`
- Example: `phase-5-pending.sh`

---

## Phase Document Sections

After hooks run, your phase document will have:

```markdown
## 📊 Progress Tracker
[Updated after EVERY task completion]
- Completion percentage
- Total duration
- Files modified
- Task table with links to logs

## 📊 Phase Completion Summary
[Added by documenter-agent - manual execution]
- Executive summary
- Key accomplishments
- Challenges & solutions
- Lessons learned
- Technical decisions
```

---

## Common Workflows

### During Development
```bash
# Work on task
# Use TodoWrite and mark task "completed"
# ✅ Hook automatically:
#    - Creates task log
#    - Updates phase progress tracker
# Continue to next task
```

### End of Phase
```bash
# All tasks complete → Phase shows 100%
# Generate executive summary:
./.bin/documenter-agent.sh 5 complete

# Or check for deferred tasks:
./.bin/run-deferred-tasks.sh
```

### Daily Review
```bash
# View today's completed tasks:
ls -la _log/tasks/*.$(date +%d).*.md

# Generate daily summary (optional):
./.bin/daily-log-generator.sh $(date +%Y-%m-%d)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `.claude/settings.json` | Hook configuration |
| `.bin/hooks/post-tool-task-tracker.sh` | PostToolUse handler |
| `.bin/hooks/update-phase-incrementally.sh` | Incremental phase updater |
| `.bin/hooks/debug.log` | Hook execution log |
| `.bin/documenter-agent.sh` | Phase summary generator |
| `.bin/run-deferred-tasks.sh` | Deferred task runner |
| `_log/tasks/` | Task logs directory |
| `_planning/phases/` | Phase documents |

---

## Need Help?

- **Full docs**: `.claude/HOOKS-README.md`
- **Debug issues**: `tail -f .bin/hooks/debug.log`
- **Test hooks**: See "Test Hook Manually" section above
- **Report bugs**: Create issue with debug.log output

---

**Quick tip**: Phase documents stay current in real-time. No need to manually update progress!
