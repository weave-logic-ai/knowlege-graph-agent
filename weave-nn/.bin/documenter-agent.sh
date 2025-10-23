#!/usr/bin/env bash
# Documenter Agent
# Analyzes task logs and uses Claude Code to generate comprehensive phase completion summaries

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
TASK_LOGS_DIR="${PROJECT_ROOT}/_log/tasks"
PHASES_DIR="${PROJECT_ROOT}/_planning/phases"
TEMP_DIR=$(mktemp -d)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Cleanup on exit
trap "rm -rf ${TEMP_DIR}" EXIT

# Usage
if [ $# -lt 1 ]; then
    echo "Usage: $0 <phase_number> [status]"
    echo
    echo "Examples:"
    echo "  $0 5 complete     # Phase 5 completed"
    echo "  $0 6 blocked      # Phase 6 blocked"
    echo "  $0 5 stopped      # Phase 5 stopped"
    echo
    echo "Status options: complete, stopped, blocked, deferred"
    exit 1
fi

PHASE_NUM="$1"
PHASE_STATUS="${2:-complete}"

echo -e "${BLUE}=== Documenter Agent ===${NC}"
echo "Phase: ${PHASE_NUM}"
echo "Status: ${PHASE_STATUS}"
echo

# Check for Claude Code
if ! command -v claude &> /dev/null; then
    echo -e "${RED}Error: Claude Code CLI not found${NC}"
    echo "Please install Claude Code: https://claude.com/claude-code"
    exit 1
fi

# Find phase document
PHASE_FILES=$(find "${PHASES_DIR}" -name "phase-${PHASE_NUM}-*.md" -type f)
PHASE_COUNT=$(echo "${PHASE_FILES}" | grep -c . || echo "0")

if [ "${PHASE_COUNT}" -eq 0 ]; then
    echo -e "${YELLOW}No phase document found for phase ${PHASE_NUM}${NC}"
    exit 1
elif [ "${PHASE_COUNT}" -gt 1 ]; then
    echo -e "${YELLOW}Multiple phase documents found for phase ${PHASE_NUM}:${NC}"
    echo "${PHASE_FILES}"
    echo "Please specify which one to update."
    exit 1
fi

PHASE_FILE=$(echo "${PHASE_FILES}" | head -1)
PHASE_NAME=$(basename "${PHASE_FILE}" .md)

echo "Phase document: ${PHASE_FILE}"
echo

# Find all task logs for this phase
echo "Searching for task logs for phase ${PHASE_NUM}..."
TASK_LOG_FILES=$(find "${TASK_LOGS_DIR}" -name "${PHASE_NUM}.*.md" -type f 2>/dev/null || echo "")

if [ -z "$TASK_LOG_FILES" ]; then
    echo -e "${YELLOW}No task logs found for phase ${PHASE_NUM}${NC}"
    echo "Task logs should be named: ${PHASE_NUM}.[day].[task].[subtask].[hash].md"
    echo
    echo "Creating basic completion summary without task logs..."
    TASK_COUNT=0
else
    TASK_COUNT=$(echo "${TASK_LOG_FILES}" | wc -l)
    echo "Found ${TASK_COUNT} task log(s)"
fi

echo

# Create aggregated context file for Claude
CONTEXT_FILE="${TEMP_DIR}/phase-${PHASE_NUM}-context.md"

cat > "${CONTEXT_FILE}" << EOF
# Phase ${PHASE_NUM} Documentation Context

## Phase Document
Path: ${PHASE_FILE}

## Task Logs Found: ${TASK_COUNT}

EOF

# Append each task log content
if [ -n "$TASK_LOG_FILES" ]; then
    while IFS= read -r task_file; do
        [ -z "$task_file" ] && continue

        echo "Reading task log: $(basename "$task_file")"

        cat >> "${CONTEXT_FILE}" << EOF

---

### Task Log: $(basename "$task_file")

File: ${task_file}
Relative Path: ../../_log/tasks/$(basename "$task_file")

\`\`\`markdown
$(cat "$task_file")
\`\`\`

EOF
    done <<< "$TASK_LOG_FILES"
fi

echo
echo -e "${GREEN}Context prepared for Claude Code${NC}"
echo "Context file: ${CONTEXT_FILE}"
echo "Size: $(wc -l < "${CONTEXT_FILE}") lines"
echo

# Create Claude Code prompt
PROMPT_FILE="${TEMP_DIR}/prompt.txt"

cat > "${PROMPT_FILE}" << 'EOF'
You are a technical documentation agent analyzing phase completion for the Weave-NN project.

**Your Task**: Generate a comprehensive "Phase Completion Summary" section to append to the phase document.

**Context Provided**:
1. Phase document path
2. All task logs for this phase (if any)
3. Phase status (complete/stopped/blocked/deferred)

**Requirements**:

1. **Analyze all task logs** and extract:
   - Task completion metrics (completed, partial, blocked, etc.)
   - Time spent (total duration, average per task)
   - Success rate and quality scores
   - Key accomplishments
   - Challenges encountered and solutions
   - Lessons learned
   - Technical decisions made

2. **Generate a markdown section** with:
   ```markdown
   ## 📊 Phase Completion Summary

   **Updated**: [timestamp]
   **Status**: [status]
   **Total Tasks**: [count]
   **Completed**: [count]/[total] ([percentage]%)
   **Success Rate**: [percentage]%
   **Total Duration**: [hours] hours ([minutes] minutes)

   ---

   ### Executive Summary

   [2-3 paragraph summary of what was accomplished in this phase, key wins, and overall outcomes]

   ---

   ### Task Completion Table

   | Task ID | Task Name | Status | Agent | Duration | Log | Summary |
   |---------|-----------|--------|-------|----------|-----|---------|
   [Generate rows from task logs with relative paths to logs]

   ---

   ### Key Accomplishments

   1. **[Accomplishment 1]**: [Description with metrics]
   2. **[Accomplishment 2]**: [Description with metrics]
   3. **[Accomplishment 3]**: [Description with metrics]

   ---

   ### Challenges & Solutions

   #### Challenge 1: [Title]
   - **Problem**: [Description]
   - **Impact**: [How it affected the phase]
   - **Solution**: [How it was resolved]
   - **Time Impact**: [Time lost/gained]

   [Repeat for each major challenge]

   ---

   ### Technical Decisions Made

   - **Decision 1**: [What was decided and why]
     - Related: [[decision-node-if-exists]]
   - **Decision 2**: [What was decided and why]

   ---

   ### Lessons Learned

   #### What Went Well
   1. [Success 1]
   2. [Success 2]
   3. [Success 3]

   #### What Could Be Improved
   1. [Improvement 1]
   2. [Improvement 2]

   #### Reusable Patterns
   1. **[Pattern Name]**: [Description and when to use]
   2. **[Pattern Name]**: [Description and when to use]

   ---

   ### Code Metrics

   | Metric | Value |
   |--------|-------|
   | **Files Modified** | [total] |
   | **Lines Added** | +[total] |
   | **Lines Removed** | -[total] |
   | **Net Lines** | [total] |
   | **Tests Added** | [total] |
   | **Test Coverage** | [percentage]% |

   ---

   ### Cross-References

   **Related Concepts**: [List any [[concept-nodes]] referenced in tasks]
   **Related Features**: [List any [[feature-nodes]] referenced in tasks]
   **Related Decisions**: [List any [[decision-nodes]] referenced in tasks]

   ---

   ### Next Steps

   Based on this phase completion:

   **Immediate Follow-ups**:
   - [ ] [Action 1]
   - [ ] [Action 2]

   **Future Enhancements**:
   - [ ] [Enhancement 1]
   - [ ] [Enhancement 2]

   **Technical Debt**:
   - [ ] [Debt 1]: [When to address]
   - [ ] [Debt 2]: [When to address]

   ---

   **Summary Generated By**: Documenter Agent (Claude Code)
   **Generation Time**: [timestamp]
   **Source**: Task logs from `_log/tasks/[phase].*.md`
   ```

3. **Important**:
   - Use relative paths for task log links: `../../_log/tasks/[filename].md`
   - Extract actual data from task logs (don't use placeholders)
   - Include status emojis: ✅ completed, ⚠️ partial, 🚫 blocked, ⏭️ deferred, ⏸️ paused, ❌ cancelled
   - Be comprehensive but concise
   - Focus on insights, not just data regurgitation
   - Link to related vault nodes when tasks mention them

4. **Output**:
   - Return ONLY the markdown section (starting with `## 📊 Phase Completion Summary`)
   - Do NOT include the phase document itself
   - Do NOT include any preamble or explanation
   - Just the section content, ready to append

**Context follows below**:
---
EOF

# Append the context
cat "${CONTEXT_FILE}" >> "${PROMPT_FILE}"

echo -e "${BLUE}Invoking Claude Code to generate phase summary...${NC}"
echo

# Call Claude Code with the prompt
OUTPUT_FILE="${TEMP_DIR}/phase-summary.md"

if claude --print < "${PROMPT_FILE}" > "${OUTPUT_FILE}" 2>&1; then
    echo -e "${GREEN}✓ Claude Code generated phase summary${NC}"
else
    echo -e "${RED}✗ Claude Code failed to generate summary${NC}"
    echo "Check output: ${OUTPUT_FILE}"
    exit 1
fi

echo

# Validate output
if [ ! -s "${OUTPUT_FILE}" ]; then
    echo -e "${RED}Error: Empty output from Claude Code${NC}"
    exit 1
fi

# Extract just the summary section (in case Claude added extra text)
SUMMARY_SECTION=$(awk '/^## 📊 Phase Completion Summary/,0' "${OUTPUT_FILE}")

if [ -z "$SUMMARY_SECTION" ]; then
    echo -e "${YELLOW}Warning: Could not find summary section marker${NC}"
    echo "Using full output..."
    SUMMARY_SECTION=$(cat "${OUTPUT_FILE}")
fi

# Update phase document
if grep -q "^## 📊 Phase Completion Summary" "${PHASE_FILE}"; then
    echo "Updating existing completion summary in phase document..."

    # Remove old summary section and append new one
    awk '/^## 📊 Phase Completion Summary/,/^## / {
        if (/^## / && !/^## 📊 Phase Completion Summary/) {
            print
        }
        next
    } 1' "${PHASE_FILE}" > "${PHASE_FILE}.tmp"

    echo "" >> "${PHASE_FILE}.tmp"
    echo "${SUMMARY_SECTION}" >> "${PHASE_FILE}.tmp"
    mv "${PHASE_FILE}.tmp" "${PHASE_FILE}"
