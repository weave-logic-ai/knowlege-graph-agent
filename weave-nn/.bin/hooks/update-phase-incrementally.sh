#!/usr/bin/env bash
# Incremental Phase Update Script
# Updates phase documents iteratively as tasks complete
# Called by post-tool-task-tracker.sh after each task completion

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../.."
PHASES_DIR="${PROJECT_ROOT}/_planning/phases"
TASK_LOGS_DIR="${PROJECT_ROOT}/_log/tasks"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Get task information from environment
PHASE="${PHASE:-0}"
TASK_ID="${TASK_ID:-unknown}"
TASK_NAME="${TASK_NAME:-Unknown Task}"

echo -e "${BLUE}=== Incremental Phase Update ===${NC}"
echo "Phase: ${PHASE}"
echo "Task: ${TASK_NAME}"
echo

# Find phase document
PHASE_FILES=$(find "${PHASES_DIR}" -name "phase-${PHASE}-*.md" -o -name "phase-${PHASE}.md" 2>/dev/null || echo "")

if [ -z "$PHASE_FILES" ]; then
    echo -e "${YELLOW}No phase document found for phase ${PHASE}${NC}"
    echo "Skipping phase update..."
    exit 0
fi

# Use first match if multiple found
PHASE_FILE=$(echo "$PHASE_FILES" | head -1)
echo "Phase document: $PHASE_FILE"
echo

# Find all task logs for this phase
TASK_LOG_FILES=$(find "${TASK_LOGS_DIR}" -name "${PHASE}.*.md" -type f 2>/dev/null | sort || echo "")

if [ -z "$TASK_LOG_FILES" ]; then
    echo -e "${YELLOW}No task logs found yet for phase ${PHASE}${NC}"
    TASK_COUNT=0
else
    TASK_COUNT=$(echo "$TASK_LOG_FILES" | wc -l)
fi

echo "Found ${TASK_COUNT} task log(s) for phase ${PHASE}"
echo

# Calculate metrics from task logs
COMPLETED_COUNT=0
TOTAL_DURATION=0
TOTAL_FILES_MODIFIED=0

if [ "$TASK_COUNT" -gt 0 ]; then
    while IFS= read -r task_file; do
        [ -z "$task_file" ] && continue

        # Extract metrics from frontmatter
        STATUS=$(grep "^status:" "$task_file" | sed 's/status: *"\?\([^"]*\)"\?/\1/' || echo "unknown")
        DURATION=$(grep "^duration_minutes:" "$task_file" | sed 's/duration_minutes: *//' || echo "0")
        FILES_MOD=$(grep "^files_modified:" "$task_file" | sed 's/files_modified: *//' || echo "0")

        if [[ "$STATUS" == "completed"* ]]; then
            COMPLETED_COUNT=$((COMPLETED_COUNT + 1))
        fi

        TOTAL_DURATION=$((TOTAL_DURATION + DURATION))
        TOTAL_FILES_MODIFIED=$((TOTAL_FILES_MODIFIED + FILES_MOD))

    done <<< "$TASK_LOG_FILES"
fi

# Calculate completion percentage
if [ "$TASK_COUNT" -gt 0 ]; then
    COMPLETION_PCT=$(awk "BEGIN {printf \"%.1f\", (${COMPLETED_COUNT}/${TASK_COUNT})*100}")
else
    COMPLETION_PCT="0.0"
fi

HOURS=$(awk "BEGIN {printf \"%.1f\", ${TOTAL_DURATION}/60}")

echo "=== Metrics ==="
echo "Total tasks: ${TASK_COUNT}"
echo "Completed: ${COMPLETED_COUNT}"
echo "Completion: ${COMPLETION_PCT}%"
echo "Duration: ${HOURS} hours"
echo "Files modified: ${TOTAL_FILES_MODIFIED}"
echo

# Generate or update progress section in phase document
PROGRESS_MARKER="## 📊 Progress Tracker"
COMPLETION_MARKER="## 📊 Phase Completion Summary"

