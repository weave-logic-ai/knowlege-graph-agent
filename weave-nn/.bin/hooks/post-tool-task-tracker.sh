#!/usr/bin/env bash
# Post-Tool Task Tracker Hook
# Monitors TodoWrite tool usage and triggers task logging + phase updates
# Called by Claude Code PostToolUse hook

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../.."
TASK_LOG_SCRIPT="${SCRIPT_DIR}/../create-task-log.sh"
PHASE_UPDATE_SCRIPT="${SCRIPT_DIR}/update-phase-incrementally.sh"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Debug logging
DEBUG_LOG="${PROJECT_ROOT}/.bin/hooks/debug.log"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] PostToolUse hook triggered" >> "$DEBUG_LOG"
echo "TOOL_NAME: ${TOOL_NAME:-not set}" >> "$DEBUG_LOG"
echo "TOOL_INPUT: ${TOOL_INPUT:-not set}" >> "$DEBUG_LOG"
echo "TOOL_OUTPUT: ${TOOL_OUTPUT:-not set}" >> "$DEBUG_LOG"

# Only process TodoWrite tool
if [ "${TOOL_NAME:-}" != "TodoWrite" ]; then
    exit 0
fi

echo -e "${BLUE}=== Task Tracker Hook ===${NC}" >&2
echo "Detected TodoWrite completion" >&2

# Parse TOOL_INPUT to extract completed todos
# TOOL_INPUT is JSON format: {"todos": [{"content": "...", "status": "completed", ...}, ...]}

if [ -z "${TOOL_INPUT:-}" ]; then
    echo -e "${YELLOW}Warning: No TOOL_INPUT available${NC}" >&2
    exit 0
fi

# Check if jq is available for JSON parsing
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq not found. Install with: sudo apt-get install jq${NC}" >&2
    exit 1
fi

# Extract all completed tasks from the TodoWrite input
COMPLETED_TASKS=$(echo "$TOOL_INPUT" | jq -r '.todos[] | select(.status == "completed") | @json')

if [ -z "$COMPLETED_TASKS" ]; then
    echo "No completed tasks found in this TodoWrite call" >&2
    exit 0
fi

# Process each completed task
TASK_COUNT=0
while IFS= read -r task_json; do
    [ -z "$task_json" ] && continue

    TASK_COUNT=$((TASK_COUNT + 1))

    # Extract task details
    TASK_CONTENT=$(echo "$task_json" | jq -r '.content // "Unknown Task"')
    TASK_PRIORITY=$(echo "$task_json" | jq -r '.priority // "medium"')
    TASK_ACTIVE_FORM=$(echo "$task_json" | jq -r '.activeForm // .content')

    echo -e "${GREEN}Processing completed task: ${TASK_CONTENT}${NC}" >&2

    # Try to extract phase number from task content or context
    # Look for patterns like "Phase 5", "phase-6", "P3", etc.
    PHASE="0"
    if [[ "$TASK_CONTENT" =~ [Pp]hase[- ]?([0-9]+[a-z]?) ]]; then
        PHASE="${BASH_REMATCH[1]}"
    elif [[ "$TASK_CONTENT" =~ [Pp]([0-9]+[a-z]?) ]]; then
        PHASE="${BASH_REMATCH[1]}"
    fi

    # Generate task name from content (sanitize for filename)
    TASK_NAME=$(echo "$TASK_CONTENT" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g' | sed 's/_\+/_/g' | sed 's/^_//;s/_$//')

    # Truncate if too long
    if [ ${#TASK_NAME} -gt 50 ]; then
        TASK_NAME="${TASK_NAME:0:50}"
    fi

    # Get current day
    DAY=$(date +%d)

    # Create task log
    echo "Creating task log..." >&2
    TASK_ID="${PHASE}.${DAY}.${TASK_NAME}"

    if [ -x "$TASK_LOG_SCRIPT" ]; then
        TASK_ID="$TASK_ID" \
        PHASE="$PHASE" \
        DAY="$DAY" \
        TASK_NAME="$TASK_NAME" \
        STATUS="completed" \
        AGENT="Claude" \
        "$TASK_LOG_SCRIPT" 2>&1 | tee -a "$DEBUG_LOG"
    else
        echo -e "${YELLOW}Warning: Task log script not executable or not found${NC}" >&2
        echo "Path: $TASK_LOG_SCRIPT" >&2
    fi

    # Trigger incremental phase update
    echo "Updating phase document..." >&2
    if [ -x "$PHASE_UPDATE_SCRIPT" ]; then
        PHASE="$PHASE" \
        TASK_ID="$TASK_ID" \
        TASK_NAME="$TASK_CONTENT" \
        "$PHASE_UPDATE_SCRIPT" 2>&1 | tee -a "$DEBUG_LOG"
    else
        echo -e "${YELLOW}Warning: Phase update script not executable or not found${NC}" >&2
        echo "Path: $PHASE_UPDATE_SCRIPT" >&2
    fi

done <<< "$COMPLETED_TASKS"

echo -e "${GREEN}✅ Processed ${TASK_COUNT} completed task(s)${NC}" >&2
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Processed ${TASK_COUNT} tasks" >> "$DEBUG_LOG"

exit 0
