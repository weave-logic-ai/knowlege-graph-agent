#!/usr/bin/env bash
# Phase Summary Wrapper for SessionEnd Hook
# Works around the issue of Claude Code not being available during hook execution
# Creates a deferred task that runs after session ends

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../.."
DOCUMENTER_SCRIPT="${SCRIPT_DIR}/../documenter-agent.sh"
DEFERRED_DIR="${PROJECT_ROOT}/.bin/hooks/deferred"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Get phase info from environment
PHASE_NUM="${PHASE_NUM:-}"
PHASE_STATUS="${PHASE_STATUS:-complete}"

if [ -z "$PHASE_NUM" ]; then
    echo -e "${YELLOW}Warning: PHASE_NUM not set, skipping phase summary${NC}" >&2
    exit 0
fi

echo -e "${BLUE}=== Phase Summary Wrapper ===${NC}" >&2
echo "Phase: ${PHASE_NUM}" >&2
echo "Status: ${PHASE_STATUS}" >&2
echo >&2

# Create deferred tasks directory
mkdir -p "$DEFERRED_DIR"

# Create a marker file for manual completion
MARKER_FILE="${DEFERRED_DIR}/phase-${PHASE_NUM}-pending.sh"

cat > "$MARKER_FILE" << EOF
#!/usr/bin/env bash
# Deferred Phase Summary Generation
# Created: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# Phase: ${PHASE_NUM}
# Status: ${PHASE_STATUS}

# Run this script manually to generate the phase completion summary:
cd "${PROJECT_ROOT}"
bash "${DOCUMENTER_SCRIPT}" "${PHASE_NUM}" "${PHASE_STATUS}"
EOF

chmod +x "$MARKER_FILE"

echo -e "${YELLOW}⏸️  Phase summary generation deferred${NC}" >&2
echo >&2
echo -e "${BLUE}Claude Code cannot run during SessionEnd hook (process is terminating).${NC}" >&2
echo >&2
echo -e "${GREEN}To generate the comprehensive phase summary, run:${NC}" >&2
echo >&2
echo -e "  ${YELLOW}bash ${MARKER_FILE}${NC}" >&2
echo >&2
echo -e "${BLUE}Or directly:${NC}" >&2
echo -e "  ${YELLOW}bash ${DOCUMENTER_SCRIPT} ${PHASE_NUM} ${PHASE_STATUS}${NC}" >&2
echo >&2
echo -e "${GREEN}Note: Progress Tracker is already up-to-date from task completions!${NC}" >&2
echo -e "${GREEN}The phase summary adds executive summary, lessons learned, etc.${NC}" >&2
echo >&2

# Log the deferral
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Phase ${PHASE_NUM} summary deferred - run: bash ${MARKER_FILE}" >> "${SCRIPT_DIR}/debug.log"

exit 0
