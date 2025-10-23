#!/usr/bin/env bash
# Daily Log Generator
# Aggregates task logs from _log/tasks/ to create daily summary in _planning/daily-logs/

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TASK_LOGS_DIR="${PROJECT_ROOT}/_log/tasks"
DAILY_LOGS_DIR="${PROJECT_ROOT}/_log/daily"

# Get target date (default: today)
TARGET_DATE="${1:-$(date +%Y-%m-%d)}"
LOG_FILE="${DAILY_LOGS_DIR}/${TARGET_DATE}.md"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Daily Log Generator ===${NC}"
echo "Target date: ${TARGET_DATE}"
echo "Task logs directory: ${TASK_LOGS_DIR}"
echo "Output: ${LOG_FILE}"
echo

# Create directories if needed
mkdir -p "${DAILY_LOGS_DIR}"

# Find task logs from target date
echo "Searching for task logs from ${TARGET_DATE}..."
TASK_LOG_FILES=$(find "${TASK_LOGS_DIR}" -name "*.md" -type f 2>/dev/null | while read -r file; do
    # Extract date from frontmatter or filename
    if grep -q "^Date: ${TARGET_DATE}" "$file" 2>/dev/null || \
       grep -q "^date: ${TARGET_DATE}" "$file" 2>/dev/null; then
        echo "$file"
    fi
done)

TASK_COUNT=$(echo "${TASK_LOG_FILES}" | grep -c . || echo "0")

if [ "${TASK_COUNT}" -eq 0 ]; then
    echo -e "${YELLOW}No task logs found for ${TARGET_DATE}${NC}"
    exit 0
fi

echo "Found ${TASK_COUNT} task log(s)"
echo

# Initialize counters
TOTAL_DURATION=0
COMPLETED_COUNT=0
PARTIAL_COUNT=0
BLOCKED_COUNT=0
DEFERRED_COUNT=0
PAUSED_COUNT=0
CANCELLED_COUNT=0
SUCCESS_COUNT=0
TOTAL_FILES_MODIFIED=0
TOTAL_LINES_ADDED=0
TOTAL_LINES_REMOVED=0
TOTAL_TESTS_ADDED=0

# Arrays for task details
declare -a TASK_SUMMARIES=()