else
    echo "Adding new completion summary to phase document..."
    echo "" >> "${PHASE_FILE}"
    echo "${SUMMARY_SECTION}" >> "${PHASE_FILE}"
fi

# Update frontmatter
if grep -q "^status:" "${PHASE_FILE}"; then
    sed -i "s/^status:.*/status: ${PHASE_STATUS}/" "${PHASE_FILE}"
else
    sed -i "/^type:/a status: ${PHASE_STATUS}" "${PHASE_FILE}"
fi

# Add completion date if completed
if [ "${PHASE_STATUS}" = "complete" ] || [ "${PHASE_STATUS}" = "completed" ]; then
    COMPLETION_DATE=$(date +"%Y-%m-%d")
    if ! grep -q "^completed_date:" "${PHASE_FILE}"; then
        sed -i "/^status:/a completed_date: ${COMPLETION_DATE}" "${PHASE_FILE}"
    else
        sed -i "s/^completed_date:.*/completed_date: ${COMPLETION_DATE}/" "${PHASE_FILE}"
    fi
fi

echo
echo -e "${GREEN}✓ Phase document updated: ${PHASE_FILE}${NC}"
echo
echo "Summary:"
echo "  Tasks analyzed: ${TASK_COUNT}"
echo "  Phase status: ${PHASE_STATUS}"
echo "  Summary generated by: Claude Code"
echo
echo "Review the updated phase document to verify the summary."