if grep -q "^${PROGRESS_MARKER}" "$PHASE_FILE"; then
    echo "Updating existing progress section..."

    # Remove old progress section (but preserve Phase Completion Summary if it exists)
    awk -v marker="$PROGRESS_MARKER" -v completion="$COMPLETION_MARKER" '
        BEGIN { skip=0 }
        $0 ~ completion { skip=0 }
        $0 ~ "^## " && $0 !~ marker && $0 !~ completion { skip=0 }
        $0 ~ marker { skip=1; next }
        skip == 0 { print }
    ' "$PHASE_FILE" > "${PHASE_FILE}.tmp"

else
    echo "Adding new progress section..."
    cp "$PHASE_FILE" "${PHASE_FILE}.tmp"
fi

# Generate progress section
cat >> "${PHASE_FILE}.tmp" << EOF

${PROGRESS_MARKER}

**Last Updated**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Status**: 🚧 In Progress
**Completion**: ${COMPLETION_PCT}% (${COMPLETED_COUNT}/${TASK_COUNT} tasks)
**Total Duration**: ${HOURS} hours
**Files Modified**: ${TOTAL_FILES_MODIFIED}

---

### Task Summary

| Task ID | Task Name | Status | Log |
|---------|-----------|--------|-----|
EOF

# Add task rows
if [ "$TASK_COUNT" -gt 0 ]; then
    while IFS= read -r task_file; do
        [ -z "$task_file" ] && continue

        TASK_ID=$(grep "^task_id:" "$task_file" | sed 's/task_id: *"\?\([^"]*\)"\?/\1/' || echo "unknown")
        TASK_NAME=$(grep "^task_name:" "$task_file" | sed 's/task_name: *"\?\([^"]*\)"\?/\1/' || echo "Unnamed")
        STATUS=$(grep "^status:" "$task_file" | sed 's/status: *"\?\([^"]*\)"\?/\1/' || echo "unknown")

        # Add status emoji
        case "$STATUS" in
            completed*) STATUS_EMOJI="✅" ;;
            partial*) STATUS_EMOJI="⚠️" ;;
            blocked*) STATUS_EMOJI="🚫" ;;
            deferred*) STATUS_EMOJI="⏭️" ;;
            paused*) STATUS_EMOJI="⏸️" ;;
            cancelled*) STATUS_EMOJI="❌" ;;
            *) STATUS_EMOJI="📝" ;;
        esac

        RELATIVE_PATH="../../_log/tasks/$(basename "$task_file")"

        echo "| \`${TASK_ID}\` | ${TASK_NAME} | ${STATUS_EMOJI} ${STATUS} | [Log](${RELATIVE_PATH}) |" >> "${PHASE_FILE}.tmp"

    done <<< "$TASK_LOG_FILES"
fi

# Add footer
cat >> "${PHASE_FILE}.tmp" << EOF

---

### Quick Stats

- 📝 **Tasks Logged**: ${TASK_COUNT}
- ✅ **Completed**: ${COMPLETED_COUNT}
- ⏱️ **Time Invested**: ${HOURS} hours (${TOTAL_DURATION} minutes)
- 📄 **Files Modified**: ${TOTAL_FILES_MODIFIED}

---

*Progress tracker automatically updated by task completion hooks.*
*Last task completed: ${TASK_NAME}*

EOF

# If Phase Completion Summary exists, preserve it at the end
if grep -q "^${COMPLETION_MARKER}" "$PHASE_FILE"; then
    echo "Preserving existing Phase Completion Summary..."
    awk -v marker="$COMPLETION_MARKER" '
        BEGIN { found=0 }
        $0 ~ marker { found=1 }
        found { print }
    ' "$PHASE_FILE" >> "${PHASE_FILE}.tmp"
fi

# Replace original file
mv "${PHASE_FILE}.tmp" "$PHASE_FILE"

# Update frontmatter status
if grep -q "^status:" "$PHASE_FILE"; then
    if [ "$COMPLETION_PCT" = "100.0" ]; then
        sed -i "s/^status:.*/status: completed/" "$PHASE_FILE"
    else
        sed -i "s/^status:.*/status: in_progress/" "$PHASE_FILE"
    fi
fi

echo -e "${GREEN}✅ Phase document updated successfully${NC}"
echo "Updated: $PHASE_FILE"
echo

exit 0
