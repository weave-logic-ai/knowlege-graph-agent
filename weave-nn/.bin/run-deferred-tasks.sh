#!/usr/bin/env bash
# Run Deferred Tasks Helper
# Checks for and executes pending deferred tasks from SessionEnd hooks

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
DEFERRED_DIR="${SCRIPT_DIR}/hooks/deferred"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Deferred Tasks Runner ===${NC}"
echo

# Check if deferred directory exists
if [ ! -d "$DEFERRED_DIR" ]; then
    echo -e "${GREEN}No deferred tasks directory found${NC}"
    echo "All caught up!"
    exit 0
fi

# Find pending task scripts
PENDING_TASKS=$(find "$DEFERRED_DIR" -name "phase-*-pending.sh" -type f 2>/dev/null || echo "")

if [ -z "$PENDING_TASKS" ]; then
    echo -e "${GREEN}No pending deferred tasks found${NC}"
    echo "All caught up!"
    exit 0
fi

TASK_COUNT=$(echo "$PENDING_TASKS" | wc -l)
echo -e "${YELLOW}Found ${TASK_COUNT} pending deferred task(s):${NC}"
echo

# List tasks
while IFS= read -r task_file; do
    [ -z "$task_file" ] && continue

    TASK_NAME=$(basename "$task_file")
    CREATED=$(stat -c %y "$task_file" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1 || echo "unknown")

    echo -e "  📋 ${BLUE}${TASK_NAME}${NC}"
    echo -e "     Created: ${CREATED}"
    echo -e "     Path: ${task_file}"
    echo
done <<< "$PENDING_TASKS"

# Ask user if they want to run all tasks
echo -e "${YELLOW}Would you like to run all deferred tasks? (y/n)${NC}"
read -r RESPONSE

if [[ ! "$RESPONSE" =~ ^[Yy]$ ]]; then
    echo "Skipped. You can run tasks manually:"
    echo
    while IFS= read -r task_file; do
        [ -z "$task_file" ] && continue
        echo "  bash $task_file"
    done <<< "$PENDING_TASKS"
    exit 0
fi

echo
echo -e "${GREEN}Running deferred tasks...${NC}"
echo

# Execute each task
SUCCESS_COUNT=0
FAIL_COUNT=0

while IFS= read -r task_file; do
    [ -z "$task_file" ] && continue

    TASK_NAME=$(basename "$task_file")
    echo -e "${BLUE}▶ Running: ${TASK_NAME}${NC}"
    echo

    if bash "$task_file"; then
        echo
        echo -e "${GREEN}✓ Completed: ${TASK_NAME}${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

        # Archive completed task
        ARCHIVE_DIR="${DEFERRED_DIR}/completed"
        mkdir -p "$ARCHIVE_DIR"
        mv "$task_file" "${ARCHIVE_DIR}/${TASK_NAME}.$(date +%Y%m%d-%H%M%S)"
    else
        echo
        echo -e "${RED}✗ Failed: ${TASK_NAME}${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi

    echo
    echo "---"
    echo
done <<< "$PENDING_TASKS"

# Summary
echo -e "${BLUE}=== Summary ===${NC}"
echo "Total tasks: ${TASK_COUNT}"
echo -e "${GREEN}Successful: ${SUCCESS_COUNT}${NC}"
if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "${RED}Failed: ${FAIL_COUNT}${NC}"
fi
echo

if [ "$SUCCESS_COUNT" -eq "$TASK_COUNT" ]; then
    echo -e "${GREEN}All deferred tasks completed successfully! ✅${NC}"
else
    echo -e "${YELLOW}Some tasks failed. Check the output above for details.${NC}"
fi
