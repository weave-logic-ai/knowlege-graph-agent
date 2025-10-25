#!/bin/bash
#
# Post-Tool Task Tracker Hook
# Reports task completion status for Phase 5 MCP Integration
#
# Usage: post-tool-task.tracker.sh --task-id "5.3" --task-name "Tool Registry Architecture" --status "completed" --phase "phase-5-mcp-integration"
#

set -euo pipefail

# Parse arguments
TASK_ID=""
TASK_NAME=""
STATUS=""
PHASE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --task-id)
      TASK_ID="$2"
      shift 2
      ;;
    --task-name)
      TASK_NAME="$2"
      shift 2
      ;;
    --status)
      STATUS="$2"
      shift 2
      ;;
    --phase)
      PHASE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [[ -z "$TASK_ID" ]] || [[ -z "$TASK_NAME" ]] || [[ -z "$STATUS" ]] || [[ -z "$PHASE" ]]; then
  echo "Error: Missing required arguments"
  echo "Usage: $0 --task-id <id> --task-name <name> --status <status> --phase <phase>"
  exit 1
fi

# Get timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create log entry
LOG_DIR="/home/aepod/dev/weave-nn/.task-logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/$PHASE.log"

# Log task completion
echo "[$TIMESTAMP] Task $TASK_ID: $TASK_NAME - $STATUS" >> "$LOG_FILE"

# Output for user
cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TASK COMPLETION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase:     $PHASE
Task ID:   $TASK_ID
Task Name: $TASK_NAME
Status:    $STATUS
Timestamp: $TIMESTAMP

Log File:  $LOG_FILE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

exit 0