# Process each task log
while IFS= read -r task_file; do
    [ -z "$task_file" ] && continue

    echo "Processing: $(basename "$task_file")"

    # Extract data from frontmatter using awk/sed
    TASK_ID=$(grep "^task_id:" "$task_file" | sed 's/task_id: *"\?\([^"]*\)"\?/\1/' || echo "unknown")
    TASK_NAME=$(grep "^task_name:" "$task_file" | sed 's/task_name: *"\?\([^"]*\)"\?/\1/' || echo "Unnamed Task")
    STATUS=$(grep "^status:" "$task_file" | sed 's/status: *"\?\([^"]*\)"\?/\1/' || echo "unknown")
    DURATION=$(grep "^duration_minutes:" "$task_file" | sed 's/duration_minutes: *//' || echo "0")
    SUCCESS=$(grep "^success:" "$task_file" | sed 's/success: *//' || echo "false")
    FILES_MOD=$(grep "^files_modified:" "$task_file" | sed 's/files_modified: *//' || echo "0")
    LINES_ADD=$(grep "^lines_added:" "$task_file" | sed 's/lines_added: *//' || echo "0")
    LINES_REM=$(grep "^lines_removed:" "$task_file" | sed 's/lines_removed: *//' || echo "0")
    TESTS_ADD=$(grep "^tests_added:" "$task_file" | sed 's/tests_added: *//' || echo "0")

    # Update counters
    TOTAL_DURATION=$((TOTAL_DURATION + DURATION))
    TOTAL_FILES_MODIFIED=$((TOTAL_FILES_MODIFIED + FILES_MOD))
    TOTAL_LINES_ADDED=$((TOTAL_LINES_ADDED + LINES_ADD))
    TOTAL_LINES_REMOVED=$((TOTAL_LINES_REMOVED + LINES_REM))
    TOTAL_TESTS_ADDED=$((TOTAL_TESTS_ADDED + TESTS_ADD))

    # Count by status
    case "$STATUS" in
        completed*) COMPLETED_COUNT=$((COMPLETED_COUNT + 1)) ;;
        partial*) PARTIAL_COUNT=$((PARTIAL_COUNT + 1)) ;;
        blocked*) BLOCKED_COUNT=$((BLOCKED_COUNT + 1)) ;;
        deferred*) DEFERRED_COUNT=$((DEFERRED_COUNT + 1)) ;;
        paused*) PAUSED_COUNT=$((PAUSED_COUNT + 1)) ;;
        cancelled*) CANCELLED_COUNT=$((CANCELLED_COUNT + 1)) ;;
    esac

    # Count successes
    if [ "$SUCCESS" = "true" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi

    # Store task summary with relative path to log
    RELATIVE_LOG_PATH="../_log/tasks/$(basename "$task_file")"
    TASK_SUMMARIES+=("| \`${TASK_ID}\` | ${TASK_NAME} | ${STATUS} | ${DURATION} min | [Log](${RELATIVE_LOG_PATH}) |")

done <<< "$TASK_LOG_FILES"

# Calculate KPIs
if [ "${TASK_COUNT}" -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", (${SUCCESS_COUNT}/${TASK_COUNT})*100}")
    AVG_DURATION=$(awk "BEGIN {printf \"%.1f\", ${TOTAL_DURATION}/${TASK_COUNT}}")
else
    SUCCESS_RATE="0.0"
    AVG_DURATION="0.0"
fi

HOURS=$(awk "BEGIN {printf \"%.1f\", ${TOTAL_DURATION}/60}")

echo
echo "=== Summary ==="
echo "Total tasks: ${TASK_COUNT}"
echo "Total duration: ${HOURS} hours"
echo "Success rate: ${SUCCESS_RATE}%"
echo "Files modified: ${TOTAL_FILES_MODIFIED}"
echo "Lines added: ${TOTAL_LINES_ADDED}"
echo "Lines removed: ${TOTAL_LINES_REMOVED}"
echo "Tests added: ${TOTAL_TESTS_ADDED}"
echo

# Generate daily log markdown
cat > "${LOG_FILE}" << EOF
---
type: daily_log
date: ${TARGET_DATE}
total_tasks: ${TASK_COUNT}
completed_tasks: ${COMPLETED_COUNT}
partial_tasks: ${PARTIAL_COUNT}
blocked_tasks: ${BLOCKED_COUNT}
success_rate: ${SUCCESS_RATE}
total_duration_minutes: ${TOTAL_DURATION}
total_duration_hours: ${HOURS}
files_modified: ${TOTAL_FILES_MODIFIED}
lines_added: ${TOTAL_LINES_ADDED}
lines_removed: ${TOTAL_LINES_REMOVED}
tests_added: ${TOTAL_TESTS_ADDED}
tags:
  - daily-log
  - automated
cssclasses:
  - daily-log
---

# Daily Log: ${TARGET_DATE}

**Generated**: $(date +"%Y-%m-%d %H:%M:%S")
**Total Duration**: ${HOURS} hours (${TOTAL_DURATION} minutes)
**Tasks Completed**: ${COMPLETED_COUNT}/${TASK_COUNT}
**Success Rate**: ${SUCCESS_RATE}%

---

## 📊 Summary Metrics

| Metric | Value |
|--------|-------|
| **Total Tasks** | ${TASK_COUNT} |
| **✅ Completed** | ${COMPLETED_COUNT} |
| **⚠️ Partial** | ${PARTIAL_COUNT} |
| **🚫 Blocked** | ${BLOCKED_COUNT} |
| **⏭️ Deferred** | ${DEFERRED_COUNT} |
| **⏸️ Paused** | ${PAUSED_COUNT} |
| **❌ Cancelled** | ${CANCELLED_COUNT} |
| **Success Rate** | ${SUCCESS_RATE}% |
| **Avg Duration** | ${AVG_DURATION} min/task |

---

## 💻 Code Metrics

| Metric | Value |
|--------|-------|
| **Files Modified** | ${TOTAL_FILES_MODIFIED} |
| **Lines Added** | +${TOTAL_LINES_ADDED} |
| **Lines Removed** | -${TOTAL_LINES_REMOVED} |
| **Net Lines** | $((TOTAL_LINES_ADDED - TOTAL_LINES_REMOVED)) |
| **Tests Added** | ${TOTAL_TESTS_ADDED} |

---

## 📋 Task Details

| Task ID | Task Name | Status | Duration | Log |
|---------|-----------|--------|----------|-----|
EOF

# Append task summaries
for summary in "${TASK_SUMMARIES[@]}"; do
    echo "$summary" >> "${LOG_FILE}"
done

# Footer
cat >> "${LOG_FILE}" << EOF

---

## 📝 Notes

*This daily log was automatically generated by aggregating individual task logs from \`_log/tasks/\`.*

**Task logs included**: ${TASK_COUNT}
**Source directory**: \`_log/tasks/\`
**Generator script**: \`.bin/daily-log-generator.sh\`

---

## 🔗 Quick Links

- [[_planning/MASTER-PLAN|Master Plan]]
- [[_log/tasks/|Task Logs Directory]]
- [[_log/daily/|Daily Logs Directory]]

---

**Generated by**: Daily Log Generator
**Timestamp**: $(date +"%Y-%m-%d %H:%M:%S %Z")
EOF

echo -e "${GREEN}✓ Daily log generated: ${LOG_FILE}${NC}"
echo
echo "Summary written with ${TASK_COUNT} task(s)"
echo "Total time: ${HOURS} hours"
echo "Success rate: ${SUCCESS_RATE}%"
